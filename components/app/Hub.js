'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { storage, useApi } from '../../lib/client';

const READ_KEY = 'lyst_notifications_read';

const SCHEDULE = [
  '19:45 · Collector entry',
  '20:15 · Installation opens',
  '20:30 · Object 07 first look',
  '20:42 · Runway sequence',
  '21:10 · Moving image',
  '22:45 · Private afters',
];

const NAV = [
  ['Today', '#today'],
  ['Schedule', '#schedule'],
  ['Participate', '/event/interact'],
  ['Gallery', '/event/gallery'],
  ['Capsule', '/event/capsule'],
  ['Updates', '/event/notifications'],
];

const SPACES = [
  ['Camera', '/event/camera'],
  ['Voice guestbook', '/event/guestbook'],
  ['Video messages', '/event/video'],
  ['Message for later', '/event/later'],
];

export default function Hub() {
  const [event] = useApi('/api/event', { every: 15000 });
  const [notes] = useApi('/api/notifications', { every: 15000 });
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let read = [];
    try { read = JSON.parse(storage.read(READ_KEY) || '[]'); } catch {}
    setUnread((notes?.items ?? []).filter((n) => !n.scheduled && !read.includes(n.id)).length);
  }, [notes]);

  const steps = [
    ['Invite · opened', true],
    ['Respond · confirmed', true],
    ['Prepare · saved', true],
    ['Participate · live', true],
    ['Remember · 01 October 2027', false],
  ];

  return (
    <div className="hub">
      <header className="hub__nav">
        <Link href="/" className="hub__mark">LYST / 06</Link>
        <nav className="hub__links" aria-label="Event hub">
          {NAV.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
        </nav>
        <Link href="/event/notifications" className="hub__live">
          <img src="/assets/hub/live-dot.svg" alt="" width="8" height="8" />
          LIVE · {unread} ALERT{unread === 1 ? '' : 'S'} · GUEST PASS
        </Link>
      </header>

      <section className="hub__hero" id="today">
        <div className="hub__copy">
          <p className="hub__eyebrow">● Live experience · Maison AER / Edition 047</p>
          <h1>OBJECT 07: AER</h1>
          <p>Thursday, 1 October 2026 · First look 20:30<br />Palais de Tokyo · Galerie 5 · Paris, France</p>
          <Link href="/event/rsvp" className="btn-square">Request seat <img src="/assets/arrow-right.svg" alt="" width="14" height="14" /></Link>
        </div>
        <div className="hub__media">
          <img src="/assets/hub/live-media.png" alt="" />
          <span className="hub__label">HOST ANNOUNCEMENT · LIVE</span>
          <p>{event?.announcement ?? ' '}</p>
        </div>
      </section>

      <ol className="hub__rail" aria-label="Guest journey">
        {steps.map(([label, on]) => (
          <li key={label}><img src={on ? '/assets/hub/live-dot.svg' : '/assets/hub/step-state.svg'} alt="" width="8" height="8" />{label}</li>
        ))}
      </ol>

      <div className="hub__modules">
        <section className="hub__card" id="schedule" aria-labelledby="sched-h">
          <div className="hub__row"><h2 id="sched-h">Schedule</h2><img src="/assets/hub/calendar-days.svg" alt="" width="18" height="18" /></div>
          {SCHEDULE.map((s) => <p key={s}>{s}</p>)}
        </section>

        <section className="hub__card hub__card--dark hub__map" aria-labelledby="map-h">
          <div className="hub__row">
            <img src="/assets/hub/map-pin.svg" alt="" width="20" height="20" />
            <a className="hub__choice" href="https://maps.google.com/?q=Palais+de+Tokyo+Paris" target="_blank" rel="noopener noreferrer">Open map <img src="/assets/hub/arrow-up-right.svg" alt="" width="12" height="12" /></a>
          </div>
          <div className="hub__mapfield" aria-hidden="true" />
          <h2 id="map-h" className="hub__venue">Palais de Tokyo · Galerie 5</h2>
          <p>Transport · Metro Iéna · host car desk at Avenue du Président Wilson</p>
          <p>Parking · Alma–George V · car desk closes 22:30</p>
        </section>

        <div className="hub__stack">
          <section className="hub__card hub__card--accent">
            <h2 className="hub__caps">Dress code</h2>
            <p className="hub__serif">Severe black. Silver hardware. No logos.</p>
          </section>
          <section className="hub__card">
            <h2 className="hub__caps hub__caps--grey">Guest information / FAQ</h2>
            <p>Named pass and photo ID required. Photography opens after the runway. Hôtel Brach allocation: AER047. Step-free entry through Galerie 5 east lift.</p>
          </section>
        </div>
      </div>

      <nav className="hub__spaces" aria-label="Participate">
        <h2 className="hub__caps hub__caps--grey">Participate</h2>
        <ul>{SPACES.map(([label, href]) => <li key={label}><Link href={href}>{label}</Link></li>)}</ul>
      </nav>
    </div>
  );
}
