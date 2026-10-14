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

## Hosting

**Live practice edition:** the Pages workflow (`.github/workflows/pages.yml`) builds this game with `VITE_PRACTICE_ONLY=1` and publishes it at `/cards/` (https://sternenzelts.github.io/lumara/cards/). That build hides online rooms and offers practice against bots, because GitHub Pages cannot run the game server. Online rooms need the Node service below.

Use a Node service with WebSocket support, such as a container host. This multiplayer game needs a running server; static hosting alone only supports practice. Build/start commands are `npm ci && npm run build` and `npm start`. Set `PORT` to the host's assigned port and `SERVER_ORIGINS` to the exact HTTPS origin of the deployed site. Serve one instance: rooms currently live in memory and disappear on restart. Persistent match storage and load testing remain prerequisites for a durable public service.

Keep the frontend and server on the same origin where possible. For separate services, set `VITE_GAME_SERVER` at build time to the server's HTTPS URL and allow the frontend origin through `SERVER_ORIGINS`. HTTPS/WSS must be configured by the hosting provider. This repository does not deploy anything automatically.

The Dockerfile builds and starts the combined service. Example: `docker build -t lumara-last-light .`, then `docker run --rm -p 51399:51399 -e SERVER_ORIGINS=http://localhost:51399 lumara-last-light`.

## Rules and implementation

See [RULES.md](RULES.md) for verified deck counts, mappings and the online response-window adaptation. The publisher's current [Original rules](https://www.explodingkittens.com/pages/rules-kittens) and [Party Pack rules](https://www.explodingkittens.com/pages/rules-kittens-party) were checked during implementation.

The [DomiIRL fan repository](https://github.com/DomiIRL/exploding-kittens) was reviewed as a reference. Its work-in-progress gameplay code was not copied: the audit found inconsistent Attack turn accounting and deck counts. This app implements the rules directly using the MIT-licensed boardgame.io multiplayer framework. No publisher illustrations or branding are included.

Character choices are cosmetic. Hidden cards and future views are filtered on the authoritative server; undo and move-log payloads are disabled/redacted. Host-only dealing, card ownership, targets and permutations are validated server-side. Production room moderation, quotas and durable storage are not implemented.

## Validation and artwork

`npm test` covers public-seat rendering, privacy, special-action actors, elimination, escaped player names, invalid actions, deck counts, stacked Attacks, Nullify chains, Protection insertion, private reorder, gifts and combos. Hand-flow tests exercise arrow movement, shuffle, keyboard focus and face-down stealing through the real Local multiplayer transport. The suite also simulates 72 full games across 2/3/4/7/8/10 seats. `npm run build` validates TypeScript and compiles both client and server.

The generated card assets are in `public/chibi/`. Exact prompts, original character references and the built-in ImageGen provenance are recorded in [art-prompts.json](art-prompts.json). The parent website's original splash images remain untouched.
