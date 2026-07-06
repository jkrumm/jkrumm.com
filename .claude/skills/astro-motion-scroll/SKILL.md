---
name: astro-motion-scroll
description: Build and debug the jkrumm.com scroll experience — Motion (motion.dev) scroll-triggered reveals, native sticky-scroll-reveal / scrollytelling pinned sections (position:sticky + Motion scroll(), no scroll-hijacking), and View Transitions via astro:transitions ClientRouter. Use for any work on section reveals, section pinning/scrubbing, scroll-linked animation, the #jk-scroll stage, or route transitions in this repo.
---

# astro-motion-scroll

The house knowledge for animating **this** site. Not a generic Motion tutorial —
it codifies what already works in `jkrumm.com` and the traps this exact stack
(Astro 7 static + `<ClientRouter />` + Motion vanilla `animate`/`inView`/`scroll`
+ an inner scroll container) sets for you.

**Stack facts.** Static Astro 7, Bun runtime. No UI framework — static markup
plus one imperative script (`src/scripts/portfolio.ts`). Motion `12.42.2` is the
only client dep; import vanilla APIs from `motion` (`animate`, `inView`,
`scroll`), never `motion/react`. The page scrolls inside `#jk-scroll` (an inner
`overflow-y:auto` container), **not** the window.

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
  active-section tracker in `portfolio.ts` does exactly that).
- **Root observers in the scroller.** `#jk-scroll` scrolls, not the window. Every
  `inView`/`IntersectionObserver` needs `{ root: scroller }`; every `scroll()`
  needs `{ container: scroller }`. Window-rooted observers never fire here.
- **Transform + opacity only.** Never animate `width/height/top/left`. Reveals
  use `opacity` + `y`; the progress line uses `scaleX`.
- **Reveal once, don't replay.** Replay-on-re-entry was removed — it produced
  double-motion jank at section boundaries. Reveal once (`data-revealed` guard),
  let each element settle at its true position.
- **Reduced motion is not optional.** Guard every JS animation with
  `matchMedia('(prefers-reduced-motion: reduce)')` AND keep the CSS opt-out. A
  media query alone can't stop an already-running JS tween — you need both.
- **Hidden state in CSS, never JS.** Prevents FOUC (see §4).
- **Reveals wrap inner content of an opaque cell — never a cell, grid, or band.**
  The layout is line-colored bento (§5): a `.reveal` on a cell/grid/band animates
  opacity 0 over `var(--line)` (line-color flash) and its `translateY` detaches
  the element, exposing the 1px hairline gaps. Put `.reveal` on a `<div>` inside
  the opaque `--panel` cell — the cell stays fixed; the fade/slide happens over
  panel. Keep `y` small (~14px) so it stays within cell padding. If wrapping
  collapses a multi-child `flex`/`grid` cell, move that layout onto the `.reveal`
  wrapper (`height:100%`).

## 2. View transitions

`ClientRouter` is imported once in `src/layouts/BaseLayout.astro` `<head>`; every
page on `BaseLayout` inherits soft-swap navigation. Use `transition:name`,
`transition:animate` (`fade`/`slide`/`none`/custom), `transition:persist`.
**Astro 5 renamed `ViewTransitions`→`ClientRouter`** — use `ClientRouter` only.
Full setup, directives, the SSR↔island shared-element caveat, and browser
support in `references/view-transitions.md`.

## 3. Scroll reveals (vanilla)

The working pattern (`portfolio.ts`): `inView('.reveal', el => animate(el,
{opacity:[0,1], y:[14,0]}, {duration:0.55, ease:[0.2,0.7,0.2,1]}), { root:
scroller, amount: 0.2 })`, called from `init()` on `astro:page-load`, its `stop()`
pushed to `teardown`. A `data-revealed` flag makes it fire once. Optional
per-element `data-delay` (capped) staggers. Full code: `references/reveal-lifecycle.ts`.

## 4. Progressive-enhancement reveal system (no FOUC)

Content is **visible by default**. The `<head>` inline script adds `.js` to
`<html>` **before first paint**; only then does CSS (`html.js .reveal`) hide
`.reveal` elements, so Motion can animate them in. If JS never runs, nothing is
ever hidden. Motion writes inline `opacity`/`transform` that override the hidden
state. The hidden state lives in `global.css`, never in JS. Reduced-motion users
get an `!important` opt-out that shows everything un-animated.

## 5. Layout: one continuous-bento `PageBox` (natural-height, no snap)

