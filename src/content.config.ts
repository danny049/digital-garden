import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const essays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essays' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    dek: z.string().optional(),
    date: z.iso.date().optional(),
    category: z.string(),
    pinned: z.boolean().default(false),
    order: z.number().default(100),
    hidden: z.boolean().default(false),
    sources: z.array(z.object({
      name: z.enum(['Creative Examples', 'Quartz', 'Substack', 'Notion PDF']),
      url: z.url().optional(),
      file: z.string().optional(),
      id: z.string().optional(),
      date: z.iso.date().optional(),
      status: z.enum(['imported', 'duplicate']).default('imported'),
    })).default([]),
    mediaReview: z.array(z.object({
      url: z.url().optional(),
      note: z.string(),
    })).default([]),
    legacyPaths: z.array(z.string()).default([]),
  }),
});

export const collections = { essays };
