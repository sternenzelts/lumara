# Lumara world map

This is an ordinary extension of the existing game interface, implemented by `src/screens/WorldMap.tsx` and `src/screens/world-map.css`. The surface contract is `.impeccable/surfaces/world-map.md`; the supplied content and composition are specified by `docs/CODEX-MAP-BRIEF.md`.

## Entry and architecture

From the Sanctuary, choose **Explore world map**, or open `#map` directly. `src/App.tsx` mounts it outside the regular sidebar shell, passes the existing Backend subscription, and routes Back to `#sanctuary`. Nation buttons open a framed detail dialog with the supplied regional scene, element, inspiration, beacon progress, and companions. Companion buttons navigate to `#collection/<id>`; collection details provide a Return to world map action.

`src/data/world.ts` imports `src/data/map-regions.json` at build time and derives `WORLD`, `NATIONS`, and ordered `BEACONS`. This bundled JSON is the runtime canonical source for image-relative label and beacon coordinates, colors, companion assignments, and `beaconOrder`. `public/art/world/map-regions.json` preserves the supplied matching copy alongside the assets; the screen does not fetch it at runtime. Keep both copies synchronized when making an authorized data update.

`mapGeometry` computes a cover canvas using the painting's 1672:941 aspect ratio. The image and all percentage-positioned labels and beacons share that canvas, so resizing, clamped pointer dragging, and the brief ignition zoom move them together. `ResizeObserver` updates the geometry. Recenter returns to the centered cover composition.

## Progress and local preview

The screen accepts only `mode` and `watchVows` from Backend. It subscribes on mount and unsubscribes on cleanup. The lit count is the number of vows with `status === 'fulfilled'`, capped at twelve; beacon index *i* is lit when *i* is below that count. Aurelis remains lit independently of the twelve outer beacons.

Existing counts load quietly. A later increase illuminates the ordered beacons, celebrates the newest count with rays and a gentle camera approach, and changes Seren to her proud portrait. Three lit beacons mark an outer nation Restored; twelve trigger the all-beacons message. A batch increase celebrates the last newly lit beacon rather than queuing every intermediate ignition. Decreases update the display without a celebration. A synchronous subscription failure exposes Retry progress.

Only `backend.mode === 'local'` shows Light next beacon. This adds a component-local preview offset to the subscribed count. Reset removes the offset, and leaving or refreshing the screen clears it. **The preview does not create, fulfill, or mutate saved team vows.** The map has no Backend mutation methods. Only optional UI preferences are stored by this screen.

## Visual inheritance and content

The map preserves the incumbent Marcellus headings and nation names, Manrope controls and copy, pale icy surfaces, slate ink, and fine muted-gold frames. Its scoped painting overlays add the contrast needed for labels over snow and sea. These surface styles do not replace the global palette or typography. `DESIGN.md` and `.impeccable/design.json` remain unchanged.

The required nation colors pass from the JSON into the local `--nation` property for labels, glows, beacon light, and detail accents:

| Nation | Element | Supplied color | Companions |
| --- | --- | --- | --- |
| Aurelis | Light | `#F2C96B` | Seren, Wren |
| Zaryeva | Ice | `#9CD4FF` | Ayaka, Mahesvara |
| Hoshimura | Lightning | `#C9A2FF` | Keira, Kairo |
| Lianzhou | Earth | `#6FD3A2` | Suvara, Ashvane, Dax |
| Belcourt | Water | `#7C9BFF` | Sollene, Calla, Rook, Azrenth |

Older roster and asset-availability descriptions in the global design/product documents are stale. This scoped document records the map's supplied assignments without repairing those documents or redefining the global system.

## Motion, audio, and access

Effects use bounded CSS elements: four clouds, eight water highlights, twenty motes including five square glints, seven petals, four canal lights, and fixed nation ambience. There is no growing particle pool or canvas render loop. Twelve beacon halos pulse with staggered delays; one temporary ignition burst represents the newest increase.

Pause motion persists as `lumara.motionPaused`; the system's `prefers-reduced-motion` also produces a static map. Both retain beacon state, content, and navigation while disabling camera transitions and animated ambience. Hidden tabs pause CSS animations and stop current audio. Audio also stops on mute and unmount.

Seren starts muted unless `lumara.voiceEnabled` was previously enabled. Unmute enables the supplied Japanese `seren_vo_vow_fulfilled.mp3` or `seren_vo_beacon_all_12.mp3` on a subsequent increase, after user interaction and only while the page is visible. Browser playback rejection is tolerated. Voice and motion preferences are independent; the written guide remains available without sound.

Nation labels support hover and keyboard focus feedback. Enter activates their native buttons; the dialog moves focus to Close, traps Tab within its controls, closes with Escape or the backdrop, and restores the opener's focus. Beacon states and progress have accessible text, with live progress and guide announcements. Missing character artwork uses the shared `Art` fallback; a failed map image reports the problem while leaving navigation available.

## Responsive layout

The map fills the viewport with edge HUD controls. At 1050px and below, HUD spacing and the right detail panel tighten. At 680px and below, five persistent nation shortcuts allow access to cropped portions of the cover canvas, the guide and controls become compact, and details become a scrollable bottom sheet capped at 76dvh. The guide hides while that sheet is open. Pointer dragging remains clamped to avoid exposing blank canvas edges. Optional pinch zoom and mouse parallax are outside this implementation.

## Supplied assets and verification

`public/art/world/source.md` records provenance for the unchanged map and five region images, supplied character cutouts/splash portraits, Seren's chibi/proud portrait, and the two Japanese voice clips. Animation is drawn in code over the painting. The source and public map share SHA-256 `84983ADE5227B3D850099F42D7695013FC69EFEB8CE5D3050050725DD9D64CBA`; source, bundled, and public region JSON also match byte for byte. Asset URLs use `import.meta.env.BASE_URL` for relative static hosting.

Run from the game project root (or the staged `interface` directory):

```sh
npm run dev
npm run test -- src/screens/WorldMap.test.tsx
npm run test
npm run build
```

The focused tests cover 1440×900, 1024×768, and 375×812 cover geometry and pan limits, twelve unique ordered beacons, companion resolution, quiet initial progress, live updates and restoration, collection callbacks, dialog focus/Escape, local preview reset, subscription cleanup, and reduced motion. The build runs TypeScript, Vite, and `scripts/check-build.mjs` static checks.

The browser review record at `../.impeccable/review/world-map/verification.json` lists checks at 1440px, 1024px, and 375px with no page errors: overflow, image loading, nation panels, Escape, collection deep links, twelve-beacon cap, preview reset, cross-tab Backend vow updates, quiet refresh restoration, and Pause motion. Screenshots accompany that record. This is functional and visual evidence, not a measured 60fps performance guarantee.

The screen consumes the existing Backend contract; production adapter integration, authentication, game economy, and deployment remain separate concerns. The supplied JSON describes coordinates as approximate; the implementation preserves those coordinates rather than silently relocating artwork landmarks.
