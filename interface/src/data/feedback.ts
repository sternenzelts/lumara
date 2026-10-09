import type { PeerTrait } from '../backend/types';

/** Self Check-In questions (the same as Rizzpective's; the team already uses them). */
export const CHECKIN_QUESTIONS = [
  { key: 'sat', icon: '♥', title: 'Sprint Satisfaction', ask: 'How satisfied are you with your overall experience this sprint?', labels: ['Rough sprint', 'A bit bumpy', 'Okay', 'Good run', 'Legendary'] },
  { key: 'growth', icon: '◆', title: 'Self Growth', ask: 'How much do you feel you learned, improved, or grew during this sprint?', labels: ['Same level', 'A little XP', 'Leveled up', 'Big level-up', 'Class evolved'] },
] as const;

/** Peer Feedback traits (the same as Rizzpective's). */
export const PEER_TRAITS: { key: PeerTrait; icon: string; title: string; measures: string; hint: string }[] = [
  { key: 'collab', icon: '🤝', title: 'Party Spirit', measures: 'Collaboration & camaraderie', hint: 'Great to team up with' },
  { key: 'owner', icon: '🛡', title: 'Dependable', measures: 'Ownership & reliability', hint: 'Owns it and follows through' },
  { key: 'comm', icon: '💬', title: 'Clear Comms', measures: 'Communication & constructive candor', hint: 'Shares openly, kindly and honestly' },
  { key: 'impact', icon: '⚔️', title: 'Impact', measures: 'Contribution & excellence', hint: 'Brings quality work to the quest' },
  { key: 'growth', icon: '🌱', title: 'Levels Up', measures: 'Growth & forward thinking', hint: 'Learns, improves and looks ahead' },
];
