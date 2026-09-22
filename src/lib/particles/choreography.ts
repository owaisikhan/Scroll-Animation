/**
 * Where the particle cloud should be for a given section progress, ported
 * term for term from the reference.
 *
 * Section progress is the index of the section crossing the top of the
 * viewport plus how far through it the page has scrolled:
 *   0 landing · 1 introduction · 2 manifesto intro · 3 lightbulb
 *   4 better world · 5 team · 6 footer
 */

/** Clamp v into [lo, hi] (the reference's zt). */
function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

/** Map v from [a0, a1] onto [b0, b1] (the reference's Ut). */
function map(v: number, a0: number, a1: number, b0: number, b1: number) {
  return ((v - a0) / (a1 - a0)) * (b1 - b0) + b0;
}

/** A 0..1 ramp across [a, b]. */
function ramp(e: number, a: number, b: number) {
  return clamp(map(e, a, b, 0, 1), 0, 1);
}

export interface Pose {
  /** Screen-space offset of the cloud, in world units. */
  x: number;
  y: number;
  /** 0 = assembled, 1 = exploded outward. */
  explode: number;
  /** Radius the normalised form is scaled by. */
  factor: number;
  /** 0 brain · 1 lightbulb · 2 sphere · 3 logo. */
  progress: number;
  /** Object-space rotation (radians). */
  rotY: number;
  rotZ: number;
}

export function poseDesktop(e: number): Pose {
  const x =
    clamp(map(e, 0, 1, 3, -4.5), -4.5, 3) +
    clamp(map(e, 1.25, 1.5, 0.905, 5), 0.905, 5) -
    clamp(map(e, 2.8, 3, 0.905, 3), 0.905, 3) +
    clamp(map(e, 3.3, 3.5, 0.905, 6), 0.905, 6) -
    clamp(map(e, 4.5, 5, 0.905, 5), 0.905, 4);
  const y =
    clamp(map(e, 2.7, 3, 0, 0.5), 0, 0.5) -
    clamp(map(e, 3.3, 3.5, 0, 0.5), 0, 0.5) +
    clamp(map(e, 5.7, 6, 0, 1.75), 0, 1.75);
  const explode =
    ramp(e, 1.1, 2.2) - ramp(e, 2.8, 3) + ramp(e, 4.5, 5) - ramp(e, 5.7, 6);
  const factor =
    4.35 +
    ramp(e, 0, 1) -
    ramp(e, 1.25, 1.5) +
    clamp(map(e, 3.3, 3.5, 0, 0.3), 0, 0.3) -
    ramp(e, 5.7, 6);
  const progress = ramp(e, 2.7, 3) + ramp(e, 3.3, 3.5) + ramp(e, 5.7, 6);
  return { x, y, explode, factor, progress, ...rotation(e, 6) };
}

export function poseMobile(e: number): Pose {
  const x = clamp(map(e, 0, 1, 1.5, 0), 0, 1.5);
  const explode =
    ramp(e, 1.4, 1.7) - ramp(e, 2.7, 3) + ramp(e, 4.5, 5) - ramp(e, 5.7, 5.8);
  const progress = ramp(e, 2.7, 3) + ramp(e, 3.3, 3.5) + ramp(e, 5.7, 5.8);
  return { x, y: 2, explode, factor: 2.5, progress, ...rotation(e, 5.8) };
}

function rotation(e: number, rotYEnd: number) {
  const h = Math.PI / 2;
  const rotY =
    clamp(map(e, 0, 1, 0, -h), -h, 0) +
    clamp(map(e, 2.7, 3, 0, h), 0, h) +
    clamp(map(e, 3.3, 3.5, 0, Math.PI / 4), 0, Math.PI / 4) -
    clamp(map(e, 4.5, 5, 0, 1.25 * Math.PI), 0, 1.25 * Math.PI) +
    clamp(map(e, 5.7, rotYEnd, 0, Math.PI), 0, Math.PI);
  const rotZ =
    clamp(map(e, 2.7, 3, 0, -0.489), -0.489, 0) +
    clamp(map(e, 3.3, 3.5, 0, 0.6), 0, 0.6);
  return { rotY, rotZ };
}

/** Horizontal drift of the large foreground pyramids (desktop only). */
export function frontConesX(e: number) {
  const t =
    clamp(map(e, 0, 1, 2, -5), -5, 1) +
    clamp(map(e, 1.25, 1.5, 0, 5), 0, 5) -
    clamp(map(e, 2.7, 3, 0, 5), 0, 5) +
    clamp(map(e, 3.3, 3.5, 0, 5), 0, 9) -
    clamp(map(e, 4.5, 5, 0, 5), 0, 4);
  return 0.25 * t;
}
