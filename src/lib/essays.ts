import { getCollection, type CollectionEntry } from 'astro:content';
import site from '../data/site.json';

export type Essay = CollectionEntry<'essays'>;

export function essayUrl(essay: Essay) {
  return `/essays/${essay.id}/`;
}

export function dateLabel(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(date));
}

export async function publicEssays() {
  const essays = await getCollection('essays', ({ data }) => !data.hidden);
  for (const { id, data } of essays) {
    if (!site.categories.some(({ id: category }) => category === data.category)) {
      throw new Error(`Essay "${id}" has an unknown category: ${data.category}`);
    }
  }
  return essays.sort((a, b) =>
    Number(b.data.pinned) - Number(a.data.pinned) ||
    a.data.order - b.data.order ||
    (b.data.date ?? '').localeCompare(a.data.date ?? '') ||
    a.data.title.localeCompare(b.data.title),
  );
}
