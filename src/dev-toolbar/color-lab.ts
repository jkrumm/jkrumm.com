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
import { MANTINE_PALETTES, TAILWIND_PALETTES } from './palettes';

type ThemeName = 'light' | 'dark';
type OverrideMap = Record<string, string>;
type SwatchKind = 'gray' | 'blue' | null;

interface TokenGroup {
  name: string;
  tokens: string[];
  swatchKind: SwatchKind;
}

const GROUPS: TokenGroup[] = [
  { name: 'Surfaces', tokens: ['--bg', '--panel', '--panel-hover'], swatchKind: 'gray' },
  { name: 'Lines', tokens: ['--line', '--hairline'], swatchKind: 'gray' },
  { name: 'Text', tokens: ['--ink', '--ink-2', '--muted', '--faint', '--faint-2'], swatchKind: 'gray' },
  { name: 'Accent', tokens: ['--accent', '--accent-hover', '--accent-glow', '--on-accent'], swatchKind: 'blue' },
  { name: 'Status', tokens: ['--status-warning', '--status-success'], swatchKind: null },
  { name: 'Shadow', tokens: ['--shadow-rgb'], swatchKind: null },
  { name: 'Chrome', tokens: ['--dot-idle', '--bar-bg'], swatchKind: null },
];

const ALL_TOKENS: string[] = GROUPS.flatMap((group) => group.tokens);

const GRAY_FAMILIES = ['stone', 'neutral', 'zinc', 'slate', 'gray'] as const;

// These tokens hold a raw "R, G, B" triplet or a full rgba()/gradient string,
// not a hex color — <input type="color"> can only produce/round-trip #rrggbb,
// so it's omitted for these and only the free-text input is shown.
const RAW_VALUE_TOKENS = new Set(['--shadow-rgb', '--bar-bg']);

const BLUE_SOURCES: { label: string; shades: Record<string, string> }[] = [
  { label: 'blue', shades: TAILWIND_PALETTES.blue },
  { label: 'sky', shades: TAILWIND_PALETTES.sky },
  { label: 'indigo', shades: TAILWIND_PALETTES.indigo },
  { label: 'cyan', shades: TAILWIND_PALETTES.cyan },
  { label: 'mantine-blue', shades: MANTINE_PALETTES.blue },
];

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

/** Clears every managed token's inline override, then reapplies only the
 * currently active theme's map — guarantees the inactive theme's overrides
 * are never left applied to the page. */
function applyActiveOverrides(overrides: Record<ThemeName, OverrideMap>): void {
  const style = document.documentElement.style;
  for (const token of ALL_TOKENS) style.removeProperty(token);
  const theme = resolveActiveTheme();
  for (const [token, value] of Object.entries(overrides[theme])) {
    style.setProperty(token, value);
  }
}

function setOverride(overrides: Record<ThemeName, OverrideMap>, token: string, value: string): void {
  const theme = resolveActiveTheme();
  overrides[theme][token] = value;
  saveOverrides(theme, overrides[theme]);
  applyActiveOverrides(overrides);
}

