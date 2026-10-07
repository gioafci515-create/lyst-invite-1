'use client';

import { useRef, useState } from 'react';
import AppShell, { GuestCard } from './AppShell';
import { api, postJson, uploadMoment, useApi, useGuest } from '../../lib/client';

const CHALLENGES = [
  'Find the oldest friendship in the room and capture their hands.',
  'Photograph the best detail on the table.',
  'Catch someone mid-laugh.',
  'Capture the room from the highest point you can find.',
];

export default function InteractScreen() {
  const { guest } = useGuest();
  const enc = encodeURIComponent(guest);
  const [event] = useApi('/api/event', { every: 15000 });
  const [poll, reloadPoll] = useApi(`/api/poll?guest=${enc}`, { every: 10000 });
  const [mine, reloadMine] = useApi(`/api/moments?guest=${enc}`);
  const [anonymous, setAnonymous] = useState(false);
  const [letter, setLetter] = useState('');
  const [question, setQuestion] = useState('');
  const [revealLater, setRevealLater] = useState(true);
  const [flash, setFlash] = useState({ letter: '', question: '', challenge: '', poll: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');
  const fileRef = useRef(null);

  const done = new Set(mine?.mine.challenges ?? []);
  const completed = CHALLENGES.filter((_, i) => done.has(`challenge:${i}`)).length;
  const nextIdx = CHALLENGES.findIndex((_, i) => !done.has(`challenge:${i}`));
  const pct = Math.round((completed / CHALLENGES.length) * 100);
  const closed = event && !event.submissionsOpen;

  const run = async (key, fn, ok) => {
    if (!guest) return setErrors((e) => ({ ...e, [key]: 'Please enter your name first.' }));
    setBusy(key);
    setErrors((e) => ({ ...e, [key]: '' }));
    try {
      await fn();
      setFlash((f) => ({ ...f, [key]: ok }));
    } catch (e) {
      setErrors((x) => ({ ...x, [key]: e.message }));
    } finally {
      setBusy('');
    }
  };

  const submitLetter = () =>
    run('letter', async () => {
      const form = new FormData();
      form.set('type', 'room');
      form.set('guest', guest);
      form.set('message', letter);
      if (anonymous) form.set('anonymous', '1');
      await api('/api/letters', { method: 'POST', body: form });
      setLetter('');
    }, 'Letter sealed for the future reveal.');

  const sendQuestion = () =>
    run('question', async () => {
      await postJson('/api/questions', { guest, question, revealLater });
      setQuestion('');
    }, 'Question sent to the hosts.');

  const vote = (option) => run('poll', async () => { await postJson('/api/poll', { guest, option }); reloadPoll(); }, 'Vote recorded.');

  const onChallengePhoto = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || nextIdx === -1) return;
    run('challenge', async () => { await uploadMoment({ file, kind: 'photo', guest, tag: `challenge:${nextIdx}` }); reloadMine(); }, 'Photo submitted.');
  };

  return (
    <AppShell
      title="Event Interaction Hub"
      actions={{ src: '/assets/app/actions-interact.svg' }}
      active="participate"
      tone="dark"
      cta={{ label: busy === 'letter' ? 'Sending…' : 'Submit to live room', onClick: submitLetter, disabled: !!busy || closed }}
    >
      <GuestCard />

      <div className="ev-card ev-card--accent">
        <div className="ev-between"><strong className="ev-upper">Host announcement · priority</strong><span>Now</span></div>
        <span className="ev-serif ev-serif--sm">{event?.announcement ?? '…'}</span>
      </div>

      <section className="ev-card" aria-labelledby="letters-h">
        <div className="ev-between">
          <h2 id="letters-h" className="ev-serif ev-serif--sm">Letters from the room</h2>
          <div className="ev-chips">
            <button type="button" className={`ev-chip${!anonymous ? ' ev-chip--dark' : ''}`} aria-pressed={!anonymous} onClick={() => setAnonymous(false)}>Named</button>
            <button type="button" className={`ev-chip${anonymous ? ' ev-chip--dark' : ''}`} aria-pressed={anonymous} onClick={() => setAnonymous(true)}>Anonymous</button>
          </div>
        </div>
        <label className="ev-card ev-field-card ev-field-card--tall">
          <span className="ev-label">Letter</span>
          <textarea className="ev-input ev-textarea" value={letter} onChange={(e) => setLetter(e.target.value)} rows={3} maxLength={4000} placeholder="Write a long-form note for the room." />
        </label>
        <div className="ev-between">
          <span className="ev-muted">🔒 Future reveal · 1 year</span>
          <button type="button" className="ev-chip ev-chip--dark" onClick={submitLetter} disabled={!!busy || closed}>Submit letter</button>
        </div>
        {flash.letter && <p className="ev-olive" role="status">{flash.letter}</p>}
        {errors.letter && <p className="ev-error" role="alert">{errors.letter}</p>}
      </section>

      <section className="ev-card" aria-labelledby="hidden-h">
        <div className="ev-between"><h2 id="hidden-h" className="ev-serif ev-serif--sm">Hidden moments</h2><span className="ev-mono ev-olive">{pct}%</span></div>
        <p>{nextIdx === -1 ? 'All hidden moments found.' : CHALLENGES[nextIdx]}</p>
        <div className="ev-progress" style={{ '--p': `${pct}%` }} />
        <div className="ev-between">
          <span className="ev-chip ev-chip--icon"><img src="/assets/app/poll-dot.svg" alt="" width="6" height="6" />{completed} / {CHALLENGES.length} completed</span>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onChallengePhoto} />
          <button type="button" className="ev-chip ev-chip--dark" onClick={() => fileRef.current?.click()} disabled={!!busy || nextIdx === -1 || closed}>Submit photo</button>
        </div>
        {flash.challenge && <p className="ev-olive" role="status">{flash.challenge}</p>}
        {errors.challenge && <p className="ev-error" role="alert">{errors.challenge}</p>}
      </section>

      <section className="ev-card" aria-labelledby="poll-h">
        <p className="ev-inline ev-muted ev-upper"><img src="/assets/app/check-dark.svg" alt="" width="16" height="16" />Live poll · multiple choice{poll?.voted ? ' · voted' : ''}</p>
        <h2 id="poll-h" className="ev-serif ev-serif--sm">{poll?.question ?? '…'}</h2>
        <div className="ev-chips" role="group" aria-label="Poll options">
          {poll?.options.map((o) => (
            <button key={o.label} type="button" className={`ev-chip${poll.voted === o.label ? ' ev-chip--dark' : ''}`} aria-pressed={poll.voted === o.label} onClick={() => vote(o.label)} disabled={!!busy || closed}>
              {o.label}{o.percent !== null ? ` · ${o.percent}%` : ''}
            </button>
          ))}
        </div>
        <p className="ev-muted">{poll?.resultsVisible ? `${poll.total} vote${poll.total === 1 ? '' : 's'} · live result` : 'Results are hidden until the hosts reveal them.'}</p>
        {flash.poll && <p className="ev-olive" role="status">{flash.poll}</p>}
        {errors.poll && <p className="ev-error" role="alert">{errors.poll}</p>}
      </section>

      <section className="ev-card" aria-labelledby="ask-h">
        <label className="ev-card ev-field-card">
          <span id="ask-h" className="ev-label">Ask the hosts</span>
          <input className="ev-input" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={1000} placeholder="Short or long question—hidden until they reveal it." />
        </label>
        <div className="ev-between">
          <button type="button" className={`ev-chip${revealLater ? ' ev-chip--dark' : ''}`} aria-pressed={revealLater} onClick={() => setRevealLater((v) => !v)}>Reveal later</button>
          <button type="button" className="ev-chip" onClick={sendQuestion} disabled={!!busy || closed}>Send question</button>
        </div>
        {flash.question && <p className="ev-olive" role="status">{flash.question}</p>}
        {errors.question && <p className="ev-error" role="alert">{errors.question}</p>}
      </section>

      {closed && <p className="ev-card">Submissions are now closed for this event.</p>}
    </AppShell>
  );
}
