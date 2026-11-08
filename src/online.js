import { TAU } from "./game.js";
export class OnlineMatch {
  constructor(snapshot, client, onChange, onWallet, onError) {
    this.client = client;
    this.onChange = onChange;
    this.onWallet = onWallet;
    this.onError = onError;
    this.mode = "online";
    this.paused = false;
    this.closed = false;
    this.offset = 0;
    this.predictedJump = null;
    this.apply(snapshot);
  }
  get ai() {
    return false;
  }
  get isSpectating() {
    return this.current !== this.mySlot;
  }
  get period() {
    return (this.remote.period_ms || 1900) / 1000;
  }
  apply(data, start = Date.now()) {
    if (this.closed || !data) return;
    if (this.remote && data.server_now < this.remote.server_now) return;
    this.remote = data;
    this.offset = data.server_now + (Date.now() - start) / 2 - Date.now();
    for (const key of [
      "state",
      "current",
      "progress",
      "needed",
      "done",
      "combo",
      "best",
      "round",
      "winner",
      "feedback",
      "result",
      "powers",
      "effects",
    ])
      this[key] = data[key];
    this.mySlot = data.mySlot;
    this.roomId = data.room_id;
    this.stake = Number(data.stake);
    this.names = data.names;
    this.onWallet?.(data.wallet);
    this.tick(0);
    this.emit();
  }
  snapshot() {
    return {
      state: this.state,
      mode: "online",
      current: this.current,
      progress: [...(this.progress || [0, 0])],
      needed: this.needed || 0,
      done: this.done || 0,
      combo: this.combo || 0,
      best: this.best || 0,
      round: this.round || 1,
      winner: this.winner,
      feedback: this.feedback,
      result: this.result,
      paused: this.paused,
      powers: this.powers,
      effects: this.effects,
      frozen: this.frozen || [false, false],
      mySlot: this.mySlot,
      stake: this.stake,
      names: this.names,
      connectionLost: this.connectionLost,
    };
  }
  emit() {
    this.onChange?.(this.snapshot());
  }
  tick() {
    if (!this.remote) return;
    const now = Date.now() + this.offset;
    this.time = now / 1000;
    this.jumpAge =
      (this.predictedJump ?? this.remote.jump_at) == null
        ? 9
        : (now - (this.predictedJump ?? this.remote.jump_at)) / 1000;
    const oldFrozen = this.frozen;
    this.frozen = (this.remote.frozen_until || [0, 0]).map((t) => t > now);
    if (oldFrozen && oldFrozen.some((v, i) => v !== this.frozen[i]))
      this.emit();
    if (this.state === "skipping") {
      this.phase =
        TAU *
        (1 -
          (this.remote.next_crossing - now) / (this.remote.period_ms || 1900));
    } else if (this.state === "ready") {
      const t = Math.max(
        0,
        Math.min(1, 1 - (this.remote.deadline - now) / 1400),
      );
      this.phase = Math.PI * t * t * (3 - 2 * t);
    } else this.phase = 0;
  }
  async request(action) {
    if (this.closed) return false;
    const start = Date.now();
    try {
      const { data, error } = await this.client.rpc("challenge_action", {
        p_room: this.roomId,
        p_action: action,
        p_request_id: crypto.randomUUID(),
      });
      if (error) throw error;
      this.connectionLost = false;
      this.apply(data, start);
      return true;
    } catch (e) {
      if (action === "poll") {
        this.connectionLost = true;
        this.feedback = "Reconnecting — match clock keeps running";
        this.emit();
      } else this.onError?.(e.message || "Action could not be sent");
      return false;
    }
  }
  connect() {
    this.timer = setInterval(() => {
      if (!this.busy) this.request("poll");
    }, 800);
    return this;
  }
  close() {
    this.closed = true;
    clearInterval(this.timer);
  }
  roll() {
    if (this.isSpectating || this.state !== "idle" || this.busy) return false;
    this.busy = true;
    this.request("roll").finally(() => (this.busy = false));
    return true;
  }
  jump() {
    this.tick();
    if (
      this.isSpectating ||
      this.state !== "skipping" ||
      this.paused ||
      this.jumpAge < 0.82 ||
      this.frozen[this.mySlot]
    )
      return false;
    this.predictedJump = Date.now() + this.offset;
    this.jumpAge = 0;
    this.request("jump").finally(() => {
      this.predictedJump = null;
    });
    return true;
  }
  pause() {
    this.paused = !this.paused;
    this.emit();
  }
  canPower(name) {
    if (
      !["idle", "rolling", "ready", "skipping"].includes(this.state) ||
      this.paused
    )
      return false;
    if (name === "freeze")
      return (
        this.isSpectating &&
        this.state === "skipping" &&
        !this.frozen?.[this.current]
      );
    if (name === "slow" && this.state !== "skipping") return false;
    return (
      (name === "block" || !this.isSpectating) &&
      (this.powers?.[this.mySlot]?.[name] || 0) > 0
    );
  }
  async usePower(name) {
    if (!this.canPower(name) || this.busy) return false;
    this.busy = true;
    try {
      return await this.request(name);
    } finally {
      this.busy = false;
    }
  }
  async forfeit() {
    return this.request("forfeit");
  }
}
