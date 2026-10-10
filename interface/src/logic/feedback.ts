import type { Attendance, CheckIn, CheckInSummary, PeerResult, PeerScores, PeerTrait, UserId } from '../backend/types';

const pct = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 20) : null;

/** Team check-in averages (% of 5) over current party members only. */
export function summarizeCheckIns(rows: CheckIn[], partyIds: UserId[]): CheckInSummary {
  const mine = rows.filter(r => partyIds.includes(r.userId));
  return { sat: pct(mine.map(r => r.sat)), growth: pct(mine.map(r => r.growth)), n: mine.length, of: partyIds.length };
}
const TRAITS: PeerTrait[] = ['collab', 'owner', 'comm', 'impact', 'growth'];
/** Per-target averages (% of 5) of the given ratings. */
export function summarizePeers(ratings: { targetId: UserId; scores: PeerScores }[]): PeerResult[] {
  const targets = [...new Set(ratings.map(r => r.targetId))];
  return targets.map(targetId => { const mine = ratings.filter(r => r.targetId === targetId);
    return { targetId, raters: mine.length, pct: Object.fromEntries(TRAITS.map(t => [t, pct(mine.map(r => r.scores[t])) ?? 0])) as PeerScores }; });
}
export const peerDone = (a: Attendance, party: Attendance[]) => a.peerGiven >= party.length - 1;
/** How many players haven't rated every teammate yet. */
export const pendingPeerFeedback = (party: Attendance[]) => party.filter(a => !peerDone(a, party)).length;
/** The Warden's warning on "Finish voyage" (they can still finish). */
export function finishWarningText(peer: number): string | null {
  return peer ? `${peer} ${peer === 1 ? 'player hasn’t' : 'players haven’t'} finished peer feedback. Once you finish, nobody can add more.` : null;
}
