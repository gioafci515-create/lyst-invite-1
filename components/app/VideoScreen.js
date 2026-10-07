'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import AppShell, { GuestCard } from './AppShell';
import useRecorder, { clock } from './useRecorder';
import { uploadMoment, useApi, useGuest } from '../../lib/client';

const MAX = 60;

export default function VideoScreen() {
  const { guest } = useGuest();
  const rec = useRecorder({ video: true, maxSeconds: MAX });
  const [data, reload] = useApi(guest ? `/api/moments?kind=video&guest=${encodeURIComponent(guest)}` : '/api/moments?kind=video');
  const [event] = useApi('/api/event');
  const [mode, setMode] = useState('record');
  const [picked, setPicked] = useState(null); // uploaded existing { file, url }
  const [state, setState] = useState({ phase: 'idle', error: '' });
  const liveRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { if (liveRef.current) liveRef.current.srcObject = rec.stream; }, [rec.stream, rec.status]);
  useEffect(() => () => picked && URL.revokeObjectURL(picked.url), [picked]);

  const closed = event && !event.submissionsOpen;
  const submitted = state.phase === 'sent';
  const already = !submitted && (data?.mine.video ?? 0) > 0;
  const clip = mode === 'upload' ? picked && { blob: picked.file, url: picked.url, mime: picked.file.type } : rec.result;
  const recording = rec.status === 'recording' || rec.status === 'paused';

  const submit = async () => {
    if (!guest) return setState({ phase: 'idle', error: 'Please enter your name first.' });
    if (!clip) return setState({ phase: 'idle', error: 'Record or choose a clip first.' });
    setState({ phase: 'sending', error: '' });
    try {
      const ext = clip.mime.includes('mp4') ? 'mp4' : clip.mime.includes('quicktime') ? 'mov' : 'webm';
      const file = clip.blob instanceof File ? clip.blob : new File([clip.blob], `clip.${ext}`, { type: clip.mime });
      await uploadMoment({ file, kind: 'video', guest });
      rec.discard();
      setPicked(null);
      reload();
      setState({ phase: 'sent', error: '' });
    } catch (e) {
      setState({ phase: 'idle', error: e.message });
    }
  };

  const reset = () => { rec.discard(); setPicked(null); setState({ phase: 'idle', error: '' }); };

  const cta = clip
    ? { label: state.phase === 'sending' ? 'Sending…' : 'Add to montage', onClick: submit, disabled: state.phase === 'sending' || closed }
    : mode === 'record'
      ? recording ? { label: 'Stop recording', onClick: rec.stop } : { label: 'Start recording', onClick: rec.start, disabled: closed }
      : { label: 'Choose a clip', onClick: () => fileRef.current?.click(), disabled: closed };

  return (
    <AppShell title="Video Messages" actions={{ src: '/assets/app/actions-video.svg' }} active="participate" cta={cta}>
      <GuestCard />
      <div className="ev-row">
        <button type="button" className={`ev-chip ev-chip--lg${mode === 'record' ? ' ev-chip--dark' : ''}`} onClick={() => { setMode('record'); setPicked(null); }}>Record video</button>
        <button type="button" className={`ev-chip ev-chip--lg${mode === 'upload' ? ' ev-chip--dark' : ''}`} onClick={() => { setMode('upload'); rec.cancel(); fileRef.current?.click(); }}>Upload existing</button>
        <input ref={fileRef} type="file" accept="video/*" hidden onChange={(e) => { const f = e.target.files[0]; if (f) setPicked({ file: f, url: URL.createObjectURL(f) }); e.target.value = ''; }} />
      </div>

      <div className="ev-stage">
        {clip ? (
          <video src={clip.url} className="ev-stage__media" controls playsInline />
        ) : recording ? (
          <video ref={liveRef} className="ev-stage__media" autoPlay playsInline muted />
        ) : (
          <img src="/assets/app/video-preview.png" alt="" className="ev-stage__media" />
        )}
        <span className="ev-tag ev-tag--accent">
          {clip ? 'PREVIEW' : recording ? (rec.status === 'paused' ? 'PAUSED' : 'RECORDING') : 'READY'} · {clock(clip ? rec.seconds : rec.seconds)} / {clock(MAX)}
        </span>
        {!clip && !recording && mode === 'record' && !closed && (
          <button type="button" className="ev-stage__play" onClick={rec.start} aria-label="Start recording"><img src="/assets/app/video-play.svg" alt="" width="58" height="58" /></button>
        )}
      </div>

      {rec.status === 'denied' && <p className="ev-error" role="alert">Camera or microphone access was blocked. Allow it in your browser’s site settings, then try again.</p>}
      {rec.status === 'unsupported' && <p className="ev-error" role="alert">This browser can’t record video. Use “Upload existing” instead.</p>}

      {recording && (
        <div className="ev-row">
          <button type="button" className="ev-btn ev-btn--light" onClick={rec.pause}>{rec.status === 'paused' ? 'Resume' : 'Pause'}</button>
          <button type="button" className="ev-btn ev-btn--light" onClick={rec.cancel}>Cancel</button>
        </div>
      )}

      {clip && (
        <div className="ev-row">
          <button type="button" className="ev-btn ev-btn--light" onClick={reset}><img src="/assets/app/refresh-cw.svg" alt="" width="16" height="16" /> Re-record</button>
          <button type="button" className="ev-btn ev-btn--accent" onClick={submit} disabled={state.phase === 'sending' || closed}><img src="/assets/app/send.svg" alt="" width="16" height="16" /> Submit clip</button>
        </div>
      )}

      {state.error && <p className="ev-error" role="alert">{state.error}</p>}

      <div className="ev-card">
        <div className="ev-between"><span className="ev-serif">Future montage</span><span className="ev-chip ev-chip--icon"><img src="/assets/app/film-dot.svg" alt="" width="6" height="6" />{data?.counts.video ?? 0} films</span></div>
        {submitted && <p className="ev-inline ev-muted" role="status"><img src="/assets/app/check-dark.svg" alt="" width="16" height="16" />Submitted · Your clip is queued for the one-year film.</p>}
      </div>

      {(submitted || already) && (
        <div className="ev-card">
          <p className="ev-caption">Edit</p>
          <p className="ev-muted">Not happy with it? Record a new clip — host can remove the earlier one before the capsule closes.</p>
          <button type="button" className="ev-btn ev-btn--dark ev-btn--sm" onClick={() => { reset(); setMode('record'); }}>Edit clip</button>
        </div>
      )}

      {already && (
        <div className="ev-card">
          <p className="ev-caption ev-caption--lg">Already submitted</p>
          <p className="ev-muted">This clip has already been submitted to the memory montage.</p>
          <Link href="/event/gallery" className="ev-btn ev-btn--light ev-btn--sm">Return to gallery</Link>
        </div>
      )}

      {closed && (
        <div className="ev-card">
          <p className="ev-caption">Closed state</p>
          <p className="ev-muted">Submissions are now closed for this event.</p>
          <Link href="/event" className="ev-btn ev-btn--light ev-btn--sm">Back to hub</Link>
        </div>
      )}
    </AppShell>
  );
}
