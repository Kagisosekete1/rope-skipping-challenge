import { dom } from "./dom-environment.js";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
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
    await click(document.querySelector('[aria-label="Your profile"]'));
    assert.ok(document.querySelector(".profile"));
    await act(async () => {
      const input = document.getElementById("player-name");
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      ).set.call(input, "Crew Captain");
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
    await click(document.querySelector('[aria-label="blue profile avatar"]'));
    await click(button("SAVE PROFILE"));
    assert.equal(
      JSON.parse(localStorage.getItem("rsc_v2")).profile.displayName,
      "Crew Captain",
    );
    assert.equal(
      JSON.parse(localStorage.getItem("rsc_v2")).profile.avatar,
      "blue",
    );
    await click(document.querySelector('[aria-label="Back to home"]'));
    await click(button("LET’S PLAY"));
    assert.ok(document.querySelector(".select"), "Home reaches mode selection");
    await click(button("PLAY"));
    assert.ok(
      document.querySelector(".gameplay"),
      "mode Play reaches gameplay",
    );
    globalThis.uiTestEngine.random=()=>.4;
    assert.equal(button("JUMP").disabled,false,"Jump is available before rolling");
    await click(button("JUMP"));
    assert.ok(globalThis.uiTestEngine.previewJumpAt>0,"first tap responds with a warm-up hop");
    assert.equal(globalThis.uiTestEngine.state, "rolling");
    assert.ok(
      document.querySelector(".dice-showcase"),
      "rolling has a dedicated visible pip-dice dock",
    );
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
