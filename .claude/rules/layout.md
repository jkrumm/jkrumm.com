---
paths:
  - src/**/*.astro
  - src/styles/**
---

# Layout model (borderless document)

Exempt: the print sheet (`src/components/resume/ResumeSheet.astro`) is a paper
document with its own pt-based type system. None of these invariants apply to it.

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
