import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';
import { configureBackend } from '../backend';
import { DEFAULT_SETTINGS } from '../backend/local';
import type { Backend, Player, Session, Vow } from '../backend/types';
import '../styles.css';

// Standalone development entry: sample sessions and outcomes live only in this page's memory.
const previous: Session = { id: 'sample-prior', sprintName: 'Previous voyage · sample', stage: 'completed', status: 'ended', wardenId: 'jay', currentFragmentId: null, timerEndsAt: null, createdAt: 1, partyLocked: false, speaker: null };
let session: Session = { ...previous, id: 'sample-review', sprintName: 'Vow review · sample preview', stage: 'vow_review', status: 'active', createdAt: 2 };
const player: Player = { userId: 'jay', nickname: 'Jay', introSeen: true, displayCharacterId: 'mahesvara', owned: { mahesvara: 1 }, pulls: [] };
const vows: Vow[] = [
  { id: 'sample-vow-1', sessionId: previous.id, text: 'Share a short deployment checklist before the next release.', ownerId: 'jay', status: 'fulfilled', createdAt: 1 },
  { id: 'sample-vow-2', sessionId: previous.id, text: 'Reserve time together to work through the flaky tests.', ownerId: null, status: 'open', createdAt: 2 },
  { id: 'sample-vow-3', sessionId: previous.id, text: 'Document the handoff steps so teammates can cover for one another.', ownerId: 'mia', status: 'not_yet', createdAt: 3 },
];
const subscribers = new Set<() => void>();
const watch = <T,>(select: () => T, cb: (value: T) => void) => {
  const send = () => cb(structuredClone(select()));
  subscribers.add(send); send();
  return () => { subscribers.delete(send); };
};
const notify = () => subscribers.forEach(send => send());
const attendance = [{ userId: 'jay', sessionId: session.id, joinedAt: 2, votesCast: 0, characterId: 'mahesvara', checkinDone: true }];
const unsupported = async () => { throw new Error('This sample preview supports vow review only.'); };
const noSubscription = () => () => {};

const backend: Backend = {
  mode: 'local',
  me: async () => ({ id: 'jay', name: 'Jay', isAdmin: true }),
  profiles: async () => ({ jay: { name: 'Jay' }, mia: { name: 'Mia (sample)' } }),
  watchActiveSession: cb => watch(() => session, cb),
  watchSessions: cb => watch(() => [session, previous], cb),
  watchAttendance: (id, cb) => watch(() => id === session.id ? attendance : [], cb),
  watchVows: cb => watch(() => vows, cb),
  watchPlayer: (_id, cb) => watch(() => player, cb),
  watchPlayers: cb => watch(() => [player], cb),
  watchSettings: cb => watch(() => DEFAULT_SETTINGS, cb),
  watchFragments: (_id, cb) => { cb([]); return () => {}; },
  watchVotes: (_id, cb) => { cb([]); return () => {}; },
  myFragmentIds: async () => [], myVotes: async () => [],
  saveMyCheckIn: unsupported, myCheckIn: async () => null, checkInSummary: async () => null, watchCheckIns: (_id, cb) => watch(() => [], cb),
  updateVow: async (id, patch) => { const vow = vows.find(v => v.id === id); if (vow) Object.assign(vow, patch); notify(); },
  cancelSession: async () => {},
  updateSession: async (_id, patch) => {
    // Keep this direct preview on review; pause/resume remains usable.
    session = { ...session, ...patch, stage: 'vow_review' }; notify();
  },
  on: noSubscription,
  onPeers: cb => { cb({}); return () => {}; },
  emit() {}, setPresence() {},
  createSession: unsupported, join: unsupported, removePlayer: unsupported, setMyCharacter: unsupported,
  addFragment: unsupported, deleteMyFragment: unsupported, castVote: unsupported, removeMyVote: unsupported,
  addVow: unsupported, grantCurrency: unsupported, appendMyPull: unsupported, setMyDisplayCharacter: unsupported,
  setMyNickname: unsupported, markIntroSeen: unsupported, saveSettings: unsupported,
};

configureBackend(backend);
history.replaceState(null, '', `${location.pathname}${location.search}#retro`);
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
