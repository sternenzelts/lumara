import type { CSSProperties } from 'react';
import type { Skill } from '../data/kits';
import './skills.css';

/** Left-edge action bar: one icon per skill of your companion, shortcut key, hover/focus tooltip, cooldown sweep. */
export default function SkillBar({ skills, cooldowns, locked = {}, onCast }: { skills: Skill[]; cooldowns: Record<string, number>; locked?: Record<string, boolean>; onCast: (skill: Skill) => void }) {
  return <div className="skill-bar" role="toolbar" aria-label="Skills">
    {skills.map(s => {
      const cd = cooldowns[s.id] ?? 0;
      const used = s.cooldownMs === 'voyage' && cd >= 1;
      const isLocked = !!locked[s.id];
      const label = (s.cooldownMs === 'voyage' ? 'Once per voyage' : `${s.cooldownMs / 1000} s cooldown`) + (s.requiresTrueForm ? ' · true form only' : '');
      return <button key={s.id} className={`skill-slot ${s.effect === 'ultimate' || s.cooldownMs === 'voyage' ? 'ultimate' : ''} ${cd > 0 ? 'cooling' : ''} ${isLocked ? 'locked' : ''}`} disabled={cd > 0 || isLocked}
        style={{ '--cd': String(Math.round(cd * 100) / 100) } as CSSProperties}
        aria-label={`${s.name} (key ${s.key})`} aria-keyshortcuts={s.key} onClick={() => onCast(s)}>
        <img src={s.icon} alt="" draggable={false} />
        <span className="skill-key" aria-hidden="true">{s.key}</span>
        {used && <span className="skill-used">Used</span>}
        {isLocked && <span className="skill-used">True form only</span>}
        <span className="skill-tip" role="tooltip"><strong>{s.name}</strong><span>{s.description}</span><em>{label}</em></span>
      </button>;
    })}
  </div>;
}
