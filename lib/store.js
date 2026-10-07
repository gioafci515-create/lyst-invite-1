import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// File-backed store. Fine for a single server / local use; swap for a real DB on serverless hosts.
const DIR = path.join(process.cwd(), 'data');
const UPLOADS = path.join(DIR, 'uploads');

let queue = Promise.resolve();
const serial = (fn) => {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
};

const fileFor = (name) => path.join(DIR, `${name}.json`);

async function readJson(name, fallback) {
  try {
    return JSON.parse(await fs.readFile(fileFor(name), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function writeJson(name, data) {
  await fs.mkdir(DIR, { recursive: true });
  const file = fileFor(name);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

/* ---------- generic collections ---------- */

export const listItems = (col) =>
  serial(async () => (await readJson(col, [])).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

export const getItem = (col, id) => serial(async () => (await readJson(col, [])).find((r) => r.id === id) ?? null);

export const addItem = (col, data) =>
  serial(async () => {
    const rows = await readJson(col, []);
    const row = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
    rows.push(row);
    await writeJson(col, rows);
    return row;
  });

export const updateItem = (col, id, patch) =>
  serial(async () => {
    const rows = await readJson(col, []);
    const i = rows.findIndex((r) => r.id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...patch };
    await writeJson(col, rows);
    return rows[i];
  });

export const deleteItem = (col, id) =>
  serial(async () => {
    const rows = await readJson(col, []);
    await writeJson(col, rows.filter((r) => r.id !== id));
  });

/** Insert or replace the row matching `match(row)`. Used for one-vote-per-guest polls. */
export const upsertItem = (col, match, data) =>
  serial(async () => {
    const rows = await readJson(col, []);
    const i = rows.findIndex(match);
    if (i === -1) {
      const row = { id: randomUUID(), createdAt: new Date().toISOString(), ...data };
      rows.push(row);
      await writeJson(col, rows);
      return row;
    }
    rows[i] = { ...rows[i], ...data };
    await writeJson(col, rows);
    return rows[i];
  });

/* ---------- RSVP (kept for existing callers) ---------- */

export const listResponses = () => listItems('responses');
export const addResponse = (data) => addItem('responses', data);
export const deleteResponse = (id) => deleteItem('responses', id);

/* ---------- settings ---------- */

export const DEFAULT_SETTINGS = {
  announcement: 'The next moment begins in 18 minutes.',
  submissionsOpen: true,
  pollResultsVisible: true,
  pollQuestion: 'Which song should close the night?',
  pollOptions: ['This Must Be the Place', "Lovers' Carvings"],
  rsvpClosesAt: '30 Sep 2026 · 18:00',
  capsuleName: 'OBJECT 07: AER · Edition 01',
  capsuleUnlockAt: '2027-10-01T00:00:00+02:00',
  capsuleForceUnlocked: false,
};

export const getSettings = () =>
  serial(async () => ({ ...DEFAULT_SETTINGS, ...(await readJson('settings', {})) }));

export const saveSettings = (patch) =>
  serial(async () => {
    const next = { ...DEFAULT_SETTINGS, ...(await readJson('settings', {})), ...patch };
    await writeJson('settings', next);
    return next;
  });

/* ---------- uploaded files ---------- */

const safeId = (id) => /^[0-9a-f-]{36}$/.test(id);

export async function saveUpload(id, buffer) {
  await fs.mkdir(UPLOADS, { recursive: true });
  await fs.writeFile(path.join(UPLOADS, id), buffer);
}

export async function readUpload(id) {
  if (!safeId(id)) return null;
  try {
    return await fs.readFile(path.join(UPLOADS, id));
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function removeUpload(id) {
  if (!safeId(id)) return;
  await fs.rm(path.join(UPLOADS, id), { force: true });
}
