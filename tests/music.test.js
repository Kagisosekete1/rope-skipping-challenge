import test from "node:test";
import assert from "node:assert/strict";
import { createPlaylist, TRACKS, MUSIC_VOLUME } from "../src/music.js";
class AudioMock {
  constructor(src) {
    this.src = src;
    this.events = {};
    this.currentTime = 0;
    this.plays = 0;
    this.pauses = 0;
  }
  addEventListener(name, cb) {
    this.events[name] = cb;
  }
  play() {
    this.plays++;
    return Promise.resolve();
  }
  pause() {
    this.pauses++;
  }
  load() {}
  removeAttribute() {
    this.src = "";
  }
}
test("all five supplied tracks rotate and remain at forty percent volume", () => {
  const music = createPlaylist({ AudioCtor: AudioMock });
  music.setEnabled(true);
  assert.equal(TRACKS.length, 5);
  assert.equal(music.player.volume, 0.4);
  assert.equal(MUSIC_VOLUME, 0.4);
  for (let i = 0; i < 6; i++) {
    assert.equal(music.player.src, TRACKS[i % 5]);
    music.player.events.ended();
    assert.equal(music.player.volume, 0.4);
  }
  music.dispose();
});
test("music pauses and resumes without restarting the current song", () => {
  const music = createPlaylist({ AudioCtor: AudioMock });
  music.setEnabled(true);
  music.player.currentTime = 31;
  music.setEnabled(false);
  assert.equal(music.player.pauses, 1);
  music.setEnabled(true);
  assert.equal(music.player.currentTime, 31);
  music.dispose();
});
test("blocked autoplay can retry after a player gesture; failed files do not loop forever", () => {
  const music = createPlaylist({ AudioCtor: AudioMock });
  music.setEnabled(true);
  const first = music.player.plays;
  music.unlock();
  assert.equal(music.player.plays, first + 1);
  for (let i = 0; i < 5; i++) music.player.events.error();
  assert.equal(music.player.pauses, 1);
  music.dispose();
});

test("mobile Web Audio gain applies exactly forty percent without double attenuation", () => {
  let gain;
  class ContextMock {
    constructor() {
      this.destination = {};
    }
    createGain() {
      gain = { gain: { value: 1 }, connect() {} };
      return gain;
    }
    createMediaElementSource() {
      return { connect() {} };
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
  }
  const music = createPlaylist({
    AudioCtor: AudioMock,
    AudioContextCtor: ContextMock,
  });
  music.setEnabled(true);
  music.unlock();
  assert.equal(gain.gain.value, 0.4);
  assert.equal(music.player.volume, 1);
  music.player.events.ended();
  assert.equal(gain.gain.value, 0.4);
  assert.equal(music.player.volume, 1);
  music.dispose();
});
