---
paths:
  - src/scripts/**
  - src/styles/**
  - src/components/**
---

# Animation invariants (jkrumm.com)

Always-apply rules for any scroll/animation work. The **how** lives in the
`astro-motion-scroll` skill and its `references/`; these are the non-negotiables.

- **Transform + opacity only.** Never animate `width/height/top/left/margin`.
  Use `transform` (translate/scale) and `opacity` so work stays on the compositor.
- **`prefers-reduced-motion` always honored.** Guard every JS animation with
  `matchMedia('(prefers-reduced-motion: reduce)')` AND keep the CSS opt-out. A
  media query alone can't stop an already-running tween — you need both.
- **Lifecycle-aware.** `<ClientRouter />` soft-swaps, so re-init all
  observers/animations on `astro:page-load` and tear them down (stop/disconnect/
  clearInterval) on `astro:before-swap`. Register every side effect for cleanup.
- **Root observers in `#jk-scroll`.** The page scrolls inside that container, not
  the window. Every `inView`/`IntersectionObserver` needs `{ root: scroller }`,
  every Motion `scroll()` needs `{ container: scroller }`.
- **Hidden state in CSS, not JS.** Apply reveal-hidden state via `html.js .reveal`
  before first paint — never hide in JS (causes FOUC). Content must be fully
  readable with JS disabled.
- **Reveals only animate over an opaque cell.** The homepage is line-colored
  bento — one `PageBox` owns the only border; everything inside is borderless with
  1px line-colored gaps. A `.reveal` must wrap content INSIDE an opaque `--panel`
  cell, never a cell, grid, or band: opacity 0 over `var(--line)` flashes
  line-color and `translateY` detaches the element, exposing the hairline gaps.
  Keep the reveal `y` small (≈14px) so it stays within cell padding.
- **Native + Motion, not scroll-hijack libraries.** Prefer native scroll +
  Motion `inView`/`scroll` over fullPage.js / Lenis / GSAP ScrollTrigger /
  Locomotive. Reach for one only if a POC proves native + Motion genuinely can't
  do it (a researched decision, not a default). Do not add animation dependencies
  without that proof. (No scroll-snap anywhere — see the skill.)

See the `astro-motion-scroll` skill for the working patterns and `LEARNINGS.md`.
