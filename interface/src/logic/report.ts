import type { Fragment, Vote } from '../backend/types';

/** Thoughts with their vote counts: most votes first, then the older thought first. */
export function rankByVotes(fragments: Fragment[], votes: Vote[]): { fragment: Fragment; votes: number }[] {
  return fragments.map(fragment => ({ fragment, votes: votes.filter(v => v.fragmentId === fragment.id).length }))
    .sort((a, b) => b.votes - a.votes || a.fragment.createdAt - b.fragment.createdAt);
}
