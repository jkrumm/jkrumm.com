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
- **Document scroll — observers take no root.** The page scrolls the document,
  not an inner container. `inView`/`IntersectionObserver` get `root: null` (or no
  `root` at all) and Motion `scroll()` gets **no** `container`. The old
  "root everything in `#jk-scroll`" rule is **retired**: that container is
  deleted, and reinstating a `{ root: scroller }` / `{ container: scroller }`
  argument means the observer silently never fires. Do not bring it back.
- **Hidden state in CSS, not JS.** Apply reveal-hidden state via `html.js .reveal`
  before first paint — never hide in JS (causes FOUC). Content must be fully
  readable with JS disabled.
- **A `.reveal` may wrap anything.** The old "only over an opaque cell" rule is
  **retired** with the line-coloured bento backdrop — there is nothing left for
  opacity 0 to flash through and no hairline gap for `translateY` to expose. Put
  `.reveal` wherever it reads best: a section, a list, a single row. The travel is
  **8px** (`y: [8, 0]` in `portfolio.ts`, `translateY(8px)` in `html.js .reveal`);
  those two numbers must stay in sync — the CSS paints the hidden start state, the
  JS animates out of it.
- **Motion budget: reveals + scroll-spy, nothing else.** Both live in
  `src/scripts/portfolio.ts`. The only scroll-linked effect on the site is the
  **CSS-only** article progress line (`animation-timeline: scroll(root block)` in
  `ArticleLayout.astro`). No scroll-linked JS on the homepage — no hero collapse,
  no bar fade, no JS progress bar. Adding one needs an explicit decision, not a
  reflex.
- **Native + Motion, not scroll-hijack libraries.** Prefer native scroll +
  Motion `inView`/`scroll` over fullPage.js / Lenis / GSAP ScrollTrigger /
  Locomotive. Reach for one only if a POC proves native + Motion genuinely can't
  do it (a researched decision, not a default). Do not add animation dependencies
  without that proof. (No scroll-snap anywhere — see the skill.)

See the `astro-motion-scroll` skill for the working patterns and `LEARNINGS.md`.
