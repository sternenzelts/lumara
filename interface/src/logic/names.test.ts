import { describe, expect, it } from 'vitest';
import { cleanNickname, NICKNAME_ERROR, withNicknames } from './names';
import type { Player } from '../backend/types';

const player = (userId: string, nickname: string | null): Player => ({ userId, displayCharacterId: null, owned: {}, pulls: [], nickname, introSeen: false });

describe('cleanNickname', () => {
  it('trims and collapses inner whitespace', () => { expect(cleanNickname('  Jay   D  ')).toBe('Jay D'); });
  it('strips control characters', () => { expect(cleanNickname('Ja\u0000y\n')).toBe('Jay'); });
  it('rejects empty or blank names', () => {
    expect(() => cleanNickname('')).toThrow(NICKNAME_ERROR);
    expect(() => cleanNickname('    ')).toThrow(NICKNAME_ERROR);
  });
  it('rejects names over 16 characters', () => { expect(() => cleanNickname('a'.repeat(17))).toThrow(NICKNAME_ERROR); });
  it('counts emoji as single characters', () => { expect(cleanNickname('🌸'.repeat(16))).toBe('🌸'.repeat(16)); });
});

describe('withNicknames', () => {
  it('shows the nickname and keeps the account name', () => {
    expect(withNicknames({ ana: { name: 'Ana' } }, [player('ana', 'Moon')])).toEqual({ ana: { name: 'Moon', accountName: 'Ana' } });
  });
  it('falls back to the account name without a nickname', () => {
    expect(withNicknames({ ana: { name: 'Ana' } }, [player('ana', null)])).toEqual({ ana: { name: 'Ana', accountName: 'Ana' } });
  });
  it('includes players whose profile has not loaded yet', () => {
    expect(withNicknames({}, [player('rook', 'Rookie')])).toEqual({ rook: { name: 'Rookie', accountName: '' } });
  });
});
