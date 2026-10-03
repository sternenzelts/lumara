// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WorldMap from './WorldMap';
import { BEACONS, NATIONS, clampPan, mapGeometry } from '../data/world';
import { characterById } from '../data/characters';
import type { Backend, Vow } from '../backend/types';

let container: HTMLDivElement, root: Root;
let updateVows: (vows: Vow[]) => void;
let stop: ReturnType<typeof vi.fn>;
const fulfilled = (n: number): Vow[] => Array.from({ length: n }, (_, i) => ({ id: String(i), sessionId: 'test', text: 'Action item', ownerId: null, status: 'fulfilled', createdAt: 0 }));
beforeEach(() => {
  localStorage.clear(); stop = vi.fn();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function render(mode: 'local' | 'artifact' = 'local', initial = 0) {
  const onCharacter = vi.fn(), onBack = vi.fn();
  const backend: Pick<Backend, 'mode' | 'watchVows'> = { mode, watchVows(cb) { updateVows = cb; cb(fulfilled(initial)); return stop; } };
  await act(async () => root.render(<WorldMap backend={backend} onBack={onBack} onCharacter={onCharacter} />));
  return { onCharacter, onBack };
}
async function click(label: string) {
  const button = Array.from(container.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === label || b.textContent?.includes(label));
  expect(button, label).toBeTruthy(); await act(async () => button!.click());
}
describe('world map coordinates and content', () => {
  it.each([[1440, 900], [1024, 768], [375, 812]])('locks image coordinates to the cover canvas at %i×%i', (w, h) => {
    const canvas = mapGeometry(w, h);
    expect(canvas.width / canvas.height).toBeCloseTo(1672 / 941, 8);
    expect(canvas.width).toBeGreaterThanOrEqual(w - .001);
    expect(canvas.height).toBeGreaterThanOrEqual(h - .001);
    const left = clampPan(10000, 10000, w, h), right = clampPan(-10000, -10000, w, h);
    expect(left.x + w / 2 - canvas.width / 2).toBeCloseTo(0);
    expect(right.x + w / 2 + canvas.width / 2).toBeCloseTo(w);
    expect(left.y + h / 2 - canvas.height / 2).toBeCloseTo(0);
    expect(right.y + h / 2 + canvas.height / 2).toBeCloseTo(h);
  });
  it('uses twelve unique ordered beacons and resolves every nation companion', () => {
    expect(new Set(BEACONS.map(b => b.id)).size).toBe(12);
    expect(BEACONS[0].nation.id).toBe('belcourt');
    NATIONS.forEach(n => n.characters.forEach(id => expect(characterById(id), id).toBeTruthy()));
  });
});
describe('world map behavior', () => {
  it('loads existing progress quietly, ignites live updates, restores nations and caps at twelve', async () => {
    await render('artifact', 5);
    expect(container.querySelectorAll('.map-beacon.lit')).toHaveLength(5);
    expect(container.querySelector('.igniting')).toBeNull();
    await act(async () => updateVows(fulfilled(9)));
    expect(container.querySelectorAll('.map-beacon.lit')).toHaveLength(9);
    expect(container.querySelector('[aria-label="Explore Belcourt, restored"]')).not.toBeNull();
    expect(container.querySelector('.map-guide')?.textContent).toContain('A promise kept');
    await act(async () => updateVows(fulfilled(15)));
    expect(container.querySelectorAll('.map-beacon.lit')).toHaveLength(12);
    expect(container.querySelector('.map-guide')?.textContent).toContain('Every beacon is shining');
    expect(container.querySelector('.map-demo-tools')).toBeNull();
  });
  it('opens nation details, traps keyboard focus, closes with Escape and opens collection details', async () => {
    const { onCharacter } = await render();
    const opener = container.querySelector<HTMLButtonElement>('[aria-label="Explore Zaryeva"]')!;
    await act(async () => { opener.focus(); opener.click(); });
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain('Inspired by Russia');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close nation details');
    await act(async () => { document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true })); });
    expect(document.activeElement?.getAttribute('aria-label')).toBe('View Mahesvara in collection');
    await click('View Ayaka in collection'); expect(onCharacter).toHaveBeenCalledWith('ayaka');
    await act(async () => { container.querySelector('main')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
    expect(container.querySelector('[role="dialog"]')).toBeNull(); expect(document.activeElement).toBe(opener);
  });
  it('keeps demo preview separate from saved vows and supports pause and reset', async () => {
    await render('local', 1); await click('Light next beacon');
    expect(container.querySelectorAll('.map-beacon.lit')).toHaveLength(2);
    await click('Pause motion'); expect(container.querySelector('main')?.classList.contains('map-static')).toBe(true);
    expect(localStorage.getItem('lumara.motionPaused')).toBe('true');
    await click('Reset beacon preview'); expect(container.querySelectorAll('.map-beacon.lit')).toHaveLength(1);
    await act(async () => root.unmount()); expect(stop).toHaveBeenCalledTimes(1);
    root = createRoot(container);
  });
  it('honors reduced motion without removing map content', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    await render('local', 2); expect(container.querySelector('.map-static')).not.toBeNull();
    expect(container.querySelectorAll('.nation-label')).toHaveLength(5);
  });
  it('has Seren’s voice on by default and ignores the old auto-saved setting', async () => {
    localStorage.setItem('lumara.voiceEnabled', 'false'); await render();
    expect(container.querySelector('[aria-label="Mute Seren"]')).not.toBeNull();
  });
  it('remembers an explicit mute', async () => {
    await render(); await click('Mute Seren');
    expect(localStorage.getItem('lumara.serenMuted')).toBe('true');
  });
});
