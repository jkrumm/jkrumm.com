---
name: astro-motion-scroll
description: Build and debug the jkrumm.com scroll experience — Motion (motion.dev) scroll-triggered reveals, scroll-spy on the sticky sidebar rail, CSS-only scroll-driven effects, native sticky-scroll-reveal / scrollytelling (position:sticky + Motion scroll(), no scroll-hijacking), and View Transitions via astro:transitions ClientRouter. Use for any work on section reveals, section pinning/scrubbing, scroll-linked animation, the `.shell` layout, or route transitions in this repo.
---

# astro-motion-scroll

The house knowledge for animating **this** site. Not a generic Motion tutorial —
it codifies what already works in `jkrumm.com` and the traps this exact stack
(Astro 7 static + `<ClientRouter />` + Motion vanilla `animate`/`inView`/`scroll`)
sets for you.

**Stack facts.** Static Astro 7, Bun runtime. No UI framework — static markup
plus one imperative script (`src/scripts/portfolio.ts`, ~112 lines). Motion
`12.42.2` is the only client dep; import vanilla APIs from `motion` (`animate`,
`inView`, `scroll`), never `motion/react`. **The page uses DOCUMENT scroll** —
there is no inner scroll container. The former `#jk-scroll` is deleted along with
the bento layout (see §5).

## The one rule everything hangs on

`<ClientRouter />` does **soft swaps** — the document is never reloaded. So any
IntersectionObserver, Motion `inView`, or `scroll()` set up at module-import time
runs **once** and is then silently lost on the next navigation. Fix, always:

- **`astro:page-load`** → (re)initialise every observer/animation. Fires on first
  load and after every swap.
- **`astro:before-swap`** → tear down: `stop()` reveals, `disconnect()` observers,
  `clearInterval()` timers. Register each side effect's cleanup on a `teardown[]`
  and drain it here. Prevents leaks and double-binding.
- **`astro:after-swap`** → fix scroll position if needed.

This is the thing off-the-shelf scroll libraries get wrong here. See
`references/reveal-lifecycle.ts` (distilled from the working `portfolio.ts`).

## 1. Golden rules

- **Motion `inView` over hand-rolled IO.** `inView` is a 0.5 KB Intersection
  Observer wrapper, off-main-thread. Hand-roll `IntersectionObserver` only when
  you need a custom `threshold` array / `rootMargin` it doesn't expose (the
  scroll-spy in `portfolio.ts` does exactly that — it compares
  `intersectionRatio` across several sections, which a binary enter/leave
  callback can't express).
- **No observer root, no scroll container.** Document scroll: `inView` and
  `IntersectionObserver` take `root: null` (or omit it), Motion `scroll()` takes
  no `container`. Passing `{ root: scroller }` / `{ container: scroller }` is the
  retired `#jk-scroll` reflex and produces an observer that never fires.
- **Transform + opacity only.** Never animate `width/height/top/left`. Reveals
  use `opacity` + `y`; scroll-linked lines use `scaleX`.
- **Reveal once, don't replay.** Replay-on-re-entry was removed — it produced
  double-motion jank at section boundaries. Reveal once (`data-revealed` guard),
  let each element settle at its true position.
- **Reduced motion is not optional.** Guard every JS animation with
  `matchMedia('(prefers-reduced-motion: reduce)')` AND keep the CSS opt-out. A
  media query alone can't stop an already-running JS tween — you need both.
- **Hidden state in CSS, never JS.** Prevents FOUC (see §4).
- **A `.reveal` may wrap anything.** The old "inner content of an opaque cell
  only" constraint died with the line-coloured bento — nothing flashes through at
  opacity 0 and there are no hairline gaps for `translateY` to expose. Travel is
  **8px**, and the two places that number lives (`y: [8, 0]` in `portfolio.ts`,
  `translateY(8px)` under `html.js .reveal`) must stay in sync.
- **The motion budget is two behaviours.** Reveals and scroll-spy. The only
  scroll-linked effect site-wide is the **CSS-only** article progress line
  (`animation-timeline: scroll(root block)` in `ArticleLayout.astro`). Adding a
  third behaviour is a decision, not a reflex.

## 2. View transitions

`ClientRouter` is imported once in `src/layouts/BaseLayout.astro` `<head>`; every
page on `BaseLayout` inherits soft-swap navigation. Use `transition:name`,
`transition:animate` (`fade`/`slide`/`none`/custom), `transition:persist`.
**Astro 5 renamed `ViewTransitions`→`ClientRouter`** — use `ClientRouter` only.
Full setup, directives, the SSR↔island shared-element caveat, and browser
support in `references/view-transitions.md`.

