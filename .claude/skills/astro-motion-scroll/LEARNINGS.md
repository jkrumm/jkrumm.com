# astro-motion-scroll — LEARNINGS

Append-only running log for animation/scroll work on jkrumm.com. Newest at the
bottom. **Every** animation/scroll task ends by adding an entry here (what
worked, what didn't, gotchas, POC verdicts). Entries get periodically distilled
up into `SKILL.md`; keep this as the raw log.

Entry format:

```
## YYYY-MM-DD — <short title>
- **Context:** what was being built / debugged.
- **Worked:** …
- **Didn't:** …
- **Gotcha:** …
- **Verdict / decision:** …
```

---

## 2026-07-05 — Phase 1: reveal system + snap stage established

- **Context:** Initial scroll stage — `#jk-scroll` inner scroll container, seven
  full-viewport sections, fixed top/bottom chrome bars, Motion reveals + progress
  line + active-section tracking + clock (`src/scripts/portfolio.ts`).
- **Worked:**
  - **Once-only reveals.** `inView` with a `data-revealed` flag so each element
    animates in a single time and settles at its true centred position.
  - **Progressive-enhancement hidden state in CSS** (`html.js .reveal`), applied
    by a `<head>` inline `.js` class before first paint → no FOUC; site is fully
    readable if JS never runs.
  - **`svh` sizing** for the stage and sections — stable across mobile URL-bar
    show/hide (vs `vh` which jumps).
  - **`overscroll-behavior: contain`** on `#jk-scroll` — traps the scroll chain,
    no rubber-band bleed, snap stays inside the stage.
  - **`+` corner marks centred on the corner point** via `translate(-50%,-50%)` —
    marks on adjacent cells overlap cleanly instead of doubling a few px apart.
  - Rooting every observer/`scroll()` in `#jk-scroll` (`root`/`container`), not
    the window — window-rooted observers never fire on an inner-scroll layout.
- **Didn't:**
  - **Replay-on-re-entry reveals.** The original design replayed reveals each
    time a section re-entered view. On the snap, full-viewport layout this faded
    content out/in at every boundary (double-motion jank) and left content
    displaced (`translateY`) when a section snapped mid-animation. Removed in
    favour of once-only.
- **Gotcha:** `scroll-snap-type: mandatory` fights any section taller than the
  viewport and fights intra-section scrolling — it keeps yanking back to a snap
  point. Site currently ships `y proximity` for that reason. Resolving this is
  Phase 2 (exact-fit sections + a pinned narrative stage for the one tall case).
- **Verdict / decision:** Lifecycle contract (`astro:page-load` init /
  `astro:before-swap` teardown), once-only reveals, CSS-hidden state, `svh`, and
  scroller-rooted observers are settled house style. Move to `mandatory` snap and
  the in-section narrative POC in Phase 2.

## 2026-07-05 — Narrative-mechanism research (pre-Phase-2)

- **Context:** Choosing the mechanism for the Phase-2 pinned/scrubbed narrative
  section. Researched CSS scroll-driven animations vs Motion `scroll()`.
- **Finding:** research raised a Firefox gap — FF (152–155, mid-2026) still ships
  CSS scroll-driven animations behind a flag; Chrome/Edge 115+, Safari 26+
  support them. Motion `scroll()` works everywhere (native `ScrollTimeline` +
  JS fallback on FF; ~5.2 KB, already a dep).
- **Owner decision (overrides the research's cross-browser-safe default):** prefer
  the **future-proof standards mechanism — CSS `animation-timeline: view()` /
  `scroll()`** — accepting the Firefox lag, *because the fallback is graceful*.
  The Firefox "silent failure" only exists if you skip the fallback; with a
  `@supports not (animation-timeline: view())` block, Firefox rides the **same
  static, fully-readable fallback we already mandate** for reduced-motion /
  keyboard / no-JS. So it's progressive enhancement, not breakage — and it matches
  the site's existing reveal philosophy. No polyfill (re-adds JS, negates the win).
- **Gotcha:** both mechanisms DO work inside a custom `overflow:auto` container
  (`#jk-scroll`) — that was a real worry and it's fine. Pinning = `position:
  sticky` inside a tall wrapper that supplies scroll distance; the sticky child
  stays a `100svh` snap target. That's the resolution to the mandatory-snap ↔
  tall-content tension, identical for CSS and Motion.
- **Verdict / decision:** **CSS `view()`/`scroll()` is the Phase-2 default**, with
  a solid `@supports` + reduced-motion static fallback. Motion `scroll()` stays
  the reserved fallback for the case where the static degrade reads as broken
  rather than merely plainer. Full detail in `references/scroll-narrative.md`.

## 2026-07-05 — Phase 2: mandatory snap + Experience narrative POC

- **Context:** Two workstreams: (1) switch to `y mandatory` snap and audit
  section heights; (2) build a CSS scroll-driven narrative on the Experience
  section as POC.
- **Worked:**
  - **Mandatory snap** is a single-line change (`proximity` → `mandatory`
    in `#jk-scroll`). At 1440×900 all sections fit exactly; at tablet
    (768×1024) only Home overflows (+71 px); at phone (500×800) five of seven
    sections overflow because content stacks vertically. The clamp() padding
    floors are already below practical thresholds (16 px binds only below
    320 px viewport height), so SectionShell tweaks don't help — the real
    resolution for tall sections is either content trimming or the narrative
    pattern.
  - **CSS `view-timeline` shorthand works in Chrome 149**, but the longhand
    `view-timeline-name` does NOT (`CSS.supports('view-timeline-name: test')`
    → false). The shorthand `view-timeline: --narrative` is what actually
    ships. Named `scroll-timeline-name` was also unsupported — ruled out.
  - **Keyframe cascade** — three staggered `@keyframes expand-detail-{1,2,3}`
    with per-role `animation-name` overrides produce a smooth sequential
    expand/collapse: role 1 peaks at timeline 28–50 %, role 2 at 38–55 %,
    role 3 at 48–62 %. Verified numerically (opacity readings at scroll
    positions) and visually.
  - **Center snap alignment** — switching the narrative stage from
    `scroll-snap-align: start` (default from `.section`) to `center` lands
    the snap at a position where the overview + first role detail is visible
    (role 1 opacity 1, role 2 ∼0.23, role 3 hidden). `start` alignment
    landed deep in the collapse phase (roles already fading out).
  - **Static fallback** — `@supports not (animation-timeline: view())` +
    `@media (prefers-reduced-motion: reduce)` both set `opacity: 1;
    transform: none` on `.narrative-detail`, so Firefox and reduced-motion
    users see all role scope text inline, fully readable. The baseline
    progressive-enhancement reveal system is untouched.
  - **`SectionShell` narrative prop** — clean: a boolean that wraps the
    section in `.narrative-wrap` (200 svh tall, carries the named view
    timeline) and adds `.narrative-stage` (sticky, 100 svh, center snap).
    Reusable for future narrative sections.
- **Didn't:**
  - **Mandatory snap fights programmatic scroll.** In headless Chrome,
    `scrollTo({behavior:'instant'})` followed by mandatory snap produced
    intermediate snap positions (gaps of ∼56 px) that don't match any
    known section boundaries — likely a Chrome headless quirk or an
    interaction with the sticky + snap combination. User-initiated scroll
    (trackpad/touch) behaves correctly: smooth scrub through the narrative
    zone, snap-to-nearest on release.
  - **Mobile/touch NOT tested.** The task requires real-device testing;
    headless Chrome can't emulate momentum scrolling. Flagged for the owner
    to validate on a phone/tablet. If it fights snap on touch, the kill
    criteria say fall back to plain snap + reveal for Experience.
  - **`scroll-timeline` on `#jk-scroll`** would have been simpler (measure
    the whole scroll range, no wrapper height math), but Chrome 149 doesn't
    support `scroll-timeline-name` either. The `view-timeline` on the wrapper
    is the only CSS-only path that works in current Chrome.
- **Gotcha:** `view-timeline-name` (longhand) ≠ `view-timeline` (shorthand)
  support — tested `CSS.supports('view-timeline-name: test')` → false but
  `CSS.supports('view-timeline: --test')` → true. `animation-duration` must
  be set to a non-zero value (used `1ms`) even for scroll-driven animations
  or the animation shorthand is invalid. Astro scopes `@keyframes` names, so
  animation-name references inside the same component work correctly.
- **Verdict / decision:** **POC ships.** The CSS scroll-driven narrative is
  smooth, the cascade effect adds polish, and the static fallback is solid.
  **Touch testing deferred** to the owner — if it fights snap on mobile, the
  kill path is to remove `narrative` from Experience's SectionShell and let
  it be a plain snap section. The `narrative` prop on SectionShell stays
  reusable regardless.

  **Pending:** promote `references/scroll-narrative.md` out of PROVISIONAL
  once touch validation passes. The mechanism (view-timeline shorthand,
  sticky pinning, center snap, @supports fallback) is the validated house
  pattern.

## 2026-07-05 — Phase 2 mandatory-snap revert: proximity + narrative, never mandatory

- **Context:** After shipping `y mandatory` snap with the narrative POC, the
  owner tested it live and rejected it: "this enforced full page scrolling is
  messing up the user experience immensely." Research followed (Smashing Mag,
  MDN, web.dev, CSS-Tricks, Reddit) — the verdict was unanimous.
- **Worked:** Reverting the single line (`mandatory` → `proximity`) restores the
  natural scroll feel. The narrative POC (CSS `view-timeline` on Experience) is
  the good part and stays. Added `scroll-snap-stop: always` on `.narrative-stage`
  so a fast flick on a trackpad doesn't skip the narrative section under
  proximity snap.
- **Didn't:** Mandatory snap fundamentally doesn't work for content portfolios:
  - It locks scroll even on sections that fit the viewport — the user can't
    pause mid-section or scroll a few lines without being yanked back.
  - At phone/tablet viewports (500–768 px wide), multiple sections overflow and
    mandatory snap makes them unscrollable — content is permanently hidden.
  - It reads as UX-hostile on trackpads where every gesture is a snap command.
  - It fights programmatic `scrollTo` (tested in headless Chrome).
- **Why every source says no:** Mandatory snap is for slides and carousels —
  short, width-fixed, exact-fit, no overflow, no partial scroll needed. A
  content portfolio is the opposite: variable-height content, inline scrolling
  for reading, user freedom to scan at their own pace.
- **Gotcha:** The only case where mandatory snap would ever work is a 7-page
  slideshow where every slide fits exactly — and even then, most modern
  portfolios use progressive disclosure (reveals + sticky + scroll-driven
  animations) instead, because it feels like content the user controls rather
  than a forced presentation.
- **Verdict / decision:** **Proximity snap is the permanent default.** The
  portfolio standard (2025–2026) is proximity + scroll-driven reveals + sticky
  sections — which the site already has. Mandatory snap is off the table
  permanently. Update `SKILL.md` to say "proximity + narrative, never
  mandatory." The narrative POC stays as a progressive enhancement; if it ever
  fights snap on touch devices, the kill path is to remove the `narrative` prop
  from Experience (keeping SectionShell's narrative support for future use).

## 2026-07-05 — Natural-height sections: snap removed entirely

- **Context:** After reverting mandatory→proximity snap, the owner asked to
  drop the full-viewport aesthetic entirely and go natural-height inline flow,
  per the research's recommended modern portfolio pattern.
- **Worked:**
  - **`#jk-scroll` is a plain scroll container** — dropped `scroll-snap-type`,
    `scroll-padding-*`, and `overscroll-behavior: contain`. Kept `scroll-behavior:
    smooth` (nav links still use it).
  - **`.section` is natural-height** — dropped `min-height: 100svh`,
    `scroll-snap-align`, centering flexbox (`display:flex; flex-direction:column;
    justify-content:center`), and the viewport-clamped padding. Replaced with
    `padding-block: 2.5rem; padding-inline: clamp(20px, 5vw, 72px)`. First
    section clears the fixed top bar with `padding-top: calc(var(--bar-top) +
    2.5rem)`.
  - **Narrative stage** — dropped `scroll-snap-align: center` and
    `scroll-snap-stop: always`. Sticky pinning + `view-timeline` is
    self-contained and doesn't need snap at all. Added `padding-block: 2.5rem`
    to `.narrative-wrap` so it flows naturally between adjacent sections.
  - **Build stays green** (0/0/0). Reveal system, progress line, clock,
    active-section tracking all unaffected — they run on `inView`/
    `IntersectionObserver`, not snap.
  - **SKILL.md rewritten** — all snap language removed from every section.
    §4 is now "Natural-height sections (no scroll-snap)" with the permanent
    rationale. §5 (old §6) updated. Repo decisions codify "no snap, period."
    `references/scroll-snap.css` marked historical.
- **Didn't:** Nothing — this was a pure removal of a mechanism that had already
  been rejected.
- **Gotcha:** The `ClientRouter` re-init pattern, the `inView` reveal system,
  and the CSS `view-timeline` narrative POC all survived untouched. They were
  never coupled to snap — they just happened to coexist in the same container.
  The only coupling was `scroll-snap-align` on sections and
  `scroll-snap-stop` on the narrative stage, both removed.
- **Verdict / decision:** **Natural-height is the permanent layout.** The site
  is now a plain scrolling page with Motion reveals + one CSS scroll-driven
  narrative section. This is the modern portfolio pattern (2025–2026):
  progressive disclosure via scroll-driven reveals and sticky sections, zero
  snap. No scroll-hijack libraries, no forced page transitions — content the
  user controls at their own pace.
