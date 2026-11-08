import { localProfile } from "./profile-data.js";
export const TAU = Math.PI * 2;
export const COLORS = [
  "#fc278b",
  "#087ff6",
  "#ffcb13",
  "#ff383b",
  "#a934ed",
  "#54da22",
  "#c8f2ff",
  "#ff8510",
];
export const ITEMS = {
  outfit: COLORS.map((color, i) => ({
    name: [
      "Bubblegum",
      "Electric blue",
      "Sunshine",
      "Cherry",
      "Grape",
      "Lime",
      "Ice blue",
      "Tangerine",
    ][i],
    color,
    price: [0, 800, 1000, 1200, 1200, 1500, 1500, 1800][i],
  })),
  hair: [
    { name: "Chestnut", color: "#3b1c10", price: 0 },
    { name: "Midnight", color: "#161014", price: 600 },
    { name: "Copper", color: "#9c431d", price: 800 },
  ],
  shoes: [
    { name: "Pink high-tops", color: "#fc278b", price: 0 },
    { name: "Blue high-tops", color: "#087ff6", price: 500 },
    { name: "Golden high-tops", color: "#ffcb13", price: 700 },
  ],
  rope: [
    { name: "Golden twist", color: "#ffd128", price: 0 },
    { name: "Candy swirl", color: "#ff40c7", price: 600 },
    { name: "Arctic blue", color: "#30dfff", price: 900 },
  ],
};
export function defaultSave() {
  return {
    profile: localProfile(),
    coins: 2450,
    xp: 0,
    wins: 0,
    matches: 0,
    best: 0,
    owned: ["outfit0", "hair0", "shoes0", "rope0"],
    looks: [
      { outfit: 0, hair: 0, shoes: 0, skin: 2, style: 0 },
      { outfit: 1, hair: 1, shoes: 1, skin: 3, style: 0 },
      { outfit: 2, hair: 0, shoes: 2, skin: 2, style: 0 },
    ],
    rope: 0,
    sound: true,
    music: true,
    musicVersion: 1,
    quality: "auto",
  };
}
export function loadSave(storage) {
  try {
    const raw = JSON.parse(storage.getItem("rsc_v2"));
    const base = defaultSave();
    if (!raw) return base;
    return {
      ...base,
      ...raw,
      profile: localProfile(raw.profile),
      music: raw.musicVersion === 1 ? !!raw.music : true,
      musicVersion: 1,
      coins: Math.max(0, Number(raw.coins) || 0),
      owned: [
        ...new Set([
          ...base.owned,
          ...(Array.isArray(raw.owned) ? raw.owned : []),
        ]),
      ],
      looks: base.looks.map((l, i) => ({ ...l, ...raw.looks?.[i] })),
    };
  } catch {
    return defaultSave();
  }
}
export const SKIN = ["#f9cb9f", "#e9a271", "#b97543", "#8d4828", "#61321f"];
export function randomDie(random = Math.random) {
  return 1 + Math.floor(random() * 6);
}
export function jumpHeight(age) {
  return age >= 0 && age < 0.76 ? 1.05 * Math.sin((Math.PI * age) / 0.76) : 0;
}
export function scoreJump(progress, perfect) {
  return Math.min(100, progress + 5 + (perfect ? 2 : 0));
}
export class Match {
  constructor(onChange = () => {}, random = Math.random) {
    this.onChange = onChange;
    this.random = random;
    this.reset("cpu", "Normal");
  }
  reset(mode = "cpu", difficulty = "Normal") {
    this.mode = mode;
    this.difficulty = difficulty;
    this.current = 0;
    this.progress = [0, 0];
    this.phase = 0;
    this.readyStartPhase = 0;
    this.readyTargetPhase = Math.PI;
    this.time = 0;
    this.elapsed = 0;
    this.state = "idle";
    this.needed = 0;
    this.done = 0;
    this.jumpAge = 9;
    this.combo = 0;
    this.best = 0;
    this.round = 1;
    this.paused = false;
    this.winner = null;
    this.result = null;
    this.feedback = "Roll the dice to start!";
    this.emit();
  }
  emit() {
    this.onChange(this.snapshot());
  }
  snapshot() {
    return {
      state: this.state,
      mode: this.mode,
      difficulty: this.difficulty,
      current: this.current,
      progress: [...this.progress],
      needed: this.needed,
      done: this.done,
      combo: this.combo,
      best: this.best,
      round: this.round,
      paused: this.paused,
      winner: this.winner,
      feedback: this.feedback,
      result: this.result,
    };
  }
  get ai() {
    return this.mode === "cpu" && this.current === 1;
  }
  get period() {
    return Math.max(1.05, 1.9 - this.done * 0.09);
  }
  roll() {
    if (this.state !== "idle" || this.paused) return false;
    this.needed = randomDie(this.random);
    this.done = 0;
    this.state = "rolling";
    this.elapsed = 0;
    this.feedback = "Rolling dice…";
    this.emit();
    return true;
  }
  jump() {
    if (this.state !== "skipping" || this.paused || this.jumpAge < 0.82)
      return false;
    this.jumpAge = 0;
    return true;
  }
  pause() {
    if (this.state === "over") return;
    this.paused = !this.paused;
    this.emit();
  }
  tick(dt) {
    if (this.paused || this.state === "over") return;
    dt = Math.min(dt, 0.05);
    this.time += dt;
    this.elapsed += dt;
    this.jumpAge += dt;
    if (this.state === "idle") {
      if (this.ai && this.elapsed > 0.95) this.roll();
      return;
    }
    if (this.state === "rolling" && this.elapsed > 1.7) {
      this.state = "ready";
      this.elapsed = 0;
      this.readyStartPhase = this.phase;
      this.readyTargetPhase = (Math.floor(this.phase / TAU) + 0.5) * TAU;
      if (this.readyTargetPhase < this.phase) this.readyTargetPhase += TAU;
      this.feedback = `${this.needed} ${this.needed === 1 ? "jump" : "jumps"} — get ready!`;
      this.emit();
      return;
    }
    if (this.state === "ready") {
      const t = Math.min(1, this.elapsed / 1.4),
        smooth = t * t * (3 - 2 * t);
      this.phase =
        this.readyStartPhase +
        (this.readyTargetPhase - this.readyStartPhase) * smooth;
    }
    if (this.state === "ready" && this.elapsed > 1.4) {
      this.state = "skipping";
      this.elapsed = 0;
      this.phase = this.readyTargetPhase;
      this.jumpAge = 9;
      this.aiPlan();
      this.feedback = this.ai
        ? "BeatBot is jumping…"
        : "Tap as the needle reaches green!";
      this.emit();
      return;
    }
    if (this.state === "turnEnd" && this.elapsed > 1.65) {
      this.current = 1 - this.current;
      if (this.current === 0) this.round++;
      this.state = "idle";
      this.elapsed = 0;
      this.feedback = this.ai ? "BeatBot’s turn" : "Your turn — roll the dice!";
      this.emit();
      return;
    }
    if (this.state !== "skipping") return;
    const before = this.phase;
    this.phase += (TAU * dt) / this.period;
    if (
      this.ai &&
      this.jumpAge > 0.82 &&
      !this.aiSkipped &&
      this.phase >= this.aiAt &&
      before < this.aiAt
    )
      this.jump();
    if (Math.floor(before / TAU) < Math.floor(this.phase / TAU)) {
      if (jumpHeight(this.jumpAge) > 0.28) {
        const perfect = Math.abs(this.jumpAge - 0.38) < 0.13;
        this.done++;
        this.combo++;
        this.best = Math.max(this.best, this.combo);
        this.progress[this.current] = scoreJump(
          this.progress[this.current],
          perfect,
        );
        this.feedback = perfect ? "PERFECT! +7%" : "Nice jump! +5%";
        this.result = perfect ? "perfect" : "good";
        if (this.progress[this.current] >= 100) {
          this.finish();
          return;
        }
        if (this.done >= this.needed) {
          this.progress[this.current] = Math.min(
            100,
            this.progress[this.current] + 5,
          );
          if (this.progress[this.current] >= 100) {
            this.finish();
            return;
          }
          this.state = "turnEnd";
          this.elapsed = 0;
          this.feedback = "Challenge clear! +5% bonus";
        }
        this.aiPlan();
        this.emit();
      } else {
        this.combo = 0;
        this.state = "turnEnd";
        this.elapsed = 0;
        this.feedback = "Rope caught! Next turn";
        this.result = "miss";
        this.emit();
      }
    }
  }
  aiPlan() {
    const err =
      { Easy: 0.28, Normal: 0.15, Hard: 0.055 }[this.difficulty] ?? 0.15;
    this.aiSkipped =
      this.random() <
      ({ Easy: 0.17, Normal: 0.08, Hard: 0.02 }[this.difficulty] ?? 0.08);
    const next = (Math.floor(this.phase / TAU) + 1) * TAU;
    this.aiAt =
      next - (TAU * (0.38 + (this.random() - 0.5) * err * 2)) / this.period;
  }
  finish() {
    this.state = "over";
    this.winner = this.current;
    this.feedback = this.current === 0 ? "You did it!" : "Great match!";
    this.emit();
  }
}
