// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Minimap from './Minimap';

afterEach(() => { document.body.innerHTML = ''; vi.unstubAllGlobals(); });

describe('Minimap', () => {
  it('shows you, your teammates, the crystals, the beacon and lit lamps', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const el = document.createElement('div'); document.body.append(el);
    await act(async () => createRoot(el).render(<Minimap you={{ x: .3, y: .6 }} mates={[{ x: .5, y: .5 }, { x: .7, y: .4 }]} lit={3} />));
    const you = el.querySelector<HTMLElement>('.minimap .you')!;
    expect(you.style.left).toBe('30%'); expect(you.style.top).toBe('60%');
    expect(el.querySelectorAll('.minimap .mate')).toHaveLength(2);
    expect(el.querySelectorAll('.minimap .crystal')).toHaveLength(4);
    expect(el.querySelector('.minimap .beacon')).toBeTruthy();
    expect(el.querySelectorAll('.minimap .lamp.lit')).toHaveLength(3);
  });
});
