import { describe, it, expect } from 'vitest';
import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer';
import { applyAction, buildDeck, createState, playerView, LumaraGame, type Card, type GameState, type Action } from './game';
import type { CardType } from './catalog';
import { botAction } from './bots';

// Deterministic rule scenarios: these do not depend on shuffled initial hands.
let time = 1000;
const rng = { shuffle: <T>(cards: T[]) => [...cards], number: () => 0.4, now: () => time };
const c = (id: string, type: CardType): Card => ({ id, type });
const game = (n = 3): GameState => { const G = createState(n); G.phase = 'playing'; G.hands = Array.from({ length: n }, () => []); G.deck = [c('safe', 'skip'), c('bomb', 'collapse'), c('tail', 'future')]; G.deckSize = 3; return G; };
const act = (G: GameState, actor: number, action: Action) => applyAction(G, actor, action, rng);
// No timer: an action resolves only once every living player has passed.
// Players without a Nope are passed automatically, so some actions resolve the moment they are played.
const allow = (G: GameState) => { G.alive.forEach((alive, i) => { if (alive && G.pending && !G.pending.passes.includes(i)) act(G, i, { kind: 'pass' }); }); expect(G.pending).toBeNull(); };

describe('publisher deck composition', () => {
  it('Original has 46 ordinary cards, six Defuses, four potential Kittens', () => {
    const d = buildDeck('original', 5); expect(d.cards).toHaveLength(46); expect(d.defuses).toBe(6);
    expect(d.cards.filter(c => c.type === 'nope')).toHaveLength(5);
    expect(d.cards.filter(c => c.type === 'suvara')).toHaveLength(4);
    expect(new Set(d.cards.map(c => c.id)).size).toBe(46);
  });
  it.each([[2, 41, 3], [3, 41, 3], [4, 60, 7], [7, 60, 7], [8, 101, 10], [10, 101, 10]])('Party %i players uses the correct paw-print subset', (n, ordinary, defuses) => {
    const d = buildDeck('party', n); expect(d.cards).toHaveLength(ordinary); expect(d.defuses).toBe(defuses);
  });
  it.each([['original', 2, 1, 1], ['original', 4, 3, 1], ['original', 5, 4, 1], ['party', 2, 1, 1], ['party', 3, 2, 0], ['party', 4, 3, 1], ['party', 5, 4, 1], ['party', 7, 6, 0], ['party', 8, 7, 1], ['party', 10, 9, 0]] as const)('deals 7 + 1 safely for %s/%i', (edition, n, bombs, extras) => {
    const G = createState(n, edition); G.seats.forEach(s => { s.ready = true; });
    expect(act(G, 0, { kind: 'start' })).toBe(true);
    expect(G.hands.every(h => h.length === 8 && h.filter(c => c.type === 'defuse').length === 1 && !h.some(c => c.type === 'collapse'))).toBe(true);
    expect(G.deck.filter(c => c.type === 'collapse')).toHaveLength(bombs);
    expect(G.deck.filter(c => c.type === 'defuse')).toHaveLength(extras);
  });
  it('rejects unsupported player counts', () => { expect(() => buildDeck('original', 6)).toThrow(); expect(() => buildDeck('party', 11)).toThrow(); });
});

