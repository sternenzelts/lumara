// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./prereg-logic', async real => ({ ...(await real<typeof import('./prereg-logic')>()), waitingCount: async () => 3 }));
import Preregister from './Preregister';

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-15T12:00:00+08:00'));   // before launch
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); localStorage.clear(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const render = async () => { await act(async () => root.render(<Preregister background="" emblem={null} />)); };

describe('Preregister', () => {
  it('gives a registered Warden a way into the game before launch', async () => {
    localStorage.setItem('lumara.prereg', 'Moon'); await render();
    expect(container.textContent).toContain('registered, Moon');
    expect(container.querySelector<HTMLAnchorElement>('a[href="./play/"]')?.textContent).toContain('Enter Lumara');
  });
  it('shows no way in before registering', async () => {
    await render();
    expect(container.querySelector('a[href="./play/"]')).toBeNull();
  });
});
