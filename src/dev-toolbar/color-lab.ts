/**
 * Dev Toolbar app — live-preview and tweak the site's color design tokens
 * while `astro dev` is running. Dev-only: the toolbar (and this entrypoint)
 * is never loaded by `astro build`/`astro preview` — see astro.config.mjs.
 *
 * `init()` runs once in the real page's JS context (the actual top-level
 * `window`/`document`, not a sandboxed iframe), so `document.documentElement`
 * is directly reachable/mutable here — no message-passing bridge to the main
 * page is required. Only the rendered UI controls live inside the app's own
 * `canvas` (a dedicated ShadowRoot), styled with hardcoded neutral chrome
 * colors so the tool stays legible regardless of the tokens being previewed.
 */
import { defineToolbarApp } from 'astro/toolbar';
import { BLUEPRINT_PALETTES, MANTINE_PALETTES, TAILWIND_PALETTES } from './palettes';

type ThemeName = 'light' | 'dark';
type OverrideMap = Record<string, string>;
type SwatchKind = 'gray' | 'accent' | null;

interface TokenGroup {
  name: string;
  tokens: string[];
  swatchKind: SwatchKind;
}

// Mirrors the token role map at the top of global.css. Only tokens the site
// actually RENDERS belong here — a row that edits a variable nothing reads is
// worse than a missing row, because the swatch changes and the page doesn't.
// That is what this list had become: --line, --hairline, --shadow-rgb and
// --bar-bg all died with the bento, and four of seven groups edited nothing.
//
// Deliberately absent: --shadow-ring is a shadow VALUE, not a color, and is
// composed from --ring — tune --ring and it follows. --accent-fill /
// --on-accent are declared in global.css but unused by design (see CLAUDE.md
// § Accent budget); nothing on the site is an accent fill.
const GROUPS: TokenGroup[] = [
  { name: 'Surfaces', tokens: ['--bg', '--panel', '--panel-hover'], swatchKind: 'gray' },
  { name: 'Lines', tokens: ['--divider', '--ring'], swatchKind: 'gray' },
  { name: 'Text', tokens: ['--ink', '--ink-2', '--muted', '--faint'], swatchKind: 'gray' },
  { name: 'Accent', tokens: ['--accent', '--accent-glow'], swatchKind: 'accent' },
  {
    name: 'Status',
    tokens: ['--status-success', '--status-warning', '--status-error'],
    swatchKind: 'accent',
  },
  {
    name: 'Charts',
    tokens: ['--chart-1', '--chart-2', '--chart-3', '--chart-4'],
    swatchKind: 'accent',
  },
];

const ALL_TOKENS: string[] = GROUPS.flatMap((group) => group.tokens);

// Plain-language role for each token, plus a `derived` formula for the ones
// computed from another token via color-mix in global.css (so it's obvious
// why they read as "calculated" — editing them still works, but normally you
// tune the source token and these follow).
interface TokenMeta {
  role: string;
  derived?: string;
}

const TOKEN_META: Record<string, TokenMeta> = {
  '--bg': { role: 'Page canvas — the furthest-back surface' },
  '--panel': { role: 'Raised surface — media tiles, code blocks, the avatar' },
  '--panel-hover': { role: 'The .plate row-hover fill', derived: '= ink · 5% light / white · 7% dark' },
  '--divider': {
    role: 'The ONLY hairline the design permits, and only twice: beside each Writing year and the footer top edge',
    derived: '= ink · 12% light / white · 12% dark',
  },
  '--ring': {
    role: 'Edge of a surface — consumed ONLY inside --shadow-ring, never referenced directly',
    derived: '= ink · 10% light / white · 9% dark',
  },
  '--ink': { role: 'Titles, headings, <strong> — the PRIMARY tier' },
  '--ink-2': { role: 'Body copy and descriptions (body is secondary on purpose)' },
  '--muted': { role: 'Supporting text — section labels, the rail bio' },
  '--faint': { role: 'Meta — dates, years, stack lines, captions' },
  '--accent': { role: 'INK role. Spent in 3 places: active-nav dot, :focus-visible, ::selection — plus prose links' },
  '--accent-glow': { role: 'Focus glow', derived: '= --accent · 16% light / 22% dark' },
  '--status-success': { role: 'Success — the Callout label only, never a fill' },
  '--status-warning': { role: 'Warning — the Callout label only, never a fill' },
  '--status-error': { role: 'Error — the Callout label only, never a fill' },
  '--chart-1': { role: 'Chart series 1 / tracks --accent. Baked into build-time SVG — see chart-palette.ts' },
  '--chart-2': { role: 'Chart series 2 — categorical, no CSS-token counterpart' },
  '--chart-3': { role: 'Chart series 3 — categorical' },
  '--chart-4': { role: 'Chart series 4 — categorical' },
};

