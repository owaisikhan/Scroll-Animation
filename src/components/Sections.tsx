import Reveal from "./Reveal";
import Magnetic from "./Magnetic";
import Mark from "./Mark";
import {
  brand,
  careers,
  footer,
  globe,
  hero,
  intro,
  investors,
  lightbulb,
  manifesto,
  team,
} from "@/lib/content";

/* Shared shells ---------------------------------------------------------- */

function Screen({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative flex min-h-svh w-full items-center px-6 py-28 md:px-10 ${className}`}
    >
      <div className="mx-auto w-full max-w-[1800px]">{children}</div>
    </section>
  );
}

function Body({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Reveal as="p" delay={delay} className="text-base leading-relaxed text-white/75 sm:text-lg">
      {children}
    </Reveal>
  );
}

/* Sections --------------------------------------------------------------- */

export function Hero() {
  return (
    <Screen id="hero">
      <div className="max-w-[46rem]">
        <h1 className="display text-[clamp(3.25rem,10.5vw,9rem)]">
          {hero.headline.map((line, i) => (
            <Reveal key={line} delay={i * 0.09}>
              {line}
            </Reveal>
          ))}
        </h1>

        <Reveal
          as="p"
          delay={0.3}
          className="mt-10 text-[11px] font-medium tracking-[0.2em] text-amber uppercase"
        >
          {hero.eyebrow}
        </Reveal>

        <div className="measure mt-5">
          <Body delay={0.36}>{hero.body}</Body>
        </div>

        <div className="mt-10">
          <Magnetic strength={0.35}>
            <a
              href={hero.cta.href}
              className="inline-block rounded-full bg-accent px-8 py-4 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors hover:bg-accent-soft"
            >
              {hero.cta.label}
            </a>
          </Magnetic>
        </div>
      </div>
    </Screen>
  );
}

export function Intro() {
  return (
    <Screen id="intro" className="justify-end">
      <div className="ml-auto max-w-[34rem] md:pl-10">
        <h2 className="display text-[clamp(2.25rem,5.2vw,4rem)]">
          {intro.title.map((l, i) => (
            <Reveal key={l} delay={i * 0.08}>
              {l}
            </Reveal>
          ))}
        </h2>
        <div className="mt-6">
          <Body delay={0.2}>{intro.body}</Body>
        </div>
      </div>
    </Screen>
  );
}

/** The three full-bleed statements the cloud comes apart behind. */
export function Manifesto() {
  return (
    <div id="manifesto">
      {manifesto.map((block, i) => (
        <Screen key={i} id={`m${i + 1}`} className="justify-center text-center">
          <div className="mx-auto flex max-w-[54rem] flex-col gap-10">
            {block.map((para, j) => (
              <Reveal
                key={j}
                as="p"
                delay={j * 0.12}
                className="text-[clamp(1.35rem,2.9vw,2.15rem)] leading-snug text-balance"
              >
                {para}
              </Reveal>
            ))}
          </div>
        </Screen>
      ))}
    </div>
  );
}

export function Lightbulb() {
  return (
    <Screen id="bulb" className="justify-end">
      <div className="ml-auto max-w-[34rem] md:pl-10">
        <h2 className="display text-[clamp(2.25rem,5.2vw,4rem)]">
          {lightbulb.title.map((l, i) => (
            <Reveal key={l} delay={i * 0.08}>
              {l}
            </Reveal>
          ))}
        </h2>
        <div className="mt-6 flex flex-col gap-5">
          {lightbulb.body.map((p, i) => (
            <Body key={i} delay={0.18 + i * 0.08}>
              {p}
            </Body>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/**
 * Empty screen used two ways: to hold an assembled form on screen for a beat,
 * and to give the cloud real scroll distance to come apart and rebuild.
 * Without these the forms would exist for a single frame at the end of a leg.
 */
export function Spacer({ id }: { id: string }) {
  return <section id={id} aria-hidden="true" className="h-svh w-full" />;
}

export function Globe() {
  return (
    <Screen id="globe">
      <div className="max-w-[34rem]">
        <h2 className="display text-[clamp(2.25rem,5.2vw,4rem)]">
          {globe.title.map((l, i) => (
            <Reveal key={l} delay={i * 0.08}>
              {l}
            </Reveal>
          ))}
        </h2>
        <div className="mt-6 flex flex-col gap-5">
          {globe.body.map((p, i) => (
            <Body key={i} delay={0.18 + i * 0.08}>
              {p}
            </Body>
          ))}
        </div>
      </div>
    </Screen>
  );
}

export function Team() {
  return (
    <section id="team" className="relative px-6 py-28 md:px-10">
      <div className="mx-auto w-full max-w-[1800px]">
        <Reveal
          as="h2"
          className="text-[11px] tracking-[0.22em] text-muted uppercase"
        >
          {team.title}
        </Reveal>

        <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {team.members.map((m, i) => (
            <li key={m.name}>
              <Reveal delay={i * 0.08}>
                <div className="group">
                  {/* Typeset initials stand in for portraits. */}
                  <div className="flex aspect-4/5 w-full items-center justify-center overflow-hidden rounded-sm border border-white/10 bg-white/[0.03] transition-colors group-hover:border-white/25">
                    <span className="display text-6xl text-white/25 transition-colors group-hover:text-white/45">
                      {m.initials}
                    </span>
                  </div>
                  <p className="mt-5 text-[10px] tracking-[0.2em] text-muted uppercase">
                    {m.role}
                  </p>
                  <p className="mt-1.5 text-xl">{m.name}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>

        {/* Careers */}
        <div className="mt-32 grid gap-10 border-t border-white/10 pt-16 md:grid-cols-2">
          <Reveal as="h3" className="display text-[clamp(2rem,4.4vw,3.25rem)]">
            {careers.title}
          </Reveal>
          <div className="flex flex-col gap-5">
            <Body delay={0.1}>{careers.body}</Body>
            <Reveal as="p" delay={0.18} className="text-base text-white/75">
              <a
                href={`mailto:${brand.email}`}
                className="text-paper underline underline-offset-4 hover:text-accent-soft"
              >
                {brand.email}
              </a>
              {" · "}
              <a href="#values" className="underline underline-offset-4 hover:text-accent-soft">
                {careers.linkLabel}
              </a>
            </Reveal>
          </div>
        </div>

        {/* Backers */}
        <div className="mt-32 grid gap-10 border-t border-white/10 pt-16 md:grid-cols-2">
          <div>
            <Reveal as="h3" className="display text-[clamp(2rem,4.4vw,3.25rem)]">
              {investors.title}
            </Reveal>
            <div className="mt-6 max-w-md">
              <Body delay={0.1}>{investors.body}</Body>
            </div>
          </div>
          <div>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-3">
              {investors.names.map((n, i) => (
                <li key={n}>
                  <Reveal delay={i * 0.05}>
                    <span className="text-sm tracking-tight text-white/45 transition-colors hover:text-white/80">
                      {n}
                    </span>
                  </Reveal>
                </li>
              ))}
            </ul>
            <ul className="mt-12 flex flex-col gap-5">
              {investors.people.map((p, i) => (
                <li key={p.name}>
                  <Reveal delay={i * 0.08}>
                    <p className="text-base">{p.name}</p>
                    <p className="text-xs text-muted">{p.note}</p>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer
      id="footer"
      className="relative flex min-h-svh flex-col justify-between px-6 py-20 md:px-10"
    >
      <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col items-center justify-center gap-10 text-center">
        <h2 className="display max-w-[20ch] text-[clamp(2.25rem,6.5vw,5.5rem)] text-balance">
          <Reveal>{footer.callout}</Reveal>
        </h2>
        <Magnetic strength={0.35}>
          <a
            id="request"
            href={footer.cta.href}
            className="inline-block rounded-full bg-accent px-9 py-4.5 text-[11px] font-medium tracking-[0.16em] uppercase transition-colors hover:bg-accent-soft"
          >
            {footer.cta.label}
          </a>
        </Magnetic>
      </div>

      <div className="mx-auto w-full max-w-[1800px] border-t border-white/10 pt-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Mark className="h-6 w-6" />
            <p className="text-xs text-muted">
              {brand.legal} {brand.rights}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-7 gap-y-3">
            {footer.columns.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="text-xs text-muted transition-colors hover:text-paper"
              >
                {c.label}
              </a>
            ))}
          </nav>

          <nav className="flex gap-7">
            {footer.social.map((s) => (
              <Magnetic key={s.label} strength={0.3}>
                <a
                  href={s.href}
                  className="text-xs text-muted transition-colors hover:text-paper"
                >
                  {s.label}
                </a>
              </Magnetic>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
