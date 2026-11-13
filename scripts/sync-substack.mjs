import { copyFile, link, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { parse as parseYaml } from 'yaml';
import { frontmatter, normalizeUrl, similarity, slugify, textFingerprint, toMarkdown } from './content-utils.mjs';

const config = JSON.parse(await readFile(new URL('../src/data/site.json', import.meta.url), 'utf8'));
const essaysDir = fileURLToPath(new URL('../src/content/essays/', import.meta.url));
const flags = process.argv.slice(2);
const fromIndex = flags.indexOf('--from');
const feedFile = fromIndex >= 0 ? flags[fromIndex + 1] : undefined;
const dryRun = flags.includes('--dry-run');
const publication = new URL(config.newsletter.publication);
const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  processEntities: { maxEntitySize: 1000, maxTotalExpansions: 1000 },
});

try {
  if (fromIndex >= 0 && (!feedFile || feedFile.startsWith('--'))) throw new Error('--from requires an RSS file');
  const xml = feedFile
    ? await readFile(feedFile, 'utf8')
    : await fetch(config.newsletter.feedUrl, { signal: AbortSignal.timeout(20_000) }).then(async (response) => {
      if (!response.ok) throw new Error(`RSS returned HTTP ${response.status}`);
      return response.text();
    });
  if (xml.length > 15_000_000 || /<!DOCTYPE|<!ENTITY/i.test(xml)) {
    throw new Error('Unexpected XML format or feed size');
  }
  const channel = parser.parse(xml)?.rss?.channel;
  if (!channel || normalizeUrl(channel.link) !== normalizeUrl(publication.href)) {
    throw new Error('RSS channel does not match the configured publication');
  }
  const items = [channel.item ?? []].flat();
  const existing = await Promise.all((await readdir(essaysDir, { recursive: true })).filter((name) => name.endsWith('.md')).map(async (name) => {
    const contents = await readFile(join(essaysDir, name), 'utf8');
    const [, header = '', body = ''] = contents.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/) ?? [];
    const sources = parseYaml(header)?.sources ?? [];
    if (!Array.isArray(sources)) throw new Error(`Expected an array of sources in ${name}`);
    return { name, sources, fingerprint: textFingerprint(body) };
  }));
  let added = 0;
  let unresolved = 0;
  for (const item of items) {
    const url = normalizeUrl(item.link);
    if (!url || new URL(url).origin !== publication.origin || !/^\/p\/[a-z\d-]+$/.test(new URL(url).pathname)) continue;
    if (String(item['dc:creator'] ?? '').trim() !== config.name) continue;
    const id = typeof item.guid === 'string' ? item.guid : item.guid?.['#text'] ?? url;
    if (existing.some(({ sources }) => sources.some((source) => source.id === id || normalizeUrl(source.url) === url))) continue;
    const html = item['content:encoded'];
    const date = new Date(item.pubDate);
    if (!item.title || typeof html !== 'string' || !html.trim() || Number.isNaN(+date)) {
      console.warn(`Needs review (missing full content or date): ${url}`);
      unresolved += 1;
      continue;
    }
    if (/class="[^"]*(?:paywall|paid-content)|continue reading with a paid subscription/i.test(html)) {
      console.warn(`Needs review (restricted content): ${url}`);
      unresolved += 1;
      continue;
    }
    const mediaReview = [];
    const markdown = toMarkdown(html.replace(/<div class="subscription-widget-wrap[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/gi, ''), {
      sourceUrl: url,
      mediaReview,
      image: (attributes) => {
        const src = attributes.src;
        // Images render in place from Substack's CDN. The note is a reminder to add a local copy.
        if (src) mediaReview.push({ url: src, note: 'New RSS image, shown from Substack’s CDN. Add a local copy in public/images/essays/ to keep it permanent.' });
        return undefined;
      },
    });
    if (!markdown.trim()) {
      console.warn(`Needs review (empty body after conversion): ${url}`);
      unresolved += 1;
      continue;
    }
    const fingerprint = textFingerprint(markdown);
    const name = `${slugify(new URL(url).pathname.split('/').at(-1))}.md`;
    if (existing.some((essay) => essay.name === name || similarity(fingerprint, essay.fingerprint) >= 0.65)) {
      console.warn(`Needs review (possible duplicate; existing Markdown was preserved): ${url}`);
      unresolved += 1;
      continue;
    }
    const day = date.toISOString().slice(0, 10);
    const description = sanitizeText(item.description) || `An essay by ${config.name}.`;
    const data = {
      title: item.title, description, ...(item.description && { dek: description }), date: day, category: 'business',
      sources: [{ name: 'Substack', id, url, date: day, status: 'imported' }],
      mediaReview,
    };
    if (!dryRun) {
      const temporary = join(essaysDir, `.${randomUUID()}.tmp`);
      await writeFile(temporary, frontmatter(data) + markdown + '\n', { flag: 'wx' });
      try {
        // A hard link publishes the complete file atomically and fails if a concurrent sync won.
        const destination = join(essaysDir, name);
        try {
          await link(temporary, destination);
        } catch (error) {
          if (!['EPERM', 'ENOTSUP', 'EXDEV'].includes(error.code)) throw error;
          // Some Windows filesystems or permission profiles disable hard links.
          await copyFile(temporary, destination, constants.COPYFILE_EXCL);
        }
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        console.warn(`Preserved an essay created during this sync: ${name}`);
        continue;
      } finally {
        await unlink(temporary);
      }
    }
    existing.push({ name, sources: data.sources, fingerprint });
    console.log(`${dryRun ? 'Would import' : 'Imported'} ${name}`);
    added += 1;
  }
  console.log(`${items.length} feed items checked, ${added} ${dryRun ? 'ready to import' : 'added'}, ${unresolved} to review. Existing essays retained.`);
} catch (error) {
  console.error(`Substack sync: ${error.message}. The static build can still use local essays.`);
  process.exitCode = 1;
}

function sanitizeText(text) {
  return typeof text === 'string' ? text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 240) : '';
}
