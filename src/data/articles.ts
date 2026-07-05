/**
 * Writing section content — the pinned feature article and the recent list.
 */
export interface PinnedArticle {
  tag: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readingTime: string;
  href: string;
}

export interface RecentArticle {
  date: string;
  title: string;
  tags: string;
  href: string;
}

export const pinned: PinnedArticle = {
  tag: 'PINNED',
  title: 'Zero-downtime deploys with rolling Docker Compose',
  excerpt:
    'How Rollhook rolls containers one by one behind a proxy — health checks, draining, and webhook-driven releases with no dropped requests.',
  date: '2026.06',
  category: 'INFRASTRUCTURE',
  readingTime: '9 MIN',
  href: '/blog',
};

export const recent: RecentArticle[] = [
  {
    date: '2026.05',
    title: 'Designing my AI coding setup',
    tags: 'AGENTS · MODELS · GUARDRAILS',
    href: '/blog',
  },
  {
    date: '2026.03',
    title: 'Self-hosting everything: my HomeLab',
    tags: 'PROXMOX · DOCKER · VPS',
    href: '/blog',
  },
  {
    date: '2026.01',
    title: 'Type-safe full-stack: tRPC + Drizzle',
    tags: 'TYPESCRIPT · DX',
    href: '/blog',
  },
  {
    date: '2025.11',
    title: 'Shipping Free Planning Poker',
    tags: 'PRODUCT · REAL-TIME',
    href: '/blog',
  },
];

export const allArticlesHref = '/blog';
