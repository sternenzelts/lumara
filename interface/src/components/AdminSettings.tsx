import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, RotateCcw } from 'lucide-react';
import { useUI } from '../App';
import type { Settings } from '../backend/types';
import { CHARACTERS } from '../data/characters';
import { Button } from './ui';
import PlayersPanel from './PlayersPanel';
import './admin-settings.css';

const GROUPS = [['players', 'Players'], ['voyage', 'Voyage'], ['rates', 'Wish rates'], ['starlight', 'Starlight'], ['stardust', 'Stardust']] as const;
type Group = typeof GROUPS[number][0];
const STARLIGHT = { start: 'Starting Starlight', attend: 'Attending a retro', perVote: 'Each vote cast', perVow: 'Each fulfilled Vow', pullCost: 'Cost per wish' };
const STARDUST = { dupeA: 'A duplicate reward', dupeSPlus: 'S+ duplicate reward', dupeSPlusPlus: 'S++ duplicate reward', costA: 'A exchange cost', costSPlus: 'S+ exchange cost', costSPlusPlus: 'S++ exchange cost' };

export default function AdminSettings() {
  const { settings, backend, run, busy, me, session } = useUI();
  const [draft, setDraft] = useState<Settings>(() => structuredClone(settings));
  const [group, setGroup] = useState<Group>('players');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setDraft(structuredClone(settings)); }, [JSON.stringify(settings)]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const playerView = new URL(location.href);
  playerView.searchParams.set('player', 'teammate-preview');
  playerView.hash = 'title';
  const change = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setDraft(d => ({ ...d, [key]: value })); setError(null); setSaved(false);
  };
  if (!me.isAdmin) return session?.wardenId === me.id ? <div className="admin-settings"><div className="admin-content"><PlayersPanel /></div></div> : null;
  const categories = <nav className="admin-categories" aria-label="Settings categories">{GROUPS.map(([id, label]) =>
    <button type="button" key={id} aria-pressed={group === id} aria-controls={id === 'players' ? 'admin-players' : `admin-${id}`} onClick={() => setGroup(id)}>{label}</button>)}</nav>;
  const preview = backend.mode === 'local' && <div className="admin-preview"><p>See the game as a teammate.</p><a href={playerView.href} target="_blank" rel="noopener noreferrer">Player view<ArrowUpRight size={16} /></a></div>;
  if (group === 'players') return <div className="admin-settings">{preview}{categories}<div id="admin-players" className="admin-content"><PlayersPanel /></div></div>;
  const save = () => {
    const rates = Object.values(draft.rates);
    if (rates.some(n => !Number.isFinite(n) || n < 0) || rates.reduce((a, b) => a + b, 0) > 1) {
      setGroup('rates'); setError('S++ and S+ rates must total 100% or less.'); return;
    }
    if ([draft.pity.sPlus, draft.pity.sPlusPlus].some(n => !Number.isInteger(n) || n < 1)) {
      setGroup('rates'); setError('Pity thresholds must be whole numbers of at least 1 wish.'); return;
    }
    for (const currency of ['starlight', 'stardust'] as const) {
      if (Object.values(draft[currency]).some(n => !Number.isInteger(n) || n < 0) || (currency === 'starlight' && draft.starlight.pullCost < 1)) {
        setGroup(currency); setError('Enter non-negative whole currency values. A wish must cost at least 1 Starlight.'); return;
      }
    }
    void run(async () => {
      try { await backend.saveSettings(draft); setSaved(true); setError(null); }
      catch (e) { setError(e instanceof Error ? e.message : 'Could not save settings. Try again.'); throw e; }
    }, 'Settings saved.');
  };
  return <form className="settings-form admin-settings" noValidate onSubmit={e => { e.preventDefault(); save(); }}>
    {preview}
    {categories}
    {error && <p className="admin-error" role="alert">{error}</p>}
    <div className="admin-content">
      <section id="admin-voyage" hidden={group !== 'voyage'} aria-labelledby="admin-voyage-title">
        <h2 id="admin-voyage-title">Voyage rules</h2><p className="admin-description">Choose how the party receives companions and moves through a retro.</p>
        <div className="settings-grid">
          <label>Opening pull mode<select value={draft.pullMode} onChange={e => change('pullMode', e.target.value as Settings['pullMode'])}><option value="fresh">Fresh pull every retro</option><option value="keep">Keep last companion</option><option value="choose">Choose from collection</option></select></label>
          <label>Featured character<select value={draft.featuredCharacterId} onChange={e => change('featuredCharacterId', e.target.value)}>{CHARACTERS.filter(c => c.grade !== 'A').map(c => <option key={c.id} value={c.id}>{c.name} · {c.grade}</option>)}</select><small>All three S++ wish banners remain available.</small></label>
        </div>
        <div className="settings-toggles">
          <Toggle label="Character movement" description="Companion scene preference. Sanctuary keeps Seren as your guide." checked={draft.movement} onChange={v => change('movement', v)} />
          <Toggle label="Skip Vow review" description="Go from the opening pull directly to writing thoughts." checked={draft.skipVowReview} onChange={v => change('skipVowReview', v)} />
        </div>
      </section>
      <section id="admin-rates" hidden={group !== 'rates'} aria-labelledby="admin-rates-title">
        <h2 id="admin-rates-title">Wish rates & guarantees</h2><p className="admin-description">Rates and pity are shared across the three banners.</p>
        <div className="settings-grid">
          <label>S++ rate (%)<input type="number" min="0" max="100" step="0.1" value={Number((draft.rates.sPlusPlus * 100).toFixed(4))} onChange={e => change('rates', { ...draft.rates, sPlusPlus: Number(e.target.value) / 100 })} /></label>
          <label>S+ rate (%)<input type="number" min="0" max="100" step="0.1" value={Number((draft.rates.sPlus * 100).toFixed(4))} onChange={e => change('rates', { ...draft.rates, sPlus: Number(e.target.value) / 100 })} /></label>
          <label>S+ guarantee (wishes)<input type="number" min="1" step="1" value={draft.pity.sPlus} onChange={e => change('pity', { ...draft.pity, sPlus: Number(e.target.value) })} /></label>
          <label>S++ guarantee (wishes)<input type="number" min="1" step="1" value={draft.pity.sPlusPlus} onChange={e => change('pity', { ...draft.pity, sPlusPlus: Number(e.target.value) })} /></label>
        </div>
        <p className="admin-rate-note">A rate: {Math.max(0, Number(((1 - draft.rates.sPlus - draft.rates.sPlusPlus) * 100).toFixed(2)))}% · remaining probability</p>
        <Toggle label="Pity guarantees" description="Enable guaranteed S+ and S++ companions at these thresholds." checked={draft.pity.enabled} onChange={v => change('pity', { ...draft.pity, enabled: v })} />
      </section>
      <section id="admin-starlight" hidden={group !== 'starlight'} aria-labelledby="admin-starlight-title">
        <h2 id="admin-starlight-title">Starlight</h2><p className="admin-description">Set the starting balance, rewards, and cost of a wish.</p>
        <div className="settings-grid">{(Object.keys(STARLIGHT) as (keyof Settings['starlight'])[]).map(key => <label key={key}>{STARLIGHT[key]}<input type="number" step="1" min={key === 'pullCost' ? 1 : 0} value={draft.starlight[key]} onChange={e => change('starlight', { ...draft.starlight, [key]: Number(e.target.value) })} /></label>)}</div>
      </section>
      <section id="admin-stardust" hidden={group !== 'stardust'} aria-labelledby="admin-stardust-title">
        <h2 id="admin-stardust-title">Stardust</h2><p className="admin-description">Set duplicate rewards and the cost of exchanging for a companion.</p>
        <div className="settings-grid">{(Object.keys(STARDUST) as (keyof Settings['stardust'])[]).map(key => <label key={key}>{STARDUST[key]}<input type="number" step="1" min="0" value={draft.stardust[key]} onChange={e => change('stardust', { ...draft.stardust, [key]: Number(e.target.value) })} /></label>)}</div>
      </section>
    </div>
    <footer className="admin-save"><p role="status">{dirty ? 'Unsaved changes' : saved ? 'Settings saved' : 'All changes saved'}</p><div>
      <Button secondary disabled={!dirty || busy} onClick={() => { setDraft(structuredClone(settings)); setError(null); setSaved(false); }}><RotateCcw size={15} />Discard</Button>
      <Button type="submit" disabled={!dirty || busy}>{busy ? 'Saving…' : 'Save settings'}<Check size={16} /></Button>
    </div></footer>
  </form>;
}
function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="toggle-row"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" aria-label={label} checked={checked} onChange={e => onChange(e.target.checked)} /><span className="toggle-track" aria-hidden="true" /></label>;
}
