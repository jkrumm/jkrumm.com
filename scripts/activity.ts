/**
 * Refreshes the committed GitHub contribution snapshot
 * (`src/data/github-activity.json`) — the fallback `Activity.astro` renders
 * when the live fetch at build time fails.
 *
 *   bun run activity
 */
import { writeFileSync } from 'node:fs';
import { fetchGithubActivity } from '../src/utils/github-activity';

const HANDLE = 'jkrumm';
const OUT_PATH = new URL('../src/data/github-activity.json', import.meta.url);

const data = await fetchGithubActivity(HANDLE);
writeFileSync(OUT_PATH, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Wrote ${data.days.length} days, ${data.total} contributions → ${OUT_PATH.pathname}`);
