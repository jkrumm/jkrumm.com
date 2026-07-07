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

## 2026-07-05 — Hero → compact-bar scroll-driven collapse (the first real hero transform)

- **Context:** First true scroll-driven transform on the hero. The big hero
  (eyebrow + value statement) should "shorten smoothly into" the compact top bar
  as you scroll; the bar then shows **Johannes Krumm** (left) + the **current
  section** (right). This deliberately REVISITS the continuous-bento decision that
  dropped hero-collapse — see the reconciliation below.
- **The reconciliation (why this is allowed now):** the continuous-bento entry
  killed hero-collapse because "fading a *transparent* bar in over the frame
  leaves a line-strip above the hero and can't duplicate the name without a banned
  height animation." Resolution that keeps BOTH constraints: the bar stays
  **always opaque + sticky** (structural, its background never fades — no
  line-strip), and we scroll-drive only its **content** (name/section text) plus
  the hero's **inner content**. Opacity/transform only, no height anim, no
  transparent bar over line. So "no hero collapse possible" is now superseded:
  *always-opaque bar + scroll-driven content* is the pattern.
- **Worked:**
  - **Crossfade collapse reads as a shrink with zero height animation.** Over the
    first hero-height of scroll: hero content `opacity 1→0` + `translateY 0→-22px`
    (fades/lifts out), while bar name+section `opacity 0→1` + `translateY 6→0`
    (arrive). Different text on each side (statement vs. name) — it's a *collapse*,
    not a literal text morph, which matches the ask exactly.
  - **Reused the already-proven Motion signature — no new/version-sensitive API.**
    `scroll(cb, { container: scroller })` was already shipping (progress line);
    the collapse reads `scroller.scrollTop` directly inside that same callback and
    maps it against a measured zone. Sidesteps the version-sensitive
    `scroll({ target, offset })` element-tracking + `info.y.current` API entirely,
    so no `/research` round-trip was needed (reusing in-repo-proven code ≠ coding
    from memory). **Folded into the ONE existing scroll subscription** (progress +
    collapse in a single listener) rather than adding a second.
  - **Fade INSIDE the opaque cell, never the cell.** `[data-hero-collapse]` is a
    layer *inside* `.hero__content` (opaque `--panel`), wrapping the existing
    `.reveal`. Fading it to 0 reveals the opaque panel, not line-color; the -22px
    lift stays within the cell's `clamp(30,52)px` padding so no hairline gap is
    exposed. Bar name/section fading is text over the opaque bar — also safe. The
    entrance `.reveal` (load) and the collapse layer (scroll) are separate
    elements, so their inline opacity/transform compose cleanly (product), no
    conflict.
  - **Flash-free start state mirrors the `.reveal` system.** `:global(html.js)
    .compact-header__name/__section { opacity:0; transform:translateY(6px) }` hides
    them before first paint (JS present) so the fade-in has somewhere to come from;
    `@media (prefers-reduced-motion: reduce)` forces them visible with
    `!important`; no-JS leaves them visible (CSS default). `init()` also calls
    `applyCollapse()` once synchronously to set the p=0 state before the first
    scroll event. The hero layer needs no pre-hide — at p=0 it's opacity 1 = its
    default, so no flash.
  - **Reduced motion = clean degrade.** `collapseActive = !prefersReducedMotion()
    && hero elements exist`. When off, the driver never runs → hero stays visible,
    bar name+section stay visible (CSS/`@media` override) — i.e. the *current*
    always-visible bar. Progress line still runs (unchanged, unguarded as before).
  - **Right-side label = revived `[data-active-label]`, now legit.** The
    continuous-bento entry deleted `[data-active-label]` because it lived on a
    fading bar. It's back because the bar is always opaque now. Extended the
    existing active-section `IntersectionObserver` (which already picks `best` and
    toggles footer dots) to also `textContent = best.dataset.name`. Every section
    already carries `data-name` (SectionShell prop + Home's `data-name="Overview"`)
    — no markup churn. Did NOT touch the dots/ratio logic (that observer drives
    both — same trap noted before).
  - **Zone measured once + on resize, never per-frame.** `zone =
    max(heroMeasure.offsetHeight, 220)` read at init and on `resize` (both
    teardown-registered), not inside the scroll callback — avoids a per-frame
    reflow. Shaping: hero gone by 72% of the zone, bar fully in over 12%→72%, so
    both settle after ~200px of scroll.
- **Didn't / N/A:** Considered the idiomatic `scroll({ target, offset:["start
  start","end start"] })` element-tracking — rejected in favor of `scrollTop` to
  avoid a version-sensitive API for no benefit here. Considered a literal
  name-scale morph (`transform: scale` on a shared name) — rejected: the hero's
  focal H1 is the value statement, the name only lives in the bar, so there's no
  shared element to morph; the crossfade matches the brief and is simpler.
- **Gotcha:** the **sideclaw `check` MCP bridge was down** — every call (even bare
  `cwd`, no `commands`) returned `SyntaxError: Failed to parse JSON` at the
  transport layer. Fell back to `bun run build` directly (the repo's own
  validator). Not an input problem.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0, 34 files, 4
  pages); all five data-hooks + the collapse driver + `prefers-reduced-motion`
  confirmed present in `dist/` HTML and the minified bundle. Visual/touch
  validation at `https://jkrumm.test` deferred to the owner (collapse feel, the
  brief empty-bar-at-top instant, the -22px lift staying inside cell padding,
  mobile stack where the hero cell is shorter → 220px floor kicks in). **Pattern
  to keep:** hero→bar collapse = always-opaque sticky bar + scroll-driven *content*
  (never fade the bar or a cell), driven off `scrollTop` inside the existing
  `scroll(cb,{container})` subscription, flash-free via `:global(html.js)`
  pre-hide. This supersedes the "hero collapse dropped, name always shown" note in
  the continuous-bento entry.

## 2026-07-05 — Compact bar → fixed reveal-on-scroll overlay + 10px floated box

- **Context:** Owner rejected the always-present bar: a sticky first-child bar
  **reserves a 60px opaque row at the top on load** ("it is there in the beginning
  which sucks"). Wanted: bar ABSENT at top (hero is the box's top edge), reveals
  once the hero is scrolled past. Plus: float the whole bento box with ~10px
  top/bottom margin so it doesn't touch the viewport edges.
- **The layout insight — a sticky first-child ALWAYS reserves its box.** You can't
  make a `position: sticky; top:0` first flex-child "not be there" at the top:
  `transform`/`opacity` don't reclaim its 60px row, and negative-margin-into-a-flex-
  gap is fragile. The reserved empty strip is inherent to sticky-in-flow. Fix:
  take the bar OUT of flow.
- **Worked — bar is now a `position: fixed` overlay:**
  - Fixed removes it from the PageBox flex flow entirely → **zero reserved space**;
    the hero is the box's top edge on load. `top:10px` aligns it with the floated
    box's top gutter.
  - **Alignment reconstruction** (fixed is viewport-relative, so being a PageBox
    child no longer aligns it): outer positioner is `fixed; left:0; right:0;
    padding-inline: clamp(12px,3vw,24px)` (mirrors the `#jk-scroll` side gutter);
    inner `.compact-header__bar` is `max-width:var(--maxw); margin:0 auto`. That
    lands the opaque bar exactly on the box at every width. The hidden webkit
    scrollbar (`width:0`) means `right:0` == the box's right gutter — no offset.
  - **Fixed is safe here:** verified NO ancestor of `#jk-scroll` sets
    `transform/filter/perspective/contain/will-change` (would’ve made fixed
    resolve against that ancestor instead of the viewport). `overflow-y:auto` on
    `#jk-scroll` does NOT create a containing block for fixed and does NOT clip it.
    `<body>` → `<main#jk-scroll>` directly, clean.
  - **This RESOLVES the old "line-strip" constraint** (2026-07-05 continuous-bento
    killed fading the bar because a transparent flex-child bar showed the 1px line
    gap behind it). As an OVERLAY the bar isn't over the PageBox line gap — behind
    it is the viewport margin (invisible at opacity 0) or scrolled content (when
    opaque). So fading the whole bar (background included) as one unit is fine now;
    the always-opaque-sticky workaround is no longer needed.
  - **Whole-bar reveal, not per-element content fade.** Driver maps hero-zone
    progress: hero content fades/lifts out over 0→72%, then the bar reveals over
    50%→95% (opacity 0→1 + `translateY(-10→0)`), so it "arrives once the hero is
    past." `pointerEvents` toggled off below ~2% so the invisible bar never eats
    clicks on the hero beneath it.
  - **10px floated box = `padding:10px clamp(...)` on `#jk-scroll`.** Single
    change: `padding-block:10px` insets the box off top/bottom (side gutter kept).
    Sticky footer `bottom:0` resolves against the padded edge → floats 10px above
    the viewport bottom automatically; fixed bar `top:10px` matches the top. Both
    edges align with the box with no per-element math.
  - **Zone hook moved to the whole hero band** (`data-hero-measure` from the
    content cell → the `.hero` Grid, which forwards `...rest`), so "scrolled past
    the hero" maps to the full band height, not just the text cell.
- **Reduced motion:** driver still runs, but the hero collapse is skipped (hero
  stays visible) and the bar reveals via **opacity only** (`transform:none`) — a
  cross-fade is vestibular-safe; the slide isn't applied.
- **No-JS:** `.compact-header__bar` defaults to `opacity:0` (hidden) — a fixed
  opaque bar visible-by-default would cover the hero, so unlike `.reveal` (visible
  by default) the bar must be hidden by default and JS-revealed. The name is
  scroll-chrome (also in `<title>`/JSON-LD), so its no-JS absence is acceptable.
  init()'s synchronous `applyDrive()` sets the scroll-0 state before first scroll
  → no flash; no `html.js` pre-hide needed since the CSS default already = hidden.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0, 34 files, 4
  pages); `position:fixed;top:10px`, `padding:10px clamp(...)`, and all driver
  hooks confirmed in `dist/`. Visual/touch validation at `https://jkrumm.test`
  deferred to owner (bar/box alignment across widths, the 10px float, reveal
  threshold feel, footer 10px gap, mobile). **Pattern to keep:** a reveal-on-
  scroll top bar here is a **fixed overlay** (outer full-width gutter positioner +
  inner max-width-centered bar), hidden-by-default, revealed as a whole via the
  existing `scroll(cb,{container})`+`scrollTop` driver — NOT a sticky flow-child
  (which always reserves its row). Floating the box is `padding-block` on
  `#jk-scroll`; sticky/fixed chrome auto-aligns to the padded edges. This
  supersedes the always-opaque-sticky-bar approach from the two entries above.