The page is ONE contained ~1180px box (`PageBox.astro`) whose interior is a
single continuous bento grid. `#jk-scroll` is a plain `height:100svh;
overflow-y:auto` **block** scroll container (no snap — see below); `PageBox`
(`max-width:var(--maxw); margin:0 auto; min-height:100%`) is its centered child.

**The invariant — "fail toward line-color."** The frame, every section band, and
every `Grid` all carry `background: var(--line)`; every hairline is a **1px flex
`gap`** exposing that background. The **only** real `border` lives on `PageBox`
(`border:1px solid var(--line)`). Consequences that drive every edit:

- **Everything inside is borderless.** `SectionShell` (`.section`), `Grid`, and
  the Home band are flex containers with `gap:1px; background:var(--line)` and
  **no border, no max-width, no padding**. Any inner separator border doubles to
  2px against the gap — never add one.
- **Cells are opaque and own their padding.** Every `<Cell>` / header cell is
  `background:var(--panel)` with its own padding (the old per-section
  `padding-inline` is gone — the cell padding is the inset now). Every grid child
  needs `flex-grow ≥ 1` so the last wrap-line fills the row (else a line sliver
  shows).
- **Sticky bars are opaque; separator is `box-shadow`, not border.** The name bar
  (`CompactHeader`) and footer (`StickyFooter`) are direct `PageBox` children,
  `background:var(--panel)`, `position:sticky` (they resolve against `#jk-scroll`
  because `PageBox` has no `overflow`). Their 1px separator is
  `box-shadow: 0 ±1px 0 var(--line)` — a `border` there PLUS the `PageBox` gap
  would double to 2px; the shadow paints INTO the gap and stays exactly 1px, and
  persists when content scrolls under the pinned bar. The name lives ONLY in the
  always-opaque bar; the hero band never duplicates it.
- **Reveals only over `--panel`** — see §1 (never on a cell/grid/band).

Still **natural-height, no scroll-snap**: no `scroll-snap-type`, no
`scroll-padding-*`, no `min-height:100svh`, no snap alignment. Sections butt
together sharing single hairlines; the sticky bars ARE the box's top/bottom edges
(no fixed top bar to clear).

**Why no snap.** Mandatory snap is for slides/carousels, not content portfolios —
it locks scroll, fights overflow, reads as hostile on trackpads. Proximity snap
is a half-measure. The house default is natural-height bento + scroll-driven
reveals. Snap is off the table permanently.

## 6. Pinned / scroll-scrubbed sections — sticky-scroll-reveal (reference pattern)

> **No longer ships on Experience** (retired 2026-07-06 — see LEARNINGS). The
> Experience section is now a **click-driven timeline accordion** (native
> `<details>`/`<summary>` + a Motion height tween, exclusive open), NOT a
> scroll-scrubbed beam. The sticky-scroll-reveal knowledge below is kept as the
> reference for any *future* pinned/scrub section; it is not currently in use.

The one principle that governs every pinned/scrub effect:

> **Every pixel of scroll distance must be real content or a viewport-filling
> visual. Never scroll past nothing.** The "static empty panel" (a sub-viewport
> card pinned in a tall *empty spacer* runway) is the universal anti-pattern —
> it cost three failed Experience iterations before the fix.

**The pattern (retired from Experience — reference only):** the native
**sticky-scroll-reveal / scrollytelling**
pattern (The Pudding / scrollama / Aceternity). A 2-col grid: the role **chapters**
(`.role-detail`, compact self-contained cards ≈ content height) are stacked real
content that *provides the scroll distance*; beside them a **slim side-beam rail**
(a thin filling spine + one dot per role — NOT a wide text column) is
`position:sticky` and pins under the name-bar while the chapters scroll past. One
`scroll(cb,{container:#jk-scroll})` subscription maps the pinned travel 0→1 to the
beam `scaleY` + active-dot highlight. Both sides always show content → no dead
panel. Files: `Experience.astro`, the "Experience: sticky-scroll-reveal" block in
`portfolio.ts`, `experience.ts`.

**Why slim, not a wide rail:** with only 3 sparse roles a full-width sticky rail
reads *empty* (3 labels spread over a viewport-tall column) — the same airiness as
tall chapters. A slim beam (~64px, spine + dots) reads as an intentional progress
rail at any density, and the role identity lives in the (filled) cards. Verified
by screenshotting the real render at mid-scrub, not by reasoning — the wide-rail
version looked broken until seen.

