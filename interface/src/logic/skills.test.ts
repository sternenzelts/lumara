// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { KITS } from '../data/kits';
import { canCast, cast, cooldownLeft, emptySkillState, loadSkillState } from './skills';

const kit = KITS.mahesvara;
const disassemble = kit.skills.find(s => s.id === 'disassemble')!;
const ultimate = kit.skills.find(s => s.effect === 'ultimate')!;
const changeForm = kit.skills.find(s => s.effect === 'transform')!;
beforeEach(() => localStorage.clear());

describe('Mahesvara kit', () => {
  it('has four skills on keys 1 to 4: change form is quick, the ultimate needs true form', () => {
    expect(kit.skills.map(s => s.key)).toEqual(['1', '2', '3', '4']);
    expect(changeForm.cooldownMs).toBe(500);
    expect(ultimate.requiresTrueForm).toBe(true);
  });
});

describe('cooldowns', () => {
  it('blocks a re-cast until the cooldown has passed', () => {
    let st = emptySkillState();
    expect(canCast(disassemble, st, 1000, 's1', 'mahesvara')).toBe(true);
    st = cast(disassemble, st, 1000, 's1', 'mahesvara');
    expect(canCast(disassemble, st, 3000, 's1', 'mahesvara')).toBe(false);
    expect(cooldownLeft(disassemble, st, 3500, 's1', 'mahesvara')).toBeCloseTo(0.5);
    expect(canCast(disassemble, st, 6000, 's1', 'mahesvara')).toBe(true);
  });
  it('gives the ultimate a 45 s cooldown', () => {
    expect(ultimate.cooldownMs).toBe(45000);
    const st = cast(ultimate, emptySkillState(), 1000, 's1', 'mahesvara');
    expect(canCast(ultimate, st, 30000, 's1', 'mahesvara')).toBe(false);
    expect(canCast(ultimate, st, 46000, 's1', 'mahesvara')).toBe(true);
  });

});

describe('admin cooldown setting', () => {
  it('half halves every timed cooldown', () => {
    const st = cast(disassemble, emptySkillState(), 1000, 's1', 'mahesvara');
    expect(canCast(disassemble, st, 3000, 's1', 'mahesvara', 'half')).toBe(false);
    expect(canCast(disassemble, st, 3500, 's1', 'mahesvara', 'half')).toBe(true);
    expect(cooldownLeft(disassemble, st, 2250, 's1', 'mahesvara', 'half')).toBeCloseTo(0.5);
  });
  it('none lets every skill be cast again at once, including a once-per-voyage ultimate', () => {
    const voyageUlt = { ...ultimate, cooldownMs: 'voyage' as const };
    let st = cast(disassemble, emptySkillState(), 1000, 's1', 'mahesvara');
    st = cast(voyageUlt, st, 1000, 's1', 'mahesvara');
    expect(canCast(disassemble, st, 1001, 's1', 'mahesvara', 'none')).toBe(true);
    expect(canCast(voyageUlt, st, 1001, 's1', 'mahesvara', 'none')).toBe(true);
    expect(cooldownLeft(voyageUlt, st, 1001, 's1', 'mahesvara', 'none')).toBe(0);
  });
});

describe('cooldowns survive a page refresh', () => {
  it('a cast is saved in this browser and loaded again for the same character', () => {
    cast(disassemble, emptySkillState(), 1000, 's1', 'mahesvara');
    expect(loadSkillState('mahesvara')).toEqual({ [disassemble.id]: 1000 });
    expect(loadSkillState('ayaka')).toEqual({});
  });
});
