/**
 * Dev Toolbar app — live-preview candidate fonts for the site's --font-mono
 * (real code, --mono token) and --font-display (headings/nav/labels/chrome,
 * --display token) roles side-by-side and swap either live while `astro dev`
 * is running. Proportional siblings sit alongside true monospace candidates
 * because a true mono forces every glyph to the same advance width, which is
 * exactly what makes wide letters (M) look crushed and narrow ones (I) look
 * bloated at heading sizes; a proportional grotesk with the same DNA (often
 * literally the coding font's own sans sibling, e.g. Geist Sans vs Geist
 * Mono) can keep the technical feel without that artifact. Some proportional
 * candidates also expose real variable axes — width (wdth) gets a live
 * slider driving --font-display-stretch (global.css's `body` rule reads it
 * directly); weight (wght) gets a live *signed offset* slider driving
 * --font-display-weight-offset (every --display consumer with its own
 * explicit font-weight was converted to `calc(<base> + var(...))`, so the
 * offset nudges the whole heading scale while keeping relative hierarchy —
 * h2 stays heavier than h3). Both drag actual production-shipped mechanisms,
 * not preview-only hacks. Dev-only: the toolbar (and this entrypoint) is
 * never loaded by `astro build`/`astro preview` — see astro.config.mjs.
 * Candidate data lives in
 * ./font-candidates.ts, shared with the dev-only anti-FOUT guard
 * astro.config.mjs injects into <head> (see the `command === 'dev'` branch
 * there). Every candidate is a Google Fonts/jsDelivr stylesheet, fetched
 * dev-time only; nothing here touches the self-hosted Astro Fonts API config
 * that actually ships to production, so previewing a dozen extra typefaces
 * adds zero production bundle weight. Picking a winner is a manual step: use
 * "Copy config" and hand-paste the snippet into astro.config.mjs's `fonts:`
 * array — deliberate, not auto-applied.
 *
 * `init()` runs once in the real page's JS context (the actual top-level
 * `window`/`document`, not a sandboxed iframe), so `document.documentElement`
 * is directly reachable/mutable here — no message-passing bridge to the main
 * page is required. Only the rendered UI controls live inside the app's own
 * `canvas` (a dedicated ShadowRoot), styled with hardcoded neutral chrome
 * colors so the tool stays legible regardless of the font being previewed.
 */
import { defineToolbarApp } from 'astro/toolbar';
import { FALLBACK, type FontCandidate, MONO_CANDIDATES, PROPORTIONAL_CANDIDATES, type Spacing, STORAGE_KEY } from './font-candidates';

/** Mono candidates preview/apply against the site's real code font
 * (`--font-mono`); proportional candidates preview/apply against the
 * heading/UI display font (`--font-display`). */
function targetVar(spacing: Spacing): string {
  return spacing === 'mono' ? '--font-mono' : '--font-display';
}

function loadSelection(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveSelection(id: string | null): void {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private-mode/quota failure — selection stays in-memory only for this session.
  }
}

/** Generic per-candidate numeric-override persistence — used for both the
 * width slider (`-stretch`, percent) and the weight slider (`-weight`, a
 * signed offset). Keyed to the candidate id so a stale override from a
 * different candidate never silently applies to whatever's selected now. */
function makeOverrideStore(suffix: string) {
  const key = `${STORAGE_KEY}-${suffix}`;
  return {
    load(candidateId: string): number | null {
      try {
        const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as { id: string; value: number } | null;
        return saved && saved.id === candidateId ? saved.value : null;
      } catch {
        return null;
      }
    },
    save(candidateId: string, value: number | null): void {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify({ id: candidateId, value }));
      } catch {
        // Private-mode/quota failure — override stays in-memory only for this session.
      }
    },
  };
}

const stretchStore = makeOverrideStore('stretch');
const weightOffsetStore = makeOverrideStore('weight-offset');

/** Injects a candidate's stylesheet into <head> at most once, so all cards can
 * render in their real font without waiting for a click-to-load round trip. */
