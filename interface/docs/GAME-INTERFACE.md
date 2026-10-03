# Lumara game interface

The approved game shell replaces the website-style sidebar, dashboard layout and title-video opening with a painted welcome, Sanctuary HUD, bottom dock and framed game menus. It uses the existing Lumara map and original Seren art. The surface contract is `.impeccable/surfaces/game-shell.md`; the updated visual system is `DESIGN.md` with `.impeccable/design.json`.

## Structure and routes

`src/components/GameShell.tsx` owns the welcome, Sanctuary, shared HUD, dock, task-panel frame and Vow journal. `game-shell.css` supplies the scene composition and scoped task treatments. `src/App.tsx` retains Backend subscriptions, identity, routing, shared dialogs, task locking, toasts and pull integration. Every route except the standalone world map uses GameShell.

| Route | Behavior |
| --- | --- |
| Empty or unknown hash; `#title` | Map welcome with Seren, player greeting and Enter Lumara. New players enter the full story and nickname flow. Companion-less named players complete five free welcome wishes before entering the Sanctuary. |
| `#sanctuary` | Player/currency HUD, Aurelis identity, fulfilled-Vow counter, Seren, voyage actions and game dock. The counter opens the map. |
| `#map` | Existing standalone world map. Back returns to the Sanctuary. See `WORLD-MAP.md` for coordinates, effects, progress and local preview. |
| `#collection`, `#collection/<id>` | Companions and existing character detail pages inside the game frame. Map portrait links retain their deep links. |
| `#banner` | Three S++ banners with supporting companions, or the gated first-wish tutorial. |
| `#exchange` | Existing specific-companion exchange. |
| `#vows` | Carried action items with ownership text, status and fulfillment controls. |
| `#archives` | Completed voyages and their action items. |
| `#retro` | Existing check-in, pull, thought, vote, discussion and Vow stages. |
| `#settings` | Admin settings; non-admin access renders the Vow journal instead of the admin controls. |

The dock exposes World Map, Companions, Wishes, Exchange, Vows and Archives. HUD identity, task-panel Back and Close return to the Sanctuary. The small Title screen action returns to the welcome. Task panels receive focus when opened and scroll internally; they are route workspaces, so HUD and dock remain available. Create, join and help are separate dialogs with the existing focus trap, Escape handling and focus restoration.

## Shared play and data ownership

With no active session, the voyage gate offers Start a Retro to the admin and Join Retro to players. An active session shows party size, progress or paused state, and Return to voyage; that action calls the existing Backend join method before navigating. Existing create/join dialogs remain in App.

The Sanctuary counts fulfilled vows and caps its beacon display at twelve. The new Vow journal calls `backend.updateVow` through the shared busy/error wrapper to toggle open and fulfilled states. Its UI permits the admin or the active session's Warden; other players see disabled controls. Backend authorization remains authoritative. These are real local-demo updates, distinct from the world map's explicitly temporary Light next beacon preview.

The shell consumes player, attendance, settings, vows and currency values. The upgrades plan authorizes real local game economics, RNG and pity in src/logic/index.ts. Remote identity and a production adapter remain separate. Characters remain cosmetic and the retrospective's anonymity and existing task permissions remain intact. Local tabs share the existing browser-backed demo data; this is not a remote authenticated room.

## Preferences and scene behavior

Seren voice uses `lumara.serenMuted`; motion uses `lumara.motionPaused`. Supplied recorded lines carry the full opening, story, final call, tutorial grade reaction and returning-player welcome. Muting and browser gesture restrictions are respected. The first Sanctuary arrival uses the tutorial grade reaction, without the obsolete arrive_sanctuary line.

Four clouds and sixteen motes form a fixed CSS effect set. The map has a brief entrance, Seren a gentle breathing loop and menus a short arrival. Pause motion and `prefers-reduced-motion` keep the interface static; hidden tabs pause ambient effects and current audio. The pulled companion is retained in the collection and HUD portrait; its roaming Sanctuary rendering remains removed at Jay's request.

## Responsive game frame

Desktop keeps the map visible around the edge HUD, large Seren cutout, dialogue, voyage gate and six-destination dock. Task panels reserve space above the dock and contain their own scroll area. The shared Marcellus and Manrope typography, dark translucent glass, cream text and thin gold edges continue across menus.

