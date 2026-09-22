import type { ShapeData } from "./shapes";

/**
 * CPU port of the reference's two GPU simulation passes.
 *
 * Every particle has a target: its point on each form, blended by the
 * current progress with a per-particle delay (so forms sweep in rather than
 * cross-fade), pushed outward by the explode amount, and scaled by the
 * form's radius. The particle chases that target on a damped spring, which
 * is what gives the cloud its elastic, trailing motion.
 */

const SPRING = 0.006;
const FRICTION = 0.892;
/** Stagger constants from the reference shaders. */
const SHOW_DELAY = 0.00005;
const SWEEP_DELAY = 0.0005;
const EXPLODE_DELAY = 0.00015;
/** The reference steps its simulation once per frame at 60fps. */
const STEP = 1 / 60;

function quinticInOut(x: number) {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

/** Rank of each particle when sorted by `key` (stable for ties). */
function ranks(n: number, key: (i: number) => number, descending: boolean) {
  const idx = Array.from({ length: n }, (_, i) => i);
  idx.sort((a, b) => (descending ? key(b) - key(a) : key(a) - key(b)));
  const out = new Float32Array(n);
  idx.forEach((i, r) => (out[i] = r));
  return out;
}

export interface SimInputs {
  show: number;
  factor: number;
  progress: number;
  explode: number;
}

export class Simulation {
  readonly count: number;
  /** Current particle centres (xyz interleaved), in world units. */
  readonly position: Float32Array;
  private velocity: Float32Array;
  private forms: Float32Array[];

  // Per-particle constants, as the reference packs them into t_params*.
  private flyOut: Float32Array; // tParams.x — show start radius offset
  private showOrder: Float32Array; // tParams.z — brain, top first
  private springJitter: Float32Array; // tParams.w
  private sweepOrder: Float32Array; // tParams2.y — sphere, right first
  private explodeOrder: Float32Array; // tParams2.w — brain, bottom first
  private explodeReach: Float32Array; // tParams3.x

  private started = false;
  private carry = 0;

  constructor(data: ShapeData, count: number) {
    const n = count;
    this.count = n;
    this.forms = data.positions;
    this.position = new Float32Array(n * 3);
    this.velocity = new Float32Array(n * 3);

    const brain = data.positions[0];
    const sphere = data.positions[2];
    this.flyOut = new Float32Array(n);
    this.springJitter = new Float32Array(n);
    this.explodeReach = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.flyOut[i] = i % 2 === 0 ? Math.random() : -Math.random();
      this.springJitter[i] = 2e-4 * Math.random() - 1e-4;
      this.explodeReach[i] = 1 + 5 * Math.random();
    }
    this.showOrder = ranks(n, (i) => brain[i * 3 + 1], true);
    this.sweepOrder = ranks(n, (i) => sphere[i * 3], true);
    this.explodeOrder = ranks(n, (i) => brain[i * 3 + 1], false);
  }

  /** Advance by dt seconds, in fixed 60Hz steps like the reference. */
  update(dt: number, inputs: SimInputs) {
    if (!this.started) {
      // The first frame places every particle on its target outright.
      this.writeTargets(inputs, this.position);
      this.started = true;
      return;
    }
    this.carry = Math.min(this.carry + dt, STEP * 4);
    while (this.carry >= STEP) {
      this.step(inputs);
      this.carry -= STEP;
    }
  }

  private target = new Float32Array(0);

  private step(inputs: SimInputs) {
    const n = this.count;
    if (this.target.length !== n * 3) this.target = new Float32Array(n * 3);
    const t = this.target;
    this.writeTargets(inputs, t);
    const p = this.position;
    const v = this.velocity;
    for (let i = 0; i < n; i++) {
      const k = SPRING + this.springJitter[i];
      for (let j = 0; j < 3; j++) {
        const o = i * 3 + j;
        v[o] = (v[o] + (t[o] - p[o]) * k) * FRICTION;
        p[o] += v[o];
      }
    }
  }

  private writeTargets({ show, factor, progress, explode }: SimInputs, out: Float32Array) {
    const n = this.count;
    const [f0, f1, f2, f3] = this.forms;
    const len = n - 1;
    const m1 = Math.min(1, Math.max(0, progress));
    const m3 = Math.min(1, Math.max(0, progress - 2));
    const p2 = Math.max(0, progress - 1) * (1 + SWEEP_DELAY * len);
    const ex = explode * (1 + EXPLODE_DELAY * len);
    const sh = show * (1 + SHOW_DELAY * len);

    for (let i = 0; i < n; i++) {
      const s = quinticInOut(Math.min(1, Math.max(0, sh - SHOW_DELAY * this.showOrder[i])));
      const radius = factor + this.flyOut[i] * 3 * (1 - s);
      const m2 = Math.min(1, Math.max(0, p2 - SWEEP_DELAY * this.sweepOrder[i]));
      const me = Math.min(1, Math.max(0, ex - EXPLODE_DELAY * this.explodeOrder[i]));
      const reach = 1 + (this.explodeReach[i] - 1) * me;
      for (let j = 0; j < 3; j++) {
        const o = i * 3 + j;
        let q = f0[o] + (f1[o] - f0[o]) * m1;
        q += (f2[o] - q) * m2;
        q += (f3[o] - q) * m3;
        out[o] = q * radius * reach;
      }
    }
  }
}
