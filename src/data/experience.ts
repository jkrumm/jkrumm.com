/**
 * Experience section content — the lede overview and the role timeline.
 */
export const overview = {
  summary:
    'I design architecture, lead delivery, and mentor engineers — turning ambiguous problems into systems teams can build on.',
  focus: 'Architecture & Leadership',
  coreStack: 'TypeScript · Node · Cloud',
};

/** A single title held within a company (a rung of the promotion ladder). */
export interface Position {
  title: string;
  period: string;
}

export interface Role {
  /** Overall span at the company (e.g. the widest range of its positions). */
  period: string;
  current?: boolean;
  /** Current / most-senior title — headlines a single-title entry, secondary on a ladder entry. */
  title: string;
  /** Clean company name (no leading separator — the template adds one where needed). */
  company: string;
  scope: string;
  highlights: string[];
  stack: string[];
  /**
   * Optional promotion ladder, NEWEST FIRST (including the current title). When
   * present the entry renders as a company node: the company headlines the row
   * and the expanded body opens with this ladder before the shared tenure
   * narrative. Omit it for a plain single-title role.
   *
   * NOTE: placeholder content — replace titles/dates (and collapse or split
   * companies) with the real history; the layout stays the same.
   */
  positions?: Position[];
}

export const roles: Role[] = [
  {
    period: '2020 — NOW',
    current: true,
    title: 'Tech Lead',
    company: 'Product company, Munich',
    positions: [
      { title: 'Tech Lead', period: '2023 — NOW' },
      { title: 'Senior Full-Stack Developer', period: '2020 — 2023' },
    ],
    scope:
      'Own the architecture of a full-stack platform. Lead a cross-functional team, set engineering standards, and keep releases boring.',
    highlights: [
      'Own end-to-end architecture decisions',
      'Lead a cross-functional team and set engineering standards',
      'Mentor engineers',
    ],
    stack: ['TypeScript', 'Node', 'Cloud', 'Architecture'],
  },
  {
    period: '2017 — 2020',
    title: 'Senior Full-Stack Developer',
    company: 'SaaS scale-up',
    scope:
      'Built and scaled core product features end-to-end, from data model to UI, and introduced type-safe APIs across the stack.',
    highlights: [
      'Built and scaled core product features end-to-end',
      'Introduced type-safe APIs across the stack',
      'Owned features from data model to UI',
    ],
    stack: ['TypeScript', 'React', 'Node', 'Postgres', 'API Design'],
  },
  {
    period: '2014 — 2017',
    title: 'Full-Stack Developer',
    company: 'Digital agency',
    scope:
      'Delivered web products for a range of clients — the foundation for a systems-first way of building.',
    highlights: [
      'Delivered web products for a diverse client base',
      'Built a systems-first approach to development',
      'Full-stack delivery from concept to launch',
    ],
    stack: ['TypeScript', 'React', 'Node', 'CSS', 'Testing'],
  },
];

export const resumeHref = '/resume';
