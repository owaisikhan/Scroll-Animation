/**
 * Downloads the assets the Kodexa clone reuses from dala.craftedbygc.com into
 * its namespaced public folder (Dala's own branding is left behind). Four
 * requests at a time, failing loudly.
 *
 * Usage: node scripts/download-assets-dala-craftedbygc-com-90f44805-root-8a5edab2.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ORIGIN = "https://dala.craftedbygc.com";
const OUT = path.resolve("public/sites/dala-craftedbygc-com-90f44805/shared");

const FILES = [
  ["fonts/PPNeueMontreal-Light.woff2", "fonts/PPNeueMontreal-Light.woff2"],
  ["fonts/PPNeueMontreal-Regular.woff2", "fonts/PPNeueMontreal-Regular.woff2"],
  ["fonts/PPNeueMontreal-SemiBold.woff2", "fonts/PPNeueMontreal-SemiBold.woff2"],
  ["images/svgsprite.svg", "images/svgsprite.svg"],
  ["images/dala-bullet.svg", "images/dala-bullet.svg"],
  ["images/team/haroun.jpg", "images/team/haroun.jpg"],
  ["images/team/poppy.jpg", "images/team/poppy.jpg"],
  ["images/team/joel.jpg", "images/team/joel.jpg"],
  ["images/investors/1.png", "images/investors/1.png"],
  ["images/investors/2.png", "images/investors/2.png"],
  ["images/investors/3.png", "images/investors/3.png"],
  ["images/investors/4.png", "images/investors/4.png"],
  ["images/investors/5.png", "images/investors/5.png"],
];

async function get([src, dest]) {
  const res = await fetch(`${ORIGIN}/${src}`);
  if (!res.ok) throw new Error(`${src}: HTTP ${res.status}`);
  const file = path.join(OUT, dest);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return dest;
}

for (let i = 0; i < FILES.length; i += 4) {
  const done = await Promise.all(FILES.slice(i, i + 4).map(get));
  done.forEach((d) => console.log("ok", d));
}
