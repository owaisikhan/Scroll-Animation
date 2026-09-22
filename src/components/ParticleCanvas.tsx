"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ParticleSystem, type ParticleTargets } from "@/lib/particles/system";
import { loadBrain, type BrainData } from "@/lib/particles/shapes";

/**
 * Where the cloud should be by the time each section is centred. The timeline
 * tweens between consecutive entries, with each segment's duration weighted by
 * that section's real scroll height so the motion tracks the page exactly.
 */
type Keyframe = Partial<ParticleTargets>;

const SCRIPT: { id: string; state: Keyframe }[] = [
  // Hero: brain to the right of the headline, idling.
  { id: "hero", state: { stage: 0, x: 1.9, y: -0.65, scale: 1, spread: 0, opacity: 1, breath: 1 } },
  // Drifts left and grows into the second screen.
  { id: "intro", state: { stage: 0, x: -1.4, y: 0, scale: 0.95, spread: 0.05 } },
  // Still a brain, now scaled up until it fills the screen behind the copy.
  { id: "m1", state: { stage: 0, x: 0, scale: 1.35, spread: 0.12 } },
  // Only now does it start to come apart.
  { id: "m2", state: { stage: 0.75, x: 0, scale: 1.45, spread: 0.6, breath: 1.5 } },
  { id: "m3", state: { stage: 1.3, x: 0.2, scale: 2.4, spread: 0.8 } },
  // Reassembles as the bulb, held left of the copy.
  { id: "bulb", state: { stage: 2, x: -1.5, y: 0, scale: 1.4, spread: 0, breath: 1 } },
  // Held assembled for a screen before it is allowed to break up.
  { id: "bulbHold", state: { stage: 2, x: -1.5, scale: 1.4, spread: 0, breath: 1 } },
  // Comes apart again on its own screen...
  { id: "transition", state: { stage: 3, x: 0, scale: 1.9, spread: 0.85, breath: 1.5 } },
  // ...then settles into the globe on the right...
  { id: "globe", state: { stage: 4, x: 1.4, scale: 1.3, spread: 0, breath: 1 } },
  // ...and is likewise held before receding.
  { id: "globeHold", state: { stage: 4, x: 1.4, scale: 1.3, spread: 0, breath: 1 } },
  // Recedes so the closing copy stays readable.
  { id: "team", state: { stage: 4, x: 0.7, y: 0.1, scale: 0.7, spread: 0.3, opacity: 0.16 } },
  { id: "footer", state: { stage: 4, x: 0, scale: 0.55, spread: 0.35, opacity: 0.08 } },
];

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const loading = new AbortController();
    let teardown: (() => void) | undefined;

    loadBrain(loading.signal)
      .then((brain) => {
        if (loading.signal.aborted) return;
        teardown = mount(canvas, brain);
      })
      .catch(() => {
        // No data (or aborted) — the DOM content stands on its own.
        if (!loading.signal.aborted) canvas.style.display = "none";
      });

    return () => {
      loading.abort();
      teardown?.();
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

/** Starts the renderer and wires scroll and pointer to it; returns teardown. */
function mount(canvas: HTMLCanvasElement, brain: BrainData) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let system: ParticleSystem;
  try {
    system = new ParticleSystem(canvas, brain);
  } catch {
    // No WebGL — the DOM content stands on its own.
    canvas.style.display = "none";
    return undefined;
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

    // A single sequential timeline, so each leg starts from the previous
    // leg's end value. Per-leg ScrollTriggers would each capture their
    // start value lazily and desynchronise when you jump down the page.
    //
    // The scroll span is anchored from the first section to the last, so
    // the leg durations (weighted by real distance between sections) map
    // 1:1 onto scroll instead of being stretched to fit the scrub range.
    Object.assign(system.targets, adapt(steps[0].state));

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: steps[0].el!,
        start: "top top",
        endTrigger: steps[steps.length - 1].el!,
        end: "top top",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    for (let i = 1; i < steps.length; i++) {
      const span = Math.max(
        1,
        steps[i].el!.offsetTop - steps[i - 1].el!.offsetTop,
      );
      tl.to(system.targets, { ...adapt(steps[i].state), duration: span / 1000 });
    }
  });

  // Pointer drives the camera lean and the hover field.
  const onPointerMove = (e: PointerEvent) => {
    system.setPointer(
      (e.clientX / window.innerWidth) * 2 - 1,
      -((e.clientY / window.innerHeight) * 2 - 1),
      true,
    );
  };
  const onPointerLeave = () => system.setPointer(0, 0, false);

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);

  const onResize = () => {
    system.resize();
    ScrollTrigger.refresh();
  };
  window.addEventListener("resize", onResize);

  // Sections are measured on mount; re-measure once fonts have settled.
  document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});

  return () => {
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    window.removeEventListener("resize", onResize);
    if (lenis) {
      gsap.ticker.remove(onRaf);
      lenis.destroy();
    }
    ctx.revert();
    system.dispose();
  };
}
