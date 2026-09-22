"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ParticleSystem } from "@/lib/particles/system";
import { loadShapes } from "@/lib/particles/shapes";
import {
  matches,
  sectionTracker,
  setupCookieNotice,
  setupHeader,
  setupLoader,
  setupNav,
  setupScrollAnimations,
  setupSlider,
  splitTextRotateIn,
} from "./behaviours";

/**
 * Boots the page the way the reference does: loader until the particle data
 * and fonts are in, then reveal — smooth scroll, scroll reveals and the
 * particle scene's fly-in all start together. Renders the WebGL canvas.
 */
export function Controller() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const html = document.documentElement;
    const teardown: (() => void)[] = [];
    const loading = new AbortController();
    let disposed = false;

    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const setVh = () => html.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    setVh();
    window.addEventListener("resize", setVh);
    teardown.push(() => window.removeEventListener("resize", setVh));

    // Scrolling stays locked until the loader has gone.
    html.style.overflow = "hidden";
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const lenis = touch ? null : new Lenis({ lerp: 0.075, smoothWheel: true });
    lenis?.stop();
    if (lenis) {
      const raf = (t: number) => lenis.raf(t * 1000);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      teardown.push(() => {
        gsap.ticker.remove(raf);
        lenis.destroy();
      });
    }

    const sections = sectionTracker();
    teardown.push(setupHeader(), setupNav(lenis, sections.name), setupSlider(), setupCookieNotice());

    let system: ParticleSystem | null = null;
    const shapes = loadShapes(loading.signal).then((data) => {
      if (disposed) return;
      try {
        system = new ParticleSystem(canvas, data);
      } catch {
        // No WebGL: the DOM content stands on its own.
        canvas.style.display = "none";
        return;
      }
      const s = system;
      s.start();
      teardown.push(() => s.dispose());

      // The investor pyramids live in WebGL from tablet up.
      if (matches("sm")) {
        document.querySelectorAll<HTMLElement>("[data-pyramid]").forEach((el) => {
          const text = el.nextElementSibling as HTMLElement | null;
          const names = text ? Array.from(text.querySelectorAll<HTMLElement>(":scope > div")) : [];
          const reveal = names.length ? splitTextRotateIn(names, { duration: 1, paused: true }) : null;
          s.domPyramids.add(
            el,
            el.dataset.pyramid ?? "#ffffff",
            Number(el.dataset.startX ?? 0),
            Number(el.dataset.parallaxSpeed ?? 0),
            () => reveal?.tween.play(),
          );
        });
      }

      const onTick = () => void (s.sectionProgress = sections.progress());
      gsap.ticker.add(onTick);
      teardown.push(() => gsap.ticker.remove(onTick));

      const onMove = (e: PointerEvent) =>
        s.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1), true);
      const onLeave = () => s.setPointer(0, 0, false);
      window.addEventListener("pointermove", onMove, { passive: true });
      html.addEventListener("pointerleave", onLeave);
      const onResize = () => s.resize();
      window.addEventListener("resize", onResize);
      teardown.push(() => {
        window.removeEventListener("pointermove", onMove);
        html.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("resize", onResize);
      });
    });

    const assets = Promise.all([shapes.catch(() => {}), document.fonts?.ready]);
    setupLoader(assets).then(() => {
      if (disposed) return;
      html.style.overflow = "";
      lenis?.start();
      teardown.push(setupScrollAnimations());
      ScrollTrigger.refresh();
      system?.enter();
    });

    return () => {
      disposed = true;
      loading.abort();
      html.style.overflow = "";
      teardown.reverse().forEach((t) => t());
    };
  }, []);

  return (
    <div className="fixed fill w-1/1 h-1/1 z-negative user-select-none pointer-events-none">
      <canvas ref={canvasRef} id="canvas" />
    </div>
  );
}
