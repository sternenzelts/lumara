import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { MILESTONES, REWARD, launchState, milestoneLamps, preregister, savedName, waitingCount } from './prereg-logic';

/** Pre-registration before launch (countdown, reward, Wardens waiting); "Play now" after launch. */
export default function Preregister({ background, emblem }: { background: string; emblem: ReactNode }) {
  const [now, setNow] = useState(() => new Date());
  const [name, setName] = useState('');
  const [done, setDone] = useState<string | null>(savedName);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => { waitingCount().then(setCount); }, [done]);
  const s = launchState(now);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    try { setDone(await preregister(name)); } catch (err) { setError((err as Error).message); }
  };
  return <section className="closing prereg" id="preregister" aria-labelledby="prereg-title">
    <div className="closing-art" aria-hidden="true" style={{ backgroundImage: `url("${background}")` }} />
    <div className="closing-content prereg-panel">
      {emblem}
      {s.live ? <>
        <h2 id="prereg-title">The first voyage <em>has begun.</em></h2>
        <a className="button button-primary" href="./play/">Play now <ArrowRight size={18} /></a>
      </> : <>
        <h2 id="prereg-title">Pre-register for the <em>first voyage.</em></h2>
        <div className="prereg-countdown" aria-label={`${s.days} days ${s.hours} hours ${s.minutes} minutes until launch`}>
          {([[s.days, 'Days'], [s.hours, 'Hours'], [s.minutes, 'Minutes']] as const).map(([v, l]) =>
            <div key={l}><strong>{String(v).padStart(2, '0')}</strong><span>{l}</span></div>)}
        </div>
        <p className="prereg-reward"><strong>{REWARD.toLocaleString()} Starlight</strong> waits for every Warden on 16 October.</p>
        {done
          ? <p className="prereg-done" role="status">You&apos;re registered, <strong>{done}</strong>. See you on 16 October.</p>
          : <form className="prereg-form" onSubmit={submit}>
            <label className="sr-only" htmlFor="prereg-name">Your Warden name</label>
            <input id="prereg-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your Warden name" maxLength={16} autoComplete="nickname" />
            <button className="button button-primary" type="submit">Pre-register <ArrowRight size={18} /></button>
            {error && <p className="prereg-error" role="alert">{error}</p>}
          </form>}
        <div className="prereg-milestones" aria-label={`${count} Wardens waiting`}>
          <span><strong>{count}</strong> Wardens waiting</span>
          <div>{MILESTONES.map((m, i) => <i key={m} className={i < milestoneLamps(count) ? 'lit' : ''} title={`${m} Wardens: +200 Starlight for everyone`}><b>{m}</b></i>)}</div>
        </div>
      </>}
    </div>
  </section>;
}
