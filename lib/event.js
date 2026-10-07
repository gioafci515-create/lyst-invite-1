import { randomUUID } from 'crypto';
import { addItem, getSettings, listItems, saveUpload } from './store';

export const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const PHOTO_ROLL = 24;

const LIMITS = {
  photo: { bytes: 12 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] },
  video: { bytes: 80 * 1024 * 1024, types: ['video/mp4', 'video/webm', 'video/quicktime'] },
  voice: { bytes: 25 * 1024 * 1024, types: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a'] },
};

// Strip codec parameters, e.g. "video/webm;codecs=vp9" -> "video/webm".
const baseType = (t) => (t || '').split(';')[0].trim().toLowerCase();

/** Validate + persist one uploaded file. Returns { error } or { moment }. */
export async function createMoment({ file, kind, guest, source, tag, hidden = false }) {
  const limit = LIMITS[kind];
  if (!limit) return { error: 'Unknown upload type.' };
  if (!guest) return { error: 'Please enter your name first.' };
  if (!file || typeof file === 'string' || !file.size) return { error: 'No file received.' };

  const settings = await getSettings();
  if (!settings.submissionsOpen) return { error: 'Submissions are now closed for this event.', closed: true };

  const mime = baseType(file.type);
  if (!limit.types.includes(mime)) return { error: `Unsupported ${kind} format (${mime || 'unknown'}).` };
  if (file.size > limit.bytes) return { error: `That file is too large (max ${Math.round(limit.bytes / 1048576)} MB).` };

  if (kind === 'photo' && source === 'camera') {
    const mine = (await listItems('moments')).filter((m) => m.kind === 'photo' && m.source === 'camera' && m.guest === guest);
    if (mine.length >= PHOTO_ROLL) return { error: 'Your disposable roll is full.' };
  }

  const id = randomUUID();
  await saveUpload(id, Buffer.from(await file.arrayBuffer()));
  const moment = await addItem('moments', {
    kind,
    guest,
    source: source === 'camera' ? 'camera' : 'upload',
    tag: tag || '',
    mime,
    size: file.size,
    hidden,
    file: id,
  });
  return { moment };
}

export const publicMoment = (m) => ({ id: m.id, kind: m.kind, createdAt: m.createdAt, tag: m.tag, guest: m.guest });

export const isCapsuleOpen = (s) => s.capsuleForceUnlocked || Date.now() >= new Date(s.capsuleUnlockAt).getTime();
