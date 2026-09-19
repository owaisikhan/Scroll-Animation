"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { cookies } from "@/lib/content";

const KEY = "cookie-consent";
const noopSubscribe = () => () => {};

function readConsent() {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export default function CookieBanner() {
  // Read storage through an external-store snapshot so the banner never
  // renders on the server and never sets state from an effect.
  const consented = useSyncExternalStore(noopSubscribe, readConsent, () => true);
  const [dismissed, setDismissed] = useState(false);

  const accept = useCallback(() => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setDismissed(true);
  }, []);

  if (consented || dismissed) return null;

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-fit items-center gap-4 rounded-full border border-white/10 bg-ink/80 py-2 pr-2 pl-5 backdrop-blur-md sm:left-auto">
      <p className="text-xs text-muted">
        {cookies.text}{" "}
        <a href="#privacy" className="text-paper underline underline-offset-2">
          {cookies.link}
        </a>
      </p>
      <button
        type="button"
        onClick={accept}
        className="rounded-full bg-accent px-5 py-2.5 text-[10px] font-medium tracking-[0.14em] uppercase transition-colors hover:bg-accent-soft"
      >
        {cookies.accept}
      </button>
    </div>
  );
}
