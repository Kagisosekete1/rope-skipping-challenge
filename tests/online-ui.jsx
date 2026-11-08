import { dom } from "./dom-environment.js";
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import test from "node:test";
import assert from "node:assert/strict";
import { OnlineLobby } from "../src/Community.jsx";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const base = {
  room_id: "room-1",
  invite_code: "ABCDEF123456",
  status: "waiting",
  stake: 100,
  state: "idle",
  mySlot: 0,
  wallet: { points: 900, freeze_tokens: 0 },
};
async function click(text) {
  const b = [...document.querySelectorAll("button")].find(
    (b) => b.textContent.trim() === text,
  );
  assert.ok(b, `button ${text}`);
  await act(async () => b.click());
}
async function fill(id, value) {
  await act(async () => {
    const el = document.getElementById(id);
    Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    ).set.call(el, value);
    el.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}
test("online lobby validates stakes, creates a shareable invitation and asks consent before joining", async () => {
  const calls = [],
    started = [];
  const client = {
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === "my_challenges") return { data: [] };
      if (name === "create_challenge") return { data: base };
      if (name === "preview_challenge")
        return {
          data: {
            host: "Friend",
            stake: 150,
            pot: 300,
            invite_code: base.invite_code,
          },
        };
      if (name === "accept_challenge")
        return { data: { ...base, status: "active", stake: 150, mySlot: 1 } };
      return { data: base };
    },
  };
  function Harness() {
    const [wallet, setWallet] = useState({ points: 1000, freeze_tokens: 0 });
    return (
      <OnlineLobby
        account={{
          user: { id: "user" },
          wallet,
          setWallet,
          client,
          reload: () => {},
        }}
        onStart={(r) => started.push(r)}
        onProfile={() => {}}
        onNotify={() => {}}
      />
    );
  }
  const root = createRoot(document.getElementById("root"));
  try {
    await act(async () => root.render(<Harness />));
    await fill("stake", "2000");
    await click("CREATE INVITE");
    assert.equal(calls.filter((c) => c.name === "create_challenge").length, 0);
    await fill("stake", "100");
    await click("CREATE INVITE");
    assert.equal(
      calls.find((c) => c.name === "create_challenge").args.p_stake,
      100,
    );
    assert.match(
      document.querySelector(".invite-code").textContent,
      /ABCDEF123456/,
    );
    assert.equal(started.length, 0);
    await act(async () => root.unmount());
    const second = createRoot(document.getElementById("root"));
    try {
      await act(async () => second.render(<Harness />));
      await fill("invite-code", base.invite_code);
      await click("CHECK INVITATION");
      assert.equal(
        calls.filter((c) => c.name === "accept_challenge").length,
        0,
      );
      await click("ACCEPT — STAKE 150");
      assert.equal(started[0].mySlot, 1);
      assert.equal(started[0].stake, 150);
    } finally {
      await act(async () => second.unmount());
    }
  } finally {
    dom.window.close();
  }
});
