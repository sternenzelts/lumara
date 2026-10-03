import type { Player } from '../backend/types';

export const WELCOME_ROLLS = 5;

/** Persist the gift in pull history so reloading or another tab cannot grant it again. */
export function welcomeRollsRemaining(player: Player | null): number {
  const claimed = player?.pulls.filter(p => p.source === 'welcome').length || 0;
  if (claimed) return Math.max(0, WELCOME_ROLLS - claimed);
  // Existing players keep their progress; the gift is for first-time players only.
  if (player && (player.pulls.length || Object.values(player.owned).some(n => n > 0))) return 0;
  return WELCOME_ROLLS;
}
