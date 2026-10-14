// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameTable } from './App';

// Use the real Local multiplayer transport with a reproducible starting hand.
vi.mock('./game', async importOriginal => {
  const actual = await importOriginal<typeof import('./game')>();
  return { ...actual, createState: (count: number) => {
    const G = actual.createState(count); G.phase = 'playing';
    G.hands[0] = [{ id: 'a', type: 'rook' }, { id: 'b', type: 'rook' }, { id: 'd', type: 'defuse' }];
    G.hands[1] = [{ id: 'first', type: 'skip' }, { id: 'second', type: 'future' }];
    G.counts = G.hands.map(h => h.length); G.deck = [{ id: 'safe', type: 'skip' }]; G.deckSize = 1;
    return G;
  } };
});

let root: Root, host: HTMLDivElement;
const wait = () => new Promise(resolve => setTimeout(resolve, 30));
const button = (name: string) => [...host.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent?.trim() === name)!;
const cards = () => [...host.querySelectorAll<HTMLButtonElement>('.hand-card')];
const ids = () => cards().map(c => c.dataset.cardId);
const click = async (element: HTMLElement) => { expect(element).toBeTruthy(); await act(async () => { element.click(); await wait(); }); };

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.setItem('lumara.cards.tips', JSON.stringify(['respond', 'bomb', 'goal', 'turn', 'pair']));
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => { root.render(<GameTable session={{ practice: true, playerID: '0', matchID: `ui-${Math.random()}`, edition: 'party' }} profile={{ name: 'Jay', companion: 'seren' }} leave={() => {}} onEdition={() => {}}/>); await wait(); });
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });

describe('hand controls through multiplayer', () => {
  it('moves a card with phone-friendly arrows and shuffles without consuming or selecting cards', async () => {
    expect(ids()).toEqual(['a', 'b', 'd']);
    await click(button('Arrange hand')); await click(cards()[0]);
    await click(host.querySelector<HTMLButtonElement>('[aria-label="Move selected card right"]')!);
    expect(ids()).toEqual(['b', 'a', 'd']);
    expect(host.querySelector('.turn-heading h1')?.textContent).toBe('Your turn');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    await click(button('Shuffle hand'));
    expect(ids()).toEqual(['a', 'd', 'b']);
    await click(button('Done arranging'));
    expect(host.querySelectorAll('.hand-card[aria-pressed=true]')).toHaveLength(0);
    expect(host.querySelector('.turn-heading h1')?.textContent).toBe('Your turn');
  });
  it('supports keyboard card movement and keeps focus on the moved card', async () => {
    await click(button('Arrange hand')); cards()[0].focus();
    await act(async () => { cards()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); await wait(); });
    expect(ids()).toEqual(['b', 'a', 'd']);
    expect((document.activeElement as HTMLElement).dataset.cardId).toBe('a');
  });
  it('shows only opponent backs, takes the selected position, and resumes the turn', async () => {
    await click(cards()[0]); await click(cards()[1]);
    const target = host.querySelector<HTMLSelectElement>('.compact-field select')!;
    await act(async () => { target.value = '1'; target.dispatchEvent(new Event('change', { bubbles: true })); });
    await click(button('Play pair'));
    const picker = host.querySelector('.steal-action')!;
    expect(picker).toBeTruthy(); expect(picker.querySelectorAll('.card-back')).toHaveLength(2);
    expect(picker.querySelector('.card-caption')).toBeNull();
    expect(host.querySelectorAll('.hand-card')).toHaveLength(1);
    await click(picker.querySelectorAll<HTMLButtonElement>('button')[1]);
    expect(ids()).toEqual(['d', 'second']); expect(host.querySelector('.steal-action')).toBeNull();
    expect(host.querySelector('.turn-heading h1')?.textContent).toBe('Your turn');
    expect(host.querySelector('.draw-reveal')?.textContent).toContain('You took this');
  });
});
