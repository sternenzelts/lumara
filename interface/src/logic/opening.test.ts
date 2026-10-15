import { describe, expect, it } from 'vitest';
import { BEAT_VOICE, beatsFor, canSkip, gateRoute, openingKind } from './opening';
import type { Player } from '../backend/types';
import { homecomingWishesRemaining, WELCOME_TEN_FROM, welcomeRollsRemaining } from './welcome';

const p = (nickname: string | null, introSeen = false): Player => ({ userId: 'ana', displayCharacterId: null, owned: {}, pulls: [], nickname, introSeen });

describe('beats', () => {
  it('orders the full and story openings', () => {
    expect(beatsFor('full')).toEqual(['welcome', 'nickname', 'greeted', 'scene1', 'scene2', 'scene3', 'call']);
    expect(beatsFor('story')).toEqual(['scene1', 'scene2', 'scene3', 'call']);
  });
  it('only lets the story scenes be skipped', () => {
    expect(['welcome', 'nickname', 'greeted'].map(b => canSkip(b as never))).toEqual([false, false, false]);
    expect(['scene1', 'scene2', 'scene3'].map(b => canSkip(b as never))).toEqual([true, true, true]);
  });
  it('uses only recorded Seren lines', () => {
    expect(Object.values(BEAT_VOICE).filter(Boolean).sort()).toEqual(['intro_1', 'intro_2', 'intro_3', 'nickname_set', 'stage_pull', 'welcome_first']);
  });
});

describe('openingKind', () => {
  it('gives a brand-new player the full opening', () => { expect(openingKind({ player: null, destination: 'sanctuary', retroInProgress: false })).toBe('full'); });
  it('gives a new player heading into a retro the full opening', () => { expect(openingKind({ player: p(null), destination: 'retro', retroInProgress: false })).toBe('full'); });
  it('gives a new player the full opening while a retro is in progress', () => { expect(openingKind({ player: p(null), destination: 'sanctuary', retroInProgress: true })).toBe('full'); });
  it('plays only the story for a named player who has not seen it', () => { expect(openingKind({ player: p('Moon'), destination: 'sanctuary', retroInProgress: false })).toBe('story'); });
  it('plays nothing once both are done', () => { expect(openingKind({ player: p('Moon', true), destination: 'sanctuary', retroInProgress: false })).toBeNull(); });
});

describe('gateRoute', () => {
  it('gates companion-less named players to the Banner', () => { for (const route of ['sanctuary','retro','map','collection']) expect(gateRoute({route,player:p('Moon',true),playerLoaded:true})).toBe('banner'); expect(gateRoute({route:'banner',player:p('Moon',true),playerLoaded:true})).toBeNull(); });
  it('resumes an interrupted welcome gift without granting more than ten', () => {
    const roll = { at:WELCOME_TEN_FROM, characterId:'wren', grade:'A' as const, duplicate:false, source:'welcome' as const };
    const player = {...p('Moon',true),owned:{wren:1},pulls:[roll]};
    expect(welcomeRollsRemaining(player)).toBe(9);
    expect(gateRoute({route:'sanctuary',player,playerLoaded:true})).toBe('banner');
    expect(gateRoute({route:'sanctuary',player:{...player,pulls:Array.from({length:10},()=>roll)},playerLoaded:true})).toBeNull();
  });
  it('gives no top-up to players who took the old five-wish gift', () => {
    const old = { at:WELCOME_TEN_FROM - 1, characterId:'wren', grade:'A' as const, duplicate:false, source:'welcome' as const };
    expect(welcomeRollsRemaining({...p('Moon',true),owned:{wren:5},pulls:Array.from({length:5},()=>old)})).toBe(0);
    expect(welcomeRollsRemaining(p('Moon',true))).toBe(10);
  });
  it('never redirects before the player record has loaded', () => { expect(gateRoute({ route: 'sanctuary', player: null, playerLoaded: false })).toBeNull(); });
  it('sends an unnamed player to the opening from any game screen', () => {
    for (const route of ['sanctuary', 'retro', 'map', 'banner']) expect(gateRoute({ route, player: null, playerLoaded: true })).toBe('welcome');
  });
  it('leaves the title and the opening itself alone', () => {
    for (const route of ['title', 'welcome']) expect(gateRoute({ route, player: null, playerLoaded: true })).toBeNull();
  });
  it('plays the unseen story when a named player reaches the Sanctuary', () => { expect(gateRoute({ route: 'sanctuary', player: p('Moon'), playerLoaded: true })).toBe('welcome'); });
  it('sends a late joiner through the story', () => { expect(gateRoute({ route: 'retro', player: p('Moon'), playerLoaded: true })).toBe('welcome'); });
  it('never redirects a returning player', () => {
    for (const route of ['sanctuary', 'retro', 'map']) expect(gateRoute({ route, player: {...p('Moon', true), owned:{wren:1}}, playerLoaded: true })).toBeNull();
  });
});
describe('Homecoming wishes', () => {
  const opening = (sessionId: string) => ({ at: 1, characterId: 'wren', grade: 'A' as const, source: 'opening' as const, duplicate: false, sessionId });
  it('gives ten free wishes per voyage, counting only that voyage’s claims', () => {
    expect(homecomingWishesRemaining(null, 's1')).toBe(10);
    expect(homecomingWishesRemaining({ ...p('Moon', true), pulls: [opening('s1')] }, 's1')).toBe(9);   // took the old single wish: nine more
    expect(homecomingWishesRemaining({ ...p('Moon', true), pulls: Array.from({ length: 10 }, () => opening('s1')) }, 's1')).toBe(0);
    expect(homecomingWishesRemaining({ ...p('Moon', true), pulls: Array.from({ length: 10 }, () => opening('s0')) }, 's1')).toBe(10);
  });
});