At 1100px and below, the shell tightens HUD spacing, shrinks the voyage gate and hides the featured-wish tile; Wishes remains in the dock. At 680px and below, the welcome stacks, its decorative subtitle is omitted to avoid Seren's halo, the wallet sits beneath player identity, and the dock becomes a three-column, two-row layout. Task panels retain a fixed header and scrollable content. Short viewports at 720px height or below reduce secondary flourishes and spacing. Native focus outlines, labels and disabled states remain visible.

## Supplied art and verification

`public/art/world/lumara_map_v2.webp` is used unchanged as the background. The large guide is `public/art/seren/seren_cutout.webp`; voice assets come from the supplied Seren Japanese recordings. `public/art/world/source.md` and the character source notes record asset origin. CSS effects are separate from the raster image. The current welcome does not render the old title video; optional pull-reveal media belongs to the existing reveal flow. Asset paths use Vite's base URL for relative static deployment.

Run from `interface`:

```sh
npm run dev
npm run test
npm run build
```

The build runs TypeScript, Vite and static artifact checks. Existing Backend and world-map tests remain relevant to shared data and map behavior; there is no dedicated GameShell unit-test file in this change.

Browser evidence is recorded at `../.impeccable/review/game-shell/verification.json`, with captures at 1440px, 1024px and 375px. The recorded checks cover welcome entry, removal of the sidebar, menus and close controls, map round trips, page/panel overflow, creating a retro, joining from a second tab, hiding admin controls for a contributor, and the Vow journal, with no page errors. Review-driven final responsive adjustments hide the compact featured tile and phone subtitle; final capture review accompanies the implementation handoff. These checks do not establish production authentication or a measured frame-rate guarantee.

This change is prepared in the staging `interface` project. Deployment, production adapter integration and further Voyage redesign remain separate work.

## Title music

By explicit user request, the supplied local Kenka MP3 is bundled at `public/audio/kenka.mp3`. `TitleMusic` is mounted only on the title route: it loops at 25% volume, attempts playback (retrying after a gesture when autoplay is blocked), offers an independent title music toggle, pauses in hidden tabs, and stops/unloads/resets immediately when leaving the title. Returning to title restarts the song unless the player muted title music. The mute preference is local (`lumara.titleMusicMuted`), separate from Seren voice. Kenka does not play outside the title; the Sanctuary has its own separate music component.
Sanctuary music is mounted only on the Sanctuary route. Its music-note button opens a 0–100% volume slider and play/mute control; no song title is shown. Volume defaults to 25% and is remembered as lumara.sanctuaryMusicVolume; mute uses lumara.sanctuaryMusicMuted. Navigation disposes playback, and hidden tabs pause it. Browser verification covered decoding, looping, live volume changes, mute/resume, keyboard dismissal, and route cleanup.

### Admin settings

The admin screen uses five categories: Players, Voyage, Wish rates, Starlight, and Stardust. It opens on Players. Only the selected category is visible; edits persist across categories until saved or discarded. The Save/Discard bar stays visible while settings content scrolls. Dark native fields and readable labels follow the cinematic menu palette. Rate totals over 100%, invalid pity thresholds and invalid currency values receive inline feedback without persisting changes. The A rate is calculated as the remaining probability. All settings still save through the existing admin-only backend.

Verification: desktop and phone category switching, save-bar visibility, cross-category edits, validation, save and discard; 79 unit tests and build passed.

Admin settings includes a Player view link in local demo mode. It opens ?player=teammate-preview#title in a separate tab with its own nickname, intro and companion progress, sharing the world/session state. The admin tab remains open; the teammate has no admin controls. Browser-verified through the full new-player flow and five free welcome wishes.

First-time Seren welcome now has an explicit Choose your name action that opens the nickname field directly; the tiny unnamed continuation arrow is no longer the entry to name selection. Type a nickname and press Confirm to continue.

First-time welcome gift: five random free rolls, recorded with source `welcome`. No Starlight is spent; duplicates award normal Stardust and all five rolls count toward shared pity. The backend enforces the five-roll limit across reloads and tabs. An interrupted claim resumes only its remaining rolls. Existing players receive no retroactive gift. After the best companion's cinematic, a five-result summary appears before Sanctuary. Normal banner wishes keep their configured cost.

Verification: 83 tests and build passed; full onboarding and all five result cards checked on desktop and phone.

