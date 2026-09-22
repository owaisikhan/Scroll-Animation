import type { ReactNode } from "react";
import { anim } from "../shared/anim";

const INTRO_SCREENS = [
  [
    "This is your workplace today. Countless fragments of critical knowledge scattered across hundreds of disparate systems.",
    "30% of your time is spent trying to organise and find the information and expertise you need to do your job.",
  ],
  [
    "The impossible battle to make sense of this chaos leaves your team feeling overwhelmed and unproductive.",
    "They’re confronted with the anxiety of bothering a busy coworker again, or aimlessly trying to connect the dots with incomplete context.",
  ],
  [
    "Existing solutions are cumbersome and quickly become outdated. Yet another decaying system that requires continuous maintenance.",
    "They fail to understand what you need from the vast amounts of information that your team creates every day.",
  ],
];

const reveal = {
  preset: "splitTextRotateIn" as const,
  rotate: 7,
  delay: 0.5,
  duration: 0.8,
  scrollTrigger: { start: "top bottom" },
};

/** Three full screens of large centred copy while the brain explodes. */
export function ManifestoIntro() {
  return (
    <div className="js-section" data-section-name="manifesto" data-anchor-target="manifesto">
      <div
        className="manifesto--introduction-container"
        {...anim({ ...reveal, children: ".js-manifesto-p" }, "smMax")}
      >
        {INTRO_SCREENS.map((ps) => (
          <div key={ps[0]} className="section manifesto--introduction">
            <div
              className="manifesto__body"
              {...anim({ ...reveal, delay: 0, children: ".js-manifesto-p" }, "sm")}
            >
              {ps.map((p) => (
                <p key={p} className="t-24 t-lh-1.3 -t-ls-0.03 t-48@sm t-lh-1.2@sm t-400 | js-manifesto-p">
                  {p}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManifestoSection({
  align,
  title,
  children,
}: {
  align: "items-end@md" | "items-start@md";
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`section section--tall manifesto manifesto--section ${align} js-section`}
      data-section-name="manifesto"
    >
      <div className="manifesto__inner mobile-blur">
        <h2
          className="manifesto__title t-32 t-lh-1.3 t-56@sm t-lh-0.9@sm t-lh-1.2@sm -t-ls-0.03 t-400 mb-1 mb-2@sm"
          {...anim({ preset: "splitTextRotateIn", scrollTrigger: { start: "top bottom" } })}
        >
          {title}
        </h2>
        <div className="manifesto__body" {...anim({ ...reveal, children: "p" })}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Beside the lightbulb. */
export function ManifestoLightbulb() {
  return (
    <ManifestoSection align="items-end@md" title="Spark lightbulb moments">
      <p className="t-24 t-lh-1.5 -t-ls-0.02 t-200">
        Kodexa is your intelligent, real-time source of truth that eliminates the cultural,
        financial and operational struggles of splintered tools.
      </p>
      <p className="t-24 t-lh-1.5 -t-ls-0.02 t-200">
        We connect your systems behind the scenes and pull together exactly the knowledge you
        require into an elegant contextual view.
      </p>
      <p className="t-24 t-lh-1.5 -t-ls-0.02 t-200">
        Just ask Kodexa for the answer that advances your work, and helps you make better
        decisions with more confidence.
      </p>
    </ManifestoSection>
  );
}

/** Beside the sphere. */
export function ManifestoWorld() {
  return (
    <ManifestoSection align="items-start@md" title="Build a better world of work">
      <p className="t-24 t-lh-1.5 -t-ls-0.02 t-200">
        Our mission is to make work more coherent and delightful—reframing productivity from{" "}
        <em>doing more</em> to{" "}
        <a
          href="#manifesto"
          target="_blank"
          rel="noreferrer noopener"
        >
          <em>
            being better<span className="t-white">.</span>
          </em>
        </a>
      </p>
      <p className="t-24 t-lh-1.5 -t-ls-0.02 t-200">
        Your happiest and most purposeful moments at work are when you’re in flow,
        intellectually stimulated, and creating value for customers.
      </p>
      <p className="t-24 t-lh-1.5 -t-ls-0.02 t-200">
        We want to recreate that every time you experience Kodexa. A tool that is completely
        integrated with how you think, feel and work.
      </p>
    </ManifestoSection>
  );
}
