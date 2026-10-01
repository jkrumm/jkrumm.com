/**
 * Site-wide constants — the single source of truth for identity, SEO metadata
 * and social links. Imported by the layout, SEO components and chrome.
 */
export const SITE = {
  name: 'Johannes Krumm',
  title: 'Johannes Krumm — Tech Lead, Software Architecture & Agentic Engineering',
  tagline: 'Tech Lead · Software Architecture · Agentic Engineering',
  description:
    'Johannes Krumm is a tech lead in Munich. I own a core domain at IU ' +
    'International University, design event-driven systems with DDD and Kafka, ' +
    'and build AI agents that run in production.',
  /** Production origin. Local dev is served under https://jkrumm.test. */
  url: 'https://jkrumm.com',
  locale: 'en',
  /** Open Graph image, resolved against `url` at build time. */
  ogImage: '/og.png',
} as const;

export const AUTHOR = {
  firstName: 'Johannes',
  lastName: 'Krumm',
  jobTitle: 'Tech Lead',
  /** schema.org `knowsAbout` — topical-authority signals. */
  knowsAbout: [
    'Software Architecture',
    'Domain-Driven Design',
    'Event-Driven Architecture',
    'Apache Kafka',
    'Agentic Engineering',
    'AI Agents',
    'Full-Stack Development',
    'TypeScript',
    'Node.js',
    'Cloud Infrastructure',
    'Docker',
    'DevOps',
    'Technical Leadership',
  ],
} as const;

export const LOCATION = {
  city: 'Munich',
  countryCode: 'DE',
  region: 'CET',
  timeZone: 'Europe/Berlin',
} as const;

/**
 * Self-hosted Umami analytics. The website ID is public by design (it ships in
 * every page); the tag renders only in production builds. `src` uses the
 * renamed `p.js` collector, not the default `script.js`, to dodge ad/tracker
 * blocklists.
 */
export const UMAMI = {
  src: 'https://umami.jkrumm.com/p.js',
  websiteId: '085d08a0-95b5-44ff-90c8-9534d2a20f02',
} as const;

export const SOCIAL = {
  github: 'https://github.com/jkrumm',
  githubHandle: '@jkrumm',
  linkedin: 'https://www.linkedin.com/in/johannes-krumm/',
  /** Intentional fill-in slot — see the Contact section. */
  email: '',
} as const;
