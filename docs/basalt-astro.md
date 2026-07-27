# basalt-ui on jkrumm.com — what was ported, and why not installed

Record of the July 2026 evaluation of **basalt-ui v1.2.0** for jkrumm.com. Audience:
whoever next touches `src/styles/global.css`. Read this before "syncing" a token
back to basalt's shipped output — several of the divergences below are deliberate
and one of them is load-bearing.

## Verdict

**Hand-port the values and the design law into `src/styles/global.css`. Do not
install the package.**

This is a cost/benefit call, **not** a capability gap. `buildPaletteCss` is
publicly reachable framework-free from `basalt-ui/tokens` — verified under both
Node 20 and Bun with no React, no Mantine, no DOM in the graph:

```
bun -e "import {buildPaletteCss} from 'basalt-ui/tokens'"   # works
buildPaletteCss()  →  9718 bytes / 248 lines / 197 unique --vx-* variables
```

The import graph is closed and relative-only (`tokens/index` → `palette` →
`derive` → `hct`; `hct` imports nothing), the package is `sideEffects: ['*.css']`,
and `dist/` ships in the tarball. A static Astro site *could* consume it. It
should not, for four reasons.

### 1. The install is 79 packages for 8 direct dependencies

`react`, `react-dom`, `@mantine/core`, `@mantine/hooks` and
`@tanstack/react-query` are **non-optional** `peerDependencies`. jkrumm.com has 8
direct deps (`astro`, `motion`, `@astrojs/*`, `@observablehq/plot`,
`astro-expressive-code`, `linkedom`) and a hard no-React rule. `bun add
basalt-ui` pulls ~79 packages to reach a pure-string CSS builder.

### 2. Over half the emitted CSS is dead here

Of the 197 variables, **104 are `--vx-space-*`** and **95 of those are one-offs
named for basalt's own React components** — `--vx-space-agent-transcript-inset`,
`--vx-space-sidebar-child-row-indent`, `--vx-space-toc-sub-indent`,
`--vx-space-virtual-row-inset-x`, … Only 9 are generic anchors
(`--vx-space-stack-xs`…`xl`, `control-height`, `input-height`, `row-inset-*`).
There is no emission filter — `buildPaletteCss` has no `only: 'core'` mode.

### 3. The selector is hardcoded to Mantine

The per-scheme blocks are emitted as `html[data-mantine-color-scheme='dark'|'light']`.
jkrumm.com switches on `[data-theme='dark']` (set pre-paint by the inline script
in `BaseLayout.astro`). `BuildPaletteOpts` has exactly two fields — `groups` and
`derived` — so there is no selector option to pass.

### 4. A framework-free consumer cannot retune the accent

`buildPaletteData` and the `PaletteData` type are deliberately **not** re-exported
from `tokens/index.ts` (the doc comment says so explicitly: a consumer reaches a
derived palette through `createBasaltTheme` — which is React/Mantine). The
`./tokens/palette` subpath is absent from the exports map, so the deep import
fails outright (`ERR_PACKAGE_PATH_NOT_EXPORTED` on Node; "Cannot find module" on
Bun). Radius and density retuning are fine — `deriveRadius` and `deriveSpacing`
are public. **Colour is the one hole**, and colour is the only thing jkrumm.com
wanted to retune.

## The drift finding — read this before "fixing" the accent

**basalt's shipped derive output has drifted from basalt's own
`docs/DESIGN-SPEC.md`.** The spec's accent-ink pair is `#0077bd / #8ec5ff`, a
saturated sky blue. The emitter produces `#4374a6 / #a2c3f0`, a muted slate,
because `derive.ts` scales chroma by `max(seedChroma, 40) × 0.72`
(`VIBRANCY_CENTER_CHROMA_MULT`) at vibrancy level 0. The spec acknowledges this
in a preamble note ("`accentFill` is `#4374a6` … not the literals below") and
`theme/contrast.test.ts` pins the drifted values, so the drift is *known* — but
the spec table is still the stated design intent.

jkrumm.com was built from the **spec table**, so:

- `--accent` dark `#8ec5ff` = spec exactly
- both `--accent-hover` values (`#0069a8` / `#51a2ff`) = spec exactly
- `--accent-fill` `#0077bd` (both schemes) = spec exactly
- five of six status solids = spec exactly

Pulling the emitter's values in would visibly desaturate the site. **Do not
reconcile jkrumm.com's accent to `buildPaletteCss()` output.** If anything moves,
it is basalt's vibrancy default, upstream — tracked as a follow-up in
`docs/basalt-ui-handover.md`.

The split is worth naming precisely, because it is not arbitrary: jkrumm.com took
the **emitter's** surfaces and ink (those are derive-guaranteed for contrast and
byte-identical below) and the **spec's** accent and status (those are the design
intent the emitter currently misses).

## Token map