describe('turns and Attack debt', () => {
  it('normal drawing ends one turn and gives the safe card only to the drawer', () => { const G = game(); expect(act(G, 0, { kind: 'draw' })).toBe(true); expect(G.hands[0][0].id).toBe('safe'); expect(G.current).toBe(1); expect(G.owed).toBe(1); });
  it('an ordinary Attack passes two turns, not three', () => { const G = game(); G.hands[0] = [c('a', 'attack')]; act(G, 0, { kind: 'play', ids: ['a'] }); allow(G); expect(G.current).toBe(1); expect(G.owed).toBe(2); });
  it('an immediate counterattack passes four turns', () => { const G = game(); G.hands[0] = [c('a', 'attack')]; G.hands[1] = [c('b', 'attack')]; act(G, 0, { kind: 'play', ids: ['a'] }); allow(G); act(G, 1, { kind: 'play', ids: ['b'] }); allow(G); expect(G.current).toBe(2); expect(G.owed).toBe(4); });
  it('drawing once then counterattacking passes three turns', () => { const G = game(); G.hands[0] = [c('a', 'attack')]; G.hands[1] = [c('b', 'attack')]; act(G, 0, { kind: 'play', ids: ['a'] }); allow(G); act(G, 1, { kind: 'draw' }); expect(G.current).toBe(1); expect(G.owed).toBe(1); act(G, 1, { kind: 'play', ids: ['b'] }); allow(G); expect(G.owed).toBe(3); });
  it('Skip ends only one attacked turn', () => { const G = game(); G.owed = 2; G.attacked = true; G.hands[0] = [c('s', 'skip')]; act(G, 0, { kind: 'play', ids: ['s'] }); allow(G); expect(G.current).toBe(0); expect(G.owed).toBe(1); });
  it('Targeted Attack transfers play to the chosen player', () => { const G = game(4); G.hands[0] = [c('t', 'targeted')]; act(G, 0, { kind: 'play', ids: ['t'], target: 3 }); allow(G); expect(G.current).toBe(3); expect(G.owed).toBe(2); act(G, 3, { kind: 'draw' }); G.deck.unshift(c('nextsafe', 'favor')); act(G, 3, { kind: 'draw' }); expect(G.current).toBe(0); });
  it('Draw from Bottom uses the bottom and consumes one turn', () => { const G = game(); G.hands[0] = [c('b', 'bottom')]; act(G, 0, { kind: 'play', ids: ['b'] }); allow(G); expect(G.hands[0][0].id).toBe('tail'); expect(G.deck[0].id).toBe('safe'); expect(G.current).toBe(1); });
});

describe('Nope response windows', () => {
  it('Nope cancels an action, even off turn, and does not refund discarded cards', () => { const G = game(); G.hands[0] = [c('a', 'attack')]; G.hands[2] = [c('n', 'nope')]; act(G, 0, { kind: 'play', ids: ['a'] }); expect(act(G, 2, { kind: 'nope', id: 'n' })).toBe(true); allow(G); expect(G.current).toBe(0); expect(G.discard.map(c => c.id)).toEqual(['a', 'n']); });
  it('Nope on Nope restores the action', () => { const G = game(); G.hands[0] = [c('a', 'attack'), c('n2', 'nope')]; G.hands[1] = [c('n', 'nope')]; act(G, 0, { kind: 'play', ids: ['a'] }); expect(G.pending).not.toBeNull(); act(G, 1, { kind: 'nope', id: 'n' }); expect(G.pending!.noped).toBe(true); act(G, 0, { kind: 'nope', id: 'n2' }); allow(G); expect(G.owed).toBe(2); });
  it('waits only for players holding a Nope, and resolves once they pass', () => { const G = game(4); G.hands[0] = [c('s', 'skip')]; G.hands[2] = [c('n', 'nope')]; G.hands[3] = [c('n3', 'nope')]; act(G, 0, { kind: 'play', ids: ['s'] }); expect(G.pending!.passes.sort()).toEqual([0, 1]); act(G, 2, { kind: 'pass' }); expect(G.pending).not.toBeNull(); act(G, 3, { kind: 'pass' }); expect(G.pending).toBeNull(); expect(G.current).toBe(1); });
  it('resolves at once when nobody else holds a Nope', () => { const G = game(); G.hands[0] = [c('s', 'skip')]; act(G, 0, { kind: 'play', ids: ['s'] }); expect(G.pending).toBeNull(); expect(G.current).toBe(1); });
  it('after a Nope, waits again only for players who still hold a Nope', () => { const G = game(4); G.hands[0] = [c('a', 'attack')]; G.hands[1] = [c('n', 'nope')]; G.hands[2] = [c('n2', 'nope')]; act(G, 0, { kind: 'play', ids: ['a'] }); act(G, 1, { kind: 'nope', id: 'n' }); expect(G.pending!.passes.sort()).toEqual([0, 1, 3]); act(G, 2, { kind: 'pass' }); expect(G.pending).toBeNull(); expect(G.current).toBe(0); });
  it('hides from each player who else has already responded', () => { const G = game(4); G.hands[0] = [c('s', 'skip')]; G.hands[2] = [c('n', 'nope')]; act(G, 0, { kind: 'play', ids: ['s'] }); expect(playerView(G, '1').pending!.passes).toEqual([1]); expect(playerView(G, '2').pending!.passes).toEqual([]); expect(playerView(G, null).pending!.passes).toEqual([]); });
  it('lets only the host move a stuck action on, never their own card, and only after they responded', () => {
    const G = game(4); G.hands[1] = [c('s', 'skip')]; G.hands[0] = [c('n0', 'nope')]; G.hands[2] = [c('n', 'nope')]; G.current = 1;
    act(G, 1, { kind: 'play', ids: ['s'] });
    expect(act(G, 0, { kind: 'force' })).toBe(false);
    act(G, 0, { kind: 'pass' });
    expect(act(G, 3, { kind: 'force' })).toBe(false);
    expect(act(G, 0, { kind: 'force' })).toBe(true); expect(G.pending).toBeNull(); expect(G.current).toBe(2);
    const H = game(4); H.hands[0] = [c('s', 'skip')]; H.hands[2] = [c('n', 'nope')]; act(H, 0, { kind: 'play', ids: ['s'] });
    expect(act(H, 0, { kind: 'force' })).toBe(false);
  });
  it('has no timer: the action waits for everyone, and Nope stays available until it resolves', () => { const G = game(); G.hands[0] = [c('s', 'skip')]; G.hands[1] = [c('n', 'nope')]; act(G, 0, { kind: 'play', ids: ['s'] }); expect(act(G, 1, { kind: 'resolve' } as unknown as Action)).toBe(false); expect(act(G, 0, { kind: 'draw' })).toBe(false); time += 3_600_000; expect(G.pending).not.toBeNull(); expect(G.pending).not.toHaveProperty('deadline'); expect(act(G, 1, { kind: 'nope', id: 'n' })).toBe(true); });
});

