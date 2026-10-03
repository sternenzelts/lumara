import { selectedBanner } from './logic/bannerNavigation';
import { Component, createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { getBackend } from './backend';
import { DEFAULT_SETTINGS } from './backend/local';
import type { Attendance, Backend, Fragment, Me, Player, PullRecord, Session, Settings, Vote, Vow } from './backend/types';
import { CHARACTERS, GAME_NAME, characterById } from './data/characters';
import { useWatch } from './hooks';
import { rollPull, starlightBalance, stardustBalance } from './logic';
import PullReveal, { type RevealCue } from './components/PullReveal';
import SanctuaryMusic from './components/SanctuaryMusic';
import WorldMap from './screens/WorldMap';
import Opening from './screens/Opening';
import { gateRoute, openingKind, type OpeningKind } from './logic/opening';
import { withNicknames } from './logic/names';
import { welcomeRollsRemaining } from './logic/welcome';
import GameShell, { VowJournal } from './components/GameShell';
import { Button } from './components/ui';
import { AdminScreen, ArchivesScreen, BannerScreen, CollectionScreen, ExchangeScreen, RetroScreen } from './screens';

export type Route = 'vows' | 'map' | 'title' | 'welcome' | 'sanctuary' | 'retro' | 'banner' | 'collection' | 'exchange' | 'archives' | 'settings';
export type SanctuaryGreeting = 'arrive' | 'back' | 'pull_a' | 'pull_splus' | 'pull_splusplus' | 'pull_seren' | null;
export interface UIContext {
  backend: Backend; me: Me; accountName: string; named: boolean;
  sanctuaryGreeting: SanctuaryGreeting; clearGreeting: () => void; session: Session | null; sessions: Session[]; attendance: Attendance[]; allAttendance: Attendance[];
  fragments: Fragment[]; votes: Vote[]; vows: Vow[]; player: Player | null; players: Player[]; settings: Settings;
  profiles: Record<string, { name: string }>; busy: boolean; starlight: number; stardust: number;
  tutorial: boolean; route: Route; navigate: (route: Route) => void; run: (job: () => Promise<void>, success?: string) => Promise<void>;
  pull: (source: PullRecord['source'], count?: number, chosen?: string) => Promise<void>;
  openCreate: () => void; openJoin: () => void; tell: (text: string, error?: boolean) => void;
}
const Context = createContext<UIContext | null>(null);
export const useUI = () => { const value = useContext(Context); if (!value) throw new Error('UI provider is unavailable.'); return value; };
const routes: Route[] = ['vows', 'map', 'title', 'welcome', 'sanctuary', 'retro', 'banner', 'collection', 'exchange', 'archives', 'settings'];
const currentRoute = (): Route => { const route = location.hash.slice(1).split('/')[0] as Route; return routes.includes(route) ? route : 'title'; };


class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main className="fatal-error"><Sparkles size={40} /><h1>Let’s find our way back.</h1><p>The interface couldn’t load. Your saved demo data is still in this browser.</p><Button onClick={() => location.reload()}>Reload the Sanctuary</Button></main> : this.props.children; }
}
export default function App() { return <ErrorBoundary><AppContent /></ErrorBoundary>; }
function AppContent() {
  const [backend] = useState(getBackend);
  const [me, setMe] = useState<Me | null>(null);
  const [identityError, setIdentityError] = useState('');
  const [route, setRoute] = useState<Route>(currentRoute);
  const [session, sessionError] = useWatch<Session | null>(cb => backend.watchActiveSession(cb), null, [backend]);
  const [sessions] = useWatch<Session[]>(cb => backend.watchSessions(cb), [], [backend]);
  const [settings] = useWatch<Settings>(cb => backend.watchSettings(cb), DEFAULT_SETTINGS, [backend]);
  const [vows] = useWatch<Vow[]>(cb => backend.watchVows(cb), [], [backend]);
  const [players] = useWatch<Player[]>(cb => backend.watchPlayers(cb), [], [backend]);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const [player] = useWatch<Player | null>(cb => me ? backend.watchPlayer(me.id, p => { setPlayerLoaded(true); cb(p); }) : (() => {}), null, [backend, me?.id]);
  // Local echoes of just-saved choices, so a slow watch can't bounce the player back into the opening.
  const [savedNickname, setSavedNickname] = useState<string | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const effectivePlayer: Player | null = player || savedNickname || introDone
    ? { ...(player || { userId: me?.id || '', displayCharacterId: null, owned: {}, pulls: [], nickname: null, introSeen: false }), nickname: player?.nickname || savedNickname, introSeen: !!player?.introSeen || introDone }
    : null;
  const [activeKind, setActiveKind] = useState<OpeningKind | null>(null);
  const [destination, setDestination] = useState<Route>('sanctuary');
  const [sanctuaryGreeting, setSanctuaryGreeting] = useState<SanctuaryGreeting>('back');
  const [attendance] = useWatch<Attendance[]>(cb => session ? backend.watchAttendance(session.id, cb) : (() => {}), [], [backend, session?.id]);
  const [fragments] = useWatch<Fragment[]>(cb => session ? backend.watchFragments(session.id, cb) : (() => {}), [], [backend, session?.id]);
  const [votes] = useWatch<Vote[]>(cb => session ? backend.watchVotes(session.id, cb) : (() => {}), [], [backend, session?.id]);
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string }>>({});
  const [busy, setBusy] = useState(false); const taskLock = useRef(false);
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(null); const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [cue, setCue] = useState<RevealCue | null>(null);
  const [dialog, setDialog] = useState<'create' | 'join' | 'help' | null>(null);
  const [input, setInput] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => { let live = true; backend.me().then(x => { if (live) setMe(x); }).catch(e => { if (live) setIdentityError(String(e)); }); return () => { live = false; }; }, [backend]);
  useEffect(() => { const fn = () => setRoute(currentRoute()); window.addEventListener('hashchange', fn); return () => window.removeEventListener('hashchange', fn); }, []);
  useEffect(() => {
    // Replace, not push: otherwise Back returns to the gated screen and bounces straight back here.
    const go = (next: Route) => { location.replace(`#${next}`); setRoute(next); };
    if (route !== 'welcome' && activeKind) { setActiveKind(null); return; }
    const target = gateRoute({ route, player: effectivePlayer, playerLoaded });
    if (target) { setDestination(route); go(target); return; }
    if (route !== 'welcome' || !playerLoaded || activeKind) return;
    // The kind is frozen when the opening starts; saving the name mid-way must not change which beats remain.
    const kind = openingKind({ player: effectivePlayer, destination, retroInProgress: !!session && session.status !== 'ended' });
    if (kind) setActiveKind(kind); else go(Object.values(effectivePlayer?.owned || {}).some(n => n > 0) ? 'sanctuary' : 'banner');
  }, [route, playerLoaded, effectivePlayer?.nickname, effectivePlayer?.introSeen, JSON.stringify(effectivePlayer?.owned), activeKind, destination, session?.id]);
  useEffect(() => {
    const bySession: Record<string, Attendance[]> = {}; setAllAttendance([]);
    const stops = sessions.map(s => backend.watchAttendance(s.id, list => { bySession[s.id] = list; setAllAttendance(Object.values(bySession).flat()); }));
    return () => stops.forEach(stop => stop());
  }, [backend, sessions.map(s => s.id).join('|')]);
  const ids = [...new Set([me?.id || '', ...players.map(p => p.userId), ...attendance.map(a => a.userId), ...vows.map(v => v.ownerId || '')])].filter(Boolean).join('|');
  useEffect(() => { let live = true; backend.profiles(ids.split('|').filter(Boolean)).then(p => { if (live) setProfiles(p); }).catch(() => {}); return () => { live = false; }; }, [backend, ids]);
  useEffect(() => backend.on('pull_reveal', (data) => {
    const value = data as Partial<RevealCue>;
    if (!value || !Array.isArray(value.records) || !value.records.length || value.records.length > 10 || typeof value.name !== 'string' || typeof value.cueId !== 'string') return;
    if (value.records.some(r => !characterById(r.characterId) || !['A', 'S+', 'S++'].includes(r.grade))) return;
    if (value.sessionId && value.sessionId !== session?.id) return;
    setCue(value as RevealCue);
  }), [backend, session?.id]);
  useEffect(() => {
    if (!dialog) return;
    const old = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; dialogRef.current?.querySelector<HTMLElement>('input,button')?.focus();
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setDialog(null); if (e.key === 'Tab') { const items = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input'); if (!items?.length) return; const first = items[0], last = items[items.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } };
    document.addEventListener('keydown', fn); return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', fn); old?.focus(); };
  }, [dialog]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const navigate = (next: Route) => { location.hash = next; setRoute(next); window.scrollTo({ top: 0 }); };
  const tell = (text: string, error = false) => { clearTimeout(toastTimer.current); setToast({ text, error }); toastTimer.current = setTimeout(() => setToast(null), error ? 7000 : 4000); };
  const run = async (job: () => Promise<void>, success?: string) => { if (taskLock.current) return; taskLock.current = true; setBusy(true); try { await job(); if (success) tell(success); } catch (e) { tell(e instanceof Error ? e.message : 'Something went wrong. Please try again.', true); } finally { taskLock.current = false; setBusy(false); } };
  if (!me) return <main className="loading-screen"><Sparkles size={32} /><h1>{identityError ? 'The gate is waiting.' : 'Finding your Sanctuary…'}</h1><p>{identityError || 'Preparing your local voyage.'}</p>{identityError && <Button onClick={() => location.reload()}>Try again</Button>}</main>;
  const emptyPlayer: Player = { userId: me.id, displayCharacterId: null, owned: {}, pulls: [], nickname: null, introSeen: false };
  const shownMe: Me = { ...me, name: effectivePlayer?.nickname || me.name };
  const shownProfiles = { ...withNicknames(profiles, players), [me.id]: { name: shownMe.name, accountName: me.name } };
  const finishOpening = () => run(async () => {
    await backend.markIntroSeen(); setIntroDone(true); setActiveKind(null); setSanctuaryGreeting(null); navigate('banner');
  });
  const starlight = starlightBalance({ userId: me.id, attendance: allAttendance, vows, player: player || emptyPlayer, settings });
  const stardust = stardustBalance({ player: player || emptyPlayer, settings });
  const tutorial = !!effectivePlayer?.nickname && !!effectivePlayer.introSeen && welcomeRollsRemaining(effectivePlayer) > 0;
  const pull = async (source: PullRecord['source'], count = 1, chosen?: string) => run(async () => {
    if (source === 'welcome' && (!tutorial || chosen || !Number.isInteger(count) || count < 1 || count > welcomeRollsRemaining(player))) throw new Error('Your free welcome wishes are already claimed or unavailable.');
    if (source === 'opening' && (!session || !['rewards', 'completed'].includes(session.stage))) throw new Error('Your free wish waits at Homecoming.');
    if (source === 'opening' && player?.pulls.some(p => p.source === 'opening' && p.sessionId === session?.id)) throw new Error('You already claimed this voyage’s free wish.');
    if (source === 'banner' && starlight < settings.starlight.pullCost * count) throw new Error(`You need ${settings.starlight.pullCost * count} Starlight for ${count === 1 ? 'a wish' : 'these wishes'}.`);
    const bannerId = source === 'banner' ? selectedBanner() : undefined;
    const records: PullRecord[] = []; const history = [...(player?.pulls || [])]; const owned = { ...(player?.owned || {}) };
    for (let i = 0; i < count; i++) {
      const picked = chosen ? characterById(chosen) : null;
      const result = picked ? { characterId: picked.id, grade: picked.grade, duplicate: !!owned[picked.id] } : rollPull({ settings, history, roster: CHARACTERS, owned, bannerId });
      const record: PullRecord = { ...result, at: Date.now() + i, source, ...(source === 'opening' && session ? { sessionId: session.id } : {}) };
      await backend.appendMyPull(record); history.push(record); owned[record.characterId] = (owned[record.characterId] || 0) + 1; records.push(record);
    }
    const nextCue: RevealCue = { records, name: shownMe.name, sessionId: source === 'opening' ? session?.id : undefined, cueId: crypto.randomUUID(), tutorial: source === 'welcome' };
    setCue(nextCue); if (source === 'opening') backend.emit('pull_reveal', nextCue);
  });
  const value: UIContext = { backend, me: shownMe, accountName: me.name, named: !!effectivePlayer?.nickname, sanctuaryGreeting, clearGreeting: () => setSanctuaryGreeting(null),
    session, sessions, attendance, allAttendance, fragments, votes, vows, player, players, settings, profiles: shownProfiles, busy, starlight, stardust, tutorial, route, navigate, run, pull, tell, openCreate: () => { setInput(`Voyage ${sessions.length + 1}`); setDialog('create'); }, openJoin: () => { setInput(''); setDialog('join'); } };
  const screen = { map: <WorldMap backend={backend} onBack={() => navigate('sanctuary')} onCharacter={id => { location.hash = `collection/${id}`; setRoute('collection'); }} />, sanctuary: null, retro: <RetroScreen />, banner: <BannerScreen />, collection: <CollectionScreen />, exchange: <ExchangeScreen />, archives: <ArchivesScreen />, settings: me.isAdmin || session?.wardenId === me.id ? <AdminScreen /> : <VowJournal />, title: null, welcome: null, vows: <VowJournal /> }[route];
  const opening = route === 'welcome' && activeKind
    ? <Opening key={activeKind} kind={activeKind} accountName={me.name} onDone={finishOpening} onSkipStory={finishOpening}
        onNickname={async name => { await backend.setMyNickname(name); setSavedNickname(name); }} />
    : route === 'welcome' ? <main className="opening" aria-busy="true" /> : null;
  return <Context.Provider value={value}>
    <a href="#main" className="skip-link" onClick={e => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
    {opening || (route === 'map' ? screen : <GameShell onHelp={() => setDialog('help')} error={sessionError}>{screen}</GameShell>)}
    <SanctuaryMusic route={route} />
    {dialog && <div className="dialog-scrim" onPointerDown={e => { if (e.target === e.currentTarget) setDialog(null); }}><div ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="icon-button dialog-close" aria-label="Close dialog" onClick={() => setDialog(null)}><X size={20} /></button><Sparkles size={30} strokeWidth={1} />
      <h2 id="dialog-title">{dialog === 'create' ? 'Set sail together.' : dialog === 'join' ? 'Find your party.' : 'A brighter world, one Vow at a time.'}</h2>
      {dialog === 'help' ? <><p>Start a Voyage, share anonymous thoughts, vote on what matters, discuss, and leave with action items.</p><dl className="glossary"><dt>Fragments</dt><dd>Your anonymous retrospective thoughts.</dd><dt>Vows</dt><dd>Action items that carry into the next retro. Fulfilled Vows light the Sanctuary.</dd><dt>Starlight & Stardust</dt><dd>Earn Starlight by attending, voting, and fulfilling Vows. Each wish costs Starlight; duplicates give Stardust for the Exchange.</dd></dl><p className="small-copy">For a second demo teammate, open the same URL with <code>?player=ana</code>. Tabs share this browser; there is no remote room or authenticated identity yet.</p><Button onClick={() => setDialog(null)}>Back to the Sanctuary</Button></> : <form onSubmit={e => { e.preventDefault(); run(async () => { if (dialog === 'create') { await backend.createSession(input); } else { const found = sessions.find(s => s.status !== 'ended' && (s.id.toLowerCase() === input.trim().toLowerCase() || s.id.slice(0, 8).toLowerCase() === input.trim().toLowerCase())); if (!found) throw new Error('No active retro with that code. Ask your Warden for the code.'); await backend.join(found.id); } setDialog(null); navigate('retro'); }); }}><p>{dialog === 'create' ? 'A fresh voyage for your team. You’ll guide the retrospective as Warden.' : 'Enter the code your Warden shared. Demo players must use tabs in the same browser.'}</p><label>{dialog === 'create' ? 'Voyage name · sprint' : 'Retro code'}<input value={input} onChange={e => setInput(e.target.value)} maxLength={80} required placeholder={dialog === 'create' ? 'Sprint 12 · Finding our rhythm' : 'e.g. a1b2c3d4'} /></label><Button type="submit" disabled={busy}>{busy ? 'Preparing…' : dialog === 'create' ? 'Start a Retro' : 'Join Retro'}<ArrowRight size={16} /></Button></form>}
    </div></div>}
    {cue && <PullReveal key={cue.cueId} cue={cue} onClose={() => {
      const completed = cue; setCue(null);
      if (completed?.tutorial) void run(async () => {
        const rank = { 'S++': 3, 'S+': 2, A: 1 };
        const record = [...completed.records].sort((a, b) => rank[b.grade] - rank[a.grade])[0]; await backend.setMyDisplayCharacter(record.characterId);
        const line = record.characterId === 'seren' ? 'pull_seren' : record.grade === 'S++' ? 'pull_splusplus' : record.grade === 'S+' ? 'pull_splus' : 'pull_a';
        setSanctuaryGreeting(line); navigate('sanctuary');
      });
    }} />}
    {toast && <div className={`toast ${toast.error ? 'error' : ''}`} role={toast.error ? 'alert' : 'status'}><span>{toast.text}</span><button className="icon-button" onClick={() => setToast(null)} aria-label="Dismiss message"><X size={15} /></button></div>}
  </Context.Provider>;
}
