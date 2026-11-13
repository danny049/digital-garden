import type { APIRoute } from 'astro';
import { essayUrl, publicEssays } from '../lib/essays';
import { xml, xmlResponse } from '../lib/xml';

export const GET: APIRoute = async ({ site }) => {
  const paths = ['/', '/essays/', '/privacy/', ...(await publicEssays()).map(essayUrl)];
  const urls = paths.map((path) => `  <url><loc>${xml(new URL(path, site).href)}</loc></url>`);
  return xmlResponse(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`);
};
