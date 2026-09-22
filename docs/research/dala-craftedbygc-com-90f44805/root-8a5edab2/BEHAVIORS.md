# Behaviours — extracted from the reference's theme.js

## Boot
- Loader: CSS-driven opening lines ("Your workplace has the answer." /
  "Ask Kodexa to find it."), spinner, "LOADING…". When assets are in and the
  first line's `animationend` has fired, the loader plays out (lines wipe up,
  "Completed", fade 0.5s) — expedited variant if assets beat the text.
- On reveal: smooth scroll starts (ASScroll ease 0.075 → Lenis lerp 0.075),
  scroll reveals are armed, the particle cloud flies in over 3s (per-particle
  delay by height, quintic in-out), the cloud's base rotation eases −45° → 0,
  and the grain layer opens as a circle from the centre over 2s.
- `?skiploader` skips the loader.

## Particles (src/lib/particles)
- 10,000 instanced tetrahedron-frame meshes (7,000 on phones), positions from
  `pos-33.exr`, per-form scale `sc-33.png`, colour `cd-33.png` (×1.3).
- Forms, in scroll order: brain, lightbulb, sphere, logo (replaced by a 3D K).
- `sectionProgress = index + |top| / height` of the section at the viewport
  top. Pose functions (choreography.ts) are the reference's clamp/map terms
  verbatim: offset x/y, explode, radius factor (4.35 base), form progress,
  rotation y/z. Everything eases at 0.1/frame (rotation 0.075).
- Targets: form blend (bulb→sphere sweeps by x), explode = pos × U(1,6) with a
  per-particle delay; particles chase targets on a spring (k 0.006 ± 1e-4,
  friction 0.892) — CPU port of the two GPU simulation passes.
- Tumble: rotation about (0,1,1) by simplex(pos×0.619) + time.
- Hover: within 1.25 units (+ cursor speed) pyramids orbit on sin/cos paths,
  grow by 0.75 and wash to grey 0.45; disabled while exploded.
- Camera leans −0.075·mx (y), 0.05·my (x).
- Foreground: 250 large pyramids, 4 colours, random alpha, parallax with the
  cursor, slow drift and spin; their group drifts with scroll (desktop).
- Investors (≥768px): solid pyramids (#FFB829/#189B81/#926AFF) tracking the
  icon boxes, spiralling in from (startX, 3000, −10000) with elastic.out(0.8,
  1.2) when scrolled into view; the name reveals at 80% of the flight;
  parallax −speed·200·ramp(5.2→6.5).
- Post: grain (sin·sin pattern, α 0.149), bloom (threshold 0.159; strength
  tuned to 0.1 to match pixel samples), vignette (offset 0.3, darkness 4).

## Header
- Scroll > 1px: blurred background scales in, bar drops its 1rem offset,
  wordmark letters slide up out of their clip (stagger 0.05, expo.out 1s).
- Hovering the compact logo slides the wordmark back in; leaving hides it.

## Nav
- Link hover: letters bob −15% in sequence (yoyo). Active item follows the
  section at the top of the viewport.
- Anchor links: black mask + spinning mark (0.5s in), jump, mask out at 2.3s.
- Phones: round purple toggle; menu background scales in and items fade in
  staggered.

## Scroll reveals (`data-animate-from`)
- `splitTextRotateIn`: lines masked, rise from 120% (optionally rotated),
  1.5s power3.out, stagger 0.1 (power1.in), once, start "top bottom".
- Team heading / investors text: scrubbed y parallax (−5vw / 2vw).

## Team slider
- 18 slides (3 people × 6) on a strip; prev/next move one card (0.5s),
  wrapping invisibly. Active card: colour + scale 1.2, others greyed.
- Role and name wipe in character by character; social icons pop in.

## Cookie notice
- Shown until accepted; accept stores `cookie_notice_accepted=true` for a
  month.

## Responsive
- ≥1366: sections 150vh tall, 10rem side padding. rem = 0.8333vw (min 12px).
- <768: phone choreography (radius 2.5, cloud high on screen, no front-cone
  drift), investor PNG icons instead of WebGL pyramids, mobile menu.
