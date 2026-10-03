import type { Settings, Stage } from '../backend/types';
import { nextStage } from './index';

// Briefing shown in the voyage lobby; titles double as the Sanctuary stage label.
export const VOYAGE_BRIEFING = {
  vow_review: { title: 'Vow review', text: 'At the beacon, look back at last voyage’s vows. Each one kept relights a lamp.' },
  fragment_drop: { title: 'Write', text: 'Walk to a crystal and leave an anonymous thought: Keep, Problem, Try or Wild.' },
  vote: { title: 'Vote', text: 'Give your 3 Starlight votes to the thoughts that matter most.' },
  hall: { title: 'Discuss', text: 'The Warden draws thoughts from the beacon, most voted first.' },
  vow_altar: { title: 'New vows', text: 'Pass through the gate to the vow island and make promises for next sprint.' },
  rewards: { title: 'Homecoming', text: 'Back on the plaza: see what you shared, collect your Starlight and claim your free wish.' },
} satisfies Record<Exclude<Stage, 'register' | 'completed' | 'opening_pull'>, { title: string; text: string }>;

/** The stages after Gather, in order, following the same rules as nextStage. */
export function voyageSteps(settings: Settings, hasPreviousVows: boolean): Stage[] {
  const steps: Stage[] = [];
  for (let s = nextStage('register', settings, hasPreviousVows); s !== 'completed'; s = nextStage(s, settings, hasPreviousVows)) steps.push(s);
  return steps;
}

/** The Warden's Back target: the previous voyage step, skipping skipped stages; null on the first step (never back to the lobby). */
export function previousStep(stage: Stage, settings: Settings, hasPreviousVows: boolean): Stage | null {
  const steps = voyageSteps(settings, hasPreviousVows);
  const i = steps.indexOf(stage === 'completed' ? 'rewards' : stage);
  return i > 0 ? steps[i - 1] : null;
}

/** "Vow review · 2 of 7" data for the Sanctuary HUD; null in the lobby or after the voyage. */
export function stageProgress(stage: Stage, settings: Settings, hasPreviousVows: boolean) {
  const steps = voyageSteps(settings, hasPreviousVows);
  const i = steps.indexOf(stage);
  if (i < 0) return null;
  return { title: VOYAGE_BRIEFING[stage as keyof typeof VOYAGE_BRIEFING].title, index: i + 1, total: steps.length };
}
