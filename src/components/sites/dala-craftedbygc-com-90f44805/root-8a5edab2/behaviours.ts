import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";
import type { AnimateFrom, AnimateMq } from "../shared/anim";

/**
 * DOM behaviours ported from the reference's theme script. Each setup
 * function wires one component through its `js-*` hooks and returns a
 * teardown.
 */

gsap.registerPlugin(ScrollTrigger, SplitText);

type Teardown = () => void;

const MQ: Record<AnimateMq | "md", string> = {
  smMax: "(max-width: 767px)",
  sm: "(min-width: 768px)",
  md: "(min-width: 1024px)",
};

export const matches = (q: AnimateMq | "md") => window.matchMedia(MQ[q]).matches;

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T & Element>(sel) as T | null;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T & Element>(sel)) as T[];

/* ---------- text presets ---------- */

/**
 * The reference's `splitTextRotateIn`: split into lines, clip each line, and
 * rise the lines in from 120% with a slight rotation, staggered.
 */
export function splitTextRotateIn(
  targets: HTMLElement[],
  opts: Omit<AnimateFrom, "preset" | "children" | "scrollTrigger"> & {
    scrollTrigger?: ScrollTrigger.Vars;
    paused?: boolean;
  } = {},
) {
  const { rotate, scrollTrigger, paused, ...rest } = opts;
  const split = SplitText.create(targets, { type: "lines", mask: "lines" });
  const tween = gsap.from(split.lines, {
    y: "120%",
    rotate,
    transformOrigin: "0 0",
    duration: 1.5,
    ease: "power3.out",
    stagger: { each: 0.1, ease: "power1.in" },
    ...rest,
    scrollTrigger,
    paused,
  });
  return { tween, split };
}

/**
 * The reference's `splitCharsWipeUpIn`: characters wipe up out of their
 * line masks, each line starting a beat after the previous one.
 */
function splitCharsWipeUpIn(target: HTMLElement, duration: number) {
  const split = SplitText.create(target, { type: "lines,chars", mask: "lines" });
  const delays: number[] = [];
  split.lines.forEach((line, li) => {
    const chars = split.chars.filter((c) => line.contains(c));
    chars.forEach(() => delays.push(0.035 * li + 0.025 * delays.length));
  });
  const tween = gsap.from(split.chars, {
    y: "100%",
    ease: "expo.out",
    duration,
    stagger: (i: number) => delays[i] ?? 0,
  });
  return { tween, chars: split.chars };
}

/* ---------- scroll reveals ---------- */

/** Builds every `data-animate-from` tween, as the reference does on enter. */
export function setupScrollAnimations(): Teardown {
  const made: { kill: () => void }[] = [];
  for (const el of $$("[data-animate-from]")) {
    const mq = el.dataset.animateMq as AnimateMq | undefined;
    if (mq && !matches(mq)) continue;
    const from = JSON.parse(el.dataset.animateFrom ?? "{}") as AnimateFrom;
    const { preset, children, scrollTrigger: st, ...vars } = from;
    const trigger = st?.trigger ? $(st.trigger) ?? el : el;
    const scrollTrigger: ScrollTrigger.Vars = {
      trigger,
      once: true,
      ...st,
    };
    delete scrollTrigger.trigger;
    scrollTrigger.trigger = trigger;

    if (preset === "splitTextRotateIn") {
      const targets = children ? $$(children, el) : [el];
      if (!targets.length) continue;
      const { tween, split } = splitTextRotateIn(targets, { ...vars, scrollTrigger });
      made.push(tween, split);
    } else {
      const { rotate, ...rest } = vars;
      made.push(
        gsap.from(el, {
          ease: "none",
          duration: 1.5,
          ...rest,
          ...(rotate !== undefined ? { rotate } : {}),
          scrollTrigger,
        }),
      );
    }
  }
  return () => made.forEach((m) => m.kill());
}

/* ---------- site loader ---------- */

/**
 * Plays the loader out once the page's assets are in and its opening text
 * has finished animating. Resolves when the site should be revealed.
 */