## 3. Scroll reveals (vanilla)

The working pattern (`portfolio.ts`): `inView('.reveal', el => animate(el,
{opacity:[0,1], y:[8,0]}, {duration:0.55, ease:[0.2,0.7,0.2,1]}), { amount: 0.2 })`,
called from `init()` on `astro:page-load`, its `stop()` pushed to `teardown`. No
`root` — document scroll. A `data-revealed` flag makes it fire once. Optional
per-element `data-delay` (capped at `MAX_STAGGER: 220`) staggers a group. Full
code: `references/reveal-lifecycle.ts`.

## 4. Progressive-enhancement reveal system (no FOUC)

Content is **visible by default**. The `<head>` inline script adds `.js` to
`<html>` **before first paint**; only then does CSS (`html.js .reveal`) hide
`.reveal` elements, so Motion can animate them in. If JS never runs, nothing is
ever hidden. Motion writes inline `opacity`/`transform` that override the hidden
state. The hidden state lives in `global.css`, never in JS. Reduced-motion users
get an `!important` opt-out that shows everything un-animated.

## 5. Layout: one borderless `.shell` grid on document scroll

The site is a **document, not a dashboard**: a sticky identity rail on the left,
one content column on the right, and nothing between them but 64px of air. There
is **one** layout — `.shell` in `src/styles/global.css` — and every surface uses
it: homepage, articles, and the guide/blog indexes.

```
[full-start] 1fr | [side] --sidebar-w 212px | --gutter 64px | [main] --content-w 680px | 1fr [full-end]
```

`.shell > *` defaults to `grid-column: main`; `.shell > .sidebar` takes `side` and
is `position: sticky; top: var(--page-top)`; `.bleed` escapes to `full`. Reading
surfaces widen by overriding `--content-w: var(--reading-w)` (720px) on their own
shell — not by building a second frame. Below 900px the grid collapses to a
single `full` column and the rail becomes the first static block.

**`align-self: start` on the rail is load-bearing.** Without it the grid stretches
the sidebar to full row height and `position: sticky` silently does nothing. This
is the single most common way to break the rail.

**Document scroll, no stage.** No `overflow-y: auto` container, no
`scroll-snap-type`, no `min-height: 100svh` sections. `html` carries
`scrollbar-gutter: stable`, `scroll-behavior: smooth` (reduced-motion → `auto`)
and `scroll-padding-top: var(--space-block)` so anchored sections clear the top.

### The invariants (why this layout can't drift back)

- **Borderlessness is enforced at the reset**, not by discipline:
  `*,*::before,*::after { border: 0 solid }`. A border exists only where something
  opts in with an explicit width.
- **Hairline budget: 2, site-wide.** The `flex: 1` rule beside each Writing year
  group (`Writing.astro`, `RowList.astro`) and the footer top edge
  (`SiteFooter.astro`), both `var(--divider)`. A third hairline is a bug — no
  exception for a TOC, a prev/next block, or a table of contents rail.
- **Ring, not border**, wherever an object genuinely needs an edge — media, code
  blocks, the sidebar avatar: `box-shadow: var(--shadow-ring)`. The token is
  outset in light and **inset** in dark (different constructions, one name).
  Never hand-write the shadow.
- **Separation, ranked**: whitespace (`--space-section` 96 / `--space-block` 24 /
  `--space-row` 8, applied as grid/flex `gap` so nothing collapses or doubles) →
  the ink ramp (`--ink` titles/`<strong>` · `--ink-2` body · `--muted` supporting
  · `--faint` meta) → right-aligned tabular metadata that makes a list read as a
  table without one.
- **Size ceiling 24px.** Ladder is `--text-xs` 13 / `--text-sm` 14 / `--text-md`
  16 / `--text-lg` 20 / `--text-xl` 24, and the heading scale is killed in the
  reset (`h1..h6 { font-size: inherit; font-weight: inherit }`) so every heading
  opts back in per role. Hierarchy comes from weight (`--w-body`/`--w-med`/
  `--w-strong`) and ink, never size. Section labels are deliberately *quieter*
  than the rows beneath them.
- **Mono for data only** — dates, years, versions, stack lines, code. `.mono` and
  `<time>` already carry `tabular-nums` + `'zero' 0`.
- **Accent budget: 3.** The `aria-current` nav dot, `:focus-visible`,
  `::selection` — plus links inside `.prose`. Nowhere else.
- **One hover vocabulary**, all inside `@media (hover: hover)`: `.plate` (bleed
  plate — negative inline margin equal to the padding, so the hover surface
  extends past the text column and nothing reflows), `.u` (always-on faint
  underline that darkens; colour and geometry never change), `.dim-group`
  (siblings recede to `--faint`, the hovered item returns to `--ink`). No scale,
  no translate, no per-row shadow, no colour inversion.

