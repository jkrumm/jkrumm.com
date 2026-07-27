# Scroll interaction patterns — the house bible

Distilled from a four-angle research sweep (scroll-hijacking landscape, native
CSS scroll-driven animations, the Motion `scroll()` API, and a production pattern
catalog) done 2026-07-05 while rebuilding the Experience section. Sources cited
inline. This is the reference behind SKILL.md §6.

> **Two things dated 2026-07-27 (the borderless redesign).** The site moved to
> **document scroll** — the `#jk-scroll` container is deleted, so `scroll()` takes
> no `container` and observers take no `root`; read every `container: scroller` /
> `scroller.scrollTop` below as `window` / `window.scrollY`. And §4's
> sticky-scroll-reveal is **no longer shipped** — Experience is now a plain
> two-track date/content grid with no JS. §4 is a worked reference for a future
> pinned section, not a description of the current site.

---

## 0. The one principle (memorize this)

> **Every pixel of scroll distance must correspond to either real readable
> content or a viewport-filling animation. There is never a moment where the user
> scrolls past nothing.**

The **static empty panel** is the universal anti-pattern of every pinned/scrub
effect: you provide *scroll distance* (a tall element) without *scroll content*.
A pinned card smaller than the viewport leaves dead panel around it. The fix is
never "tune the geometry" — it's **make the scroll distance be real content** (a
column of stacked chapter-blocks) and/or **make the pinned thing fill the
viewport** (a full-height graphic/timeline). Both sides always show something.

This is the exact bug that cost three failed Experience iterations (see LEARNINGS
2026-07-05): `.role-split` was an *empty spacer runway* with a sub-viewport card
pinned in it. The scrollytelling rebuild made the runway be the real role
chapters.

---

## 1. Native scroll-linked vs scroll-hijacking (why the house rule has teeth)

**The litmus test** (NN/g, *Scrolljacking 101*): if you disable JS and the page
still scrolls correctly — just without the animation — you're doing scroll-LINKED
animation (fine). If the page becomes unscrollable or the scrollbar
desyncs from the viewport, you're HIJACKING (banned here).

- **Scroll-linked** = native scroll drives an animation that only *reads* scroll
  position (a progress beam, a parallax layer, a sticky pin). Scrollbar,
  keyboard, find-in-page, screen readers, `prefers-reduced-motion` all keep
  working because the page is genuinely scrolling.
- **Hijacking** = overriding native scroll speed/direction/mapping.

### What the banned libraries actually do (so you can argue it)

| Library | Mechanism | Why it's banned here |
|-|-|-|
| **GSAP ScrollTrigger `pin:true`** | Injects a `pin-spacer` div and sets the pinned element `position:fixed` (NOT `position:sticky`). Recalculates dims only at init → late fonts/dynamic content break it. Doubles perceived height in flow. | We get pinning free from native `position:sticky` — no injected nodes, no fixed-positioning stacking bugs, unstick is automatic. |
| **GSAP ScrollSmoother** | Watches native scroll, applies `matrix3d()` to `#smooth-content` to "catch up." Scrollbar stays real. | Least offensive (native scrollbar) but still a rAF transform layer we don't need. |
| **Lenis** | Intercepts wheel/touch/keyboard, lerps (`requestAnimationFrame`, default lerp 0.1) toward a target, transforms content. `animatedScroll` ≠ `actualScroll`. | Replaces the native scroll *feel*; momentum mismatches every other app; a11y depends on their shims. |
| **Locomotive Scroll v5** | Now a thin wrapper over Lenis (was `virtual-scroll`). CSS-Tricks: "you could probably consider this scrolljacking." | Same as Lenis. |
| **fullPage.js** | Takes over scroll entirely (`autoScrolling:true`), `translate3d` section snapping, hides native scrollbar by default. | Textbook virtual scroll; hostile on trackpads. |

### The harm (NN/g + WCAG 2.3.3 + web.dev)

Broken scrollbar mapping (users think the mouse broke), momentum/velocity
mismatch, keyboard/screen-reader/`Ctrl+F` breakage (transform-moved content ≠ DOM
position), motion sickness/vestibular harm, and main-thread jank (wheel handlers
run on main thread; native scroll + CSS scroll-driven run on the compositor).