// These tokens hold a color-mix() string rather than a hex color — <input
// type="color"> can only produce/round-trip #rrggbb, so the picker is omitted
// and only the free-text input is shown. All three are translucent by design:
// a divider or ring that resolved to an opaque hex would stop adapting to the
// surface underneath it, which is the whole reason they are mixes.
const RAW_VALUE_TOKENS = new Set(['--divider', '--ring', '--panel-hover', '--accent-glow']);

type FamilySource = { label: string; shades: Record<string, string> };

// Tailwind's "stone" family was deliberately dropped from this list — the
// rest (Tailwind neutral/zinc/slate/gray, Mantine gray/dark, Blueprint gray)
// stay as swatch options for any gray-ish token.
const GRAY_SOURCES: FamilySource[] = [
  { label: 'neutral', shades: TAILWIND_PALETTES.neutral },
  { label: 'zinc', shades: TAILWIND_PALETTES.zinc },
  { label: 'slate', shades: TAILWIND_PALETTES.slate },
  { label: 'gray', shades: TAILWIND_PALETTES.gray },
  { label: 'mantine-gray', shades: MANTINE_PALETTES.gray },
  { label: 'mantine-dark', shades: MANTINE_PALETTES.dark },
  { label: 'bp-gray', shades: BLUEPRINT_PALETTES.gray },
];

// Every hue Tailwind/Mantine/Blueprint offer that could plausibly work as an
// accent or status color — not just "blue-named" families — so any of these
// tabs can become --accent/--status-* while playing around.
const ACCENT_SOURCES: FamilySource[] = [
  { label: 'blue', shades: TAILWIND_PALETTES.blue },
  { label: 'sky', shades: TAILWIND_PALETTES.sky },
  { label: 'indigo', shades: TAILWIND_PALETTES.indigo },
  { label: 'cyan', shades: TAILWIND_PALETTES.cyan },
  { label: 'mantine-blue', shades: MANTINE_PALETTES.blue },
  { label: 'bp-blue', shades: BLUEPRINT_PALETTES.blue },
  { label: 'bp-cerulean', shades: BLUEPRINT_PALETTES.cerulean },
  { label: 'bp-indigo', shades: BLUEPRINT_PALETTES.indigo },
  { label: 'bp-turquoise', shades: BLUEPRINT_PALETTES.turquoise },
  { label: 'bp-violet', shades: BLUEPRINT_PALETTES.violet },
  { label: 'bp-forest', shades: BLUEPRINT_PALETTES.forest },
  { label: 'bp-green', shades: BLUEPRINT_PALETTES.green },
  { label: 'bp-gold', shades: BLUEPRINT_PALETTES.gold },
  { label: 'bp-lime', shades: BLUEPRINT_PALETTES.lime },
  { label: 'bp-orange', shades: BLUEPRINT_PALETTES.orange },
  { label: 'bp-red', shades: BLUEPRINT_PALETTES.red },
  { label: 'bp-rose', shades: BLUEPRINT_PALETTES.rose },
  { label: 'bp-sepia', shades: BLUEPRINT_PALETTES.sepia },
  { label: 'bp-vermilion', shades: BLUEPRINT_PALETTES.vermilion },
];

/** Normalizes a hex string to lowercase #rrggbb, expanding #rgb; returns null
 * for anything that isn't a plain hex (rgba/color-mix/gradient/RGB triplet). */
