// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Fragment, Stage, Vow } from '../backend/types';
import { gatherPoint, gatherSpot } from '../logic/mapWorld';
import { MAP } from '../data/sanctuaryMap';
import occluders from '../../public/art/sanctuary/occluders/occluders.json';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalBackend } from '../backend/local';
import Scene from './Scene';
import { ART } from '../data/art';

afterEach(async () => { await act(async () => root?.unmount()); root = undefined; document.body.innerHTML = ''; vi.unstubAllGlobals(); localStorage.clear(); });
/** Let the movement loop run for `ms` real milliseconds. */
const run = (ms: number) => act(async () => { await new Promise(r => setTimeout(r, ms)); });
const hold = async (key: string, ms: number, target: EventTarget = window) => { await act(async () => { target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); }); await run(ms); await act(async () => { window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true })); }); };
const posOf = (el: HTMLElement) => { const o = el.querySelector<HTMLElement>('.scene-character.own')!; return { x: parseFloat(o.style.left) / 100, y: parseFloat(o.style.top) / 100 }; };
const vow = (i: number): Vow => ({ id: 'v' + i, sessionId: 's', text: 't', ownerId: null, status: 'fulfilled', createdAt: 1 });
let root: Root | undefined;
async function render(characterId: string, extra: { vows?: Vow[]; fragments?: Fragment[]; stage?: Stage; onOpenVows?: () => void; movement?: boolean; speakerId?: string | null } = {}) {
  await act(async () => root?.unmount());
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('BroadcastChannel', class { postMessage() {} addEventListener() {} close() {} });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16));
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
  vi.stubGlobal('Audio', class { volume = 1; play() { return Promise.resolve(); } pause() {} });
  const el = document.createElement('div'); document.body.append(el);
  const backend = createLocalBackend('jay');
  root = createRoot(el);
  let frozen = false; let speakerId = extra.speakerId ?? null;
  const draw = (stage?: Stage) => root!.render(<Scene sessionId="s1" backend={backend} me={{ id: 'jay', name: 'Jay', isAdmin: true }} player={null} vows={extra.vows || []} fragments={extra.fragments} movement={extra.movement ?? true} frozen={frozen} speakerId={speakerId} activeCharacterId={characterId} stage={stage} onOpenVows={extra.onOpenVows} />);
  await act(async () => draw(extra.stage));
  return Object.assign(el, { backend, restage: (stage: Stage) => act(async () => draw(stage)), freeze: () => act(async () => { frozen = true; draw(extra.stage); }), speak: (id: string | null) => act(async () => { speakerId = id; draw(extra.stage); }) });
}

