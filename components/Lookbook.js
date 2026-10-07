'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SLIDES = [
  ['/assets/gallery-1.png', 'Silver hardware detail on black fabric'],
  ['/assets/gallery-2.png', 'Model walking the runway in front of seated guests'],
  ['/assets/gallery-3.png', 'Fragrance bottle lit in yellow-green light'],
  ['/assets/story-mobile.png', 'Model crossing the runway beside seated guests'],
  ['/assets/runway-desktop.png', 'Model in sculptural black garment on the Maison AER runway'],
];

const pad = (n) => String(n).padStart(2, '0');

/** Scroll-snap carousel: swipe/drag, arrow buttons, arrow keys and clickable dots. */
export default function Lookbook() {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [stops, setStops] = useState(SLIDES.length);

  // One "stop" per scroll position, so dots match what the viewport can actually reach.
  const measure = useCallback(() => {
    const el = trackRef.current;
    const first = el?.children[0];
    if (!el || !first) return;
    const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || '0');
    const max = el.scrollWidth - el.clientWidth;
    setStops(Math.max(1, Math.round(max / step) + 1));
    setIndex(Math.min(Math.round(el.scrollLeft / step), Math.round(max / step)));
  }, []);

  useEffect(() => {
    measure();
    const el = trackRef.current;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const stepWidth = () => {
    const el = trackRef.current;
    return el.children[0].getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || '0');
  };

  const goTo = (i) => {
    const el = trackRef.current;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    el.scrollTo({ left: Math.max(0, Math.min(i, stops - 1)) * stepWidth(), behavior });
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(index + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(index - 1); }
    if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    if (e.key === 'End') { e.preventDefault(); goTo(stops - 1); }
  };

  return (
    <div className="lookbook" role="region" aria-roledescription="carousel" aria-label="Lookbook">
      <div className="lookbook__stage">
        <button type="button" className="lookbook__arrow lookbook__arrow--prev" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous images">←</button>
        <ul className="lookbook__track" ref={trackRef} tabIndex={0} onScroll={measure} onKeyDown={onKeyDown} aria-label="Lookbook images, use arrow keys to move">
          {SLIDES.map(([src, alt], i) => (
            <li key={src} aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`}>
              <img src={src} alt={alt} loading={i < 3 ? 'eager' : 'lazy'} draggable={false} />
            </li>
          ))}
        </ul>
        <button type="button" className="lookbook__arrow lookbook__arrow--next" onClick={() => goTo(index + 1)} disabled={index >= stops - 1} aria-label="Next images">→</button>
      </div>

      <div className="storyboard">
        <p className="storyboard__cue">Frame {pad(index + 1)}—{pad(SLIDES.length)} · images cut on scroll</p>
        <div className="lookbook__dots" role="group" aria-label="Choose position">
          {Array.from({ length: stops }, (_, i) => (
            <button key={i} type="button" className={i === index ? 'is-on' : undefined} onClick={() => goTo(i)} aria-label={`Go to position ${i + 1}`} aria-current={i === index ? 'true' : undefined} />
          ))}
        </div>
      </div>
    </div>
  );
}
