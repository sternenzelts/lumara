# Lumara hosting plan — draft

Date: 2026-09-27. Status: proposal only. No services created, accounts connected, subscriptions purchased, or deployments performed.

## Intended use

- Four players total, mostly on Mac laptops; the host may use Windows.
- Two sessions per month, each lasting up to two hours.
- Shared Sanctuary and Voyage rooms, alongside the retrospective flow.
- Current production build: 66.13 MB, 165 files; largest asset: 6.29 MB.
- Future target: at most 500 MB of shipped game assets across all scenes and characters. This is a planning budget, not a measured Blender export size or an initial download target.
- Work remains in `C:/Users/hp/Downloads/gacha-art/interface`; preserve the current opening, nicknames, five free welcome wishes, banners, reveals, and audio rules.

## Proposed architecture

| Service | Responsibility | Starting approach |
| --- | --- | --- |
| Vercel | React/Vite game interface and initial static assets | Preview deployment first; select a plan appropriate to actual use |
| Supabase Auth and Postgres | Player identity, room membership, progress, inventory, currency, retro data | Free tier for a four-player pilot |
| Supabase Realtime | Room events, online status, shared stage changes, movement messages | Private room channels with measured usage |
| Separate asset storage/CDN | Future GLB models, Sanctuary/Voyage environments, large textures and audio | Evaluate Cloudflare R2 when 3D assets arrive |

Each browser downloads and renders its own art/models. Realtime transports small state updates; it does not stream the 500 MB game between players. Vercel hosting alone does not provide shared saved progress or multiplayer.

Cloud asset hosting means the owner's computer need not remain awake during play.

## What exists today

`src/backend/index.ts` defaults to `createLocalBackend()`. The demo saves data in localStorage and synchronizes same-origin tabs using BroadcastChannel. It does not synchronize players on separate laptops.

There is an existing `configureBackend()` integration seam and a `Backend` contract in `src/backend/types.ts`. Use them to introduce the hosted adapter while retaining the local demo. Hosted authentication must replace URL-selected demo identities and the hard-coded demo admin role.

Do not assume the current contract already covers secure production transactions: pulls are currently rolled by the client and appended through `appendMyPull`. Production wishing needs a server-side transaction/API that returns validated results.

## Vercel deployment

1. Put the current interface project under version control without copying the older `gacha-retro` folder over it.
2. Import the repository into Vercel. Root directory is `interface` if the repository contains that folder; use the repository root if only its contents are committed.
3. Framework: Vite. Build command: `npm run build`. Output directory: `dist`.
4. Configure preview and production environments separately. Keep production writes out of ordinary preview builds.
5. Preserve existing hash routes and `import.meta.env.BASE_URL` handling. Check direct links, refreshes, and asset paths on the deployed URL.
6. Deploy a preview, validate it, then publish the production URL as a later, separate task.

Vercel Hobby is restricted to personal, non-commercial use. Because Lumara is a team retrospective game, confirm whether this is a personal pilot or a company/internal deployment before choosing the plan; do not assume Hobby is eligible merely because there are four players.

The documented 100 MB Hobby CLI upload cap concerns uploaded source files. The current 66.13 MB build is not proof that an entire source checkout fits. For future growth, keep large 3D assets outside the deployment upload and verify the limits of the selected deployment method.

## Accounts, shared state, and permissions

- Four authenticated, invited players. A session belongs to one room; only members can read its private data or join its channel.
- Keep player nicknames in profiles and preserve `useUI().me.name` behavior.
- Save intro completion, welcome-wish consumption, inventory, pull history, selected character, currency ledger, pity, and Vows persistently.
- Validate wish cost, RNG, pity, duplicate conversion, free-wish eligibility, and inventory changes in one server transaction. Use request IDs to prevent duplicate charges after retries.
- Validate jewel grants server-side against Warden/admin permissions and retain the grant ledger. Clients cannot edit balances or their own role directly.
- Warden controls session stages and shared timers. Store a server timestamp for timer deadlines; each browser renders its local countdown.
- Preserve anonymous fragment and vote views. If private ownership is needed for deletion or vote limits, keep it in access-controlled records and exclude it from shared payloads. Do not promise anonymity from the database administrator.
- Use row-level security and private Realtime authorization. Browser code gets only the publishable/anon key with enforced policies; service credentials remain server-side.

## Realtime movement and interactions

