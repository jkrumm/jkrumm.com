// Observable Plot renders to static SVG at build time (linkedom, no runtime
// DOM) — these literals can't read CSS custom properties. Charts are
// light-theme only. Keep FAINT/ACCENT/RANGE[1] in sync with global.css's
// light --faint/--accent/--faint-2 by convention when those tokens change.
export const FAINT = '#a6a09b';
export const ACCENT = '#42658b';
export const RANGE = ['#42658b', '#908983', '#a8763f', '#5a8c6e'];
