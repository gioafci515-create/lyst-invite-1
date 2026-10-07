'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from './AppShell';
import { countdown, formatDate, mediaUrl, pad, useApi, useNow } from '../../lib/client';

const plural = (n = 0, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default function CapsuleScreen() {
  const [event] = useApi('/api/event', { every: 30000 });
  const [videos] = useApi('/api/moments?kind=video');
  const now = useNow(30000);
  const [revealed, setRevealed] = useState(false);
  const [film, setFilm] = useState(-1);
  const [toast, setToast] = useState('');

  const c = event?.counts;
  const open = !!event?.capsuleOpen;
  const unlockMs = event ? new Date(event.capsuleUnlockAt).getTime() : 0;
  const cd = countdown(unlockMs, now);
  const clips = videos?.items ?? [];

  const say = (msg) => { setToast(msg); };
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }, [toast]);

  const seal = () => (open ? setRevealed(true) : say(`Sealed until ${formatDate(event?.capsuleUnlockAt ?? now)}. Everything placed here opens together.`));

  const share = async () => {
    const url = `${window.location.origin}/event/capsule`;
    try {
      if (navigator.share) await navigator.share({ title: 'OBJECT 07: AER — Time Capsule', url });
      else { await navigator.clipboard.writeText(url); say('Capsule link copied.'); }
    } catch {}
  };

  const stats = [['photos', c?.photo], ['video', c?.video], ['voice', c?.voice], ['letters', c?.letters]];

  return (
    <AppShell title="Digital Time Capsule" actions={{ src: '/assets/app/actions-capsule.svg' }} active="remember" tone="black" cta={{ label: open ? 'Reveal capsule' : 'Seal capsule', onClick: seal }}>
      <div className="ev-hero ev-hero--accent">
        <p className="ev-kicker">OBJECT 07: AER · 01 OCT 2026</p>
        <h2 className="ev-display">Build a future room from this one.</h2>
        <p className="ev-muted">Everything placed here opens together in one year. The archive belongs to the room.</p>
      </div>

      <dl className="ev-stats">
        {stats.map(([label, n], i) => (
          <div key={label} className={`ev-stat${i === 3 ? ' ev-stat--accent' : ''}`}>
            <dd>{n ?? '–'}</dd>
            <dt>{label[0].toUpperCase() + label.slice(1)}</dt>
          </div>
        ))}
      </dl>

      <div className="ev-card ev-field-card"><span className="ev-label ev-label--sm">Capsule name</span><span className="ev-small">{event?.capsuleName ?? '…'}</span></div>
      <div className="ev-card ev-field-card">
        <span className="ev-label ev-label--sm">Unlock date</span>
        <div className="ev-between"><span className="ev-small">{event ? formatDate(event.capsuleUnlockAt) : '…'}</span><span className="ev-olive ev-small">{open ? 'Open' : cd.d >= 365 ? '1 year' : `${cd.d} days`}</span></div>
      </div>

      <div className="ev-hero ev-hero--accent">
        <div className="ev-between"><p className="ev-kicker">{open ? 'ARCHIVE OPEN' : 'LOCKED ARCHIVE'}</p><img src="/assets/app/archive.svg" alt="" width="18" height="18" /></div>
        <p className="ev-display ev-display--xl">{open ? 'Open' : `${cd.d}d`}</p>
        <p className="ev-muted">{open ? 'The wait is over.' : `${pad(cd.h)} hours · ${pad(cd.m)} minutes`}</p>
        <p className="ev-muted">Film · voices · letters · poll results · host answers</p>
      </div>

      <div className="ev-card ev-card--ink">
        <p className="ev-inline ev-upper ev-small ev-muted-2"><img src="/assets/app/check-dark.svg" alt="" width="16" height="16" />Reveal preview</p>
        <p className="ev-serif ev-serif--md ev-muted-2">{open ? 'The archive is ready to open.' : 'The archive is sealed.'}</p>
        <button type="button" className="ev-btn ev-btn--light" onClick={() => (open ? setRevealed(true) : say('Still sealed — nothing can be opened early.'))} disabled={!open}>
          <img src="/assets/app/unlock.svg" alt="" width="16" height="16" /> Reveal capsule
        </button>
      </div>

      {revealed && open && (
        <div className="ev-card" role="status">
          <p className="ev-caption">Inside the capsule</p>
          <p className="ev-muted">{plural(c?.photo, 'photo')} · {plural(c?.video, 'film')} · {plural(c?.voice, 'voice memory', 'voice memories')} · {plural(c?.letters, 'letter')} · {plural(c?.answers, 'answer')}.</p>
        </div>
      )}

      <div className="ev-card">
        <p className="ev-caption">Contributors</p>
        <p className="ev-muted">{plural(c?.guests, 'guest')} · {plural(c?.video, 'video contributor')} · {plural(c?.voice, 'voice memory', 'voice memories')} · {plural(c?.letters, 'letter')} · {plural(c?.answers, 'answer')}.</p>
      </div>

      <div className="ev-card">
        <p className="ev-caption">Memory montage</p>
        <p className="ev-muted">{open ? 'Ready' : 'Collecting'} · {plural(c?.video, 'film')} · {plural(c?.voice, 'voice')} · {plural(c?.letters, 'letter')} · {plural(c?.answers, 'answer')}.</p>
        <Link href="/event" className="ev-btn ev-btn--light ev-btn--sm">Return to hub</Link>
      </div>

      <div className="ev-card">
        <p className="ev-caption ev-caption--lg">Ready / watch / replay</p>
        <p className="ev-muted">{open ? 'The one-year film is ready. Watch now, replay later, or share with the room.' : 'The one-year film unlocks with the capsule.'}</p>
        <div className="ev-row">
          <button type="button" className="ev-btn ev-btn--accent ev-btn--sm" onClick={() => (clips.length ? setFilm(0) : say('No films yet.'))} disabled={!open}>Watch film</button>
          <button type="button" className="ev-btn ev-btn--light" onClick={() => (clips.length ? setFilm(0) : say('No films yet.'))} disabled={!open}>Replay</button>
        </div>
      </div>

      <div className="ev-card">
        <p className="ev-caption">Share / download</p>
        <p className="ev-muted">Share the capsule link or download the archive for the room.</p>
        <div className="ev-row">
          <button type="button" className="ev-btn ev-btn--light ev-btn--sm" onClick={share}>Share capsule</button>
          {open
            ? <a className="ev-btn ev-btn--light ev-btn--sm" href="/api/capsule/archive" download>Download archive</a>
            : <button type="button" className="ev-btn ev-btn--light ev-btn--sm" disabled>Download archive</button>}
        </div>
      </div>

      {toast && <p className="ev-toast" role="status">{toast}</p>}

      {film >= 0 && clips[film] && (
        <div className="ev-viewer" role="dialog" aria-modal="true" aria-label="Memory film">
          <button type="button" className="ev-viewer__close" onClick={() => setFilm(-1)} aria-label="Close film">✕</button>
          <video key={clips[film].id} src={mediaUrl(clips[film].id)} controls autoPlay playsInline onEnded={() => (film + 1 < clips.length ? setFilm(film + 1) : setFilm(-1))} />
          <div className="ev-viewer__nav"><span>Film {film + 1} / {clips.length}</span></div>
        </div>
      )}
    </AppShell>
  );
}
