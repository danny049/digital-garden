import type { APIRoute } from 'astro';
import settings from '../data/site.json';
import { essayUrl, publicEssays } from '../lib/essays';
import { xml, xmlResponse } from '../lib/xml';

export const GET: APIRoute = async ({ site }) => {
  const essays = (await publicEssays()).sort((a, b) => (b.data.date ?? '').localeCompare(a.data.date ?? ''));
  const items = essays.map((essay) => {
    const url = xml(new URL(essayUrl(essay), site).href);
    const { title, description, date } = essay.data;
    return `<item><title>${xml(title)}</title><link>${url}</link><guid>${url}</guid><description>${xml(description)}</description><dc:creator>${xml(settings.name)}</dc:creator>${date ? `<pubDate>${new Date(date).toUTCString()}</pubDate>` : ''}</item>`;
  });
  return xmlResponse(`<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>
<title>${xml(settings.name)}</title><link>${xml(site!.href)}</link><description>${xml(settings.description)}</description><language>en-GB</language>
<atom:link href="${xml(new URL('/rss.xml', site).href)}" rel="self" type="application/rss+xml"/>
${items.join('\n')}
</channel></rss>`, 'application/rss+xml');
};