export function setupLoader(assetsReady: Promise<unknown>): Promise<void> {
  const el = $(".js-site-loader");
  if (!el) return Promise.resolve();
  if (new URLSearchParams(window.location.search).has("skiploader")) {
    gsap.set(el, { autoAlpha: 0, pointerEvents: "none" });
    return Promise.resolve();
  }

  const dom = {
    spinnerSVG: $(".js-site-loader-spinner-svg", el),
    progress: $(".js-site-loader-progress", el),
    digits: $$(".js-site-loader-progress-digit", el),
    loadingText: $(".js-site-loader-loading-text", el),
    completedText: $(".js-site-loader-completed-text span", el),
    heading: $$(".js-site-loader-heading-text", el),
    ellipsis: $$(".js-site-loader-ellipses-wrapper", el),
  };

  return new Promise<void>((resolve) => {
    let progress = 0;
    let criticalEnded = false;
    let counterVisible = false;
    let done = false;

    const renderCounter = () => {
      const d = Array.from(String(progress)).map(Number).reverse();
      dom.digits[2].textContent = String(d[0] ?? "");
      dom.digits[1].textContent = d[1] !== undefined ? String(d[1]) : "";
      dom.digits[0].textContent = d[2] !== undefined ? String(d[2]) : "";
    };

    const out = (expedited: boolean) => {
      if (done) return;
      done = true;
      const spin = {
        transform: "scale(1)",
        animationName: "scaleDown",
        animationFillMode: "forwards",
        animationDirection: "normal",
        animationDuration: "0.4s",
        animationDelay: "0",
      };
      const tl = gsap
        .timeline({ delay: expedited ? 0.5 : 0, onStart: () => el.classList.add("loaded") })
        .to(dom.loadingText, { yPercent: -110, rotate: 5, ease: "expo.out", duration: 2 }, 0)
        .set(dom.ellipsis, { autoAlpha: 0 }, 0)
        .to(dom.heading, { yPercent: -120, rotate: 2, ease: "expo.out", duration: 2, stagger: expedited ? 0.1 : 0.15 }, 0)
        .set(dom.spinnerSVG, spin, 0);
      if (!expedited) tl.to(dom.progress, { autoAlpha: 0, duration: 0.5, ease: "power1.out" }, 0.2);
      tl.to(dom.completedText, { y: 0, rotate: 0, duration: 0.5, ease: "power1.out" }, expedited ? 0 : 0.2)
        .to(el, { autoAlpha: 0, ease: "none", duration: 0.5 }, expedited ? 0.5 : 1)
        .call(() => resolve(), undefined, "<");
    };

    const onCriticalEnd = () => {
      criticalEnded = true;
      if (progress === 100) out(true);
      else if (dom.progress) {
        dom.progress.style.visibility = "visible";
        dom.progress.style.opacity = "1";
        counterVisible = true;
        renderCounter();
      }
    };

    // Creep the counter while waiting, as the reference does.
    const creep = window.setInterval(() => {
      if (progress < 90) progress += 1;
      if (counterVisible) renderCounter();
    }, 250);

    assetsReady.then(() => {
      window.clearInterval(creep);
      progress = 100;
      if (counterVisible) renderCounter();
      if (criticalEnded) out(false);
    });

    const first = dom.heading[0];
    const lt = dom.loadingText && getComputedStyle(dom.loadingText).transform;
    if (!lt || lt === "matrix(1, 0, 0, 1, 0, 0)" || lt === "none") onCriticalEnd();
    else first?.addEventListener("animationend", onCriticalEnd, { once: true });
  });
}

/* ---------- header ---------- */

