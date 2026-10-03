import type { SupabaseClient } from '@supabase/supabase-js';
import type { Backend } from './types';
import { createLocalBackend } from './local';

// Integration seam: Claude supplies a Backend before mounting the UI.
// The UI never needs to know how an artifact adapter detects its runtime.
let instance: Backend | null = null;
let booting: Promise<Boot> | null = null;
export function configureBackend(backend: Backend) { instance = backend; booting = null; }
export function getBackend(): Backend { return instance ||= createLocalBackend(); }

const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
let client: SupabaseClient | null = null;
export async function supabaseClient(): Promise<SupabaseClient> {
  const { createClient } = await import('@supabase/supabase-js');
  return client ??= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
}

/** Ready backend, or (online, first visit in this browser) a start() for the Start button. */
export type Boot = { backend: Backend } | { start: () => Promise<Backend> };
/** Runs once per page, however many times it's called (React may mount twice), so the live channel is created once. */
export function bootBackend(): Promise<Boot> { return booting ??= boot(); }
async function boot(): Promise<Boot> {
  if (instance) return { backend: instance };
  if (!SUPABASE_URL || !SUPABASE_KEY) return { backend: (instance = createLocalBackend()) };
  const [sb, { createSupabaseBackend }, { resume, start }] = await Promise.all([supabaseClient(), import('./supabase'), import('./supabaseAuth')]);
  const me = await resume(sb);
  if (me) return { backend: (instance = createSupabaseBackend(sb, me)) };
  let starting: Promise<Backend> | null = null;
  return { start: () => starting ??= start(sb).then(me => (instance = createSupabaseBackend(sb, me)), e => { starting = null; throw e; }) };
}
