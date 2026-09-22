/**
 * Instanced pyramid shaders, ported from the reference's particle material.
 *
 * Every instance is a small tetrahedron-frame mesh. Its centre morphs between
 * the loaded forms; its orientation tumbles with simplex noise sampled at its
 * position plus time; its size and colour come from the baked brain data.
 *
 * Hover and depth values are worked out in the reference's own world units
 * (uUnit converts them), so the constants below match its shader verbatim.
 */
export const vertexShader = /* glsl */ `
precision highp float;

attribute vec3  aFrom;
attribute vec3  aTo;
attribute float aSeed;
attribute float aScale;
attribute vec3  aColor;
attribute vec2  aRandom;     // x: jitter speed, y: jitter reach

uniform float uMorph;
uniform float uSpread;
uniform float uTime;
uniform float uUnit;         // reference world units -> local units
uniform float uSize;         // pyramid scale multiplier
uniform vec2  uPointer;      // cursor, in NDC
uniform vec2  uNdcToLocal;   // NDC -> local units on the cloud's plane
uniform float uPointerOn;
uniform vec2  uDelta;        // eased cursor velocity
uniform float uBreath;

varying vec3  vColor;
varying float vAlpha;

// Ashima Arts / stegu simplex noise (MIT), as used by the reference.
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

mat3 rotationMatrix(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat3(
    oc * axis.x * axis.x + c,          oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c,          oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
  );
}

vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123) * 2.0 - 1.0;
}

void main() {
  // Per-particle stagger so the cloud flows between forms.
  float stagger = 0.42;
  float local = clamp((uMorph - aSeed * stagger) / (1.0 - stagger), 0.0, 1.0);
  float eased = local * local * (3.0 - 2.0 * local);

  vec3 pos = mix(aFrom, aTo, eased);

  float arc = sin(eased * 3.14159265);
  vec3 drift = hash3(aFrom * 1.7 + aSeed * 13.0);
  pos += drift * arc * 0.9;
  // At rest the form holds still (as on the reference); it only breathes
  // while the script has it coming apart.
  pos += hash3(aFrom * 3.1 + 7.0) * sin(uTime * 0.55 + aSeed * 6.2831) * 0.06 * max(0.0, uBreath - 1.0);

  pos += drift * uSpread * 2.4;
  pos *= 1.0 + uSpread * 0.55;

  // Hover: within ~1.25 units of the cursor each pyramid orbits on its own
  // slow sin/cos path, pushed further by fast cursor movement, and swells.
  // Distance is measured on screen, so the near shell reacts under the
  // cursor rather than offset by perspective.
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  vec2 offset = (clip.xy / clip.w - uPointer) * uNdcToLocal;
  float calm = 1.0 - clamp(uSpread, 0.0, 1.0);
  float reach = 1.25 + abs(max(uDelta.x, uDelta.y));
  float hover = smoothstep(reach, 0.0, length(offset) / uUnit) * uPointerOn * calm;
  pos.x += hover * sin(uTime * aRandom.x) * (aRandom.y * 0.35 + uDelta.x) * uUnit;
  pos.y += hover * cos(uTime * aRandom.x) * (aRandom.y * 0.35 + uDelta.y) * uUnit;

  // Tumble: noise over the form gives neighbours related orientations.
  float n = snoise(pos / uUnit * 0.619);
  mat3 rot = rotationMatrix(vec3(0.0, 1.0, 1.0), mod(n + uTime, 6.2832));

  float scale = (aScale * uSize + hover * 0.75) * 0.1 * uUnit;
  vec3 vertex = pos + rot * (position * scale);

  vec4 mv = modelViewMatrix * vec4(vertex, 1.0);
  gl_Position = projectionMatrix * mv;

  // Hovered pyramids wash toward grey. The 1.3 lift is clamped the way the
  // reference's 8-bit buffer clamps it, so the bloom sees the same input.
  vColor = min(mix(aColor, vec3(0.45), hover) * 1.3, 1.0);

  // The back of the form fades out, so the near shell reads over the far one.
  vAlpha = smoothstep(-4.5, 4.0, pos.z / uUnit) * (1.0 - uSpread * 0.22);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

varying vec3  vColor;
varying float vAlpha;

uniform float uOpacity;

void main() {
  gl_FragColor = vec4(vColor, vAlpha * uOpacity);
}
`;
