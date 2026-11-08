import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import ReactThreeTestRenderer from "@react-three/test-renderer";
import * as THREE from "three";
import { Character, Outfit } from "../src/Character.jsx";
import { Dice } from "../src/Scene.jsx";
import { defaultSave } from "../src/game.js";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// The scene test renderer supplies a mock GL context; Three also expects a
// frame scheduler during renderer disposal in this Node-only harness.
globalThis.self = {
  requestAnimationFrame: (cb) => setTimeout(() => cb(performance.now()), 16),
  cancelAnimationFrame: clearTimeout,
};
test("all three character variants mount as real meshes and animate their joint hierarchies", async () => {
  for (const kind of [0, 1, 2]) {
    const renderer = await ReactThreeTestRenderer.create(
      <Character
        kind={kind}
        look={defaultSave().looks[kind]}
        action="welcome"
      />,
    );
    await renderer.advanceFrames(30, 1 / 60);
    const meshes = renderer.scene.findAll((n) => n.type === "Mesh");
    assert.ok(
      meshes.length > 60,
      `character ${kind} should have sculpted features`,
    );
    assert.equal(
      meshes.some((n) => n.instance.isSprite),
      false,
    );
    for (const mesh of meshes)
      assert.ok(
        Number.isFinite(
          mesh.instance.matrixWorld.elements.reduce((a, b) => a + b, 0),
        ),
      );
    assert.equal(
      renderer.scene.findAll((n) => n.instance?.name === "knee").length,
      2,
    );
    await renderer.unmount();
  }
});
test("holder updates a world-space grip anchor for the rope", async () => {
  const anchors = { current: [new THREE.Vector3(), new THREE.Vector3()] };
  const r = await ReactThreeTestRenderer.create(
    <Character
      kind={1}
      position={[-2.55, 0, 0]}
      holderSide={1}
      handAnchor={anchors}
      anchorIndex={0}
      look={defaultSave().looks[1]}
    />,
  );
  await r.advanceFrames(2, 1 / 60);
  assert.ok(anchors.current[0].x < -1.5);
  assert.ok(anchors.current[0].y > 0.5);
  assert.ok(anchors.current[0].y < 1.6);
  await r.unmount();
});
test("every hairstyle and shop outfit remains renderable", async () => {
  for (const style of [0, 1, 2]) {
    const r = await ReactThreeTestRenderer.create(
      <Character
        kind={0}
        look={{ ...defaultSave().looks[0], style }}
        preview
      />,
    );
    await r.advanceFrames(2, 1 / 60);
    assert.ok(r.scene.findAll((n) => n.type === "Mesh").length > 60);
    await r.unmount();
  }
  const outfit = await ReactThreeTestRenderer.create(
    <Outfit color="#ff2e91" />,
  );
  assert.ok(outfit.scene.findAll((n) => n.type === "Mesh").length > 20);
  await outfit.unmount();
});

test("die is a rounded 3D mesh with 21 traditional pips and no text geometry", async () => {
  const r = await ReactThreeTestRenderer.create(<Dice value={5} />);
  const meshes = r.scene.findAll((n) => n.type === "Mesh");
  assert.equal(
    meshes.filter((n) => n.instance.geometry.type === "CircleGeometry").length,
    21,
  );
  assert.equal(
    meshes.filter((n) => n.instance.geometry.type === "TextGeometry").length,
    0,
  );
  await r.unmount();
});

test("rope holders keep feet and knees planted while the jumper is airborne", async () => {
  for (const side of [1, -1]) {
    const kind = side === 1 ? 1 : 2,
      engine = { current: { jumpAge: 0.38, phase: 0 } };
    const r = await ReactThreeTestRenderer.create(
      <Character
        kind={kind}
        look={defaultSave().looks[kind]}
        position={[side * -2.55, 0, 0]}
        holderSide={side}
        engine={engine}
        action="play"
      />,
    );
    await r.advanceFrames(2, 1 / 60);
    const character = r.scene.findAll(
      (n) => n.instance?.name === `character-${kind}`,
    )[0];
    assert.equal(
      character.instance.position.y,
      0,
      "holder root must not share the jump height",
    );
    for (const knee of r.scene.findAll((n) => n.instance?.name === "knee"))
      assert.equal(knee.instance.rotation.x, 0);
    await r.unmount();
  }
});
test("Welcome jumps clear the feet at the bottom sweep and land before the overhead sweep", async () => {
  const phase = { current: 0 };
  const r = await ReactThreeTestRenderer.create(
    <Character
      kind={0}
      look={defaultSave().looks[0]}
      action="welcome"
      ropePhase={phase}
    />,
  );
  await r.advanceFrames(1, 1 / 60);
  const root = r.scene.findAll((n) => n.instance?.name === "character-0")[0]
    .instance;
  assert.ok(
    root.position.y > 0.9,
    "jumper is airborne at the underfoot crossing",
  );
  phase.current = Math.PI;
  await r.advanceFrames(1, 1 / 60);
  assert.equal(root.position.y, 0, "jumper lands before the overhead crossing");
  await r.unmount();
});

test("computer turns use BeatBot, while human turns keep the crew characters", async () => {
  const { ActiveJumper } = await import("../src/Scene.jsx");
  const looks = defaultSave().looks;
  for (const [mode, current, name] of [
    ["cpu", 0, "character-0"],
    ["cpu", 1, "beatbot"],
    ["pvp", 1, "character-1"],
  ]) {
    const engine = { current: { jumpAge: 0.38, phase: 0 } };
    const r = await ReactThreeTestRenderer.create(
      <ActiveJumper
        screen="gameplay"
        match={{ mode, current }}
        looks={looks}
        engine={engine}
        phase={{ current: 0 }}
      />,
    );
    await r.advanceFrames(2, 1 / 60);
    assert.equal(r.scene.findAll((n) => n.instance?.name === name).length, 1);
    if (name === "beatbot") {
      assert.equal(
        r.scene.findAll((n) => n.instance?.name === "character-0").length,
        0,
      );
      assert.ok(
        r.scene.findAll((n) => n.instance?.name === "robot-knee").length === 2,
      );
    }
    await r.unmount();
  }
});
