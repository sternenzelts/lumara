// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PeerFeedbackPanel from './PeerFeedbackPanel';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const allies = [{ userId: 'ana', name: 'Ana', characterId: 'wren' }, { userId: 'bob', name: 'Bob', characterId: null }];
async function render(mine = {}, onSave = vi.fn(async () => true)) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  await act(async () => createRoot(el).render(<PeerFeedbackPanel allies={allies} mine={mine} busy={false} onSave={onSave} />));
  return { el, onSave };
}
const star = (el: HTMLElement, trait: string, n: number) => el.querySelector<HTMLButtonElement>(`[aria-label="${trait}: ${n} of 5 stars"]`)!;
const saveBtn = (el: HTMLElement) => [...el.querySelectorAll('button')].find(b => b.textContent?.includes('Save & next ally'))!;
describe('PeerFeedbackPanel', () => {
  it('needs all five traits, saves, then moves to the next ally', async () => {
    const { el, onSave } = await render();
    expect(el.querySelector('[aria-pressed="true"]')?.textContent).toContain('Ana');
    for (const t of ['Party Spirit', 'Dependable', 'Clear Comms', 'Impact']) await act(async () => star(el, t, 4).click());
    expect(saveBtn(el).disabled).toBe(true);
    await act(async () => star(el, 'Levels Up', 5).click());
    await act(async () => saveBtn(el).click());
    expect(onSave).toHaveBeenCalledWith('ana', { collab: 4, owner: 4, comm: 4, impact: 4, growth: 5 });
    expect(el.querySelector('[aria-pressed="true"]')?.textContent).toContain('Bob');
  });
  it('marks rated allies with a check and loads their saved stars', async () => {
    const { el } = await render({ ana: { collab: 2, owner: 3, comm: 4, impact: 5, growth: 1 } });
    expect(el.querySelector('[aria-label="Ana · rated"]')).toBeTruthy();
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Ana · rated"]')!.click());
    expect(star(el, 'Party Spirit', 2).getAttribute('aria-checked')).toBe('true');
  });
});
