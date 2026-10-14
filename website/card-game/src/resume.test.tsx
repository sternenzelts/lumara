// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const opened: [string, string][] = [];
const enterRoom = vi.fn();
vi.mock('./online-lazy', () => ({
  usesSupabase: true,
  enterRoom,
  lazySupabaseConnection: (code: string, playerID: string) => {
    opened.push([code, playerID]);
    return { start() {}, stop() {}, getState: () => null, subscribe: (cb: (s: null) => void) => { cb(null); return () => {}; }, moves: { act() {} } };
  },
}));

let root: Root, host: HTMLDivElement;
beforeEach(() => {
  // This exercises the online form even when CI builds the live practice edition.
  vi.stubEnv('VITE_PRACTICE_ONLY', '0');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  history.replaceState(null, '', '/?room=abc123def456');
  sessionStorage.setItem('lumara.cards.room.abc123def456', JSON.stringify({ matchID: 'abc123def456', playerID: '1', transport: 'supabase' }));
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); sessionStorage.clear(); localStorage.clear(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Resume your seat (Supabase rooms)', () => {
  it('reopens the saved seat even when the name is empty and the code box was edited', async () => {
    const { default: App } = await import('./App');
    await act(async () => { root.render(<App />); });
    const code = host.querySelector<HTMLInputElement>('#room-code')!;
    expect(code).toBeInstanceOf(HTMLInputElement);
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(code, 'zzzzzzzzzzzz'); code.dispatchEvent(new Event('input', { bubbles: true })); });
    const resume = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Resume your seat'))!;
    expect(resume.disabled).toBe(false);
    await act(async () => { resume.click(); });
    expect(opened).toEqual([['abc123def456', '1']]);
    expect(enterRoom).not.toHaveBeenCalled();
  });
});
