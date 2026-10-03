// Written only when a player presses mute/unmute. The older `lumara.voiceEnabled` key was saved
// automatically on every visit, so it never reflected a real choice and is ignored.
const KEY = 'lumara.serenMuted';
export function readSerenMuted() { try { return localStorage.getItem(KEY) === 'true'; } catch { return false; } }
export function saveSerenMuted(muted: boolean) { try { localStorage.setItem(KEY, String(muted)); } catch { /* Preference storage is optional. */ } }
