export const vertexShader = /* glsl */ `
precision highp float;

attribute vec3  aFrom;
attribute vec3  aTo;
attribute float aSeed;
attribute float aScale;
attribute vec3  aColor;
attribute float aSpin;

uniform float uMorph;
uniform float uSpread;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3  uPointer;
uniform float uPointerOn;
uniform float uBreath;
uniform vec3  uRimColor;
uniform float uRadius;
uniform float uFocus;      // view-space distance held in focus
uniform float uDofRange;

varying vec3  vColor;
varying float vBlur;
varying float vFade;
varying vec4  vA;          // projected tetra verts 0,1
varying vec4  vB;          // projected tetra verts 2,3

vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123) * 2.0 - 1.0;
}

mat3 rotY(float a) {
  float s = sin(a), c = cos(a);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}
mat3 rotX(float a) {
  float s = sin(a), c = cos(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
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

  vec3 wob = hash3(aFrom * 3.1 + 7.0);
  pos += wob * sin(uTime * 0.55 + aSeed * 6.2831) * 0.03 * uBreath;

  pos += drift * uSpread * 2.4;
  pos *= 1.0 + uSpread * 0.55;

  // Pointer lens: nearby tetrahedra glide outward and swell.
  float lens = 0.0;
  if (uPointerOn > 0.001) {
    vec3 d = pos - uPointer;
    float r = length(d.xy);
    lens = exp(-r * r / 0.85) * uPointerOn;
    // Enough to part the cloud and let it glide, not enough to hollow it.
    pos += normalize(vec3(d.xy, 0.001)) * lens * 0.24;
  }

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // Rim: outer shell runs warm, the interior stays near-white.
  float rim = smoothstep(0.60, 1.12, length(pos.xy) / uRadius);
  vColor = mix(aColor, uRimColor, rim * 0.5);

  // Depth of field — distance from the focal plane softens the wireframe.
  vBlur = clamp(abs(-mv.z - uFocus) / uDofRange, 0.0, 1.0);

  float size = uSize * aScale * (1.0 + lens * 2.2) * (1.0 + uSpread * 0.30);
  gl_PointSize = size * uPixelRatio * (12.0 / max(0.001, -mv.z));

  vFade = (1.0 - uSpread * 0.22) * (1.0 - vBlur * 0.22);

  // Project a unit tetrahedron under this particle's own rotation. The four
  // screen-space vertices are handed to the fragment stage, which strokes the
  // six edges between them.
  mat3 rot = rotY(aSpin + uTime * (0.10 + aSeed * 0.16)) * rotX(aSpin * 1.7 + uTime * 0.07);
  vec3 t0 = rot * vec3( 0.5773,  0.5773,  0.5773);
  vec3 t1 = rot * vec3( 0.5773, -0.5773, -0.5773);
  vec3 t2 = rot * vec3(-0.5773,  0.5773, -0.5773);
  vec3 t3 = rot * vec3(-0.5773, -0.5773,  0.5773);
  vA = vec4(t0.xy, t1.xy);
  vB = vec4(t2.xy, t3.xy);
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

varying vec3  vColor;
varying float vBlur;
varying float vFade;
varying vec4  vA;
varying vec4  vB;

uniform float uOpacity;

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(1e-5, dot(ba, ba)), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 p = (gl_PointCoord - 0.5) * 2.0;
  p.y = -p.y;

  vec2 a = vA.xy, b = vA.zw, c = vB.xy, d = vB.zw;

  // Six edges of the tetrahedron.
  float dist = segDist(p, a, b);
  dist = min(dist, segDist(p, a, c));
  dist = min(dist, segDist(p, a, d));
  dist = min(dist, segDist(p, b, c));
  dist = min(dist, segDist(p, b, d));
  dist = min(dist, segDist(p, c, d));

  // Hairline stroke, widened and softened by the depth-of-field term.
  float aa = fwidth(dist) + 0.012;
  float width = 0.020 + vBlur * 0.026;
  float soft = aa + vBlur * 0.11;

  float mask = 1.0 - smoothstep(width - soft, width + soft, dist);
  if (mask < 0.004) discard;

  gl_FragColor = vec4(vColor, mask * uOpacity * vFade);
}
`;
