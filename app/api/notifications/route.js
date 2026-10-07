import { NextResponse } from 'next/server';
import { getSettings, listItems } from '../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [rows, s] = await Promise.all([listItems('notifications'), getSettings()]);
  const items = rows.map(({ id, type, title, body, priority, createdAt }) => ({ id, type, title, body, priority: !!priority, createdAt }));
  // Scheduled capsule unlock is derived from settings so it can't drift.
  items.push({
    id: 'capsule-unlock',
    type: 'capsule',
    title: 'Capsule unlock',
    body: new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(s.capsuleUnlockAt)),
    priority: false,
    scheduled: true,
    createdAt: '1970-01-01T00:00:00.000Z',
  });
  return NextResponse.json({ items });
}
