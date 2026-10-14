export const companions = [
  ['seren', 'Seren', 'seren_splash_v3'], ['mahesvara', 'Mahesvara', 'mahesvara_mirror_splash_v2'],
  ['keira', 'Keira', 'keira_splash_v3'], ['ayaka', 'Ayaka', 'ayaka_timestop_splash_v2'],
  ['azrenth', 'Azrenth', 'azrenth_splash_v2'], ['lucien', 'Lucien', 'lucien_splash_v1'],
  ['ashvane', 'Ashvane', 'ashvane_splash_v2'], ['suvara', 'Suvara', 'suvara_splash_v3'],
  ['sollene', 'Sollene', 'sollene_splash_v1'], ['wren', 'Wren', 'wren_splash_v1'],
  ['rook', 'Rook', 'rook_splash_v1'], ['calla', 'Calla', 'calla_splash_v1'],
  ['kairo', 'Kairo', 'kairo_splash_v1'], ['dax', 'Dax', 'dax_splash_v1'],
].map(([id, name]) => ({ id, name, art: `chibi/${id}-v1.webp` }));

export const cardDefs = {
  collapse: { title: 'World Collapse', rule: 'Exploding Kitten', companion: 'azrenth', color: '#914f53', text: 'Draw this without a Protection and you are out.' },
  defuse: { title: 'Dawn’s Protection', rule: 'Defuse', companion: 'seren', color: '#795b30', text: 'Survive a Collapse. Secretly return it anywhere in the deck.' },
  attack: { title: 'Double Strike', rule: 'Attack · 2×', companion: 'dax', color: '#9a542f', text: 'End your turn. The next player takes two turns. Attacks stack.' },
  targeted: { title: 'Royal Challenge', rule: 'Targeted Attack · 2×', companion: 'suvara', color: '#327373', text: 'Choose another player to take two turns. Attacks stack.' },
  skip: { title: 'Time Stop', rule: 'Skip', companion: 'ayaka', color: '#476b86', text: 'End one turn without drawing. An Attack may leave more turns.' },
  shuffle: { title: 'System Glitch', rule: 'Shuffle', companion: 'keira', color: '#a04574', text: 'Shuffle the draw pile. Your turn continues.' },
  future: { title: 'Foresight', rule: 'See the Future · 3×', companion: 'lucien', color: '#6f63b8', text: 'Privately peek at the top three cards. Keep their order.' },
  alter: { title: 'Rewrite Fate', rule: 'Alter the Future · 3×', companion: 'lucien', color: '#6f63b8', text: 'Privately rearrange the top three cards.' },
  bottom: { title: 'Wind’s Detour', rule: 'Draw from the Bottom', companion: 'wren', color: '#316956', text: 'End one turn by drawing the bottom card instead.' },
  favor: { title: 'Curious Bargain', rule: 'Favor', companion: 'calla', color: '#46715c', text: 'Choose a player. They choose one card to give you.' },
  nope: { title: 'Nullify', rule: 'Nope', companion: 'mahesvara', color: '#436e97', text: 'Cancel a pending action. Nullify again to restore it.' },
  wild: { title: 'Digital Mimic', rule: 'Feral Cat', companion: 'keira', color: '#a04574', text: 'Counts as any Companion card in a matching pair or trio.' },
  ashvane: { title: 'Quiet Vanguard', rule: 'Companion · Ashvane', companion: 'ashvane', color: '#896140', text: 'Play a matching pair to steal a random card.' },
  sollene: { title: 'Moonlit Devotion', rule: 'Companion · Sollene', companion: 'sollene', color: '#5c5e86', text: 'Play a matching pair to steal a random card.' },
  rook: { title: 'Rooftop Lightning', rule: 'Companion · Rook', companion: 'rook', color: '#846432', text: 'Play a matching pair to steal a random card.' },
  kairo: { title: 'Still Waters', rule: 'Companion · Kairo', companion: 'kairo', color: '#316b68', text: 'Play a matching pair to steal a random card.' },
  suvara: { title: 'Horizon Keeper', rule: 'Companion · Suvara', companion: 'suvara', color: '#327373', text: 'Play a matching pair to steal a random card.' },
} as const;
export type CardType = keyof typeof cardDefs;
export const catTypes: CardType[] = ['ashvane', 'sollene', 'rook', 'kairo', 'suvara'];
export const companionFor = (id: string) => companions.find(c => c.id === id) || companions[0];
export const officialOriginal = 'https://www.explodingkittens.com/pages/rules-kittens';
export const officialParty = 'https://www.explodingkittens.com/pages/rules-kittens-party';

