import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CHARACTERS, GAME_NAME, characterById } from '../data/characters';
import { SANCTUARY_BACKGROUND } from '../data/art';
import { Art, Button } from './ui';

/** First visit online: one tap creates this browser's Warden, then the usual intro and nickname follow. */
export default function StartScreen({ onStart }: { onStart: () => Promise<void> }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const seren = characterById('seren') || CHARACTERS[0];
  const go = async () => { setBusy(true); setErr(''); try { await onStart(); } catch (e) { setErr((e as Error).message || 'Could not reach the Sanctuary.'); setBusy(false); } };
  return <main id="main" className="title-screen start-screen">
    <img className="title-backdrop" src={SANCTUARY_BACKGROUND} alt="" /><div className="title-wash" />
    <header className="title-header"><span className="title-wordmark"><Sparkles size={23} strokeWidth={1} />{GAME_NAME}</span></header>
    <div className="title-orbit" aria-hidden="true" /><Art character={seren} kind="cutout" className="title-character" decorative />
    <div className="title-content"><h1>Every voyage<br />leaves a little light.</h1><p>Your Warden lives in this browser.</p>
      <div className="title-actions"><Button disabled={busy} onClick={go}>{busy ? 'Opening the gate…' : 'Start your voyage'}<ArrowRight size={18} /></Button></div>
      {err && <p role="alert" className="start-error">{err}</p>}</div>
  </main>;
}
