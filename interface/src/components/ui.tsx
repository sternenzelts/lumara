import { useState, type ReactNode, type CSSProperties } from 'react';
import { ArrowRight, Sparkles, UserRound, Check, Gem } from 'lucide-react';
import type { CharacterDef } from '../data/characters';
import type { Grade } from '../backend/types';

export function Button({ children, onClick, secondary = false, disabled = false, type = 'button', className = '' }: { children: ReactNode; onClick?: () => void; secondary?: boolean; disabled?: boolean; type?: 'button' | 'submit'; className?: string }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`button game-button ${secondary ? 'secondary' : 'primary'} ${className}`}>{children}</button>;
}
export function Art({ character, kind = 'splash', className = '', decorative = false }: { character: CharacterDef | undefined; kind?: 'splash' | 'cutout'; className?: string; decorative?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = character?.art[kind];
  return src && !failed ? <img className={`character-art character-art-${character!.id} character-art-${kind} ${className}`} src={src} alt={decorative ? '' : character!.name} onError={() => setFailed(true)} draggable={false} /> : <div className={`silhouette ${className}`} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : `${character?.name || 'Character'} — artwork coming soon`}><UserRound strokeWidth={.65} /><span>Artwork coming soon</span></div>;
}
export function GradeBadge({ grade }: { grade: Grade }) { return <span className={`grade grade-${grade.replaceAll('+', 'plus')}`}>{grade}</span>; }
export function CharacterCard({ character, owned = true, selected = false, onClick }: { character: CharacterDef; owned?: boolean; selected?: boolean; onClick: () => void }) {
  return <button className={`character-card ${!owned ? 'unowned' : ''}`} style={{ '--accent': character.accent } as CSSProperties} onClick={onClick} aria-label={`View ${character.name}${owned ? ', collected' : ', not collected'}`}>
    <div className="character-portrait">{owned ? <Art key={character.id} character={character} /> : <div className="silhouette"><UserRound strokeWidth={.65} /><span>Not collected</span></div>}<GradeBadge grade={character.grade} />{selected && <span className="selected-character"><Check size={13} /> Display</span>}</div>
    <div className="character-caption"><strong>{character.name}</strong><span>{character.element}</span></div>
  </button>;
}
export function Empty({ title, children, icon = 'star' }: { title: string; children?: ReactNode; icon?: 'star' | 'gem' }) { return <div className="empty">{icon === 'gem' ? <Gem size={32} strokeWidth={1} /> : <Sparkles size={32} strokeWidth={1} />}<h3>{title}</h3>{children && <div>{children}</div>}</div>; }
export function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) { return <button className="link-button" onClick={onClick}>{children}<ArrowRight size={16} /></button>; }
export function SectionTitle({ title, plain, children }: { title: string; plain?: string; children?: ReactNode }) { return <div className="section-title"><div><h2>{title}</h2>{plain && <p>{plain}</p>}</div>{children}</div>; }