### What died (do not import, reference, or rebuild)

`PageBox.astro`, `SectionShell.astro`, `Grid.astro`, `Cell.astro`,
`SectionHeader.astro`, `Chip.astro`, `CompactHeader.astro`, `StickyFooter.astro`,
the `#jk-scroll` container, the `--line`/`--hairline`/`--bar-*`/`--maxw` tokens,
and the **fail-toward-line-colour** invariant that governed all of them. The
"three surface modes" split (homepage stage vs two off-stage surfaces) is gone
with it — there is one shell, so a listing page is `IndexLayout` and an article is
`ArticleLayout`, both on the same grid.

### The current surfaces

| Surface | Layout | Rail contents |
|-|-|-|
| Homepage | `index.astro` → `.shell` + `main.stack` | `Sidebar.astro` — avatar, name/title, bio, section nav, links, theme toggle |
| Article | `ArticleLayout.astro`, `--content-w: var(--reading-w)` | table of contents (only when ≥2 headings) |
| Index (guide/blog) | `IndexLayout.astro` | stat rows (count / reading time / latest) |

Every rail is `.sidebar`, so all three share one sticky position and one mobile
collapse. A fourth surface is a new page on `.shell` with something in `side` —
not a new frame.

## 6. Pinned / scroll-scrubbed sections — sticky-scroll-reveal (reference pattern)

> **Not currently shipped anywhere** (retired from Experience 2026-07-06; the
> Experience accordion that replaced it was itself deleted in the 2026-07-27
> borderless redesign — Experience is now a plain two-track date/content grid with
> no JS at all). The knowledge below is kept as the reference for any *future*
> pinned/scrub section. Anything here that mentions a scroll container predates
> document scroll and must be adapted: `scroll()` now takes no `container`, and
> progress is measured against `window.scrollY` / the document.

The one principle that governs every pinned/scrub effect:

> **Every pixel of scroll distance must be real content or a viewport-filling
> visual. Never scroll past nothing.** The "static empty panel" (a sub-viewport
> card pinned in a tall *empty spacer* runway) is the universal anti-pattern —
> it cost three failed Experience iterations before the fix.

**The pattern:** the native **sticky-scroll-reveal / scrollytelling** pattern
(The Pudding / scrollama / Aceternity). A 2-col grid: the **chapters** (compact,
self-contained, ≈content height) are stacked real content that *provides the
scroll distance*; beside them a **slim side-beam rail** (a thin filling spine +
one dot per chapter — NOT a wide text column) is `position: sticky` and pins while
the chapters scroll past. One `scroll(cb)` subscription maps the pinned travel
0→1 to the beam `scaleY` + active-dot highlight. Both sides always show content →
no dead panel.

**Why slim, not a wide rail:** with only 3 sparse items a full-width sticky rail
reads *empty* (3 labels spread over a viewport-tall column). A slim beam (~64px,
spine + dots) reads as an intentional progress rail at any density, and the
identity lives in the (filled) cards. Verified by screenshotting the real render
at mid-scrub, not by reasoning — the wide-rail version looked broken until seen.

