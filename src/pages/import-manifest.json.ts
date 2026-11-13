import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { essayUrl } from '../lib/essays';

export const GET: APIRoute = async () => {
  const essays = await getCollection('essays', ({ data }) => !data.hidden && data.sources.length > 0);
  const records = essays.sort((a, b) => a.id.localeCompare(b.id)).map((essay) => ({
    title: essay.data.title,
    sourceUrl: essay.data.sources.find(({ status }) => status === 'imported')?.url ?? null,
    sources: essay.data.sources,
    localUrl: essayUrl(essay),
    date: essay.data.date ?? null,
    category: essay.data.category,
    status: 'imported',
    mediaRequiresManualAttention: essay.data.mediaReview.length > 0,
    mediaReview: essay.data.mediaReview,
    legacyPaths: essay.data.legacyPaths,
  }));
  return new Response(JSON.stringify({ articles: records }, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
