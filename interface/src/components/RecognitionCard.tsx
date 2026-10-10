import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { characterById } from '../data/characters';
import { RECOGNITION } from '../data/recognitionLines';
import { VOICE_LINES } from '../data/voiceLines';
import { voiceSrc } from '../logic/chatter';
import { cardFileName, renderCardImage, saveCanvas } from '../logic/reportImage';
import { readSerenMuted } from '../logic/voice';
import { Art } from './ui';
import './report.css';

/** Personal recognition card (feature 7). Never shows how many thoughts or votes this player gave. */
export default function RecognitionCard({ characterId, nickname, sprintName, starlight, date, onClose }: { characterId: string | null; nickname: string; sprintName: string; starlight: number | null; date: number; onClose: () => void }) {
  const id = characterId && RECOGNITION[characterId] ? characterId : 'seren'; const line = RECOGNITION[id]; const character = characterById(id);
  const voiced = VOICE_LINES[id]?.find(l => l.id === line.clip)?.text; const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (readSerenMuted()) return;
    try { const a = new Audio(voiceSrc(id, line.clip)); a.volume = 0.85; void a.play()?.catch(() => {}); return () => a.pause(); } catch { return undefined; }
  }, [id, line.clip]);
  const save = async () => { setSaving(true); setError(''); try { await saveCanvas(await renderCardImage({ characterId: id, nickname, sprintName, line: line.text, starlight }), cardFileName(sprintName, date, nickname)); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save the card.'); } finally { setSaving(false); } };
  return <div className="recognition-card" role="dialog" aria-modal="true" aria-label="Your recognition card">
    <button className="recognition-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
    <div className="recognition-art"><Art character={character} kind="splash" decorative /></div>
    <div className="recognition-body">
      <h3>{nickname}</h3><p className="recognition-sprint">{sprintName} · with {character?.name}</p>
      <blockquote>“{line.text}”</blockquote>
      {voiced && <p className="recognition-voice" aria-label="Voiced line">♪ {voiced}</p>}
      {starlight !== null && <p className="recognition-starlight">✦ {starlight.toLocaleString()} Starlight earned</p>}
      <button className="feedback-save" disabled={saving} onClick={() => void save()}><Download size={15} /> Save card</button>{error && <p role="alert">{error}</p>}
    </div>
  </div>;
}
