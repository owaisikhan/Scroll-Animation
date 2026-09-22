/**
 * Shaders ported from the reference's particle scene.
 *
 * cones — the main cloud: each instance is a small tetrahedron-frame mesh
 *   centred on its simulated position, tumbling on simplex noise plus time,
 *   with per-form scale and colour blended by the scroll progress.
 * frontCones — 250 large pyramids drifting in front of everything.
 * grain — the reference's film-grain layer, which also opens the scene with
 *   a circular reveal once the loader leaves.
 */

const rotation = /* glsl */ `
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
`;

// Ashima Arts / stegu simplex noise (MIT), as used by the reference.
const simplex = /* glsl */ `
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
`;

export const conesVertex = /* glsl */ `
precision highp float;

attribute vec3 aPos;       // simulated centre
attribute vec4 aScales;    // per-form scale
attribute vec3 aColor0;    // per-form colour
attribute vec3 aColor1;
attribute vec3 aColor2;
attribute vec3 aColor3;
attribute vec2 aRandom;    // x: jitter speed, y: jitter reach

uniform float uTime;
uniform float uProgress;
uniform float uExplode;
uniform float uScale;
uniform vec3  uRotation;
uniform vec2  uOffset;
uniform vec2  uPointer;    // cursor, NDC
uniform vec2  uNdcToWorld; // NDC -> world units on the z = 0 plane
uniform float uPointerOn;
uniform vec2  uDelta;      // eased cursor velocity

varying vec3  vColor;
varying float vAlpha;

${rotation}
${simplex}

vec4 toView(mat3 r, vec3 p) {
  vec4 mv = modelViewMatrix * vec4(r * p, 1.0);
  mv.xy += uOffset;
  return mv;
}

void main() {
  mat3 r = rotationMatrix(vec3(1.0, 0.0, 0.0), uRotation.x)
         * rotationMatrix(vec3(0.0, 1.0, 0.0), uRotation.y)
         * rotationMatrix(vec3(0.0, 0.0, 1.0), uRotation.z);

  vec3 pos = aPos;
  float calm = abs(uExplode - 1.0);

  // Hover: near the cursor each pyramid orbits on its own slow sin/cos
  // path (pushed further by a fast cursor) and swells. Measured on screen
  // so the reaction sits under the cursor whatever the depth.
  vec4 clip = projectionMatrix * toView(r, pos);
  vec2 offset = (clip.xy / clip.w - uPointer) * uNdcToWorld;
  float reach = 1.25 + abs(max(uDelta.x, uDelta.y));
  float hover = smoothstep(reach, 0.0, length(offset)) * uPointerOn;
  pos.x += hover * sin(uTime * aRandom.x) * (aRandom.y * 0.35 + uDelta.x) * calm;
  pos.y += hover * cos(uTime * aRandom.x) * (aRandom.y * 0.35 + uDelta.y) * calm;

  float n = snoise(pos * 0.619);
  mat3 tumble = rotationMatrix(vec3(0.0, 1.0, 1.0), mod(n + uTime, 6.2832));

  float scale = mix(aScales.x, aScales.y, clamp(uProgress, 0.0, 1.0));
  scale = mix(scale, aScales.z, clamp(uProgress - 1.0, 0.0, 1.0));
  scale = mix(scale, aScales.w, clamp(uProgress - 2.0, 0.0, 1.0));
  scale = (scale * uScale + hover * 0.75 * calm) * 0.1;

  vec4 mv = toView(r, pos + tumble * (position * scale));
  gl_Position = projectionMatrix * mv;

  vec3 col = mix(aColor0, aColor1, clamp(uProgress, 0.0, 1.0));
  col = mix(col, aColor2, clamp(uProgress - 1.0, 0.0, 1.0));
  col = mix(col, aColor3, clamp(uProgress - 2.0, 0.0, 1.0));
  col = mix(col, vec3(0.45), max(0.0, hover - uExplode) * calm);
  // The 1.3 lift, clamped the way the reference's 8-bit buffer clamps it.
  vColor = min(col * 1.3, 1.0);

  // Camera sits ten units back: fade the far side of the form.
  vAlpha = smoothstep(-4.5, 4.0, mv.z + 10.0);
}
`;

export const conesFragment = /* glsl */ `
precision highp float;

varying vec3  vColor;
varying float vAlpha;

void main() {
  gl_FragColor = vec4(vColor, vAlpha);
}
`;

export const frontConesVertex = /* glsl */ `
precision highp float;

attribute vec3 aBase;   // x, y in -1..1; z depth 0..9
attribute vec4 aColor;
attribute vec4 aAngle;
attribute vec4 aParam;

uniform float uTime;
uniform float uScale;
uniform vec2  uResolution; // view size at the far end of the field
uniform vec2  uMouse;

varying vec4 vColor;

${rotation}

void main() {
  mat3 rot = rotationMatrix(aAngle.xyz, mod(aAngle.w * uTime * 0.15, 6.2832));
  // Nearer pyramids spread less, so they stay framed as they grow.
  float zFactor = mix(0.5, 0.2, aBase.z / 9.0);
  vec3 centre = vec3(
    aBase.x * uResolution.x * zFactor - uMouse.x * aParam.x + sin(uTime * aParam.w * 0.5) * aParam.y * 0.15,
    aBase.y * uResolution.y * zFactor - uMouse.y * aParam.x + cos(uTime * aParam.w * 0.5) * aParam.z * 0.15,
    aBase.z
  );
  vec3 vertex = centre + rot * (position * uScale);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(vertex, 1.0);
  vColor = aColor;
}
`;

export const frontConesFragment = /* glsl */ `
precision highp float;

varying vec4 vColor;

void main() {
  gl_FragColor = vColor;
}
`;

/** Full-screen grain + reveal, applied before bloom like the reference layer. */
export const GrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uShow: { value: 0 },
    uAspect: { value: 1 },
    uScale: { value: 1.366 },
    uBright: { value: 0.252 },
    uAlpha: { value: 0.149 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uShow;
    uniform float uAspect;
    uniform float uScale;
    uniform float uBright;
    uniform float uAlpha;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      // The reference layer is a quad 0.4 units in front of a 50deg camera,
      // so the screen spans +-0.1865 of its UV space vertically.
      vec2 uv = 0.5 + (vUv - 0.5) * vec2(0.373 * uAspect, 0.373);

      float s = sin(0.5), c = cos(0.5);
      vec2 tex = uv * vec2(4096.0) * uScale - vec2(random(uv + uTime));
      vec2 point = vec2(c * tex.x - s * tex.y, s * tex.x + c * tex.y);
      float pat = sin(point.x) * sin(point.y) * 4.0;
      vec3 grain = clamp(vec3(pat) * uBright, 0.0, 1.0);

      vec4 scene = texture2D(tDiffuse, vUv);
      vec3 col = mix(scene.rgb, grain, uAlpha);

      // Opens from the centre as uShow runs 0 -> 1.
      float dist = distance(vec2(0.5), uv) * 2.0;
      col = mix(col, vec3(0.0), smoothstep(uShow - 0.1, uShow + 0.1, dist));
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
