import type { Player, UserId } from '../backend/types';

export const NICKNAME_MAX = 16;
export const NICKNAME_ERROR = `Choose a name between 1 and ${NICKNAME_MAX} characters.`;

export function cleanNickname(raw: string): string {
  // eslint-disable-next-line no-control-regex
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  const length = [...name].length;
  if (length < 1 || length > NICKNAME_MAX) throw new Error(NICKNAME_ERROR);
  return name;
}

export function withNicknames(profiles: Record<UserId, { name: string }>, players: Player[]): Record<UserId, { name: string; accountName: string }> {
  const merged: Record<UserId, { name: string; accountName: string }> = {};
  for (const [id, profile] of Object.entries(profiles)) merged[id] = { name: profile.name, accountName: profile.name };
  for (const p of players) {
    const accountName = profiles[p.userId]?.name ?? '';
    merged[p.userId] = { name: p.nickname || accountName || 'Teammate', accountName };
  }
  return merged;
}
