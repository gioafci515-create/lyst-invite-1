import { NextResponse } from 'next/server';
import { clean } from '../../../lib/event';
import { addItem, getSettings } from '../../../lib/store';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const guest = clean(body.guest, 120);
  const question = clean(body.question, 1000);
  const settings = await getSettings();

  if (!guest) return NextResponse.json({ error: 'Please enter your name first.' }, { status: 400 });
  if (!question) return NextResponse.json({ error: 'Write your question first.' }, { status: 400 });
  if (!settings.submissionsOpen) return NextResponse.json({ error: 'Submissions are now closed for this event.' }, { status: 403 });

  await addItem('questions', { guest, question, revealLater: !!body.revealLater, answer: '' });
  return NextResponse.json({ ok: true });
}
