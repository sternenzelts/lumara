import type { Attendance, CheckInSummary, Fragment, FragmentCategory, PeerResult, PeerScores, Player, Session, Settings, UserId, Vote, Vow } from '../backend/types';
import { CATEGORIES } from '../data/categories';
import { voyageStarlight } from './index';

/** Thoughts with their vote counts: most votes first, then the older thought first. */
export function rankByVotes(fragments: Fragment[], votes: Vote[]): { fragment: Fragment; votes: number }[] {
  return fragments.map(fragment => ({ fragment, votes: votes.filter(v => v.fragmentId === fragment.id).length }))
    .sort((a, b) => b.votes - a.votes || a.fragment.createdAt - b.fragment.createdAt);
}
/** Promises kept at a voyage's Sanctuary Gate: the voyage just before it, its vows now fulfilled. */
export function promisesKept(session: Session, sessions: Session[], vows: Vow[]): number {
  const before = sessions.filter(s => s.createdAt < session.createdAt).sort((a, b) => b.createdAt - a.createdAt)[0];
  return before ? vows.filter(v => v.sessionId === before.id && v.status === 'fulfilled').length : 0;
}
/** Party Portrait rows: 1–5 in one row, 6–10 in two, then rows of 6. */
export function portraitGroups<T>(items: T[]): T[][] {
  const sizes = items.length <= 5 ? [items.length] : items.length <= 10 ? [Math.ceil(items.length / 2), Math.floor(items.length / 2)] : Array.from({ length: Math.ceil(items.length / 6) }, () => 6);
  let at = 0; return sizes.map(n => items.slice(at, at += n)).filter(r => r.length);
}
export interface PortraitMember { userId: UserId; name: string; characterId: string | null; warden: boolean }
export interface VoyageReport {
  sprintName: string; date: number; portrait: PortraitMember[];
  numbers: { thoughts: number; votes: number; vows: number; promisesKept: number; /** The viewer's own; null when they weren't in the party. */ myStarlight: number | null };
  checkIn: CheckInSummary | null;
  peer: { userId: UserId; name: string; raters: number; pct: PeerScores }[];
  thoughts: { category: FragmentCategory; label: string; plain: string; items: { text: string; votes: number }[] }[];
  vows: { text: string; owner: string }[];
}
export interface ReportInput {
  session: Session; sessions: Session[]; viewerId: UserId; /** Warden of this voyage, or an admin. */ viewerSeesAll: boolean;
  attendance: Attendance[]; players: Player[]; profiles: Record<string, { name: string }>;
  fragments: Fragment[]; votes: Vote[]; vows: Vow[]; settings: Settings; checkIn: CheckInSummary | null; peer: PeerResult[];
}
/** Everything the Homecoming report, Archives and the saved image show — one model, so they always match. */
export function buildReport(i: ReportInput): VoyageReport {
  const party = i.attendance.filter(a => a.sessionId === i.session.id).sort((a, b) => Number(b.userId === i.session.wardenId) - Number(a.userId === i.session.wardenId) || a.joinedAt - b.joinedAt);
  const name = (id: UserId) => i.profiles[id]?.name || 'Warden';
  const kept = promisesKept(i.session, i.sessions, i.vows); const mine = party.find(a => a.userId === i.viewerId);
  const ranked = rankByVotes(i.fragments.filter(f => f.sessionId === i.session.id), i.votes.filter(v => v.sessionId === i.session.id));
  return {
    sprintName: i.session.sprintName, date: i.session.createdAt,
    portrait: party.map(a => ({ userId: a.userId, name: name(a.userId), characterId: a.characterId ?? i.players.find(p => p.userId === a.userId)?.displayCharacterId ?? null, warden: a.userId === i.session.wardenId })),
    numbers: { thoughts: ranked.length, votes: i.votes.filter(v => v.sessionId === i.session.id).length, vows: i.vows.filter(v => v.sessionId === i.session.id).length, promisesKept: kept, myStarlight: mine ? voyageStarlight({ settings: i.settings, attendance: mine, promisesKept: kept }) : null },
    checkIn: i.checkIn,
    peer: i.peer.filter(p => party.some(a => a.userId === p.targetId) && (i.viewerSeesAll || p.targetId === i.viewerId)).map(p => ({ userId: p.targetId, name: name(p.targetId), raters: p.raters, pct: p.pct })),
    thoughts: CATEGORIES.map(c => ({ category: c.id, label: c.label, plain: c.plain, items: ranked.filter(r => r.fragment.category === c.id).map(r => ({ text: r.fragment.text, votes: r.votes })) })).filter(g => g.items.length),
    vows: i.vows.filter(v => v.sessionId === i.session.id).map(v => ({ text: v.text, owner: v.ownerId ? name(v.ownerId) : 'Shared by the team' })),
  };
}
