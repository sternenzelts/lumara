# Codex Handoff Brief — Gacha Retro (UI build)

**Owner:** Jay Diaz · **Date:** 2026-09-26 · **Launch target:** 2026-10-16 (dry run 2026-10-14)
**Full design spec (read it first):** `2026-09-26-gacha-retro-design.md` (same folder as this brief).
Copy both files into the repo under `docs/` when you create it.

You (Codex) build the **user interface**. Claude builds the **real backend adapter and game logic**,
then integrates your UI and publishes it as a claude.ai artifact. The split works only if you follow
the contract in §4 exactly.

---

## 1. What this is

A gacha-game-styled **sprint retrospective** for a remote team of 4–8 people, each on their own
laptop. Art direction: Wuthering Waves–style painted anime key visuals (the art already exists; see §6).

Retro flow, driven by one facilitator (the **Warden**):

`Register → Opening Pull → Vow Review → Fragment Drop → Vote → Hall (reveal & discuss) → Vow Altar → Rewards`

- **Opening Pull:** everyone pulls a character at the start; the whole team watches each reveal.
- **Fragments:** anonymous thoughts tagged Radiance / Fracture / Spark / Wildcard
  (= Keep / Problem / Try / Wildcard — always show the plain label under the themed one).
- **Hall:** fragments revealed one by one in **vote order, highest first**, each with a pull-style reveal.
- **Vows:** action items. Next retro starts by reviewing them; fulfilled vows light lamps in the Sanctuary.
- **Admin (Jay only)** controls settings; everyone else never sees the admin panel.

## 2. Stack and project setup

- **React + Vite + TypeScript.** Repo folder: `C:\Users\hp\gacha-retro`.
- `vite.config.ts` **must** set `base: './'` (all paths relative — required by the artifact).
- Animation: **GSAP** or **Framer Motion**, installed from npm and bundled.
- Tests: **Vitest** (Claude will add logic tests; add UI tests where useful).
- Scripts: `npm run dev`, `npm run build` (→ `dist/`), `npm run typecheck`, `npm test`.

Suggested structure (keep the ownership lines in §8):

```
src/
  backend/
    types.ts        ← the contract (§4). Do not change without agreement.
    local.ts        ← YOU: demo implementation (browser storage + BroadcastChannel)
    artifact.ts     ← CLAUDE: real claude.ai implementation (do not create or edit)
    index.ts        ← picks artifact if available, else local
  logic/            ← CLAUDE: game math (§5). Use it, don't implement it.
  data/
    characters.ts   ← YOU: roster data (§6)
    art.ts          ← YOU: art map (§6)
  screens/  components/  styles/  ...   ← YOU
public/art/<character>/...              ← copy from gacha-art\characters\
```

## 3. Hard rules (artifact constraints)

1. **Output is static files only.** `npm run build` → `dist/` containing `index.html` + JS/CSS + media.
   No server, no SSR, no API routes.
2. **No runtime network calls to other hosts.** Bundle every library via npm. Only external
   resources allowed at all: fonts from **Google Fonts**. No other CDNs, no analytics, no fetch to APIs.
3. **Never reference `window.claude` or `claude.use` anywhere.** All saving, live sync and identity
   go through the `Backend` interface (§4). Only Claude's `artifact.ts` touches the claude.ai runtime.
4. **Size limits:** every file in `dist/` < 15 MB; whole `dist/` < 64 MB; ≤ 250 files.
5. **Must render with no backend features.** If a call fails or data is empty, show a sensible
   empty/waiting state — never a blank screen or a crash.
6. **Anonymity:** a Fragment or Vote object has **no author/voter field** — never add one, never
   display "who wrote this", never infer it (e.g. by timing or order). No leaderboards or per-person stats.
7. **Characters are cosmetic only** — they never change votes, discussion, or anything about the person.

## 4. The Backend contract (`src/backend/types.ts`)

Implement `local.ts` against exactly this. Claude implements `artifact.ts` against the same file.

