import * as THREE from "three";
import gsap from "gsap";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader.js";
import { PARTICLE_COUNT, type ShapeData } from "./shapes";
import { Simulation } from "./simulation";
import { frontConesX, poseDesktop, poseMobile, type Pose } from "./choreography";
import {
  GrainShader,
  conesFragment,
  conesVertex,
  frontConesFragment,
  frontConesVertex,
} from "./shaders";
import { PYRAMID_INDICES, PYRAMID_POSITIONS } from "./pyramid";
import { DomPyramids } from "./domPyramids";

/** Per-frame easing factor at 60fps, corrected for the real frame time. */
function ease(factor: number, dt: number) {
  return 1 - Math.pow(1 - factor, dt * 60);
}

/** World-space size of the view plane `distance` in front of the camera. */
function viewSize(camera: THREE.PerspectiveCamera, distance: number) {
  const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.abs(distance);
  return { width: h * camera.aspect, height: h };
}

function pyramidGeometry() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(PYRAMID_POSITIONS, 3));
  g.setIndex(new THREE.BufferAttribute(PYRAMID_INDICES, 1));
  return g;
}

const FRONT_COLORS = [
  [93, 57, 154],
  [186, 136, 43],
  [40, 116, 100],
  [164, 148, 175],
];

/**
 * The reference's particle scene: the main cloud of pyramids that morphs
 * brain → lightbulb → sphere → logo as the page scrolls, the large drifting
 * pyramids in front of it, and the grain/bloom/vignette post chain.
 */
export class ParticleSystem {
  /** Section index + progress through it; drives the whole choreography. */
  sectionProgress = 0;

  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private grain: ShaderPass;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;

  private cones = new THREE.Group();
  private conesGeometry = pyramidGeometry();
  private conesMaterial: THREE.ShaderMaterial;
  private aPos: THREE.InstancedBufferAttribute;
  private sim: Simulation;

  /** Solid pyramids that track DOM boxes (the investor icons). */
  readonly domPyramids = new DomPyramids();

  private front = new THREE.Group();
  private frontGeometry = pyramidGeometry();
  private frontMaterial: THREE.ShaderMaterial;

  private mobile: boolean;
  /** Eased simulation inputs, like the reference's uniforms. */
  private state = { show: 0, factor: 0, progress: 0, explode: 0, x: 0, y: 0 };
  private rotation = new THREE.Vector3();
  private baseRotationY = -0.25 * Math.PI;

  private pointer = new THREE.Vector2(0, 0);
  private prevPointer = new THREE.Vector2(0, 0);
  private smoothPointer = new THREE.Vector2(0, 0);
  private frontMouse = new THREE.Vector2(0, 0);
  private delta = new THREE.Vector2(0, 0);
  private pointerActive = 0;

