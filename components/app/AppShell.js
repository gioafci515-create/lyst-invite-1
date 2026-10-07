'use client';

import Link from 'next/link';
import { createContext, useContext, useState } from 'react';
import { useGuest } from '../../lib/client';

const EmbedContext = createContext(false);

/** Marks screens as sections of the single-page site: no route tabs, CTA sits inline. */
export function Embed({ children }) {
  return <EmbedContext.Provider value>{children}</EmbedContext.Provider>;
}

const TABS = [
  ['invite', 'Invite', '/'],
  ['respond', 'Respond', '/event/rsvp'],
  ['prepare', 'Prepare', '/event'],
  ['participate', 'Participate', '/event/interact'],
  ['remember', 'Remember', '/event/capsule'],
];

/**
 * Mobile app frame shared by every event screen: app bar, scrolling content,
 * and the one-handed tab bar with a primary action.
 */
export default function AppShell({ title, actions, active, tone = 'light', cta, children }) {
  const embedded = useContext(EmbedContext);
  if (embedded) {
    return (
      <div className={`ev-app ev-app--${tone} ev-app--embedded`}>
        <div className="ev-bar">
          <h3>{title}</h3>
          <img src={actions.src} alt="" width={actions.w ?? 44} height="44" />
        </div>
        <div className="ev-content">{children}</div>
        {cta && (
          <div className="ev-embed-cta">
            <button type="button" className="ev-cta" onClick={cta.onClick} disabled={cta.disabled}>
              <img src="/assets/app/cta-arrow.svg" alt="" width="16" height="16" />
              {cta.label}
            </button>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className={`ev-app ev-app--${tone}`}>
      <header className="ev-bar">
        <h1>{title}</h1>
        <img src={actions.src} alt="" width={actions.w ?? 44} height="44" />
      </header>
      <main className="ev-content">{children}</main>
      <nav className="ev-tabs" aria-label="Event journey">
        <div className="ev-tabs__row">
          {TABS.map(([key, label, href]) => (
            <Link key={key} href={href} className="ev-tab" aria-current={active === key ? 'page' : undefined}>
              <span className={`ev-tab__bar${active === key ? ' is-on' : ''}`} />
              {label}
            </Link>
          ))}
        </div>
        {cta && (
          <button type="button" className="ev-cta" onClick={cta.onClick} disabled={cta.disabled}>
            <img src="/assets/app/cta-arrow.svg" alt="" width="16" height="16" />
            {cta.label}
          </button>
        )}
      </nav>
    </div>
  );
}

/** Asks for the guest's name once; every submission is attributed to it. */
export function GuestCard() {
  const { guest, setGuest, ready } = useGuest();
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  if (!ready) return null;

  if (guest && !editing) {
    return (
      <p className="ev-guest">
        Signed in as <strong>{guest}</strong>
        <button type="button" onClick={() => { setDraft(guest); setEditing(true); }}>Change</button>
      </p>
    );
  }
  return (
    <form
      className="ev-card ev-field-card"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.trim()) { setGuest(draft); setEditing(false); }
      }}
    >
      <label className="ev-label" htmlFor="guest-name">Your name</label>
      <div className="ev-inline">
        <input id="guest-name" className="ev-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="As it appears on your pass" maxLength={120} autoComplete="name" />
        <button type="submit" className="ev-chip ev-chip--dark">Save</button>
      </div>
    </form>
  );
}
