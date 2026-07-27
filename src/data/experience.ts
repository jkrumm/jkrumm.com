/**
 * Experience — the career ladder and education.
 *
 * Renders as a two-track grid (`96px date | 1fr content`) with the dates in
 * mono tabular numerals. The `period` strings use the open-ended microformat:
 * `2019 –` for a current role, `2017 – 18` for a closed one. Keep them literal
 * — they are typeset, not parsed.
 */

/** A title held within a company — a rung of the ladder, newest first. */
export interface Position {
  title: string;
  /** Start year only; the row above it implies the end. */
  since: string;
}

export interface Role {
  /** Open-ended microformat, e.g. `2019 –` or `2014 – 18`. */
  period: string;
  company: string;
  location: string;
  /** Newest first. A single-entry ladder renders as a plain title line. */
  positions: Position[];
  current?: boolean;
}

export const roles: Role[] = [
  {
    period: '2019 –',
    company: 'IU International University',
    location: 'Munich',
    current: true,
    positions: [
      { title: 'Tech Lead', since: '2023' },
      { title: 'Senior Developer', since: '2020' },
      { title: 'Mid-level Developer', since: '2019' },
    ],
  },
  {
    period: '2017 – 18',
    company: 'SqueTrade',
    location: 'San Francisco',
    positions: [
      { title: 'Data Engineer', since: '2018' },
      { title: 'Intern', since: '2017' },
    ],
  },
  {
    period: '2014 – 18',
    company: 'Edelweiss',
    location: 'Munich',
    positions: [{ title: 'Frontend Developer', since: '2014' }],
  },
];

export interface Education {
  period: string;
  degree: string;
  institution: string;
}

export const education: Education[] = [
  {
    period: '2014 – 18',
    degree: 'B.Sc. Computer Science and Economics',
    institution: 'Hochschule München',
  },
];

export const resumeHref = '/resume';
