/**
 * Projects — one wide hero, then a 2×2 grid of four, then the minor tools.
 *
 * All three tiers render as borderless rows; the tier difference is DENSITY,
 * not a second visual language (featured rows carry a description + stack
 * line, minor rows are one line). Don't add a container to either.
 *
 * Featured rows are DERIVED from the career fact base
 * (src/data/career/facts.ts, `web` channel) so the homepage, /resume and the
 * PDF never disagree. Edit them there. The minor tools are site-only.
 */
import { SITE } from '@/consts';
import { projects } from './career/facts';
import { pick } from './career/resolve';

export interface Project {
  id: string;
  name: string;
  /** One sentence. Says what it does and, where there is one, the number that matters. */
  description: string;
  /** Longer paragraph shown in the hover preview panel. */
  details?: string;
  /** Preview screenshot (CDN URL), 16:10. Absent = text-only preview. */
  image?: string;
  /** `·`-joined at render time. Mono, faint — this is data, not decoration. */
  stack: string[];
  href: string;
  /** Rendered right-aligned, mono, tabular. Omit for undated work. */
  year?: string;
  /** Off-site link — adds the ↗ affordance and rel/target. */
  external?: boolean;
}

export const featured: Project[] = projects.map((project) => {
  const internal = project.href.startsWith(SITE.url);
  return {
    id: project.id,
    name: project.name,
    description: pick(project.text, 'web'),
    details: project.details,
    image: project.image,
    stack: project.stack,
    href: internal ? project.href.slice(SITE.url.length) : project.href,
    year: project.year,
    external: !internal,
  };
});

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
    name: 'ntfy-mac',
    description: 'Forwards ntfy notifications to macOS',
    href: 'https://github.com/jkrumm/ntfy-mac',
  },
];
