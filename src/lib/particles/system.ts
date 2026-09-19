import * as THREE from "three";
import { buildShape, buildScatter } from "./shapes";
import { fragmentShader, vertexShader } from "./shaders";

/** Weighted palette — mostly white, with the accent hues sprinkled through. */
const PALETTE: [string, number][] = [
  ["#ffffff", 58],
  ["#d8d8de", 14],
  ["#f6b93b", 9],
  ["#ffd98a", 4],
  ["#8b5cf6", 6],
  ["#c4b5fd", 3],
  ["#2dd4bf", 3],
  ["#f472b6", 3],
];

function pickColor(r: number): THREE.Color {
  const total = PALETTE.reduce((s, [, w]) => s + w, 0);
  let t = r * total;
  for (const [hex, w] of PALETTE) {
    t -= w;
    if (t <= 0) return new THREE.Color(hex);
  }
  return new THREE.Color("#ffffff");
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The states the cloud moves through, in scroll order. */
export const STAGES = ["brain", "scatter1", "bulb", "scatter2", "globe"] as const;
export type Stage = (typeof STAGES)[number];

export interface ParticleTargets {
  /** 0..(STAGES.length-1) — fractional values morph between neighbours. */
  stage: number;
  spread: number;
  opacity: number;
  scale: number;
  /** Local-space offset, in world units. */
  x: number;
  y: number;
  breath: number;
}

export class ParticleSystem {
  readonly targets: ParticleTargets = {
    stage: 0,
    spread: 0,
    opacity: 1,
    scale: 1,
    x: 0,
    y: 0,
    breath: 1,
  };

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private group = new THREE.Group();
  private points!: THREE.Points;
  private geometry = new THREE.BufferGeometry();
  private material!: THREE.ShaderMaterial;
  private clouds: Float32Array[] = [];
  private aFrom!: THREE.BufferAttribute;
  private aTo!: THREE.BufferAttribute;
  private loadedPair: [number, number] = [-1, -1];

  private count: number;
  private pointer = new THREE.Vector2(0, 0);
  private smoothPointer = new THREE.Vector2(0, 0);
  private pointerActive = 0;
  private raf = 0;
  private clock = new THREE.Clock();
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, count?: number) {
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    this.count = count ?? (coarse ? 16000 : 52000);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.z = 7.4;
    this.scene.add(this.group);

    this.buildGeometry();
    this.resize();
  }

  private buildGeometry() {
    const n = this.count;
    const rand = mulberry32(20260919);

    this.clouds = [
      buildShape("brain", n, 11).positions,
      buildScatter(n, 23),
      buildShape("bulb", n, 37).positions,
      buildScatter(n, 41, 3.0),
      buildShape("globe", n, 59).positions,
    ];

    const seeds = new Float32Array(n);
    const scales = new Float32Array(n);
    const colors = new Float32Array(n * 3);
    const spins = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      seeds[i] = rand();
      // Long tail on size: many specks, a few large outlined triangles.
      scales[i] = 0.26 + Math.pow(rand(), 3.8) * 2.6;
      spins[i] = rand() * Math.PI * 2;
      const c = pickColor(rand());
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    this.aFrom = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    this.aTo = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    this.aFrom.setUsage(THREE.DynamicDrawUsage);
    this.aTo.setUsage(THREE.DynamicDrawUsage);

    this.geometry.setAttribute("position", this.aFrom);
    this.geometry.setAttribute("aFrom", this.aFrom);
    this.geometry.setAttribute("aTo", this.aTo);
    this.geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    this.geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    this.geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute("aSpin", new THREE.BufferAttribute(spins, 1));
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uMorph: { value: 0 },
        uSpread: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: 1.1 },
        uPixelRatio: { value: 1 },
        uPointer: { value: new THREE.Vector3(999, 999, 0) },
        uPointerOn: { value: 0 },
        uBreath: { value: 1 },
        uOpacity: { value: 1 },
      },
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group.add(this.points);

    this.setPair(0, 1);
  }

  /** Swap which two clouds the shader is interpolating between. */
  private setPair(from: number, to: number) {
    if (this.loadedPair[0] === from && this.loadedPair[1] === to) return;
    (this.aFrom.array as Float32Array).set(this.clouds[from]);
    (this.aTo.array as Float32Array).set(this.clouds[to]);
    this.aFrom.needsUpdate = true;
    this.aTo.needsUpdate = true;
    this.loadedPair = [from, to];
  }

  setPointer(nx: number, ny: number, active: boolean) {
    this.pointer.set(nx, ny);
    this.pointerActive = active ? 1 : 0;
  }

  resize = () => {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Keep the form a constant fraction of the viewport on narrow screens.
    this.camera.position.z = w / h < 0.9 ? 10.5 : 7.4;
    this.camera.updateProjectionMatrix();
    this.material.uniforms.uPixelRatio.value = dpr;
    this.material.uniforms.uSize.value = Math.min(w, 1600) / 1400 + 0.42;
  };

  start() {
    const tick = () => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(tick);
      this.update();
    };
    this.raf = requestAnimationFrame(tick);
  }

  private update() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const u = this.material.uniforms;
    const t = this.targets;

    u.uTime.value += dt;

    // Resolve the fractional stage into a shader-friendly (from, to, morph).
    const maxStage = this.clouds.length - 1;
    const s = Math.max(0, Math.min(maxStage - 0.0001, t.stage));
    const from = Math.floor(s);
    this.setPair(from, Math.min(from + 1, maxStage));
    u.uMorph.value = s - from;

    u.uSpread.value += (t.spread - u.uSpread.value) * Math.min(1, dt * 6);
    u.uOpacity.value += (t.opacity - u.uOpacity.value) * Math.min(1, dt * 6);
    u.uBreath.value = t.breath;

    // Pointer follows with a spring-ish lag so hovering feels weighted.
    const k = Math.min(1, dt * 4.5);
    this.smoothPointer.x += (this.pointer.x - this.smoothPointer.x) * k;
    this.smoothPointer.y += (this.pointer.y - this.smoothPointer.y) * k;
    u.uPointerOn.value += (this.pointerActive - u.uPointerOn.value) * Math.min(1, dt * 4);

    // The cloud turns to follow the cursor left/right, and tips slightly.
    const targetRotY = this.smoothPointer.x * 0.5;
    const targetRotX = -this.smoothPointer.y * 0.28;
    this.group.rotation.y += (targetRotY - this.group.rotation.y) * Math.min(1, dt * 3);
    this.group.rotation.x += (targetRotX - this.group.rotation.x) * Math.min(1, dt * 3);

    this.group.position.x += (t.x - this.group.position.x) * Math.min(1, dt * 5);
    this.group.position.y += (t.y - this.group.position.y) * Math.min(1, dt * 5);
    const sc = this.group.scale.x + (t.scale - this.group.scale.x) * Math.min(1, dt * 5);
    this.group.scale.setScalar(sc);

    // Project the cursor onto the cloud's own plane so the lens lands where
    // the user actually sees it, whatever the group is doing.
    const ray = new THREE.Vector3(this.smoothPointer.x, this.smoothPointer.y, 0.5)
      .unproject(this.camera)
      .sub(this.camera.position)
      .normalize();
    const dist = (this.group.position.z - this.camera.position.z) / ray.z;
    const world = this.camera.position.clone().add(ray.multiplyScalar(dist));
    u.uPointer.value.copy(this.group.worldToLocal(world));

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
