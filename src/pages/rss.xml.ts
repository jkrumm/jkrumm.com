import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '@/consts';

export async function GET(context: APIContext) {
  const [blog, guide] = await Promise.all([getCollection('blog'), getCollection('guide')]);

  const entries = [
    ...blog.map((entry) => ({ entry, href: `/blog/${entry.id}` })),
    ...guide.map((entry) => ({ entry, href: `/guide/${entry.id}` })),
  ]
    .filter(({ entry }) => entry.data.status === 'published')
    .sort((a, b) => b.entry.data.publishedDate.valueOf() - a.entry.data.publishedDate.valueOf());

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    // Matches astro.config.mjs's trailingSlash: 'never' — item links must not
    // gain a trailing slash the site itself never serves.
    trailingSlash: false,
    items: entries.map(({ entry, href }) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedDate,
      link: href,
      categories: entry.data.tags,
    })),
  });
}
