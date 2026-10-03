import { describe, expect, it } from 'vitest';
import { toPlayer, toSession, toVow } from './supabaseRows';

describe('row mappers', () => {
  it('maps a session row to a Session', () => {
    expect(toSession({ id: 's1', sprint_name: 'Sprint 9', stage: 'vote', status: 'active', warden_id: 'u1', current_fragment_id: null, timer_ends_at: null, created_at: 5 }))
      .toEqual({ id: 's1', sprintName: 'Sprint 9', stage: 'vote', status: 'active', wardenId: 'u1', currentFragmentId: null, timerEndsAt: null, createdAt: 5 });
  });
  it('builds a Player with pulls and grants, and old-shape defaults', () => {
    const p = toPlayer({ user_id: 'u1', nickname: null, intro_seen: false, display_character_id: null, owned: { wren: 1 } },
      [{ character_id: 'wren', grade: 'A', source: 'welcome', duplicate: false, session_id: null, at: 3 }],
      [{ id: 'g1', currency: 'starlight', amount: 6000, by_user_id: null, at: 4 }]);
    expect(p).toEqual({ userId: 'u1', nickname: null, introSeen: false, displayCharacterId: null, owned: { wren: 1 },
      pulls: [{ characterId: 'wren', grade: 'A', source: 'welcome', duplicate: false, at: 3 }],
      currencyGrants: [{ id: 'g1', currency: 'starlight', amount: 6000, byUserId: '', at: 4 }] });
  });
  it('keeps the voyage id on a free wish', () => {
    const p = toPlayer({ user_id: 'u1', nickname: 'A', intro_seen: true, display_character_id: null, owned: {} }, [{ character_id: 'rook', grade: 'A', source: 'opening', duplicate: false, session_id: 's1', at: 1 }], []);
    expect(p.pulls[0].sessionId).toBe('s1');
  });
  it('maps a vow', () => {
    expect(toVow({ id: 'v', session_id: 's', text: 't', owner_id: null, status: 'open', created_at: 1 })).toEqual({ id: 'v', sessionId: 's', text: 't', ownerId: null, status: 'open', createdAt: 1 });
  });
});
