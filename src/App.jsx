import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import gsap from "gsap";
import Scene, { CartoonPreview, CartoonDie, CartoonItem } from "./CartoonScene";
import Profile from "./Profile";
import { SettingsExtras } from "./SettingsExtras";
import { useCloudProgress } from "./useCloudProgress";
import { useAccount } from "./useAccount";
import { Leaderboard, OnlineLobby, photoUrl } from "./Community";
import { jumpTap, jumpEnergy } from "./controls";
import { OnlineMatch } from "./online";
import { Match, ITEMS, COLORS, SKIN, loadSave } from "./game";
import { tone, music, unlockMusic, playVictory, stopVictory } from "./audio";
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
function ItemPreview(props) { return <CartoonItem {...props}/>; }
function ModePreview({mode,looks}) { return <CartoonPreview className="mode-art mode-model" mode robot={mode==='cpu'} looks={looks}/>; }
export default function App({ splashDelay = 1800 }) {
  const account = useAccount();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [pendingPower,setPendingPower] = useState(null),[tapPulse,setTapPulse]=useState(0);
  const [toolActor, setToolActor] = useState(0),
    [buyingFreeze, setBuyingFreeze] = useState(false);
  const [photoFailed,setPhotoFailed]=useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), splashDelay);
    return () => clearTimeout(timer);
  }, [splashDelay]);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [save, setSave] = useState(() => loadSave(localStorage)),
    [screen, setScreen] = useState(() => {
      const p = new URLSearchParams(window.location.search);
      return p.has("profile")
        ? "profile"
        : p.has("challenge") || p.get("page") === "online"
          ? "online"
          : p.get("page") === "leaderboard"
            ? "leaderboard"
            : "welcome";
    }),
    [match, setMatch] = useState(null),
    [mode, setMode] = useState("cpu"),
    [difficulty, setDifficulty] = useState("Normal"),
    [selection, setSelection] = useState(0),
    [draft, setDraft] = useState(save.looks[0]),
    [category, setCategory] = useState("outfit"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [reward, setReward] = useState(null);
  const cloud = useCloudProgress(account, save, setSave);
  useEffect(()=>setPhotoFailed(false),[save.profile.photoPath]);
  const engine = useRef(null),
    root = useRef(),
    screenRef = useRef(screen),
    saveRef = useRef(save),
    rewarded = useRef(false),
    toastTimer = useRef(),
    lastState = useRef("idle"),
    lastDone = useRef(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const fit = () =>
      root.current?.style.setProperty("--app-height", viewport.height + "px");
    fit();
    viewport.addEventListener("resize", fit);
    return () => viewport.removeEventListener("resize", fit);
  }, []);
  useEffect(() => {
    if (account.profile) setSave((s) => ({ ...s, profile: account.profile }));
  }, [account.profile]);
  const notify = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };
  if (!engine.current) engine.current = new Match();
  engine.current.onChange = setMatch;
  const current = match || engine.current.snapshot();
  const lastDie = useRef(1);
  if (current.needed > 0) lastDie.current = current.needed;
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
    music(
      save.music &&
        !document.hidden &&
        !(screen === "rewards" && (reward?.won || reward?.mode === "pvp")),
    );
    return () => music(false);
  }, [save.music, screen === "rewards", reward?.won]);
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
      const won = match.winner === (match.mode === "online" ? match.mySlot : 0),
        coins =
          match.mode === "online"
            ? 0
            : match.mode === "pvp"
              ? 200
              : won
                ? 250
                : 80,
        xp = match.mode === "online" ? 0 : won ? 50 : 20;
      setReward({
        coins,
        xp,
        won,
        mode: match.mode,
        best: match.best,
        points: match.mode === "online" && won ? match.stake * 2 : 0,
        net: match.mode === "online" ? (won ? match.stake : -match.stake) : 0,
      });
      setSave((s) => ({
        ...s,
        coins: s.coins + coins,
        xp: s.xp + xp,
        wins: s.wins + (won || match.mode === "pvp" ? 1 : 0),
        level: (s.level || 1) + (won || match.mode === "pvp" ? 1 : 0),
        matches: s.matches + 1,
        best: Math.max(s.best, match.best),
      }));
      if (won || match.mode === "pvp") playVictory(sound);
      if (match.mode === "online") {
        engine.current.close();
        account.reload();
      }
      setScreen("rewards");
    }
  }, [match]);
  useEffect(() => {
    const unlock = () => unlockMusic();
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || ["INPUT", "SELECT"].includes(e.target.tagName)) return;
      if (screenRef.current === "gameplay") {
        if (e.code === "Space") {
          e.preventDefault();
          if (engine.current.state === "idle" && !engine.current.ai)
            engine.current.roll();
          else jump();
        }
        if (e.code === "Escape") engine.current.pause();
      }
    };
    const hide = () => {
      music(
        saveRef.current.music &&
          !document.hidden &&
          screenRef.current !== "rewards",
      );
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
  useLayoutEffect(()=>{
    if(screen!=="gameplay")return;
    const hud=root.current?.querySelector('.match-hud');if(!hud)return;
    const fit=()=>{const rect=hud.getBoundingClientRect(),base=root.current?.getBoundingClientRect();if(rect.height>0&&base)root.current.style.setProperty('--hud-bottom',Math.ceil(rect.bottom-base.top+10)+'px');};
    fit();const observer=window.ResizeObserver?new window.ResizeObserver(fit):null;observer?.observe(hud);window.addEventListener('resize',fit);
    return()=>{observer?.disconnect();window.removeEventListener('resize',fit);root.current?.style.removeProperty('--hud-bottom');};
  },[screen]);
  function go(s) {
    setToolsOpen(false);
    stopVictory();
    if (engine.current.mode === "online" && engine.current.state === "over")
      engine.current.close();
    if (["online", "leaderboard"].includes(s)) account.reload();
    tone("click", save.sound);
    setModal(null);
    setScreen(s);
  }
  function start() {
    setToolsOpen(false);
    stopVictory();
    if (engine.current.mode === "online") {
      engine.current.close();
      engine.current = new Match(setMatch);
    }
    rewarded.current = false;
    engine.current.reset(mode, difficulty, save.level);
    setScreen("gameplay");
  }
  function startOnline(data) {
    setToolsOpen(false);
    stopVictory();
    engine.current.close?.();
    rewarded.current = false;
    engine.current = new OnlineMatch(
      data,
      account.client,
      setMatch,
      account.setWallet,
      notify,
    ).connect();
    setMatch(engine.current.snapshot());
    setScreen("gameplay");
  }
  async function leaveMatch() {
    if (engine.current.mode === "online") {
      await engine.current.forfeit();
      engine.current.close();
    }
    go("home");
  }
  async function buyFreeze() {
    if (buyingFreeze) return;
    setBuyingFreeze(true);
    try {
      if (account.user) {
        const { data, error } = await account.client.rpc("buy_freeze", {
          p_request_id: crypto.randomUUID(),
        });
        if (error) throw error;
        account.setWallet(data);
      } else {
        if (save.points < 50) {
          notify("You need 50 practice points.");
          return;
        }
        setSave((s) => ({
          ...s,
          points: s.points - 50,
          freezes: s.freezes + 1,
        }));
      }
      notify("Freeze purchased!");
    } catch (e) {
      notify(e.message || "Could not buy Freeze");
    } finally {
      setBuyingFreeze(false);
    }
  }
  async function power(name) {
    const actor =
      engine.current.mode === "online"
        ? engine.current.mySlot
        : current.mode === "pvp"
          ? toolActor
          : 0;
    if (pendingPower) return;
    if (!engine.current.canPower(name, actor)) { notify("This tool is not available in this turn."); return; }
    if (engine.current.mode === "online") {
      setPendingPower(name);notify(`Activating ${name}…`);
      try { if(await engine.current.usePower(name)) notify(`${name.toUpperCase()} activated!`); } finally {setPendingPower(null);}
      return;
    }
    setPendingPower(name);
    try {
      if (name === "freeze") {
        notify("Activating Freeze…");
        if (account.user) {
          const { data, error } = await account.client.rpc(
            "consume_practice_freeze",
            { p_request_id: crypto.randomUUID() },
          );
          if (error) throw error;
          account.setWallet(data);
        } else {
          if (save.freezes < 1) {
            notify("Buy Freeze for 50 points first.");
            return;
          }
          setSave((s) => ({ ...s, freezes: s.freezes - 1 }));
        }
      }
      engine.current.usePower(name, actor, name === "freeze");
      tone("perfect", save.sound);
      notify(`${name.toUpperCase()} activated!`);
    } catch (e) {
      notify(e.message || "Power-up unavailable");
    } finally {setPendingPower(null);}
  }
  async function shareApp(apk = false) {
    const url =
      window.location.origin +
      window.location.pathname +
      (apk ? "downloads/Rope-Skipping-Challenge-test.apk" : "");
    try {
      if (navigator.share)
        await navigator.share({ title: "Rope Skipping Challenge", url });
      else {
        await navigator.clipboard.writeText(url);
        notify("Link copied!");
      }
    } catch (e) {
      if (e.name !== "AbortError")
        notify("Copy the game address from your browser to share it.");
    }
  }
  function jump() {
    const result=jumpTap(engine.current);setTapPulse(n=>n+1);
    if(result==="jump"||result==="warmup")tone("jump", saveRef.current.sound);
    else if(result==="waiting")notify("Your turn is next—get ready!");
    else if(result==="frozen")notify("Frozen! Block Freeze or wait for the ice to melt.");
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
        ["leaderboard", "Ranks"],
        ["settings", "Settings"],
      ].map(([s, label]) => (
        <button
          key={s}
          onClick={() => go(s)}
          className={screen === s ? "active" : ""}
        >
          <Icon
            name={["rewards", "leaderboard"].includes(s) ? "trophy" : s}
            size={34}
          />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
  return (
    <div
      ref={root}
      className={`app screen-${screen} ${screen === "gameplay" && ["rolling", "ready"].includes(current.state) ? "showing-die" : ""}`}
    >
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
      {screen === "gameplay" && <CartoonDie value={lastDie.current} rolling={current.state==='rolling'} reroll={current.reroll} onRoll={roll} canRoll={current.state==='idle'&&!current.paused&&!engine.current.ai&&!engine.current.isSpectating}/>}
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
            <span className="tiny">BIG PERSONALITIES • ONE MORE JUMP</span>
          </div>
        </main>
      )}
      {screen === "home" && (
        <main className="home screen-enter">
          <div className="home-top">
            <button
              className="level profile-link"
              onClick={() => go("profile")}
              aria-label="Your profile"
            >
              {save.profile.photoPath && !photoFailed && photoUrl(save.profile.photoPath) ? <img className="home-profile-photo" src={photoUrl(save.profile.photoPath)} alt="Your profile photo" onError={()=>setPhotoFailed(true)}/> : <CartoonPreview portrait kind={Math.max(0,["pink","blue","yellow"].indexOf(save.profile.avatar))} look={save.looks[Math.max(0,["pink","blue","yellow"].indexOf(save.profile.avatar))]} className="home-profile-photo"/>}
              <span>
                <b>{save.profile.displayName}</b>
                <small>
                  LEVEL {save.level || 1} · MY PROFILE
                </small>
              </span>
            </button>
            <div className="balance-stack"><button className="wallet" onClick={() => go("shop")} aria-label="Cosmetic coins"><Coin /><span>{save.coins.toLocaleString()}<small>COINS · SHOP</small></span><Icon name="plus" /></button><button className="online-points-badge" onClick={()=>go("leaderboard")}><b>{account.user ? account.wallet ? Number(account.wallet.points).toLocaleString() : "…" : "SIGN IN"}</b><small>ONLINE POINTS · RANKS</small></button></div>
          </div>
          <div className="home-logo">
            <img className="brand-logo" src={import.meta.env.BASE_URL+"branding/rope-skipping-logo.png"} alt="Rope Skipping Challenge — rope-framed cartoon logo"/>
            <p>A little rhythm. A whole lot of joy.</p>
          </div>
          <section className="home-actions">
            <button
              className="online-home button blue"
              onClick={() => go("online")}
            >
              INVITE A FRIEND · POINTS MATCH
            </button>
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
      {screen === "leaderboard" && (
        <main className="page community screen-enter">
          {header("GLOBAL", "LEADERBOARD")}
          <Leaderboard />
        </main>
      )}
      {screen === "online" && (
        <main className="page community screen-enter">
          {header("FRIEND", "CHALLENGE")}
          <OnlineLobby
            account={account}
            onStart={startOnline}
            onProfile={() => go("profile")}
            onNotify={notify}
          />
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
                  {current.mode === "online"
                    ? current.names?.[i] || "Player"
                    : i === 0
                      ? save.profile.displayName
                      : current.mode === "cpu"
                        ? "BeatBot"
                        : "Player 2"}
                </div>
                <div className="progress">
                  <i style={{ width: current.progress[i] + "%" }} />
                </div>
                <strong>{current.progress[i]}%</strong>
                <LiveEnergy engine={engine} actor={i}/>
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
                  ? "BeatBot"
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
          <div className={"powerup-bar " + (toolsOpen ? "tools-open" : "tools-closed")}>
            {current.mode === "pvp" && (
              <div className="tool-actor">
                <button
                  onClick={() => setToolActor(0)}
                  className={toolActor === 0 ? "active" : ""}
                >
                  P1 tools
                </button>
                <button
                  onClick={() => setToolActor(1)}
                  className={toolActor === 1 ? "active" : ""}
                >
                  P2 tools
                </button>
              </div>
            )}
            {["block", "shield", "slow", "boost", "freeze"].map((name) => (
              <button
                key={name}
                className={"power-" + name}
                disabled={
                  !!pendingPower || !engine.current.canPower?.(
                    name,
                    current.mode === "online"
                      ? current.mySlot
                      : current.mode === "pvp"
                        ? toolActor
                        : 0,
                  )
                }
                onClick={() => { power(name); setToolsOpen(false); }}
              >
                <span>
                  {
                    {
                      block: "✋",
                      shield: "🛡",
                      slow: "🐢",
                      boost: "⚡",
                      freeze: "❄",
                    }[name]
                  }
                </span>
                {name.toUpperCase()}
                <small>
                  {name === "freeze"
                    ? account.user
                      ? account.wallet?.freeze_tokens || 0
                      : save.freezes || 0
                    : (current.powers?.[
                        current.mode === "online"
                          ? current.mySlot
                          : current.mode === "pvp"
                            ? toolActor
                            : 0
                      ]?.[name] ?? 1)}
                </small>
              </button>
            ))}
            <button
              className="buy-freeze"
              disabled={buyingFreeze}
              onClick={buyFreeze}
            >
              BUY ❄<small>50 POINTS</small>
            </button>
            <span className="power-points">
              {account.user
                ? Number(account.wallet?.points || 0)
                : save.points || 0}{" "}
              pts
            </span>
          </div>
          <div className="game-controls">
            <div className="left-control-stack">
          <button className="tools-toggle button blue" aria-expanded={toolsOpen} onClick={() => setToolsOpen(!toolsOpen)}>{toolsOpen ? "× TOOLS" : "⚡ TOOLS"}</button>
            <div className="jump-count glass">
              <Icon name="jump" size={36} />
              <strong>
                {current.done}
                <small>/ {current.reroll ? "–" : current.needed || "–"}</small>
              </strong>
              <span>Jumps</span>
            </div>
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
                  disabled={
                    current.state !== "idle" ||
                    engine.current.ai ||
                    engine.current.isSpectating
                  }
                  className="roll-button"
                >
                  {current.state === "idle"
                    ? current.reroll ? "Six! Roll again" : "Roll the dice"
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
              className={"jump-button " + (tapPulse % 2 ? "tap-a" : "tap-b")}
              onClick={jump}
              disabled={
                current.paused || current.state === "over"
              }
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
                <p>
                  {current.mode === "online"
                    ? "The online clock keeps running. Leaving forfeits your stake."
                    : "Your playground will be right here."}
                </p>
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
                    <p>
                      {current.mode === "online"
                        ? "Leaving forfeits this points match to your opponent."
                        : "Leave this match? Unfinished matches earn no rewards."}
                    </p>
                    <Button onClick={leaveMatch}>Leave match</Button>
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
                  "Poppy · Big playground energy",
                  "Ziggy · Cool under pressure",
                  "Sunny · Always bringing sunshine",
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
                        <CartoonItem kind={selection} category={key} item={key==='skin'?{}:it} index={i} look={draft} className="custom-item" label={key==='skin'?`Skin tone ${i+1}`:it.name}/>
                        <span className="item-caption">{key==='skin'?`Tone ${i+1}`:it.name}</span>
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
                  <CartoonItem kind={selection} category="style" index={i} look={draft} className="style-item" label={s}/><span>{s}</span>
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
                <CartoonPreview kind={i} look={save.looks[i]} portrait className="crew-portrait"/>
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
                <strong>
                  + {reward.mode === "online" ? reward.points : reward.coins}
                  {reward.mode === "online" ? " POINTS" : ""}
                </strong>
              </div>
              <div className="reward-line">
                <Icon name="star" size={40} />
                <strong>
                  {reward.mode === "online" ? (
                    (reward.net >= 0 ? "+" : "") + reward.net + " NET POINTS"
                  ) : (
                    <>
                      + {reward.xp} <em>XP</em>
                    </>
                  )}
                </strong>
              </div>
              <div className="reward-summary">
                <Icon name="trophy" size={28} />
                <span>
                  Best streak <b>{reward.best} jumps</b>
                </span>
                <span>
                  Level <b>{save.level || 1}</b>
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
      {screen === "profile" && (
        <main className="page profile screen-enter">
          {header("PLAYER", "PROFILE")}
          <Profile
            profile={save.profile}
            onSave={(value) => setSave((s) => ({ ...s, profile: value }))}
            onNotify={notify}
          />
        </main>
      )}
      {screen === "settings" && (
        <main className="page settings screen-enter">
          {header("", "SETTINGS")}
          <section className="settings-panel glass">
            <h2>Your playground, your rules</h2>
            <SettingsExtras account={account} cloud={cloud} level={save.level || 1} onProfile={() => go("profile")} notify={notify} />
            {[
              ["sound", "Sound effects", "Jumps, dice and celebration"],
              ["music", "Music", "Rope Rush playlist · Volume 40%"],
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
                if (
                  window.Capacitor?.isNativePlatform?.() ||
                  window.matchMedia?.("(display-mode: standalone)").matches ||
                  navigator.standalone
                ) {
                  notify("The app is already installed.");
                  return;
                }
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
            <div className="install-share">
              <button className="button blue" onClick={() => shareApp(false)}>
                SHARE GAME LINK
              </button>
              <a
                className="button gold"
                href="./downloads/Rope-Skipping-Challenge-test.apk"
                download="Rope-Skipping-Challenge-test.apk"
              >
                DOWNLOAD ANDROID APK
              </a>
              <button className="text-button" onClick={() => shareApp(true)}>
                Share APK download link
              </button>
              <p className="save-note">
                Android test build · Opens this live game · Internet needed. You
                can also install the PWA from your browser.
              </p>
            </div>
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
      {loading && (
        <div className="loading" id="loading">
          <span className="loading-ball" />
          <strong>Warming up the playground…</strong>
        </div>
      )}
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

function LiveEnergy({engine,actor}){const fill=useRef(),label=useRef();useEffect(()=>{let id;const draw=()=>{const e=jumpEnergy(engine.current,actor);if(fill.current)fill.current.style.width=e.value+"%";if(label.current)label.current.textContent=e.label;id=requestAnimationFrame(draw);};id=requestAnimationFrame(draw);return()=>cancelAnimationFrame(id);},[actor]);return <div className="live-energy" aria-label="Live jump energy"><div><i ref={fill}/></div><small ref={label}>READY</small></div>;}
