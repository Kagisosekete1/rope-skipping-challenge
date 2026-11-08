import test from "node:test";
import assert from "node:assert/strict";
test("attached victory cheer starts from a warmed buffer and stops the music immediately", async () => {
  let paused = 0,
    starts = 0,
    stops = 0;
  const old = {
    Audio: globalThis.Audio,
    AudioContext: globalThis.AudioContext,
    fetch: globalThis.fetch,
  };
  class AudioMock {
    constructor() {
      this.events = {};
    }
    addEventListener(n, f) {
      this.events[n] = f;
    }
    play() {
      return Promise.resolve();
    }
    pause() {
      paused++;
    }
    load() {}
  }
  class ContextMock {
    constructor() {
      this.destination = {};
    }
    resume() {
      return Promise.resolve();
    }
    close() {
      return Promise.resolve();
    }
    createGain() {
      return { gain: { value: 1 }, connect() {} };
    }
    createMediaElementSource() {
      return { connect() {} };
    }
    decodeAudioData() {
      return Promise.resolve({ duration: 4.62 });
    }
    createBufferSource() {
      return {
        connect() {},
        start() {
          starts++;
        },
        stop() {
          stops++;
        },
      };
    }
  }
  try {
    globalThis.Audio = AudioMock;
    globalThis.AudioContext = ContextMock;
    globalThis.fetch = async (url) => {
      assert.equal(url, "./audio/victory-cheer.mp3");
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(16) };
    };
    const audio = await import("../src/audio.js");
    audio.music(true);
    audio.unlockMusic();
    await new Promise((r) => setTimeout(r, 0));
    audio.playVictory(true);
    assert.ok(paused >= 1);
    assert.equal(starts, 1);
    audio.stopVictory();
    assert.equal(stops, 1);
  } finally {
    Object.assign(globalThis, old);
  }
});