export function setupHeader(): Teardown {
  const el = $(".js-header");
  if (!el) return () => {};
  const inner = $(".js-header-inner", el);
  const bg = $(".js-header-bg", el);
  const logo = $(".js-header-logo", el);
  const letters = $$<SVGElement>(".js-header-logo-text", el);
  const group = $<SVGGElement>(".js-header-logo-text-group", el);
  const shift = () => Math.ceil(group?.getBoundingClientRect().height ?? 30) + 10;

  let compact = false;
  let hidden = false;
  let tl: gsap.core.Timeline | null = null;

  const shrink = () => {
    if (hidden) return;
    hidden = true;
    tl?.kill();
    const v = shift();
    tl = gsap
      .timeline()
      .to(bg, { scaleY: 1, duration: 1, ease: "expo.out" }, 0)
      .to(inner, { y: 0, duration: 1, ease: "expo.out" }, 0)
      .to(letters, { y: -v, duration: 1, ease: "expo.out", stagger: 0.05 }, 0)
      .set(letters, { y: v + 10 }, ">");
  };
  const grow = () => {
    if (!hidden) return;
    hidden = false;
    tl?.kill();
    tl = gsap
      .timeline()
      .to(inner, { y: matches("sm") ? "1rem" : 0, duration: 1, ease: "expo.out" }, 0)
      .to(bg, { scaleY: 0, duration: 1, ease: "expo.out" }, 0)
      .to(letters, { y: 0, duration: 1, ease: "expo.out", stagger: 0.05 }, 0);
  };
  const onScroll = () => {
    compact = window.scrollY > 1;
    if (compact) shrink();
    else grow();
  };
  // Hovering the compact logo brings the wordmark back for a moment.
  const reveal = () => {
    if (!compact) return;
    gsap.fromTo(letters, { y: shift() }, { y: 0, duration: 1, ease: "expo.out", stagger: 0.05 });
  };
  const conceal = () => {
    if (!compact) return;
    const v = shift();
    gsap
      .timeline()
      .to(letters, { y: -v, duration: 1, ease: "expo.out", stagger: 0.05 }, 0)
      .set(letters, { y: v }, ">");
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  logo?.addEventListener("mouseenter", reveal);
  logo?.addEventListener("mouseleave", conceal);
  return () => {
    tl?.kill();
    window.removeEventListener("scroll", onScroll);
    logo?.removeEventListener("mouseenter", reveal);
    logo?.removeEventListener("mouseleave", conceal);
  };
}

/* ---------- navigation ---------- */

export function setupNav(lenis: Lenis | null, currentSection: () => string | null): Teardown {
  const el = $(".js-nav");
  const toggle = $(".js-nav-toggle");
  if (!el || !toggle) return () => {};
  const cross = $<SVGGElement>(".js-nav-toggle-cross", toggle);
  const burger = $<SVGGElement>(".js-nav-toggle-burger", toggle);
  const bg = $(".js-nav-bg", el);
  const list = $(".js-nav-list", el);
  const items = $$(".js-nav-item");
  const headerItems = $$(".js-nav-item", el);
  const links = $$(".js-nav-link");
  const mask = $(".js-nav-transition-mask");
  const maskBg = $(".js-nav-transition-mask-bg");
  const spinner = $<SVGElement>(".js-nav-transition-mask-spinner-svg");
  const anchors = $$("[data-anchor-link]");

  // Hover: the letters of a link bob up one after another.
  const splits = links.map((l) =>
    SplitText.create(l, { type: "chars", charsClass: "nav__link__chars js-nav-link-chars pointer-events-none" }),
  );
  const hovers = splits.map((s) =>
    gsap.timeline({ paused: true }).fromTo(
      s.chars,
      { yPercent: 0 },
      { yPercent: -15, duration: 0.25, ease: "power1.out", stagger: { each: 0.035, yoyo: true, repeat: 1 } },
      0,
    ),
  );
  const onEnter = (e: Event) => {
    const i = links.indexOf(e.currentTarget as HTMLElement);
    if (i >= 0 && !hovers[i].isActive()) hovers[i].restart();
  };
  links.forEach((l) => l.addEventListener("mouseenter", onEnter));

  // Anchor links: black wipe, spinning mark, jump, wipe back.
  const navigate = (e: Event) => {
    const link = e.currentTarget as HTMLElement;
    const target = $(`[data-anchor-target="${link.dataset.anchorLink}"]`);
    if (!target) return;
    e.preventDefault();
    if (!matches("sm")) close();
    gsap
      .timeline()
      .set(spinner, { scale: 0, rotation: 0 })
      .set(mask, { pointerEvents: "auto" })
      .to(maskBg, { autoAlpha: 1, duration: 0.5, ease: "expo.in" }, 0)
      .to(spinner, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "expo.in" }, 0.2)
      .to(spinner, { rotate: 90, repeat: 2, duration: 1, ease: "quad.inOut" }, 0.2)
      .call(
        () => {
          const top = target.getBoundingClientRect().top + window.scrollY;
          if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
          else window.scrollTo(0, top);
        },
        undefined,
        1,
      )
      .to(spinner, { autoAlpha: 0, scale: 0, duration: 0.5, ease: "expo.in" }, 2)
      .to(maskBg, { autoAlpha: 0, duration: 0.5, ease: "expo.out" }, 2.3)
      .set(mask, { pointerEvents: "none" });
  };
  anchors.forEach((a) => a.addEventListener("click", navigate));

  // Mobile menu.
  let open = false;
  let tl: gsap.core.Timeline | null = null;
  const show = () => {
    open = true;
    if (cross) cross.style.display = "block";
    if (burger) burger.style.display = "none";
    if (list) list.style.pointerEvents = "auto";
    tl?.kill();
    tl = gsap
      .timeline()
      .to(bg, { scaleY: 1, duration: 1, ease: "expo.out" }, 0)
      .to(headerItems, { autoAlpha: 1, duration: 1, ease: "expo.out", stagger: { amount: 0.17, from: "start" } }, 0.2);
  };
  const close = () => {
    open = false;
    if (cross) cross.style.display = "none";
    if (burger) burger.style.display = "block";
    if (list) list.style.pointerEvents = "none";
    tl?.kill();
    tl = gsap
      .timeline()
      .to(headerItems, { autoAlpha: 0, duration: 1, ease: "expo.out", stagger: { amount: 0.17, from: "end" } }, 0)
      .to(bg, { scaleY: 0, duration: 1, ease: "expo.out" }, 0.2);
  };
  const onToggle = () => (open ? close() : show());
  toggle.addEventListener("click", onToggle);
  if (!matches("sm")) {
    gsap.set(headerItems, { autoAlpha: 0 });
    if (list) list.style.pointerEvents = "none";
  }

  // Highlight the item for the section at the top of the viewport.
  let active: string | null = null;
  const tick = () => {
    const name = currentSection();
    if (name === null || name === active) return;
    active = name;
    items.forEach((i) => i.classList.toggle("isActive", i.dataset.sectionName === name));
  };
  gsap.ticker.add(tick);

  return () => {
    tl?.kill();
    gsap.ticker.remove(tick);
    hovers.forEach((h) => h.kill());
    splits.forEach((s) => s.revert());
    links.forEach((l) => l.removeEventListener("mouseenter", onEnter));
    anchors.forEach((a) => a.removeEventListener("click", navigate));
    toggle.removeEventListener("click", onToggle);
  };
}

