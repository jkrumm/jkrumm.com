/**
 * Site-wide constants — the single source of truth for identity, SEO metadata
 * and social links. Imported by the layout, SEO components and chrome.
 */
export const SITE = {
  name: 'Johannes Krumm',
  title: 'Johannes Krumm — Tech Lead & Senior Full-Stack Developer',
  tagline: 'Tech Lead / Senior Full-Stack Developer',
  description:
    'Johannes Krumm is a Tech Lead and Senior Full-Stack Developer in Munich. ' +
    'I build resilient systems and lead teams that ship — with a bias for clean ' +
    'architecture and software that lasts.',
  /** Production origin. Local dev is served under https://jkrumm.test. */
  url: 'https://jkrumm.com',
  locale: 'en',
  /** Open Graph image, resolved against `url` at build time. */
  ogImage: '/og.png',
} as const;

export const AUTHOR = {
  firstName: 'Johannes',
  lastName: 'Krumm',
  jobTitle: 'Tech Lead & Senior Full-Stack Developer',
  /** schema.org `knowsAbout` — topical-authority signals. */
  knowsAbout: [
    'Software Architecture',
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

export const SOCIAL = {
  github: 'https://github.com/jkrumm',
  githubHandle: '@jkrumm',
  linkedin: 'https://www.linkedin.com/in/johannes-krumm/',
  /** Intentional fill-in slot — see the Contact section. */
  email: '',
} as const;
