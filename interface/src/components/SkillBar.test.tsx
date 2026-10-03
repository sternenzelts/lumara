// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KITS } from '../data/kits';
import SkillBar from './SkillBar';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });
async function render(cooldowns: Record<string, number> = {}, onCast = vi.fn()) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  await act(async () => createRoot(el).render(<SkillBar skills={KITS.mahesvara.skills} cooldowns={cooldowns} onCast={onCast} />));
  return { el, onCast };
}

describe('SkillBar', () => {
  it('shows each skill icon with its shortcut key', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('.skill-key')].map(k => k.textContent)).toEqual(['1', '2', '3', '4']);
    expect(el.querySelectorAll('.skill-slot img')).toHaveLength(4);
  });
  it('casts when an icon is clicked', async () => {
    const { el, onCast } = await render();
    await act(async () => el.querySelectorAll<HTMLButtonElement>('.skill-slot')[1].click());
    expect(onCast).toHaveBeenCalledWith(KITS.mahesvara.skills[1]);
  });
  it('describes the skill on hover or focus', async () => {
    const { el } = await render();
    const tip = el.querySelectorAll('.skill-slot')[0].querySelector('[role=tooltip]')!;
    expect(tip.textContent).toContain('Disassemble');
    expect(tip.textContent).toContain('5 s cooldown');
    expect(el.querySelectorAll('.skill-slot')[3].querySelector('[role=tooltip]')!.textContent).toContain('45 s cooldown');
  });
  it('greys out a skill while it is cooling down', async () => {
    const { el } = await render({ disassemble: 0.5 });
    const slots = el.querySelectorAll<HTMLButtonElement>('.skill-slot');
    expect(slots[0].disabled).toBe(true);
    expect(slots[0].style.getPropertyValue('--cd')).toBe('0.5');
    expect(slots[1].disabled).toBe(false);
  });
});
