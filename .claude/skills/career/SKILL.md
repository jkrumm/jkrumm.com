---
name: career
description: Maintain Johannes Krumm's professional profile from one source — the one-page résumé PDF, the /resume page, the homepage Experience/Projects sections and LinkedIn copy — and tailor a résumé to a specific job. Use when the user mentions résumé, resume, CV, Lebenslauf, LinkedIn profile, "apply to", a job posting, positioning, or asks to update experience, projects or skills anywhere public.
---

# Career — one fact base, many renderings

## Where things live

| What | Where | Public? |
|-|-|-|
| Facts: identity, pillars, principles ("how I work"), roles + highlights, projects (+ web hover `details`/`image`), skills, education, `outside`, LinkedIn headline/about | `src/data/career/facts.ts` | **yes** (repo is public) |
| Generic renderings (`default`, `architect`, `agentic`) | `src/data/career/targets.ts` | yes |
| Selection + formatting (pure) | `src/data/career/resolve.ts` | yes |
| Print sheet (A4, Source Serif 4) | `src/components/resume/ResumeSheet.astro` via `src/pages/resume/print/[target].astro` | built only with `RESUME_PRINT=1` |
| Web résumé | `src/pages/resume/index.astro` (target `default`, channel `web`) — reuses the homepage's `Experience`/`Projects`/`Skills` sections via props, not a fork | yes |
| Homepage Experience | `src/data/experience.ts` — derived from `roles`/`education`, do not hand-edit dates there | yes |
| Committed default PDF | `public/johannes-krumm-resume.pdf` | yes |
| Job-specific targets | `.career/targets/<company>.ts` (gitignored), `export const target: Target` | **no** |
| Other renders + LinkedIn copy | `out/` (gitignored) | no |
| Long-form dossier: evidence, numbers, voice, what not to publish | brain `wiki/career/` (see below) | **no** |

The dossier in the brain is the context behind every line in `facts.ts` —
read it before writing new copy, and add new evidence there first.

## Commands

```bash
bun run resume              # all targets → public/ (default) + out/resume/*.pdf|png; fails if a sheet overflows one page
bun run resume default      # one target
SKIP_BUILD=1 bun run resume # reuse the last RESUME_PRINT build
bun run linkedin            # → out/linkedin.md, fails if a field exceeds LinkedIn's limit
bun run build               # must stay 0 errors/warnings
```

Always look at `out/resume/<id>.png` after a render (Read the image) — the
slack number says it fits, only the image says it looks right. After changing
anything the `default` target shows, re-run `bun run resume default` and commit
the regenerated PDF with the data change.

## Voice per channel

Every string is a `Copy { cv, web?, linkedin? }`; `cv` is the fallback.

- **cv** — résumé grammar: no "I", starts with a noun or verb, one line where
  possible, a number where there is one. Bold lead-in (`lead`) carries the scan.
  Concrete nouns over adjectives: "transactional outbox", not "robust messaging".
- **web** — first person, same facts, a little warmer. Still short.
- **linkedin** — first person, plain text only (no markdown), may run longer,
  searchable keywords spelled out once.

Positioning, in force order: **tech lead** (one of five teams on IU's
in-house student ERP; technical owner of three domains and five services;
leads, builds, teaches, challenges) → **software architecture** (DDD, event-driven, long maintenance
tail) → **agentic engineering** (a core pillar, not a footnote: builds and runs
his own agent factory daily). Never "passionate", "rockstar", "ninja", "10x".
Load `~/SourceRoot/brain/voice.md` before writing copy. Phrases the owner
rejected as slop or wrong: "regulation to code", "the Kafka event that
carries it", "deep domain foundation", "a tech lead in Munich", "the
enrolment domain" (it is three domains), naming SquareTrade's parent.

## Tailoring to a job

1. Read the posting; list its 5–8 real requirements in its own words.
2. Create `.career/targets/<company>.ts`:
   ```ts
   import type { Target } from '../../src/data/career/types';
   export const target: Target = {
     id: 'acme', label: 'Acme — Staff Engineer',
     headline: '…', summary: { cv: '…' },
     focus: [/* tags in the posting's priority order */],
     bullets: { iu: 8, squaretrade: 2 }, projects: 3,
     skills: ['architecture', 'backend', 'platform', 'agentic'],
     overrides: { 'iu-kafka': { cv: '… their vocabulary …' } },
     contact: { email: '…', phone: '…' },   // private renders only
   };
   ```
3. Only rephrase through `overrides` — never invent a fact the fact base does
   not hold. A new true fact goes into `facts.ts` (and the dossier) first.
4. `bun run resume acme` → `out/resume/acme.pdf`. Check the PNG.
5. Archive the target file and the PDF in the brain under the application note.

## Privacy (the repo is public)

- `hello@jkrumm.com` is the public address and renders everywhere. Never
  commit a phone, street address, date of birth or any other email — only
  `contact` in a gitignored target may carry them.
- IU: describe responsibilities, patterns and scale; no internal hostnames,
  service URLs, colleague names, student data or unreleased business details.
- Private repos stay unnamed unless the dossier marks them publishable.
