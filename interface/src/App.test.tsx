// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { configureBackend } from './backend';
import { createLocalBackend } from './backend/local';

let container: HTMLDivElement, root: Root;
const seedPlayer = (userId: string, nickname: string | null, introSeen: boolean, extra: Record<string, unknown> = {}) =>
  localStorage.setItem('lumara.demo.v1', JSON.stringify({ players: [{ userId, displayCharacterId: null, owned: {}, pulls: [], nickname, introSeen }], ...extra }));
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('BroadcastChannel', class { postMessage() {} addEventListener() {} });
  vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('Audio', class { src = ''; volume = 1; constructor(src?: string) { this.src = src || ''; } play() { return Promise.resolve(); } pause() {} load() {} });
  vi.stubGlobal('scrollTo', () => {});
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => {};
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); location.hash = ''; });

async function start(player: string, hash: string) {
  location.hash = hash; configureBackend(createLocalBackend(player));
  await act(async () => root.render(<App />));
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
}
const beat = () => container.querySelector('[data-beat]')?.getAttribute('data-beat') ?? null;
const button = (label: string) => Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === label || b.textContent?.trim() === label);
async function click(label: string) { const b = button(label === 'Continue' && beat() === 'welcome' ? 'Choose your name' : label); expect(b, label).toBeTruthy(); await act(async () => b!.click()); }
async function submitName(value: string) {
  const input = container.querySelector<HTMLInputElement>('#nickname-input')!;
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
  await act(async () => { container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); await new Promise(r => setTimeout(r, 0)); });
}