```ts
export type UserId = string;
export type Unsubscribe = () => void;

export interface Me { id: UserId; name: string; isAdmin: boolean }

export type Stage =
  | 'register' | 'opening_pull' | 'vow_review' | 'fragment_drop'
  | 'vote' | 'hall' | 'vow_altar' | 'rewards' | 'completed';

export interface Session {
  id: string;
  sprintName: string;
  stage: Stage;
  status: 'active' | 'paused' | 'ended';
  wardenId: UserId;
  currentFragmentId: string | null;   // Hall: fragment being discussed
  timerEndsAt: number | null;         // epoch ms, optional stage/fragment timer
  createdAt: number;
}

export type FragmentCategory = 'radiance' | 'fracture' | 'spark' | 'wildcard';
export interface Fragment { id: string; sessionId: string; text: string; category: FragmentCategory; createdAt: number } // NO author
export interface Vote { id: string; sessionId: string; fragmentId: string }                                              // NO voter

export interface Attendance {
  userId: UserId; sessionId: string; joinedAt: number;
  votesCast: number;
  characterId: string | null;        // character used this retro
}

export type VowStatus = 'open' | 'fulfilled' | 'not_yet' | 'carried' | 'dropped';
export interface Vow { id: string; sessionId: string; text: string; ownerId: UserId | null; status: VowStatus; createdAt: number }

export type Grade = 'S++' | 'S+' | 'A';
export interface PullRecord { at: number; characterId: string; grade: Grade; source: 'opening' | 'banner' | 'exchange'; duplicate: boolean }
export interface Player { userId: UserId; nickname: string | null; displayCharacterId: string | null; owned: Record<string, number>; pulls: PullRecord[] }

export interface Settings {
  pullMode: 'fresh' | 'keep' | 'choose';
  rates: { sPlusPlus: number; sPlus: number };            // e.g. 0.005, 0.03 (A = remainder)
  pity: { enabled: boolean; sPlus: number; sPlusPlus: number }; // e.g. 30, 100
  featuredCharacterId: string;
  movement: boolean;
  skipVowReview: boolean;
  starlight: { attend: number; perVote: number; perVow: number; pullCost: number }; // 300, 50, 200, 100
  stardust: { dupeA: number; dupeSPlus: number; dupeSPlusPlus: number;             // 10, 50, 50
              costA: number; costSPlus: number; costSPlusPlus: number };           // 60, 300, 1000
}

export interface Presence { x: number; y: number; facing: 'left' | 'right'; characterId: string | null; moving: boolean }
export type CueTopic = 'pull_reveal' | 'reaction' | 'stage_cue';

export interface Backend {
  mode: 'artifact' | 'local';
  me(): Promise<Me>;
  profiles(ids: UserId[]): Promise<Record<UserId, { name: string }>>;

  // Sessions (writes by Warden/admin only)
  createSession(sprintName: string): Promise<Session>;
  watchActiveSession(cb: (s: Session | null) => void): Unsubscribe;
  watchSessions(cb: (all: Session[]) => void): Unsubscribe;          // Archives
  updateSession(id: string, patch: Partial<Omit<Session, 'id'>>): Promise<void>;

  // Attendance
  join(sessionId: string): Promise<void>;
  setMyCharacter(sessionId: string, characterId: string): Promise<void>;
  watchAttendance(sessionId: string, cb: (a: Attendance[]) => void): Unsubscribe;

  // Fragments (author kept only in the writer's private storage)
  addFragment(sessionId: string, text: string, category: FragmentCategory): Promise<Fragment>;
  deleteMyFragment(sessionId: string, fragmentId: string): Promise<void>;
  myFragmentIds(sessionId: string): Promise<string[]>;
  watchFragments(sessionId: string, cb: (f: Fragment[]) => void): Unsubscribe;

  // Votes (3 per person, honor system, may stack)
  castVote(sessionId: string, fragmentId: string): Promise<void>;
  removeMyVote(sessionId: string, fragmentId: string): Promise<void>;
  myVotes(sessionId: string): Promise<string[]>;                     // fragment ids, with repeats
  watchVotes(sessionId: string, cb: (v: Vote[]) => void): Unsubscribe;

  // Vows
  watchVows(cb: (v: Vow[]) => void): Unsubscribe;
  addVow(sessionId: string, text: string, ownerId: UserId | null): Promise<Vow>;
  updateVow(id: string, patch: Partial<Pick<Vow, 'text' | 'ownerId' | 'status'>>): Promise<void>;

  // Players (each person writes only their own)
  watchPlayer(userId: UserId, cb: (p: Player | null) => void): Unsubscribe;
  watchPlayers(cb: (p: Player[]) => void): Unsubscribe;
  appendMyPull(record: PullRecord): Promise<void>;
  setMyDisplayCharacter(characterId: string): Promise<void>;
  setMyNickname(nickname: string): Promise<void>;          // 2–20 chars, trimmed

  // Settings (admin only writes)
  watchSettings(cb: (s: Settings) => void): Unsubscribe;
  saveSettings(s: Settings): Promise<void>;

  // Live, non-persistent (never use for state a late joiner needs)
  emit(topic: CueTopic, data: unknown): void;
  on(topic: CueTopic, cb: (data: unknown, from: UserId) => void): Unsubscribe;
  setPresence(p: Presence): void;                                   // throttle to ~10/s
  onPeers(cb: (peers: Record<UserId, Presence>) => void): Unsubscribe;
}
```

