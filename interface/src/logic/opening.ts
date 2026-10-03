import type { Player } from '../backend/types';
import { welcomeRollsRemaining } from './welcome';

export type Beat = 'welcome' | 'nickname' | 'greeted' | 'scene1' | 'scene2' | 'scene3' | 'call';
export type OpeningKind = 'full' | 'story';
export type Face = 'happy' | 'excited' | 'thinking' | 'proud';

const NAMING: Beat[] = ['welcome', 'nickname', 'greeted'];
const STORY: Beat[] = ['scene1', 'scene2', 'scene3'];

export const beatsFor = (kind: OpeningKind): Beat[] => kind === 'full' ? [...NAMING, ...STORY, 'call'] : [...STORY, 'call'];
export const canSkip = (beat: Beat) => STORY.includes(beat);

export const BEAT_VOICE: Record<Beat, string | null> = {
  welcome: 'welcome_first', nickname: null, greeted: 'nickname_set', scene1: 'intro_1', scene2: 'intro_2', scene3: 'intro_3', call: 'stage_pull',
};
export const BEAT_FACE: Record<Beat, Face | null> = {
  welcome: 'happy', nickname: null, greeted: 'excited', scene1: 'thinking', scene2: 'happy', scene3: 'proud', call: 'excited',
};

export function openingKind({ player, destination, retroInProgress }: { player: Player | null; destination: string; retroInProgress: boolean }): OpeningKind | null {
  if (!player?.nickname) return 'full';
  return player.introSeen ? null : 'story';
}

const UNGATED = ['title', 'welcome'];
export function gateRoute({ route, player, playerLoaded }: { route: string; player: Player | null; playerLoaded: boolean }): 'welcome' | 'banner' | null {
  if (!playerLoaded || UNGATED.includes(route)) return null;
  if (!player?.nickname) return 'welcome';
  if (!player.introSeen) return 'welcome';
  return welcomeRollsRemaining(player) > 0 && route !== 'banner' ? 'banner' : null;
}
