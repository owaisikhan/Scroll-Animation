import { anim } from "../shared/anim";
import { PillButton, REQUEST_ACCESS_URL } from "../shared/Button";
import { KodexaLogo, SpriteIcon } from "../shared/icons";

const NAV_CLASS =
  "footer__nav__link t-16 t-lh-1.2 t-14@xs t-lh-1.4@xs t-16@sm t-lh-1.2@sm -t-ls-0.025 t-600 t-uppercase | js-nav-link";

export function Footer() {
  return (
    <div className="section footer | js-section">
      <div className="footer__head">
        <h2
          className="t-40 t-lh-1 t-48@sm t-lh-1.2@sm t-64@md t-lh-1.1@md -t-ls-0.03 t-400 mb-2"
          {...anim({ preset: "splitTextRotateIn", scrollTrigger: { start: "top bottom" } })}
        >
          Your workplace has the answer. Ask Kodexa to find it.
        </h2>
        <div className="d-flex justify-center">
          <PillButton href={REQUEST_ACCESS_URL} label="Request access" />
        </div>
      </div>
      <div className="footer__bar">
        <div className="footer__logo">
          <KodexaLogo />
          <span className="sr">Kodexa</span>
        </div>
        <div className="footer__copyright">
          <span className="footer__copyright__item">© 2026 Kodexa.</span>
          <span className="footer__copyright__item">All rights reserved.</span>
        </div>
        <ul className="footer__nav">
          <li className="footer__nav__item | js-nav-item" data-section-name="manifesto">
            <button className={NAV_CLASS} data-anchor-link="manifesto">Manifesto</button>
          </li>
          <li className="footer__nav__item | js-nav-item" data-section-name="team">
            <button className={NAV_CLASS} data-anchor-link="team">Team</button>
          </li>
          <li className="footer__nav__item | js-nav-item" data-section-name="blog">
            <a className={NAV_CLASS} href="#">Blog</a>
          </li>
          <li className="footer__nav__item | js-nav-item" data-section-name="privacy">
            <a className={NAV_CLASS} href="/privacy" target="_blank" rel="noopener">Privacy</a>
          </li>
          <li className="footer__nav__item | js-nav-item" data-section-name="terms">
            <a className={NAV_CLASS} href="/terms" target="_blank" rel="noopener">Terms</a>
          </li>
        </ul>
        <div className="footer__social">
          <a className="footer__social__link" href="#" rel="noopener" target="_blank">
            <span className="sr">LinkedIn</span>
            <SpriteIcon id="linkedin" className="footer__social__icon footer__social__icon--linkedin" />
          </a>
          <a className="footer__social__link" href="#" rel="noopener" target="_blank">
            <span className="sr">Twitter</span>
            <SpriteIcon id="twitter" className="footer__social__icon footer__social__icon--twitter" />
          </a>
          <a className="footer__social__link" href="mailto:Kodexa77@gmail.com" rel="noopener" target="_blank">
            <span className="sr">Email</span>
            <SpriteIcon id="email" className="footer__social__icon footer__social__icon--email" />
          </a>
        </div>
      </div>
    </div>
  );
}