**Important:** the current stage always comes from `watchActiveSession` (persistent). Cues via
`emit/on` are only for "play this reveal now" moments — a refreshed tab must recover from the
session, not from cues.

### Your `local.ts` demo backend
- Store in `localStorage`; sync tabs with `BroadcastChannel` so **two browser tabs = two teammates**.
- Identity via URL: `?player=jay` (admin), `?player=ana`, `?player=marco`… Admin = `jay`.
- Seed default `Settings` with the numbers in the comments above.
- Show a small, unobtrusive "Demo mode" badge when `mode === 'local'`.

## 5. Game logic — owned by Claude (`src/logic/`)

Do **not** implement odds, pity, balances or ordering yourself. Import these. Until Claude's
versions land, create `src/logic/index.ts` with these exact signatures returning simple fake values,
and put `// TEMP stub — Claude replaces` at the top.

```ts
rollPull(args: { settings: Settings; history: PullRecord[]; roster: CharacterDef[]; owned: Record<string, number>; rng?: () => number }): { characterId: string; grade: Grade; duplicate: boolean };
pityProgress(history: PullRecord[], settings: Settings): { sPlus: number; sPlusPlus: number }; // pulls since last
starlightBalance(args: { userId: UserId; attendance: Attendance[]; vows: Vow[]; player: Player; settings: Settings }): number;
stardustBalance(args: { player: Player; settings: Settings }): number;
revealOrder(fragments: Fragment[], votes: Vote[]): Fragment[];          // most-voted first
fragmentGlow(votes: number, maxVotes: number): 'gold' | 'purple' | 'blue';
nextStage(stage: Stage, settings: Settings, hasPreviousVows: boolean): Stage;
```

## 6. Characters and art

