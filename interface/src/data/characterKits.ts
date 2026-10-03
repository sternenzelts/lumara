// Names and visual abilities supplied in CODEX-BANNER-FIXES.md and characters/*/source.md.
export const CHARACTER_KITS: Record<string, { title: string; abilities: { name: string; description: string }[] }> = {
  ayaka: { title: 'The Frozen Hour', abilities: [
    { name: 'Deceleration Zone', description: 'A pale-aqua dome slows everything within.' },
    { name: 'Niflheim', description: 'Freezing mist, rising ice and swirling snow.' },
    { name: 'Frost Cadenza', description: 'Ice spires erupt in a rhythmic melody.' },
    { name: 'Glacial Finale', description: 'The field freezes into crystal, then shatters into light.' },
    { name: 'Chrono Stasis', description: 'A gold clock halts time for everyone.' },
  ] },
  mahesvara: { title: 'Beyond the veil', abilities: [
    { name: 'Nullify Magic', description: 'Incoming spells stop at his barrier and dissolve into blue mist.' },
    { name: 'Destroy & Restore', description: 'Matter disperses into mist, then rewinds into form.' },
  ] },
  keira: { title: 'A spark in the system', abilities: [
    { name: 'Mech Blast', description: 'Her guardian charges a radiant orb and releases a radial blast.' },
    { name: 'Guardian Protocol', description: 'Mech plates fuse into armour before a giant-sword dive and explosive finale.' },
  ] },
};
