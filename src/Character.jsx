import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { ITEMS, SKIN, jumpHeight } from "./game";
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const sphere = new THREE.SphereGeometry(1, 32, 24);
const materialCache = new Map();
function material(color, roughness = 0.48, metalness = 0) {
  const key = color + roughness + metalness;
  if (!materialCache.has(key))
    materialCache.set(
      key,
      new THREE.MeshStandardMaterial({ color, roughness, metalness }),
    );
  return materialCache.get(key);
}
function Orb({
  at = [0, 0, 0],
  scale = [1, 1, 1],
  color,
  roughness = 0.48,
  ...props
}) {
  return (
    <mesh
      castShadow
      receiveShadow
      geometry={sphere}
      position={at}
      scale={scale}
      material={material(color, roughness)}
      dispose={null}
      {...props}
    />
  );
}
function Strand({ points, radius = 0.025, color, roughness = 0.4 }) {
  const geo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        24,
        radius,
        8,
        false,
      ),
    [JSON.stringify(points), radius],
  );
  return (
    <mesh castShadow geometry={geo} material={material(color, roughness)} />
  );
}
function Ring({
  at,
  rotation = [0, 0, 0],
  radius = 0.07,
  tube = 0.008,
  color,
}) {
  return (
    <mesh
      position={at}
      rotation={rotation}
      castShadow
      material={material(color, 0.24, 0.7)}
    >
      <torusGeometry args={[radius, tube, 8, 28]} />
    </mesh>
  );
}
function Sculpt({ profile, color, at = [0, 0, 0], scale = [1, 1, 1] }) {
  const geo = useMemo(
    () =>
      new THREE.LatheGeometry(
        profile.map(([r, y]) => new THREE.Vector2(r, y)),
        40,
      ),
    [JSON.stringify(profile)],
  );
  return (
    <mesh
      castShadow
      receiveShadow
      position={at}
      scale={scale}
      geometry={geo}
      material={material(color, 0.65)}
    />
  );
}
function Eye({ x, blink, skin }) {
  return (
    <group
      position={[x, 1.91, 0.287]}
      rotation={[0, x > 0 ? 0.12 : -0.12, x > 0 ? -0.05 : 0.05]}
    >
      <Orb at={[0, 0, -0.018]} scale={[0.12, 0.149, 0.048]} color="#452318" />
      <group ref={blink}>
        <Orb scale={[0.108, 0.133, 0.064]} color="#fff8eb" roughness={0.17} />
        <Orb
          at={[x > 0 ? -0.01 : 0.01, -0.002, 0.054]}
          scale={[0.067, 0.083, 0.025]}
          color="#6d3315"
          roughness={0.16}
        />
        <Ring at={[0, 0, 0.077]} radius={0.058} tube={0.006} color="#b67530" />
        <Orb
          at={[0, 0, 0.078]}
          scale={[0.039, 0.058, 0.012]}
          color="#130c12"
          roughness={0.07}
        />
        <Orb
          at={[-0.022, 0.039, 0.09]}
          scale={[0.021, 0.023, 0.008]}
          color="white"
        />
        <Orb
          at={[0.025, -0.025, 0.09]}
          scale={[0.008, 0.009, 0.005]}
          color="white"
        />
      </group>
      <Strand
        points={[
          [-0.105, 0.055, 0.019],
          [-0.061, 0.12, 0.037],
          [0.031, 0.134, 0.028],
          [0.102, 0.071, 0.009],
        ]}
        radius={0.012}
        color="#321413"
      />
      <Orb at={[0, 0.03, -0.032]} scale={[0.108, 0.09, 0.012]} color={skin} />
    </group>
  );
}
export function Shoe({ color }) {
  return (
    <group>
      <RoundedBox
        args={[0.23, 0.087, 0.4]}
        radius={0.042}
        smoothness={4}
        position={[0, 0.055, 0.075]}
        castShadow
        material={material("#fff9ef", 0.58)}
      />
      <Orb at={[0, 0.134, 0.055]} scale={[0.12, 0.105, 0.18]} color={color} />
      <Orb at={[0, 0.211, -0.035]} scale={[0.105, 0.12, 0.1]} color={color} />
      <Orb
        at={[0, 0.109, 0.216]}
        scale={[0.101, 0.056, 0.035]}
        color="#fffaf0"
      />
      <RoundedBox
        args={[0.092, 0.12, 0.04]}
        radius={0.012}
        position={[0, 0.204, 0.055]}
        material={material(color)}
      />
      {Array.from({ length: 4 }, (_, i) => (
        <Strand
          key={i}
          points={[
            [-0.057, 0.18 + i * 0.016, 0.137 - i * 0.023],
            [0, 0.191 + i * 0.017, 0.14 - i * 0.023],
            [0.057, 0.18 + i * 0.016, 0.137 - i * 0.023],
          ]}
          radius={0.007}
          color="#fffaf1"
        />
      ))}
      <Strand
        points={[
          [0.107, 0.13, -0.02],
          [0.119, 0.14, 0.04],
          [0.1, 0.18, 0.1],
          [0.1, 0.17, 0.035],
        ]}
        radius={0.012}
        color="#fffaf1"
      />
      <Strand
        points={[
          [-0.09, 0.08, 0.22],
          [0, 0.085, 0.253],
          [0.09, 0.08, 0.22],
        ]}
        radius={0.004}
        color="#b8bad1"
      />
    </group>
  );
}
function Hand({ skin }) {
  return (
    <group position={[0, -0.235, 0]}>
      <Orb scale={[0.064, 0.085, 0.051]} color={skin} />
      {[-1, 0, 1, 2].map((i) => (
        <Orb
          key={i}
          at={[i * 0.022 - 0.011, -0.068, 0.012]}
          scale={[0.016, 0.045, 0.02]}
          color={skin}
        />
      ))}
      <Orb
        at={[-0.055, -0.017, 0.04]}
        scale={[0.028, 0.055, 0.028]}
        color={skin}
      />
    </group>
  );
}
function Arm({ side, color, skin, armRef }) {
  return (
    <group
      ref={armRef}
      position={[side * 0.27, 1.43, 0]}
      rotation={[0, 0, side * 0.25]}
    >
      <Orb at={[0, -0.13, 0]} scale={[0.112, 0.21, 0.112]} color={color} />
      <group name="elbow" position={[0, -0.28, 0]} rotation={[-0.3, 0, 0]}>
        <Orb at={[0, -0.1, 0]} scale={[0.087, 0.16, 0.09]} color={color} />
        <Ring
          at={[0, -0.21, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          radius={0.071}
          tube={0.018}
          color={color}
        />
        <Hand skin={skin} />
      </group>
    </group>
  );
}
function Leg({ side, pants, accent, shoe, boy, skin, legRef }) {
  return (
    <group ref={legRef} position={[side * 0.125, 0.87, 0]}>
      <Orb at={[0, -0.17, 0]} scale={[0.125, 0.235, 0.133]} color={pants} />
      <group name="knee" position={[0, -0.34, 0]}>
        <Orb
          at={[0, -0.16, 0]}
          scale={[boy ? 0.083 : 0.096, 0.22, boy ? 0.083 : 0.096]}
          color={boy ? skin : pants}
        />
        {!boy && (
          <Strand
            points={[
              [side * 0.083, -0.32, 0.025],
              [side * 0.093, -0.17, 0.036],
              [side * 0.085, 0, 0.028],
            ]}
            radius={0.014}
            color={accent}
          />
        )}
        {boy && (
          <Orb
            at={[0, -0.28, 0]}
            scale={[0.087, 0.075, 0.087]}
            color="#f9f6ef"
          />
        )}
        <group position={[0, -0.48, 0.03]}>
          <Shoe color={shoe} />
        </group>
      </group>
      {!boy && (
        <Strand
          points={[
            [side * 0.1, 0.04, 0.02],
            [side * 0.12, -0.13, 0.045],
            [side * 0.1, -0.32, 0.025],
          ]}
          radius={0.014}
          color={accent}
        />
      )}
    </group>
  );
}
function Hair({ kind, color, accent, hairRef, style = 0 }) {
  const streak = "#6b3d23";
  return (
    <group>
      <mesh
        position={[0, 1.94, -0.025]}
        scale={[1, 1.03, 1]}
        castShadow
        material={material(color, 0.31)}
      >
        <sphereGeometry
          args={[0.345, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.6]}
        />
      </mesh>
      {kind === 1 ? (
        Array.from({ length: 45 }, (_, i) => {
          const t = i * 2.39996,
            r = 0.29 * Math.sqrt(i / 45);
          return (
            <Orb
              key={i}
              at={[
                Math.cos(t) * r,
                2.205 - 0.17 * (i / 45),
                Math.sin(t) * r - 0.02,
              ]}
              scale={[0.066, 0.061, 0.065]}
              color={color}
              roughness={0.7}
            />
          );
        })
      ) : (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <Strand
              key={i}
              points={[
                [0.2 - i * 0.038, 2.2, -0.09],
                [0.15 - i * 0.045, 2.21, 0.15],
                [-0.12 - i * 0.025, 2.1, 0.28],
                [-0.27 - i * 0.002, 1.91, 0.16],
              ]}
              radius={0.034 - i * 0.0013}
              color={i % 3 === 0 ? streak : color}
            />
          ))}
          <Strand
            points={[
              [0.24, 2.08, 0.14],
              [0.3, 1.94, 0.18],
              [0.3, 1.78, 0.17],
              [0.26, 1.66, 0.2],
            ]}
            radius={0.028}
            color={color}
          />
        </>
      )}
      {kind === 0 && (
        <group
          ref={hairRef}
          position={style === 1 ? [0, 2.18, -0.08] : [-0.12, 2.15, -0.16]}
        >
          <Orb scale={[0.1, 0.09, 0.09]} color={accent} />
          {style === 2
            ? [-1, 1].map((s) => (
                <group key={s} position={[s * 0.27, -0.03, 0]}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <Orb
                      key={i}
                      at={[
                        Math.sin(i * 2.4) * 0.075,
                        Math.cos(i * 2.4) * 0.075,
                        (i % 3) * 0.06,
                      ]}
                      scale={[0.085, 0.085, 0.085]}
                      color={color}
                    />
                  ))}
                </group>
              ))
            : style === 1
              ? Array.from({ length: 9 }, (_, i) => (
                  <Strand
                    key={i}
                    points={[
                      [Math.sin(i * 0.7) * 0.12, 0, Math.cos(i * 0.7) * 0.12],
                      [
                        Math.sin(i * 0.7 + 1) * 0.18,
                        0.13,
                        Math.cos(i * 0.7 + 1) * 0.18,
                      ],
                      [
                        Math.sin(i * 0.7 + 2) * 0.13,
                        0.25,
                        Math.cos(i * 0.7 + 2) * 0.13,
                      ],
                      [0, 0.24, 0],
                    ]}
                    radius={0.047}
                    color={i % 3 === 0 ? streak : color}
                  />
                ))
              : Array.from({ length: 10 }, (_, i) => {
                  const offset = (i - 4.5) * 0.026;
                  return (
                    <Strand
                      key={i}
                      points={[
                        [offset, 0, -0.02],
                        [offset - 0.17, 0.12, -0.12],
                        [offset - 0.33, -0.02, -0.18],
                        [offset - 0.4, -0.27, -0.13],
                        [offset - 0.29, -0.49, -0.2],
                        [offset - 0.38, -0.66, -0.19],
                      ]}
                      radius={0.05}
                      color={i % 4 === 0 ? streak : color}
                    />
                  );
                })}
        </group>
      )}
      {kind === 2 && (
        <>
          {[-1, 1].map((side) => (
            <group key={side}>
              {Array.from({ length: 12 }, (_, i) => (
                <Orb
                  key={i}
                  at={[
                    side * (0.285 + 0.028 * Math.sin(i * 2)),
                    1.88 - i * 0.052,
                    -0.14 + 0.017 * Math.cos(i * 2),
                  ]}
                  scale={[0.048, 0.044, 0.049]}
                  color={color}
                />
              ))}
              <Orb
                at={[side * 0.28, 1.28, -0.14]}
                scale={[0.045, 0.02, 0.045]}
                color={accent}
              />
            </group>
          ))}
          <group rotation={[0, Math.PI, 0]}>
            <mesh
              position={[0, 2.01, -0.015]}
              castShadow
              material={material(accent, 0.4)}
            >
              <sphereGeometry
                args={[0.36, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]}
              />
            </mesh>
            <Orb
              at={[0, 2.014, 0.3]}
              scale={[0.29, 0.025, 0.2]}
              color={accent}
            />
            <RoundedBox
              args={[0.2, 0.065, 0.018]}
              radius={0.012}
              position={[0, 2.04, -0.365]}
              material={material(accent)}
            />
            <Orb
              at={[0, 2.37, 0]}
              scale={[0.025, 0.018, 0.025]}
              color={accent}
            />
            {[0, 1, 2, 3].map((i) => (
              <Strand
                key={i}
                points={[
                  [
                    Math.sin((i * Math.PI) / 2) * 0.35,
                    2.02,
                    Math.cos((i * Math.PI) / 2) * 0.35,
                  ],
                  [
                    Math.sin((i * Math.PI) / 2) * 0.25,
                    2.27,
                    Math.cos((i * Math.PI) / 2) * 0.25,
                  ],
                  [0, 2.37, 0],
                ]}
                radius={0.003}
                color="#eab00e"
              />
            ))}
          </group>
        </>
      )}
    </group>
  );
}
export function Character({
  kind = 0,
  look,
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  action = "idle",
  engine,
  holderSide = 0,
  preview = false,
  handAnchor,
  anchorIndex = 0,
  ropePhase,
}) {
  const root = useRef(),
    body = useRef(),
    head = useRef(),
    leftArm = useRef(),
    rightArm = useRef(),
    leftLeg = useRef(),
    rightLeg = useRef(),
    hair = useRef(),
    eyeL = useRef(),
    eyeR = useRef();
  const shirt = ITEMS.outfit[look?.outfit ?? kind]?.color || "#fc278b",
    hairColor =
      ITEMS.hair[look?.hair ?? (kind === 1 ? 1 : 0)]?.color || "#3b1c10",
    shoes = ITEMS.shoes[look?.shoes ?? kind]?.color || shirt,
    skin = SKIN[look?.skin ?? (kind === 1 ? 3 : 2)] || SKIN[2];
  useFrame(({ clock }, dt) => {
    if (!root.current) return;
    const t = clock.elapsedTime,
      match = engine?.current;
    let age = match?.jumpAge ?? 9;
    const playing = action === "play",
      welcome = action === "welcome",
      win = action === "victory",
      phase = ropePhase?.current ?? t * 2.6,
      welcomeAge = (phase / 2.6 + 0.38) % ((Math.PI * 2) / 2.6),
      jump = holderSide
        ? 0
        : welcome
          ? jumpHeight(welcomeAge)
          : playing
            ? jumpHeight(age)
            : 0;
    root.current.position.y = position[1] + jump;
    const s =
      1 -
      Math.max(0, Math.sin((age / 0.76) * Math.PI)) *
        0.06 *
        (playing && !holderSide && age < 0.76 ? 1 : 0);
    body.current.scale.set(1 + (1 - s) * 0.5, s, 1);
    body.current.rotation.z = holderSide
      ? holderSide * 0.07
      : Math.sin(t * 1.6) * 0.018;
    head.current.rotation.y = preview
      ? Math.sin(t * 0.6) * 0.13
      : holderSide
        ? holderSide * 0.28
        : Math.sin(t * 0.8) * 0.06;
    head.current.rotation.x = win ? -0.1 : Math.sin(t * 1.3) * 0.018;
    const blink = t % 4.3;
    const lid =
      blink < 0.14 ? Math.max(0.07, Math.abs(blink - 0.07) / 0.07) : 1;
    for (const eye of [eyeL, eyeR]) if (eye.current) eye.current.scale.y = lid;
    for (const [arm, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ])
      if (arm.current) {
        let z = side * (0.18 + jump * 0.6);
        let x = -0.1;
        if (holderSide) {
          const phase =
            ropePhase?.current ?? (playing ? (match?.phase ?? 0) : t * 2.6);
          x = -0.55 + Math.sin(phase) * 0.24;
          z = side * 0.3;
        }
        if (win) {
          z = side * 2.45 + Math.sin(t * 7) * 0.08;
          x = -0.2;
        }
        arm.current.rotation.set(x, 0, z);
        arm.current.getObjectByName("elbow").rotation.x = holderSide
          ? -0.85
          : -0.38 - jump * 0.55;
      }
    for (const [leg, side] of [
      [leftLeg, -1],
      [rightLeg, 1],
    ])
      if (leg.current) {
        leg.current.rotation.x = -jump * 0.62;
        leg.current.rotation.z = side * 0.025;
        leg.current.getObjectByName("knee").rotation.x = jump * 1.15;
      }
    if (handAnchor && holderSide) {
      root.current.updateWorldMatrix(true, true);
      const arm = holderSide === 1 ? rightArm.current : leftArm.current;
      if (arm)
        arm
          .getObjectByName("elbow")
          .localToWorld(handAnchor.current[anchorIndex].set(0, -0.29, 0.015));
    }
    if (hair.current) {
      hair.current.rotation.x = Math.sin(t * 2.6) * 0.12 + jump * 0.16;
      hair.current.rotation.z = Math.sin(t * 2) * 0.08;
    }
  }, -2);
  return (
    <group
      name={`character-${kind}`}
      ref={root}
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
      dispose={null}
    >
      <group ref={body}>
        <Leg
          side={-1}
          legRef={leftLeg}
          pants="#252331"
          accent={shirt}
          shoe={shoes}
          skin={skin}
          boy={kind === 1}
        />
        <Leg
          side={1}
          legRef={rightLeg}
          pants="#252331"
          accent={shirt}
          shoe={shoes}
          skin={skin}
          boy={kind === 1}
        />
        <Sculpt
          profile={[
            [0.17, 0.81],
            [0.235, 0.84],
            [0.245, 0.94],
            [0.26, 1.12],
            [0.275, 1.36],
            [0.22, 1.49],
            [0.1, 1.52],
          ]}
          scale={[1, 1, 0.76]}
          color={shirt}
        />
        <Orb at={[0, 1.43, -0.13]} scale={[0.25, 0.19, 0.16]} color={shirt} />
        <Orb
          at={[0, 1.47, -0.17]}
          scale={[0.15, 0.11, 0.065]}
          color="#35183f"
        />
        <RoundedBox
          args={[0.27, 0.15, 0.045]}
          radius={0.045}
          smoothness={4}
          position={[0, 1.01, 0.191]}
          castShadow
          material={material(shirt, 0.6)}
        />
        <Strand
          points={[
            [0, 0.85, 0.18],
            [0, 1.12, 0.2],
            [0, 1.44, 0.15],
          ]}
          radius={0.007}
          color="#ffc7dd"
        />
        {[-1, 1].map((side) => (
          <React.Fragment key={side}>
            <Strand
              points={[
                [side * 0.075, 1.45, 0.17],
                [side * 0.088, 1.32, 0.22],
                [side * 0.08, 1.22, 0.23],
              ]}
              radius={0.008}
              color="#fff0e8"
            />
            <Orb
              at={[side * 0.08, 1.22, 0.23]}
              scale={[0.011, 0.023, 0.011]}
              color="#e1d4d3"
            />
          </React.Fragment>
        ))}
        <Strand
          points={[
            [0.1, 1.33, 0.198],
            [0.17, 1.33, 0.18],
          ]}
          radius={0.005}
          color="white"
        />
        <Arm side={-1} armRef={leftArm} color={shirt} skin={skin} />
        <Arm side={1} armRef={rightArm} color={shirt} skin={skin} />
        <Orb at={[0, 1.53, 0]} scale={[0.091, 0.13, 0.09]} color={skin} />
        <group ref={head} position={[0, 1.55, 0]}>
          <group position={[0, -1.55, 0]}>
            <Orb
              at={[0, 1.89, 0]}
              scale={[0.335, 0.38, 0.292]}
              color={skin}
              roughness={0.58}
            />
            <Orb
              at={[0, 1.74, 0.12]}
              scale={[0.245, 0.2, 0.2]}
              color={skin}
              roughness={0.58}
            />
            {[-1, 1].map((side) => (
              <group key={side}>
                <Orb
                  at={[side * 0.327, 1.85, 0]}
                  scale={[0.073, 0.092, 0.045]}
                  color={skin}
                />
                <Orb
                  at={[side * 0.345, 1.85, 0.032]}
                  scale={[0.036, 0.057, 0.015]}
                  color="#a65a3d"
                />
                {kind !== 1 && (
                  <Ring
                    at={[side * 0.34, 1.75, 0.026]}
                    radius={0.052}
                    tube={0.008}
                    color="#ffce47"
                  />
                )}
                <Orb
                  at={[side * 0.212, 1.79, 0.231]}
                  scale={[0.063, 0.026, 0.014]}
                  color="#cb805a"
                />
              </group>
            ))}
            <Eye x={-0.132} blink={eyeL} skin={skin} />
            <Eye x={0.132} blink={eyeR} skin={skin} />
            {[-1, 1].map((side) => (
              <Strand
                key={side}
                points={[
                  [side * 0.065, 2.09, 0.235],
                  [side * 0.13, 2.11, 0.25],
                  [side * 0.215, 2.075, 0.2],
                ]}
                radius={0.021}
                color={hairColor}
              />
            ))}
            <Orb
              at={[0, 1.82, 0.292]}
              scale={[0.053, 0.048, 0.052]}
              color={skin}
            />
            <Orb
              at={[-0.024, 1.807, 0.326]}
              scale={[0.011, 0.007, 0.007]}
              color="#8a462b"
            />
            <Orb
              at={[0.024, 1.807, 0.326]}
              scale={[0.011, 0.007, 0.007]}
              color="#8a462b"
            />
            <Orb
              at={[0, 1.711, 0.282]}
              scale={[0.104, 0.066, 0.022]}
              color="#6c1e2b"
            />
            <Orb
              at={[0, 1.741, 0.302]}
              scale={[0.083, 0.021, 0.009]}
              color="#fff9ee"
            />
            <Orb
              at={[0, 1.68, 0.302]}
              scale={[0.052, 0.014, 0.008]}
              color="#ec7985"
            />
            <Hair
              kind={kind}
              color={hairColor}
              accent={shirt}
              hairRef={hair}
              style={look?.style || 0}
            />
          </group>
        </group>
      </group>
    </group>
  );
}
export function Outfit({ color = "#fc278b" }) {
  return (
    <group position={[0, -0.9, 0]} dispose={null}>
      <Sculpt
        profile={[
          [0.2, 0.7],
          [0.27, 0.78],
          [0.28, 1.15],
          [0.26, 1.4],
          [0.12, 1.46],
        ]}
        color={color}
        scale={[1, 1, 0.75]}
      />
      <Orb at={[0, 1.39, -0.08]} scale={[0.25, 0.18, 0.16]} color={color} />
      <Arm side={-1} color={color} skin={color} />
      <Arm side={1} color={color} skin={color} />
      <Leg side={-1} pants="#282431" accent={color} shoe={color} skin={color} />
      <Leg side={1} pants="#282431" accent={color} shoe={color} skin={color} />
    </group>
  );
}
