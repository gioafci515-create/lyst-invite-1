'use client';

import { useEffect, useState } from 'react';

// The whole experience is one page. Top row = journey stage, bottom row = the sections inside it.
const GROUPS = [
  ['Invite', [['invitation', 'Invitation'], ['story', 'Story'], ['programme', 'Programme']]],
  ['Respond', [['rsvp', 'Request seat'], ['respond', 'Your details']]],
  ['Prepare', [['hub', 'Event hub'], ['updates', 'Updates']]],
  ['Participate', [['camera', 'Camera'], ['guestbook', 'Voice'], ['video', 'Video'], ['interact', 'Live room'], ['gallery', 'Gallery']]],
  ['Remember', [['later', 'Message for later'], ['capsule', 'Time capsule']]],
];

const IDS = GROUPS.flatMap(([, items]) => items.map(([id]) => id));

export default function SiteNav() {
  const [active, setActive] = useState('invitation');

  // Active section = the last one whose top edge has passed ~35% down the viewport.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = IDS[0];
      for (const id of IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) current = id;
      }
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const group = GROUPS.find(([, items]) => items.some(([id]) => id === active)) ?? GROUPS[0];

  // Keep the highlighted chip visible when the row scrolls sideways on phones.
  useEffect(() => {
    document.querySelector('.subnav [aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [active]);

  return (
    <div className="sitenav">
      <header className="nav">
        <a className="nav__mark" href="#top">LYST / 06</a>
        <nav className="nav__links" aria-label="Journey">
          {GROUPS.map(([name, items]) => (
            <a key={name} href={`#${items[0][0]}`} aria-current={group[0] === name ? 'true' : undefined}>{name}</a>
          ))}
        </nav>
        <a className="pill nav__rsvp" href="#rsvp">RSVP</a>
      </header>
      <nav className="subnav" aria-label={`${group[0]} sections`}>
        {group[1].map(([id, label]) => (
          <a key={id} href={`#${id}`} aria-current={active === id ? 'true' : undefined}>{label}</a>
        ))}
      </nav>
    </div>
  );
}
