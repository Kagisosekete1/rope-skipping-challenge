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
