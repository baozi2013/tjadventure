# Nightly Media Hub + Travel Post Pipeline

This project now includes a first-night implementation of:

1. Media Hub intake and manifest generation.
2. Role-based travel post pipeline (`image-curator -> writer -> fact-checker -> publisher`).
3. Admin console at `/admin/pipeline` for queue control and rerun/publish actions.

## What It Produces

- Queue file: `data/pipeline/jobs.json`
- Per-job artifacts: `data/pipeline/artifacts/<job-id>/`
- Media manifests: `data/media-hub/<slug>.json`
- Global media index: `data/media-hub/index.json`
- Draft posts: `content/posts/_drafts/<slug>.mdx`

## Commands

```bash
npm run nightly:enqueue -- --link "https://photos.app.goo.gl/..."
```

Optional enqueue flags:

- `--title "..."` title hint
- `--date YYYY-MM-DD` date hint
- `--sample-count 30`
- `--download-count 24`
- `--publish`
- `--deploy`
- `--overwrite-post`

Run worker:

```bash
npm run nightly:run
```

Useful run flags:

- `--max-jobs 3`
- `--job-id job-...`
- `--retry-failed`
- `--publish`
- `--deploy`
- `--overwrite-post`

## Runtime Notes

- The pipeline attempts to use the share-link extractor at:
  - `$SHARE_EXTRACTOR`, or
  - `~/.codex/skills/create-travel-post/scripts/extract_shared_album.py`
- If extractor is unavailable or fails, it still creates fallback artifacts and continues.
- Publisher stage is off by default unless `--publish` is set on the job or run command.
- Deploy uses existing `scripts/deploy-nas.sh`.
- Worker launches from admin are detached background processes.

## Current Scope (Tonight MVP)

- Media Hub:
  - Local image copy to `public/trips/<slug>/`
  - Incremental sync by `sourceLink -> slug` mapping
  - Hash-based dedupe and reuse on reruns
  - Per-asset quality judgment (`accepted/rejected`) using blur/resolution/filesize signals
  - Variant generation for accepted images (`webp` + `avif`, widths 1280/1920 when `sharp` is available)
  - Manifest + index output
- AI pipeline:
  - Automatic draft generation
  - Basic schema/path fact checks
  - Optional publish/deploy gate

## Next Iteration Ideas

- Better factual verification with place/date entity checks.
- True parallel worker mode for role steps.
- Smarter section generation from timestamps and geoclusters.
- Blur/dup filtering thresholds with configurable reject rules.
