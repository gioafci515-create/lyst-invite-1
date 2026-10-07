'use client';

import { useCallback, useEffect, useState } from 'react';

const GUEST_KEY = 'lyst_guest';

const read = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
};

export const storage = { read, write };

/** Guest identity is just a remembered display name (no accounts). */
export function useGuest() {
  const [guest, setGuestState] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setGuestState(read(GUEST_KEY) || '');
    setReady(true);
  }, []);

  const setGuest = useCallback((name) => {
    const v = name.trim().slice(0, 120);
    setGuestState(v);
    write(GUEST_KEY, v);
  }, []);

  return { guest, setGuest, ready };
}

export async function api(url, options) {
  const res = await fetch(url, { cache: 'no-store', ...options });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Something went wrong. Please try again.');
  return json;
}

export const postJson = (url, body) =>
  api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

/** Poll a JSON endpoint. Returns [data, reload]. */
export function useApi(url, { every = 0, enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      setData(await api(url));
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, [url, enabled]);

  useEffect(() => {
    load();
    if (!every || !enabled) return;
    const t = setInterval(load, every);
    return () => clearInterval(t);
  }, [load, every, enabled]);

  return [data, load, error];
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function countdown(targetMs, now) {
  const diff = Math.max(0, targetMs - now);
  const s = Math.floor(diff / 1000);
  return {
    done: diff === 0,
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
  };
}

export const pad = (n) => String(n).padStart(2, '0');

export function timeAgo(iso, now = Date.now()) {
  const mins = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return hrs < 48 ? 'Yesterday' : `${Math.floor(hrs / 24)}d ago`;
}

export const formatDate = (iso) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(new Date(iso));

/** Upload one file with the guest's name. Resolves to the API json or throws. */
export async function uploadMoment({ file, kind, guest, source = 'upload', tag = '' }) {
  const form = new FormData();
  form.set('file', file, file.name || `${kind}.bin`);
  form.set('kind', kind);
  form.set('guest', guest);
  form.set('source', source);
  if (tag) form.set('tag', tag);
  return api('/api/moments', { method: 'POST', body: form });
}

export const mediaUrl = (id) => `/api/media/${id}`;
