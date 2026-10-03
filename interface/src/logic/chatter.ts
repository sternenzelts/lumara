// Characters talking on the plaza: random lines at random times, clicks, retro moments and skill bubbles.
import { VOICE_LINES, type VoiceLine } from '../data/voiceLines';

/** Lines a character may say at random: greetings, tap lines, idles and their personal quirk lines. */
const CHATTER = /^(greet|tap_\d|idle|yawn|laugh|glitch|mech|secret|misread|legend|duty|misfit)$/;

export const voiceSrc = (characterId: string, lineId: string) => `${import.meta.env.BASE_URL}art/${characterId}/voice/${lineId}.mp3`;

/** Random-chatter lines for a character; "see <name>" lines only while that character is on the map. */
export function chatterPool(characterId: string, present: string[]): VoiceLine[] {
  return (VOICE_LINES[characterId] || []).filter(l => CHATTER.test(l.id) || (l.id.startsWith('see_') && present.includes(l.id.slice(4))));
}

/** A random line, avoiding the ones said recently (unless that leaves nothing). */
export function pickLine(pool: VoiceLine[], recent: string[], rand = Math.random): VoiceLine | undefined {
  const fresh = pool.filter(l => !recent.includes(l.id)), from = fresh.length ? fresh : pool;
  return from[Math.floor(rand() * from.length)];
}

/** Gap before this character's next random line: party × 30–60 s, so the plaza hears ~one line per 30–60 s. */
export function chatterDelayMs(partySize: number, rand = Math.random) {
  return Math.max(1, partySize) * (30000 + rand() * 30000);
}

/** How long a line holds the floor (bubble time): longer text, longer bubble. */
export function speakMs(text: string) {
  return Math.round(Math.min(6000, Math.max(2500, 1200 + text.length * 60)));
}

export type RetroMoment = 'fragments' | 'vote' | 'vow' | 'vow_not_yet' | 'beacon' | 'retro_end';
const MOMENT_IDS: Record<RetroMoment, string[]> = {
  fragments: ['fragments', 'stage_fragments'], vote: ['vote', 'stage_vote'], vow: ['vow', 'vow_fulfilled'],
  vow_not_yet: ['vow_not_yet'], beacon: ['beacon'], retro_end: ['retro_end', 'stage_goodbye'],
};
export function eventLine(characterId: string, moment: RetroMoment): VoiceLine | undefined {
  const lines = VOICE_LINES[characterId] || [];
  return MOMENT_IDS[moment].map(id => lines.find(l => l.id === id)).find(Boolean);
}

/** One party member reacts to a retro moment; every tab computes the same pick from the same key. */
export function eventSpeaker(party: string[], key: string): string | undefined {
  if (!party.length) return undefined;
  const sorted = [...party].sort();
  let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return sorted[h % sorted.length];
}

/** Bubble text for a skill's voice clip (…/vo_<id>.mp3 or …/voice/<id>.mp3). */
export function skillLine(characterId: string, voice: string): VoiceLine | undefined {
  const m = voice.match(/(?:\/vo_|\/voice\/)([a-z_0-9]+)\.mp3$/);
  return m ? (VOICE_LINES[characterId] || []).find(l => l.id === m[1]) : undefined;
}
