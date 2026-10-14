import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Client, LobbyClient } from 'boardgame.io/client';
import { Local, SocketIO } from 'boardgame.io/multiplayer';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Bomb, Check, Copy, BookOpen, Gift, Layers, Lightbulb, Shield, Sparkles, Swords, X, Users, RotateCcw, Wifi, WifiOff } from 'lucide-react';
import { cardDefs, companions, companionFor, catTypes, type CardType } from './catalog';
import { LumaraGame, createState, type Card, type GameState, type Edition } from './game';
import { botAction } from './bots';
import Rules from './Rules';
import TableScene from './TableScene';
import { useEffectQueue } from './Effects';
import { cardHint, danger } from './guide';
import { ruleName, selectionAdvice } from './interaction';
import HandControls from './HandControls';
import { cardSupabase, enterSupabaseRoom, supabaseConnection, usesSupabase, type TableConnection } from './supabase-multiplayer';

type GameClient = TableConnection;
interface Session { matchID: string; playerID: string; credentials?: string; practice?: boolean; edition?: Edition; transport?: 'supabase' }
const serverURL = import.meta.env.VITE_GAME_SERVER || window.location.origin;
/** Keep production in practice mode until the Supabase backend rollout is complete. */
const practiceOnly = import.meta.env.VITE_PRACTICE_ONLY === '1';
const lobby = new LobbyClient({ server: serverURL });
const safeRead = (key: string, fallback: string) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
const saveProfile = (name: string, companion: string) => { try { localStorage.setItem('lumara.cards.name', name); localStorage.setItem('lumara.cards.companion', companion); } catch { /* Storage is optional. */ } };
const sessionKey = (id: string) => `lumara.cards.room.${id}`;

function CardFace({ card, back = false, small = false }: { card?: Card; back?: boolean; small?: boolean }) {
  if (back || !card) return <div className={`card-face card-back ${small ? 'small' : ''}`}><Sparkles aria-hidden="true" /><span>Lumara</span><i>Last Light</i></div>;
  const def = cardDefs[card.type];
  return <div className={`card-face ${small ? 'small' : ''} ${card.type === 'collapse' ? 'collapse' : ''}`} style={{ '--accent': def.color } as CSSProperties}>
    <img src={companionFor(def.companion).art} alt="" draggable={false} />
    <div className="card-caption"><span>{def.rule}</span><strong>{def.title}</strong><p>{def.text}</p></div>
  </div>;
}

