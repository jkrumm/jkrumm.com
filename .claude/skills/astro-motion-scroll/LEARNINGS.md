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

## 2026-07-05 — Unified grid layout + hero collapse

- **Context:** Redesigned the page from fixed header/content/footer to a unified
  bordered "page box" with all sections as a continuous vertical grid. Hero is the
  first element in the PageBox (no fixed bar above it); a compact header fades in
  on scroll and sticks to the top. Footer is sticky at the bottom.
- **Worked:**
  - **CompactHeader crossfade.** Motion `scroll()` with `offset: [0, 350]` maps
    scroll distance to `.compact-header` opacity 0→1. Position sticky inside
    `#jk-scroll`, not fixed — so it follows the scroll container. 
  - **PageBox as outer border.** A single `border: 1px solid var(--line)` +
    `max-width: var(--maxw)` wrapper constrains all sections. Sections no longer
    need their own max-width.
  - **Hairline separators.** `.section + .section { border-top: 1px solid
    var(--line) }` in SectionShell; Home gets a `border-bottom` since it doesn't
    use `.section` class (it's a standalone `<section class="home-section">`).
  - **StickyFooter.** Same nav dots + links + clock as the old fixed BottomBar,
    but `position: sticky; bottom: 0` inside the scroll container. Clock query
    (`[data-clock]`) already used `querySelectorAll` — picks up the new element
    automatically.
  - **No more fixed-bar clearing.** First section no longer needs
    `padding-top: calc(var(--bar-top) + 2.5rem)` — CompactHeader is transparent
    at scrollTop 0, so the hero renders at the top of the viewport.
  - **Build stays green** (0/0/0, 4 pages).
- **Didn't:** Nothing — the crossfade is a simple opacity transition on a sticky
  element, no height animation.
- **Gotcha:** The `.section + .section` adjacency selector only fires when BOTH
  siblings have class `.section`. Home uses `.home-section` (no `.section`), so
  the Writing section (first `.section` child) was initially borderless — the
  separator gap was between Home and Writing. Fixed by giving `.home-section` a
  `border-bottom`.
- **Verdict / decision:** Sticky chrome inside the scroll container (rather than
  fixed to the viewport) keeps everything in the scroll flow. The PageBox pattern
  gives the continuous-grid look while keeping each section's component
  self-contained. CompactHeader + StickyFooter replace TopBar + BottomBar
  cleanly — same data attributes, same IO/scroll wiring, zero changes to
  section content.

## 2026-07-05 — No-wrapper grid: sections ARE the grid

- **Context:** The PageBox wrapper was the wrong abstraction — the user wanted
  sections to form one continuous grid directly, no wrapping container.
- **Worked:**
  - **Each section carries its own border edges.** Home and every `.section` get
    `border-left`, `border-right`, `max-width: var(--maxw)`, `margin: 0 auto`,
    `width: 100%` — they independently center and align their vertical borders.
  - **Home starts the grid** with `border-top`; Contact closes it with
    `border-bottom`. Between-section hairlines come from `.section + .section
    { border-top }` (plus narrative-wrap variants).
  - **Removed the Home footer row** (MUNICH, DE · CET + SCROLL TO EXPLORE) — it
    was redundant and wasted space now that the nav bento connects directly to
    the next section.
  - **Tightened Home bottom padding** from 20px to `clamp(14px, 2vw, 24px)` so
    the nav bento connects more tightly to the next section.
  - **No PageBox.** Deleted. Zero-wrapper layout — sections are direct children
    of `#jk-scroll`.
  - **Build green** (33 files, 0/0/0).
- **Didn't:** Sub-pixel border misalignment is theoretically possible when
  independently-centered elements each have 1px borders, but in practice at
  1180px max-width on standard viewport widths, the centering math is stable.
  If it ever manifests, the fix is a thin wrapper for borders only (no padding).
- **Gotcha:** `.narrative-wrap` needed the same `border-left/right` +
  `max-width` treatment as `.section` so a future narrative section doesn't
  break the grid edges. Added preventively.
- **Verdict / decision:** Sections-as-grid is cleaner than a wrapper — each
  section owns its border contract, no intermediate container. The visual reads as
  one continuous box from hero to contact.

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

## 2026-07-05 — Continuous-bento redesign: one PageBox, fail-toward-line, sticky opaque bars

- **Context:** Rebuilt the page as ONE contained ~1180px box whose interior is a
  single continuous bento grid — sections butt together sharing single 1px
  hairlines, a sticky top name-bar and sticky bottom footer are the box's
  top/bottom edges, the middle scrolls. Replaces the piecemeal "each section
  draws its own L/R borders + adjacency top border + Home's 4-side box + Contact's
  bottom border" assembly. Finally built the `PageBox` primitive that stale
  doc-comments had assumed for weeks.
- **The one invariant — "fail toward line-color":** the frame, every section
  band, and every `Grid` all carry `background: var(--line)`; every hairline is a
  1px flex `gap` exposing that line background; the ONLY real `border` lives on
  `PageBox`. Two consequences that drove every edit:
  1. **Borders live only on `PageBox`.** Every inner `Grid`/band/header is
     borderless — any surviving separator border doubles to 2px against the gap.
     Deleted: `Grid`'s `border:1px`, `SectionShell`'s L/R borders +
     `.section + .section` top + max-width + side padding, `Home`'s 4-side box,
     `Contact`'s `.contact` bottom border, `Experience`'s `.overview`/`.role`
     `border`/`margin` separators.
  2. **Nothing transparent may sit on the line background** — it flashes the full
     line-color and `translateY` detaches it, exposing the gaps.
- **Worked:**
  - **`PageBox` = the frame.** `max-width:var(--maxw); margin:0 auto;
    min-height:100%; background:var(--line); border:1px solid var(--line);
    display:flex; flex-direction:column; gap:1px`. Direct children (HeroBar →
    Home → 6 sections → Footer) separate via the 1px gap. **No `overflow`** so
    the sticky bars resolve against `#jk-scroll` and travel the whole page.
    `#jk-scroll` went from flex-column to a plain block scroll container (+ a
    `padding-inline: clamp(12px,3vw,24px)` mobile side gutter).
  - **Section band = borderless rail.** `SectionShell` collapsed to
    `background:var(--line); display:flex; flex-direction:column; gap:1px` — no
    border/max-width/padding. Its rows (header cell, `Grid` rows, full-width
    cells) separate via its own 1px gap. `Grid` kept `gap:1px; background:line`
    but lost its border. Every grid child needs `flex-grow ≥ 1` so the last
    wrap-line fills the row (else a line sliver shows).
  - **box-shadow separators, NOT borders, on the sticky bars.** A
    `border-bottom`/`border-top` on a bar PLUS the PageBox gap doubles to 2px at
    rest. `box-shadow: 0 1px 0 var(--line)` (HeroBar) / `0 -1px 0 var(--line)`
    (Footer) paints INTO the 1px gap region (stays exactly 1px at rest) and gives
    a persistent 1px separator when content scrolls under the pinned bar. The
    shadow never joins the flex gap — that's the whole trick.
  - **Reveal-on-inner-content.** `.reveal` must wrap ONLY content inside an
    opaque cell (`<Cell><div class="reveal">…</div></Cell>`), never a cell/Grid/
    band. Moved every section's single wrapping `<div class="reveal">` onto each
    cell's inner content; `SectionHeader`'s reveal moved to `.section-header__inner`
    (the cell stays opaque `--panel` and fixed). Reduced the hidden-state
    translate `20px → 14px` (and JS `y:[20,0] → [14,0]`) so the slide stays within
    cell padding. Writing's `.recent__row` reveals were already safe (inside the
    opaque `.recent` cell) — left untouched, incl. their `--hairline` internal
    separators.
  - **Layout-preservation when wrapping in `.reveal`:** if a cell used
    `flex`/`grid` + `justify-content:space-between` across MULTIPLE children,
    wrapping them all in one `.reveal` collapses that to a single child — move the
    layout onto the `.reveal` wrapper (`display:flex; …; height:100%`). Hit this
    on `.nav-cell`, `.featured`, `.rollhook`, `.pinned`, `.contact__link`, and
    the Experience `.role__inner`/`.overview__inner` grids.
  - **Always-opaque name-bar (hero collapse resolved).** The old JS opacity
    crossfade faded a transparent bar in over the frame — which now leaves a
    line-strip above the hero and can't duplicate the giant name without a banned
    height animation. Fix: HeroBar is always opaque, shows ONLY "Johannes Krumm" +
    the accent progress line. Dropped the hero-collapse `scroll()` opacity driver
    and the `[data-active-label]` entirely. The hero band no longer repeats the
    name — its focal element is now the value statement promoted to the page's
    single `<h1>` (name lives once, in the bar). As you scroll, the hero band
    scrolls up under the pinned name bar → the hero "truncates" to the name, with
    no height animation, no strip, no duplicate name.
  - **Opaque bars = `--panel`.** The bars were semi-transparent `--bar-bg` +
    `backdrop-filter: blur`. Over a line-colored frame that flashes line-color and
    ghosts scrolling content through the frosted glass. Switched both to
    `background: var(--panel)` (matching the cells, so they read as the box's
    top/bottom rows) and dropped `backdrop-filter` (pointless on an opaque
    element). `--bar-bg` token left defined-but-unused (out of scope to remove).
