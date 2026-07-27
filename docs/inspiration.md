---
Captured 2026-07-27 during the borderless redesign. Source: a teardown of the
14 sites below plus an audit of the pre-redesign "continuous bento" frontend.
This is the reference the redesign was built against — when a layout question
comes up, the answer is probably in §6.
---

# Inspiration & design direction

## 1. Verdict

The new jkrumm.com is a **document, not a dashboard**: one sticky identity rail on the left, one ~680px content column on the right, and nothing between them but 64px of air. Every box, hairline, chip border and 1px gap dies — separation comes from a spacing ladder, a three-step ink ramp, and right-aligned tabular metadata, in that order of priority. It should read like a well-set technical CV that happens to be a website: dense enough that six sections fit in three screens of scroll, quiet enough that no element shouts, and engineered enough that the details (tabular dates, mono stack lines, a build-time commit SHA in the footer) do the personality work that a bento grid was doing badly. Mono is for data only — dates, years, versions, stack lines — never for decoration. The current design fails toward line-color; the new one fails toward whitespace, and the reset enforces it so it can't creep back.

## 2. The 14 sites

| URL | Layout model | The one thing to steal |
|-|-|-|
| leerob.com | 586px body-as-container, no shell at all | Borders zeroed at the reset (`*,::before,::after{border:0 solid}`) so any border is an explicit opt-in |
| brianlovin.com | 672px column, 64px section gaps | Name and title line at the **same** 24px/600, separated only by an ink step |
| paco.me | 192px \| 640px \| 192px grid, content opts in | `.grid>*{grid-column:2}` + rail sticky at `top:var(--page-top)` = the page's own padding |
| alexanderobenauer.com | 960px column, 56px rotated-label gutter | Asymmetric measure (`margin-right:50%`) as a section boundary — width change = free separator |
| jakub.kr | 692px column, 96px section margins | Shadow-as-border: `0 0 0 1px rgb(0 0 0/.06)` spread ring instead of a 1px line |
| charliedeets.com | Viewport-centered card, 680px sub-pages | Three brightness tiers inside one row (company / scope / dates) — a CV entry with zero rules |
| chrisrodriguez.me | True 12-col grid, columns left empty | Empty grid columns as the separator + one alpha ramp off a single foreground |
| liam.cv | 720px column, imagery breaks to 1024px | Hover plate that bleeds via `-mx-8/px-8` so text never reflows |
| nelson.co | 672px column, one type size, ten rows | `h1..h6{font-size:inherit;font-weight:inherit}` — kill the heading scale outright |
| ambrosino.io | 672px column, 3-track rows, sticky bottom bar | `box-shadow: inset 0 .5px 0 var(--line)` + `peer-hover:shadow-none` — sub-pixel structure that erases on hover |
| marijanapav.com | 1536px 14-cell emoji bento | Panel **lighter than page** (1–2% luminance step) reads as a surface with no line |
| dushimire.neurolab.cc | 576px column, `section{margin-bottom:80px}` | `·`-separated inline run for the whole tool list — 11 items, zero chips |
| paulstamatiou.com | 576px column, floating icon nav pill | Recessive section headings: label 20px at 60% ink, items 21.6px at 100% |
| blog.maximeheckel.com | `1fr minmax(0,663px) 1fr` full-bleed grid | Body copy is `--text-secondary`; only headings/`<strong>` are promoted to primary |

## 3. Cross-cutting patterns

**Layout & structure.** 11 of 14 use a single content column between 576px and 720px; the median is 672px. Nobody uses a bento. The three that beat a plain column do it with a *grid whose extra tracks are mostly empty* — paco (192/640/192), chrisrodriguez (12-col with cols 2–7 unused), maximeheckel (`1fr minmax(0,663px) 1fr` with `grid-column:2` on every child and full-bleed as a one-line opt-out). Section rhythm converges hard: 80px (dushimire, paulstamatiou), 96px (jakub, nelson), 64px (brianlovin, ambrosino). Page top padding is large — 96–160px. Sticky is used for exactly one element per site, never two.

