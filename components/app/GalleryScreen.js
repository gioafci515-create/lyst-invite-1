'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppShell, { GuestCard } from './AppShell';
import { mediaUrl, storage, uploadMoment, useApi, useGuest } from '../../lib/client';

const SEEN_KEY = 'lyst_gallery_seen';

export default function GalleryScreen() {
  const { guest } = useGuest();
  const [data, reload] = useApi('/api/moments', { every: 15000 });
  const [filter, setFilter] = useState('all');
  const [viewer, setViewer] = useState(-1);
  const [uploading, setUploading] = useState(0);
  const [failed, setFailed] = useState([]);
  const [error, setError] = useState('');
  const [seenAt, setSeenAt] = useState(0);
  const fileRef = useRef(null);

  useEffect(() => {
    setSeenAt(Number(storage.read(SEEN_KEY)) || 0);
    return () => storage.write(SEEN_KEY, String(Date.now()));
  }, []);

  const media = (data?.items ?? []).filter((m) => m.kind !== 'voice');
  const photos = media.filter((m) => m.kind === 'photo');
  const videos = media.filter((m) => m.kind === 'video');
  const shown = filter === 'photo' ? photos : filter === 'video' ? videos : media;
  const fresh = media.filter((m) => new Date(m.createdAt).getTime() > seenAt && m.guest !== guest).length;

  const send = useCallback(async (file) => {
    const kind = file.type.startsWith('video/') ? 'video' : 'photo';
    setUploading((n) => n + 1);
    try {
      await uploadMoment({ file, kind, guest });
      reload();
    } catch (e) {
      setFailed((f) => [...f, file]);
      setError(e.message);
    } finally {
      setUploading((n) => n - 1);
    }
  }, [guest, reload]);

  const onPick = async (e) => {
    if (!guest) return setError('Please enter your name first.');
    setError('');
    for (const f of e.target.files) await send(f);
    e.target.value = '';
  };

  const retry = async () => {
    const queue = failed;
    setFailed([]);
    setError('');
    for (const f of queue) await send(f);
  };

  useEffect(() => {
    if (viewer < 0) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setViewer(-1);
      if (e.key === 'ArrowRight') setViewer((i) => (i + 1) % shown.length);
      if (e.key === 'ArrowLeft') setViewer((i) => (i - 1 + shown.length) % shown.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewer, shown.length]);

  const filters = [['all', 'All', media.length], ['photo', 'Photos', photos.length], ['video', 'Video', videos.length]];
  const current = viewer >= 0 ? shown[viewer] : null;

  return (
    <AppShell
      title="Guest Gallery"
      actions={{ src: '/assets/app/actions-gallery.svg' }}
      active="participate"
      cta={{ label: 'Upload moment', onClick: () => fileRef.current?.click() }}
    >
      <GuestCard />
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple hidden onChange={onPick} />

      <div className="ev-row ev-row--wrap" role="tablist" aria-label="Filter gallery">
        {filters.map(([key, label, n]) => (
          <button key={key} type="button" role="tab" aria-selected={filter === key} className={`ev-chip ev-chip--lg${filter === key ? ' ev-chip--dark' : ''}`} onClick={() => setFilter(key)}>{label} · {n}</button>
        ))}
      </div>

      {shown.length ? (
        <ul className="ev-grid">
          {shown.slice(0, 30).map((m, i) => (
            <li key={m.id}>
              <button type="button" className="ev-tile" onClick={() => setViewer(i)} aria-label={`Open ${m.kind} ${i + 1}`}>
                {m.kind === 'photo'
                  ? <img src={mediaUrl(m.id)} alt="" loading="lazy" />
                  : <video src={`${mediaUrl(m.id)}#t=0.1`} preload="metadata" muted playsInline />}
                {m.kind === 'video' && <span className="ev-tile__badge">▶</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ev-card ev-muted">{data ? 'No moments yet. Be the first to add one.' : 'Loading…'}</p>
      )}

      {failed.length > 0 && (
        <div className="ev-card" role="alert">
          <p className="ev-caption ev-caption--lg">Upload failed · {failed.length} file{failed.length > 1 ? 's' : ''}</p>
          <p className="ev-muted">{error || 'Retry now or continue later.'}</p>
          <button type="button" className="ev-btn ev-btn--light" onClick={retry}>Retry upload</button>
        </div>
      )}
      {!failed.length && error && <p className="ev-error" role="alert">{error}</p>}

      <div className="ev-row">
        <button type="button" className="ev-btn ev-btn--accent" onClick={() => fileRef.current?.click()}><img src="/assets/app/upload-sm.svg" alt="" width="16" height="16" /> Add to gallery</button>
        <button type="button" className="ev-btn ev-btn--light" onClick={() => shown.length && setViewer(0)} disabled={!shown.length}>Open viewer</button>
      </div>

      <p className="ev-muted">{fresh} new · {uploading} processing · private hidden until reveal</p>

      {current && (
        <div className="ev-viewer" role="dialog" aria-modal="true" aria-label="Media viewer">
          <button type="button" className="ev-viewer__close" onClick={() => setViewer(-1)} aria-label="Close viewer">✕</button>
          {current.kind === 'photo' ? <img src={mediaUrl(current.id)} alt="" /> : <video key={current.id} src={mediaUrl(current.id)} controls autoPlay playsInline />}
          <div className="ev-viewer__nav">
            <button type="button" onClick={() => setViewer((i) => (i - 1 + shown.length) % shown.length)} aria-label="Previous">←</button>
            <span>{viewer + 1} / {shown.length}</span>
            <button type="button" onClick={() => setViewer((i) => (i + 1) % shown.length)} aria-label="Next">→</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
