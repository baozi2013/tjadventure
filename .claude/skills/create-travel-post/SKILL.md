---
name: create-travel-post
description: "Create and update bilingual Chinese-English travel journal posts for the TJ Adventure Next.js repo. Use when the user asks to write a new trip post, convert rough trip notes and photo lists into publish-ready MDX, generate compliant frontmatter/slug/tags/readTime/category values, revise existing files under content/posts/*.mdx, generate posts from shareable album links (Google Photos or Immich), include Strava activity embeds, or run a multi-role parallel workflow (writing, fact-checking, image selection, publishing)."
---

# Create Travel Post

Write publish-ready bilingual Chinese-English travel posts in the format used by this repository.

## Quick Start

1. Read `content/posts/_template.mdx`.
2. Read 1-2 recent posts from `content/posts/` with a similar trip type.
3. Convert user notes into one complete bilingual Chinese-English MDX draft with required frontmatter.
4. Save file to `content/posts/<slug>.mdx`.
5. Run a quick schema/style validation before finishing.

## Multi-Role Parallel Mode (Optional)

Use this mode when the user explicitly asks for parallel collaboration or the task is large (many photos, strict quality bar, or same-day publish target).

Roles:

1. `Writer`: Drafts the full MDX narrative and section structure.
2. `Fact Checker`: Validates dates, locations, names, and practical claims against provided material (and web sources when needed).
3. `Image Curator`: Picks cover image and day-by-day representative images, proposes final image order and captions.
4. `Publisher`: Runs final build checks, then push/deploy flow when requested.

Ownership and merge rules:

1. Keep a single source of truth for the final post file: `content/posts/<slug>.mdx`.
2. Parallel roles work in separate scratch outputs first (notes/checklists/temp files).
3. Only one role writes the final MDX at a time (typically `Writer`, then final merge by main agent).
4. `Publisher` runs only after `Writer + Fact Checker + Image Curator` sign off.

Use the Agent tool to run `Writer`, `Fact Checker`, and `Image Curator` as parallel subagents when the task warrants it; merge their outputs yourself before writing the final MDX.

Suggested parallel sequence:

1. Start `Writer` and `Image Curator` in parallel after album extraction.
2. Run `Fact Checker` in parallel once draft sections/headings exist.
3. Merge corrections into final MDX.
4. Run build and deploy gate checks.
5. Execute push/deploy only if user asked.

## Share Link Intake

When the user provides a shareable album URL (Google Photos or Immich), use:

`.claude/skills/create-travel-post/scripts/extract_shared_album.py`

For provider-specific notes and API hints, read:

`.claude/skills/create-travel-post/references/share-links.md`

For multi-role orchestration details, read:

`.claude/skills/create-travel-post/references/multi-agent.md`

Purpose:

1. Extract album title/date range/items.
2. Generate sampled media URLs.
3. Optionally download representative images into a local folder for post assets.

Example commands:

```bash
python3 .claude/skills/create-travel-post/scripts/extract_shared_album.py \
  "https://photos.app.goo.gl/..." \
  --sample-count 24 \
  --download-dir /tmp/trip-draft \
  --download-count 12 \
  --output /tmp/trip-draft/album.json
```

```bash
python3 .claude/skills/create-travel-post/scripts/extract_shared_album.py \
  "https://your-immich.example.com/share/abcd1234" \
  --password "<password-if-required>" \
  --sample-count 24 \
  --download-dir /tmp/trip-draft \
  --download-count 12 \
  --output /tmp/trip-draft/album.json
```

Then:

1. Create `public/trips/<slug>/`.
2. Copy downloaded files into that folder and rename consistently (`day1-1.jpg`, `day1-2.jpg`, ...).
3. Reference local paths in MDX (`/trips/<slug>/day1-1.jpg`) instead of temporary URLs.

If the link is inaccessible:

1. State exactly whether the failure is permission/login/password-related.
2. Ask for one unblocker only: a public link, a password, or exported photo files.
3. Continue with a structured draft using placeholders if the user wants to proceed immediately.

## Strava Activity Embed Intake

When the user provides a Strava embed snippet, parse the attributes instead of pasting the raw `<script>` into MDX.

Input usually looks like:

```html
<div class="strava-embed-placeholder" data-embed-type="activity" data-embed-id="18549452331" data-style="standard" data-from-embed="false" data-token="..."></div><script src="https://strava-embeds.com/embed.js"></script>
```

For this repo, use the MDX component:

```mdx
<StravaActivity
  id="18549452331"
  token="..."
  embedStyle="standard"
/>
```

Rules:

1. Extract `data-embed-id` into `id`.
2. Extract `data-token` into `token` when present.
3. Extract `data-style` into `embedStyle`; default to `standard` when absent.
4. Do not include the raw `<script>` tag in post MDX for this Next.js site.
5. If the repo does not yet have a Strava MDX component, inspect the MDX rendering path and add a small reusable client component that loads `https://strava-embeds.com/embed.js` and calls `window.__STRAVA_EMBED_BOOTSTRAP__()` after mount.
6. Use any visible Strava stats from the embed or iframe response only when they are accessible from the user-provided public embed. Keep them factual and concise.
7. Run `npm run build` or at least `npm run validate:posts` after adding a Strava component or embed.

## Publish and NAS Deploy

When the user asks to publish and deploy after generating/updating a post, use:

`.claude/skills/create-travel-post/scripts/push_and_deploy_nas.sh`

