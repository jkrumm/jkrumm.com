/**
 * Shared data for the Font Lab dev-toolbar app (font-lab.ts) and the
 * dev-only anti-FOUT guard injected by astro.config.mjs — single source of
 * truth so both runtimes agree on candidate ids/families/stylesheets. Pure
 * data, no `astro/toolbar` or DOM imports — safe to import from
 * astro.config.mjs at config-load time.
 */

export type Spacing = 'mono' | 'proportional';

export type FontSource = { href: string };

export interface FontCandidate {
  id: string;
  label: string;
  spacing: Spacing;
  /** Exact CSS font-family value once the stylesheet below has loaded. */
  family: string;
  /** Dev-time-only stylesheet — Google Fonts or a jsDelivr-hosted Fontsource package. */
  source: FontSource;
  /** npm package to reference in the generated astro.config.mjs snippet. */
  fontsourcePackage: string;
  weights: number[];
  blurb: string;
  /** CSS `font-stretch` value for a variable font's width (`wdth`) axis —
   * only set on candidates that tune width away from the default 100%. The
   * source stylesheet must request the matching `wdth` value/range (Google
   * Fonts css2 axis tags are alphabetical, e.g. `wdth,wght@88,400`) or the
   * browser has no narrower instance to select. */
  fontStretch?: string;
  /** Live-tunable variable axis ranges, [min, max] — presence of `wdth`/`wght`
   * renders a width/weight slider on this candidate's Font Lab card. Only
   * meaningful when the source stylesheet requests a continuous range on
   * that axis. */
  axes?: { wdth?: [number, number]; wght?: [number, number] };
}

export const STORAGE_KEY = 'jk-font-lab';

export const FALLBACK: Record<Spacing, string> = {
  mono: 'ui-monospace, SFMono-Regular, monospace',
  proportional: 'system-ui, sans-serif',
};

