import test from "node:test";
import assert from "node:assert/strict";
import { OnlineMatch } from "../src/online.js";
function state() {
  return {
    room_id: "room",
    status: "active",
    state: "skipping",
    current: 0,
    mySlot: 0,
    stake: 100,
    names: ["Host", "Guest"],
    progress: [0, 0],
    needed: 3,
    done: 0,
    combo: 0,
    best: 0,
    round: 1,
    server_now: Date.now(),
    period_ms: 1900,
    next_crossing: Date.now() + 800,
    jump_at: null,
    powers: [
      { block: 1, shield: 1, slow: 1, boost: 1 },
      { block: 1, shield: 1, slow: 1, boost: 1 },
    ],
    effects: [{}, {}],
    frozen_until: [0, 0],
    wallet: { points: 900, freeze_tokens: 1 },
  };
}
test("online adapter only sends local actions on the local turn and never calculates a winning score", async () => {
  const requests = [];
  let remote = state();
  const client = {
    rpc: async (name, args) => {
      requests.push(args.p_action);
      return {
        data: {
          ...remote,
          server_now: Date.now(),
          jump_at: args.p_action === "jump" ? Date.now() : null,
        },
        error: null,
      };
    },
  };
  const m = new OnlineMatch(remote, client, () => {});
  assert.equal(m.jump(), true);
  await new Promise((r) => setTimeout(r, 0));
  assert.deepEqual(requests, ["jump"]);
  assert.deepEqual(m.progress, [0, 0]);
  m.apply({ ...remote, current: 1, server_now: Date.now() + 10 });
  assert.equal(m.jump(), false);
  assert.equal(m.roll(), false);
  assert.equal(m.canPower("freeze"), true);
  assert.equal(m.canPower("shield"), false);
  m.close();
});
test("frozen server state blocks jumping and snapshots preserve the winner/pot", () => {
  const remote = state();
  remote.frozen_until[0] = Date.now() + 1500;
  const m = new OnlineMatch(remote, {}, () => {});
  assert.equal(m.jump(), false);
  m.apply({
    ...remote,
    server_now: Date.now() + 10,
    state: "over",
    winner: 1,
    status: "complete",
  });
  assert.equal(m.snapshot().winner, 1);
  assert.equal(m.snapshot().stake, 100);
  m.close();
});
test('database push updates scores immediately and wallet events cannot be overwritten by stale room balances',()=>{
 const handlers={},wallets=[];let removed=false;
 const channel={on(_type,filter,callback){handlers[filter.table]=callback;return this;},subscribe(){return this;}};
 const client={channel:()=>channel,removeChannel:()=>{removed=true;},rpc:async()=>({data:null,error:null})};
 const m=new OnlineMatch(state(),client,()=>{},wallet=>wallets.push(wallet));m.connect();
 try{handlers.challenge_wallets({new:{points:3700,freeze_tokens:2,online_wins:3,updated_at:'2026-11-09T12:00:00Z'}});handlers.challenge_rooms({new:{status:'active',state:{...state(),progress:[77,15]}}});assert.deepEqual(m.progress,[77,15]);assert.equal(wallets.at(-1).points,3700);}
 finally{m.close();}assert.equal(removed,true);
});
