"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { loader } from "@/lib/content";

/** Counts up to 100 while the WebGL cloud builds, then lifts away. */
export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const counter = { v: 0 };
    const tl = gsap.timeline();

    tl.to(counter, {
      v: 100,
      duration: 1.9,
      ease: "power2.inOut",
      onUpdate: () => setPct(Math.round(counter.v)),
    })
      .to(el.querySelectorAll("[data-fade]"), {
        opacity: 0,
        y: -18,
        duration: 0.5,
        stagger: 0.06,
        ease: "power2.in",
      })
      .to(el, {
        yPercent: -100,
        duration: 0.9,
        ease: "power3.inOut",
        onComplete: () => {
          el.style.display = "none";
          document.documentElement.dataset.loaded = "true";
        },
      });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-ink px-6 text-center"
    >
      <p data-fade className="display measure text-2xl text-balance sm:text-3xl">
        {loader.line}
      </p>
      <div data-fade className="flex items-baseline gap-3">
        <span className="text-[10px] tracking-[0.3em] text-muted uppercase">
          {loader.label}
        </span>
        <span className="font-mono text-sm tabular-nums text-muted">{pct}</span>
      </div>
      <div data-fade className="h-px w-48 overflow-hidden bg-white/15">
        <div
          className="h-full bg-accent transition-[width] duration-100 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