**Geometry (the sticky-pin identity):** pinned travel `track =
wrapper.offsetHeight − sticky.offsetHeight` (NOT − viewport). Here the wrapper is
REAL (the chapters), not a synthetic surplus. `pinStart = sectionTop − pinTop`;
`p = clamp((scrollTop − pinStart)/track)`. Read `--bar-top` (a simple px token) to
rebuild `pinTop` — never parse the `--pin-top` calc() custom (returns an
unresolved string). The sticky child MUST be `align-self:start` in the grid (a
stretched item can't stick). Knob: `--chapter-min` (per-chapter height = the
"hold" per role). Fallback <900px/reduced-motion/no-JS: rail hidden, chapters
stack as self-contained cards.

**Do NOT reach for a scroll-hijack library** (GSAP `pin:true` pin-spacer, Lenis /
Locomotive virtual scroll, fullPage.js) — native `position:sticky` gives pinning
for free and keeps the scrollbar/keyboard/find-in-page/reduced-motion intact.
Full pattern catalog, the hijack-library breakdown, the Motion `scroll()` API
cheatsheet, and the 2026 CSS scroll-driven-animation state:
**`references/scroll-interaction-patterns.md`** (the house scroll bible).
`references/scroll-narrative.md` is the superseded `view-timeline` POC (historical).

## 7. React-island variant (not used here — flagged for the future)

This site has **no islands**. If a section ever becomes a React island, switch to
`motion/react` (`useInView(ref, {amount, once})` + `useAnimate`), hydrate
`client:visible`, and do **not** rely on a shared-element `transition:name` morph
into/out of the island (unreliable — see view-transitions caveats).

## Repo decisions / gotchas (already validated here)

- **Once-only reveal beats replay.** Replay-on-re-entry was removed: it faded
  content out/in at every section boundary (double-motion jank) and left content
  displaced (`translateY`) when re-triggering mid-scroll. Reveal once
  (`data-revealed` guard), let it settle at its true position.
- **`svh`, not `vh`.** `100vh` jumps as the mobile URL bar shows/hides and
  mis-sizes the stage; `100svh` is stable.
- **`+` mark centred ON the corner** via `translate(-50%,-50%)`, so diagonally
  adjacent cells' marks overlap cleanly instead of doubling a few px apart.
- **Continuous-bento, borders only on `PageBox`.** Fail toward line-color (§5):
  one frame owns the only border; every band/grid/cell is borderless with 1px
  line-colored gaps; cells are opaque `--panel` and own their padding; sticky bars
  are opaque with `box-shadow` (not border) separators; reveals only ever animate
  over `--panel` inside an opaque cell. This superseded the earlier
  per-section-borders and no-wrapper layouts.
- **No scroll-snap, period.** Mandatory snap is for slides/carousels, not
  content portfolios — research unanimous (Smashing Mag, MDN, web.dev). Even
  proximity snap is a half-measure. The house default is **natural-height bento +
  scroll-driven reveals.** No snap anywhere.
- **No scroll-hijack libraries.** GSAP / Lenis / fullPage.js / Locomotive are
  not dependencies and won't be — they fight native scroll and add weight for
  an effect the site gets from native `position:sticky` + Motion `scroll()`
  alone. GSAP `pin:true` injects a `pin-spacer` + `position:fixed`; Lenis /
  Locomotive replace native scroll with a lerp'd `requestAnimationFrame`
  transform (breaking scrollbar/keyboard/find-in-page/momentum). The pinned
  "page pauses" effect is native sticky-scroll-reveal (§6). Full teeth-y
  breakdown in `references/scroll-interaction-patterns.md`.
- **After a big multi-file edit, verify against `bun run build` / a restarted dev
  server — not the hot-reloaded page.** Vite HMR can silently drop scoped-`<style>`
  updates: stale `.section`/`.section-header` CSS looked like a real layout bug
  (transparent header, inset sections) but the source and `dist/` were correct.
  Confirm computed styles or the built CSS before "fixing" phantom bugs. Touching
  the stale file forces a re-transform; a restart is the guaranteed clear.

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
- `references/reveal-lifecycle.ts` — init/teardown + once-only `inView` pattern.
- `references/scroll-snap.css` — historical: snap stage (pre-July-2026 revert).
- `references/view-transitions.md` — `ClientRouter` setup, directives, caveats.
- `references/scroll-narrative.md` — superseded `view-timeline` POC (historical).
- `LEARNINGS.md` — running log; read before starting, append after finishing.
