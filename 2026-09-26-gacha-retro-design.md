# Gacha-Style Sprint Retrospective (Design Spec)

**Date:** 2026-09-26 · **Owner:** Jay Diaz · **Status:** Draft for review
**Target launch:** 2026-10-16 (dry run 2026-10-14)
**Name:** to be decided by Jay ("Afterglow" rejected).

---

## 1. Goal

A retrospective game Jay's team (Platform Pod) actually uses every sprint. It keeps the proven
retro flow (check in → drop thoughts → vote → discuss → commit to action items) and wraps it in an
anime gacha game inspired by the *look* of Wuthering Waves: premium painted character art, pull
reveals with rarity glow, a character collection.

**Better than Rizzpective because:**
1. **Follow-through is the game.** Action items ("Vows") carry into the next retro. Fulfilled vows
   earn pull currency and visibly restore the team's world. Rizzpective forgets everything at
   "Mission Complete".
2. **The theme has mechanics, not just skins** — currency, banner pulls, rarity, collection.
3. **Clean, bright UI** (icy blue, white, thin gold lines) instead of dark neon.

**Success criteria**
- A full retro fits in 45–60 minutes with the game adding no more than ~5 minutes.
- Teammates come back next sprint without being chased (pulls are the pull).
- At least half of the Vows from one retro are marked fulfilled at the next.
- Nobody can tell who wrote an anonymous thought from inside the app.

## 2. Decisions made (from the brainstorming conversation)

| Decision | Choice |
|---|---|
| Purpose | Real sprint retros for Jay's own team |
| Theme | Gacha game, anime art styled after Wuthering Waves key visuals (2D painted, not 3D) |
| Pulls | **Both**: thought reveals during the retro + character pulls between retros |
| Art source | ChatGPT images (quality bar, set 2026-09-26) + AI video clips for S++ / S+ reveals; earlier Gemini art is superseded |
| Motion | Code motion on every character; video only for S+ pull reveals |
| Hosting | claude.ai artifact, **published from the company Claude account** |
| IP | Inspired by, never copied: no Wuthering Waves names, characters, logo, music |

## 3. Assumptions — confirm or correct

- **Retro format: remote, everyone on their own laptop in a video call.** *(confirmed)*
- **Team size: 4–8 people.** *(confirmed)*
- **Cadence: every 2 weeks.**
- One person facilitates (the "Warden"), usually the scrum master or Jay.

## 4. The world

**Lumara** — a vast fantasy world in the spirit of Wuthering Waves' Solaris-3: open plains, cliffs,
seas and mountains, dotted with colossal ruins of a lost advanced civilization overgrown by nature.
A cataclysm called **the Dimming** put out the great **beacons** across the land. The team are
**Wardens** based in the **Sanctuary**, who return after every voyage (sprint) to share what they saw
and swear new vows.

- Each **fulfilled Vow relights one beacon.** Over months, the world comes back to life — a picture of
  the team's follow-through history. Unfulfilled vows stay as dim beacons (no punishment, no shame).
- **Nations** (Genshin / Wuthering Waves style — each inspired by a real culture, all human):
  **Aurelis**, the Sanctuary (center, original, light — Seren, Wren) · **Zaryeva** (north, Russia, ice —
  Ayaka, Mahesvara) · **Hoshimura** (east, Japan, lightning — Keira, Kairo) · **Lianzhou** (south, China,
  earth — Suvara, Ashvane, Dax) · **Belcourt** (west, France, water — Sollene, Calla, Rook, Azrenth).
  12 beacons = 3 per outer nation. Map: `world/lumara_map_v2.webp`; data: `world/map-regions.json`.
- Title screen: Seren at a cliff edge overlooking Lumara (background prompt in the conversation log).

**Glossary** (themed label is shown with the plain label under it, so nobody has to learn jargon):

