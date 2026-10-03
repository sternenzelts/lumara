# Mahesvara S++ Kit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (native) or subagent-driven-development. Checkbox steps.

**Goal:** Give Mahesvara a playable cosmetic kit in the Sanctuary: a left skill bar (Disassemble / Nullify / Return to Dust), skill poses + effects + voices that the whole party sees, an always-on S++ aura, idle pose, event reactions, and a ~30 s true-form transformation.

**Architecture:** Kit data per character (`data/kits.ts`: skills, keys, cooldowns, pose index, voice, effect id). Pure logic (`logic/skills.ts`): cooldown state, "can cast", once-per-voyage ultimate, idle timer. A `SkillBar` component (icons, keys, tooltip, cooldown sweep). `Scene` handles keys 1/2/3, shows the pose frame from `mahesvara_chibi_poses.webp`, plays the effect layer + voice, and broadcasts a new `skill` cue so teammates see/hear it on the caster's character. Effects are CSS/DOM (no new art) — mist/glitch particles, barrier hex, rune ring, screen dim, flashes. True form = **flying** figure (no walk frames, Jay 2026-10-01) using `mahesvara_chibi_trueform.webp`: hover bob, lean, void trail, distant shadow.

**Tech:** React 19 + TS, vitest/jsdom, CSS keyframes; audio via existing voice helpers (respect Seren-mute → generic voice mute).

**Spec:** `2026-09-30-voyage-redesign-design.md` §10.

## Global Constraints
- Cosmetic only — no effect on votes, stages or data.
- Keys 1/2/3 only while not typing (same rule as WASD); disabled in the lobby.
- Cooldowns: Disassemble 10 s, Nullify 15 s, Ultimate once per voyage (per session id); true form lasts 30 s.
- Reduced motion: no screen shake/dim pulses; effects become a short fade.
- Mute: voice lines obey the existing mute toggle.
- Assets already in `public/art/mahesvara/`: skill icons ×3, `mahesvara_chibi_poses.webp` (4 cells 256×360: aim, nullify, power, idle), `sfx_destroy.mp3`, `sfx_restore.mp3`, `vo_*.mp3`; voice files in `characters/mahesvara/voice/ja/` (copy needed ones).

## Review Focus
1. Pressing 1 while typing in the stage window must not cast — test in Task 3.
2. Ultimate must stay "used" after a page reload in the same voyage — test in Task 1.
3. A teammate's cast must render on *their* character, not yours — test in Task 4.
4. Casting while walking: pose shows briefly, then walking resumes (no stuck pose) — test in Task 3.
5. Characters without a kit show no skill bar and keys 1/2/3 do nothing — test in Task 2.

---

### Task 1: Kit data + skill logic
- Create `src/data/kits.ts` (`KITS: Record<string, Kit>`; `Kit = { skills: Skill[] }`, `Skill = { id, key: '1'|'2'|'3', name, description, cooldownMs | 'voyage', pose: number, voice: string, effect: 'disassemble'|'nullify'|'transform' }`).
- Create `src/logic/skills.ts`: `canCast(skill, state, now)`, `cast(skill, state, now, sessionId)` → new state, `cooldownLeft(skill, state, now)` (0–1 for the sweep), ultimate stored per session in localStorage (`lumara.ultimate.<sessionId>.<characterId>`).
- Tests: cooldown blocks re-cast until elapsed; ultimate once per session id and survives a "reload" (new state read from storage); other session id allows it again.

### Task 2: SkillBar component
- `src/components/SkillBar.tsx` + CSS: vertical stack left edge (below the minimap), ornate square icons, key badge, cooldown conic-gradient sweep, "Used" overlay, tooltip on hover/focus/long-press (name, description, cooldown text).
- Tests: renders 3 icons with keys for Mahesvara; none for Wren; clicking calls onCast; disabled + sweep while cooling; tooltip text present (role="tooltip" on focus).

### Task 3: Casting in Scene (own character)
- Keys 1/2/3 (not while typing) and SkillBar clicks → `cast`; own figure shows pose frame for 1.2 s (`.pose-sprite` with `--pose`), then returns to walk/idle; effect layer (`.skill-fx fx-<effect>`) at the character for its duration; voice + sfx play.
- Idle: no movement for 8 s → idle pose (pose 4), cleared on move.
- Tests: key 1 → pose 0 + `.fx-disassemble`; key 1 while focused in a textarea → nothing; pose clears after its duration even if walking started; cooldown prevents second cast; idle pose after 8 s fake timers.

### Task 4: Party sees it (cue)
- Add `'skill'` to `CueTopic`; on cast emit `{ sessionId?, userId, skill, at }`; Scene listens and plays pose + effect on that peer's figure (voice too, muted if muted).
- Tests: incoming cue for peer `ana` adds `.fx-nullify` on Ana's figure only.

### Task 5: Transformation (ultimate)
- Cast 3: power pose 0.8 s → screen dim + crystal flash → true form for 30 s (flying figure from `art.trueForm` = mahesvara_chibi_trueform.webp), stronger aura + void particles; walking still works (floats); ends with restore flash + `sig_restore` voice. Teammates see the same via cue.
- Tests: after cast, own figure has `.true-form`; after 30 s (fake timers) it reverts and plays restore; ultimate icon shows Used.

### Task 6: Aura + event reactions
- Aura for S++ companions (data flag): orbiting shards, coat mist while walking, magic circle.
- Reactions: Scene prop `lastVowEvent` (from RetroScreen when Warden marks a vow) → Restore flash + vow / vow_not_yet line on Mahesvara companions.
- Tests: aura present for Mahesvara not Wren; vow event triggers `.fx-restore` + voice call.

### Task 7: Browser verification + review
- Laptop + phone: icons, tooltips, each skill, cooldowns, transformation 30 s, two tabs see each other's casts; mute respected; reduced motion.
- Fresh-reviewer pass on the whole change.

All assets are in.
