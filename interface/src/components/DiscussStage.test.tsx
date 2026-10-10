// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Fragment, SpeakerState } from '../backend/types';
import { NO_SPEAKER } from '../logic/speaker';
import DiscussStage from './DiscussStage';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const party = [{ userId: 'jay', name: 'Jay', characterId: null }, { userId: 'ana', name: 'Ana', characterId: 'wren' }];
const frag = (id: string, createdAt: number): Fragment => ({ id, sessionId: 's', text: `Thought ${id}`, category: 'spark', createdAt });
const fragments = [frag('f1', 1), frag('f2', 2), frag('f3', 3)];
const turn = (p: Partial<SpeakerState>): SpeakerState => ({ ...NO_SPEAKER, ...p });
async function render(p: Partial<Parameters<typeof DiscussStage>[0]> = {}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  const props = { speaker: null, meId: 'jay', warden: true, busy: false, party, fragments, ownPicks: [] as string[], vows: [], onSpeaker: vi.fn(), onChoose: vi.fn(), onMakeVow: vi.fn(), onTimer: vi.fn(), ...p };
  await act(async () => createRoot(el).render(<DiscussStage {...props} />));
  return { el, props };
}
const btn = (el: HTMLElement, text: string) => [...el.querySelectorAll('button')].find(b => b.textContent === text);
describe('DiscussStage', () => {
  it('lets the Warden spin: a player starts choosing and every screen gets the same reel', async () => {
    const { el, props } = await render();
    await act(async () => btn(el, 'Spin')!.click());
    const [next, frames] = (props.onSpeaker as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(next.phase).toBe('choosing'); expect(['jay', 'ana']).toContain(next.currentId); expect(frames.at(-1)).toBe(next.currentId);
  });
  it('shows the chosen player only their own undiscussed picks, with no counts', async () => {
    const { el, props } = await render({ meId: 'ana', warden: false, speaker: turn({ currentId: 'ana', phase: 'choosing', discussed: ['f1'] }), ownPicks: ['f1', 'f2'] });
    const choices = [...el.querySelectorAll('.turn-chooser li button')];
    expect(choices.map(b => b.textContent)).toEqual(['SparkThought f2']);
    expect(el.querySelector('.turn-chooser')?.textContent).not.toMatch(/\d+ (pick|vote)/);
    await act(async () => (choices[0] as HTMLButtonElement).click());
    expect(props.onChoose).toHaveBeenCalledWith('f2');
  });
  it('falls back to any undiscussed thought when none of their picks are left', async () => {
    const { el } = await render({ meId: 'ana', warden: false, speaker: turn({ currentId: 'ana', phase: 'choosing', discussed: ['f1'] }), ownPicks: ['f1'] });
    expect(el.querySelectorAll('.turn-chooser li').length).toBe(2);
    expect(el.textContent).toContain('None of your picks are left');
  });
  it('tells everyone else who is choosing, and lets the Warden spin again', async () => {
    const { el } = await render({ speaker: turn({ currentId: 'ana', phase: 'choosing' }) });
    expect(el.textContent).toContain('Ana is choosing a thought…');
    expect(btn(el, 'Spin again')).toBeTruthy();
  });
  it('shows the chosen thought to everyone; the Warden ends the discussion', async () => {
    const { el, props } = await render({ speaker: turn({ currentId: 'ana', phase: 'discussing', thoughtId: 'f2' }) });
    expect(el.querySelector('.turn-thought')?.textContent).toContain('Thought f2');
    await act(async () => btn(el, 'Done discussing')!.click());
    expect(props.onSpeaker).toHaveBeenCalledWith(expect.objectContaining({ phase: 'vow', thoughtId: 'f2' }));
  });
  it('opens the Warden’s Vow box pre-filled; Make Vow or Skip ends the turn', async () => {
    const speaker = turn({ currentId: 'ana', phase: 'vow', thoughtId: 'f2' });
    const { el, props } = await render({ speaker });
    expect(el.querySelector('textarea')?.value).toBe('Thought f2');
    await act(async () => btn(el, 'Make Vow')!.click());
    expect(props.onMakeVow).toHaveBeenCalledWith('Thought f2', null);
    await act(async () => btn(el, 'Skip this Vow')!.click());
    expect(props.onSpeaker).toHaveBeenCalledWith(expect.objectContaining({ currentId: null, spoken: ['ana'], discussed: ['f2'] }));
  });
  it('tells players the Warden is writing a Vow', async () => {
    const { el } = await render({ warden: false, speaker: turn({ currentId: 'ana', phase: 'vow', thoughtId: 'f2' }) });
    expect(el.textContent).toContain('The Warden is writing a Vow…');
    expect(el.querySelector('textarea')).toBeNull();
  });
});
