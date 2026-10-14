# Lumara · Last Light

An original Lumara character reskin of the familiar survival card game. Cute generated chibi scenes illustrate all cards. Original supports 2–5 seats; Party Pack supports 2–10. Offline practice has one human and three bots.

The seated table uses rendered artwork for all 14 companions around a perspective salon table. Live public card counts and turn states accompany the draw and discard piles; private hands remain server-filtered. Phones retain a horizontal hand rail, larger parties use compact seats and two rows at narrow widths, and reduced-motion preferences retain every control. The surface contract is recorded in [.impeccable/surfaces/seated-table.md](.impeccable/surfaces/seated-table.md).

How to play has six illustrated lessons using the real cards, interactive survival and stealing examples, a Nullify demonstration, and an edition-specific illustrated card catalog.

## Run locally

Practice starts immediately with three bots. A name is optional for practice; leaving it blank uses Guest. Online room creation and joining still require a name.

Matching pairs now open the opponent's face-down hand after Nullify responses finish: choose one card back to steal, then continue your turn. Card faces and IDs stay private. Three matching cards still request a specific title.

**Arrange hand** lets you drag cards into order, move a chosen card with the left/right buttons (including on phones), or use the keyboard arrow keys. **Shuffle hand** randomizes only your own hand. Both are available between turns and preserve your cards and the draw pile. The offered hand is locked while another player chooses a card to steal, then unlocks afterward.

Requires Node 22 or newer.

```powershell
cd website/card-game
npm ci
npm run build
npm start
```

Open http://127.0.0.1:51399. The Node process serves the built website, lobby API and Socket.IO multiplayer together. Create a room, share its link, have everyone ready up, then the host deals. Returning to Rooms preserves a Resume button. Reloading the invitation restores the seat in the same browser tab when session storage is available.

For development, run `npm run server:dev` and `npm run dev` in separate terminals. Vite opens at http://127.0.0.1:4180 and proxies game requests to port 51399.

## Hosting with the existing Supabase project

The card game now supports the retrospective's existing Supabase project. Rooms persist in a separate private schema; the `last-light` Edge Function runs the same tested rules, validates the authenticated seat, and returns only that player's private hand. Realtime sends only version updates, with polling and reconnect refreshes recovering missed changes. The card game does not read or write retrospective tables.

Follow [supabase/DEPLOY.md](supabase/DEPLOY.md) for the reviewed SQL, a single-file function that can be pasted into the Supabase dashboard, and the release sequence. The Pages workflow publishes `/cards/` in practice mode until the backend is deployed and the repository variable `LAST_LIGHT_MULTIPLAYER_READY=1` is set. It then builds with `VITE_CARD_MULTIPLAYER=supabase` and reuses the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets. Merge alone does not enable online rooms.

For local Supabase development, set the four `VITE_*` values documented in `.env.example`. Practice still uses the existing local bot engine. Rooms last until seven days after their last move, survive function restarts, and resume the same seat for the same Supabase identity. Different friends need separate browsers/profiles or devices; two tabs with the same identity share a seat.

The optional local Node/Socket.IO service and Dockerfile remain available for development. That service keeps its rooms in memory. A separately hosted Node service can still use `VITE_GAME_SERVER` and `SERVER_ORIGINS`; the Supabase path requires no such service.

## Rules and implementation

See [RULES.md](RULES.md) for verified deck counts, mappings and the online response-window adaptation. The publisher's current [Original rules](https://www.explodingkittens.com/pages/rules-kittens) and [Party Pack rules](https://www.explodingkittens.com/pages/rules-kittens-party) were checked during implementation.

The [DomiIRL fan repository](https://github.com/DomiIRL/exploding-kittens) was reviewed as a reference. Its work-in-progress gameplay code was not copied: the audit found inconsistent Attack turn accounting and deck counts. This app implements the rules directly using the MIT-licensed boardgame.io multiplayer framework. No publisher illustrations or branding are included.

Character choices are cosmetic. Hidden cards and future views are filtered by the authoritative backend; undo and move-log payloads are disabled/redacted. Host-only dealing, card ownership, targets and permutations are validated server-side. Supabase provides durable rooms, private views, atomic version checks and a five-active-room creation limit per identity (idle lobbies stop counting after an hour, idle games after a day). Moves are checked against the last table event the player saw, so simultaneous responses and private hand reorders do not conflict. Public moderation and load testing remain outside this prototype.

## Validation and artwork

`npm test` covers public-seat rendering, privacy, special-action actors, elimination, escaped player names, invalid actions, deck counts, stacked Attacks, Nullify chains, Protection insertion, private reorder, gifts and combos. Hand-flow tests exercise arrow movement, shuffle, keyboard focus and face-down stealing through the real Local multiplayer transport. Supabase tests apply the actual SQL to local Postgres, check permissions and competing requests, and run the exact bundled function with the real SDK. Client tests cover private refreshes, missed updates, resume, duplicate clicks, cleanup and late responses. The suite also simulates 72 full games across 2/3/4/7/8/10 seats. `npm run build` validates TypeScript, generated function copies and the deployment bundle, then compiles the client and optional Node server. `npm run edge:typecheck` checks the function source in Deno. No test writes to the live database.

The generated card assets are in `public/chibi/`. Exact prompts, original character references and the built-in ImageGen provenance are recorded in [art-prompts.json](art-prompts.json). The parent website's original splash images remain untouched.