### Players and currency gifts

Admin settings opens on Players, showing saved profile nicknames and live Starlight/Stardust balances. Select a player, choose currency, enter a positive whole amount and give it. The player retains a persistent grant ledger with sender, currency, amount and date; recent gifts are shown. Wallet calculations include gifts without replacing earned currency or spending.

The active Warden also has a Warden panel entry and can view/give to current party members. Only admins can view/give to every registered player or change global game settings. The local backend enforces these role and recipient checks on every grant. Ordinary teammates have no grant controls. Requests accept 1?1,000,000 whole units. This is the existing shared-browser demo backend.

Verification: desktop/phone admin gifts of both currencies, sender ledger, preserved unsaved settings, Warden party filtering and recipient HUD; backend role/amount/persistence tests; 86 tests passed.


### Approved S++ reveals (2026-09-27)

Ayaka, Mahesvara and Keira use the approved reveal-demos choreography, mounted inside the existing wish overlay. The character canvas effects, art layers, captions, voices, timings and lower-left name cards are ported directly. The crystal flight, grade tells and shatter are shared with every other character; each S++ keeps its authored silhouette entrance. Every featured banner offers a reward-free preview.

The theme cuts are STYX HELIX, One Life Against A Million, and TACTIC respectively. All voices await their ended event (duration plus 300 ms fallback). Ayaka pauses her theme during Chrono Stasis; Keira ducks to 7% during every line, returns to 32%, then rises to 55% for her card. The round icon cycles on / 30% / muted, remembered by lumara.revealSound. Replay, Skip and unmount cancel pending voices, tweens, intervals, delayed effects and animations; no doubled sequence. Reduced motion shows the final pose and card immediately.

Assets reuse existing art and audio, with one shared crystal/pull music/SFX set. Added art is quality-80 WebP capped at 1536 px (1280 px for backgrounds); the three theme cuts are 128 kbps MP3. scripts/port-reveals.py records how demo sources map to scoped game runtimes. Opening, nickname and naming logic remain untouched.

Browser verification: full sequences, ordered voice playback, actual theme pause/ducking, master sound cycle, Replay, Skip, cleanup, desktop and phone name cards; demo compositions opened and compared. Verification scripts and captures are kept outside public so they do not enter the build artifact.
Final validation: 90 tests passed; production artifact is 63.79 MB across 159 files, below the 64 MB limit.

### Current wish banners (2026-09-27)

Wishes now shows one selected full-scene banner with three portrait tabs and supplied wide Mahesvara, Keira and Ayaka art. The identity shows grade, name, title and element; its View character details icon opens an art/flavor/ability popup with keyboard trapping, Escape and focus restoration. Companion, pool and history links retain the selected banner for Back to Wishes, shell-arrow and Escape returns. Icon utilities expose real rates/pity, history and reward-free approved S++ previews. The full thirteen-character pool and shared economy remain intact; current ×1/×10 costs are 200/2,000 Starlight. Results use dark panels, gold framing and rarity-specific trim.

See [Wish banners](WISH-BANNERS.md) and `.impeccable/surfaces/wish-banners.md` for the current surface contract and supplied-art provenance. Final validation: 94 tests passed; build passed at 63.64 MB across 162 files. Browser checks at 1440 × 900, 1024 × 768, 375 × 812 and 375 × 667 covered popups/kits, keyboard focus, same-banner returns, previews, pool/history and paid controls without errors or overflow. Final review resolved its two recorded issues: dark results/close contrast and short-phone identity fit. This local extension preserves `DESIGN.md`, `.impeccable/design.json`, opening, nickname, naming and voice behavior; no user visual approval is claimed.


### Companion artwork framing

Character detail paintings now use the dark game palette instead of inherited pale image/background bars. The original image is contained without cropping, with a responsive height and a single-column layout below 900px. Verified at 1440x900, 797x645 (the reported screenshot size), and 375x812 with no page overflow or errors. 94 tests and the production build passed.


### Seren S+ pull reveal

Seren now dispatches to the supplied seren2 demo port when her pull reveal is shown, using the shared crystal pull with a gold S+ tell. Her part preserves silhouette pulses, splash push-in, floating voiced arrival in Aurelis, gathering sword light, the timed white-out, Dawnbreak pose and golden dawn/feathers, followed by the S+ name card. The greeting voice finishes before Dawnbreak begins. Theme fades from pull music, ducks to 7% under the greeting, returns to 32%, rises to 50% at dawn and 55% on the name card. The Dawnbreak caption has no separate supplied voice file.

