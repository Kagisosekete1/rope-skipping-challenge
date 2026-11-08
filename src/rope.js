import * as THREE from "three";
// Position-based dynamics: inertial particles, gravity, fixed-length constraints,
// hand anchors and a spring drive used by the holders to turn the loop.
export class RopePhysics {
  constructor(count = 40) {
    this.count = count;
    this.points = Array.from({ length: count + 1 }, () => new THREE.Vector3());
    this.previous = this.points.map((p) => p.clone());
    this.ready = false;
    this.lastPhase = 0;
  }
  target(i, phase, a, b) {
    const u = i / this.count,
      s = Math.sin(u * Math.PI);
    return new THREE.Vector3()
      .lerpVectors(a, b, u)
      .add(
        new THREE.Vector3(
          0,
          -1.04 * Math.cos(phase) * s,
          1.04 * Math.sin(phase) * s,
        ),
      );
  }
  step(dt, phase, a, b) {
    if (dt <= 0 && this.ready) return this.points;
    dt = Math.min(dt, 0.025);
    if (!this.ready) {
      this.points.forEach((p, i) => p.copy(this.target(i, phase, a, b)));
      this.previous.forEach((p, i) => p.copy(this.points[i]));
      this.ready = true;
    }
    const desired = this.points.map((_, i) => this.target(i, phase, a, b));
    let length = 0;
    for (let i = 1; i < desired.length; i++)
      length += desired[i].distanceTo(desired[i - 1]);
    const rest = length / this.count;
    for (let i = 1; i < this.count; i++) {
      const p = this.points[i],
        old = p.clone(),
        velocity = p.clone().sub(this.previous[i]).multiplyScalar(0.72);
      p.add(velocity);
      p.y -= 2.2 * dt * dt;
      p.lerp(desired[i], Math.min(1, dt * 27));
      this.previous[i].copy(old);
    }
    for (let pass = 0; pass < 7; pass++) {
      this.points[0].copy(a);
      this.points[this.count].copy(b);
      for (let i = 0; i < this.count; i++) {
        const p = this.points[i],
          q = this.points[i + 1],
          d = q.clone().sub(p),
          len = d.length();
        if (!len) continue;
        d.multiplyScalar(((len - rest) / len) * 0.5);
        if (i !== 0) p.add(d);
        if (i + 1 !== this.count) q.sub(d);
      }
      for (let i = 1; i < this.count; i++)
        this.points[i].y = Math.max(0.045, this.points[i].y);
    }
    this.points[0].copy(a);
    this.points[this.count].copy(b);
    return this.points;
  }
}
