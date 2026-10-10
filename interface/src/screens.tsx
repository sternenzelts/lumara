import { bannerReturnTarget, characterFromHash } from './logic/bannerNavigation';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Clock3, Compass, Copy, Flame, Gem, Pause, Pencil, Play, Plus, ShieldCheck, Sparkles, Trash2, UsersRound } from 'lucide-react';
import type { CheckIn, Fragment, FragmentCategory, PeerScores, SpeakerState, Stage, UserId, Vote, Vow, VowStatus } from './backend/types';
import { CHARACTERS, GAME_NAME, characterById, type CharacterDef } from './data/characters';
import { SANCTUARY_BACKGROUND } from './data/art';
import { CATEGORIES } from './data/categories';
import { nextStage, pityProgress } from './logic';
import { useReducedMotion, useWatch } from './hooks';
import { useUI } from './App';
import { Art, Button, CharacterCard, Empty, GradeBadge, LinkButton, SectionTitle } from './components/ui';
import Scene from './components/Scene';
import VoyageHud from './components/VoyageHud';
import VoyageLobby from './components/VoyageLobby';
import VoyageWindow from './components/VoyageWindow';
import VowJournalWindow from './components/VowJournalWindow';
import { minPicks, pickWarningText, underPicked } from './logic/picks';
import { previousStep, removedNote, stageProgress, voyageSteps, VOYAGE_BRIEFING } from './logic/voyage';
import WishLineups from './components/WishLineups';
import VoteBoard from './components/VoteBoard';
import ThoughtPicker from './components/ThoughtPicker';
import VowEditRow from './components/VowEditRow';
import PartyControls from './components/PartyControls';
import CheckInPanel from './components/CheckInPanel';
import HomecomingReport from './components/HomecomingReport';
import { useVoyageSummaries } from './components/useVoyageSummaries';
import { buildReport } from './logic/report';
import PeerFeedbackPanel from './components/PeerFeedbackPanel';
import PartyProgress from './components/PartyProgress';
import { finishWarningText, pendingPeerFeedback } from './logic/feedback';
import DiscussStage from './components/DiscussStage';
import SpeakerReel from './components/SpeakerReel';
import { finishTurn } from './logic/speaker';
import TutorialWish from './components/TutorialWish';

const STAGES: { id: Stage; label: string; plain: string }[] = [
  { id: 'register', label: 'Gather', plain: 'Join the party' }, { id: 'opening_pull', label: 'Opening Pull', plain: 'Meet your companion' },
  { id: 'vow_review', label: 'Sanctuary Gate', plain: 'Review action items' }, { id: 'fragment_drop', label: 'Fragment Drop', plain: 'Write thoughts' },
  { id: 'vote', label: 'Starlight Vote', plain: 'Choose what matters' }, { id: 'hall', label: 'Resonance Hall', plain: 'Reveal & discuss' },
  { id: 'vow_altar', label: 'Vow Altar', plain: 'Commit to action items' }, { id: 'rewards', label: 'Homecoming', plain: 'Summary & rewards' },
];
const useWarden = () => { const { me, session } = useUI(); return me.isAdmin || session?.wardenId === me.id; };

export function TitleScreen() {
  const { me, settings, session, navigate, openCreate, openJoin, backend } = useUI();
  const featured = characterById(settings.featuredCharacterId) || CHARACTERS[0];
  const reduced = useReducedMotion(); const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (reduced) return;
    const ctx = gsap.context(() => { gsap.to('.title-character', { y: -8, scale: 1.012, duration: 4, repeat: -1, yoyo: true, ease: 'sine.inOut' }); }, ref);
    return () => ctx.revert();
  }, [reduced, featured.id]);
  return <main ref={ref} id="main" tabIndex={-1} className="title-screen" onPointerMove={e => { if (reduced || e.pointerType !== 'mouse') return; const x = (e.clientX / innerWidth - .5) * 12; gsap.to('.title-character', { x, duration: 1.2, ease: 'power3.out', overwrite: 'auto' }); }}>
    <img className="title-backdrop" src={SANCTUARY_BACKGROUND} alt="White sky ruins above a sea of clouds" /><div className="title-wash" />
    <header className="title-header"><span className="title-wordmark"><Sparkles size={23} strokeWidth={1} />{GAME_NAME}</span><div><span className="demo-badge">{backend.mode === 'local' ? 'Demo mode' : 'Connected'}</span><span className="title-identity">{me.name} · Platform Pod</span></div></header>
    <div className="title-orbit" aria-hidden="true" /><Art key={featured.id} character={featured} kind="cutout" className="title-character" decorative />
    <div className="title-content"><h1>Every voyage<br />leaves a little light.</h1><p>A place to reflect. A promise to carry forward.<br />Your team’s next chapter starts here.</p><div className="title-actions">{(me.isAdmin || session?.wardenId === me.id) && <Button onClick={session ? () => navigate('retro') : openCreate}>{session ? 'Return to Retro' : 'Start a Retro'}<ArrowRight size={18} /></Button>}<Button secondary onClick={openJoin}>Join Retro</Button><button className="title-sanctuary" onClick={() => navigate('sanctuary')}>Enter the Sanctuary<ChevronRight size={18} /></button></div></div>
    <button className="title-featured" onClick={() => navigate('banner')}><div><GradeBadge grade={featured.grade} /><span>Featured companion</span></div><strong>{featured.name}</strong><span>{featured.title}<ArrowRight size={17} /></span></button>
    <footer className="title-footer"><span>A GACHA-STYLE TEAM RETROSPECTIVE</span><span>Original characters · cosmetic rewards · shared progress</span></footer>
  </main>;
}

