import { PillButton, REQUEST_ACCESS_URL } from "../shared/Button";
import { KodexaLogo, NavToggleSvg } from "../shared/icons";

const NAV = [
  { name: "manifesto", label: "Manifesto", anchor: "manifesto", href: "/#manifesto" },
  { name: "team", label: "Team", anchor: "team", href: "/#team" },
  { name: "blog", label: "Blog", href: "#" },
];

export function Header() {
  return (
    <>
      <button className="nav-toggle js-nav-toggle">
        <NavToggleSvg />
        <span className="sr">Toggle Mobile Navigation</span>
      </button>
      <div className="header-blur-block" />
      <header className="header js-header">
        <div className="header__bg js-header-bg">
          <div className="header__bg-inner" />
        </div>
        <div className="header__inner js-header-inner">
          <button className="header__logo | js-header-logo" data-anchor-link="landing">
            <KodexaLogo textClassName="js-header-logo-text" />
            <span className="sr">Kodexa</span>
          </button>
          <div className="header__cta mr-4">
            <PillButton href={REQUEST_ACCESS_URL} label="Request Access" />
          </div>
          <h1 className="sr">Kodexa</h1>
          <nav className="nav js-nav">
            <div className="nav__bg js-nav-bg">
              <div className="nav__bg-inner" />
            </div>
            <ul className="nav__list js-nav-list">
              {NAV.map((item) => (
                <li key={item.name} className="nav__item | js-nav-item" data-section-name={item.name}>
                  {item.anchor ? (
                    <a
                      href={item.href}
                      aria-label={item.label}
                      className="nav__link js-nav-link"
                      data-anchor-link={item.anchor}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <a
                      className="nav__link js-nav-link"
                      aria-label={item.label}
                      href={item.href}
                      target="_blank"
                      rel="noopener"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
              <li className="nav__cta | js-nav-item">
                <PillButton href={REQUEST_ACCESS_URL} label="Request Access" />
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
