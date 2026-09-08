import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const guide = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guide' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    status: z.enum(['draft', 'published']),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    pinned: z.boolean().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['draft', 'published']),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
    pinned: z.boolean().optional(),
  }),
});

export const collections = { guide, blog };
