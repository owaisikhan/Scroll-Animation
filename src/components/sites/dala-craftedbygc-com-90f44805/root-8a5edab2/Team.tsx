import { anim } from "../shared/anim";
import { ASSET_BASE, SpriteIcon } from "../shared/icons";
import { Investors } from "./Investors";

const PEOPLE = [
  {
    name: "Haroun Hickman",
    role: "Co Founder & CEO",
    image: "haroun.jpg",
    twitter: "https://twitter.com/HarounHickman",
    linkedin: "https://www.linkedin.com/in/harounhickman",
  },
  {
    name: "Poppy Reid",
    role: "Product Design Lead",
    image: "poppy.jpg",
    twitter: "https://twitter.com/ReidPoppy",
    linkedin: "https://www.linkedin.com/in/poppy-reid-484087121",
  },
  {
    name: "Joel Kang",
    role: "Co Founder & CTO",
    image: "joel.jpg",
    twitter: "https://twitter.com/_joel_kang_",
    linkedin: "https://www.linkedin.com/in/joelkang",
  },
];

/** The reference repeats the three portraits six times for an endless strip. */
const SLIDES = Array.from({ length: 6 }, (_, set) =>
  PEOPLE.map((p) => ({ ...p, key: `${set}-${p.name}` })),
).flat();

const headParallax = {
  y: "-5vw",
  scrollTrigger: { scrub: 0.5, once: false, start: "top bottom" },
};

export function Team() {
  return (
    <div
      className="section js-section js-team-section mb-1"
      data-section-name="team"
      data-anchor-target="team"
    >
      <div className="team">
        <div className="team__head js-team-head" {...anim(headParallax, "sm")}>
          <h2
            className="t-56 t-lh-1 t-64@sm t-lh-1.2@sm t-104@md t-lh-1.1@md -t-ls-0.03 t-400 mb-2@xs mb-2.5@sm mb-3@md"
            {...anim({ preset: "splitTextRotateIn", scrollTrigger: { start: "top bottom" } })}
          >
            Our team
          </h2>
        </div>

        <div className="team-slider | js-slider">
          <div className="team-slider__slides-container">
            <ul className="team-slider__slides | js-slides">
              {SLIDES.map((s) => (
                <li key={s.key} className="team-card | js-slide" data-slide-id={s.name}>
                  <div className="team-card__inner">
                    {/* eslint-disable-next-line @next/next/no-img-element -- slider transforms the raw img */}
                    <img
                      className="team-card__image | js-slide-image"
                      src={`${ASSET_BASE}/images/team/${s.image}`}
                      alt={`Portrait of ${s.name}`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <ul className="team-slider__content">
            {PEOPLE.map((p) => (
              <li key={p.name} className="team-slider__content__item">
                <div className="team-card__content | js-slide-content" data-slide-id={p.name}>
                  <span className="t-16 t-lh-1.2 t-ls-0.05 t-600 t-uppercase mb-1 t-purple | js-role">
                    {p.role}
                  </span>
                  <h3 className="t-40 t-lh-1 t-56@md t-lh-0.9@md t-lh-1.2@md -t-ls-0.03 t-400 mb-1 | js-name">
                    {p.name}
                  </h3>
                  <div className="team-card__social">
                    <a className="team-card__social__link | js-social-icon" href={p.twitter} target="_blank" rel="noopener">
                      <span className="sr">Twitter</span>
                      <SpriteIcon id="twitter" className="team-card__social__icon team-card__social__icon--twitter" />
                    </a>
                    <a className="team-card__social__link | js-social-icon" href={p.linkedin} target="_blank" rel="noopener">
                      <span className="sr">Linkedin</span>
                      <SpriteIcon id="linkedin" className="team-card__social__icon team-card__social__icon--linkedin" />
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="team-slider__controls">
            {(["previous", "next"] as const).map((dir) => {
              const short = dir === "previous" ? "prev" : "next";
              return (
                <button key={dir} className={`team-slider__control team-slider__${dir} | js-slider-${short}`}>
                  <span className="sr">{dir === "previous" ? "Previous" : "Next"}</span>
                  <div className={`team-slider__control-bg | js-slider-${short}-bg`} />
                  <div className={`team-slider__control-hover | js-slider-${short}-hover`} />
                  <SpriteIcon id="arrow" />
                </button>
              );
            })}
          </div>
        </div>

        <div {...anim({ y: "-5vw", scrollTrigger: { trigger: ".js-team-head", scrub: 0.5, once: false, start: "top bottom" } })}>
          <h3
            className="t-36 t-lh-1 -t-ls-0.03 t-400 mt-5@sm"
            {...anim({ preset: "splitTextRotateIn", rotate: 7, delay: 0.5, duration: 0.8, scrollTrigger: { start: "top bottom" } })}
          >
            Build with us.
          </h3>
          <div
            className="team__body"
            {...anim({ preset: "splitTextRotateIn", rotate: 7, delay: 1, duration: 0.8, scrollTrigger: { start: "top bottom" }, children: "p" })}
          >
            <p className="t-20 t-lh-1.5 -t-ls-0.03 t-400">
              We are actively hiring intentional, empathetic and curious people who thrive on
              creating delightful experiences. If you&apos;d like to be a part of the journey,
              email <a href="mailto:Kodexa77@gmail.com">Kodexa77@gmail.com</a> with your CV or
              portfolio, and a thoughtful note.
            </p>
            <p className="t-20 t-lh-1.5 -t-ls-0.03 t-400">
              Read more about our values{" "}
              <a
                href="#manifesto"
                target="_blank"
                rel="noreferrer noopener"
              >
                here
              </a>
              .
            </p>
          </div>
        </div>
      </div>
      <Investors />
    </div>
  );
}
