import type { Character } from './characters';
const frames: Record<string, string> = {
  mahesvara: '400 25 250 313', keira: '325 0 390 488', ayaka: '180 190 320 400',
  azrenth: '350 20 330 413', dax: '320 25 540 675', kairo: '375 0 570 713',
  rook: '220 0 580 725', wren: '280 0 600 750', suvara: '360 200 310 388',
  ashvane: '330 20 300 375', lucien: '345 30 330 413', seren: '430 65 300 375', sollene: '355 160 360 450', calla: '285 20 370 463',
};
export default function CompanionPortrait({ character }: { character: Character }) {
  const landscapeFrames: Record<string, string> = { keira: '720 280 350 438' };
  if (landscapeFrames[character.id]) return <svg className="companion-portrait" viewBox={landscapeFrames[character.id]} preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href={`${import.meta.env.BASE_URL}art/landscapes/${character.id}.webp`} width="1672" height="941"/></svg>;
  return <svg className="companion-portrait" viewBox={frames[character.id] || '250 0 500 625'} preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href={character.cutout || character.splash} width="1024" height="1536"/></svg>;
}
