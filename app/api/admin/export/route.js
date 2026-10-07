import { isAdmin } from '../../../../lib/auth';
import { listResponses } from '../../../../lib/store';

export const dynamic = 'force-dynamic';

// Prefix cells that spreadsheets would treat as formulas.
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });

  const rows = await listResponses();
  const lines = [
    ['Received', 'Name', 'Response', 'Companions', 'Dietary / access'].map(cell).join(','),
    ...rows.map((r) =>
      [r.createdAt, r.name, r.attending, r.companions.join('; '), r.notes].map(cell).join(',')
    ),
  ];
  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rsvp-responses.csv"',
    },
  });
}
