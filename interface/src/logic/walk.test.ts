import { describe, expect, it } from 'vitest';
import { walkDirection, WALK_ROWS } from './walk';

describe('walkDirection', () => {
  it('faces the way the character mostly moves', () => {
    expect(walkDirection(5, 1, 'down')).toBe('right');
    expect(walkDirection(-5, 1, 'down')).toBe('left');
    expect(walkDirection(1, -4, 'down')).toBe('up');
    expect(walkDirection(0.5, 3, 'up')).toBe('down');
  });
  it('keeps the last direction when the step is too small to read', () => {
    expect(walkDirection(0, 0, 'left')).toBe('left');
    expect(walkDirection(0.05, -0.05, 'up')).toBe('up');
  });
  it('does not flicker between rows when walking diagonally', () => {
    // exact diagonal with rounding noise either way: keep the facing you already have
    expect(walkDirection(1, 1.0000001, 'right')).toBe('right');
    expect(walkDirection(1.0000001, 1, 'down')).toBe('down');
    expect(walkDirection(-1, -0.9, 'up')).toBe('up');
    expect(walkDirection(-1, -0.9, 'left')).toBe('left');
  });
  it('picks a side for a diagonal when the current facing is unrelated', () => {
    expect(walkDirection(1, 1, 'up')).toBe('right');
    expect(walkDirection(-1, 1, 'right')).toBe('left');
  });
  it('switches once one direction clearly dominates', () => {
    expect(walkDirection(1, 0.3, 'down')).toBe('right');
    expect(walkDirection(0.3, 1, 'right')).toBe('down');
  });
  it('matches the sprite sheet row order (down, right, up, left)', () => {
    expect(WALK_ROWS).toEqual(['down', 'right', 'up', 'left']);
  });
});
