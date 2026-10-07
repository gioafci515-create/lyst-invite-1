import { redirect } from 'next/navigation';
import { isAdmin } from '../../../lib/auth';
import { getSettings, listItems } from '../../../lib/store';
import AdminNav from '../AdminNav';
import { postNotification, removeNotification, updateSettings } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Updates & settings — LYST admin', robots: { index: false } };

const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' });

export default async function UpdatesPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  const [s, notes] = await Promise.all([getSettings(), listItems('notifications')]);

  return (
    <main className="admin">
      <AdminNav current="/admin/updates" title="Updates & settings" />

      <section className="admin__section" aria-labelledby="n-h">
        <h2 id="n-h">Send an update</h2>
        <form action={postNotification} className="admin__form">
          <label>Type
            <select name="type" defaultValue="announcement">
              <option value="announcement">Host announcement</option>
              <option value="location">Location change</option>
              <option value="schedule">Schedule change</option>
              <option value="rsvp">RSVP reminder</option>
              <option value="activity">Activity</option>
            </select>
          </label>
          <label>Title<input name="title" required maxLength={120} placeholder="Location change" /></label>
          <label>Message<input name="body" maxLength={500} placeholder="Alma–George V · car desk closes 22:30" /></label>
          <label className="admin__check"><input type="checkbox" name="priority" /> Priority</label>
          <button className="pill" type="submit">Publish</button>
        </form>

        {notes.length > 0 && (
          <ul className="admin__list">
            {notes.map((n) => (
              <li key={n.id}>
                <p><strong>{n.priority ? 'Priority · ' : ''}{n.title}</strong> · {n.type} · {fmt.format(new Date(n.createdAt))}</p>
                <p>{n.body}</p>
                <form action={removeNotification}><input type="hidden" name="id" value={n.id} /><button className="admin__ghost" type="submit">Delete</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin__section" aria-labelledby="s-h">
        <h2 id="s-h">Event settings</h2>
        <form action={updateSettings} className="admin__form">
          <label>Live announcement (hub + interaction hub)<input name="announcement" defaultValue={s.announcement} maxLength={300} /></label>
          <label>RSVP closes (display text)<input name="rsvpClosesAt" defaultValue={s.rsvpClosesAt} maxLength={80} /></label>
          <label>Poll question<input name="pollQuestion" defaultValue={s.pollQuestion} maxLength={200} /></label>
          <label>Poll options (one per line, 2–6)<textarea name="pollOptions" rows={3} defaultValue={s.pollOptions.join('\n')} /></label>
          <label>Capsule name<input name="capsuleName" defaultValue={s.capsuleName} maxLength={120} /></label>
          <label>Capsule unlock (ISO date-time)<input name="capsuleUnlockAt" defaultValue={s.capsuleUnlockAt} maxLength={32} /></label>
          <label className="admin__check"><input type="checkbox" name="submissionsOpen" defaultChecked={s.submissionsOpen} /> Guest submissions open</label>
          <label className="admin__check"><input type="checkbox" name="pollResultsVisible" defaultChecked={s.pollResultsVisible} /> Show poll results to guests</label>
          <label className="admin__check"><input type="checkbox" name="capsuleForceUnlocked" defaultChecked={s.capsuleForceUnlocked} /> Open the capsule now (override date)</label>
          <button className="pill" type="submit">Save settings</button>
        </form>
      </section>
    </main>
  );
}
