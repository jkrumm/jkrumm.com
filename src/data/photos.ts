/**
 * Photography section content — the gallery preview tiles.
 */
export interface Photo {
  caption: string;
  span: 'wide' | 'narrow';
}

export const tiles: Photo[] = [
  { caption: 'MUNICH · 2026 · 35MM', span: 'wide' },
  { caption: 'ALPS · 2025', span: 'narrow' },
  { caption: 'STREET · 2025', span: 'narrow' },
  { caption: 'TRAVEL · 2024', span: 'narrow' },
  { caption: 'PORTRAIT · 2024', span: 'wide' },
];

export const galleryHref = '/photos';
