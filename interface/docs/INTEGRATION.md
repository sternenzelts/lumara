# UI handoff

The UI follows CODEX-BRIEF.md. Start locally with `npm install` and `npm run dev`; `npm run build` produces a static, relative-path `dist/`. The only runtime external requests are the permitted Google Fonts styles and fonts.

## Ownership and integration

- `src/backend/types.ts` preserves the shared contract.
- `src/backend/local.ts` implements the browser demo. `?player=jay` is admin; `?player=ana` is a contributor. Two tabs share localStorage and BroadcastChannel. This is a local demo, not authenticated access.
- `src/backend/index.ts` exports `configureBackend(backend)`. Claude should initialize the real artifact adapter and call this before mounting React. No artifact adapter file is created here; runtime detection remains with its owner.
- `src/logic/index.ts` is explicitly marked `// TEMP stub — Claude replaces`. All requested exports and signatures are present. Pulls cycle through the roster; balances are fixed at 1200; pity is zero; reveal order preserves the supplied list; glow is a fixed preview. These are deliberately fake, not the finished game economy. Replace this file with Claude’s implementation before release.
- Fragment editing uses the existing contract: create the edited thought, then delete its previous version. There is no new backend method. If deletion fails, the original remains alongside the replacement, and the error is surfaced.
- `GAME_NAME` is a placeholder constant in `src/data/characters.ts`. Roster and asset mappings are isolated in `src/data/characters.ts` and `src/data/art.ts`.
- No character reveal video is enabled until final media arrives. Optional reveal media automatically gets the video stage, still fallback, muted inline playback, and skip-after-first-view behavior.
- The Sanctuary currently reuses supplied painted art. Replace `SANCTUARY_BACKGROUND` with Blender output without changing stage or lamp state. Character movement uses presence at approximately 10 Hz while walking, with an idle heartbeat and peer expiry.

## Verification

`npm run typecheck`, `npm test`, and `npm run build` check types, local backend behavior, and static build output. The build also enforces file count, per-file and total media limits, and relative paths. Five local backend tests pass. A headless-browser run passed 27 checks at 1440px and 375px with reduced motion, including the two-player flow, simultaneous thought submissions, shared reveals, private writing, stacked votes, reload recovery, Vow review/lamp updates, current-stage navigation, frozen companions, the refreshed roster, and no runtime errors. Full-motion choreography and future real video files still need a media dry run.

Final static output: 65 files, 33.74 MB total, 6.29 MB largest file. The only runtime external resources are the allowed Google Fonts assets.

## Before release

Replace temporary game logic; initialize the real adapter; run the company-account capability feasibility check; supply final A-grade assets, Sanctuary renders, reveal videos, and game name; then complete a real teammate dry run. The frontend does not publish or call the artifact runtime directly.

The refreshed handoff roster includes Ayaka (S++ Ice/Time) and Sollene (A Moonlight). Ayaka’s extra form is available; the active brief leaves her cutout pending, so moving-avatar fallback remains enabled. Shared local writes use Web Locks when available to serialize concurrent tabs; unsupported browsers keep the basic synchronous demo fallback.


## Standalone build budget

As of 2026-09-27, the user has authorized exceeding the old Claude artifact limits. `npm run build` reports total size, file count and largest file without enforcing the old 64 MB / 15 MB / 250-file caps. Relative entry resources remain checked. Use `npm run build:artifact` only when validating compatibility with the original artifact target. This does not deploy the game or replace its local backend.
