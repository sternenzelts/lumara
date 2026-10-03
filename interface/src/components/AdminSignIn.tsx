import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabaseClient } from '../backend';
import { SANCTUARY_BACKGROUND } from '../data/art';
import { Button } from './ui';

/** Hidden Warden (admin) sign-in at #warden-login: email magic link. Players never see a link to it. */
export default function AdminSignIn() {
  const [email, setEmail] = useState(''); const [sent, setSent] = useState(false); const [err, setErr] = useState('');
  const send = async () => {
    setErr('');
    const sb = await supabaseClient();
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: location.href.split('#')[0], shouldCreateUser: true } });
    if (error) setErr(error.message); else setSent(true);
  };
  return <main id="main" className="title-screen warden-login">
    <img className="title-backdrop" src={SANCTUARY_BACKGROUND} alt="" /><div className="title-wash" />
    <div className="title-content"><h1><Sparkles size={28} strokeWidth={1} /> Warden sign-in</h1>
      {sent ? <p>Check your email for the sign-in link, then open it in this browser.</p> : <form onSubmit={e => { e.preventDefault(); void send(); }} className="title-actions">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email" required />
        <Button type="submit" disabled={!email}>Email me a link</Button></form>}
      {err && <p role="alert" className="start-error">{err}</p>}</div>
  </main>;
}
