import type { Player } from '../backend/types';

export const WELCOME_ROLLS = 10;
/** When the gift grew from five wishes to ten (2026-10-15 12:00 +08:00). Players who claimed before it keep the old gift; the server checks the same moment. */
export const WELCOME_TEN_FROM = 1792036800000;

/** Persist the gift in pull history so reloading or another tab cannot grant it again. */
export function welcomeRollsRemaining(player: Player | null): number {
  const welcome = player?.pulls.filter(p => p.source === 'welcome') || [];
  if (welcome.some(p => p.at < WELCOME_TEN_FROM)) return 0;
  if (welcome.length) return Math.max(0, WELCOME_ROLLS - welcome.length);
  // Existing players keep their progress; the gift is for first-time players only.
  if (player && (player.pulls.length || Object.values(player.owned).some(n => n > 0))) return 0;
  return WELCOME_ROLLS;
}
