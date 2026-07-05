/**
 * Projects section content — the featured project, the secondary project, and
 * the GitHub callout.
 */
export interface Project {
  meta: string;
  cta: string;
  title: string;
  description: string;
  href: string;
  chips?: string[];
}

export const featured: Project = {
  meta: 'LIVE · WITH USERS',
  cta: 'VISIT ↗',
  title: 'free-planning-poker.com',
  description:
    'Real-time planning poker for agile teams — fast, free, and running in production.',
  href: 'https://free-planning-poker.com/',
  chips: ['Real-time', 'Full-stack', 'Self-hosted'],
};

export const rollhook: Project = {
  meta: 'CI TOOLING',
  cta: 'VISIT ↗',
  title: 'rollhook.com',
  description: 'Zero-downtime rolling Docker Compose deployments via webhooks.',
  href: 'https://rollhook.com/',
};

export const github = {
  title: 'More on GitHub',
  description: 'Open source & experiments',
  handle: '@jkrumm ↗',
  href: 'https://github.com/jkrumm',
};
