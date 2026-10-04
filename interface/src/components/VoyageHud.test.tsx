// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VoyageHud from './VoyageHud';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
async function render(p: Partial<Parameters<typeof VoyageHud>[0]> = {}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  const props = { progress: { title: 'Vow review', index: 2, total: 7 }, paused: false, warden: true, busy: false, canBack: true, nextLabel: 'Next stage', actionLabel: 'Vow review', onBack: vi.fn(), onNext: vi.fn(), onOpen: vi.fn(), ...p };
  await act(async () => createRoot(el).render(<VoyageHud {...props} />));
  return { el, props };
}
const button = (el: HTMLElement, name: string) => [...el.querySelectorAll('button')].find(b => b.textContent?.includes(name));

describe('VoyageHud', () => {
  it('shows where the party is', async () => {
    const { el } = await render();
    expect(el.querySelector('.voyage-stage-label')?.textContent).toContain('Vow review · 2 of 7');
  });
  it('gives the Warden Back and Next', async () => {
    const { el, props } = await render();
    await act(async () => button(el, 'Next stage')!.click());
    expect(props.onNext).toHaveBeenCalled();
    expect(button(el, 'Back')).toBeTruthy();
  });
  it('hides stage controls from teammates', async () => {
    const { el } = await render({ warden: false, onLobby: vi.fn() });
    expect(button(el, 'Next stage')).toBeUndefined();
    expect(button(el, 'Return to lobby')).toBeUndefined();
  });
  it('lets the Warden take the party back to the lobby', async () => {
    const onLobby = vi.fn();
    const { el } = await render({ onLobby });
    await act(async () => button(el, 'Return to lobby')!.click());
    expect(onLobby).toHaveBeenCalled();
  });
  it('blocks Next and says Paused while paused', async () => {
    const { el } = await render({ paused: true });
    expect(button(el, 'Next stage')!.disabled).toBe(true);
    expect(el.textContent).toContain('Paused');
  });
  it('opens the stage window from the action button', async () => {
    const { el, props } = await render();
    await act(async () => el.querySelector<HTMLButtonElement>('.voyage-action')!.click());
    expect(props.onOpen).toHaveBeenCalled();
  });
  it('hides the bottom action button when the stage opens from the map instead', async () => {
    const { el } = await render({ actionLabel: null });
    expect(el.querySelector('.voyage-action')).toBeNull();
  });
  it('cancels the voyage only after the Warden confirms', async () => {
    const onCancel = vi.fn();
    const { el } = await render({ onCancel });
    await act(async () => button(el, 'Cancel voyage')!.click());
    expect(onCancel).not.toHaveBeenCalled();
    expect(el.querySelector('[role=alertdialog]')?.textContent).toContain('as if it never happened');
    await act(async () => button(el, 'Keep voyage')!.click());
    expect(el.querySelector('[role=alertdialog]')).toBeNull();
    await act(async () => button(el, 'Cancel voyage')!.click());
    await act(async () => [...el.querySelectorAll('[role=alertdialog] button')].find(b => b.textContent?.includes('Cancel voyage'))!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
  it('shows no cancel control to players', async () => {
    const { el } = await render({ warden: false, onCancel: vi.fn() });
    expect(button(el, 'Cancel voyage')).toBeUndefined();
  });
});