export function SanctuaryScreen() {
  const ui = useUI(); const { me, session, sessions, vows, player, players, settings, backend, navigate, openCreate, openJoin, run, busy } = ui;
  const warden = useWarden(); const featured = characterById(settings.featuredCharacterId) || CHARACTERS[0];
  const open = vows.filter(v => ['open', 'not_yet', 'carried'].includes(v.status));
  const lit = vows.filter(v => v.status === 'fulfilled').length;
  const owned = CHARACTERS.filter(c => !!player?.owned[c.id]);
  return <><div className="page-heading"><div><h1>Your Sanctuary</h1><p>Welcome back, {me.name}. There’s light in what we leave behind.</p></div><Button secondary onClick={() => navigate('map')}><Compass size={16} />Explore world map<ArrowRight size={16} /></Button></div>
    <div className="sanctuary-layout"><div className="sanctuary-main"><Scene backend={backend} me={me} player={player} vows={vows} movement={settings.movement} cooldownMode={settings.skillCooldown} />
      <section className="voyage-panel"><div className="voyage-heading"><span className="voyage-icon"><UsersRound size={23} strokeWidth={1.4} /></span><div><h2>{session ? session.sprintName : 'The next chapter is yours.'}</h2><p>{session ? 'Your party is gathering. Step back into the voyage.' : 'Gather your team. Reflect on the sprint. Make a promise.'}</p></div></div>{session ? <Button disabled={busy} onClick={() => run(async () => { await backend.join(session.id); navigate('retro'); })}>Join the voyage<ArrowRight size={16} /></Button> : me.isAdmin ? <Button onClick={openCreate}>Start a Retro<ArrowRight size={16} /></Button> : <Button onClick={openJoin}>Join Retro<ArrowRight size={16} /></Button>}<div className="voyage-meta"><span><Clock3 size={14} />45–60 minutes</span><span><UsersRound size={14} />4–8 teammates</span><span><ShieldCheck size={14} />Anonymous thoughts</span></div></section>
      <section className="vows-panel"><SectionTitle title="Promises worth keeping" plain="Vows · your team’s open action items"><span className="quiet-count">{open.length} open</span></SectionTitle>{open.length ? <div className="vow-list">{open.slice(0, 4).map(v => <VowRow key={v.id} vow={v} editable={warden} />)}</div> : <div className="vow-empty"><span className="outlined-star"><CheckCircle2 size={25} strokeWidth={1.2} /></span><div><strong>{lit ? 'Your promises are shining.' : 'The first light starts with a promise.'}</strong><p>{lit ? 'Create new Vows in your next retrospective.' : 'Action items from your first retro will appear here.'}</p></div></div>}</section>
    </div><aside className="sanctuary-aside"><section className="featured-panel" style={{ '--accent': featured.accent } as CSSProperties}><div className="featured-header"><h2>A wish beyond the horizon</h2><p>Character banner</p></div><div className="featured-image"><Art character={featured} /><GradeBadge grade={featured.grade} /></div><div className="featured-caption"><h3>{featured.name}</h3><p>{featured.title}</p><LinkButton onClick={() => navigate('banner')}>Make a wish</LinkButton></div></section><div className="sanctuary-note"><Sparkles size={21} strokeWidth={1.2} /><p><strong>{lit ? `${Math.min(12, lit)} lights restored` : 'A world we restore together'}</strong><span>Every fulfilled action item brings a little more light to your Sanctuary.</span></p></div></aside></div>
    <section className="collection-preview"><SectionTitle title="Your companions" plain="Collection · cosmetic characters"><LinkButton onClick={() => navigate('collection')}>View collection</LinkButton></SectionTitle>{owned.length ? <div className="companion-strip">{owned.slice(0, 5).map(c => <button key={c.id} onClick={() => navigate('collection')}><Art character={c} /><div><strong>{c.name}</strong><span>{c.element}</span></div><GradeBadge grade={c.grade} /></button>)}</div> : <div className="collection-intro"><div className="companion-miniatures">{CHARACTERS.slice(0, 3).map(c => <Art key={c.id} character={c} />)}</div><div><strong>Your first companion is waiting.</strong><p>Everyone receives a free Opening Pull at the start of a retro.</p></div><LinkButton onClick={() => navigate('banner')}>Explore the banner</LinkButton></div>}</section>
    <div className="hub-bottom"><span>{sessions.filter(s => s.status === 'ended').length} voyages remembered · {players.length} companions in the party</span><button onClick={() => navigate('archives')}>Visit the archives<ArrowRight size={14} /></button></div>
  </>;
}
/** Vow review: the Warden ticks every kept promise, then confirms them all at once (one lamp moment for all). */
function VowReviewList({ vows, editable }: { vows: Vow[]; editable: boolean }) {
  const { run, backend, busy } = useUI();
  const [kept, setKept] = useState<Set<string>>(new Set());
  const toggle = (id: string, on: boolean) => setKept(k => { const n = new Set(k); if (on) n.add(id); else n.delete(id); return n; });
  const confirm = () => run(async () => { for (const id of kept) await backend.updateVow(id, { status: 'fulfilled' }); setKept(new Set()); });
  return <><div className="vow-review-list">{vows.map(v => <VowRow key={v.id} vow={v} editable={editable} review pendingKept={kept.has(v.id)} onKept={on => toggle(v.id, on)} />)}</div>
    {editable && kept.size > 0 && <div className="vow-confirm" role="region" aria-label="Confirm kept promises"><p><strong>{kept.size}</strong> {kept.size === 1 ? 'promise' : 'promises'} marked <strong>kept</strong> — {kept.size === 1 ? 'a light returns' : `${kept.size} lights return`} to the Sanctuary.</p><div><button className="vow-confirm-yes" disabled={busy} onClick={confirm}><Check size={16} />Confirm</button><button className="vow-confirm-no" disabled={busy} onClick={() => setKept(new Set())}>Clear</button></div></div>}</>;
}

