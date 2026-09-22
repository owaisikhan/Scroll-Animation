# Page topology — dala.craftedbygc.com `/` (cloned as Kodexa)

Destination route: `/` (`src/app/page.tsx` → `KodexaPage`). Components live in
`src/components/sites/dala-craftedbygc-com-90f44805/root-8a5edab2/`, shared
pieces (ported stylesheet, icons, button, anim helper) in `../shared/`.

## Layers (back to front)
1. Fixed WebGL canvas (`z-negative`): particle cloud, 250 foreground pyramids,
   grain + circular reveal, investor pyramids (tablet+), bloom, vignette.
2. `<main>` flow content (sections below).
3. Fixed header (z 1000) + mobile nav toggle (z 1001).
4. Cookie notice (z 100), nav transition mask (z 9998/9999), site loader.

## Sections (`.js-section`, in order — index drives the particle choreography)
| # | Section | Height @1920×940 | Particle state |
|---|---------|------------------|----------------|
| 0 | Landing — "Unlock collective wisdom." | 100vh | brain, right (x 3) |
| 1 | Introduction — "Make decisions with confidence" (right-aligned) | 150vh | brain turns −90°, drifts left, grows |
| 2 | Manifesto intro — three centred screens of copy | 300vh | brain explodes, drifts right |
| 3 | "Spark lightbulb moments" (text right) | 150vh | lightbulb, left, tilted |
| 4 | "Build a better world of work" (text left) | 150vh | sphere, right |
| 5 | Team slider + "Build with us" + investors | ~214vh | explodes again |
| 6 | Footer — "Your workplace has the answer…" | 100vh | K (was the Dala mark), above centre |

Interaction models: landing/intro/manifesto are scroll-driven (reveals +
particles); team slider is click-driven; header is scroll-driven (>1px);
nav anchors are click-driven with a mask transition.
