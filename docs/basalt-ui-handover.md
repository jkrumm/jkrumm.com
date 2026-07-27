# basalt-ui — framework-free token consumption

**Paste this into a fresh Claude Code session opened in `~/SourceRoot/basalt-ui`.**
It is self-contained; nothing below assumes context from the jkrumm.com session
that produced it.

---

## Why

jkrumm.com (Astro 7, static, no React, 8 direct dependencies) evaluated basalt-ui
v1.2.0 and **hand-ported the colour values** into its own `global.css` instead of
installing the package. The capability was there — `buildPaletteCss` is publicly
reachable from `basalt-ui/tokens` and runs framework-free under both Node 20 and
Bun, emitting 9718 bytes / 248 lines / 197 `--vx-*` variables with no React, no
Mantine, no DOM in the import graph. The blockers were all packaging and
ergonomics:

1. `bun add basalt-ui` pulls ~79 packages, because `react`, `react-dom`,
   `@mantine/core`, `@mantine/hooks` and `@tanstack/react-query` are
   **non-optional** peers.
2. 104 of the 197 emitted variables are `--vx-space-*`, and **95 of those are
   one-offs named for basalt's own React components**
   (`--vx-space-agent-transcript-inset`, `--vx-space-sidebar-child-row-indent`,
   `--vx-space-toc-sub-indent`, …). Dead weight in any non-basalt consumer. Only
   9 are generic anchors.
3. The per-scheme selector is hardcoded to `html[data-mantine-color-scheme='…']`.
   `BuildPaletteOpts` has exactly two fields (`groups`, `derived`) — no way to
   change it.
4. `dist/styles.css` carries two rules that misbehave in a non-basalt page.

The five changes below close 1–4. Each is independently shippable, additive, and
defaults to today's exact behaviour.

---

## Non-negotiable repo conventions

Violating any of these will fail `bun run pre`, the commit hook, or the release.

- **Bun only.** No `npm`/`pnpm`/`yarn`, no `node` invocations where `bun` works.
- **oxlint + oxfmt.** Never ESLint or Prettier. Validate with `bun run pre`
  (= `fmt:check` + `lint` + `typecheck` + `check-theme`).
- **Named exports only.** `import/no-default-export` is enforced; the two existing
  exceptions carry an inline `oxlint-disable` with a reason.
- **The `defineX` const-generic factory contract** — new public builders follow
  the existing `defineSeries`/`defineX` shape, not ad-hoc object literals.
- **Adding an export touches FOUR files in the same commit:**
  `packages/basalt-ui/package.json` (`exports`), `src/surfaces.ts` (`SURFACES`),
  `scripts/export-surface.json`, `scripts/check-tarball-parity.mjs`. The CLI and
  `tests/surfaces-coverage.test.ts` assert **set-equality** across them — miss one
  and the suite fails.
- **commitlint enforces an EMPTY scope.** `feat: …`, never `feat(tokens): …`
  (`scope-empty: [2, 'always']`). Header ≤ 80 chars, lower-case type, no trailing
  period, subject not sentence/start/pascal/upper case.
- **semantic-release, and NO MAJORS.** Every change here must be additive and
  default to today's behaviour. If you cannot make it additive, stop and report
  rather than shipping a breaking change.
- **basalt-ui is always its own commit** (published NPM package) and is a
  **PR-required repo** — no direct-to-master.
- **No AI/tool attribution** anywhere: code, comments, commits, PR body.

---

## Change 1 — selector + colour-scheme options on `buildPaletteCss`

**File:** `packages/basalt-ui/src/tokens/index.ts`
(`BuildPaletteOpts`, `buildPaletteCss`).

### Do this first

Commit the **current** `buildPaletteCss()` output as a golden fixture before
touching anything:

```ts
// src/tokens/__fixtures__/palette-default.css  (exact bytes, 9718)
```

with a test asserting `buildPaletteCss() === readFileSync(fixture, 'utf8')`. This
is the regression gate for changes 1, 3 and 4 — every one of them must leave the
default output byte-identical.

### API

