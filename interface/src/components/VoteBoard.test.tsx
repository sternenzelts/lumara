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
  it('shows three stars in hand, dimming one per vote cast', async () => {
    const { el } = await render({ ownVotes: ['b'] });
    expect(el.querySelectorAll('.vb-hand .vb-orb').length).toBe(3);
    expect(el.querySelectorAll('.vb-hand .vb-orb.spent').length).toBe(1);
    expect(el.querySelector('.vb-hand')?.getAttribute('aria-label')).toBe('2 of 3 stars left');
  });
  it('gives a star to a thought', async () => {
    const { el, props } = await render();
    await act(async () => card(el, 'b').querySelector<HTMLButtonElement>('.vb-give')!.click());
    expect(props.onVote).toHaveBeenCalledWith('b');
  });
  it('shows your stars in gold and everyone else\'s in white, and a gold star takes your vote back', async () => {
    const votes: Vote[] = [{ id: '1', sessionId: 's1', fragmentId: 'b' }, { id: '2', sessionId: 's1', fragmentId: 'b' }, { id: '3', sessionId: 's1', fragmentId: 'b' }];
    const { el, props } = await render({ votes, ownVotes: ['b'] });
    expect(card(el, 'b').querySelectorAll('.vb-star.mine').length).toBe(1);
    expect(card(el, 'b').querySelectorAll('.vb-star:not(.mine)').length).toBe(2);
    await act(async () => card(el, 'b').querySelector<HTMLButtonElement>('.vb-star.mine')!.click());
    expect(props.onUnvote).toHaveBeenCalledWith('b');
  });
  it('cannot give a fourth star', async () => {
    const { el } = await render({ ownVotes: ['a', 'a', 'b'] });
    expect(card(el, 'c').querySelector<HTMLButtonElement>('.vb-give')!.disabled).toBe(true);
    expect(el.textContent).toContain('All three stars given');
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