function normHex(value: string): string | null {
  const v = value.trim().toLowerCase();
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(v);
  if (m3) return `#${m3[1]}${m3[1]}${m3[2]}${m3[2]}${m3[3]}${m3[3]}`;
  return /^#[0-9a-f]{6}$/.test(v) ? v : null;
}

/** A CSS-renderable color for a swatch background: passes hex/rgba()/gradient
 * through, and wraps a bare "R, G, B" triplet (e.g. --shadow-rgb) as rgb(). */
function swatchColor(value: string): string {
  const v = value.trim();
  if (!v) return 'transparent';
  if (/^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}$/.test(v)) return `rgb(${v})`;
  return v;
}

// Reverse map hex -> "family-shade" so a resolved token value can be labelled
// with its source name (e.g. "zinc-600", "mantine-dark-4"). First-wins by
// priority: Tailwind (user leans zinc) > Mantine > Blueprint. Stone isn't in
// the palette set, so the current stone-based light grays stay unlabelled —
// honest: they simply have no named equivalent here.
const PALETTE_NAME_BY_HEX: Map<string, string> = (() => {
  const map = new Map<string, string>();
  const add = (prefix: string, shades: Record<string, string>): void => {
    for (const [shade, hex] of Object.entries(shades)) {
      const key = normHex(hex);
      if (key && !map.has(key)) map.set(key, `${prefix}-${shade}`);
    }
  };
  for (const [name, shades] of Object.entries(TAILWIND_PALETTES)) add(name, shades);
  for (const [name, shades] of Object.entries(MANTINE_PALETTES)) add(`mantine-${name}`, shades);
  for (const [name, shades] of Object.entries(BLUEPRINT_PALETTES)) add(`bp-${name}`, shades);
  return map;
})();

function paletteName(value: string): string | null {
  const key = normHex(value);
  return key ? (PALETTE_NAME_BY_HEX.get(key) ?? null) : null;
}

const storageKey = (theme: ThemeName): string => `jk-color-lab:${theme}`;

function loadOverrides(theme: ThemeName): OverrideMap {
  try {
    const raw = localStorage.getItem(storageKey(theme));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as OverrideMap) : {};
  } catch {
    return {};
  }
}

function saveOverrides(theme: ThemeName, map: OverrideMap): void {
  try {
    localStorage.setItem(storageKey(theme), JSON.stringify(map));
  } catch {
    // Private-mode/quota failure — overrides stay in-memory only for this session.
  }
}

