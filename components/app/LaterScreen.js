'use client';

import { useRef, useState } from 'react';
import AppShell, { GuestCard } from './AppShell';
import { api, countdown, pad, useApi, useGuest, useNow } from '../../lib/client';

const DEFAULT_REVEAL = '2027-10-01';

export default function LaterScreen() {
  const { guest } = useGuest();
  const [letters, reloadCount] = useApi('/api/letters');
  const now = useNow(30000);
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [revealOn, setRevealOn] = useState(DEFAULT_REVEAL);
  const [editingDate, setEditingDate] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [state, setState] = useState({ phase: 'idle', error: '' });
  const fileRef = useRef(null);

  const cd = countdown(new Date(`${revealOn}T00:00:00+02:00`).getTime(), now);
  const sealed = state.phase === 'sent';

  const seal = async () => {
    if (!guest) return setState({ phase: 'idle', error: 'Please enter your name first.' });
    if (!message.trim()) return setState({ phase: 'idle', error: 'Write your message first.' });
    setState({ phase: 'sending', error: '' });
    try {
      const form = new FormData();
      form.set('type', 'later');
      form.set('guest', guest);
      form.set('message', message);
      form.set('revealOn', revealOn);
      if (anonymous) form.set('anonymous', '1');
      if (photo) form.set('photo', photo);
      await api('/api/letters', { method: 'POST', body: form });
      reloadCount();
      setState({ phase: 'sent', error: '' });
    } catch (e) {
      setState({ phase: 'idle', error: e.message });
    }
  };

  return (
    <AppShell
      title="Message for Later"
      actions={{ src: '/assets/app/actions-later.svg' }}
      active="remember"
      tone="black"
      cta={{ label: sealed ? 'Message sealed' : state.phase === 'sending' ? 'Sealing…' : 'Seal message', onClick: seal, disabled: sealed || state.phase === 'sending' }}
    >
      <div className="ev-hero ev-hero--accent">
        <p className="ev-kicker">FOR A FUTURE DAY</p>
        <p className="ev-serif ev-serif--xl">A note for a future day</p>
        <p className="ev-muted">Sealed now. Opens on your chosen date.</p>
      </div>

      <GuestCard />

      <label className="ev-card ev-field-card ev-field-card--tall">
        <span className="ev-label ev-label--sm">Your message</span>
        <textarea className="ev-input ev-textarea" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={4000} placeholder="Keep choosing the long table, the slow mornings, and each other—especially when the room is noisy." disabled={sealed} />
      </label>

      <div className="ev-row ev-row--wrap">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { setPhoto(e.target.files[0] ?? null); e.target.value = ''; }} />
        <button type="button" className="ev-btn ev-btn--light ev-btn--sm ev-grow-2" onClick={() => fileRef.current?.click()} disabled={sealed}>
          <img src="/assets/app/image-plus.svg" alt="" width="16" height="16" /> {photo ? 'Photo added' : 'Add photo'}
        </button>
        <button type="button" className={`ev-chip${!anonymous ? ' ev-chip--dark' : ''}`} aria-pressed={!anonymous} onClick={() => setAnonymous(false)}>Named{guest ? `: ${guest}` : ''}</button>
        <button type="button" className={`ev-chip${anonymous ? ' ev-chip--dark' : ''}`} aria-pressed={anonymous} onClick={() => setAnonymous(true)}>Anonymous</button>
      </div>

      <div className="ev-card ev-field-card">
        <span className="ev-label ev-label--sm">Reveal date</span>
        <div className="ev-between">
          {editingDate ? (
            <input type="date" className="ev-input" value={revealOn} min={new Date().toISOString().slice(0, 10)} onChange={(e) => e.target.value && setRevealOn(e.target.value)} />
          ) : (
            <span>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(new Date(`${revealOn}T12:00:00`))}</span>
          )}
          <button type="button" className="ev-link-btn" onClick={() => setEditingDate((v) => !v)} disabled={sealed}>{editingDate ? 'Done' : 'Change'}</button>
        </div>
      </div>

      <div className="ev-hero ev-hero--plain">
        <p className="ev-kicker">{sealed ? 'SEALED' : 'SEALS ON SUBMIT'} · {letters?.count ?? 0} LETTER{letters?.count === 1 ? '' : 'S'} IN THIS ROOM</p>
        <p className="ev-mono ev-mono--xl">{pad(cd.d)}d : {pad(cd.h)}h : {pad(cd.m)}m</p>
        <p className="ev-muted">On reveal, the sealed page unfolds with your photograph and chosen date.</p>
      </div>

      <button type="button" className="ev-card ev-card--paper ev-card--button" onClick={() => setPreviewOpen((v) => !v)} aria-expanded={previewOpen}>
        <span className="ev-label">Reveal preview</span>
        <span className="ev-serif ev-serif--md">{previewOpen ? (message.trim() || 'Your letter will appear here.') : 'Open the letter'}</span>
      </button>

      {state.error && <p className="ev-error" role="alert">{state.error}</p>}
      {sealed && <p className="ev-card ev-card--accent" role="status"><strong>Sealed.</strong> It will stay closed until {revealOn}.</p>}
    </AppShell>
  );
}
