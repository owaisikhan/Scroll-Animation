/**
 * The reference declares its scroll reveals inline (`animate-from="..."`).
 * We keep that model: sections serialise the same options into
 * `data-animate-from`, and the controller turns them into GSAP tweens.
 */
export interface AnimateFrom {
  preset?: "splitTextRotateIn";
  rotate?: number;
  delay?: number;
  duration?: number;
  /** Animate these descendants (a selector) instead of the element. */
  children?: string;
  y?: string | number;
  yPercent?: number;
  autoAlpha?: number;
  ease?: string;
  scrollTrigger?: {
    start?: string;
    scrub?: number;
    once?: boolean;
    /** Selector for a different trigger element. */
    trigger?: string;
  };
}

/** Media query names the reference gates animations on. */
export type AnimateMq = "sm" | "smMax";

export function anim(from: AnimateFrom, mq?: AnimateMq) {
  return {
    "data-animate-from": JSON.stringify(from),
    ...(mq ? { "data-animate-mq": mq } : {}),
  };
}
