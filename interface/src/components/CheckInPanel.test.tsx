// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CHARACTERS } from '../data/characters';
import CheckInPanel from './CheckInPanel';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const owned = CHARACTERS.filter(c => ['wren', 'rook'].includes(c.id));
async function render(p: { companionId?: string | null; saved?: { sessionId: string; userId: string; sat: number; growth: number } | null; owned?: typeof owned } = {}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el); const onSave = vi.fn();
  await act(async () => createRoot(el).render(<CheckInPanel owned={p.owned ?? owned} companionId={p.companionId ?? null} saved={p.saved ?? null} busy={false} onSave={onSave} />));
  return { el, onSave };
}
const radio = (el: HTMLElement, group: string, label: string) => el.querySelector<HTMLButtonElement>(`[role="radiogroup"][aria-label="${group}"] [aria-label^="${label}"]`)!;
const save = (el: HTMLElement) => [...el.querySelectorAll('button')].find(b => /check-in/i.test(b.textContent || ''))!;
describe('CheckInPanel', () => {
  it('needs a companion and both answers before Finalize', async () => {
    const { el, onSave } = await render();
    await act(async () => radio(el, 'Sprint Satisfaction', '5').click());
    await act(async () => radio(el, 'Self Growth', '3').click());
    expect(save(el).disabled).toBe(true);
    await act(async () => radio(el, 'Voyage companion', 'Rook').click());
    expect(save(el).textContent).toContain('Finalize');
    await act(async () => save(el).click());
    expect(onSave).toHaveBeenCalledWith('rook', 5, 3);
  });
  it('shows the saved companion and answers, and offers an update', async () => {
    const { el } = await render({ companionId: 'wren', saved: { sessionId: 's', userId: 'u', sat: 2, growth: 4 } });
    expect(radio(el, 'Voyage companion', 'Wren').getAttribute('aria-checked')).toBe('true');
    expect(radio(el, 'Sprint Satisfaction', '2').getAttribute('aria-checked')).toBe('true');
    expect(save(el).textContent).toContain('Update');
  });
  it('labels each step in the spec’s words, and tells a player with no companions what to do', async () => {
    const { el } = await render();
    expect(radio(el, 'Sprint Satisfaction', '5').textContent).toContain('Legendary');
    expect(radio(el, 'Self Growth', '1').textContent).toContain('Same level');
    const empty = await render({ owned: [] });
    expect(empty.el.textContent).toContain('no companions yet');
  });
});