```ts
export type BuildPaletteOpts = {
  groups?: Record<string, SeriesMap>
  derived?: string[]

  /** Attribute + values the per-scheme blocks key off.
   *  Default: { attribute: 'data-mantine-color-scheme', darkValue: 'dark', lightValue: 'light' } */
  scheme?: { attribute?: string; darkValue?: string; lightValue?: string }

  /** Which scheme rides along on the bare `:root` block. Default: 'dark'. */
  defaultScheme?: 'dark' | 'light' | 'none'

  /** Also emit an `@media (prefers-color-scheme: …)` fallback block. Default: false. */
  mediaFallback?: boolean
}
```

All three default to today's exact behaviour.

### CRITICAL — the specificity detail

Emit **`:root[attr='value']`**, not `html[attr='value']`.

`:root[data-theme='dark']` is **0-2-0**. A bare `[data-theme='dark']` is **0-1-0**
— the *same* specificity as a light-default site's bare `:root` block. Source
order then decides the winner, and dark mode silently does nothing on any consumer
whose `:root` light block happens to come last. `html[…]` is also 0-1-1 and works,
but `:root[…]` is both higher and framework-neutral. Use `:root[…]`.

Today's default output must stay byte-identical, so the existing emission path
already writes `html[data-mantine-color-scheme='…']` — keep that literal string as
the default-branch output and use `:root[…]` only when `scheme` is supplied.
Assert both in tests.

### Acceptance criteria

- `buildPaletteCss()` with no args → byte-identical to the golden fixture.
- `buildPaletteCss({ scheme: { attribute: 'data-theme' }, defaultScheme: 'light' })`
  → `:root` carries light, `:root[data-theme='dark']` carries dark.
- `defaultScheme: 'none'` → both schemes get their own attribute block, the bare
  `:root` carries only the theme-independent scalars.
- `mediaFallback: true` → an `@media (prefers-color-scheme: dark)` block wrapping a
  bare `:root` with the dark primitives, emitted **before** the attribute blocks so
  an explicit attribute always wins.
- `src/provider/index.test.tsx` (which asserts the bare `:root` emission) still
  passes untouched.
- `bun run pre` green.

---

## Change 2 — make the five React peers optional

**File:** `packages/basalt-ui/package.json` (`peerDependenciesMeta`).

Add `{ "optional": true }` for exactly these five, which are currently the only
non-optional peers left:

- `react`
- `react-dom`
- `@mantine/core`
- `@mantine/hooks`
- `@tanstack/react-query`

**Keep them in `peerDependencies`** — that is what still gives React consumers a
version-mismatch warning. `peerDependenciesMeta.optional` only suppresses the
*missing*-peer install, not the mismatch check.

**Why this is safe:** `./tokens`, `./charts`, `./state` and `./guard` already
resolve with zero Mantine in the graph. That is not an assumption — it is
enforced by the repo-local `basalt/token-layer-boundary` oxlint rule
(`.oxlintrc.json`, registered as `error`, live-registration verified in
`tests/surfaces-coverage.test.ts`) and by `scripts/check-dist-layering.mjs`, which
walks the **built** `dist/` graph of the Mantine-free subpaths and fails on any
reachable `@mantine/*` import.

### Acceptance criteria

- `bun run pack-test` green (it already runs `check-dist-layering.mjs` and
  `check-tarball-parity.mjs`).
- In a scratch dir: `bun add ./basalt-ui-*.tgz` with no React present installs
  without peer errors, and `bun -e "import('basalt-ui/tokens')"` resolves.
- A React consumer on a mismatched Mantine major still warns.
- `publint` and `attw` still clean.

---

## Change 3 — prebuilt `dist/tokens.css` + a `tokens:css` CLI subcommand

**Files:** `packages/basalt-ui/scripts/copy-assets.mjs` (or a sibling build step),
`packages/basalt-ui/src/cli/index.ts`, `packages/basalt-ui/package.json`
(`exports`), plus the three companion files from the four-file export rule.

### The artifact

Emit `dist/tokens.css` at build time by calling `buildPaletteCss()` with no
options — i.e. byte-identical to the golden fixture. Export it as
`"./tokens.css": "./dist/tokens.css"`, alongside the existing
`"./styles.css"` entry. `sideEffects: ['*.css']` already covers it.

### The subcommand

