import ParticleCanvas from "@/components/ParticleCanvas";
import SiteHeader from "@/components/SiteHeader";
import Loader from "@/components/Loader";
import CookieBanner from "@/components/CookieBanner";
import {
  Footer,
  Globe,
  Hero,
  Intro,
  Lightbulb,
  Manifesto,
  Team,
  Transition,
} from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Loader />
      <ParticleCanvas />
      <SiteHeader />

      <main className="relative z-10">
        <Hero />
        <Intro />
        <Manifesto />
        <Lightbulb />
        <Transition />
        <Globe />
        <Team />
        <Footer />
      </main>

      <CookieBanner />
    </>
  );
}
