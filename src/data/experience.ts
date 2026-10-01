/**
 * Experience — the homepage's collapsible career ladder, DERIVED from the
 * career fact base (src/data/career/facts.ts). Edit roles, titles, context
 * and highlights there; this module only reshapes them for the two-track
 * accordion grid.
 *
 * The `period` strings are typeset, not parsed: `2021 – today` for a current
 * role, `2018 – 2020` for a closed one. Highlights render in FACT-BASE order —
 * there is no scoring/selection here (that only exists for the résumé, which
 * is tailored per target); the homepage shows every highlight for every role.
 */
import { education as careerEducation, roles as careerRoles } from './career/facts';
import { formatSpan, pick } from './career/resolve';

/** A title held within a company — a rung of the ladder, newest first. */
export interface Position {
  title: string;
  /** Start year only; the row above it implies the end. */
  since: string;
}

/** A bold-lead bullet shown when the role is expanded. */
export interface Highlight {
  id: string;
  lead: string;
  text: string;
}

export interface Role {
  id: string;
  period: string;
  company: string;
  location: string;
  /** Newest first. A single-entry ladder renders as a plain title line. */
  positions: Position[];
  /** Shown expanded, above the highlights. */
  context?: string;
  highlights: Highlight[];
  current?: boolean;
}

export const roles: Role[] = careerRoles.map((role) => ({
  id: role.id,
  period: formatSpan({ start: role.start, end: role.end }),
  company: role.company,
  location: role.location,
  current: !role.end,
  positions: role.positions.map((p) => ({ title: p.title, since: p.since.slice(0, 4) })),
  context: role.context ? pick(role.context, 'web') : undefined,
  highlights: role.highlights.map((h) => ({ id: h.id, lead: h.lead, text: pick(h.text, 'web') })),
}));

export interface Education {
  period: string;
  degree: string;
  institution: string;
}

export const education: Education[] = careerEducation.map((item) => ({
  period: formatSpan({ start: item.start, end: item.end }),
  degree: item.degree,
  institution: item.institution,
}));

export const resumeHref = '/resume';