This script supports the exact flow:

1. `git push`
2. `ssh tianheng@192.168.68.88`
3. `cd ~/projects/tjadventure`
4. `git pull && docker compose -f docker-compose.nas.yml up -d --build`

Default usage:

```bash
.claude/skills/create-travel-post/scripts/push_and_deploy_nas.sh \
  --repo-dir /path/to/tjadventure
```

Safe preview:

```bash
.claude/skills/create-travel-post/scripts/push_and_deploy_nas.sh \
  --repo-dir /path/to/tjadventure \
  --dry-run
```

Rules:

1. Run deploy commands only when the user explicitly asks to push/deploy.
2. By default, require a clean working tree before pushing.
3. If repo is dirty, ask user whether to commit first or proceed with `--allow-dirty`.
4. Keep deploy output concise and report final status.
5. Pushing to the remote and deploying to the NAS are actions visible/affecting shared state — confirm with the user before running the script for real (not `--dry-run`), even if they asked for "publish" earlier in the conversation.

## Required Frontmatter

Always include:

- `title`: bilingual string, usually `中文标题 / English Title`
- `excerpt`: bilingual 1 sentence summary for cards, usually `中文一句话。 / English one-sentence summary.`
- `date`: `YYYY-MM-DD`
- `category`: e.g. `US · Hawaii`
- `readTime`: e.g. `8 min`
- `coverImage`: usually `/trips/<trip-slug>/<file>`
- `tags`: 3-7 lowercase tags (kebab-case preferred)

Do not add unknown frontmatter keys unless user asks.

## Bilingual Output Requirement

All newly created posts must be bilingual Chinese-English by default.

Rules:

1. Every narrative section must include both Chinese and English content.
2. Put Chinese first, then English, unless the user explicitly requests another order.
3. Keep each English paragraph as a natural translation or concise counterpart of the Chinese paragraph; do not merely summarize whole sections in English at the end.
4. Use bilingual headings where practical, e.g. `## 行程概览 / Trip Overview`.
5. Use bilingual labels for practical bullets when useful, e.g. `- 路线 / Route: ...`.
6. Use bilingual image alt text and captions when captions are present.
7. Keep Strava and component props unchanged; translate only visible prose around embeds.
8. Existing post edits should preserve the current language style unless the user asks to make that post bilingual.
9. If the user explicitly asks for only one language, follow the user request.

Note: this repo's actual content structure splits locales into separate trees (`content/posts/` for zh, `content/en/posts/` for en) rather than inlining both languages in one file — check a couple of existing posts before assuming which layout applies to a given request.

## File and Slug Rules

- Create file as `content/posts/<slug>.mdx`.
- Build slug from trip + year + distinguishing token, e.g. `oregon-coast-2026`.
- Use lowercase letters, digits, and hyphens only.
- Avoid leading underscore in filename.
- Check for duplicate slug before writing.

## Writing Rules

1. Write in Chinese and English unless user requests another language.
2. Keep the opening concise: 1 short Chinese summary paragraph and 1 short English counterpart after frontmatter.
3. Use clear section headings with `##` (and optional `###`).
4. Keep sections scannable with short paragraphs and small bullet lists.
5. Keep content practical: route, costs, parking, reservation, kid-friendliness, pitfalls.
6. Prefer concrete statements over vague adjectives.
7. Use Markdown image syntax: `![alt](path-or-url)`.

## Default Post Structure

Use this shape unless user asks otherwise:

1. `## 行程概览 / Trip Overview`
2. Daily or theme sections such as `## Day 1｜中文主题 / English Theme`, `## Day 2｜中文主题 / English Theme`
3. Optional practical section: `## 费用与补给 / Costs and Supplies` or `## 交通与停车 / Transportation and Parking`
4. `## 小结 / Takeaways` with 3-5 bilingual takeaway bullets

## Handling Missing Inputs

When key info is missing:

1. Make minimal assumptions and keep them realistic.
2. Insert explicit bilingual placeholders like `[待补充：门票价格 / TBD: ticket price]` only when needed.
3. Keep the draft publish-ready even with a few placeholders.
4. Summarize assumptions in 1 short block at the end of the response.

## Validation Checklist

Before finishing:

1. Verify frontmatter includes all required keys and valid date format.
2. Verify `coverImage` exists in provided assets or is a valid URL/path pattern.
3. Verify heading levels start at `##`.
4. Verify file path and slug are consistent.
5. Verify each narrative section has both Chinese and English content unless the user explicitly requested a single language.
6. Verify frontmatter `title` and `excerpt` are bilingual unless the user explicitly requested a single language.
7. Run `npm run validate:posts` and `npm run check:images`; run `npm run build` if edits are substantial.
8. For share-link based posts, verify downloaded files exist and every referenced image path resolves.

## Edit Existing Posts

When revising an existing post:

1. Preserve slug and publish date unless user requests change.
2. Keep existing image paths unless broken or explicitly replaced.
3. Improve readability and practical value without changing factual meaning.

## Example User Requests

Use this skill for prompts like:

1. "把这次黄石 5 天行程整理成游记并生成 mdx。"
2. "根据我给的照片文件名，写一篇可发布的亲子露营游记。"
3. "把这篇旧游记改成现在站点风格，并补齐 frontmatter。"
4. "我给你一个 Google Photos/Immich sharable link，直接产出一篇游记。"
5. "生成一篇中英文双语的旅行 post。"
