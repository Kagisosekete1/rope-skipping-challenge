import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  RoundedBox,
  Text3D,
  Center,
  ContactShadows,
  Sky,
  Environment,
  Lightformer,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { Character } from "./Character";
import { Robot } from "./Robot";
import { RopePhysics } from "./rope";
import { ITEMS } from "./game";
const gold = "#ffd323";
function Pbr({ color, roughness = 0.6, metalness = 0, ...props }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      {...props}
    />
  );
}
function Beam({ a, b, r = 0.025, color = "#97b8cb" }) {
  const v = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    v.clone().normalize(),
  );
  return (
    <mesh
      position={new THREE.Vector3(...a)
        .add(new THREE.Vector3(...b))
        .multiplyScalar(0.5)}
      quaternion={q}
      castShadow
    >
      <cylinderGeometry args={[r, r, v.length(), 8]} />
      <Pbr color={color} metalness={0.35} />
    </mesh>
  );
}
function graffitiTexture() {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#6274c3";
  x.fillRect(0, 0, c.width, c.height);
  const colors = ["#ffb620", "#f761bd", "#53e6b7", "#b770ff", "#ff8b59"];
  for (let i = 0; i < 10; i++) {
    x.save();
    x.translate(i * 220 - 25, 260 + (i % 2) * 20);
    x.rotate(i % 2 ? 0.07 : -0.07);
    x.font = "900 italic 150px Arial";
    x.lineJoin = "round";
    x.lineWidth = 23;
    x.strokeStyle = "#29377b";
    x.strokeText(["SKIP", "PLAY", "JUMP!", "JOY", "GO!"][i % 5], 0, 0);
    x.fillStyle = colors[i % 5];
    x.fillText(["SKIP", "PLAY", "JUMP!", "JOY", "GO!"][i % 5], 0, 0);
    x.lineWidth = 3;
    x.strokeStyle = "#ffffff90";
    x.strokeText(["SKIP", "PLAY", "JUMP!", "JOY", "GO!"][i % 5], 0, 0);
    x.restore();
  }
  for (let i = 0; i < 140; i++) {
    x.fillStyle = colors[i % 5];
    x.beginPath();
    x.arc((i * 137) % 2048, (i * 83) % 512, 2 + (i % 4), 0, Math.PI * 2);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function courtTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  x.fillStyle = "#df808d";
  x.fillRect(0, 0, 256, 256);
  let seed = 13;
  for (let i = 0; i < 12000; i++) {
    seed = (seed * 16807) % 2147483647;
    x.fillStyle = i % 2 ? "#ffe2cf35" : "#902e5933";
    x.fillRect(seed % 256, Math.floor(seed / 256) % 256, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(14, 14);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function Tree({ at, scale = 1, seed = 0 }) {
  return (
    <group position={at} scale={scale}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.23, 2.5, 10]} />
        <Pbr color="#79503a" />
      </mesh>
      {[-1, 1].map((s) => (
        <Beam
          key={s}
          a={[0, 1.6, 0]}
          b={[s * 0.65, 2.6, 0.1]}
          r={0.07}
          color="#79503a"
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const t = i * 2.4 + seed;
        return (
          <mesh
            key={i}
            position={[
              Math.sin(t) * 0.75,
              2.7 + (i % 3) * 0.35,
              Math.cos(t) * 0.65,
            ]}
            scale={[0.85, 0.75, 0.85]}
            castShadow
          >
            <sphereGeometry args={[0.85, 12, 10]} />
            <Pbr color={["#71b82c", "#3d9b3d", "#93c93c"][i % 3]} />
          </mesh>
        );
      })}
    </group>
  );
}
function PlaygroundLife() {
 const birds=useRef([]),walkers=useRef([]);
 useFrame(({clock})=>{
  const t=clock.elapsedTime;
  birds.current.forEach((b,i)=>{if(!b)return;b.position.set(((t*.65+i*4)%30)-15,6+Math.sin(t*.5+i)*.5,-8-i*.4);b.children.forEach((w,j)=>w.rotation.z=(j?1:-1)*(.35+Math.sin(t*7+i)*.5));});
  walkers.current.forEach((w,i)=>{if(!w)return;w.position.x=((t*.35+i*9)%30)-15;w.position.y=.04+Math.abs(Math.sin(t*3+i))*.025;});
 });
 return <group>
 {[0,1,2,3,4].map(i=><group key={'bird'+i} ref={e=>birds.current[i]=e}>{[-1,1].map(side=><mesh key={side} position={[side*.15,0,0]} rotation={[0,0,side*.35]}><capsuleGeometry args={[.035,.3,4,8]}/><meshStandardMaterial color="#f9f1dc"/></mesh>)}</group>)}
 {[0,1,2].map(i=><group key={'walker'+i} ref={e=>walkers.current[i]=e} position={[i*5,0,-6.7]} scale={.55}><Character kind={i} look={{outfit:i,hair:0,shoes:i,skin:i+1,style:0}} action="walk" /></group>)}
 <group position={[0,2.9,-4.05]}><RoundedBox args={[7.7,1.15,.16]} radius={.15}><meshStandardMaterial color="#0539a0" metalness={.25} roughness={.3}/></RoundedBox><Center position={[0,.17,.12]}><Text3D font={import.meta.env.BASE_URL+'fonts/helvetiker_bold.typeface.json'} size={.38} height={.045} bevelEnabled bevelSize={.012} bevelThickness={.012}>ROPE SKIPPING<meshStandardMaterial color="#ffd327" metalness={.3} roughness={.25}/></Text3D></Center><Center position={[0,-.29,.12]}><Text3D font={import.meta.env.BASE_URL+'fonts/helvetiker_bold.typeface.json'} size={.23} height={.025}>CHALLENGE<meshStandardMaterial color="#eafbff"/></Text3D></Center></group>
 </group>;
}
function Playground() {
  const graffiti = useMemo(graffitiTexture, []),
    ground = useMemo(courtTexture, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={ground} roughness={0.87} />
      </mesh>
      <mesh position={[0, 0.012, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.48, 2.52, 96]} />
        <Pbr color="#ffeada" />
      </mesh>
      {[-3, 3].map((z) => (
        <mesh key={z} position={[0, 0.014, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 0.045]} />
          <Pbr color="#fff2df" />
        </mesh>
      ))}
      {[-6, 6].map((x) => (
        <mesh key={x} position={[x, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.045, 12]} />
          <Pbr color="#fff2df" />
        </mesh>
      ))}
      <mesh position={[0, 0.8, -3.8]} receiveShadow>
        <boxGeometry args={[28, 1.6, 0.3]} />
        <meshStandardMaterial map={graffiti} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.64, -3.8]}>
        <boxGeometry args={[28, 0.1, 0.4]} />
        <Pbr color="#d3a39d" />
      </mesh>
      {Array.from({ length: 15 }, (_, i) => (
        <Beam
          key={i}
          a={[-14 + i * 2, 1.6, -3.75]}
          b={[-14 + i * 2, 3.25, -3.75]}
          r={0.028}
        />
      ))}
      <Beam a={[-14, 3.22, -3.75]} b={[14, 3.22, -3.75]} r={0.035} />
      {Array.from({ length: 94 }, (_, i) => {
        const x = -14 + i * 0.3;
        return (
          <React.Fragment key={i}>
            <Beam
              a={[x, 1.7, -3.76]}
              b={[Math.min(14, x + 1.45), 3.15, -3.76]}
              r={0.006}
            />
            <Beam
              a={[x, 3.15, -3.76]}
              b={[Math.min(14, x + 1.45), 1.7, -3.76]}
              r={0.006}
            />
          </React.Fragment>
        );
      })}
      {[-7, -4.6, 5, 8].map((x, i) => (
        <Tree
          key={x}
          at={[x, 0, -5.1 - (i % 2)]}
          scale={1.2 + i * 0.12}
          seed={i}
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const h = 3.5 + ((i * 7) % 5),
          x = -16 + i * 4.1;
        return (
          <group key={i} position={[x, 0, -12 - (i % 2) * 3]}>
            <RoundedBox
              args={[3.3, h, 2.5]}
              radius={0.06}
              position={[0, h / 2, 0]}
            >
              <Pbr
                color={["#cf9aa4", "#84b8d5", "#afb5d3", "#e7b6a1"][i % 4]}
              />
            </RoundedBox>
            {Array.from({ length: Math.floor(h) * 3 }, (_, j) => (
              <mesh
                key={j}
                position={[
                  -0.95 + (j % 3) * 0.95,
                  0.8 + Math.floor(j / 3),
                  1.26,
                ]}
              >
                <boxGeometry args={[0.43, 0.62, 0.02]} />
                <Pbr color="#648da9" roughness={0.3} />
              </mesh>
            ))}
            <mesh position={[0, h + 0.1, 0]}>
              <boxGeometry args={[3.5, 0.2, 2.7]} />
              <Pbr color="#d2b1b2" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
const pipMap = {
  1: [[0, 0]],
  2: [
    [-1, 1],
    [1, -1],
  ],
  3: [
    [-1, 1],
    [0, 0],
    [1, -1],
  ],
  4: [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ],
  5: [
    [-1, 1],
    [1, 1],
    [0, 0],
    [-1, -1],
    [1, -1],
  ],
  6: [
    [-1, 1],
    [1, 1],
    [-1, 0],
    [1, 0],
    [-1, -1],
    [1, -1],
  ],
};
const faces = [
  { n: 1, pos: [0, 0, 0.506], rot: [0, 0, 0] },
  { n: 6, pos: [0, 0, -0.506], rot: [0, Math.PI, 0] },
  { n: 3, pos: [0.506, 0, 0], rot: [0, Math.PI / 2, 0] },
  { n: 4, pos: [-0.506, 0, 0], rot: [0, -Math.PI / 2, 0] },
  { n: 2, pos: [0, 0.506, 0], rot: [-Math.PI / 2, 0, 0] },
  { n: 5, pos: [0, -0.506, 0], rot: [Math.PI / 2, 0, 0] },
];
export function Dice({
  value = 1,
  rolling = false,
  position = [0, 1, 0],
  scale = 1,
}) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current) return;
    const rotations = {
      1: [0, 0, 0],
      6: [0, Math.PI, 0],
      3: [0, -Math.PI / 2, 0],
      4: [0, Math.PI / 2, 0],
      2: [Math.PI / 2, 0, 0],
      5: [-Math.PI / 2, 0, 0],
    };
    const [x, y, z] = rotations[value] || rotations[1];
    const t = gsap.to(ref.current.rotation, {
      x: rolling ? Math.PI * 8 + 0.25 : x,
      y: rolling ? Math.PI * 10 + 0.3 : y,
      z: rolling ? Math.PI * 4 + 0.2 : z,
      duration: rolling ? 1.6 : 0.45,
      ease: rolling ? "power2.out" : "back.out(1.2)",
    });
    return () => t.kill();
  }, [value, rolling]);
  return (
    <group position={position} scale={scale}>
      <group ref={ref}>
        <RoundedBox args={[1, 1, 1]} radius={0.12} smoothness={6} castShadow>
          <meshPhysicalMaterial
            color="#fffbf4"
            roughness={0.22}
            clearcoat={0.6}
            clearcoatRoughness={0.19}
          />
        </RoundedBox>
        {faces.map((face) => (
          <group key={face.n} position={face.pos} rotation={face.rot}>
            {pipMap[face.n].map(([x, y], i) => (
              <mesh key={i} position={[x * 0.255, y * 0.255, 0]}>
                <circleGeometry args={[0.075, 24]} />
                <Pbr color="#111b31" roughness={0.3} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
function Rope({ phase, anchors, color, paused }) {
  const count = 40,
    sim = useMemo(() => new RopePhysics(count), []),
    refs = useRef([]),
    white = useRef([]);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame((_, dt) => {
    const a = anchors.current[0],
      b = anchors.current[1];
    const pts = sim.step(paused ? 0 : dt, phase.current, a, b);
    for (let i = 0; i < count; i++) {
      const mesh = refs.current[i],
        next = pts[i + 1],
        p = pts[i],
        dir = new THREE.Vector3().subVectors(next, p);
      if (mesh) {
        mesh.position.copy(p).add(next).multiplyScalar(0.5);
        mesh.quaternion.setFromUnitVectors(up, dir.clone().normalize());
        mesh.scale.y = dir.length() + 0.008;
      }
    }
  }, -1);
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 1, 8]} />
          <meshStandardMaterial
            color={i % 4 === 0 ? "#fff0b5" : color}
            roughness={0.31}
            metalness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}
function Logo() {
  const font = import.meta.env.BASE_URL + "fonts/helvetiker_bold.typeface.json";
  return (
    <group position={[0, 4.18, -0.1]}>
      {[
        { text: "ROPE", y: 0.48, size: 0.62 },
        { text: "SKIPPING", y: -0.2, size: 0.62 },
        { text: "CHALLENGE", y: -0.75, size: 0.29 },
      ].map(({ text, y, size }, i) => (
        <group key={text} position={[0, y, 0]}>
          <Center>
            <Text3D
              font={font}
              size={size}
              height={0.12}
              bevelEnabled
              bevelSize={0.022}
              bevelThickness={0.025}
              bevelSegments={3}
              curveSegments={12}
            >
              <meshPhysicalMaterial
                color={i === 2 ? "#fff9ea" : "#ffcb0e"}
                roughness={0.26}
                metalness={0.25}
                clearcoat={0.6}
              />
              {text}
            </Text3D>
          </Center>
          <Center position={[0, -0.018, -0.055]}>
            <Text3D
              font={font}
              size={size}
              height={0.12}
              bevelEnabled
              bevelSize={0.055}
              bevelThickness={0.04}
              bevelSegments={3}
            >
              <Pbr color="#073b8b" roughness={0.32} />
              {text}
            </Text3D>
          </Center>
        </group>
      ))}
      <RoundedBox
        position={[0, -0.75, -0.08]}
        args={[3.15, 0.58, 0.18]}
        radius={0.13}
      >
        <Pbr color="#007bff" metalness={0.25} />
      </RoundedBox>
    </group>
  );
}
function CameraRig({ screen }) {
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const portrait = size.width / size.height < 0.85;
    let pos, look;
    if (screen === "welcome") {
      pos = portrait ? [0, 2.85, 10.8] : [0, 2.65, 8.8];
      look = [0, 2.37, 0];
    } else if (["customize", "profile"].includes(screen)) {
      pos = portrait ? [0, 2.1, 7.9] : [0, 2.0, 7.5];
      look = [portrait ? 0 : 1, portrait ? 0.0 : 1.3, 0];
    } else if (screen === "rewards") {
      pos = [0, 2.15, 7.4];
      look = [0, 1.7, 0];
    } else {
      pos = portrait ? [0, 3.1, 10.7] : [0, 2.8, 8.5];
      look = [0, 1.25, 0];
    }
    camera.position.lerp(new THREE.Vector3(...pos), 1 - Math.exp(-dt * 5));
    target.lerp(new THREE.Vector3(...look), 1 - Math.exp(-dt * 5));
    camera.lookAt(target);
    camera.fov = portrait ? 49 : 40;
    camera.updateProjectionMatrix();
  });
  return null;
}
export function ActiveJumper({
  screen,
  match,
  looks,
  portrait,
  engine,
  phase,
}) {
  const scale = portrait ? 1.08 : 1.18;
  if (screen === "gameplay" && match.mode === "cpu" && match.current === 1)
    return <Robot scale={scale} action="play" engine={engine} />;
  const kind =
    ["pvp", "online"].includes(match?.mode) && match.current === 1 ? 1 : 0;
  return (
    <Character
      kind={kind}
      look={looks[kind]}
      scale={scale}
      action={
        screen === "welcome"
          ? "welcome"
          : screen === "gameplay"
            ? "play"
            : "idle"
      }
      engine={engine}
      ropePhase={phase}
    />
  );
}
function World({ screen, engine, save, selection, lookDraft, match, quality }) {
  const phase = useRef(0),
    anchors = useRef([
      new THREE.Vector3(-2.14, 1.15, 0.12),
      new THREE.Vector3(2.14, 1.15, 0.12),
    ]);
  const { gl, size } = useThree();
  const portrait = size.width / size.height < 0.7;
  const spread = portrait ? 1.64 : 2.55;
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.18;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);
  useFrame(({ clock }, dt) => {
    if (screen === "gameplay") engine.current.tick(dt);
    phase.current =
      screen === "gameplay" ? engine.current.phase : clock.elapsedTime * 2.6;
  }, -3);
  const customization = screen === "customize",
    reward = screen === "rewards",
    profileFocus = screen === "profile",
    profileKind = Math.max(
      0,
      ["pink", "blue", "yellow"].indexOf(save.profile?.avatar),
    ),
    customLayout = customization || profileFocus,
    single = customLayout || reward,
    heroKind = customization
      ? selection
      : profileFocus
        ? profileKind
        : reward && ["pvp", "online"].includes(match.mode) && match.winner === 1
          ? 1
          : 0;
  const looks = save.looks.map((l, i) =>
    customization && selection === i ? lookDraft : l,
  );
  return (
    <>
      <color attach="background" args={["#67c5ff"]} />
      <fog attach="fog" args={["#a5d9f1", 14, 38]} />
      <Sky
        distance={1000}
        sunPosition={[4, 7, 5]}
        turbidity={3}
        rayleigh={0.7}
      />
      <ambientLight intensity={0.65} />
      <hemisphereLight args={["#d6efff", "#d9988a", 1.4]} />
      <directionalLight
        position={[-3, 7, 6]}
        intensity={3.4}
        color="#fff0d4"
        castShadow
        shadow-mapSize={quality === "high" ? 2048 : 1024}
        shadow-normalBias={0.025}
        shadow-bias={-0.00015}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[3, 4, -3]} intensity={2.3} color="#a7d8ff" />
      <directionalLight position={[4, 3, 4]} intensity={0.5} color="#ffcee7" />
      <Suspense fallback={null}>
        <Environment resolution={64} frames={1}>
          <Lightformer
            form="rect"
            intensity={2}
            position={[0, 5, -5]}
            scale={[10, 4, 1]}
          />
          <Lightformer
            intensity={1}
            position={[5, 2, 2]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[4, 5, 1]}
          />
        </Environment>
      </Suspense>
      <Playground />
      <PlaygroundLife />
      {screen === "welcome" && (
        <Suspense fallback={null}>
          <Logo />
        </Suspense>
      )}
      {single ? (
        <>
          <mesh
            position={[customLayout && !portrait ? -0.9 : 0, 0.08, 0]}
            receiveShadow
          >
            <cylinderGeometry args={[1.03, 1.13, 0.16, 64]} />
            <Pbr color="#0462c5" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh
            position={[customLayout && !portrait ? -0.9 : 0, 0.175, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.91, 0.97, 64]} />
            <meshStandardMaterial
              color="#65edff"
              emissive="#00c8ff"
              emissiveIntensity={2}
            />
          </mesh>
          {reward && match.mode === "cpu" && match.winner === 1 ? (
            <Robot position={[0, 0.19, 0]} scale={1.15} action="victory" />
          ) : (
            <>
              {" "}
              <Character
                kind={heroKind}
                look={looks[heroKind]}
                position={[
                  customLayout && !portrait ? -0.9 : 0,
                  customLayout && portrait ? 0.45 : 0.19,
                  0,
                ]}
                rotation={0.14}
                scale={customLayout && portrait ? 0.85 : 1.15}
                action={reward ? "victory" : "idle"}
                preview
              />
            </>
          )}
        </>
      ) : (
        <>
          <ActiveJumper
            screen={screen}
            match={match}
            looks={looks}
            portrait={portrait}
            engine={engine}
            phase={phase}
          />
          <Character
            kind={1}
            look={looks[1]}
            position={[-spread, 0, 0.1]}
            rotation={0.45}
            scale={portrait ? 0.84 : 1.1}
            action={screen === "gameplay" ? "play" : "idle"}
            engine={engine}
            ropePhase={phase}
            holderSide={1}
            handAnchor={anchors}
            anchorIndex={0}
          />
          <Character
            kind={2}
            look={looks[2]}
            position={[spread, 0, 0.1]}
            rotation={-0.45}
            scale={portrait ? 0.84 : 1.1}
            action={screen === "gameplay" ? "play" : "idle"}
            engine={engine}
            ropePhase={phase}
            holderSide={-1}
            handAnchor={anchors}
            anchorIndex={1}
          />
          <Rope
            key={screen}
            phase={phase}
            anchors={anchors}
            color={ITEMS.rope[save.rope]?.color || gold}
            paused={match?.paused}
          />
        </>
      )}
      {screen === "gameplay" && (
        <>
          <Sparkles
            count={match.effects?.[match.current]?.boost ? 24 : 8}
            scale={[3.6, 2.8, 2]}
            position={[0, 1.1, 0]}
            size={3}
            speed={0.7}
            opacity={0.55}
            color={match.frozen?.[match.current] ? "#77eaff" : "#ffe86a"}
          />
          {match.effects?.[match.current]?.shield && (
            <mesh position={[0, 1.35, 0]}>
              <sphereGeometry args={[1.5, 24, 16]} />
              <meshPhysicalMaterial
                color="#53dfff"
                transparent
                opacity={0.13}
                roughness={0.1}
                metalness={0.2}
                depthWrite={false}
              />
            </mesh>
          )}
          {match.frozen?.[match.current] && (
            <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.65, 0.035, 8, 48]} />
              <meshStandardMaterial
                color="#91f5ff"
                emissive="#32d9ff"
                emissiveIntensity={2}
              />
            </mesh>
          )}
        </>
      )}
      {quality === "high" && (
        <ContactShadows
          position={[0, 0.018, 0]}
          opacity={0.3}
          scale={13}
          blur={2.5}
          far={4}
          resolution={128}
          color="#432a51"
        />
      )}
      <CameraRig screen={screen} />
    </>
  );
}
class SceneError extends React.Component {
  constructor(p) {
    super(p);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-error">
        The 3D renderer could not start. Enable WebGL in your browser, then
        reload.<button onClick={() => location.reload()}>Reload game</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Scene(props) {
  const [lost, setLost] = useState(false);
  const low =
    props.save.quality === "low" ||
    (props.save.quality === "auto" &&
      typeof navigator !== "undefined" &&
      ((navigator.hardwareConcurrency || 4) <= 4 ||
        /Android|iPhone|iPad/i.test(navigator.userAgent)));
  return (
    <SceneError>
      {lost && (
        <div className="scene-error">
          Graphics paused.{" "}
          <button onClick={() => location.reload()}>Reload game</button>
        </div>
      )}
      <Canvas
        frameloop={
          ["shop", "settings", "select", "online", "leaderboard"].includes(
            props.screen,
          )
            ? "demand"
            : "always"
        }
        shadows
        dpr={[1, low ? 1.2 : 1.7]}
        camera={{ position: [0, 2.85, 10.8], fov: 49, near: 0.1, far: 80 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            setLost(true);
          });
        }}
      >
        <Suspense fallback={null}>
          <World {...props} quality={low ? "low" : "high"} />
        </Suspense>
      </Canvas>
    </SceneError>
  );
}
