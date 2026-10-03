# First-time opening + nickname — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Jay chose "implement it now" → native execution). Steps use `- [ ]`.

**Goal:** New players get Seren's opening + nickname; nicknames show everywhere; returning players go straight in.
**Architecture:** Pure rules in `src/logic/opening.ts` + `src/logic/names.ts` (unit-tested). A new full-screen `Opening`
screen at `#welcome`, outside `GameShell`, driven by those rules. `App` owns the gate and merges nicknames into
`me` / `profiles` so existing screens pick them up without per-screen edits.
**Tech stack:** React 19 + TS + Vite, Vitest + jsdom (no testing-library; tests use `createRoot` + `act`, like `WorldMap.test.tsx`).
**Spec:** `Downloads\gacha-art\2026-09-27-opening-nickname-design.md`
**Project:** `Downloads\gacha-art\interface` — **not a git repo**: "commit" = run `npm test` + `npm run build` green.
Backup of `src` before changes: scratchpad `interface-src-before-opening`.

## Global constraints
- Only existing Seren clips; no intro video; `TitleMusic.tsx` untouched.
- Nickname: 1–16 characters after cleaning; duplicates allowed.
- Voice defaults on; an explicit mute (`lumara.voiceEnabled = "false"`) is remembered.
- Game UI (framed panels, painted map), no website patterns. Respect `prefers-reduced-motion` and the motion pause.
- Build must stay under the 64 MB artifact limit (now 53.4 MB).

## Review focus
1. Player record not loaded yet (async backend) → no redirect, no flash of the opening for returning players. → Task 2 gate test.
2. Nickname of only spaces / emoji-length / 40 chars pasted → clean or reject with the friendly message. → Task 1 tests.
3. Tab closed mid-story → next visit: nickname kept, story plays once on reaching the Sanctuary. → Task 2 gate test.
4. Audio blocked or file missing → text still shows and the flow still advances. → Task 3 (`play().catch`), Task 5 browser check.
5. Returning to the Sanctuary from a menu must not replay Seren's greeting every time. → Task 4 (greet once per load).

---

### Task 1: Nickname data + rules
**Files:** create `src/logic/names.ts`, `src/logic/names.test.ts`; modify `src/backend/types.ts`, `src/backend/local.ts`, `src/backend/local.test.ts`.
**Produces:** `cleanNickname(raw): string` (throws `NICKNAME_ERROR`), `NICKNAME_MAX = 16`,
`withNicknames(profiles, players): Record<UserId,{name,accountName}>`; `Player.nickname: string|null`,
`Player.introSeen: boolean`; `Backend.setMyNickname(n): Promise<void>`, `Backend.markIntroSeen(): Promise<void>`.

- [ ] Tests (`names.test.ts`): `cleanNickname('  Jay   D  ')==='Jay D'`; control chars stripped; `''`, `'   '` and a 17-char name throw
  `'Choose a name between 1 and 16 characters.'`; emoji counts by characters (`[...s].length`), so `'🌸'.repeat(16)` passes.
  `withNicknames({ana:{name:'Ana'}}, [{userId:'ana',nickname:'Moon',…}])` → `{ana:{name:'Moon',accountName:'Ana'}}`; no nickname → account name.
- [ ] Tests (`local.test.ts`): `setMyNickname` stores on caller only; other tab sees it via `watchPlayers`; bad name rejects;
  `markIntroSeen` sets flag; a stored player without the new fields reads `nickname: null, introSeen: false`.
- [ ] Run → fail. Implement: `player()` in local.ts creates `{…, nickname: null, introSeen: false}` and back-fills old records;
  both methods use `mutate`. Run → pass.

### Task 2: Opening rules + gate
**Files:** create `src/logic/opening.ts`, `src/logic/opening.test.ts`.
**Produces:**
```ts
export type Beat = 'welcome' | 'nickname' | 'greeted' | 'scene1' | 'scene2' | 'scene3';
export type OpeningKind = 'full' | 'short' | 'story';
export const beatsFor: (k: OpeningKind) => Beat[];      // full=all 6, short=first 3, story=last 3
export const canSkip: (b: Beat) => boolean;             // true only for scene1–3
export const BEAT_VOICE: Record<Beat, string | null>;   // welcome_first, null, nickname_set, intro_1..3
export const BEAT_FACE: Record<Beat, 'happy'|'excited'|'thinking'|'proud'|null>;
export function openingKind(a: { player: Player | null; destination: string; retroInProgress: boolean }): OpeningKind | null;
export function gateRoute(a: { route: string; player: Player | null; playerLoaded: boolean }): 'welcome' | null;
```
- [ ] Tests: `beatsFor` orders; `canSkip('nickname')===false`; `openingKind` → `full` (no nickname, sanctuary, no retro),
  `short` (no nickname + destination `retro` OR retro in progress), `story` (nickname, `!introSeen`), `null` (both done).
  `gateRoute`: not loaded → null; no nickname on `sanctuary`/`retro`/`map` → `welcome`; on `title`/`welcome` → null;
  nickname + `!introSeen` on `sanctuary` → `welcome`; on `retro` → null (late joiner keeps playing); all done → null.
