// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Stage } from '../backend/types';
import VoyageLobby, { type LobbyMember } from './VoyageLobby';

const members: LobbyMember[] = [{ userId: 'jay', name: 'Jay', characterId: 'seren', warden: true, you: true }];
afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });

async function render(p: Partial<Parameters<typeof VoyageLobby>[0]> = {}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  const props = { sprintName: 'Sprint 9', code: 's1', members, steps: ['fragment_drop', 'rewards'] as Stage[], joined: true, warden: true, busy: false, paused: false, locked: false, onJoin: vi.fn(), onEnter: vi.fn(), onCopyCode: vi.fn(), ...p };
  await act(async () => createRoot(el).render(<VoyageLobby {...props} />));
  return { el, props };
}
const button = (el: HTMLElement, name: string) => [...el.querySelectorAll('button')].find(b => b.textContent?.includes(name));

describe('VoyageLobby', () => {
  it('briefs every step in order', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('.lobby-briefing li strong')].map(s => s.textContent)).toEqual(['Write', 'Homecoming']);
  });
  it('lets the Warden enter the Sanctuary', async () => {
    const { el, props } = await render();
    await act(async () => button(el, 'Enter the Sanctuary')!.click());
    expect(props.onEnter).toHaveBeenCalled();
  });
  it('shows a newcomer the Join button instead', async () => {
    const { el, props } = await render({ joined: false, warden: false });
    expect(button(el, 'Enter the Sanctuary')).toBeUndefined();
    await act(async () => button(el, 'Join the party')!.click());
    expect(props.onJoin).toHaveBeenCalled();
  });
  it('lets the Warden lock and unlock the party', async () => {
    const onToggleLock = vi.fn();
    const { el } = await render({ onToggleLock });
    await act(async () => button(el, 'Lock party')!.click());
    expect(onToggleLock).toHaveBeenCalled();
    const locked = await render({ locked: true, onToggleLock });
    expect(button(locked.el, 'Unlock party')).toBeTruthy();
  });
  it('shows a newcomer that the party is locked', async () => {
    const { el } = await render({ joined: false, warden: false, locked: true });
    expect(button(el, 'Party locked')!.disabled).toBe(true);
  });
  it('lets the Warden remove a teammate but not themselves', async () => {
    const onRemove = vi.fn();
    const { el } = await render({ onRemove, members: [...members, { userId: 'ana', name: 'Ana', characterId: 'wren', warden: false, you: false }] });
    expect(el.querySelector('[aria-label="Remove Jay from the party"]')).toBeNull();
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Remove Ana from the party"]')!.click());
    expect(onRemove).toHaveBeenCalledWith('ana');
  });
  it('tells a joined teammate to wait for the Warden', async () => {
    const { el } = await render({ warden: false });
    expect(button(el, 'Enter the Sanctuary')).toBeUndefined();
    expect(el.textContent).toContain('Waiting for the Warden');
  });
});
