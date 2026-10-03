// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Opening from './Opening';
import type { OpeningKind } from '../logic/opening';

let container: HTMLDivElement, root: Root, played: string[];
beforeEach(() => {
  localStorage.clear(); played = [];
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('Audio', class { src: string; volume = 1; constructor(src: string) { this.src = src; } play() { played.push(this.src.split('seren_vo_')[1]); return Promise.resolve(); } pause() {} });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function render(kind: OpeningKind, onNickname = vi.fn(async () => {})) {
  const onDone = vi.fn(), onSkipStory = vi.fn();
  await act(async () => root.render(<Opening kind={kind} accountName="Jay Diaz" onNickname={onNickname} onDone={onDone} onSkipStory={onSkipStory} />));
  return { onDone, onSkipStory, onNickname };
}
const button = (label: string) => Array.from(container.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === label || b.textContent?.trim() === label);
const beat = () => container.querySelector('[data-beat]')?.getAttribute('data-beat');
async function next() { const b = button(beat() === 'welcome' ? 'Choose your name' : 'Continue'); expect(b, 'Next button').toBeTruthy(); await act(async () => b!.click()); }
async function typeName(value: string) {
  const input = container.querySelector('input')!;
  await act(async () => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!; set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
  await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

describe('Opening', () => {
  it('runs the full opening in order and saves the chosen name', async () => {
    const { onDone, onNickname } = await render('full');
    expect(beat()).toBe('welcome'); await next();
    expect(beat()).toBe('nickname'); expect(container.querySelector('input')!.value).toBe('Jay');
    expect(container.textContent).toContain('Signed in as Jay Diaz');
    await typeName('Moon');
    expect(onNickname).toHaveBeenCalledWith('Moon');
    expect(beat()).toBe('greeted'); expect(container.textContent).toContain('Nice to meet you, Moon!');
    await next(); expect(beat()).toBe('scene1'); await next(); expect(beat()).toBe('scene2'); await next(); expect(beat()).toBe('scene3');
    expect(onDone).not.toHaveBeenCalled(); await next(); expect(beat()).toBe('call'); expect(onDone).not.toHaveBeenCalled(); await act(async () => button('Go to the Banner')!.click()); expect(onDone).toHaveBeenCalledTimes(1);
    expect(played).toEqual(['welcome_first.mp3', 'nickname_set.mp3', 'intro_1.mp3', 'intro_2.mp3', 'intro_3.mp3', 'stage_pull.mp3']);
  });
  it('has no way past the name box without a valid name', async () => {
    await render('full'); await next();
    expect(button('Continue')).toBeUndefined();
    await typeName('    ');
    expect(beat()).toBe('nickname'); expect(container.textContent).toContain('Choose a name between 1 and 16 characters.');
  });
  it('shows a save error and stays on the name box', async () => {
    await render('full', vi.fn(async () => { throw new Error('The gate is closed.'); })); await next();
    await typeName('Moon');
    expect(beat()).toBe('nickname'); expect(container.textContent).toContain('The gate is closed.');
  });
  it('only offers Skip during the story', async () => {
    const { onSkipStory } = await render('full');
    expect(button('Skip story')).toBeUndefined(); await next(); await typeName('Moon');
    expect(button('Skip story')).toBeUndefined(); await next();
    expect(beat()).toBe('scene1'); await act(async () => button('Skip story')!.click());
    expect(beat()).toBe('call'); expect(onSkipStory).not.toHaveBeenCalled();
  });
  it('starts at the first scene when only the story is left', async () => {
    await render('story'); expect(beat()).toBe('scene1'); expect(container.querySelector('input')).toBeNull();
  });
  it('plays a line the browser blocked as soon as the player first taps', async () => {
    let blocked = true;
    vi.stubGlobal('Audio', class { src: string; volume = 1; constructor(src: string) { this.src = src; }
      play() { if (blocked) return Promise.reject(new Error('NotAllowedError')); played.push(this.src.split('seren_vo_')[1]); return Promise.resolve(); } pause() {} });
    await render('full'); expect(played).toEqual([]);
    blocked = false; await act(async () => { document.dispatchEvent(new Event('pointerdown')); });
    expect(played).toEqual(['welcome_first.mp3']);
  });
  it('stays silent when the player muted Seren', async () => {
    localStorage.setItem('lumara.serenMuted', 'true'); await render('full');
    expect(played).toEqual([]); expect(button('Unmute Seren')).toBeTruthy();
  });
  it('keeps the welcome visible when tapping the dialogue unlocks audio', async () => {
    let blocked = true;
    vi.stubGlobal('Audio', class { volume = 1; currentTime = 0;
      play() { return blocked ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve(); } pause() {} });
    await render('full');
    blocked = false;
    const dialogue = container.querySelector<HTMLElement>('.opening-dialogue')!;
    await act(async () => { dialogue.dispatchEvent(new Event('pointerdown', { bubbles: true })); dialogue.click(); });
    expect(beat()).toBe('welcome');
    await next(); expect(beat()).toBe('nickname');
  });
  it('lets the player replay the current welcome line', async () => {
    await render('full');
    await act(async () => button("Replay Seren's line")!.click());
    expect(played).toEqual(['welcome_first.mp3', 'welcome_first.mp3']);
    expect(beat()).toBe('welcome');
  });
  it('ignores the old auto-saved voice setting, which was never a real choice', async () => {
    localStorage.setItem('lumara.voiceEnabled', 'false'); await render('full');
    expect(played).toEqual(['welcome_first.mp3']);
  });
  it('remembers muting from the opening', async () => {
    await render('full'); await act(async () => button('Mute Seren')!.click());
    expect(localStorage.getItem('lumara.serenMuted')).toBe('true');
  });
});