describe('secret information and Collapse', () => {
  it('Defuse consumes protection, lets its owner insert at any valid position, and ends one turn', () => { const G = game(); G.deck = [c('bomb', 'collapse'), c('s', 'skip')]; G.hands[0] = [c('d', 'defuse')]; act(G, 0, { kind: 'draw' }); expect(G.stage?.type).toBe('defuse'); expect(G.discard[0].type).toBe('defuse'); expect(act(G, 1, { kind: 'defuse', position: 0 })).toBe(false); expect(act(G, 0, { kind: 'defuse', position: 2 })).toBe(false); expect(act(G, 0, { kind: 'defuse', position: 1 })).toBe(true); expect(G.deck.map(c => c.id)).toEqual(['s', 'bomb']); expect(G.current).toBe(1); });
  it('can Defuse the very last card without stalling', () => { const G = game(2); G.deck = [c('b', 'collapse')]; G.hands[0] = [c('d', 'defuse')]; act(G, 0, { kind: 'draw' }); act(G, 0, { kind: 'defuse', position: 0 }); expect(G.deck[0].type).toBe('collapse'); act(G, 1, { kind: 'draw' }); expect(G.winner).toBe(0); });
  it('eliminates without exposing the eliminated hand and clears Attack debt', () => { const G = game(); G.deck = [c('b', 'collapse')]; G.hands[0] = [c('secret', 'favor')]; G.owed = 4; G.attacked = true; act(G, 0, { kind: 'draw' }); expect(G.alive[0]).toBe(false); expect(G.hands[0]).toEqual([]); expect(G.discard.map(c => c.id)).toEqual(['b']); expect(G.owed).toBe(1); expect(G.attacked).toBe(false); });
  it('filters every other hand, the whole deck, future views, and spectators', () => { const G = game(); G.hands[0] = [c('mine', 'defuse')]; G.hands[1] = [c('theirs', 'nope')]; G.future = G.deck.slice(0, 3); G.stage = { actor: 0, type: 'future' }; expect(playerView(G, '0').hands[1]).toEqual([]); expect(playerView(G, '0').future).toHaveLength(3); expect(playerView(G, '1').future).toEqual([]); expect(playerView(G, null).hands.every(h => !h.length)).toBe(true); expect(playerView(G, '0').deck).toEqual([]); expect(G.deck).toHaveLength(3); });
  it('future keeps the same order; alter rejects forged order then uses the chosen permutation', () => { const G = game(); G.hands[0] = [c('f', 'alter')]; act(G, 0, { kind: 'play', ids: ['f'] }); allow(G); const old = G.deck.map(c => c.id); expect(act(G, 0, { kind: 'future', order: ['fake', 'bomb', 'tail'] })).toBe(false); expect(act(G, 1, { kind: 'future', order: old })).toBe(false); expect(act(G, 0, { kind: 'future', order: [...old].reverse() })).toBe(true); expect(G.deck.map(c => c.id)).toEqual([...old].reverse()); expect(G.current).toBe(0); });
});

