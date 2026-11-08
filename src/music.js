export const MUSIC_VOLUME = 0.4;
export const TRACKS = [
  "rope-rush.mp3",
  "rope-rush-1.mp3",
  "rope-rush-2.mp3",
  "rope-rush-3.mp3",
  "rope-rush-4.mp3",
].map((name) => "./music/" + name);
// One streaming player. The gain node keeps music at 40% on iOS, where the
// HTML audio volume property alone can be ignored. Never apply both attenuators.
export function createPlaylist({
  AudioCtor,
  AudioContextCtor,
  tracks = TRACKS,
} = {}) {
  let player = null,
    index = 0,
    enabled = false,
    failed = 0,
    context = null,
    gain = null;
  function level() {
    if (!player) return;
    player.volume = gain ? 1 : MUSIC_VOLUME;
    if (gain) gain.gain.value = MUSIC_VOLUME;
  }
  function play() {
    if (!enabled || !player) return;
    level();
    try {
      player.play()?.catch(() => {});
    } catch {}
  }
  function next() {
    if (!player) return;
    index = (index + 1) % tracks.length;
    player.src = tracks[index];
    player.load();
    play();
  }
  function ensure() {
    if (player || !AudioCtor || !tracks.length) return;
    player = new AudioCtor(tracks[index]);
    player.preload = "metadata";
    level();
    player.addEventListener("ended", () => {
      failed = 0;
      next();
    });
    player.addEventListener("error", () => {
      if (++failed < tracks.length) next();
      else player.pause();
    });
  }
  function unlock() {
    if (!enabled) return;
    ensure();
    if (player && AudioContextCtor && !gain) {
      try {
        context = new AudioContextCtor();
        gain = context.createGain();
        gain.gain.value = MUSIC_VOLUME;
        context.createMediaElementSource(player).connect(gain);
        gain.connect(context.destination);
      } catch {
        context?.close()?.catch(() => {});
        context = null;
        gain = null;
      }
    }
    context?.resume()?.catch(() => {});
    play();
  }
  return {
    setEnabled(on) {
      enabled = !!on;
      if (!enabled) {
        player?.pause();
        return;
      }
      ensure();
      play();
    },
    unlock,
    dispose() {
      enabled = false;
      player?.pause();
      if (player) {
        player.removeAttribute("src");
        player.load();
      }
      context?.close()?.catch(() => {});
      player = null;
      context = null;
      gain = null;
    },
    get index() {
      return index;
    },
    get player() {
      return player;
    },
  };
}