Sound uses lumara.revealSound (on / low / muted); Replay, Skip and unmount use the existing cancelable playback lifetime. Reduced motion goes to the card. For a free preview, open Ayaka details, scroll to Seren, and use her play icon. Supporting banner portraits stay display-only. Opening, nickname and guide voice logic remain untouched.

Verification: full desktop reveal with actual audio, gold cue, complete voice before dawn, 7% duck, sound cycle, Replay cancellation, Skip/close audio cleanup, free-preview balance and phone card. Shared-pull regression test confirms S+ remains gold without rainbow cracks. 95 tests passed; production build 66.13 MB across 165 files. The old artifact caps remain disabled by user direction.
# Sanctuary music continuity

## Landscape reveal splash replacement

Jay supplied three new 1672 × 941 landscape images. The exact matching PNG originals were found in Downloads and copied unchanged into `public/art/reveal-landscapes`. Ayaka's splash, Keira's opening/final splash, and Mahesvara's opening/mirror splash use them. Existing cutout poses and authored character actions retain their assets. Splash images use cover framing, filling the screen without stretching or letterboxing, with a 2% transition zoom. Different screen ratios crop the landscape at its edges. No source images were recompressed. The port script preserves the override.

Verified the three animated splash shots on desktop and phone with `verify-reveal-landscapes.cjs`; screenshots are in `.impeccable/review/reveal-landscapes`. `npm test`: 100 passed. Build: 169 files, 75.60 MB.

## Reveal theme startup recovery

Approved reveals now prime/preload their theme when mounted during the initiating interaction. Theme starts use a shared playback helper rather than silently dropping rejected `play()` promises: interrupted starts retry, media readiness can retry, and autoplay denials retry on a later gesture. Requests are canceled on pause, Replay, Skip, close, or character changes; Ayaka's deliberate Chrono Stasis pause uses the same cancellation path. Sound-level preferences and authored theme fades/ducking remain intact. Port scripts preserve this adapter when rebuilding the approved reveals.

`verify-reveal-music.cjs` checks all three S++ themes with a simulated failed first theme start, actual decoded playback, Replay, mute/unmute, and close cleanup. `npm test`: 100 passed. Production build: 66.13 MB.

## Sequential multi-wish reveals

A-grade wishes advance automatically after a 1.4-second name-card hold. S+ and S++ reveals remain on their name card until the player clicks the scene or presses Enter/Space; there is no premium auto-advance timer and no repeated Continue button. A small Click to continue hint appears only when the premium reveal finishes. Skip A reveals switches the remaining sequence to premium-only: A results are omitted from animation, every S+/S++ still plays in recorded order, and a currently running premium reveal is preserved. If no premium remains, Skip shows all cards immediately. Double-clicking the scene during animation bypasses all remaining animations and shows every awarded card; clicks on controls are excluded. Done closes the final results. Single wishes and the five free welcome wishes follow the same rules. Free animation previews retain Replay, animation Skip, and Continue so they can be inspected separately.

The outer reveal stays mounted throughout so Sanctuary music remains paused across characters and results. Skipped scenes unmount their runtime, cancel audio and timers, and never modify RNG, awarded inventory, pity, or charges. Close/Escape cancels presentation without undoing already awarded pulls. Verified by `verify-pull-skip.cjs` and regression tests: 103 tests passed; build 75.60 MB.

Verified by component regression tests (ordered ten reveals, duplicate remounts, summary timing, persistent music suspension), the welcome integration test, and browser x10 checks. `npm test`: 97 passed. Production build: 66.13 MB.

Dark Aria now has one persistent audio element above the routed screens. Companions, Wishes, the map, and other Sanctuary menus keep the same song and playhead. Voyage, title/story, hidden tabs, and every pull reveal (including free previews) pause it. Returning resumes the existing playhead without changing the player's saved mute or volume. The title/story continue using their own Kenka track.

Verified with `verify-music-continuity.cjs`: actual playback survives menu navigation; reveals, Voyage, and simulated visibility changes pause/resume; title playback remains isolated. `npm test`: 96 passed. `npm run build`: 165 files, 66.13 MB.