## 2026-07-05 — Float-gap bg caps + frame borders on the pinned chrome

- **Context:** Follow-ups on the floated box: (1) content scrolls through the
  10px float gaps and peeks ABOVE the fixed bar / BELOW the sticky footer; (2)
  reveal the bar earlier + faster; (3) the box lost its top/bottom frame line
  where the opaque chrome covers it.
- **Why content peeks in the float gap:** `#jk-scroll` has `padding-block:10px`.
  A scroll container's padding region is INSIDE the scrollport (visible) — content
  scrolls through it before clipping at the scrollport edge. The bar/footer only
  cover their own 60/52px, not the 10px gap beyond, so a sliver of scrolling
  content shows in the gap. The scroller's own `--bg` background sits BEHIND that
  content, so it doesn't hide it — you need an opaque layer ON TOP (above content
  z-order) in the gap band.
- **Worked — opaque bg caps in the gap bands (always painted, read as margin):**
  - **Top cap** = `::before` on the fixed `.compact-header` positioner. Moved the
    positioner to `top:0` + `padding-top:10px` (bar stays at y=10, unchanged) and
    the `::before` (absolute, `top:0; height:10px; background:var(--bg)`) fills the
    0–10px band. It's inside the fixed, z-60 positioner → paints above content.
    Crucially it CANNOT be the whole positioner's background (that would cover the
    hero at y=10–70 when the bar is hidden at scroll 0) — only the 10px band.
  - **Bottom cap** = `::after` on `.sticky-footer`, but `position:fixed;
    bottom:0; height:10px` (NOT absolute). The footer is `position:sticky`, which
    is a containing block for ABSOLUTE children but NOT for FIXED — so a fixed
    pseudo resolves against the viewport (no ancestor transform), pinning the cap
    to the viewport bottom exactly over the 10px band below the footer. An
    absolute `::after {top:100%}` was wrong: `top:%` is padding-box-relative, so it
    landed inside the border. Fixed-to-viewport-bottom sidesteps all that and lines
    up with the footer (which rests at 10px above the viewport edge via the
    scroller padding). Fixed pseudo is painted in the footer's z-60 stacking
    context → above content, and `overflow` on `#jk-scroll` doesn't clip fixed.
  - Both caps are `--bg` (match the margin) and ALWAYS painted — at rest they ARE
    the 10px margin; while scrolling they hide the content passing through it.
- **Worked — frame borders on the pinned chrome:** the floated PageBox has a 1px
  `--line` border all round, but the opaque bar (overlay) and the bg caps cover the
  frame's top/bottom edges → the box looked open-topped/bottomed.
  - **Bar** (fixed OVERLAY): `box-shadow` bottom separator → full `border:1px solid
    var(--line)`. Because the overlay is the SAME box width as PageBox, its border
    sits exactly on PageBox's border (lines coincide, no 2px doubling — the overlay
    is out of flow, so the flex-gap-doubling rule doesn't apply). `border-top` is
    the line between the top bg cap and the bar; `border-left/right` keep the L/R
    frame continuous through the top 60px the overlay covers.
  - **Footer** (in-FLOW flex child): added `border-bottom:1px solid var(--line)`
    only — NOT L/R (those would double against PageBox's border, since the footer
    is inside it; PageBox already draws the L/R frame beside the footer). The
    border-bottom rests just above the fixed bottom cap = the box's bottom frame
    line. Kept the `box-shadow: 0 -1px 0` top separator.
  - **Rule of thumb:** an OVERLAY (fixed/absolute, out of flow) at box width can
    carry a full border — it coincides with PageBox's. An IN-FLOW child inside the
    PageBox border must only add the ONE edge PageBox doesn't already cover
    (here: bottom), or it doubles.
- **Worked — earlier/faster reveal:** bar reveal window `(p-0.5)/0.45`
  (50%→95%) → `(p-0.3)/0.3` (30%→60%). Hero fade left at `/0.72`. Minifier drops
  the leading zero, so verify built JS as `(t-.3)/.3`, not `0.3`.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0, 34 files);
  built CSS confirms `border:1px solid var(--line)` (bar), `border-bottom:1px solid
  var(--line)` (footer), two `height:10px` `--bg` caps, two `position:fixed`; built
  JS confirms `(t-.3)/.3`. Visual validation at `https://jkrumm.test` deferred to
  owner. **Patterns to keep:** to hide content in a scroll-container padding/float
  gap, paint an opaque cap ABOVE content in that band (scroller bg behind content
  won't do it); a fixed-to-viewport pseudo is the clean way to pin a cap under a
  STICKY bar. Frame borders: full border on out-of-flow overlays (coincides with
  the frame), single-edge only on in-flow children inside the frame border.

## 2026-07-05 — Footer nav: expanding pill nav (desktop) + upward popover (mobile)

- **Context:** Rebuilt `StickyFooter` from a static dot row into the site's real
  section navigator. Desktop: a `pill nav` — each section is a dot; the ACTIVE
  one is "open" (label revealed); hovering/focusing any pill opens it and closes
  the others (one open at a time); the open pill glides to the newly-active
  section on scroll. Mobile (≤640px): a single current-section button opens a
  small popover UPWARD listing every section as a tappable anchor. One
  IntersectionObserver drives all three surfaces (pills, popover trigger label,
  compact top-bar label); all "soft-refresh" on scroll. In `portfolio.ts` +
  `StickyFooter.astro`; no new deps (Motion `animate` only).
- **The one real tension — collapse-to-dots needs a SIZE animation.** A tight
  dot row that expands one label and reflows the others *cannot* be done on the
  compositor alone: `clip-path`/`scaleX` hide/show visually but don't reflow
  siblings, so the row can't stay tight. `translateX`-only FLIP repositions
  siblings but each item revealing its own label is still a per-element size
  change. **Confirmed there is NO pure transform/opacity way to do
  collapse+reflow+resize.** Owner approved a **scoped `width` exception for the
  footer pills only** (negligible cost for a 7-item nav); every other property
  (label fade, dot morph, popover, soft-swap) stays strictly transform+opacity,
  so the invariant is intact for all scroll work. Documented at the call site.
- **Worked:**
  - **Measure the label while it's clipped.** `.pill__reveal { overflow:hidden;
    width:0 }` (under `html.js`) clips the label; the label is `flex:none;
    white-space:nowrap` so its `offsetWidth` is the FULL intrinsic width even
    while the parent is 0-wide. `animate(reveal, { width: `${offsetWidth}px` })`
    → open; `animate(reveal, { width: 0 })` → close. `flex:none` is load-bearing:
    without it a flex child squishes to 0 and `offsetWidth` reads 0.
  - **Back-out ease = spring-like pop with no spring API.** Width opens on
    `ease:[0.34,1.35,0.5,1]` (overshoot), closes on `[0.4,0,0.2,1]`. Reused ONLY
    the repo-proven `animate(el, target, {duration, ease})` signature (no
    `type:'spring'`, no `stagger()`, no `.finished`/`onComplete`) — so nothing
    version-sensitive to research.
  - **Label fade from CURRENT value, no CSS `is-open` opacity rule.** First
    instinct — `.pill.is-open .pill__label { opacity:1 }` + `animate(label,
    {opacity:1})` — BREAKS the fade: adding the class sets computed opacity to 1
    *before* Motion reads the start value, so it animates 1→1 (no fade). Fix:
    JS owns the label opacity entirely (`html.js .pill__label {opacity:0}`,
    Motion animates from the current 0); no `.is-open` opacity rule. No-JS shows
    labels via the base rule (visible-by-default, mirrors `.reveal`).
  - **`hoverIndex ?? activeIndex` (nullish, not `||`).** `openIndex` follows the
    hovered pill, falling back to the active section. Must be `??` — index 0
    (Home) is falsy and `||` would wrongly skip it. `setActive` only calls
    `resolveOpen` when `hoverIndex === null`, so a scroll-driven active change
    never fights an in-progress hover.
  - **Popover = `inert` + opacity, not `hidden`/`display:none`.** The panel is
    always rendered; closed = `inert` attribute (blocks interaction + hides from
    AT) + CSS `opacity:0`. Open removes `inert` and animates `opacity/y/scale`;
    close re-adds `inert` synchronously (interaction dead immediately) while the
    fade-out plays. No `display:none` dance → no completion callback needed to
    hide, so no version-sensitive `.finished`. Staggered item entrance via
    per-item `delay: 0.05 + i*0.03`.
  - **Full a11y on the popover:** `aria-haspopup`/`aria-expanded`/`aria-controls`
    on the trigger, `role=menu`/`role=menuitem`, Escape closes + returns focus to
    trigger, outside `pointerdown` closes, ArrowUp/Down/Home/End roving focus,
    focus first item on open. Pills carry `aria-label` (collapsed dots still
    announce their section) + `aria-current` toggled in `setActive`.
  - **Soft label refresh works on inline-ish elements because they're flex
    items.** `softSwap` sets `textContent` then `animate(el, {opacity:[0,1],
    y:[-4,0]})`. `[data-active-label]` and `[data-secnav-current]` are children
    of `display:flex` parents → blockified → `translateY` applies (a bare inline
    `<span>` would ignore transform). Guarded on `textContent` change so it only
    fires on real section changes (observer already gates on index change).
  - **Progressive enhancement / breakpoint:** `.pillnav` visible >640px (labels
    inline & navigable even with no JS); `.secnav` is `display:none` by default
    and only `html.js` + `≤640px` shows it (a no-JS popover button would be a dead
    control — mobile no-JS falls back to the footer links + hero nav bento).
    Reduced motion: every open/close/popover path sets final width/opacity/
    transform INSTANTLY (no tween) — the interaction still works, just un-animated.
  - **Resize re-measure:** `onNavResize` re-reads the open pill's label width, so
    a mobile→desktop resize (where the pill row was `display:none`, `offsetWidth`
    0) corrects the open pill's width when it becomes visible.
- **Gotcha:** measuring `offsetWidth` on a `display:none` ancestor (mobile, where
  `.pillnav` is hidden) returns 0 — harmless (pillnav not shown), and the resize
  handler fixes it on the way back to desktop. Don't measure eagerly assuming the
  element is laid out.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0, 34 files, 4
  pages); `dist/` confirms the 7 pills + 7 popover items + `inert` panel (HTML),
  the driver (`offsetWidth`×3, `pointerleave`, `inert`, `aria-current` in JS), and
  the pill/popover/`rotate(180deg)` rules (CSS). Visual/touch validation at
  `https://jkrumm.test` deferred to the owner (open/close feel + back-out pop,
  the width exception's smoothness, popover upward reveal + stagger, outside-tap /
  Escape, mobile↔desktop resize, reduced-motion instant paths). **Patterns to
  keep:** an expanding-label nav needs a scoped `width` animation (no
  transform-only path exists) — measure the clipped label via `flex:none`
  `offsetWidth`, animate width with a back-out cubic-bezier (no spring API), and
  let JS own the label opacity (never a CSS `is-open` opacity rule, which zeroes
  the fade). A popover is `inert`+opacity, never `display:none`, so no completion
  callback is needed to hide it.

