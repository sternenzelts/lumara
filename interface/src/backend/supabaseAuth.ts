import type { SupabaseClient } from '@supabase/supabase-js';
import type { Me } from './types';

async function profile(sb: SupabaseClient, id: string): Promise<Me> {
  await sb.rpc('ensure_player');
  await sb.rpc('claim_prereg_reward');   // pre-registered Wardens get 6,000 Starlight on their first game load (once, server-side)
  const { data: rows } = await sb.from('players').select('nickname').eq('user_id', id);
  const { data: isAdmin } = await sb.rpc('is_admin');
  return { id, name: rows?.[0]?.nickname || 'Warden', isAdmin: !!isAdmin };
}
/** Returning visitor: reuse this browser's session. Null when this browser has never started. */
export async function resume(sb: SupabaseClient): Promise<Me | null> {
  const user = (await sb.auth.getSession()).data.session?.user;
  return user ? profile(sb, user.id) : null;
}
/** New visitor pressed Start: create an anonymous player. */
export async function start(sb: SupabaseClient): Promise<Me> {
  const { data, error } = await sb.auth.signInAnonymously();
  if (error || !data.user) throw new Error(error?.message || 'Could not start.');
  return profile(sb, data.user.id);
}
/** Resume, else start. */
export async function connect(sb: SupabaseClient): Promise<Me> { return (await resume(sb)) ?? start(sb); }
