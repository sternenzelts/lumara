import { describe, expect, it } from 'vitest';
import { cardHint, danger, effectFor } from './guide';
import type { Card, TableEvent } from './game';
import type { CardType } from './catalog';

const c = (id: string, type: CardType): Card => ({ id, type });
const ev = (kind: TableEvent['kind'], seat: number | null, extra: Partial<TableEvent> = {}): TableEvent => ({ id: 1, seat, text: '', kind, ...extra });

describe('card hints for new players', () => {
  const turn = { myTurn: true, canRespond: false };
  it('marks Protection as automatic and never playable', () => {
    expect(cardHint(c('d', 'defuse'), [c('d', 'defuse')], turn)).toEqual({ tag: 'Saves you', playable: false });
  });
  it('tells Nope holders when they can use it', () => {
    expect(cardHint(c('n', 'nope'), [], turn)).toMatchObject({ tag: 'Cancels a play', playable: false });
    expect(cardHint(c('n', 'nope'), [], { myTurn: false, canRespond: true })).toMatchObject({ tag: 'Use it now', playable: true });
  });
  it('says a companion needs a pair until a partner (or Digital Mimic) is in hand', () => {
    expect(cardHint(c('a', 'rook'), [c('a', 'rook'), c('b', 'kairo')], turn)).toMatchObject({ tag: 'Needs a pair', playable: false });
    expect(cardHint(c('a', 'rook'), [c('a', 'rook'), c('b', 'rook')], turn)).toMatchObject({ tag: 'Pair ready', playable: true });
    expect(cardHint(c('a', 'rook'), [c('a', 'rook'), c('w', 'wild')], turn)).toMatchObject({ tag: 'Pair ready', playable: true });
    expect(cardHint(c('w', 'wild'), [c('w', 'wild'), c('s', 'skip')], turn)).toMatchObject({ tag: 'Needs a pair', playable: false });
  });
  it('lets action cards be played only on your turn, without a tag', () => {
    expect(cardHint(c('s', 'skip'), [], turn)).toEqual({ tag: null, playable: true });
    expect(cardHint(c('s', 'skip'), [], { myTurn: false, canRespond: false })).toEqual({ tag: null, playable: false });
  });
});

describe('danger meter', () => {
  it('counts Collapses as living players minus one, minus one being placed back', () => {
    expect(danger({ alive: [true, true, true, true], deckSize: 30, danger: null })).toEqual({ bombs: 3, oneIn: 10, level: 'warm' });
    expect(danger({ alive: [true, true, true, false], deckSize: 30, danger: { id: 'x', type: 'collapse' } })).toEqual({ bombs: 1, oneIn: 30, level: 'calm' });
    expect(danger({ alive: [true, true], deckSize: 3, danger: null })).toEqual({ bombs: 1, oneIn: 3, level: 'hot' });
    expect(danger({ alive: [true, true], deckSize: 0, danger: null })).toEqual({ bombs: 1, oneIn: 0, level: 'hot' });
  });
});

describe('effects for table events', () => {
  const names = ['You', 'Keira', 'Ayaka', 'Rook'];
  it('makes a bomb loud, names who is out, and shakes the table', () => {
    expect(effectFor(ev('explode', 1), 0, names)).toMatchObject({ tone: 'explode', stamp: 'Boom!', sub: 'Keira is out', shake: true });
    expect(effectFor(ev('explode', 0), 0, names)).toMatchObject({ stamp: 'Boom!', sub: 'You are out' });
  });
  it('celebrates a save and a win', () => {
    expect(effectFor(ev('defuse', 2), 0, names)).toMatchObject({ tone: 'save', stamp: 'Saved!' });
    expect(effectFor(ev('win', 3), 0, names)).toMatchObject({ tone: 'win', stamp: 'Rook wins!' });
  });
  it('stamps resolved cards with their title, and Nope with Nope', () => {
    expect(effectFor(ev('skip', 1), 0, names)).toMatchObject({ tone: 'skip', stamp: 'Time Stop' });
    expect(effectFor(ev('attack', 2, { other: 1, card: 'targeted' }), 0, names)).toMatchObject({ tone: 'attack', stamp: 'Royal Challenge', from: 1 });
    expect(effectFor(ev('nope', 3), 0, names)).toMatchObject({ tone: 'nope', stamp: 'Nope!' });
  });
  it('shows a played card only as a small cast, so a later Nope is not confusing', () => {
    expect(effectFor(ev('play', 1, { card: 'attack' }), 0, names)).toMatchObject({ tone: 'cast', stamp: null });
  });
  it('flies a face-down card for draws, steals and gifts', () => {
    expect(effectFor(ev('draw', 2), 0, names)).toMatchObject({ fly: 'deck' });
    expect(effectFor(ev('steal', 1, { other: 3 }), 0, names)).toMatchObject({ tone: 'steal', fly: 3, stamp: 'Stolen!' });
    expect(effectFor(ev('give', 3, { other: 1 }), 0, names)).toMatchObject({ fly: 3, to: 1 });
  });
  it('plays nothing for quiet bookkeeping events', () => {
    expect(effectFor(ev('info', null), 0, names)).toBeNull();
    expect(effectFor(ev('deal', null), 0, names)).toBeNull();
  });
});