describe('writing at the crystals', () => {
  it('shows a nearby prompt and opens the writer with E', async () => {
    const el = await render('wren', { stage: 'fragment_drop' });
    expect(el.querySelector('.write-crystal.near .write-crystal-prompt')).toBeTruthy();
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true })));
    expect(el.querySelector('.crystal-writer')).toBeNull();   // not yet: opening on key-down would type the 'e' into the box
    await act(async () => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'e', bubbles: true })));
    expect(el.querySelector('.crystal-writer strong')?.textContent).toContain('Fracture');
    const box = el.querySelector<HTMLTextAreaElement>('.crystal-writer textarea')!;
    box.value = 'A problem';
    await act(async () => box.dispatchEvent(new Event('input', { bubbles: true })));
    await act(async () => box.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true })));
    expect(el.querySelector('.crystal-writer')).toBeTruthy();
  });
  it('opens directly when movement is off, and hides writing outside this stage', async () => {
    const el = await render('wren', { stage: 'fragment_drop', movement: false });
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Write a Fracture thought (Problem)"]')!.click());
    expect(el.querySelector('.crystal-writer strong')?.textContent).toContain('Fracture');
    await el.restage('vote');
    expect(el.querySelector('.write-crystal')).toBeNull();
    expect(el.querySelector('.crystal-writer')).toBeNull();
  });
  it('submits the crystal category through the existing backend', async () => {
    const el = await render('wren', { stage: 'fragment_drop', movement: false });
    const add = vi.spyOn(el.backend, 'addFragment');
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Write a Spark thought (Try)"]')!.click());
    const box = el.querySelector<HTMLTextAreaElement>('.crystal-writer textarea')!;
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(box, 'Try a new ritual'); box.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => el.querySelector<HTMLFormElement>('.crystal-writer')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(add).toHaveBeenCalledWith('s1', 'Try a new ritual', 'spark');
  });
  it('keeps a draft after walking away and returning', async () => {
    const el = await render('wren', { stage: 'fragment_drop' });
    await act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'e', bubbles: true })); });
    const box = el.querySelector<HTMLTextAreaElement>('.crystal-writer textarea')!;
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(box, 'Keep this draft'); box.dispatchEvent(new Event('input', { bubbles: true })); });
    await hold('ArrowUp', 900);
    expect(el.querySelector('.crystal-writer')).toBeNull();
    await hold('ArrowDown', 900);
    await act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'e', bubbles: true })); });
    expect(el.querySelector<HTMLTextAreaElement>('.crystal-writer textarea')?.value).toBe('Keep this draft');
  });
  it('counts fragments by category without exposing an author', async () => {
    const el = await render('wren', { stage: 'fragment_drop', fragments: [
      { id: 'a', sessionId: 's1', category: 'spark', text: 'one', createdAt: 1 },
      { id: 'b', sessionId: 's1', category: 'spark', text: 'two', createdAt: 2 },
      { id: 'c', sessionId: 's1', category: 'fracture', text: 'other', createdAt: 3 },
    ] });
    const glow = el.querySelector('.write-crystal.spark .write-crystal-count')!;
    expect(glow.getAttribute('aria-hidden')).toBe('true');
    expect(glow.outerHTML).not.toContain('jay');
    expect(glow.parentElement!.getAttribute('style')).toContain('--count: 2');
  });
});

describe('beacon journal interaction', () => {
  it('offers Vow at the beacon but not at a small crystal', async () => {
    const open = vi.fn();
    const el = await render('wren', { stage: 'fragment_drop', onOpenVows: open });
    expect(el.querySelector('[aria-label="Open vow journal"]')).toBeNull(); // Jay spawns beside the Fracture crystal.
    await el.restage('vote');
    await run(2500);
    const action = el.querySelector<HTMLButtonElement>('[aria-label="Open vow journal"]');
    expect(action).toBeTruthy();
    expect(el.querySelector('.crystal-options strong')?.textContent).toBe('Central Crystal');
    await act(async () => action!.click());
    expect(open).toHaveBeenCalledTimes(1);
    await hold('ArrowLeft', 800);
    expect(el.querySelector('.crystal-options')).toBeNull();
  });
  it('stops a walk in progress while the journal freezes the scene', async () => {
    const el = await render('wren', { stage: 'fragment_drop', onOpenVows: vi.fn() });
    await el.restage('vote');
    await run(2500);
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })));
    await run(80);
    await el.freeze();
    const position = posOf(el);
    await run(180);
    expect(posOf(el)).toEqual(position);
    expect(el.querySelector('.scene-character.own')!.classList.contains('walking')).toBe(false);
    expect(el.querySelector<HTMLElement>('.crystal-options')!.hidden).toBe(true);
  });
});

