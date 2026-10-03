// Jay's painted Sanctuary map (sanctuary/painted/sanctuary_map_points.json, a 1536×1024 image).
// Every point is a fraction of the map image (0–1), so all screens agree on where things are.
const SRC = { w: 1536, h: 1024 };
const at = ([x, y]: [number, number]) => ({ x: x / SRC.w, y: y / SRC.h });

export const MAP = {
  image: `${import.meta.env.BASE_URL}art/sanctuary/sanctuary_map.webp`,
  aspect: SRC.w / SRC.h,
  /** Lamp orbs in the fixed lighting order (1 = back centre, then clockwise). */
  lamps: ([[632, 80], [1043, 176], [1177, 280], [1218, 460], [1110, 625], [874, 703], [595, 675], [396, 572], [302, 425], [337, 264], [460, 133], [857, 134]] as [number, number][]).map(at),
  beacon: at([760, 478]),
  gate: at([988, 205]),
  crystals: { spark: at([690, 268]), wildcard: at([1025, 392]), radiance: at([482, 484]), fracture: at([835, 655]) },
  /** Solid footprints (ovals at each object's base) — characters walk around them. Source px: centre + radii. */
  obstacles: ([
    ...([[632, 80], [1043, 176], [1177, 280], [1218, 460], [1110, 625], [874, 703], [595, 675], [396, 572], [302, 425], [337, 264], [460, 133], [857, 134]] as [number, number][])
      .map(([x, y]) => ['lamp', x, y + 62, 20, 11] as const),
    ['crystal', 690, 268, 46, 26], ['crystal', 1025, 392, 44, 25], ['crystal', 482, 484, 46, 26], ['crystal', 835, 655, 44, 25],
    ['beacon', 760, 478, 78, 44],
    ['column', 545, 268, 32, 18], ['column', 1093, 535, 40, 22], ['column', 241, 372, 30, 18],
    ['gate', 878, 160, 26, 14], ['gate', 1105, 228, 26, 14],
  ] as const).map(([kind, x, y, rx, ry]) => ({ kind, x: x / SRC.w, y: y / SRC.h, rx: rx / SRC.w, ry: ry / SRC.h })),
  /** Walkable floor: the plaza inside its rim. */
  floor: { cx: 757 / SRC.w, cy: 486 / SRC.h, rx: 532 / SRC.w, ry: 338 / SRC.h },
};