Light / dark, as they appear in `src/styles/global.css`. `mix(x n%)` is shorthand
for `color-mix(in srgb, x n%, transparent)`.

| jkrumm token | light | dark | basalt `--vx-*` (emitted) | verdict |
|-|-|-|-|-|
| `--bg` | `#f2f2f5` | `#27272a` | `--vx-surface-bg` — identical | adopt-basalt-value |
| `--panel` | `#fafafd` | `#2b2b2e` | `--vx-surface-panel` — identical | adopt-basalt-value |
| `--panel-hover` | `mix(#262629 5%)` | `mix(#ffffff 7%)` | `--vx-surface-panelHover` `#ffffff` / `#38383b` | keep-jkrumm-value |
| `--divider` | `mix(#262629 12%)` | `mix(#ffffff 12%)` | `--vx-divider` `mix(#e5e5e5 65%)` / `mix(#ffffff 6%)` | rename-only (role), value retuned |
| `--ring` | `mix(#262629 10%)` | `mix(#ffffff 9%)` | `--vx-surface-hairline` `#eaeaee` / `#4e4e51` | rename-only (role), value re-expressed as alpha |
| `--ink` | `#262629` | `#e5e5e9` | `--vx-ink` — identical | adopt-basalt-value |
| `--ink-2` | `#404043` | `#dddde1` | `--vx-ink2` — identical | adopt-basalt-value |
| `--muted` | `#525255` | `#d4d4d8` | `--vx-muted` — identical | adopt-basalt-value |
| `--faint` | `#737376` | `#a1a1a4` | `--vx-faint` — identical | adopt-basalt-value |
| `--accent` | `#0084d1` | `#8ec5ff` | `--vx-accent` `#4374a6` / `#a2c3f0` (spec: `#0077bd` / `#8ec5ff`) | keep-jkrumm-value |
| `--accent-hover` | `#0069a8` | `#51a2ff` | `--vx-accentHover` `#3c6895` / `#65a2e3` (spec: = jkrumm) | keep-jkrumm-value |
| `--accent-glow` | `mix(--accent 16%)` | `mix(--accent 22%)` | no equivalent | keep-jkrumm-value |
| `--accent-fill` | `#0077bd` | `#0077bd` | `--vx-accentFill` `#4374a6` both (spec: = jkrumm) | keep-jkrumm-value, adopt-basalt-role |
| `--on-accent` | `#ffffff` | `#ffffff` | `--vx-onAccent` — identical | adopt-basalt-value |
| `--status-success` | `#2f7a4f` | `#56c07a` | `--vx-status-good` `#327a4d` / `#52c07c` (spec: = jkrumm) | keep-jkrumm-value |
| `--status-warning` | `#b5750f` | `#e0a83a` | `--vx-status-warn` `#b07808` / `#e6a53d` (spec: = jkrumm) | keep-jkrumm-value |
| `--status-error` | `#b53f3f` | `#e06c6c` | `--vx-status-bad` `#b5403d` / `#e06761` (spec: `#b53f3f` / `#e0685f`) | keep-jkrumm-value |

Depth and tints, ported as constructions rather than values:

| jkrumm token | light | dark | basalt |
|-|-|-|-|
| `--shadow-ring` | `0 0 0 1px var(--ring)` | `inset 0 0 0 1px var(--ring)` | no direct equivalent — extracted from `--vx-shadow-card`'s ring half |
| `--shadow-card` | `0 1px 2px rgb(28 25 23 / .05), 0 0 0 1px var(--ring)` | `0 1px 3px rgb(0 0 0 / .4), inset 0 0 0 1px var(--ring)` | `--vx-shadow-card` — structurally identical, incl. the outset→inset flip |
| `--tint-*` | `mix(--status-* 12%)` | inherited | basalt's `--vx-good`/`--vx-warn`/`--vx-bad` (18% / 8% / 18%) — same law, jkrumm uses one uniform 12% |

Not ported: basalt's `--vx-surface-border`, `--vx-surface-elevated`,
`--vx-surface-subtle`, `--vx-surface-overlay`, `--vx-surface-field`,
`--vx-shadow-ctrl`, `--vx-shadow-overlay`, the chart primitives
(`--vx-axis`/`--vx-grid`/`--vx-tooltip*`/`--vx-legendText`), the 12 categorical
fill families, and all 104 `--vx-space-*`. A static portfolio has no controls,
no overlays and no data layer.

## The three-role line split

**The single most valuable thing basalt taught this codebase.** basalt keeps three
line tokens rigidly separate by role, and their names are close enough to be a
trap:

| basalt token | role | jkrumm equivalent |
|-|-|-|
| `--vx-surface-border` | strong layout border between structural regions | none — the site is borderless |
| `--vx-divider` | soft rule *inside* a surface | `--divider` |
| `--vx-surface-hairline` | consumed **only** inside `--vx-shadow-card`'s baked ring; never referenced directly | `--ring` |