describe('Scene character', () => {
  it('depth-sorts lamp posts, the center crystal, and columns around walkers', async () => {
    const el = await render('wren');
    const world = el.querySelector('.world')!;
    const walker = world.querySelector<HTMLElement>('.scene-character.own')!;
    for (const id of ['lamp6', 'beacon', 'column2']) {
      const data = occluders.find(item => item.id === id)!;
      const cutout = world.querySelector<HTMLImageElement>(`.world-occluder[src$="/${id}.webp"]`)!;
      expect(cutout).toBeTruthy();
      expect(cutout.style.left).toBe(`${data.x * 100}%`);
      expect(cutout.style.top).toBe(`${data.y * 100}%`);
      expect(cutout.style.width).toBe(`${data.w * 100}%`);
      expect(cutout.style.height).toBe(`${data.h * 100}%`);
      expect(Number(cutout.style.zIndex)).toBe(10 + Math.round(data.baseY * 1000));
      expect(cutout.style.pointerEvents).toBe('none');
      const behindY = data.baseY - .02, frontY = data.baseY + .02;
      expect(10 + Math.round(behindY * 1000)).toBeLessThan(Number(cutout.style.zIndex));
      expect(10 + Math.round(frontY * 1000)).toBeGreaterThan(Number(cutout.style.zIndex));
    }
    expect(walker.style.zIndex).toBe(String(10 + Math.round(posOf(el).y * 1000)));
  });
  it('walks a character that has a walk sheet', async () => {
    const el = await render('mahesvara');
    const sprite = el.querySelector<HTMLElement>('.scene-character.own .walk-sprite');
    expect(sprite).toBeTruthy();
    expect(sprite!.style.backgroundImage).toContain('mahesvara_chibi_walk');
    expect(sprite!.style.getPropertyValue('--frames')).toBe('4');
  });
  it('turns the sprite to face the way it walks', async () => {
    const el = await render('mahesvara');
    const scene = el.querySelector<HTMLElement>('.sanctuary-scene')!;
    const own = () => el.querySelector<HTMLElement>('.scene-character.own .walk-sprite')!;
    await hold('ArrowLeft', 80, scene);
    expect(own().dataset.dir).toBe('left');
    await hold('ArrowUp', 80, scene);
    expect(own().dataset.dir).toBe('up');
  });
  it('floats a ghost character with her floating pose, a shadow and a trail', async () => {
    const el = await render('keira');
    const ghost = el.querySelector<HTMLElement>('.scene-character.own .ghost-figure');
    expect(ghost).toBeTruthy();
    expect(ghost!.querySelector<HTMLElement>('.pose-sprite')!.style.backgroundImage).toContain('keira_chibi_base_poses');
    expect(ghost!.querySelector('.ghost-shadow')).toBeTruthy();
    expect(ghost!.querySelectorAll('.ghost-trail i').length).toBeGreaterThan(0);
  });
  it('leans the ghost into the direction she moves', async () => {
    const el = await render('keira');
    const scene = el.querySelector<HTMLElement>('.sanctuary-scene')!;
    await hold('ArrowLeft', 80, scene);
    expect(el.querySelector<HTMLElement>('.scene-character.own .ghost-figure')!.dataset.dir).toBe('left');
  });
  it('walks with WASD without clicking the plaza first', async () => {
    const el = await render('keira');
    const own = () => el.querySelector<HTMLElement>('.scene-character.own')!;
    const before = own().style.left;
    await hold('d', 120);
    expect(own().style.left).not.toBe(before);
  });
  it('ignores WASD while typing in a text box', async () => {
    const el = await render('keira');
    const box = document.createElement('textarea'); document.body.append(box); box.focus();
    const own = () => el.querySelector<HTMLElement>('.scene-character.own')!;
    const before = own().style.left;
    await hold('d', 120, box);
    expect(own().style.left).toBe(before);
  });
  it('keeps the cutout for a character without a walk sheet', async () => {
    const art = ART.sollene as { walk?: string }, walk = art.walk; delete art.walk;   // every character has a sheet now: simulate one without
    try {
      const el = await render('sollene');
      expect(el.querySelector('.scene-character.own .walk-sprite')).toBeNull();
      expect(el.querySelector('.scene-character.own .character-art')).toBeTruthy();
    } finally { art.walk = walk; }
  });
});

