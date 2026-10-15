import type { Fragment, SpeakerState, UserId } from '../backend/types';

export const NO_SPEAKER: SpeakerState = { currentId: null, spoken: [], skipped: [], thoughtId: null, phase: null, discussed: [], turnDone: [] };
export type SpeakerMark = 'speaking' | 'spoken' | 'skipped' | 'waiting';
export function speakerMark(s: SpeakerState | null, id: UserId): SpeakerMark {
  return s?.currentId === id ? 'speaking' : s?.spoken.includes(id) ? 'spoken' : s?.skipped.includes(id) ? 'skipped' : 'waiting';
}
/** Who a spin can pick: current party members who haven't spoken, aren't skipped, and aren't speaking now. */
export const speakerPool = (party: UserId[], s: SpeakerState | null) => party.filter(id => speakerMark(s, id) === 'waiting');
/** Spin (or "Spin again" while the chosen player is still choosing): a waiting player starts choosing. Null when nobody is left. */
export function spinSpeaker(party: UserId[], s: SpeakerState | null, rng = Math.random): SpeakerState | null {
  const pool = speakerPool(party, s); if (!pool.length) return null;
  return { ...(s ?? NO_SPEAKER), currentId: pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))], thoughtId: null, phase: 'choosing', turnDone: [] };
}
/** "Done discussing": the Warden's Vow box opens. */
export const startVow = (s: SpeakerState): SpeakerState => ({ ...s, phase: 'vow' });
const withThought = (list: string[], id: string | null) => id && !list.includes(id) ? [...list, id] : list;
/** "Make Vow" or "Skip": the thought is discussed and the same speaker chooses their next one. */
export function nextThought(s: SpeakerState): SpeakerState {
  return { ...s, thoughtId: null, phase: 'choosing', discussed: withThought(s.discussed, s.thoughtId), turnDone: withThought(s.turnDone ?? [], s.thoughtId) };
}
/** "Finish turn": the speaker has spoken and leaves the spin pool. */
export function finishTurn(s: SpeakerState | null): SpeakerState {
  const b = s ?? NO_SPEAKER; if (!b.currentId) return b;
  return { currentId: null, spoken: [...b.spoken, b.currentId], skipped: b.skipped, thoughtId: null, phase: null, discussed: withThought(b.discussed, b.thoughtId), turnDone: [] };
}
/** "Skip": take an absent player out of the pool (ends their turn, thought and all, if they were chosen). */
export function skipSpeaker(s: SpeakerState | null, id: UserId): SpeakerState {
  const b = s ?? NO_SPEAKER; const cur = b.currentId === id;
  return { ...b, currentId: cur ? null : b.currentId, thoughtId: cur ? null : b.thoughtId, phase: cur ? null : b.phase, turnDone: cur ? [] : b.turnDone, skipped: b.skipped.includes(id) ? b.skipped : [...b.skipped, id] };
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
/** What the chosen player may choose: their own picks not yet discussed this turn, including ones someone else already discussed.
 *  With no picks at all, any undiscussed thought, for their first thought only. Oldest first — no counts, no ranking. */
export function turnChoices(fragments: Fragment[], ownPicks: string[], discussed: string[], turnDone: string[] = []): Fragment[] {
  const all = [...fragments].sort((a, b) => a.createdAt - b.createdAt);
  const mine = all.filter(f => ownPicks.includes(f.id) && !turnDone.includes(f.id));
  return mine.length || turnDone.length ? mine : all.filter(f => !discussed.includes(f.id));
}
