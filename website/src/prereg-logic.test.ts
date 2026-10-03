import { describe, expect, it } from 'vitest';
import { LAUNCH, cleanName, launchState, milestoneLamps, preregister, waitingCount } from './prereg-logic';

describe('pre-registration', () => {
  it('counts down to 16 Oct 2026 and switches to live at launch', () => {
    expect(launchState(new Date('2026-10-15T09:00:00+08:00'))).toMatchObject({ live: false, days: 1, hours: 0 });
    expect(launchState(LAUNCH)).toMatchObject({ live: true });
  });
  it('lights milestone lamps at 10, 25 and 50 Wardens', () => {
    expect([0, 9, 10, 24, 25, 50, 80].map(milestoneLamps)).toEqual([0, 0, 1, 1, 2, 3, 3]);
  });
  it('accepts 2-16 character names', () => {
    expect(cleanName('  Jay  ')).toBe('Jay');
    expect(() => cleanName('J')).toThrow();
    expect(() => cleanName('x'.repeat(17))).toThrow();
  });
});

describe('pre-registration with Supabase', () => {
  const fake = (over: Record<string, unknown> = {}) => {
    const calls: string[] = [];
    const db = {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        signInAnonymously: async () => { calls.push('signin'); return { error: null }; },
      },
      rpc: async (fn: string, args?: unknown) => { calls.push(fn + (args ? JSON.stringify(args) : '')); return fn === 'prereg_count' ? { data: 7, error: null } : { data: null, error: null }; },
      ...over,
    };
    return { db, calls };
  };
  it('signs in anonymously and registers the cleaned name', async () => {
    const { db, calls } = fake();
    expect(await preregister('  Jay  ', db as never)).toBe('Jay');
    expect(calls).toEqual(['signin', 'preregister{"p_name":"Jay"}']);
  });
  it('shows the server error, e.g. a taken name', async () => {
    const { db } = fake({ rpc: async () => ({ data: null, error: { message: 'That Warden name is taken. Try another.' } }) });
    await expect(preregister('Jay', db as never)).rejects.toThrow('taken');
  });
  it('reads the real Wardens count', async () => {
    expect(await waitingCount(fake().db as never)).toBe(7);
  });
});