function VowRow({ vow, editable = false, review = false, pendingKept = false, onKept }: { vow: Vow; editable?: boolean; review?: boolean; pendingKept?: boolean; onKept?: (on: boolean) => void }) {
  const { profiles, run, backend, busy } = useUI();
  const commit = (status: VowStatus) => run(async () => { await backend.updateVow(vow.id, { status }); });
  // in the review, 'kept' is only ticked here and saved by the one Confirm below the list
  const change = (status: VowStatus) => { if (onKept && status === 'fulfilled' && vow.status !== 'fulfilled') return onKept(true); onKept?.(false); commit(status); };
  const shown = pendingKept ? 'fulfilled' : vow.status;
  return <div className={`vow-row ${shown === 'fulfilled' ? 'fulfilled' : ''} ${pendingKept ? 'pending-kept' : ''}`}><button className="vow-check" disabled={!editable || busy} aria-label={`Mark action item ${shown === 'fulfilled' ? 'open' : 'kept'}: ${vow.text}`} aria-pressed={shown === 'fulfilled'} onClick={() => pendingKept ? onKept?.(false) : change(vow.status === 'fulfilled' ? 'open' : 'fulfilled')}>{shown === 'fulfilled' && <Check size={16} />}</button><div className="vow-text"><p>{vow.text}</p><span>{vow.ownerId ? profiles[vow.ownerId]?.name || 'Teammate' : 'Shared by the team'}<span className="dot-separator">·</span>{pendingKept ? 'kept · not confirmed yet' : vow.status.replace('_', ' ')}</span></div>{review && editable && <select aria-label={`Outcome for ${vow.text}`} value={shown} disabled={busy} onChange={e => change(e.target.value as VowStatus)}><option value="open">Open</option><option value="fulfilled">Fulfilled</option><option value="not_yet">Not yet</option><option value="carried">Carry forward</option><option value="dropped">Drop</option></select>}</div>;
}

export function BannerScreen() {
  const { tutorial } = useUI();
  return tutorial ? <TutorialWish /> : <WishLineups />;
}
function CircleInfo() { return <ShieldCheck size={15} />; }
function PityMeter({ label, value, max }: { label: string; value: number; max: number }) { return <div className="pity-meter"><div><span>{label}</span><strong>{value}<small> / {max}</small></strong></div><progress value={value} max={max} aria-label={`${label}: ${value} of ${max}`} /><span>Guaranteed within {max} wishes</span></div>; }

