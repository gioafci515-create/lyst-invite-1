'use client';

import { useState } from 'react';
import AppShell, { GuestCard } from './AppShell';
import { postJson, useApi, useGuest } from '../../lib/client';

const MENUS = ['Garden menu', 'Fish', "Children's"];
const MAX_GUESTS = 6;

const icsHref = () => {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LYST//Object 07//EN', 'BEGIN:VEVENT',
    'UID:object07-aer-047@lyst.events', 'DTSTAMP:20260901T000000Z',
    'DTSTART:20261001T183000Z', 'DTEND:20261001T213000Z',
    'SUMMARY:OBJECT 07: AER — Maison AER', 'LOCATION:Palais de Tokyo · Galerie 5\\, Paris',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
};

export default function RsvpFlow() {
  const { guest } = useGuest();
  const [event] = useApi('/api/event');
  const [attending, setAttending] = useState('accept');
  const [guests, setGuests] = useState(1);
  const [plusOnes, setPlusOnes] = useState(['']);
  const [menu, setMenu] = useState(MENUS[0]);
  const [notes, setNotes] = useState('');
  const [state, setState] = useState({ phase: 'idle', error: '' });

  const accept = attending === 'accept';
  const extras = guests - 1;
  const setCount = (n) => {
    const next = Math.min(MAX_GUESTS, Math.max(1, n));
    setGuests(next);
    setPlusOnes((p) => Array.from({ length: next - 1 }, (_, i) => p[i] ?? ''));
  };

  const submit = async () => {
    if (!guest) return setState({ phase: 'idle', error: 'Please enter your name first.' });
    setState({ phase: 'sending', error: '' });
    try {
      await postJson('/api/rsvp', {
        name: guest, attending, companions: accept ? plusOnes : [], menu: accept ? menu : '', notes,
      });
      setState({ phase: 'done', error: '' });
    } catch (e) {
      setState({ phase: 'idle', error: e.message });
    }
  };

  const done = state.phase === 'done';

  return (
    <AppShell
      title="RSVP flow"
      actions={{ src: '/assets/app/actions-rsvp.svg' }}
      active="respond"
      cta={{ label: done ? 'Response saved' : state.phase === 'sending' ? 'Sending…' : 'Confirm response', onClick: submit, disabled: done || state.phase === 'sending' }}
    >
      <h2 className="ev-h2">Will you be there?</h2>
      <GuestCard />

      <div className="ev-row" role="radiogroup" aria-label="Attendance">
        <button type="button" role="radio" aria-checked={accept} className={`ev-choice${accept ? ' is-on' : ''}`} onClick={() => setAttending('accept')}>Yes, joyfully</button>
        <button type="button" role="radio" aria-checked={!accept} className={`ev-choice${!accept ? ' is-on' : ''}`} onClick={() => setAttending('decline')}>No, with love</button>
      </div>

      {accept && (
        <>
          <div className="ev-card ev-between">
            <span className="ev-label">Guests</span>
            <div className="ev-stepper">
              <button type="button" className="ev-step" onClick={() => setCount(guests - 1)} aria-label="Fewer guests" disabled={guests <= 1}>−</button>
              <span className="ev-num" aria-live="polite">{String(guests).padStart(2, '0')}</span>
              <button type="button" className="ev-step ev-step--dark" onClick={() => setCount(guests + 1)} aria-label="More guests" disabled={guests >= MAX_GUESTS}>+</button>
            </div>
          </div>

          {Array.from({ length: extras }, (_, i) => (
            <label key={i} className="ev-card ev-field-card">
              <span className="ev-label">{extras > 1 ? `Named plus-one ${i + 1}` : 'Named plus-one'}</span>
              <span className="ev-inline">
                <input className="ev-input" value={plusOnes[i] ?? ''} placeholder="Full name" maxLength={120}
                  onChange={(e) => setPlusOnes((p) => p.map((v, j) => (j === i ? e.target.value : v)))} />
                {plusOnes[i]?.trim() && <span className="ev-olive">Added</span>}
              </span>
            </label>
          ))}

          <div className="ev-card ev-field-card">
            <span className="ev-label">Menu preference</span>
            <div className="ev-chips" role="radiogroup" aria-label="Menu preference">
              {MENUS.map((m) => (
                <button key={m} type="button" role="radio" aria-checked={menu === m} className={`ev-chip${menu === m ? ' ev-chip--dark' : ''}`} onClick={() => setMenu(m)}>{m}</button>
              ))}
            </div>
          </div>
        </>
      )}

      <label className="ev-card ev-field-card">
        <span className="ev-label">Dietary / access</span>
        <input className="ev-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nut allergy · step-free arrival" maxLength={500} />
      </label>

      <div className="ev-card ev-card--paper ev-between">
        <span className="ev-label">Response closes</span>
        <span>{event?.rsvpClosesAt ?? '—'}</span>
      </div>

      {state.error && <p className="ev-error" role="alert">{state.error}</p>}

      {done && (
        <div className="ev-card ev-card--accent" role="status">
          <strong>{accept ? `Confirmed · ${guests === 1 ? 'One seat' : `${guests} seats`} saved` : 'Response recorded'}</strong>
          <span>{accept ? 'Your host has your response and guest details.' : 'Thank you for letting us know.'}</span>
          {accept && <a className="ev-link" href={icsHref()} download="object-07-aer.ics">Add to calendar</a>}
        </div>
      )}
    </AppShell>
  );
}