function resolveActiveTheme(): ThemeName {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Removes every managed token's inline override with no replacement — the
 * page falls back to whatever the stylesheet cascade resolves (used both as
 * a step of applyActiveOverrides and, standalone, to show plain defaults
 * while "Compare" is active). */
function clearManagedInlineStyles(): void {
  const style = document.documentElement.style;
  for (const token of ALL_TOKENS) style.removeProperty(token);
}

/** Clears every managed token's inline override, then reapplies only the
 * currently active theme's map — guarantees the inactive theme's overrides
 * are never left applied to the page. */
function applyActiveOverrides(overrides: Record<ThemeName, OverrideMap>): void {
  clearManagedInlineStyles();
  const theme = resolveActiveTheme();
  for (const [token, value] of Object.entries(overrides[theme])) {
    document.documentElement.style.setProperty(token, value);
  }
}

// The three functions below only mutate the in-memory/localStorage override
// map — they never touch inline styles. Callers decide how/whether to render
// the result (applyActiveOverrides, or leave defaults showing during Compare).

function setOverride(overrides: Record<ThemeName, OverrideMap>, token: string, value: string): void {
  const theme = resolveActiveTheme();
  overrides[theme][token] = value;
  saveOverrides(theme, overrides[theme]);
}

function resetTheme(overrides: Record<ThemeName, OverrideMap>, theme: ThemeName): void {
  overrides[theme] = {};
  try {
    localStorage.removeItem(storageKey(theme));
  } catch {
    // ignore
  }
}

/** Reverts a single token to the stylesheet default for whichever theme is
 * currently active, leaving every other overridden token untouched. */
function resetToken(overrides: Record<ThemeName, OverrideMap>, token: string): void {
  const theme = resolveActiveTheme();
  delete overrides[theme][token];
  saveOverrides(theme, overrides[theme]);
}

/** Reads the effective value of every managed token for `theme`, merging in
 * that theme's overrides. `[data-theme]` gates which CSS rule block is live,
 * so the inactive theme's raw cascade isn't otherwise observable — this
 * briefly flips `data-theme` (with our own inline overrides cleared) to read
 * the real computed cascade, then restores the page's prior state exactly. */
function computeThemeValues(overrides: Record<ThemeName, OverrideMap>, theme: ThemeName): Record<string, string> {
  const el = document.documentElement;
  const prevDataTheme = el.getAttribute('data-theme');
  const prevInline: Record<string, string> = {};
  for (const token of ALL_TOKENS) prevInline[token] = el.style.getPropertyValue(token);

  try {
    for (const token of ALL_TOKENS) el.style.removeProperty(token);
    el.setAttribute('data-theme', theme);
    const computed = getComputedStyle(el);
    const result: Record<string, string> = {};
    for (const token of ALL_TOKENS) {
      result[token] = overrides[theme][token] ?? computed.getPropertyValue(token).trim();
    }
    return result;
  } finally {
    if (prevDataTheme === null) el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', prevDataTheme);
    for (const token of ALL_TOKENS) {
      const value = prevInline[token];
      if (value) el.style.setProperty(token, value);
      else el.style.removeProperty(token);
    }
  }
}

function buildCopyText(overrides: Record<ThemeName, OverrideMap>): string {
  const light = computeThemeValues(overrides, 'light');
  const dark = computeThemeValues(overrides, 'dark');
  const rules = (values: Record<string, string>): string =>
    ALL_TOKENS.map((token) => `  ${token}: ${values[token]};`).join('\n');
  return `:root {\n${rules(light)}\n}\n\n[data-theme='dark'] {\n${rules(dark)}\n}\n`;
}

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Partial<HTMLElementTagNameMap[K]>,
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, attrs);
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

/** Renders one family's official shades, interleaved with a computed
 * "in-between" swatch (a live CSS color-mix(), not a fabricated hex) between
 * every adjacent pair — Tailwind/Mantine/Blueprint only ship fixed steps, so
 * this is how finer-grained picks are offered without inventing fake
 * official values. Hovering any swatch updates `hoverLabel` immediately
 * (native title tooltips lag ~1s and this tool wants an instant name). */
function renderFamilyGrid(
  grid: HTMLElement,
  hoverLabel: HTMLElement,
  source: FamilySource,
  onPick: (value: string) => void,
): void {
  grid.replaceChildren();
  const makeSwatch = (name: string, cssColor: string, mixed: boolean): void => {
    const btn = h('button', {
      type: 'button',
      className: mixed ? 'jk-cl-swatch-btn jk-cl-swatch-btn--mixed' : 'jk-cl-swatch-btn',
      title: name,
    });
    btn.style.background = cssColor;
    btn.addEventListener('mouseenter', () => {
      hoverLabel.textContent = name;
    });
    btn.addEventListener('mouseleave', () => {
      hoverLabel.textContent = '';
    });
    btn.addEventListener('click', () => onPick(cssColor));
    grid.append(btn);
  };

  const entries = Object.entries(source.shades);
  entries.forEach(([shade, hex], index) => {
    makeSwatch(`${source.label}-${shade} · ${hex}`, hex, false);
    const next = entries[index + 1];
    if (next) {
      const [nextShade, nextHex] = next;
      makeSwatch(
        `${source.label} ${shade}↔${nextShade} (mixed)`,
        `color-mix(in srgb, ${hex} 50%, ${nextHex})`,
        true,
      );
    }
  });
}

