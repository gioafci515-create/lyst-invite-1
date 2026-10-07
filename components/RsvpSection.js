'use client';

import { useState } from 'react';
import RsvpForm from './RsvpForm';

const STEPS = [
  ['default', 'Default state'],
  ['open', 'Hover / open form'],
  ['confirmed', 'Confirmed'],
];

export default function RsvpSection() {
  const [step, setStep] = useState('default');

  return (
    <section className="rsvp" id="rsvp">
      <div className="rsvp__copy">
        <p className="eyebrow eyebrow--olive eyebrow--lg">Your response / private</p>
        <h2 className="rsvp__title">REQUEST SEAT</h2>
        <p className="rsvp__note">
          <span className="only-desktop">Invite 047 / non-transferable. Dietary, access and guest details remain private to the host.</span>
          <span className="only-mobile">Invite 047 / non-transferable. Dietary, access and guest details remain private.</span>
        </p>
        <p className="rsvp__states only-desktop">
          {STEPS.map(([key, label], i) => (
            <span key={key}>
              {i > 0 && '　→　'}
              <span className={step === key ? 'is-current' : undefined}>{label}</span>
            </span>
          ))}
        </p>
      </div>
      <RsvpForm onStep={setStep} />
    </section>
  );
}
