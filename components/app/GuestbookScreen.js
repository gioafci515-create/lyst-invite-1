'use client';

import { useEffect, useRef, useState } from 'react';
import AppShell, { GuestCard } from './AppShell';
import useRecorder, { clock } from './useRecorder';
import { uploadMoment, useApi, useGuest } from '../../lib/client';

const PROMPT = '“For the next twenty-five years…”';

export default function GuestbookScreen() {
  const { guest } = useGuest();
  const rec = useRecorder({ video: false, maxSeconds: 180 });
  const [data, reload] = useApi('/api/moments?kind=voice');
  const [state, setState] = useState({ phase: 'idle', error: '' });
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => { setPlaying(false); setProgress(0); }, [rec.result]);

  const total = data?.counts.voice ?? 0;
  const recording = rec.status === 'recording' || rec.status === 'paused';
  const recorded = rec.status === 'recorded';

  const send = async () => {
    if (!guest) return setState({ phase: 'idle', error: 'Please enter your name first.' });
    setState({ phase: 'sending', error: '' });
    try {
      const ext = rec.result.mime.includes('mp4') ? 'm4a' : 'webm';
      await uploadMoment({ file: new File([rec.result.blob], `voice.${ext}`, { type: rec.result.mime }), kind: 'voice', guest });
      rec.discard();
      reload();
      setState({ phase: 'sent', error: '' });
    } catch (e) {
      setState({ phase: 'idle', error: e.message });
    }
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play(); else a.pause();
  };

  const cta = recorded
    ? { label: state.phase === 'sending' ? 'Sending…' : 'Submit memory', onClick: send, disabled: state.phase === 'sending' }
    : recording
      ? { label: 'Stop recording', onClick: rec.stop }
      : { label: 'Start recording', onClick: rec.start, disabled: rec.status === 'unsupported' };

  return (
    <AppShell title="Voice Guestbook" actions={{ src: '/assets/app/actions-guestbook.svg' }} active="participate" cta={cta}>
      <GuestCard />

      <div className="ev-between ev-min44">
        <span className={`ev-chip ev-chip--accent ev-chip--icon${recording ? ' is-live' : ''}`}>
          <img src="/assets/app/record.svg" alt="" width="10" height="10" />
          {rec.status === 'paused' ? 'Paused' : recording ? 'Recording' : recorded ? 'Recorded' : 'Ready'}
        </span>
        <span className="ev-mono ev-mono--lg" aria-live="off">{clock(rec.seconds)}</span>
      </div>

      <div className="ev-card ev-card--roomy">
        <p className="ev-serif ev-serif--lg">{PROMPT}</p>
        <img src="/assets/app/waveform.svg" alt="" width="94" height="28" className={recording && rec.status !== 'paused' ? 'ev-pulse' : undefined} />
        {recording && (
          <div className="ev-chips">
            <button type="button" className="ev-chip" onClick={rec.pause}>{rec.status === 'paused' ? 'Resume' : 'Pause'}</button>
            <button type="button" className="ev-chip ev-chip--dark ev-chip--icon" onClick={rec.stop}><img src="/assets/app/stop.svg" alt="" width="12" height="12" /> Stop</button>
            <button type="button" className="ev-chip" onClick={rec.cancel}>Cancel</button>
          </div>
        )}
      </div>

      {rec.status === 'denied' && <p className="ev-error" role="alert">Microphone access was blocked. Allow it in your browser’s site settings, then try again.</p>}
      {rec.status === 'unsupported' && <p className="ev-error" role="alert">This browser can’t record audio.</p>}

      {recorded && (
        <>
          <div className="ev-card">
            <div className="ev-inline">
              <button type="button" className="ev-play" onClick={togglePlay} aria-label={playing ? 'Pause playback' : 'Play recording'}>
                {playing ? <span className="ev-play__pause" /> : <img src="/assets/app/play.svg" alt="" width="44" height="44" />}
              </button>
              <div className="ev-scrub" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${progress * 100}%` }} /></div>
              <span className="ev-mono">{clock(rec.seconds)}</span>
            </div>
            <audio ref={audioRef} src={rec.result.url} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setProgress(0); }}
              onTimeUpdate={(e) => setProgress(e.target.duration ? e.target.currentTime / e.target.duration : 0)} />
          </div>
          <div className="ev-row">
            <button type="button" className="ev-btn ev-btn--light" onClick={() => { rec.discard(); setState({ phase: 'idle', error: '' }); }}>
              <img src="/assets/app/refresh-cw.svg" alt="" width="16" height="16" /> Re-record
            </button>
            <button type="button" className="ev-btn ev-btn--accent" onClick={send} disabled={state.phase === 'sending'}>
              <img src="/assets/app/send.svg" alt="" width="16" height="16" /> Send recording
            </button>
          </div>
        </>
      )}

      {state.error && <p className="ev-error" role="alert">{state.error}</p>}

      {(state.phase === 'sent' || total > 0) && (
        <div className="ev-card ev-card--accent" role="status">
          <span className="ev-inline"><img src="/assets/app/check.svg" alt="" width="16" height="16" />
            <strong>{state.phase === 'sent' ? 'Voice memory submitted' : 'Voice memories'} · {total} recording{total === 1 ? '' : 's'}</strong>
          </span>
        </div>
      )}
    </AppShell>
  );
}
