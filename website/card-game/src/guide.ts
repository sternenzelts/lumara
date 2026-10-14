import { cardDefs, catTypes, type CardType } from './catalog';
import type { Card, GameState, TableEvent } from './game';

const companionLike = (type: CardType) => type === 'wild' || catTypes.includes(type);

/** A short label for cards that new players cannot simply play, and whether the card is usable right now. */
export function cardHint(card: Card, hand: Card[], ctx: { myTurn: boolean; canRespond: boolean }): { tag: string | null; playable: boolean } {
  if (card.type === 'defuse') return { tag: 'Saves you', playable: false };
  if (card.type === 'nope') return ctx.canRespond ? { tag: 'Use it now', playable: true } : { tag: 'Cancels a play', playable: false };
  if (companionLike(card.type)) {
    const others = hand.filter(c => c.id !== card.id);
    const partner = card.type === 'wild' ? others.some(c => companionLike(c.type)) : others.some(c => c.type === card.type || c.type === 'wild');
    return partner ? { tag: 'Pair ready', playable: ctx.myTurn } : { tag: 'Needs a pair', playable: false };
  }
  return { tag: null, playable: ctx.myTurn };
}

/** Public odds: every living player but one adds a Collapse; one being placed back is not in the deck yet. */
export function danger(G: Pick<GameState, 'alive' | 'deckSize' | 'danger'>) {
  const bombs = G.alive.filter(Boolean).length - 1 - (G.danger ? 1 : 0);
  const chance = G.deckSize ? bombs / G.deckSize : 1;
  return { bombs, oneIn: G.deckSize && bombs ? Math.round(G.deckSize / bombs) : 0, level: chance < .08 ? 'calm' : chance < .2 ? 'warm' : 'hot' } as const;
}

export interface Effect {
  tone: 'explode' | 'save' | 'win' | 'nope' | 'attack' | 'skip' | 'shuffle' | 'future' | 'wind' | 'favor' | 'steal' | 'give' | 'draw' | 'cast' | 'miss';
  stamp: string | null; sub: string | null; shake: boolean; duration: number;
  /** Seat a slash comes from (attacks). */
  from?: number;
  /** A face-down card flies from here ('deck' or a seat) to `to` (default: the event's seat). */
  fly?: number | 'deck'; to?: number | 'deck';
}

const title = (card: TableEvent['card'], fallback: CardType) => cardDefs[card && card !== 'pair' && card !== 'trio' ? card : fallback].title;

/** What the table shows for one public event. Pure, so every effect is testable without a browser. */
export function effectFor(e: TableEvent, me: number, names: string[]): Effect | null {
  const name = e.seat === null ? '' : e.seat === me ? 'You' : names[e.seat];
  const base = { sub: null, shake: false };
  switch (e.kind) {
    case 'explode': return { ...base, tone: 'explode', stamp: 'Boom!', sub: e.seat === me ? 'You are out' : `${name} is out`, shake: true, duration: 2600 };
    case 'defuse': return { ...base, tone: 'save', stamp: 'Saved!', sub: `${name} used Dawn’s Protection`, duration: 2000 };
    case 'win': return { ...base, tone: 'win', stamp: e.seat === me ? 'You win!' : `${name} wins!`, duration: 3200 };
    case 'nope': return { ...base, tone: 'nope', stamp: 'Nope!', sub: `${name} cancelled it`, duration: 1500 };
    case 'restore': return { ...base, tone: 'nope', stamp: 'Restored!', sub: `${name} brought it back`, duration: 1500 };
    case 'cancelled': return { ...base, tone: 'miss', stamp: null, duration: 700 };
    case 'attack': return { ...base, tone: 'attack', stamp: title(e.card, 'attack'), sub: e.text, from: e.other, duration: 1700 };
    case 'skip': return { ...base, tone: 'skip', stamp: title(e.card, 'skip'), duration: 1400 };
    case 'shuffle': return { ...base, tone: 'shuffle', stamp: title(e.card, 'shuffle'), sub: 'The deck is shuffled', duration: 1400 };
    case 'future': return { ...base, tone: 'future', stamp: title(e.card, 'future'), duration: 1400 };
    case 'bottom': return { ...base, tone: 'wind', stamp: title(e.card, 'bottom'), duration: 1300 };
    case 'favor': return { ...base, tone: 'favor', stamp: title(e.card, 'favor'), sub: e.text, duration: 1500 };
    case 'steal': return { ...base, tone: 'steal', stamp: 'Stolen!', fly: e.other, duration: 1500 };
    case 'give': return { ...base, tone: 'give', stamp: null, fly: e.seat ?? undefined, to: e.other, duration: 1000 };
    case 'draw': return { ...base, tone: 'draw', stamp: null, fly: 'deck', duration: 800 };
    case 'return': return { ...base, tone: 'draw', stamp: null, fly: e.seat ?? undefined, to: 'deck', duration: 900 };
    case 'miss': return { ...base, tone: 'miss', stamp: null, duration: 700 };
    case 'play': case 'force': return { ...base, tone: 'cast', stamp: null, duration: 800 };
    default: return null;
  }
}