## 2026-07-05 — Footer nav follow-ups: single-handoff timing + modality (not size) split

- **Context:** Two owner follow-ups on the pill nav. (1) "Smoother, more like a
  transition from one to the other." (2) "On mobile show all the pills same as
  desktop, but open the popover — on mouse devices we hover-preview the pill, on
  touch we open the popover." So the desktop/mobile split became a **mouse/touch**
  split, and the pills are now shown on every device.
- **Smoothness — unify the timing, kill the overshoot.** The first cut used
  DIFFERENT durations/eases for open (0.42s, back-out `[0.34,1.35,0.5,1]`) vs
  close (0.32s, `[0.4,0,0.2,1]`), so a change of the open pill read as two
  separate motions + a pop. Fix: ONE duration + ONE symmetric ease for both open
  AND close (`NAV_DUR=0.4`, `NAV_EASE=[0.4,0,0.2,1]`). Because `resolveOpen` fires
  `closePill(prev)` and `openPill(next)` on the same tick, identical timing makes
  the closing label collapse in exact lockstep with the opening one expanding —
  it reads as the open state *travelling* between pills, not a close-then-open.
  **Supersedes** the prior entry's "back-out pop" pattern: a pop reads as a
  discrete event; a handoff wants symmetric ease-in-out, no overshoot.
- **Modality split by per-interaction `pointerType`, not a media query.** A static
  `matchMedia('(hover:hover)')` mislabels hybrid devices (touchscreen laptops).
  Instead: a capture-phase `document` `pointerdown` listener records
  `lastPointerType`; then per interaction —
  - **hover-preview** (`pointerover`): early-return when `e.pointerType ===
    'touch'` (pointer events carry the type) so a tap never triggers a preview;
  - **focus-preview** (`focusin`): early-return when `lastPointerType === 'touch'`
    (focus events DON'T carry the type — read the tracked one) so a tap that
    incidentally focuses the `<a>` doesn't flash a preview before the popover;
  - **tap → popover** (pill-row `click`): open the popover only when
    `e.detail !== 0 && lastPointerType === 'touch'`. `click.detail === 0` is the
    tell for KEYBOARD activation (Enter) — those, and mouse clicks, fall through
    so the anchor navigates. This is the robust way to keep keyboard = navigate,
    touch = popover, mouse = navigate, without a media query.
- **Popover is now a sibling of the pill row, not a separate trigger.** Dropped
  the `.secnav` current-section button entirely; the pills ARE the trigger. The
  `.navpop` panel is `position:absolute; bottom:calc(100% + 12px); left:0` inside
  a `position:relative` `.sticky-footer__nav`, opening upward over page content
  (`z-index:70` inside the footer's `z-60` sticky stacking context clears the
  page). `aria-haspopup="menu"`/`aria-expanded`/`aria-controls` moved onto the
  `<nav>`; Escape / arrow-focus return to `pillParts[activeIndex].pill`.
- **Gotcha — the outside-close listener must exclude the trigger.** `onDocPointer`
  (document `pointerdown`) closes the menu when the tap is outside the panel — but
  it must ALSO exclude `pillNav`, else tapping a pill while open runs
  close-on-pointerdown → then the pill `click` toggles it back open (flicker /
  won't close). Guard: `!panel.contains(t) && !pillNav.contains(t)`. The pill
  `click` handler owns the toggle; the doc handler owns only true outside taps.
- **Layout consequence:** pills are shown at every width now (removed the
  `@media (max-width:640px)` display swap), so on a phone the row is dots + one
  open label (~200px) and the footer text links wrap below it. Acceptable; one
  open at a time keeps the row from overflowing. No separate mobile trigger.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0, 34 files, 4
  pages); `dist/` confirms `data-navpop` + `inert` + `aria-haspopup` (HTML), the
  unified ease `[.4,0,.2,1]` with the `1.35` overshoot GONE, and `pointerType` +
  `detail` modality logic (JS); zero stale `secnav` in HTML/JS/CSS. Visual/touch
  validation deferred to owner (the single-handoff glide, mouse-hover vs
  touch-tap on a hybrid device, popover upward reveal + outside-tap/Escape, the
  taller phone footer). **Patterns to keep:** for a "handoff" between two elements,
  give the outgoing and incoming the SAME duration+ease (symmetry = one motion);
  split interaction by `pointerType` (+ `click.detail` for keyboard), not a hover
  media query, to handle hybrids; an outside-click closer must exclude its own
  trigger or the trigger's click re-opens it.

## 2026-07-05 — Experience sticky rail + detail pane

- **Context:** Replaced the plain single-column role list with a two-column sticky
  scroll-reveal: a left rail lists roles compactly; as the user scrolls, the
  active role highlights and a sticky right pane crossfades in that role's
  detail. Aceternity-style pattern — `position: sticky` + IntersectionObserver,
  zero scroll-jacking.
- **Worked:**
  - **Rail taller than pane via `min-height: clamp(180px, 26vh, 280px)`** on
    each `.role-row`. Three rows ≈ 540–840px total vs. a compact detail card
    (~220–320px) → ~300–550px of scroll runway. Reads as intentional
    pin-then-release. NOT a repeat of the killed 200svh wrapper — this is real
    content, generously spaced.
  - **Overlapping detail cards via CSS grid.** `.role-pane` is `display: grid;
    grid-template: 1fr / 1fr;` with every `.role-detail` on `grid-area: 1/1` —
    container height = tallest single card, no manual height math.
  - **`IntersectionObserver` with `rootMargin: '-45% 0px'`** (center-band
    scrollspy) and best-ratio scan matches the existing `sectionObserver`
    pattern in `portfolio.ts` exactly.
  - **Progressive enhancement:** mobile (<900px) and no-JS get a plain stacked
    column — all details visible, zero interactivity needed. At >=900px + JS:
    sticky pane + overlapping cards + crossfade.
- **Gotcha — opacity ownership (same trap as the pill nav):** JS must own
  `.role-detail` opacity entirely via inline styles. A CSS `.role-detail.is-active
  { opacity: 1 }` rule would set the value before Motion reads its start point,
  making the tween a no-op 1->1. Only the non-Motion accent indicator bar on
  `.role-row` uses the `.is-active` class for styling.
- **Gotcha — `align-items: flex-start` on `.role-split` is load-bearing.**
  Default `stretch` would force `.role-pane` to the rail's height, leaving zero
  internal slack for the sticky pin to hold against.
- **Gotcha — sizing comes from `min-height`, not padding.** Padding alone on
  `.role-row` gives ~0–80px of scroll runway — not enough to read as intentional.
  `min-height` with vertically-centered content (flex centering) gives the real
  runway.
- **Verdict / decision:** Ships. `bun run build` green. Visual QA deferred to
  owner (sticky pin feel, crossfade dissolve, `rootMargin` tuning,
  reduced-motion instant swap, mobile stack, no-JS readability). `highlights`/
  `stack` content in `experience.ts` is placeholder copy — owner must review
  for accuracy.

## 2026-07-05 — Experience pin+runway FIXED: the runway must exceed the sticky, not the viewport

- **Context:** The sticky-scroll Experience section had "literally failed" across
  ~3 prior attempts — the rail was supposed to pin under the top bar while the
  page appears to "pause", scrubbing 3 roles + a side beam slower than normal
  scroll, then release. The owner's mental model (page pauses, beam creeps, roles
  crossfade, then unlock) is exactly the Aceternity **pin + runway** illusion —
  NOT literal scroll-lock (which the house rules forbid and which is unnecessary:
  the sticky pin *fakes* the pause while native scroll keeps working, so
  keyboard/touch/reduced-motion all stay intact). Right library the whole time —
  Motion `scroll(cb,{container})`, already proven twice in this file.
