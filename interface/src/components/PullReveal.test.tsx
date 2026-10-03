// @vitest-environment jsdom
import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi, beforeEach } from 'vitest';
import PullReveal from './PullReveal';
import { isRevealActive } from '../logic/revealActivity';
import type { PullRecord } from '../backend/types';
const mounts = vi.hoisted(() => ({ ids: [] as string[] }));
beforeEach(() => { mounts.ids = []; });
vi.mock('./AyakaReveal', () => ({ default: ({ character, onDone, onSkip }: any) => {
  useEffect(() => { mounts.ids.push(character.id); }, []);
  return <div data-character={character.id}><button data-finish onClick={onDone}>Finish animation</button><button data-skip onClick={onSkip}>Skip A reveals</button></div>;
} }));

it('reveals all ten in their recorded order, remounts duplicates, and keeps music paused until closing', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'); document.body.append(host);
  const root = createRoot(host); const close = vi.fn();
  const ids = ['wren', 'wren', 'seren', 'ayaka', 'keira', 'mahesvara', 'dax', 'rook', 'kairo', 'suvara'];
  const records = ids.map(characterId => ({ characterId, grade: ['ayaka','keira','mahesvara'].includes(characterId) ? 'S++' : characterId === 'seren' ? 'S+' : 'A', duplicate: characterId === 'wren', at: 1, source: 'banner' })) as PullRecord[];
  try {
    await act(async () => root.render(<PullReveal cue={{ records, name: 'Jay', cueId: 'ten' }} onClose={close} />));
    for (let i = 0; i < 10; i++) {
      expect(document.querySelector('.batch-reveal')).toBeNull();
      expect(document.querySelector('.pull-sequence-progress')?.textContent).toBe(`${i + 1} / 10`);
      expect(isRevealActive()).toBe(true);
      await act(async () => (document.querySelector('[data-finish]') as HTMLButtonElement).click());
    }
    expect(mounts.ids).toEqual(ids);
    expect(document.querySelectorAll('.batch-cards > div')).toHaveLength(10);
    expect(close).not.toHaveBeenCalled();
    expect(isRevealActive()).toBe(true);
    await act(async () => (document.querySelector('.batch-reveal button') as HTMLButtonElement).click());
    expect(close).toHaveBeenCalledOnce();
  } finally {
    await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals();
  }
  expect(isRevealActive()).toBe(false);
});

it('Skip omits common reveals but preserves every premium reveal in recorded order', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'); document.body.append(host); const root=createRoot(host);
  const ids=['wren','seren','dax','ayaka','wren','keira','mahesvara','wren','dax','wren'];
  const records=ids.map(characterId=>({characterId,grade:characterId==='seren'?'S+':['ayaka','keira','mahesvara'].includes(characterId)?'S++':'A',at:1,duplicate:false,source:'banner'})) as PullRecord[];
  try {
    await act(async()=>root.render(<PullReveal cue={{records,name:'Jay',cueId:'skip'}} onClose={()=>{}} />));
    await act(async()=> (document.querySelector('[data-skip]') as HTMLButtonElement).click());
    expect(mounts.ids).toEqual(['wren','seren']);
    // Skip while a premium reveal is running must not suppress it.
    await act(async()=> (document.querySelector('[data-skip]') as HTMLButtonElement).click());
    expect(mounts.ids).toEqual(['wren','seren']);
    for(let i=0;i<4;i++) await act(async()=> (document.querySelector('[data-finish]') as HTMLButtonElement).click());
    expect(mounts.ids).toEqual(['wren','seren','ayaka','keira','mahesvara']);
    expect(document.querySelectorAll('.batch-cards>div')).toHaveLength(10);
  } finally { await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals(); }
});

it.each(['skip','double-click'])('%s goes directly to all results when appropriate without closing or changing rewards', async action => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host);const close=vi.fn();
  const records=Array.from({length:10},()=>({characterId:action==='skip'?'wren':'ayaka',grade:action==='skip'?'A':'S++',at:1,duplicate:false,source:'banner'})) as PullRecord[];
  try {
    await act(async()=>root.render(<PullReveal cue={{records,name:'Jay',cueId:action}} onClose={close} />));
    await act(async()=>{
      if(action==='skip') (document.querySelector('[data-skip]') as HTMLButtonElement).click();
      else document.querySelector('[data-character]')!.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
    });
    expect(document.querySelectorAll('.batch-cards>div')).toHaveLength(10);
    expect(close).not.toHaveBeenCalled();expect(records).toHaveLength(10);expect(isRevealActive()).toBe(true);
  } finally {await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();}
});
