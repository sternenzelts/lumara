import { useEffect, useRef, useState } from 'react';
import type { Backend, Me, Presence, Stage, Vow } from '../backend/types';
import { KITS } from '../data/kits';
import { VOICE_LINES } from '../data/voiceLines';
import { chatterDelayMs, chatterPool, eventLine, eventSpeaker, pickLine, skillLine, speakMs, voiceSrc, type RetroMoment } from '../logic/chatter';
import { readSerenMuted } from '../logic/voice';

interface SayCue { userId: string; characterId: string; lineId: string }
export interface Bubble { text: string; until: number; key: number }

function play(src: string) {
  if (readSerenMuted()) return;
  try { const a = new Audio(src); a.volume = 0.85; void a.play()?.catch(() => {}); } catch { /* no audio */ }
}

/**
 * Characters talk on the plaza (everyone sees and hears every character):
 * random lines now and then, a line when clicked, one party member reacting to retro moments, and a bubble
 * for every skill call. Each tab only speaks for its own character (clicks speak for the clicked one), so a
 * line is never doubled; lines go out as a 'say' cue that every tab — the sender's too — shows and plays.
 */
export function useChatter({ backend, me, characterId, peers, enabled, stage, vows, sessionId }: { backend: Backend; me: Me; characterId: string | null; peers: Record<string, Presence>; enabled: boolean; stage?: Stage; vows: Vow[]; sessionId: string }) {
  const [bubbles, setBubbles] = useState<Record<string, Bubble>>({});
  const speakingUntil = useRef(0);   // someone on the plaza is talking until then (random chatter waits)
  const recent = useRef<string[]>([]);
  const party = () => {
    const others = Object.entries(peersRef.current).filter(([, p]) => p.characterId);
    return { ids: [...(characterId ? [me.id] : []), ...others.map(([id]) => id)], present: others.map(([, p]) => p.characterId as string) };
  };
  const peersRef = useRef(peers); peersRef.current = peers;

  const bubble = (userId: string, text: string) => {
    const ms = speakMs(text), t = Date.now();
    speakingUntil.current = Math.max(speakingUntil.current, t + ms);
    setBubbles(b => ({ ...b, [userId]: { text, until: t + ms, key: t } }));
  };
  // every tab shows + plays every line
  useEffect(() => backend.on('say', data => {
    const c = data as SayCue; const line = VOICE_LINES[c.characterId]?.find(l => l.id === c.lineId); if (!line) return;
    play(voiceSrc(c.characterId, line.id)); bubble(c.userId, line.text);
  }), [backend]);
  // skill calls: the voice already plays (useSkills); add the bubble
  useEffect(() => backend.on('skill', data => {
    const c = data as { userId: string; characterId: string; skillId: string };
    const skill = KITS[c.characterId]?.skills.find(s => s.id === c.skillId); const line = skill && skillLine(c.characterId, skill.voice);
    if (line) bubble(c.userId, line.text);
  }), [backend]);
  useEffect(() => { const t = setInterval(() => setBubbles(b => { const now = Date.now(); return Object.values(b).some(x => x.until <= now) ? Object.fromEntries(Object.entries(b).filter(([, x]) => x.until > now)) : b; }), 500); return () => clearInterval(t); }, []);

  const say = (userId: string, charId: string, lineId: string) => backend.emit('say', { userId, characterId: charId, lineId } satisfies SayCue);
  const sayRandom = (userId: string, charId: string) => {
    const line = pickLine(chatterPool(charId, party().present.filter(c => c !== charId)), recent.current); if (!line) return;
    recent.current = [line.id, ...recent.current].slice(0, 4);
    say(userId, charId, line.id);
  };

  // random chatter for your own character: party × 30–60 s apart, waits while someone else is talking
  useEffect(() => {
    if (!enabled || !characterId || !VOICE_LINES[characterId]) return;
    let timer: ReturnType<typeof setTimeout>;
    const next = (ms: number) => { timer = setTimeout(tick, ms); };
    const tick = () => {
      if (Date.now() < speakingUntil.current || document.hidden) return next(4000 + Math.random() * 6000);
      sayRandom(me.id, characterId); next(chatterDelayMs(party().ids.length));
    };
    next(chatterDelayMs(party().ids.length) * (0.2 + Math.random() * 0.5));   // first line comes a bit sooner
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, characterId, me.id]);

  // retro moments: one party member's character reacts (all tabs agree who; only that player's tab speaks)
  const lastStage = useRef(stage);
  const lastVows = useRef<Record<string, string> | null>(null);
  useEffect(() => {
    const moments: { moment: RetroMoment; key: string }[] = [];
    if (lastStage.current !== stage && stage && lastStage.current) {   // a real step change, not the page loading into one
      const m: Partial<Record<Stage, RetroMoment>> = { fragment_drop: 'fragments', vote: 'vote', completed: 'retro_end' };
      if (m[stage]) moments.push({ moment: m[stage]!, key: `${sessionId}:${stage}` });
    }
    lastStage.current = stage;
    const now = Object.fromEntries(vows.map(v => [v.id, v.status]));
    if (lastVows.current) for (const v of vows) {
      if (lastVows.current[v.id] === v.status) continue;
      if (v.status === 'fulfilled') moments.push({ moment: v.id.length % 2 ? 'vow' : 'beacon', key: `${v.id}:fulfilled` });
      if (v.status === 'not_yet') moments.push({ moment: 'vow_not_yet', key: `${v.id}:not_yet` });
    }
    lastVows.current = now;
    if (!characterId || !enabled) return;
    const timers = moments.map(({ moment, key }) => {
      const voiced = party().ids.filter(id => id === me.id ? !!VOICE_LINES[characterId] : !!VOICE_LINES[peersRef.current[id]?.characterId || '']);
      if (eventSpeaker(voiced, key) !== me.id) return undefined;
      const line = eventLine(characterId, moment) ?? (moment === 'beacon' ? eventLine(characterId, 'vow') : moment === 'vow' ? eventLine(characterId, 'beacon') : undefined);
      return line ? setTimeout(() => say(me.id, characterId, line.id), 2500) : undefined;   // after the stage UI settles
    });
    return () => timers.forEach(t => t && clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, vows]);

  /** Clicked a character: they answer with a random line (unless they're mid-sentence). */
  const poke = (userId: string, charId: string | null | undefined) => {
    if (!charId || (bubbles[userId]?.until ?? 0) > Date.now()) return;
    sayRandom(userId, charId);
  };
  return { bubbles, poke };
}