export const MONO_CANDIDATES: FontCandidate[] = [
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    spacing: 'mono',
    family: 'JetBrains Mono',
    source: { href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/jetbrains-mono',
    weights: [400, 500, 600, 700],
    blurb: 'Current code font — high x-height, unambiguous 0/O and 1/l/I.',
  },
  {
    id: 'geist-mono',
    label: 'Geist Mono',
    spacing: 'mono',
    family: 'Geist Mono',
    source: { href: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/geist-mono',
    weights: [400, 500, 600, 700],
    blurb: "Vercel's mono — sober and technical; wants a touch more letter-spacing at small sizes.",
  },
  {
    id: 'ibm-plex-mono',
    label: 'IBM Plex Mono',
    spacing: 'mono',
    family: 'IBM Plex Mono',
    source: { href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource/ibm-plex-mono',
    weights: [400, 500, 600, 700],
    blurb: 'Typewriter-prose character (Selectric-derived italic). Static weights only, no variable axis.',
  },
  {
    id: 'commit-mono',
    label: 'Commit Mono',
    spacing: 'mono',
    family: 'Commit Mono',
    source: { href: 'https://cdn.jsdelivr.net/npm/@fontsource/commit-mono@5/index.css' },
    fontsourcePackage: '@fontsource/commit-mono',
    weights: [400],
    blurb: "Deliberately neutral, built for reading comfort. Preview is weight 400 only (Fontsource's default index).",
  },
  {
    id: 'martian-mono',
    label: 'Martian Mono',
    spacing: 'mono',
    family: 'Martian Mono',
    source: { href: 'https://fonts.googleapis.com/css2?family=Martian+Mono:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/martian-mono',
    weights: [400, 500, 600, 700],
    blurb: 'Brutalist companion to Martian Grotesk — bold, distinctive, still legible small.',
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    spacing: 'mono',
    family: 'Fira Code',
    source: { href: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/fira-code',
    weights: [400, 500, 600, 700],
    blurb: 'Clean, wide-open letterforms from the Fira family. Ligatures mostly irrelevant outside code.',
  },
];

// Proportional siblings of a coding-font family (or standalone technical
// grotesks) — same engineered/geometric DNA as the mono set above, but
// normal per-glyph advance widths, so a wide "M" isn't crushed and a narrow
// "I" isn't padded out the way a true monospace forces at heading sizes.
// Ordered roughly floor → ceiling on character/severity: IBM Plex Sans/DM
// Sans/Source Sans 3 (too neutral), then the middle zone (Instrument Sans,
// Manrope, Plus Jakarta Sans, Onest — geometric character without going
// full grotesk), then the engineered/technical cluster (Hubot Sans,
// Geologica, Hanken Grotesk, Familjen Grotesk, Archivo — brand-tech/data-
// company DNA, more structured than the middle zone but less quirky than
// Space Grotesk), then Space Grotesk/Fira Sans/Geist Sans (most aggressive).
export const PROPORTIONAL_CANDIDATES: FontCandidate[] = [
  {
    id: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    spacing: 'proportional',
    family: 'IBM Plex Sans',
    source: { href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/ibm-plex-sans',
    weights: [400, 500, 600, 700],
    blurb: 'Sibling of IBM Plex Mono above — engineered/corporate-technical, but on the neutral side.',
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    spacing: 'proportional',
    family: 'DM Sans',
    source: { href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/dm-sans',
    weights: [400, 500, 600, 700],
    blurb: 'Low-contrast geometric sans (DeepMind-commissioned) — clean, rational, but light on character.',
  },
  {
    id: 'source-sans-3',
    label: 'Source Sans 3',
    spacing: 'proportional',
    family: 'Source Sans 3',
    source: { href: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/source-sans-3',
    weights: [400, 500, 600, 700],
    blurb: "Adobe's first open-source family, sibling of Source Code Pro — rational, readable, plain.",
  },
  {
    id: 'instrument-sans',
    label: 'Instrument Sans',
    spacing: 'proportional',
    family: 'Instrument Sans',
    source: { href: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/instrument-sans',
    weights: [400, 500, 600, 700],
    blurb: 'Precision-led neo-grotesque with subtle playfulness — sharp but not aggressive. Middle-zone pick.',
  },
  {
    id: 'manrope',
    label: 'Manrope',
    spacing: 'proportional',
    family: 'Manrope',
    source: { href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/manrope',
    weights: [400, 500, 600, 700],
    blurb: 'Modern geometric neo-grotesque, expressive yet composed. Previous --font-display default, replaced by Hubot Sans.',
  },
  {
    id: 'plus-jakarta-sans',
    label: 'Plus Jakarta Sans',
    spacing: 'proportional',
    family: 'Plus Jakarta Sans',
    source: { href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/plus-jakarta-sans',
    weights: [400, 500, 600, 700],
    blurb: 'Geometric, Futura-inspired, softened corners — neither cold nor overly friendly. Middle-zone pick.',
  },
  {
    id: 'onest',
    label: 'Onest',
    spacing: 'proportional',
    family: 'Onest',
    source: { href: 'https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/onest',
    weights: [400, 500, 600, 700],
    blurb: 'Soft-geometric hybrid (sits between Arial and Montserrat) — characterful but restrained. Middle-zone pick.',
  },
  {
    id: 'hubot-sans',
    label: 'Hubot Sans',
    spacing: 'proportional',
    family: 'Hubot Sans',
    // Continuous 2D range on both axes — matches astro.config.mjs's
    // weights: ['200 900'], which is what actually loads Hubot Sans as a
    // true variable font (one file, both axes live) rather than pinned
    // per-weight static instances. Same range here so the Font Lab sliders
    // can interpolate the whole space, not just the production default.
    source: { href: 'https://fonts.googleapis.com/css2?family=Hubot+Sans:wdth,wght@75..125,200..900&display=swap' },
    fontsourcePackage: '@fontsource-variable/hubot-sans',
    weights: [200, 900],
    fontStretch: '88%',
    axes: { wdth: [75, 125], wght: [200, 900] },
    blurb:
      "GitHub's engineered geometric sidekick to Mona Sans — technical precision, closest open-source match to a Palantir/data-company heading font. Shipped --font-display default, tuned to 88% on its real wdth axis (75-125% per github.com/github/hubot-sans). Also has an ital axis (0-1, a hard on/off switch, not a graded slider) — not exposed here since the site has no italic headings.",
  },
  {
    id: 'geologica',
    label: 'Geologica',
    spacing: 'proportional',
    family: 'Geologica',
    source: { href: 'https://fonts.googleapis.com/css2?family=Geologica:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/geologica',
    weights: [400, 500, 600, 700],
    blurb: "Has a variable Sharpness axis (not exposed here) from calm grotesk to angular/blueprint-technical — this preview is the mid-sharpness default cut.",
  },
  {
    id: 'hanken-grotesk',
    label: 'Hanken Grotesk',
    spacing: 'proportional',
    family: 'Hanken Grotesk',
    source: { href: 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/hanken-grotesk',
    weights: [400, 500, 600, 700],
    blurb: 'Subtly geometric, industrial-stoic character — engineered feel without going as angular as Space Grotesk.',
  },
  {
    id: 'familjen-grotesk',
    label: 'Familjen Grotesk',
    spacing: 'proportional',
    family: 'Familjen Grotesk',
    source: { href: 'https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/familjen-grotesk',
    weights: [400, 500, 600, 700],
    blurb: "Helvetica-like bones with squared curves and taut apertures — reads as 'engineered system', not 'designer font'.",
  },
  {
    id: 'archivo',
    label: 'Archivo',
    spacing: 'proportional',
    family: 'Archivo',
    source: { href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/archivo',
    weights: [400, 500, 600, 700],
    blurb: 'Technical workhorse built for digital interfaces, with a width axis (not exposed here) — data-dense, developer-tool DNA.',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    spacing: 'proportional',
    family: 'Space Grotesk',
    source: { href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/space-grotesk',
    weights: [400, 500, 600, 700],
    blurb: 'Proportional sibling of Space Mono — the most aggressive/angular of this set.',
  },
  {
    id: 'fira-sans',
    label: 'Fira Sans',
    spacing: 'proportional',
    family: 'Fira Sans',
    source: { href: 'https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/fira-sans',
    weights: [400, 500, 600, 700],
    blurb: 'Sibling of Fira Code above — Mozilla-commissioned humanist sans, clean technical proportions.',
  },
  {
    id: 'geist-sans',
    label: 'Geist Sans',
    spacing: 'proportional',
    family: 'Geist',
    source: { href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap' },
    fontsourcePackage: '@fontsource-variable/geist',
    weights: [400, 500, 600, 700],
    blurb: "Sibling of Geist Mono above — Vercel's proportional pair, built for screen legibility.",
  },
];
