'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppShell, { GuestCard } from './AppShell';
import { mediaUrl, uploadMoment, useApi, useGuest } from '../../lib/client';

export default function CameraScreen() {
  const { guest } = useGuest();
  const [data, reload] = useApi(guest ? `/api/moments?kind=photo&guest=${encodeURIComponent(guest)}` : '/api/moments?kind=photo');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const [facing, setFacing] = useState('environment');
  const [camera, setCamera] = useState('off'); // off | live | denied | unsupported
  const [pending, setPending] = useState(null); // { blob, url } captured, not yet in the roll
  const [uploading, setUploading] = useState(0);
  const [failed, setFailed] = useState([]); // [{ file, source }]
  const [error, setError] = useState('');
  const [reveal, setReveal] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async (mode) => {
    stop();
    if (!navigator.mediaDevices?.getUserMedia) return setCamera('unsupported');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamera('live');
    } catch {
      setCamera('denied');
    }
  }, [stop]);

  // The camera only opens when asked (this screen shares a page with many others) and always closes on exit.
  useEffect(() => stop, [stop]);

  const flip = () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    if (camera === 'live') start(next);
  };

  // The <video> element is remounted when a frame is captured/discarded, so re-attach the stream.
  useEffect(() => {
    if (camera === 'live' && !pending && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [camera, pending]);

  useEffect(() => () => pending && URL.revokeObjectURL(pending.url), [pending]);

  const used = data?.mine.roll ?? 0;
  const size = data?.mine.rollSize ?? 24;
  const remaining = Math.max(0, size - used - (pending ? 1 : 0));
  const myPhotos = (data?.items ?? []).filter((m) => m.guest === guest && m.kind === 'photo');

  const send = async (file, source) => {
    setUploading((n) => n + 1);
    setError('');
    try {
      await uploadMoment({ file, kind: 'photo', guest, source });
      reload();
    } catch (e) {
      setFailed((f) => [...f, { file, source }]);
      setError(e.message);
    } finally {
      setUploading((n) => n - 1);
    }
  };

  const capture = () =>
    new Promise((resolve) => {
      const v = videoRef.current;
      if (!v || !v.videoWidth) return resolve(null);
      const c = document.createElement('canvas');
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext('2d').drawImage(v, 0, 0);
      c.toBlob((blob) => resolve(blob ? { blob, url: URL.createObjectURL(blob) } : null), 'image/jpeg', 0.9);
    });

  const takePhoto = async () => {
    if (camera !== 'live') return start(facing);
    if (!guest) return setError('Please enter your name first.');
    if (remaining <= 0) return setError('Your disposable roll is full.');
    const shot = await capture();
    if (!shot) return setError('The camera is not ready yet.');
    setPending(shot);
  };

  const commit = async () => {
    if (camera !== 'live' && !pending) return start(facing);
    if (!guest) return setError('Please enter your name first.');
    let shot = pending;
    if (!shot) {
      if (remaining <= 0) return setError('Your disposable roll is full.');
      shot = await capture();
      if (!shot) return setError('The camera is not ready yet.');
    }
    setPending(null);
    await send(new File([shot.blob], 'moment.jpg', { type: 'image/jpeg' }), 'camera');
  };

  const retry = async () => {
    const queue = failed;
    setFailed([]);
    for (const f of queue) await send(f.file, f.source);
  };

  const onPick = async (e) => {
    if (!guest) return setError('Please enter your name first.');
    for (const f of e.target.files) await send(f, 'upload');
    e.target.value = '';
  };

  const pct = Math.round((used / size) * 100);

  return (
    <AppShell
      title="Event Camera"
      actions={{ src: '/assets/app/actions-camera.svg', w: 61 }}
      active="participate"
      tone="dark"
      cta={{ label: camera === 'live' || pending ? 'Capture moment' : 'Open camera', onClick: commit, disabled: camera === 'unsupported' && !pending }}
    >
      <GuestCard />
      <div className="ev-between">
        <span className="ev-chip ev-chip--accent ev-chip--lg">Disposable mode</span>
        <span className="ev-serif">{used + (pending ? 1 : 0)} / {size}</span>
      </div>

      <div className="ev-viewfinder">
        {pending ? (
          <img src={pending.url} alt="Captured frame, not yet added to your roll" className="ev-viewfinder__media" />
        ) : camera === 'live' ? (
          <video ref={videoRef} className="ev-viewfinder__media" autoPlay playsInline muted />
        ) : (
          <img src="/assets/app/camera-view.png" alt="" className="ev-viewfinder__media" />
        )}
        <span className="ev-tag">{pending ? 'REVIEW · NOT YET IN ROLL' : 'LIVE VIEW · FLASH AUTO'}</span>
        <div className="ev-viewfinder__controls">
          <button type="button" className="ev-icon" onClick={() => fileRef.current?.click()} aria-label="Choose from library"><img src="/assets/app/image-up.svg" alt="" width="24" height="24" /></button>
          <button type="button" className="ev-shutter" onClick={takePhoto} aria-label={camera === 'live' ? 'Take photo' : 'Open camera'} disabled={camera === 'unsupported'}><img src="/assets/app/shutter.svg" alt="" width="68" height="68" /></button>
          <button type="button" className="ev-icon" onClick={flip} aria-label="Flip camera"><img src="/assets/app/refresh-cw.svg" alt="" width="24" height="24" /></button>
        </div>
      </div>

      <div className="ev-row">
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
        <button type="button" className="ev-btn ev-btn--light ev-grow-2" onClick={() => fileRef.current?.click()}>
          <img src="/assets/app/upload.svg" alt="" width="44" height="44" className="ev-btn__icon" /> Upload existing
        </button>
        <button type="button" className="ev-btn ev-btn--accent ev-grow-3" onClick={takePhoto} disabled={camera === 'unsupported'}>
          <img src="/assets/app/camera.svg" alt="" width="44" height="44" className="ev-btn__icon" /> {camera === 'live' ? 'Take photo' : 'Open camera'}
        </button>
      </div>

      <div className="ev-card ev-card--paper">
        <div className="ev-between"><span>{data?.counts.photo ?? 0} moments{uploading ? ` · ${uploading} uploading` : ''}</span><span className="ev-olive">{pct}%</span></div>
        <div className="ev-progress" style={{ '--p': `${pct}%` }} />
        <div className="ev-chips">
          <span className="ev-chip ev-chip--dark">🔒 Locked now</span>
          <button type="button" className="ev-chip" aria-pressed={reveal} onClick={() => setReveal((r) => !r)}>Reveal preview</button>
        </div>
        {reveal && (myPhotos.length ? (
          <div className="ev-thumbs">{myPhotos.slice(0, 6).map((m) => <img key={m.id} src={mediaUrl(m.id)} alt="Your moment" />)}</div>
        ) : <p className="ev-muted">Nothing in your roll yet.</p>)}
        <p className="ev-muted">Complete disposable roll opens after the event.</p>
      </div>

      {pending && (
        <div className="ev-card">
          <p className="ev-caption">Camera retake</p>
          <p className="ev-muted">Retake the current frame before it is added to the roll.</p>
          <button type="button" className="ev-btn ev-btn--dark ev-btn--sm" onClick={() => setPending(null)}>Retake photo</button>
        </div>
      )}

      {failed.length > 0 && (
        <div className="ev-card" role="alert">
          <p className="ev-caption ev-caption--lg">Failed upload</p>
          <p className="ev-muted">{failed.length} file{failed.length > 1 ? 's' : ''} could not upload. Retry now or continue later.</p>
          <button type="button" className="ev-btn ev-btn--light ev-btn--sm" onClick={retry}>Retry upload</button>
        </div>
      )}

      {(camera === 'denied' || camera === 'unsupported') && (
        <div className="ev-card">
          <p className="ev-caption">Camera / microphone permission</p>
          <p className="ev-muted">
            {camera === 'denied'
              ? 'Allow camera and microphone access to capture live moments. Use your browser’s site settings, then reload.'
              : 'This browser can’t open the camera. You can still upload existing photos.'}
          </p>
          <button type="button" className="ev-btn ev-btn--accent ev-btn--sm" onClick={() => start(facing)}>Open settings</button>
        </div>
      )}

      <div className="ev-card">
        <p className="ev-caption">Photo counter</p>
        <p className="ev-muted">{remaining} / {size} exposures remaining in this disposable roll.</p>
      </div>

      {error && <p className="ev-error" role="alert">{error}</p>}
    </AppShell>
  );
}
