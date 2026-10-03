export const BANNER_IDS = ['mahesvara', 'keira', 'ayaka', 'azrenth'] as const;
export function selectedBanner(hash = location.hash) {
  const id = hash.split('/')[1]?.split('?')[0];
  return BANNER_IDS.includes(id as typeof BANNER_IDS[number]) ? id! : 'mahesvara';
}
export function characterFromHash(hash = location.hash) { return hash.split('/')[1]?.split('?')[0]; }
export function bannerCharacterLink(id: string, banner: string) { return `#collection/${id}?from=banner&banner=${banner}`; }
export function bannerReturnTarget(hash = location.hash) {
  if (!hash.startsWith('#collection/')) return null;
  const query = new URLSearchParams(hash.split('?')[1] || '');
  const banner = query.get('banner');
  return query.get('from') === 'banner' && BANNER_IDS.includes(banner as typeof BANNER_IDS[number]) ? `#banner/${banner}` : null;
}
