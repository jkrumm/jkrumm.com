import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';

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
      styleOverrides: {
        borderRadius: '0',
        borderColor: 'var(--line)',
        codeBackground: 'var(--bg)',
        codeFontFamily: 'var(--mono)',
        codeFontSize: '13px',
        uiFontFamily: 'var(--mono)',
        frames: {
          editorTabBarBackground: 'var(--panel)',
          editorActiveTabBackground: 'var(--panel)',
          editorBackground: 'var(--bg)',
          terminalBackground: 'var(--bg)',
        },
      },
    }),
    mdx(),
    sitemap(),
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
      name: 'Nunito Sans',
      cssVariable: '--font-sans',
      weights: [400, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
