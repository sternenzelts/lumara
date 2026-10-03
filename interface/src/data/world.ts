import data from './map-regions.json';

export interface Nation {
  id: string; name: string; subtitle?: string; inspiredBy: string; element: string;
  color: string; x: number; y: number; art: string; characters: string[];
  beacons?: { x: number; y: number }[];
}
export const WORLD = data;
export const NATIONS: Nation[] = [data.sanctuary, ...data.regions];
export const BEACONS = data.beaconOrder.map((id, index) => {
  const [regionId, number] = id.split(':');
  const nation = data.regions.find(region => region.id === regionId)!;
  return { id, index, nation, ...nation.beacons[Number(number)] };
});
export const worldArt = (file: string) => `${import.meta.env.BASE_URL}art/world/${file}`;
export const GUIDE: Record<string, string> = {
  aurelis: 'Aurelis — our Sanctuary. Its light never fades.',
  zaryeva: 'Zaryeva — a land of ice and aurora.',
  hoshimura: 'Hoshimura — pink petals beneath a storm-lit sky.',
  lianzhou: 'Lianzhou — jade peaks rising through the mist.',
  belcourt: 'Belcourt — blue canals and moonlit gardens.',
};
// Cover geometry is shared by the painting and every percentage-based overlay.
export function mapGeometry(width: number, height: number, zoom = 1) {
  const scale = Math.max(width / 1672, height / 941) * zoom;
  return { width: 1672 * scale, height: 941 * scale };
}
export function clampPan(x: number, y: number, width: number, height: number, zoom = 1) {
  const size = mapGeometry(width, height, zoom);
  return { x: Math.max(-(size.width - width) / 2, Math.min((size.width - width) / 2, x)),
    y: Math.max(-(size.height - height) / 2, Math.min((size.height - height) / 2, y)) };
}