- **The actual bug (why every attempt died):**
  - **Negative scroll distance.** Wrapper was `height: max(480px, 3*30vh)` = 90vh,
    but the JS computed `roleTrack = wrapper.height − VIEWPORT.height` = 90vh −
    100vh = **negative**, and the very next line `if (roleTrack <= 0) return;`
    short-circuited the entire beam/role engine on any normal laptop. Dead on
    arrival. The doc-comment's "runway = height − viewport" model was simply wrong.
  - **Wrong reference frame even if positive.** The pinned travel of a sticky
    child is `wrapperHeight − STICKYHEIGHT`, not `wrapperHeight − viewportHeight`.
    Progress must also start when the element *pins* (offset by the bar clearance),
    which the old math ignored (`roleSplitTop = wrapperOffset`, no `− pinTop`).
  - **Sticky overlapped the footer.** Old sticky height `100svh − 110px` left only
    ~24px for the bottom, but the sticky footer is ~62px (56 + 10 gap) → the last
    role detail hid behind the pinned footer.
- **Worked — the corrected geometry:**
  - **Wrapper taller than the sticky child by an explicit surplus.** CSS:
    `--stage-h: calc(100svh − --pin-top − --pin-bottom)` (sticky height),
    `height: calc(--stage-h + --role-count * --per-role)`. The surplus
    (`--role-count * --per-role`) IS the pinned scroll distance. `--per-role`
    (50svh) is the ONE tunable knob for how long Experience "holds" the page.
  - **Pin cleanly between the two chrome bars.** `--pin-top: 10px + --bar-top(60)
    + 16` (clears the fixed CompactHeader), `--pin-bottom: --bar-bottom(56) + 10 +
    16` (clears the sticky footer). Custom props declared on `.role-split` and
    **inherited** by the child `.role-sticky` — single source, no repetition.
  - **Correct progress math (reused the proven `scroll(cb,{container})` sig — no
    version-sensitive API):** `pinStart = wrapperOffset − pinTop` where
    `pinTop = parseFloat(getComputedStyle(roleSticky).top)` (getComputedStyle
    returns the RESOLVED calc length for a sticky element's `top`, NOT the sticky
    shift — reliable). `track = roleSplit.offsetHeight − roleSticky.offsetHeight`.
    `p = clamp01((scrollTop − pinStart) / track)` → `floor(p*STEPS)` role index +
    `beam.scaleY(p)`. The scroller's 10px padding is already baked into
    `wrapperOffset` (it's `rect.top − scrollerRect.top + scrollTop`, invariant), so
    no padding correction is needed — verified by derivation.
  - **JS sets `--role-count` from the real data length** (`roleSplit.style
    .setProperty('--role-count', String(roleRows.length))`) so adding/removing a
    role in `experience.ts` auto-sizes the runway; CSS default `3` is just a
    fallback. Setting a layout var ONCE at init (not animating it) is fine.
  - **Reduced-motion / <900px / no-JS → plain stacked column, no pin.** Gated the
    ENTIRE desktop sticky CSS block with `@media (min-width:900px) and
    (prefers-reduced-motion: no-preference)` AND the JS with the matching
    `!prefersReducedMotion()` — so reduced-motion desktop falls all the way through
    to the mobile stacked layout (details visible, beam `display:none`), never a
    tall pinned runway they must scrub. This is the narrative-ref mandate ("fully
    readable, no hijack") applied correctly.
  - **`align-items: stretch` + `justify-content: center` on the rail** fills the
    tall pinned stage and vertically centers the 3 rows next to the centered detail
    card. (Supersedes the earlier entry's `align-items: flex-start` "load-bearing"
    note — that was for the OLD approach where rail/pane height DIFFERENCE created
    the sticky slack; now the WRAPPER supplies the runway, so both children stretch
    to `--stage-h`.)
- **Gotcha:** `getComputedStyle(el).top` on a sticky element is safe to read for
  the pin inset — it's the computed (resolved) length, independent of whether the
  element is currently stuck. Don't confuse it with `getBoundingClientRect().top`
  (which DOES move with the stick). Use offsetHeight for both wrapper and sticky
  heights (layout height, unaffected by stickiness/transforms).
- **Gotcha:** file was touched by a linter mid-edit ("modified since read") — had
  to re-Read `portfolio.ts` before the Edit re-applied. Content was identical, only
  line numbers shifted.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0, 34 files, 4
  pages); `dist/` confirms the built JS (`getComputedStyle(w).top`, `track =
  C.offsetHeight − w.offsetHeight`, `--role-count` set) and CSS
  (`prefers-reduced-motion:no-preference`, `--per-role:50svh`, `--stage-h` calc).
  Visual/feel validation at `https://jkrumm.test` deferred to owner — the ONE knob
  to tune is `--per-role` (50svh/role → 150svh total pinned scroll; lower = snappier,
  higher = slower "hold"). **Pattern to keep:** a sticky pin+runway's scrub distance
  is `wrapperHeight − stickyHeight` (NOT − viewport); build the wrapper as
  `stickyHeight + N*per-item`; read the pin inset via `getComputedStyle().top`;
  gate the whole thing (CSS + JS) on `prefers-reduced-motion: no-preference` so the
  degrade is the plain stacked fallback, not a tall runway. **Still open:** the
  `highlights`/`stack` copy in `experience.ts` is placeholder (owner must review),
  and the mobile stacked layout shows rail headers detached from their details
  (pre-existing, out of scope) — revisit if the owner wants the mobile fallback
  tightened.

## 2026-07-05 — Experience follow-up: content-height card, not viewport-height

- **Context:** First fix worked, but the owner: "the view is way too high, almost
  full screen — why not responsive?" I'd sized the pinned card to the VIEWPORT
  (`--stage-h = 100svh − pins`) with `align-items: stretch`, so the compact detail
  card floated in a near-full-screen box of dead space, and it never adapted to the
  actual content.
- **Fix — size the card to its CONTENT, derive the runway from that:**
  - Dropped the fixed `--stage-h` height on `.role-sticky`. It's now natural
    (content) height, `min-height: 300px` for a floor, `max-height: calc(100svh −
    --pin-top − --pin-bottom)` as a *cap only* so a tall detail never collides with
    the two chrome bars. `align-items: stretch` still makes rail == pane so the
    rail's border-right spans the card cleanly.
  - The wrapper height can no longer be pure CSS (CSS can't read a child's natural
    height), so **portfolio.ts sets it**: `roleSplit.style.height =
    roleSticky.offsetHeight + surplus`, where `surplus = STEPS · PER_ROLE_VH ·
    scroller.clientHeight` (0.5 = half a viewport of scroll per role). Responsive to
    BOTH content (measured sticky height) and viewport (surplus scales to
    clientHeight). `track = surplus` by construction — no `wrapper − sticky`
    subtraction needed anymore. `PER_ROLE_VH` is now the single knob (moved from the
    CSS `--per-role`).
  - CSS keeps a plain `height: calc(100svh + 50vh)` as a pre-JS fallback runway;
    the inline JS height overrides it (inline beats stylesheet).
- **Gotcha — desktop→mobile resize must hand layout back to CSS.** Because the
  wrapper height and detail opacities are now JS-owned *inline* styles, a resize
  below 900px would leave the wrapper stuck at a pixel height and details stuck at
  `opacity:0`. Guarded `measureRole`: when `!matchMedia('(min-width:900px)')`,
  clear `roleSplit.style.height`, clear every `roleDetail.style.opacity`, reset the
  beam transform, set `track=0` (so `updateRole` no-ops) and `activeRole=-1`. The
  original viewport-height version had this same latent bug for opacities; now
  handled. On resize back to desktop, `measureRole` re-measures and calls
  `updateRole()` to re-sync.
- **Gotcha — init ordering to stay flash-free.** `measureRole()` now calls
  `updateRole()` at its end, which can fire `setActiveRole`. Call
  `setActiveRole(0, false)` BEFORE `measureRole()` so `activeRole` is already 0 when
  the init `updateRole` runs at scroll-top → index 0 === activeRole → no load-time
  crossfade.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0, 34 files, 4
  pages); `dist/` confirms JS `roleSplit height = sticky.offsetHeight + surplus`
  (`offsetHeight+a`) + `clientHeight` scaling, CSS `min-height:300px` +
  `max-height:calc(100svh − pins)` (no fixed stage height). Owner validates feel at
  `https://jkrumm.test`. **Pattern to keep:** for a pin+runway whose card should be
  CONTENT-sized (not viewport-sized), measure the sticky's natural `offsetHeight` in
  JS and set the wrapper to `stickyHeight + surplus` (surplus = the scrub distance,
  scaled to `clientHeight` for responsiveness) — a fixed viewport-fraction stage
  height is what makes it look oversized. Cap the sticky with `max-height`, never a
  fixed `height`. When JS owns inline height/opacity, always reset them in the
  sub-breakpoint branch so the stacked CSS fallback isn't overridden.

