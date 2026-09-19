/**
 * All site copy lives here. Swap these strings to re-skin the site —
 * nothing in the components or the WebGL layer hardcodes text.
 */

export const brand = {
  name: "Vela",
  legal: "© 2026 Vela Systems Ltd.",
  rights: "All rights reserved.",
  email: "careers@vela.example",
};

export const nav = {
  links: [
    { label: "Manifesto", href: "#manifesto" },
    { label: "Team", href: "#team" },
    { label: "Blog", href: "#blog" },
  ],
  cta: { label: "Request Access", href: "#request" },
};

export const loader = {
  line: "Your team already knows. Ask them all at once.",
  label: "Loading",
};

export const hero = {
  /** Rendered one word per line at display size. */
  headline: ["See", "what your", "team knows."],
  eyebrow: "Stop filing knowledge. Start finding it.",
  body: "Tap the shared memory of everyone you work with. Ask Vela a question and it pulls the answer out of whichever tool it was buried in. Spend your hours on the work itself, with the background you needed and none of the digging.",
  cta: { label: "Request Access", href: "#request" },
};

export const intro = {
  title: ["Move without", "second-guessing"],
  body: "Vela reads across every system your company runs on and assembles what it finds into one answer you can act on — so the call you make next is an informed one.",
};

/** The three full-bleed statements the particle cloud dissolves behind. */
export const manifesto = [
  [
    "This is a working day in your company. Thousands of pieces of hard-won knowledge, sitting in tools that never talk to each other.",
    "Close to a third of the week disappears into hunting for a document, a decision, or the one person who remembers why.",
  ],
  [
    "Trying to hold all of it together wears people down. The work stops feeling like progress and starts feeling like overhead.",
    "So you choose between interrupting someone who is already underwater, or guessing with half the picture and hoping it holds.",
  ],
  [
    "The tools meant to fix this age badly. Another library to groom, out of date the week after someone stops grooming it.",
    "None of them grasp what you are actually asking for, or what the work your team produces every day really means.",
  ],
];

export const lightbulb = {
  title: ["Turn questions", "into answers"],
  body: [
    "Vela is a live account of what your company knows, and it costs you none of the upkeep, budget, or politics that fragmented tools quietly demand.",
    "We join your systems together out of sight and return precisely the context you asked for, arranged so you can read it at a glance.",
    "Ask for the thing that unblocks you. Get an answer you can stand behind, sourced and current.",
  ],
};

export const globe = {
  title: ["Work worth", "doing"],
  body: [
    "We want working life to feel coherent and, now and then, delightful — measuring a good day by how much better the work got, not by how much of it there was.",
    "The best hours you have at work are the ones where you are absorbed, curious, and making something people need.",
    "Vela is built to return you to those hours: a tool shaped around how you actually think and work.",
  ],
};

export const team = {
  title: "Our team",
  members: [
    { name: "A. Marchetti", role: "Co-founder & CEO", initials: "AM" },
    { name: "R. Okonkwo", role: "Product Design Lead", initials: "RO" },
    { name: "S. Lindqvist", role: "Co-founder & CTO", initials: "SL" },
  ],
};

export const careers = {
  title: "Build with us.",
  body: "We are hiring deliberate, generous, curious people who care about how things feel to use. If that sounds like you, send a CV or portfolio and a note about what you want to make.",
  linkLabel: "Read more about our values",
};

export const investors = {
  title: "Our backers",
  body: "We are funded by operators and firms who have built this kind of thing before, and who are staying close while we do it.",
  /** Rendered as typeset wordmarks — no third-party logo files. */
  names: ["Northwind", "Ellis & Crowe", "Foundry Park", "Tandem Fund", "Rill Capital"],
  people: [
    { name: "J. Aldridge", note: "Co-founder, a lending marketplace" },
    { name: "M. Serrano", note: "Chief Product Officer, a people platform" },
  ],
};

export const footer = {
  callout: "Your team already knows. Ask them all at once.",
  cta: { label: "Request access", href: "#request" },
  columns: [
    { label: "Manifesto", href: "#manifesto" },
    { label: "Team", href: "#team" },
    { label: "Blog", href: "#blog" },
    { label: "Privacy", href: "#privacy" },
    { label: "Terms", href: "#terms" },
  ],
  social: [
    { label: "LinkedIn", href: "#" },
    { label: "Twitter", href: "#" },
    { label: "Email", href: "#" },
  ],
};

export const cookies = {
  text: "This website uses cookies.",
  link: "Learn more",
  accept: "Accept",
};
