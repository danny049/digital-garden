import TurndownService from 'turndown';
import sanitizeHtml from 'sanitize-html';

export const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function slugify(text) {
  return text.normalize('NFKD').replace(/\p{Mark}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.search = '';
    url.pathname = url.pathname.replace(/\/$/, '');
    return url.href;
  } catch {
    return '';
  }
}

export function imageFigure(src, alt, width, height) {
  const size = width && height ? ` width="${width}" height="${height}"` : '';
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt ?? '')}"${size} loading="lazy" decoding="async">`;
}

export function videoEmbed(source) {
  let url;
  try { url = new URL(source); } catch { return undefined; }
  if (url.protocol !== 'https:') return undefined;
  const host = url.hostname.replace(/^(www|m)\./, '');
  let embed;
  let provider;
  let vertical = false;
  if (['youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)) {
    const id = url.searchParams.get('v') ?? url.pathname.split('/').at(-1);
    if (/^[\w-]{11}$/.test(id)) {
      provider = 'YouTube';
      embed = `https://www.youtube-nocookie.com/embed/${id}`;
      vertical = url.pathname.startsWith('/shorts/');
      source = `https://www.youtube.com/watch?v=${id}`;
    }
  }
  if (host === 'tiktok.com') {
    const id = url.pathname.match(/\/(?:video|player\/v1|embed\/v2)\/(\d+)/)?.[1];
    if (id) {
      provider = 'TikTok';
      embed = `https://www.tiktok.com/player/v1/${id}`;
      vertical = true;
      source = url.pathname.includes('/video/') ? `https://www.tiktok.com${url.pathname}` : `https://www.tiktok.com/@/video/${id}`;
    }
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.split('/').at(-1);
    if (/^\d+$/.test(id)) {
      provider = 'Vimeo';
      embed = `https://player.vimeo.com/video/${id}`;
      source = `https://vimeo.com/${id}`;
    }
  }
  if (!embed) return undefined;
  if (provider === 'TikTok') {
    return `<figure class="tiktok-video"><iframe src="${embed}?autoplay=0" title="TikTok video example" width="340" height="604" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture" allowfullscreen></iframe><figcaption><a href="${escapeHtml(source)}">Open on TikTok ↗</a></figcaption></figure>`;
  }
  const aspect = vertical ? ' data-vertical' : '';
  return `<details class="video" data-video="${embed}" data-title="${provider} video example"${aspect}><summary>Play on ${provider}</summary><div class="video-player"></div><a href="${escapeHtml(source)}">Open on ${provider} ↗</a></details>`;
}

const turndown = new TurndownService({
  headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*',
});
turndown.keep(['u', 's', 'mark', 'sub', 'sup', 'table']);
turndown.addRule('anchoredHeading', {
  filter: (node) => /^H[2-6]$/.test(node.nodeName) && Boolean(node.getAttribute('id')),
  replacement: (_, node) => `\n\n${node.outerHTML}\n\n`,
});
turndown.addRule('responsiveMedia', {
  filter: ['figure', 'img', 'details'],
  replacement: (_, node) => `\n\n${node.outerHTML}\n\n`,
});

export function toMarkdown(raw, { sourceUrl, image, mediaReview = [] } = {}) {
  let mediaIndex = 0;
  const embedMarkers = new Map();
  const html = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'figure', 'figcaption', 'mark', 'u', 's', 'sub', 'sup', 'details', 'summary',
    ]),
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
      'h2': ['id'], 'h3': ['id'], 'h4': ['id'], 'h5': ['id'], 'h6': ['id'],
      ol: ['start'],
      details: ['class', 'data-video', 'data-title', 'data-vertical'],
      div: ['class'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowProtocolRelative: false,
    nonTextTags: ['script', 'style', 'textarea', 'option', 'button', 'svg', 'form'],
    transformTags: {
      a: (tagName, attribs) => {
        if (attribs.href && sourceUrl && !attribs.href.startsWith('#') && !attribs.href.startsWith('mailto:')) {
          attribs.href = URL.parse(attribs.href, sourceUrl)?.href;
        }
        return { tagName, attribs };
      },
      img: (tagName, attribs) => {
        if (attribs.src && sourceUrl) attribs.src = URL.parse(attribs.src, sourceUrl)?.href;
        const replacement = image?.(attribs);
        if (replacement) return replacement;
        return { tagName, attribs: { ...attribs, loading: 'lazy', decoding: 'async' } };
      },
      iframe: (_, { src }) => {
        const marker = `DANNYEMBEDPLACEHOLDER${mediaIndex++}END`;
        const embed = videoEmbed(src);
        if (embed) embedMarkers.set(marker, embed);
        else if (/^https?:\/\//.test(src ?? '')) {
          mediaReview.push({ url: src, note: 'Unsupported embed provider. The original media is linked.' });
          embedMarkers.set(marker, `[Open the original media](<${src}>)`);
        } else {
          mediaReview.push({ note: 'An embedded item had no public media URL.' });
          embedMarkers.set(marker, '');
        }
        return { tagName: 'p', text: marker };
      },
    },
    exclusiveFilter: ({ tag, attribs, text, mediaChildren }) => {
      if (tag !== 'a') return false;
      const link = URL.parse(attribs.href ?? '', sourceUrl);
      if (link?.origin === 'https://dannyhayder.substack.com' && link.pathname === '/subscribe' && /^(subscribe|subscribe now)$/i.test(text.trim())) return true;
      return !attribs.href || (!text.trim() && !mediaChildren.length) ? 'excludeTag' : false;
    },
  });
  let markdown = turndown.turndown(html).trim();
  for (const [marker, embed] of embedMarkers) markdown = markdown.replace(marker, embed);
  return markdown;
}

export function frontmatter(data) {
  // JSON values are also valid YAML values. This keeps source records and punctuation intact.
  return `---\n${Object.entries(data).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n`;
}

export function textFingerprint(text) {
  const words = text.replace(/<details[\s\S]*?<\/details>|<figure class="tiktok-video">[\s\S]*?<\/figure>|<[^>]*>|!?\[([^\]]*)\]\([^)]+\)/g, '$1')
    .toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return new Set(words.slice(0, -3).map((_, index) => words.slice(index, index + 4).join(' ')));
}

export function similarity(a, b) {
  if (!a.size || !b.size) return 0;
  const shared = [...a].filter((shingle) => b.has(shingle)).length;
  return shared / (a.size + b.size - shared);
}