| Retro concept | In Lumara |
|---|---|
| Sprint | Voyage |
| Facilitator | Warden |
| Anonymous thought | Fragment |
| KEEP / PROBLEM / TRY / WILD | Radiance / Fracture / Spark / Wildcard |
| Vote | Starlight vote |
| Action item | Vow |
| Pull currency | Starlight |

## 5. Screens

### 5.1 Landing page (title screen)
Like a gacha login screen:
- Full-screen painted background (sky ruins at dawn), slow drifting clouds and light particles.
- The **featured S+ character** (Seren at launch) standing right-of-center with code motion
  (breathing, float, hair-glow shimmer, parallax on mouse move).
- Game logo, then three actions: **Start a Retro** (Warden), **Join Retro** (code/link),
  **Sanctuary** (hub).
- Small "banner news" card: "Featured: Seren, Dawnlight — S+".

### 5.2 Sanctuary (team hub)
- The Sanctuary scene with lamps lit per fulfilled vow.
- Every teammate's chosen display character standing on the platform (from their collection).
- Panels: open Vows from last retro · your Starlight balance · **Banner** button · **Collection**
  button · **Archives** (past retros).

### 5.3 Retro stages (the Warden advances; everyone's screen follows)

| # | Stage | What happens | Time |
|---|---|---|---|
| 0 | **Register** | Join the retro. First time only: after the intro, pick a **nickname** (pre-filled from the company account name, editable later); nickname shown with the account name beneath it. | 1 min |
| 0.5 | **Opening Pull** | Everyone pulls a character; the whole party sees each reveal (icebreaker). The pulled character is your avatar for this retro and joins your collection. *(Mode set by admin — see 5.4a.)* | 2–3 min |
| 1 | **Sanctuary Gate** — check-in | Party gathers. Last voyage's Vows are reviewed and marked *fulfilled / not yet*. Fulfilled ones relight lamps (short animation). | 5–8 min |
| 2 | **Fragment Drop** | Everyone writes anonymous Fragments tagged Radiance / Fracture / Spark / Wildcard. Live counter shows how many exist, never who wrote them. | 8–10 min |
| 3 | **Starlight Vote** | Each person gets 3 votes to place on Fragments (can stack). | 3–5 min |
| 4 | **Resonance Hall** — reveal & discuss | The Warden "pulls" Fragments one at a time with a gacha reveal. **Order is by votes, highest first** (not random — the top issue is never left for last). Glow by votes: gold = top voted, purple = some votes, blue = none. Timer per Fragment. | 20–25 min |
| 5 | **Vow Altar** | Turn discussed Fragments into Vows with an owner (optional) and a short text. | 5–8 min |
| 6 | **Rewards** | Summary of the voyage + Starlight earned. Button to the Banner. | 1–2 min |

The Warden can pause, go back a stage, or skip a Fragment. Late joiners and anyone who refreshes
land on the current stage.

### 5.3a Moving characters
- Everyone's character moves around the Sanctuary live (WASD/arrow keys or click-to-move; tap on
  phones). Positions are shared through `room` presence (not stored).
- **Free roam** in the Sanctuary/lobby and after the Opening Pull. **Frozen at the edges** during
  writing, voting and discussion so the retro screens take over.
- Optional quick polls: "walk to the side you agree with" — **not anonymous**, light questions only.
- **Target: real walking animation** — VRoid models → Blender → Mixamo walk → 4 directions × 8
  frames, transparent background. (3D-rendered look, like Wuthering Waves' 3D models next to its
  painted art.)
- **Fallback: chibi glide** — one chibi image per character that glides with bounce, lean and
  flip. Built first as the placeholder; if walking frames aren't working by **2026-10-09**, launch
  with this and add walking later.

### 5.4 Banner (character pulls)
- Extra pulls ×1 or ×10 with Starlight (the Opening Pull each retro is free). Pull animation:
  the pull sequence in 5.4b; a ×10 shows the tell of the best grade in the batch.
- **S+ reveal plays the character's video clip once**, then freezes on its last frame as the splash.
  A reveal uses the still image with a code-driven entrance.
- Shows rates and pity progress openly.

