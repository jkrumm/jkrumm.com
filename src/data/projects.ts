/**
 * Projects — four featured entries, then the minor tools.
 *
 * Both tiers render as borderless rows; the tier difference is DENSITY, not a
 * second visual language (featured rows carry a description + stack line and
 * sit 24px apart, minor rows are one line 8px apart). Don't add a container to
 * either.
 */
export interface Project {
  name: string;
  /** One sentence. Says what it does and, where there is one, the number that matters. */
  description: string;
  /** `·`-joined at render time. Mono, faint — this is data, not decoration. */
  stack: string[];
  href: string;
  /** Rendered right-aligned, mono, tabular. Omit for undated work. */
  year?: string;
  /** Off-site link — adds the ↗ affordance and rel/target. */
  external?: boolean;
}

export const featured: Project[] = [
  {
    name: 'FreePlanningPoker',
    description:
      'Real-time planning poker for agile teams — 10k users and 170k estimates, free and no signup.',
    stack: ['Next.js', 'WebSocket', 'Postgres'],
    href: 'https://free-planning-poker.com/',
    year: '2023',
    external: true,
  },
  {
    name: 'Claude, Hermes, VPS & HomeLab',
    description:
      'How I run 8 apps and over 50 containers, and the senior-developer Claude coding setup driving them.',
    stack: ['Claude Code', 'Docker', 'Tailscale'],
    href: '/guide/personal-stack',
    year: '2026',
  },
  {
    name: 'RollHook',
    description: 'Zero-downtime rolling deployments for Docker Compose, triggered by webhook.',
    stack: ['Go', 'Docker Compose'],
    href: 'https://rollhook.com/',
    year: '2025',
    external: true,
  },
  {
    name: 'BasaltUI',
    description: 'A React design system optimized for agents — themed charts, shell and content.',
    stack: ['Mantine', 'visx', 'Vercel AI SDK'],
    href: 'https://github.com/jkrumm/basalt-ui',
    year: '2026',
    external: true,
  },
];

/** One line each — name, then what it does. No stack line, no year. */
export interface MinorProject {
  name: string;
  description: string;
  href: string;
}

export const minor: MinorProject[] = [
  {
    name: 'sy-serendipity',
    description: 'Website for a charter sailing yacht',
    href: 'https://github.com/jkrumm/sy-serendipity',
  },
  {
    name: 'clawbar',
    description: 'Claude subscription usage in the Mac menu bar',
    href: 'https://github.com/jkrumm/clawbar',
  },
  {
    name: 'ntfy-mac',
    description: 'Forwards ntfy notifications to macOS',
    href: 'https://github.com/jkrumm/ntfy-mac',
  },
  {
    name: 'bun-email-api',
    description: 'Resend wrapper with AI spam detection',
    href: 'https://github.com/jkrumm/bun-email-api',
  },
];
