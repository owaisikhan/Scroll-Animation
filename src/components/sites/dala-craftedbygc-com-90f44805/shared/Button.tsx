/** The reference's pill button with its green clip-path hover wash. */
export function PillButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="btn t-16 t-14@xs t-16@sm t-ls-0.025 t-600 t-uppercase"
      aria-label={label}
      href={href}
      target="_blank"
      rel="noopener"
    >
      <span className="btn__text pointer-events-none">{label}</span>
      <div className="btn__hover pointer-events-none" aria-hidden="true" />
    </a>
  );
}

/** Kodexa has no sign-up form yet, so access requests go to its inbox. */
export const CONTACT_EMAIL = "Kodexa77@gmail.com";
export const REQUEST_ACCESS_URL = `mailto:${CONTACT_EMAIL}?subject=Request%20access`;
