'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useGuest } from '../lib/client';

const MAX_COMPANIONS = 5;

export default function RsvpForm({ onStep }) {
  const [choice, setChoice] = useState('accept');
  const [companions, setCompanions] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | sending | confirmed
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const nameRef = useRef(null);
  const prefRef = useRef(null);
  const { setGuest } = useGuest();

  const addCompanion = () => setCompanions((c) => (c.length < MAX_COMPANIONS ? [...c, ''] : c));

  const submit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError('');
    setPhase('sending');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('guest'),
          attending: choice,
          companions,
          notes: data.get('preferences'),
          website: data.get('website'),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.');

      const name = String(data.get('guest')).trim();
      setGuest(name);
      setMessage(
        choice === 'accept'
          ? `Seat requested for ${name}${companions.filter(Boolean).length ? ` + ${companions.filter(Boolean).length}` : ''}. The host will confirm shortly.`
          : 'Response recorded. Thank you for letting us know.'
      );
      setPhase('confirmed');
      onStep('confirmed');
    } catch (err) {
      setError(err.message);
      setPhase('idle');
      nameRef.current?.focus();
    }
  };

  const confirmed = phase === 'confirmed';

  return (
    <form
      className={`rsvp__card${confirmed ? ' is-confirmed' : ''}`}
      onSubmit={submit}
      onFocus={() => onStep((s) => (s === 'default' ? 'open' : s))}
    >
      <div className="options" role="radiogroup" aria-label="Attendance">
        <button
          type="button"
          role="radio"
          aria-checked={choice === 'accept'}
          className={`option${choice === 'accept' ? ' is-selected' : ''}`}
          onClick={() => setChoice('accept')}
        >
          <span className="only-desktop">JOYFULLY ACCEPT</span>
          <span className="only-mobile">ACCEPT</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={choice === 'decline'}
          className={`option${choice === 'decline' ? ' is-selected' : ''}`}
          onClick={() => setChoice('decline')}
        >
          DECLINE
        </button>
      </div>

      <label className="field">
        <input ref={nameRef} type="text" name="guest" placeholder="Guest name" autoComplete="name" maxLength={120} required />
        {choice === 'accept' && (
          <button type="button" className="field__action" onClick={addCompanion} disabled={companions.length >= MAX_COMPANIONS}>
            Add companion ＋
          </button>
        )}
      </label>

      {choice === 'accept' &&
        companions.map((value, i) => (
          <label className="field" key={i}>
            <input
              type="text"
              placeholder={`Companion ${i + 1}`}
              value={value}
              maxLength={120}
              autoFocus
              onChange={(e) => setCompanions((c) => c.map((v, j) => (j === i ? e.target.value : v)))}
            />
            <button type="button" className="field__action" onClick={() => setCompanions((c) => c.filter((_, j) => j !== i))}>
              Remove
            </button>
          </label>
        ))}

      <label className="field">
        <input ref={prefRef} type="text" name="preferences" placeholder="Dietary / access" autoComplete="off" maxLength={500} />
        <button type="button" className="field__action" onClick={() => prefRef.current?.focus()}>Edit privately</button>
      </label>

      {/* Honeypot: hidden from people, bots fill it in. */}
      <input type="text" name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <button type="submit" className="pill btn-submit" disabled={phase === 'sending'}>
        <span>{phase === 'sending' ? 'Sending…' : 'Confirm response'}</span>
        <img src="/assets/arrow-right.svg" alt="" width="14" height="14" />
      </button>

      <p className="rsvp__status" role="status" aria-live="polite">{message}</p>
      {confirmed && <Link className="pill rsvp__enter" href="/event">Enter the event experience</Link>}
      {error && <p className="rsvp__error" role="alert">{error}</p>}
    </form>
  );
}