**Geometry (the sticky-pin identity):** pinned travel `track =
wrapper.offsetHeight − sticky.offsetHeight` (NOT − viewport). The wrapper must be
REAL content, not a synthetic surplus. `pinStart = sectionTop − pinTop`;
`p = clamp((scrollY − pinStart) / track)`. Read sticky offsets from a plain px
token (e.g. `--page-top`) — never parse a `calc()` custom property, which returns
an unresolved string. The sticky child MUST be `align-self: start` in the grid (a
stretched item can't stick — same trap as the sidebar rail, §5). Fallback
<900px / reduced-motion / no-JS: rail hidden, chapters stack.

**Do NOT reach for a scroll-hijack library** (GSAP `pin:true` pin-spacer, Lenis /
Locomotive virtual scroll, fullPage.js) — native `position:sticky` gives pinning
for free and keeps the scrollbar/keyboard/find-in-page/reduced-motion intact.
Full pattern catalog, the hijack-library breakdown, the Motion `scroll()` API
cheatsheet, and the 2026 CSS scroll-driven-animation state:
**`references/scroll-interaction-patterns.md`** (the house scroll bible).

## 7. React-island variant (not used here — flagged for the future)

This site has **no islands**. If a section ever becomes a React island, switch to
`motion/react` (`useInView(ref, {amount, once})` + `useAnimate`), hydrate
`client:visible`, and do **not** rely on a shared-element `transition:name` morph
into/out of the island (unreliable — see view-transitions caveats).

## Repo decisions / gotchas (already validated here)

- **Borderless document, not bento.** One `.shell` grid, borders zeroed at the
  reset, two hairlines site-wide, ring-not-border on media, hierarchy from weight
  + ink at a 24px ceiling (§5). This superseded the continuous-bento /
  fail-toward-line model, which superseded per-section borders and the no-wrapper
  layout before it. Design reference and the rationale for every decision:
  **`docs/inspiration.md`**.
- **Document scroll, no container.** Every `{ root: scroller }` /
  `{ container: scroller }` argument is gone. Reintroducing one gives you an
  observer that never fires and no error.
- **Once-only reveal beats replay.** Replay-on-re-entry was removed: it faded
  content out/in at every section boundary (double-motion jank) and left content
  displaced (`translateY`) when re-triggering mid-scroll. Reveal once
  (`data-revealed` guard), let it settle at its true position.
- **Reveal travel is 8px** (was 14px under the bento, where it had to stay inside
  cell padding). Kept small so the reveal reads as a settle, not a slide.
- **Prefer CSS-only for scroll-linked effects.** The article progress line is
  `animation-timeline: scroll(root block)` with **longhands, not the `animation`
  shorthand** — a minifier folding `animation-timeline` into the shorthand is
  spec-invalid and silently drops it. Browsers without scroll-driven animations
  leave it at `scaleX(0)`; reduced motion `display:none`s it.
- **`svh`, not `vh`**, wherever a viewport unit is still needed. `100vh` jumps as
  the mobile URL bar shows/hides.
- **No scroll-snap, period.** Mandatory snap is for slides/carousels, not
  content portfolios — research unanimous (Smashing Mag, MDN, web.dev). Even
  proximity snap is a half-measure. No snap anywhere.
- **No scroll-hijack libraries.** GSAP / Lenis / fullPage.js / Locomotive are
  not dependencies and won't be — they fight native scroll and add weight for
  an effect the site gets from native `position:sticky` + Motion `scroll()`
  alone. GSAP `pin:true` injects a `pin-spacer` + `position:fixed`; Lenis /
  Locomotive replace native scroll with a lerp'd `requestAnimationFrame`
  transform (breaking scrollbar/keyboard/find-in-page/momentum). Full teeth-y
  breakdown in `references/scroll-interaction-patterns.md`.
- **After a big multi-file edit, verify against `bun run build` / a restarted dev
  server — not the hot-reloaded page.** Vite HMR can silently drop scoped-`<style>`
  updates: stale CSS looked like a real layout bug (transparent header, inset
  sections) but the source and `dist/` were correct. Confirm computed styles or
  the built CSS before "fixing" phantom bugs. Touching the stale file forces a
  re-transform; a restart is the guaranteed clear.

## Self-learning loop (do this every time)

This skill improves by use. **Every animation/scroll task on this repo MUST end
by appending a dated entry to `LEARNINGS.md`** in this folder — what worked, what
didn't, any gotcha, and (for POCs) the verdict. Append-only; newest at
the bottom. Periodically these entries get **distilled up** into this SKILL.md
body (and stale ones pruned) so the skill stays the source of truth and
LEARNINGS stays the running log. This is deliberate, not automatic: it's the last
step of the task, not a background process.

## Guardrails

- **No new animation dependencies.** Motion is already here.
- **No new borders.** The reset zeroes them; the budget is two hairlines. If a
  change seems to need a third, it needs whitespace or an ink step instead.
- **`bun run build` stays green** (`astro check` + build, 0 errors/warnings) if
  you touch source.
- **English only. No AI/tool attribution anywhere.**
- **Verify version-sensitive APIs** (Motion signatures, `animation-timeline`
  support, the `ClientRouter` rename) via `/research` before relying on them —
  don't code from memory.

## Reference files

- `references/scroll-interaction-patterns.md` — **the house scroll bible**: the
  no-empty-runway principle, native-vs-hijack (library breakdown), the pattern
  catalog, the Motion `scroll()` cheatsheet, CSS scroll-driven state (2026),
  a11y. Read before any pinned/scrub work.
- `references/reveal-lifecycle.ts` — init/teardown + once-only `inView` pattern,
  on document scroll.
- `references/view-transitions.md` — `ClientRouter` setup, directives, caveats.
- `references/scroll-snap.css` — **historical**: the snap stage + `#jk-scroll`
  (reverted July 2026, container deleted July 2026). Reference only; nothing in
  it is current.
- `references/scroll-narrative.md` — **historical**: superseded `view-timeline`
  POC, written against the `#jk-scroll` container.
- `LEARNINGS.md` — running log; read before starting, append after finishing.
