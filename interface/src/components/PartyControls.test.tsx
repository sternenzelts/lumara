// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PartyControls from './PartyControls';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const members = [{ userId: 'jay', name: 'Jay', characterId: null, warden: true, you: true, ready: true }, { userId: 'ana', name: 'Ana', characterId: 'wren', warden: false, you: false, ready: true }];
describe('PartyControls', () => {
  it('removes a teammate (never the Warden) and says joining is closed', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el); const onRemove = vi.fn();
    await act(async () => createRoot(el).render(<PartyControls members={members} busy={false} onRemove={onRemove} />));
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Party controls"]')!.click());
    expect(el.textContent).toContain('Joining is closed');
    expect(el.querySelector('[aria-label="Remove Jay from the party"]')).toBeNull();
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Remove Ana from the party"]')!.click());
    expect(onRemove).toHaveBeenCalledWith('ana');
  });
});
