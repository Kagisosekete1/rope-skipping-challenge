import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { View, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import gsap from "gsap";
import Scene from "./Scene";
import { Character, Outfit, Shoe } from "./Character";
import { Match, ITEMS, COLORS, SKIN, loadSave } from "./game";
import { tone, music } from "./audio";
import "./styles.css";
function Icon({ name, size = 26 }) {
  const paths = {
    back: "m15 5-7 7 7 7",
    play: "m9 5 11 7-11 7Z",
    home: "m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10",
    shop: "M3 3h3l3 12h10l3-9H7M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2m9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
    trophy:
      "M8 3h8v6a4 4 0 0 1-8 0V3m0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v7m-4 0h8",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m-2-5h4l1 3 3 1 3 2v4l-3 1-1 3-2 3h-4l-1-3-3-1-3-2V9l3-1 1-3Z",
    shirt: "m8 3-5 3 3 5 2-1v11h8V10l2 1 3-5-5-3c-1 4-7 4-8 0Z",
    hair: "M4 18C0 8 6 1 13 3c8 1 11 10 6 17l-3-4 1-8c-4 5-7 2-9 0l-1 8-3 2Z",
    face: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20m-5-9c2 4 8 4 10 0M8 8v2m8-2v2",
    shoes: "M3 13V7l6 3 2 4 10 3v4H3v-8m0 5h17",
    rope: "M6 20c-8-9 3-22 9-16 7 7-1 16-6 14-6-3 2-15 7-10 3 4 1 9 4 12",
    jump: "m12 3-8 9h5v9h6v-9h5l-8-9Z",
    pause: "M8 4v16m8-16v16",
    plus: "M12 4v16M4 12h16",
    check: "m4 12 5 5L20 6",
    sound: "M4 9h4l5-5v16l-5-5H4V9m12-2c4 3 4 7 0 10",
    star: "m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z",
    close: "m5 5 14 14M5 19 19 5",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={["play", "jump", "star"].includes(name) ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.star} />
    </svg>
  );
}
function Button({
  children,
  onClick,
  variant = "gold",
  className = "",
  ...props
}) {
  return (
    <button
      className={`button ${variant} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
function Coin({ small = false }) {
  return (
    <span className={"coin " + (small ? "small" : "")} aria-hidden="true">
      ★
    </span>
  );
}
function Heading({ first, accent }) {
  return (
    <h1 className="screen-title">
      {first} <em>{accent}</em>
    </h1>
  );
}
function ItemPreview({ category, item, index }) {
  return (
    <View className="item-model" index={index + 1}>
      <PerspectiveCamera makeDefault position={[0, 0.05, 4]} fov={33} />
      <ambientLight intensity={1.9} />
      <directionalLight position={[-2, 4, 4]} intensity={3} />
      <directionalLight position={[3, 1, -2]} intensity={2} color="#82dfff" />
      <group rotation={[0, -0.25, 0]}>
        {category === "outfit" ? (
          <Outfit color={item.color} />
        ) : category === "hair" ? (
          <Character
            kind={0}
            look={{ outfit: 0, hair: index, shoes: 0, skin: 2 }}
            scale={1.1}
            position={[0, -1.9, 0]}
            preview
          />
        ) : category === "shoes" ? (
          <group scale={3} position={[0, -0.25, 0]}>
            <group position={[-0.15, 0, 0]}>
              <Shoe color={item.color} />
            </group>
            <group position={[0.15, 0, 0]}>
              <Shoe color={item.color} />
            </group>
          </group>
        ) : (
          <mesh rotation={[0.65, 0.3, 0]}>
            <torusGeometry args={[0.65, 0.065, 12, 64]} />
            <meshStandardMaterial
              color={item.color}
              metalness={0.25}
              roughness={0.3}
            />
          </mesh>
        )}
      </group>
    </View>
  );
}
function ModePreview({ mode, looks }) {
  return (
    <View className="mode-art mode-model" index={mode === "cpu" ? 1 : 2}>
      <PerspectiveCamera makeDefault position={[0, 1.53, 4.2]} fov={32} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[-2, 3, 4]} intensity={3.3} />
      <directionalLight position={[2, 3, -2]} intensity={2} color="#9bedff" />
      {mode === "cpu" ? (
        <group position={[-0.52, 1.5, 0]}>
          <RoundedBox args={[0.78, 0.64, 0.55]} radius={0.18} smoothness={5}>
            <meshStandardMaterial
              color="#e8f4ff"
              roughness={0.25}
              metalness={0.25}
            />
          </RoundedBox>
          <RoundedBox
            args={[0.63, 0.43, 0.1]}
            radius={0.14}
            position={[0, 0, 0.28]}
          >
            <meshStandardMaterial color="#05182f" roughness={0.2} />
          </RoundedBox>
          {[-0.15, 0.15].map((x) => (
            <mesh key={x} position={[x, 0.035, 0.345]} scale={[1, 1.3, 0.3]}>
              <sphereGeometry args={[0.055, 20, 16]} />
              <meshStandardMaterial
                color="#24f6ff"
                emissive="#00bbff"
                emissiveIntensity={2}
              />
            </mesh>
          ))}
          <mesh position={[0, -0.11, 0.35]}>
            <boxGeometry args={[0.14, 0.017, 0.01]} />
            <meshBasicMaterial color="#1feaff" />
          </mesh>
          <mesh position={[0, -0.56, 0]}>
            <sphereGeometry args={[0.3, 24, 20]} />
            <meshStandardMaterial
              color="#f4faff"
              roughness={0.25}
              metalness={0.25}
            />
          </mesh>
        </group>
      ) : (
        <Character
          kind={1}
          look={looks[1]}
          position={[-0.52, -0.27, 0]}
          scale={0.95}
          rotation={0.18}
          preview
        />
      )}
      <Character
        kind={mode === "cpu" ? 0 : 2}
        look={looks[mode === "cpu" ? 0 : 2]}
        position={[0.52, -0.27, 0]}
        scale={0.95}
        rotation={-0.15}
        preview
      />
    </View>
  );
}
function ViewClear() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false);
    gl.setClearColor(0x000000, 0);
    gl.clear(true, true);
  }, 0);
  return null;
}
function App() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [save, setSave] = useState(() => loadSave(localStorage)),
    [screen, setScreen] = useState("welcome"),
    [match, setMatch] = useState(null),
    [mode, setMode] = useState("cpu"),
    [difficulty, setDifficulty] = useState("Normal"),
    [selection, setSelection] = useState(0),
    [draft, setDraft] = useState(save.looks[0]),
    [category, setCategory] = useState("outfit"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [reward, setReward] = useState(null);
  const engine = useRef(null),
    root = useRef(),
    screenRef = useRef(screen),
    saveRef = useRef(save),
    rewarded = useRef(false),
    toastTimer = useRef(),
    lastState = useRef("idle"),
    lastDone = useRef(0);
  const notify = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };
  if (!engine.current) engine.current = new Match();
  engine.current.onChange = setMatch;
  const current = match || engine.current.snapshot();
  useEffect(() => {
    const onInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);
  useEffect(() => {
    saveRef.current = save;
    try {
      localStorage.setItem("rsc_v2", JSON.stringify(save));
    } catch {
      notify("Your browser could not save progress.");
    }
  }, [save]);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  useEffect(() => {
    music(save.music && screen !== "welcome");
    return () => music(false);
  }, [save.music, screen === "welcome"]);
  useEffect(() => {
    if (!match) return;
    const sound = saveRef.current.sound;
    if (match.done > lastDone.current)
      tone(match.result === "perfect" ? "perfect" : "good", sound);
    lastDone.current = match.done;
    if (match.state === "rolling" && lastState.current !== "rolling")
      tone("roll", sound);
    if (match.result === "miss" && lastState.current !== match.state)
      tone("miss", sound);
    lastState.current = match.state;
    if (match.state === "over" && !rewarded.current) {
      rewarded.current = true;
      const won = match.winner === 0,
        coins = match.mode === "pvp" ? 200 : won ? 250 : 80,
        xp = won ? 50 : 20;
      setReward({ coins, xp, won, mode: match.mode, best: match.best });
      setSave((s) => ({
        ...s,
        coins: s.coins + coins,
        xp: s.xp + xp,
        wins: s.wins + (won ? 1 : 0),
        matches: s.matches + 1,
        best: Math.max(s.best, match.best),
      }));
      tone("win", sound);
      setScreen("rewards");
    }
  }, [match]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || ["INPUT", "SELECT"].includes(e.target.tagName)) return;
      if (screenRef.current === "gameplay") {
        if (e.code === "Space") {
          e.preventDefault();
          if (engine.current.state === "idle" && !engine.current.ai)
            engine.current.roll();
          else if (!engine.current.ai && engine.current.jump())
            tone("jump", saveRef.current.sound);
        }
        if (e.code === "Escape") engine.current.pause();
      }
    };
    const hide = () => {
      if (
        document.hidden &&
        screenRef.current === "gameplay" &&
        !engine.current.paused
      )
        engine.current.pause();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);
  useLayoutEffect(() => {
    if (root.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".screen-enter",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.42, ease: "power2.out" },
        );
      }, root);
      return () => ctx.revert();
    }
  }, [screen]);
  function go(s) {
    tone("click", save.sound);
    setModal(null);
    setScreen(s);
  }
  function start() {
    rewarded.current = false;
    engine.current.reset(mode, difficulty);
    setScreen("gameplay");
  }
  function jump() {
    if (!engine.current.ai && engine.current.jump()) tone("jump", save.sound);
  }
  function roll() {
    if (!engine.current.ai) engine.current.roll();
  }
  function purchase(key, i) {
    const item = ITEMS[key][i],
      id = key + i;
    if (save.owned.includes(id)) {
      if (key === "rope") {
        setSave((s) => ({ ...s, rope: i }));
        notify(`${item.name} equipped`);
      } else {
        setDraft({ ...save.looks[selection], [key]: i });
        go("customize");
      }
      return;
    }
    if (save.coins < item.price) {
      notify("Earn more coins by finishing matches.");
      return;
    }
    setSave((s) => ({
      ...s,
      coins: s.coins - item.price,
      owned: [...s.owned, id],
    }));
    tone("perfect", save.sound);
    notify(`${item.name} unlocked!`);
  }
  const updateDraft = (key, val) => {
    if (
      ["outfit", "hair", "shoes"].includes(key) &&
      !save.owned.includes(key + val) &&
      !(key === "outfit" && val === selection) &&
      !(key === "shoes" && val === selection)
    ) {
      notify("Unlock this style in the shop first.");
      return;
    }
    setDraft((d) => ({ ...d, [key]: val }));
    tone("click", save.sound);
  };
  function chooseCharacter(i) {
    setSelection(i);
    setDraft({ ...save.looks[i] });
  }
  const header = (title, accent) => (
    <header className="page-header">
      <Button
        variant="cyan"
        className="back"
        onClick={() => go("home")}
        aria-label="Back to home"
      >
        <Icon name="back" size={32} />
      </Button>
      <Heading first={title} accent={accent} />
      <button
        className="wallet"
        onClick={() => notify("Finish matches to earn coins.")}
        aria-label={`${save.coins} coins. Finish matches to earn more.`}
      >
        <Coin />
        {save.coins.toLocaleString()}
      </button>
    </header>
  );
  const nav = (
    <nav className="bottom-nav" aria-label="Main navigation">
      {[
        ["home", "Home"],
        ["shop", "Shop"],
        ["rewards", "Rewards"],
        ["settings", "Settings"],
      ].map(([s, label]) => (
        <button
          key={s}
          onClick={() => go(s)}
          className={screen === s ? "active" : ""}
        >
          <Icon name={s === "rewards" ? "trophy" : s} size={34} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
  return (
    <div ref={root} className={`app screen-${screen}`}>
      <div className="world">
        <Scene
          screen={screen}
          engine={engine}
          save={save}
          selection={selection}
          lookDraft={draft}
          match={current}
        />
      </div>
      <div className="vignette" />
      {["shop", "select"].includes(screen) && (
        <div className="shop-render">
          <Canvas
            eventSource={root}
            dpr={[1, 1.3]}
            gl={{ alpha: true, antialias: true }}
          >
            <ViewClear />
            <View.Port />
          </Canvas>
        </div>
      )}
      {screen === "welcome" && (
        <main
          className="welcome screen-enter"
          aria-label="Rope Skipping Challenge welcome screen"
        >
          <div className="welcome-top">
            <span className="eyebrow">THE PLAYGROUND IS YOURS</span>
            <button
              className="round cyan"
              aria-label="Settings"
              onClick={() => go("settings")}
            >
              <Icon name="settings" />
            </button>
          </div>
          <div className="welcome-bottom">
            <Button className="play-big" onClick={() => go("home")}>
              PLAY <Icon name="play" size={44} />
            </Button>
            <p>Roll the dice. Find your rhythm. Reach 100%.</p>
            <span className="tiny">REAL 3D • BIG SMILES • ONE MORE JUMP</span>
          </div>
        </main>
      )}
      {screen === "home" && (
        <main className="home screen-enter">
          <div className="home-top">
            <span className="level">
              <Icon name="star" /> LEVEL {Math.floor(save.xp / 200) + 1}
            </span>
            <button className="wallet" onClick={() => go("shop")}>
              <Coin />
              {save.coins.toLocaleString()}
              <Icon name="plus" />
            </button>
          </div>
          <div className="home-logo">
            <span>ROPE SKIPPING</span>
            <strong>CHALLENGE</strong>
            <p>A little rhythm. A whole lot of joy.</p>
          </div>
          <section className="home-actions">
            <Button className="play-big" onClick={() => go("select")}>
              LET’S PLAY <Icon name="play" size={32} />
            </Button>
            <Button
              variant="blue"
              onClick={() => {
                chooseCharacter(0);
                go("customize");
              }}
            >
              <Icon name="shirt" /> Customize your crew
            </Button>
          </section>
          {nav}
        </main>
      )}
      {screen === "select" && (
        <main className="page select screen-enter">
          {header("SELECT", "MODE")}
          <div className="mode-grid">
            <button
              className={"mode-card blue " + (mode === "cpu" ? "chosen" : "")}
              onClick={() => setMode("cpu")}
              aria-pressed={mode === "cpu"}
            >
              <span className="card-kicker">SOLO CHALLENGE</span>
              <h2>
                PLAYER
                <br />
                <em>VS</em> COMPUTER
              </h2>
              <ModePreview mode="cpu" looks={save.looks} />
              <span className="mode-desc">
                Find your rhythm against a clever rival.
              </span>
              <span className="mini-gold">
                {mode === "cpu" ? "Selected ✓" : "Choose mode"}
              </span>
            </button>
            <button
              className={"mode-card purple " + (mode === "pvp" ? "chosen" : "")}
              onClick={() => setMode("pvp")}
              aria-pressed={mode === "pvp"}
            >
              <span className="card-kicker">PASS & PLAY</span>
              <h2>
                PLAYER
                <br />
                <em>VS</em> PLAYER
              </h2>
              <ModePreview mode="pvp" looks={save.looks} />
              <span className="mode-desc">
                Two players. One device. Bragging rights.
              </span>
              <span className="mini-gold">
                {mode === "pvp" ? "Selected ✓" : "Choose mode"}
              </span>
            </button>
          </div>
          <section className="difficulty glass">
            <h3>
              Difficulty <span>(vs Computer)</span>
            </h3>
            <div className="chips">
              {["Easy", "Normal", "Hard"].map((d) => (
                <button
                  key={d}
                  disabled={mode !== "cpu"}
                  className={difficulty === d ? "selected" : ""}
                  aria-pressed={difficulty === d}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </section>
          <div className="select-foot">
            <button className="text-button" onClick={() => setModal("rules")}>
              How to play
            </button>
            <Button onClick={start}>
              PLAY <Icon name="play" />
            </Button>
          </div>
        </main>
      )}
      {screen === "gameplay" && (
        <main className="gameplay screen-enter">
          <header className="match-hud">
            {[0, 1].map((i) => (
              <div
                className={
                  "player player-" + i + (current.current === i ? " turn" : "")
                }
                key={i}
              >
                <div className="player-name">
                  {i === 0
                    ? "Player 1"
                    : current.mode === "cpu"
                      ? "Computer"
                      : "Player 2"}
                </div>
                <div className="progress">
                  <i style={{ width: current.progress[i] + "%" }} />
                </div>
                <strong>{current.progress[i]}%</strong>
              </div>
            ))}
            <span className="hud-vs">VS</span>
          </header>
          <div className="round-label">
            Round {current.round}
            <span>
              {current.current === 0
                ? "Player 1"
                : current.mode === "cpu"
                  ? "Computer"
                  : "Player 2"}
              ’s turn
            </span>
          </div>
          <button
            className="round pause-button cyan"
            onClick={() => engine.current.pause()}
            aria-label="Pause game"
          >
            <Icon name="pause" />
          </button>
          <div
            className={"feedback " + (current.result || "")}
            role="status"
            aria-live="polite"
          >
            {current.feedback}
          </div>
          <div className="game-controls">
            <div className="jump-count glass">
              <Icon name="jump" size={36} />
              <strong>
                {current.done}
                <small>/ {current.needed || "–"}</small>
              </strong>
              <span>Jumps</span>
            </div>
            <div className="center-control">
              {current.state === "skipping" ? (
                <>
                  <Timing engine={engine} />
                  <span className="timing-label">
                    Tap when the needle reaches green!
                  </span>
                </>
              ) : (
                <Button
                  variant="blue"
                  onClick={roll}
                  disabled={current.state !== "idle" || engine.current.ai}
                  className="roll-button"
                >
                  {current.state === "idle"
                    ? "Roll the dice"
                    : current.state === "rolling"
                      ? "Rolling…"
                      : current.state === "ready"
                        ? `${current.needed} jumps!`
                        : "Next turn…"}
                </Button>
              )}
              {current.combo > 1 && (
                <span className="combo">{current.combo} JUMP STREAK!</span>
              )}
            </div>
            <Button
              variant="green"
              className="jump-button"
              onClick={jump}
              disabled={current.state !== "skipping" || engine.current.ai}
            >
              <Icon name="jump" size={46} /> JUMP
            </Button>
          </div>
          <div className="keyboard-tip">
            SPACE to roll / jump · ESC to pause
          </div>
          {current.paused && (
            <div className="modal-backdrop">
              <section className="modal glass">
                <h2>Take a breather</h2>
                <p>Your playground will be right here.</p>
                <Button onClick={() => engine.current.pause()}>
                  RESUME <Icon name="play" />
                </Button>
                <Button
                  variant="blue"
                  onClick={() => {
                    setModal("quit");
                  }}
                >
                  Quit match
                </Button>
                {modal === "quit" && (
                  <div className="confirm">
                    <p>Leave this match? Unfinished matches earn no rewards.</p>
                    <Button onClick={() => go("home")}>Leave match</Button>
                    <button
                      className="text-button"
                      onClick={() => setModal(null)}
                    >
                      Keep playing
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      )}
      {screen === "customize" && (
        <main className="page customize screen-enter">
          {header("CUSTOMIZE YOUR", "CHARACTER")}
          <div className="custom-name">
            <strong>
              {
                ["THE RHYTHM MAKER", "THE ROPE MASTER", "THE SUNSHINE KID"][
                  selection
                ]
              }
            </strong>
            <span>
              {
                [
                  "Pink ponytail · Big playground energy",
                  "Blue hoodie · Cool under pressure",
                  "Yellow cap · Always bringing sunshine",
                ][selection]
              }
            </span>
          </div>
          <section className="custom-panel glass">
            {[
              ["outfit", "Outfits", "shirt"],
              ["hair", "Hair", "hair"],
              ["skin", "Face", "face"],
              ["shoes", "Shoes", "shoes"],
              ["rope", "Ropes", "rope"],
            ].map(([key, label, icon]) => (
              <div className="custom-row" key={key}>
                <div className="custom-category">
                  <Icon name={icon} size={28} />
                  <b>{label}</b>
                </div>
                <div className="options">
                  {(key === "skin" ? SKIN : ITEMS[key]).map((it, i) => {
                    const color = key === "skin" ? it : it.color,
                      chosen =
                        key === "rope" ? save.rope === i : draft[key] === i;
                    return (
                      <button
                        key={i}
                        className={"swatch " + (chosen ? "picked" : "")}
                        style={{ "--swatch": color }}
                        onClick={() => {
                          if (key === "rope") {
                            if (save.owned.includes("rope" + i))
                              setSave((s) => ({ ...s, rope: i }));
                            else notify("Unlock this rope in the shop.");
                          } else updateDraft(key, i);
                        }}
                        aria-label={
                          key === "skin" ? `Skin tone ${i + 1}` : it.name
                        }
                        aria-pressed={chosen}
                      >
                        {key === "skin" ? (
                          <span className="skin-block" />
                        ) : (
                          <Icon name={icon} size={key === "outfit" ? 35 : 30} />
                        )}{" "}
                        {chosen && (
                          <i className="check">
                            <Icon name="check" size={13} />
                          </i>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="hair-style">
              <span>Hairstyle</span>
              {["Ponytail", "High bun", "Puffs"].map((s, i) => (
                <button
                  key={s}
                  className={draft.style === i ? "active" : ""}
                  disabled={selection !== 0}
                  onClick={() => updateDraft("style", i)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
          <div className="character-picker">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                className={selection === i ? "selected" : ""}
                style={{ "--character": COLORS[i] }}
                onClick={() => chooseCharacter(i)}
                aria-label={`Customize ${["pink girl", "blue boy", "yellow girl"][i]}`}
              >
                <Icon name={i === 1 ? "jump" : "face"} size={32} />
                <span>{["PINK", "BLUE", "YELLOW"][i]}</span>
              </button>
            ))}
          </div>
          <Button
            className="save-look"
            onClick={() => {
              setSave((s) => ({
                ...s,
                looks: s.looks.map((l, i) =>
                  i === selection ? { ...draft } : l,
                ),
              }));
              notify("Your character is saved!");
              go("home");
            }}
          >
            SAVE <Icon name="check" size={32} />
          </Button>
        </main>
      )}
      {screen === "shop" && (
        <main className="page shop screen-enter">
          {header("", "SHOP")}
          <div className="shop-tabs glass">
            {[
              ["outfit", "Outfits", "shirt"],
              ["rope", "Ropes", "rope"],
              ["hair", "Hair", "hair"],
              ["shoes", "Shoes", "shoes"],
            ].map(([k, label, icon]) => (
              <button
                className={category === k ? "active" : ""}
                key={k}
                onClick={() => setCategory(k)}
              >
                <Icon name={icon} />
                {label}
              </button>
            ))}
          </div>
          <section className="shop-grid">
            {ITEMS[category].map((it, i) => (
              <button
                className={
                  "shop-card " +
                  (save.owned.includes(category + i) ? "owned" : "")
                }
                key={category + i}
                onClick={() => purchase(category, i)}
                aria-label={`${it.name}, ${save.owned.includes(category + i) ? "owned" : it.price + " coins"}`}
              >
                <ItemPreview category={category} item={it} index={i} />
                <b>{it.name}</b>
                <span className="price">
                  {save.owned.includes(category + i) ? (
                    <>
                      <Icon name="check" size={17} /> Owned
                    </>
                  ) : (
                    <>
                      <Coin small />
                      {it.price.toLocaleString()}
                    </>
                  )}
                </span>
              </button>
            ))}
          </section>
          {nav}
        </main>
      )}
      {screen === "rewards" && (
        <main className="page rewards screen-enter">
          {header("MATCH", "REWARDS")}
          <div className="celebrate">
            <span className="laurel">❧</span>
            <strong>
              {reward
                ? reward.mode === "pvp"
                  ? `Player ${current.winner + 1} wins!`
                  : reward.won
                    ? "You’re a playground star!"
                    : "Every jump makes you better."
                : "YOUR NEXT WIN STARTS HERE"}
            </strong>
            <span className="laurel reverse">❧</span>
          </div>
          {reward ? (
            <section className="reward-panel glass">
              <div className="reward-line">
                <Coin />
                <strong>+ {reward.coins}</strong>
              </div>
              <div className="reward-line">
                <Icon name="star" size={40} />
                <strong>
                  + {reward.xp} <em>XP</em>
                </strong>
              </div>
              <div className="reward-summary">
                <Icon name="trophy" size={28} />
                <span>
                  Best streak <b>{reward.best} jumps</b>
                </span>
                <span>
                  Level <b>{Math.floor(save.xp / 200) + 1}</b>
                </span>
              </div>
              <Button className="continue" onClick={() => go("home")}>
                CONTINUE <Icon name="play" />
              </Button>
            </section>
          ) : (
            <section className="reward-panel glass">
              <h2>Make your first match count.</h2>
              <p>
                Win 250 coins + 50 XP. Every completed match earns a reward.
              </p>
              <Button onClick={() => go("select")}>
                PLAY A MATCH <Icon name="play" />
              </Button>
            </section>
          )}
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 22 }, (_, i) => (
              <i
                key={i}
                style={{
                  "--x": `${(i * 37) % 100}%`,
                  "--delay": `${i * -0.23}s`,
                  "--color": COLORS[i % 8],
                }}
              />
            ))}
          </div>
        </main>
      )}
      {screen === "settings" && (
        <main className="page settings screen-enter">
          {header("", "SETTINGS")}
          <section className="settings-panel glass">
            <h2>Your playground, your rules</h2>
            {[
              ["sound", "Sound effects", "Jumps, dice and celebration"],
              ["music", "Music", "A gentle playground melody"],
            ].map(([k, label, desc]) => (
              <div className="setting" key={k}>
                <div>
                  <b>{label}</b>
                  <small>{desc}</small>
                </div>
                <button
                  className={"toggle " + (save[k] ? "on" : "")}
                  role="switch"
                  aria-checked={save[k]}
                  aria-label={label}
                  onClick={() => setSave((s) => ({ ...s, [k]: !s[k] }))}
                >
                  <span />
                </button>
              </div>
            ))}
            <div className="setting">
              <div>
                <b>Graphics</b>
                <small>Choose lower detail for older phones</small>
              </div>
              <select
                aria-label="Graphics quality"
                value={save.quality}
                onChange={(e) =>
                  setSave((s) => ({ ...s, quality: e.target.value }))
                }
              >
                <option value="auto">Auto</option>
                <option value="high">High</option>
                <option value="low">Battery saver</option>
              </select>
            </div>
            <div className="stats">
              <div>
                <strong>{save.wins}</strong>
                <span>Wins</span>
              </div>
              <div>
                <strong>{save.matches}</strong>
                <span>Matches</span>
              </div>
              <div>
                <strong>{save.best}</strong>
                <span>Best streak</span>
              </div>
            </div>
            <button className="text-button" onClick={() => setModal("rules")}>
              How to play
            </button>
            <p className="save-note">
              Your crew, coins and progress save automatically on this device.
            </p>
            <Button
              variant="blue"
              className="install-button"
              onClick={async () => {
                if (installPrompt) {
                  await installPrompt.prompt();
                  setInstallPrompt(null);
                } else
                  notify(
                    /iphone|ipad/i.test(navigator.userAgent)
                      ? "In Safari, tap Share → Add to Home Screen."
                      : "Open the browser menu and choose Install app.",
                  );
              }}
            >
              Install on your phone
            </Button>
            <button
              className="text-button danger"
              onClick={() => setModal("reset")}
            >
              Reset progress
            </button>
          </section>
          {nav}
        </main>
      )}
      {modal === "rules" && (
        <div className="modal-backdrop">
          <section className="modal glass">
            <button
              className="modal-close round cyan"
              aria-label="Close instructions"
              onClick={() => setModal(null)}
            >
              <Icon name="close" />
            </button>
            <h2>Find your rhythm</h2>
            <ol>
              <li>Roll the die. The pips show how many jumps to clear.</li>
              <li>
                Tap JUMP just before the rope reaches your feet. Aim for the
                green timing zone.
              </li>
              <li>
                Each jump earns 5%. Perfect timing earns 2% extra; clear your
                roll for a 5% bonus.
              </li>
              <li>A miss ends your turn. First to 100% wins!</li>
            </ol>
            <p>Two-player mode takes turns on the same device.</p>
            <Button onClick={() => setModal(null)}>
              GOT IT <Icon name="check" />
            </Button>
          </section>
        </div>
      )}
      {modal === "reset" && (
        <div className="modal-backdrop">
          <section className="modal glass">
            <h2>Start fresh?</h2>
            <p>
              This removes your coins, outfits and match history from this
              device.
            </p>
            <Button
              onClick={() => {
                localStorage.removeItem("rsc_v2");
                location.reload();
              }}
            >
              Reset everything
            </Button>
            <Button variant="blue" onClick={() => setModal(null)}>
              Keep my progress
            </Button>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      <div className="loading" id="loading">
        <span className="loading-ball" />
        <strong>Warming up the playground…</strong>
      </div>
    </div>
  );
}
function Timing({ engine }) {
  const ref = useRef();
  useEffect(() => {
    let id;
    const tick = () => {
      if (ref.current) {
        const phase = engine.current.phase % (Math.PI * 2),
          period = engine.current.period;
        const before = ((Math.PI * 2 - phase) / (Math.PI * 2)) * period;
        const normalized = Math.max(0, Math.min(1, (0.8 - before) / 0.8));
        ref.current.style.left = `${normalized * 100}%`;
      }
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="timing-meter">
      <span className="timing-good" />
      <i ref={ref} />
    </div>
  );
}
// Remove the splash only once the React tree is mounted; Canvas provides its own fallback.
const root = createRoot(document.getElementById("root"));
root.render(<App />);
setTimeout(() => document.getElementById("loading")?.remove(), 1800);
// In development remove only this application's old worker; production uses
// a build-generated app-shell cache with locally bundled assets.
if ("serviceWorker" in navigator) {
  const scope = new URL(import.meta.env.BASE_URL, location.href).href;
  if (import.meta.env.PROD)
    window.addEventListener("load", () =>
      navigator.serviceWorker
        .register(import.meta.env.BASE_URL + "sw.js")
        .catch(() => {}),
    );
  else
    navigator.serviceWorker
      .getRegistrations()
      .then((rs) =>
        rs.filter((r) => r.scope === scope).forEach((r) => r.unregister()),
      );
}
