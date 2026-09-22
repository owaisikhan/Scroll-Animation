import * as THREE from "three";
import gsap from "gsap";
import { PYRAMID_INDICES, PYRAMID_POSITIONS } from "./pyramid";

/**
 * The reference's "dom2webgl" pyramids: solid, slowly tumbling pyramids that
 * stand in for the investor icons on tablet and up. Each one tracks an empty
 * DOM box, flies in on a wide spiral from far behind the screen when its box
 * first scrolls into view, and drifts with a little scroll parallax.
 *
 * Rendered in a pixel-space scene: one world unit is one CSS pixel at z = 0.
 */

const CAMERA_Z = 2000;

interface Item {
  el: HTMLElement;
  text: HTMLElement | null;
  group: THREE.Group;
  mesh: THREE.Mesh;
  speed: number;
  spin: THREE.Vector3;
  anim: { x: number; y: number; z: number; scalar: number };
  entered: boolean;
  enterComplete: boolean;
  onEnter?: () => void;
}

export class DomPyramids {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(45, 1, 1, 10000);
  private geometry = new THREE.BufferGeometry();
  private items: Item[] = [];
  private pixelScale = new THREE.Vector3();
  private w = 1;
  private h = 1;

  constructor() {
    this.geometry.setAttribute("position", new THREE.BufferAttribute(PYRAMID_POSITIONS, 3));
    this.geometry.setIndex(new THREE.BufferAttribute(PYRAMID_INDICES, 1));
    this.geometry.computeBoundingBox();
    this.geometry.boundingBox!.getSize(this.pixelScale);
    this.camera.position.z = CAMERA_Z;
  }

  /**
   * Track `el` with a pyramid. `onEnter` fires when the pyramid is most of
   * the way in, which is when the reference reveals the name beside it.
   */
  add(el: HTMLElement, color: string, startX: number, speed: number, onEnter?: () => void) {
    const mesh = new THREE.Mesh(
      this.geometry,
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color) }),
    );
    const deg = THREE.MathUtils.degToRad;
    mesh.rotation.set(
      THREE.MathUtils.randFloat(0, deg(45)),
      THREE.MathUtils.randFloat(0, deg(45)),
      THREE.MathUtils.randFloat(0, deg(45)),
    );
    const group = new THREE.Group();
    group.add(mesh);
    group.visible = false;
    this.scene.add(group);
    this.items.push({
      el,
      text: el.nextElementSibling as HTMLElement | null,
      group,
      mesh,
      speed,
      spin: new THREE.Vector3(
        THREE.MathUtils.randFloat(5e-4, 0.0015),
        THREE.MathUtils.randFloat(5e-4, 0.0015),
        THREE.MathUtils.randFloat(5e-4, 0.0015),
      ),
      anim: { x: startX, y: 3000, z: -10000, scalar: 1 },
      entered: false,
      enterComplete: false,
      onEnter,
    });
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(h / 2 / CAMERA_Z));
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(sectionProgress: number) {
    const n = THREE.MathUtils.clamp((sectionProgress - 5.2) / 1.3, 0, 1);
    for (const it of this.items) {
      const r = it.el.getBoundingClientRect();
      const shown = r.width > 0 && r.height > 0;
      it.group.visible = shown;
      if (!shown) continue;

      it.group.position.set(r.left + r.width / 2 - this.w / 2, -(r.top + r.height / 2 - this.h / 2), 0);
      it.group.scale.setScalar(
        Math.min(r.width / this.pixelScale.x, r.height / this.pixelScale.y),
      );

      if (!it.entered && r.top < this.h && r.bottom > 0) this.enter(it);

      const a = it.anim;
      const m = it.mesh;
      m.rotation.x += it.spin.x + 0.04 * a.scalar;
      m.rotation.y += it.spin.y + 0.04 * a.scalar;
      m.rotation.z += it.spin.z + 0.04 * a.scalar;

      // Offsets are in pixels; divide out the group's scale.
      const s = it.group.scale.x || 1;
      const parallax = -it.speed * 200 * n;
      if (it.enterComplete) {
        m.position.set(0, parallax / s, 0);
      } else {
        const phase = -(a.scalar - 1) * 2 * a.scalar + 1000;
        m.position.set(
          (a.x + 1200 * Math.cos(phase) * a.scalar) / s,
          (parallax + a.y + 1000 * Math.sin(phase) * a.scalar) / s,
          a.z / s,
        );
      }
      if (it.text) it.text.style.transform = `translateY(${it.speed * 200 * n}px)`;
    }
  }

  private enter(it: Item) {
    it.entered = true;
    const duration = THREE.MathUtils.randFloat(2, 2.5);
    gsap
      .timeline({ onComplete: () => void (it.enterComplete = true) })
      .to(it.anim, { x: 0, y: 0, z: 0, scalar: 0, duration, delay: 0.2, ease: "elastic.out(0.8, 1.2)" })
      .call(() => it.onEnter?.(), undefined, 0.8 * duration);
  }

  dispose() {
    gsap.killTweensOf(this.items.map((i) => i.anim));
    this.geometry.dispose();
    for (const it of this.items) (it.mesh.material as THREE.Material).dispose();
  }
}
