/**
 * Shape sources for the particle cloud.
 *
 * Each shape is drawn as original 2D artwork on an offscreen canvas, then
 * turned into a 3D point cloud:
 *   - a sharp render gives the silhouette we rejection-sample XY from
 *   - a blurred render gives a thickness field, so points sit deeper in the
 *     middle of a form than at its edge and the cloud reads as a solid when
 *     it rotates, rather than as a flat cutout.
 */

export type ShapeName = "brain" | "bulb" | "globe";

const RES = 512;

/** Deterministic RNG so a reload produces the same cloud. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = CanvasRenderingContext2D;

/** Draw in a 1000x1000 design space regardless of canvas resolution. */
function withDesignSpace(ctx: Ctx, draw: (c: Ctx) => void) {
  ctx.save();
  ctx.scale(RES / 1000, RES / 1000);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  draw(ctx);
  ctx.restore();
}

function drawBrain(ctx: Ctx) {
  withDesignSpace(ctx, (c) => {
    // Cerebrum
    c.beginPath();
    c.moveTo(180, 520);
    c.bezierCurveTo(110, 430, 120, 320, 205, 258);
    c.bezierCurveTo(285, 185, 395, 158, 505, 172);
    c.bezierCurveTo(630, 158, 740, 188, 802, 252);
    c.bezierCurveTo(858, 305, 872, 372, 858, 432);
    c.bezierCurveTo(862, 492, 840, 534, 792, 560);
    c.bezierCurveTo(742, 592, 686, 602, 622, 598);
    c.bezierCurveTo(520, 612, 428, 606, 332, 590);
    c.bezierCurveTo(258, 592, 208, 566, 180, 520);
    c.closePath();
    c.fill();

    // Cerebellum
    c.beginPath();
    c.ellipse(712, 628, 104, 74, -0.18, 0, Math.PI * 2);
    c.fill();

    // Brain stem
    c.beginPath();
    c.moveTo(596, 588);
    c.bezierCurveTo(614, 680, 620, 770, 606, 862);
    c.lineTo(668, 862);
    c.bezierCurveTo(686, 764, 684, 674, 668, 586);
    c.closePath();
    c.fill();

    // Gyri — interior folds give the cloud its density variation
    c.lineWidth = 15;
    const folds: [number, number][][] = [
      [[240, 470], [300, 400], [250, 340], [330, 292]],
      [[360, 560], [400, 470], [340, 424], [418, 352]],
      [[470, 572], [520, 486], [452, 430], [540, 366]],
      [[590, 560], [640, 472], [566, 420], [654, 352]],
      [[700, 528], [752, 452], [688, 400], [762, 330]],
      [[300, 250], [390, 286], [470, 242], [556, 280]],
      [[600, 252], [676, 292], [744, 262], [800, 312]],
    ];
    for (const pts of folds) {
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        c.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      c.stroke();
    }
  });
}

function drawBulb(ctx: Ctx) {
  withDesignSpace(ctx, (c) => {
    // Glass envelope: a circle swept from lower-left, over the top, to
    // lower-right, then drawn in to a waisted neck.
    const cx = 500;
    const cy = 372;
    const r = 214;
    c.beginPath();
    c.arc(cx, cy, r, Math.PI * 0.76, Math.PI * 0.24, false);
    // right shoulder -> neck
    c.bezierCurveTo(636, 566, 592, 596, 578, 648);
    c.lineTo(572, 684);
    c.lineTo(428, 684);
    c.lineTo(422, 648);
    // neck -> left shoulder
    c.bezierCurveTo(408, 596, 364, 566, 348, 530);
    c.closePath();
    c.fill();

    // Screw base: a slight taper with three thread steps, then a rounded tip.
    const threads: [number, number, number][] = [
      [696, 434, 566],
      [740, 430, 562],
      [784, 426, 558],
    ];
    for (const [y, x0, x1] of threads) {
      c.beginPath();
      c.moveTo(x0, y);
      c.lineTo(x1, y);
      c.lineTo(x1 - 4, y + 34);
      c.lineTo(x0 + 4, y + 34);
      c.closePath();
      c.fill();
    }
    c.beginPath();
    c.moveTo(430, 826);
    c.lineTo(570, 826);
    c.bezierCurveTo(566, 878, 540, 902, 500, 904);
    c.bezierCurveTo(460, 902, 434, 878, 430, 826);
    c.closePath();
    c.fill();

    // Filament — the detail that makes it unmistakably a bulb.
    c.lineWidth = 15;
    c.beginPath();
    c.moveTo(444, 620);
    c.lineTo(452, 452);
    c.quadraticCurveTo(476, 366, 500, 444);
    c.quadraticCurveTo(524, 366, 548, 452);
    c.lineTo(556, 620);
    c.stroke();
  });
}

