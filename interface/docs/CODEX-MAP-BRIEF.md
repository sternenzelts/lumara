# Codex brief — Animated Lumara World Map (game screen)

**Owner:** Jay Diaz · **Date:** 2026-09-26
**Where:** the **game** project only (`C:\Users\hp\gacha-retro`), as a new screen reached from the Sanctuary.
**Do not change the overview website.** Read `CODEX-BRIEF.md` first — its contract and hard rules
(static build, no network, no `window.claude`, relative paths, size limits) still apply.

**This is a GAME screen, not a web page.** Full-screen painted map, HUD at the edges, ornate gold
frames. No sidebars, breadcrumbs, marketing headlines or card grids.

---

## 1. Assets

| File | Use |
|---|---|
| `world/lumara_map_v2.webp` (1672×941) | The map — one still image, **never redrawn** |
| `world/map-regions.json` | Nations, label positions, beacon positions (all in **% of the image**), colors, characters |
| `world/regions/aurelis_center.webp` · `zaryeva_north.webp` · `hoshimura_east.webp` · `lianzhou_south.webp` · `belcourt_west.webp` | Region close-up scenes (16:9) |
| `characters/<id>/<id>_cutout.webp` | Character portraits (crop to face) |
| `characters/seren/seren_chibi.webp`, `seren_face_*.webp`, `voice/ja/seren_vo_*.mp3` | Seren as guide |

Copy into `public/art/world/…` and `public/art/<character>/…`. Keep all positions data-driven from the JSON.

## 2. The world (content)

Lumara is a fantasy world in the style of Genshin Impact / Wuthering Waves. A cataclysm called **the
Dimming** put out the beacons. **Aurelis** (center) is the Sanctuary — always lit. Four nations surround it,
each inspired by a real culture (everyone is human):

| Nation | Direction | Inspired by | Element | Color | Characters |
|---|---|---|---|---|---|
| Aurelis (Sanctuary) | center | original | Light | `#F2C96B` | Seren, Wren |
| Zaryeva | north | Russia | Ice | `#9CD4FF` | Ayaka, Mahesvara |
| Hoshimura | east | Japan | Lightning | `#C9A2FF` | Keira, Kairo |
| Lianzhou | south | China | Earth | `#6FD3A2` | Suvara, Ashvane, Dax |
| Belcourt | west | France | Water | `#7C9BFF` | Sollene, Calla, Rook, Azrenth |

**12 beacons** = 3 per outer nation. Each fulfilled vow lights the next beacon in `beaconOrder`.

## 3. Map layout

- Map image fills the screen with `object-fit: cover`; a wrapper keeps the image's aspect ratio so
  everything placed in **% coordinates stays locked** to the art at any size.
- **HUD:** top-left back button + title "Lumara"; top-right "Beacons 5 / 12" counter;
  bottom-left Seren chibi + speech bubble.
- **Labels:** each nation's name at its (x, y), in a game font (e.g. Marcellus), with a small element
  icon and a thin line in the nation's color. Aurelis label slightly larger, gold, "The Sanctuary" beneath.
- **Beacons:** a marker at every beacon (x, y). **Dim** = small grey-blue ember. **Lit** = warm glow in
  the nation's color, soft pulsing halo, light rays.
- Pan/zoom: optional. If added, keep it gentle (mouse drag / pinch, clamped to the map).

## 4. Motion — all in code, the map image never changes

Layer effects **over** the still map (Canvas 2D or CSS/GSAP; pick one, keep it light):

1. **Drifting clouds** — 3–5 semi-transparent cloud sprites (soft white radial gradients or blurred
   ellipses) moving slowly left→right across the map, wrapping around. Slight opacity breathing.
2. **Water shimmer** — a subtle animated sparkle/noise band over ocean areas (a mask of the sea, or
   just a few twinkling highlights placed along the coasts).
3. **Beacon pulse** — lit beacons pulse (scale + glow) every ~3 s, offset so they don't sync.
4. **Nation ambience** (small, placed near each capital): Zaryeva — aurora shimmer (a soft green/violet
   gradient band waving at the top); Hoshimura — falling pink petals + an occasional faint lightning flash
   near the volcano; Lianzhou — drifting mist; Belcourt — gently glowing canal lights; Aurelis — the halo
   slowly brightening and dimming.
5. **Particles** — a few gold light motes and tiny glitch squares floating upward across the whole map.
6. **Parallax** — optional 1–2% tilt following the mouse (clouds/particles move a bit more than the map).

Target 60 fps on a mid-range laptop; cap particles (~60 max); pause animation when the tab is hidden.
`prefers-reduced-motion` or the game's "Pause motion" → no drifting/pulsing, static glows only.

## 5. Interactions

- **Hover / focus a nation** → its label brightens, the area gets a faint colored vignette, Seren's bubble
  shows a one-line description (e.g. "Zaryeva — a land of ice and aurora.").
- **Click / tap a nation** → a framed panel slides in (right side on laptop, bottom sheet on phone):
  - the region scene (`world/regions/*.webp`) as a banner,
  - name, "Inspired by…", element, color accent,
  - **beacons 2 / 3** for that nation,
  - character portraits from that nation (tap → that character's collection page).
- **Beacon lights up** (when a vow is fulfilled, e.g. via Vow Review): camera eases toward the beacon,
  the ember ignites with a burst of light rays and particles, the counter ticks up, Seren says
  `seren_vo_vow_fulfilled` with the proud face. If all 3 in a nation are lit: that nation's label turns
  fully bright ("Zaryeva restored"). All 12 → `seren_vo_beacon_all_12`.
- Keyboard: Tab through nations, Enter opens the panel, Esc closes.

## 6. Data

- Lit beacon count = number of fulfilled vows (capped at 12), read through the existing Backend
  (`watchVows`). Map beacon *i* is lit if its index in `beaconOrder` < lit count.
- Local demo: add a dev-only "Light next beacon" button (visible only when `backend.mode === 'local'`)
  to test the animation.

## 7. Done when

- [ ] Map fills the screen; labels and beacons stay exactly on the art at 1440 px, 1024 px and 375 px.
- [ ] Clouds, shimmer, beacon pulse, nation ambience and particles run smoothly; the map image is never altered.
- [ ] Hover/tap a nation → panel with scene, info, beacon progress, characters.
- [ ] Lighting a beacon plays the ignite animation + Seren line; nation "restored" state at 3/3.
- [ ] Reduced motion / Pause motion shows a static version.
- [ ] Looks like a gacha game world map screen, not a web page.
- [ ] `npm run build` passes its static checks.
