/**
 * Bakes the reference site's brain point cloud into public/particles/brain.bin.
 *
 * The reference stores its forms in three 200x200 textures, each split into
 * four 100x100 quadrants (one form per quadrant, 10,000 particles each):
 *   pos-33.exr  float RGB positions in 0..1 (brain = bottom-left quadrant
 *               once the texture is flipped on upload)
 *   sc-33.png   per-particle scale in the red channel
 *   cd-33.png   per-particle colour
 * Particle i reads texel (i % 100, floor(i / 100)) of its quadrant.
 *
 * Output layout (little endian, no header):
 *   Float32 x 3N  positions, remapped to -1..1 ((p - 0.5) * 2)
 *   Uint8   x N   scale (raw red channel, 0..255)
 *   Uint8   x 3N  colour (raw RGB)
 *
 * Usage: node scripts/bake-brain.mjs [sourceBaseUrlOrDir]
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";

const SOURCE = process.argv[2] ?? "https://dala.craftedbygc.com/images";
const OUT = path.resolve("public/particles/brain.bin");
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

const positions = new Float32Array(N * 3);
const scales = new Uint8Array(N);
const colors = new Uint8Array(N * 3);

for (let i = 0; i < N; i++) {
  const c = i % Q;
  const r = Math.floor(i / Q);
  // The EXR is uploaded with flipY, so texture row r is data row (H - 1 - r).
  const e = ((exr.height - 1 - r) * exr.width + c) * 4;
  for (let k = 0; k < 3; k++) positions[i * 3 + k] = (exr.data[e + k] - 0.5) * 2;
  const s = (r * scale.width + c) * scale.channels;
  scales[i] = scale.data[s];
  const p = (r * color.width + c) * color.channels;
  colors[i * 3] = color.data[p];
  colors[i * 3 + 1] = color.data[p + 1];
  colors[i * 3 + 2] = color.data[p + 2];
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
console.log(`Wrote ${OUT} (${N} particles)`);
