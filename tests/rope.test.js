import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { RopePhysics } from "../src/rope.js";
test("rope remains finite, anchored and above the ground through repeated turns", () => {
  const rope = new RopePhysics(),
    a = new THREE.Vector3(-2.1, 1.0, 0.1),
    b = new THREE.Vector3(2.1, 1.0, 0.1);
  for (let i = 0; i < 1200; i++) {
    const points = rope.step(1 / 60, i * 0.06, a, b);
    assert.equal(points[0].distanceTo(a), 0);
    assert.equal(points.at(-1).distanceTo(b), 0);
    for (const p of points) {
      assert.ok(Number.isFinite(p.x + p.y + p.z));
      assert.ok(p.y >= 0.0449);
      assert.ok(p.length() < 10);
    }
    for (let j = 1; j < points.length; j++)
      assert.ok(points[j].distanceTo(points[j - 1]) < 0.35);
  }
});
test("rope freezes completely when paused", () => {
  const r = new RopePhysics(),
    a = new THREE.Vector3(-2, 1, 0),
    b = new THREE.Vector3(2, 1, 0);
  r.step(0.02, 1, a, b);
  const before = r.points.map((p) => p.toArray());
  r.step(0, 1, a, b);
  assert.deepEqual(
    r.points.map((p) => p.toArray()),
    before,
  );
});
