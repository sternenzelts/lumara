import { describe, expect, it } from 'vitest';
import { bannerCharacterLink, bannerReturnTarget, characterFromHash, selectedBanner } from './bannerNavigation';
describe('returning to a wish banner', () => {
  it.each(['mahesvara', 'keira', 'ayaka', 'azrenth'])('keeps the %s banner when viewing any companion', banner => {
    const link = bannerCharacterLink('seren', banner);
    expect(characterFromHash(link)).toBe('seren');
    expect(bannerReturnTarget(link)).toBe(`#banner/${banner}`);
    expect(selectedBanner(bannerReturnTarget(link)!)).toBe(banner);
  });
  it('does not change ordinary collection or map navigation', () => {
    expect(bannerReturnTarget('#collection/seren')).toBeNull();
    expect(bannerReturnTarget('#collection/seren?from=banner&banner=unknown')).toBeNull();
    expect(characterFromHash('#collection/seren')).toBe('seren');
    expect(selectedBanner('#banner')).toBe('mahesvara');
  });
});