describe('Sanctuary world', () => {
  it('shows the painted map with 12 lamps, lit up to the fulfilled vows (max 12)', async () => {
    const el = await render('wren', { vows: Array.from({ length: 15 }, (_, i) => vow(i)) });
    expect(el.querySelector('.world img.world-map')!.getAttribute('src')).toContain('sanctuary_map');
    expect(el.querySelectorAll('.world .lamp-glow')).toHaveLength(12);
    expect(el.querySelectorAll('.world .lamp-glow.lit')).toHaveLength(12);
    const few = await render('wren', { vows: [vow(1), vow(2), vow(3)] });
    expect(few.querySelectorAll('.world .lamp-glow.lit')).toHaveLength(3);
  });
  it('walks to the map spot that was clicked, even with the camera panned', async () => {
    const el = await render('wren');
    const world = el.querySelector<HTMLElement>('.world')!;
    world.getBoundingClientRect = () => ({ left: -100, top: -50, width: 2000, height: 1333, right: 1900, bottom: 1283, x: -100, y: -50, toJSON() {} }) as DOMRect;
    const start = posOf(el); const goal = { x: .5, y: .5 };
    await act(async () => el.querySelector('.sanctuary-scene')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 900, clientY: 616.5 })));
    await run(400);
    const d = (p: { x: number; y: number }) => Math.hypot(p.x - goal.x, p.y - goal.y);
    expect(d(posOf(el))).toBeLessThan(d(start) - 0.02);   // walking towards the clicked spot at a steady speed
  });
  it('does not gather on first load mid-step (only when the Warden changes the step)', async () => {
    const el = await render('wren', { stage: 'vote' });
    const spot = gatherSpot(gatherPoint('vote')!, 0, 1);
    const own = el.querySelector<HTMLElement>('.scene-character.own')!;
    expect(Math.abs(parseFloat(own.style.left) - spot.x * 100) + Math.abs(parseFloat(own.style.top) - spot.y * 100)).toBeGreaterThan(1);
  });
  it('gathers at the beacon when the Warden starts voting', async () => {
    const el = await render('wren', { stage: 'fragment_drop' });
    const start = posOf(el);
    await el.restage('vote');
    await run(2500);
    const spot = gatherSpot(gatherPoint('vote')!, 0, 1);
    const p = posOf(el);
    expect(Math.hypot(p.x - spot.x, p.y - spot.y)).toBeLessThan(0.03);
    expect(Math.hypot(start.x - spot.x, start.y - spot.y)).toBeGreaterThan(0.05);
  });
  it('keeps walking while a key is held, and stops when it is released', async () => {
    const el = await render('wren');
    const a = posOf(el); await hold('a', 100); const b = posOf(el);
    await hold('a', 400); const c = posOf(el); await run(200); const d = posOf(el);
    expect(b.x - c.x).toBeGreaterThan((a.x - b.x) * 2);   // 4× longer hold → much further
    expect(d.x).toBeCloseTo(c.x, 5);                       // released: no drifting
  });
  it('cannot walk through a crystal', async () => {
    const el = await render('wren');
    const c = MAP.obstacles.find(o => o.kind === 'crystal')!;
    const world = el.querySelector<HTMLElement>('.world')!;
    world.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 1000 / MAP.aspect, right: 1000, bottom: 1000 / MAP.aspect, x: 0, y: 0, toJSON() {} }) as DOMRect;
    await act(async () => el.querySelector('.sanctuary-scene')!.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: c.x * 1000, clientY: c.y * 1000 / MAP.aspect })));
    await run(3000);
    const p = posOf(el);
    expect(((p.x - c.x) / c.rx) ** 2 + ((p.y - c.y) / c.ry) ** 2).toBeGreaterThanOrEqual(0.99);
  });
});

