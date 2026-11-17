---
paths:
  - src/scripts/analytics.ts
  - src/components/BaseHead.astro
  - src/consts.ts
---

# Analytics

Self-hosted Umami, cookieless. `UMAMI` in `src/consts.ts` holds `src` (the
renamed `p.js` collector, not `script.js`) and the public `websiteId`;
`BaseHead.astro` renders the `<script>` tag only when `import.meta.env.PROD`
(and `data-domains="jkrumm.com"` keeps local builds out of the stats). The
Umami API (Bearer auth) takes the admin key from the secrets store — never
commit it.

All events live in `src/scripts/analytics.ts`, guarded on `window.umami?.track`
(no-op in dev / when blocked) and lifecycle-safe like `portfolio.ts` (init on
`astro:page-load`, teardown on `astro:before-swap`). Naming: kebab-case event
names, small flat data objects. Events: `scroll-depth` {path, depth} at
25/50/75/100% · `section-view` {id} for homepage `section[id]`s ≥50% visible ·
`article-read` {path} at the bottom of a guide/blog `<article>` ·
`outbound` {url, label} for any cross-origin link click · `email-click` for any
`mailto:` link · `resume-download` for the résumé PDF link · `theme-change`
{theme} on the `themechange` window event BaseLayout's theme script dispatches
· `details-open` {name} for any `<details>` opened (`data-track` or the summary
text) · `preview-hover` {id} for `[data-track-hover="<id>"]` hovered ≥600ms ·
`nav-click` {label} for `[data-nav-link]` clicks · `contact-submit` on the
Contact section's form submit. Astro's `ClientRouter` view-transition
navigations are plain `pushState` calls, which Umami's tracker already picks
up — no extra wiring needed, but verify pageview counting (once, not zero or
twice) against the live deploy.