function drawGlobe(ctx: Ctx) {
  withDesignSpace(ctx, (c) => {
    c.beginPath();
    c.arc(500, 500, 330, 0, Math.PI * 2);
    c.fill();

    // Everything below is carved out of the disc as thin contours. Filled
    // cut-outs would hollow the sphere and it would read as a ring.
    c.globalCompositeOperation = "destination-out";

    // Two meridians and one equator — any more and the rings alias into a
    // moire once the sphere is sampled as points.
    c.lineWidth = 9;
    for (const rx of [112, 236]) {
      c.beginPath();
      c.ellipse(500, 500, rx, 330, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.beginPath();
    c.ellipse(500, 500, 330, 120, 0, 0, Math.PI * 2);
    c.stroke();

    // Stylised coastlines, stroked so the land stays part of the sphere.
    c.lineWidth = 13;
    const coast = (pts: [number, number][]) => {
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i <= pts.length; i++) {
        const p = pts[i % pts.length];
        const n = pts[(i + 1) % pts.length];
        c.quadraticCurveTo(p[0], p[1], (p[0] + n[0]) / 2, (p[1] + n[1]) / 2);
      }
      c.closePath();
      c.stroke();
    };
    coast([[486, 286], [586, 316], [612, 396], [586, 466], [622, 540], [584, 648], [516, 720], [458, 644], [430, 532], [404, 424], [424, 330]]);
    coast([[292, 386], [360, 352], [398, 410], [350, 464], [296, 446]]);
    coast([[676, 600], [736, 592], [758, 646], [712, 686], [668, 654]]);

    c.globalCompositeOperation = "source-over";
  });
}

const DRAWERS: Record<ShapeName, (c: Ctx) => void> = {
  brain: drawBrain,
  bulb: drawBulb,
  globe: drawGlobe,
};

function render(name: ShapeName, blurPx: number): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = RES;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.clearRect(0, 0, RES, RES);
  if (blurPx > 0) ctx.filter = `blur(${blurPx}px)`;
  DRAWERS[name](ctx);
  ctx.filter = "none";
  return ctx.getImageData(0, 0, RES, RES).data;
}

export interface ShapeCloud {
  /** xyz triplets, centred on the origin, roughly within a unit-ish box. */
  positions: Float32Array;
}

/**
 * Sample `count` points from a shape. Points are drawn from the silhouette
 * with probability proportional to coverage, then pushed off the drawing
 * plane by the local thickness so the form has depth.
 */
export function buildShape(name: ShapeName, count: number, seed = 1): ShapeCloud {
  const sharp = render(name, 0);
  const soft = render(name, 26);

  // Build a CDF over covered pixels so sampling is uniform across the form.
  const weights: number[] = [];
  const index: number[] = [];
  let total = 0;
  for (let i = 0; i < RES * RES; i++) {
    const a = sharp[i * 4 + 3];
    if (a > 8) {
      total += a;
      weights.push(total);
      index.push(i);
    }
  }

  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const scale = 2.6; // design-space -> world units

  for (let p = 0; p < count; p++) {
    // Binary search the CDF
    const target = rand() * total;
    let lo = 0;
    let hi = weights.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (weights[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const pix = index[lo];
    const px = (pix % RES) + rand();
    const py = Math.floor(pix / RES) + rand();

    // Thickness from the blurred field, shaped so the depth profile is domed
    // rather than boxy.
    const t = soft[pix * 4 + 3] / 255;
    const thickness = Math.sqrt(Math.max(0, t)) * 0.42;

    // Cosine-weighted depth keeps the surface denser than the core, which is
    // what makes the silhouette stay crisp while the form still rotates.
    const u = rand() * 2 - 1;
    const z = Math.sign(u) * Math.pow(Math.abs(u), 0.65) * thickness;

    positions[p * 3 + 0] = (px / RES - 0.5) * scale;
    positions[p * 3 + 1] = -(py / RES - 0.5) * scale;
    positions[p * 3 + 2] = z * scale;
  }

  return { positions };
}

/** A loose spherical cloud used for the dispersed state between shapes. */
export function buildScatter(count: number, seed = 7, radius = 2.6): Float32Array {
  const rand = mulberry32(seed);
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const theta = rand() * Math.PI * 2;
    const r = radius * (0.35 + 0.65 * Math.cbrt(rand()));
    const s = Math.sqrt(1 - u * u);
    out[i * 3 + 0] = r * s * Math.cos(theta) * 1.5;
    out[i * 3 + 1] = r * s * Math.sin(theta);
    out[i * 3 + 2] = r * u * 0.6;
  }
  return out;
}