describe('Mahesvara skills', () => {
  const key = (k: string, target: EventTarget = window) => act(async () => { target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); target.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true })); });
  it('shows the skill bar only for a character with a kit', async () => {
    expect((await render('mahesvara')).querySelectorAll('.skill-slot')).toHaveLength(4);
    expect((await render('wren')).querySelector('.skill-bar')).toBeNull();
  });
  it('casts Disassemble on key 1: aim pose + effect on his figure', async () => {
    const el = await render('mahesvara');
    await key('1');
    const own = el.querySelector<HTMLElement>('.scene-character.own')!;
    expect(own.querySelector('.fx-disassemble')).toBeTruthy();
    expect(own.querySelector<HTMLElement>('.pose-sprite')!.style.getPropertyValue('--pose')).toBe('0');
  });
  it('fires Disassemble the way he is facing', async () => {
    const el = await render('mahesvara');
    await hold('a', 80);                 // face left
    await key('1');
    const fx = el.querySelector<HTMLElement>('.scene-character.own .fx-disassemble')!;
    expect(fx.dataset.dir).toBe('left');
    expect(el.querySelector('.scene-character.own .fx-disassemble .bullet')).toBeTruthy();
    expect(el.querySelector('.scene-character.own .fx-disassemble .muzzle')).toBeTruthy();
    expect(el.querySelector('.scene-character.own .fx-disassemble .tracer')).toBeTruthy();
    const shot = el.querySelector<HTMLElement>('.scene-character.own .fx-disassemble')!;
    expect(shot.classList.contains('painted')).toBe(true);
    expect(shot.querySelector<HTMLElement>('.muzzle')!.style.backgroundImage).toContain('mahesvara_vfx_muzzle');
    expect(shot.querySelector<HTMLElement>('.bullet')!.style.backgroundImage).toContain('mahesvara_vfx_bullet');
    expect(shot.querySelector<HTMLElement>('.impact')!.style.backgroundImage).toContain('mahesvara_vfx_impact');
  });
  it('aims Disassemble at the mouse cursor', async () => {
    const el = await render('mahesvara');
    const world = el.querySelector<HTMLElement>('.world')!;
    world.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 1000 / 1.5, right: 1000, bottom: 666, x: 0, y: 0, toJSON() {} }) as DOMRect;
    const own = el.querySelector<HTMLElement>('.scene-character.own')!;
    const cx = parseFloat(own.style.left) / 100 * 1000, cy = parseFloat(own.style.top) / 100 * (1000 / 1.5);
    await act(async () => el.querySelector('.sanctuary-scene')!.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: cx + 100, clientY: cy - 60 - 100 })));
    await key('1');
    const shot = el.querySelector<HTMLElement>('.scene-character.own .fx-disassemble')!;
    expect(parseFloat(shot.style.getPropertyValue('--angle'))).toBeCloseTo(-Math.PI / 4, 1);
    expect(shot.dataset.dir).toBe('right');
  });
  it('does not cast while typing', async () => {
    const el = await render('mahesvara');
    const box = document.createElement('textarea'); document.body.append(box); box.focus();
    await key('1', box);
    expect(el.querySelector('.fx-disassemble')).toBeNull();
  });
  it('respects the cooldown', async () => {
    const el = await render('mahesvara');
    await key('2'); await run(1800);
    expect(el.querySelector('.fx-nullify')).toBeNull();      // effect finished
    await key('2');
    expect(el.querySelector('.fx-nullify')).toBeNull();      // still cooling down
    expect(el.querySelectorAll<HTMLButtonElement>('.skill-slot')[1].disabled).toBe(true);
  });
  it("shows a teammate's cast on the teammate, not on you", async () => {
    const el = await render('mahesvara');
    await act(async () => el.backend.emit('skill', { userId: 'ana', characterId: 'mahesvara', skillId: 'nullify' }));
    expect(el.querySelector('.scene-character.own .fx-nullify')).toBeNull();
  });
  it('changes form on key 3 and back again (1 s cooldown, no time limit)', async () => {
    const el = await render('mahesvara');
    await key('3'); await run(1100);
    expect(el.querySelector('.scene-character.own .true-form')).toBeTruthy();
    await run(1200);
    expect(el.querySelector('.scene-character.own .true-form')).toBeTruthy();   // stays until toggled
    await key('3'); await run(1300);
    expect(el.querySelector('.scene-character.own .true-form')).toBeNull();
  });
  it('shakes the screen and vibrates the phone for the ultimate', async () => {
    const vibrate = vi.fn(); Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    const el = await render('mahesvara');
    await key('3'); await run(1100);
    expect(el.querySelector('.sanctuary-scene')!.classList.contains('shake-small')).toBe(true);
    await key('4');
    expect(el.querySelector('.sanctuary-scene')!.classList.contains('shake-big')).toBe(true);
    expect(vibrate).toHaveBeenCalled();
  });
  it('wraps an S++ character in a blue body aura, stronger in true form', async () => {
    const el = await render('mahesvara');
    expect(el.querySelector('.scene-character.own .body-aura')).toBeTruthy();
    const sheet = el.querySelector<HTMLElement>('.scene-character.own .body-aura .aura-sheet')!;
    expect(sheet.style.backgroundImage).toContain('mahesvara_body_aura');
    await key('3'); await run(1100);
    expect(el.querySelector('.scene-character.own .body-aura.strong')).toBeTruthy();
    expect((await render('wren')).querySelector('.body-aura')).toBeNull();
  });
  it('locks the ultimate outside true form', async () => {
    const el = await render('mahesvara');
    const slot = () => el.querySelectorAll<HTMLButtonElement>('.skill-slot')[3];
    expect(slot().disabled).toBe(true);
    expect(slot().textContent).toContain('True form only');
    await key('4');
    expect(el.querySelector('.ult-overlay')).toBeNull();
  });
  it('unleashes Return to Dust in true form: dim, shockwave, dust, restoring flash', async () => {
    const el = await render('mahesvara');
    await key('3'); await run(1100);
    expect(el.querySelectorAll<HTMLButtonElement>('.skill-slot')[3].disabled).toBe(false);
    await key('4');
    const ov = el.querySelector('.ult-overlay');
    expect(ov).toBeTruthy();
    expect(ov!.querySelector('.ult-shockwave')).toBeTruthy();
    expect(el.querySelectorAll<HTMLButtonElement>('.skill-slot')[3].disabled).toBe(true);   // 90 s cooldown
  });
});

