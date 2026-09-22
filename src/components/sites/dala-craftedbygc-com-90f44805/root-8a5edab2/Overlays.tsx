import { SpinnerSvg } from "../shared/icons";

/** Full-screen loader shown until the scene is ready. */
export function SiteLoader() {
  return (
    <div className="site-loader | js-site-loader">
      <div className="site-loader__background" />
      <div className="site-loader__content">
        <div className="site-loader__main">
          <div className="site-loader__spinner | js-site-loader-spinner">
            <SpinnerSvg className="site-loader__spinner-svg | js-site-loader-spinner-svg" />
          </div>
          <div className="site-loader__heading | js-site-loader-heading">
            <div className="site-loader__heading-text">
              <div className="site-loader__heading-inner | js-site-loader-heading-text">
                Your workplace has the answer.
              </div>
            </div>
            <div className="site-loader__heading-text">
              <div className="site-loader__heading-inner | js-site-loader-heading-text">
                Ask Kodexa to find it.
              </div>
            </div>
          </div>
        </div>
        <div className="site-loader__info d-flex justify-between items-end">
          <div className="site-loader__loading">
            <div className="d-flex overflow-hidden">
              <div className="site-loader__loading-text | js-site-loader-loading-text">LOADING</div>
            </div>
            <span className="site-loader__ellipsis | js-site-loader-ellipses">
              <div className="site-loader__ellipsis-wrapper | js-site-loader-ellipses-wrapper">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </span>
          </div>
          <div className="site-loader__completed | js-site-loader-completed-text">
            <span>Completed</span>
          </div>
          <div className="site-loader__progress | js-site-loader-progress">
            <span className="js-site-loader-progress-digit" />
            <span className="js-site-loader-progress-digit" />
            <span className="js-site-loader-progress-digit">0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Black wipe with a spinning mark, used when jumping to an anchor. */
export function NavTransitionMask() {
  return (
    <>
      <div className="nav-transition-mask-bg | js-nav-transition-mask-bg" />
      <div className="nav-transition-mask js-nav-transition-mask">
        <div className="nav-transition-mask__spinner | js-nav-transition-mask-spinner">
          <SpinnerSvg className="nav-transition-mask__spinner-svg | js-nav-transition-mask-spinner-svg" />
        </div>
      </div>
    </>
  );
}

export function CookieNotice() {
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-body"
      className="cookie-notice fixed | js-cookie-notice"
    >
      <div className="d-flex items-center">
        <div className="flex-grow pr-1">
          <div className="sr" id="cookie-notice-title">
            Cookie consent
          </div>
          <div id="cookie-notice-body" className="cookie-notice__body t-500">
            This website uses cookies.{" "}
            <a href="#cookies" className="cookie-notice__link t-600" target="_blank" rel="noreferrer noopener">
              Learn more<span className="sr"> about how we use Cookies</span>
            </a>
          </div>
        </div>
        <div className="flex-no-shrink d-flex">
          <button
            type="button"
            className="btn t-16 t-lh-1.2 t-14@xs t-lh-1.4@xs t-16@sm t-lh-1.2@sm -t-ls-0.025 t-600 t-uppercase | js-cookie-notice-toggle"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
