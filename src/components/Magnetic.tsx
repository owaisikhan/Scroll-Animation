"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

/**
 * Pulls its child toward the cursor while hovered and springs it back on
 * exit. The inner label trails the outer box slightly, which reads as weight.
 */
export default function Magnetic({
  children,
  strength = 0.42,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const inner = el.firstElementChild as HTMLElement | null;
    const quickX = gsap.quickTo(el, "x", { duration: 0.55, ease: "power3.out" });
    const quickY = gsap.quickTo(el, "y", { duration: 0.55, ease: "power3.out" });
    const innerX = inner && gsap.quickTo(inner, "x", { duration: 0.8, ease: "power3.out" });
    const innerY = inner && gsap.quickTo(inner, "y", { duration: 0.8, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      quickX(dx * strength);
      quickY(dy * strength);
      innerX?.(dx * strength * 0.35);
      innerY?.(dy * strength * 0.35);
    };
    const onLeave = () => {
      quickX(0);
      quickY(0);
      innerX?.(0);
      innerY?.(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  return (
    <span ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </span>
  );
}