export function CollectionScreen() {
  const { player, backend, run, busy, navigate } = useUI(); const [filter, setFilter] = useState('all'); const [selected, setSelected] = useState<CharacterDef | null>(() => characterById(characterFromHash()) || null);
  useEffect(() => { const update = () => setSelected(characterById(characterFromHash()) || null); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  const ownedCount = CHARACTERS.filter(c => !!player?.owned[c.id]).length;
  const filtered = CHARACTERS.filter(c => filter === 'all' || filter === 'owned' && !!player?.owned[c.id] || c.grade === filter);
  const returnToBanner = bannerReturnTarget();
  useEffect(() => { if (!selected || !returnToBanner) return; const key = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); location.hash = returnToBanner; } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [selected, returnToBanner]);
  if (selected) return <>{returnToBanner && <button className="back-link" onClick={() => { location.hash = returnToBanner; }}><ArrowLeft size={16} />Back to Wishes</button>}<button className="back-link" onClick={() => { setSelected(null); navigate('collection'); }}><ArrowLeft size={16} />Back to collection</button><button className="back-link" onClick={() => navigate('map')}>Return to world map</button><div className="character-detail" style={{ '--accent': selected.accent } as CSSProperties}><div className="detail-painting"><Art key={selected.id} character={selected} /></div><div className="detail-copy"><GradeBadge grade={selected.grade} /><h1>{selected.name}</h1><p className="detail-title">{selected.title}</p><span className="element-label"><Sparkles size={16} />{selected.element}</span><p>{selected.flavor}</p><div className="detail-owned"><BookOpen size={16} />{player?.owned[selected.id] ? `${player.owned[selected.id]} in your collection` : 'Not collected yet'}</div><Button disabled={busy || !player?.owned[selected.id] || player.displayCharacterId === selected.id} onClick={() => run(() => backend.setMyDisplayCharacter(selected.id), `${selected.name} is now your display companion.`)}>{player?.displayCharacterId === selected.id ? <><Check size={16} />Your display companion</> : 'Set as display character'}</Button><p className="small-copy">Your companion appears in the Sanctuary. Characters never affect votes or discussion.</p></div></div>{selected.art.extra?.map(extra => <section className="extra-art" key={extra.src}><h2>{extra.label}</h2><img src={extra.src} alt={`${selected.name}: ${extra.label}`} onError={e => { e.currentTarget.style.display = 'none'; }} /></section>)}</>;
  return <><div className="page-heading"><div><h1>Good company for the journey.</h1><p>Your collection · {ownedCount} of {CHARACTERS.length} companions found</p></div><BookOpen className="heading-icon" size={30} strokeWidth={1} /></div><div className="filter-tabs" role="group" aria-label="Filter collection">{[{ id: 'all', name: 'All companions' }, { id: 'owned', name: 'Collected' }, { id: 'S++', name: 'S++' }, { id: 'S+', name: 'S+' }, { id: 'A', name: 'A' }].map(f => <button key={f.id} className={filter === f.id ? 'active' : ''} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.name}</button>)}</div>{filtered.length ? <div className="collection-grid">{filtered.map(c => <CharacterCard key={c.id} character={c} owned={!!player?.owned[c.id]} selected={player?.displayCharacterId === c.id} onClick={() => setSelected(c)} />)}</div> : <Empty title="Your story is just beginning."><p>Your first Opening Pull or banner wish adds a companion here.</p></Empty>}<p className="preview-note">Companions are cosmetic. Discover their homelands on the world map.</p></>;
}

export function ExchangeScreen() {
  const { settings, stardust, busy, pull, player } = useUI();
  const [selected, setSelected] = useState<CharacterDef | null>(null);
  const cost = (character: CharacterDef) => character.grade === 'S++' ? settings.stardust.costSPlusPlus : character.grade === 'S+' ? settings.stardust.costSPlus : settings.stardust.costA;
  return <><div className="page-heading"><div><h1>A wish, your way.</h1><p>Exchange Stardust for the companion you’ve been waiting for.</p></div><span className="balance-badge"><Gem size={18} />{stardust.toLocaleString()} Stardust</span></div><p className="exchange-intro">Duplicate companions become Stardust. Choose a specific character here, without a random pull.</p><div className="exchange-grid">{CHARACTERS.map(c => <button key={c.id} className={`exchange-item ${selected?.id === c.id ? 'selected' : ''}`} onClick={() => setSelected(c)} style={{ '--accent': c.accent } as CSSProperties}><Art character={c} /><div><GradeBadge grade={c.grade} /><h2>{c.name}</h2><span>{c.element}</span>{!!player?.owned[c.id] && <small>Already collected</small>}</div><strong><Gem size={14} />{cost(c)}</strong></button>)}</div>{selected && <div className="exchange-confirm"><div><strong>{selected.name}</strong><span>{cost(selected)} Stardust · specific companion</span></div><Button disabled={busy || stardust < cost(selected)} onClick={() => { pull('exchange', 1, selected.id).then(() => setSelected(null)); }}>Exchange for {selected.name}<ArrowRight size={16} /></Button><button className="link-button" onClick={() => setSelected(null)}>Cancel</button></div>}<p className="preview-note">Duplicate companions earn Stardust; exchanges spend it.</p></>;
}

