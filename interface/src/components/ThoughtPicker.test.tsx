// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ThoughtPicker from './ThoughtPicker';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const fragments = [
  { id: 'a', sessionId: 's', text: 'Standups ran long', category: 'fracture' as const, createdAt: 1 },
  { id: 'b', sessionId: 's', text: 'Pairing helped', category: 'radiance' as const, createdAt: 2 },
];
async function render(onPick = vi.fn()) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  await act(async () => createRoot(el).render(<ThoughtPicker fragments={fragments} votes={[{ id: 'v', sessionId: 's', fragmentId: 'b' }]} onPick={onPick} />));
  return { el, onPick };
}
describe('ThoughtPicker', () => {
  it('lists thoughts most-voted first', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('li p')].map(p => p.textContent)).toEqual(['Pairing helped', 'Standups ran long']);
  });
  it('fills the Vow box with the chosen thought', async () => {
    const { el, onPick } = await render();
    await act(async () => el.querySelector<HTMLButtonElement>('button[aria-label="Make a Vow from: Standups ran long"]')!.click());
    expect(onPick).toHaveBeenCalledWith('Standups ran long');
  });
  it('renders nothing without thoughts', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el);
    await act(async () => createRoot(el).render(<ThoughtPicker fragments={[]} votes={[]} onPick={vi.fn()} />));
    expect(el.innerHTML).toBe('');
  });
});
