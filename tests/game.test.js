import test from "node:test";
import assert from "node:assert/strict";
import {
  Match,
  randomDie,
  jumpHeight,
  scoreJump,
  defaultSave,
  loadSave,
} from "../src/game.js";
function advance(m, t) {
  for (let i = 0; i < Math.ceil(t / 0.01); i++) m.tick(0.01);
}
function skipping(m, n = 3) {
  m.roll();
  advance(m, 3.2);
  assert.equal(m.state, "skipping");
  m.needed = n;
}
function land(m) {
  const next = (Math.floor(m.phase / (2 * Math.PI)) + 1) * 2 * Math.PI;
  const seconds = ((next - m.phase) / (2 * Math.PI)) * m.period;
  advance(m, Math.max(0, seconds - 0.38));
  assert.equal(m.jump(), true);
  advance(m, 0.4);
}
test("traditional six-sided die stays in range and reaches all faces", () => {
  assert.deepEqual(
    [0, 0.17, 0.34, 0.51, 0.68, 0.999].map((n) => randomDie(() => n)),
    [1, 2, 3, 4, 5, 6],
  );
});
test("jump has a grounded start, airborne apex and grounded finish", () => {
  assert.equal(jumpHeight(0), 0);
  assert.ok(jumpHeight(0.38) > 1);
  assert.equal(jumpHeight(0.76), 0);
  assert.equal(jumpHeight(2), 0);
});
test("a grounded collision ends the turn without adding progress", () => {
  const m = new Match(
    () => {},
    () => 0.2,
  );
  skipping(m);
  advance(m, 1);
  assert.equal(m.state, "turnEnd");
  assert.equal(m.progress[0], 0);
  advance(m, 1.7);
  assert.equal(m.current, 1);
  assert.equal(m.state, "idle");
});
test("perfect jump earns seven percent and clearing the roll earns five extra", () => {
  const m = new Match(
    () => {},
    () => 0.2,
  );
  skipping(m, 1);
  land(m);
  assert.equal(m.done, 1);
  assert.equal(m.progress[0], 12);
  assert.equal(m.state, "turnEnd");
});
test("jump button prevents repeated airborne jumps", () => {
  const m = new Match();
  skipping(m);
  assert.equal(m.jump(), true);
  assert.equal(m.jump(), false);
  advance(m, 0.1);
  assert.equal(m.jump(), false);
});
test("pause freezes clock, jump and rope; roll and jump cannot bypass pause", () => {
  const m = new Match();
  skipping(m);
  m.pause();
  const phase = m.phase,
    age = m.jumpAge,
    time = m.time;
  advance(m, 3);
  assert.equal(m.phase, phase);
  assert.equal(m.jumpAge, age);
  assert.equal(m.time, time);
  assert.equal(m.jump(), false);
  assert.equal(m.roll(), false);
  m.pause();
  advance(m, 0.1);
  assert.ok(m.phase > phase);
});
test("first player reaching 100 finishes immediately and cannot roll again", () => {
  const m = new Match(
    () => {},
    () => 0.2,
  );
  skipping(m);
  m.progress[0] = 96;
  land(m);
  assert.equal(m.state, "over");
  assert.equal(m.winner, 0);
  assert.equal(m.progress[0], 100);
  assert.equal(m.roll(), false);
});
test("two-player mode passes control and advances rounds", () => {
  const m = new Match();
  m.reset("pvp");
  skipping(m);
  advance(m, 1);
  advance(m, 1.7);
  assert.equal(m.current, 1);
  assert.equal(m.ai, false);
  skipping(m);
  advance(m, 1);
  advance(m, 1.7);
  assert.equal(m.current, 0);
  assert.equal(m.round, 2);
});
test("CPU can roll, jump and finish a full match", () => {
  const m = new Match(
    () => {},
    () => 0.5,
  );
  m.reset("cpu", "Hard");
  m.current = 1;
  for (let i = 0; i < 180000 && m.state !== "over"; i++) {
    if (m.state === "idle" && m.current === 0) m.roll();
    m.tick(0.01);
  }
  assert.equal(m.state, "over");
  assert.equal(m.winner, 1);
});
test("score caps at one hundred", () => assert.equal(scoreJump(99, true), 100));
test("saved data corruption falls back to defaults", () => {
  assert.deepEqual(loadSave({ getItem: () => "{broken" }), defaultSave());
  assert.equal(
    loadSave({ getItem: () => JSON.stringify({ coins: -20 }) }).coins,
    0,
  );
});

test("rope rests underfoot, winds up continuously and never teleports at a turn change", () => {
  const m = new Match(
    () => {},
    () => 0.2,
  );
  assert.equal(m.phase, 0);
  m.roll();
  advance(m, 1.72);
  assert.equal(m.state, "ready");
  let before = m.phase;
  for (let i = 0; i < 150; i++) {
    m.tick(0.01);
    assert.ok(m.phase >= before);
    assert.ok(
      m.phase - before < 0.08,
      "wind-up must advance around the body without a phase jump",
    );
    before = m.phase;
  }
  while (m.state === "skipping") m.tick(0.01);
  const resting = m.phase;
  advance(m, 1.7);
  assert.equal(m.state, "idle");
  assert.equal(m.phase, resting, "turn handoff must preserve the rope angle");
});
