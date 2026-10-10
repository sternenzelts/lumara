// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SpeakerState } from '../backend/types';
import { NO_SPEAKER } from '../logic/speaker';
import SpeakerPanel from './SpeakerPanel';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const party = [{ userId: 'a', name: 'Ana', characterId: 'wren' }, { userId: 'b', name: 'Bob', characterId: null }];
async function render(speaker: SpeakerState | null, warden = true) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el); const onChange = vi.fn();
  await act(async () => createRoot(el).render(<SpeakerPanel party={party} speaker={speaker} warden={warden} busy={false} onChange={onChange} />));
  return { el, onChange };
}
describe('SpeakerPanel', () => {
  it('tracks spoken and remaining', async () => {
    const { el } = await render({ ...NO_SPEAKER, currentId: 'b', spoken: ['a'] }, false);
    expect(el.textContent).toContain('Spoken 1 · Remaining 1');
    expect(el.querySelector('button')).toBeNull();
  });
  it('lets the Warden skip and add back', async () => {
    const { el, onChange } = await render({ ...NO_SPEAKER, skipped: ['b'] });
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Add Bob back"]')!.click());
    expect(onChange).toHaveBeenCalledWith({ ...NO_SPEAKER });
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Skip Ana"]')!.click());
    expect(onChange).toHaveBeenLastCalledWith({ ...NO_SPEAKER, skipped: ['b', 'a'] });
  });
});
