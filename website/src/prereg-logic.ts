// Pre-registration, stored in Supabase. The visitor is signed in anonymously; the game reuses that
// sign-in on launch day to claim the reward. The name is also kept in this browser to show "You're registered".
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
const URL = 'https://sllaffecbkuayzjxvqju.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_lkTUNwIvmv7ML5m5EAHH8Q_fV2icc2k';
let client: SupabaseClient | null = null;
const supabase = () => (client ??= createClient(URL, PUBLISHABLE_KEY));

export function savedName(): string | null { try { return localStorage.getItem(KEY); } catch { return null; } }
export async function preregister(raw: string, db: SupabaseClient = supabase()): Promise<string> {
  const name = cleanName(raw);
  const { data } = await db.auth.getSession();
  if (!data.session) {
    const { error } = await db.auth.signInAnonymously();
    if (error) throw new Error('Could not reach the Sanctuary. Please try again.');
  }
  const { error } = await db.rpc('preregister', { p_name: name });
  if (error) throw new Error(error.message);
  try { localStorage.setItem(KEY, name); } catch { /* private mode */ }
  return name;
}
export async function waitingCount(db: SupabaseClient = supabase()): Promise<number> {
  const { data, error } = await db.rpc('prereg_count');
  return error ? 0 : (data as number);
}