describe('Favor and special combos', () => {
  it('Favor cannot stall when a target spends their last card in a Nope chain', () => {
    const G = game(); G.hands[0] = [c('f', 'favor'), c('n2', 'nope')]; G.hands[1] = [c('n', 'nope')];
    act(G, 0, { kind: 'play', ids: ['f'], target: 1 }); act(G, 1, { kind: 'nope', id: 'n' }); act(G, 0, { kind: 'nope', id: 'n2' }); allow(G);
    expect(G.stage).toBeNull(); expect(G.pending).toBeNull(); expect(G.current).toBe(0);
  });
  it('the requested player chooses their gift; no other player can give for them', () => { const G = game(); G.hands[0] = [c('f', 'favor')]; G.hands[1] = [c('d', 'defuse'), c('s', 'skip')]; act(G, 0, { kind: 'play', ids: ['f'], target: 1 }); allow(G); expect(act(G, 0, { kind: 'give', id: 'd' })).toBe(false); expect(act(G, 1, { kind: 'give', id: 's' })).toBe(true); expect(G.hands[0].map(c => c.id)).toEqual(['s']); expect(G.hands[1].map(c => c.id)).toEqual(['d']); });
  it('any matching pair waits for a blind pick without executing either original effect', () => { const G = game(); G.hands[0] = [c('a', 'attack'), c('b', 'attack')]; G.hands[1] = [c('gift', 'defuse')]; act(G, 0, { kind: 'play', ids: ['a', 'b'], target: 1 }); allow(G); expect(G.stage).toEqual({ type: 'steal', actor: 0, target: 1 }); expect(G.hands[0]).toEqual([]); expect(act(G, 0, { kind: 'steal', index: 0 })).toBe(true); expect(G.hands[0][0].id).toBe('gift'); expect(G.current).toBe(0); expect(G.owed).toBe(1); });
  it('takes the chosen position, hides every opponent card, and rejects unauthorized or invalid picks', () => {
    const G = game(); G.hands[0] = [c('a', 'rook'), c('b', 'rook')]; G.hands[1] = [c('first', 'defuse'), c('second', 'skip')];
    act(G, 0, { kind: 'play', ids: ['a', 'b'], target: 1 });
    for (const viewer of ['0', '2', null]) expect(playerView(G, viewer).hands[1]).toEqual([]);
    expect(playerView(G, '0').counts[1]).toBe(2);
    const before = JSON.stringify(G);
    expect(act(G, 1, { kind: 'steal', index: 0 })).toBe(false);
    for (const index of [-1, 2, 0.5, NaN]) expect(act(G, 0, { kind: 'steal', index })).toBe(false);
    expect(act(G, 0, { kind: 'draw' })).toBe(false); expect(JSON.stringify(G)).toBe(before);
    expect(act(G, 0, { kind: 'steal', index: 1 })).toBe(true);
    expect(G.hands[0].map(c => c.id)).toEqual(['second']); expect(G.hands[1].map(c => c.id)).toEqual(['first']);
    expect(G.counts).toEqual([1, 1, 0]); expect(G.stage).toBeNull();
    expect(act(G, 0, { kind: 'steal', index: 0 })).toBe(false);
  });
  it('does not open a picker for a cancelled pair or an emptied target hand', () => {
    const G = game(); G.hands[0] = [c('a', 'rook'), c('b', 'rook')]; G.hands[1] = [c('n', 'nope')];
    act(G, 0, { kind: 'play', ids: ['a', 'b'], target: 1 }); act(G, 1, { kind: 'nope', id: 'n' }); allow(G);
    expect(G.stage).toBeNull(); expect(G.hands[0]).toEqual([]);
    const H = game(); H.hands[0] = [c('a', 'rook'), c('b', 'rook'), c('n2', 'nope')]; H.hands[1] = [c('n', 'nope')];
    act(H, 0, { kind: 'play', ids: ['a', 'b'], target: 1 }); act(H, 1, { kind: 'nope', id: 'n' }); act(H, 0, { kind: 'nope', id: 'n2' }); allow(H);
    expect(H.stage).toBeNull(); expect(H.lastEvent?.kind).toBe('miss');
  });
  it('a trio requests a specific type, with no steal if the target lacks it', () => { const G = game(); G.hands[0] = [c('a', 'rook'), c('b', 'rook'), c('c', 'rook')]; G.hands[1] = [c('gift', 'skip')]; act(G, 0, { kind: 'play', ids: ['a', 'b', 'c'], target: 1, request: 'defuse' }); allow(G); expect(G.hands[0]).toEqual([]); expect(G.hands[1]).toHaveLength(1); });
  it('Feral matches a companion but never an action', () => { const G = game(); G.hands[0] = [c('w', 'wild'), c('c', 'rook'), c('s', 'skip')]; G.hands[1] = [c('gift', 'defuse')]; expect(act(G, 0, { kind: 'play', ids: ['w', 's'], target: 1 })).toBe(false); expect(act(G, 0, { kind: 'play', ids: ['w', 'c'], target: 1 })).toBe(true); });
  it('special combos can be Noped', () => { const G = game(); G.hands[0] = [c('a', 'rook'), c('b', 'rook')]; G.hands[1] = [c('n', 'nope'), c('gift', 'defuse')]; act(G, 0, { kind: 'play', ids: ['a', 'b'], target: 1 }); act(G, 1, { kind: 'nope', id: 'n' }); allow(G); expect(G.hands[0]).toHaveLength(0); expect(G.hands[1]).toHaveLength(1); });
});