**Typography.** The scale is flat. leerob 17→24 (1.4×), nelson 15px only, paco headings *at body size*, chrisrodriguez h1 at `text-base font-normal`, maximeheckel H1 24 / H2 18 / body 16. Hierarchy is carried by **weight + color**, never size. Weight ranges are compressed and shifted down: ambrosino redefines bold as 600 and medium as 400; maximeheckel caps at 560; paulstamatiou uses fractional variable weights (480/520/620). Section labels are *quieter than their content* on 5 of 14 sites. Dates are tabular everywhere they exist.

**Color & theme.** Four to six tokens is the norm; leerob and charliedeets ship four. Six of 14 have **no accent hue at all**. Where an accent exists it is spent on 2–3 things: `::selection`, an active-nav dot, link decoration. Never on chrome. Dark mode splits: brianlovin uses an **alpha** ramp (`#ffffffe6/b3/80/52`), maximeheckel derives everything from one `--base-hue` in OKLCH relative color. Nobody uses pure `#000`/`#fff` for text; dushimire's `oklch(0%)`/`oklch(100%)` is called out as its worst decision.

**Separation without borders.** Six mechanisms, ranked by how often they appear: (1) whitespace alone, 64–96px; (2) a 3–4 step ink ramp where secondary info is dimmer, never boxed; (3) right-aligned tabular metadata that makes a list read as a table; (4) a luminance step between page and surface (marijanapav 1–2%); (5) a spread-ring shadow where an object genuinely needs an edge (jakub, chrisrodriguez `inset 0 0 0 1px rgb(255 255 255/.1)`); (6) measure change (liam 720→1024, alexanderobenauer 450↔900). Actual rule budgets: leerob 0, dushimire 1, paco 1, chrisrodriguez 1-per-year-group, maximeheckel 2 in a 10,000-word article.

**Interaction & hover.** Two dominant patterns. **Hover-bleed plate** — negative margin equal to horizontal padding so the hover surface extends past the text column and nothing reflows (liam, jakub, paulstamatiou, ambrosino, all four independently). **Group-dim** — hovering the list fades all siblings to 40–60% and restores the hovered one (paco, chrisrodriguez, paulstamatiou). Link affordance is underline-only: 0.5–2px decoration at 2–4px offset in a near-invisible tint that darkens on hover, never a color change and never geometry change. Motion budget where it exists is one keyframe: `opacity 0→1, translateY(8–16px)→0, optional blur(8px)→0`, 0.5s, staggered by a CSS custom property. Zero scroll-linked animation on 12 of 14.

**Content/article surfaces.** The row is the universal primitive and nobody uses a card for text. Three row grammars recur: two-line (title over meta), three-track (`fixed | 1fr | right-aligned nowrap`), and split (`justify-content:space-between`). Writing lists are year-grouped with the year in a left gutter or paired with a single `flex:1` hairline. Reading columns widen to 663–720px for prose. maximeheckel's `section{display:flex;flex-direction:column;gap:24px}` eliminates margin collapse entirely.

**Photography.** Images are the only bounded objects any of these sites allow, and the boundary is a **ring shadow or a radius, never a border**: chrisrodriguez `inset 0 0 0 1px rgba(255,255,255,.1)` on media, jakub concentric radii (outer 16px with 4px padding, inner 12px), liam a 0.5px ring on 24px app icons, charliedeets `border-radius:24px` on a 300px portrait with separate light/dark sources. Images always break the text measure (liam 720→1024, maximeheckel `grid-column:full`, alexanderobenauer out-of-flow into the right rail). The consistent failure is **decorative imagery**: jakub ships 8 byte-identical fake thumbnails, dushimire's gallery is stylistically orphaned, chrisrodriguez's craft videos carry no description. An image earns its place or it doesn't ship.

## 4. What Johannes will specifically like

The picks are not random — 11 of 14 are engineer-adjacent single-column documents with tabular metadata, and the three outliers (marijanapav, alexanderobenauer, maximeheckel) were picked for one specific technique each, not their overall look.

**Closest to target, in order:**