## 2026-07-05 — Footer nav fix: `click.detail` is NOT a touch signal (real-phone bug)

- **Context:** Owner tested the touch popover on a real phone: tapping a pill
  **navigated straight to that section** (couldn't even see which pill was
  active) instead of opening the popover. Corrects the previous entry, which
  gated the popover on `e.detail !== 0 && lastPointerType === 'touch'`.
- **Root cause:** `click.detail` is unreliable as a touch discriminator — a
  touch-synthesized click reports `detail === 0` on some mobile browsers (not
  the `1` I assumed). So `e.detail !== 0` was FALSE on the phone → the condition
  failed → the `<a>` navigated. `detail === 0` is only a dependable tell for
  KEYBOARD activation on *desktop*; it does NOT separate touch from keyboard on
  mobile. Headless/desktop testing never surfaces this — needs a real device.
- **Fix:** decide by the tracked `pointerType` ALONE (`pointerdown` fires
  `pointerType:'touch'` before the click, so `lastPointerType==='touch'` at click
  time is solid on every mobile browser), and handle keyboard with an EXPLICIT
  flag instead of `detail`: a `keydown` listener on the pill row sets
  `keyActivating` on Enter/Space; `onPointerType` (the capture `pointerdown`)
  clears it on any real pointer input. Popover opens when
  `!keyActivating && lastPointerType === 'touch'`. Keeps touch=popover,
  mouse=navigate, keyboard=navigate — without the flaky `detail` heuristic.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0); built JS no
  longer references `.detail` for this. **Pattern / correction:** never use
  `click.detail` to detect touch — it's `0` for touch clicks on some mobile
  browsers. Use `pointerType` (tracked from `pointerdown`) for touch-vs-mouse and
  a dedicated Enter/Space keydown flag for keyboard. And validate tap behavior on
  a REAL phone — desktop devtools touch emulation reported `detail` differently
  and hid the bug. Supersedes the `detail`-based note in the prior entry.

## 2026-07-05 — Footer nav fix: no auto-focus on a touch-only popover

- **Context:** Owner: after the touch popover opened, "Overview" always looked
  focused/highlighted — ugly. `openMenu()` ended with `popItems[0].focus()`
  (standard menu-a11y: focus the first item on open).
- **Root cause:** this popover is **touch-only** — it can only be opened by a
  touch tap (`onNavTap` requires `lastPointerType === 'touch'`); keyboard Enter on
  a pill navigates and never opens it. So focusing the first item runs only ever
  after a *touch* interaction, where a programmatic `.focus()` paints a
  ring/`:focus-visible` highlight on the first item (Overview) that touch users
  neither expect nor want. The classic "focus the first menu item" rule assumes a
  keyboard-reachable menu; it's actively wrong for a touch-only affordance.
- **Fix:** delete the `popItems[0].focus()` in `openMenu`. The panel stays
  non-`inert` while open, so a screen-reader-on-touch user still swipes to the
  items; keyboard users navigate the pills directly (full keyboard path already).
  Kept Escape-to-close returning focus to the active pill (a keyboard action → a
  ring is appropriate there) and the arrow-key roving-focus (only fires if a
  keyboard user tabs into the open panel).
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0). **Pattern:**
  don't apply keyboard-menu focus management (focus-first-item) to a **touch-only**
  disclosure — programmatic focus after touch shows an unwanted ring/highlight.
  Move focus only for the modality that actually opened it; here that's never
  keyboard, so move none.

## 2026-07-05 — Footer nav polish: popover caret pointing at the pill row

- **Context:** Owner wanted an arrow on the popover so it's obvious where it
  opens from.
- **Done:** a pure-CSS `.navpop::after` bordered caret — an 11px square,
  `background: var(--panel)` + `border-right`/`border-bottom: 1px var(--line)`,
  `transform: rotate(45deg)`, `bottom:-6px; left:22px`. After the 45° rotate the
  right+bottom edges become the two downward-facing sides of the arrow; the top
  half overlaps the panel (same `--panel` fill blends in and "opens" the panel's
  bottom border into the caret mouth), the bottom half protrudes ~6px toward the
  pills with the `--line` outline. `border-bottom-right-radius:2px` softens the
  tip. It's a child of the panel, so it inherits the open/close scale+opacity
  animation and shows/hides with the panel — no extra JS.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0); caret in
  built CSS. **Pattern:** bordered speech-bubble caret = a rotated square with
  the two *outward* borders set, same bg as the panel so the top half merges and
  the panel's own border opens around it; parent it to the animated panel so it
  transforms along for free. Owner to eyeball the tip protrusion / left offset on
  a real phone.

## 2026-07-05 — Experience follow-up 2: center the pinned card (kill the void below it)

- **Context:** Content-sizing fixed "too tall", but the owner's screenshots showed
  the real problem: a small (~300px) card **pinned at the top** (`top: --pin-top`)
  sitting inside a tall runway wrapper (opaque `--panel`), so the whole viewport
  BELOW the card was empty panel for the entire scrub — a huge void — and the next
  section only slid in at the very end. "Get around this huge empty space while
  preserving the same awesome scrolling experience."
- **The insight:** the void is SPATIAL, not temporal. The card must live in a tall
  element (runway) to have scroll distance — unavoidable — but it does NOT have to
  pin at the TOP of the viewport. Pinning a small card at `top` leaves all the
  slack below it. **Center the card in the stage** and the same whitespace becomes
  balanced top+bottom margin that reads as an intentional centered presentation
  (matches this site's whitespace-heavy aesthetic), not a void.
- **Worked:**
  - **JS-computed centered `top`.** `topOffset = max(pinTopBase, pinTopBase +
    (stage − cardH) / 2)` where `stage = scroller.clientHeight − pinTopBase −
    pinBottom`; `roleSticky.style.top = topOffset`. The `max()` guards short
    viewports (never pin above the bar). Pin math then uses `topOffset`:
    `pinStart = wrapperOffset − topOffset` (re-derived: card pins when its top
    reaches `topOffset`; unpins when wrapper bottom reaches `topOffset + cardH`;
    travel = `wrapperH − cardH` = surplus — so `track = surplus` STILL holds no
    matter where in the stage the card sits).
  - **Read chrome insets from the SIMPLE tokens, not the calc() customs.**
    `getComputedStyle(root).getPropertyValue('--bar-top'|'--bar-bottom')` → clean
    "60px"/"56px" (parseFloat works). Do NOT parse `--pin-top` — it's a `calc(10px
    + var(--bar-top) + 16px)` custom whose computed value is the unresolved
    substituted string, not a px number. Rebuilt `pinTopBase`/`pinBottom` in JS
    from the raw tokens (mirrors the CSS calc).
  - **Substantial-but-not-full band.** `.role-sticky { min-height: clamp(320px,
    48svh, 480px) }` (capped by `max-height: 100svh − pins`) → card fills ~60% of
    the stage, centered — clearly not "almost full screen" (the earlier reject) yet
    not a lost little block. `offsetHeight` reads the resolved clamp, so centering +
    wrapper math use the real card height.
  - **Rail as a timeline.** Desktop `.role-rail { justify-content: space-between;
    padding-block: clamp(6px,3vh,26px) }` spreads the 3 roles down the card. The
    active-role highlight now travels top→bottom in lockstep with the left beam
    filling top→bottom — one coherent "progress" gesture instead of a highlight
    jumping around a centered clump.
  - **Mobile-branch reset now also clears `roleSticky.style.top`** (added to the
    height/opacity/beam resets) so a resize below 900px fully hands back to CSS.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0, 34 files, 4
  pages); `dist/` confirms `min-height:clamp(320px,48svh,480px)`, rail
  `space-between`, JS `--bar-top||60`/`--bar-bottom||56` + `style.top=`. Owner
  validates feel at `https://jkrumm.test`. **Pattern to keep:** for a pin+runway
  where the card is smaller than the viewport, DON'T pin it at `top` (leaves a void
  below) — compute a centered `top = pinTopBase + (stage − cardH)/2` so the slack
  splits into balanced margins; `track` stays `= surplus` regardless. Give the card
  a `clamp()` min-height for presence, spread the rail so its highlight travels with
  the beam. Two knobs now: `PER_ROLE_VH` (scrub length) + `.role-sticky` `min-height`
  clamp (card presence).

## 2026-07-05 — Experience: the REAL fix — sticky-scroll-reveal, not an empty runway

- **Context:** After three iterations (pin+runway → content-height → center the
  card) the owner STILL rejected it: "still too big of a height … only the content
  is centered but still not good." I'd been treating the empty space as a tuning
  problem and had written a handover prompt. The owner pushed back hard: *"research
  that! This has been solved already!!"* — then, further: *"become an expert … form
  a new skill or advance ours."* Correct instinct — I was reasoning from a wrong
  mechanism.
