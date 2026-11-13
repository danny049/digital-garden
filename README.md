# Danny Hayder’s website

An Astro site with plain Markdown essays, a static build, and a small email signup form.

## Run locally

Use Node.js 24.22 or later and pnpm 11.25.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm preview
```

Open [the development site](http://127.0.0.1:4321/). The production build is written to `dist/`.

## Edit the homepage

Edit [site.json](src/data/site.json) for the headline, subtitle, optional `intro` and `now` lines, newsletter invitation, social links, and essay categories. Edit [games.json](src/data/games.json) to change the games or age ranges. Its entries record the original cover sources. The site uses local 240 × 320 WebP thumbnails from `public/images/games/`.

## Write and curate

Add a Markdown file in `src/content/essays/`. Its filename is its URL. Edit the existing file to update an essay. If a URL needs to change, add the previous path to `legacyPaths`.

```markdown
---
title: "An essay title"
description: "A short description for search, previews, and RSS."
date: "2026-11-13"
category: "business"
pinned: true
order: 15
hidden: false
---

The essay starts here.
```

Use `business`, `marketing`, `life`, or `gaming`. Empty categories stay off the page. Pinned pieces come first within their category, followed by lower `order` values and then the newest essay. Set `hidden: true` to remove an essay from the built site, including its page, feed, sitemap, and aliases.

Put images you can publish in `public/images/essays/`. Give them useful alt text and dimensions where available. See the Markdown for *How to put 50 videos on the FYP every day* for an inline illustration and TikTok players that load as readers approach them.

## Sync Substack

```sh
pnpm sync:substack --dry-run
pnpm sync:substack
pnpm build
```

The sync reads the official RSS feed for the publication in `site.json` and checks the publication origin, post URLs, and author. It imports the full article body from `content:encoded`, keeps source IDs and dates, and flags likely duplicates or restricted articles for review. Existing Markdown and entries that fall off the feed stay intact. If fetching fails, the command exits with an error and the static build still uses the local archive. Use `--from /path/to/feed.xml` to sync a saved copy of the feed. Newly synced articles use the `business` category until curated. Images render in place from Substack’s CDN and are recorded in `mediaReview` as a reminder to add a local copy.

The sync is a manual pre-build step. Review and retain the new Markdown in the repository before deploying so it survives future builds and feed changes. For older posts beyond the public archive, Substack provides a posts export under **Settings → Exports**. Only the post HTML is needed for migration.

## Email signup

The shared `Subscribe.astro` form shows “You're in.” after the server saves the email. Use `pnpm dev` to test signup. It saves addresses and signup times in `.private/subscribers.sqlite`. This database is excluded from Git and the build. To inspect or export it, read the `subscribers` table with SQLite. To keep test signups in a separate database, start Astro with `SUBSCRIBERS_DB_PATH` set to the path of a separate local SQLite file.

In production, the form posts to the Brevo sign-up form set as `newsletter.endpoint` in `site.json` (Brevo → Contacts → Forms → “dannyhayder.com signup”). New addresses land in the list chosen on that form. The site keeps its own design and sends Brevo's `EMAIL` field with `?isAjax=1`, so readers stay on the page and see “You're in.”. Leave the form's reCAPTCHA off, because the site's own form can't show it. Set `newsletter.endpoint` to `null` to fall back to a link to the Substack signup page.

## Publish

[danny049/digital-garden](https://github.com/danny049/digital-garden) serves `dannyhayder.com` through GitHub Pages. Its Pages source is **GitHub Actions**. The custom domain is configured in GitHub and recorded in `public/CNAME`.

Commit and push reviewed changes to `main`, then run **Deploy website to GitHub Pages** from the repository’s **Actions** tab. The workflow installs the locked dependencies, builds the Astro site, and deploys `dist/`. Keep the local `.private/` folder outside the repository and build output.

Both previously live Quartz essay paths and their `.html` variants are emitted as static redirects. The script retains heading fragments and a plain link is available. The former `/index.xml` RSS path also serves the new feed. The site generates canonical URLs under `dannyhayder.com`. Canonicals on other domains are managed separately by their publishers.

See [IMPORT-REPORT.md](IMPORT-REPORT.md) for the inventory and media details. The machine-readable manifest is generated at `dist/import-manifest.json`.
