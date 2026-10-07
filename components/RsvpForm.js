'use client';

import { useRef, useState } from 'react';

export default function RsvpForm({ onStep }) {
  const [choice, setChoice] = useState('accept');
  const [confirmed, setConfirmed] = useState(false);
  const [status, setStatus] = useState('');
  const guestRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    const name = guestRef.current?.value.trim();
    setConfirmed(true);
    setStatus(
      choice === 'accept'
        ? `Seat requested${name ? ` for ${name}` : ''}. The host will confirm shortly.`
        : 'Response recorded. Thank you for letting us know.'
    );
    onStep('confirmed');
  };

  return (
    <form
      className={`rsvp__card${confirmed ? ' is-confirmed' : ''}`}
      onSubmit={submit}
      onFocus={() => onStep((s) => (s === 'default' ? 'open' : s))}
      noValidate
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
      <label className="field only-desktop">
        <input ref={guestRef} type="text" name="guest" placeholder="Guest name" autoComplete="name" />
        <button type="button" className="field__action" onClick={() => guestRef.current?.focus()}>
          Add companion ＋
        </button>
      </label>
      <label className="field only-desktop">
        <input type="text" name="preferences" placeholder="Dietary / access" autoComplete="off" />
        <span className="field__action">Edit privately</span>
      </label>
      <button type="submit" className="pill btn-submit">
        <span className="only-desktop">Confirm response</span>
        <span className="only-mobile">Open private response</span>
        <img src="/assets/arrow-right.svg" alt="" width="14" height="14" />
      </button>
      <p className="rsvp__status" role="status" aria-live="polite">{status}</p>
    </form>
  );
}
