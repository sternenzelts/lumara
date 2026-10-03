import { describe, expect, it } from 'vitest';
import { chatterDelayMs, chatterPool, eventLine, eventSpeaker, pickLine, skillLine, speakMs } from './chatter';

describe('chatterPool', () => {
  it('uses tap, idle and quirk lines — never pull, retro or skill lines', () => {
    const ids = chatterPool('azrenth', []).map(l => l.id);
    expect(ids).toEqual(expect.arrayContaining(['greet', 'tap_2', 'tap_5', 'idle', 'laugh', 'misfit']));
    for (const no of ['reveal', 'sig_full', 'select', 'vote', 'vow', 'beacon', 'skill_1', 'ultimate', 'retro_end', 'goodnight', 'pity', 'walk_start']) expect(ids).not.toContain(no);
  });
  it('adds a "see <name>" line only while that character is on the map', () => {
    expect(chatterPool('ayaka', []).map(l => l.id)).not.toContain('see_seren');
    expect(chatterPool('ayaka', ['seren', 'keira']).map(l => l.id)).toContain('see_seren');
  });
  it('characters without recorded lines have an empty pool', () => {
    expect(chatterPool('nobody', [])).toEqual([]);
  });
});

describe('pickLine', () => {
  const pool = chatterPool('ayaka', []);
  it('avoids lines said recently', () => {
    const recent = pool.slice(0, pool.length - 1).map(l => l.id);
    expect(pickLine(pool, recent, () => 0)?.id).toBe(pool[pool.length - 1].id);
  });
  it('falls back to any line when everything was said recently', () => {
    expect(pickLine(pool, pool.map(l => l.id), () => 0)).toBeDefined();
  });
});

describe('pacing', () => {
  it('the whole plaza hears about one line every 30–60 s, whatever the party size', () => {
    for (const n of [1, 3, 6]) {
      expect(chatterDelayMs(n, () => 0) / n).toBe(30000);
      expect(chatterDelayMs(n, () => 0.999) / n).toBeCloseTo(60000, -2);
    }
  });
  it('a bubble stays up longer for longer lines, within 2.5–6 s', () => {
    expect(speakMs('Stop.')).toBe(2500);
    expect(speakMs('x'.repeat(400))).toBe(6000);
  });
});

describe('retro moments', () => {
  it('finds the matching line, including Seren\'s differently named ones', () => {
    expect(eventLine('azrenth', 'vote')?.id).toBe('vote');
    expect(eventLine('seren', 'vote')?.id).toBe('stage_vote');
    expect(eventLine('seren', 'vow')?.id).toBe('vow_fulfilled');
    expect(eventLine('nobody', 'vote')).toBeUndefined();
  });
  it('exactly one party member speaks, and every tab agrees who', () => {
    const party = ['ben', 'ana', 'cy'];
    const who = eventSpeaker(party, 'vote:s1');
    expect(party).toContain(who);
    expect(eventSpeaker([...party].reverse(), 'vote:s1')).toBe(who);
    expect(eventSpeaker([], 'vote:s1')).toBeUndefined();
  });
});

describe('skillLine', () => {
  it('finds the bubble text for a skill voice clip', () => {
    expect(skillLine('ayaka', '/art/ayaka/vo_skill_frost_cadenza.mp3')?.text).toContain('Frost Cadenza');
    expect(skillLine('azrenth', '/art/azrenth/voice/skill_2.mp3')?.text).toContain('Black Sun');
    expect(skillLine('azrenth', '/art/azrenth/vo_jirasd.mp3')).toBeUndefined();
  });
});
