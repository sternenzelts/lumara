import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { cleanNickname, NICKNAME_MAX } from '../logic/names';

export default function NicknamePanel({ initial, accountName, submitLabel = 'Confirm', onSubmit }: {
  initial: string; accountName: string; submitLabel?: string; onSubmit: (name: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const length = [...value.trim()].length;
  return <form className="nickname-panel" onSubmit={async e => {
    e.preventDefault(); if (saving) return;
    try { const name = cleanNickname(value); setSaving(true); setError(''); await onSubmit(name); }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.'); }
    finally { setSaving(false); }
  }}>
    <label htmlFor="nickname-input">What should I call you?</label>
    <div className="nickname-field">
      <input id="nickname-input" value={value} autoFocus autoComplete="nickname" spellCheck={false} aria-describedby="nickname-help"
        aria-invalid={!!error} onChange={e => { setValue(e.target.value); setError(''); }} />
      <span className={length > NICKNAME_MAX ? 'over' : ''} aria-hidden="true">{length}/{NICKNAME_MAX}</span>
    </div>
    <p id="nickname-help" className={error ? 'nickname-error' : ''} role={error ? 'alert' : undefined}>{error || `Signed in as ${accountName}`}</p>
    <button type="submit" className="nickname-submit" disabled={saving}><span>{saving ? 'Saving…' : submitLabel}</span><ArrowRight size={18} /></button>
  </form>;
}
