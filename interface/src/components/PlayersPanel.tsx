import { useState } from 'react';
import { Gem, Gift, Sparkles } from 'lucide-react';
import { useUI } from '../App';
import type { Currency } from '../backend/types';
import { starlightBalance, stardustBalance } from '../logic';
import { Button } from './ui';
import './players-panel.css';

export default function PlayersPanel() {
  const { players, profiles, me, session, attendance, allAttendance, vows, settings, backend, busy, run } = useUI();
  const [selectedId, setSelectedId] = useState('');
  const [currency, setCurrency] = useState<Currency>('starlight');
  const [amount, setAmount] = useState('200');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const visible = players.filter(p => me.isAdmin || attendance.some(a => a.userId === p.userId));
  const selected = visible.find(p => p.userId === selectedId) || visible.find(p => p.userId !== me.id) || visible[0];
  const name = (id: string) => id === me.id ? me.name : profiles[id]?.name || 'Teammate';
  const currencyName = currency === 'starlight' ? 'Starlight' : 'Stardust';
  const grants = (selected?.currencyGrants || []).slice(-5).reverse();
  if (!me.isAdmin && session?.wardenId !== me.id) return null;
  return <section className="warden-players" aria-labelledby="players-title">
    <h2 id="players-title">Players</h2><p className="players-description">{me.isAdmin ? 'Choose a player to view their balance and give currency.' : 'Manage currency gifts for players in your current party.'}</p>
    {!visible.length ? <p className="players-empty">No players have joined this party yet.</p> : <div className="players-workspace">
      <div className="players-list" aria-label="Player balances">{visible.map(p => {
        const light = starlightBalance({userId:p.userId,attendance:allAttendance,vows,player:p,settings});
        const dust = stardustBalance({player:p,settings});
        const inParty = attendance.some(a => a.userId === p.userId);
        return <button type="button" className="player-balance-row" key={p.userId} aria-pressed={selected?.userId === p.userId} aria-label={`Select player ${name(p.userId)}`} onClick={() => {setSelectedId(p.userId);setError('');setMessage('');}}>
          <span className="player-row-name"><strong>{name(p.userId)}</strong><small>{p.userId === me.id ? 'You' : inParty ? 'In the party' : 'Player'}</small></span>
          <span className="player-row-currency"><span><Sparkles size={14} />{light.toLocaleString()}<small>Starlight</small></span><span><Gem size={14} />{dust.toLocaleString()}<small>Stardust</small></span></span>
        </button>;
      })}</div>
      {selected && <div className="player-grants"><form className="currency-gift" noValidate onSubmit={e => {
        e.preventDefault(); setError('');setMessage(''); const value = Number(amount);
        if (!Number.isSafeInteger(value) || value < 1 || value > 1000000) {setError('Enter a whole amount between 1 and 1,000,000.');return;}
        const recipient = selected.userId, recipientName = name(recipient), givenCurrency = currencyName;
        void run(async () => {
          try {await backend.grantCurrency(recipient,currency,value);setMessage(`${value.toLocaleString()} ${givenCurrency} given to ${recipientName}.`);}
          catch (e) {setError(e instanceof Error ? e.message : 'Could not give currency. Try again.');throw e;}
        });
      }}>
        <h3>Give currency to {name(selected.userId)}</h3>
        <label>Currency<select aria-label="Currency" value={currency} onChange={e => {setCurrency(e.target.value as Currency);setError('');setMessage('');}}><option value="starlight">Starlight — wishes</option><option value="stardust">Stardust — exchange</option></select></label>
        <label>Amount<input type="number" min="1" max="1000000" step="1" value={amount} onChange={e => {setAmount(e.target.value);setError('');setMessage('');}} /></label>
        {error && <p className="gift-error" role="alert">{error}</p>}
        {message && <p className="gift-message" role="status">{message}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Giving…' : `Give ${currencyName}`}<Gift size={16} /></Button>
      </form>
      {grants.length > 0 && <div className="currency-grant-history"><h3>Recent gifts</h3><ul>{grants.map(g => <li key={g.id}><strong>+{g.amount.toLocaleString()} {g.currency === 'starlight' ? 'Starlight' : 'Stardust'}</strong><span>From {name(g.byUserId)} · {new Date(g.at).toLocaleDateString()}</span></li>)}</ul></div>}
      </div>}
    </div>}
  </section>;
}