Use durable database state for progress and retro decisions; use Broadcast for transient movement/interaction messages and Presence for online status. Do not save walking positions to the database every animation frame.

Initial movement design: send destination/start/stop/facing events, render walking locally, and send occasional correction snapshots. Rate-limit changes while moving, stop updates while idle or hidden, and interpolate between snapshots. A destination-based design must also give clients consistent paths/navigation data; free WASD movement may require more frequent corrections and must be measured separately.

Room messages carry player ID, room ID, a sequence number, and timing information. Reject stale or invalid updates. Give shared objects a consistent owner/server decision when two players interact at once. Persistent rewards must be confirmed by the server rather than granted from an untrusted animation event.

When a connection drops: show reconnecting status, stop accepting unconfirmed shared actions, rejoin the authorized room, reload durable state, and request fresh peer snapshots. Treat transient movement as disposable; do not replay every missed walking message. Show loading/ready status while assets load before placing a player into the shared scene.

Shared wish events should transmit server-confirmed result IDs once. Each client plays its own local animation; do not synchronize individual animation frames or let remote reveals replace a player's own active reveal. Preserve local sound preferences and existing background-music suspension.

## Free-tier usage estimate

Supabase Free currently includes 200 concurrent connections, 2 million Realtime messages per month, and 100 Realtime events per second. Sent and received Broadcast messages count separately.

Planning example: four players, each broadcasting five updates/second to the other three, with sender echo disabled:

`4 players × 5 updates × (1 sent + 3 received) = 80 messages/second`

`80 × 7,200 seconds × 2 sessions = 1,152,000 messages/month`

This is movement traffic only, assuming continuous movement for all four hours. It leaves about 848,000 monthly messages, but only 20 events/second of instantaneous headroom before room events, joins, Presence, corrections, and other traffic. Several tabs or additional test sessions also use the allowance. This is a capacity estimate, not a free-service guarantee.

Destination events and idle suppression should lower traffic substantially. Measure the implemented protocol; smooth local rendering can run at the display frame rate without sending that many network updates.

Pilot targets: keep sustained traffic below 70 events/second, check burst behavior against the 100 limit, and project total monthly messages below 1.5 million. These are internal headroom targets, not provider guarantees. Reduce update rates or revisit the plan if the four-player load test exceeds them.

## Twice-monthly session operations

Supabase Free projects may pause after one week of inactivity, so the gap between sessions is significant. Before each session:

1. Check project status in the dashboard; restore it if paused and allow time to become ready.
2. Verify login, room creation/join, shared state, and Realtime before inviting the group.
3. Export a backup before schema changes and periodically after sessions. Free does not include automatic database backups.
4. Check message usage, throughput, and errors after the session.

If automatic availability between sessions becomes a requirement, evaluate a paid plan or self-hosting rather than assuming the free project remains running.

## 500 MB asset strategy

- Export Blender content as runtime assets such as GLB; do not ship `.blend` source files to players.
- Measure each export, texture set, and animation before allocating the remaining roughly 434 MB.
- Reuse animations/materials when compatible, optimize geometry/textures, and supply lower-quality settings for older Macs.
- Load title assets first, then Sanctuary, then the selected Voyage area and characters. Do not preload the whole roster.
- Use versioned asset URLs and caching; a changed model should not invalidate unrelated downloads. Keep the scene manifest consistent with each app release.
- Evaluate an R2 bucket with a production asset hostname, correct CORS/cache headers, and tested audio/GLB delivery. Pricing, request quotas, and account setup require a separate review when implemented.
- Keep Supabase primarily for gameplay data. Its 500 MB free database allowance is unrelated to the game's 500 MB asset budget.

Illustrative bandwidth only: four players each downloading all 500 MB twice would transfer about 4 GB/month before testing, updates, or retries. Actual usage depends on caching and which scenes players visit. Track storage/CDN transfer separately from Realtime messages.

## Implementation phases

1. **Hosted preview:** publish the current interface to a preview URL, still explicitly labeled local demo. Check Mac browsers, assets, navigation, and audio. This does not complete multiplayer.
2. **Persistent backend:** add authenticated identities, schema, policies, hosted adapter, server-side wish/grant transactions, and migration strategy for demo data. Do not silently overwrite cloud accounts with local saves.
3. **Shared retro pilot:** four devices join one room; verify attendance, stages, timers, fragments, vote limits, Vows, grants, reconnects, and persistence.
4. **3D pilot:** add asset storage, Sanctuary/character loading, movement protocol, object authority, quality settings, and Mac performance testing. Blender environments are future work, not currently deployed functionality.
5. **Production release:** promote the tested build, document restoration/backup procedures, and record actual monthly usage before expanding scope.