function ensureStylesheetLoaded(candidate: FontCandidate): void {
  if (document.head.querySelector(`link[data-jk-font-lab="${candidate.id}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = candidate.source.href;
  link.dataset.jkFontLab = candidate.id;
  document.head.append(link);
}

interface ApplyOverrides {
  /** Width, in percent — overrides the candidate's own `fontStretch` default. */
  widthOverride?: number;
  /** Signed delta added to every --display consumer's own font-weight via
   * calc(<base> + var(--font-display-weight-offset)) — see global.css and
   * the per-component rules a prior sweep converted. */
  weightOffset?: number;
}

/** Both overrides drive the exact same CSS custom properties production
 * reads (`--font-display-stretch` on `body`'s font-stretch,
 * `--font-display-weight-offset` inside each --display consumer's own
 * font-weight: calc(...)) — no separate preview-only code path. */
function applyCandidate(candidate: FontCandidate, overrides: ApplyOverrides = {}): void {
  ensureStylesheetLoaded(candidate);
  document.documentElement.style.setProperty(targetVar(candidate.spacing), `'${candidate.family}', ${FALLBACK[candidate.spacing]}`);
  if (candidate.spacing === 'proportional') {
    const stretch = overrides.widthOverride !== undefined ? `${overrides.widthOverride}%` : (candidate.fontStretch ?? '100%');
    document.documentElement.style.setProperty('--font-display-stretch', stretch);
    document.documentElement.style.setProperty('--font-display-weight-offset', String(overrides.weightOffset ?? 0));
  }
  saveSelection(candidate.id);
  stretchStore.save(candidate.id, overrides.widthOverride ?? null);
  weightOffsetStore.save(candidate.id, overrides.weightOffset ?? null);
}

function resetToDefault(): void {
  document.documentElement.style.removeProperty('--font-mono');
  document.documentElement.style.removeProperty('--font-display');
  document.documentElement.style.removeProperty('--font-display-stretch');
  document.documentElement.style.removeProperty('--font-display-weight-offset');
  saveSelection(null);
  stretchStore.save('', null);
  weightOffsetStore.save('', null);
}

function buildConfigSnippet(candidate: FontCandidate): string {
  const fallbacks = candidate.spacing === 'mono' ? "['ui-monospace', 'SFMono-Regular', 'monospace']" : "['system-ui', 'sans-serif']";
  const entryLabel =
    candidate.spacing === 'mono' ? 'replace the existing JetBrains Mono entry in `fonts:` with:' : 'replace the existing Hubot Sans entry in `fonts:` with:';
  const stretchNote = candidate.fontStretch
    ? `\n// Astro's fontProviders.fontsource() has no width-axis option — the font file is\n` +
      `// still the full variable font, so also set global.css's --font-display-stretch\n` +
      `// token to '${candidate.fontStretch}' (read by the body rule's font-stretch: var(...)).`
    : '';
  // A range ('200 900') is what actually loads the font as variable — a
  // discrete list ([400, 500, 600, 700]) pins separate static instances.
  const weightsSnippet = candidate.axes?.wght
    ? `['${candidate.axes.wght[0]} ${candidate.axes.wght[1]}']`
    : `[${candidate.weights.join(', ')}]`;
  return (
    `// astro.config.mjs — ${entryLabel}\n` +
    `{\n` +
    `  provider: fontProviders.fontsource(),\n` +
    `  name: '${candidate.family}',\n` +
    `  cssVariable: '${targetVar(candidate.spacing)}',\n` +
    `  weights: ${weightsSnippet},\n` +
    `  styles: ['normal'],\n` +
    `  subsets: ['latin'],\n` +
    `  fallbacks: ${fallbacks},\n` +
    `},\n` +
    `// verify '${candidate.fontsourcePackage}' actually ships these weights on fontsource.org\n` +
    `// before shipping — this preview loaded them from Google Fonts/jsDelivr, not Fontsource.` +
    stretchNote
  );
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

function parseStretchPercent(value: string | undefined): number {
  const n = value ? parseFloat(value) : NaN;
  return Number.isFinite(n) ? n : 100;
}

function formatSignedOffset(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/** One card's sample block — mirrors the site's real mono usage (kicker,
 * heading, nav/meta label) plus a character-disambiguation string, all set to
 * the candidate's own font-family so cards are comparable without applying
 * each one in turn. */
function buildSampleBlock(candidate: FontCandidate, stretchOverride?: number, weightOffset?: number): HTMLElement {
  const kicker = h('div', { className: 'jk-fl-sample-kicker', textContent: 'FEATURED PROJECT' });
  const heading = h('div', {
    className: 'jk-fl-sample-heading',
    // "Milli" isolates the wide-M / narrow-i contrast a true monospace forces.
    textContent: 'Milli-second latency, meaningfully lower',
  });
  const meta = h('div', { className: 'jk-fl-sample-meta', textContent: '2024 · Full-Stack Engineer · Remote' });
  const disambig = h('div', { className: 'jk-fl-sample-disambig', textContent: '0O1lI 8B 3E5S6G2Z ({[<>]})' });
  const block = h('div', { className: 'jk-fl-sample' }, [kicker, heading, meta, disambig]);
  block.style.fontFamily = `'${candidate.family}', ${FALLBACK[candidate.spacing]}`;
  block.style.fontStretch = stretchOverride !== undefined ? `${stretchOverride}%` : (candidate.fontStretch ?? 'normal');
  // Sample sub-elements use calc(<base> + var(--font-display-weight-offset,
  // 0)) in CHROME_CSS, same as the real site's swept --display consumers —
  // setting this one custom property on the block previews the delta
  // exactly as it'll apply live, hierarchy (600 vs 700 vs 500) intact.
  block.style.setProperty('--font-display-weight-offset', String(weightOffset ?? 0));
  return block;
}

function buildCard(
  candidate: FontCandidate,
  isCurrent: () => boolean,
  onApply: (candidate: FontCandidate, overrides?: ApplyOverrides) => void,
  onCopy: (candidate: FontCandidate) => void,
): { el: HTMLElement; refreshActive: () => void } {
  const widthAxis = candidate.axes?.wdth;
  const initialWidth = widthAxis ? (stretchStore.load(candidate.id) ?? parseStretchPercent(candidate.fontStretch)) : undefined;
  const weightAxis = candidate.axes?.wght;
  const initialWeightOffset = weightAxis ? (weightOffsetStore.load(candidate.id) ?? 0) : undefined;
  const sample = buildSampleBlock(candidate, initialWidth, initialWeightOffset);

  const applyBtn = h('button', { type: 'button', className: 'jk-fl-btn', textContent: 'Apply to site' });
  const copyBtn = h('button', { type: 'button', className: 'jk-fl-btn', textContent: 'Copy config' });
  copyBtn.addEventListener('click', () => onCopy(candidate));

  const currentOverrides = (): ApplyOverrides => ({
    widthOverride: widthInput ? Number(widthInput.value) : undefined,
    weightOffset: weightInput ? Number(weightInput.value) : undefined,
  });

  const sliderRows: HTMLElement[] = [];
  let widthInput: HTMLInputElement | null = null;
  let weightInput: HTMLInputElement | null = null;
  if (widthAxis) {
    const readout = h('span', { className: 'jk-fl-slider__readout', textContent: `${initialWidth}%` });
    widthInput = h('input', {
      type: 'range',
      className: 'jk-fl-slider__input',
      min: String(widthAxis[0]),
      max: String(widthAxis[1]),
      step: '1',
      value: String(initialWidth),
    });
    widthInput.addEventListener('input', () => {
      const value = Number(widthInput?.value);
      readout.textContent = `${value}%`;
      sample.style.fontStretch = `${value}%`;
      onApply(candidate, currentOverrides());
    });
    sliderRows.push(h('div', { className: 'jk-fl-slider' }, [h('span', { className: 'jk-fl-slider__label', textContent: 'Width' }), widthInput, readout]));
  }
  if (weightAxis) {
    // A signed delta, not an absolute weight — real --display consumers have
    // different base weights (h2 700, h3/h4 600, nav/labels lighter still),
    // each converted to calc(<base> + var(--font-display-weight-offset)).
    // Bounded so base+offset can't leave the font's real 200-900 wght axis
    // for the lightest base weight this site actually uses (500).
    const [axisMin, axisMax] = weightAxis;
    const offsetMin = Math.max(-300, axisMin - 500);
    const offsetMax = Math.min(300, axisMax - 700);
    const readout = h('span', { className: 'jk-fl-slider__readout', textContent: formatSignedOffset(initialWeightOffset ?? 0) });
    weightInput = h('input', {
      type: 'range',
      className: 'jk-fl-slider__input',
      min: String(offsetMin),
      max: String(offsetMax),
      step: '10',
      value: String(initialWeightOffset ?? 0),
    });
    weightInput.addEventListener('input', () => {
      const value = Number(weightInput?.value);
      readout.textContent = formatSignedOffset(value);
      sample.style.setProperty('--font-display-weight-offset', String(value));
      onApply(candidate, currentOverrides());
    });
    sliderRows.push(
      h('div', { className: 'jk-fl-slider' }, [
        h('span', { className: 'jk-fl-slider__label', textContent: 'Weight' }),
        weightInput,
        readout,
      ]),
    );
  }
  applyBtn.addEventListener('click', () => onApply(candidate, currentOverrides()));

  const activeTag = h('span', { className: 'jk-fl-active-tag', textContent: 'applied', hidden: true });
  const spacingTag = h('span', { className: 'jk-fl-spacing-tag', textContent: candidate.spacing });
  spacingTag.dataset.spacing = candidate.spacing;
  const head = h('div', { className: 'jk-fl-card__head' }, [
    h('span', { className: 'jk-fl-card__label', textContent: candidate.label }),
    spacingTag,
    activeTag,
  ]);
  const blurb = h('div', { className: 'jk-fl-card__blurb', textContent: candidate.blurb });
  const actions = h('div', { className: 'jk-fl-card__actions' }, [applyBtn, copyBtn]);

  const children = [head, blurb, sample, ...sliderRows, actions];
  const el = h('div', { className: 'jk-fl-card' }, children);

  const refreshActive = (): void => {
    const active = isCurrent();
    activeTag.hidden = !active;
    el.dataset.active = String(active);
  };

  return { el, refreshActive };
}

// Hardcoded neutral dark chrome — deliberately NOT built from the site's own
// (previewable) font tokens, so the tool's own UI stays legible no matter
// what font is currently being previewed on the page.
const CHROME_CSS = `
.jk-font-lab {
  all: initial;
  box-sizing: border-box;
  position: fixed;
  right: 16px;
  bottom: 64px;
  width: 380px;
  max-height: 76vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #1b1b1d;
  color: #e4e4e7;
  font: 12px/1.4 ui-sans-serif, system-ui, sans-serif;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  z-index: 2147483647;
}
.jk-font-lab *,
.jk-font-lab *::before,
.jk-font-lab *::after {
  box-sizing: border-box;
}
.jk-fl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.02em;
}
.jk-fl-subtitle {
  font-size: 10px;
  line-height: 1.4;
  color: #82828a;
}
.jk-fl-css-pre {
  margin: 0;
  padding: 8px;
  background: #111113;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  font: 10px/1.5 ui-monospace, SFMono-Regular, monospace;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 220px;
  overflow-y: auto;
}
.jk-fl-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid #333338;
  border-radius: 6px;
  padding: 8px;
}
.jk-fl-card[data-active='true'] {
  border-color: #6d7bd6;
  background: rgba(109, 123, 214, 0.08);
}
.jk-fl-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.jk-fl-card__label {
  font-weight: 600;
  font-size: 12px;
  color: #e4e4e7;
}
.jk-fl-active-tag {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7c8cff;
  border: 1px solid rgba(124, 140, 255, 0.4);
  border-radius: 999px;
  padding: 0 6px;
}
.jk-fl-spacing-tag {
  margin-left: auto;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9a9aa2;
  border: 1px solid #3a3a40;
  border-radius: 999px;
  padding: 0 6px;
}
.jk-fl-spacing-tag[data-spacing='proportional'] {
  color: #5bd6c0;
  border-color: rgba(91, 214, 192, 0.4);
}
.jk-fl-group-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9a9aa2;
  border-top: 1px solid #333338;
  padding-top: 8px;
}
.jk-fl-group-title:first-child {
  border-top: none;
  padding-top: 0;
}
.jk-fl-card__blurb {
  font-size: 10px;
  line-height: 1.4;
  color: #8a8a92;
}
.jk-fl-sample {
  background: #111113;
  border: 1px solid #2a2a2e;
  border-radius: 4px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.jk-fl-sample-kicker {
  font-size: 10px;
  font-weight: calc(600 + var(--font-display-weight-offset, 0));
  letter-spacing: 0.14em;
  color: #7c8cff;
}
.jk-fl-sample-heading {
  font-size: 18px;
  font-weight: calc(700 + var(--font-display-weight-offset, 0));
  letter-spacing: -0.01em;
  color: #f2f2f4;
}
.jk-fl-sample-meta {
  font-size: 11px;
  font-weight: calc(500 + var(--font-display-weight-offset, 0));
  letter-spacing: 0.03em;
  color: #9a9aa2;
}
.jk-fl-sample-disambig {
  font-size: 12px;
  color: #d4d4d8;
}
.jk-fl-slider {
  display: flex;
  align-items: center;
  gap: 8px;
}
.jk-fl-slider__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9a9aa2;
  flex: none;
}
.jk-fl-slider__input {
  flex: 1;
  accent-color: #7c8cff;
}
.jk-fl-slider__readout {
  font: 10px/1 ui-monospace, SFMono-Regular, monospace;
  color: #d4d4d8;
  min-width: 3ch;
  text-align: right;
  flex: none;
}
.jk-fl-card__actions {
  display: flex;
  gap: 6px;
}
.jk-fl-btn {
  background: #2a2a2e;
  color: #e4e4e7;
  border: 1px solid #3a3a40;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
}
.jk-fl-btn:hover {
  background: #333338;
}
.jk-fl-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  border-top: 1px solid #333338;
  padding-top: 8px;
}
`;

export default defineToolbarApp({
  init(canvas) {
    const style = document.createElement('style');
    style.textContent = CHROME_CSS;
    canvas.append(style);

    let currentId: string | null = loadSelection();

    const header = h('div', { className: 'jk-fl-header' }, [h('span', { textContent: 'Font Lab' })]);
    const subtitle = h('div', {
      className: 'jk-fl-subtitle',
      textContent:
        '--font-mono/--font-display candidates, loaded dev-only from Google Fonts/jsDelivr — never ' +
        "touches the production Fonts API config. Proportional siblings are included because a true " +
        "monospace's fixed advance width crushes wide letters (M) and pads narrow ones (I) at heading " +
        'sizes. Cards with a real width (wdth) axis get a live slider on --font-display-stretch; cards ' +
        'with a weight (wght) axis get a signed-offset slider on --font-display-weight-offset — both ' +
        "drag the site's actual production tokens. Apply swaps the whole site's font live; Copy config " +
        'gives you the astro.config.mjs snippet once you pick a winner.',
    });
    const cssPre = h('pre', { className: 'jk-fl-css-pre', hidden: true });

    const root = h('div', { className: 'jk-font-lab' }, [header, subtitle]);

    const ALL_CANDIDATES = [...MONO_CANDIDATES, ...PROPORTIONAL_CANDIDATES];
    const cards: { candidate: FontCandidate; refreshActive: () => void }[] = [];
    const refreshAll = (): void => cards.forEach((c) => c.refreshActive());

    const onApply = (candidate: FontCandidate, overrides?: ApplyOverrides): void => {
      applyCandidate(candidate, overrides);
      currentId = candidate.id;
      refreshAll();
    };
    const onCopy = (candidate: FontCandidate): void => {
      const text = buildConfigSnippet(candidate);
      void navigator.clipboard.writeText(text);
      cssPre.textContent = text;
      cssPre.hidden = false;
    };

    const addGroup = (title: string, candidates: FontCandidate[]): void => {
      root.append(h('div', { className: 'jk-fl-group-title', textContent: title }));
      for (const candidate of candidates) {
        ensureStylesheetLoaded(candidate);
        const { el, refreshActive } = buildCard(candidate, () => currentId === candidate.id, onApply, onCopy);
        cards.push({ candidate, refreshActive });
        root.append(el);
      }
    };
    addGroup('Monospace', MONO_CANDIDATES);
    addGroup('Proportional (mono aesthetic)', PROPORTIONAL_CANDIDATES);

    // Re-apply a persisted pick immediately, before any click — same
    // pattern as Color Lab restoring saved overrides on load.
    if (currentId) {
      const persisted = ALL_CANDIDATES.find((c) => c.id === currentId);
      if (persisted) {
        applyCandidate(persisted, {
          widthOverride: stretchStore.load(persisted.id) ?? undefined,
          weightOffset: weightOffsetStore.load(persisted.id) ?? undefined,
        });
      }
    }

    const resetBtn = h('button', { type: 'button', className: 'jk-fl-btn', textContent: 'Reset to default' });
    resetBtn.addEventListener('click', () => {
      resetToDefault();
      currentId = null;
      refreshAll();
    });
    const footer = h('div', { className: 'jk-fl-footer' }, [resetBtn]);

    root.append(footer);
    root.append(cssPre);
    canvas.append(root);
    refreshAll();
  },
});
