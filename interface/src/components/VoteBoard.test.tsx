// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Fragment, Vote } from '../backend/types';
import VoteBoard from './VoteBoard';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const frag = (id: string, category: Fragment['category'], text = `Thought ${id}`): Fragment => ({ id, sessionId: 's1', text, category, createdAt: 1 });
const FRAGMENTS = [frag('a', 'radiance'), frag('b', 'fracture'), frag('c', 'fracture')];
async function render(p: Partial<Parameters<typeof VoteBoard>[0]> = {}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  const props = { fragments: FRAGMENTS, votes: [] as Vote[], ownVotes: [] as string[], busy: false, onVote: vi.fn(), onUnvote: vi.fn(), ...p };
  await act(async () => createRoot(el).render(<VoteBoard {...props} />));
  return { el, props };
}
const card = (el: HTMLElement, id: string) => el.querySelector<HTMLElement>(`[data-fragment="${id}"]`)!;

describe('VoteBoard', () => {
  it('shows progress toward 3 picks', async () => {
    const { el } = await render({ ownVotes: ['b'] });
    expect(el.querySelectorAll('.vb-hand .vb-orb').length).toBe(3);
    expect(el.querySelectorAll('.vb-hand .vb-orb.spent').length).toBe(2);
    expect(el.querySelector('.vb-hand')?.getAttribute('aria-label')).toBe('You picked 1 of at least 3');
  });
  it('asks for every thought when fewer than 3 were written', async () => {
    const { el } = await render({ fragments: FRAGMENTS.slice(0, 2) });
    expect(el.querySelectorAll('.vb-hand .vb-orb').length).toBe(2);
    expect(el.textContent).toContain('Pick at least 2');
  });
  it('picks and un-picks a thought', async () => {
    const { el, props } = await render({ ownVotes: ['a'] });
    await act(async () => card(el, 'b').querySelector<HTMLButtonElement>('.vb-give')!.click());
    expect(props.onVote).toHaveBeenCalledWith('b');
    const picked = card(el, 'a').querySelector<HTMLButtonElement>('.vb-give')!;
    expect(picked.getAttribute('aria-pressed')).toBe('true'); expect(picked.textContent).toContain('Picked');
    await act(async () => picked.click());
    expect(props.onUnvote).toHaveBeenCalledWith('a');
  });
  it('has no upper limit', async () => {
    const { el } = await render({ ownVotes: ['a', 'b'], fragments: [...FRAGMENTS, frag('d', 'spark'), frag('e', 'spark')] });
    expect(card(el, 'c').querySelector<HTMLButtonElement>('.vb-give')!.disabled).toBe(false);
    const more = await render({ ownVotes: ['a', 'b', 'c', 'd'], fragments: [...FRAGMENTS, frag('d', 'spark'), frag('e', 'spark')] });
    expect(more.el.querySelector('.vb-extra')?.textContent).toBe('+1');
  });
  it('shows how many players picked each thought', async () => {
    const votes: Vote[] = [{ id: '1', sessionId: 's1', fragmentId: 'b' }, { id: '2', sessionId: 's1', fragmentId: 'b' }];
    const { el } = await render({ votes });
    expect(card(el, 'b').querySelector('.vb-count')?.textContent).toBe('2 picks');
  });
  it('says picks stay private until you are chosen to speak', async () => {
    const { el } = await render();
    expect(el.textContent).toContain('Your picks stay private until you’re chosen to speak');
  });
  it('filters by crystal, with counts', async () => {
    const { el } = await render();
    const fracture = [...el.querySelectorAll<HTMLButtonElement>('.vb-filter button')].find(b => b.textContent?.includes('Fracture'))!;
    expect(fracture.textContent).toContain('2');
    await act(async () => fracture.click());
    expect(el.querySelectorAll('[data-fragment]').length).toBe(2);
  });
  it('invites the Warden back when there is nothing to vote on', async () => {
    const { el } = await render({ fragments: [] });
    expect(el.textContent).toContain('No thoughts to vote on yet');
  });
});
