import { describe, expect, it } from 'vitest';
import { AEGIS, CADENZA, GUIDE, DECEL, LANTERN, THUNDER, WALL, wallBlocks, NIFLHEIM, SOAR, STASIS, canCastWhileHeld, inLantern, soarTarget, cutStasis, endStasis, isHeld, pickCadenzaTarget, slowFactor, type FieldFx } from './fieldEffects';

const size = { w: 2000, h: 1000 };   // 1 map unit = 2000 px across, 1000 px down
const fx = (f: Partial<FieldFx> & Pick<FieldFx, 'kind'>): FieldFx => ({ id: 'x', userId: 'ayaka-player', at: 0, until: 99999, pos: { x: 0.5, y: 0.5 }, ...f });

describe('Deceleration Zone', () => {
  const dome = fx({ kind: 'decel', until: DECEL.ms });
  it('halves the speed of someone standing inside the dome', () => {
    expect(slowFactor('ana', { x: 0.5 + 100 / size.w, y: 0.5 }, [dome], 1000, size)).toBe(DECEL.slow);
  });
  it('does not slow someone outside the radius', () => {
    expect(slowFactor('ana', { x: 0.5 + (DECEL.radius + 5) / size.w, y: 0.5 }, [dome], 1000, size)).toBe(1);
  });
  it('measures the radius in screen pixels (vertical too)', () => {
    expect(slowFactor('ana', { x: 0.5, y: 0.5 + (DECEL.radius - 5) / size.h }, [dome], 1000, size)).toBe(DECEL.slow);
  });
  it('never slows Ayaka herself', () => {
    expect(slowFactor('ayaka-player', { x: 0.5, y: 0.5 }, [dome], 1000, size)).toBe(1);
  });
  it('stops slowing once the dome fades', () => {
    expect(slowFactor('ana', { x: 0.5, y: 0.5 }, [dome], DECEL.ms + 1, size)).toBe(1);
  });
});

describe('isHeld', () => {
  it('Frost Cadenza stuns only its target, for the travel time plus 1 s', () => {
    const shot = fx({ kind: 'cadenza', targetId: 'ana' });
    expect(isHeld('ana', [shot], 100)).toBe(true);
    expect(isHeld('ana', [shot], CADENZA.hitMs + CADENZA.stunMs - 1)).toBe(true);
    expect(isHeld('ana', [shot], CADENZA.hitMs + CADENZA.stunMs + 1)).toBe(false);
    expect(isHeld('ben', [shot], 100)).toBe(false);
  });
  it('Niflheim keeps Ayaka seated on her throne, nobody else', () => {
    const throne = fx({ kind: 'niflheim' });
    expect(isHeld('ayaka-player', [throne], NIFLHEIM.seatedMs - 1)).toBe(true);
    expect(isHeld('ayaka-player', [throne], NIFLHEIM.seatedMs + 1)).toBe(false);
    expect(isHeld('ana', [throne], 500)).toBe(false);
  });
  it('Chrono Stasis freezes everyone but Ayaka from the tick for 10 s', () => {
    const stop = fx({ kind: 'stasis' });
    expect(isHeld('ana', [stop], STASIS.tickMs - 1)).toBe(false);
    expect(isHeld('ana', [stop], STASIS.tickMs + 1)).toBe(true);
    expect(STASIS.releaseMs - STASIS.tickMs).toBe(10000);
    expect(isHeld('ana', [stop], STASIS.releaseMs + 1)).toBe(false);
    expect(isHeld('ayaka-player', [stop], STASIS.tickMs + 1)).toBe(false);
  });
});

