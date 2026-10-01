/**
 * Refreshes the committed Activity section snapshots:
 *  - `src/data/github-activity.json` — the fallback `Activity.astro` renders
 *    when the live GitHub contribution fetch at build time fails.
 *  - `src/data/token-activity.json` — the AI token-consumption snapshot the
 *    "Tokens" view always reads (the site build never calls the Argo API
 *    directly — it needs a secret).
 *
 *   ARGO_TOKEN=<argo-api-secret> bun run activity
 *
 * Without ARGO_TOKEN set, the GitHub refresh still runs; the token snapshot
 * refresh is skipped with a warning and the committed file is left untouched.
 */
import { writeFileSync } from 'node:fs';
import { fetchGithubActivity } from '../src/utils/github-activity';
import { fetchTokenActivity } from '../src/utils/token-activity';

const HANDLE = 'jkrumm';
const GITHUB_OUT_PATH = new URL('../src/data/github-activity.json', import.meta.url);
const TOKEN_OUT_PATH = new URL('../src/data/token-activity.json', import.meta.url);

const githubData = await fetchGithubActivity(HANDLE);
writeFileSync(GITHUB_OUT_PATH, `${JSON.stringify(githubData, null, 2)}\n`);
console.log(
  `Wrote ${githubData.days.length} days, ${githubData.total} contributions → ${GITHUB_OUT_PATH.pathname}`,
);

const argoToken = process.env.ARGO_TOKEN;
if (!argoToken) {
  console.warn(
    '[activity] ARGO_TOKEN not set — skipping token snapshot refresh, keeping the committed one.',
  );
} else {
  const tokenData = await fetchTokenActivity(argoToken);
  const total = tokenData.days.reduce((sum, day) => sum + day.tokens, 0);
  writeFileSync(TOKEN_OUT_PATH, `${JSON.stringify(tokenData, null, 2)}\n`);
  console.log(`Wrote ${tokenData.days.length} days, ${total} tokens → ${TOKEN_OUT_PATH.pathname}`);
}
