// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PartyProgress from './PartyProgress';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
const att = (userId: string, peerGiven: number) => ({ userId, sessionId: 's', joinedAt: 1, votesCast: 0, characterId: null, checkinDone: true, peerGiven });
describe('PartyProgress', () => {
  it('shows who finished peer feedback, and check-in answers only when the backend returns them (Homecoming)', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el);
    await act(async () => createRoot(el).render(<PartyProgress members={[{ userId: 'a', name: 'Ana' }, { userId: 'b', name: 'Bob' }]} attendance={[att('a', 1), att('b', 0)]} checkins={[{ sessionId: 's', userId: 'a', sat: 4, growth: 5 }]} />));
    const row = (name: string) => [...el.querySelectorAll('li')].find(li => li.textContent?.includes(name))!;
    expect(row('Ana').querySelector('[aria-label="Peer feedback done"]')).toBeTruthy(); expect(row('Ana').textContent).toContain('♥ 4 · ◆ 5');
    expect(row('Bob').querySelector('[aria-label="Peer feedback not done"]')).toBeTruthy(); expect(row('Bob').textContent).not.toContain('♥ ');
  });
});