export default function App() {
  const [name, setName] = useState(() => safeRead('lumara.cards.name', ''));
  const [companion, setCompanion] = useState(() => safeRead('lumara.cards.companion', 'seren'));
  const [edition, setEdition] = useState<Edition>('party');
  const [players, setPlayers] = useState(4);
  const [roomCode, setRoomCode] = useState(() => new URLSearchParams(location.search).get('room') || '');
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rules, setRules] = useState(false);
  const [resumable, setResumable] = useState<Session | null>(() => {
    try { const id = new URLSearchParams(location.search).get('room'); return id ? JSON.parse(sessionStorage.getItem(sessionKey(id)) || 'null') : null; } catch { return null; }
  });
  const validName = name.trim().length > 0;
  const enter = (next: Session) => {
    const playerName = name.trim() || (next.practice ? 'Guest' : '');
    if (next.practice && !name.trim()) setName(playerName);
    saveProfile(playerName, companion); setSession(next); setError('');
    if (!next.practice) {
      try { sessionStorage.setItem(sessionKey(next.matchID), JSON.stringify(next)); } catch { /* The current seat works without storage. */ }
      setResumable(next); setRoomCode(next.matchID);
      history.replaceState(null, '', `?room=${encodeURIComponent(next.matchID)}`);
    }
  };
  const online = async (create: boolean) => {
    if (!validName || busy) return;
    setBusy(true); setError('');
    try {
      if (usesSupabase) {
        const profile = { name: name.trim(), companion };
        const room = await enterSupabaseRoom(create ? { op: 'create', players, edition, ...profile } : { op: 'join', code: roomCode.trim().toLowerCase(), ...profile });
        enter({ matchID: room.code, playerID: room.playerID, transport: 'supabase' }); return;
      }
      let id = roomCode.trim();
      if (create) { const match = await lobby.createMatch(LumaraGame.name!, { numPlayers: players, setupData: { edition } }); id = match.matchID; }
      if (!id || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) throw new Error('Enter the room code your host shared.');
      if (!create) {
        try { const saved = JSON.parse(sessionStorage.getItem(sessionKey(id)) || 'null') as Session | null; if (saved?.credentials) { enter(saved); return; } } catch { /* Join normally if storage is unavailable. */ }
      }
      const match = await lobby.getMatch(LumaraGame.name!, id);
      const seat = match.players.find(p => !p.name);
      if (!seat) throw new Error('This room is full. Resume your seat or ask the host for a new room.');
      const result = await lobby.joinMatch(LumaraGame.name!, id, { playerID: String(seat.id), playerName: name.trim() });
      enter({ matchID: id, playerID: String(seat.id), credentials: result.playerCredentials });
    } catch (err) { const message = err instanceof Error ? err.message : ''; setError(usesSupabase || message.includes('full') || message.startsWith('Enter') ? message : 'Couldn’t reach that room. Check the code and game server, then try again.'); }
    finally { setBusy(false); }
  };
  const leave = () => { setSession(null); history.replaceState(null, '', location.pathname); };
  return <div className={`app ${session ? 'in-game' : ''}`}>
    <header className="site-header"><a href={location.pathname} className="wordmark" onClick={e => { e.preventDefault(); if (session) leave(); }}><Sparkles size={27} /><span>Lumara</span></a><button className="text-link" onClick={() => setRules(true)}><BookOpen size={17} /> How to play</button></header>
    {session ? <GameTable session={session} profile={{ name: name.trim(), companion }} leave={leave} onEdition={setEdition} /> : <main className="entry">
      <div className="entry-art landing-art" aria-hidden="true"><img src="landing/table-preview.webp" alt="" fetchPriority="high" /></div>
      <section className="entry-copy"><h1>One last light.<br /><em>Try to keep yours.</em></h1><p className="intro">A few friends. A dangerous deck.<br />And someone who definitely shouldn’t be trusted.</p><p className="game-name">Last Light · a Lumara card game</p>
        {practiceOnly ? <div className="entry-form">
          <label className="field">Your name<input maxLength={32} value={name} onChange={e => setName(e.target.value)} autoComplete="nickname" placeholder="Optional: what should the bots call you?" /></label>
          <fieldset className="companion-picker"><legend>Your companion</legend><div className="portrait-rail">{companions.map(c => <button type="button" key={c.id} className={`portrait ${companion === c.id ? 'chosen' : ''}`} onClick={() => setCompanion(c.id)} aria-label={`Choose ${c.name}`} aria-pressed={companion === c.id}><img src={c.art} alt="" /><span>{c.name}</span></button>)}</div></fieldset>
          <label className="field">Deck<select value={edition} onChange={e => setEdition(e.target.value as Edition)}><option value="party">Party Pack</option><option value="original">Original</option></select></label>
          <button className="button primary create-room" type="button" onClick={() => enter({ matchID: `practice-${Date.now()}`, playerID: '0', practice: true, edition })}><Sparkles size={17} /> Play now<ArrowRight size={18} /></button>
          <p className="practice-caption">You against three bots. Online rooms with friends are coming soon.</p>
        </div> : <><form onSubmit={(e: FormEvent) => { e.preventDefault(); void online(false); }} className="entry-form">
          <label className="field">Your name<input maxLength={32} value={name} onChange={e => setName(e.target.value)} autoComplete="nickname" placeholder="What should the party call you?" required /></label>
          <fieldset className="companion-picker"><legend>Your companion</legend><div className="portrait-rail">{companions.map(c => <button type="button" key={c.id} className={`portrait ${companion === c.id ? 'chosen' : ''}`} onClick={() => setCompanion(c.id)} aria-label={`Choose ${c.name}`} aria-pressed={companion === c.id}><img src={c.art} alt="" /><span>{c.name}</span></button>)}</div></fieldset>
          <div className="room-options"><label className="field">Deck<select value={edition} onChange={e => { const next = e.target.value as Edition; setEdition(next); setPlayers(p => Math.min(p, next === 'original' ? 5 : 10)); }}><option value="party">Party Pack · 2–10 players</option><option value="original">Original · 2–5 players</option></select></label><label className="field">Seats<select value={players} onChange={e => setPlayers(Number(e.target.value))}>{Array.from({ length: edition === 'party' ? 9 : 4 }, (_, i) => i + 2).map(n => <option key={n} value={n}>{n} players</option>)}</select></label></div>
          <button className="button primary create-room" type="button" disabled={!validName || busy} onClick={() => void online(true)}><Users size={17} /> {busy ? 'Connecting…' : 'Create a room'}<ArrowRight size={18} /></button>
          <div className="join-row"><label className="sr-only" htmlFor="room-code">Room code</label><input id="room-code" placeholder="Room code from a friend" value={roomCode} onChange={e => setRoomCode(e.target.value)} maxLength={64} autoCapitalize="none" spellCheck={false} /><button className="button secondary" disabled={!validName || !roomCode.trim() || busy} type="submit">Join room</button></div>
          {resumable && <button type="button" className="text-link" disabled={busy} onClick={() => usesSupabase ? void online(false) : enter(resumable)}>Resume your seat <ArrowRight size={16} /></button>}
          {error && <p className="error" role="alert">{error}</p>}
        </form>
        <button className="text-link practice-link" disabled={busy} onClick={() => enter({ matchID: `practice-${Date.now()}`, playerID: '0', practice: true, edition })}>Try a practice round <ArrowRight size={17} /></button><p className="practice-caption">You + three bots. No server needed.</p></>}
      </section>
    </main>}
    <footer className="site-footer">Original Lumara artwork · Exploding Kittens gameplay<span>{practiceOnly ? 'Practice edition' : usesSupabase ? 'Play with friends' : 'Local prototype'}</span></footer>
    {rules && <Rules close={() => setRules(false)} edition={edition} />}
  </div>;
}

