import type { Skill } from '../data/kits';

/** When each skill was last cast (ms timestamps), for this player in this tab. */
export type SkillState = Record<string, number>;
export const emptySkillState = (): SkillState => ({});

const ultimateKey = (sessionId: string, characterId: string, skillId: string) => `lumara.ultimate.${sessionId}.${characterId}.${skillId}`;
const ultimateUsed = (sessionId: string, characterId: string, skillId: string) => {
  try { return localStorage.getItem(ultimateKey(sessionId, characterId, skillId)) === '1'; } catch { return false; }
};

export function canCast(skill: Skill, state: SkillState, now: number, sessionId: string, characterId: string): boolean {
  if (skill.cooldownMs === 'voyage') return !(skill.id in state) && !ultimateUsed(sessionId, characterId, skill.id);
  const last = state[skill.id];
  return last === undefined || now - last >= skill.cooldownMs;
}

export function cast(skill: Skill, state: SkillState, now: number, sessionId: string, characterId: string): SkillState {
  if (skill.cooldownMs === 'voyage') { try { localStorage.setItem(ultimateKey(sessionId, characterId, skill.id), '1'); } catch { /* storage off: per-tab only */ } }
  return { ...state, [skill.id]: now };
}

/** 0 = ready, 1 = just cast / used for this voyage; drives the cooldown sweep. */
export function cooldownLeft(skill: Skill, state: SkillState, now: number, sessionId: string, characterId: string): number {
  if (skill.cooldownMs === 'voyage') return canCast(skill, state, now, sessionId, characterId) ? 0 : 1;
  const last = state[skill.id];
  return last === undefined ? 0 : Math.max(0, Math.min(1, 1 - (now - last) / skill.cooldownMs));
}