### 5.4b Pull sequence (every pull, including the Opening Pull)

| # | Beat | What you see | Length |
|---|---|---|---|
| 1 | Standard pull | Same for every pull: a star falls over the Sanctuary and strikes the ground (code) | ~3 s |
| 2 | The tell | Star color reveals the grade before the character: purple = A, gold = S+, **prismatic + screen shake + sky cracks = S++** (code) | ~1–2 s |
| 3 | Character animation | S+ and S++ only: the character's video clip | 5–10 s |
| 4 | Character reveal | Splash freezes; name, grade, element slide in; tap to continue | ~3 s |

A pulls skip beat 3 (~6 s total). Beat 3 is skippable once a viewer has seen that clip. Remote
teammates watch each other's pulls live, synchronized via a `room` cue.

### 5.4a Admin settings (Jay only)
Only the artifact **owner** (Jay's company account) sees and changes these — enforced by a db
rule (`{ path: "settings", write: "owner" }`) and by hiding the panel unless `user.isOwner()`.
Changed before any retro; the retro runs on whatever was last saved (no admin needed live).

| Setting | Options | Default |
|---|---|---|
| Opening pull mode | Fresh pull every retro · Keep last retro's character · Choose from own collection | Fresh pull |
| S++ / S+ chance | custom | 0.5% / 3% |
| Pity | On/off + pull counts | On, 30 (S+) / 100 (S++) |
| Featured character | any S++ or S+ | Mahesvara |
| Character movement | On / off | On |
| Skip vow review | On / off (per retro) | Off |

**Roles:** Admin = Jay only. **Warden** (runs a retro's stages) = Jay by default; Jay can assign
another teammate as Warden for a retro. Everyone else = Contributor.

### 5.5 Collection
- Grid of owned characters (silhouettes for not-yet-owned). Tap → character page with splash art,
  element, grade, flavor text, and "Set as display character" (used when the admin's pull mode is
  "Choose from own collection").

## 6. Gacha rules

**Roster: 13 characters — 3 S++, 4 S+ and 6 A.** The game
reads names, grades, elements, flavor text and art from one data file (`characters.js`, alongside
`art.js`), so final characters drop in without code changes. Working placeholders:

| Character | Grade | Element |
|---|---|---|
| Seren, Dawnlight | **S+** (premium) | Light |
| **Ashvane** | **S+** (premium) — calm veteran battle-mage, spear, dark bronze/amber | Earth/Battle |
| **Azrenth** | **S+** (premium) — reincarnated demon king, holds the cracked world, true-form shadow; black/crimson/gold | Destruction |
| **Suvara** | **S+** (premium) — young dutiful ruler seated on a guardian light dragon, broadsword, white/gold/teal | Radiant light |
| **Mahesvara** | **S++** (legendary) — ruthless, blue, twin crystal daggers | Void |
| **Keira** | **S++** (legendary) — cheerful digital ghost, pink, flame sword, mech guardian | Flame |
| **Ayaka** | **S++** (legendary) — lazy genius ice mage; slows time, and at full power stops it (abilities: **Deceleration Zone**, **Niflheim**, **Frost Cadenza**, **Glacial Finale**, signature **Chrono Stasis**) | Ice / Time |
| **Rook** | A — laid-back antihero gunslinger; charcoal/amber | Lightning |
| **Sollene** | A — gentle moon priestess, wide-brimmed hat, crescent staff, white/navy/silver | Moonlight |
| **Wren** | A — tiny energetic wind archer; jade/cream | Wind |
| **Calla** | A — sly poison alchemist; violet/emerald | Poison |
| **Kairo** | A — quiet wandering sea swordsman; sea-green/coral | Water |
| **Dax** | A — hot-headed fire brawler; orange/black | Fire |
| Kaya, Stonebloom | A | Earth |

**Mascot: Seren.** Seren is the game's mascot and guide: she welcomes players on the title screen
and in the Sanctuary, explains each retro stage, announces stage changes, and reacts to pulls and
fulfilled Vows. She stays pullable as an S+ character.

**Rates (admin-adjustable):** S++ 0.5% total (split evenly between Mahesvara, Keira and Ayaka) · S+ 3%
total (split evenly between Seren, Ashvane, Suvara and Azrenth) · A 96.5% (split across the 6 A characters). Every
pull gives a character — no filler tier, since the Opening Pull must give you something to play as.
**Pity (defaults, adjustable):** S+ or better guaranteed on the 30th pull since your last one;
S++ guaranteed on the 100th pull since your last S++. With 4–8 people pulling once per retro,
someone lands an S+ about every 4–8 retros and an S++ about every 25–50 retros.

**Starting state:** your first Opening Pull is your first character.

**Starlight earning** (1 pull = 100):

| Source | Starlight |
|---|---|
| Attending a retro | 300 |
| Each Starlight vote cast | 50 |
| Each Vow fulfilled (credited to everyone on the team) | 200 |

Roughly 5–10 extra pulls per retro (depending on vows fulfilled), on top of the free Opening Pull.

**Hard rules (trust):**
- Starlight is **never** earned per Fragment written — that would require knowing who wrote it.
- Characters are **cosmetic only**: they never change votes, discussion, or anything about the person.
- No leaderboards, no per-person activity stats.

**Duplicates → Stardust** (a second currency). A duplicate A gives 10 Stardust; a duplicate S+
gives 50. Stardust buys a **specific character of your choice** in the Exchange: any A for 60,
any S+ (Seren, Ashvane, Suvara, Azrenth) for 300, each S++ (Mahesvara, Keira, Ayaka) for 1,000. So bad luck still adds up to something — and you can eventually get the exact
character you want. (Numbers are defaults; Jay can tune them.) Stardust balance is computed from
the player's own pull log, like Starlight.

## 7. Art and media

| Asset | Count | Format / size | Status |
|---|---|---|---|
| Character stills, plain background | 9 (5 done: Mahesvara, Keira, Seren, Ashvane, Suvara) | PNG/WebP, 2:3 portrait | Seren done (placeholder quality OK) |
| Character stills, background removed | 9 (5 done) | WebP with transparency | To do (cut out from plain-bg versions) |
| S++ / S+ reveal clips | 7 (Mahesvara, Keira, Ayaka, Azrenth, Seren, Ashvane, Suvara) | MP4 H.264, muted, ≤3 MB each | Seren done (6.7 MB → compress); Mahesvara to do |
| Sanctuary stages (Blender) | 13 × 2 | WebP 16:9 + 9:16, one per lamp count 0–12 | To do |
| Landing background | 1–2 | WebP 16:9 + 9:16 (a Sanctuary render or Gemini scene) | To do |

- **Characters can have more than one art.** Each entry in the art map can hold a `splash` (pull
  reveal + collection card) and a `cutout` (Sanctuary, lobby, moving character) that are different
  poses. Keira uses this: floating splash (`keira_splash_v3`), standing cutout (`keira_cutout`).
- **Forms (S++ only).** Mahesvara has a **base form** (cutout: Sanctuary, lobby, moving character)
  and an **awakened form** (splash: pull reveal + collection card). His reveal video shows the
  transformation from base to awakened — the most premium reveal in the game.
- All art is referenced from **one art map file** (`art.js`), so swapping a character's art is a
  one-line change. Missing art falls back to a silhouette — the game never breaks on missing art.
- Art ships as the artifact's **supporting files** (not the `assets` capability).
- Tall 9:16 videos on a laptop: centered, with a blurred copy of the video filling the sides.

**Sanctuary via Blender (driven by Claude through Blender MCP):**
- One 3D scene — floating white ruins above a cloud sea, 12 lamps — with toon/painterly shading
  styled to sit next to the painted character art.
- Lamps light in a **fixed order**; the number of fulfilled Vows picks which render to show
  (0–12). Beyond 12, the fully lit render stays (new islands are out of scope for v1).
- Same camera, same scene for every render — only lamp lighting changes. This is why Blender, not
  Gemini: Gemini can't keep a scene identical across 13 images.
- Rendered with EEVEE on the RTX 2050 (4 GB). Code adds drifting particles on top.
- Blender MCP runs arbitrary Python inside Blender — install it only from its official source.

## 8. Visual design

- Palette: icy blue, white, silver, thin gold line work; each character's accent color tints their
  screens. Explicitly **not** dark neon/terminal.
- Signature effects: thin glowing rings, small floating digital glitch squares, prism flares,
  drifting particles.
- Code motion on stills: breathing scale, gentle float, parallax tilt, light sweep, entrance
  animation on reveal.
- Respects `prefers-reduced-motion` (motion becomes fades).
- Works at laptop and phone widths.

## 9. Architecture

**Form:** one claude.ai artifact built from a **React + Vite + TypeScript** app (`base: './'`);
`npm run build` → `dist/` (index.html + bundled JS/CSS + media) published as the page and its
supporting files. No server of our own.

**Who builds what:** Codex builds the UI against the `Backend` contract and a local demo backend;
Claude builds the claude.ai backend adapter, the game logic (with tests), integration and
publishing. Handoff details: `CODEX-BRIEF.md` (same folder).

**Capabilities declared:** `db`, `user`, `room`.

| Capability | Used for |
|---|---|
| `db` | All persistent state: sessions, stage, Fragments, votes, Vows, players, pull logs. Subscribed live with `onSnapshot`. **Source of truth for the current stage**, so late joiners and refreshes recover. |
| `user` | Who is viewing (opaque id) and display names. Warden/owner checks. |
| `room` | One-off live cues only (e.g. "play the reveal now", reactions). Never state. Topics declared with `"interact"` so a non-owner Warden can send them. |

**Data model (db paths):**

| Path | Contents | Written by |
|---|---|---|
| `sessions/{sid}` | name, stage, status, wardenId, current Fragment, timers | Warden (single-writer lease) |
| `sessions/{sid}/fragments/{fid}` | text, category — **no author field** | the writer, once |
| `sessions/{sid}/votes/{vid}` | fragmentId only — **no voter field** | each voter |
| `sessions/{sid}/attendance/{userId}` | joinedAt, votesCast | that user |
| `vows/{vowId}` | text, owner (optional), sessionId, status | Warden |
| `players/{userId}` | display character, starter pick, pull log, owned characters/cosmetics | that user only |
| `data/users/{userId}/private` | this user's own Fragment ids (to edit/delete their own) and votes used | that user (private) |

**Starlight is computed, never stored as a balance.** Each client calculates a player's balance
from public facts — attendance docs, votes cast, fulfilled vows — minus pulls in that player's own
log. No one's client ever writes someone else's document, and there is no read-modify-write race
(the db has no transactions).

**Anonymity — what is and isn't promised:**
- Fragment and vote documents carry no author/voter id, and the db API exposes no writer metadata
  to readers (checked in `db.d.ts` 0.2.60). So **inside the app, nobody — including the Warden —
  can see who wrote a Fragment.**
- Not promised: whatever the platform logs server-side. The spec says "anonymous in the app",
  not "anonymous from the platform".
- The 3-vote limit is enforced by each person's own browser (honor system). Acceptable for an
  internal team; stated openly in the app's help text.

**Local fallback:** if capabilities resolve `null` (e.g. file opened locally), the app runs in a
single-browser demo mode using browser storage, with a visible banner. Used for development.

**Backend adapter (makes Plan B cheap):** all saving, live sync and identity go through one
module, `backend.js`, with a small interface (`docs`, `subscribe`, `presence`, `emit/on`, `me`,
`isAdmin`). Game code never calls `claude.use()` directly. Implementations:
`backend-artifact.js` (claude.ai capabilities), `backend-local.js` (demo mode, browser storage),
and — only if needed — `backend-supabase.js`.

**Plan B — if the artifact route is blocked** (company admins disallow it, or Milestone 1 fails):

| Artifact piece | Plan B (free tiers) |
|---|---|
| Artifact hosting | Static host: Vercel / Netlify / Cloudflare Pages |
| `db` | Supabase Postgres |
| `room` | Supabase Realtime (presence + broadcast) |
| `user` | Supabase Auth (Google or email link); admin = Jay's account id |
| Media | Shipped with the static site, or Supabase Storage |

Plan B costs: ~2–3 extra build days; teammates log in once; free Supabase projects pause after
7 days idle (needs a keep-alive ping or a manual restore before each retro); the project owner
can open the database (Fragments still carry no author).

## 10. Error handling

- Capability unavailable → demo mode banner; nothing crashes.
- Warden disconnects → session keeps its stage; any Contributor can claim Warden via the lease
  after a timeout.
- Write conflicts (last-writer-wins) → only the Warden writes session state; everyone else writes
  only their own docs, so conflicts are limited to the Warden's own rapid clicks.
- Missing art/video → silhouette / still-image fallback.
- Video fails to autoplay → show the still with the code entrance animation.

## 11. Testing

- `logic.js` holds all pure logic — pull RNG with pity, rates, Starlight calculation, vote tally
  and reveal order, stage transitions — with unit tests via Node's built-in test runner.
- UI checked in demo mode in a browser at laptop and phone widths.
- After first publish: read back each db collection once to confirm writes land and Fragment/vote
  docs contain no author ids.
- **Dry run** with 2–3 teammates before the first real retro.

## 12. Setup requirements (company account)

- Publish from **Jay's company Claude account**, not the personal account used in this session.
- Share with teammates at **Contributor** level — Viewers cannot write to `db`, so they couldn't
  post Fragments or vote.
- Company admins must allow artifact sharing and these capabilities → verified in Milestone 1.

## 13. Milestones (the detailed implementation plan comes after this spec is approved)

1. **Feasibility check (before any game code).** From the company account, publish a tiny test
   artifact declaring `db`, `user`, `room`. One teammate opens it, writes a doc, receives a room
   event. If this fails, hosting is revisited before anything else is built.
2. **Core retro loop** — all six stages, plain UI, demo mode + db mode.
3. **Theme and reveals** — world visuals, landing page, Fragment pull reveals, code motion.
4. **Gacha** — Starlight, banner, pity, collection, cosmetics, Sanctuary lamps.
5. **Art integration** — remaining Gemini art, background removal, video compression, and the
   Blender Sanctuary renders (requires Blender + Blender MCP installed and connected).
6. **Launch** — publish from company account, dry run, first real retro.

| Week | Claude | Jay |
|---|---|---|
| Sep 28 – Oct 4 | M1 feasibility test → M2 core retro loop | 5 remaining Gemini characters · start VRoid models |
| Oct 5 – 11 | M3 reveals + movement (chibi placeholders) · M4 gacha · Blender pipeline, walking frames, Sanctuary renders | Finish 6 VRoid models · install Blender + Blender MCP |
| Oct 12 – 16 | M5 art swap-in, fixes | Dry run Oct 14 · launch Oct 16 |

Checkpoint **Oct 9**: walking frames working, or fall back to chibi glide. Jay's time: ~15–20 h.

## 14. Out of scope (v1)

Sound/music · real-time 3D in the game (Blender output ships as pre-rendered images) · leaderboards or stats per person · character abilities · more than 11
characters · videos for A-grade characters · mobile app · integration with Jira/GitLab.

**Phase 2 (after launch, own spec):** a short post-retro game that uses pulled characters
(direction not chosen yet; co-op "Sprint Boss" battle suggested). To prepare, each character's
data entry carries an optional `skill` field that the retro ignores.

## 15. Open questions

1. **Name** — Jay decides.
2. **Final characters** — Jay decides later; placeholders used until then.

**Decided:** game code lives in its own folder, `C:\Users\hp\gacha-retro`.