function buildSwatchSection(kind: SwatchKind, onPick: (value: string) => void): HTMLElement | null {
  if (!kind) return null;
  const sources = kind === 'gray' ? GRAY_SOURCES : ACCENT_SOURCES;

  const tabsRow = h('div', { className: 'jk-cl-tabs' });
  const grid = h('div', { className: 'jk-cl-grid' });
  const hoverLabel = h('div', { className: 'jk-cl-hover-label' });

  const selectFamily = (source: FamilySource, tab: HTMLElement): void => {
    tabsRow.querySelectorAll<HTMLElement>('.jk-cl-tab').forEach((el) => {
      delete el.dataset.active;
    });
    tab.dataset.active = 'true';
    renderFamilyGrid(grid, hoverLabel, source, onPick);
  };

  sources.forEach((source, index) => {
    const tab = h('button', { type: 'button', className: 'jk-cl-tab', textContent: source.label });
    tab.addEventListener('click', () => selectFamily(source, tab));
    tabsRow.append(tab);
    if (index === 0) selectFamily(source, tab);
  });

  return h('div', { className: 'jk-cl-swatch-section' }, [tabsRow, grid, hoverLabel]);
}

interface RowRefs {
  token: string;
  preview: HTMLElement;
  colorInput: HTMLInputElement;
  textInput: HTMLInputElement;
  currentName: HTMLElement;
  defRows: Record<ThemeName, HTMLElement>;
  overrideTag: HTMLElement;
}

/** One "L #hex family-shade" / "D #hex family-shade" default line. Content is
 * static (stylesheet defaults never change in-session); only its active/muted
 * state is toggled later by refreshRow. */
function buildDefaultRow(theme: ThemeName, defaultValue: string): HTMLElement {
  const sw = h('span', { className: 'jk-cl-def-sw' });
  sw.style.background = swatchColor(defaultValue);
  const key = h('span', { className: 'jk-cl-def-key', textContent: theme === 'light' ? 'L' : 'D' });
  const hex = h('span', { className: 'jk-cl-def-hex', textContent: defaultValue });
  const name = paletteName(defaultValue);
  const children = [sw, key, hex];
  if (name) children.push(h('span', { className: 'jk-cl-def-name', textContent: name }));
  return h('div', { className: 'jk-cl-def', title: `${theme} default` }, children);
}

function buildTokenRow(
  token: string,
  swatchKind: SwatchKind,
  overrides: Record<ThemeName, OverrideMap>,
  themeDefaults: Record<ThemeName, Record<string, string>>,
  onCommit: () => void,
  onBeforeCommit: () => void,
): { el: HTMLElement; refs: RowRefs } {
  const preview = h('span', { className: 'jk-cl-swatch' });
  const label = h('span', { className: 'jk-cl-token', textContent: token });
  const currentName = h('span', { className: 'jk-cl-current-name' });
  const resetBtn = h('button', {
    type: 'button',
    className: 'jk-cl-reset-btn',
    title: `Reset ${token} to its stylesheet default`,
    textContent: '↺',
  });
  resetBtn.addEventListener('click', () => {
    onBeforeCommit();
    resetToken(overrides, token);
    applyActiveOverrides(overrides);
    onCommit();
  });
  const head = h('div', { className: 'jk-cl-row__head' }, [preview, label, currentName, resetBtn]);

  // Role line — what the token is for, plus a "derived" badge + formula for
  // the color-mix tokens so it's clear they're computed, not hand-picked.
  const meta = TOKEN_META[token];
  const roleChildren: (Node | string)[] = [];
  if (meta?.derived) {
    roleChildren.push(h('span', { className: 'jk-cl-derived', textContent: 'derived', title: meta.derived }));
  }
  roleChildren.push(meta?.role ?? '');
  if (meta?.derived) roleChildren.push(h('span', { className: 'jk-cl-formula', textContent: meta.derived }));
  const role = h('div', { className: 'jk-cl-role' }, roleChildren);

  // Per-theme defaults + an "overridden" tag for the active theme, so it's
  // always visible what light/dark resolve to and whether the current pick
  // still matches the stylesheet default.
  const defLight = buildDefaultRow('light', themeDefaults.light[token] ?? '');
  const defDark = buildDefaultRow('dark', themeDefaults.dark[token] ?? '');
  const overrideTag = h('span', { className: 'jk-cl-override', textContent: 'overridden', hidden: true });
  const defaults = h('div', { className: 'jk-cl-defaults' }, [defLight, defDark, overrideTag]);

  const isRawValue = RAW_VALUE_TOKENS.has(token);
  const colorInput = h('input', { type: 'color' });
  const textInput = h('input', { type: 'text', spellcheck: false, placeholder: token });

  const commit = (value: string): void => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onBeforeCommit();
    setOverride(overrides, token, trimmed);
    applyActiveOverrides(overrides);
    onCommit();
  };

  colorInput.addEventListener('input', () => commit(colorInput.value));
  textInput.addEventListener('change', () => commit(textInput.value));
  textInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') commit(textInput.value);
  });

  const inputsRow = h('div', { className: 'jk-cl-inputs' }, isRawValue ? [textInput] : [colorInput, textInput]);

  const rowChildren: HTMLElement[] = [head, role, defaults];
  // Raw R,G,B / rgba()-string tokens can't take a plain hex or color-mix()
  // swatch value (see RAW_VALUE_TOKENS above) — no swatch section for those.
  const swatchSection = isRawValue ? null : buildSwatchSection(swatchKind, (hex) => commit(hex));
  if (swatchSection) rowChildren.push(swatchSection);
  rowChildren.push(inputsRow);

  const el = h('div', { className: 'jk-cl-row' }, rowChildren);
  return {
    el,
    refs: { token, preview, colorInput, textInput, currentName, defRows: { light: defLight, dark: defDark }, overrideTag },
  };
}

