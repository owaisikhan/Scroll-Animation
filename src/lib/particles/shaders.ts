export const vertexShader = /* glsl */ `
precision highp float;

attribute vec3  aFrom;
attribute vec3  aTo;
attribute float aSeed;
attribute float aScale;
attribute vec3  aColor;
attribute float aSpin;

uniform float uMorph;        // 0..1 between aFrom and aTo
uniform float uSpread;       // global dispersal amount
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3  uPointer;      // pointer in local space
uniform float uPointerOn;    // 0..1 strength gate
uniform float uBreath;       // idle drift amount

varying vec3  vColor;
varying float vSeed;
varying float vSpin;
varying float vFade;

// Cheap value-noise gradient, enough for organic drift without a texture.
vec3 hash3(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123) * 2.0 - 1.0;
}

void main() {
  // Per-particle stagger: each point starts its morph at a slightly different
  // time, so the cloud flows between forms instead of snapping as one block.
  float stagger = 0.42;
  float offset  = aSeed * stagger;
  float local   = clamp((uMorph - offset) / (1.0 - stagger), 0.0, 1.0);
  float eased   = local * local * (3.0 - 2.0 * local);

  vec3 pos = mix(aFrom, aTo, eased);

  // Mid-morph bulge — points swing wide of the straight line between forms.
  float arc = sin(eased * 3.14159265);
  vec3 drift = hash3(aFrom * 1.7 + aSeed * 13.0);
  pos += drift * arc * 0.9;

  // Idle breathing so the form is never completely static.
  vec3 wob = hash3(aFrom * 3.1 + 7.0);
  pos += wob * sin(uTime * 0.6 + aSeed * 6.2831) * 0.035 * uBreath;

  // Scroll-driven dispersal: the whole cloud loosens and inflates.
  pos += drift * uSpread * 2.4;
  pos *= 1.0 + uSpread * 0.55;

  // Pointer lens: inside a small radius points push apart and grow, while the
  // silhouette as a whole stays put.
  float lens = 0.0;
  if (uPointerOn > 0.001) {
    vec3 delta = pos - uPointer;
    float d = length(delta.xy);
    lens = exp(-d * d / 0.75) * uPointerOn;
    pos += normalize(vec3(delta.xy, 0.001)) * lens * 0.52;
  }

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  // Points thin out as they disperse, and swell under the pointer.
  float size = uSize * aScale * (1.0 + lens * 1.9) * (1.0 + uSpread * 0.35);
  gl_PointSize = size * uPixelRatio * (12.0 / max(0.001, -mv.z));

  vColor = aColor;
  vSeed  = aSeed;
  vSpin  = aSpin + uTime * (0.08 + aSeed * 0.12) + lens * 2.0;
  vFade  = 1.0 - uSpread * 0.35;
}
`;

export const fragmentShader = /* glsl */ `
precision highp float;

varying vec3  vColor;
varying float vSeed;
varying float vSpin;
varying float vFade;

uniform float uOpacity;

// Signed distance to an equilateral triangle centred on the origin.
float sdTriangle(vec2 p) {
  const float k = 1.7320508;
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0 / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0, 0.0);
  return -length(p) * sign(p.y);
}

void main() {
  vec2 p = (gl_PointCoord - 0.5) * 2.0;

  float s = sin(vSpin);
  float c = cos(vSpin);
  p = mat2(c, -s, s, c) * p;

  float d = sdTriangle(p / 0.92);
  float aa = fwidth(d) * 1.1;

  // Most points are hairline outlines; a minority are solid. That mix is what
  // gives the cloud its glitter at small sizes.
  float filled = step(0.78, vSeed);
  float stroke = 1.0 - smoothstep(0.0, aa, abs(d) - 0.16);
  float solid  = 1.0 - smoothstep(0.0, aa, d);
  float mask   = mix(stroke, solid, filled);

  if (mask < 0.01) discard;

  gl_FragColor = vec4(vColor, mask * uOpacity * vFade);
}
`;