describe('Keira kit', () => {
  const key = (k: string) => act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true })); });
  const own = (el: HTMLElement) => el.querySelector<HTMLElement>('.scene-character.own')!;
  it('floats in her base form with her mech companion and the sakura aura', async () => {
    const el = await render('keira');
    expect(el.querySelectorAll('.skill-slot')).toHaveLength(4);
    expect(own(el).querySelector<HTMLElement>('.kit-companion')!.style.backgroundImage).toContain('keira_mech_poses');
    expect(own(el).querySelector<HTMLElement>('.aura-sheet')!.style.backgroundImage).toContain('keira_sakura_aura');
  });
  it('slashes with Blaze Code while the mech punches', async () => {
    const el = await render('keira');
    await key('2');
    expect(own(el).querySelector<HTMLElement>('.fx-slash')!.style.backgroundImage).toContain('keira_vfx_slash');
    expect(own(el).querySelector<HTMLElement>('.kit-companion')!.style.getPropertyValue('--pose')).toBe('1');
  });
  it('blinks toward the mouse', async () => {
    const el = await render('keira');
    const world = el.querySelector<HTMLElement>('.world')!;
    world.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 1000 / 1.5, right: 1000, bottom: 666, x: 0, y: 0, toJSON() {} }) as DOMRect;
    const x0 = parseFloat(own(el).style.left);
    const cx = x0 / 100 * 1000, cy = parseFloat(own(el).style.top) / 100 * (1000 / 1.5);
    await act(async () => el.querySelector('.sanctuary-scene')!.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: cx + 300, clientY: cy - 60 })));
    await key('1');
    expect(parseFloat(own(el).style.left)).toBeGreaterThan(x0 + 3);
    expect(own(el).querySelector('.fx-blink')).toBeTruthy();
  });
  it('combines with her mech (key 3), then unleashes Guardian Protocol (key 4)', async () => {
    const el = await render('keira');
    expect(el.querySelectorAll<HTMLButtonElement>('.skill-slot')[3].disabled).toBe(true);
    await key('3'); await run(1100);
    expect(own(el).querySelector<HTMLElement>('.true-pose')!.style.backgroundImage).toContain('keira_combined_poses');
    expect(own(el).querySelector('.kit-companion')).toBeNull();
    await key('4');
    expect(el.querySelector('.ult-overlay.theme-pink')).toBeTruthy();
    expect(own(el).querySelector<HTMLElement>('.fx-blast')!.style.backgroundImage).toContain('keira_vfx_blast');
    expect(own(el).querySelector('.true-form.ult-dive')).toBeTruthy();   // flies up, dives sword-first, then the blast
  });
});

