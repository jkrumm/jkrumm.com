---
paths:
  - src/data/**
  - src/content/**
  - public/**
---

# Content

Edit typed modules in `src/data/`; the layout doesn't change. Design tokens
(all colors, type, spacing, the shell's column widths) are CSS variables in
`src/styles/global.css`.

**Career data has one source: `src/data/career/`** (`facts.ts` + generic
`targets.ts`). The homepage Experience and featured Projects, `/resume`, the
committed PDF (`public/johannes-krumm-resume.pdf`) and the LinkedIn copy are
all derived from it — never hand-edit `experience.ts` / `projects.ts` featured
rows. Use the **`career` skill** for any résumé, LinkedIn or positioning work.
After changing anything the `default` target shows, run `bun run resume default`
and commit the regenerated PDF with it. The print sheet
(`src/components/resume/ResumeSheet.astro`) is a paper document with its own
type system in pt (Source Serif 4, `--font-serif`, used nowhere else) — the
layout invariants in `layout.md` do not apply to it. This repo is public: no
phone, address or private email in `facts.ts`.

The Activity section's GitHub heatmap falls back to the committed snapshot
`src/data/github-activity.json` whenever the live build-time fetch fails; the
section's "Tokens" view (AI token consumption, switched via a CSS-only
segmented control) reads its own snapshot, `src/data/token-activity.json`,
which the build never fetches live since it needs a secret — refresh both with
`ARGO_TOKEN=<argo-api-secret> bun run activity`.

## Images / CDN

- **Content/article images** → CDN URLs (`blog/` prefix, readable names,
  uploaded via the `/img` skill), passed straight into `Figure.astro`'s `src`
  prop — it's a bare `<img src>`, no `astro:assets` pipeline. Don't add files
  to `public/` for these.
- **Anything scrapers/unfurlers read** (OG images, RSS) must use an `f:jpg`
  rendition, never `@jpg` — Cloudflare ignores `Vary: Accept`, so a
  format-negotiated URL can get cache-poisoned to AVIF for old clients.
- `public/diagrams/agent-platform.html` is a copy, not a source: edit
  `dotfiles/docs/diagrams/agent-platform.architecture.json`, regenerate it there with
  archify, then `make diagrams` here. The Agent Infrastructure guide embeds it.
- `public/` stays for the favicon, small SVG diagrams, and the current OG
  image (`og.png`, wired via `SITE.ogImage` in `src/consts.ts`, resolved
  absolute in `BaseHead.astro`). Migrating `og.png` to the CDN
  (`rs:fill:1200:630/f:jpg`) is an optional follow-up, not done yet.
