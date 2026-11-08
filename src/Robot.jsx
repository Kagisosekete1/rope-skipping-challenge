import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { jumpHeight } from "./game";
const shell = "#e9f4ff",
  ink = "#10203f",
  cyan = "#29e7ff",
  orange = "#ff9c27";
function Metal({ color = shell, glow = false }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.26}
      metalness={0.35}
      emissive={glow ? color : "#000000"}
      emissiveIntensity={glow ? 1.1 : 0}
    />
  );
}
function Ball({ position, scale, color = ink }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[1, 24, 16]} />
      <Metal color={color} />
    </mesh>
  );
}
function Limb({ side, arm = false, joint }) {
  return (
    <group
      ref={joint}
      position={arm ? [side * 0.35, 1.42, 0] : [side * 0.17, 0.86, 0]}
    >
      <Ball
        position={[0, 0, 0]}
        scale={arm ? [0.09, 0.09, 0.09] : [0.11, 0.11, 0.11]}
      />
      <RoundedBox
        position={[0, arm ? -0.13 : -0.14, 0]}
        args={arm ? [0.14, 0.25, 0.15] : [0.19, 0.27, 0.19]}
        radius={0.06}
        castShadow
      >
        <Metal />
      </RoundedBox>
      <group
        name={arm ? "robot-elbow" : "robot-knee"}
        position={[0, arm ? -0.27 : -0.29, 0]}
      >
        <Ball position={[0, 0, 0]} scale={[0.08, 0.08, 0.08]} color={orange} />
        <RoundedBox
          position={[0, -0.13, 0.015]}
          args={arm ? [0.13, 0.23, 0.14] : [0.17, 0.26, 0.18]}
          radius={0.055}
          castShadow
        >
          <Metal />
        </RoundedBox>
        {arm ? (
          <>
            <Ball
              position={[0, -0.29, 0.035]}
              scale={[0.085, 0.09, 0.075]}
              color={ink}
            />
            {[-1, 0, 1].map((i) => (
              <RoundedBox
                key={i}
                position={[i * 0.04, -0.36, 0.045]}
                args={[0.03, 0.1, 0.04]}
                radius={0.012}
                castShadow
              >
                <Metal color={shell} />
              </RoundedBox>
            ))}
          </>
        ) : (
          <>
            <RoundedBox
              position={[0, -0.41, 0.085]}
              args={[0.29, 0.21, 0.42]}
              radius={0.07}
              castShadow
            >
              <Metal color={orange} />
            </RoundedBox>
            <RoundedBox
              position={[0, -0.49, 0.085]}
              args={[0.3, 0.065, 0.43]}
              radius={0.025}
            >
              <Metal color={ink} />
            </RoundedBox>
            <mesh position={[0, -0.38, 0.3]}>
              <boxGeometry args={[0.17, 0.035, 0.009]} />
              <Metal color={cyan} glow />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}
export function Robot({
  position = [0, 0, 0],
  scale = 1,
  rotation = 0,
  action = "idle",
  engine,
}) {
  const root = useRef(),
    head = useRef(),
    body = useRef(),
    armL = useRef(),
    armR = useRef(),
    legL = useRef(),
    legR = useRef(),
    eyes = useRef();
  const smile = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.1, 0, 0),
          new THREE.Vector3(0, -0.035, 0.003),
          new THREE.Vector3(0.1, 0, 0),
        ]),
        16,
        0.009,
        8,
        false,
      ),
    [],
  );
  useFrame(({ clock }) => {
    if (!root.current) return;
    const t = clock.elapsedTime,
      m = engine?.current,
      jump = action === "play" ? jumpHeight(m?.jumpAge ?? 9) : 0,
      win = action === "victory";
    root.current.position.y = position[1] + jump;
    head.current.rotation.y = Math.sin(t * 0.8) * 0.07;
    head.current.rotation.z = win ? Math.sin(t * 4) * 0.1 : 0;
    const blink = t % 4;
    eyes.current.scale.y =
      blink < 0.12 ? Math.max(0.08, Math.abs(blink - 0.06) / 0.06) : 1;
    for (const [a, s] of [
      [armL, -1],
      [armR, 1],
    ]) {
      a.current.rotation.z = s * (win ? 2.5 : 0.16 + jump * 0.8);
      a.current.rotation.x = win ? -0.25 : -0.1 - jump * 0.25;
      a.current.getObjectByName("robot-elbow").rotation.x = -0.25 - jump * 0.4;
    }
    for (const leg of [legL, legR]) {
      leg.current.rotation.x = -jump * 0.55;
      leg.current.getObjectByName("robot-knee").rotation.x = jump * 0.95;
    }
    body.current.rotation.z = win
      ? Math.sin(t * 5) * 0.04
      : Math.sin(t * 1.7) * 0.012;
  }, -2);
  return (
    <group
      ref={root}
      position={position}
      scale={scale}
      rotation={[0, rotation, 0]}
      name="beatbot"
    >
      <group ref={body}>
        <Limb side={-1} joint={legL} />
        <Limb side={1} joint={legR} />
        <RoundedBox
          position={[0, 1.2, 0]}
          args={[0.64, 0.65, 0.4]}
          radius={0.17}
          smoothness={5}
          castShadow
        >
          <Metal />
        </RoundedBox>
        <RoundedBox
          position={[0, 1.22, 0.21]}
          args={[0.38, 0.38, 0.045]}
          radius={0.09}
        >
          <Metal color={ink} />
        </RoundedBox>
        <mesh position={[0, 1.25, 0.25]}>
          <torusGeometry args={[0.105, 0.014, 12, 32]} />
          <Metal color={cyan} glow />
        </mesh>
        <mesh position={[0, 1.25, 0.253]}>
          <circleGeometry args={[0.063, 24]} />
          <Metal color={orange} glow />
        </mesh>
        {[-1, 0, 1].map((i) => (
          <mesh key={i} position={[i * 0.065, 1.07, 0.251]}>
            <boxGeometry args={[0.035, 0.016, 0.008]} />
            <Metal color={cyan} glow />
          </mesh>
        ))}
        <Limb side={-1} arm joint={armL} />
        <Limb side={1} arm joint={armR} />
        <mesh position={[0, 1.59, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.15, 16]} />
          <Metal color={ink} />
        </mesh>
        <group ref={head} position={[0, 1.91, 0]}>
          <RoundedBox
            args={[0.78, 0.58, 0.56]}
            radius={0.19}
            smoothness={6}
            castShadow
          >
            <Metal />
          </RoundedBox>
          <RoundedBox
            position={[0, -0.005, 0.28]}
            args={[0.64, 0.37, 0.045]}
            radius={0.12}
            smoothness={5}
          >
            <Metal color={ink} />
          </RoundedBox>
          <group ref={eyes} position={[0, 0.025, 0.315]}>
            {[-1, 1].map((s) => (
              <RoundedBox
                key={s}
                position={[s * 0.15, 0.018, 0]}
                args={[0.09, 0.135, 0.015]}
                radius={0.04}
              >
                <Metal color={cyan} glow />
              </RoundedBox>
            ))}
          </group>
          <mesh geometry={smile} position={[0, -0.09, 0.32]}>
            <Metal color={cyan} glow />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.4, 0.015, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.115, 0.115, 0.12, 24]} />
                <Metal color={ink} />
              </mesh>
              <mesh position={[s * 0.065, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.078, 0.078, 0.016, 24]} />
                <Metal color={orange} />
              </mesh>
            </group>
          ))}
          <mesh position={[0.16, 0.36, -0.05]} rotation={[0, 0, -0.2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.2, 12]} />
            <Metal color={ink} />
          </mesh>
          <Ball
            position={[0.18, 0.47, -0.05]}
            scale={[0.047, 0.047, 0.047]}
            color={orange}
          />
          <RoundedBox
            position={[-0.2, 0.2, 0.22]}
            args={[0.12, 0.026, 0.025]}
            radius={0.01}
          >
            <Metal color={orange} />
          </RoundedBox>
        </group>
      </group>
    </group>
  );
}
