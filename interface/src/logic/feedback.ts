import type { Attendance, CheckIn, CheckInSummary, PeerResult, PeerScores, PeerTrait, UserId } from '../backend/types';

const pct = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 20) : null;

/** Team check-in averages (% of 5) over current party members only. */
export function summarizeCheckIns(rows: CheckIn[], partyIds: UserId[]): CheckInSummary {
  const mine = rows.filter(r => partyIds.includes(r.userId));
  return { sat: pct(mine.map(r => r.sat)), growth: pct(mine.map(r => r.growth)), n: mine.length, of: partyIds.length };
}
/** A peer result shows only when at least this many ratings besides the viewer's own make it up — fewer would let the viewer work out who gave what. The server applies the same rule (0010). */
export const MIN_OTHER_RATERS = 2;
export const anonymousEnough = (otherRaters: number) => otherRaters >= MIN_OTHER_RATERS;
/** Report copy for the peer section (screen and saved image say the same). */
export const peerEmptyText = (viewerSeesAll: boolean) => viewerSeesAll
  ? 'No peer results to show yet. A result appears once 2 allies besides you have rated someone, so nobody can tell who gave what.'
  : 'Your peer feedback appears once at least 2 allies rate you, so nobody can tell who gave what.';
export const PEER_ANON_NOTE = 'Allies rated by fewer than 2 people besides you are hidden, so nobody can tell who gave what.';
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
