import { BANNER_LINEUPS, FEATURED_SHARE } from '../data/banners';
import type { Attendance, Fragment, Grade, Player, PullRecord, Settings, Stage, UserId, Vote, Vow } from '../backend/types';
import type { CharacterDef } from '../data/characters';
const costFor = (grade: Grade, settings: Settings) => grade === 'S++' ? settings.stardust.costSPlusPlus : grade === 'S+' ? settings.stardust.costSPlus : settings.stardust.costA;
export function pityProgress(history: PullRecord[], _settings: Settings): { sPlus: number; sPlusPlus: number } {
  let sPlus = 0, sPlusPlus = 0;
  for (const pull of history) { if (pull.source === 'exchange') continue; sPlus = pull.grade === 'A' ? sPlus + 1 : 0; sPlusPlus = pull.grade === 'S++' ? 0 : sPlusPlus + 1; }
  return { sPlus, sPlusPlus };
}
export function rollPull({settings,history,roster,owned,bannerId,rng=Math.random}: { settings: Settings; history: PullRecord[]; roster: CharacterDef[]; owned: Record<string, number>; bannerId?: string; rng?: () => number }): { characterId: string; grade: Grade; duplicate: boolean } {
  const progress = pityProgress(history, settings);
  const draw = Math.max(0, Math.min(.999999999, rng()));
  let grade: Grade = draw < settings.rates.sPlusPlus ? 'S++' : draw < settings.rates.sPlusPlus + settings.rates.sPlus ? 'S+' : 'A';
  if (settings.pity.enabled) {
    if (progress.sPlusPlus + 1 >= settings.pity.sPlusPlus) grade = 'S++';
    else if (progress.sPlus + 1 >= settings.pity.sPlus && grade === 'A') grade = 'S+';
  }
  const candidates = roster.filter(c => c.grade === grade);
  if (!candidates.length) throw new Error(`No ${grade} companions are available.`);
  const selection = Math.max(0, Math.min(.999999999, rng()));
  const lineup = BANNER_LINEUPS.find(b => b.featured === bannerId);
  const featuredIds = grade === 'S++' ? [lineup?.featured] : grade === 'S+' ? lineup?.companions || [] : [];
  const featured = candidates.filter(c => featuredIds.includes(c.id));
  const others = candidates.filter(c => !featuredIds.includes(c.id));
  let pool = candidates;
  let position = selection;
  if (featured.length && others.length) {
    pool = selection < FEATURED_SHARE ? featured : others;
    position = selection < FEATURED_SHARE ? selection / FEATURED_SHARE : (selection - FEATURED_SHARE) / (1 - FEATURED_SHARE);
  }
  const character = pool[Math.floor(position * pool.length)];
  return { characterId: character.id, grade: character.grade, duplicate: (owned[character.id] || 0) > 0 };
}
export function starlightBalance({userId,attendance,vows,player,settings}: { userId: UserId; attendance: Attendance[]; vows: Vow[]; player: Player; settings: Settings }): number {
  const mine = attendance.filter(a => a.userId === userId);
  const attended = new Set(mine.map(a => a.sessionId)).size;
  const votes = mine.reduce((n,a) => n + a.votesCast, 0);
  const fulfilled = vows.filter(v => v.status === 'fulfilled').length;
  const paid = player.pulls.filter(p => p.source === 'banner').length;
  const grants = (player.currencyGrants || []).filter(g => g.currency === 'starlight').reduce((n, g) => n + g.amount, 0);
  return Math.max(0, (settings.starlight.start ?? 1200) + grants + settings.starlight.attend * attended + settings.starlight.perVote * votes + settings.starlight.perVow * fulfilled - settings.starlight.pullCost * paid);
}
export function stardustBalance({player,settings}: { player: Player; settings: Settings }): number {
  const grants = (player.currencyGrants || []).filter(g => g.currency === 'stardust').reduce((n, g) => n + g.amount, 0);
  return Math.max(0, grants + player.pulls.reduce((sum,p) => p.source === 'exchange' ? sum - costFor(p.grade,settings) : !p.duplicate ? sum : sum + (p.grade === 'S++' ? settings.stardust.dupeSPlusPlus : p.grade === 'S+' ? settings.stardust.dupeSPlus : settings.stardust.dupeA), 0));
}
export function revealOrder(fragments: Fragment[], _votes: Vote[]): Fragment[] { return [...fragments]; }
export function fragmentGlow(_votes: number, _maxVotes: number): 'gold' | 'purple' | 'blue' { return 'gold'; }
export function nextStage(stage: Stage, settings: Settings, hasPreviousVows: boolean): Stage {
  // The free wish is no longer a stage — it's claimed at Homecoming (rewards).
  const stages: Stage[] = ['register', ...(!settings.skipVowReview && hasPreviousVows ? ['vow_review' as const] : []), 'fragment_drop', 'vote', 'hall', 'vow_altar', 'rewards', 'completed'];
  return stages[stages.indexOf(stage) + 1] || 'completed';
}
/** Starlight one player earned in one voyage: attending, their own votes, and the team's promises kept at its Sanctuary Gate. */
export function voyageStarlight({ settings, attendance, promisesKept }: { settings: Settings; attendance: Attendance | undefined; promisesKept: number }): number {
  return attendance ? settings.starlight.attend + settings.starlight.perVote * attendance.votesCast + settings.starlight.perVow * promisesKept : 0;
}
