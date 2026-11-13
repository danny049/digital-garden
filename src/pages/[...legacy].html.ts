import type { APIRoute } from 'astro';
import { legacyPaths } from '../lib/legacy';
import { xml } from '../lib/xml';

export const getStaticPaths = legacyPaths;

export const GET: APIRoute = ({ props, site }) => {
  const destination = xml(props.destination);
  const canonical = xml(new URL(props.destination, site).href);
  return new Response(`<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <title>${xml(props.title)}</title>
  <link rel="canonical" href="${canonical}">
  <noscript><meta http-equiv="refresh" content="0;url=${destination}"></noscript>
</head>
<body>
  <p>This essay moved to <a id="essay-location" href="${destination}">${xml(props.title)}</a>.</p>
  <script>location.replace(document.querySelector('#essay-location').href + location.hash)</script>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
