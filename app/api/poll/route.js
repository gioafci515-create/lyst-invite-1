import { NextResponse } from 'next/server';
import { clean } from '../../../lib/event';
import { getSettings, listItems, upsertItem } from '../../../lib/store';

export const dynamic = 'force-dynamic';

async function summary(guest) {
  const settings = await getSettings();
  const votes = await listItems('votes');
  const total = votes.length;
  const options = settings.pollOptions.map((label) => {
    const n = votes.filter((v) => v.option === label).length;
    return { label, percent: settings.pollResultsVisible && total ? Math.round((n / total) * 100) : null };
  });
  return {
    question: settings.pollQuestion,
    options,
    resultsVisible: settings.pollResultsVisible,
    total,
    voted: guest ? (votes.find((v) => v.guest === guest)?.option ?? null) : null,
  };
}

export async function GET(request) {
  const guest = clean(new URL(request.url).searchParams.get('guest') ?? '', 120);
  return NextResponse.json(await summary(guest));
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const guest = clean(body.guest, 120);
  const option = clean(body.option, 120);
  const settings = await getSettings();

  if (!guest) return NextResponse.json({ error: 'Please enter your name first.' }, { status: 400 });
  if (!settings.pollOptions.includes(option)) return NextResponse.json({ error: 'Unknown option.' }, { status: 400 });
  if (!settings.submissionsOpen) return NextResponse.json({ error: 'Voting is closed.' }, { status: 403 });

  await upsertItem('votes', (v) => v.guest === guest, { guest, option });
  return NextResponse.json(await summary(guest));
}
