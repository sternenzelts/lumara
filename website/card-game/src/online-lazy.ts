import type { Action, GameState } from './engine';
import type { RoomRequest, RoomSnapshot } from './online-service';
import type { TableConnection } from './supabase-multiplayer';

/** Build-time switch. The Supabase SDK itself is only downloaded once an online room opens. */
export const usesSupabase = import.meta.env.VITE_CARD_MULTIPLAYER === 'supabase';

export async function enterRoom(request: Extract<RoomRequest, { op: 'create' | 'join' }>): Promise<RoomSnapshot> {
  return (await import('./supabase-multiplayer')).enterSupabaseRoom(request);
}

type Listener = (state: { G: GameState; isConnected: boolean } | null) => void;

/** A table connection that loads supabase-multiplayer (and supabase-js) on start, so practice never pays for it. */
export function lazySupabaseConnection(code: string, playerID: string, onError: (message: string) => void): TableConnection {
  let inner: TableConnection | null = null, stopped = false;
  const listeners = new Map<Listener, (() => void) | undefined>();
  return {
    getState: () => inner?.getState() ?? null,
    subscribe: listener => {
      listeners.set(listener, inner?.subscribe(listener));
      if (!inner) listener(null);
      return () => { listeners.get(listener)?.(); listeners.delete(listener); };
    },
    start: () => {
      void import('./supabase-multiplayer').then(m => {
        if (stopped) return;
        inner = m.supabaseConnection(m.cardSupabase(), code, playerID, onError);
        for (const listener of listeners.keys()) listeners.set(listener, inner.subscribe(listener));
        inner.start();
      }).catch(error => { if (!stopped) onError(error instanceof Error ? error.message : 'Could not open the room.'); });
    },
    stop: () => { stopped = true; inner?.stop(); listeners.clear(); },
    moves: { act: (action: Action) => { if (inner) inner.moves.act(action); else onError('Still connecting to the room…'); } },
  };
}