jkrumm.com's old single `--hairline` mapped to **`--vx-divider`**, not to the
name-lookalike `--vx-surface-hairline`. Porting the *name* instead of the *role*
is the classic silent mistake here: you get a hairline that is either invisible
(too light, because it was tuned to sit inside a shadow) or doubled (a `border`
plus the ring already baked into `--shadow-card`).

Current usage across `src/`: `--divider` draws the two chrome hairlines
(`SiteFooter` top edge, `RowList` row rule), the Writing year rule (as a
`background` on a 1px element), an inset rule in `Contact`, and three rules inside
`.prose` (`hr`, `td`, `.footnotes`) — reading surfaces, off the stage. `--ring` is
referenced **zero** times outside the two `--shadow-*` definitions in
`global.css`. That is the invariant: if `--ring` ever appears in a `border`
declaration, it is a bug.

## The elevation doctrine

**Depth is a whisper shadow with the 1px ring baked inside the shadow value,
never a bare `border` property.**

```css
--shadow-ring: 0 0 0 1px var(--ring);                                /* edge, no drop */
--shadow-card: 0 1px 2px rgb(28 25 23 / 0.05), 0 0 0 1px var(--ring); /* lifted */
```

Dark flips the ring to `inset` (a white mix reads as an inner edge on a dark
canvas; an outset white halo does not) — a different construction, which is why
the two schemes cannot share one expression.

This is what let jkrumm.com go **fully borderless** while keeping media tiles and
code blocks legible as objects. The reset enforces it: `*, *::before, *::after {
border: 0 solid }`, so a border needs an explicit width to exist at all. The stage
(homepage chrome) has a budget of **two** hairlines — the footer top edge and the
Writing year rule; a third there is a bug.

## The `--accent-fill` / `--on-accent` fix

Before the port, dark mode carried `--on-accent: #000`. That only existed because
filled elements were painted with `--accent` — the **ink** token — which inverts
to a pale `#8ec5ff` in dark, forcing a black label.

basalt bans that outright ("Never fill with the ink token"). The fill role is a
**separate colour at fixed relative luminance** (`FILL_LUMINANCE`, Y = 0.165),
identical in both schemes, always with a white label — because a fill is squeezed
from both sides at once: white text must clear a contrast floor against the fill,
*and* the fill must clear ≥3:1 against the page behind it. On a dark page those
two constraints leave one narrow window, so the fill holds still while the ink
accent inverts around it.

Result in `global.css`: `--accent-fill: #0077bd` and `--on-accent: #ffffff` are
declared once, in the light block only, and are deliberately **not** overridden
under `[data-theme='dark']`.

## The `alpha()` law

Opacity is always `color-mix`, never `rgba()`:

```css
--accent-glow: color-mix(in srgb, var(--accent) 16%, transparent);   /* correct */
--accent-glow: rgba(0, 132, 209, 0.16);                              /* wrong */
```

`rgba()` freezes a literal channel triple and breaks per-scheme resolution — the
glow stops following `--accent` across the theme switch. basalt exports this as
`alpha(token, a)` from `basalt-ui/tokens`; jkrumm.com writes the `color-mix`
inline. Every translucent token here (`--panel-hover`, `--divider`, `--ring`,
`--accent-glow`, `--tint-*`) follows it. The two literal `rgb(… / …)` drops inside
`--shadow-card` are the deliberate exception — those are shadow *shade*, not a
tinted token, and basalt writes them the same way.

`--accent-glow` itself has no basalt counterpart (basalt uses a plain
`outline-color: var(--vx-accent)` for focus), but its construction is basalt's
alpha law verbatim, so it was kept as-is.

## What would have to change in basalt-ui to switch

If all four land, jkrumm.com drops the hand-port and consumes
`dist/tokens.css` at build time instead. Full implementation brief:
`docs/basalt-ui-handover.md`.

| # | Change | Removes reason |
|-|-|-|
| 1 | `scheme` / `defaultScheme` / `mediaFallback` options on `buildPaletteCss`, emitting `:root[attr='value']` | 3 |
| 2 | `react`, `react-dom`, `@mantine/core`, `@mantine/hooks`, `@tanstack/react-query` marked optional in `peerDependenciesMeta` | 1 |
| 3 | A prebuilt `dist/tokens.css` + a `basalt-ui tokens:css` CLI subcommand | 1 (no install at all — `bunx`) |
| 4 | An `only: 'core' \| 'all'` emission filter dropping the 95 component one-offs | 2 |

Reason 4 (no framework-free accent retuning) is **not** on that list — jkrumm.com
does not need it, because it keeps the spec accent rather than deriving a new one.
It only becomes blocking if the drift is reconciled upstream and jkrumm.com wants
to track basalt's palette identity live.