- **Research (4 parallel `/research` jobs, cited):** scroll-hijacking landscape,
  native CSS scroll-driven animations (2026), the Motion `scroll()` API, and a
  production pattern catalog. The unifying verdict — **the static empty panel is
  the universal anti-pattern**: providing scroll distance without scroll content.
  Every prior Experience version was the anti-pattern — `.role-split` was an *empty
  spacer runway* with a sub-viewport card pinned in it, so the opaque `--panel`
  wrapper filled the viewport around the card. You cannot fix that by centering or
  resizing; you fix it by making the runway be REAL content.
- **The fix — native sticky-scroll-reveal / scrollytelling** (The Pudding /
  scrollama / Aceternity; all `position:sticky`, zero hijack):
  - **Right = role CHAPTERS** (`.role-detail`, `min-height: max(340px,
    var(--chapter-min:58svh))`) — real stacked content that IS the scroll runway.
    Each wraps `.reveal` (reuses the global `inView` system — no new JS).
  - **Left = full-stage-height timeline rail** (`position:sticky; top:--pin-top;
    align-self:start; height: calc(100svh − pins)`) with beam spine + 3 nav rows
    spread `space-between`. Full height ⇒ **no left-side void** (the earlier
    small-card problem). `aria-hidden` (decorative; chapters are the real content).
  - Both sides always show content → the empty panel is gone by construction.
- **Geometry got SIMPLER, not harder.** No more JS-set wrapper height, no centered
  `top`. `track = roleSplit.offsetHeight − roleRail.offsetHeight` (wrapper − sticky,
  both real content heights); `pinStart = sectionTop − pinTop`; `p = clamp(...)`;
  beam `scaleY(p)`; active index `floor(p·N)`. My VERY FIRST fix's identity (`track
  = wrapper − sticky`) was right all along — the bug was only that the wrapper was
  empty. Now it's the chapters.
- **Gotchas confirmed:**
  - **`align-self:start` is REQUIRED** on the sticky grid item — a stretched item
    (default `stretch`) fills the row and can't stick.
  - Still read `--bar-top` (simple px) not `--pin-top` (calc custom → unresolved
    string). Carried over correctly.
  - Mobile branch resets the JS-owned beam transform + `is-active` classes (rail is
    `display:none` there anyway); chapters stack as self-contained role cards —
    this ALSO fixes the old "mobile rail headers detached from details" issue,
    because each chapter now carries its own period·title·company header.
  - Details no longer crossfade (they scroll); the global `.reveal` fades each
    chapter in as it enters. One fewer bespoke animation.
- **Skill advanced (the owner's explicit ask):** wrote
  `references/scroll-interaction-patterns.md` (the house scroll bible: the
  no-empty-runway principle, native-vs-hijack library breakdown — GSAP pin-spacer,
  Lenis/Locomotive virtual scroll, fullPage; the pattern catalog; the Motion
  `scroll()` cheatsheet; CSS scroll-driven state 2026; a11y). Rewrote SKILL.md §6
  from "REMOVED" to the shipped sticky-scroll-reveal pattern; updated the
  description, the no-hijack gotcha, and the reference list.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0, 34 files, 4
  pages); `dist/` confirms the new markup (`role-chapters`, 3 `data-role-detail`, 3
  `data-role-detail__inner reveal`, `role-nav`, `role-beam__fill`), CSS
  (`position:sticky`, `--chapter-min:58svh`, `grid-template-columns:clamp(220px,28%,
  320px) minmax(0,1fr)`), and JS (`.offsetHeight-w.offsetHeight`, `scaleY(`,
  `.role-rail`). Owner validates feel at `https://jkrumm.test`. **Pattern to keep
  (the big one):** for ANY pinned/scrub section, the scroll distance must be REAL
  content (a column of generous chapter-blocks) or a viewport-filling visual —
  never an empty spacer with a small pinned card. Native `position:sticky` +
  `align-self:start` + one Motion `scroll()` subscription; the chapters are the
  runway; the sticky side fills the stage. `--chapter-min` is the single hold knob.

## 2026-07-06 — Experience: SEE it, don't reason it — slim beam + compact cards

- **Context:** The scrollytelling rebuild (prev entry) was structurally correct but
  the owner: "those roles are still wayy too high, it looks horrible." Two real
  faults I'd reasoned past instead of looking at: (1) chapters at `58svh` with
  `place-items:center` → each role's ~280px of content floated in a ~460px void;
  (2) a full-WIDTH sticky rail with 3 sparse labels spread `space-between` over a
  viewport-tall column → the left half read empty too. Correct structure, wrong
  proportions.
- **Turning point — actually rendered it.** Loaded `https://jkrumm.test` in the
  chrome-devtools MCP browser, scrolled `#jk-scroll` to a *verified* mid-scrub
  position (read back `beamFill.style.transform` + `.is-active` to confirm p≈0.5),
  and screenshotted. The airiness was obvious in one frame — after ~4 rounds of
  reasoning about it blind. **Lesson: for a visual complaint, drive the real page
  and screenshot before theorizing. Verify the scroll state by reading the live
  values, not by trusting a computed `scrollTop` (programmatic sets drift/clamp
  while reveals settle and the page lays out — wait ~1.2s post-navigate first).**
- **Fixes:**
  - **Compact cards:** `--chapter-min` 58svh → 34svh; `min-height: max(300px,
    var(--chapter-min))`; content `place-items:center start` (left-aligned in the
    now-wide column, `max-width:620px`). Cards hug their content (~320px), filled.
  - **Slim side-beam, not a wide rail:** the owner literally said "the beam on the
    side." Rebuilt the rail as a ~64px column (`clamp(56px,7%,88px)`) = a thin
    centered spine + one dot per role (`.role-dot`), sticky. A slim beam reads as
    an intentional progress rail at any density; the role identity lives in the
    (filled) cards. Killed the airiness completely.
  - **Tall-viewport guard:** a full-stage beam needs `3·chapter-min > stage(≈92svh)`
    or `track ≤ 0` and the scrub dies (hit this at a 2029px automation height).
    34svh (×3 = 102svh) clears it; on normal laptops the content/300px floor wins
    so cards stay ~320px regardless.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0). Rendered
  mid-scrub + at entry: slim blue beam fills to the active dot, compact filled role
  cards scroll past, pinned under the name-bar — matches the owner's "beam on the
  side, scroll through the roles" and is no longer tall/empty. Owner feel-tests on
  the dev server. **Patterns to keep:** (1) screenshot the real render for any
  "looks wrong" report — reasoning about proportions blind cost 4 rounds; (2) for
  SPARSE content, a pinned scrub wants a SLIM progress beam + compact
  self-contained cards, not a wide rail or tall chapters (both read empty); (3) a
  full-stage sticky element requires the content column to exceed it at every
  viewport height, or guard `track > 0` (already do) and size the knob to clear it.

## 2026-07-06 — Experience: beam → click-driven timeline accordion (`<details>`)

