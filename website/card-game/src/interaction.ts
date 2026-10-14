import { cardDefs, catTypes, type CardType } from './catalog';
import type { Card } from './game';

export function ruleName(type: CardType): string {
  return catTypes.includes(type) ? 'Cat Card' : cardDefs[type].rule.split(' · ')[0];
}

export function selectionAdvice(cards: Card[], matching: boolean, needsTarget: boolean, target: string): string {
  if (cards.length > 1 && !matching) return 'These cards do not match. Choose two or three identical cards; Feral Cat can join a Cat Card combo.';
  if (cards.length === 1) {
    const type = cards[0].type;
    if (type === 'defuse') return 'Defuse is used automatically when you draw an Exploding Kitten. Keep it in your hand; draw or choose another card.';
    if (type === 'nope') return 'Nope is a response card. Use it while an action is waiting for responses; it cannot be played on its own.';
    if (type === 'wild' || catTypes.includes(type)) return 'This card needs a combo. Select two matching cards to steal, or three to ask for a specific card.';
    if (type === 'collapse') return 'An Exploding Kitten cannot be played from your hand.';
  }
  if (needsTarget && !target) return cards.length === 3 ? 'Choose a player and the card you want to request, then play the trio.' : 'Choose a player below, then play your selected card or pair.';
  if (cards.length > 1) return cards.length === 2 ? 'Play this pair, then choose one face-down card from their hand. Your turn continues afterward.' : 'Play this trio to request a specific card. Your turn continues afterward.';
  return cards.length ? cardDefs[cards[0].type].text : 'Select an action card and press Play, or draw to end your turn.';
}