export function GameTable({ session, profile, leave, onEdition }: { session: Session; profile: { name: string; companion: string }; leave: () => void; onEdition: (edition: Edition) => void }) {
  const [client, setClient] = useState<GameClient | null>(null);
  const [G, setG] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(!!session.practice);
  const [selected, setSelected] = useState<string[]>([]);
  const [arranging, setArranging] = useState(false);
  const [movingCard, setMovingCard] = useState<string | null>(null);
  const draggedCard = useRef<string | null>(null);
  const [handNotice, setHandNotice] = useState('');
  const [target, setTarget] = useState('');
  const [requested, setRequested] = useState<CardType>('defuse');
  const [position, setPosition] = useState(0);
  const [futureOrder, setFutureOrder] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [tableError, setTableError] = useState('');
  const handRail = useRef<HTMLDivElement>(null);
  /** Practice bots wait while table effects are still playing. */
  const busyUntil = useRef(0);
  /** Cards that left my hand because I played or gave them, so they are not announced as lost. */
  const ownRemoved = useRef(new Set<string>());
  const prevHand = useRef<Card[] | null>(null);
  const [reveal, setReveal] = useState<{ key: number; title: string; card: Card; lost: boolean } | null>(null);
  const [tipsSeen, setTipsSeen] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('lumara.cards.tips') || '[]'); } catch { return []; } });
  const seeTips = (ids: string[]) => setTipsSeen(seen => { const next = [...new Set([...seen, ...ids])]; try { localStorage.setItem('lumara.cards.tips', JSON.stringify(next)); } catch { /* Tips just reappear next visit. */ } return next; });
  const handSection = useRef<HTMLElement>(null);
  const stageControls = useRef<HTMLElement>(null);
  const responseControls = useRef<HTMLDivElement>(null);
  const [handScroll, setHandScroll] = useState({ left: false, right: false });
  const me = Number(session.playerID);
  useEffect(() => {
    const local = session.practice ? Local() : undefined;
    const playerCount = session.practice ? 4 : undefined;
    const game = session.practice ? { ...LumaraGame, setup: ({ ctx }: { ctx: { numPlayers: number } }) => createState(ctx.numPlayers, session.edition || 'party') } : LumaraGame;
    const human: TableConnection = session.transport === 'supabase' && !session.practice
      ? supabaseConnection(cardSupabase(), session.matchID, session.playerID, setTableError)
      : Client({ game, playerID: session.playerID, matchID: session.matchID, credentials: session.credentials,
        numPlayers: playerCount, multiplayer: local || SocketIO({ server: serverURL }), debug: false });
    const bots: GameClient[] = [];
    if (session.practice) for (let i = 1; i < 4; i++) bots.push(Client({ game, numPlayers: 4, playerID: String(i), matchID: session.matchID, multiplayer: local, debug: false }));
    // Bots wait after every table event so people can see who did what before the next move.
    let lastMoment = '', lastEventAt = 0;
    const off = human.subscribe(state => { if (state) { setG(state.G); onEdition(state.G.edition); setConnected(session.practice || state.isConnected); const moment = `${state.G.lastEvent?.id}|${state.G.current}|${state.G.owed}|${!!state.G.pending}|${state.G.stage?.type}`; if (moment !== lastMoment) { lastMoment = moment; lastEventAt = Date.now(); } } });
    human.start(); bots.forEach(bot => bot.start()); setClient(human);
    const botNames = ['Keira', 'Ayaka', 'Rook'];
    const timer = setInterval(() => {
      if (session.practice) {
        const state = human.getState()?.G;
        if (state?.phase === 'lobby') {
          if (!state.seats[0].ready) human.moves.act({ kind: 'seat', ...profile });
          bots.forEach((bot, i) => { if (!bot.getState()?.G.seats[i + 1].ready) bot.moves.act({ kind: 'seat', name: botNames[i], companion: botNames[i].toLowerCase() }); });
          if (state.seats.every(s => s.ready)) human.moves.act({ kind: 'start' });
        } else if (Date.now() - lastEventAt >= 1500 && Date.now() >= busyUntil.current) bots.some((bot, i) => { const state = bot.getState()?.G; const action = state && botAction(state, i + 1); if (action) bot.moves.act(action); return !!action; });
      }
    }, 700);
    return () => { clearInterval(timer); off(); human.stop(); bots.forEach(bot => bot.stop()); };
  }, [session.matchID, session.playerID, session.credentials, session.practice, session.transport]);
  useEffect(() => { setSelected([]); setTarget(''); }, [G?.current, !!G?.pending, G?.pending?.noped, G?.stage?.type]);
  useEffect(() => { setPosition(G?.deckSize || 0); }, [G?.stage?.type === 'defuse']);
  useEffect(() => { setFutureOrder(G?.future.map(c => c.id) || []); }, [G?.future.map(c => c.id).join(',')]);
  useEffect(() => {
    const ownStage = G?.stage?.actor === me;
    const mustRespond = G?.pending && G.alive[me] && !G.pending.passes.includes(me);
    if (!ownStage && !mustRespond) return;
    setArranging(false);
    const frame = requestAnimationFrame(() => {
      const panel = ownStage ? G?.stage?.type === 'favor' ? handSection.current : stageControls.current : responseControls.current;
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) panel.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [G?.stage?.type, G?.stage?.actor, !!G?.pending, G?.pending?.noped, me]);
  useEffect(() => {
    const rail = handRail.current;
    if (!rail) return;
    const update = () => setHandScroll({ left: rail.scrollLeft > 1, right: rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1 });
    update(); rail.addEventListener('scroll', update);
    const observer = new ResizeObserver(update); observer.observe(rail);
    return () => { rail.removeEventListener('scroll', update); observer.disconnect(); };
  }, [G?.phase, G?.hands[me]?.length]);
  const effect = useEffectQueue(G?.events, me, G?.seats.map(s => s.name) ?? [], busyUntil);
  // "You drew…" / "Rook took your…": from my own hand, never from public events (they carry no hidden cards).
  useEffect(() => {
    if (!G || G.phase !== 'playing') { prevHand.current = null; return; }
    const now = G.hands[me] || [], before = prevHand.current; prevHand.current = now;
    if (!before) return;
    const added = now.filter(c => !before.some(b => b.id === c.id));
    const lost = before.filter(b => !now.some(c => c.id === b.id) && !ownRemoved.current.has(b.id));
    const e = G.lastEvent, name = (i?: number | null) => i === undefined || i === null ? 'Someone' : G.seats[i].name;
    if (added.length === 1) setReveal({ key: Date.now(), card: added[0], lost: false, title: e?.kind === 'steal' && e.seat === me ? `You took this from ${name(e.other)}` : e?.kind === 'give' && e.other === me ? `${name(e.seat)} gave you` : 'You drew' });
    else if (lost.length === 1 && e?.kind !== 'defuse') setReveal({ key: Date.now(), card: lost[0], lost: true, title: e?.kind === 'steal' && e.other === me ? `${name(e.seat)} took your` : 'You lost' });
  }, [G?.phase, G?.hands[me]?.map(c => c.id).join(',')]);
  useEffect(() => { if (!reveal) return; const timer = setTimeout(() => setReveal(null), 2300); return () => clearTimeout(timer); }, [reveal?.key]);
  if (!G || !client) return <main className="loading-table"><Sparkles /><h1>Opening the table…</h1>{tableError ? <p className="error" role="alert">{tableError}</p> : <p>Connecting to your shared room.</p>}<button className="text-link" onClick={leave}>Back to rooms <ArrowLeft size={16} /></button></main>;
  const hand = G.hands[me] || [];
  const handLocked = !connected || !G.alive[me] || G.winner !== null || (G.stage?.type === 'steal' && G.stage.target === me);
  const movingIndex = hand.findIndex(c => c.id === movingCard);
  const reorderHand = (from: number, to: number) => {
    if (handLocked || from < 0 || to < 0 || from >= hand.length || to >= hand.length || from === to) return;
    const order = hand.map(c => c.id), [id] = order.splice(from, 1); order.splice(to, 0, id);
    client.moves.act({ kind: 'hand-order', order });
    setHandNotice(`${cardDefs[hand[from].type].title} moved to position ${to + 1}.`);
  };
  const shuffleHand = () => {
    if (handLocked) return;
    const order = hand.map(c => c.id);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    client.moves.act({ kind: 'hand-order', order }); setHandNotice('Your hand was shuffled.');
  };
  const chosen = selected.map(id => hand.find(c => c.id === id)).filter(Boolean) as Card[];
  const myTurn = G.current === me && !G.pending && !G.stage && G.phase === 'playing' && G.winner === null;
  const isGiving = G.stage?.type === 'favor' && G.stage.actor === me;
  const isStealing = G.stage?.type === 'steal' && G.stage.actor === me;
  const ownFuture = G.stage?.actor === me && ['future', 'alter'].includes(G.stage.type);
  const alteringFuture = ownFuture && G.stage?.type === 'alter';
  const single = chosen.length === 1 ? chosen[0].type : null;
  const needsTarget = chosen.length > 1 || single === 'favor' || single === 'targeted';
  const targets = G.seats.map((s, i) => ({ ...s, id: i })).filter(s => s.id !== me && G.alive[s.id] && (single === 'targeted' || G.counts[s.id] > 0));
  const concrete = chosen.filter(c => c.type !== 'wild');
  const matching = concrete.every(c => c.type === concrete[0]?.type) && (!chosen.some(c => c.type === 'wild') || !concrete.length || catTypes.includes(concrete[0].type));
  const playable = myTurn && (chosen.length > 1 ? matching : single && !['defuse', 'collapse', 'nope', 'wild', ...catTypes].includes(single)) && (!needsTarget || target !== '');
  const act = (action: Parameters<typeof client.moves.act>[0]) => {
    if (!connected) return;
    if (action.kind === 'play') action.ids.forEach((id: string) => ownRemoved.current.add(id));
    if (action.kind === 'give' || action.kind === 'nope') ownRemoved.current.add(action.id);
    client.moves.act(action); setSelected([]);
  };
  const toggle = (card: Card) => {
    if (arranging && !handLocked) { setMovingCard(card.id); return; }
    if (isGiving) { setSelected(ids => ids[0] === card.id ? [] : [card.id]); return; }
    if (G.pending && card.type === 'nope') { act({ kind: 'nope', id: card.id }); return; }
    setSelected(ids => ids.includes(card.id) ? ids.filter(id => id !== card.id) : [...ids.slice(-2), card.id]); setTarget('');
  };
  const copyRoom = async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setTableError('Copy the room code shown above and send it to your friends.'); } };
  const moveFuture = (index: number, delta: number) => setFutureOrder(ids => { const next = [...ids]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next; });
  const scrollHand = (direction: number) => handRail.current?.scrollBy({ left: direction * (handRail.current.clientWidth * .7), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const actorSeat = G.stage?.actor ?? G.pending?.actor ?? G.current;
  const who = (i: number) => i === me ? 'You' : G.seats[i].name;
  const responded = !!G.pending?.passes.includes(me);
  const status = isStealing ? 'Choose a face-down card' : G.winner !== null ? `${G.seats[G.winner].name} wins!` : G.phase === 'lobby' ? 'Gather your party' : !G.alive[me] ? 'Your light went out' : isGiving ? `Give a card to ${G.seats[G.stage!.recipient!].name}` : G.stage?.actor === me && G.stage.type === 'defuse' ? 'Your Defuse was used' : myTurn ? `Your turn${G.attacked ? ` · ${G.owed} turn${G.owed === 1 ? '' : 's'} left` : ''}` : ownFuture ? alteringFuture ? 'Alter the Future · your private view' : 'See the Future · your private view' : G.stage ? `${who(G.stage.actor)} ${G.stage.type === 'defuse' ? 'is returning an Exploding Kitten' : G.stage.type === 'favor' ? 'is choosing a gift' : G.stage.type === 'steal' ? 'is choosing a face-down card' : 'is viewing future cards'}` : G.pending ? `${who(G.pending.actor)} played ${G.pending.type === 'pair' ? 'a pair' : G.pending.type === 'trio' ? 'a trio' : ruleName(G.pending.type)}` : `${G.seats[G.current].name}’s turn`;
  const turnInstruction = isStealing ? 'Pick one hidden card from the hand below. Your turn continues afterward.' : !G.alive[me] ? 'You are out. Watch the remaining players.' : isGiving ? 'Pick a card in your hand, then press Give.' : ownFuture ? alteringFuture ? 'Arrange the next cards, then set this order.' : 'Inspect the next cards, then return to your turn.' : G.stage?.actor === me && G.stage.type === 'defuse' ? 'Choose a secret deck position below, then return the Exploding Kitten.' : myTurn ? 'Click an action card, then Play. Drawing ends one turn.' : G.pending ? G.pending.noped ? 'It was cancelled. Another Nope brings it back.' : responded ? 'Waiting for anyone holding a Nope to decide.' : 'You hold a Nope: cancel this action, or allow it.' : G.stage ? 'Wait for that player to finish their private action.' : `${G.seats[G.current].name} is choosing what to do.`;
  const protections = hand.filter(c => c.type === 'defuse').length;
  const nope = hand.find(c => c.type === 'nope');
  // No timer: the game waits only for players holding a Nope, and never says who they are.
  const canMoveOn = !session.practice && me === 0 && !!G.pending && G.pending.actor !== 0 && responded;
  const odds = danger(G);
  const tips = [
    { id: 'respond', when: !!G.pending && !responded && !!nope, text: 'Someone played a card and you hold a Nope. Press “Nope” to cancel it, or “Allow action” to let it happen.' },
    { id: 'bomb', when: ['explode', 'defuse'].includes(G.lastEvent?.kind ?? ''), text: 'A World Collapse was drawn! Dawn’s Protection saves you once; without it you’re out. The meter under the draw pile shows your odds.' },
    { id: 'goal', when: G.winner === null && G.alive[me], text: 'Goal: don’t draw a World Collapse without Dawn’s Protection. The last player standing wins.' },
    { id: 'turn', when: myTurn, text: 'Your turn! Play action cards if you want (optional), then draw a card to end your turn. Cards marked “Needs a pair” only work in matching pairs.' },
    { id: 'pair', when: myTurn && hand.some(c => cardHint(c, hand, { myTurn, canRespond: false }).tag === 'Pair ready'), text: 'You have a matching pair! Select both cards, choose a player, then choose one face-down card from their hand.' },
  ];
  const tip = tips.find(t => t.when && !tipsSeen.includes(t.id));
  const top = G.discard[G.discard.length - 1];
  const pendingTitle = G.pending ? `${who(G.pending.actor)} played ${G.pending.type === 'pair' ? 'a matching pair' : G.pending.type === 'trio' ? 'a matching trio' : `${cardDefs[G.pending.type].title} (${ruleName(G.pending.type)})`}${G.pending.target !== undefined && ['favor', 'targeted'].includes(G.pending.type) ? ` on ${G.pending.target === me ? 'you' : G.seats[G.pending.target].name}` : ''}` : '';
  const pendingText = !G.pending ? '' : G.pending.noped ? 'Cancelled with Nope. Another Nope brings it back.' : G.pending.type === 'pair' ? `Choose one face-down card from ${G.seats[G.pending.target!].name} after responses finish.` : G.pending.type === 'trio' ? `Asks ${G.seats[G.pending.target!].name} for ${cardDefs[G.pending.request!].title}.` : cardDefs[G.pending.type].text;
  const selectionText = selectionAdvice(chosen, matching, needsTarget, target);
  const hint = isStealing ? 'Choose one face-down card above.' : arranging && !handLocked ? 'Arrange your hand. This does not use a turn.' : isGiving ? `Choose a card to give ${G.seats[G.stage!.recipient!].name}.` : ownFuture ? alteringFuture ? 'Arrange the future cards above.' : 'Inspect the future cards above.' : G.stage?.actor === me ? 'Choose where the Collapse goes back into the deck, above.' : G.stage ? `Waiting for ${G.seats[G.stage.actor].name}…` : myTurn ? 'Pick a card to play, or draw to end your turn.' : `Waiting for ${G.seats[G.current].name}. Look through your hand while you wait.`;
  return <main className={`game-table ${G.phase === 'playing' ? 'immersive-table' : ''}`}>
    <div className="table-top"><button className="text-link" onClick={leave}><ArrowLeft size={16} /> Rooms</button><div className="room-info">{session.practice ? 'Practice · three bots' : <>Room <strong>{session.matchID}</strong><button className="icon-button" onClick={() => void copyRoom()} aria-label="Copy room invitation">{copied ? <Check size={17} /> : <Copy size={17} />}</button></>}<span>{G.edition === 'party' ? 'Party Pack' : 'Original'}</span></div><span className={`connection ${connected ? '' : 'disconnected'}`}>{connected ? <Wifi size={15} /> : <WifiOff size={15} />}{connected ? session.practice ? 'Offline practice' : 'Connected' : 'Reconnecting…'}</span></div>
    {tableError && <p role="alert" className="error">{tableError}</p>}
    <div className="opponent-row">{G.seats.map((seat, i) => i !== me && <div key={i} className={`opponent ${G.current === i && G.phase === 'playing' ? 'active' : ''} ${!G.alive[i] ? 'eliminated' : ''}`}><img src={companionFor(seat.companion).art} alt="" /><div><strong>{seat.name}</strong><span>{G.phase === 'lobby' ? seat.ready ? 'Ready' : 'Choosing a companion' : G.alive[i] ? `${G.counts[i]} cards` : 'Light extinguished'}</span></div>{G.phase === 'lobby' && seat.ready && <Check size={16} />}</div>)}</div>
    <section className={`table-arena ${G.phase === 'playing' ? 'playing-arena' : ''} ${myTurn ? 'your-turn' : ''}`} aria-label="Card table">
      <div className={`turn-heading ${actorSeat === me && G.winner === null ? 'mine' : ''}`}>{G.phase === 'playing' && <img className="turn-companion" src={companionFor(G.seats[G.winner ?? actorSeat].companion).art} alt="" />}<div><h1>{status}</h1>{G.phase === 'playing' && G.winner === null && <p>{turnInstruction}</p>}</div></div>
      {G.phase === 'lobby' ? <div className="waiting-party"><Shield size={40} /><p>Share the room link. Everyone chooses a companion and readies up.</p>{!G.seats[me].ready ? <button className="button primary" disabled={!connected} onClick={() => act({ kind: 'seat', ...profile })}>Ready with {companionFor(profile.companion).name} <Check size={17} /></button> : <span className="ready-label"><Check size={18} /> You’re ready</span>}{me === 0 && <button className="button primary" disabled={!connected || !G.seats.every(s => s.ready)} onClick={() => act({ kind: 'start' })}>Deal the cards <ArrowRight size={17} /></button>}</div> : <>
        <TableScene game={G} me={me} effect={effect}><div className="piles"><div className="draw-pile"><button className="deck-button" onClick={() => act({ kind: 'draw' })} disabled={!myTurn || !connected} aria-label="Draw a card"><CardFace back /></button><span>Draw pile · {G.deckSize}</span>{G.winner === null && <span className={`danger-meter ${odds.level}`} title="Chance that the next card drawn is a World Collapse"><Bomb size={13} /> {odds.bombs} Collapse{odds.bombs === 1 ? '' : 's'} inside{odds.oneIn ? ` · 1 in ${odds.oneIn}` : ''}</span>}</div><div className="discard-pile">{top ? <div key={top.id} className="just-played"><CardFace card={top} /></div> : <div className="empty-discard"><Swords size={26} /><span>No cards<br />played yet.</span></div>}<span>Discard pile</span></div></div></TableScene>
        <aside className="table-situation" aria-label="Table summary"><p className="players-left"><Users size={16} /> {G.alive.filter(Boolean).length} {G.alive.filter(Boolean).length === 1 ? 'player' : 'players'} remaining</p><p className="goal-line">Don’t draw a World Collapse without Protection. Last one standing wins.</p><h2>Recent plays</h2><ol className="recent-plays">{G.log.slice(0, 3).map((line, i) => <li key={(G.lastEvent?.id ?? 0) - i}>{line}</li>)}</ol></aside>
        {G.pending && G.alive[me] && <div className="response-bar" ref={responseControls}>{top && <img className="action-thumb" src={companionFor(cardDefs[G.pending.type === 'pair' || G.pending.type === 'trio' ? top.type : G.pending.type].companion).art} alt="" />}<div><strong>{pendingTitle}</strong><span>{pendingText}</span></div>{responded ? <span className="waiting-on">Waiting for anyone holding a Nope…</span> : <>{nope && <button className="button primary" disabled={!connected} onClick={() => act({ kind: 'nope', id: nope.id })}>{G.pending.noped ? 'Nope · restore action' : 'Nope · cancel action'}</button>}<button className="button secondary" disabled={!connected} onClick={() => act({ kind: 'pass' })}>Allow action</button></>}{canMoveOn && <button className="button secondary" title="Use this if someone is away and the game is stuck" onClick={() => act({ kind: 'force' })}>Move on</button>}</div>}
        {G.stage?.type === 'defuse' && G.stage.actor === me && <section className="special-action" ref={stageControls}><h2>You survived. Now leave a surprise.</h2><label className="field">Secret position in the deck<select value={position} onChange={e => setPosition(Number(e.target.value))}>{Array.from({ length: G.deckSize + 1 }, (_, i) => <option value={i} key={i}>{i === 0 ? 'Top · next card drawn' : i === G.deckSize ? 'Bottom · last card drawn' : `${i} cards from the top`}</option>)}</select></label><button className="button primary" disabled={!connected} onClick={() => act({ kind: 'defuse', position })}>Return the Collapse <Shield size={17} /></button></section>}
        {isStealing && <section className="special-action steal-action" ref={stageControls} aria-label="Choose a card to steal">
          <h2>Choose a card from {G.seats[G.stage!.target!].name}</h2>
          <p>Their cards stay face down. Pick one to keep.</p>
          <div className="steal-card-rail">{Array.from({ length: G.counts[G.stage!.target!] }, (_, index) => <button key={index} className="steal-card" disabled={!connected} aria-label={`Steal face-down card ${index + 1} of ${G.counts[G.stage!.target!]}`} onClick={() => act({ kind: 'steal', index })}><CardFace back/><span>Card {index + 1}</span></button>)}</div>
        </section>}
        {G.stage?.actor === me && ['future', 'alter'].includes(G.stage.type) && <section className="future-action" ref={stageControls}><h2>{G.stage.type === 'alter' ? 'Rewrite the next three cards' : 'A glimpse of what comes next'}</h2><p>Only you can see these. The first card is drawn next.</p><div className="future-cards">{futureOrder.map((id, i) => { const card = G.future.find(c => c.id === id); return card && <div key={id}><span>{i === 0 ? 'Next draw' : `${i + 1} in deck`}</span><CardFace card={card} small />{G.stage?.type === 'alter' && <div className="reorder-buttons"><button className="icon-button" disabled={i === 0} onClick={() => moveFuture(i, -1)} aria-label={`Move card ${i + 1} earlier`}><ArrowUp size={17} /></button><button className="icon-button" disabled={i === futureOrder.length - 1} onClick={() => moveFuture(i, 1)} aria-label={`Move card ${i + 1} later`}><ArrowDown size={17} /></button></div>}</div>; })}</div><button className="button primary" disabled={!connected} onClick={() => act({ kind: 'future', order: futureOrder })}>{G.stage.type === 'alter' ? 'Set this order' : 'Return to my turn'}<ArrowRight size={17} /></button></section>}
        {isGiving && <div className="gift-instruction"><img src={companionFor(G.seats[G.stage!.recipient!].companion).art} alt="" /><div><h2>{G.seats[G.stage!.recipient!].name} played Curious Bargain on you</h2><p>You must give {G.seats[G.stage!.recipient!].name} one card of your choice.</p><ol><li className={chosen.length ? 'done' : ''}>Click a card in your hand</li><li>Press <strong>Give to {G.seats[G.stage!.recipient!].name}</strong></li></ol></div></div>}
        {G.winner !== null && <div className="winner-banner"><Sparkles size={26} /><p>One more round? Someone deserves a rematch.</p><button className="button primary" onClick={leave}><RotateCcw size={17} /> Back to rooms</button></div>}
      </>}
    </section>
    {G.phase === 'playing' && <section className={`hand-section ${isGiving ? 'giving' : ''}`} aria-label="Your private hand" ref={handSection}>
      <div className="hand-heading"><div className={`you-plate ${actorSeat === me && G.winner === null ? 'active' : ''}`}><img src={companionFor(G.seats[me].companion).art} alt="" /><div><strong>{G.seats[me].name} · {companionFor(G.seats[me].companion).name}</strong><span className="you-badge">You</span><span className={protections ? 'protected-hand' : 'unprotected-hand'}><Shield size={14} /> {!G.alive[me] ? 'Out of the round' : protections ? `Protection ready${protections > 1 ? ` ×${protections}` : ''}` : 'No Protection'}</span></div></div><div className="hand-tools"><span className="hand-hint">{hint}</span><div className="hand-scroll"><button className="icon-button" onClick={() => scrollHand(-1)} disabled={!handScroll.left} aria-label="Scroll hand left"><ArrowLeft size={18} /></button><button className="icon-button" onClick={() => scrollHand(1)} disabled={!handScroll.right} aria-label="Scroll hand right"><ArrowRight size={18} /></button></div></div></div>
      <HandControls arranging={arranging} locked={handLocked} offered={G.stage?.type === 'steal' && G.stage.target === me} count={hand.length} cardName={movingIndex < 0 ? null : cardDefs[hand[movingIndex].type].title} index={movingIndex} onToggle={() => { setArranging(!arranging); setSelected([]); setMovingCard(null); }} onShuffle={shuffleHand} onMove={delta => reorderHand(movingIndex, movingIndex + delta)}/><p className="sr-only" role="status">{handNotice}</p>
      <div className="hand-cards" ref={handRail} style={{ '--n': hand.length } as CSSProperties}>{hand.map((card, index) => { const hint = cardHint(card, hand, { myTurn, canRespond: !!G.pending && !responded && G.alive[me] }); return <button key={card.id} className={`hand-card ${(arranging ? movingCard === card.id : selected.includes(card.id)) ? 'selected' : ''} ${myTurn && !hint.playable ? 'unplayable' : ''} ${hint.playable && (hint.tag === 'Pair ready' || hint.tag === 'Use it now') ? 'tag-go' : ''}`} style={{ '--i': index - (hand.length - 1) / 2, '--fan-angle': `${Math.max(-3, Math.min(3, (index - (hand.length - 1) / 2) * 1.2))}deg` } as CSSProperties} aria-label={`${cardDefs[card.type].title} — ${cardDefs[card.type].rule}${hint.tag ? ` — ${hint.tag}` : ''}`} aria-pressed={arranging ? movingCard === card.id : selected.includes(card.id)} data-card-id={card.id} draggable={arranging && !handLocked}
        onDragStart={event => { draggedCard.current = card.id; event.dataTransfer.setData('text/plain', card.id); event.dataTransfer.effectAllowed = 'move'; setMovingCard(card.id); }}
        onDragEnd={() => { draggedCard.current = null; }} onDragOver={event => { if (arranging && !handLocked) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }}
        onDrop={event => { if (!arranging || handLocked) return; event.preventDefault(); reorderHand(hand.findIndex(c => c.id === draggedCard.current), index); draggedCard.current = null; }}
        onKeyDown={event => { if (arranging && !handLocked && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); setMovingCard(card.id); reorderHand(index, index + (event.key === 'ArrowLeft' ? -1 : 1)); } }}
        onClick={() => toggle(card)} disabled={!connected || !G.alive[me] || G.winner !== null}><CardFace card={card} />{hint.tag && <span className="card-tag">{hint.tag}</span>}{(arranging ? movingCard === card.id : selected.includes(card.id)) && <span className="selection-mark"><Check size={16} /></span>}</button>; })}{!hand.length && <p className="empty-hand">{G.alive[me] ? 'No cards left in your hand. You can still draw on your turn.' : 'Your companions await the next round.'}</p>}</div>
      {G.alive[me] && G.winner === null && !G.pending && <div className={`hand-actions ${myTurn || G.stage?.actor === me ? '' : 'waiting'}`}>{arranging && !handLocked ? <p>Choose a card, then use the arrows to move it. Press Done arranging to play.</p> : isGiving ? chosen.length ? <><img className="action-thumb" src={companionFor(cardDefs[chosen[0].type].companion).art} alt="" /><div className="selection-summary"><strong>Give {cardDefs[chosen[0].type].title}?</strong><span>{G.seats[G.stage!.recipient!].name} gets this card. You can still pick a different one.</span></div><button className="button primary" disabled={!connected} onClick={() => act({ kind: 'give', id: chosen[0].id })}><Gift size={17} /> Give to {G.seats[G.stage!.recipient!].name}</button><button className="icon-button" onClick={() => setSelected([])} aria-label="Clear card selection"><X size={17} /></button></> : <p>Click a card in your hand to give it to {G.seats[G.stage!.recipient!].name}.</p> : myTurn && chosen.length > 0 ? <><img className="action-thumb" src={companionFor(cardDefs[chosen[0].type].companion).art} alt="" /><div className="selection-summary"><strong>{chosen.length > 1 ? `${chosen.length === 2 ? 'Pair' : 'Trio'} · ${matching ? 'matching cards' : 'choose matching cards'}` : cardDefs[chosen[0].type].title}</strong><span id="selection-advice" role="status">{selectionText}</span></div>{needsTarget && matching && <label className="field compact-field">Target<select value={target} onChange={e => setTarget(e.target.value)}><option value="">Choose a player</option>{targets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}{chosen.length === 3 && <label className="field compact-field">Request<select value={requested} onChange={e => setRequested(e.target.value as CardType)}>{Object.entries(cardDefs).filter(([type]) => type !== 'collapse' && (G.edition === 'party' || !['targeted', 'alter', 'bottom', 'wild'].includes(type))).map(([type, def]) => <option key={type} value={type}>{def.title}</option>)}</select></label>}<button className="button primary" aria-describedby="selection-advice" disabled={!playable || !connected} onClick={() => act({ kind: 'play', ids: selected, target: target === '' ? undefined : Number(target), request: requested })}><Sparkles size={17} /> Play {chosen.length > 1 ? chosen.length === 2 ? 'pair' : 'trio' : ruleName(chosen[0].type)}</button><button className="button secondary draw-button" disabled={!connected} onClick={() => act({ kind: 'draw' })}><Layers size={17} /> {G.attacked ? 'Draw · take one turn' : 'Draw & end turn'}</button><button className="icon-button" onClick={() => setSelected([])} aria-label="Clear card selection"><X size={17} /></button></> : <><p>{hint}</p>{myTurn && <button className="button primary" disabled={!connected} onClick={() => act({ kind: 'draw' })}><Layers size={17} /> {G.attacked ? 'Draw · take one turn' : 'Draw & end turn'}</button>}</>}</div>}
    </section>}
    {reveal && <div key={reveal.key} className={`draw-reveal ${reveal.lost ? 'lost' : ''}`} role="status"><span>{reveal.title}</span><CardFace card={reveal.card} /></div>}
    {tip && G.phase === 'playing' && <aside className="coach-tip" aria-label="Tip"><Lightbulb size={18} /><p>{tip.text}</p><div><button className="button primary" onClick={() => seeTips([tip.id])}>Got it</button><button className="text-link" onClick={() => seeTips(tips.map(t => t.id))}>Hide all tips</button></div></aside>}
    <details className="table-log"><summary>At the table</summary><ol>{G.log.map((line, i) => <li key={`${line}-${i}`}>{line}</li>)}</ol></details><p className="sr-only" role="status" aria-live="polite">{G.log[0]}</p>
  </main>;
}

