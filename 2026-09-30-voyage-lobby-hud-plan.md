# Voyage Lobby + Sanctuary HUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the retro's page layout with a game-style voyage lobby (Gather) and a clean full-screen Sanctuary HUD for every later stage, without breaking any stage.

**Architecture:** Pure helpers in `src/logic/voyage.ts` decide the step list, briefing and "Vow review · 2 of 7" label. Three small presentational components (`VoyageLobby`, `VoyageHud`, `VoyageWindow`) render them. `RetroScreen` picks lobby vs Sanctuary; existing stage content moves unchanged into `VoyageWindow`, which the HUD opens (this is the spec's button fallback; the in-world pop-ups replace it later).

**Tech Stack:** React 19 + TypeScript + Vite, vitest + jsdom, plain CSS files per component, lucide-react icons.

**Spec:** `Downloads/gacha-art/2026-09-30-voyage-redesign-design.md` (sections 2, 3 Gather row, 4, 5 fallback, 6 step 1)

## Global Constraints

- Code lives in `C:\Users\hp\Downloads\gacha-art\interface` (the staging copy; do not touch `C:\Users\hp\gacha-retro`).
- Not a git repo: no commits. Each task ends with `npx vitest run` + `npx tsc --noEmit -p .` green.
- Game UI, never SaaS: ornate thin gold frames (`#d8bf82`), dark translucent glass (`#10233ad9`), cream text (`#fff4dc`); no cards-in-a-dashboard, no sidebars, no breadcrumbs.
- HUD on the Sanctuary: Exit voyage (top-left), pause motion + mute Seren only (top-right), Warden Back/Next (bottom-right), stage label.
- The lobby shows while `session.stage === 'register'` **or** the viewer hasn't joined (late joiners arrive in the lobby).
- Keep existing backend calls: `backend.join`, `backend.updateSession`, `nextStage(...)` from `src/logic/index.ts`.
- Use the `frontend-design` skill for the visual pass in Tasks 2–3.

## Review Focus

1. Late joiner mid-voyage (not joined, stage = `fragment_drop`) must see the lobby with **Join**, not an empty Sanctuary — test in Task 3.
2. Non-Warden in the lobby must not see **Enter the Sanctuary**, only "Waiting for the Warden" — test in Task 2.
3. Vow review skipped (no previous vows / `skipVowReview`) must make the label total 6, not 7 — test in Task 1.
4. Paused session: Warden's Next is disabled and everyone sees "Paused" in the HUD — test in Task 3.
5. `completed` / unknown stage must not crash the label (returns `null`) — test in Task 1.

---

### Task 1: Voyage step logic

**Files:**
- Create: `src/logic/voyage.ts`
- Test: `src/logic/voyage.test.ts`

**Interfaces:**
- Consumes: `nextStage(stage: Stage, settings: Settings, hasPreviousVows: boolean): Stage` from `./index`; types `Stage`, `Settings` (import them the same way `src/logic/index.ts` does).
- Produces:
  - `VOYAGE_BRIEFING: Record<Exclude<Stage,'register'|'completed'>, { title: string; text: string }>`
  - `voyageSteps(settings: Settings, hasPreviousVows: boolean): Stage[]` — stages after `register`, excluding `completed`.
  - `stageProgress(stage: Stage, settings: Settings, hasPreviousVows: boolean): { title: string; index: number; total: number } | null` — 1-based index; `null` for `register`, `completed` or a stage not in the list.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../backend/types';
import { stageProgress, voyageSteps, VOYAGE_BRIEFING } from './voyage';

const on = { ...DEFAULT_SETTINGS, skipVowReview: false };

describe('voyage steps', () => {
  it('lists the 7 steps after Gather when there are vows to review', () => {
    expect(voyageSteps(on, true)).toEqual(['opening_pull', 'vow_review', 'fragment_drop', 'vote', 'hall', 'vow_altar', 'rewards']);
  });
  it('drops vow review when there is nothing to review', () => {
    expect(voyageSteps(on, false)).not.toContain('vow_review');
    expect(stageProgress('vote', on, false)).toEqual({ title: VOYAGE_BRIEFING.vote.title, index: 3, total: 6 });
  });
  it('labels a stage with its position', () => {
    expect(stageProgress('vow_review', on, true)).toEqual({ title: 'Vow review', index: 2, total: 7 });
  });
  it('has no label in the lobby or after the voyage', () => {
    expect(stageProgress('register', on, true)).toBeNull();
    expect(stageProgress('completed', on, true)).toBeNull();
  });
});
```

(If `DEFAULT_SETTINGS` is exported from another module, import it from where `src/backend/local.ts` imports it.)

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/logic/voyage.test.ts` — Expected: FAIL, cannot find module `./voyage`.

- [ ] **Step 3: Implement**

```ts
import type { Settings, Stage } from '../backend/types';
import { nextStage } from './index';

export const VOYAGE_BRIEFING = {
  opening_pull: { title: 'Free wish', text: 'A star falls for each of you. Pick your companion — they walk with you this voyage.' },
  vow_review: { title: 'Vow review', text: 'At the beacon, look back at last voyage’s vows. Each one kept relights a lamp.' },
  fragment_drop: { title: 'Write', text: 'Walk to a crystal and leave an anonymous thought: Keep, Problem, Try or Wild.' },
  vote: { title: 'Vote', text: 'Give your 3 Starlight votes to the thoughts that matter most.' },
  hall: { title: 'Discuss', text: 'The Warden draws thoughts from the beacon, most voted first.' },
  vow_altar: { title: 'New vows', text: 'Pass through the gate to the vow island and make promises for next sprint.' },
  rewards: { title: 'Homecoming', text: 'Back on the plaza: see what you shared and collect your Starlight.' },
} satisfies Record<Exclude<Stage, 'register' | 'completed'>, { title: string; text: string }>;

export function voyageSteps(settings: Settings, hasPreviousVows: boolean): Stage[] {
  const steps: Stage[] = [];
  for (let s = nextStage('register', settings, hasPreviousVows); s !== 'completed'; s = nextStage(s, settings, hasPreviousVows)) steps.push(s);
  return steps;
}

export function stageProgress(stage: Stage, settings: Settings, hasPreviousVows: boolean) {
  const steps = voyageSteps(settings, hasPreviousVows);
  const i = steps.indexOf(stage);
  if (i < 0) return null;
  return { title: VOYAGE_BRIEFING[stage as keyof typeof VOYAGE_BRIEFING].title, index: i + 1, total: steps.length };
}
```

- [ ] **Step 4: Run to verify it passes** — `npx vitest run src/logic/voyage.test.ts` → PASS; `npx tsc --noEmit -p .` → clean.

---

### Task 2: Voyage lobby

**Files:**
- Create: `src/components/VoyageLobby.tsx`, `src/components/voyage-lobby.css`
- Test: `src/components/VoyageLobby.test.tsx`

**Interfaces:**
- Consumes: `VOYAGE_BRIEFING`, `voyageSteps` (Task 1); `Art` from `./ui`; `characterById` from `../data/characters`.
- Produces:
```ts
export type LobbyMember = { userId: string; name: string; characterId: string | null; warden: boolean; you: boolean };
export default function VoyageLobby(props: {
  sprintName: string; code: string; members: LobbyMember[]; steps: Stage[];
  joined: boolean; warden: boolean; busy: boolean; paused: boolean;
  onJoin: () => void; onEnter: () => void; onCopyCode: () => void;
}): JSX.Element
```

Layout (full screen over the dimmed Sanctuary backdrop, `frontend-design` pass): left column = sprint title + "Voyage briefing" numbered list (title + one line per step, from `VOYAGE_BRIEFING`); bottom band = party line-up (each member's character cutout or a silhouette, name, "You"/"Warden" tag); right = invite-code chip + primary action: **Join the party** (not joined) · **Enter the Sanctuary** (Warden, joined; disabled while `busy` or `paused`) · "Waiting for the Warden…" (joined, not Warden).

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import VoyageLobby, { type LobbyMember } from './VoyageLobby';

const members: LobbyMember[] = [{ userId: 'jay', name: 'Jay', characterId: 'seren', warden: true, you: true }];
async function render(p: Partial<Parameters<typeof VoyageLobby>[0]> = {}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  const props = { sprintName: 'Sprint 9', code: 's1', members, steps: ['opening_pull', 'fragment_drop'] as const, joined: true, warden: true, busy: false, paused: false, onJoin: vi.fn(), onEnter: vi.fn(), onCopyCode: vi.fn(), ...p };
  await act(async () => createRoot(el).render(<VoyageLobby {...props} steps={[...props.steps]} />));
  return { el, props };
}
const button = (el: HTMLElement, name: string) => [...el.querySelectorAll('button')].find(b => b.textContent?.includes(name));

describe('VoyageLobby', () => {
  it('briefs every step in order', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('.lobby-briefing li strong')].map(s => s.textContent)).toEqual(['Free wish', 'Write']);
  });
  it('lets the Warden enter the Sanctuary', async () => {
    const { el, props } = await render();
    await act(async () => button(el, 'Enter the Sanctuary')!.click());
    expect(props.onEnter).toHaveBeenCalled();
  });
  it('shows a newcomer the Join button instead', async () => {
    const { el, props } = await render({ joined: false, warden: false });
    expect(button(el, 'Enter the Sanctuary')).toBeUndefined();
    await act(async () => button(el, 'Join the party')!.click());
    expect(props.onJoin).toHaveBeenCalled();
  });
  it('tells a joined teammate to wait for the Warden', async () => {
    const { el } = await render({ warden: false });
    expect(button(el, 'Enter the Sanctuary')).toBeUndefined();
    expect(el.textContent).toContain('Waiting for the Warden');
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run src/components/VoyageLobby.test.tsx` → FAIL (module missing).
- [ ] **Step 3: Implement** `VoyageLobby.tsx` with the props above (`.voyage-lobby` root; `.lobby-briefing` `<ol>` of `<li><strong>{title}</strong><span>{text}</span></li>`; `.lobby-party` members; `.lobby-action` area) and `voyage-lobby.css` in the game style from Global Constraints; phone (`max-width:760px`/portrait): briefing and party stack vertically, action button full width at the bottom.
- [ ] **Step 4: Run to verify it passes** — the file's tests PASS; full `npx vitest run` + `tsc` clean.

---

### Task 3: Sanctuary HUD, stage window, and wiring into RetroScreen

**Files:**
- Create: `src/components/VoyageHud.tsx`, `src/components/VoyageWindow.tsx`
- Modify: `src/screens.tsx` (`RetroScreen`, lines ~93–131), `src/components/voyage.css`
- Test: `src/components/VoyageHud.test.tsx`, add one case to `src/App.test.tsx`

**Interfaces:**
- Consumes: `stageProgress`, `voyageSteps` (Task 1), `VoyageLobby`, `LobbyMember` (Task 2).
- Produces:
```ts
export default function VoyageHud(props: {
  progress: { title: string; index: number; total: number } | null; paused: boolean;
  warden: boolean; busy: boolean; canBack: boolean; nextLabel: string;
  actionLabel: string; onBack: () => void; onNext: () => void; onOpen: () => void;
}): JSX.Element   // .voyage-hud: stage label top-centre, action button bottom-centre, Warden Back/Next bottom-right
export default function VoyageWindow(props: { title: string; open: boolean; onClose: () => void; children: ReactNode }): JSX.Element | null
// .voyage-window: framed game window, centred, max 640px wide / 78vh tall, scrolls inside; close = "×" + Escape
```

`RetroScreen` after this task:
```tsx
if (!joined || session.stage === 'register') return <><div className="voyage-backdrop lobby-dim"><Scene … frozen /></div>
  <VoyageLobby sprintName={session.sprintName} code={session.id} members={…attendance→LobbyMember} steps={voyageSteps(settings, previousVows.length > 0)}
    joined={joined} warden={warden} busy={busy} paused={session.status === 'paused'}
    onJoin={() => run(() => backend.join(session.id))} onEnter={advance} onCopyCode={copyCode} /></>;
return <><div className="voyage-backdrop"><Scene … frozen={true} /></div>
  <VoyageHud progress={stageProgress(session.stage, settings, previousVows.length > 0)} … onNext={advance} onBack={back} onOpen={() => setWindowOpen(true)} actionLabel={VOYAGE_BRIEFING[stage].title} />
  <VoyageWindow title={…} open={windowOpen} onClose={() => setWindowOpen(false)}>{/* existing per-stage JSX from the old retro-surface, unchanged */}</VoyageWindow></>;
```
- `windowOpen` starts `true` and re-opens on every stage change (`useEffect` on `session.stage`), so nobody misses a step.
- Remove from the voyage path: `.retro-heading`, `.stage-track`, `.retro-surface` wrapper, old `.warden-controls`, `.waiting-note`, the `?player=ana` dev line.
- `voyage.css`: during `.game-voyage-screen` show `.game-hud` again but hide `.game-player`, `.game-wallet`, and every `.game-system-controls` child except the pause-motion and mute-Seren buttons; drop the right-column rules for `.game-panel-scroll>*` (content now lives in HUD/window).

- [ ] **Step 1: Write the failing tests**

`VoyageHud.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import VoyageHud from './VoyageHud';

async function render(p = {}) {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const el = document.createElement('div'); document.body.append(el);
  const props = { progress: { title: 'Vow review', index: 2, total: 7 }, paused: false, warden: true, busy: false, canBack: true, nextLabel: 'Next stage', actionLabel: 'Vow review', onBack: vi.fn(), onNext: vi.fn(), onOpen: vi.fn(), ...p };
  await act(async () => createRoot(el).render(<VoyageHud {...props} />));
  return { el, props };
}
const button = (el: HTMLElement, name: string) => [...el.querySelectorAll('button')].find(b => b.textContent?.includes(name));

describe('VoyageHud', () => {
  it('shows where the party is', async () => {
    const { el } = await render();
    expect(el.querySelector('.voyage-stage-label')?.textContent).toContain('Vow review · 2 of 7');
  });
  it('gives the Warden Back and Next', async () => {
    const { el, props } = await render();
    await act(async () => button(el, 'Next stage')!.click());
    expect(props.onNext).toHaveBeenCalled();
  });
  it('hides stage controls from teammates', async () => {
    const { el } = await render({ warden: false });
    expect(button(el, 'Next stage')).toBeUndefined();
  });
  it('blocks Next and says Paused while paused', async () => {
    const { el } = await render({ paused: true });
    expect(button(el, 'Next stage')!.disabled).toBe(true);
    expect(el.textContent).toContain('Paused');
  });
});
```

`App.test.tsx` (new case, reuse `seedPlayer`/`start`):
```tsx
it('sends a late joiner to the voyage lobby mid-voyage', async () => {
  const session = { id: 's1', sprintName: 'Sprint 9', stage: 'fragment_drop', status: 'active', wardenId: 'jay', currentFragmentId: null, timerEndsAt: null, createdAt: 1 };
  seedPlayer('ana', 'Moon', true, { players: [{ userId: 'ana', nickname: 'Moon', introSeen: true, owned: { wren: 1 }, pulls: [], displayCharacterId: 'wren' }], sessions: [session] });
  await start('ana', '#retro');
  expect(container.querySelector('.voyage-lobby')).toBeTruthy();
  expect([...container.querySelectorAll('button')].some(b => b.textContent?.includes('Join the party'))).toBe(true);
});
```
(If the existing opening/tutorial flow intercepts this player first, seed whatever the other `#sanctuary` tests seed — e.g. welcome pulls — so `ana` lands on `#retro`.)

- [ ] **Step 2: Run to verify they fail** — `npx vitest run src/components/VoyageHud.test.tsx src/App.test.tsx` → FAIL (module missing / no `.voyage-lobby`).
- [ ] **Step 3: Implement** `VoyageHud`, `VoyageWindow`, the `RetroScreen` split, and the CSS above (`frontend-design` pass; phone: HUD buttons stay thumb-reachable at the bottom, window is full-width bottom sheet up to 70vh).
- [ ] **Step 4: Run** full `npx vitest run` + `npx tsc --noEmit -p .` → all green (existing 120 + new).

---

### Task 4: Browser verification

**Files:** none (verification only).

- [ ] **Step 1:** Dev server `gacha-interface` (port 5177). In the browser pane, seed the demo store (players `jay`; a session in `register`; 7 fulfilled vows) and open `#retro`.
- [ ] **Step 2:** Lobby at 1280×720 and 375×812: briefing readable, party shows Jay's character, **Enter the Sanctuary** visible for Jay; open `?player=ana#retro` in a second tab → Join button, then "Waiting for the Warden".
- [ ] **Step 3:** Press Enter → Sanctuary: only Exit, pause, mute, stage label ("Free wish · 1 of 7"), action button, Warden Back/Next; the stage window opens automatically with the Opening Pull content; closing and reopening works; Escape closes.
- [ ] **Step 4:** Step through every stage with Next; each window shows that stage's existing content; Pause shows "Paused" and disables Next.
- [ ] **Step 5:** Reset the viewport, screenshot lobby + one Sanctuary stage for Jay.
