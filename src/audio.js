import { createPlaylist } from "./music.js";
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
  warmCheer();
}

let cheerBuffer,
  cheerLoading,
  cheerSource,
  victoryRequested = false;
function warmCheer() {
  if (cheerBuffer) return Promise.resolve(cheerBuffer);
  const AudioContextCtor =
    globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextCtor) return Promise.resolve(null);
  try {
    ctx ??= new AudioContextCtor();
  } catch {
    return Promise.resolve(null);
  }
  cheerLoading ??= fetch("./audio/victory-cheer.mp3")
    .then((r) => {
      if (!r.ok) throw new Error("Cheer unavailable");
      return r.arrayBuffer();
    })
    .then((b) => ctx.decodeAudioData(b))
    .then((b) => (cheerBuffer = b))
    .catch(() => null);
  return cheerLoading;
}
export function playVictory(enabled = true) {
  music(false);
  victoryRequested = enabled;
  if (!enabled) return;
  const play = (buffer) => {
    if (!buffer || !victoryRequested) return;
    ctx.resume()?.catch(() => {});
    cheerSource?.stop();
    cheerSource = ctx.createBufferSource();
    cheerSource.buffer = buffer;
    cheerSource.connect(ctx.destination);
    cheerSource.start();
  };
  if (cheerBuffer) play(cheerBuffer);
  else warmCheer().then(play);
}
export function stopVictory() {
  victoryRequested = false;
  try {
    cheerSource?.stop();
  } catch {}
  cheerSource = null;
}
