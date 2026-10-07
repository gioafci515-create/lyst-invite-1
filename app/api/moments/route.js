import { NextResponse } from 'next/server';
import { createMoment, clean, publicMoment, PHOTO_ROLL } from '../../../lib/event';
import { listItems } from '../../../lib/store';

export const dynamic = 'force-dynamic';

// GET /api/moments?kind=photo|video|voice&guest=Name
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get('kind');
  const guest = clean(searchParams.get('guest') ?? '', 120);

  const all = (await listItems('moments')).filter((m) => !m.hidden);
  const items = all.filter((m) => !kind || m.kind === kind).map(publicMoment);
  const counts = {
    photo: all.filter((m) => m.kind === 'photo').length,
    video: all.filter((m) => m.kind === 'video').length,
    voice: all.filter((m) => m.kind === 'voice').length,
  };
  const mine = guest ? all.filter((m) => m.guest === guest) : [];
  return NextResponse.json({
    items,
    counts,
    mine: {
      roll: mine.filter((m) => m.kind === 'photo' && m.source === 'camera').length,
      rollSize: PHOTO_ROLL,
      video: mine.filter((m) => m.kind === 'video').length,
      voice: mine.filter((m) => m.kind === 'voice').length,
      challenges: mine.filter((m) => m.tag?.startsWith('challenge:')).map((m) => m.tag),
    },
  });
}

export async function POST(request) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }
  const { moment, error, closed } = await createMoment({
    file: form.get('file'),
    kind: clean(form.get('kind'), 10),
    guest: clean(form.get('guest'), 120),
    source: clean(form.get('source'), 10),
    tag: clean(form.get('tag'), 60),
  });
  if (error) return NextResponse.json({ error }, { status: closed ? 403 : 400 });
  return NextResponse.json({ ok: true, moment: publicMoment(moment) });
}