/* ---------- team slider ---------- */

export function setupSlider(): Teardown {
  const el = $(".js-slider");
  const container = el && $(".js-slides", el);
  if (!el || !container) return () => {};
  const slideEls = $$(".js-slide", el);
  const prevBtn = $(".js-slider-prev", el);
  const nextBtn = $(".js-slider-next", el);
  const touch = window.matchMedia("(pointer: coarse)").matches;
  const itemCount = 3;

  // Role and name wipe in character by character; the icons pop.
  const content = new Map<string, { inTl: gsap.core.Timeline; outTl: gsap.core.Timeline }>();
  for (const c of $$(".js-slide-content", el)) {
    const role = $(".js-role", c);
    const name = $(".js-name", c);
    const icons = $$(".js-social-icon", c);
    if (!role || !name) continue;
    const r = splitCharsWipeUpIn(role, 0.7);
    const n = splitCharsWipeUpIn(name, 0.7);
    const inTl = gsap
      .timeline({ paused: true })
      .add(r.tween, 0)
      .add(n.tween, 0.5)
      .set(c.parentElement, { pointerEvents: "auto" }, 0)
      .to(icons, { scale: 1, duration: 0.7, stagger: 0.2, ease: "expo.out" }, 1);
    const outTl = gsap
      .timeline({ paused: true })
      .set(c.parentElement, { pointerEvents: "none" })
      .to([...r.chars, ...n.chars], { y: "-110%", ease: "expo.out", duration: 0.7 }, 0)
      .to(icons, { scale: 0, stagger: 0.1, duration: 0.7, ease: "expo.out" }, 0);
    content.set(c.dataset.slideId ?? "", { inTl, outTl });
  }

  const slides = slideEls.map((s) => ({
    slide: s,
    image: $(".js-slide-image", s),
    content: content.get(s.dataset.slideId ?? ""),
  }));

  let active: (typeof slides)[number] | null = null;
  let activeIndex = 0;
  let allow = true;
  let base = 0;
  let step = 0;
  let centerOffset = 1;

  const setActive = (index: number, instant = false) => {
    const next = slides[index];
    if (!next) return;
    const method = instant ? "set" : "to";
    const tl = gsap.timeline();
    if (active) {
      tl[method](active.image, { scale: 1, filter: "grayscale(1) brightness(0.1)", duration: 0.5, ease: "quad.out" }, 0);
      tl[method](active.slide, { autoAlpha: 0.9, duration: 0.5, ease: "quad.out" }, 0);
      if (!instant && active.content) {
        active.content.inTl.pause();
        active.content.outTl.progress(0).play();
      }
    }
    active = next;
    tl[method](next.slide, { autoAlpha: 1, duration: 0.5, ease: "quad.out" }, 0)
      .call(() => void (allow = true), undefined, 0.5)
      [method](next.image, { scale: 1.2, filter: "grayscale(0) brightness(1)", duration: 0.5, ease: "quad.out" }, 0);
    if (!instant && next.content) {
      next.content.outTl.pause();
      tl.call(() => void next.content!.inTl.progress(0).play(), undefined, 0.2);
    }
  };

  const reset = () => {
    const item = slideEls[0].getBoundingClientRect();
    const image = slides[0].image?.getBoundingClientRect() ?? item;
    const md = matches("md");
    centerOffset = md ? 2 : 1;
    const centerPos = md ? 0.5 * image.width : 0.18 * window.innerWidth;
    step = item.width;
    base = -(step * itemCount + centerPos);
    gsap.set(container, { x: base });
    setActive(itemCount + centerOffset);
    activeIndex = 0;
    prevBtn?.classList.toggle("hover-enabled", !touch);
    nextBtn?.classList.toggle("hover-enabled", !touch);
  };

  const pulse = (btn: HTMLElement | null, dir: "prev" | "next") => {
    if (!touch || !btn) return;
    gsap
      .timeline({ yoyo: true, repeat: 1 })
      .fromTo($(`.js-slider-${dir}-bg`, btn), { scale: 1 }, { scale: 1.1, ease: "expo.inOut", duration: 0.6 }, 0)
      .fromTo($(`.js-slider-${dir}-hover`, btn), { scale: 0 }, { scale: 1.1, ease: "expo.inOut", duration: 0.6 }, 0);
  };

  const move = (dir: 1 | -1) => {
    if (!allow) return;
    pulse(dir === 1 ? nextBtn : prevBtn, dir === 1 ? "next" : "prev");
    allow = false;
    activeIndex += dir;
    // Wrap invisibly: jump back a full set, then keep moving.
    if (Math.abs(activeIndex) === itemCount) {
      activeIndex = 0;
      setActive(itemCount + centerOffset - dir, true);
      gsap.set(container, { x: base - step * (activeIndex - dir) });
    }
    gsap.to(container, { x: base - step * activeIndex });
    setActive(activeIndex + itemCount + centerOffset);
  };
  const onPrev = () => move(-1);
  const onNext = () => move(1);

  reset();
  prevBtn?.addEventListener("click", onPrev);
  nextBtn?.addEventListener("click", onNext);
  window.addEventListener("resize", reset);
  return () => {
    prevBtn?.removeEventListener("click", onPrev);
    nextBtn?.removeEventListener("click", onNext);
    window.removeEventListener("resize", reset);
    content.forEach((c) => {
      c.inTl.kill();
      c.outTl.kill();
    });
  };
}

