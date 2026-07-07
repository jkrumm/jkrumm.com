// Observable Plot renders to static SVG at build time (linkedom, no runtime
// DOM) — these literals can't read CSS custom properties, so this file is the
// single source of truth for chart colors. Charts are light-theme only.
//
// FAINT/ACCENT mirror global.css's light --faint/--accent — keep them in sync
// by convention when those tokens change. STEEL/CLAY/MOSS are chart-only
// categorical series hues with no CSS-token counterpart (STEEL is the muted
// warm gray formerly carried as --faint-2).
export const FAINT = '#a6a09b'; // = light --faint
export const ACCENT = '#42658b'; // = light --accent
const STEEL = '#908983';
const CLAY = '#a8763f';
const MOSS = '#5a8c6e';
export const RANGE = [ACCENT, STEEL, CLAY, MOSS];
