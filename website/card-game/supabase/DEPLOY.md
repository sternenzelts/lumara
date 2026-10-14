# Enable Last Light in the existing Lumara Supabase project

The card game uses the retrospective's existing Supabase project and browser sign-in. It adds only `last_light_*` functions/tables and the `last_light_private` schema. Retrospective data and policies stay separate. No Render service is needed.

## 1. Apply the database migration

In the existing project's SQL Editor, paste and run the complete contents of [migrations/202610140001_last_light.sql](migrations/202610140001_last_light.sql).

This must happen before enabling the frontend. The migration is transactional and may be deliberately rerun. It registers only the room-version table with Realtime. Complete game state and member identities are in a private schema, unavailable to browser roles. The authenticated function validates moves and returns only each player's hand and permitted private future view.

Anonymous sign-in is already used by the retrospective. Keep it enabled in Authentication â†’ Sign In / Providers. Card-game visits reuse a current session and create an anonymous identity only after the visitor chooses Create or Join.

## 2. Deploy one Supabase Edge Function

Dashboard option:

1. In **Edge Functions**, create a function named **last-light** using the editor.
2. Replace the function contents with the complete [deploy/last-light.js](deploy/last-light.js). This generated file includes the same engine and service tested by the app.
3. Keep **JWT verification enabled** and deploy. The function also validates the caller through Supabase Auth and derives the seat from that identity.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided inside the Supabase function environment. Never put the service-role key in Vite, GitHub frontend secrets, or a browser.

The default allowed origin is `https://sternenzelts.github.io` (plus the two local development origins). If using a different frontend origin, set the function secret `LAST_LIGHT_ORIGINS` to a comma-separated list of exact origins, with no path. The function accepts authenticated POST requests and returns private views with `Cache-Control: no-store`.

CLI alternative, from `website/card-game`:

```powershell
npx supabase login
npx supabase functions deploy last-light --project-ref sllaffecbkuayzjxvqju
```

Do not run `supabase db push`: the project agreement is that Jay applies the reviewed SQL himself. The tracked migration here is independent of the older, locally ignored retrospective migration directory.

## 3. Publish the frontend, with the backend ready first

Merge the Supabase multiplayer PR. The Pages workflow continues to publish practice mode until the repository variable below is set. It reuses the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` GitHub Actions secrets; no new browser credential is required.

In GitHub â†’ Settings â†’ Secrets and variables â†’ Actions â†’ Variables, add:

```text
LAST_LIGHT_MULTIPLAYER_READY=1
```

Then run **Deploy Lumara (website + game)** from Actions. The workflow compiles the card game with `VITE_CARD_MULTIPLAYER=supabase` and enables Create/Join. Setting the readiness variable back to `0` and redeploying restores practice mode.

## 4. Verify live multiplayer before inviting friends

Use separate browser profiles or devices. Tabs sharing one browser's Supabase identity resume the same seat.

1. Create a two-player room, share its invitation, and join from the other identity.
2. Both players ready up; only the host deals.
3. Play, draw, respond to Nullify, choose a face-down pair steal, and arrange a hand. Both tables must update, with opponent hands staying hidden.
4. Reload each browser and use Resume/Join to recover the same seat.
5. Temporarily disconnect one browser, reconnect, and confirm the latest state arrives. Realtime wakes up a refresh; a 15-second poll and tab/online events also recover missed notifications.

## Local verification and maintenance

```powershell
npm test
npm run build
npm run edge:typecheck
```

Tests run the migration in an isolated Postgres engine, including RLS, RPC permissions, seat races and competing moves. They never access the live database. The Edge Function copies are generated from `src/engine.ts`, `src/catalog.ts`, `src/online-service.ts`, and `src/room-http.ts`. After changing one of those:

```powershell
npm run edge:sync
npm run edge:bundle
```

The normal build and CI fail if the generated copies or single-file deployment bundle are stale. Deploy the updated function before publishing frontend changes that require it.

Rooms remain available for seven days, including after function restarts. Each identity may create up to five unfinished, unexpired rooms. Expired rows are retained for now; there is no automatic deletion job. Supabase's existing project quotas apply. Public moderation and a room-management screen are outside this change.
