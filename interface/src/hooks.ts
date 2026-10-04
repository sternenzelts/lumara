import { useEffect, useState } from 'react';
import type { Unsubscribe } from './backend/types';

export function useWatch<T>(subscribe: (cb: (value: T) => void) => Unsubscribe, initial: T, dependencies: unknown[]) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setValue(initial); setError(null);
    try { return subscribe(setValue); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load this data. Try refreshing.'); }
    // The supplied dependencies explicitly identify the watched backend and document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  return [value, error] as const;
}
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => { const query = matchMedia('(prefers-reduced-motion: reduce)'); const fn = () => setReduced(query.matches); query.addEventListener('change', fn); return () => query.removeEventListener('change', fn); }, []);
  return reduced;
}

/** Wish reveals draw on a canvas with the Web Animations API. Skip straight to the result only when the browser can't do that
 *  (never because of a 'reduce motion' setting: the reveal is the heart of a wish). */
let revealSupport: boolean | null = null;
export function canPlayReveal(): boolean {
  if (revealSupport !== null) return revealSupport;
  try {
    const canvas = document.createElement('canvas');
    revealSupport = typeof canvas.animate === 'function' && !!canvas.getContext('2d');
  } catch { revealSupport = false; }
  return revealSupport;
}
