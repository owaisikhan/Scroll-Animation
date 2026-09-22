import { anim } from "../shared/anim";
import { ASSET_BASE } from "../shared/icons";

/**
 * On tablet and up each name gets a solid 3D pyramid rendered by the WebGL
 * layer (the empty `data-pyramid` box it tracks); phones get the PNG render.
 */
const INVESTORS = [
  { name: "Seedcamp", color: "#FFB829", startX: 1200, speed: 1.5 },
  { name: "James Meekings", note: "Co-founder of Funding Circle", color: "#189B81", startX: -1000, speed: 0.5 },
  { name: "Evening Fund", color: "#FFB829", startX: 1000, speed: 1 },
  { name: "Valia Ventures", color: "#926AFF", startX: -1000, speed: -0.5 },
  { name: "Roman Schumacher", note: "Co-founder & CPO at Personio", color: "#926AFF", startX: 1000, speed: -1 },
];

export function Investors() {
  return (
    <div className="investors">
      {INVESTORS.map((inv, i) => (
        <div key={inv.name} className="investors__item">
          <div className="investor">
            <div
              className="investor__icon d-none@sm"
              {...anim({ yPercent: 100, autoAlpha: 0, rotate: 14, ease: "expo.out", duration: 1 })}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative render, sized by CSS */}
              <img className="investor__icon__image" src={`${ASSET_BASE}/images/investors/${i + 1}.png`} alt="" aria-hidden="true" />
            </div>
            <div
              className="investor__icon d-none d-block@sm"
              data-pyramid={inv.color}
              data-start-x={inv.startX}
              data-parallax-speed={inv.speed}
            />
            <div className="investor__body">
              <div className="t-32 t-lh-1.25 -t-ls-0.03 t-400">{inv.name}</div>
              {inv.note && <div className="t-16 t-lh-1.3 -t-ls-0.02 t-400 t-grey-4">{inv.note}</div>}
            </div>
          </div>
        </div>
      ))}
      <div
        className="investors__text"
        {...anim({ y: "2vw", scrollTrigger: { trigger: ".js-team-head", scrub: 0.5, once: false, start: "top bottom" } })}
      >
        <h2
          className="t-56 t-lh-1 t-64@sm t-lh-0.9@sm t-104@md -t-ls-0.03 t-400 mb-2@xs mb-1@sm mb-1.5@md"
          {...anim({ preset: "splitTextRotateIn", rotate: 7, duration: 0.8, scrollTrigger: { start: "top bottom" } })}
        >
          Our investors
        </h2>
        <div
          className="investors__body"
          {...anim({ preset: "splitTextRotateIn", rotate: 7, delay: 0.5, duration: 0.8, scrollTrigger: { start: "top bottom" }, children: "p" })}
        >
          <p className="t-20 t-lh-1.5 -t-ls-0.03 t-400">
            We are supported by some of the world&apos;s most pioneering operators and progressive
            funds to fuel our growth.
          </p>
        </div>
      </div>
    </div>
  );
}