Copy `C:\Users\hp\Downloads\gacha-art\characters\<name>\` into `public/art/<name>/`.
Each folder has a `source.md` saying which file is used where. **Build all UI so missing art or
video falls back gracefully** (silhouette card; still image with code entrance animation).

`CharacterDef` (in `data/characters.ts`):

```ts
export interface CharacterDef {
  id: string; name: string; title?: string; grade: Grade; element: string; accent: string; // hex
  flavor: string;
  art: {
    splash?: string;     // pull reveal + collection card
    cutout?: string;     // Sanctuary, lobby, moving character (transparent)
    extra?: { label: string; src: string }[]; // ability showcase, alt forms
    reveal?: string;     // mp4, S++/S+ only
  };
  skill?: string;        // Phase 2 only; the retro ignores it
}
```

| id | Grade | Element | splash | cutout | Notes |
|---|---|---|---|---|---|
| mahesvara | S++ | Void | `mahesvara_mirror_splash_v2.webp` | `mahesvara_cutout.webp` (base; awakened: `mahesvara_awakened_cutout.webp`) | Two forms. extra: `mahesvara_awakened_splash_v2.webp` ("True form — destroy & restore"). Accent ice-blue |
| keira | S++ | Flame | `keira_splash_v3.webp` (floating) | `keira_cutout.webp` (standing) | Accent pink |
| ayaka | S++ | Ice / Time | `ayaka_timestop_splash_v2.webp` (extra: `ayaka_splash_v1.webp` lazy throne) | `ayaka_cutout.webp` (throne — she glides on it instead of walking; alt: `ayaka_cutout_standing.webp`) | Lazy genius; slows/stops time. Accent pale aqua/silver |
| azrenth | S+ | Destruction | `azrenth_splash_v2.webp` | `azrenth_cutout.webp` | Reincarnated demon king; black/crimson/gold |
| seren | S+ | Light | `seren_splash_v2.webp` | `seren_cutout.webp` | Accent gold |
| ashvane | S+ | Earth/Battle | `ashvane_splash_v1.webp` | `ashvane_cutout.webp` | Accent amber |
| suvara | S+ | Radiant light | `suvara_splash_v2.webp` | `suvara_cutout.webp` | Seated on dragon. Accent teal |
| sollene | A | Moonlight | `sollene_splash_v1.webp` | `sollene_cutout.webp` | Kneeling moon priestess. Accent navy/silver |
| wren | A | Wind | `wren_splash_v1.webp` | `wren_cutout.webp` | Tiny energetic archer. Accent jade |
| rook | A | Lightning | `rook_splash_v1.webp` | `rook_cutout.webp` | Antihero gunslinger. Accent amber |
| calla | A | Poison | `calla_splash_v1.webp` | `calla_cutout.webp` | Sly alchemist. Accent emerald |
| kairo | A | Water | `kairo_splash_v1.webp` | `kairo_cutout.webp` | Sea swordsman. Accent sea-green/coral |
| dax | A | Fire | `dax_splash_v1.webp` | `dax_cutout.webp` | Fire brawler. Accent orange |

No reveal videos are final yet — the pull sequence must work without them.

**Mascot: Seren** is the game's guide. She appears on the title screen and in the Sanctuary, and
speaks short guide lines in a speech bubble at each retro stage (what to do now, in plain words).
She stays pullable as S+.

**Voice: only Seren is voiced.** Her 41 Japanese lines are in `art/seren/voice/ja/seren_vo_<id>.mp3`;
`characters/seren/voice-script.md` maps each ID to its trigger, English bubble text and expression. Play
the matching clip when her bubble appears (muted until the player's first tap; respect a mute setting).
Other characters have no voice lines.

**Personal background music (local only).** Settings → "Your background music": the player picks an
audio file from their own computer (`<input type="file" accept="audio/*">`). Play it in a looping
`<audio>` element **only in that player's browser**, during Fragment Drop and Vote (quiet by default,
volume slider + mute; fade to near-silent in the Hall). Remember the choice locally (IndexedDB, wrapped in
try/catch). **Never upload, sync, or bundle the file** — no backend call, not in `dist/`, not visible to
anyone else. The game ships with **no music files**.

**S++ signature moves (Mahesvara, Keira, Ayaka only).** Each S++ has one show-of-power move, played in
their pull reveal and when tapped in the Sanctuary (cooldown ~30 s). It never targets or hits another
player's character. Built as code/three.js effects over the cutout (a simple pose change is fine until
3D walking frames exist):
- **Mahesvara — Destroy & restore:** a nearby pillar dissolves into blue mist particles, holds ~0.5 s, then
  rewinds back into place in white light; glass shards orbit him during it.
- **Keira — Mech strike:** she hops; a large translucent pink holographic mech hand slams down beside her;
  pink flame shockwave ring across the floor; burst of glitch squares; she waves.
- **Ayaka — Chrono Stasis** (time stop; her other abilities — Deceleration Zone, Niflheim, Frost Cadenza, Glacial Finale — are listed on her character page and kept in her `skill` data for Phase 2): she raises her palm; a gold clock-face circle appears behind her; for ~2 s all
  Sanctuary motion freezes on **every** player's screen (characters mid-step, particles in mid-air) —
  send as a `room` cue; then time resumes.

**Per-character ambient effects (all 13, lighter, no attack):** Seren gold motes and feathers · Mahesvara
orbiting blue shards · Keira glitch pixels · Ayaka snowflakes + frost trail · Azrenth black flame at feet ·
Ashvane amber sparks · Suvara teal light ribbons · Sollene moonlight stars · Wren green wind and leaves ·
Rook occasional amber lightning · Calla green poison bubbles · Kairo water ripples and mist · Dax fist flames.

**First-time welcome & nickname.** After the intro and "Tap to start", a first-time player sees a
welcome card with Seren: *"Welcome to Lumara! What should we call you?"* — a nickname field (2–20
characters), **pre-filled with the first name from their account**, and a **Continue** button. Saved via
`setMyNickname`. Then 3 skippable intro cards (the Dimming → anonymous reflection → vows relight
beacons), then the Sanctuary. Everywhere names appear (party list, characters, vow owners), show the
**nickname**, with the account name in smaller text beneath it so teammates always know who's who. The
nickname is editable later in Settings. Returning players skip the welcome and go straight to the Sanctuary.

## 7. Screens and behaviour

**Global:** responsive (laptop first, must work at 375 px phone width), `prefers-reduced-motion`
turns motion into fades, keyboard accessible, readable contrast.

1. **Landing (title screen):** plays `seren_intro.mp4` (10 s, 1280×720, muted, `playsInline`) once, then freezes on its last frame (Seren's full-body pose in the sky city) as the title background, with the logo and "Tap to start" fading in; skippable by click/tap; reduced motion → show the last frame as a still. Then: full-screen painted background, featured S++ cutout with idle motion
   (breathing, float, parallax on mouse), game logo (name placeholder constant `GAME_NAME`),
   buttons **Start a Retro** (admin/Warden), **Join Retro**, **Sanctuary**; small "Featured" banner card.
2. **Sanctuary (hub):** scene with 12 lamps (lit count = fulfilled vows, max 12); teammates'
   characters standing/moving; panels: open vows, my Starlight & Stardust, Banner, Collection,
   Exchange, Archives. (Final Sanctuary art comes later from Blender — use a placeholder painted bg.)
3. **Retro stages** (everyone follows `session.stage`; Warden gets controls: next, back, pause, skip):
   - **Register:** join; list who's here.
   - **Opening Pull:** each person pulls (per `settings.pullMode`); **everyone sees each reveal live**
     (emit `pull_reveal`); result saved via `appendMyPull` + `setMyCharacter`.
   - **Vow Review:** last retro's vows, Warden marks fulfilled / not yet / carry / drop; fulfilled →
     lamp-lighting animation. Skipped if no previous vows or `settings.skipVowReview`.
   - **Fragment Drop:** write fragments with category picker; show only the **count** of all
     fragments; your own list (editable/deletable) from `myFragmentIds`.
   - **Vote:** all fragments visible; 3 votes, stackable; help text "limits are on the honor system".
   - **Hall:** Warden reveals fragments in `revealOrder`; each reveal uses the pull-style tell with
     `fragmentGlow` color; optional per-fragment timer.
   - **Vow Altar:** turn discussed fragments into vows (text + optional owner).
   - **Rewards:** voyage summary, Starlight earned, button to Banner.
   - **Paused:** non-Warden sees a calm waiting screen.
4. **Pull sequence** (Opening Pull and Banner):

   | Beat | What | Length |
   |---|---|---|
   | 1 Standard | the **Starlight crystal** (`world/starlight_crystal.webp`) falls with a trail and lands in the Sanctuary | ~1–2 s |
   | 2 Tell | crystal tinted by grade: **violet A** (one crack, soft burst), **gold S+** (spins, cracks, light rays, shatters), **prismatic S++** (turns rainbow mid-fall, screen shake, ground/sky cracks, hovers, shatters) + Seren's matching voice line | ~1–2 s |
   | 3 Code reveal | S+ / S++ only. **No video.** Built in code from existing art: screen flashes to the character's `accent` color; `splash` slides/zooms in with a slow camera push, light rays and particles in the accent color; for S++ the **signature move** plays over the `cutout` (see "S++ signature moves"); S+ get a lighter burst of their ambient effect | 4–6 s |
   | 4 Reveal | splash settles, name + grade + element slide in, tap to continue | ~3 s |

   A pulls skip beat 3. ×10 pulls show the tell of the best grade, then cards flip.

   **Reference prototypes — match these:** `reveal-demos/ayaka/` (S++ time-stop reveal) and
   `reveal-demos/seren/` (S+ reveal with the crystal and Seren's voice). See `reveal-demos/README.md`.
   They are single-file prototypes; rebuild them in the game's React/TS structure, keeping the beats,
   timing and feel. Total reveal target: ~6–8 s for S+/S++, ~3 s for A, always skippable.
5. **Banner:** featured character, rates, **pity progress shown openly**, Pull ×1 / ×10 (Starlight).
6. **Collection:** owned cards (silhouettes for unowned); character page with splash, `extra`
   images, grade, element, flavor, "Set as display character".
7. **Exchange:** spend Stardust on a specific character (A / S+ / S++ costs from settings).
8. **Admin settings:** visible **only when `me.isAdmin`**: pull mode, S++/S+ rates, pity, featured
   character, movement on/off, skip vow review, Starlight & Stardust numbers.
9. **Archives:** past sessions, their vows and outcomes.
10. **Moving characters:** in Sanctuary/lobby and after Opening Pull: WASD/arrows or click-to-move
    (tap on phone); **chibi-glide placeholder** = the cutout scaled small, gliding with bounce, lean
    and horizontal flip; positions via `setPresence`/`onPeers`. **Frozen at the edges** during
    Fragment Drop, Vote and Hall. Respect `settings.movement`.

## 8. Visual style

- Wuthering Waves–inspired **UI**: clean, bright, **icy blue / white / silver with thin gold line work**,
  thin glowing rings, small floating digital glitch squares, prism flares, drifting particles.
- **Not** dark neon / terminal / "robot futuristic" — Jay has explicitly rejected that look.
- Each character's `accent` tints their reveal and card.
- Themed labels always paired with plain labels (Fragment = thought, Vow = action item, etc.).

## 9. Ownership — who touches what

| Area | Owner |
|---|---|
| `src/backend/types.ts` | Shared contract — change only by agreement |
| `src/backend/local.ts`, all screens/components/styles, `data/*`, animations | **Codex** |
| `src/backend/artifact.ts`, `src/logic/*` (+ tests), publishing to claude.ai | **Claude** |

## 10. Done when

- [ ] `npm run build` succeeds; `dist/index.html` uses **relative** paths only.
- [ ] `npm run typecheck` passes; no `window.claude` / `claude.use` anywhere in your code.
- [ ] Whole flow playable in demo mode with **two tabs** (`?player=jay` + `?player=ana`):
      create retro → both pull (each sees the other's reveal) → vow review → fragments → vote →
      Hall → vows → rewards → Sanctuary lamps update next retro.
- [ ] Admin panel only appears for `?player=jay`.
- [ ] No author/voter shown or stored for fragments/votes.
- [ ] Missing art / missing video never breaks a screen.
- [ ] Works at 1440 px and 375 px widths; reduced-motion respected.
- [ ] `dist/` under 64 MB, every file under 15 MB.

## 11. Open items (use placeholders)

- Game name → `GAME_NAME` constant.
- 3 A-grade characters → placeholder data + silhouettes.
- Reveal videos → none final yet.
- Sanctuary final art (Blender renders, 13 lamp stages) → comes later; keep the lamp count data-driven.
