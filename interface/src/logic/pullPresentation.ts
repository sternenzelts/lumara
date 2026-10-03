import type { PullRecord } from '../backend/types';

export function nextRevealIndex(records: PullRecord[], current: number, premiumOnly: boolean) {
  for (let i = current + 1; i < records.length; i++) {
    if (!premiumOnly || records[i].grade !== 'A') return i;
  }
  return records.length;
}
