import { NextResponse } from 'next/server';
import { getSettings, listItems } from '../../../lib/store';
import { isCapsuleOpen } from '../../../lib/event';

export const dynamic = 'force-dynamic';


// Public event state: settings that guests may see, plus aggregate counts.
export async function GET() {
  const [s, moments, letters, questions, responses, notifications] = await Promise.all([
    getSettings(),
    listItems('moments'),
    listItems('letters'),
    listItems('questions'),
    listItems('responses'),
    listItems('notifications'),
  ]);
  const visible = moments.filter((m) => !m.hidden);
  return NextResponse.json({
    announcement: s.announcement,
    submissionsOpen: s.submissionsOpen,
    rsvpClosesAt: s.rsvpClosesAt,
    capsuleName: s.capsuleName,
    capsuleUnlockAt: s.capsuleUnlockAt,
    capsuleOpen: isCapsuleOpen(s),
    counts: {
      guests: responses.filter((r) => r.attending === 'accept').reduce((n, r) => n + (r.guests ?? 1 + (r.companions?.length ?? 0)), 0),
      photo: visible.filter((m) => m.kind === 'photo').length,
      video: visible.filter((m) => m.kind === 'video').length,
      voice: visible.filter((m) => m.kind === 'voice').length,
      letters: letters.length,
      answers: questions.length + (await listItems('votes')).length,
    },
    alerts: notifications.length,
  });
}
