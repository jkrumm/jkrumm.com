/**
 * Observable Plot renders to static SVG at BUILD time (linkedom, no runtime
 * DOM) — Plot's options are literal color strings baked into the SVG markup,
 * not the app's live CSS cascade, so a build-time render can never react to a
 * runtime `[data-theme]` flip on its own.
 *
 * Fix: feed Plot these literal sentinel hex values (they double as the LIGHT
 * design tokens, so a chart still looks correct if the swap step is ever
 * skipped), then rewrite every sentinel to its `var(--chart-N)` / ink-ramp
 * equivalent in the already-rendered SVG string via `swapToCssVars`. The
 * browser then resolves the real color from whichever theme is active at
 * paint time, same as any other themed element.
 *
 * PALETTE is the single source of truth: it drives both the sentinel values
 * handed to Plot (RANGE/ACCENT/FAINT/INK) and the CSS-var swap, so they
 * cannot drift apart. ACCENT/FAINT/INK mirror global.css's light
 * --accent/--faint/--ink; STEEL/CLAY/MOSS are chart-only categorical series
 * hues with no other CSS-token counterpart.
 */

// [sentinel hex fed to Plot, CSS var it resolves to at paint time]
const CHART_HUES = [
  ['#0084d1', 'var(--chart-1)'], // = light --accent
  ['#908983', 'var(--chart-2)'], // STEEL
  ['#a8763f', 'var(--chart-3)'], // CLAY
  ['#5a8c6e', 'var(--chart-4)'], // MOSS
] as const;

const INK_RAMP = [
  ['#737376', 'var(--faint)'], // = light --faint
  ['#262629', 'var(--ink)'], // = light --ink
] as const;

const PALETTE = [...CHART_HUES, ...INK_RAMP];

export const ACCENT = CHART_HUES[0][0];
export const FAINT = INK_RAMP[0][0];
export const INK = INK_RAMP[1][0];

/** Sentinel hexes for a categorical series, in --chart-1..4 order. */
export const RANGE = CHART_HUES.map(([hex]) => hex);
/** CSS-var equivalents of RANGE, for markup rendered outside Plot (e.g. the legend). */
export const RANGE_CSS_VARS = CHART_HUES.map(([, cssVar]) => cssVar);

/** Rewrite every sentinel hex in a rendered SVG string to its CSS var equivalent. */
export function swapToCssVars(svg: string): string {
  return PALETTE.reduce((acc, [hex, cssVar]) => acc.replace(new RegExp(hex, 'gi'), cssVar), svg);
}