export function RetroScreen() {
  const ui = useUI(); const { session, sessions, me, attendance, backend, settings, fragments, votes, vows, player, busy, run, pull, navigate, openCreate, openJoin, profiles, tell, players } = ui;
  const warden = useWarden();
  const [ownIds, setOwnIds] = useState<string[]>([]); const [ownVotes, setOwnVotes] = useState<string[]>([]); const [editThought, setEditThought] = useState<{ id: string; text: string; category: FragmentCategory } | null>(null);
  const [vowText, setVowText] = useState(''); const [owner, setOwner] = useState(''); const [selectedCharacter, setSelectedCharacter] = useState('');
  const [now, setNow] = useState(Date.now()); const hallRef = useRef<HTMLDivElement>(null); const reduced = useReducedMotion();
  const [windowOpen, setWindowOpen] = useState(!['fragment_drop', 'vote'].includes(session?.stage ?? ''));
  const [journalOpen, setJournalOpen] = useState(false);
  const [myCheck, setMyCheck] = useState<CheckIn | null>(null);
  const summaries = useVoyageSummaries(backend, session?.id ?? null, attendance, session?.stage);
  
  const [myPeer, setMyPeer] = useState<Record<string, PeerScores>>({});
  useEffect(() => { let live = true; if (!session || !['vow_altar', 'rewards'].includes(session.stage)) return; backend.myPeerRatings(session.id).then(r => { if (live) setMyPeer(r); }).catch(() => {}); return () => { live = false; }; }, [backend, session?.id, session?.stage]);
  
  const [checkins] = useWatch<CheckIn[]>(cb => session && warden ? backend.watchCheckIns(session.id, cb) : (() => {}), [], [backend, session?.id, warden]);
  useEffect(() => { let live = true; if (!session || session.stage !== 'register') return; backend.myCheckIn(session.id).then(c => { if (live) setMyCheck(c); }).catch(() => {}); return () => { live = false; }; }, [backend, session?.id, session?.stage]);
  useEffect(() => { setWindowOpen(!['fragment_drop', 'vote'].includes(session?.stage ?? '')); setJournalOpen(false); setEditThought(null); }, [session?.id, session?.stage]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { let live = true; if (!session) { setOwnIds([]); setOwnVotes([]); return; } Promise.all([backend.myFragmentIds(session.id), backend.myVotes(session.id)]).then(([ids, myVotes]) => { if (live) { setOwnIds(ids); setOwnVotes(myVotes); } }).catch(e => tell(String(e), true)); return () => { live = false; }; }, [backend, session?.id, fragments, votes]);
  useEffect(() => { if (!hallRef.current || reduced) return; const ctx = gsap.context(() => gsap.fromTo('.hall-fragment', { filter: 'blur(8px)', y: 18, opacity: .4 }, { filter: 'blur(0px)', y: 0, opacity: 1, duration: .8, ease: 'expo.out' }), hallRef); return () => ctx.revert(); }, [session?.speaker?.thoughtId, reduced]);
  if (!session) return <><div className="page-heading"><div><h1>A new voyage awaits.</h1><p>Retrospective · gather your team for the next chapter.</p></div></div><Empty title="Your party hasn’t gathered yet."><p>{me.isAdmin ? 'Start a retro and share its code with your teammates.' : 'Ask your Warden for a code when the next retro begins.'}</p><Button onClick={me.isAdmin ? openCreate : openJoin}>{me.isAdmin ? 'Start a Retro' : 'Join Retro'}<ArrowRight size={16} /></Button></Empty></>;
  const joined = attendance.some(a => a.userId === me.id); const ownAttendance = attendance.find(a => a.userId === me.id);
  const priorSession = sessions.find(s => s.status === 'ended');
  const previousVows = vows.filter(v => v.sessionId !== session.id && (v.sessionId === priorSession?.id || ['open', 'not_yet', 'carried'].includes(v.status)));
  const index = STAGES.findIndex(s => s.id === session.stage); const stage = STAGES[index] || STAGES[7];
  const remaining = session.timerEndsAt ? Math.max(0, Math.ceil((session.timerEndsAt - now) / 1000)) : null;
  const advance = () => run(async () => { const stage = nextStage(session.stage, settings, previousVows.length > 0); await backend.updateSession(session.id, { stage, status: stage === 'completed' ? 'ended' : 'active', timerEndsAt: null, currentFragmentId: null }); if (stage === 'completed') navigate('sanctuary'); });
  const ownedCharacters = CHARACTERS.filter(c => player?.owned[c.id]);
  const hasPrev = previousVows.length > 0;
  const prev = previousStep(session.stage, settings, hasPrev);
  const back = () => { if (prev) run(() => backend.updateSession(session.id, { stage: prev, timerEndsAt: null, currentFragmentId: null })); };
  const togglePause = () => run(() => backend.updateSession(session.id, { status: session.status === 'paused' ? 'active' : 'paused', timerEndsAt: null }));
  const copyCode = () => run(async () => { if (!navigator.clipboard) { tell(`Retro code: ${session.id.slice(0, 8)}`); return; } await navigator.clipboard.writeText(session.id.slice(0, 8)); }, 'Retro code copied.');
  const lobby = !joined || session.stage === 'register';
  const members = attendance.map(a => ({ userId: a.userId, name: profiles[a.userId]?.name || a.userId, characterId: a.characterId || (a.userId === me.id ? player?.displayCharacterId || null : null), warden: a.userId === session.wardenId, you: a.userId === me.id, ready: a.checkinDone }));
  const toggleLock = () => run(() => backend.updateSession(session.id, { partyLocked: !session.partyLocked }), session.partyLocked ? 'The party is open again.' : 'Party locked. Nobody new can join.');
  const removePlayer = (userId: string) => run(() => backend.removePlayer(session.id, userId), removedNote(profiles[userId]?.name || userId, session.stage, session.partyLocked));
  const speakerId = session.stage === 'hall' ? session.speaker?.currentId ?? null : null;
  const changeSpeaker = (next: SpeakerState, frames?: UserId[]) => run(async () => { await backend.updateSession(session.id, { speaker: next }); if (frames) backend.emit('speaker', { sessionId: session.id, frames }); });
  const backdrop = <div className={`voyage-backdrop ${lobby ? 'lobby-dim' : ''}`}><Scene backend={backend} me={me} player={player} vows={vows} fragments={fragments} movement={settings.movement} cooldownMode={settings.skillCooldown} frozen={lobby || journalOpen} speakerId={speakerId} stage={lobby ? undefined : session.stage} sessionId={session.id} activeCharacterId={ownAttendance?.characterId || player?.displayCharacterId} editThought={editThought} onEditDone={() => setEditThought(null)} onFragmentSaved={(message, error) => tell(message, error)} onOpenVows={() => { setWindowOpen(false); setJournalOpen(true); }} onOpenVote={session.stage === 'vote' ? () => setWindowOpen(true) : undefined} /></div>;
  if (lobby) return <>{backdrop}<VoyageLobby sprintName={session.sprintName} code={session.id.slice(0, 8)} steps={voyageSteps(settings, hasPrev)}
    members={members}
    joined={joined} warden={warden} busy={busy} paused={session.status === 'paused'} locked={session.partyLocked} started={session.stage !== 'register'} onToggleLock={warden ? toggleLock : undefined} onRemove={warden ? removePlayer : undefined}
    checkIn={joined ? <CheckInPanel owned={ownedCharacters} companionId={ownAttendance?.characterId ?? null} saved={myCheck} busy={busy} onSave={(c, sat, growth) => run(async () => { if (c !== ownAttendance?.characterId) await backend.setMyCharacter(session.id, c); await backend.saveMyCheckIn(session.id, sat, growth); setMyCheck(await backend.myCheckIn(session.id)); }, 'Checked in. You’re ready to sail.')} /> : undefined}
    onJoin={() => run(() => backend.join(session.id))} onEnter={advance} onCopyCode={copyCode} /></>;
  const feedback = joined && ['vow_altar', 'rewards'].includes(session.stage) ? <div className="feedback-panels">
    {warden && <PartyProgress members={members} attendance={attendance} checkins={checkins} />}
    <PeerFeedbackPanel allies={members.filter(m => !m.you)} mine={myPeer} busy={busy} onSave={async (t, sc) => { let ok = false; await run(async () => { await backend.ratePeer(session.id, t, sc); setMyPeer(await backend.myPeerRatings(session.id)); ok = true; }, 'Rating saved.'); return ok; }} />
  </div> : null;
  
  const seesAll = warden;
  const report = buildReport({ session, sessions, viewerId: me.id, viewerSeesAll: seesAll, attendance, players, profiles, fragments, votes, vows, settings, checkIn: summaries.checkIn, peer: summaries.peer });
  
  const finishWarning = session.stage === 'rewards' ? finishWarningText(pendingPeerFeedback(attendance)) : null;
  const pickWarning = pickWarningText(underPicked(attendance, fragments.length), minPicks(fragments.length));
  const brief = VOYAGE_BRIEFING[(session.stage === 'completed' ? 'rewards' : session.stage) as keyof typeof VOYAGE_BRIEFING];
  return <>{backdrop}
    <VoyageHud progress={stageProgress(session.stage, settings, hasPrev)} paused={session.status === 'paused'} warden={warden} busy={busy} canBack={prev !== null}
      nextLabel={session.stage === 'rewards' ? 'Finish voyage' : 'Next stage'} actionLabel={session.stage === 'fragment_drop' ? 'My thoughts' : session.stage === 'vote' && settings.movement ? null : brief.title} onBack={back} onNext={advance} onOpen={() => setWindowOpen(true)} onPauseToggle={togglePause}
      onLobby={() => run(() => backend.updateSession(session.id, { stage: 'register', timerEndsAt: null, currentFragmentId: null }), 'The party is back in the lobby.')}
      onCancel={() => run(async () => { await backend.cancelSession(session.id); navigate('sanctuary'); }, 'The voyage was cancelled. Start a fresh one when you are ready.')}
      nextWarning={session.stage === 'vote' && pickWarning ? { title: 'Move on to Discuss?', text: pickWarning, stay: 'Keep voting', go: 'Continue anyway' } : finishWarning ? { title: 'Finish the voyage?', text: finishWarning, stay: 'Keep going', go: 'Finish anyway' } : null}
      partyControls={warden ? <PartyControls members={members} busy={busy} onRemove={removePlayer} /> : undefined} />
    <VoyageWindow title={brief.title} open={windowOpen} onClose={() => setWindowOpen(false)} variant={session.stage === 'vow_review' ? 'vow-review' : undefined}>
      {remaining !== null && <span className="timer" aria-label={`${remaining} seconds remaining`}><Clock3 size={15} />{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</span>}
      {session.status === 'paused' && !warden ? <Empty title="A moment to catch our breath."><p>Your Warden has paused the voyage. This screen will follow when the party is ready.</p></Empty> : <>
      {session.stage === 'vow_review' && <div className="vow-review-content"><div className="stage-intro"><h3>What became of our promises?</h3><p>No punishment. No shame. Recognize what happened, and decide what to carry forward.</p></div>{previousVows.length ? <VowReviewList vows={previousVows} editable={warden} /> : <Empty title="A fresh page."><p>No previous action items to review. Continue to writing thoughts.</p></Empty>}<div className="review-lamps"><Flame size={20} /><strong>{Math.min(12, vows.filter(v => v.status === 'fulfilled').length)} / 12 lights restored</strong><span>Each fulfilled Vow brings the Sanctuary to life.</span></div></div>}
      {session.stage === 'fragment_drop' && <div className="fragment-workspace"><aside className="own-thoughts"><h3>Your thoughts</h3><p>Walk to a crystal to write a thought.</p><p>Only you see which ones are yours.</p>{fragments.filter(f => ownIds.includes(f.id)).map(f => <div className="own-fragment" key={f.id}><span className={`category-label ${f.category}`}>{CATEGORIES.find(c => c.id === f.category)?.label}</span><p>{f.text}</p><div><button aria-label={`Edit thought: ${f.text}`} disabled={busy} onClick={() => { setEditThought({ id: f.id, text: f.text, category: f.category }); setWindowOpen(false); }}><Pencil size={13} />Edit</button><button aria-label={`Delete thought: ${f.text}`} disabled={busy} onClick={() => run(() => backend.deleteMyFragment(session.id, f.id))}><Trash2 size={13} />Delete</button></div></div>)}{!ownIds.length && <p className="small-copy">Your first thought will appear here.</p>}</aside></div>}
      {session.stage === 'vote' && <VoteBoard fragments={fragments} votes={votes} ownVotes={ownVotes} busy={busy} onVote={id => run(() => backend.castVote(session.id, id))} onUnvote={id => run(() => backend.removeMyVote(session.id, id))} />}
      {session.stage === 'hall' && <div ref={hallRef}><DiscussStage speaker={session.speaker} meId={me.id} warden={warden} busy={busy} party={members} fragments={fragments} ownPicks={ownVotes} vows={vows.filter(v => v.sessionId === session.id)}
        onSpeaker={changeSpeaker} onChoose={fid => run(() => backend.chooseTurnThought(session.id, fid))}
        onMakeVow={(text, owner) => run(async () => { await backend.addVow(session.id, text, owner); await backend.updateSession(session.id, { speaker: finishTurn(session.speaker) }); }, 'A new Vow to carry forward.')}
        onTimer={() => run(() => backend.updateSession(session.id, { timerEndsAt: Date.now() + 180000 }))} /></div>}
      {session.stage === 'vow_altar' && <><div className="stage-intro"><h3>Review the Vows.</h3><p>Every turn in Discuss ended at the Vow box. Fix wording or owners, and add anything still missing.</p></div>{warden ? <><form className="vow-form" onSubmit={e => { e.preventDefault(); run(async () => { await backend.addVow(session.id, vowText, owner || null); setVowText(''); }, 'A new Vow to carry forward.'); }}><label>Vow · action item<textarea value={vowText} onChange={e => setVowText(e.target.value)} rows={3} maxLength={1000} required placeholder="What will we do differently next sprint?" /></label><div><label>Owner · optional<select value={owner} onChange={e => setOwner(e.target.value)}><option value="">Shared by the team</option>{attendance.map(a => <option key={a.userId} value={a.userId}>{profiles[a.userId]?.name || a.userId}</option>)}</select></label><Button type="submit" disabled={busy || !vowText.trim()}>Make a Vow<Plus size={16} /></Button></div></form>{vows.filter(v => v.sessionId === session.id).map(v => <VowEditRow key={v.id} vow={v} party={members} busy={busy} onSave={patch => run(() => backend.updateVow(v.id, patch), 'Vow updated.')} />)}
<ThoughtPicker fragments={fragments.filter(f => !(session.speaker?.discussed ?? []).includes(f.id))} onPick={t => setVowText(t.slice(0, 1000))} /></> : <p>Your Warden is reviewing the Vows. While they do, rate your allies below.</p>}{!warden && vows.filter(v => v.sessionId === session.id).map(v => <VowRow key={v.id} vow={v} />)}{feedback}</>}
      {(session.stage === 'rewards' || session.stage === 'completed') && <div className="rewards-stage"><HomecomingReport report={report} viewerSeesAll={seesAll} actions={<>{player?.pulls.some(p => p.source === 'opening' && p.sessionId === session.id) ? <p className="small-copy">Free wish claimed — your new companion is in your collection.</p> : <Button onClick={() => pull('opening')} disabled={busy}><Sparkles size={16} />Claim your free wish</Button>}<Button secondary onClick={() => navigate('banner')}>Visit the character banner<ArrowRight size={16} /></Button></>} />{feedback}</div>}
      </>}
    </VoyageWindow>
    {session.stage === 'hall' && <SpeakerReel backend={backend} sessionId={session.id} party={members} />}
    {speakerId === me.id && <p className="speaker-your-turn" role="status">Your turn — the hall is listening.</p>}
    {journalOpen && <VowJournalWindow onClose={() => setJournalOpen(false)} />}
  </>;
}

export function ArchivesScreen() {
  const { sessions, vows, me, backend, allAttendance, players, profiles, settings } = useUI(); const [selected, setSelected] = useState<string | null>(null);
  const ended = sessions.filter(s => s.status === 'ended'); const session = ended.find(s => s.id === selected);
  const [fragments] = useWatch<Fragment[]>(cb => selected ? backend.watchFragments(selected, cb) : (() => {}), [], [backend, selected]);
  const [votes] = useWatch<Vote[]>(cb => selected ? backend.watchVotes(selected, cb) : (() => {}), [], [backend, selected]);
  const attendance = allAttendance.filter(a => a.sessionId === selected);
  const summaries = useVoyageSummaries(backend, selected, attendance, session?.stage);
  const seesAll = me.isAdmin || session?.wardenId === me.id;
  const report = session ? buildReport({ session, sessions, viewerId: me.id, viewerSeesAll: seesAll, attendance, players, profiles, fragments, votes, vows, settings, checkIn: summaries.checkIn, peer: summaries.peer }) : null;
  return <><div className="page-heading"><div><h1>The voyages we remember.</h1><p>Archives · past retrospectives and the promises they left behind</p></div></div>{session && report ? <><button className="back-link" onClick={() => setSelected(null)}><ArrowLeft size={16} />All voyages</button><section className="archive-detail"><HomecomingReport report={report} viewerSeesAll={seesAll} /><SectionTitle title="Vows from this voyage" plain="Action items & outcomes" />{vows.filter(v => v.sessionId === session.id).map(v => <VowRow key={v.id} vow={v} />)}{!vows.some(v => v.sessionId === session.id) && <p>No action items were recorded for this voyage.</p>}</section></> : ended.length ? <div className="archive-list">{ended.map(s => <button key={s.id} onClick={() => setSelected(s.id)}><span className="archive-symbol"><Sparkles size={21} strokeWidth={1} /></span><div><h2>{s.sprintName}</h2><p>{new Date(s.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p></div><span>{vows.filter(v => v.sessionId === s.id && v.status === 'fulfilled').length} / {vows.filter(v => v.sessionId === s.id).length} Vows fulfilled</span><ChevronRight size={18} /></button>)}</div> : <Empty title="The first chapter is still ahead."><p>Completed retrospectives will appear here, along with their action items and outcomes.</p></Empty>}</>;
}

export { default as AdminScreen } from './components/AdminSettings';
