/**
 * Shared component map passed to `<Content components={components} />` on
 * every guide/blog article page. Element-name keys override the markdown
 * output for that tag; PascalCase keys are usable as bare JSX tags in MDX
 * with no per-file import. Never map `pre`/`code` (would intercept
 * Expressive Code's fenced code blocks) or `img` (Figure is the image path).
 */
import Callout from './Callout.astro';
import Chart from './Chart.astro';
import Figure from './Figure.astro';
import Kbd from './Kbd.astro';
import PullQuote from './PullQuote.astro';
import Steps from './Steps.astro';
import Table from './Table.astro';

export const components = {
  table: Table,
  kbd: Kbd,
  Callout,
  Chart,
  Figure,
  PullQuote,
  Steps,
  Kbd,
};