- [ ] Run → fail → implement → pass.

### Task 3: NicknamePanel + Opening screen
**Files:** create `src/components/NicknamePanel.tsx`, `src/screens/Opening.tsx`, `src/screens/opening.css`, `src/screens/Opening.test.tsx`.
**Consumes:** Task 1–2 exports. **Props:**
`NicknamePanel({ initial, accountName, submitLabel, onSubmit(name): Promise<void> })`;
`Opening({ kind, accountName, nickname, onNickname(name): Promise<void>, onDone(): void, onSkipStory(): void })`.
- Layout: map cover canvas (`aspect-ratio:1672/941`, `width:max(100vw, 100vh*1672/941)`), 12 beacon dots + Aurelis from `BEACONS`/`WORLD.sanctuary`;
  Seren cutout (beats welcome–greeted), dialogue box with face portrait + typed text; Next / tap anywhere; Skip (scenes only); mute toggle.
- Scenes via class on root: `scene1` beacons lit→dark staggered + slow pan; `scene2` zoom to Aurelis glow; `scene3` `BEACONS[0]` relights with rays.
- Voice: `new Audio(base + 'art/seren/voice/ja/seren_vo_'+id+'.mp3')`, one at a time, `.catch(()=>{})`, pause on hidden/unmount; honors mute pref.
- [ ] Tests: full run clicks through all beats and calls `onNickname('Jay')` then `onDone`; Next disabled/absent on nickname beat
  until valid; Skip not rendered before scene1, rendered on scene1 and calls `onSkipStory`; `kind='short'` ends after greeted
  (`onDone` called, no scene rendered); `kind='story'` starts at scene1; invalid name shows the error text.
- [ ] Run → fail → implement → pass.

### Task 4: Wire into App + GameShell
**Files:** modify `src/App.tsx`, `src/components/GameShell.tsx`, `src/screens.tsx` (TITLES/labels only).
- App: route `welcome`; `playerLoaded` flag from the `watchPlayer` callback; effect: `gateRoute` → remember `afterOpening`
  route and navigate `welcome`; render `<Opening>` outside `GameShell`; `onNickname` = `backend.setMyNickname`;
  `onDone`: `short` → join active retro + `retro`; else `markIntroSeen` + `sanctuary`; `onSkipStory` = same as done.
  Context `me = {...me, name: nickname || me.name}`, new `accountName`; `profiles = withNicknames(profiles, players)`.
- GameShell: title seal "Lumara" only; title bubble "Whenever you're ready." (+ "Welcome back, {name}." when named);
  button **Begin** → `welcome` when no nickname, else **Enter Lumara**; voice default on; `interacted` falls back to
  `navigator.userActivation?.hasBeenActive`; Sanctuary greets once per load — `arrive_sanctuary` right after an opening,
  else random `welcome_back_1..3`; HUD small line = account name (+ " · Warden" only if `session?.wardenId === me.id`);
  on Sanctuary the HUD name opens a rename dialog with `NicknamePanel`. TITLES.settings → "Admin settings".
- [ ] `npm test` + `npm run build` green.

### Task 5: Assets + browser verification
- [ ] Copy clips `welcome_first, nickname_set, intro_1, intro_2, intro_3, welcome_back_1..3` and faces `happy, excited, thinking`
  from `characters/seren/` into `public/art/seren/`. Build size check.
- [ ] Browser (5177) at 1440 and 375 px: `?player=newbie` full run; `?player=late` with an active retro → short path lands in retro,
  story later in Sanctuary; `jay` returning → no opening, welcome-back line; rename from HUD shows everywhere; mute persists.
- [ ] Whole-change review by a fresh reviewer; fix findings; report.
