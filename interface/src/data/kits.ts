// Cosmetic skill kits for the Sanctuary (spec §10). Skills never change votes, stages or data.
import type { FieldKind } from '../logic/fieldEffects';
const artOf = (id: string) => (file: string) => `${import.meta.env.BASE_URL}art/${id}/${file}`;
const art = artOf('mahesvara');
const kArt = artOf('keira');
const zArt = artOf('azrenth');
const yArt = artOf('ayaka');
const sArt = artOf('suvara');
const aArt = artOf('ashvane');
const lArt = artOf('lucien');
const eArt = artOf('seren');

export type SkillEffect = 'disassemble' | 'nullify' | 'transform' | 'ultimate' | 'blink' | 'slash' | 'ruin' | 'blacksun' | 'field' | 'crescent' | 'lunge' | 'blossom';
export interface Skill {
  id: string; key: '1' | '2' | '3' | '4'; name: string; description: string;
  /** Only castable while in true form. */
  requiresTrueForm?: boolean;
  /** Milliseconds, or 'voyage' = once per voyage. */
  cooldownMs: number | 'voyage';
  icon: string; pose: number; effect: SkillEffect; voice: string; sfx?: string; durationMs: number;
  /** Field skill (Ayaka): an effect placed on the map for ms, which can slow / stun / freeze other players. */
  field?: { kind: FieldKind; ms: number };
  /** Pose appears this long after the cast (default 0). */ poseAtMs?: number;
  /** Effect waits this long so it lands on the skill name in the voice line (default 0). */ syncMs?: number;
  /** Can be cast while frozen by Chrono Stasis, and cuts it short for everyone (Azrenth's Sever). */ counters?: 'stasis';
  /** Pose index in trueFormPoses when cast in true/combined form (default: hover). */
  truePose?: number;
  /** Painted VFX sheets (one row each, 384×256 cells): muzzle 4, bullet 4 (loop), impact 8. */
  vfx?: { muzzle?: string; bullet?: string; impact?: string; burst?: string; slash?: string; blast?: string; ruin?: string; blacksun?: string; summon?: string; sever?: string; rift?: string; dome?: string; spires?: string; prison?: string; mist?: string; throne?: string; clock?: string; crescent?: string; lanterns?: string; yulan?: string; wings?: string; fang?: string; blossom?: string; slam?: string; wall?: string; aegis?: string; thunder?: string; halo?: string; pillar?: string };
}
export interface Kit {
  skills: Skill[];
  /** S++ body aura colour (flames + glow around the character). */ bodyAura?: string;
  /** Painted 8-frame aura loop (one row, 320 px cells). */ bodyAuraSheet?: string;
  aura?: string; poses?: string; trueForm?: string; trueFormPoses?: string; revertVoice?: string;
  /** Base form floats using poses[hoverPose] instead of walking. */ floats?: boolean; hoverPose?: number;
  /** Pose shown after standing still 8 s (default 3); null = none. */ idlePose?: number | null;
  /** Companion that follows the character in base form (4 cells: hover, attack, guard, combine). */ companion?: string;
  /** Colour theme of the ultimate overlay. */ theme?: 'blue' | 'pink' | 'crimson';
  /** Full-screen cinematic for the ultimate instead of the shared rings/dust. */ ultCinematic?: { kind: 'sever' | 'stasis' | 'soar' | 'skyfall' | 'thunder' | 'dawn' };
  /** Pose sheet cell shape when not the default 256×360 (aspect w/h, width % of the character box). */ poseCell?: { aspect: number; width: number; frames?: number };
  /** Frames in bodyAuraSheet (default 8). */ bodyAuraFrames?: number;
  /** Summoned weapon that hovers beside him while 'transformed' — no form change (he keeps walking). */ weapon?: string;
  /** True/combined-form drawing size, % of the character box (default 400). */ trueSize?: number; /** % from the bottom of the character box (default 26). */ trueBottom?: number;
  /** Ultimate choreography: 'dive' = fly up, dive sword-first, then the blast on landing. */ ultMove?: 'dive';
  /** Frames in trueFormPoses (default 4) and the pose shown after standing still in true form. */ trueFrames?: number; trueIdlePose?: number;
}