```
basalt-ui tokens:css [flags]
  --out <path>                 write here instead of stdout
  --selector-attribute <attr>  → opts.scheme.attribute
  --default-scheme <dark|light|none>
  --media-fallback
  --only <core|all>            (lands with change 4; accept and forward now)
```

**It delegates entirely to `buildPaletteCss` and has no logic of its own** — parse
flags, build an options object, call, write. No re-implementation of emission, no
post-processing of the returned string.

Dispatch it in the existing `switch` in `src/cli/index.ts` alongside `init`,
`sync`, `check-theme`, `check-coverage`, `info`, `doctor`, `guard-hook`. `--help`
/ `-h` must short-circuit **before** dispatch (`src/cli/help.test.ts` regression —
a read request must never mutate), and the new subcommand needs a help-ledger
entry.

This is the path that removes the install entirely for a static consumer:

```
bunx basalt-ui tokens:css --selector-attribute data-theme --default-scheme light --only core
```

### Acceptance criteria

- `dist/tokens.css` present in the packed tarball; `check-tarball-parity.mjs`
  updated and green.
- `dist/tokens.css` === golden fixture, byte for byte.
- `basalt-ui tokens:css` with no flags prints exactly the fixture to stdout,
  exit 0.
- `basalt-ui tokens:css --help` prints help and exits 0 **without** writing
  anything.
- New export registered in all four files; `scripts/export-surface.mjs` and
  `tests/surfaces-coverage.test.ts` green.

---

## Change 4 — `only: 'core' | 'all'` emission filter

**File:** `packages/basalt-ui/src/tokens/index.ts`.

Add `only?: 'core' | 'all'` to `BuildPaletteOpts`, **default `'all'`, output
unchanged**.

`'core'` drops the component-specific `SPACE_STEP` one-offs. Measured on the
current build: 104 emitted `--vx-space-*` variables break down as **9 from
`SPACE` anchors** (`stack-xs`…`stack-xl`, `control-height`, `input-height`,
`row-inset-x`, `row-inset-y`), **94 from `SPACE_STEP`**, and **1 unclassified** —
so `'core'` drops **95** and keeps 9, taking the total from 197 to 102.

Do not hand-maintain a drop list. Derive the partition from the source constants
(`SPACE`/`SPACE_SCALE` are core; `SPACE_STEP` is component-specific) so a new
`SPACE_STEP` entry is automatically excluded and cannot drift.

Colour, radius, shadow, type and status variables are unaffected by `only` —
`'core'` is a *spacing* filter, not a general trim.

### Acceptance criteria

- `buildPaletteCss()` and `buildPaletteCss({ only: 'all' })` both === golden
  fixture.
- `buildPaletteCss({ only: 'core' })` emits 102 unique `--vx-*` names; the diff
  against `'all'` is exactly the 95 dropped spacing variables and nothing else.
- A test asserts every kept spacing name is a key of `SPACE`, and no key of
  `SPACE_STEP` survives — so the partition tracks the constants, not a literal
  list.
- `bun run check-theme` green (it reads the emitted variable set).

---

## Change 5 — `docs/FRAMEWORK-FREE.md` + two `styles.css` hazard fixes

### The doc

New `docs/FRAMEWORK-FREE.md` covering: what `basalt-ui/tokens` gives a non-React
consumer, the `buildPaletteCss` options from change 1, the `tokens:css` CLI
recipe from change 3, `only: 'core'` from change 4, the `alpha()` law (opacity is
always `color-mix`, never `rgba()` — `rgba()` freezes a literal and breaks
per-scheme resolution), and the **three-role line split**, which is the single
thing a consumer most reliably gets wrong:

| token | role |
|-|-|
| `--vx-surface-border` | strong layout border between structural regions |
| `--vx-divider` | soft rule *inside* a surface |
| `--vx-surface-hairline` | consumed **only** inside `--vx-shadow-card`'s baked ring; never referenced directly |

A consumer with a single `--hairline` token maps it to **`--vx-divider`**, not to
the name-lookalike `--vx-surface-hairline`. Say that explicitly, with the failure
mode (a hairline that is invisible because it was tuned to sit inside a shadow, or
doubled against the ring `--vx-shadow-card` already bakes in).

