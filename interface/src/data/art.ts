const path = (id: string, filename: string) => `${import.meta.env.BASE_URL}art/${id}/${filename}`;
export const ART = {
  dax: { splash: path('dax', 'dax_splash_v1.webp'), cutout: path('dax', 'dax_cutout.webp'), walk: path('dax', 'dax_chibi_walk.webp'), walkFrames: 4 },
  kairo: { splash: path('kairo', 'kairo_splash_v1.webp'), cutout: path('kairo', 'kairo_cutout.webp'), walk: path('kairo', 'kairo_chibi_walk.webp'), walkFrames: 4 },
  calla: { splash: path('calla', 'calla_splash_v1.webp'), cutout: path('calla', 'calla_cutout.webp'), walk: path('calla', 'calla_chibi_walk.webp'), walkFrames: 4 },
  rook: { splash: path('rook', 'rook_splash_v1.webp'), cutout: path('rook', 'rook_cutout.webp'), walk: path('rook', 'rook_chibi_walk.webp'), walkFrames: 4 },
  wren: { splash: path('wren', 'wren_splash_v1.webp'), cutout: path('wren', 'wren_cutout.webp'), walk: path('wren', 'wren_chibi_walk.webp'), walkFrames: 4 },
  azrenth: { splash: path('azrenth', 'azrenth_splash_v2.webp'), cutout: path('azrenth', 'azrenth_cutout.webp'), walk: path('azrenth', 'azrenth_chibi_walk.webp'), walkFrames: 4 },
  lucien: { splash: path('lucien', 'lucien_splash_v1.webp'), cutout: path('lucien', 'lucien_cutout.webp'), walk: path('lucien', 'lucien_chibi_walk.webp'), walkFrames: 4 },
  mahesvara: { splash: path('mahesvara', 'mahesvara_mirror_splash_v2.webp'), cutout: path('mahesvara', 'mahesvara_cutout.webp'), walk: path('mahesvara', 'mahesvara_chibi_walk.webp'), walkFrames: 4, extra: [{ label: 'True form — destroy & restore', src: path('mahesvara', 'mahesvara_awakened_splash_v2.webp') }] },
  keira: { splash: path('keira', 'keira_splash_v3.webp'), cutout: path('keira', 'keira_cutout.webp'), float: path('keira', 'keira_float.webp') },
  ayaka: { cutout: path('ayaka', 'ayaka_cutout.webp'), splash: path('ayaka', 'ayaka_timestop_splash_v2.webp'), extra: [{ label: 'A moment of rest — ice throne', src: path('ayaka', 'ayaka_splash_v1.webp') }], walk: path('ayaka', 'ayaka_chibi_walk_v2.webp'), walkFrames: 4 },
  seren: { splash: path('seren', 'seren_splash_v3.webp'), cutout: path('seren', 'seren_cutout_v2.webp'), walk: path('seren', 'seren_chibi_walk.webp'), walkFrames: 4 },
  ashvane: { splash: path('ashvane', 'ashvane_splash_v2.webp'), cutout: path('ashvane', 'ashvane_cutout_v2.webp'), walk: path('ashvane', 'ashvane_chibi_walk.webp'), walkFrames: 4 },
  suvara: { splash: path('suvara', 'suvara_splash_v3.webp'), cutout: path('suvara', 'suvara_cutout_v2.webp'), walk: path('suvara', 'suvara_chibi_walk_v5.webp'), walkFrames: 4 },
  sollene: { splash: path('sollene', 'sollene_splash_v1.webp'), cutout: path('sollene', 'sollene_cutout.webp'), walk: path('sollene', 'sollene_chibi_walk.webp'), walkFrames: 4 },
};
export const SANCTUARY_BACKGROUND = path('seren', 'seren_splash_v2.webp');
// Seamlessly tiling cloud strips that drift behind (far) and in front of (near) the plaza.
export const SANCTUARY_CLOUDS = { far: path('sanctuary', 'clouds_far.webp'), near: path('sanctuary', 'clouds_near.webp') };
