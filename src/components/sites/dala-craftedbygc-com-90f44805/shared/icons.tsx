import { useId } from "react";

/**
 * SVGs for the Kodexa clone of dala.craftedbygc.com. The spinner, nav toggle
 * and sprite icons are the reference's own; the logo is Kodexa's.
 */

export const ASSET_BASE = "/sites/dala-craftedbygc-com-90f44805/shared";

/** "Kodexa" set letter by letter, so each can slide independently. */
const WORDMARK: [string, number][] = [
  ["K", 47],
  ["o", 63.2],
  ["d", 78],
  ["e", 93.4],
  ["x", 107.6],
  ["a", 121],
];

/**
 * The Kodexa logo: a K mark built from three facets in the reference's
 * purple / yellow / green, followed by the wordmark. It keeps the reference
 * header's structure (mark + separately animatable letters in a clip group).
 */
export function KodexaLogo({ textClassName }: { textClassName?: string }) {
  const clip = useId();
  return (
    <svg width="136" height="48" viewBox="0 0 136 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h11v36H3z" fill="#8052FF" />
      <path d="M14 22.5 28.5 6H39L20.5 27z" fill="#FFB829" />
      <path d="M18.5 25.5 25.5 20 40 42H29z" fill="#15846E" />
      <path d="M14 22.5 18.5 25.5 14 30z" fill="#C4B5FD" />
      <g className="js-header-logo-text-group" clipPath={`url(#${clip})`}>
        {WORDMARK.map(([ch, x]) => (
          <text
            key={ch}
            className={textClassName}
            x={x}
            y="33"
            fill="white"
            fontFamily="PPNeueMontreal, system-ui, sans-serif"
            fontSize="26"
            fontWeight="400"
          >
            {ch}
          </text>
        ))}
      </g>
      <clipPath id={clip}>
        <rect width="92" height="30" x="44" fill="white" y="9" />
      </clipPath>
    </svg>
  );
}

export function SpinnerSvg({ className }: { className: string }) {
  return (
    <svg className={className} width="142" height="141" viewBox="0 0 142 141" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="63.6035" width="14.7917" height="14.7917" fill="white" />
      <rect x="63.6035" y="125.729" width="14.7917" height="14.7917" fill="white" />
      <rect x="142" y="62.125" width="14.7917" height="14.7917" transform="rotate(90 142 62.125)" fill="white" />
      <rect x="16.2715" y="62.125" width="14.7917" height="16.2708" transform="rotate(90 16.2715 62.125)" fill="white" />
    </svg>
  );
}

export function NavToggleSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g className="nav-toggle__cross js-nav-toggle-cross">
        <path d="M2.56 2.535L13.4386 13.4136" stroke="white" strokeMiterlimit="10" />
        <path d="M13.4389 2.58871L2.56034 13.4673" stroke="white" strokeMiterlimit="10" />
      </g>
      <g className="nav-toggle__burger js-nav-toggle-burger">
        <path d="M0.31 3.35L15.6946 3.35" stroke="white" strokeMiterlimit="10" />
        <path d="M0.31 7.96426L15.6946 7.96426" stroke="white" strokeMiterlimit="10" />
        <path d="M0.31 12.579L15.6946 12.579" stroke="white" strokeMiterlimit="10" />
      </g>
    </svg>
  );
}

/** An icon from the reference's SVG sprite (twitter, linkedin, email, arrow). */
export function SpriteIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg className={className}>
      <use href={`${ASSET_BASE}/images/svgsprite.svg#${id}`} />
    </svg>
  );
}
