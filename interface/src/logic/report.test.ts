import { describe, expect, it } from 'vitest';
import type { Fragment, Vote } from '../backend/types';
import { rankByVotes } from './report';

const frag = (id: string, createdAt: number): Fragment => ({ id, sessionId: 's', text: id, category: 'spark', createdAt });
const vote = (fragmentId: string): Vote => ({ id: fragmentId + Math.random(), sessionId: 's', fragmentId });

describe('rankByVotes', () => {
  it('puts the most-voted thought first and breaks ties by age', () => {
    const r = rankByVotes([frag('a', 1), frag('b', 2), frag('c', 3)], [vote('c'), vote('c'), vote('b'), vote('a')]);
    expect(r.map(x => [x.fragment.id, x.votes])).toEqual([['c', 2], ['a', 1], ['b', 1]]);
  });
  it('lists unvoted thoughts with 0 votes', () => {
    expect(rankByVotes([frag('a', 1)], []).map(x => x.votes)).toEqual([0]);
  });
});
