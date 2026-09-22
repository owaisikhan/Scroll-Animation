import { anim } from "../shared/anim";
import { PillButton, REQUEST_ACCESS_URL } from "../shared/Button";

export function Landing() {
  return (
    <>
      <div data-anchor-target="landing" />
      <div className="section landing | js-section" data-section-name="landing">
        <h2
          className="landing__title t-56 t-80@xs t-104@sm t-150@md t-lh-0.9 -t-ls-0.03 t-400 mb-1.5 t-lh-1.1 mb-1"
          {...anim({ preset: "splitTextRotateIn", delay: 0, duration: 1, children: "span" })}
        >
          <span className="d-block">Unlock</span>
          <span className="d-block">collective</span>
          <span className="d-block">wisdom.</span>
        </h2>
        <div className="mobile-blur mt-0 mb-auto">
          <div className="landing__body">
            <div
              className="t-16 t-lh-1.2 t-ls-0.05 t-600 t-uppercase mb-1 t-yellow"
              {...anim({ preset: "splitTextRotateIn", rotate: 7, delay: 1, duration: 1 })}
            >
              Stop managing knowledge. Start using it.
            </div>
            <p
              className="t-24 t-lh-1.5 -t-ls-0.02 t-200"
              {...anim({ preset: "splitTextRotateIn", rotate: 7, delay: 1, duration: 1 })}
            >
              Plug into your team’s shared brainpower. Ask Kodexa to instantly find anything or
              anyone from any workplace system. Focus on doing your best work with context,
              conviction and clarity.
            </p>
            <div className="overflow-hidden">
              <div
                className="d-flex"
                {...anim({ yPercent: 120, rotate: 2, ease: "expo.out", duration: 1, delay: 1.5 })}
              >
                <PillButton href={REQUEST_ACCESS_URL} label="Request Access" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
