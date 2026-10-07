import { isAdmin } from '../../../../lib/auth';
import { getItem, readUpload } from '../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  const moment = await getItem('moments', id);
  if (!moment || (moment.hidden && !(await isAdmin()))) return new Response('Not found', { status: 404 });

  const data = await readUpload(moment.file);
  if (!data) return new Response('Not found', { status: 404 });

  return new Response(data, {
    headers: {
      'Content-Type': moment.mime,
      'Content-Length': String(data.length),
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cache-Control': 'private, max-age=300',
    },
  });
}
