// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VowEditRow from './VowEditRow';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const vow = { id: 'v1', sessionId: 's', text: 'Fix CI', ownerId: null, status: 'open' as const, createdAt: 1 };
const setValue = (el: HTMLTextAreaElement | HTMLSelectElement, value: string) => {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLSelectElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value); el.dispatchEvent(new Event(el instanceof HTMLTextAreaElement ? 'input' : 'change', { bubbles: true }));
};
describe('VowEditRow', () => {
  it('saves a changed text and owner; Save waits for a change', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el); const onSave = vi.fn();
    await act(async () => createRoot(el).render(<VowEditRow vow={vow} party={[{ userId: 'ana', name: 'Ana' }]} busy={false} onSave={onSave} />));
    const save = el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(save.disabled).toBe(true);
    await act(async () => { setValue(el.querySelector('textarea')!, 'Fix CI this week'); setValue(el.querySelector('select')!, 'ana'); });
    await act(async () => save.click());
    expect(onSave).toHaveBeenCalledWith({ text: 'Fix CI this week', ownerId: 'ana' });
  });
});
