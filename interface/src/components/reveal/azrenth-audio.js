// Arm the synthesized lightning during the Wish gesture, before the reveal mounts.
let context;
export function primeAzrenthAudio() {
  try {
    if (!context || context.state === 'closed') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      context = new AudioContextClass();
    }
    void context.resume();
    return context;
  } catch {
    return null;
  }
}