describe('pickCadenzaTarget', () => {
  const from = { x: 0.5, y: 0.5 };
  const ana = { id: 'ana', x: 0.5 + 200 / size.w, y: 0.5 };
  const ben = { id: 'ben', x: 0.5, y: 0.5 + 150 / size.h };
  it('targets the player nearest the cursor', () => {
    expect(pickCadenzaTarget(from, { x: ana.x + 10 / size.w, y: ana.y }, [ana, ben], size, { x: 1, y: 0 })).toEqual({ targetId: 'ana', to: { x: ana.x, y: ana.y } });
    expect(pickCadenzaTarget(from, { x: ben.x, y: ben.y - 10 / size.h }, [ana, ben], size, { x: 1, y: 0 }).targetId).toBe('ben');
  });
  it('ignores players out of range', () => {
    const far = { id: 'far', x: 0.5 + (CADENZA.range + 50) / size.w, y: 0.5 };
    expect(pickCadenzaTarget(from, { x: far.x, y: far.y }, [far], size, { x: 1, y: 0 }).targetId).toBeUndefined();
  });
  it('with nobody near the cursor, the spires burst at the cursor (capped to range)', () => {
    const r = pickCadenzaTarget(from, { x: 0.5, y: 0.5 - 100 / size.h }, [ana], size, { x: 1, y: 0 });
    expect(r.targetId).toBeUndefined();
    expect(r.to.y).toBeCloseTo(0.5 - 100 / size.h);
    const capped = pickCadenzaTarget(from, { x: 0.9, y: 0.5 }, [], size, { x: 1, y: 0 });
    expect((capped.to.x - 0.5) * size.w).toBeCloseTo(CADENZA.range);
  });
  it('without a mouse (touch), takes the nearest player in range, else shoots the way she faces', () => {
    expect(pickCadenzaTarget(from, null, [ana, ben], size, { x: 1, y: 0 }).targetId).toBe('ben');
    const r = pickCadenzaTarget(from, null, [], size, { x: -1, y: 0 });
    expect(r.to.x).toBeLessThan(0.5);
  });
});

describe('Venuzdonoa cuts Chrono Stasis', () => {
  const stop = fx({ kind: 'stasis' }), t = STASIS.tickMs + 500;
  it('a frozen Azrenth may still cast a skill that counters time stop', () => {
    expect(canCastWhileHeld('az', { counters: 'stasis' }, [stop], t)).toBe(true);
    expect(canCastWhileHeld('az', {}, [stop], t)).toBe(false);
  });
  it('but not while stunned in ice', () => {
    expect(canCastWhileHeld('az', { counters: 'stasis' }, [stop, fx({ kind: 'cadenza', targetId: 'az', at: t - 100 })], t)).toBe(false);
  });
  it('the cut ends the freeze for everyone at once', () => {
    const field = cutStasis([stop, fx({ id: 'd', kind: 'decel' })], t);
    expect(isHeld('ana', field, t + 1)).toBe(false);
    expect(field.find(f => f.kind === 'stasis')?.cutAt).toBe(t);
    expect(field.find(f => f.kind === 'decel')?.cutAt).toBeUndefined();
  });
});

describe('Suvara', () => {
  it('Lantern Ascent lights everyone within reach — her too', () => {
    const lit = fx({ kind: 'lantern', until: LANTERN.ms });
    expect(inLantern({ x: 0.5 + 100 / size.w, y: 0.5 }, [lit], 1000, size)).toBe(true);
    expect(inLantern({ x: 0.5, y: 0.5 }, [lit], 1000, size)).toBe(true);
    expect(inLantern({ x: 0.5 + (LANTERN.radius + 5) / size.w, y: 0.5 }, [lit], 1000, size)).toBe(false);
    expect(inLantern({ x: 0.5, y: 0.5 }, [lit], LANTERN.ms + 1, size)).toBe(false);
  });
  it('Yulan carries her toward the cursor, capped to his range', () => {
    const from = { x: 0.5, y: 0.5 };
    expect(soarTarget(from, { x: 0.5 + 200 / size.w, y: 0.5 }, size, { x: 1, y: 0 })).toEqual({ x: 0.5 + 200 / size.w, y: 0.5 });
    expect((soarTarget(from, { x: 0.95, y: 0.5 }, size, { x: 1, y: 0 }).x - 0.5) * size.w).toBeCloseTo(SOAR.range);
    expect(soarTarget(from, null, size, { x: -1, y: 0 }).x).toBeLessThan(0.5);
  });
  it('she rides (can\'t walk) until Yulan lands', () => {
    const ride = fx({ kind: 'soar' });
    expect(isHeld('ayaka-player', [ride], SOAR.landMs - 1)).toBe(true);
    expect(isHeld('ayaka-player', [ride], SOAR.landMs + 1)).toBe(false);
    expect(isHeld('ana', [ride], 500)).toBe(false);
  });
});

