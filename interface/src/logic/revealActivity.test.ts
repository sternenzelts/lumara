import { expect, it } from 'vitest';
import { beginReveal, isRevealActive, subscribeRevealActivity } from './revealActivity';

it('keeps music suspended until every reveal closes and tolerates repeated cleanup', () => {
  const changes: boolean[] = [];
  const unsubscribe = subscribeRevealActivity(() => changes.push(isRevealActive()));
  const first = beginReveal();
  const second = beginReveal();
  first(); first();
  expect(isRevealActive()).toBe(true);
  second();
  expect(isRevealActive()).toBe(false);
  expect(changes).toEqual([true, true, true, false]);
  unsubscribe();
  beginReveal()();
  expect(changes).toHaveLength(4);
});
