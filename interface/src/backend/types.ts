export type UserId = string;
export type Unsubscribe = () => void;
export interface Me { id: UserId; name: string; isAdmin: boolean }
export type Stage = 'register' | 'opening_pull' | 'vow_review' | 'fragment_drop' | 'vote' | 'hall' | 'vow_altar' | 'rewards' | 'completed';
/** Resonance Hall speaker turns (feature 3). */
export interface SpeakerState { currentId: UserId | null; spoken: UserId[]; skipped: UserId[] }
export interface Session {
  id: string; sprintName: string; stage: Stage; status: 'active' | 'paused' | 'ended';
  wardenId: UserId; currentFragmentId: string | null; timerEndsAt: number | null; createdAt: number;
  /** Warden: while on, nobody new can join (members can still re-enter). */ partyLocked: boolean; speaker: SpeakerState | null;
}
export type FragmentCategory = 'radiance' | 'fracture' | 'spark' | 'wildcard';
export interface Fragment { id: string; sessionId: string; text: string; category: FragmentCategory; createdAt: number }
export interface Vote { id: string; sessionId: string; fragmentId: string }
export interface Attendance { userId: UserId; sessionId: string; joinedAt: number; votesCast: number; characterId: string | null }
export type VowStatus = 'open' | 'fulfilled' | 'not_yet' | 'carried' | 'dropped';
export interface Vow { id: string; sessionId: string; text: string; ownerId: UserId | null; status: VowStatus; createdAt: number }
export type Grade = 'S++' | 'S+' | 'A';
export interface PullRecord { at: number; characterId: string; grade: Grade; source: 'opening' | 'banner' | 'exchange' | 'welcome'; duplicate: boolean; /** Voyage the free wish was claimed in. */ sessionId?: string }
export type Currency = 'starlight' | 'stardust';
export interface CurrencyGrant { id: string; currency: Currency; amount: number; byUserId: UserId; at: number }
export interface Player { userId: UserId; displayCharacterId: string | null; owned: Record<string, number>; pulls: PullRecord[]; nickname: string | null; introSeen: boolean; currencyGrants?: CurrencyGrant[] }
export interface Settings {
  pullMode: 'fresh' | 'keep' | 'choose'; rates: { sPlusPlus: number; sPlus: number };
  pity: { enabled: boolean; sPlus: number; sPlusPlus: number }; featuredCharacterId: string; movement: boolean; skipVowReview: boolean;
  /** Admin: skill cooldowns for everyone. Missing on settings saved before this existed = 'normal'. */
  skillCooldown?: 'normal' | 'half' | 'none';
  starlight: { start: number; attend: number; perVote: number; perVow: number; pullCost: number };
  stardust: { dupeA: number; dupeSPlus: number; dupeSPlusPlus: number; costA: number; costSPlus: number; costSPlusPlus: number };
}
export interface Presence { name?: string; idle?: boolean; x: number; y: number; facing: 'left' | 'right'; characterId: string | null; moving: boolean; dir?: 'down' | 'right' | 'up' | 'left' }
export type CueTopic = 'pull_reveal' | 'reaction' | 'stage_cue' | 'skill' | 'say';
export interface Backend {
  mode: 'artifact' | 'local';
  me(): Promise<Me>;
  profiles(ids: UserId[]): Promise<Record<UserId, { name: string }>>;
  createSession(sprintName: string): Promise<Session>;
  watchActiveSession(cb: (s: Session | null) => void): Unsubscribe;
  watchSessions(cb: (all: Session[]) => void): Unsubscribe;
  updateSession(id: string, patch: Partial<Omit<Session, 'id'>>): Promise<void>;
  /** Warden/admin: delete the voyage and everything in it (thoughts, votes, vows, attendance, its free wishes), as if it never happened. */
  cancelSession(id: string): Promise<void>;
  join(sessionId: string): Promise<void>;
  /** Warden/admin: take a player out of the party (attendance only; anonymous thoughts and votes stay). */
  removePlayer(sessionId: string, userId: UserId): Promise<void>;
  setMyCharacter(sessionId: string, characterId: string): Promise<void>;
  watchAttendance(sessionId: string, cb: (a: Attendance[]) => void): Unsubscribe;
  addFragment(sessionId: string, text: string, category: FragmentCategory): Promise<Fragment>;
  deleteMyFragment(sessionId: string, fragmentId: string): Promise<void>;
  myFragmentIds(sessionId: string): Promise<string[]>;
  watchFragments(sessionId: string, cb: (f: Fragment[]) => void): Unsubscribe;
  castVote(sessionId: string, fragmentId: string): Promise<void>;
  removeMyVote(sessionId: string, fragmentId: string): Promise<void>;
  myVotes(sessionId: string): Promise<string[]>;
  watchVotes(sessionId: string, cb: (v: Vote[]) => void): Unsubscribe;
  watchVows(cb: (v: Vow[]) => void): Unsubscribe;
  addVow(sessionId: string, text: string, ownerId: UserId | null): Promise<Vow>;
  updateVow(id: string, patch: Partial<Pick<Vow, 'text' | 'ownerId' | 'status'>>): Promise<void>;
  watchPlayer(userId: UserId, cb: (p: Player | null) => void): Unsubscribe;
  watchPlayers(cb: (p: Player[]) => void): Unsubscribe;
  grantCurrency(userId: UserId, currency: Currency, amount: number): Promise<void>;
  appendMyPull(record: PullRecord): Promise<void>;
  setMyDisplayCharacter(characterId: string): Promise<void>;
  /**
   * Opening contract (App decides "new player vs returning" from the FIRST watchPlayer callback):
   * - watchPlayer must not emit a provisional null — only null when the record truly does not exist.
   * - Records saved before these fields existed must read as nickname: null, introSeen: false.
   * - setMyNickname creates the caller's record if missing, applies logic/names cleanNickname, rejects with its error.
   * - markIntroSeen creates the record if missing and is safe to call twice.
   */
  setMyNickname(nickname: string): Promise<void>;
  markIntroSeen(): Promise<void>;
  watchSettings(cb: (s: Settings) => void): Unsubscribe;
  saveSettings(s: Settings): Promise<void>;
  emit(topic: CueTopic, data: unknown): void;
  on(topic: CueTopic, cb: (data: unknown, from: UserId) => void): Unsubscribe;
  setPresence(p: Presence): void;
  onPeers(cb: (peers: Record<UserId, Presence>) => void): Unsubscribe;
}
