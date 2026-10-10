import type { Attendance } from '../backend/types';

/** Picks each player should make at the Vote stage: 3, or every thought when fewer were written. */
export const minPicks = (thoughts: number) => Math.min(3, thoughts);
/** How many party members picked fewer than the minimum. */
export const underPicked = (party: Attendance[], thoughts: number) => party.filter(a => a.votesCast < minPicks(thoughts)).length;
/** The Warden's warning on Next stage at the Vote stage; null when everyone picked enough. */
export function pickWarningText(under: number, min: number): string | null {
  return under && min ? `${under} ${under === 1 ? 'player' : 'players'} picked fewer than ${min} ${min === 1 ? 'thought' : 'thoughts'}. Continue anyway?` : null;
}
