import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import test from "node:test";
import assert from "node:assert/strict";
import gsap from "gsap";
import App from "../src/App.jsx";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function button(text) {
  const node = [...document.querySelectorAll("button")].find(
    (b) => b.textContent.trim() === text,
  );
  assert.ok(node, `button ${text} is present`);
  return node;
}
async function click(node) {
  assert.ok(node);
  await act(async () => {
    node.click();
  });
}
test("navigation survives splash removal; real controls, purchases and saves keep working", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: "https://game.test/",
    pretendToBeVisual: true,
  });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    localStorage: dom.window.localStorage,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
  });
  const errors = [];
  const root = createRoot(document.getElementById("root"), {
    onUncaughtError: (e) => errors.push(e),
  });
  try {
    await act(async () => {
      root.render(<App splashDelay={10} />);
    });
    await act(async () => {
      await wait(30);
    });
    assert.equal(document.querySelector("#loading"), null);
    assert.ok(document.querySelector(".welcome"));
    await click(button("PLAY"));
    assert.ok(
      document.querySelector(".home"),
      "Welcome PLAY reaches Home after splash",
    );
    await click(button("LET’S PLAY"));
    assert.ok(document.querySelector(".select"), "Home reaches mode selection");
    await click(button("PLAY"));
    assert.ok(
      document.querySelector(".gameplay"),
      "mode Play reaches gameplay",
    );
    await click(button("Roll the dice"));
    assert.equal(globalThis.uiTestEngine.state, "rolling");
    await act(async () => {
      for (let i = 0; i < 330; i++) globalThis.uiTestEngine.tick(0.01);
    });
    assert.equal(globalThis.uiTestEngine.state, "skipping");
    const engine = globalThis.uiTestEngine;
    engine.phase = 2 * Math.PI - (2 * Math.PI * 0.36) / engine.period;
    await click(button("JUMP"));
    assert.equal(engine.jumpAge, 0);
    await act(async () => {
      for (let i = 0; i < 40; i++) engine.tick(0.01);
    });
    assert.ok(engine.progress[0] > 0, "UI jump actually scores");
    await click(document.querySelector('[aria-label="Pause game"]'));
    assert.equal(engine.paused, true);
    await click(button("Quit match"));
    await click(button("Leave match"));
    assert.ok(document.querySelector(".home"));
    await click(button("Shop"));
    assert.ok(document.querySelector(".shop"));
    const blue = document.querySelector(
      '[aria-label="Electric blue, 800 coins"]',
    );
    await click(blue);
    assert.equal(JSON.parse(localStorage.getItem("rsc_v2")).coins, 1650);
    await click(document.querySelector('[aria-label="Electric blue, owned"]'));
    assert.ok(document.querySelector(".customize"));
    await click(button("SAVE"));
    assert.ok(document.querySelector(".home"));
    assert.equal(JSON.parse(localStorage.getItem("rsc_v2")).looks[0].outfit, 1);
    await click(button("Settings"));
    assert.ok(document.querySelector(".settings"));
    await click(document.querySelector('[aria-label="Sound effects"]'));
    assert.equal(JSON.parse(localStorage.getItem("rsc_v2")).sound, false);
    await click(document.querySelector('[aria-label="Back to home"]'));
    await click(button("Rewards"));
    assert.ok(document.querySelector(".rewards"));
    await click(button("PLAY A MATCH"));
    assert.ok(document.querySelector(".select"));
    assert.deepEqual(errors, [], "no React DOM errors during navigation");
  } finally {
    await act(async () => root.unmount());
    gsap.ticker.sleep();
    dom.window.close();
  }
});