Also document the elevation doctrine: depth is a whisper shadow with the 1px ring
**inside** the shadow value, never a bare `border` property — and the dark scheme
flips that ring to `inset`, which is why the two schemes cannot share one
expression.

### Hazard fix A — the unlayered print rule

`packages/basalt-ui/src/styles.css`, currently **outside** every `@layer`:

```css
@media print {
  nav, header, footer { display: none !important; }
}
```

Unlayered + `!important` + bare element selectors. On any consumer page that has a
real `<nav>`/`<header>`/`<footer>` and no `BasaltShell`, printing silently blanks
the landmarks. Scope it to the shell's own class hooks
(`.mantine-AppShell-navbar` / `-header` / `-footer`, or a basalt-owned
`data-basalt-chrome` attribute), move it inside `@layer basalt`, and drop the
`!important` — layer order already wins over `@layer mantine`.

### Hazard fix B — the global heading `font-stretch`

Same file, inside `@layer basalt`:

```css
h1, h2, h3, h4, h5, h6, .mantine-Title-root { font-stretch: 88%; }
```

Being layered means unlayered consumer CSS still wins — but any consumer that
layers its own base type (the pattern basalt itself recommends) loses its heading
width to a hardcoded 88%. Scope the bare element selectors to a basalt root hook
and leave `.mantine-Title-root` as-is; better still, drive the value from a
`--vx-font-display-stretch` variable so a consumer retunes rather than fights it.

### Acceptance criteria

- A print stylesheet test (or a documented manual check) confirming a plain
  `<nav>` outside basalt chrome survives printing.
- `bun run pre` green; playground renders unchanged in both schemes.
- `docs/FRAMEWORK-FREE.md` linked from `README.md` and `llms.txt`
  (`scripts/gen-llms.ts` regenerated).

---

## Suggested commit sequence

One PR per commit is fine; one PR carrying all six in order is also fine. Do not
squash them into a single commit — semantic-release reads each.

```
test: pin the default palette CSS output as a golden fixture
feat: let buildPaletteCss target a custom color-scheme selector
feat: make the react and mantine peers optional
feat: ship a prebuilt tokens.css and a tokens:css subcommand
feat: add a core-only spacing emission mode to buildPaletteCss
docs: document framework-free token consumption and scope the styles.css globals
```

Empty scopes, lower-case types, ≤80 chars — as commitlint requires. The last one
carries the two `styles.css` fixes; if you prefer, split the fixes out as a
separate `fix:` commit ahead of the docs commit.

---

## Explicitly out of scope

Each of these is a **real follow-up**, not a decision to drop. Record them (issue
or `docs/STATUS.md`) so they are not silently lost.

1. **Exposing `buildPaletteData` / `PaletteData` publicly.** Today they are
   deliberately un-exported from `tokens/index.ts` and `./tokens/palette` is
   absent from the exports map, so a deep import hard-fails
   (`ERR_PACKAGE_PATH_NOT_EXPORTED`). The consequence is that a framework-free
   consumer can retune radius and density (`deriveRadius` / `deriveSpacing` are
   public) but **cannot retune the accent** — that path runs through
   `createBasaltTheme`, which is React/Mantine. Real gap; out of scope here
   because jkrumm.com does not need it.
2. **A plain-class `dist/content.css` artifact.** The content/prose styling is
   currently CSS-modules-scoped and reachable only through React components. A
   plain-class build would let a static site adopt basalt's prose language. Larger
   design question — separate change.
3. **Reconciling the accent drift.** basalt's shipped derive output has drifted
   from basalt's own `docs/DESIGN-SPEC.md`: the spec's accent is `#0077bd` /
   `#8ec5ff` (saturated sky), the emitter produces `#4374a6` / `#a2c3f0` (muted
   slate), because chroma is scaled by `max(seedChroma, 40) × 0.72`
   (`VIBRANCY_CENTER_CHROMA_MULT`) at vibrancy level 0. `theme/contrast.test.ts`
   pins the drifted values, so this is known, not accidental — but the spec table
   is still the stated design intent, and a consumer reading the spec gets a
   different palette than a consumer calling the emitter. Decide which is
   authoritative and make the other follow. **Do not fold this into any of the
   five changes above** — it is the one change here that would visibly move
   existing consumers' pixels.
