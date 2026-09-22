import "../shared/dala.css";
import { Controller } from "./Controller";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Introduction } from "./Introduction";
import { Landing } from "./Landing";
import { ManifestoIntro, ManifestoLightbulb, ManifestoWorld } from "./Manifesto";
import { CookieNotice, NavTransitionMask, SiteLoader } from "./Overlays";
import { Team } from "./Team";

/**
 * Kodexa's landing page: a clone of dala.craftedbygc.com, section for
 * section, over the particle scene (brain → lightbulb → sphere → K).
 */
export function KodexaPage() {
  return (
    <>
      <Header />
      <CookieNotice />
      <SiteLoader />
      <NavTransitionMask />
      <main>
        <Landing />
        <Introduction />
        <ManifestoIntro />
        <ManifestoLightbulb />
        <ManifestoWorld />
        <Team />
        <Footer />
      </main>
      <Controller />
    </>
  );
}