/* ---------- cookie notice ---------- */

export function setupCookieNotice(): Teardown {
  const el = $(".js-cookie-notice");
  const btn = el && $(".js-cookie-notice-toggle", el);
  if (!el || !btn) return () => {};
  const accepted = () => document.cookie.split(";").some((c) => c.includes("cookie_notice_accepted=true"));
  const hide = () => {
    el.classList.remove("is-open");
    el.style.display = "none";
  };
  if (accepted()) {
    hide();
    return () => {};
  }
  el.classList.add("is-open");
  const onClick = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    document.cookie = `cookie_notice_accepted=true;expires=${d.toUTCString()};path=/`;
    hide();
  };
  btn.addEventListener("click", onClick);
  return () => btn.removeEventListener("click", onClick);
}

/* ---------- section progress ---------- */

/**
 * The reference's section tracker: the current section is the one crossing
 * the top edge of the viewport; progress is its index plus how far through
 * it the page has scrolled.
 */
export function sectionTracker() {
  const sections = $$(".js-section");
  let index = 0;
  let name: string | null = null;
  return {
    progress() {
      const rects = sections.map((s) => s.getBoundingClientRect());
      for (let i = rects.length - 1; i >= 0; i--) {
        if (rects[i].top <= 1) {
          index = i;
          break;
        }
      }
      const r = rects[index];
      if (!r) return 0;
      name = sections[index].dataset.sectionName ?? name;
      return index + Math.abs(r.top / Math.max(1, r.height));
    },
    name: () => name,
  };
}
