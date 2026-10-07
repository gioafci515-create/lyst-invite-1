import { NextResponse } from 'next/server';
import { addResponse } from '../../../lib/store';
import { clean } from '../../../lib/event';

const MENUS = ['Garden menu', 'Fish', "Children's"];

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields. Pretend success.
  if (clean(body.website, 100)) return NextResponse.json({ ok: true });

  const name = clean(body.name, 120);
  const attending = body.attending === 'accept' || body.attending === 'decline' ? body.attending : null;
  const companions = Array.isArray(body.companions)
    ? body.companions.map((c) => clean(c, 120)).filter(Boolean).slice(0, 5)
    : [];
  const notes = clean(body.notes, 500);
  const menu = MENUS.includes(body.menu) ? body.menu : '';

  if (!name) return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
  if (!attending) return NextResponse.json({ error: 'Please choose accept or decline.' }, { status: 400 });

  const kept = attending === 'accept' ? companions : [];
  await addResponse({
    name,
    attending,
    companions: kept,
    guests: attending === 'accept' ? 1 + kept.length : 0,
    menu: attending === 'accept' ? menu : '',
    notes,
  });
  return NextResponse.json({ ok: true });
}
