# Pinned / scroll-scrubbed "narrative" section — HISTORICAL

> **Status: HISTORICAL, superseded twice.** Seeded from research (2026-07-05, via
> `/research`) against the mandatory-snap stage, which was reverted, and the
> `#jk-scroll` inner scroll container, which was deleted in the 2026-07-27
> borderless redesign. **Nothing in this file describes the current site**: there
> is no snap, no scroll container, and no scroll-linked JS. Read it as a
> `view-timeline` POC record only.

## The pattern

Land on a centred overview → scroll **expands** the active item's detail →
continued scroll **collapses** it back to overview → then the stage **snaps** to
the next section. The "expand" phase must not be real page overflow (that fights
mandatory snap — see the skill's Repo decisions). Instead it's a **fixed-height
stage scrubbed by scroll**: a tall wrapper creates scroll *distance*, a
`position: sticky` child pins at `100svh`, and scroll progress drives the
expand/collapse via transform/opacity.

## Mechanism decision (verified 2026-07-05; owner decision applied)

Two candidates were researched. **Owner decision: prefer the future-proof,
standards-based mechanism — CSS scroll-driven animations — even though Firefox
lags, provided the fallback is graceful (not broken).** That is the correct call
*because* of how the fallback works out; the reasoning:

**Recommended default: CSS `animation-timeline: view()` / `scroll()`
(approach A).** Zero JS, pure CSS, off-main-thread (GPU), Astro-static-perfect,
and the direction the platform is going. Both `view()` and `scroll()` DO work
inside a custom `overflow:auto` container like `#jk-scroll` (via `scroll(nearest)`
/ the subject's nearest scrollport, or a named `scroll-timeline-name`). Support:
Chrome/Edge 115+, Safari 26+, Opera 101+.

**The Firefox point, correctly framed.** As of mid-2026 (FF 152–155) CSS
scroll-driven animations are still behind a flag
(`layout.css.scroll-driven-animations.enabled`). But this only "silently fails"
if you omit the fallback. With a `@supports not (animation-timeline: view())`
block, Firefox rides the **same static, fully-readable fallback we already
mandate** for `prefers-reduced-motion` / keyboard / no-JS (below). So it's
**graceful degradation, not breakage** — Firefox users get the readable static
section, everyone else gets the scrub. That is textbook progressive enhancement
and it matches this site's existing reveal philosophy (content readable without
JS). Do **not** reach for the scroll-timeline polyfill — it re-introduces JS and
negates the whole win.

```css
/* Primary: scrub on scroll (supported browsers). */
@media not (prefers-reduced-motion: reduce) {
  .narrative-visual {
    animation: expand-collapse linear both;
    animation-timeline: view();      /* or a named scroll-timeline on the wrap */
    animation-range: entry 0% exit 100%;
  }
}
/* Firefox / unsupported / reduced-motion → the shared static fallback. */
@supports not (animation-timeline: view()) {
  .narrative-visual { /* fully-expanded, readable static state */ }
}
```

**Fallback: Motion `scroll()` (approach B).** Keep in reserve for the case where
the static degrade is judged *unacceptable UX* for this specific scrub (i.e. the
scrubbed motion is essential, not decorative, and Firefox users genuinely need
it). Motion works everywhere — native `ScrollTimeline` where supported, a
render-batched JS loop on Firefox — at ~5.2 KB (Motion is already a dep). It's the
"I actually need the animation cross-browser" escape hatch, not the default.

**Rule of thumb for this repo:** build it in **CSS `view()`/`scroll()`** with a
solid `@supports` + reduced-motion static fallback. Only drop to Motion `scroll()`
if Phase-2 testing shows the static degrade reads as broken rather than merely
plainer. When `caniuse.com/wf-scroll-driven-animations` shows Firefox green, the
`@supports` branch just stops being exercised — no code change needed.

## Motion `scroll()` — verified API (motion 12.x; repo is on 12.42.2)

```js
import { scroll, animate } from 'motion';

// Drive an animation from a section's progress through the INNER scroller.
const cancel = scroll(
  animate('.section .visual', { transform: ['scale(0.8)', 'scale(1)'] }, { ease: 'linear' }),
  {
    container: document.getElementById('jk-scroll'), // NOT window — inner scroll
    target: document.getElementById('section-1'),    // the element to track
    offset: ['start end', 'end start'],              // enters bottom → exits top
  },
);
// scroll() returns a cleanup fn — push it to teardown (astro:before-swap).
```

- **Callback form:** `scroll((progress, info) => { … }, options)` — `progress` is
  `0→1` (Motion v11 put `progress` first, `info` second). v12 changed only the
  gesture callbacks (`inView`/`hover`/`press` first arg), **not** `scroll()`.
- **`container`** — the scrollable element. Pass the `#jk-scroll` DOM node.
  Default is `window`; wrong for this layout.
- **`target`** — a child tracked as it moves through the scrollport (uses layout
  position, ignores CSS `transform`).
- **`offset`** — `[ "<target> <container>", … ]`. Points: numbers `0–1`, names
  `start|center|end`, `px`, `%`, `vh`/`vw`. `['start end','end start']` = full
  pass through the scrollport; `['start start','end end']` = the default.
- **`trackContentSize: true`** — re-measure if content size changes (lazy images).
- **`axis: 'y'`** default.

## Pinning architecture (`position: sticky` — same for CSS and Motion)

Resolves the mandatory-snap ↔ tall-content tension, and is identical whichever
mechanism scrubs it: the wrapper supplies scroll distance; the sticky child stays
a `100svh` snap target. With **CSS**, scope a named `view-timeline` /
`scroll-timeline` to the wrapper and reference it from the child's
`animation-timeline`. With **Motion**, pass the wrapper/section as `target` and
`#jk-scroll` as `container`. Motion's own docs also state "pinning should be
performed with `position: sticky`" — so the markup below is shared.

```html
<div id="jk-scroll">                     <!-- scroll-snap-type: y mandatory -->
  <div class="narrative-wrap">           <!-- height: ~200svh → the scrub distance -->
    <section class="section" style="position:sticky; top:0; min-height:100svh;
                                    scroll-snap-align:start;">
      <!-- centred overview; .visual expands/collapses as `progress` scrubs -->
    </section>
  </div>
  <!-- normal exact-fit sections continue after -->
</div>
```

- Sticky child is `100svh` and carries `scroll-snap-align: start`, so it's still a
  clean snap point; the extra height lives in the wrapper, not the visible pane.
- The wrapper's height sets how much scroll = full scrub. Longer wrap = slower.
- Scrub with **transform/opacity only** (the animation invariant still holds).

## Non-negotiables for the POC

- **Reduced-motion / keyboard / no-JS static fallback:** under
  `prefers-reduced-motion: reduce`, and for keyboard/no-JS users, the section
  must render **fully readable with NO hijack** — show the detail expanded (or
  inline, all items visible), skip the scrub entirely. Never trap focus or
  swallow keyboard paging. Gate the JS: `if
  (!matchMedia('(prefers-reduced-motion: reduce)').matches) scroll(...)`.
- **Lifecycle:** set up in `init()` on `astro:page-load`, push `cancel()` to
  `teardown`, drop it on `astro:before-swap` — same contract as every other
  behavior here.
- **Touch/mobile:** sticky + snap behaves differently on touch; a scrubbed pin
  can feel laggy or fight momentum scrolling. Test on a real device. If it fights
  snap on touch, fall back to plain snap + reveal for that section (kill
  criteria — record in LEARNINGS).
- **Verify inside `#jk-scroll`, not the window** — progress is measured on the
  container; a window-scroll assumption reads zero.

## Sources (2026-07-05)

- caniuse — scroll-driven animations (Firefox gap): `caniuse.com/wf-scroll-driven-animations`
- Motion `scroll()` docs: `motion.dev/docs/scroll`
- Motion upgrade guide (v11/v12 callback change): `motion.dev/docs/upgrade-guide`
- MDN `animation-timeline: view()` / `scroll()` (custom containers)
- WebKit scroll-driven-animations guide (reduced-motion wrapping)