**If you ever *must* hijack** (you won't, here): honor `prefers-reduced-motion`,
keep the scrollbar truthful, minimize the hijacked distance (short scrolljacks
are tolerated, long ones disorient), never change direction, provide an escape,
test keyboard + SR + find-in-page.

---

## 2. Pattern catalog

For each: the effect, the mechanism, and **how it avoids the empty panel**.
Everything below is native-scroll (no hijack).

### 2a. Sticky-scroll-reveal / scrollytelling  ← the house pattern (see §4)
Pinned graphic/timeline on one side; a column of real content "steps" on the
other provides the scroll distance. Steps get generous `min-height` (60–100vh).
The Pudding, scrollama, Aceternity. **No empty panel:** the steps are real
reading material; the sticky side fills its column. `position:sticky` unsticks
automatically at the container's bottom — zero JS for the pin.

### 2b. Horizontal scroll pinned vertically
Outer section `height: N×100vh`; inner `position:sticky; height:100vh;
overflow:hidden`; a flex track `translateX` driven by vertical scroll progress.
**No empty panel:** each horizontal card fills the viewport with content.
Motion: `scroll(animate(track, { transform:["none", "translateX(-Nvw)"] }), { target })`.

### 2c. Image-sequence / canvas scrub (Apple AirPods)
`body { height:500vh }`; `<canvas position:fixed>`; scroll progress → frame index
→ `drawImage`. **Mitigation:** the canvas always fills the viewport with striking
imagery; bookend with real sections. The one pattern where the height is
technically empty — only justified by a full-viewport visual. Overkill for this
site.

### 2d. Scroll-linked progress / reading bar
`position:fixed` bar, `scaleX` 0→1. **2026 zero-JS:** `animation: grow linear;
animation-timeline: scroll(root block)`. Purely observational — never a dead-space
risk. (The site's top progress line is this idea.)

### 2e. Section pin with in-place scrub ("the page pauses" — Apple product pages)
`section { height:600vh }` (runway) + `.stage { position:sticky; top:0;
height:100vh }`; scroll progress → keyframes on the stage's children. **Native
`position:sticky` beats GSAP `pin`** (no pin-spacer). **Critical:** follow the
runway with REAL content — the classic failure is 600vh of animation then
whitespace.

### 2f. Parallax layers
Pure CSS: `perspective:1px` on the scroll container + `translateZ()+scale()` per
layer; or `animation-timeline: scroll()`. **#1 vestibular trigger** — always
`@media (prefers-reduced-motion: reduce){ transform:none }`. `perspective` breaks
`position:fixed` descendants; `background-attachment:fixed` is broken on iOS.

### 2g. Staggered reveal-on-scroll  ← already the site's `.reveal` system
IntersectionObserver / Motion `inView` toggles a class; `opacity`+`transform`
transition, staggered by delay. **2026 zero-JS:** `animation-timeline: view();
animation-range: entry` with a shifted range per `:nth-child`. Elements must be in
the DOM (`opacity`, not `display:none`) for a11y.

---

## 3. Motion `scroll()` API cheatsheet (motion.dev, vanilla, v12.x)

```js
import { scroll, animate, inView } from "motion";
```

**Two forms:**
- `scroll(progress => {...}, opts)` — callback, runs on **main thread**. Use when
  you need discrete logic (active index) or to set arbitrary DOM. This is what the
  Experience scrub uses (cheap: one class toggle + one `scaleY`).
- `scroll(animate(el, {...}), opts)` — hands Motion an animation to scrub; uses
  the native **`ScrollTimeline`** (compositor, off-main-thread) where supported.
  Prefer for heavy transform/opacity scrubs.

**Options:** `{ container, target, axis:'y'|'x', offset, trackContentSize }`.
- `container` — the scrolling element. **Omit it here** — the site uses document
  scroll; the `#jk-scroll` container it used to point at is deleted.
- `target` — a child; progress = its position within the container. Tracked by
  **layout position — CSS transforms on it/ancestors are ignored**.
- `offset` — `[startIntersection, endIntersection]`, default `["start start",
  "end end"]`. Each intersection = `"<targetEdge> <containerEdge>"`. Named edges:
  `start`=0, `center`=0.5, `end`=1; also px / % / vh. E.g. `["start end", "end
  start"]` = full traversal (enters bottom → leaves top).

**Callback `info`:** `(progress, info)` → `info.y.{current,offset,progress,
scrollLength,velocity}`, `info.time`.

**`inView(target, (el, entry) => { return leaveCb }, { root, margin, amount, once })`**
— IntersectionObserver wrapper; `amount:'some'|'all'|0..1`.

**Teardown:** both `scroll()` and `inView()` **return a cleanup function** — push
it to `teardown[]` and drain on `astro:before-swap`. Non-negotiable here (soft
swaps leak observers otherwise).

**Why Motion over GSAP for us:** MIT (GSAP is proprietary/Webflow-tied),
`scroll()` ~5.1kb (75% of ScrollTrigger), compositor `ScrollTimeline` path, and
`position:sticky` for pinning (Motion's own docs recommend sticky over JS pins).

---

## 4. The sticky-scroll-reveal pattern (RETIRED — reference only)

> Retired from Experience 2026-07-06 and fully deleted 2026-07-27. No file below
> still contains this code. Kept as the worked example for a future pinned
> section; adapt the container references to document scroll, and the `--line`
> gap styling to the borderless model (SKILL.md §5).

Former files: `src/components/sections/Experience.astro` (markup + CSS),
`src/scripts/portfolio.ts` (the "Experience: sticky-scroll-reveal" block),
`src/data/experience.ts` (content).

**Structure (desktop ≥900px + motion):** a 2-col CSS grid `.role-split` (then a
bento band: `background:var(--line); gap:1px` — that token is gone; today the
split would be a plain `gap`), columns `clamp(56px,7%,88px) minmax(0,1fr)`.
- **Left `.role-rail`** — a **slim side-beam** (~64px column): a thin centered
  spine (`.role-beam` + `[data-role-beam-fill]` scaleY) with one dot per role
  (`.role-dot`, space-between). `position:sticky; top:var(--pin-top);
  align-self:start; height: calc(100svh - --pin-top - --pin-bottom)`.
  `align-self:start` is **required** — a stretched grid item can't stick.
  `aria-hidden` (decorative; the real content is the chapters). **Slim on
  purpose** — a wide rail with 3 sparse labels reads empty; a thin progress beam
  reads intentional at any content density.
- **Right `.role-chapters`** — a flex column of `.role-detail` cells, each a
  self-contained role card (period·title·company + scope + highlights + stack),
  `min-height: max(300px, var(--chapter-min))`, content `place-items:center start`.
  **These are the scroll runway.** Each wraps its content in `.reveal` (reuses the
  global `inView` system). Knob `--chapter-min:34svh` — keep it > 1/3 of the stage
  so 3 chapters always exceed the full-stage beam (else `track ≤ 0`, scrub dies on
  tall viewports).

**JS geometry** (`portfolio.ts`): measure once + on resize.
```
pinTop      = <the sticky top offset>        // read a simple px token (e.g.
                                             //   --page-top), NOT a calc() custom
sectionTop  = roleSplit rect.top + window.scrollY          // document scroll
pinStart    = sectionTop − pinTop            // scrollY where the rail pins
track       = roleSplit.offsetHeight − roleRail.offsetHeight   // pinned travel = wrapper − sticky
p           = clamp((window.scrollY − pinStart) / track, 0, 1)
activeIndex = min(floor(p·STEPS), STEPS−1)   // beam: roleBeam.style.transform = scaleY(p)
```
`track = wrapper − sticky` (NOT − viewport) is the core sticky-pin identity. Here
the wrapper height is REAL (the chapters), not a synthetic surplus.

**The ONE knob:** `--chapter-min` in the Experience `@media` block — per-chapter
height = the "hold" per role. Bigger = slower, more deliberate scrub. It never
reads as empty because real content scrolls through it.

**Fallback (<900px / reduced-motion / no-JS):** rail `display:none`; chapters
stack as self-contained role cards (period·title·company + detail). Fully
readable, no pin, no scrub. The desktop rules are gated `@media (min-width:900px)
and (prefers-reduced-motion: no-preference)`; the JS scrub is gated identically.

---

## 5. Native CSS scroll-driven animations (2026) — when to reach for them

`animation-timeline: scroll(<scroller> <axis>)` / `view(<axis> <inset>)`, named
`scroll-timeline`/`view-timeline` + `timeline-scope`, scoped by `animation-range`
(`entry|contain|exit|cover|...`). **Compositor-driven, zero JS.**

**Support (mid-2026):** Chrome/Edge 115+, Safari 26+, Opera/Samsung ✅; **Firefox
NOT shipped** (behind `layout.css.scroll-driven-animations.enabled`). Blocked from
Baseline since 2025-09. → **Progressive enhancement is mandatory:** wrap in
`@supports (animation-timeline: scroll())` with a JS fallback.

**Gotchas:** Firefox needs `animation-duration: 1ms`; declare `animation-timeline`
AFTER `animation` (shorthand resets it); use `animation-fill-mode: both`;
compositor only for `transform`/`opacity`/`filter`. **Discrete steps in pure CSS
are fragile** (`steps()` partitions the *value*, not scroll *thresholds* — no
per-offset triggers without JS).

**Why we still use Motion here, not pure CSS:** (1) Firefox gap; (2) the active
role index is discrete threshold logic (fragile in CSS); (3) we already own the
Motion lifecycle/teardown. **Good candidates for pure CSS** if ever wanted: the
reading-progress bar, and per-chapter reveals (`view()` + `entry`) — as a
`@supports` enhancement over the Motion path, never a replacement.

---

## 6. Accessibility checklist (every scroll effect)

- `prefers-reduced-motion: reduce` → static, readable, un-animated. Both the CSS
  opt-out AND the JS gate (a media query can't stop a running JS tween).
- Native scroll only — scrollbar/keyboard/`Ctrl+F`/SR stay intact by construction.
- Animated content lives in the DOM (`opacity`/`transform`, not `display:none`).
- Decorative duplicates (the timeline rail) are `aria-hidden`; real content is
  keyboard-reachable and announced once.
- Transform + opacity only (compositor); never animate layout props.
```