describe('opening gate', () => {
  it('gives a first-time player five free wishes, then sets their companion', async () => {
    seedPlayer('ana','Moon',true); vi.spyOn(Math,'random').mockReturnValue(.9); await start('ana','#map');
    expect(location.hash).toBe('#banner');
    const available=Array.from(container.querySelectorAll('button')).filter(b=>!b.disabled&&!b.closest('[inert]'));
    expect(available.map(b=>b.textContent?.trim())).toEqual(['Make 5 free wishes']);
    await click('Make 5 free wishes');
    expect(document.body.textContent).toContain('DAX');
    expect(document.querySelector('.pull-sequence-progress')?.textContent).toBe('1 / 5');
    expect(document.querySelectorAll('.batch-cards>div')).toHaveLength(0);
    await click('Skip A reveals');
    expect(document.querySelectorAll('.batch-cards>div')).toHaveLength(5); await click('Done');
    await act(async()=>{await new Promise(r=>setTimeout(r,0))});
    expect(location.hash).toBe('#sanctuary');const store=JSON.parse(localStorage.getItem('lumara.demo.v1')!);const p=store.players.find((p: {userId:string})=>p.userId==='ana');expect(p.displayCharacterId).toBe('dax');expect(p.pulls).toHaveLength(5);expect(p.pulls.every((r: {source:string})=>r.source==='welcome')).toBe(true);expect(container.querySelector('.game-wallet')?.textContent).toContain('1,200');
  });
  it('shows twelve lamp pips and routes both wallet plus buttons', async () => {
    seedPlayer('ana','Moon',true,{players:[{userId:'ana',nickname:'Moon',introSeen:true,owned:{wren:1},pulls:[],displayCharacterId:'wren'}],vows:[{id:'v',sessionId:'s',text:'Kept',ownerId:null,status:'fulfilled',createdAt:1}]});await start('ana','#sanctuary');
    expect(container.querySelectorAll('.game-beacon-pips i')).toHaveLength(12);expect(container.querySelectorAll('.game-beacon-pips i.lit')).toHaveLength(1);
    await click('Get Starlight');expect(location.hash).toBe('#banner');await click('Exchange Stardust');expect(location.hash).toBe('#exchange');
  });

  it('opens the journal from the beacon and returns to the same voyage and position', async () => {
    if (!HTMLDialogElement.prototype.showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, writable: true, value() {} });
    if (!HTMLDialogElement.prototype.close) Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, writable: true, value() {} });
    vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (this: HTMLDialogElement) { this.setAttribute('open', ''); this.querySelector<HTMLButtonElement>('button')?.focus(); });
    vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (this: HTMLDialogElement) { this.removeAttribute('open'); });
    const session = { id: 'crystal-session', sprintName: 'Crystal test', stage: 'fragment_drop', status: 'active', wardenId: 'jay', currentFragmentId: null, timerEndsAt: null, createdAt: 1 };
    seedPlayer('ana', 'Moon', true, {
      players: [{ userId: 'ana', nickname: 'Moon', introSeen: true, owned: { wren: 1 }, pulls: [], displayCharacterId: 'wren' }],
      sessions: [session], attendance: [{ sessionId: session.id, userId: 'ana', characterId: 'wren', ready: false, votesCast: 0, joinedAt: 1 }],
      vows: ['open', 'fulfilled', 'not_yet', 'carried', 'dropped'].map((status, i) => ({ id: `promise-${i}`, sessionId: 'past', text: `Promise ${i}`, status, ownerId: null, createdAt: 1 })),
    });
    await start('ana', '#retro');
    expect(container.querySelector('.voyage-window[open]')).toBeNull();
    expect(button('My thoughts')).toBeTruthy();
    expect(button('Open vow journal')).toBeUndefined();
    await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })));
    await act(async () => { await new Promise(r => setTimeout(r, 850)); });
    await act(async () => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })));
    const scene = container.querySelector('.sanctuary-scene');
    const own = container.querySelector<HTMLElement>('.scene-character.own')!;
    const position = [own.style.left, own.style.top];
    button('Open vow journal')!.focus();
    await click('Open vow journal');
    const journal = container.querySelector<HTMLDialogElement>('.vow-journal-window')!;
    expect(journal.open).toBe(true);
    expect(journal.querySelectorAll('.vow-row')).toHaveLength(5);
    expect(journal.textContent).toContain('not yet');
    expect(journal.textContent).toContain('Shared by the team');
    expect(journal.querySelectorAll('button[aria-pressed]:disabled')).toHaveLength(5);
    await act(async () => journal.dispatchEvent(new Event('cancel', { cancelable: true })));
    expect(container.querySelector('.vow-journal-window')).toBeNull();
    expect(container.querySelector('.sanctuary-scene')).toBe(scene);
    expect([own.style.left, own.style.top]).toEqual(position);
    expect(location.hash).toBe('#retro');
    expect(JSON.parse(localStorage.getItem('lumara.demo.v1')!).sessions[0].stage).toBe('fragment_drop');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Open vow journal');
  });

  it('sends a brand-new player from the Sanctuary into the opening', async () => {
    await start('newbie', '#sanctuary');
    expect(location.hash).toBe('#welcome'); expect(beat()).toBe('welcome');
  });
  it('redirects into the opening without adding a history entry', async () => {
    location.hash = '#sanctuary'; const before = history.length;
    configureBackend(createLocalBackend('newbie')); await act(async () => root.render(<App />));
    expect(location.hash).toBe('#welcome'); expect(history.length).toBe(before);
  });
  it('does not ask for the name again when Back is pressed after naming', async () => {
    await start('newbie', '#sanctuary'); await click('Continue'); await submitName('Moon'); expect(beat()).toBe('greeted');
    await act(async () => { location.hash = '#sanctuary'; window.dispatchEvent(new HashChangeEvent('hashchange')); await new Promise(r => setTimeout(r, 0)); });
    expect(beat()).toBe('scene1');
    const saved = JSON.parse(localStorage.getItem('lumara.demo.v1')!).players.find((p: { userId: string }) => p.userId === 'newbie');
    expect(saved.nickname).toBe('Moon');
  });
  it('never shows the opening to a returning player and shows their nickname', async () => {
    seedPlayer('ana', 'Moon', true, { players: [{userId:'ana',nickname:'Moon',introSeen:true,owned:{wren:1},pulls:[],displayCharacterId:'wren'}] }); await start('ana', '#sanctuary');
    expect(beat()).toBeNull(); expect(location.hash).toBe('#sanctuary');
    expect(container.querySelector('.game-player')?.textContent).toContain('Moon');
  });
  it('labels the title button Begin for a new player and Enter Lumara for a returning one', async () => {
    await start('newbie', '#title'); expect(button('Begin')).toBeTruthy();
    await act(async () => root.unmount()); root = createRoot(container);
    seedPlayer('ana', 'Moon', true, { players: [{userId:'ana',nickname:'Moon',introSeen:true,owned:{wren:1},pulls:[],displayCharacterId:'wren'}] }); await start('ana', '#title'); expect(button('Enter Lumara')).toBeTruthy();
  });
  it('renames from the Sanctuary HUD and shows the new name at once', async () => {
    seedPlayer('ana', 'Moon', true, { players: [{userId:'ana',nickname:'Moon',introSeen:true,owned:{wren:1},pulls:[],displayCharacterId:'wren'}] }); await start('ana', '#sanctuary');
    await click('Change your name, Moon');
    expect(container.querySelector<HTMLInputElement>('#nickname-input')!.value).toBe('Moon');
    await submitName('Star');
    expect(container.querySelector('#nickname-input')).toBeNull();
    expect(container.querySelector('.game-player')?.textContent).toContain('Star');
  });
  it('plays only the story for a named player who has not seen it', async () => {
    seedPlayer('ana', 'Moon', false); await start('ana', '#sanctuary');
    expect(beat()).toBe('scene1');
  });
  it('finishes the full opening at the Banner with the story marked seen', async () => {
    await start('newbie', '#title'); await click('Begin');
    await click('Continue'); await submitName('Moon'); expect(beat()).toBe('greeted');
    for (let i = 0; i < 4; i++) await click('Continue');
    expect(beat()).toBe('call'); await click('Go to the Banner');
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
    expect(beat()).toBeNull(); expect(location.hash).toBe('#banner');
    const saved = JSON.parse(localStorage.getItem('lumara.demo.v1')!).players.find((p: { userId: string }) => p.userId === 'newbie');
    expect(saved).toMatchObject({ nickname: 'Moon', introSeen: true });
  });
  it('takes a new player who opened a retro link through the full story and tutorial before the retro', async () => {
    const session = { id: 's1', sprintName: 'Sprint 9', stage: 'register', status: 'active', wardenId: 'jay', currentFragmentId: null, timerEndsAt: null, createdAt: 1 };
    localStorage.setItem('lumara.demo.v1', JSON.stringify({ sessions: [session] }));
    await start('late', '#retro'); expect(beat()).toBe('welcome');
    await click('Continue'); await submitName('Owl'); await click('Continue'); expect(beat()).toBe('scene1'); await click('Skip story'); expect(beat()).toBe('call'); await click('Go to the Banner');
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
    expect(beat()).toBeNull(); expect(location.hash).toBe('#banner');
    const store = JSON.parse(localStorage.getItem('lumara.demo.v1')!);
    expect(store.attendance.some((a: { userId: string; sessionId: string }) => a.userId === 'late' && a.sessionId === 's1')).toBe(false);
    expect(store.players.find((p: { userId: string }) => p.userId === 'late')).toMatchObject({ nickname: 'Owl', introSeen: true });
  });
  it('shows a late joiner the voyage lobby mid-voyage, with joining closed', async () => {
    const session = { id: 's1', sprintName: 'Sprint 9', stage: 'fragment_drop', status: 'active', wardenId: 'jay', currentFragmentId: null, timerEndsAt: null, createdAt: 1 };
    seedPlayer('ana', 'Moon', true, { players: [{ userId: 'ana', nickname: 'Moon', introSeen: true, owned: { wren: 1 }, pulls: [], displayCharacterId: 'wren' }], sessions: [session] });
    await start('ana', '#retro');
    expect(container.querySelector('.voyage-lobby')).toBeTruthy();
    const join = [...container.querySelectorAll('button')].find(b => b.textContent?.includes('Voyage under way'));
    expect(join?.disabled).toBe(true);
  });
});