describe('Azrenth kit', () => {
  const key = (k: string) => act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true })); });
  const own = (el: HTMLElement) => el.querySelector<HTMLElement>('.scene-character.own')!;
  it('walks with his chibi sheet and a dark-flame aura', async () => {
    const el = await render('azrenth');
    expect(el.querySelectorAll('.skill-slot')).toHaveLength(4);
    expect(own(el).querySelector<HTMLElement>('.walk-sprite')!.style.backgroundImage).toContain('azrenth_chibi_walk');
    expect(own(el).querySelector<HTMLElement>('.aura-sheet')!.style.backgroundImage).toContain('azrenth_aura');
  });
  it('casts Eyes of Ruin and Black Sun with painted effects', async () => {
    const el = await render('azrenth');
    await key('1');
    expect(own(el).querySelector<HTMLElement>('.fx-ruin')!.style.backgroundImage).toContain('azrenth_vfx_ruin');
    await key('2');
    expect(own(el).querySelector<HTMLElement>('.fx-blacksun')!.style.backgroundImage).toContain('azrenth_vfx_blacksun');
  });
  it('summons Venuzdonoa (key 3) — then the ultimate Sever unlocks (key 4)', async () => {
    const el = await render('azrenth');
    expect(el.querySelectorAll<HTMLButtonElement>('.skill-slot')[3].disabled).toBe(true);
    await key('3');
    expect(own(el).querySelector<HTMLElement>('.fx-summon')!.style.backgroundImage).toContain('azrenth_vfx_summon');
    await run(1100);
    expect(own(el).querySelector<HTMLElement>('.kit-weapon')!.getAttribute('src')).toContain('azrenth_sword');
    expect(own(el).querySelector('.walk-sprite')).toBeTruthy();          // he keeps walking — no form change
    await key('4');
    const ov = el.querySelector('.ult-overlay.theme-crimson')!;
    expect(ov.classList.contains('cine-sever')).toBe(true);           // his own cinematic, not the shared rings/dust
    expect(ov.querySelectorAll('.sv-half.a .sv-thread')).toHaveLength(4);
    expect(ov.querySelector('.sv-blade')).toBeTruthy();
    expect(ov.querySelectorAll('.sv-half')).toHaveLength(2);
    expect(ov.querySelector('.sv-void')).toBeTruthy();
    expect(ov.querySelector('.sv-painting')).toBeNull();
    expect(ov.querySelector('.ult-shockwave')).toBeNull();
    expect(own(el).querySelector<HTMLElement>('.fx-sever')!.style.backgroundImage).toContain('azrenth_vfx_sever');
  });
});
describe('speaker turns', () => {
  it('spotlights the chosen speaker and walks them to the beacon', async () => {
    const el = await render('wren', { stage: 'hall' });
    expect(el.querySelector('.scene-character.own.speaker-spotlight')).toBeNull();
    const before = posOf(el);
    await el.speak('jay'); await run(1500);
    expect(el.querySelector('.scene-character.own.speaker-spotlight')).toBeTruthy();
    const after = posOf(el); const goal = { x: MAP.beacon.x, y: MAP.beacon.y + 0.06 };
    expect(Math.hypot(after.x - goal.x, after.y - goal.y)).toBeLessThan(Math.hypot(before.x - goal.x, before.y - goal.y));
  });
});
