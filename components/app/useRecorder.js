'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const pickMime = (candidates) =>
  typeof MediaRecorder === 'undefined' ? '' : candidates.find((t) => MediaRecorder.isTypeSupported(t)) || '';

/**
 * MediaRecorder wrapper for voice/video capture.
 * status: idle | recording | paused | recorded | denied | unsupported
 */
export default function useRecorder({ video = false, maxSeconds = 120 }) {
  const [status, setStatus] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null); // { blob, url, mime }
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedRef = useRef(0);
  const elapsedRef = useRef(0);
  const cancelledRef = useRef(false);
  const [stream, setStream] = useState(null);

  const clearTimer = () => { clearInterval(timerRef.current); timerRef.current = null; };
  const release = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const tick = useCallback(() => {
    timerRef.current = setInterval(() => {
      const s = Math.floor((elapsedRef.current + Date.now() - startedRef.current) / 1000);
      setSeconds(s);
      if (s >= maxSeconds && recRef.current?.state !== 'inactive') recRef.current.stop();
    }, 250);
  }, [maxSeconds]);

  const discard = useCallback(() => {
    setResult((r) => { if (r) URL.revokeObjectURL(r.url); return null; });
    setSeconds(0);
    setStatus('idle');
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return setStatus('unsupported');
    discard();
    try {
      const s = await navigator.mediaDevices.getUserMedia(video ? { video: { facingMode: 'user' }, audio: true } : { audio: true });
      streamRef.current = s;
      setStream(s);
      const mimeType = pickMime(video ? ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'] : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']);
      const rec = new MediaRecorder(s, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      cancelledRef.current = false;
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        clearTimer();
        release();
        if (cancelledRef.current) return;
        const mime = rec.mimeType || mimeType || (video ? 'video/webm' : 'audio/webm');
        const blob = new Blob(chunksRef.current, { type: mime });
        setResult({ blob, url: URL.createObjectURL(blob), mime });
        setStatus('recorded');
      };
      recRef.current = rec;
      elapsedRef.current = 0;
      startedRef.current = Date.now();
      setSeconds(0);
      rec.start(500);
      setStatus('recording');
      tick();
    } catch {
      setStatus('denied');
    }
  }, [video, discard, release, tick]);

  const pause = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (rec.state === 'recording') {
      rec.pause();
      elapsedRef.current += Date.now() - startedRef.current;
      clearTimer();
      setStatus('paused');
    } else if (rec.state === 'paused') {
      rec.resume();
      startedRef.current = Date.now();
      tick();
      setStatus('recording');
    }
  }, [tick]);

  const stop = useCallback(() => { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop(); }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
    clearTimer();
    release();
    setSeconds(0);
    setStatus('idle');
  }, [release]);

  useEffect(() => () => { cancelledRef.current = true; clearTimer(); streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  return { status, seconds, result, stream, start, pause, stop, cancel, discard };
}

export const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
