import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { createRoomService, type Room, type RoomStore } from '../_shared/online-service.ts';

import { roomHttpHandler } from '../_shared/room-http.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const origins = (Deno.env.get('LAST_LIGHT_ORIGINS') || 'https://sternenzelts.github.io,http://127.0.0.1:4180,http://127.0.0.1:4181').split(',').map(s => s.trim());
const rpc = async (name: string, args: object) => {
  const { data, error } = await admin.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
};
const store: RoomStore = {
  create: (room, owner) => rpc('last_light_create', { p_code: room.code, p_owner: owner, p_users: room.users, p_state: room.state }),
  load: code => rpc('last_light_load', { p_code: code }) as Promise<Room | null>,
  commit: (room, expectedVersion) => rpc('last_light_commit', { p_code: room.code, p_version: expectedVersion, p_users: room.users, p_state: room.state }),
};
const number = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
const service = createRoomService(store, {
  number,
  shuffle: <T>(cards: T[]) => {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(number() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  },
}, () => crypto.randomUUID().replaceAll('-', '').slice(0, 12));

Deno.serve(roomHttpHandler({
  origins, service,
  authenticate: async token => {
    const { data, error } = await admin.auth.getUser(token);
    return !error && data.user ? data.user.id : null;
  },
}));
