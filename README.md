# jkrumm.com

Personal portfolio for Johannes Krumm — a borderless two-column document on
native scroll: a sticky identity rail on the left, one content column on the
right (Projects → Experience → Writing → Contact), plus guide/blog reading and
listing surfaces on the same grid. Separation comes from a whitespace ladder, a
four-step ink ramp and right-aligned tabular metadata — the site's entire
hairline budget is two.

## Stack

- **[Astro 7](https://astro.build)** (static output) — zero client JS except one small behavior script.
- **[Bun](https://bun.sh)** — package manager + task runner.
- **[Motion](https://motion.dev)** — `inView` powers the once-only scroll reveals. The article progress line is CSS-only (`animation-timeline: scroll()`), no JS.
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
    profile · experience · projects
  content/                  # MDX collections: guide · blog
  styles/global.css         # design tokens, reset, the .shell grid, hover + reveal systems
  scripts/portfolio.ts      # Motion reveals · scroll-spy → sidebar aria-current
  layouts/
    BaseLayout.astro        # <head>, fonts, pre-paint theme script, ClientRouter, SEO
    ArticleLayout.astro     # reading surface — TOC in the rail, CSS-only progress line
    IndexLayout.astro       # guide/blog listing — stats in the rail
    StubLayout.astro        # placeholder pages
  components/
    primitives/             # Section · RowList · MetaLink
    chrome/                 # Sidebar · ReadingHeader · SiteFooter · ThemeToggle
    content/                # MDX blocks: Figure · Callout · Chart · Steps · Table · …
    seo/                    # BaseHead · JsonLd
    sections/               # Projects · Experience · Writing · Contact
  pages/                    # index · guide/* · blog/* · resume · photos
```

Every surface is the same `.shell` grid (`side` rail · 64px gutter · `main`
column · `full` bleed) on document scroll. There is no inner scroll container and
no second frame.

## Extending

- **Content** — edit the typed modules in `src/data/` (and MDX in
  `src/content/`); layout never changes. `data/profile.ts` is the single source
  of truth for what sections exist — the nav ids double as the anchors and the
  scroll-spy targets.
- **Design tokens** — every colour, size, weight and spacing step is a CSS
  variable in `src/styles/global.css`. The size ladder tops out at 24px and the
  spacing ladder is three structural tokens; anything off those lists is a bug.
- **New pages** — build on `BaseLayout` and put your content in a `.shell`;
  `<ClientRouter />` gives view-transition navigation for free and the sitemap
  picks them up automatically. A new listing page is `IndexLayout`, not a new
  frame.
- **Imagery** — CDN URLs via the `/img` skill, not files in `public/`. The
  sidebar portrait is `profile.avatar` (currently `null` → neutral tile). Media
  gets a ring (`box-shadow: var(--shadow-ring)`), never a border.
- **SEO** — per-page `title`/`description` via `BaseLayout` props; the JSON-LD
  `@graph` (Person + WebSite + ProfilePage) is derived from `src/consts.ts`.

## Known gaps

The contact form is markup only — it posts nowhere and the submit is disabled
until it is wired to `bun-email-api`. `/photos` is a stub: the Photography
section ships only if there are real photos worth showing.
```
