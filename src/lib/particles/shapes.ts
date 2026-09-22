/**
 * The reference's four particle forms — brain, lightbulb, sphere and the Dala
 * logo — baked by scripts/bake-shapes.mjs together with each particle's
 * per-form scale and colour.
 */

export const SHAPES_URL = "/sites/dala-craftedbygc-com-90f44805/shared/particles/shapes.bin";

/** Forms in the file, in scroll order. */
export const SHAPE_COUNT = 4;

/** Particles per form; the reference renders exactly this many. */
export const PARTICLE_COUNT = 10000;

export interface ShapeData {
  /** Per form: positions normalised to -1..1 (xyz interleaved). */
  positions: Float32Array[];
  /** Per form: scale, 0..1. */
  scales: Float32Array[];
  /** Per form: linear RGB, 0..1 (interleaved). */
  colors: Float32Array[];
}

export async function loadShapes(signal?: AbortSignal): Promise<ShapeData> {
  const res = await fetch(SHAPES_URL, { signal });
  if (!res.ok) throw new Error(`shapes.bin: HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const n = PARTICLE_COUNT;
  const s = SHAPE_COUNT;

  const positions: Float32Array[] = [];
  const scales: Float32Array[] = [];
  const colors: Float32Array[] = [];
  const rawScales = new Uint8Array(buf, s * n * 12, s * n);
  const rawColors = new Uint8Array(buf, s * n * 13, s * n * 3);

  for (let k = 0; k < s; k++) {
    positions.push(new Float32Array(buf.slice(k * n * 12, (k + 1) * n * 12)));
    const sc = new Float32Array(n);
    const co = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) sc[i] = rawScales[k * n + i] / 255;
    for (let i = 0; i < n * 3; i++) co[i] = rawColors[k * n * 3 + i] / 255;
    scales.push(sc);
    colors.push(co);
  }
  return { positions, scales, colors };
}
