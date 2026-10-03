import { Sparkles } from 'lucide-react';
import { useUI } from '../App';
import { CHARACTERS, characterById } from '../data/characters';
import { Art, Button } from './ui';
import { welcomeRollsRemaining } from '../logic/welcome';

export default function TutorialWish() {
  const { me, player, busy, pull } = useUI();
  const remaining = welcomeRollsRemaining(player);
  return <section className="tutorial-wish" aria-label="Your free welcome wishes">
    <div className="tutorial-constellation" aria-hidden="true">{CHARACTERS.filter(c => c.grade === 'S++').map(c => <Art key={c.id} character={c} />)}</div>
    <Art character={characterById('seren')} kind="cutout" className="tutorial-seren" decorative />
    <div className="game-dialogue tutorial-instruction"><div className="game-speaker"><strong>Seren</strong><span>Your first companion</span></div><p>First, let’s see who answers your call today, {me.name}!</p></div>
    <div className="tutorial-wish-action"><h2>{remaining} free wishes</h2><p>A welcome gift from Lumara. No Starlight needed.</p><Button className="tutorial-wish-button" disabled={busy || !remaining} onClick={() => pull('welcome', remaining)}><Sparkles size={20} />{busy ? 'Making your wishes…' : `Make ${remaining} free wishes`}</Button><p className="tutorial-wish-note">Keep every companion you reveal, then enter Sanctuary.</p></div>
  </section>;
}
