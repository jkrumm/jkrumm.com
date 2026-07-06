/**
 * Bento section navigation on the home hero, and the bottom-bar progress dots.
 */
export interface NavItem {
  id: string;
  number: string;
  title: string;
  accent?: boolean;
}

export const navSections: NavItem[] = [
  { id: 'writing', number: '01', title: 'Writing' },
  { id: 'experience', number: '02', title: 'Experience' },
  { id: 'stack', number: '03', title: 'Personal Stack' },
  { id: 'projects', number: '04', title: 'Projects' },
  { id: 'photography', number: '05', title: 'Photography' },
  { id: 'contact', number: '06', title: 'Contact' },
];

export interface NavDot {
  id: string;
  name: string;
}

export const navDots: NavDot[] = [
  { id: 'home', name: 'Overview' },
  { id: 'writing', name: 'Writing' },
  { id: 'experience', name: 'Experience' },
  { id: 'stack', name: 'Stack' },
  { id: 'projects', name: 'Projects' },
  { id: 'photography', name: 'Photography' },
  { id: 'contact', name: 'Contact' },
];
