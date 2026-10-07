'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppShell from './AppShell';
import { storage, timeAgo, useApi, useNow } from '../../lib/client';

const READ_KEY = 'lyst_notifications_read';
const PREFS_KEY = 'lyst_reminder_prefs';

const ICONS = {
  location: '/assets/app/n-map-pin.svg',
  announcement: '/assets/app/megaphone.svg',
  rsvp: '/assets/app/calendar-clock.svg',
  activity: '/assets/app/sparkles.svg',
  schedule: '/assets/app/clock-3.svg',
  capsule: '/assets/app/archive-dark.svg',
};

const PREFS = [
  ['announcements', 'Host announcements'],
  ['schedule', 'Schedule & location changes'],
  ['reminders', 'RSVP reminders'],
];

// Which reminder preference gates each notification type (activity is always shown).
const PREF_FOR_TYPE = { announcement: 'announcements', rsvp: 'reminders', location: 'schedule', schedule: 'schedule' };

const readRead =() => { try { return new Set(JSON.parse(storage.read(READ_KEY) || '[]')); } catch { return new Set(); } };

export default function NotificationsScreen() {
  const [data] = useApi('/api/notifications', { every: 15000 });
  const now = useNow(60000);
  const [read, setRead] = useState(() => new Set());
  const [priorityFirst, setPriorityFirst] = useState(true);
  const [settings, setSettings] = useState(false);
  const [prefs, setPrefs] = useState({ announcements: true, schedule: true, reminders: true });
  const [perm, setPerm] = useState('default');
  const announced = useRef(new Set());

  useEffect(() => {
    setRead(readRead());
    try { setPrefs((p) => ({ ...p, ...JSON.parse(storage.read(PREFS_KEY) || '{}') })); } catch {}
    if ('Notification' in window) setPerm(Notification.permission);
  }, []);

  const items = useMemo(() => {
    const rows = (data?.items ?? []).filter((n) => n.scheduled || prefs[PREF_FOR_TYPE[n.type]] !== false);
    return [...rows].sort((a, b) => {
      if (a.scheduled !== b.scheduled) return a.scheduled ? 1 : -1;
      if (priorityFirst && a.priority !== b.priority) return a.priority ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [data, priorityFirst, prefs]);

  const unread = items.filter((n) => !n.scheduled && !read.has(n.id));

  const persist = useCallback((set) => { setRead(set); storage.write(READ_KEY, JSON.stringify([...set])); }, []);
  const markAll = () => persist(new Set([...read, ...items.map((n) => n.id)]));
  const markOne = (id) => { if (!read.has(id)) persist(new Set([...read, id])); };

  // Surface brand-new items as browser notifications while the page is open.
  useEffect(() => {
    if (!data || perm !== 'granted') return;
    for (const n of unread) {
      if (announced.current.has(n.id)) continue;
      announced.current.add(n.id);
      if (announced.current.size > 1) try { new Notification(n.title, { body: n.body }); } catch {}
    }
  }, [data, unread, perm]);

  const setPref = (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    storage.write(PREFS_KEY, JSON.stringify(next));
  };

  const askPermission = async () => {
    if ('Notification' in window) setPerm(await Notification.requestPermission());
  };

  return (
    <AppShell title="Notifications" actions={{ src: '/assets/app/actions-notifications.svg' }} active="prepare" cta={{ label: 'Mark all read', onClick: markAll, disabled: !unread.length }}>
      <div className="ev-between">
        <span className="ev-inline ev-serif ev-serif--md"><img src="/assets/app/unread-dot.svg" alt="" width="9" height="9" />{unread.length} unread</span>
        <button type="button" className={`ev-chip${priorityFirst ? ' ev-chip--dark' : ''}`} aria-pressed={priorityFirst} onClick={() => setPriorityFirst((v) => !v)}>Priority first</button>
      </div>

      <ul className="ev-notes">
        {items.map((n) => {
          const isUnread = !n.scheduled && !read.has(n.id);
          return (
            <li key={n.id}>
              <button type="button" className={`ev-note${isUnread ? ' is-unread' : ''}`} onClick={() => markOne(n.id)}>
                <img src={ICONS[n.type] ?? ICONS.activity} alt="" width="18" height="18" />
                <span className="ev-note__text">
                  <strong>{n.priority ? 'Priority · ' : ''}{n.title}</strong>
                  <span>{n.body}</span>
                </span>
                <span className="ev-note__time">{n.scheduled ? 'Scheduled' : timeAgo(n.createdAt, now)}</span>
                {isUnread && <img src="/assets/app/n-dot.svg" alt="Unread" width="7" height="7" />}
              </button>
            </li>
          );
        })}
        {data && !items.length && <li className="ev-card ev-muted">You’re all caught up.</li>}
      </ul>

      <div className="ev-row">
        <button type="button" className="ev-btn ev-btn--accent ev-btn--sm" onClick={markAll} disabled={!unread.length}>Mark all read</button>
        <button type="button" className="ev-btn ev-btn--light ev-btn--sm" onClick={() => setSettings((v) => !v)} aria-expanded={settings}>
          <img src="/assets/app/settings-2.svg" alt="" width="16" height="16" /> Reminder settings
        </button>
      </div>

      {settings && (
        <fieldset className="ev-card ev-prefs">
          <legend className="ev-caption">Reminder settings</legend>
          {PREFS.map(([key, label]) => (
            <label key={key} className="ev-check"><input type="checkbox" checked={prefs[key]} onChange={(e) => setPref(key, e.target.checked)} /> {label}</label>
          ))}
          {perm === 'default' && <button type="button" className="ev-btn ev-btn--dark ev-btn--sm" onClick={askPermission}>Allow browser alerts</button>}
          {perm === 'granted' && <p className="ev-olive">Browser alerts are on while this page is open.</p>}
          {perm === 'denied' && <p className="ev-muted">Browser alerts are blocked in your settings.</p>}
        </fieldset>
      )}
    </AppShell>
  );
}
