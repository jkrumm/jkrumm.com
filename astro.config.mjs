import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import { FALLBACK, MONO_CANDIDATES, PROPORTIONAL_CANDIDATES, STORAGE_KEY } from './src/dev-toolbar/font-candidates.ts';

// Dev-only anti-FOUT guard for Font Lab — mirrors the "Set theme + `.js`
// before first paint" inline script in BaseLayout.astro, but for whichever
// --font-mono candidate is currently applied in Font Lab. Injected as early
// as possible in <head> (see injectScript('head-inline', ...) below) so a
// persisted pick starts loading before first paint, instead of only after
// the dev toolbar's own (necessarily async) entrypoint script initializes.
// Built once here from the same candidate data Font Lab's UI uses, so the
// two never drift; only ever injected when command === 'dev' (see below) —
// never part of a production build.
function buildFontFlickerGuardScript() {
  const table = [...MONO_CANDIDATES, ...PROPORTIONAL_CANDIDATES].map((c) => ({
    id: c.id,
    family: c.family,
    spacing: c.spacing,
    fallback: FALLBACK[c.spacing],
    href: c.source.href,
    fontStretch: c.fontStretch ?? '100%',
  }));
  const stretchKey = `${STORAGE_KEY}-stretch`;
  const weightOffsetKey = `${STORAGE_KEY}-weight-offset`;
  return `(function () {
  try {
    var id = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    if (!id) return;
    var table = ${JSON.stringify(table)};
    var c = null;
    for (var i = 0; i < table.length; i++) { if (table[i].id === id) { c = table[i]; break; } }
    if (!c) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = c.href;
    document.head.appendChild(link);
    var targetVar = c.spacing === 'mono' ? '--font-mono' : '--font-display';
    document.documentElement.style.setProperty(targetVar, "'" + c.family + "', " + c.fallback);
    if (c.spacing === 'proportional') {
      var stretch = c.fontStretch;
      try {
        var savedStretch = JSON.parse(localStorage.getItem(${JSON.stringify(stretchKey)}) || 'null');
        if (savedStretch && savedStretch.id === c.id && typeof savedStretch.value === 'number') stretch = savedStretch.value + '%';
      } catch (e2) {}
      document.documentElement.style.setProperty('--font-display-stretch', stretch);
      var weightOffset = 0;
      try {
        var savedWeight = JSON.parse(localStorage.getItem(${JSON.stringify(weightOffsetKey)}) || 'null');
        if (savedWeight && savedWeight.id === c.id && typeof savedWeight.value === 'number') weightOffset = savedWeight.value;
      } catch (e3) {}
      document.documentElement.style.setProperty('--font-display-weight-offset', String(weightOffset));
    }
  } catch (e) {}
})();`;
}

// https://astro.build/config
export default defineConfig({
  // Production origin — drives canonical URLs, Open Graph tags and the sitemap.
  // Local dev is served under https://jkrumm.test (Caddy → localhost:7728).
  site: 'https://jkrumm.com',
  output: 'static',
  trailingSlash: 'never',

  server: {
    // Hard-assigned dev port; `bunx kill-port 7728` in the dev script frees it
    // first and strictPort makes Astro fail loudly instead of drifting to 7729.
    port: 7728,
  },
  vite: {
    server: {
      strictPort: true,
      // Allow the Caddy-proxied dev host (https://jkrumm.test → localhost:7728).
      // Vite rejects non-localhost Host headers by default.
      allowedHosts: ['jkrumm.test'],
    },
  },

  integrations: [
    // Must run before mdx() so MDX code blocks are also processed.
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      // Rename themes to 'light'/'dark' so the default `themeCssSelector`
      // (`[data-theme='${theme.name}']`) matches this site's [data-theme]
      // convention on <html>, set by the runtime theme script.
      customizeTheme(theme) {
        theme.name = theme.type;
      },
      // Bound to the site's live tokens so code blocks follow the theme for
      // free. `--line` was retired with the bento — a code block is a surface
      // with a ring, not a bordered box, so the border is transparent and the
      // edge comes from `--shadow-ring` on `.expressive-code` (global.css).
      styleOverrides: {
        borderRadius: '8px',
        borderColor: 'transparent',
        codeBackground: 'var(--panel)',
        codeFontFamily: 'var(--mono)',
        codeFontSize: '13px',
        uiFontFamily: 'var(--mono)',
        frames: {
          editorTabBarBackground: 'var(--panel)',
          editorActiveTabBackground: 'var(--panel)',
          editorBackground: 'var(--panel)',
          terminalBackground: 'var(--panel)',
        },
      },
    }),
    mdx(),
    sitemap(),

    // Dev-only Color Lab toolbar app — live-preview/tweak color design
    // tokens while `astro dev` runs. The toolbar (and this entrypoint) is
    // never loaded by `astro build`/`astro preview`; zero production footprint.
    {
      name: 'color-lab-dev-toolbar',
      hooks: {
        'astro:config:setup': ({ addDevToolbarApp }) => {
          addDevToolbarApp({
            id: 'color-lab',
            name: 'Color Lab',
            icon: 'grid',
            entrypoint: new URL('./src/dev-toolbar/color-lab.ts', import.meta.url),
          });
        },
      },
    },

    // Dev-only Font Lab toolbar app — live-preview candidate mono/proportional
    // fonts (loaded dev-only from Google Fonts/jsDelivr — see
    // src/dev-toolbar/font-candidates.ts) and swap --font-mono across the
    // site. Same dev-only guarantee as Color Lab above. Also injects the
    // anti-FOUT guard script (defined above) so a persisted pick doesn't
    // flash the default font on reload/navigation.
    {
      name: 'font-lab-dev-toolbar',
      hooks: {
        'astro:config:setup': ({ addDevToolbarApp, command, injectScript }) => {
          addDevToolbarApp({
            id: 'font-lab',
            name: 'Font Lab',
            icon: 'file-search',
            entrypoint: new URL('./src/dev-toolbar/font-lab.ts', import.meta.url),
          });
          if (command === 'dev') {
            injectScript('head-inline', buildFontFlickerGuardScript());
          }
        },
      },
    },
  ],

  // Native Astro font pipeline — self-hosted, subset and preloaded at build
  // time (no @fontsource packages, no CLS). Exposed as CSS variables consumed
  // by src/styles/global.css.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-mono',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'SFMono-Regular', 'monospace'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Hubot Sans',
      cssVariable: '--font-display',
      // A range, not discrete values — this is what actually loads Hubot
      // Sans as a variable font (one file, continuous wght 200-900) instead
      // of four pinned static-per-weight instances. Fontsource's remote
      // provider syntax for a variable range is a single-element array
      // string, per Astro's Fonts guide ("Using variable fonts").
      weights: ['200 900'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Nunito Sans',
      cssVariable: '--font-sans',
      weights: [400, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
