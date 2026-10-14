import { applyAction, createState, playerView, type Action, type Edition, type GameState, type RandomSource } from './engine';
import { companions } from './catalog';

export interface Room { code: string; version: number; users: (string | null)[]; state: GameState }
export interface RoomStore {
  create(room: Room, owner: string): Promise<void>;
  load(code: string): Promise<Room | null>;
  commit(room: Room, expectedVersion: number): Promise<boolean>;
}
export interface RoomSnapshot { code: string; playerID: string; version: number; G: GameState }
export class RoomError extends Error {
  constructor(public status: number, message: string, public snapshot?: RoomSnapshot) { super(message); }
}
export type RoomRequest =
  | { op: 'create'; players: number; edition: Edition; name: string; companion: string }
  | { op: 'join'; code: string; name: string; companion: string }
  | { op: 'view'; code: string }
  | { op: 'act'; code: string; version: number; action: Action };

const profile = (name: unknown, companion: unknown) => {
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 32) throw new RoomError(400, 'Choose a name with 1–32 characters.');
  if (typeof companion !== 'string' || !companions.some(c => c.id === companion)) throw new RoomError(400, 'Choose one of the available companions.');
  return { name: name.trim(), companion, ready: false };
};
const snapshot = (room: Room, actor: number): RoomSnapshot => ({ code: room.code, playerID: String(actor), version: room.version, G: playerView(room.state, String(actor)) });

/** Authenticated callers pass only a user ID verified by Supabase, never a claimed playerID. */
export function createRoomService(store: RoomStore, random: RandomSource, makeCode: () => string) {
  return async (userID: string, request: RoomRequest): Promise<RoomSnapshot> => {
    if (!userID) throw new RoomError(401, 'Sign in again to reconnect.');
    if (!request || typeof request !== 'object') throw new RoomError(400, 'Invalid room request.');
    if (request.op === 'create') {
      const seat = profile(request.name, request.companion);
      if (!['party', 'original'].includes(request.edition) || !Number.isInteger(request.players) || request.players < 2 || request.players > (request.edition === 'original' ? 5 : 10)) throw new RoomError(400, 'Choose a valid deck and number of players.');
      const state = createState(request.players, request.edition); state.seats[0] = seat;
      const room: Room = { code: makeCode(), version: 1, state, users: Array(request.players).fill(null) }; room.users[0] = userID;
      await store.create(room, userID); return snapshot(room, 0);
    }
    if (!['view', 'join', 'act'].includes(request.op) || typeof request.code !== 'string' || !/^[a-z0-9]{12}$/.test(request.code)) throw new RoomError(400, 'Enter the 12-character room code your host shared.');
    for (let attempt = 0; attempt < 4; attempt++) {
      const loaded = await store.load(request.code);
      if (!loaded) throw new RoomError(404, 'That room was not found or has expired. Ask your host for a new link.');
      const room = structuredClone(loaded), actor = room.users.indexOf(userID);
      if (request.op === 'join') {
        if (actor >= 0) return snapshot(room, actor);
        if (room.state.phase !== 'lobby') throw new RoomError(409, 'This game has already started. Ask the host for a new room.');
        const seat = profile(request.name, request.companion), empty = room.users.indexOf(null);
        if (empty < 0) throw new RoomError(409, 'This room is full. Ask the host for a new room.');
        room.users[empty] = userID; room.state.seats[empty] = seat;
        if (await store.commit(room, loaded.version)) { room.version++; return snapshot(room, empty); }
        continue; // Joining retries a raced seat claim against the updated room.
      }
      if (actor < 0) throw new RoomError(403, 'Join this room before opening its table.');
      if (request.op === 'view') return snapshot(room, actor);
      if (!Number.isSafeInteger(request.version) || request.version !== room.version) throw new RoomError(409, 'The table changed. Check the latest cards and try again.', snapshot(room, actor));
      const action = request.action;
      if (!action || typeof action !== 'object' || typeof action.kind !== 'string') throw new RoomError(400, 'Choose a valid game action.');
      if (action.kind === 'start' && room.users.some(id => !id)) throw new RoomError(409, 'Wait for every player to join and ready up.');
      let valid = false;
      try { valid = applyAction(room.state, actor, action, random); } catch { throw new RoomError(400, 'Choose a valid game action.'); }
      if (!valid) throw new RoomError(409, 'That move is no longer available. Check the table and choose again.', snapshot(loaded, actor));
      if (!await store.commit(room, loaded.version)) {
        const latest = await store.load(request.code);
        throw new RoomError(409, 'Another player acted first. Check the latest table and try again.', latest ? snapshot(latest, actor) : undefined);
      }
      room.version++; return snapshot(room, actor);
    }
    throw new RoomError(409, 'Several players joined together. Press Join room again.');
  };
}
