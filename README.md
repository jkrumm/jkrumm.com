# jkrumm.com

Personal portfolio homepage for Johannes Krumm — a single-page, full-viewport
scroll experience (Overview → Writing → Experience → Personal Stack → Projects →
Photography → Contact) with persistent top/bottom chrome, a live Munich clock,
scroll-progress, active-section tracking and replayable reveal animations.

## Stack

- **[Astro 7](https://astro.build)** (static output) — zero client JS except one small behavior script.
- **[Bun](https://bun.sh)** — package manager + task runner.
- **[Motion](https://motion.dev)** — `inView`/`scroll` power the reveals and the progress line.
- **Astro Fonts API** — JetBrains Mono (code), Hubot Sans (headings/UI), Nunito Sans (body), self-hosted and subset at build time (no CLS).
- **`@astrojs/sitemap`** + hand-rolled `BaseHead` / JSON-LD for SEO.

No UI framework (React/Vue) — the design is static markup plus one imperative
script, so none is needed.

## Develop

```bash
bun install
bun run dev      # frees port 7728, then serves on http://localhost:7728
```

Locally the site is reverse-proxied over HTTPS at **https://jkrumm.test** (Caddy →
`localhost:7728`; port is hard-assigned and `strictPort`-enforced).

> **Runtime:** Astro 7 requires Node ≥ 22.12. This is a Bun-first repo, so every
> `astro` command is pinned to Bun's runtime (`bun --bun node_modules/.bin/astro …`
> in `package.json`), which reports Node-compat 24 — no system Node upgrade needed.

```bash
bun run build    # astro check + astro build → dist/
bun run preview  # serve the production build
```

## Structure

```
src/
  consts.ts                 # identity + SEO source of truth
  data/                     # typed content (edit these, not the layout)
    nav · articles · experience · stack · projects · photos
  styles/global.css         # design tokens + reveal system
  scripts/portfolio.ts      # Motion reveals · active section · progress · clock
  layouts/BaseLayout.astro   # <head>, fonts, ClientRouter, SEO slots
  components/
    primitives/             # Plus · Cell · Grid · SectionShell · SectionHeader · Chip · MetaLink
    chrome/                 # TopBar · BottomBar
    seo/                    # BaseHead · JsonLd
    sections/               # one component per section
  pages/                    # index + blog/resume/photos stubs
```

## Extending

- **Content** — edit the typed modules in `src/data/`; layout never changes.
- **Design tokens** — all colors, type and spacing live as CSS variables in
  `src/styles/global.css`. Bar heights, max width and placeholder fills too.
- **New pages** — build on `BaseLayout`; `<ClientRouter />` gives view-transition
  navigation between them for free. Sitemap picks them up automatically.
- **Real imagery** — the striped portrait/photo placeholders are ready to swap
  for Astro `<Image>` (hero portrait + photography tiles).
- **SEO** — per-page `title`/`description` via `BaseLayout` props; the JSON-LD
  `@graph` (Person + WebSite + ProfilePage) is derived from `src/consts.ts`.

## Content still to fill in

Article titles/dates, role descriptors and stack chips are representative
placeholders from the design handoff; the contact section has an intentional
email slot. Name, location, GitHub, LinkedIn and the live projects are real.
```
