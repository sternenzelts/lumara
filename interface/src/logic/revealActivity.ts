let active = 0;
const listeners = new Set<() => void>();
export const isRevealActive = () => active > 0;
export function subscribeRevealActivity(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function beginReveal() {
  active++;
  listeners.forEach(listener => listener());
  let released = false;
  return () => {
    if (released) return;
    released = true;
    active--;
    listeners.forEach(listener => listener());
  };
}
