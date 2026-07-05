---
name: astro-motion-scroll
description: Build and debug the jkrumm.com scroll experience — Motion (motion.dev) scroll-triggered reveals, CSS scroll-driven "narrative" sections (sticky + view-timeline), and native View Transitions via astro:transitions ClientRouter. Use for any work on section reveals, section pinning/scrubbing, the #jk-scroll stage, or route transitions in this repo.
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

## 2. View transitions

`ClientRouter` is imported once in `src/layouts/BaseLayout.astro` `<head>`; every
page on `BaseLayout` inherits soft-swap navigation. Use `transition:name`,
`transition:animate` (`fade`/`slide`/`none`/custom), `transition:persist`.
**Astro 5 renamed `ViewTransitions`→`ClientRouter`** — use `ClientRouter` only.
Full setup, directives, the SSR↔island shared-element caveat, and browser
support in `references/view-transitions.md`.

## 3. Scroll reveals (vanilla)

The working pattern (`portfolio.ts`): `inView('.reveal', el => animate(el,
{opacity:[0,1], y:[20,0]}, {duration:0.55, ease:[0.2,0.7,0.2,1]}), { root:
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

## 5. Natural-height sections (no scroll-snap)

`#jk-scroll` is a plain `height:100svh; overflow-y:auto` container — no
`scroll-snap-type`, no `scroll-padding-*`, no `overscroll-behavior: contain`.
Each `.section` (`SectionShell.astro`) is natural-height: `padding-block: 2.5rem;
padding-inline: clamp(20px, 5vw, 72px)`. The first section clears the fixed top
bar with `padding-top: calc(var(--bar-top) + 2.5rem)`. No `min-height: 100svh`,
no flexbox centering, no snap alignment. Scroll-driven reveals (Motion `inView`)
and the CSS scroll-driven narrative (§6) are the only "scroll effects" — no
scroll-hijack libraries (GSAP / Lenis / fullPage.js).

**Why no snap.** Mandatory snap is for slides and carousels, not content
portfolios — it locks scroll, fights overflow, and reads as hostile on
trackpads. Proximity snap without mandatory is a half-measure. The modern
portfolio standard (2025–2026) is natural-height sections + scroll-driven
reveals + sticky narrative stages. Snap is off the table permanently.

## 6. Pinned / scroll-scrubbed "narrative" sections

The Phase-2 pattern: land on a centred overview → scroll expands the active
item's detail → continued scroll collapses it → then scroll continues naturally.
**Shipped as a POC on Experience** (July 2026). Mechanism (owner decision): **CSS
`animation-timeline: view()`/`scroll()` as the default** — future-proof, zero-JS,
off-main-thread — with a `@supports` + reduced-motion static fallback that
Firefox rides (graceful degradation, not breakage); Motion `scroll()` is the
reserved fallback only if that static degrade reads as broken. Pin = `position:
sticky` in a tall wrapper (`200svh`, `view-timeline: --narrative`). Full detail
in `references/scroll-narrative.md`. **Pending touch validation** — if momentum
scroll behaves poorly on mobile, the kill path is removing the `narrative` prop
from Experience (keeping SectionShell's narrative support).

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
- **No scroll-snap, period.** Mandatory snap is for slides/carousels, not
  content portfolios — research unanimous (Smashing Mag, MDN, web.dev). Even
  proximity snap is a half-measure without mandatory. The house default is
  **natural-height sections + scroll-driven reveals + sticky narrative.** No
  snap anywhere.
- **No scroll-hijack libraries.** GSAP / Lenis / fullPage.js / Locomotive are
  not dependencies and won't be — they fight native scroll and add weight for
  an effect the site gets from Motion reveals + CSS view-timeline.

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

- `references/reveal-lifecycle.ts` — init/teardown + once-only `inView` pattern.
- `references/scroll-snap.css` — historical: snap stage (pre-July-2026 revert).
- `references/view-transitions.md` — `ClientRouter` setup, directives, caveats.
- `references/scroll-narrative.md` — pinned/scrubbed section pattern.
- `LEARNINGS.md` — running log; read before starting, append after finishing.
