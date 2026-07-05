# Handoff: Johannes Krumm — Portfolio Homepage

## Overview
A single-page portfolio homepage for **Johannes Krumm** (Tech Lead & Senior Full-Stack Developer, Munich). It presents a hero + a bento **section-nav grid** as the landing view, then a full-viewport, section-by-section scroll experience: **Writing → Experience → Personal Stack → Projects → Photography → Contact**. A persistent top bar shows the name + active section + a live Munich clock + scroll-progress line; a persistent bottom bar shows section dots + Résumé · GitHub · LinkedIn · Contact.

Visual language: monospace headlines (JetBrains Mono) + humanist sans body (Nunito Sans), zinc/stone tones on an off-white base, a single electric-blue accent, hard thin 1px lines, and a signature **“+” mark at grid intersections / card corners**. Restrained-but-noticeable motion: staggered reveals per section that **replay** each time a section re-enters.

## About the Design Files
The files in this bundle are **design references created in HTML** — a working prototype showing the intended look, layout, and behavior. They are **not** production code to copy verbatim. The intended tech stack is **Astro** (the user's choice), so the task is to **rebuild this design as an Astro site** using idiomatic Astro patterns (see `ASTRO_SETUP.md` for a researched, current-as-of-2026 recommendation and starter code). Everything is standard HTML + inline styles + a small vanilla-JS behavior layer, so it ports cleanly.

- `Portfolio-standalone.html` — self-contained, opens offline. Best for visual reference (open in a browser and scroll).
- `Portfolio.dc.html` — the authoring source (same markup; the `<script>` logic lives in a component class at the bottom — the vanilla-JS body is reproduced in `ASTRO_SETUP.md`).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, corner-mark system, and interactions are all specified below with exact values. Recreate pixel-faithfully. The only intentionally-placeholder items are **content** (see Assets & Content Notes) — layout/visuals are final.

---

## Screens / Views

### Persistent — Top Bar (fixed)
- **Layout:** fixed, full-width, height `60px`, `z-index:60`, flex space-between, horizontal padding `clamp(18px,4vw,40px)`. Background `rgba(240,239,236,.82)` with `backdrop-filter: blur(14px)`. Bottom border `1px solid #D6D3D1`.
- **Left:** monogram `JK` (700, 15px) with a blue `+` (`#2F5BFF`), then `Johannes Krumm` (500, 13px). Links to `#home`.
- **Right:** active-section label (uppercase, `#2F5BFF`, 12px, letter-spacing .08em) · a `/` divider (`#d6d3d1`) · live clock (`--:--:--`, `font-variant-numeric: tabular-nums`).
- **Progress line:** absolute at top of the bar, height `2px`, `background:#2F5BFF`, width = scroll %, `transition: width .15s linear`.

### Persistent — Bottom Bar (fixed)
- **Layout:** fixed, full-width, `min-height:52px`, `z-index:60`, flex space-between + `flex-wrap`, padding `9px clamp(18px,4vw,40px)`. Same translucent blur background, top border `1px solid #D6D3D1`.
- **Left:** 7 nav **dots** (`<a>` to each section id). Each is a rounded tick, `height:6px`, `border-radius:3px`; **active** = width `22px` + `#2F5BFF`, **inactive** = width `10px` + `#cfcac4`; `transition: width .25s, background .25s`.
- **Right:** mono links (12px, letter-spacing .06em, color `#57534e`): `RÉSUMÉ` (→ `#experience`), `GITHUB ↗` (external), `LINKEDIN ↗` (external), `CONTACT` (→ `#contact`, colored `#2F5BFF`). Hover → `#2F5BFF`.

### 1. Home / Overview (`#home`)
- **Purpose:** first impression + a bento grid that jumps into each section.
- **Layout:** full-viewport section, content `max-width:1180px`, centered. Two stacked bordered grids that share their divider line.
  - **Hero row:** flex-wrap, `gap:1px` over a `#D6D3D1` background (this is how the 1px grid lines are drawn), outer `border:1px solid #D6D3D1`. Left cell `flex:2 1 460px` (bg `#F4F2EF`, padding `clamp(30px,4vw,52px)`): eyebrow `TECH LEAD / SENIOR FULL-STACK DEVELOPER` (mono, `#2F5BFF`, letter-spacing .16em), H1 `Johannes Krumm` (mono 700, `clamp(40px,6.4vw,74px)`, line-height .96, letter-spacing -.03em, `#1c1917`), intro paragraph (`clamp(16px,1.6vw,19px)`, line-height 1.6, `#57534e`, max-width 480px). Right cell `flex:1 1 260px` = striped portrait placeholder (`min-height:clamp(280px,38vh,400px)`).
  - **Section-nav bento:** same grid technique, `border-top:none` so it merges with the hero row. Six `<a>` cells, each `flex:1 1 170px`, `min-height:100px`, padding `18px 20px`, flex-column space-between: a top row (mono number `01`–`06` in blue + a `↓`) and a title (mono 500, `clamp(15px,1.5vw,18px)`). Order: Writing, Experience, Personal Stack, **Projects (accent cell: bg `#2F5BFF`, white text)**, Photography, Contact. Hover on light cells → bg `#FBFAF8`; accent cell hover → `#244cf0`.
  - **Footer line:** `MUNICH, DE · CET` (mono, `#78716C`) and `SCROLL TO EXPLORE ↓` (with blue arrow).

### 2. Writing (`#writing`)
- **Section header pattern (shared by all sections):** flex row — number (mono 13px, `#2F5BFF`, letter-spacing .14em) · title (mono 600, `clamp(21px,2.5vw,30px)`) · a `flex:1` hairline (`1px #D6D3D1`) · a right meta label (mono 11px, `#a8a29e`, letter-spacing .14em). Here: `01 · Writing · RECENT & PINNED`.
- **Body:** grid (flex-wrap + 1px lines). **Pinned** cell (`flex:1.1 1 380px`, `min-height:300px`): a `PINNED` chip (white on `#2F5BFF`, mono 10px), big mono title (`clamp(20px,2vw,26px)` 600), excerpt (`#78716C`), meta row (`2026.06 · INFRASTRUCTURE · 9 MIN`). **Recent** cell (`flex:1 1 420px`): a `RECENT` label, then article rows — grid `74px 1fr`, date (mono 12px `#a8a29e`) + title (mono 16px 500) + a tiny uppercase tag line; rows separated by `1px #E4E0DB`; hover → title `#2F5BFF`. Ends with `ALL ARTICLES →`.

### 3. Experience (`#experience`)
- `02 · Experience · OVERVIEW → ROLES`.
- **Overview block:** a summary paragraph (`clamp(17px,1.8vw,21px)`, `#292524`, max-width 560px) + two mono facts (`FOCUS`, `CORE STACK`), separated below by a `1px #D6D3D1` rule.
- **Timeline:** three role rows, each grid `118px 1fr`, top-bordered `1px #E4E0DB`: year range (mono 12px; current role in `#2F5BFF`, others `#a8a29e`), role title (mono 600 `clamp(17px,1.7vw,20px)`) + company descriptor (`#a8a29e`), one-line scope (`#78716C`). Rows reveal staggered (the “roles open as you arrive” effect). Ends with `FULL RÉSUMÉ →`.

### 4. Personal Stack (`#stack`)
- `03 · Personal Stack · AI · HOMELAB · INFRA`.
- Three equal cells (`flex:1 1 300px`, `min-height:280px`) in the 1px grid: **AI CODING**, **HOMELAB**, **VPS / INFRA**. Each: mono label in `#2F5BFF`, a one-line description (`#78716C`), then a wrap of bordered mono chips (`1px #D6D3D1`, padding `6px 10px`). One chip (`Rollhook deploys`) is highlighted with a blue border + blue text to tie back to the project.

### 5. Projects (`#projects`)
- `04 · Projects · IN THE WILD`.
- Grid: **free-planning-poker.com** = large accent cell (`flex:1.4 1 420px`, bg `#2F5BFF`, white text, `min-height:280px`): top meta `LIVE · WITH USERS` / `VISIT ↗`, big mono title, description, three outlined chips. **Right column** (`flex:1 1 300px`, nested 1px grid): **rollhook.com** card (mono title + description + `VISIT ↗`) and a **More on GitHub** card (`@jkrumm ↗`). All three are external links (open in new tab).

### 6. Photography (`#photography`)
- `05 · Photography · MUNICH & THE ROAD`.
- A masonry-ish flex-wrap of 5 striped placeholder tiles (varying `flex` bases: `2 1 300px` and `1 1 200px`) with mono EXIF-style captions bottom-left (`MUNICH · 2026 · 35MM`, `ALPS · 2025`, `STREET · 2025`, `TRAVEL · 2024`, `PORTRAIT · 2024`). Ends with `VIEW GALLERY →`.

### 7. Contact (`#contact`)
- `06 · Contact · MUNICH, DE`.
- A large mono statement (`clamp(24px,3.4vw,42px)` 600, max-width 760px): “Open to select opportunities and thoughtful collaborations.” Then two link cells in the 1px grid: **GITHUB** (`@jkrumm`) and **LINKEDIN** (`Johannes Krumm`), each with a `↗`. Below, a faint mono line: `PREFER EMAIL? — [ add your address ]` (a slot to fill in).

---

## Interactions & Behavior
- **Scroll snapping:** the scroll container uses `scroll-snap-type: y proximity`; each `<section>` is `min-height:100vh` with `scroll-snap-align:start`. Proximity (not mandatory) so tall sections on mobile scroll freely. `scroll-padding-top:60px; scroll-padding-bottom:56px` keeps section tops clear of the fixed bars. Container has `scroll-behavior:smooth` so the anchor nav (`#writing`, dots, footer links) animates.
- **Reveal animation (replayable):** every `[data-reveal]` starts `opacity:0; transform:translateY(20px)`. An `IntersectionObserver` (root = the scroll container, `threshold:[0,0.12]`) sets `opacity:1; transform:none` on enter and **re-hides** on full exit (ratio 0), so motion replays each visit. Per-element stagger via a `data-delay` attribute (values `60`–`360`ms) applied as `transition-delay`. Easing: `cubic-bezier(.2,.7,.2,1)`, duration `.6–.7s`.
- **Active-section tracking:** a second `IntersectionObserver` (`threshold:[0.12,0.3,0.5,0.75]`) picks the most-visible section, updates the top-bar label (`[data-active-label]`) and the active footer dot (`[data-dot]`).
- **Scroll progress:** the container's scroll listener sets the top progress line width to `scrollTop / (scrollHeight - clientHeight)`.
- **Live clock:** Munich time via `toLocaleTimeString('en-GB', { timeZone: 'Europe/Berlin', hour12: false })`, updated every second into all `[data-clock]` nodes.
- **Hover states:** cells lighten to `#FBFAF8` (accent cells → `#244cf0`); links/titles shift to `#2F5BFF`. Transitions `.2–.25s`.
- **Responsive:** no media queries — layout is fluid via `clamp()` type/padding and `flex-wrap` + `flex-basis` cells. On narrow screens the bento cells wrap to a single stacked column (an editorial, index-like read); the bars wrap their contents.
- **Accessibility:** honor `prefers-reduced-motion` — disable reveal transforms/transitions and view-transition animations (Astro's `<ClientRouter />` does this automatically; add the CSS guard shown in `ASTRO_SETUP.md` for the reveals).

## State Management
No app state. Runtime-only, derived values:
- `activeSection` (index) — derived from IntersectionObserver, drives label + dots.
- `scrollProgress` (%) — derived from scroll position.
- `clock` (string) — interval timer.
All are DOM-updated imperatively (textContent / style) — no framework state needed. In Astro this is a single client `<script>` re-run on `astro:page-load`.

## Design Tokens

**Colors**
| Token | Hex | Use |
|---|---|---|
| Base bg | `#EFEEEB` | page / scroll stage |
| Panel | `#F4F2EF` | cells, cards |
| Panel hover | `#FBFAF8` | light-cell hover |
| Line | `#D6D3D1` | 1px grid lines, borders |
| Hairline | `#E4E0DB` | list-row separators |
| Ink | `#1c1917` | primary text / headlines |
| Ink-2 | `#57534e` | body |
| Muted | `#78716C` | secondary/meta |
| Faint | `#a8a29e` | labels, `+` marks |
| Faint-2 | `#8a827a` | placeholder captions |
| Accent | `#2F5BFF` | electric blue |
| Accent hover | `#244cf0` | accent-cell hover |
| Accent glow | `rgba(47,91,255,.16)` | dot ring |
| Dot idle | `#cfcac4` | inactive nav dot |
| Bar bg | `rgba(240,239,236,.82)` + `blur(14px)` | fixed bars |

**Placeholder fills** — portrait: `repeating-linear-gradient(135deg,#EAE7E3 0 9px,#F4F2EF 9px 18px)`; photos: `repeating-linear-gradient(135deg,#E7E3DE 0 10px,#F1EEEA 10px 20px)`.

**Typography** — Headlines/labels/mono: **JetBrains Mono** (400/500/600/700). Body: **Nunito Sans** (400/500/600/700). Name H1 `clamp(40px,6.4vw,74px)`/700/lh .96/ls -.03em. Section title `clamp(21px,2.5vw,30px)`/600. Intro `clamp(16px,1.6vw,19px)`/lh 1.6. Micro-labels 11–12px, uppercase, letter-spacing .1–.16em.

**Spacing** — grid gap `1px`; cell padding `clamp(18px→52px)` by context; section padding `104px / clamp(20px,5vw,72px) / 96px`; top bar `60px`, bottom bar `min 52px`; scroll-padding `60 / 56`.

**Corners / lines** — everything is `1px solid #D6D3D1`, no border-radius except the nav dots (`3px`). The **“+” marks**: a `<i>` with `+` in JetBrains Mono `13px`, absolutely positioned `-6px` outside a cell's top-left and bottom-right corners, color `#a8a29e` (or `rgba(255,255,255,.7)` on accent cells) — they land on the grid intersections.

**Motion** — reveal `.6–.7s cubic-bezier(.2,.7,.2,1)`, `translateY(20px)→0` + fade, stagger `60–360ms`; hover `.2–.25s`; progress `.15s linear`; dots `.25s`.

## Assets & Content Notes
- **No image assets** — portraits and photos are CSS striped placeholders. Replace with real `<img>`/Astro `<Image>` (hero portrait; ~5 photography tiles).
- **Fonts** — Google Fonts (JetBrains Mono, Nunito Sans). In production, self-host via `@fontsource` for performance.
- **Placeholder content to replace with real data:** article titles/dates (Writing), role titles + **industry-descriptor** companies + years (Experience — these are generic descriptors, not real employer names), and the AI/HomeLab/Infra chip lists (representative of the described setup). **Real/verified:** name, Munich, GitHub `github.com/jkrumm`, LinkedIn `linkedin.com/in/johannes-krumm`, projects `free-planning-poker.com` and `rollhook.com` (zero-downtime rolling Docker Compose deploys via webhooks). Email is an intentional fill-in slot.
- **Stub routes** in the prototype: `/blog`, `/resume`, `/photos` — wire to real pages/sections when built.

## Files
- `Portfolio-standalone.html` — open this to see and scroll the design.
- `Portfolio.dc.html` — authoring source markup + behavior.
- `ASTRO_SETUP.md` — recommended current Astro + motion stack, project structure, and starter code to scaffold from.
