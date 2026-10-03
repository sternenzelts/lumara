import { describe, expect, it } from 'vitest';
import { rollPull } from './index';
import { CHARACTERS } from '../data/characters';
import { BANNER_LINEUPS } from '../data/banners';
import { DEFAULT_SETTINGS } from '../backend/local';
import type { PullRecord } from '../backend/types';
function draw(bannerId: string | undefined, rarity: number, selection: number, history: PullRecord[] = []) {
  const values = [rarity, selection];
  return rollPull({ settings: DEFAULT_SETTINGS, roster: CHARACTERS, owned: {}, history, bannerId, rng: () => values.shift()! });
}
describe('featured banner probabilities', () => {
  for (const lineup of BANNER_LINEUPS) {
    it(`${lineup.featured}: exactly half of S++ outcomes are featured`, () => {
      const counts: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) { const result = draw(lineup.featured, .001, (i + .5) / 1000); counts[result.characterId] = (counts[result.characterId] || 0) + 1; }
      expect(counts[lineup.featured]).toBe(500);
      expect(Object.values(counts).reduce((total, count) => total + count, 0)).toBe(1000);
      expect(Object.keys(counts)).toHaveLength(4);
      expect(Object.values(counts).filter(count => count >= 166 && count <= 167)).toHaveLength(3);
    });
    it(`${lineup.featured}: half of S+ outcomes go to the supporting S+ group`, () => {
      const featured = lineup.companions.filter(id => CHARACTERS.find(c => c.id === id)?.grade === 'S+');
      const counts: Record<string, number> = {};
      for (let i = 0; i < 1200; i++) { const result = draw(lineup.featured, .02, (i + .5) / 1200); expect(result.grade).toBe('S+'); counts[result.characterId] = (counts[result.characterId] || 0) + 1; }
      expect(featured.reduce((n, id) => n + counts[id], 0)).toBe(600);
      featured.forEach(id => expect(counts[id]).toBe(600 / featured.length));
      expect(Object.keys(counts)).toHaveLength(4);
    });
  }
  it('places Lucien beside Mahesvara while keeping Ashvane with Keira', () => {
    expect(BANNER_LINEUPS.find(lineup => lineup.featured === 'mahesvara')?.companions).toEqual(['lucien', 'sollene', 'calla']);
    expect(BANNER_LINEUPS.find(lineup => lineup.featured === 'keira')?.companions).toContain('ashvane');
  });
  it('leaves ordinary pulls and A characters uniform', () => {
    for (let i = 0; i < 6; i++) expect(draw('keira', .9, (i + .5) / 6)).toEqual(draw(undefined, .9, (i + .5) / 6));
    expect(draw(undefined, .001, .9).characterId).toBe('azrenth');
    expect(draw('unknown', .001, .9).characterId).toBe('azrenth');
  });
  it('applies featured selection to shared pity while allowing off-banner results', () => {
    const history = Array.from({ length: 99 }, (_, i): PullRecord => ({ characterId: 'dax', grade: 'A', at: i, source: 'banner', duplicate: false }));
    expect(draw('keira', .9, .1, history).characterId).toBe('keira');
    expect(draw('keira', .9, .6, history).characterId).toBe('mahesvara');
    expect(draw('keira', .9, .1, history.slice(0, 29)).characterId).toBe('ashvane');
  });
});
