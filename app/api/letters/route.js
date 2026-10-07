import { NextResponse } from 'next/server';
import { clean, createMoment } from '../../../lib/event';
import { addItem, getSettings, listItems } from '../../../lib/store';

export const dynamic = 'force-dynamic';

// Counts only. Letter bodies stay sealed until the capsule opens (admins read them in /admin).
export async function GET() {
  return NextResponse.json({ count: (await listItems('letters')).length });
}

// multipart so a letter can carry an optional photograph
export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const settings = await getSettings();
  if (!settings.submissionsOpen) return NextResponse.json({ error: 'Submissions are now closed for this event.' }, { status: 403 });

  const guest = clean(form.get('guest'), 120);
  const message = clean(form.get('message'), 4000);
  const kind = clean(form.get('type'), 10) === 'later' ? 'later' : 'room';
  const anonymous = form.get('anonymous') === '1';
  const revealOn = clean(form.get('revealOn'), 10);

  if (!guest) return NextResponse.json({ error: 'Please enter your name first.' }, { status: 400 });
  if (!message) return NextResponse.json({ error: 'Write your message first.' }, { status: 400 });
  if (revealOn && !/^\d{4}-\d{2}-\d{2}$/.test(revealOn)) return NextResponse.json({ error: 'Invalid reveal date.' }, { status: 400 });

  let photo = null;
  const file = form.get('photo');
  if (file && typeof file !== 'string' && file.size) {
    const res = await createMoment({ file, kind: 'photo', guest, source: 'upload', tag: 'letter', hidden: true });
    if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
    photo = res.moment.id;
  }

  await addItem('letters', { type: kind, guest, anonymous, message, revealOn, photo });
  return NextResponse.json({ ok: true });
}
