import type { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { cardDefs, catTypes, companions, type CardType } from './catalog';

export type Edition = 'original' | 'party';
export interface Card { id: string; type: CardType }
export interface Seat { name: string; companion: string; ready: boolean }
export interface Pending { actor: number; type: CardType | 'pair' | 'trio'; target?: number; request?: CardType; noped: boolean; passes: number[] }
export interface Stage { type: 'defuse' | 'future' | 'alter' | 'favor' | 'steal'; actor: number; recipient?: number; target?: number }
export interface GameState {
  edition: Edition; phase: 'lobby' | 'playing'; seats: Seat[]; hands: Card[][]; counts: number[];
  alive: boolean[]; deck: Card[]; deckSize: number; discard: Card[]; current: number;
  owed: number; attacked: boolean; pending: Pending | null; stage: Stage | null;
  danger: Card | null; future: Card[]; log: string[]; winner: number | null;
  /** The newest log line and the seat it is about, so the table can point at who acted. */
  lastEvent?: TableEvent | null;
  /** The last few public events, oldest first, so the table can play every effect of one move in order. */
  events: TableEvent[];
}
/** Public only: never carries the type of a drawn, stolen or given card. `other` is the second seat involved. */
export interface TableEvent { id: number; seat: number | null; text: string; kind: EventKind; card?: CardType | 'pair' | 'trio'; other?: number }
export type EventKind = 'info' | 'deal' | 'draw' | 'defuse' | 'explode' | 'win' | 'play' | 'nope' | 'restore' | 'cancelled' | 'attack' | 'skip' | 'shuffle' | 'future' | 'bottom' | 'favor' | 'steal' | 'miss' | 'give' | 'return' | 'force';
export interface RandomSource { shuffle: <T>(cards: T[]) => T[]; number: () => number }
export type Action =
  | { kind: 'seat'; name: string; companion: string }
  | { kind: 'start' } | { kind: 'draw' } | { kind: 'nope'; id: string }
  | { kind: 'play'; ids: string[]; target?: number; request?: CardType }
  | { kind: 'pass' } | { kind: 'force' } | { kind: 'defuse'; position: number }
  | { kind: 'future'; order?: string[] } | { kind: 'give'; id: string }
  | { kind: 'steal'; index: number } | { kind: 'hand-order'; order: string[] };

export function createState(count: number, edition: Edition = 'party'): GameState {
  return { edition, phase: 'lobby', seats: Array.from({ length: count }, (_, i) => ({ name: `Player ${i + 1}`, companion: companions[i % companions.length].id, ready: false })),
    hands: Array.from({ length: count }, () => []), counts: Array(count).fill(0), alive: Array(count).fill(true),
    deck: [], deckSize: 0, discard: [], current: 0, owed: 1, attacked: false, pending: null,
    stage: null, danger: null, future: [], log: [], winner: null, events: [] };
}

// Deck quantities come from the publisher's 2025 Original and Party Pack guides.
export function buildDeck(edition: Edition, players: number): { cards: Card[]; defuses: number } {
  const types: CardType[] = [];
  const add = (type: CardType, count: number) => { for (let i = 0; i < count; i++) types.push(type); };
  let defuses: number;
  if (edition === 'original') {
    if (players < 2 || players > 5) throw new Error('Original supports 2–5 players.');
    for (const type of ['attack', 'skip', 'shuffle', 'favor'] as CardType[]) add(type, 4);
    add('nope', 5); add('future', 5); catTypes.forEach(type => add(type, 4)); defuses = 6;
  } else {
    if (players < 2 || players > 10) throw new Error('Party supports 2–10 players.');
    const paw = players <= 3 || players >= 8;
    const plain = players >= 4;
    const quantities: [CardType, number, number][] = [
      ['attack', 2, 3], ['targeted', 2, 3], ['skip', 4, 6], ['future', 3, 3],
      ['alter', 2, 4], ['shuffle', 2, 4], ['bottom', 3, 4], ['favor', 2, 4],
      ['nope', 4, 5], ['wild', 2, 4], ...catTypes.map(type => [type, 3, 4] as [CardType, number, number]),
    ];
    quantities.forEach(([type, p, n]) => add(type, (paw ? p : 0) + (plain ? n : 0)));
    defuses = (paw ? 3 : 0) + (plain ? 7 : 0);
  }
  return { cards: types.map((type, i) => ({ id: `c${i}`, type })), defuses };
}

function record(G: GameState, text: string, seat: number | null = null, kind: EventKind = 'info', extra: { card?: TableEvent['card']; other?: number } = {}) {
  G.log = [text, ...G.log].slice(0, 16);
  G.lastEvent = { id: (G.lastEvent?.id ?? 0) + 1, seat, text, kind, ...extra };
  G.events = [...(G.events ?? []), G.lastEvent].slice(-8);
}
function sync(G: GameState) { G.counts = G.hands.map(h => h.length); G.deckSize = G.deck.length; }
function nextAlive(G: GameState, from: number) {
  for (let i = 1; i <= G.alive.length; i++) { const next = (from + i) % G.alive.length; if (G.alive[next]) return next; }
  return from;
}
function endOneTurn(G: GameState) {
  G.owed -= 1;
  if (G.owed <= 0) { G.current = nextAlive(G, G.current); G.owed = 1; G.attacked = false; }
}
function draw(G: GameState, actor: number, fromBottom = false) {
  const card = fromBottom ? G.deck.pop() : G.deck.shift();
  if (!card) return false;
  if (card.type !== 'collapse') {
    G.hands[actor].push(card); record(G, `${G.seats[actor].name} drew a card.`, actor, 'draw'); endOneTurn(G);
  } else {
    const defuseIndex = G.hands[actor].findIndex(c => c.type === 'defuse');
    if (defuseIndex !== -1) {
      G.discard.push(...G.hands[actor].splice(defuseIndex, 1)); G.danger = card;
      G.stage = { type: 'defuse', actor }; record(G, `${G.seats[actor].name} used Dawn’s Protection.`, actor, 'defuse');
    } else {
      G.alive[actor] = false; G.hands[actor] = []; G.discard.push(card);
      record(G, `${G.seats[actor].name} was caught in a World Collapse.`, actor, 'explode');
      const survivors = G.alive.map((alive, i) => alive ? i : -1).filter(i => i !== -1);
      if (survivors.length === 1) { G.winner = survivors[0]; record(G, `${G.seats[G.winner].name} is the last light standing!`, G.winner, 'win'); }
      else { G.current = nextAlive(G, actor); G.owed = 1; G.attacked = false; }
    }
  }
  return true;
}
function validTarget(G: GameState, actor: number, target: unknown, needsCards: boolean) {
  return Number.isInteger(target) && (target as number) >= 0 && (target as number) < G.seats.length && target !== actor && G.alive[target as number] && (!needsCards || G.hands[target as number].length > 0);
}
function removeCards(G: GameState, actor: number, ids: string[]) {
  const chosen = G.hands[actor].filter(c => ids.includes(c.id));
  G.hands[actor] = G.hands[actor].filter(c => !ids.includes(c.id)); G.discard.push(...chosen);
}
function matches(cards: Card[]) {
  const concrete = cards.filter(c => c.type !== 'wild');
  if (!concrete.length) return true;
  const type = concrete[0].type;
  return concrete.every(c => c.type === type) && (!cards.some(c => c.type === 'wild') || catTypes.includes(type));
}
function resolve(G: GameState, random: RandomSource) {
  const p = G.pending!; G.pending = null;
  if (p.noped) { record(G, 'The action was nullified.', null, 'cancelled', { card: p.type }); return; }
  const actor = p.actor;
  switch (p.type) {
    case 'attack': case 'targeted': {
      // A normal turn passes two turns. An Attack victim passes the untaken debt + two.
      G.owed = G.attacked ? G.owed + 2 : 2; G.attacked = true;
      G.current = p.type === 'targeted' ? p.target! : nextAlive(G, actor);
      record(G, `${G.seats[G.current].name} must take ${G.owed} turns.`, G.current, 'attack', { card: p.type, other: actor }); break;
    }
    case 'skip': record(G, `${G.seats[actor].name} ends a turn without drawing.`, actor, 'skip'); endOneTurn(G); break;
    case 'bottom': record(G, `${G.seats[actor].name} draws from the bottom.`, actor, 'bottom'); draw(G, actor, true); break;
    case 'shuffle': G.deck = random.shuffle([...G.deck]); record(G, `${G.seats[actor].name} shuffled the deck.`, actor, 'shuffle'); break;
    case 'future': case 'alter': G.future = G.deck.slice(0, 3); G.stage = { type: p.type, actor }; record(G, `${G.seats[actor].name} is ${p.type === 'alter' ? 'rearranging' : 'looking at'} the top three cards.`, actor, 'future', { card: p.type }); break;
    case 'favor':
      if (G.hands[p.target!].length) { G.stage = { type: 'favor', actor: p.target!, recipient: actor }; record(G, `${G.seats[actor].name} asks ${G.seats[p.target!].name} for a card.`, actor, 'favor', { other: p.target! }); }
      else record(G, `${G.seats[p.target!].name} has no cards to give.`, p.target!, 'miss', { other: actor });
      break;
    case 'pair': {
      if (G.hands[p.target!].length) {
        G.stage = { type: 'steal', actor, target: p.target! };
        record(G, `${G.seats[actor].name} is choosing a face-down card from ${G.seats[p.target!].name}.`, actor, 'info', { other: p.target! });
      } else record(G, `${G.seats[p.target!].name} has no cards to steal.`, p.target!, 'miss', { other: actor });
      break;
    }
    case 'trio': {
      const hand = G.hands[p.target!];
      const index = hand.findIndex(c => c.type === p.request);
      if (index >= 0 && hand.length) { G.hands[actor].push(...hand.splice(index, 1)); record(G, `${G.seats[actor].name} took a card from ${G.seats[p.target!].name}.`, actor, 'steal', { other: p.target! }); }
      else record(G, `${G.seats[p.target!].name} did not have the requested card.`, p.target!, 'miss', { other: actor });
      break;
    }
  }
}

/** No timer: players without a Nope cannot respond, so they pass automatically; resolve once everyone has passed. */
function settle(G: GameState, random: RandomSource) {
  const p = G.pending!;
  G.alive.forEach((alive, i) => { if (alive && !p.passes.includes(i) && !G.hands[i].some(c => c.type === 'nope')) p.passes.push(i); });
  if (G.alive.every((alive, i) => !alive || p.passes.includes(i))) resolve(G, random);
}

/** Shared authoritative rules. Every action validates identity, ownership and phase before mutation. */
export function applyAction(G: GameState, actor: number, action: Action, random: RandomSource): boolean {
  if (!Number.isInteger(actor) || actor < 0 || actor >= G.seats.length || G.winner !== null) return false;
  if (action.kind === 'seat') {
    if (G.phase !== 'lobby' || typeof action.name !== 'string' || !action.name.trim() || action.name.length > 32 || !companions.some(c => c.id === action.companion)) return false;
    G.seats[actor] = { name: action.name.trim(), companion: action.companion, ready: true }; return true;
  }
  if (action.kind === 'start') {
    if (actor !== 0 || G.phase !== 'lobby' || !G.seats.every(s => s.ready)) return false;
    const { cards, defuses } = buildDeck(G.edition, G.seats.length);
    G.deck = random.shuffle(cards); G.hands = G.seats.map((_, i) => [{ id: `d${i}`, type: 'defuse' }, ...G.deck.splice(0, 7)]);
    // House rule: at most one spare Protection goes into the deck (never more than the box has).
    const extras = Math.min(1, defuses - G.seats.length);
    for (let i = 0; i < extras; i++) G.deck.push({ id: `extra${i}`, type: 'defuse' });
    for (let i = 0; i < G.seats.length - 1; i++) G.deck.push({ id: `danger${i}`, type: 'collapse' });
    G.deck = random.shuffle(G.deck); G.phase = 'playing'; record(G, 'The cards are dealt. Keep your hand secret.', null, 'deal'); sync(G); return true;
  }
  if (G.phase !== 'playing' || !G.alive[actor]) return false;
  if (action.kind === 'hand-order') {
    // Freeze the offered hand until the thief picks, so a click always takes the shown position.
    if (G.stage?.type === 'steal' && G.stage.target === actor) return false;
    const hand = G.hands[actor], ids = action.order;
    if (!Array.isArray(ids) || ids.length !== hand.length || new Set(ids).size !== ids.length || !ids.every(id => hand.some(c => c.id === id))) return false;
    G.hands[actor] = ids.map(id => hand.find(c => c.id === id)!);
    return true;
  }
  if (action.kind === 'nope') {
    const index = G.hands[actor].findIndex(c => c.id === action.id && c.type === 'nope');
    if (!G.pending || index < 0) return false;
    G.discard.push(...G.hands[actor].splice(index, 1)); G.pending.noped = !G.pending.noped;
    // After a Nope everyone who still holds a Nope decides again.
    G.pending.passes = [actor];
    record(G, `${G.seats[actor].name} ${G.pending.noped ? 'nullified' : 'restored'} the action.`, actor, G.pending.noped ? 'nope' : 'restore', { card: G.pending.type }); settle(G, random); sync(G); return true;
  }
  if (action.kind === 'pass') {
    if (!G.pending || G.pending.passes.includes(actor)) return false;
    G.pending.passes.push(actor); settle(G, random); sync(G); return true;
  }
  if (action.kind === 'force') {
    // The host can move a stuck action on (someone is away), but never their own card and only after responding.
    if (actor !== 0 || !G.pending || G.pending.actor === 0 || !G.pending.passes.includes(0)) return false;
    record(G, `${G.seats[0].name} moved the action on.`, 0, 'force'); resolve(G, random); sync(G); return true;
  }
  if (G.pending) return false;
  if (action.kind === 'steal') {
    if (G.stage?.type !== 'steal' || G.stage.actor !== actor) return false;
    const target = G.stage.target!, hand = G.hands[target];
    if (!Number.isInteger(action.index) || action.index < 0 || action.index >= hand.length) return false;
    G.hands[actor].push(...hand.splice(action.index, 1)); G.stage = null;
    record(G, `${G.seats[actor].name} took a card from ${G.seats[target].name}.`, actor, 'steal', { other: target }); sync(G); return true;
  }
  if (action.kind === 'defuse') {
    if (G.stage?.type !== 'defuse' || G.stage.actor !== actor || !G.danger || !Number.isInteger(action.position) || action.position < 0 || action.position > G.deck.length) return false;
    G.deck.splice(action.position, 0, G.danger); G.danger = null; G.stage = null;
    record(G, `${G.seats[actor].name} secretly returned the Collapse to the deck.`, actor, 'return'); endOneTurn(G); sync(G); return true;
  }
  if (action.kind === 'future') {
    if (!G.stage || G.stage.actor !== actor || !['future', 'alter'].includes(G.stage.type)) return false;
    if (G.stage.type === 'alter') {
      const ids = action.order;
      if (!Array.isArray(ids) || ids.length !== G.future.length || new Set(ids).size !== ids.length || !ids.every(id => G.future.some(c => c.id === id))) return false;
      G.deck.splice(0, ids.length, ...ids.map(id => G.future.find(c => c.id === id)!));
    }
    G.future = []; G.stage = null; sync(G); return true;
  }
  if (action.kind === 'give') {
    if (G.stage?.type !== 'favor' || G.stage.actor !== actor) return false;
    const index = G.hands[actor].findIndex(c => c.id === action.id); if (index < 0) return false;
    const recipient = G.stage.recipient!; G.hands[recipient].push(...G.hands[actor].splice(index, 1)); G.stage = null;
    record(G, `${G.seats[actor].name} gave ${G.seats[recipient].name} a card.`, actor, 'give', { other: recipient }); sync(G); return true;
  }
  if (G.stage || actor !== G.current) return false;
  if (action.kind === 'draw') { const ok = draw(G, actor); sync(G); return ok; }
  if (action.kind !== 'play' || !Array.isArray(action.ids) || action.ids.length < 1 || action.ids.length > 3 || new Set(action.ids).size !== action.ids.length) return false;
  const cards = action.ids.map(id => G.hands[actor].find(c => c.id === id));
  if (cards.some(c => !c)) return false;
  const chosen = cards as Card[]; let type: Pending['type'];
  if (chosen.length > 1) {
    if (!matches(chosen) || !validTarget(G, actor, action.target, true)) return false;
    type = chosen.length === 2 ? 'pair' : 'trio';
    if (type === 'trio' && (!action.request || !Object.hasOwn(cardDefs, action.request) || action.request === 'collapse')) return false;
  } else {
    type = chosen[0].type;
    if (['collapse', 'defuse', 'nope', 'wild', ...catTypes].includes(type)) return false;
    if ((type === 'favor' || type === 'targeted') && !validTarget(G, actor, action.target, type === 'favor')) return false;
  }
  removeCards(G, actor, action.ids);
  G.pending = { actor, type, target: action.target, request: action.request, noped: false, passes: [actor] };
  record(G, `${G.seats[actor].name} played ${type === 'pair' ? 'a matching pair' : type === 'trio' ? 'a matching trio' : cardDefs[type].title}.`, actor, 'play', { card: type, ...(action.target !== undefined ? { other: action.target } : {}) });
  settle(G, random); sync(G); return true;
}

export function playerView(G: GameState, playerID: string | null): GameState {
  const actor = playerID === null ? -1 : Number(playerID);
  // Who has responded would reveal who holds a Nope, so each player only sees their own response.
  return { ...G, deck: [], hands: G.hands.map((h, i) => i === actor ? h : []),
    pending: G.pending && { ...G.pending, passes: G.pending.passes.filter(i => i === actor) },
    future: G.stage?.actor === actor ? G.future : [] };
}

export const LumaraGame: Game<GameState> = {
  name: 'lumara-last-light', minPlayers: 2, maxPlayers: 10, disableUndo: true,
  setup: ({ ctx }, setupData) => createState(ctx.numPlayers, setupData?.edition === 'original' ? 'original' : 'party'),
  validateSetupData: (setupData, players) => setupData?.edition === 'original' && players > 5 ? 'Original supports 2–5 players.' : undefined,
  playerView: ({ G, playerID }) => playerView(G, playerID),
  turn: { activePlayers: { all: 'act' }, stages: { act: { moves: {
    act: { client: false, redact: true, move: ({ G, playerID, random }, action: Action) => {
      if (!playerID || !action || typeof action !== 'object') return INVALID_MOVE;
      return applyAction(G, Number(playerID), action, { shuffle: cards => random!.Shuffle(cards), number: () => random!.Number() }) ? undefined : INVALID_MOVE;
    } },
  } } } },
  endIf: ({ G }) => G.winner !== null ? { winner: String(G.winner) } : undefined,
};
