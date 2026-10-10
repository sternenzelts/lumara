import type { Attendance, CheckIn, PeerResult, CurrencyGrant, Fragment, Player, PullRecord, Session, Settings, Vote, Vow } from './types';
/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;
export const toSession = (r: Row): Session => ({ id: r.id, sprintName: r.sprint_name, stage: r.stage, status: r.status, wardenId: r.warden_id, currentFragmentId: r.current_fragment_id ?? null, timerEndsAt: r.timer_ends_at == null ? null : Number(r.timer_ends_at), createdAt: Number(r.created_at), partyLocked: !!r.party_locked, speaker: r.speaker ? { thoughtId: null, phase: null, discussed: [], ...r.speaker } : null });
export const toAttendance = (r: Row): Attendance => ({ userId: r.user_id, sessionId: r.session_id, joinedAt: Number(r.joined_at), votesCast: r.votes_cast, characterId: r.character_id ?? null, checkinDone: !!r.checkin_done, peerGiven: r.peer_given ?? 0 });
export const toCheckIn = (r: Row): CheckIn => ({ sessionId: r.session_id, userId: r.user_id, sat: r.sat, growth: r.growth });
export const toFragment = (r: Row): Fragment => ({ id: r.id, sessionId: r.session_id, text: r.text, category: r.category, createdAt: Number(r.created_at) });
export const toVote = (r: Row): Vote => ({ id: r.id, sessionId: r.session_id, fragmentId: r.fragment_id });
export const toVow = (r: Row): Vow => ({ id: r.id, sessionId: r.session_id, text: r.text, ownerId: r.owner_id ?? null, status: r.status, createdAt: Number(r.created_at) });
const toPull = (r: Row): PullRecord => ({ characterId: r.character_id, grade: r.grade, source: r.source, duplicate: r.duplicate, at: Number(r.at), ...(r.session_id ? { sessionId: r.session_id } : {}) });
const toGrant = (r: Row): CurrencyGrant => ({ id: r.id, currency: r.currency, amount: r.amount, byUserId: r.by_user_id ?? '', at: Number(r.at) });
export const toPlayer = (r: Row, pulls: Row[], grants: Row[]): Player => ({ userId: r.user_id, nickname: r.nickname ?? null, introSeen: !!r.intro_seen, displayCharacterId: r.display_character_id ?? null, owned: r.owned ?? {}, pulls: pulls.map(toPull), currencyGrants: grants.map(toGrant) });
export const toSettings = (r: Row): Settings => r.data as Settings;
export const toPeerResult = (r: Row): PeerResult => ({ targetId: r.target_id, raters: r.raters, pct: { collab: r.collab, owner: r.owner, comm: r.comm, impact: r.impact, growth: r.growth } });
