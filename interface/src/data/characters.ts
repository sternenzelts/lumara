import type { Grade } from '../backend/types';
import { ART } from './art';
export const GAME_NAME = 'Lumara'; // TEMP name placeholder — Jay chooses the final game name.
export interface CharacterDef {
  id: string; name: string; title?: string; grade: Grade; element: string; accent: string; flavor: string;
  art: { splash?: string; cutout?: string; extra?: { label: string; src: string }[]; reveal?: string; walk?: string; walkFrames?: number; float?: string };
  skill?: string;
}
export const CHARACTERS: CharacterDef[] = [
  { id: 'mahesvara', name: 'Mahesvara', title: 'Beyond the veil', grade: 'S++', element: 'Void', accent: '#426c9d', flavor: 'In the space between destruction and restoration, he chooses what remains.', art: ART.mahesvara },
  { id: 'keira', name: 'Keira', title: 'A spark in the system', grade: 'S++', element: 'Flame', accent: '#b84c81', flavor: 'A playful digital ghost, a pink flame, and a guardian large enough to catch a falling sky.', art: ART.keira },
  { id: 'ayaka', name: 'Ayaka', title: 'A moment outside time', grade: 'S++', element: 'Ice / Time', accent: '#517f92', flavor: 'An effortless genius who can pause the world to take a nap. Even time deserves a moment of rest.', art: ART.ayaka },
  { id: 'azrenth', name: 'Azrenth', title: 'Crowned in black flame', grade: 'S++', element: 'Destruction', accent: '#9b4b4e', flavor: 'A reincarnated demon king, holding a fractured world in his hands.', art: ART.azrenth },
  { id: 'lucien', name: 'Lucien Valmaire', title: 'The Great Moon', grade: 'S+', element: 'Moonlit Lightning', accent: '#6f63b8', flavor: "A weary young count everyone calls a mastermind. His chants bind a forgotten god's vow — and a hundred bolts of lightning answer.", art: ART.lucien },
  { id: 'seren', name: 'Seren', title: 'Dawnlight', grade: 'S+', element: 'Light', accent: '#987a3b', flavor: 'Where the last light fades, she is the promise of another dawn.', art: ART.seren },
  { id: 'ashvane', name: 'Ashvane', title: 'The quiet vanguard', grade: 'S+', element: 'Earth / Battle', accent: '#997046', flavor: 'A veteran of a hundred dusk-lit battles. His spear speaks only when it must.', art: ART.ashvane },
  { id: 'suvara', name: 'Suvara', title: 'Keeper of the horizon', grade: 'S+', element: 'Radiant light', accent: '#3c7e81', flavor: 'A young ruler borne by a guardian dragon, carrying tomorrow upon her shoulders.', art: ART.suvara },
  { id: 'sollene', name: 'Sollene', title: 'Moonlit devotion', grade: 'A', element: 'Moonlight', accent: '#53617c', flavor: 'In a moonlit garden, a quiet prayer steadies the sky. Her crescent staff carries the light of home.', art: ART.sollene },
  { id: 'wren', name: 'Wren', grade: 'A', element: 'Wind', accent: '#4b806d', flavor: 'An energetic archer who follows the wind toward the next adventure.', art: ART.wren },
  { id: 'rook', name: 'Rook', grade: 'A', element: 'Lightning', accent: '#a47843', flavor: 'A laid-back gunslinger with a spark of rebellion.', art: ART.rook },
  { id: 'calla', name: 'Calla', grade: 'A', element: 'Poison', accent: '#498065', flavor: 'A sly alchemist with a remedy for almost everything.', art: ART.calla },
  { id: 'kairo', name: 'Kairo', grade: 'A', element: 'Water', accent: '#43877f', flavor: 'A wandering swordsman whose quiet resolve runs as deep as the sea.', art: ART.kairo },
  { id: 'dax', name: 'Dax', grade: 'A', element: 'Fire', accent: '#b7673c', flavor: 'A hot-headed brawler who never lets the fire go out.', art: ART.dax },
];
export const characterById = (id: string | null | undefined) => CHARACTERS.find(x => x.id === id);