function resetTheme(overrides: Record<ThemeName, OverrideMap>, theme: ThemeName): void {
  overrides[theme] = {};
  try {
    localStorage.removeItem(storageKey(theme));
  } catch {
    // ignore
  }
  applyActiveOverrides(overrides);
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

function familyRow(label: string, shades: Record<string, string>, onPick: (hex: string) => void): HTMLElement {
  const row = h('div', { className: 'jk-cl-grid' });
  for (const [shade, hex] of Object.entries(shades)) {
    const btn = h('button', { type: 'button', className: 'jk-cl-swatch-btn', title: `${label}-${shade} ${hex}` });
    btn.style.background = hex;
    btn.addEventListener('click', () => onPick(hex));
    row.append(btn);
  }
  return row;
}

function buildSwatchSection(kind: SwatchKind, onPick: (hex: string) => void): HTMLElement | null {
  if (!kind) return null;
  const wrap = h('div', { className: 'jk-cl-swatch-section' });
  if (kind === 'gray') {
    for (const family of GRAY_FAMILIES) wrap.append(familyRow(family, TAILWIND_PALETTES[family], onPick));
  } else {
    for (const source of BLUE_SOURCES) wrap.append(familyRow(source.label, source.shades, onPick));
  }
  return wrap;
}

interface RowRefs {
  token: string;
  preview: HTMLElement;
  colorInput: HTMLInputElement;
  textInput: HTMLInputElement;
}

function buildTokenRow(
  token: string,
  swatchKind: SwatchKind,
  overrides: Record<ThemeName, OverrideMap>,
  onCommit: () => void,
): { el: HTMLElement; refs: RowRefs } {
  const preview = h('span', { className: 'jk-cl-swatch' });
  const label = h('span', { className: 'jk-cl-token', textContent: token });
  const head = h('div', { className: 'jk-cl-row__head' }, [preview, label]);

  const isRawValue = RAW_VALUE_TOKENS.has(token);
  const colorInput = h('input', { type: 'color' });
  const textInput = h('input', { type: 'text', spellcheck: false, placeholder: token });

  const commit = (value: string): void => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setOverride(overrides, token, trimmed);
    onCommit();
  };

  colorInput.addEventListener('input', () => commit(colorInput.value));
  textInput.addEventListener('change', () => commit(textInput.value));
  textInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') commit(textInput.value);
  });

  const inputsRow = h('div', { className: 'jk-cl-inputs' }, isRawValue ? [textInput] : [colorInput, textInput]);

  const rowChildren: HTMLElement[] = [head];
  const swatchSection = buildSwatchSection(swatchKind, (hex) => commit(hex));
  if (swatchSection) rowChildren.push(swatchSection);
  rowChildren.push(inputsRow);

  const el = h('div', { className: 'jk-cl-row' }, rowChildren);
  return { el, refs: { token, preview, colorInput, textInput } };
}

function refreshRow(refs: RowRefs): void {
  const value = getComputedStyle(document.documentElement).getPropertyValue(refs.token).trim();
  refs.preview.style.background = value || 'transparent';
  refs.textInput.value = value;
  if (/^#[0-9a-fA-F]{6}$/.test(value)) refs.colorInput.value = value;
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
  color: #9a9aa2;
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
.jk-cl-swatch-section {
  display: flex;
  flex-direction: column;
  gap: 3px;
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
`;

export default defineToolbarApp({
  init(canvas) {
    const overrides: Record<ThemeName, OverrideMap> = {
      light: loadOverrides('light'),
      dark: loadOverrides('dark'),
    };
    // Re-apply saved overrides immediately — before any click opens the panel.
    applyActiveOverrides(overrides);

    const style = document.createElement('style');
    style.textContent = CHROME_CSS;
    canvas.append(style);

    const themeBadge = h('span', { className: 'jk-cl-theme-badge' });
    const header = h('div', { className: 'jk-cl-header' }, [h('span', { textContent: 'Color Lab' }), themeBadge]);

    const rowsByToken = new Map<string, RowRefs>();
    const refreshAll = (): void => {
      rowsByToken.forEach((refs) => refreshRow(refs));
      themeBadge.textContent = resolveActiveTheme();
    };

    const root = h('div', { className: 'jk-color-lab' }, [header]);

    for (const group of GROUPS) {
      const groupEl = h('div', { className: 'jk-cl-group' }, [
        h('div', { className: 'jk-cl-group__title', textContent: group.name }),
      ]);
      for (const token of group.tokens) {
        const { el, refs } = buildTokenRow(token, group.swatchKind, overrides, refreshAll);
        rowsByToken.set(token, refs);
        groupEl.append(el);
      }
      root.append(groupEl);
    }

    const resetLightBtn = h('button', { type: 'button', className: 'jk-cl-btn', textContent: 'Reset light' });
    const resetDarkBtn = h('button', { type: 'button', className: 'jk-cl-btn', textContent: 'Reset dark' });
    const copyBtn = h('button', { type: 'button', className: 'jk-cl-btn', textContent: 'Copy CSS' });

    resetLightBtn.addEventListener('click', () => {
      resetTheme(overrides, 'light');
      refreshAll();
    });
    resetDarkBtn.addEventListener('click', () => {
      resetTheme(overrides, 'dark');
      refreshAll();
    });
    copyBtn.addEventListener('click', () => {
      void navigator.clipboard.writeText(buildCopyText(overrides));
    });

    const footer = h('div', { className: 'jk-cl-footer' }, [resetLightBtn, resetDarkBtn, copyBtn]);
    root.append(footer);

    canvas.append(root);
    refreshAll();

    // Keep overrides correct if the user flips light/dark while the panel is open.
    window.addEventListener('themechange', () => {
      applyActiveOverrides(overrides);
      refreshAll();
    });
  },
});
