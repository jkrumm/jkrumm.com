/**
 * Career data model — the single source for the résumé PDF, the /resume page,
 * the homepage Experience/Projects sections and the LinkedIn export.
 *
 * Facts live once; PHRASING lives per channel. Every piece of prose is a
 * `Copy`: `cv` is required (terse, one line, résumé grammar — no "I", starts
 * with a verb or a noun phrase) and is the fallback for the other channels.
 * `web` is first person and a little warmer; `linkedin` is first person,
 * may run longer and carries plain-text only (LinkedIn renders no markup).
 */
export type Channel = 'cv' | 'web' | 'linkedin';

export interface Copy {
  cv: string;
  web?: string;
  linkedin?: string;
}

/**
 * What a highlight is evidence FOR. A target ranks highlights by these, so a
 * tag is a claim about the reader who cares, not a topic label.
 */
export type Tag =
  | 'architecture'
  | 'leadership'
  | 'domain'
  | 'backend'
  | 'frontend'
  | 'platform'
  | 'quality'
  | 'agentic';

export interface Highlight {
  id: string;
  /** Bold lead-in, 1–4 words. The eye scans these first. */
  lead: string;
  text: Copy;
  tags: Tag[];
  /** 1 = core (every target shows it), 2 = strong, 3 = filler cut first. */
  rank: 1 | 2 | 3;
}

export interface Position {
  title: string;
  /** `YYYY-MM` — the row above implies the end. */
  since: string;
}

export interface Role {
  id: string;
  company: string;
  href?: string;
  location: string;
  /** `YYYY-MM`. */
  start: string;
  /** `YYYY-MM`; absent = current. */
  end?: string;
  /** Newest first. */
  positions: Position[];
  /** One line of context: what the company/team is, the scale. */
  context?: Copy;
  highlights: Highlight[];
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  start: string;
  end: string;
  note?: string;
}

export interface Project {
  id: string;
  name: string;
  href: string;
  year: string;
  stack: string[];
  /** The one-liner every channel shows. */
  text: Copy;
  /** Web only: the longer paragraph in the homepage hover preview. */
  details?: string;
  /** Web only: preview screenshot (CDN URL). Absent = text-only preview. */
  image?: string;
  tags: Tag[];
  rank: 1 | 2 | 3;
}

/** One line of "how I work" — bold lead, then the claim. */
export interface Principle {
  id: string;
  lead: string;
  text: Copy;
}

export interface SkillGroup {
  id: string;
  label: string;
  items: string[];
  tags: Tag[];
}

export interface Pillar {
  id: string;
  label: string;
  text: Copy;
  tags: Tag[];
}

/**
 * A rendering of the same facts for one reader. Generic targets live in
 * `targets.ts` and are public; job-specific ones never are — see the `career`
 * skill for where those go.
 */
export interface Target {
  id: string;
  /** Human label, shown only in tooling output. */
  label: string;
  /** The line under the name. */
  headline: string;
  summary: Copy;
  /** Tags in priority order; a highlight's score is the best index it hits. */
  focus: Tag[];
  /** Bullets per role id; roles not listed render header-only. */
  bullets: Record<string, number>;
  projects: number;
  /** Skill group ids in print order; unlisted groups are dropped. */
  skills: string[];
  /** Text replacements by highlight/project id — tailoring without forking facts. */
  overrides?: Record<string, Partial<Copy>>;
  /** Private targets only: contact lines that must never reach the public repo. */
  contact?: { email?: string; phone?: string };
}