function refreshRow(refs: RowRefs, overrides: Record<ThemeName, OverrideMap>): void {
  const value = getComputedStyle(document.documentElement).getPropertyValue(refs.token).trim();
  refs.preview.style.background = swatchColor(value);
  refs.textInput.value = value;
  if (/^#[0-9a-fA-F]{6}$/.test(value)) refs.colorInput.value = value;

  const name = paletteName(value);
  refs.currentName.textContent = name ? `· ${name}` : '';

  const theme = resolveActiveTheme();
  refs.defRows.light.dataset.active = String(theme === 'light');
  refs.defRows.dark.dataset.active = String(theme === 'dark');
  refs.overrideTag.hidden = overrides[theme][refs.token] === undefined;
}

// Hardcoded neutral dark chrome — deliberately NOT built from the site's own
// (overridable) CSS tokens, so the tool's own UI stays legible no matter what
// colors are currently being previewed on the page.
const CHROME_CSS = `
.jk-color-lab {
  all: initial;
  box-sizing: border-box;
  position: fixed;
  right: 16px;
  bottom: 64px;
  width: 340px;
  max-height: 72vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #1b1b1d;
  color: #e4e4e7;
  font: 12px/1.4 ui-monospace, SFMono-Regular, monospace;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  z-index: 2147483647;
}
.jk-color-lab *,
.jk-color-lab *::before,
.jk-color-lab *::after {
  box-sizing: border-box;
  font-family: inherit;
}
.jk-cl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.02em;
}
.jk-cl-theme-badge {
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  border-radius: 999px;
  background: #2a2a2e;
}
.jk-cl-theme-badge[data-theme='light'] {
  color: #f2b544;
}
.jk-cl-theme-badge[data-theme='dark'] {
  color: #8b93f7;
}
.jk-cl-subtitle {
  font-size: 10px;
  line-height: 1.4;
  color: #82828a;
}
.jk-cl-compare-note {
  font-size: 10px;
  line-height: 1.4;
  color: #f2b544;
}
.jk-cl-css-pre {
  margin: 0;
  padding: 8px;
  background: #111113;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 220px;
  overflow-y: auto;
}
.jk-cl-group {
  border-top: 1px solid #333338;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.jk-cl-group__title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9a9aa2;
}
.jk-cl-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.jk-cl-row__head {
  display: flex;
  align-items: center;
  gap: 6px;
}
.jk-cl-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  flex: none;
}
.jk-cl-token {
  font-size: 11px;
  color: #d4d4d8;
}
.jk-cl-reset-btn {
  margin-left: auto;
  background: transparent;
  border: none;
  color: #82828a;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0 2px;
}
.jk-cl-reset-btn:hover {
  color: #e4e4e7;
}
.jk-cl-current-name {
  font-size: 10px;
  color: #7c8cff;
  white-space: nowrap;
}
.jk-cl-role {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 6px;
  padding-left: 20px;
  font-size: 10px;
  line-height: 1.35;
  color: #8a8a92;
}
.jk-cl-derived {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #5bd6c0;
  border: 1px solid rgba(91, 214, 192, 0.4);
  border-radius: 999px;
  padding: 0 6px;
}
.jk-cl-formula {
  color: #6d7bd6;
}
.jk-cl-defaults {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  padding: 3px 0 1px 20px;
}
.jk-cl-def {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #6f6f77;
}
.jk-cl-def[data-active='true'] {
  color: #d4d4d8;
}
.jk-cl-def-sw {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  flex: none;
}
.jk-cl-def-key {
  width: 8px;
  font-weight: 600;
  opacity: 0.7;
}
.jk-cl-def[data-active='true'] .jk-cl-def-key {
  opacity: 1;
}
.jk-cl-def-name {
  color: #6d7bd6;
}
.jk-cl-override {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #f2b544;
  border: 1px solid rgba(242, 181, 68, 0.4);
  border-radius: 999px;
  padding: 0 6px;
}
.jk-cl-swatch-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.jk-cl-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.jk-cl-tab {
  background: #202023;
  color: #9a9aa2;
  border: 1px solid #3a3a40;
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  cursor: pointer;
}
.jk-cl-tab:hover {
  color: #e4e4e7;
}
.jk-cl-tab[data-active='true'] {
  background: #3a3a40;
  color: #fff;
  border-color: #565660;
}
.jk-cl-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.jk-cl-swatch-btn {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  padding: 0;
}
.jk-cl-swatch-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
}
.jk-cl-swatch-btn--mixed {
  border-style: dashed;
}
.jk-cl-hover-label {
  min-height: 12px;
  font-size: 10px;
  color: #d4d4d8;
}
.jk-cl-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}
.jk-cl-inputs input[type='color'] {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  background: none;
  cursor: pointer;
}
.jk-cl-inputs input[type='text'] {
  flex: 1;
  min-width: 0;
  background: #111113;
  color: #e4e4e7;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  padding: 3px 5px;
  font-size: 11px;
}
.jk-cl-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-top: 1px solid #333338;
  padding-top: 8px;
}
.jk-cl-btn {
  background: #2a2a2e;
  color: #e4e4e7;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
}
.jk-cl-btn:hover {
  background: #333338;
}
.jk-cl-btn[data-active='true'] {
  background: #3a3a40;
  border-color: #565660;
  color: #fff;
}
`;

export default defineToolbarApp({
  init(canvas) {
    const overrides: Record<ThemeName, OverrideMap> = {
      light: loadOverrides('light'),
      dark: loadOverrides('dark'),
    };
    // Re-apply saved overrides immediately — before any click opens the panel.
    applyActiveOverrides(overrides);

    // Pure stylesheet defaults per theme (overrides ignored) — static for the
    // session, so compute once and render into each row's defaults strip.
    const noOverrides: Record<ThemeName, OverrideMap> = { light: {}, dark: {} };
    const themeDefaults: Record<ThemeName, Record<string, string>> = {
      light: computeThemeValues(noOverrides, 'light'),
      dark: computeThemeValues(noOverrides, 'dark'),
    };

    const style = document.createElement('style');
    style.textContent = CHROME_CSS;
    canvas.append(style);

    // Whether the panel is currently suppressing overrides to show plain
    // stylesheet defaults (a quick A/B look, not a destructive action — the
    // override map is untouched, only the inline styles are paused).
    let compareActive = false;

    const themeBadge = h('span', { className: 'jk-cl-theme-badge' });
    const header = h('div', { className: 'jk-cl-header' }, [h('span', { textContent: 'Color Lab' }), themeBadge]);
    const subtitle = h('div', {
      className: 'jk-cl-subtitle',
      textContent:
        'Each row shows the LIGHT/DARK stylesheet default (active theme highlighted) plus the ' +
        'matching palette name where one exists. Grays: Tailwind neutral/zinc/slate/gray + ' +
        'Mantine gray/dark + Blueprint gray. Accents: Tailwind blue/sky/indigo/cyan + Mantine ' +
        'blue + 13 Blueprint hues. Dashed swatches are computed in-between mixes, not official shades.',
    });
    const compareNote = h('div', {
      className: 'jk-cl-compare-note',
      textContent: 'Comparing — showing stylesheet defaults. Your edits are paused, not lost.',
      hidden: true,
    });
    const cssPre = h('pre', { className: 'jk-cl-css-pre', hidden: true });

    const rowsByToken = new Map<string, RowRefs>();
    const refreshAll = (): void => {
      rowsByToken.forEach((refs) => refreshRow(refs, overrides));
      const theme = resolveActiveTheme();
      themeBadge.textContent = `Editing: ${theme.toUpperCase()}`;
      themeBadge.dataset.theme = theme;
      compareNote.hidden = !compareActive;
      if (!cssPre.hidden) cssPre.textContent = buildCopyText(overrides);
    };

    // Any deliberate edit (swatch pick, hex input, per-token reset) always
    // exits Compare first, so the change is immediately visible rather than
    // silently landing in the map while defaults are still being shown.
    const exitCompare = (): void => {
      if (!compareActive) return;
      compareActive = false;
      compareBtn.textContent = 'Compare: off';
      compareBtn.dataset.active = 'false';
    };

    const root = h('div', { className: 'jk-color-lab' }, [header, subtitle, compareNote]);

    for (const group of GROUPS) {
      const groupEl = h('div', { className: 'jk-cl-group' }, [
        h('div', { className: 'jk-cl-group__title', textContent: group.name }),
      ]);
      for (const token of group.tokens) {
        const { el, refs } = buildTokenRow(token, group.swatchKind, overrides, themeDefaults, refreshAll, exitCompare);
        rowsByToken.set(token, refs);
        groupEl.append(el);
      }
      root.append(groupEl);
    }

    const resetLightBtn = h('button', { type: 'button', className: 'jk-cl-btn', textContent: 'Reset light' });
    const resetDarkBtn = h('button', { type: 'button', className: 'jk-cl-btn', textContent: 'Reset dark' });
    const compareBtn = h('button', { type: 'button', className: 'jk-cl-btn', textContent: 'Compare: off' });
    const showCssBtn = h('button', { type: 'button', className: 'jk-cl-btn', textContent: 'Show CSS' });
    const copyBtn = h('button', { type: 'button', className: 'jk-cl-btn', textContent: 'Copy CSS' });

    resetLightBtn.addEventListener('click', () => {
      exitCompare();
      resetTheme(overrides, 'light');
      applyActiveOverrides(overrides);
      refreshAll();
    });
    resetDarkBtn.addEventListener('click', () => {
      exitCompare();
      resetTheme(overrides, 'dark');
      applyActiveOverrides(overrides);
      refreshAll();
    });
    compareBtn.addEventListener('click', () => {
      compareActive = !compareActive;
      compareBtn.textContent = compareActive ? 'Compare: default' : 'Compare: off';
      compareBtn.dataset.active = String(compareActive);
      if (compareActive) clearManagedInlineStyles();
      else applyActiveOverrides(overrides);
      refreshAll();
    });
    showCssBtn.addEventListener('click', () => {
      cssPre.hidden = !cssPre.hidden;
      showCssBtn.textContent = cssPre.hidden ? 'Show CSS' : 'Hide CSS';
      refreshAll();
    });
    copyBtn.addEventListener('click', () => {
      void navigator.clipboard.writeText(buildCopyText(overrides));
    });

    const footer = h('div', { className: 'jk-cl-footer' }, [
      resetLightBtn,
      resetDarkBtn,
      compareBtn,
      showCssBtn,
      copyBtn,
    ]);
    root.append(footer);
    root.append(cssPre);

    canvas.append(root);
    refreshAll();

    // Keep overrides correct if the user flips light/dark while the panel is
    // open — unless Compare is active, in which case defaults keep showing
    // for whichever theme just became active (no inline styles to swap).
    window.addEventListener('themechange', () => {
      if (!compareActive) applyActiveOverrides(overrides);
      refreshAll();
    });
  },
});