- **ambrosino.io** — this is the shape. Zero chroma, `--text-base:14.5px`, weight scale shifted down a full step so nothing shouts, `grid-template-columns: 120px 1fr 96px` with tabular right-aligned dates, and the `2019 –` open-ended date microformat. It is density-with-clarity as a finished artifact. Its only gap is that it has no project section — which is exactly the part jkrumm.com has to add.
- **paco.me** — the structural answer. The 3-track grid with `.grid>*{grid-column:2}`, `--page-top` doubling as both page padding and sticky offset, an explicit `--gap-*` ladder (4/8/16/24/32/48/64/72/128) so "how far apart" is always a named decision, and a CSS-only stagger that removes the reveal script entirely. It also has the strongest engineering-taste signals: tabular `zero 0` on dates, per-mode P3 color, a footer clock driven by CSS custom properties.
- **maximeheckel.com** — the token discipline. One `--base-hue` driving the entire gray + accent system, a hard token list for sizes and spacing with everything else banned, and the **footer spec sheet** (Commit → real git SHA, Last Updated, Source, Built With) — the single highest-signal, lowest-clutter personality move available to a backend Tech Lead, and Astro can inject the SHA at build time.
- **chrisrodriguez.me** — empty grid columns as the separator, and the experience-row pattern (`96px date column | content`, rows 32px apart) that is the cleanest CV grammar in the set.

**Why the rest are on the list:** dushimire and nelson prove the reduction is survivable (19KB of HTML, 5 sections, one border); leerob proves borderlessness should be enforced at the reset rather than by discipline; liam and paulstamatiou contribute the hover-bleed plate; jakub contributes shadow-as-border; charliedeets contributes three-tier brightness rows and a genuine four-token palette; brianlovin contributes the name/title identity block and the alpha dark ramp; alexanderobenauer contributes measure-as-separator; marijanapav is on the list as the **counter-example** — it is the current jkrumm.com bento, complete with the same `p-px` nested-background fake hairline, and its useful ideas are the three non-box ones (luminance step, masked backdrop-blur edge, one ink at three alphas).

Terminal-aesthetic satisfaction comes from three places, not from a CRT theme: JetBrains Mono restricted to data (`2019 –`, `Bun · Elysia · Postgres`, `v2.4.1`), `font-variant-numeric: tabular-nums` on every number so columns align without a table, and the footer spec sheet.

## 5. Anti-patterns to avoid

1. **No JS-dependent visibility.** liam, nelson, ambrosino and paulstamatiou all ship content as inline `style="opacity:0"` — JS off is a blank page. The repo's existing contract (`.reveal` visible by default, hidden only under `html.js`, `!important` reduced-motion opt-out) is already correct. Do not regress it.
2. **No hover-only essential metadata.** paulstamatiou hides dates until hover and `display:none`s them below 750px. Dates, years, roles and stack lines are always visible. Hover may only reveal *enrichment* (a screenshot, an arrow).
3. **No metadata-free lists.** leerob's 21 identical writing links, brianlovin's 15 undifferentiated project rows and nelson's 10 title+year pairs all fail the "what did he actually build" test. Every project row carries a description and a stack line; every post carries a date.
4. **No decorative images.** jakub's 8 identical fake thumbnails triple the height of his Writing section and carry zero information. If a project has no real screenshot, it gets no image slot.
5. **No inverted hover.** dushimire dims the title on hover, which reads as disabled. Brighten, plate, or leave alone.
6. **No hidden navigation.** charliedeets' corner pill and jakub's total absence of nav both strand the visitor. The sidebar nav has persistent text labels at all breakpoints.
7. **No second copy of the frame.** The current `IndexLayout.astro` L87-103 carries an independent duplicate of the fail-toward-line frame — deleting `PageBox` does not touch it. Every surface uses the same shell or there is no invariant.
8. **No dead tokens.** dushimire ships unused `--card`, `--chart-1..5`, `--sidebar-*`; leerob ships an entire unused shadcn block. If `--line` survives with a role definition naming a deleted system, the bento reflex grows back.
9. **No stacked mechanisms on one list.** chrisrodriguez uses tabs + a 360px clip + a gradient fade + a "Show more" button to hide 15 one-line items.
10. **No contrast failures.** ambrosino's `oklch(70%)` muted at 14.5px is ~2.5:1; charliedeets' `#888` on `#fafafa` is ~3.3:1; marijanapav's 40%-alpha muted is far below AA. The faintest text tier must clear 4.5:1 at body size and 3:1 at 14px+.
11. **No `overflow-y:auto` scroll container.** `#jk-scroll` is the root cause of every `{root: scroller}` special case, the two opaque 10px caps, the fixed-header alignment hack and the hidden-scrollbar rules. Document scroll only.