describe('authorization and transport', () => {
  it.each([2, 3, 4, 7, 8, 10])('finishes 12 full %i-player games with filtered bot hands and consistent deck invariants', n => {
    for (let seed = 1; seed <= 12; seed++) {
      let value = seed; const number = () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
      const source = { number, now: () => 1000, shuffle: <T>(cards: T[]) => { const out = [...cards]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(number() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; } };
      const G = createState(n); G.seats.forEach(s => { s.ready = true; }); applyAction(G, 0, { kind: 'start' }, source);
      let steps = 0;
      while (G.winner === null && steps++ < 2500) {
        let moved = false;
        for (let actor = 0; actor < n; actor++) { const action = botAction(playerView(G, String(actor)), actor); if (action) { expect(applyAction(G, actor, action, source)).toBe(true); moved = true; break; } }
        expect(moved).toBe(true);
        expect(G.counts).toEqual(G.hands.map(h => h.length)); expect(G.deckSize).toBe(G.deck.length);
        const cards = [...G.deck, ...G.hands.flat(), ...G.discard, ...(G.danger ? [G.danger] : [])];
        expect(new Set(cards.map(c => c.id)).size).toBe(cards.length);
        expect(G.deck.filter(c => c.type === 'collapse').length + Number(!!G.danger)).toBe(G.alive.filter(Boolean).length - 1);
      }
      expect(G.winner).not.toBeNull();
    }
  });
  it('requires host and every seat to be ready before dealing', () => { const G = createState(2); expect(act(G, 0, { kind: 'start' })).toBe(false); act(G, 0, { kind: 'seat', name: 'Jay', companion: 'seren' }); act(G, 1, { kind: 'seat', name: 'Ally', companion: 'ayaka' }); expect(act(G, 1, { kind: 'start' })).toBe(false); expect(act(G, 0, { kind: 'start' })).toBe(true); expect(act(G, 0, { kind: 'seat', name: 'Changed', companion: 'seren' })).toBe(false); });
  it('rejects wrong-turn draws, forged / duplicate cards and invalid targets without changing state', () => { const G = game(); G.hands[0] = [c('f', 'favor')]; const before = JSON.stringify(G); for (const [actor, action] of [[1, { kind: 'draw' }], [0, { kind: 'play', ids: ['forged'] }], [0, { kind: 'play', ids: ['f', 'f'], target: 1 }], [0, { kind: 'play', ids: ['f'], target: 0 }], [0, { kind: 'play', ids: ['f'], target: -1 }]] as [number, Action][]) expect(act(G, actor, action)).toBe(false); expect(JSON.stringify(G)).toBe(before); });
  it('real boardgame.io clients can ready, deal and receive only their own hand', async () => {
    const local = Local(); const clients = [0, 1].map(i => Client({ game: LumaraGame, multiplayer: local, playerID: String(i), matchID: 'rule-test', numPlayers: 2, debug: false }));
    clients.forEach(c => c.start());
    const wait = () => new Promise(resolve => setTimeout(resolve, 30));
    await wait(); clients[0].moves.act({ kind: 'seat', name: 'Jay', companion: 'seren' }); await wait(); clients[1].moves.act({ kind: 'seat', name: 'Ally', companion: 'ayaka' }); await wait(); clients[0].moves.act({ kind: 'start' }); await wait();
    expect(clients[0].getState()!.G.hands[0]).toHaveLength(8); expect(clients[0].getState()!.G.hands[1]).toEqual([]); expect(clients[1].getState()!.G.hands[1]).toHaveLength(8); expect(clients[1].getState()!.G.deck).toEqual([]);
    clients.forEach(c => c.stop());
  });
});

describe('last table event', () => {
  it('names the seat that drew, with a fresh id for every event', () => {
    const G = game(); expect(act(G, 0, { kind: 'draw' })).toBe(true);
    expect(G.lastEvent).toMatchObject({ seat: 0, text: 'Player 1 drew a card.' });
    const first = G.lastEvent!.id;
    G.hands[1] = []; G.deck = [c('s2', 'skip')]; act(G, 1, { kind: 'draw' });
    expect(G.lastEvent).toMatchObject({ seat: 1, text: 'Player 2 drew a card.' });
    expect(G.lastEvent!.id).toBeGreaterThan(first);
  });
  it('names the seat that played a card, and has no seat for a nullified action', () => {
    const G = game(); G.hands[0] = [c('a', 'attack'), c('n0', 'nope')]; G.hands[1] = [c('n', 'nope')];
    act(G, 0, { kind: 'play', ids: ['a'] });
    expect(G.lastEvent).toMatchObject({ seat: 0, text: 'Player 1 played Double Strike.' });
    act(G, 1, { kind: 'nope', id: 'n' });
    expect(G.lastEvent).toMatchObject({ seat: 1, text: 'Player 2 nullified the action.' });
    allow(G);
    expect(G.lastEvent).toMatchObject({ seat: null, text: 'The action was nullified.' });
  });
  it('is public: every player view keeps it', () => {
    const G = game(); act(G, 0, { kind: 'draw' });
    expect(playerView(G, '2').lastEvent).toEqual(G.lastEvent);
  });
});

describe('table event list for effects', () => {
  it('keeps both the explosion and the win when one draw ends the game', () => {
    const G = game(2); G.deck = [c('b', 'collapse')]; act(G, 0, { kind: 'draw' });
    expect(G.events.slice(-2).map(e => [e.kind, e.seat])).toEqual([['explode', 0], ['win', 1]]);
  });
  it('records the play and its resolution when an action resolves at once', () => {
    const G = game(); G.hands[0] = [c('s', 'skip')]; act(G, 0, { kind: 'play', ids: ['s'] });
    expect(G.events.slice(-2).map(e => [e.kind, e.seat, e.card])).toEqual([['play', 0, 'skip'], ['skip', 0, undefined]]);
  });
  it('names the attacker and the player who must take the turns', () => {
    const G = game(); G.hands[0] = [c('a', 'attack')]; act(G, 0, { kind: 'play', ids: ['a'] });
    expect(G.events.at(-1)).toMatchObject({ kind: 'attack', seat: 1, other: 0 });
  });
  it('never puts a hidden card in draw, steal or gift events', () => {
    const G = game(); G.hands[0] = [c('a', 'rook'), c('b', 'rook'), c('f', 'favor')]; G.hands[1] = [c('secret', 'defuse'), c('s2', 'skip')];
    act(G, 0, { kind: 'play', ids: ['a', 'b'], target: 1 });
    act(G, 0, { kind: 'steal', index: 0 });
    act(G, 0, { kind: 'play', ids: ['f'], target: 1 }); act(G, 1, { kind: 'give', id: G.hands[1][0].id });
    act(G, 0, { kind: 'draw' });
    const kinds = G.events.map(e => e.kind);
    expect(kinds).toEqual(expect.arrayContaining(['steal', 'give', 'draw']));
    for (const e of G.events.filter(e => ['steal', 'give', 'draw'].includes(e.kind))) expect(e).not.toHaveProperty('card');
  });
  it('keeps only the most recent events', () => {
    const G = game(); G.deck = Array.from({ length: 20 }, (_, i) => c(`s${i}`, 'skip'));
    for (let i = 0; i < 20; i++) act(G, G.current, { kind: 'draw' });
    expect(G.events.length).toBeLessThanOrEqual(8); expect(G.events.at(-1)!.id).toBe(G.lastEvent!.id);
  });
});

describe('private hand arrangement', () => {
  it('reorders only the owner hand off turn without changing the deck, turn, selection count or public log', () => {
    const G = game(); G.hands[1] = [c('a', 'defuse'), c('b', 'skip'), c('c', 'rook')]; G.counts = [0, 3, 0];
    const deck = [...G.deck], event = G.lastEvent;
    expect(act(G, 1, { kind: 'hand-order', order: ['c', 'a', 'b'] })).toBe(true);
    expect(G.hands[1].map(c => c.id)).toEqual(['c', 'a', 'b']); expect(G.deck).toEqual(deck);
    expect(G.current).toBe(0); expect(G.owed).toBe(1); expect(G.counts).toEqual([0, 3, 0]); expect(G.lastEvent).toBe(event);
    expect(playerView(G, '0').hands[1]).toEqual([]);
    for (const order of [['a', 'a', 'b'], ['a', 'b'], ['a', 'b', 'forged']]) {
      const before = JSON.stringify(G); expect(act(G, 1, { kind: 'hand-order', order })).toBe(false); expect(JSON.stringify(G)).toBe(before);
    }
    expect(act(G, 0, { kind: 'hand-order', order: ['a', 'b', 'c'] })).toBe(false);
  });
  it('locks the offered hand during a steal, then lets the owner arrange it afterward', () => {
    const G = game(); G.hands[0] = [c('a', 'rook'), c('b', 'rook')]; G.hands[1] = [c('first', 'skip'), c('second', 'defuse'), c('third', 'future')];
    act(G, 0, { kind: 'play', ids: ['a', 'b'], target: 1 });
    expect(act(G, 1, { kind: 'hand-order', order: ['third', 'second', 'first'] })).toBe(false);
    expect(act(G, 0, { kind: 'steal', index: 1 })).toBe(true);
    expect(act(G, 1, { kind: 'hand-order', order: ['third', 'first'] })).toBe(true);
  });
  it('practice bots choose a back using the public count, without seeing the target hand', () => {
    const G = game(); G.stage = { type: 'steal', actor: 1, target: 0 }; G.counts = [4, 0, 0];
    expect(botAction(playerView(G, '1'), 1, () => .75)).toEqual({ kind: 'steal', index: 3 });
    expect(botAction(playerView(G, '2'), 2)).toBeNull();
  });
});

describe('fair practice bots', () => {
  it('do not always pick the same player (or the human seat) when everyone holds the same number of cards', () => {
    const targets = new Set<number>();
    for (const roll of [0, .3, .6, .99]) {
      const G = game(4); G.current = 2; G.hands = [[c('a', 'skip')], [c('b', 'skip')], [c('f', 'favor')], [c('d', 'skip')]]; G.counts = [1, 1, 1, 1];
      const action = botAction(G, 2, () => roll);
      expect(action).toMatchObject({ kind: 'play', ids: ['f'] });
      targets.add((action as { target: number }).target);
    }
    expect(targets.size).toBeGreaterThan(1);
    expect([...targets].every(t => t !== 2)).toBe(true);
  });
  it('never ask a player with no cards for a favor or a steal', () => {
    const G = game(3); G.current = 1; G.hands = [[], [c('f', 'favor')], [c('x', 'skip')]]; G.counts = [0, 1, 1];
    for (const roll of [0, .5, .99]) expect(botAction(G, 1, () => roll)).toMatchObject({ kind: 'play', target: 2 });
  });
});
