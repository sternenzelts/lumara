// Pre-registration. Until the Supabase backend exists (online plan, Task 8) a sign-up is kept in this browser;
// the game will read it on launch day. The Wardens count is a placeholder until then.
export const LAUNCH = new Date('2026-10-16T09:00:00+08:00');
export const REWARD = 6000;
export const MILESTONES = [10, 25, 50];
const KEY = 'lumara.prereg';

export function launchState(now: Date) {
  const ms = Math.max(0, LAUNCH.getTime() - now.getTime());
  return { live: ms === 0, days: Math.floor(ms / 864e5), hours: Math.floor(ms / 36e5) % 24, minutes: Math.floor(ms / 6e4) % 60 };
}
export const milestoneLamps = (count: number) => MILESTONES.filter(m => count >= m).length;

export function cleanName(raw: string): string {
  const name = raw.replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 16) throw new Error('Choose a name between 2 and 16 characters.');
  return name;
}
export function savedName(): string | null { try { return localStorage.getItem(KEY); } catch { return null; } }
export async function preregister(raw: string): Promise<string> {
  const name = cleanName(raw);
  try { localStorage.setItem(KEY, name); } catch { /* private mode: still show success */ }
  return name;
}
export async function waitingCount(): Promise<number> { return savedName() ? 1 : 0; }
