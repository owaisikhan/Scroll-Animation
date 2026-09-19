/**
 * Shape sources for the particle cloud.
 *
 * Each form is a hollow 3D shell, not a filled silhouette: points are sampled
 * on the surfaces of a few parametric primitives, so the far side of the form
 * shows through the near side and the rim reads dense at grazing angles.
 * Shapes are assembled from ellipsoids, cones and capsules and then displaced
 * by value noise, which is what gives the brain its folds.
 */

export type ShapeName = "brain" | "bulb" | "globe";

export interface ShapeCloud {
  positions: Float32Array;
}

/* ---------- deterministic randomness ---------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;

/** Box-Muller, for evenly covering a sphere via normalised gaussians. */
function gauss(rand: Rand) {
  const u = Math.max(1e-9, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/* ---------- value noise, for surface displacement ---------- */

function hash3(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (i: number, j: number, k: number) => hash3(xi + i, yi + j, zi + k);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}

/* ---------- primitives, each emitting points on its surface ---------- */

type Vec3 = [number, number, number];
type Emit = (x: number, y: number, z: number) => void;

/** Surface of an axis-aligned ellipsoid. */
function ellipsoidSurface(rand: Rand, n: number, c: Vec3, r: Vec3, emit: Emit) {
  for (let i = 0; i < n; i++) {
    let x = gauss(rand), y = gauss(rand), z = gauss(rand);
    const len = Math.hypot(x, y, z) || 1;
    x /= len; y /= len; z /= len;
    emit(c[0] + x * r[0], c[1] + y * r[1], c[2] + z * r[2]);
  }
}

/** Lateral surface of a cone frustum aligned to Y. */
function frustumSurface(
  rand: Rand, n: number, c: Vec3, y0: number, y1: number, r0: number, r1: number, emit: Emit,
) {
  for (let i = 0; i < n; i++) {
    const t = rand();
    const y = y0 + (y1 - y0) * t;
    const r = r0 + (r1 - r0) * t;
    const a = rand() * Math.PI * 2;
    emit(c[0] + Math.cos(a) * r, c[1] + y, c[2] + Math.sin(a) * r);
  }
}

/** Flat annulus/disc in the XZ plane. */
function discSurface(rand: Rand, n: number, c: Vec3, y: number, rInner: number, rOuter: number, emit: Emit) {
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(rInner * rInner + rand() * (rOuter * rOuter - rInner * rInner));
    const a = rand() * Math.PI * 2;
    emit(c[0] + Math.cos(a) * r, c[1] + y, c[2] + Math.sin(a) * r);
  }
}

/* ---------- the three forms ---------- */

function buildBrain(rand: Rand, count: number, emit: Emit) {
  // Two cerebral lobes, split by a longitudinal fissure, plus cerebellum and
  // stem. Gyri come from ridged noise displacement along the surface normal.
  const lobe = Math.floor(count * 0.40);
  const cere = Math.floor(count * 0.09);
  const stem = Math.floor(count * 0.05);

  const foldy = (x: number, y: number, z: number, amp: number): Vec3 => {
    const n1 = noise3(x * 3.1, y * 3.1, z * 3.1);
    const n2 = noise3(x * 7.3 + 11, y * 7.3, z * 7.3);
    // Ridged noise creates creases rather than lumps.
    const ridge = 1 - Math.abs(n1 * 2 - 1);
    const d = (ridge * 0.7 + n2 * 0.3 - 0.45) * amp;
    const len = Math.hypot(x, y, z) || 1;
    return [x + (x / len) * d, y + (y / len) * d, z + (z / len) * d];
  };

  for (const side of [-1, 1]) {
    ellipsoidSurface(rand, lobe, [0, 0, 0], [1.02, 0.78, 0.86], (x, y, z) => {
      // Push each lobe off the midline and squash the inner face flat.
      let zz = z;
      if (Math.sign(zz) !== side) zz = -zz;
      zz = side * (Math.abs(zz) * 0.62 + 0.1);
      const [fx, fy, fz] = foldy(x, y, zz, 0.12);
      emit(fx, fy - 0.02, fz);
    });
  }

  ellipsoidSurface(rand, cere, [0.54, -0.52, 0], [0.34, 0.24, 0.30], (x, y, z) => {
    const [fx, fy, fz] = foldy(x * 1.4, y * 1.4, z * 1.4, 0.09);
    emit(fx * 0.72 + 0.54 * 0.28, fy * 0.72 - 0.52 * 0.28, fz * 0.72);
  });

  frustumSurface(rand, stem, [0.30, 0, 0], -1.32, -0.42, 0.085, 0.17, emit);
}

function buildBulb(rand: Rand, count: number, emit: Emit) {
  const glass = Math.floor(count * 0.60);
  const neck = Math.floor(count * 0.10);
  const thread = Math.floor(count * 0.22);

  // Envelope: a sphere pinched into the neck over its lower third.
  ellipsoidSurface(rand, glass, [0, 0.28, 0], [0.74, 0.78, 0.74], (x, y, z) => {
    if (y < 0.05) {
      // Taper the bottom of the sphere inward to meet the neck.
      const t = Math.min(1, (0.05 - y) / 0.62);
      const k = 1 - t * 0.66;
      emit(x * k, y, z * k);
    } else {
      emit(x, y, z);
    }
  });

  frustumSurface(rand, neck, [0, 0, 0], -0.62, -0.40, 0.26, 0.30, emit);

  // Screw base: three stepped rings read as threads once sampled.
  for (let i = 0; i < 3; i++) {
    const y0 = -0.66 - i * 0.16;
    frustumSurface(rand, Math.floor(thread / 3), [0, 0, 0], y0 - 0.14, y0, 0.235 - i * 0.012, 0.265 - i * 0.012, emit);
  }
  ellipsoidSurface(rand, Math.floor(count * 0.05), [0, -1.14, 0], [0.20, 0.13, 0.20], (x, y, z) => {
    if (y <= 0.01) emit(x, y, z);
  });
  discSurface(rand, Math.floor(count * 0.03), [0, 0, 0], -1.14, 0, 0.20, emit);
}

function buildGlobe(rand: Rand, count: number, emit: Emit) {
  ellipsoidSurface(rand, count, [0, 0, 0], [1, 1, 1], (x, y, z) => {
    // Faint relief so the sphere is not perfectly smooth.
    const d = (noise3(x * 2.6 + 5, y * 2.6, z * 2.6) - 0.5) * 0.05;
    emit(x * (1 + d), y * (1 + d), z * (1 + d));
  });
}

/* ---------- public API ---------- */

const BUILDERS: Record<ShapeName, (r: Rand, n: number, e: Emit) => void> = {
  brain: buildBrain,
  bulb: buildBulb,
  globe: buildGlobe,
};

/** World-space size of each form, so they read at comparable scale. */
const SCALE: Record<ShapeName, number> = { brain: 1.58, bulb: 1.54, globe: 1.42 };

export function buildShape(name: ShapeName, count: number, seed = 1): ShapeCloud {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const s = SCALE[name];
  let w = 0;

  BUILDERS[name](rand, count, (x, y, z) => {
    if (w >= count) return;
    positions[w * 3] = x * s;
    positions[w * 3 + 1] = y * s;
    positions[w * 3 + 2] = z * s;
    w++;
  });

  // Primitives emit by proportion and can land just short; scatter any
  // remainder loosely around the form as the strays seen drifting outside it.
  for (; w < count; w++) {
    positions[w * 3] = (rand() * 2 - 1) * s * 2.2;
    positions[w * 3 + 1] = (rand() * 2 - 1) * s * 1.5;
    positions[w * 3 + 2] = (rand() * 2 - 1) * s * 1.2;
  }

  return { positions };
}

/** A loose cloud used for the dispersed state between forms. */
export function buildScatter(count: number, seed = 7, radius = 2.6): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const theta = rand() * Math.PI * 2;
    const r = radius * (0.30 + 0.70 * Math.cbrt(rand()));
    const s = Math.sqrt(1 - u * u);
    out[i * 3] = r * s * Math.cos(theta) * 1.7;
    out[i * 3 + 1] = r * s * Math.sin(theta) * 1.1;
    out[i * 3 + 2] = r * u * 0.8;
  }
  return out;
}
