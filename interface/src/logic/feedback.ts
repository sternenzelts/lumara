import type { CheckIn, CheckInSummary, UserId } from '../backend/types';

const pct = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 20) : null;

/** Team check-in averages (% of 5) over current party members only. */
export function summarizeCheckIns(rows: CheckIn[], partyIds: UserId[]): CheckInSummary {
  const mine = rows.filter(r => partyIds.includes(r.userId));
  return { sat: pct(mine.map(r => r.sat)), growth: pct(mine.map(r => r.growth)), n: mine.length, of: partyIds.length };
}
