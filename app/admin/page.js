import { redirect } from 'next/navigation';
import { isAdmin } from '../../lib/auth';
import { listResponses } from '../../lib/store';
import AdminNav from './AdminNav';
import { removeResponse } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — LYST / 06', robots: { index: false } };

const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' });

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/login');

  const rows = await listResponses();
  const accepted = rows.filter((r) => r.attending === 'accept');
  const declined = rows.length - accepted.length;
  const seats = accepted.reduce((n, r) => n + 1 + r.companions.length, 0);

  return (
    <main className="admin">
      <AdminNav current="/admin" title="RSVP responses" />

      <dl className="admin__stats">
        <div><dt>Responses</dt><dd>{rows.length}</dd></div>
        <div><dt>Accepted</dt><dd>{accepted.length}</dd></div>
        <div><dt>Declined</dt><dd>{declined}</dd></div>
        <div><dt>Seats (incl. companions)</dt><dd>{seats}</dd></div>
      </dl>

      {rows.length === 0 ? (
        <p className="admin__empty">No responses yet.</p>
      ) : (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr><th>Received</th><th>Name</th><th>Response</th><th>Companions</th><th>Menu</th><th>Dietary / access</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{fmt.format(new Date(r.createdAt))}</td>
                  <td>{r.name}</td>
                  <td><span className={`admin__tag admin__tag--${r.attending}`}>{r.attending === 'accept' ? 'Accepted' : 'Declined'}</span></td>
                  <td>{r.companions.join(', ') || '—'}</td>
                  <td>{r.menu || '—'}</td>
                  <td>{r.notes || '—'}</td>
                  <td>
                    <form action={removeResponse}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="admin__ghost" type="submit" aria-label={`Delete response from ${r.name}`}>Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
