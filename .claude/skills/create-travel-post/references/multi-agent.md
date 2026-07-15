# Multi-Agent Orchestration

Use this reference when the user asks for parallel, multi-role collaboration.

## Role Contract

1. Writer
- Input: album metadata, sampled images, user notes.
- Output: full MDX draft with frontmatter and section structure.

2. Fact Checker
- Input: writer draft + source notes/links.
- Output: line-item findings:
  - must-fix factual errors,
  - uncertain claims,
  - suggested wording changes.

3. Image Curator
- Input: extracted assets and timestamps.
- Output:
  - cover image pick,
  - day-by-day image shortlist,
  - proposed `![alt](path)` ordering.

4. Publisher
- Input: final MDX + image paths.
- Output:
  - build/lint status,
  - push/deploy status (only when requested).

## Parallel Safety Rules

1. Do not let multiple roles edit `content/posts/<slug>.mdx` concurrently.
2. Keep role outputs in temporary notes first; merge in one pass.
3. Use strict merge order:
   1) Writer baseline
   2) Fact checker fixes
   3) Image order and cover updates
   4) Final validation

## Completion Gate

Publish only when all are true:

1. Frontmatter complete and valid.
2. No unresolved high-severity factual findings.
3. All image references resolve to existing files/URLs.
4. `npm run build` succeeds.
5. User asked for push/deploy.
