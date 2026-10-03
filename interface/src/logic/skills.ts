import type { Skill } from '../data/kits';

/** When each skill was last cast (ms timestamps), for this player. Saved in this browser so a refresh keeps cooldowns. */
export type SkillState = Record<string, number>;
export const emptySkillState = (): SkillState => ({});
/** Admin setting: normal cooldowns, half, or none at all (none also lifts once-per-voyage ultimates). */
export type CooldownMode = 'normal' | 'half' | 'none';
const stateKey = (characterId: string) => `lumara.cooldowns.${characterId}`;
export function loadSkillState(characterId: string): SkillState {
  try { const raw = localStorage.getItem(stateKey(characterId)); return raw ? JSON.parse(raw) as SkillState : {}; } catch { return {}; }
}
const saveSkillState = (characterId: string, state: SkillState) => { try { localStorage.setItem(stateKey(characterId), JSON.stringify(state)); } catch { /* storage off: this tab only */ } };
const scaled = (ms: number, mode: CooldownMode) => mode === 'half' ? ms / 2 : ms;

const ultimateKey = (sessionId: string, characterId: string, skillId: string) => `lumara.ultimate.${sessionId}.${characterId}.${skillId}`;
const ultimateUsed = (sessionId: string, characterId: string, skillId: string) => {
  try { return localStorage.getItem(ultimateKey(sessionId, characterId, skillId)) === '1'; } catch { return false; }
};

export function canCast(skill: Skill, state: SkillState, now: number, sessionId: string, characterId: string, mode: CooldownMode = 'normal'): boolean {
  if (mode === 'none') return true;
  if (skill.cooldownMs === 'voyage') return !(skill.id in state) && !ultimateUsed(sessionId, characterId, skill.id);
  const last = state[skill.id];
  return last === undefined || now - last >= scaled(skill.cooldownMs, mode);
}

export function cast(skill: Skill, state: SkillState, now: number, sessionId: string, characterId: string): SkillState {
  if (skill.cooldownMs === 'voyage') { try { localStorage.setItem(ultimateKey(sessionId, characterId, skill.id), '1'); } catch { /* storage off: per-tab only */ } }
  const next = { ...state, [skill.id]: now }; saveSkillState(characterId, next); return next;
}

/** 0 = ready, 1 = just cast / used for this voyage; drives the cooldown sweep. */
export function cooldownLeft(skill: Skill, state: SkillState, now: number, sessionId: string, characterId: string, mode: CooldownMode = 'normal'): number {
  if (mode === 'none') return 0;
  if (skill.cooldownMs === 'voyage') return canCast(skill, state, now, sessionId, characterId) ? 0 : 1;
  const last = state[skill.id];
  return last === undefined ? 0 : Math.max(0, Math.min(1, 1 - (now - last) / scaled(skill.cooldownMs, mode)));
}
