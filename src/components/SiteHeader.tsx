"use client";

import { useEffect, useState } from "react";
import Magnetic from "./Magnetic";
import { brand, nav } from "@/lib/content";
import Mark from "./Mark";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between px-6 py-5 md:px-10">
        <a href="#hero" className="flex items-center gap-3" aria-label={brand.name}>
          <Mark className="h-7 w-7" />
          <span className="hidden text-lg tracking-tight sm:block">{brand.name}</span>
        </a>

        <nav className="hidden items-center gap-10 md:flex">
          {nav.links.map((l) => (
            <Magnetic key={l.label} strength={0.3}>
              <a
                href={l.href}
                className="text-xs tracking-[0.18em] text-muted uppercase transition-colors hover:text-paper"
              >
                {l.label}
              </a>
            </Magnetic>
          ))}
          <Magnetic strength={0.35}>
            <a
              href={nav.cta.href}
              className="inline-block rounded-full bg-accent px-6 py-3 text-xs font-medium tracking-[0.14em] text-paper uppercase transition-colors hover:bg-accent-soft"
            >
              {nav.cta.label}
            </a>
          </Magnetic>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation"
          className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`block h-px w-6 bg-paper transition-transform duration-300 ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
          />
          <span
            className={`block h-px w-6 bg-paper transition-transform duration-300 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile sheet */}
      <div
        className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-ink/95 backdrop-blur-sm transition-opacity duration-400 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {nav.links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            onClick={() => setOpen(false)}
            className="display text-4xl"
          >
            {l.label}
          </a>
        ))}
        <a
          href={nav.cta.href}
          onClick={() => setOpen(false)}
          className="mt-4 rounded-full bg-accent px-8 py-4 text-xs tracking-[0.14em] uppercase"
        >
          {nav.cta.label}
        </a>
      </div>
    </header>
  );
}
