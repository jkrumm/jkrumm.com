/**
 * Turns the fact base + a target into exactly what one channel renders.
 *
 * Selection is deterministic: a highlight scores by (rank, best focus index),
 * the top N per role survive, and survivors are re-sorted into their SOURCE
 * order — the order in `facts.ts` is the narrative order, the score only
 * decides what gets cut.
 */
import { education, identity, outside, pillars, principles, projects, roles, skills } from './facts';
import { targets } from './targets';
import type { Channel, Copy, Highlight, Project, Tag, Target } from './types';

export function pick(copy: Copy, channel: Channel): string {
  return copy[channel] ?? copy.cv;
}

/** Rank dominates: any rank-1 item beats any rank-2 item, whatever its tags. */
const RANK_WEIGHT = 100;

function focusScore(tags: Tag[], focus: Tag[]): number {
  const hits = tags.map((tag) => focus.indexOf(tag)).filter((i) => i >= 0);
  return hits.length ? Math.min(...hits) : focus.length;
}

function select<T extends { id: string; tags: Tag[]; rank: number }>(
  items: T[],
  count: number,
  focus: Tag[],
): T[] {
  const scored = items
    .map((item, order) => ({ item, order, score: item.rank * RANK_WEIGHT + focusScore(item.tags, focus) }))
    .sort((a, b) => a.score - b.score || a.order - b.order)
    .slice(0, count);
  return scored.sort((a, b) => a.order - b.order).map(({ item }) => item);
}

function withOverride<T extends Highlight | Project>(item: T, target: Target): T {
  const override = target.overrides?.[item.id];
  return override ? { ...item, text: { ...item.text, ...override } } : item;
}

export function getTarget(id: string): Target {
  const target = targets.find((t) => t.id === id);
  if (!target) throw new Error(`Unknown résumé target "${id}"`);
  return target;
}

export function resolveResume(target: Target) {
  // A typo in a hand-written target must fail the build, not silently drop a
  // section — the one-page check would happily pass a résumé missing half.
  const unknownRoles = Object.keys(target.bullets).filter((id) => !roles.some((r) => r.id === id));
  const unknownSkills = target.skills.filter((id) => !skills.some((g) => g.id === id));
  if (unknownRoles.length || unknownSkills.length) {
    throw new Error(
      `Target "${target.id}": unknown role ids [${unknownRoles.join(', ')}], skill ids [${unknownSkills.join(', ')}]`,
    );
  }

  return {
    target,
    identity,
    pillars,
    principles,
    roles: roles.map((role) => ({
      ...role,
      highlights: select(role.highlights, target.bullets[role.id] ?? 0, target.focus).map((h) =>
        withOverride(h, target),
      ),
    })),
    projects: select(projects, target.projects, target.focus).map((p) => withOverride(p, target)),
    skills: target.skills.map((id) => skills.find((group) => group.id === id)!),
    education,
    outside,
  };
}

export type Resume = ReturnType<typeof resolveResume>;

/** `2019-04` → `04/2019`; `2019` → `2019`. */
export function formatMonth(value: string): string {
  const [year, month] = value.split('-');
  return month ? `${month}/${year}` : year;
}

/**
 * `2021-04`, undefined → `2021 – today`; `2018-10`, `2020-07` → `2018 – 2020`.
 * Full years on both ends — a clipped `– 20` next to a full start year reads
 * as a typo.
 */
export function formatSpan({ start, end }: { start: string; end?: string }): string {
  const from = start.slice(0, 4);
  if (!end) return `${from} – today`;
  const to = end.slice(0, 4);
  return from === to ? from : `${from} – ${to}`;
}
