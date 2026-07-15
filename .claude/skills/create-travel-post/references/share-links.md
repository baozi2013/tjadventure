# Share Link Notes

This skill supports two link types:

1. Google Photos shared albums (`photos.app.goo.gl` / `photos.google.com/share/...`)
2. Immich shared links (`<host>/share/<token>`)

## Google Photos

- The extractor reads public share-page payload data and returns:
  - album id/title/date range (when available),
  - media timestamps,
  - media URLs (`lh3.googleusercontent.com/pw/...`).
- URLs are useful for drafting, but copy representative files to local `public/trips/<slug>/` before publishing.

## Immich

- The extractor uses Immich API endpoints against the share host:
  - `GET /api/shared-links/me` with one of query params `key`/`slug`/`token`
  - `POST /api/shared-links/login` for password-protected links
  - thumbnail/original URLs from `/api/assets/{id}/thumbnail` and `/api/assets/{id}/original`
- This behavior is aligned with the Immich OpenAPI spec:
  - `https://raw.githubusercontent.com/immich-app/immich/main/open-api/immich-openapi-specs.json`

## Reliability

- Always keep a fallback flow:
  - If link parsing fails, ask user for one unblocker:
    - public link, or
    - share password, or
    - exported photo files.
- Even if metadata is partial, generate a publish-ready draft and mark unknown fields clearly.
