# jkrumm.com — project instructions

Personal portfolio homepage — a single-page, continuous-bento scroll experience.
Loads on top of the global `~/.claude/CLAUDE.md`; only repo-specific conventions
not derivable from the code live here.

## Stack

- **Astro 7**, `output: 'static'` — static markup, zero client JS except one
  behavior script (`src/scripts/portfolio.ts`). **No UI framework** (no
  React/Vue) — don't introduce one.
- **Bun** — package manager + runtime.
- **Motion** (`motion.dev`) — the only client dependency. Vanilla
  `animate`/`inView`/`scroll` from `motion` (never `motion/react`).
- **Astro Fonts API** + `@astrojs/sitemap` + hand-rolled SEO (`BaseHead`/JSON-LD).
- **Fonts** — `--font-mono` (JetBrains Mono, real code only), `--font-display`
  (Hubot Sans, headings/nav/labels/chrome — variable, loaded as a true range
  `weights: ['200 900']` not discrete instances; tuned via `--font-display-stretch:
  88%` and `--font-display-weight-offset: -100` in `global.css`), `--font-sans`
  (Nunito Sans, body text). Live-tune via the dev-only **Font Lab** toolbar app
  (`src/dev-toolbar/font-lab.ts`) — width/weight sliders drive the same tokens
  production reads.

**Runtime pin (gotcha).** Astro 7 needs Node ≥ 22.12; this machine defaults to
older Node, so every `astro` command is pinned to Bun's runtime
(`bun --bun node_modules/.bin/astro …`) in `package.json`. Details in `README.md`
§ Runtime — don't "fix" the scripts back to bare `astro`.

## Validation

- `bun run build` = `astro check` + `astro build`. Must stay green (0
  errors/warnings) on any source change.
- Don't run `bun run dev` for the user — they validate running apps manually.
- Local HTTPS dev host: `https://jkrumm.test` (Caddy → `localhost:7728`).
- After a large multi-file edit, the **live dev server can serve stale scoped
  styles** (Vite HMR silently drops some `.astro` `<style>` updates) — a page that
  looks structurally broken may just be stale. Verify against `bun run build`
  output or a restarted dev server, not the hot-reloaded page.

## Scroll & animation work

This is the site's defining interaction. Before touching `src/scripts/**`,
`src/styles/**`, or `src/components/**`:

- **Use the `astro-motion-scroll` skill** — it codifies the working patterns
  (lifecycle re-init/teardown, once-only reveals, the continuous-bento layout
  model, reveal-on-inner-content, view transitions) with references to the real
  files.
- **The `animation` rule** (`.claude/rules/animation.md`) carries the
  non-negotiable invariants (transform/opacity only, reduced-motion always,
  lifecycle-aware, observers rooted in `#jk-scroll`, hidden state in CSS).
- **End every animation/scroll task by appending to the skill's `LEARNINGS.md`.**

Philosophy: **native + Motion over heavy JS.** Native scroll + Motion
`inView`/`scroll` + native View Transitions — no scroll-hijack libraries
(fullPage.js / Lenis / GSAP) unless a POC proves native can't do it. Accessibility
is non-negotiable: `prefers-reduced-motion` and keyboard/no-JS paths always work.

## Layout model (continuous bento)

The homepage is **one contained ~1180px box** (`PageBox.astro`) whose interior is
a single continuous bento grid, governed by one invariant — **fail toward
line-color**: the frame, every section band (`SectionShell`), and every `Grid`
carry `background: var(--line)`; hairlines are 1px flex `gap`s exposing it; the
**only** border lives on `PageBox`. So everything inside is **borderless** — never
add a separator border/margin (it doubles to 2px against the gap). `Cell`s are
opaque `--panel` and own their padding; the sticky name-bar + footer are opaque
with `box-shadow` (not border) separators; `.reveal` may only wrap content
**inside** an opaque cell. Full rationale in the `astro-motion-scroll` skill (§5)
and its `LEARNINGS.md`.

The homepage stage is one of **three surface modes**: two **off-stage**
normal-scroll surfaces reuse the frame language — `ArticleLayout` (reading,
`--reading-maxw`) and `IndexLayout` (guide/blog listing, a standalone
fail-toward-line frame at `--index-maxw`, sharing the slim `ReadingHeader`). See
the skill's off-stage-surfaces subsection before building another listing page.

## Content

Edit typed modules in `src/data/`; the layout doesn't change. Design tokens (all
colors/type/spacing, bar heights, max width) are CSS variables in
`src/styles/global.css`.

## Images / CDN

- **Content/article images** → CDN URLs (`blog/` prefix, readable names,
  uploaded via the `/img` skill), passed straight into `Figure.astro`'s `src`
  prop — it's a bare `<img src>`, no `astro:assets` pipeline. Don't add files
  to `public/` for these.
- **Anything scrapers/unfurlers read** (OG images, RSS) must use an `f:jpg`
  rendition, never `@jpg` — Cloudflare ignores `Vary: Accept`, so a
  format-negotiated URL can get cache-poisoned to AVIF for old clients.
- `public/` stays for the favicon, small SVG diagrams, and the current OG
  image (`og.png`, wired via `SITE.ogImage` in `src/consts.ts`, resolved
  absolute in `BaseHead.astro`). Migrating `og.png` to the CDN
  (`rs:fill:1200:630/f:jpg`) is an optional follow-up, not done yet.
