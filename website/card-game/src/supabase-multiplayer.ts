import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Action, GameState } from './engine';
import type { RoomRequest, RoomSnapshot } from './online-service';

export interface TableConnection {
  moves: Record<string, (action: Action) => void>;
  start: () => void; stop: () => void;
  getState: () => { G: GameState; isConnected: boolean } | null;
  subscribe: (callback: (state: { G: GameState; isConnected: boolean } | null) => void) => () => void;
}
let singleton: SupabaseClient | undefined;
export const usesSupabase = import.meta.env.VITE_CARD_MULTIPLAYER === 'supabase';
export function cardSupabase(): SupabaseClient {
  const url = import.meta.env.VITE_SUPABASE_URL, key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Online rooms are not configured yet. Practice is still available.');
  // Use the same default project-scoped auth storage as the retrospective on this origin.
  return singleton ??= createClient(url, key);
}
export async function ensureCardIdentity(sb: SupabaseClient): Promise<void> {
  const current = await sb.auth.getSession();
  if (current.error) throw new Error('Your session could not be restored. Try connecting again.');
  if (current.data.session) return;
  const signed = await sb.auth.signInAnonymously();
  if (signed.error || !signed.data.user) throw new Error('Could not connect your player. Please try again.');
}
export class MultiplayerError extends Error {
  constructor(message: string, public snapshot?: RoomSnapshot) { super(message); }
}
export async function requestRoom(sb: SupabaseClient, body: RoomRequest): Promise<RoomSnapshot> {
  const { data, error } = await sb.functions.invoke('last-light', { body, timeout: 15000 });
  if (error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      const details = await context.clone().json().catch(() => null) as { error?: string; snapshot?: RoomSnapshot } | null;
      if (details?.error) throw new MultiplayerError(details.error, details.snapshot);
    }
    throw new MultiplayerError('Could not reach the room. Check your connection and try again.');
  }
  if (!data || !data.G || !Number.isSafeInteger(data.version) || typeof data.playerID !== 'string') throw new MultiplayerError('The room returned an unexpected response. Try reconnecting.');
  return data as RoomSnapshot;
}
export async function enterSupabaseRoom(request: Extract<RoomRequest, { op: 'create' | 'join' }>): Promise<RoomSnapshot> {
  const sb = cardSupabase(); await ensureCardIdentity(sb); return requestRoom(sb, request);
}

/** Realtime is a wakeup only; every full view comes from the authenticated function. */
export function supabaseConnection(sb: SupabaseClient, code: string, playerID: string, onError: (message: string) => void): TableConnection {
  let active = false, view: RoomSnapshot | null = null, connected = false, moving = false;
  let refreshing = false, refreshAgain = false;
  let channel: ReturnType<SupabaseClient['channel']> | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  const listeners = new Set<(state: { G: GameState; isConnected: boolean } | null) => void>();
  const getState = () => view ? { G: view.G, isConnected: connected } : null;
  const publish = () => { if (active) listeners.forEach(listener => listener(getState())); };
  const accept = (next: RoomSnapshot) => {
    if (!active) return;
    if (next.playerID !== playerID) throw new MultiplayerError('This browser belongs to a different seat. Return to Rooms and join again.');
    const recovering = !connected;
    if (!view || next.version >= view.version) view = next;
    connected = true; publish(); if (recovering) onError('');
  };
  const refresh = async () => {
    if (!active) return;
    if (refreshing) { refreshAgain = true; return; }
    refreshing = true;
    try { accept(await requestRoom(sb, { op: 'view', code })); }
    catch (error) { if (active) { connected = false; publish(); onError(error instanceof Error ? error.message : 'Could not reconnect.'); } }
    finally { refreshing = false; if (refreshAgain && active) { refreshAgain = false; void refresh(); } }
  };
  const visibility = () => { if (!document.hidden) void refresh(); };
  const online = () => void refresh();
  return {
    getState,
    subscribe: callback => { listeners.add(callback); callback(getState()); return () => { listeners.delete(callback); }; },
    start: () => {
      if (active) return; active = true;
      void (async () => {
        try {
          await ensureCardIdentity(sb); if (!active) return;
          await refresh(); if (!active) return;
          channel = sb.channel(`last-light-${code}-${crypto.randomUUID()}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'last_light_room_updates', filter: `code=eq.${code}` }, () => { void refresh(); })
            .subscribe(status => {
              if (!active) return;
              if (status === 'SUBSCRIBED') void refresh();
              else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) { connected = false; publish(); }
            });
          timer = setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
          document.addEventListener('visibilitychange', visibility); window.addEventListener('online', online);
        } catch (error) { if (active) onError(error instanceof Error ? error.message : 'Could not reconnect.'); }
      })();
    },
    stop: () => {
      active = false; connected = false; clearInterval(timer);
      document.removeEventListener('visibilitychange', visibility); window.removeEventListener('online', online);
      if (channel) void sb.removeChannel(channel); channel = null; listeners.clear();
    },
    moves: { act: action => {
      if (!active || !view || !connected) { onError('Reconnect before playing your next card.'); return; }
      if (moving) { onError('Your previous move is still finishing. Please wait.'); return; }
      moving = true;
      void requestRoom(sb, { op: 'act', code, version: view.version, action }).then(next => { accept(next); if (active) onError(''); })
        .catch(error => {
          if (!active) return;
          if (error instanceof MultiplayerError && error.snapshot) accept(error.snapshot);
          else { connected = false; publish(); void refresh(); }
          onError(error instanceof Error ? error.message : 'The move could not be completed.');
        }).finally(() => { moving = false; });
    } },
  };
}
