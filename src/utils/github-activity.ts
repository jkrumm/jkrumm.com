/**
 * GitHub contribution heatmap data, fetched at build time from the
 * undocumented `/users/<handle>/contributions` HTML fragment (public, no
 * token). Parsed with linkedom, never regex — see `scripts/activity.ts` for
 * the refresh entrypoint that writes the committed fallback snapshot.
 *
 * The endpoint's markup (inspected 2026-09): a heading
 * `#js-contribution-activity-description` carrying the "N contributions in
 * the last year" total, and a `table.ContributionCalendar-grid` of
 * `td.ContributionCalendar-day[data-date][data-level]` cells (level 0–4).
 * Per-day tooltip elements (`tool-tip[for=...]`) do carry exact counts, but
 * the shape below only needs `level` — extracting them would be unused
 * complexity.
 */
import { parseHTML } from 'linkedom';

export interface ActivityDay {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityData {
  total: number;
  days: ActivityDay[];
  fetchedAt: string;
}

const CONTRIBUTIONS_URL = (handle: string) => `https://github.com/users/${handle}/contributions`;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MIN_DAYS = 350;
const MAX_DAYS = 380;

function isLevel(value: number): value is ActivityDay['level'] {
  return value >= 0 && value <= 4 && Number.isInteger(value);
}

/**
 * Fetch and parse the live contribution graph. Throws on any structural
 * surprise — the caller decides the fallback, this function never guesses.
 */
export async function fetchGithubActivity(handle: string): Promise<ActivityData> {
  const response = await fetch(CONTRIBUTIONS_URL(handle), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; jkrumm.com build)' },
  });
  if (!response.ok) {
    throw new Error(`GitHub contributions fetch failed: ${response.status}`);
  }
  const html = await response.text();
  const { document } = parseHTML(html);

  const grid = document.querySelector('table.ContributionCalendar-grid');
  if (!grid) {
    throw new Error('GitHub contributions: no ContributionCalendar-grid table found');
  }

  const heading = document.querySelector('#js-contribution-activity-description');
  const totalMatch = heading?.textContent?.match(/[\d,]+/);
  if (!totalMatch) {
    throw new Error('GitHub contributions: could not read the total from the heading');
  }
  const total = Number.parseInt(totalMatch[0].replace(/,/g, ''), 10);
  if (!Number.isFinite(total)) {
    throw new Error('GitHub contributions: total did not parse to a number');
  }

  const cells = [...grid.querySelectorAll('td.ContributionCalendar-day[data-date]')];
  const days: ActivityDay[] = cells.map((cell) => {
    const date = cell.getAttribute('data-date') ?? '';
    const level = Number.parseInt(cell.getAttribute('data-level') ?? '', 10);
    if (!ISO_DATE.test(date) || !isLevel(level)) {
      throw new Error(`GitHub contributions: malformed cell (date=${date}, level=${level})`);
    }
    return { date, level };
  });

  if (days.length < MIN_DAYS || days.length > MAX_DAYS) {
    throw new Error(`GitHub contributions: expected ~365 days, got ${days.length}`);
  }

  days.sort((a, b) => a.date.localeCompare(b.date));

  return { total, days, fetchedAt: new Date().toISOString() };
}

/**
 * Build-time entrypoint: try the live fetch, fall back to the committed
 * snapshot (`src/data/github-activity.json`) on any failure — network flake,
 * a markup change, or a rate limit must never fail the build.
 */
export async function getGithubActivity(
  handle: string,
  fallback: ActivityData,
): Promise<ActivityData> {
  try {
    return await fetchGithubActivity(handle);
  } catch (error) {
    console.warn(
      `[github-activity] live fetch failed, using committed snapshot: ${(error as Error).message}`,
    );
    return fallback;
  }
}
