import type { Fragment, SpeakerState, UserId } from '../backend/types';

export const NO_SPEAKER: SpeakerState = { currentId: null, spoken: [], skipped: [], thoughtId: null, phase: null, discussed: [] };
export type SpeakerMark = 'speaking' | 'spoken' | 'skipped' | 'waiting';
export function speakerMark(s: SpeakerState | null, id: UserId): SpeakerMark {
  return s?.currentId === id ? 'speaking' : s?.spoken.includes(id) ? 'spoken' : s?.skipped.includes(id) ? 'skipped' : 'waiting';
}
/** Who a spin can pick: current party members who haven't spoken, aren't skipped, and aren't speaking now. */
export const speakerPool = (party: UserId[], s: SpeakerState | null) => party.filter(id => speakerMark(s, id) === 'waiting');
/** Spin (or "Spin again" while the chosen player is still choosing): a waiting player starts choosing. Null when nobody is left. */
export function spinSpeaker(party: UserId[], s: SpeakerState | null, rng = Math.random): SpeakerState | null {
  const pool = speakerPool(party, s); if (!pool.length) return null;
  return { ...(s ?? NO_SPEAKER), currentId: pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))], thoughtId: null, phase: 'choosing' };
}
/** "Done discussing": the Warden's Vow box opens. */
export const startVow = (s: SpeakerState): SpeakerState => ({ ...s, phase: 'vow' });
/** "Make Vow" or "Skip": the turn ends — the speaker has spoken and their thought is discussed. */
export function finishTurn(s: SpeakerState | null): SpeakerState {
  const b = s ?? NO_SPEAKER; if (!b.currentId) return b;
  return { currentId: null, spoken: [...b.spoken, b.currentId], skipped: b.skipped, thoughtId: null, phase: null,
    discussed: b.thoughtId && !b.discussed.includes(b.thoughtId) ? [...b.discussed, b.thoughtId] : b.discussed };
}
/** "Skip": take an absent player out of the pool (ends their turn, thought and all, if they were chosen). */
export function skipSpeaker(s: SpeakerState | null, id: UserId): SpeakerState {
  const b = s ?? NO_SPEAKER; const cur = b.currentId === id;
  return { ...b, currentId: cur ? null : b.currentId, thoughtId: cur ? null : b.thoughtId, phase: cur ? null : b.phase, skipped: b.skipped.includes(id) ? b.skipped : [...b.skipped, id] };
}
export const addBack = (s: SpeakerState | null, id: UserId): SpeakerState => { const b = s ?? NO_SPEAKER; return { ...b, skipped: b.skipped.filter(x => x !== id) }; };
/** "Spoken N · Remaining M" over the current party (speaking now counts as remaining). */
export function speakerCounts(party: UserId[], s: SpeakerState | null) {
  const marks = party.map(id => speakerMark(s, id));
  return { spoken: marks.filter(m => m === 'spoken').length, remaining: marks.filter(m => m === 'waiting' || m === 'speaking').length };
}
/** Portraits the roulette shows on every screen, ending on the pick. */
export function reelFrames(party: UserId[], pickedId: UserId, rng = Math.random, length = 14): UserId[] {
  return [...Array.from({ length: length - 1 }, () => party[Math.min(party.length - 1, Math.floor(rng() * party.length))]), pickedId];
}
/** What the chosen player may choose: their own undiscussed picks, or every undiscussed thought when none are left. Oldest first — no counts, no ranking. */
export function turnChoices(fragments: Fragment[], ownPicks: string[], discussed: string[]): Fragment[] {
  const open = fragments.filter(f => !discussed.includes(f.id)).sort((a, b) => a.createdAt - b.createdAt);
  const mine = open.filter(f => ownPicks.includes(f.id));
  return mine.length ? mine : open;
}
