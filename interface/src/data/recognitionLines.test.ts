import { describe, expect, it } from 'vitest';
import { CHARACTERS } from './characters';
import { RECOGNITION } from './recognitionLines';
import { VOICE_LINES } from './voiceLines';

describe('recognition lines', () => {
  it('every pullable character has a line and an existing voiced clip', () => {
    for (const c of CHARACTERS) {
      expect(RECOGNITION[c.id]?.text, c.id).toBeTruthy();
      expect(VOICE_LINES[c.id]?.some(l => l.id === RECOGNITION[c.id].clip), `${c.id} clip`).toBe(true);
    }
  });
});
