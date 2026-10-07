import { zipSync, strToU8 } from 'fflate';
import { getSettings, listItems, readUpload } from '../../../../lib/store';
import { isAdmin } from '../../../../lib/auth';
import { isCapsuleOpen } from '../../../../lib/event';

export const dynamic = 'force-dynamic';

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/x-m4a': 'm4a' };

// Guests can only download once the capsule has opened. Admins can always download.
export async function GET() {
  const s = await getSettings();
  const open = isCapsuleOpen(s);
  if (!open && !(await isAdmin())) return new Response('The capsule is still sealed.', { status: 403 });

  const [moments, letters, questions] = await Promise.all([listItems('moments'), listItems('letters'), listItems('questions')]);
  const files = {};
  // Letter photos are private (hidden from the gallery) but belong in the capsule.
  for (const m of moments.filter((m) => !m.hidden || m.tag === 'letter')) {
    const data = await readUpload(m.file);
    if (data) files[`${m.kind}/${m.id}.${EXT[m.mime] ?? 'bin'}`] = [new Uint8Array(data), { level: 0 }];
  }
  files['letters.json'] = strToU8(JSON.stringify(letters.map((l) => ({ from: l.anonymous ? 'Anonymous' : l.guest, type: l.type, revealOn: l.revealOn, message: l.message, writtenAt: l.createdAt })), null, 2));
  files['answers.json'] = strToU8(JSON.stringify(questions.filter((q) => q.answer).map((q) => ({ question: q.question, answer: q.answer })), null, 2));

  return new Response(zipSync(files), {
    headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="lyst-capsule.zip"' },
  });
}
