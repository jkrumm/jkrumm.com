# jkrumm.com — project instructions

Personal portfolio — a borderless two-column document: a sticky identity rail and
one content column, on document scroll. Loads on top of the global
`~/.claude/CLAUDE.md`; only repo-specific conventions not derivable from the code
live here.

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
  16px inline convention. And a `.plate` row's `padding-block` is part of its
  visual gap, so those lists set `gap: calc(<token> - 2 * <plate-y>)`; the
  token is what you SEE, not what's in the `gap` declaration.
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
  scale, no translate, no per-row shadow, no colour inversion.

Deleted with the bento — do not import, reference, or reintroduce:
`PageBox`, `SectionShell`, `Grid`, `Cell`, `SectionHeader`, `Chip`,
`CompactHeader`, `StickyFooter`, and the `#jk-scroll` container.

**Design reference: `docs/inspiration.md`.** The teardown of 14 sites the
redesign was built against, the separation-without-borders mechanisms, the
anti-patterns, and the decision taken on each open tension. §6 answers most
layout questions; check it before inventing an answer.

## Content

Edit typed modules in `src/data/`; the layout doesn't change. Design tokens (all
colors, type, spacing, the shell's column widths) are CSS variables in
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
