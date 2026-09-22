/**
 * Bakes the reference site's four particle forms into
 * public/sites/dala-craftedbygc-com-90f44805/shared/particles/shapes.bin.
 *
 * The reference stores its forms in three 200x200 textures, each split into
 * four 100x100 quadrants (one form per quadrant, 10,000 particles each):
 *   pos-33.exr  float RGB positions in 0..1
 *   sc-33.png   per-particle scale in the red channel
 *   cd-33.png   per-particle colour
 * In texture space (v up, EXR flipped on upload) the quadrants are, in scroll
 * order: brain (0,0), lightbulb (1,0), sphere (0,1), Dala logo (1,1).
 * Particle i reads texel (i % 100, floor(i / 100)) of each quadrant.
 *
 * The final form is rebranded: the Dala mark's positions are replaced by a
 * 3D extruded Kodexa "K" (its per-particle scale and colour are kept).
 *
 * Output layout (little endian, no header), for S = 4 shapes:
 *   Float32 x S*3N  positions, remapped to -1..1 ((p - 0.5) * 2)
 *   Uint8   x S*N   scale (raw red channel, 0..255)
 *   Uint8   x S*3N  colour (raw RGB)
 *
 * Usage: node scripts/bake-shapes.mjs [sourceBaseUrlOrDir]
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

const SOURCE = process.argv[2] ?? "https://dala.craftedbygc.com/images";
const OUT = path.resolve(
  "public/sites/dala-craftedbygc-com-90f44805/shared/particles/shapes.bin",
);
/** Quadrant offsets (in texels) for each form, in scroll order. */
const QUADS = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];
const N = 10000;
const Q = 100;

async function read(name) {
  if (/^https?:/.test(SOURCE)) {
    const res = await fetch(`${SOURCE}/${name}`);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  }
  return new Uint8Array(fs.readFileSync(path.join(SOURCE, name)));
}

/** Minimal decoder for 8-bit, non-interlaced RGB/RGBA PNGs. */
function decodePng(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let off = 8;
  let width = 0, height = 0, channels = 0;
  const idat = [];
  while (off < buf.length) {
    const len = view.getUint32(off);
    const type = String.fromCharCode(...buf.subarray(off + 4, off + 8));
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = view.getUint32(off + 8);
      height = view.getUint32(off + 12);
      const depth = data[8], colorType = data[9], interlace = data[12];
      if (depth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
        throw new Error("Unsupported PNG format");
      }
      channels = colorType === 2 ? 3 : 4;
    } else if (type === "IDAT") {
      idat.push(data);
    }
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = new Uint8Array(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[y * stride + x - channels] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? out[(y - 1) * stride + x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y * stride + x] = v & 255;
    }
  }
  return { width, height, channels, data: out };
}

const exrBuf = await read("pos-33.exr");
const loader = new EXRLoader();
loader.setDataType(THREE.FloatType);
const exr = loader.parse(exrBuf.buffer.slice(exrBuf.byteOffset, exrBuf.byteOffset + exrBuf.byteLength));
const scale = decodePng(await read("sc-33.png"));
const color = decodePng(await read("cd-33.png"));

const S = QUADS.length;
const positions = new Float32Array(S * N * 3);
const scales = new Uint8Array(S * N);
const colors = new Uint8Array(S * N * 3);

QUADS.forEach(([qx, qy], k) => {
  for (let i = 0; i < N; i++) {
    const c = (i % Q) + qx * Q;
    const r = Math.floor(i / Q) + qy * Q;
    const o = k * N + i;
    // The EXR is uploaded with flipY, so texture row r is data row (H - 1 - r).
    const e = ((exr.height - 1 - r) * exr.width + c) * 4;
    for (let j = 0; j < 3; j++) positions[o * 3 + j] = (exr.data[e + j] - 0.5) * 2;
    const s = (r * scale.width + c) * scale.channels;
    scales[o] = scale.data[s];
    const p = (r * color.width + c) * color.channels;
    colors[o * 3] = color.data[p];
    colors[o * 3 + 1] = color.data[p + 1];
    colors[o * 3 + 2] = color.data[p + 2];
  }
});

/* ---------- the Kodexa K ---------- */

// Deterministic randomness so re-baking gives the same file.
let seed = 20260922;
function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const K_TOP = 0.9;
const K_DEPTH = 0.2;

/** Distance from p to the segment a-b. */
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}

/** The glyph: a stem and two arms meeting just left of centre. */
function insideK(x, y) {
  if (Math.abs(y) > K_TOP) return false;
  if (x >= -0.62 && x <= -0.26) return true;
  const upper = segDist(x, y, -0.3, -0.08, 0.52, K_TOP + 0.2) < 0.17;
  const lower = segDist(x, y, -0.12, 0.12, 0.6, -K_TOP - 0.2) < 0.17;
  return x > -0.3 && x < 0.72 && (upper || lower);
}

function onEdge(x, y) {
  const e = 0.012;
  for (let a = 0; a < 8; a++) {
    const t = (a / 8) * Math.PI * 2;
    if (!insideK(x + Math.cos(t) * e, y + Math.sin(t) * e)) return true;
  }
  return false;
}

function sampleK(i) {
  // Faces carry most of the points; the walls get the rest so the extrusion
  // reads as a solid when it turns.
  const face = i % 10 < 7;
  for (;;) {
    const x = -0.7 + rand() * 1.5;
    const y = -K_TOP + rand() * 2 * K_TOP;
    if (!insideK(x, y)) continue;
    if (face) return [x, y, rand() < 0.5 ? -K_DEPTH : K_DEPTH];
    if (onEdge(x, y)) return [x, y, (rand() * 2 - 1) * K_DEPTH];
  }
}

for (let i = 0; i < N; i++) {
  const [x, y, z] = sampleK(i);
  const o = (3 * N + i) * 3;
  positions[o] = x;
  positions[o + 1] = y;
  positions[o + 2] = z;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  Buffer.concat([
    Buffer.from(positions.buffer),
    Buffer.from(scales.buffer),
    Buffer.from(colors.buffer),
  ]),
);
console.log(`Wrote ${OUT} (${S} forms x ${N} particles)`);
