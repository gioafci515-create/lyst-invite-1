import { redirect } from 'next/navigation';
import { isAdmin } from '../../../lib/auth';
import { listItems } from '../../../lib/store';
import AdminNav from '../AdminNav';
import { answerQuestion, removeLetter, removeMoment, removeQuestion, toggleMomentHidden } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Guest content — LYST admin', robots: { index: false } };

const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Paris' });

function Preview({ m }) {
  const src = `/api/media/${m.id}`;
  if (m.kind === 'photo') return <img src={src} alt="" loading="lazy" />;
  if (m.kind === 'video') return <video src={src} controls preload="metadata" />;
  return <audio src={src} controls preload="none" />;
}

export default async function ContentPage() {
  if (!(await isAdmin())) redirect('/admin/login');
  const [moments, letters, questions, votes] = await Promise.all([
    listItems('moments'), listItems('letters'), listItems('questions'), listItems('votes'),
  ]);

  return (
    <main className="admin">
      <AdminNav current="/admin/content" title="Guest content" />

      <section className="admin__section" aria-labelledby="m-h">
        <h2 id="m-h">Moments <span>{moments.length}</span></h2>
        {moments.length === 0 ? <p className="admin__empty">Nothing uploaded yet.</p> : (
          <ul className="admin__media">
            {moments.map((m) => (
              <li key={m.id} className={m.hidden ? 'is-hidden' : undefined}>
                <Preview m={m} />
                <p><strong>{m.guest}</strong> · {m.kind}{m.tag ? ` · ${m.tag}` : ''}<br />{fmt.format(new Date(m.createdAt))}{m.hidden ? ' · hidden' : ''}</p>
                <div className="admin__actions">
                  <form action={toggleMomentHidden}><input type="hidden" name="id" value={m.id} /><button className="admin__ghost" type="submit">{m.hidden ? 'Show' : 'Hide'}</button></form>
                  <form action={removeMoment}><input type="hidden" name="id" value={m.id} /><button className="admin__ghost" type="submit">Delete</button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin__section" aria-labelledby="l-h">
        <h2 id="l-h">Letters <span>{letters.length}</span></h2>
        {letters.length === 0 ? <p className="admin__empty">No letters yet.</p> : (
          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead><tr><th>Received</th><th>From</th><th>Type</th><th>Reveal</th><th>Message</th><th /></tr></thead>
              <tbody>
                {letters.map((l) => (
                  <tr key={l.id}>
                    <td>{fmt.format(new Date(l.createdAt))}</td>
                    <td>{l.guest}{l.anonymous ? ' (anonymous)' : ''}</td>
                    <td>{l.type === 'later' ? 'For later' : 'To the room'}</td>
                    <td>{l.revealOn || '—'}</td>
                    <td className="admin__wrap">{l.message}{l.photo && <><br /><a href={`/api/media/${l.photo}`} target="_blank" rel="noopener noreferrer">Photo</a></>}</td>
                    <td><form action={removeLetter}><input type="hidden" name="id" value={l.id} /><button className="admin__ghost" type="submit">Delete</button></form></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin__section" aria-labelledby="q-h">
        <h2 id="q-h">Questions for the hosts <span>{questions.length}</span></h2>
        {questions.length === 0 ? <p className="admin__empty">No questions yet.</p> : (
          <ul className="admin__list">
            {questions.map((q) => (
              <li key={q.id}>
                <p><strong>{q.guest}</strong> · {fmt.format(new Date(q.createdAt))}{q.revealLater ? ' · reveal later' : ''}</p>
                <p>{q.question}</p>
                <form action={answerQuestion} className="admin__inline">
                  <input type="hidden" name="id" value={q.id} />
                  <input name="answer" defaultValue={q.answer} placeholder="Host answer" maxLength={2000} />
                  <button className="pill" type="submit">Save answer</button>
                </form>
                <form action={removeQuestion}><input type="hidden" name="id" value={q.id} /><button className="admin__ghost" type="submit">Delete</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin__section" aria-labelledby="v-h">
        <h2 id="v-h">Poll votes <span>{votes.length}</span></h2>
        {votes.length === 0 ? <p className="admin__empty">No votes yet.</p> : (
          <ul className="admin__list">
            {Object.entries(votes.reduce((acc, v) => ({ ...acc, [v.option]: (acc[v.option] ?? 0) + 1 }), {})).map(([option, n]) => (
              <li key={option}><strong>{option}</strong> — {n} vote{n === 1 ? '' : 's'}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
