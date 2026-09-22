import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";
import { buildShape, buildScatter, type BrainData } from "./shapes";
import { fragmentShader, vertexShader } from "./shaders";
import { PYRAMID_INDICES, PYRAMID_POSITIONS } from "./pyramid";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The reference lays the brain out at 4.35 world units per normalised unit
 * (2.5 on phones, with smaller pyramids) and frames it with a 50° camera ten
 * units back. UNIT maps its world units onto ours (42° camera, 7.4 back) so
 * the brain covers the same share of the viewport at scale 1.
 */
const REF_RADIUS = { wide: 4.35, compact: 2.5 };
const REF_SIZE = { wide: 1.55, compact: 1.2 };
const UNIT =
  (7.4 * Math.tan(THREE.MathUtils.degToRad(21))) /
  (10 * Math.tan(THREE.MathUtils.degToRad(25)));

/** Per-frame easing factor at 60fps, corrected for the real frame time. */
function ease(factor: number, dt: number) {
  return 1 - Math.pow(1 - factor, dt * 60);
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
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private group = new THREE.Group();
  private mesh!: THREE.Mesh;
  private geometry = new THREE.InstancedBufferGeometry();
  private material!: THREE.ShaderMaterial;
  private clouds: Float32Array[] = [];
  private aFrom!: THREE.InstancedBufferAttribute;
  private aTo!: THREE.InstancedBufferAttribute;
  private loadedPair: [number, number] = [-1, -1];

  private count: number;
  private pointer = new THREE.Vector2(0, 0);
  private prevPointer = new THREE.Vector2(0, 0);
  private smoothPointer = new THREE.Vector2(0, 0);
  private delta = new THREE.Vector2(0, 0);
  private pointerActive = 0;
  private hasPointer = false;
  private raf = 0;
  private clock = new THREE.Clock();
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, brain: BrainData) {
    const coarse =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    // Same budget as the reference: the full brain, or 7k on touch devices.
    this.count = coarse ? 7000 : brain.scales.length;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
    this.renderer.setClearColor(0x000000, 1);
    // The baked colours are authored for direct output, so skip sRGB encoding.
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.z = 7.4;
    this.scene.add(this.group);

    const compact = window.matchMedia("(max-width: 860px)").matches;
    this.buildGeometry(brain, compact ? "compact" : "wide");

    // Post chain from the reference: soft bloom, then a vignette.
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.1, 1, 0.159);
    this.composer.addPass(this.bloom);
    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 0.3;
    vignette.uniforms.darkness.value = 4;
    this.composer.addPass(vignette);
    this.composer.addPass(new OutputPass());

    this.resize();
  }

  private buildGeometry(brain: BrainData, layout: "wide" | "compact") {
    const n = this.count;
    const rand = mulberry32(20260919);

    const brainCloud = new Float32Array(n * 3);
    const k = REF_RADIUS[layout] * UNIT;
    for (let i = 0; i < n * 3; i++) brainCloud[i] = brain.positions[i] * k;

    this.clouds = [
      brainCloud,
      buildScatter(n, 23),
      buildShape("bulb", n, 37).positions,
      buildScatter(n, 41, 3.0),
      buildShape("globe", n, 59).positions,
    ];

    const seeds = new Float32Array(n);
    const randoms = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      seeds[i] = rand();
      randoms[i * 2] = 0.8 * rand() + 0.2;
      randoms[i * 2 + 1] = 0.5 * rand() + 0.5;
    }

    this.geometry.setAttribute("position", new THREE.BufferAttribute(PYRAMID_POSITIONS, 3));
    this.geometry.setIndex(new THREE.BufferAttribute(PYRAMID_INDICES, 1));
    this.geometry.instanceCount = n;

    this.aFrom = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    this.aTo = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
    this.aFrom.setUsage(THREE.DynamicDrawUsage);
    this.aTo.setUsage(THREE.DynamicDrawUsage);

    this.geometry.setAttribute("aFrom", this.aFrom);
    this.geometry.setAttribute("aTo", this.aTo);
    this.geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    this.geometry.setAttribute(
      "aScale",
      new THREE.InstancedBufferAttribute(brain.scales.slice(0, n), 1),
    );
    this.geometry.setAttribute(
      "aColor",
      new THREE.InstancedBufferAttribute(brain.colors.slice(0, n * 3), 3),
    );
    this.geometry.setAttribute("aRandom", new THREE.InstancedBufferAttribute(randoms, 2));
    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uMorph: { value: 0 },
        uSpread: { value: 0 },
        uTime: { value: 0 },
        uUnit: { value: UNIT },
        uSize: { value: REF_SIZE[layout] },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uNdcToLocal: { value: new THREE.Vector2(1, 1) },
        uPointerOn: { value: 0 },
        uDelta: { value: new THREE.Vector2(0, 0) },
        uBreath: { value: 1 },
        uOpacity: { value: 1 },
      },
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);

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
    if (!active) {
      this.pointerActive = 0;
      this.delta.set(0, 0);
      return;
    }
    if (!this.hasPointer) {
      this.prevPointer.set(nx, ny);
      this.smoothPointer.set(nx, ny);
      this.hasPointer = true;
    }
    // Cursor speed, as the reference measures it: a hard flick pushes the
    // hovered pyramids further and widens the area they react in.
    this.delta.set(
      THREE.MathUtils.clamp(50 * (nx - this.prevPointer.x), -2, 2),
      THREE.MathUtils.clamp(50 * (ny - this.prevPointer.y), -2, 2),
    );
    this.prevPointer.set(nx, ny);
    this.pointer.set(nx, ny);
    this.pointerActive = 1;
  }

  resize = () => {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    // Keep the form a constant fraction of the viewport on narrow screens.
    this.camera.position.z = w / h < 0.9 ? 10.5 : 7.4;
    this.camera.updateProjectionMatrix();
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

    // Cursor and its velocity trail behind the real pointer, as on the
    // reference, so the hover field glides rather than snaps.
    const follow = ease(0.075, dt);
    this.smoothPointer.lerp(this.pointer, follow);
    this.delta.multiplyScalar(1 - ease(0.1, dt));
    (u.uDelta.value as THREE.Vector2).lerp(this.delta, follow);
    u.uPointerOn.value += (this.pointerActive - u.uPointerOn.value) * follow;

    // The camera leans a few degrees toward the cursor; the form itself
    // stays put.
    const lean = ease(0.1, dt);
    this.camera.rotation.y += (-0.075 * this.smoothPointer.x - this.camera.rotation.y) * lean;
    this.camera.rotation.x += (0.05 * this.smoothPointer.y - this.camera.rotation.x) * lean;

    this.group.position.x += (t.x - this.group.position.x) * Math.min(1, dt * 5);
    this.group.position.y += (t.y - this.group.position.y) * Math.min(1, dt * 5);
    const sc = this.group.scale.x + (t.scale - this.group.scale.x) * Math.min(1, dt * 5);
    this.group.scale.setScalar(sc);

    // The hover test runs in screen space; this converts an NDC offset into
    // local units on the cloud's plane, whatever the group's scale.
    (u.uPointer.value as THREE.Vector2).copy(this.smoothPointer);
    const halfH =
      Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) *
      (this.camera.position.z - this.group.position.z);
    (u.uNdcToLocal.value as THREE.Vector2).set(halfH * this.camera.aspect / sc, halfH / sc);

    this.composer.render(dt);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.geometry.dispose();
    this.material.dispose();
    this.bloom.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
