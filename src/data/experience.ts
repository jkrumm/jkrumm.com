/**
 * Experience section content — the lede overview and the role timeline.
 */
export const overview = {
  summary:
    'I design architecture, lead delivery, and mentor engineers — turning ambiguous problems into systems teams can build on.',
  focus: 'Architecture & Leadership',
  coreStack: 'TypeScript · Node · Cloud',
};

export interface Role {
  period: string;
  current?: boolean;
  title: string;
  company: string;
  scope: string;
}

export const roles: Role[] = [
  {
    period: '2022 — NOW',
    current: true,
    title: 'Tech Lead',
    company: '· Product company, Munich',
    scope:
      'Own the architecture of a full-stack platform. Lead a cross-functional team, set engineering standards, and keep releases boring.',
  },
  {
    period: '2019 — 2022',
    title: 'Senior Full-Stack Developer',
    company: '· SaaS scale-up',
    scope:
      'Built and scaled core product features end-to-end, from data model to UI, and introduced type-safe APIs across the stack.',
  },
  {
    period: '2016 — 2019',
    title: 'Full-Stack Developer',
    company: '· Digital agency',
    scope:
      'Delivered web products for a range of clients — the foundation for a systems-first way of building.',
  },
];

export const resumeHref = '/resume';