- **Context:** Owner scrapped the sticky-scroll-reveal beam ("F that scrolling
  beam") for a **timeline accordion**: current role expanded by default, the rest
  expand on click, EXCLUSIVE (one open at a time — confirmed via AskUserQuestion),
  with a well-placed expand affordance. Full rewrite of `Experience.astro` +
  swapped the "Experience: sticky-scroll-reveal" block in `portfolio.ts`. The
  scroll-scrub mechanic is GONE — the section is now purely click-driven.
- **Worked:**
  - **Native `<details>`/`<summary>` is the right primitive.** Keyboard
    (Enter/Space on the focused summary), the expanded/collapsed a11y state, and
    the entire no-JS path come FREE from the element — no hand-rolled
    button+aria-expanded+region. First role is `<details open>` (SSR, flash-free).
  - **JS upgrades the instant native toggle to a smooth height tween + enforces
    exclusivity.** Intercept `click` on the summary with `preventDefault()` (this
    ALSO covers keyboard activation — Enter/Space dispatch a click), then own the
    open/close: `entry.open=true` → measure `body.scrollHeight` → clamp
    `height:'0px'` same tick → `animate(body,{height:[0,target]},{dur,ease})`;
    close is the mirror (`[from→0]`, then drop `open`). A `current` ref +
    `busy` lock (the ~0.42s window) keep a double-click from desyncing state.
  - **Height is the ONE scoped exception to transform/opacity-only.** An accordion
    IS a height change — no compositor path exists (same finding as the
    footer-pill `width`, 2026-07-05). Reused ONLY the repo-proven
    `animate(el,{prop:[from,to]},{duration,ease})` signature — no `.finished`,
    `onComplete`, `type:'spring'`, or `height:'auto'` keyframe (all
    version-sensitive per prior entries). Settle-to-`auto` and drop-`open` run on
    a tracked `setTimeout(dur+30ms)`, cleared on teardown.
  - **No-flash open:** measure `scrollHeight` BEFORE clamping to `0px`, both in the
    same tick as `entry.open=true`, so the body never paints at full height for a
    frame. **No-flash close:** keep `open=true` through the collapse tween, only
    set `open=false` after (else the content vanishes natively mid-animation).
  - **NO `name` attribute on the `<details>`.** The native exclusive-accordion
    `name` group fires on the PROGRAMMATIC `open` too, which would snap the
    outgoing panel shut instantly and kill my close tween. So exclusivity is
    JS-owned; the no-JS fallback degrades to INDEPENDENT disclosure (acceptable —
    every role still fully readable/toggleable). Verified: can't have both native
    `name` exclusivity and a custom collapse animation.
  - **Timeline visual = one opaque `--panel` cell with a continuous spine**
    (mirrors Writing's `.recent`, NOT per-role bento cells). Entries separated by
    internal `--hairline` rows; the spine is `.tl-item::before` (full item height
    in the node gutter, so stacked items form ONE line), trimmed at the ends via
    `:first-child{top:--node-y}` / `:last-child{bottom:calc(100% - --node-y)}` so
    it never overshoots past the first/last node. Node + spine both key off the
    same `--node-x/--node-y/--node-r` custom props on `.tl-item`, so they can't
    drift regardless of head padding. Current node = accent + `--accent-glow` ring.
    (A per-role bento-cell layout would have broken the spine at every 1px gap.)
  - **Expand affordance:** a circular chevron button right-aligned in the head
    (`margin-left:auto`), rotating 180° on `[open]` via CSS transition. The whole
    head is the click target; the chevron is the signpost. `list-style:none` +
    `::-webkit-details-marker{display:none}` kills the native triangle.
  - **Reveal stays legal:** `.reveal` on the inner `<ol>` (content INSIDE the
    opaque cell), so the block fades in once on scroll over `--panel` — never the
    cell/band. Accordion bodies are NOT reveal-wrapped (they open on click, not
    scroll).
- **Reduced motion:** JS still runs but `animated=false` → instant open/close
  (still exclusive, no `busy` lock); the chevron rotates with no transition
  (`@media (prefers-reduced-motion: reduce)` drops `transform` from its
  transition list).
- **Didn't / N/A:** No scroll(), no IntersectionObserver, no sticky, no geometry
  math — the whole beam apparatus (pinStart/track/`scaleY`/`--chapter-min`/the
  `@media (min-width:900px)` desktop split) was DELETED. The section works
  identically at every width now (the old sticky rail was desktop-only).
- **Gotcha:** sideclaw `check` MCP still down (`SyntaxError: Failed to parse
  JSON` at the transport, same as the 2026-07-05 entries) — fell back to
  `bun run build`.
- **Verdict / decision:** **Ships.** `bun run build` green (0/0/0, 34 files, 4
  pages); `dist/` confirms 3 `<details class="tl-entry">` (first `open`), all
  `data-tl-*` hooks + `tl-node`/`tl-toggle`, the accordion driver in the bundle,
  and ZERO `role-beam`/`data-role-row`/`scaleY` (old beam gone). Visual/feel
  validation at `https://jkrumm.test` deferred to the owner (open/close tween
  feel, exclusive handoff when switching roles, chevron rotation, hover affordance,
  reduced-motion instant path, no-JS independent toggle, keyboard). **Patterns to
  keep:** for a disclosure/accordion, START from native `<details>`/`<summary>`
  (free keyboard + a11y state + no-JS) and layer a Motion HEIGHT tween on top by
  intercepting the summary `click` with `preventDefault` (covers keyboard) and
  owning `entry.open`; height is the sanctioned exception (like the pill width);
  never add a `name` attr if you animate the collapse (native exclusivity snaps
  the outgoing panel); build a continuous timeline spine in ONE opaque cell with
   end-trimmed `::before` connectors keyed off shared node custom props, never
  per-item bento cells (the 1px gaps break the line). **Supersedes the
  sticky-scroll-reveal beam as what ships on Experience** (SKILL.md §6 / the
  scroll-interaction-patterns bible describe the retired beam — the pattern
  knowledge stays as reference, but it no longer ships here).
- **Follow-up (same day) — optical-centering a rotating chevron.** A down-chevron
  reads optically low; nudging it toward its point must survive the 180° open
  rotation. Put the `transform: translateY(1px)` on the **SVG child**, NOT the
  rotating `.tl-toggle` container: the parent's `rotate(180deg)` then flips the
  child's local +y into screen −y, so the down-chevron sits lower and the
  (rotated) up-chevron sits higher — one declaration, both states correct. A nudge
  on the container itself would move BOTH states the same screen direction.
- **Follow-up — intra-company progression (nested ladder).** Need: show a
  promotion path within one company (Full-Stack → Senior → Tech Lead) on the
  timeline. Chosen (AskUserQuestion): a **nested ladder** — one timeline node =
  the company; the head shows the company as the headline with the current title
  as a dim `now`-badged subtitle; the expanded body OPENS with a mini promotion
  timeline (node + connector per rung, newest first, current rung accent) above
  the shared tenure scope/highlights/stack. Model: optional `Role.positions?:
  {title,period}[]` — present → ladder/company-headline branch, absent →
  unchanged single-title entry (title headline, `· company` inline). Zero JS
  change: the ladder lives inside `[data-tl-body]`, so the accordion's
  `scrollHeight` measure includes it automatically. Kept the head structurally
  identical (period → titles block → chevron); only the titles block branches on
  `data-multi`. Data content is placeholder (flagged in `experience.ts`) — the
  owner sets real companies/titles/dates; the layout is fixed.

## 2026-07-06 — Index/listing surface: fail-toward-line frame, off the scroll stage

- **Context:** Gave the guide + blog collections real index pages (`/guide`,
  `/blog`). Built `IndexLayout.astro` + a shared `ReadingHeader.astro`
  (`src/components/chrome/`), refactored `ArticleLayout` onto the same header, and
  rebuilt both index pages onto `IndexLayout`. Docs-only pass here (read the source
  for the code). This establishes the site's **third surface mode**: homepage
  scroll-stage (`#jk-scroll`/`PageBox`) → article **reading** surface
  (`ArticleLayout`, `--reading-maxw` 42rem) → **listing** surface (`IndexLayout`,
  `--index-maxw` 960px).
- **Worked:**
  - **The "fail-toward-line" invariant transplants cleanly off the scroll stage.**
    `.index-frame` (`background:var(--line); border:1px solid var(--line); gap:1px`)
    is `PageBox` rebuilt on a plain `BaseLayout` page — one border, opaque cells on
    1px line-gaps, no `#jk-scroll`, no sticky bento chrome. The frame model is
    layout-portable; it was never coupled to the scroller.
  - **Masthead = a two-cell bento row** (intro cell + right-aligned stat aside,
    split by a 1px line-gap) — deliberately echoes the homepage hero's
    content/portrait split so the standalone frame reads *full* instead of a lone
    banner over emptiness. Stats (count / total read / latest date) are derived in
    each index page's frontmatter from the collection.
  - **The list is ONE opaque `--panel` cell, rows dividing on internal
    `--hairline`** (`.chapter + .chapter` / `.post + .post { border-top:1px solid
    var(--hairline) }`), NOT on frame gaps — the same continuous-spine trick as the
    Experience timeline and Writing's `.recent`. A per-row bento cell would fracture
    the list into gapped tiles and break the unbroken spine. `--hairline` (lighter
    than `--line`) keeps internal rules quieter than the frame edge.
  - **Shared `ReadingHeader` unifies all non-homepage chrome.** JK+ brand → home +
    uppercase mono category; its `width` prop aligns the sticky bar to the page's
    content column (`--reading-maxw` for articles, `--index-maxw` for indexes). One
    slim calm header for both off-stage surfaces.
  - **Off-stage surfaces relax the homepage-stage constraints.** Over plain `--bg`
    (not a line-colored frame), reveal-only-over-`--panel`, box-shadow-separators,
    and opaque-bars don't apply — normal borders/blockquotes are fine on
    `ArticleLayout`, and `ReadingHeader` even keeps the frosted `--bar-bg`+blur the
    homepage bars had to drop (blur only flashes over the line frame).
- **Didn't / rejected — "+" registration corner marks.** Tried "+" corner marks on
  the index frame (borrowing the retired snap-era homepage motif) and removed them:
  they are NOT part of this design language and must not be reintroduced anywhere.
  The unrelated "JK+" brand mark in `ReadingHeader` stays.
- **Gotcha:** `IndexLayout.astro`'s own header doc-comment still lists "+"
  registration corner-marks as borrowed — that line is **stale** (the code renders
  none). Trust the CSS, not the comment. (Left as-is: docs-only pass.)
- **Verdict / decision:** **The third surface mode is house style.** A new listing
  page = `<IndexLayout {...}>` wrapping one styled `<ol>` (the page owns only the
  list cell via the default slot; the layout owns header + masthead + footer). The
  frame model is portable off the scroll stage; the two composition patterns
  (two-cell masthead, single-panel hairline-divided list) fill a standalone frame
  so it never reads empty. Distilled into `SKILL.md` §5 (off-stage-surfaces
  subsection). Build validation deferred to the owner (docs-only change here).

## 2026-07-07 — Flicker-free light/system/dark theme + segmented toggle

- **Goal:** a three-way theme (light/system/dark) that is FOUC-free on hard
  refresh, survives `ClientRouter` navigation, and crossfades smoothly on switch —
  toggle centered in the homepage `StickyFooter`, top-right of `ReadingHeader` for
  off-stage pages. Orchestrated via parallel `@implementer` subagents on disjoint
  files; validated by a single `bun run build` (0/0).
- **FOUC is beaten before first paint, not after.** The blocking `is:inline` head
  script in `BaseLayout` sets `data-theme` + `style.colorScheme` on `<html>` from
  `localStorage` (key `jk-theme`) BEFORE the parser continues — it MUST stay
  `is:inline` (no module/defer/async) and BEFORE `<ClientRouter />`. It reuses the
  existing `.js`-add slot (add `.js` first — the reveal system depends on it). On a
  static (`output: 'static'`) site, `localStorage` is the only correct store:
  there's no server to read a cookie at request time.
- **`ClientRouter` strips the runtime attribute on swap → re-apply on
  `astro:after-swap`.** The swapped-in static `<html>` has no `data-theme`; a
  bundled (non-inline) `astro:after-swap` listener calls `window.__theme.apply(get())`
  (no animation) before the new view paints. Without it, every navigation flashes.
- **Smooth switch WITHOUT a load-flash = a transient class, never a permanent
  transition.** `window.__theme.set()` adds `html.theme-anim` for 480ms then removes
  it; CSS transitions `background/border/color/fill/box-shadow` only while that class
  is present. A *permanent* global color transition would animate the very first
  paint and fight Motion reveals. The `theme-anim` rule deliberately EXCLUDES
  transform/opacity so it can never collide with `.reveal` tweens. Skipped entirely
  under `prefers-reduced-motion` (instant switch).
- **State model: store the PREFERENCE (`light|dark|system`), resolve lazily.** The
  segmented control highlights the stored pref, so system→dark lights the MONITOR,
  not the moon. A `matchMedia('(prefers-color-scheme: dark)')` `change` listener
  re-resolves only while the stored pref is `system` (a pinned choice ignores OS
  flips).
- **The toggle is a Web Component, which is why it survives view transitions for
  free.** `customElements.define('theme-toggle', …)` (guarded) re-runs
  `connectedCallback` when Astro re-inserts the element after a swap, so it re-syncs
  its active state with zero extra wiring. Sliding thumb = `transform: translateX`
  keyed off `track[data-active=…]` (compositor-safe, animation-rule compliant).
  Radiogroup a11y: roving tabindex + Arrow/Home/End select-and-move + `aria-checked`.
  Icons are inline Lucide SVGs (no icon dependency — the repo's inline-`<svg>`
  convention). Visibility gated on `:global(html.js)` — a JS-only control is never
  shown dead.
- **Token layer: one `[data-theme='dark']` block overriding ONLY color tokens.**
  Neutral-gray dark (Mantine-style dark scale, `--bg:#1a1a1a … --accent:#567fab`)
  beside the single `:root`; layout/type/spacing/motion tokens inherit. **Keep the
  dark surfaces truly neutral (R=G=B) — a warm/brown tint reads cheap;** the accent
  is a muted steel blue (`#42658b` light / `#567fab` dark), not a vivid primary.
  Surfaces step lightest→darkest `line > hairline > panel-hover > panel > bg` so the
  fail-toward-line hairlines invert to light seams on dark. Because every surface already reads
  `var(--token)` and `body` reads `--bg/--ink`, flipping the attribute cascades the
  whole site. Add `color-scheme` to both blocks (themes native scrollbars/controls).
- **Gotcha — code blocks use `astro-expressive-code`, NOT raw Shiki
  `markdown.shikiConfig`.** Dual-theme via `expressiveCode({ themes:
  ['github-light','github-dark'], customizeTheme(t){ t.name = t.type } })`: renaming
  the theme names to `light`/`dark` makes expressive-code's default
  `themeCssSelector` emit `[data-theme='light|dark']` rules that key off our
  attribute (with system media-query fallback) — no extra config. The `.astro-code`
  CSS a raw-Shiki plan would add is inert here (that class never appears in output).
- **Gotcha — build-time SVG bakes literal colors that DON'T flip.** `Chart.astro`
  (Observable Plot → inline SVG via `set:html`) baked light-palette hex. Fixes that
  work post-build: grid line was already a CSS rule (`--hairline` token now); axis
  text flips by REMOVING `color: INK` from the Plot `style` object so the SVG root
  has no inline color and scoped CSS `.chart__plot :global(svg){color:var(--ink-2)}`
  drives `currentColor` (verified against `dist/` output — Plot text is
  `fill="currentColor"`, ticks inherit). Mark `fill`/`stroke` stay literal accent
  (`#2f5bff` reads fine on dark); left as-is (no reliably-targetable per-mark
  selector). `Callout.astro` warn/success got `[data-theme='dark']` brightness bumps.
- **Verdict / decision:** the theme system is house style. New surfaces get it for
  free by consuming tokens + rendering `<ThemeToggle />` where a control belongs.
  Never use a `class="dark"` (attribute only), never make the color transition
  permanent, never bake a non-token color into build-time SVG. Validated: `bun run
  build` 0 errors / 0 warnings, 7 pages. Runtime acceptance (flicker on refresh,
  nav persistence, keyboard, reduced-motion) is owner-verified manually.

## 2026-07-07 — ThemeToggle: instant-mount fix + Motion spring polish

- **Context:** `ThemeToggle.astro`'s sliding thumb was pure CSS
  (`transition: transform 0.28s`) driven by a `[data-active]` attribute. On hard
  reload the thumb rendered at its CSS default (light) then `connectedCallback`'s
  `sync()` flipped `data-active` to the stored theme, and the CSS transition
  animated that first snap — a swipe-across on every load. Asked to (1) fix that
  and (2) drive the thumb + add press/hover micro-interactions with a Motion
  spring instead of the CSS easing.
- **Worked — explicit `animate: boolean` threaded through the sync path.**
  `sync(animated)` → `positionThumb(pref, animated)` / `animateScale(svg, scale,
  animated)`. `connectedCallback` always calls `sync(false)` (instant mount, no
  swipe). A `pendingUserChange` flag is set only inside `choose()` (the
  click/keyboard path) right before calling `window.__theme.set()`; the
  `themechange` listener reads-and-clears that flag to decide `animated` for its
  own `sync()` call. So a deliberate selection animates (flag was true), while an
  OS-driven scheme change, another toggle instance, or another tab firing
  `themechange` snaps instantly (flag stays false) — same code path, no separate
  "trigger source" plumbing needed. Removed the CSS `transition` and the three
  `[data-active='…'] { transform }` rules entirely — Motion now owns 100% of the
  thumb's transform, so there's no CSS/JS fight (the old dead reduced-motion
  `transition: none` override went too, since there's no CSS transition left to
  disable).
- **Worked — geometry from `offsetLeft`, not hardcoded thirds.** The old CSS used
  `translateX(0|100%|200%)` assuming exactly 3 equal segments. Motion target:
  `x = button.offsetLeft - thumb.offsetLeft`. Both share the track as
  `offsetParent` (`position:relative` on `.theme-toggle__track`), and `offsetLeft`
  is a layout-box property untouched by an already-applied `transform` — so this
  stays correct across re-renders/size changes without measuring `getBoundingClientRect`
  or re-deriving from CSS percentages.
- **Verified Motion API from installed types, no `/research` needed.**
  `node_modules/motion-dom/dist/index.d.ts` confirms `SpringOptions` (`stiffness`,
  `damping`, `mass`, `bounce`, `duration`) and that `animate(el, { x, y, scale },
  transition)` treats `x`/`y`/`scale` as independent transform values (already
  proven in this repo — `portfolio.ts` reveals use `y: [14, 0]`). `motion`'s
  `index.d.ts` is just `export * from 'framer-motion/dom'`, same surface.
- **Spring choice:** thumb = `{ type: 'spring', stiffness: 500, damping: 40, mass:
  0.8 }` — critically damped (`damping == 2*sqrt(stiffness*mass)` = 40 exactly),
  so zero overshoot, still reads as physical rather than eased-in-CSS. Icon
  press/selection = `{ type: 'spring', stiffness: 600, damping: 32, mass: 0.5 }` —
  slightly underdamped (ratio ≈0.87 of critical) for a single faint settle on
  press-release/selection "pop", per the brief's "no visible bounce, or the
  faintest single settle at most." Hover lift is a plain 0.16s tween (`y: -1`),
  not a spring — a 1px hover nudge doesn't need spring physics.
- **Gotcha — don't let the param name `animate` shadow the imported Motion
  `animate` function.** Every method took the flag as `animated`, never `animate`,
  specifically to avoid this; worth flagging for the next spring-driven widget in
  this repo.
- **Gotcha — press/hover/rest-scale share one property (`scale`) but are driven by
  separate call sites** (pointerdown, pointerup, pointerleave, `sync()`'s
  selection-scale). Every call goes through one `animateScale()` that always
  `.stop()`s the previous handle (tracked in a `WeakMap<SVGElement, AnimHandle>`)
  before starting the next — otherwise a fast press-then-release during an
  in-flight spring would let two competing tweens fight over the same transform.
- **Lifecycle:** `disconnectedCallback` stops the thumb's in-flight animation and
  removes every listener registered through a small tracked-`on()` helper (mirrors
  the `teardown[]` pattern in `portfolio.ts`, scoped per-instance here since this
  is a custom element, not a module-level init). `reducedMotion()` is a live
  `matchMedia(...).matches` check (not cached), called at the top of every
  animation branch — reduced motion snaps thumb, scale, and hover instantly and
  never calls `animate()`.
- **Verdict / decision:** validated `bun run build` — 0 errors / 0 warnings, 51
  files, 7 pages. Pattern (explicit `animated` flag on every sync path, instant on
  mount/external-resync, animated only on direct user action) is the template for
  any other segmented-control/toggle this site adds.