describe('Lucien', () => {
  const wall = fx({ kind: 'wall', pos: { x: 0.5, y: 0.5 }, until: WALL.ms });
  it('Rampart of Stone blocks walking into it', () => {
    expect(wallBlocks({ x: 0.5 - 100 / size.w, y: 0.5 }, { x: 0.5 - 30 / size.w, y: 0.5 }, [wall], 100, size)).toBe(true);
    expect(wallBlocks({ x: 0.5 - 100 / size.w, y: 0.5 }, { x: 0.5 - 95 / size.w, y: 0.5 }, [wall], 100, size)).toBe(false);
    expect(wallBlocks({ x: 0.5 - 100 / size.w, y: 0.5 }, { x: 0.5 - 30 / size.w, y: 0.5 }, [wall], WALL.ms + 1, size)).toBe(false);
  });
  it('lets someone already inside walk out', () => {
    expect(wallBlocks({ x: 0.5, y: 0.5 }, { x: 0.5 + 10 / size.w, y: 0.5 }, [wall], 100, size)).toBe(false);
  });
  it('Lunar Aegis makes those inside immune to Ayaka\'s slow and ice stun', () => {
    const aegis = fx({ id: 'a', kind: 'aegis', userId: 'luc', pos: { x: 0.5, y: 0.5 }, until: AEGIS.ms });
    const dome = fx({ id: 'd', kind: 'decel', until: DECEL.ms });
    expect(slowFactor('ana', { x: 0.5, y: 0.5 }, [dome, aegis], 100, size)).toBe(1);
    expect(isHeld('ana', [fx({ kind: 'cadenza', targetId: 'ana' }), aegis], 100, { ana: { x: 0.5, y: 0.5 } }, size)).toBe(false);
    expect(isHeld('ana', [fx({ kind: 'cadenza', targetId: 'ana' }), aegis], 100, { ana: { x: 0.9, y: 0.5 } }, size)).toBe(true);
  });
  it('Thunder Sovereign: he is lightning (can\'t walk) until he lands', () => {
    const t = fx({ kind: 'thunder', userId: 'luc' });
    expect(isHeld('luc', [t], THUNDER.landMs - 1)).toBe(true);
    expect(isHeld('luc', [t], THUNDER.landMs + 1)).toBe(false);
  });
});

describe('Seren', () => {
  const guide = fx({ kind: 'guide', userId: 'seren-player', until: GUIDE.ms });
  it('Guiding Light: everyone inside (her too) walks faster', () => {
    expect(slowFactor('ana', { x: 0.5, y: 0.5 }, [guide], 100, size)).toBe(GUIDE.boost);
    expect(slowFactor('seren-player', { x: 0.5, y: 0.5 }, [guide], 100, size)).toBe(GUIDE.boost);
    expect(slowFactor('ana', { x: 0.5 + (GUIDE.radius + 5) / size.w, y: 0.5 }, [guide], 100, size)).toBe(1);
  });
  it('and cancels Ayaka\'s slow', () => {
    expect(slowFactor('ana', { x: 0.5, y: 0.5 }, [fx({ id: 'd', kind: 'decel' }), guide], 100, size)).toBe(GUIDE.boost);
  });
});

describe('endStasis (Ayaka presses 4 again)', () => {
  const stop = (o: Partial<FieldFx> = {}): FieldFx => ({ id: 's', userId: 'aya', kind: 'stasis', at: 0, until: STASIS.ms, pos: { x: 0.5, y: 0.5 }, ...o });
  it('releases her own time-stop at once and marks it ended (not cut by a sword)', () => {
    const t = STASIS.tickMs + 2000;
    const [f] = endStasis([stop()], 'aya', t);
    expect(f.cutAt).toBe(t); expect(f.ended).toBe(true);
    expect(isHeld('ana', [f], t + 1)).toBe(false);
  });
  it("cannot end someone else's time-stop", () => {
    const [f] = endStasis([stop()], 'ana', STASIS.tickMs + 2000);
    expect(f.cutAt).toBeUndefined();
  });
});
