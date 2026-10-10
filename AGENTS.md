# jkrumm.com — project instructions

Personal portfolio — a borderless two-column document: a sticky identity rail and
one content column, on document scroll. Loads on top of the global
`~/.claude/CLAUDE.md`; only repo-specific conventions not derivable from the code
live here.

## Stack

- **Astro 7**, `output: 'static'` — static markup, zero client JS except two
  scripts: `src/scripts/portfolio.ts` (behavior — reveals, scroll-spy) and
  `src/scripts/analytics.ts` (measurement — Umami events, see Analytics below).
  **No UI framework** (no React/Vue) — don't introduce one.
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

## Validate

- `bun run build` = `astro check` + `astro build` — the exact local validation CI
  runs (the Dockerfile's `RUN bun run build`). Must stay green (0 errors/warnings)
  on any source change.
- `make check` wraps it (`bun run build`). There is no separate lint, format or
  test step in this repo.
- Don't run `bun run dev` for the user — they validate running apps manually.
- Local HTTPS dev host: `https://jkrumm.test` (Caddy → `localhost:7728`).

## Deploy

- Push to `master` deploys. `.github/workflows/deploy.yml` builds the image and
  ships it to the VPS via RollHook (zero-downtime rolling swap), then purges the
  `jkrumm.com` hostname from Cloudflare's edge. There is no local deploy step —
  `make deploy` only prints `deployed by CI on push`.
- A daily 04:17 UTC scheduled run rebuilds the site so the homepage GitHub
  heatmap (fetched at build time) moves.
- The VPS app lives at `vps/apps/jkrumm-com`; its compose service is
  `jkrumm-com` (RollHook-managed nginx container, no secrets in the compose).

## Verify & Monitor

- Health URL: `https://jkrumm.com/` — `make verify` curls it and exits non-zero
  when the site is not live and healthy.
- Uptime Kuma monitor: none — no jkrumm.com site monitor is declared in the homelab's
  `uptime-kuma/monitors.yaml`.
- OTel `service.name`: `none` — the site is a static nginx container with no
  OpenTelemetry instrumentation; the compose file sets no `OTEL_*` variables and
  the repo carries no OTel SDK.

## Gotchas

- **Runtime pin.** Astro 7 needs Node ≥ 22.12; this machine defaults to older
  Node, so every `astro` command is pinned to Bun's runtime
  (`bun --bun node_modules/.bin/astro …`) in `package.json`. Details in `README.md`
  § Runtime — don't "fix" the scripts back to bare `astro`.
- **Stale dev styles.** After a large multi-file edit the live dev server can
  serve stale scoped styles (Vite HMR silently drops some `.astro` `<style>`
  updates) — a page that looks structurally broken may just be stale. Verify
  against `bun run build` output or a restarted dev server, not the hot-reloaded
  page.

## Scroll & animation work

Before touching `src/scripts/**`, `src/styles/**`, or `src/components/**`:

- **Use the `astro-motion-scroll` skill** — it codifies the working patterns
  (lifecycle re-init/teardown, once-only reveals, the shell layout model, view
  transitions) with references to the real files.
- **The `animation` rule** (`.claude/rules/animation.md`) carries the
  non-negotiable invariants (transform/opacity only, reduced-motion always,
  lifecycle-aware, document-rooted observers, hidden state in CSS, the motion
  budget).
- **End every animation/scroll task by appending to the skill's `LEARNINGS.md`.**

The motion budget is deliberately small: **reveals + scroll-spy**, both in
`src/scripts/portfolio.ts`, plus exactly one scroll-linked effect site-wide — the
article progress line, which is CSS-only (`animation-timeline: scroll(root
block)` in `ArticleLayout.astro`). No scroll-linked JS on the homepage.

Scroll-spy is generic, not per-surface: it drives every `a[data-nav-link]`
whose `href="#…"` resolves to an element on the page (`getElementById`, not a
`[data-section]` marker), so ONE implementation lights up both the homepage's
section nav and an article's h2/h3 table of contents in the Sidebar rail — the
active target is the last one whose top has crossed a line near the top of the
viewport (so the last heading wins once the page is scrolled to the bottom).
There is no second, TOC-specific `aria-current` implementation anywhere.

Philosophy: **native + Motion over heavy JS.** Native document scroll + Motion
`inView` + native View Transitions — no scroll-hijack libraries (fullPage.js /
Lenis / GSAP) unless a POC proves native can't do it. Accessibility is
non-negotiable: `prefers-reduced-motion` and keyboard/no-JS paths always work.

## Layout model (borderless document)

**One grid, every surface.** `.shell` in `global.css` is a named-column grid:
`side` (the 212px sticky rail) · 64px gutter · `main` (680px column) · `full`
(edge to edge). `.shell > *` defaults to `main`; `.bleed` opts out to `full`.
Reading surfaces override `--content-w` to `--reading-w` (720px); the guide/blog
indexes use the shell unchanged — there is no second frame. Below 900px the grid
collapses to one column and the rail becomes the first static block.
`align-self: start` on the rail is load-bearing: a stretched grid item cannot
`position: sticky`.

**Document scroll.** No inner scroll container, no `overflow-y: auto` stage, no
scroll-snap. `#jk-scroll` and everything that special-cased it are gone.

**One rail, every surface — `ReadingHeader.astro` is retired.** The back-link +
top-bar chrome it used to render on articles, the guide/blog indexes and stub
pages is gone; every surface now renders `Sidebar.astro` (props: `sections?`,
`bio?`) in the `side` column instead. Articles pass their table of contents as
`sections` (`bio={false}`) so the TOC is pinned at the rail's top like the
homepage nav, with a viewport-capped `overflow-y: auto` on `.nav` so a deep TOC
scrolls inside the rail rather than pushing it past the fold; below 900px the
rail's own TOC nav is hidden in favour of a native `<details>` in the article
head (no JS). Guide/blog indexes and stub pages pass the site nav
(`src/data/profile.ts` → `siteNavItems`) with a static `aria-current="page"` on
the current destination — no scroll-spy there. `ReadingHeader.astro` is
deleted — its last caller, `/resume`, is rebuilt on the shell + rail like every
other surface. `/resume` reuses the homepage's `Experience`/`Projects`/`Skills`
sections directly (props only — `defaultOpen`/`showAction`/`showEducation` on
`Experience`, `intro` on `Projects`) rather than re-implementing them; only its
About and Education sections are its own.

Invariants, in force order:

- **Borderlessness is enforced at the reset** — `*,*::before,*::after { border: 0
  solid }`. A border exists only where something opts in with an explicit width,
  so the bento reflex cannot grow back by accident.
- **Hairline budget: 2 in the page chrome** — the `flex: 1` rule beside each
  Writing year group (`Writing.astro` / `RowList.astro`) and the footer top edge
  (`SiteFooter.astro`). A third is a bug. Not "just for the TOC", not "just for
  the prev/next cards".
  The budget governs layout and chrome, **not `.prose`**. A reading surface may
  rule a table, an `<hr>` and the footnotes block, because there the line is
  carrying document semantics rather than faking structure. That exemption stops
  at `.prose` — it is not a doorway back to bordered components.
- **Ring, not border**, where an object genuinely needs an edge (media, code
  blocks, the avatar): `box-shadow: var(--shadow-ring)`. The token is inset in
  dark and outset in light — use it, never hand-write the shadow.
- **The heading scale is killed** in the reset (`h1..h6 { font-size: inherit;
  font-weight: inherit }`). Every heading opts back into a size and weight for
  its role.
- **Size ladder, fixed**: `--text-xs` 13 / `--text-sm` 14 / `--text-md` 16 /
  `--text-lg` 20 / `--text-xl` 24. Nothing on the site is larger than 24px,
  including the name. Hierarchy is carried by **weight** (`--w-body` 400 /
  `--w-med` / `--w-strong`) and the **ink ramp**, never by size.
- **Ink ramp**: `--ink` is titles, headings and `<strong>` only; `--ink-2` is
  **body copy** (body is the secondary tier on purpose — promoting it flattens
  the hierarchy); `--muted` is supporting text; `--faint` is meta (dates, years,
  stack lines, captions).
- **`--font-mono` is for DATA only** — dates, years, versions, stack lines, code.
  Never decoration. Anything numeric takes the `.mono` class or a `<time>`, both
  of which already carry `tabular-nums` + `'zero' 0`.
- **Spacing: four tokens, by nesting depth.** `--space-section` 96 between
  top-level sections · `--space-group` 32 between groups inside a section (a
  multi-line row, a sub-list, a year group) · `--space-block` 24 for label →
  body and block ↔ block inside a group · `--space-row` 8 between single-line
  rows. A raw px value in a vertical `gap`/`margin` is a bug — that drift is
  what made the page feel arrhythmic (4/12/20/28/32/36/56 were all in play at
  once). Prefer a `gap` over margins so nothing can double or collapse.
  Two caveats: **column** gaps are chrome, not rhythm — they use the site's
  16px inline convention, except the Projects 2×2 grid, whose two columns each
  carry a description + stack line and read cramped at 16px — it uses
  `--space-block` (24px) instead. And a `.plate` row's `padding-block` is part
  of its visual gap, so those lists set `gap: calc(<token> - 2 * <plate-y>)`;
  the token is what you SEE, not what's in the `gap` declaration.
- **Accent budget: 3 places** site-wide — the active-nav dot, `:focus-visible`,
  `::selection`. Plus links inside `.prose`. No accent chrome, no accent
  borders, and **no accent fills** — the Send button and the theme toggle's
  selected segment are monochrome (inverted ink / the ink ramp) precisely
  because a persistent control is chrome. `--accent-fill` / `--on-accent` are
  ported basalt tokens kept for reference; nothing on the site uses them.
- **Hover: one vocabulary**, defined in `global.css`, all inside
  `@media (hover: hover)` — `.plate` (bleed plate: negative inline margin equal
  to the padding, so text never reflows), `.u` (always-on faint underline that
  darkens), `.dim-group` (siblings recede, hovered item returns to full ink). No
  scale, no translate, no per-row shadow, no colour inversion. The Projects
  hover preview panel (`Projects.astro` `.preview`) is a fourth, scoped
  vocabulary member: opacity + a few px of translate only, an asymmetric
  `transition-delay` for hover-intent (~200ms in, near-instant out), lives
  inside the `<a>` so it never blocks the click, and never shifts layout
  (`position: absolute`).

Deleted with the bento — do not import, reference, or reintroduce:
`PageBox`, `SectionShell`, `Grid`, `Cell`, `SectionHeader`, `Chip`,
`CompactHeader`, `StickyFooter`, and the `#jk-scroll` container.

**Design reference: `docs/inspiration.md`.** The teardown of 14 sites the
redesign was built against, the separation-without-borders mechanisms, the
anti-patterns, and the decision taken on each open tension. §6 answers most
layout questions; check it before inventing an answer.

## Analytics

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

## Content

Edit typed modules in `src/data/`; the layout doesn't change. Design tokens
(all colors, type, spacing, the shell's column widths) are CSS variables in
`src/styles/global.css`.

**Career data has one source: `src/data/career/`** (`facts.ts` + generic
`targets.ts`). The homepage Experience and featured Projects, `/resume`, the
committed PDF (`public/johannes-krumm-resume.pdf`) and the LinkedIn copy are
all derived from it — never hand-edit `experience.ts` / `projects.ts` featured
rows. Use the **`career` skill** for any résumé, LinkedIn or positioning work.
After changing anything the `default` target shows, run `bun run resume default`
and commit the regenerated PDF with it. The print sheet
(`src/components/resume/ResumeSheet.astro`) is a paper document with its own
type system in pt (Source Serif 4, `--font-serif`, used nowhere else) — the
layout-model invariants above do not apply to it. This repo is public: no
phone, address or private email in `facts.ts`.

The Activity section's GitHub heatmap falls back to the committed snapshot
`src/data/github-activity.json` whenever the live build-time fetch fails; the
section's "Tokens" view (AI token consumption, switched via a CSS-only
segmented control) reads its own snapshot, `src/data/token-activity.json`,
which the build never fetches live since it needs a secret — refresh both with
`ARGO_TOKEN=<argo-api-secret> bun run activity`.

## Images / CDN

- **Content/article images** → CDN URLs (`blog/` prefix, readable names,
  uploaded via the `/img` skill), passed straight into `Figure.astro`'s `src`
  prop — it's a bare `<img src>`, no `astro:assets` pipeline. Don't add files
  to `public/` for these.
- **Anything scrapers/unfurlers read** (OG images, RSS) must use an `f:jpg`
  rendition, never `@jpg` — Cloudflare ignores `Vary: Accept`, so a
  format-negotiated URL can get cache-poisoned to AVIF for old clients.
- `public/diagrams/agent-platform.html` is a copy, not a source: edit
  `dotfiles/docs/diagrams/agent-platform.architecture.json`, regenerate it there with
  archify, then `make diagrams` here. The Agent Infrastructure guide embeds it.
- `public/` stays for the favicon, small SVG diagrams, and the current OG
  image (`og.png`, wired via `SITE.ogImage` in `src/consts.ts`, resolved
  absolute in `BaseHead.astro`). Migrating `og.png` to the CDN
  (`rs:fill:1200:630/f:jpg`) is an optional follow-up, not done yet.