  private raf = 0;
  private last = 0;
  private time = 0;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, data: ShapeData) {
    // The reference runs a lighter, differently choreographed cloud on phones.
    this.mobile = window.matchMedia("(max-width: 767px)").matches;
    const count = this.mobile ? 7000 : PARTICLE_COUNT;

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

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 30);
    this.camera.position.set(0, 0, 10);

    const initial = this.pose();
    this.state.factor = initial.factor;
    this.state.x = initial.x;
    this.state.y = initial.y;

    this.sim = new Simulation(data, count);
    this.aPos = new THREE.InstancedBufferAttribute(this.sim.position, 3);
    this.aPos.setUsage(THREE.DynamicDrawUsage);
    this.conesMaterial = this.buildCones(data, count);
    this.frontMaterial = this.buildFront();

    this.cones.position.set(0, -1.19, 0);
    this.cones.rotation.y = this.baseRotationY;
    this.front.position.set(0, 0, 0.1);
    this.scene.add(this.cones, this.front);

    const dpr = window.devicePixelRatio || 1;
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.grain = new ShaderPass(GrainShader);
    this.grain.uniforms.uScale.value = dpr >= 2 ? 1.072 : 1.366;
    this.grain.uniforms.uBright.value = dpr >= 2 ? 0.185 : 0.252;
    this.grain.uniforms.uAlpha.value = dpr >= 2 ? 0.138 : 0.149;
    this.composer.addPass(this.grain);
    // Drawn over the grain, like the reference's second (DOM-synced) scene.
    const domPass = new RenderPass(this.domPyramids.scene, this.domPyramids.camera);
    domPass.clear = false;
    domPass.clearDepth = true;
    this.composer.addPass(domPass);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.1, 1, 0.159);
    this.composer.addPass(this.bloom);
    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 0.3;
    vignette.uniforms.darkness.value = 4;
    this.composer.addPass(vignette);
    this.composer.addPass(new OutputPass());

    this.resize();
  }

  private buildCones(data: ShapeData, n: number) {
    const g = this.conesGeometry;
    g.instanceCount = n;

    const scales = new Float32Array(n * 4);
    const randoms = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < 4; k++) scales[i * 4 + k] = data.scales[k][i];
      randoms[i * 2] = 0.8 * Math.random() + 0.2;
      randoms[i * 2 + 1] = this.mobile ? 0.5 * Math.random() : 0.5 * Math.random() + 0.5;
    }
    g.setAttribute("aPos", this.aPos);
    g.setAttribute("aScales", new THREE.InstancedBufferAttribute(scales, 4));
    for (let k = 0; k < 4; k++) {
      g.setAttribute(
        `aColor${k}`,
        new THREE.InstancedBufferAttribute(data.colors[k].slice(0, n * 3), 3),
      );
    }
    g.setAttribute("aRandom", new THREE.InstancedBufferAttribute(randoms, 2));

    const material = new THREE.ShaderMaterial({
      vertexShader: conesVertex,
      fragmentShader: conesFragment,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uExplode: { value: 0 },
        uScale: { value: this.mobile ? 1.2 : 1.55 },
        uRotation: { value: new THREE.Vector3() },
        uOffset: { value: new THREE.Vector2() },
        uPointer: { value: new THREE.Vector2() },
        uNdcToWorld: { value: new THREE.Vector2(1, 1) },
        uPointerOn: { value: 0 },
        uDelta: { value: new THREE.Vector2() },
      },
    });
    const mesh = new THREE.Mesh(g, material);
    mesh.frustumCulled = false;
    this.cones.add(mesh);
    return material;
  }

  private buildFront() {
    const n = 250;
    const g = this.frontGeometry;
    g.instanceCount = n;
    const base = new Float32Array(n * 3);
    const color = new Float32Array(n * 4);
    const angle = new Float32Array(n * 4);
    const param = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      base.set([2 * Math.random() - 1, 2 * Math.random() - 1, 9 * Math.random()], i * 3);
      const c = FRONT_COLORS[i % 4];
      color.set([c[0] / 255, c[1] / 255, c[2] / 255, Math.random()], i * 4);
      angle.set(
        [
          2 * Math.random() - 1,
          2 * Math.random() - 1,
          2 * Math.random() - 1,
          2 * Math.random() - Math.PI,
        ],
        i * 4,
      );
      param.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    g.setAttribute("aBase", new THREE.InstancedBufferAttribute(base, 3));
    g.setAttribute("aColor", new THREE.InstancedBufferAttribute(color, 4));
    g.setAttribute("aAngle", new THREE.InstancedBufferAttribute(angle, 4));
    g.setAttribute("aParam", new THREE.InstancedBufferAttribute(param, 4));

    const material = new THREE.ShaderMaterial({
      vertexShader: frontConesVertex,
      fragmentShader: frontConesFragment,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uScale: { value: this.mobile ? 0.05 : 0.075 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2() },
      },
    });
    const mesh = new THREE.Mesh(g, material);
    mesh.frustumCulled = false;
    this.front.add(mesh);
    return material;
  }

  private pose(): Pose {
    return this.mobile ? poseMobile(this.sectionProgress) : poseDesktop(this.sectionProgress);
  }

  /** The loader has left: fly the cloud in and open the reveal. */
  enter() {
    gsap.to(this.state, { show: 1, duration: 3, ease: "none" });
    gsap.to(this, { baseRotationY: 0, duration: 3, ease: "power2.out" });
    gsap.to(this.grain.uniforms.uShow, { value: 1, duration: 2, ease: "power2.inOut" });
  }

  setPointer(nx: number, ny: number, active: boolean) {
    if (!active) {
      this.pointerActive = 0;
      this.delta.set(0, 0);
      return;
    }
    // Cursor speed, as the reference measures it: a hard flick pushes the
    // hovered pyramids further and widens the area they react in.
    const lim = this.mobile ? 0.1 : 2;
    this.delta.set(
      THREE.MathUtils.clamp(50 * (nx - this.prevPointer.x), -lim, lim),
      THREE.MathUtils.clamp(50 * (ny - this.prevPointer.y), -lim, lim),
    );
    this.prevPointer.set(nx, ny);
    this.pointer.set(nx, ny);
    this.pointerActive = 1;
  }

  resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = this.mobile ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    const plane = viewSize(this.camera, 10);
    (this.conesMaterial.uniforms.uNdcToWorld.value as THREE.Vector2).set(
      plane.width / 2,
      plane.height / 2,
    );
    const far = viewSize(this.camera, 9.9);
    (this.frontMaterial.uniforms.uResolution.value as THREE.Vector2).set(far.width, far.height);
    this.grain.uniforms.uAspect.value = w / h;
    this.domPyramids.resize(w, h);
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
    const now = performance.now();
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 1 / 60;
    this.last = now;
    this.time += dt;
    const u = this.conesMaterial.uniforms;
    const s = this.state;
    const k = ease(0.1, dt);

    // Everything eases toward the pose for the current scroll position.
    const pose = this.pose();
    const x = this.mobile ? pose.x + 0.052 * u.uPointer.value.x : pose.x;
    s.x += (x - s.x) * k;
    s.y += (pose.y - s.y) * k;
    s.explode += (pose.explode - s.explode) * k;
    s.progress += (pose.progress - s.progress) * k;
    if (!this.mobile) s.factor += (pose.factor - s.factor) * k;
    const kr = ease(0.075, dt);
    this.rotation.x += (0 - this.rotation.x) * kr;
    this.rotation.y += (pose.rotY - this.rotation.y) * kr;
    this.rotation.z += (pose.rotZ - this.rotation.z) * kr;

    this.sim.update(dt, s);
    this.aPos.needsUpdate = true;

    // Pointer and its velocity trail behind the real cursor.
    this.delta.multiplyScalar(1 - k);
    this.smoothPointer.lerp(this.pointer, kr);
    (u.uDelta.value as THREE.Vector2).lerp(this.delta, kr);
    u.uPointerOn.value += (this.pointerActive - u.uPointerOn.value) * kr;

    u.uTime.value = this.time;
    u.uProgress.value = s.progress;
    u.uExplode.value = s.explode;
    (u.uRotation.value as THREE.Vector3).copy(this.rotation);
    (u.uOffset.value as THREE.Vector2).set(s.x, s.y);
    (u.uPointer.value as THREE.Vector2).copy(this.smoothPointer);
    this.cones.rotation.y = this.baseRotationY;

    // The camera leans a few degrees toward the cursor.
    const lean = ease(0.1, dt);
    this.camera.rotation.y += (-0.075 * this.pointer.x - this.camera.rotation.y) * lean;
    this.camera.rotation.x += (0.05 * this.pointer.y - this.camera.rotation.x) * lean;

    const f = this.frontMaterial.uniforms;
    f.uTime.value = this.time;
    this.frontMouse.x += (0.25 * this.pointer.x - this.frontMouse.x) * k;
    this.frontMouse.y += (0.25 * this.pointer.y - this.frontMouse.y) * k;
    (f.uMouse.value as THREE.Vector2).copy(this.frontMouse);
    if (!this.mobile) {
      this.front.position.x += (frontConesX(this.sectionProgress) - this.front.position.x) * k;
    }

    this.grain.uniforms.uTime.value = this.time;
    this.domPyramids.update(this.sectionProgress);
    this.composer.render(dt);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    gsap.killTweensOf([this.state, this, this.grain.uniforms.uShow]);
    this.conesGeometry.dispose();
    this.conesMaterial.dispose();
    this.frontGeometry.dispose();
    this.frontMaterial.dispose();
    this.domPyramids.dispose();
    this.bloom.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
