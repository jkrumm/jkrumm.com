/**
 * The sidebar rail — identity, the link row, and the section nav.
 *
 * The nav ids double as the homepage section anchors and as the scroll-spy
 * targets (`[data-section]`), so this list is the single source of truth for
 * "what sections exist" — adding one here and adding the matching section to
 * `src/pages/index.astro` is the whole change.
 */
import { SOCIAL } from '@/consts';
import { identity } from '@/data/career/facts';

export interface NavItem {
  id: string;
  label: string;
}

export const navItems: NavItem[] = [
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'activity', label: 'Activity' },
  { id: 'writing', label: 'Writing' },
  { id: 'contact', label: 'Contact' },
];

export interface SiteNavItem {
  href: string;
  label: string;
}

/**
 * The rail's `sections` on off-stage surfaces (guide/blog indexes, stub pages)
 * that aren't the homepage — a way around the site rather than a TOC. The
 * current destination gets a static active dot (`Sidebar` compares
 * `Astro.url.pathname`); there is no scroll-spy for these.
 */
export const siteNavItems: SiteNavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/guide', label: 'Guide' },
  { href: '/blog', label: 'Blog' },
  { href: '/resume', label: 'Resume' },
];

export interface ProfileLink {
  label: string;
  href: string;
  /** External links get the ↗ affordance and rel/target. */
  external?: boolean;
}

/**
 * Destinations that are NOT homepage sections. Anything with an entry in
 * `navItems` above must not appear here — Contact used to, so the rail listed
 * it twice, four lines apart, and the duplicate was what forced this row to
 * wrap onto a second line.
 */
export const profileLinks: ProfileLink[] = [
  { label: 'Resume', href: '/resume' },
  { label: 'GitHub', href: SOCIAL.github, external: true },
  { label: 'LinkedIn', href: SOCIAL.linkedin, external: true },
  { label: 'Email', href: `mailto:${identity.email}` },
];

export const profile = {
  name: 'Johannes Krumm',
  title: 'Tech Lead · Architecture · Agentic Engineering',
  /** One sentence. The sidebar is a rail, not a bio page. */
  bio: 'I lead a team on a university ERP, design domain-driven systems and build agents that run in production.',
  /**
   * Sidebar portrait. `null` renders the neutral placeholder tile — swap in a
   * CDN URL (see the `/img` skill) rather than adding a file to `public/`.
   */
  avatar: null as string | null,
  avatarAlt: 'Johannes Krumm',
} as const;
