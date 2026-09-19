"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ParticleSystem, type ParticleTargets } from "@/lib/particles/system";

/**
 * Where the cloud should be by the time each section is centred. The timeline
 * tweens between consecutive entries, with each segment's duration weighted by
 * that section's real scroll height so the motion tracks the page exactly.
 */
type Keyframe = Partial<ParticleTargets>;

const SCRIPT: { id: string; state: Keyframe }[] = [
  // Hero: brain sits to the right of the headline, idling.
  { id: "hero", state: { stage: 0, x: 1.45, y: 0.05, scale: 1, spread: 0, opacity: 1, breath: 1 } },
  // Drifts left and grows as you push into the second screen.
  { id: "intro", state: { stage: 0, x: -1.55, y: 0, scale: 1.7, spread: 0.06 } },
  // Comes apart across the three statements.
  { id: "m1", state: { stage: 0.5, x: -0.4, scale: 2.1, spread: 0.55 } },
  { id: "m2", state: { stage: 1, x: 0, scale: 2.3, spread: 0.95, breath: 1.6 } },
  { id: "m3", state: { stage: 1.45, x: 0.3, scale: 2.0, spread: 0.6 } },
  // Reassembles as the bulb, held left of the copy.
  { id: "bulb", state: { stage: 2, x: -1.5, y: 0, scale: 1.35, spread: 0, breath: 1 } },
  // Comes apart again on its own screen...
  { id: "transition", state: { stage: 3, x: 0, scale: 1.9, spread: 0.85, breath: 1.5 } },
  // ...then settles into the globe on the right, and holds there.
  { id: "globe", state: { stage: 4, x: 1.4, scale: 1.25, spread: 0, breath: 1 } },
  // Recedes well back so the closing copy stays readable.
  { id: "team", state: { stage: 4, x: 0.7, y: 0.1, scale: 0.7, spread: 0.3, opacity: 0.16 } },
  { id: "footer", state: { stage: 4, x: 0, scale: 0.55, spread: 0.35, opacity: 0.08 } },
];

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let system: ParticleSystem;
    try {
      system = new ParticleSystem(canvas);
    } catch {
      // No WebGL — the DOM content stands on its own.
      canvas.style.display = "none";
      return;
    }
    system.start();

    gsap.registerPlugin(ScrollTrigger);

    // Smooth scrolling, driven from GSAP's ticker so scrub stays in lockstep.
    const lenis = reduced
      ? null
      : new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.4 });

    const onRaf = (time: number) => lenis?.raf(time * 1000);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(onRaf);
      gsap.ticker.lagSmoothing(0);
    }

    // On narrow screens there is no room beside the copy, so the cloud is
    // centred behind it and dimmed instead of sitting in a side column.
    const isNarrow = window.matchMedia("(max-width: 860px)").matches;
    const adapt = (state: Keyframe): Keyframe => {
      if (!isNarrow) return state;
      const out: Keyframe = { ...state };
      if (out.x !== undefined) out.x *= 0.1;
      if (out.scale !== undefined) out.scale *= 0.85;
      out.opacity = (state.opacity ?? 1) * 0.5;
      return out;
    };

    const ctx = gsap.context(() => {
      const steps = SCRIPT.map((s) => ({
        ...s,
        el: document.getElementById(s.id),
      })).filter((s) => s.el);

      if (steps.length < 2) return;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      // Seed the opening state without animating into it.
      Object.assign(system.targets, adapt(steps[0].state));

      for (let i = 1; i < steps.length; i++) {
        const prev = steps[i - 1].el!;
        const curr = steps[i].el!;
        // Weight each leg by the distance actually scrolled between sections.
        const span = Math.max(1, curr.offsetTop - prev.offsetTop);
        tl.to(system.targets, { ...adapt(steps[i].state), duration: span / 1000 });
      }
    });

    // Pointer drives rotation and the local lens.
    const onPointerMove = (e: PointerEvent) => {
      system.setPointer(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
        true,
      );
    };
    const onPointerLeave = () => system.setPointer(0, 0, false);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);

    const onResize = () => {
      system.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    // Sections are measured on mount; re-measure once fonts have settled.
    document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      if (lenis) {
        gsap.ticker.remove(onRaf);
        lenis.destroy();
      }
      ctx.revert();
      system.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="particle-canvas"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
