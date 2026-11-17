# jkrumm.com — project instructions

Personal portfolio — a borderless two-column document: a sticky identity rail and
one content column, on document scroll. Loads on top of the global
`~/.claude/CLAUDE.md`; only repo-specific conventions not derivable from the code
live here.

## Stack

- **Astro 7**, `output: 'static'` — static markup, zero client JS except two
  scripts: `src/scripts/portfolio.ts` (behavior — reveals, scroll-spy, the
  Contact form's fetch submit to email-gateway) and
  `src/scripts/analytics.ts` (measurement — Umami events, see Analytics below).
  **No UI framework** (no React/Vue) — don't introduce one.
- **Bun** — package manager + runtime.
- **Motion** (`motion.dev`) — the only client dependency. Vanilla
  `animate`/`inView`/`scroll` from `motion` (never `motion/react`).
- **Astro Fonts API** + `@astrojs/sitemap` + hand-rolled SEO (`BaseHead`/JSON-LD).
- **Fonts** — `--font-mono` (JetBrains Mono, real code only), `--font-display`
  (Hubot Sans, headings/nav/labels/chrome — variable, loaded as a true range
  `weights: ['200 900']` not discrete instances; tuned via `--font-display-stretch:
  88%` and `--font-display-weight-offset: -100` in `global.css`), `--font-sans`
  (Nunito Sans, body text). Live-tune via the dev-only **Font Lab** toolbar app
  (`src/dev-toolbar/font-lab.ts`) — width/weight sliders drive the same tokens
  production reads.

## Validate

- `bun run build` = `astro check` + `astro build` — the exact local validation CI
  runs (the Dockerfile's `RUN bun run build`). Must stay green (0 errors/warnings)
  on any source change.
- `make check` = frozen install, `oxfmt --check` (`bun run format:check`),
  `oxlint --type-aware` (`bun run lint`), then `bun run build`. `bun run format`
  fixes formatting. There is no test step in this repo. Bun is pinned via
  `packageManager`.
- Don't run `bun run dev` for the user — they validate running apps manually.
- Local HTTPS dev host: `https://jkrumm.test` (Caddy → `localhost:7728`).

## Deploy

- Push to `master` deploys. `.github/workflows/deploy.yml` builds the image and
  ships it to the VPS via RollHook (zero-downtime rolling swap), then purges the
  `jkrumm.com` hostname from Cloudflare's edge. There is no local deploy step —
  `make deploy` only prints `deployed by CI on push`.
- A daily 04:17 UTC scheduled run rebuilds the site so the homepage GitHub
  heatmap (fetched at build time) moves.
- The VPS app lives at `vps/apps/jkrumm-com`; its compose service is
  `jkrumm-com` (RollHook-managed nginx container, no secrets in the compose).

## Verify & Monitor

- Health URL: `https://jkrumm.com/` — `make verify` curls it and exits non-zero
  when the site is not live and healthy.
- `project.yaml` (factory manifest): `deploy.mode make`, one target (`vps`,
  `verify: make verify`), 10m hold. `make version` prints the deployed commit
  sha, read from the live footer's build-commit link (the site has no other
  version surface) — so it reports the last *built* commit, which the daily
  scheduled rebuild also moves.
- Uptime Kuma monitor: none — no jkrumm.com site monitor is declared in the homelab's
  `uptime-kuma/monitors.yaml`.
- OTel `service.name`: `none` — the site is a static nginx container with no
  OpenTelemetry instrumentation; the compose file sets no `OTEL_*` variables and
  the repo carries no OTel SDK.

## Gotchas

- **Runtime pin.** Astro 7 needs Node ≥ 22.12; this machine defaults to older
  Node, so every `astro` command is pinned to Bun's runtime
  (`bun --bun node_modules/.bin/astro …`) in `package.json`. Details in `README.md`
  § Runtime — don't "fix" the scripts back to bare `astro`.
- **Stale dev styles.** After a large multi-file edit the live dev server can
  serve stale scoped styles (Vite HMR silently drops some `.astro` `<style>`
  updates) — a page that looks structurally broken may just be stale. Verify
  against `bun run build` output or a restarted dev server, not the hot-reloaded
  page.

## Scroll & animation work

Before scroll, reveal or motion work under `src/scripts/**`, `src/styles/**` or `src/components/**`, use the `astro-motion-scroll` skill; its invariants are in `.claude/rules/animation.md`. End every animation/scroll task by appending to the skill's `LEARNINGS.md`.

## Rules by path

Read the matching rule before changing files under its paths:

- `.claude/rules/layout.md`: the `.shell` grid, borderless invariants, spacing and accent budgets (`src/**/*.astro`, `src/styles/**`).
- `.claude/rules/analytics.md`: Umami events and tracking rules.
- `.claude/rules/content.md`: career data, activity snapshots, article images and the CDN (`src/data/**`, `src/content/**`, `public/**`).
