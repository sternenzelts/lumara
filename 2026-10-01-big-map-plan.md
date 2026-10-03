# Big Painted Sanctuary Map + Following Camera — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fit-to-screen Blender plaza with Jay's painted map shown at 2× zoom, a camera that follows your character, lamps lit in code, gathering at shared moments, and a minimap.

**Architecture:** Map geometry lives in one data file (points in map-fraction coordinates 0–1). Pure helpers (`logic/mapWorld.ts`) clamp walking to the floor ellipse, compute the camera offset, and give each stage its gathering point. `Scene` renders a "world" layer (map image + lamp glows + characters) translated by the camera; positions are shared in map fractions, so laptops and phones agree. A `Minimap` component reads the same data.

**Tech Stack:** React 19 + TS + Vite, vitest/jsdom, CSS files per component.

**Spec:** `Downloads/gacha-art/2026-09-30-voyage-redesign-design.md` §9 (+ §5 walking note)

## Global Constraints
- Code in `C:\Users\hp\Downloads\gacha-art\interface`; not a git repo — every task ends with `npx vitest run` + `npx tsc --noEmit -p .` green.
- Zoom 2×: the map is drawn at **2 × viewport width** (height follows the 3:2 image); on portrait screens at **2 × viewport height**.
- Map source: `sanctuary/painted/sanctuary_map_2x.webp` (3072×2048) → `public/art/sanctuary/sanctuary_map.webp`; points from `sanctuary/painted/sanctuary_map_points.json` (source pixels of a 1536×1024 image).
- Lamps light in the fixed order of `points.lamps` (1–12); lit count = fulfilled vows (max 12).
- Game UI style, reduced-motion respected (no camera easing/glow pulses when reduced).
- Walking allowed in every Sanctuary stage (lobby excluded); gathering on stage change per §9.

## Review Focus
1. Phone portrait: camera must still clamp inside the map (map height 2× viewport) — test in Task 2.
2. A peer's position from a laptop must land on the same map spot on a phone (positions are map fractions) — test in Task 3.
3. Click-to-walk on a panned camera must convert screen → map correctly (not viewport %) — test in Task 3.
4. Stage change while someone is mid-walk: gathering must override, then free movement resumes — test in Task 4.
5. 13th+ fulfilled vow must not crash lamp rendering (cap at 12) — test in Task 3.

---

### Task 1: Map data + floor clamp

**Files:** Create `src/data/sanctuaryMap.ts`, `src/logic/mapWorld.ts`, `src/logic/mapWorld.test.ts`; copy the map webp.

**Produces:**
```ts
// data/sanctuaryMap.ts — fractions of the map image (x/1536, y/1024 from the points JSON)
export const MAP = { image: string; aspect: 1.5; lamps: {x:number;y:number}[]; beacon:{x,y}; gate:{x,y};
  crystals: Record<'radiance'|'fracture'|'spark'|'wildcard', {x,y}>; floor: { cx, cy, rx, ry } };
// logic/mapWorld.ts
export function clampToFloor(x: number, y: number): { x: number; y: number }          // map fractions
```
- [ ] Test: centre point unchanged; a point in the clouds (0.02, 0.5) is pulled onto the floor edge; result always satisfies the ellipse.
- [ ] Run → FAIL (module missing). Implement (same ellipse maths as `logic/plaza.ts`, in map fractions). Run → PASS.

### Task 2: Camera maths

**Files:** `src/logic/mapWorld.ts` (+ tests).

**Produces:**
```ts
export function mapSize(vw: number, vh: number): { w: number; h: number }   // 2× zoom, aspect 1.5; portrait → h = 2*vh
export function cameraOffset(focus: {x:number;y:number}, vw: number, vh: number): { x: number; y: number }
// px translation of the world so `focus` (map fraction) is centred, clamped so no edge of the map shows
```
- [ ] Tests: laptop 1280×720 → map 2560×1707; focus at map centre → offset centres it; focus at (0,0) → offset clamps to 0,0; focus at (1,1) → clamps to (vw-w, vh-h); portrait 375×812 → map h = 1624, clamps both ways.
- [ ] RED → implement → GREEN.

### Task 3: Scene world layer (map, lamps, characters, click-to-walk, shared positions)

**Files:** Modify `src/components/Scene.tsx`, `src/styles.css` (or new `components/world.css`), `src/components/Scene.test.tsx`.

- World = `<div class="world" style="width/height=mapSize; transform: translate(cameraOffset)">` containing the map `<img>`, 12 lamp glows (`.lamp-glow` at `MAP.lamps[i]`, `.lit` when `i < min(12, fulfilled)`), and characters positioned at `left: x*100%; top: y*100%` of the world.
- Sky + drifting cloud bands stay **behind** the world (screen-fixed).
- Own position is a map fraction; starts at a free spot near the beacon; keys move ±0.012 x / ±0.012 y; clamp with `clampToFloor`.
- Click/tap: `mapX = (clientX - worldRect.left) / worldRect.width` (same for y) → walk there.
- Presence carries map fractions (no conversion).
- Camera eases toward the own character (`transition: transform .45s ease-out`; none when reduced).
- Remove the old per-orientation `PLAZA` ellipse use from Scene (keep `plaza.ts` only if still referenced elsewhere; otherwise delete it with its test).
- [ ] Tests (jsdom; stub `getBoundingClientRect`): lamp glows = 12 with `lit` count = fulfilled capped at 12 (use 15 fulfilled vows); a peer presence `{x:.6,y:.4}` renders at `left:60%; top:40%`; click at the world's centre moves own character to ≈(0.5, 0.5) clamped; keys still move.
- [ ] RED → implement → GREEN; full suite green.

### Task 4: Gathering at shared moments

**Files:** `src/logic/mapWorld.ts` (+ tests), `src/components/Scene.tsx`, `src/screens.tsx` (pass `stage` to Scene).

**Produces:**
```ts
export function gatherPoint(stage: Stage): { x: number; y: number } | null
// opening_pull/rewards → plaza centre; vow_review/vote/hall → beacon (just in front of it); vow_altar → gate; fragment_drop/register/completed → null
export function gatherSpot(point, index: number, total: number): { x: number; y: number }  // spread party in an arc, clamped to floor
```
- Scene prop `stage?: Stage`; on change to a stage with a gather point, own character walks to `gatherSpot(point, myIndex, partySize)` (index = sorted user ids), camera follows; then free movement.
- [ ] Tests: gatherPoint per stage; spots for 5 players are distinct and all on the floor; Scene: changing `stage` from `fragment_drop` to `vote` moves own character to its beacon spot.
- [ ] RED → implement → GREEN.

### Task 5: Minimap

**Files:** Create `src/components/Minimap.tsx` (+ test), CSS; render inside Scene (top-left under Exit, voyage only).
- Small rounded panel: the map image scaled down (or an ellipse), dots: you (gold), teammates (white), crystals (their colours), beacon (blue); lit lamps shown as tiny gold ticks.
- [ ] Test: renders one `.you` dot at own fraction and N `.mate` dots.
- [ ] RED → implement → GREEN.

### Task 6: Browser verification
- [ ] Laptop 1280×720 and phone 375×812: map fills screen, camera follows WASD, clamps at edges, click-to-walk lands where clicked, lamps lit = fulfilled vows, clouds drift behind.
- [ ] Two tabs (`?player=ana`): each sees the other at the same map spot; Warden Next → both glide to the beacon.
- [ ] Minimap dots move; reduced-motion: no easing.
- [ ] Reset viewport; screenshot for Jay.