export const KITS: Record<string, Kit> = {
  mahesvara: {
    trueSize: 300, trueBottom: 22,   // white form: smaller, still flying
    bodyAura: '#5fb6ff',
    bodyAuraSheet: art('mahesvara_body_aura.webp'),
    aura: art('mahesvara_aura.webp'),                   // brightness-as-alpha sigil, sits under him
    poses: art('mahesvara_chibi_poses.webp'),          // 4 cells: aim, nullify, power, idle
    trueForm: art('mahesvara_chibi_trueform.webp'),
    trueFormPoses: art('mahesvara_trueform_poses.webp'),
    revertVoice: art('vo_sig_restore.mp3'),               // 「…戻れ。」 when the true form ends
    skills: [
      { id: 'disassemble', key: '1', name: 'Disassemble', description: 'Fires a crystal round the way he faces — where it lands breaks into blue mist, then rewinds into form.', cooldownMs: 10000, icon: art('mahesvara_skill_disassemble.webp'), pose: 0, truePose: 1, effect: 'disassemble', voice: art('vo_sig_destroy.mp3'), sfx: art('sfx_destroy.mp3'), durationMs: 1400,
        vfx: { muzzle: art('mahesvara_vfx_muzzle.webp'), bullet: art('mahesvara_vfx_bullet.webp'), impact: art('mahesvara_vfx_impact.webp') } },
      { id: 'nullify', key: '2', name: 'Nullify', description: 'A cracked-glass barrier flashes up and a ring of runes shatters into nothing.', cooldownMs: 15000, icon: art('mahesvara_skill_nullify.webp'), pose: 1, truePose: 2, effect: 'nullify', voice: art('vo_nullify.mp3'), durationMs: 1600 },
      { id: 'change-form', key: '3', name: 'Change Form', description: 'Reveals his true form and takes flight on crystal wings — press again to return to his base form.', cooldownMs: 1000, icon: art('mahesvara_skill_ultimate.webp'), pose: 2, effect: 'transform', voice: art('vo_transform.mp3'), sfx: art('sfx_restore.mp3'), durationMs: 0 },
      { id: 'return-to-dust', key: '4', name: 'Return to Dust', description: 'Ultimate — the whole plaza breaks into dust, then is restored in a flash of light. True form only.', cooldownMs: 90000, requiresTrueForm: true, icon: art('mahesvara_skill_return_to_dust.webp'), pose: 1, effect: 'ultimate', voice: art('vo_ultimate.mp3'), sfx: art('sfx_destroy.mp3'), durationMs: 3600 },
    ],
  },
  keira: {
    theme: 'pink',
    trueSize: 210, trueBottom: 4,
    ultMove: 'dive',
    trueFrames: 6, trueIdlePose: 4,   // + frame 5: ultimate plunge
    floats: true, hoverPose: 0, idlePose: null,
    poses: kArt('keira_chibi_base_poses.webp'),          // base form, 4 cells 256×360: hover, blink, slash, combine
    trueForm: kArt('keira_combined_poses.webp'),
    trueFormPoses: kArt('keira_combined_poses.webp'),     // combined form, 6 cells 700×700: hover, blink, slash, raise, idle, plunge
    companion: kArt('keira_mech_poses.webp'),
    bodyAura: '#ff86c8',
    bodyAuraSheet: kArt('keira_sakura_aura.webp'),
    revertVoice: kArt('vo_glitch.mp3'),
    skills: [
      { id: 'pixel-blink', key: '1', name: 'Pixel Blink', description: 'Glitches out and pops back in a short hop toward where you point.', cooldownMs: 8000, icon: kArt('keira_skill_pixel_blink.webp'), pose: 1, truePose: 1, effect: 'blink', voice: kArt('vo_skill_1.mp3'), durationMs: 1200, vfx: { burst: kArt('keira_vfx_blink.webp') } },
      { id: 'blaze-code', key: '2', name: 'Blaze Code', description: 'A wide pink flame-sword slash toward where you point — her guardian punches along.', cooldownMs: 10000, icon: kArt('keira_skill_blaze_code.webp'), pose: 2, truePose: 2, effect: 'slash', voice: kArt('vo_skill_2.mp3'), sfx: kArt('sfx_slam.mp3'), durationMs: 1200, vfx: { slash: kArt('keira_vfx_slash.webp') } },
      { id: 'combine', key: '3', name: 'Combine', description: 'Her guardian breaks into plates and fuses onto her as armour — press again to separate.', cooldownMs: 1000, icon: kArt('keira_skill_combine.webp'), pose: 3, effect: 'transform', voice: kArt('vo_sig_full.mp3'), sfx: kArt('sfx_summon.mp3'), durationMs: 0 },
      { id: 'guardian-protocol', key: '4', name: 'Guardian Protocol', description: 'Ultimate — all systems unlocked: a huge pink blast tears across the plaza. Combined only.', cooldownMs: 90000, requiresTrueForm: true, icon: kArt('keira_skill_guardian_protocol.webp'), pose: 3, truePose: 3, effect: 'ultimate', voice: kArt('vo_ultimate.mp3'), sfx: kArt('sfx_slam.mp3'), durationMs: 5600, vfx: { blast: kArt('keira_vfx_blast.webp') } },
    ],
  },
  azrenth: {
    theme: 'crimson',
    ultCinematic: { kind: 'sever' },
    poses: zArt('azrenth_poses.webp'),                    // 4 cells 320×360: ruin, black sun, summon, sever
    poseCell: { aspect: 320 / 360, width: 178 },          // real cell shape (was squeezed into 256×360) + walk-sized
    weapon: zArt('azrenth_sword.webp'),
    bodyAura: '#ff3348',
    bodyAuraSheet: zArt('azrenth_aura.webp'),
    revertVoice: zArt('vo_sig_short.mp3'),
    skills: [
      { id: 'eyes-of-ruin', key: '1', name: 'Eyes of Ruin', description: 'His gaze erases what it falls on — the ground where you point cracks and crumbles to ash.', cooldownMs: 8000, icon: zArt('azrenth_skill_eyes_of_ruin.webp'), pose: 0, effect: 'ruin', voice: zArt('voice/skill_1.mp3'), sfx: zArt('sfx_shatter.mp3'), durationMs: 1300, vfx: { ruin: zArt('azrenth_vfx_ruin.webp') } },
      { id: 'black-sun', key: '2', name: 'Black Sun', description: 'A black-flame sun forms in his palm and is hurled where you point — black fire explodes.', cooldownMs: 10000, icon: zArt('azrenth_skill_black_sun.webp'), pose: 1, effect: 'blacksun', voice: zArt('voice/skill_2.mp3'), durationMs: 1300, vfx: { blacksun: zArt('azrenth_vfx_blacksun.webp') } },
      { id: 'summon-venuzdonoa', key: '3', name: 'Summon Venuzdonoa', description: 'The ground tears open and the reason-destroying sword rises from the shadow to hover at his side — press again to send it back.', cooldownMs: 1000, icon: zArt('azrenth_skill_summon.webp'), pose: 2, effect: 'transform', voice: zArt('vo_reveal_2.mp3'), sfx: zArt('sfx_shatter.mp3'), durationMs: 0, vfx: { summon: zArt('azrenth_vfx_summon.webp'), rift: zArt('azrenth_vfx_rift.webp') } },
      { id: 'venuzdonoa-sever', key: '4', name: 'Venuzdonoa: Sever', description: 'Ultimate — the golden threads of fate appear across the world, and one slash severs them all. Sword summoned only. Cuts through stopped time.', cooldownMs: 90000, requiresTrueForm: true, counters: 'stasis', icon: zArt('azrenth_skill_sever.webp'), pose: 3, effect: 'ultimate', voice: zArt('vo_sig_short.mp3'), sfx: zArt('sfx_slash.mp3'), durationMs: 3600, vfx: { sever: zArt('azrenth_vfx_sever.webp') } },
    ],
  },
  ayaka: {
    ultCinematic: { kind: 'stasis' },
    poses: yArt('ayaka_poses.webp'),                     // 4 cells 400×400: dome cast, point, throne, stop time
    poseCell: { aspect: 1, width: 197 },                // cast pose ≈ walk size (no jump when casting)
    idlePose: 2,                                         // standing still 8 s: she lounges on her ice throne
    bodyAura: '#bfefff',
    bodyAuraSheet: yArt('ayaka_aura.webp'),               // snow drifting in a spiral, 16 blended frames
    bodyAuraFrames: 16,
    skills: [
      { id: 'deceleration-zone', key: '1', name: 'Deceleration Zone', description: 'A pale-aqua dome spreads around her for 4 s — anyone inside moves at half speed, trailing afterimages.', cooldownMs: 12000, icon: yArt('ayaka_skill_deceleration.webp'), pose: 0, effect: 'field', field: { kind: 'decel', ms: 4000 }, voice: yArt('vo_skill_deceleration.mp3'), durationMs: 900, vfx: { dome: yArt('ayaka_vfx_dome.webp') } },
      { id: 'frost-cadenza', key: '2', name: 'Frost Cadenza', description: 'Point at a player — ice spires race to them in rhythm and lock them in ice for 1 s.', cooldownMs: 8000, icon: yArt('ayaka_skill_frost_cadenza.webp'), pose: 1, effect: 'field', field: { kind: 'cadenza', ms: 2000 }, voice: yArt('vo_skill_frost_cadenza.mp3'), durationMs: 800, vfx: { spires: yArt('ayaka_vfx_spires.webp'), prison: yArt('ayaka_vfx_prison.webp') } },
      { id: 'niflheim', key: '3', name: 'Niflheim', description: 'Her ice throne rises beneath her and freezing mist rolls out — the ground frosts over and snow swirls.', cooldownMs: 15000, icon: yArt('ayaka_skill_niflheim.webp'), pose: 2, poseAtMs: 450, effect: 'field', field: { kind: 'niflheim', ms: 3800 }, voice: yArt('vo_skill_niflheim.mp3'), durationMs: 3200, vfx: { throne: yArt('ayaka_throne.webp'), mist: yArt('ayaka_vfx_mist.webp') } },
      { id: 'chrono-stasis', key: '4', name: 'Chrono Stasis', description: 'Ultimate — a golden clock ticks once and time stops: everyone else freezes for 3 s while she alone moves.', cooldownMs: 90000, icon: yArt('ayaka_skill_chrono_stasis.webp'), pose: 3, effect: 'ultimate', field: { kind: 'stasis', ms: 5000 }, voice: yArt('vo_sig_chrono_stasis.mp3'), sfx: yArt('sfx_chrono_stasis.mp3'), durationMs: 1100, vfx: { clock: yArt('ayaka_vfx_clock.webp') } },
    ],
  },
  // S+ kit: two skills + a local ultimate on key 3, no body aura (S++ only).
  suvara: {
    ultCinematic: { kind: 'soar' },
    poses: sArt('suvara_poses.webp'),                    // 3 cells 400×400: slash, release lanterns, call out
    poseCell: { aspect: 1, width: 215, frames: 3 },
    idlePose: 1,                                          // standing still: hands raised to the sky
    skills: [
      { id: 'crescent-horizon', key: '1', name: 'Crescent Horizon', description: 'She draws her sword — a gold-and-teal crescent of light sweeps across the ground toward where you point.', cooldownMs: 8000, icon: sArt('suvara_skill_crescent_horizon.webp'), pose: 0, effect: 'crescent', voice: sArt('voice/skill_1.mp3'), durationMs: 1000, vfx: { crescent: sArt('suvara_vfx_crescent.webp') } },
      { id: 'lantern-ascent', key: '2', name: 'Lantern Ascent', description: 'Warm lanterns rise around her and drift into the sky — everyone nearby glows for 4 s.', cooldownMs: 12000, icon: sArt('suvara_skill_lantern_ascent.webp'), pose: 1, effect: 'field', field: { kind: 'lantern', ms: 4000 }, voice: sArt('voice/skill_2.mp3'), durationMs: 1200, vfx: { lanterns: sArt('suvara_vfx_lanterns.webp') } },
      { id: 'yulan-soar', key: '3', name: 'Yulan, Soar', description: 'Ultimate — her light dragon swoops down and carries her to where you point, landing in a burst of radiant wings.', cooldownMs: 60000, icon: sArt('suvara_skill_yulan.webp'), pose: 2, effect: 'ultimate', field: { kind: 'soar', ms: 2600 }, voice: sArt('voice/ultimate.mp3'), durationMs: 450, vfx: { yulan: sArt('suvara_yulan.webp'), wings: sArt('suvara_vfx_wings.webp') } },
    ],
  },
  ashvane: {
    ultCinematic: { kind: 'skyfall' },
    poses: aArt('ashvane_poses.webp'),                   // 3 cells 400×400: lunge, palm strike, leap
    poseCell: { aspect: 1, width: 215, frames: 3 },
    idlePose: null,
    skills: [
      { id: 'dragon-fang', key: '1', name: 'Dragon Fang', description: 'A spear lunge — he dashes a short hop toward where you point, leaving an amber streak.', cooldownMs: 8000, icon: aArt('ashvane_skill_dragon_fang.webp'), pose: 0, effect: 'lunge', voice: aArt('voice/skill_1.mp3'), durationMs: 700, vfx: { fang: aArt('ashvane_vfx_fang.webp') } },
      { id: 'falling-blossom', key: '2', name: 'Falling Blossom', description: 'An open-palm strike — a ring of autumn leaves and amber wind bursts out around him.', cooldownMs: 10000, icon: aArt('ashvane_skill_falling_blossom.webp'), pose: 1, effect: 'blossom', voice: aArt('voice/skill_2.mp3'), durationMs: 900, vfx: { blossom: aArt('ashvane_vfx_blossom.webp') } },
      { id: 'skyfall', key: '3', name: 'Skyfall', description: 'Ultimate — he leaps high and drives his spear down where you point: the ground cracks in a shockwave of leaves.', cooldownMs: 60000, icon: aArt('ashvane_skill_skyfall.webp'), pose: 2, effect: 'ultimate', field: { kind: 'skyfall', ms: 1900 }, voice: aArt('voice/skill_3.mp3'), durationMs: 900, vfx: { slam: aArt('ashvane_vfx_slam.webp') } },
    ],
  },
  lucien: {
    ultCinematic: { kind: 'thunder' },
    poses: lArt('lucien_poses.webp'),                    // 3 cells 400×400: raise wall, hand sign, call lightning
    poseCell: { aspect: 1, width: 215, frames: 3 },
    idlePose: null,
    skills: [
      { id: 'rampart-of-stone', key: '1', name: 'Rampart of Stone', description: 'A stone wall with violet runes rises where you point — nobody can walk through it for 4 s.', cooldownMs: 10000, icon: lArt('lucien_skill_rampart.webp'), pose: 0, effect: 'field', field: { kind: 'wall', ms: 4000 }, voice: lArt('voice/skill_1.mp3'), durationMs: 800, vfx: { wall: lArt('lucien_vfx_wall.webp') } },
      { id: 'lunar-aegis', key: '2', name: 'Lunar Aegis', description: 'A moon-shield sphere forms around him for 4 s — anyone inside can\'t be slowed or frozen in ice.', cooldownMs: 14000, icon: lArt('lucien_skill_lunar_aegis.webp'), pose: 1, effect: 'field', field: { kind: 'aegis', ms: 4000 }, voice: lArt('voice/skill_2.mp3'), durationMs: 900, vfx: { aegis: lArt('lucien_vfx_aegis.webp') } },
      { id: 'thunder-sovereign', key: '3', name: 'Thunder Sovereign', description: 'Ultimate — his body becomes lightning: he flashes to where you point and chain lightning strikes around him.', cooldownMs: 60000, icon: lArt('lucien_skill_thunder_sovereign.webp'), pose: 2, effect: 'ultimate', field: { kind: 'thunder', ms: 1500 }, voice: lArt('voice/ultimate.mp3'), durationMs: 380, vfx: { thunder: lArt('lucien_vfx_thunder.webp') } },
    ],
  },
  seren: {
    ultCinematic: { kind: 'dawn' },
    poses: eArt('seren_poses.webp'),                     // 3 cells 400×400: slash, guiding hand, sword raised
    poseCell: { aspect: 1, width: 215, frames: 3 },
    idlePose: null,
    skills: [
      { id: 'dawn-slash', key: '1', name: 'Dawn Slash', description: 'Her crystal sword cuts an arc of golden light toward where you point.', cooldownMs: 8000, icon: eArt('seren_skill_dawn_slash.webp'), pose: 0, effect: 'crescent', voice: eArt('voice/skill_1.mp3'), durationMs: 2300, syncMs: 1150, vfx: { crescent: eArt('seren_vfx_slash.webp') } },
      { id: 'guiding-light', key: '2', name: 'Guiding Light', description: 'Her halo spreads into a warm ring — everyone inside walks 30% faster for 4 s and can\'t be slowed.', cooldownMs: 12000, icon: eArt('seren_skill_guiding_light.webp'), pose: 1, effect: 'field', field: { kind: 'guide', ms: 4000 }, voice: eArt('voice/skill_2.mp3'), durationMs: 1000, vfx: { halo: eArt('seren_vfx_halo.webp') } },
      { id: 'dawnbreak', key: '3', name: 'Dawnbreak', description: 'Ultimate — she raises her sword and a pillar of sunrise erupts: the whole world is blinded white, then dawn returns.', cooldownMs: 60000, icon: eArt('seren_skill_dawnbreak.webp'), pose: 2, effect: 'ultimate', field: { kind: 'dawn', ms: 4600 }, voice: eArt('voice/ultimate.mp3'), durationMs: 3200, syncMs: 2350, vfx: { pillar: eArt('seren_vfx_pillar.webp') } },
    ],
  },
};
