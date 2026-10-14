import { catTypes, type CardType } from './catalog';
import type { Action, GameState } from './game';

/** Bots see exactly the same filtered state as a human client. */
export function botAction(G: GameState, actor: number, rng: () => number = Math.random): Action | null {
  if (G.phase !== 'playing' || !G.alive[actor] || G.winner !== null) return null;
  const hand = G.hands[actor];
  if (G.pending) {
    if (G.pending.passes.includes(actor)) return null;
    const nope = hand.find(c => c.type === 'nope');
    if (nope && G.pending.actor !== actor && !G.pending.noped && rng() < 0.16) return { kind: 'nope', id: nope.id };
    return { kind: 'pass' };
  }
  if (G.stage) {
    if (G.stage.actor !== actor) return null;
    if (G.stage.type === 'defuse') return { kind: 'defuse', position: G.deckSize };
    if (G.stage.type === 'future') return { kind: 'future' };
    if (G.stage.type === 'alter') return { kind: 'future', order: [...G.future].sort((a, b) => Number(a.type === 'collapse') - Number(b.type === 'collapse')).map(c => c.id) };
    const card = [...hand].sort((a, b) => Number(a.type === 'defuse') - Number(b.type === 'defuse'))[0];
    return card ? { kind: 'give', id: card.id } : null;
  }
  if (G.current !== actor) return null;
  // Fair targets: a random opponent, never "whoever holds the most cards" (that was usually the human, who also won every tie).
  const pick = (list: number[]) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
  const opponents = G.alive.map((alive, i) => alive && i !== actor ? i : -1).filter(i => i !== -1);
  const withCards = opponents.filter(i => G.counts[i] > 0);
  const anyone = pick(opponents), holder = withCards.length ? pick(withCards) : undefined;
  const card = hand.find(c => (['attack', 'targeted', 'skip', 'bottom', 'future', 'alter', 'shuffle', 'favor'] as CardType[]).includes(c.type) && (c.type !== 'favor' || holder !== undefined));
  if (card) return { kind: 'play', ids: [card.id], target: card.type === 'favor' ? holder : anyone };
  for (const type of catTypes) {
    const pair = hand.filter(c => c.type === type || c.type === 'wild').slice(0, 2);
    if (pair.length === 2 && holder !== undefined) return { kind: 'play', ids: pair.map(c => c.id), target: holder };
  }
  return { kind: 'draw' };
}