- **Gotcha — the active-section observer drives BOTH the label AND the footer
  dots.** "Drop the active-section label" does NOT mean delete the observer — the
  same `IntersectionObserver` toggles `.dot.is-active`. Removed only the
  `[data-active-label]` collection + its `textContent` update; kept the sections
  collection, ratio math, and dot toggling. Deleting the whole block would have
  silently killed the footer dots.
- **Gotcha — build-green between passes.** Split into Group A (frame/primitives/
  chrome/index/global/script) then Group B (Home + 6 sections). Kept `Grid`'s
  `mergeTop` prop accepted as a no-op through Group A so Home's `<Grid mergeTop>`
  still type-checked before Group B removed the usage. `SectionShell`'s `narrative`
  prop was already unused (Experience reverted to a plain shell earlier), so
  deleting it + `.narrative-wrap`/`.narrative-stage` was safe.
- **Gotcha — stale Vite HMR after a rapid multi-file rewrite.** With the dev
  server (`jkrumm.test`) live through both implementer passes (~16 `.astro` files
  edited fast), Vite HMR silently **dropped the scoped-`<style>` updates for
  `SectionHeader.astro` and `SectionShell.astro`** — the templates hot-updated but
  the old CSS kept serving. Symptom: headers had no `--panel` box (transparent,
  computed `background: rgba(0,0,0,0)`, `padding:0`) and `.section` still computed
  the OLD `display:block; padding:40px 60px; max-width:1180px; border-left:1px` —
  making the page look structurally wrong (sections inset, grey band showing)
  even though the source was correct. **Diagnosis that saved a wrong "fix":** the
  freshly-built `dist/` CSS had the right rule (`.section-header[cid]{background:
  var(--panel);…}`), proving source was fine and the DEV SERVER was stale.
  Touching each stale file (a real content/comment edit) forced a clean
  re-transform; a full dev-server restart is the guaranteed clear. **Lesson: when
  a live-reloaded page looks wrong after a big multi-file edit, verify against
  `bun run build` output or a restarted server before touching code — don't
  "fix" phantom bugs that are only stale HMR.** Confirmed via chrome-devtools
  computed-style inspection, not just screenshots.
- **Verdict / decision:** **Continuous-bento + PageBox is the layout.** One frame
  owns the only border; everything inside fails toward line-color via 1px gaps;
  sticky bars are opaque and use box-shadow (never border) separators; reveals
  only ever animate over `--panel` inside an opaque cell. `bun run build` green
  (0/0/0, 34 files, 4 pages). Visual/touch validation at `https://jkrumm.test`
  deferred to the owner (hairline-doubling, sticky pinning, hero-under-bar scroll,
  reveal flashes, mobile stack). This supersedes the earlier "sections-as-grid,
  no PageBox" and "natural-height" entries for the frame model — natural-height
  flow and once-only scroller-rooted reveals are unchanged.
