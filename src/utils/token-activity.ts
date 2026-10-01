/**
 * AI token consumption data for the Activity section's "Tokens" view —
 * sourced from the Argo API's daily timeseries (`/api/usage/timeseries`,
 * `metric=tokens`, `groupBy=model_norm`). Unlike `github-activity.ts`, this
 * is a **build-script-only** fetch: it requires `ARGO_TOKEN` (a bearer
 * secret), so the site build never calls it — `scripts/activity.ts` refreshes
 * the committed snapshot (`src/data/token-activity.json`) and
 * `Activity.astro` reads that snapshot directly.
 *
 * `tokens` per day = input + output + cache writes + reasoning, deliberately
 * WITHOUT cache reads (they re-count the same context on every turn) — that
 * definition lives with the data, shown to readers as "excludes cache reads".
 *
 * `model_norm` keys (inspected 2026-09, e.g. `claude-sonnet-5`,
 * `deepseek-v4-pro`, `gpt-6-astra`, but also `kimi-k2.6`, `glm-5.3-flash`,
 * `gemini-3.5-flash`, `hermes`, `sonar`, …) collapse into four coarse
 * families for the UI — everything not Claude/DeepSeek/OpenAI is `other`.
 */

export type TokenFamily = 'claude' | 'deepseek' | 'openai' | 'other';

export const FAMILY_LABEL: Record<TokenFamily, string> = {
  claude: 'Claude',
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  other: 'Other',
};

export const FAMILY_ORDER: TokenFamily[] = ['claude', 'deepseek', 'openai', 'other'];

function familyForModel(modelKey: string): TokenFamily {
  const key = modelKey.toLowerCase();
  if (key.startsWith('claude')) return 'claude';
  if (key.startsWith('deepseek')) return 'deepseek';
  if (key.startsWith('gpt') || /^o\d/.test(key)) return 'openai';
  return 'other';
}

export interface TokenActivityDay {
  date: string;
  tokens: number;
  families: Partial<Record<TokenFamily, number>>;
}

export interface TokenActivityData {
  generatedAt: string;
  /** First day the Argo timeseries has data for (the Argo floor, ~2026-05-28). */
  since: string;
  days: TokenActivityDay[];
}

const TIMESERIES_URL =
  'https://argo.jkrumm.com/api/usage/timeseries?range=all&grain=day&metric=tokens&groupBy=model_norm';

interface ArgoBucket {
  bucket: string;
  groups: Record<string, number>;
}

interface ArgoTimeseriesResponse {
  buckets: ArgoBucket[];
  groupKeys: string[];
}

/**
 * Fetch and parse the Argo token timeseries. Throws on any structural
 * surprise or missing/invalid token — the caller (the refresh script) decides
 * what to do, this function never guesses or falls back.
 */
export async function fetchTokenActivity(token: string): Promise<TokenActivityData> {
  const response = await fetch(TIMESERIES_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Argo token timeseries fetch failed: ${response.status}`);
  }
  const data = (await response.json()) as ArgoTimeseriesResponse;
  if (!Array.isArray(data.buckets) || data.buckets.length === 0) {
    throw new Error('Argo token timeseries: no buckets in response');
  }

  const days: TokenActivityDay[] = data.buckets
    .map((bucket) => {
      const families: Partial<Record<TokenFamily, number>> = {};
      let tokens = 0;
      for (const [model, value] of Object.entries(bucket.groups)) {
        tokens += value;
        if (value <= 0) continue;
        const family = familyForModel(model);
        families[family] = (families[family] ?? 0) + value;
      }
      return { date: bucket.bucket, tokens, families };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    generatedAt: new Date().toISOString(),
    since: days[0].date,
    days,
  };
}
