// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLocalBackend } from '../backend/local';
import SpeakerReel from './SpeakerReel';

afterEach(() => { document.body.innerHTML = ''; vi.useRealTimers(); vi.unstubAllGlobals(); localStorage.clear(); });
describe('SpeakerReel', () => {
  it('plays the same reel on every screen and lands on the pick', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('BroadcastChannel', class { postMessage() {} addEventListener() {} close() {} });
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    const backend = createLocalBackend('jay');
    const el = document.createElement('div'); document.body.append(el);
    const party = [{ userId: 'a', name: 'Ana', characterId: 'wren' }, { userId: 'b', name: 'Bob', characterId: null }];
    await act(async () => createRoot(el).render(<SpeakerReel backend={backend} sessionId="s1" party={party} />));
    await act(async () => backend.emit('speaker', { sessionId: 'other', frames: ['a'] }));
    expect(el.textContent).toBe('');
    await act(async () => backend.emit('speaker', { sessionId: 's1', frames: ['a', 'b', 'a', 'b'] }));
    // Each frame's timeout is scheduled by an effect after the previous render, so advance in small steps.
    const advance = async (ms: number) => { for (let t = 0; t < ms; t += 50) await act(async () => { vi.advanceTimersByTime(50); }); };
    await advance(1000);
    expect(el.querySelector('.speaker-reel.landed')?.textContent).toContain('Bob');
    await advance(2000);
    expect(el.textContent).toBe('');
  });
});
