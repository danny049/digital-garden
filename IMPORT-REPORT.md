# Writing import

Reviewed 13 November 2026. The initial import produced 19 local essays from 20 source records. The site now lists 18 essays after retiring the January draft about app businesses. The [generated manifest](http://127.0.0.1:4321/import-manifest.json) contains article titles, source IDs and URLs, local URLs, source dates, categories, status, and exact media URLs that need review.

| Source | Found | Added as unique essays | Coverage |
| --- | ---: | ---: | --- |
| Creative Examples | 12 | 12 | The same public Sanity query the site's frontend uses for published articles. All 12 hash URLs are recorded. The public sitemap and robots paths returned 404. |
| Live Quartz | 2 | 2 | Both full pages, cross-checked against the sitemap, content index and RSS. The former index page was the old introduction. The live index contained no suitable joke link. |
| Local Notion PDFs | 2 | 2 | Both bodies and dates imported from the supplied PDFs. The original files are preserved in the project. |
| Substack | 4 | 3 | The publication archive and official feed exposed the same four posts by Danny Hayder. All four public pages returned successfully. |

There were no unresolved article URLs in the public inventory. For anything older or private beyond that inventory, use Substack's **Settings → Exports** and provide the post files.

## Versions

- *Sell kale to a vegan. Sell nostalgia to a gamer* is one local essay with both source URLs and dates. The Creative Examples version supplies two TikTok embeds. The Substack version is a lightly revised copy.
- *The Hidden Cost of Raising Millions For Your Startup* is the published version. The January draft, *A Niche Rant on Why App Businesses Suck To Build*, is preserved in the source files. Its former URL points to the May essay.

## Media and formatting

- The 12 original Creative Examples TikTok embeds use TikTok's official player and load as readers approach them. Each has a link to the original post. TikTok returned embed markup for all 12. Playback still depends on TikTok and the visitor's browser.
- Three in-body Creative Examples diagrams are hosted locally as optimised WebP files. The 12 original header/card images are recorded in the manifest for reuse review. The five in-body screenshots or collages that need a rights check remain linked in *Controversial*, *You know what people love? Underdog stories*, *You have followers. Do you have die-hard fans?*, *Please shoot the messenger*, and *This is how you do ‘purple cow’ content*.
- The original cover collages in *How She Grew A $50m Brand From Her Eyebrows.* and *This Girl Sold 2.4 Million Brownies on TikTok.* remain linked at their original positions. The opening film still for *A Niche Rant on Why App Businesses Suck To Build* remains in the supplied PDF. These three assets need reuse clearance before rehosting.
- Original prose, lists, headings, and article links were carried over. Quartz's heading IDs were preserved. Substack's in-article signup widgets were replaced by the site's shared signup section after the essay.

## Existing site

GitHub Pages settings confirm that `danny049/digital-garden` serves `dannyhayder.com`. The old site's sitemap and RSS pointed at Quartz's default domain. The new build generates both against `dannyhayder.com`, with aliases for the two live essay paths and their `.html` forms.
