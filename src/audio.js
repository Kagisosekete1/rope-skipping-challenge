import { createPlaylist } from "./music";
let ctx, playlist;
export function tone(type, enabled = true) {
  if (!enabled) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    ctx.resume();
    const notes = {
      jump: [420, 680],
      good: [660, 880],
      perfect: [660, 880, 1100],
      miss: [180, 110],
      roll: [340, 400, 480],
      win: [523, 659, 784, 1046],
      click: [760],
    }[type] || [600];
    notes.forEach((hz, i) => {
      const t = ctx.currentTime + i * 0.09,
        o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(hz, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.21);
    });
  } catch {}
}
export function music(on) {
  playlist ??= createPlaylist({
    AudioCtor: globalThis.Audio,
    AudioContextCtor: globalThis.AudioContext || globalThis.webkitAudioContext,
  });
  playlist.setEnabled(on);
}
export function unlockMusic() {
  playlist?.unlock();
}