## 6. Concrete direction for jkrumm.com

### Column model

Document scroll. One shell, `src/layouts/BaseLayout.astro`, wrapping every surface including `/blog` and `/guide` indexes:

```css
html { scrollbar-gutter: stable; scroll-behavior: smooth; scroll-padding-top: 24px; }
*, *::before, *::after { border: 0 solid; }   /* enforced at the reset, leerob */

.shell {
  display: grid;
  grid-template-columns:
    [full-start] 1fr
    [side-start] var(--sidebar-w) [side-end]
    var(--gutter)
    [main-start] minmax(0, var(--content-w)) [main-end]
    1fr [full-end];
  padding-block: var(--page-top);
  padding-inline: var(--page-inset);
}
.shell > * { grid-column: main; }
.sidebar   { grid-column: side; position: sticky; top: var(--page-top); align-self: start; }
.bleed     { grid-column: full; }   /* wide screenshots, photo strips */
```

`--sidebar-w: 212px` (brianlovin's tested rail width — fits avatar, name, two-line title, four links, four-item nav). `--gutter: 64px`. `--content-w: 680px`. `--page-top: 128px` desktop → `64px` ≤900px, and it is *also* the sticky offset — one variable retunes both. `--page-inset: 24px`. Reading surfaces widen to `--content-w: 720px`; the `/guide` and `/blog` indexes use the same shell, not a second frame.

`align-self: start` on the sidebar is load-bearing — without it the grid stretches it and `sticky` silently does nothing.

### Spacing scale

Fixed ladder, everything else banned: `4 8 12 16 24 32 48 64 80 96 128`. Three of them do structural work:

- `--space-section: 96px` — the only gap between Home / Projects / Experience / Writing / Photography / Contact. Applied as `main { display: grid; gap: var(--space-section) }` so children carry **no vertical margins at all** and nothing can double.
- `--space-block: 24px` — inside a section: label → content, and between `<section>` children (`section{display:flex;flex-direction:column;gap:24px}`, maximeheckel).
- `--space-row: 8px` — between rows in a list; `16px` below 640px where taps need room.

Retire `--space-bar-*`, `--space-card-*`, `--space-hero-*`, `--bar-top`, `--bar-bottom`, `--maxw`.

### Type scale

Sizes, fixed list: `13 / 14 / 16 / 20 / 24`. Nothing above 24px anywhere on the site, including the name. Weights: `400` body, `500` titles/labels, `620` name and section headings — fractional values off the loaded Hubot Sans `200 900` range, applied as tokens (`--w-body / --w-med / --w-strong`), replacing the ~20 scattered `calc(700 + var(--font-display-weight-offset))` call sites. Keep `--font-display-stretch: 88%` and the offset token name so Font Lab keeps working.

- Name: 20px / `--w-strong` / `--text-1`
- Title line ("Tech Lead · Senior Fullstack Developer"): **20px / `--w-strong` / `--text-2`** — same size and weight, one ink step down (brianlovin)
- Section labels: 16px / `--w-med` / `--text-3` — quieter than the rows beneath them (paulstamatiou)
- Row titles: 16px / `--w-med` / `--text-1`
- Body & descriptions: 16px / 1.6 / **`--text-2`** — body is the *secondary* tier; primary is reserved for titles and `<strong>` (maximeheckel's inversion)
- Meta, dates, years, stack lines: 13–14px / `--w-body` / `--text-3`, `--font-mono`, `font-variant-numeric: tabular-nums`, `font-feature-settings: "zero" 0`
- Kill the heading scale in the reset: `h1,h2,h3,h4,h5,h6 { font-size: inherit; font-weight: inherit; margin: 0 }`, then opt back in per role.

Prose (`.prose`) keeps its own scale but caps H2 at 20px and H3 at 16px/620.

### Color

Delete `--line`, `--panel`, `--panel-hover`, `--bar-bg`. Replace with a single ink + a four-step ramp derived by `color-mix`, plus one surface step:

```css
--base-hue: 250;                       /* one number reskins the site */
--bg:      oklch(98.5% 0.004 var(--base-hue));
--surface: oklch(100%  0.003 var(--base-hue));  /* 1–2% step, no line */
--ink:     oklch(20%   0.010 var(--base-hue));
--text-1: var(--ink);
--text-2: color-mix(in oklab, var(--ink) 72%, transparent);
--text-3: color-mix(in oklab, var(--ink) 50%, transparent);
--text-4: color-mix(in oklab, var(--ink) 18%, transparent);  /* underlines, the 2 hairlines */
```

Dark mode uses the **alpha** ramp (brianlovin) over `--bg: oklch(14% .008 var(--base-hue))` and `--ink: oklch(94% .006 …)` — never pure black or white. Accent (`--accent: #0084d1`) is spent on exactly three things: the 6px `aria-current` dot in the sidebar nav, `:focus-visible`, `::selection`. Nowhere else.

Re-sync the three stale hardcoded copies in the same commit: `/Users/jkrumm/SourceRoot/jkrumm.com/src/layouts/BaseLayout.astro` L51, `/Users/jkrumm/SourceRoot/jkrumm.com/src/components/seo/BaseHead.astro` L39, `/Users/jkrumm/SourceRoot/jkrumm.com/src/utils/chart-palette.ts` L9-10.

### How sections separate

96px of whitespace, plus a 16px `--text-3` label. Nothing else. **Hairline budget: 2** for the entire site — (1) the `flex:1` rule beside each year group in the Writing list, (2) the footer top edge. Both at `--text-4`. Any third hairline is a bug.

Where an object genuinely needs an edge — a screenshot, a photo, a code block — it gets a **ring, not a border**: `box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ink) 8%, transparent)` with `border-radius: 12px`. This is the single sanctioned exception and it applies only to media.

Chips (`Chip.astro`, ~20 instances) lose their border entirely: they become inline mono text at 13px in `--text-3`, separated by `·` in a wrapped run (`display:flex; flex-wrap:wrap; column-gap:12px; row-gap:8px`). The whole Stack section becomes two lines of text.

### How project cards read

Not cards. A three-line row, promoted by density rather than by a box:

```
[24px mark]  FreePlanningPoker                                    2023
             Real-time planning poker, no signup, 40k sessions.
             Astro · Bun · WebSockets · Docker
```

- 24px identity mark, `border-radius: 6px`, `box-shadow: 0 0 0 .5px color-mix(in oklab, var(--ink) 16%, transparent)` (liam) — gives four projects visual identity with no container.
- Title 16px/`--w-med`/`--text-1`, `line-clamp: 1`; year right-aligned, mono, tabular, `--text-3`, `white-space: nowrap`.
- Description 16px/`--text-2`, one sentence, wraps.
- Stack line 13px mono `--text-3`, `·`-separated.
- Rows 24px apart (they carry three lines); `↗` at 14px appended to external links.
- Optional: one project gets a real screenshot at `grid-column: full`, capped 1024px, `aspect-ratio: 16/10`, ringed. Only if the screenshot says something.

Minor tools are the same list with the description and stack line dropped, rows 8px apart — the density difference *is* the tier separation, no tint and no second visual language.

### How the writing list reads

Year-grouped, borderless except the one permitted rule:

```html
<div class="year-row"><span>2026</span><i class="rule"></i></div>
<a class="row"><span class="t">Title</span><time>06/29</time></a>
```

`.year-row{display:flex;align-items:center;gap:16px}` with `.rule{height:1px;flex:1;background:var(--text-4)}` (chrisrodriguez). `.row{display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:44px}` — title left 16px/`--w-med`, date right 14px mono tabular `--text-3`. Rows 8px apart. Homepage shows 4 + `All posts ↗` at 14px `--text-3`, 24px below (dushimire).

Experience uses the same grammar with a fixed date track: `grid-template-columns: 96px 1fr; gap: 32px`, dates left in mono tabular using the ambrosino microformat — `2019 –`, `2017 – 18`, `2014 – 18` (en-dash, two-digit end year, nothing after for present). Entries 32px apart. Keep the `<details>`/`<summary>` accordion and the `data-tl-entry`/`data-tl-head`/`data-tl-body` contract so the working script survives; delete the spine, the node rings, the chevron circle, the ladder dots and the `border-top`s in `/Users/jkrumm/SourceRoot/jkrumm.com/src/components/sections/Experience.astro`.

### Sidebar on mobile

At ≤900px the grid collapses to a single column (`grid-template-columns: minmax(0,1fr)`), the sidebar becomes the first static block with `position: static; margin-bottom: 48px`, and the section nav renders as a horizontal row: `display:flex; gap:20px; overflow-x:auto; scrollbar-width:none`, bleeding edge-to-edge via `margin-inline: calc(-1 * var(--page-inset)); padding-inline: var(--page-inset)`. **Labels stay visible.** No fixed pill, no popover, no `inert` machinery — delete `CompactHeader.astro`, `StickyFooter.astro`, and portfolio.ts L52-300 and L445-504 outright.

Sidebar contents, top to bottom: 56px avatar (`border-radius: 12px`, soft-square not circle), name, title line, 1-sentence bio at 16px `--text-2`, a 4-item section nav, a link row (Resume · GitHub · LinkedIn · Email) as underline-only text links, and the ThemeToggle at the bottom. Active nav item: `color: var(--text-1)` plus a 6px `border-radius:9999px` accent dot — no pill, no left border.

### Hover language

One language, three applications, all inside `@media (hover:hover)`, all 150ms:

1. **Bleed plate** on every list row: `margin-inline: -16px; padding: 8px 16px; border-radius: 12px; transition: background 150ms ease` → `background: color-mix(in oklab, var(--ink) 5%, transparent)`. Text never moves.
2. **Links**: always-on faint underline that darkens. `text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; text-decoration-color: var(--text-4)` → `var(--text-2)` on hover. Color and geometry never change.
3. **Group-dim** on the sidebar nav only: `.nav:hover a{color:var(--text-3)} .nav a:hover{color:var(--text-1)}`.

No scale, no translate, no per-row shadow, no color inversion. Set `-webkit-tap-highlight-color` explicitly.

### Motion budget

Four behaviors total, target ≤160 lines in `/Users/jkrumm/SourceRoot/jkrumm.com/src/scripts/portfolio.ts` (down from 524):

1. **Reveals** — keep the Motion `inView` pattern from L32-50, drop `{root: scroller}` (document scroll now), reduce `y` from 14px to 8px, keep 0.55s / `--ease-reveal` / `data-revealed` once-only / `MAX_STAGGER: 220`. Keep the `.reveal` CSS contract verbatim.
2. **Scroll-spy** — keep the IntersectionObserver + `setActive` fan-out from L302-344 with `root: null`, rendering `aria-current` on sidebar links instead of pills.
3. **Experience accordion** — keep L346-443 unchanged.
4. **ThemeToggle** — keep its self-contained element and the pre-paint `window.__theme` contract unchanged.

Zero scroll-linked animation on the homepage — no hero collapse, no bar fade, no progress bar. The article progress bar stays because it is CSS-only (`animation-timeline: scroll(root block)`). Transitions: 150ms color, 200ms background, nothing longer. The five separate `prefers-reduced-motion` guards stay; that discipline is the repo's strongest invariant.

### Footer

One hairline at `--text-4`, full-bleed (`grid-column: full`) with contents constrained back to `main`. Contents are a spec sheet, `grid-template-columns: repeat(3, 1fr)` with the label in column 1 and the value in column 3, column 2 empty (maximeheckel): **Commit** (build-time git SHA, linked to GitHub), **Last updated**, **Source**, **Built with** (Astro 7 · Bun · Motion). Values in mono 13px `--text-3`. `getGitLastModified` in `/Users/jkrumm/SourceRoot/jkrumm.com/src/utils/content.ts` already shells `git log`; extend it to return the SHA.

### Docs that must change in the same commit

`/Users/jkrumm/SourceRoot/jkrumm.com/CLAUDE.md` § "Layout model (continuous bento)", `/Users/jkrumm/SourceRoot/jkrumm.com/.claude/rules/animation.md` (the "reveals only animate over an opaque cell" and "observers rooted in `#jk-scroll`" invariants are both wrong after this), and `/Users/jkrumm/SourceRoot/jkrumm.com/.claude/skills/astro-motion-scroll/SKILL.md` §5 + its LEARNINGS.md. They currently encode the bento as law and will actively fight the rebuild.

## 7. Open tensions

**Sticky rail vs no navigation.** leerob, jakub and nelson ship zero nav and are unusable past three pages; chrisrodriguez's rail scrolls away; only paco's is sticky. **Decision: sticky rail.** jkrumm.com has 6 sections plus two content indexes plus article pages — dushimire's page is explicitly called out as "broken at portfolio length" without it.

**Flat type vs enough hierarchy.** nelson (one size), paco (headings at body size) and chrisrodriguez (h1 at `text-base`) prove flat reads calm — and maximeheckel proves it *fails* at length: finding "Shadow Mapping" in his 7-section article is genuinely hard. **Decision: near-flat with a 20px ceiling, and let the sticky sidebar carry wayfinding instead of the type scale.** This is the one place the sidebar earns its 212px.

**Rows vs bounded cards for projects.** jakub and maximeheckel bound their cards (shadow ring / tint-as-container); nelson, dushimire, brianlovin and ambrosino use bare rows. **Decision: bare three-line rows.** A tinted card is still a card, and adding one back one week after deleting the bento is how the reflex returns. If four projects prove not to stand out enough in testing, the escalation is a 5% ink tint on the *group*, never a per-project frame.

**Zero-chroma vs warm tint.** ambrosino and dushimire ship `oklch(L 0 0)` and read clinical; paulstamatiou's cream/olive and marijanapav's warm off-white read handcrafted; liam's `#123727` body text carries a whole brand off one hex. **Decision: near-neutral, chroma 0.004–0.010 off a single `--base-hue`.** Not zero (dead), not cream (fights the terminal register). One number to retune later.

**Hairline budget: 0, 1, or 2.** leerob ships zero and is structurally guaranteed; paco and dushimire ship exactly one; chrisrodriguez ships one per year group. **Decision: 2** — the year-group rule earns its keep because it makes the Writing list scannable at a glance, and the footer rule terminates the document.

**Ambrosino's inset-shadow hairline.** `inset 0 .5px 0` + `peer-hover:shadow-none` is the best borderless *list* technique in the set, but it is still a line on every row. **Decision: skip it.** Right-aligned tabular dates plus 8px gaps already produce the row structure; adding sub-pixel rules to 30+ rows reintroduces the exact texture being removed. Revisit only if the Writing list tests as mushy.

**Reveal script vs CSS-only stagger.** paco's `[data-animate]{--stagger:N}` + one keyframe removes JS entirely and satisfies the zero-client-JS goal outright; the repo's Motion `inView` is already built, tested, once-only, and correctly guarded. **Decision: keep Motion for now** (the `.reveal` progressive-enhancement contract is the site's strongest existing invariant and rewriting it mid-redesign risks the no-JS path), but the CSS-only stagger is the correct follow-up once the layout settles — it would drop the client bundle to just the accordion and the theme toggle.

**Photography section.** The 14 sites are near-unanimous that decorative imagery is dead weight, and `photos.astro` is currently a 54-line stub. **Decision: the Photography section ships only if there are real photos with a real reason to be there** — as a full-bleed (`grid-column: full`) strip of 3–4 ringed images at a fixed `aspect-ratio`, CDN-hosted per the `/img` skill, never as a grid of placeholder tiles. Otherwise cut the section and the stub page rather than shipping jakub's identical-thumbnail failure.