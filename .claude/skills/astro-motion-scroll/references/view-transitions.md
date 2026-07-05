# View transitions (`ClientRouter`) — as wired in this repo

Reference for the native View Transitions API via `astro:transitions`, grounded
in `src/layouts/BaseLayout.astro`. Astro 7, `output: 'static'`.

## Setup (how it's actually done here)

`ClientRouter` is imported in the base layout `<head>` — one line, applies to
every page built on `BaseLayout`:

```astro
---
// src/layouts/BaseLayout.astro
import { ClientRouter } from 'astro:transitions';
---
<head>
  <!-- ... -->
  <ClientRouter />
</head>
```

That's the whole opt-in. Every page that extends `BaseLayout` (index + the
`blog`/`resume`/`photos` stubs) gets soft-swap navigation and the automatic
route announcer for assistive tech for free. The sitemap and new pages inherit
it — see README "Extending".

## The rename you must get right

**Astro 5 renamed `ViewTransitions` → `ClientRouter`.** The module is still
`astro:transitions`. Any snippet using `import { ViewTransitions } from
'astro:transitions'` is stale (functional but wrong for this codebase). Always
write `ClientRouter`. This repo is on Astro 7 — `ClientRouter` only.

## Per-element directives

Applied to elements in `.astro` markup:

- `transition:name="hero"` — names a shared element so it morphs between the
  outgoing and incoming page. Names must be unique per page.
- `transition:animate="fade | slide | none"` (or a custom animation) — sets the
  transition for that element; `none` opts an element out.
- `transition:persist` — keeps an element (and its DOM/JS state) alive across
  navigation instead of re-rendering it. Useful for chrome that shouldn't reset
  (e.g. a persistent player); the top/bottom bars here re-render fine, so they
  don't need it today.

## The lifecycle contract (why this matters for animation)

`ClientRouter` does **soft swaps** — it does not reload the document. So any
IntersectionObserver / Motion `inView` / `scroll()` set up at module-import time
runs once and is then lost on the next navigation. The behavior layer
(`src/scripts/portfolio.ts`, distilled in `references/reveal-lifecycle.ts`)
handles this:

- `astro:page-load` → (re)initialise all observers/animations (fires on first
  load AND after every swap).
- `astro:before-swap` → tear down: disconnect observers, stop animations, clear
  timers. Prevents leaks and double-binding.
- `astro:after-swap` → fix scroll position if needed.

This is the single thing standard scroll libraries get wrong under
`ClientRouter`. It's non-negotiable here.

## Caveats / gotchas

- **CSS animations restart** and **iframes reload** across a swap even with
  `transition:persist`.
- **SSR ↔ client-island shared-element transitions are unreliable** — a
  `transition:name` on server-rendered markup and a matching one inside a
  hydrated island can fail to pair (name-mismatch class; see withastro/astro
  #8983). This site is static markup with **no UI framework / no islands**, so
  it doesn't hit this today — but if a section ever becomes a React/Vue island,
  don't rely on a shared-element morph into/out of it.
- **Reduced motion:** `ClientRouter` already disables its OWN transition
  animations under `prefers-reduced-motion`. Your custom Motion/IO code is
  separate and must opt out on its own (it does — see the reveal system).
- **Browser support (2026):** same-document view transitions reached Baseline
  2025-10 (Chrome/Edge 111, Firefox 144, Safari 18). Cross-document transitions:
  Chromium 126+, Safari 18.2; Firefox unsupported. Astro degrades gracefully —
  no transition, plain navigation — so it's safe as progressive enhancement.
