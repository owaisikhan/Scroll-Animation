import { anim } from "../shared/anim";

export function Introduction() {
  return (
    <div className="section section--tall introduction | js-section">
      <div className="mobile-blur">
        <h2
          className="introduction__title t-32 t-lh-1.3 t-56@sm t-lh-0.9@sm t-lh-1.2@sm -t-ls-0.03 t-400 mb-1 mb-2@sm"
          {...anim({ preset: "splitTextRotateIn", scrollTrigger: { start: "top bottom" } })}
        >
          Make decisions with confidence
        </h2>
        <p
          className="introduction__body t-24 t-lh-1.5 -t-ls-0.02 t-200"
          {...anim({
            preset: "splitTextRotateIn",
            rotate: 7,
            delay: 0.5,
            duration: 0.8,
            scrollTrigger: { start: "top bottom" },
          })}
        >
          Kodexa’s bleeding-edge AI search tool automates extracting knowledge from across your
          organisation so that you can take the guesswork out of your work.
        </p>
      </div>
    </div>
  );
}