## Acceptance checks

- Four separate browser profiles/devices can join the same authorized room and see consistent shared state.
- Refresh and reconnect preserve nickname, inventory, wallet, pity, welcome progress, and Vows.
- Unauthorized room access and Warden operations fail; repeated wish requests never double-charge or award twice.
- Anonymous shared views do not expose fragment authors or voters.
- Sanctuary movement looks smooth on the actual Mac laptops without exceeding measured message limits.
- Loading a 3D scene does not force a full 500 MB initial download; graphics settings and reduced motion remain usable.
- Theme audio, title/story music, and Sanctuary music behave correctly after browser interactions and navigation in Safari and Chrome.
- Run `npm test` and `npm run build` for implementation changes; record build size and hosted smoke-test results.
- Restore a paused backend and a database backup in a rehearsal before treating the setup as dependable.

## Alternative frontend hosts: GitHub Pages and Hugging Face

Both can serve the browser game, but a static host does not replace the shared backend. Supabase authentication, database, and Realtime remain separate in these variants.

| Option | Fit for Lumara | Practical considerations |
| --- | --- | --- |
| GitHub Pages + Supabase | Suitable for a non-commercial prototype and small group | Published site limit is 1 GB; soft bandwidth limit is 100 GB/month. The proposed 500 MB asset library fits the total-site limit, but individual repository-file restrictions and large-asset handling still need checking. Free Pages uses a public repository. Check Pages usage restrictions before using it for company workflows; use external hosted authentication rather than collecting passwords on Pages. |
| Hugging Face Static Space + Supabase | Feasible preview alternative | Static Spaces are free and support React/Vite build steps. Use `sdk: static`, a build command, and `app_file: dist/index.html` when the interface is the repository root. Verify audio, full-screen rendering, auth redirects, and storage on the direct app URL. Do not treat a Space as automatically providing persistent multiplayer or a database. |

For GitHub Pages, publish `dist` through GitHub Actions and verify the repository subpath against the current relative asset URLs and hash routes. For Hugging Face, verify the exported asset paths and build configuration in a preview first. Keep the 500 MB future asset/CDN decision separate; no guaranteed large-library performance or quota fit has been established for a Hugging Face deployment.

Draft preference: GitHub Pages is the simpler of these two for a conventional static-game pilot if repository visibility and usage policies are acceptable. Hugging Face is a valid preview option; it does not remove the need for Supabase. Neither alternative has been deployed or selected by the owner.

References: [GitHub Pages limits and availability](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [Hugging Face Spaces overview](https://huggingface.co/docs/hub/spaces-overview), [Hugging Face static build setup](https://huggingface.co/docs/hub/main/en/spaces-sdks-static).

## Owner-computer alternative

The owner's computer can run the backend/database, using a local network connection or a secured HTTPS tunnel for remote players. Keep database ports private. This avoids Supabase Cloud plan quotas but still has software limits, hardware/network capacity, maintenance, and tunnel constraints.

It requires the computer to remain awake and online during sessions, plus backups, updates, and reconnection handling. Keep cloud/static hosting for large game assets to avoid serving the full asset library over the owner's home upload connection. Use this alternative if hosted costs or limits prove unsuitable; it is not required for the proposed first pilot.

## Decisions before implementation

- Personal pilot versus company/internal use, and the eligible Vercel plan.
- Hosted Supabase Free with pre-session restoration versus an owner-hosted backend.
- Login method, project/account owner, deployment region, and authorized four-player list.
- Desired movement controls, which objects are shared, and whether other players watch each other's wishes.
- Exact Blender export sizes and the asset-storage account/domain.

## Official references

Provider terms and quotas were checked on 2026-09-27; recheck before deployment.

- [Vercel Vite deployment](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel Hobby eligibility](https://vercel.com/docs/plans/hobby)
- [Vercel limits](https://vercel.com/docs/limits)
- [Supabase pricing, inactivity pausing, and backup availability](https://supabase.com/pricing)
- [Supabase Realtime limits](https://supabase.com/docs/guides/realtime/limits)
- [Supabase Realtime message accounting](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages)
- [Supabase Realtime authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Supabase self-hosting](https://supabase.com/docs/guides/self-hosting)
- [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/)
