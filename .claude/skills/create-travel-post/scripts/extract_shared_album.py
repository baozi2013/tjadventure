#!/usr/bin/env python3
"""Extract metadata and media URLs from shareable travel albums.

Supported providers:
- Google Photos share links (photos.app.goo.gl / photos.google.com/share/...)
- Immich shared links (.../share/<key>)

The script returns JSON suitable for drafting a travel post.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import http.cookiejar
import json
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

UA = "Mozilla/5.0"
TIMEOUT_SECONDS = 30


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Extract album metadata/items from a shareable link "
            "(Google Photos or Immich) and print JSON."
        )
    )
    parser.add_argument("url", help="Shareable album URL")
    parser.add_argument(
        "--provider",
        choices=["auto", "google_photos", "immich"],
        default="auto",
        help="Provider override (default: auto detect).",
    )
    parser.add_argument(
        "--max-items",
        type=int,
        default=300,
        help="Max number of items to keep in `items` output.",
    )
    parser.add_argument(
        "--sample-count",
        type=int,
        default=24,
        help="How many evenly-spaced sample items to include in `sampled_items`.",
    )
    parser.add_argument(
        "--download-dir",
        help=(
            "Optional local directory for downloading sampled images. "
            "Filenames will be day-based: dayN-XX.jpg."
        ),
    )
    parser.add_argument(
        "--download-count",
        type=int,
        default=12,
        help="How many sampled images to download when --download-dir is set.",
    )
    parser.add_argument(
        "--password",
        help="Password for password-protected shared links (mainly Immich).",
    )
    parser.add_argument(
        "--output",
        help="Optional output JSON path. If omitted, print to stdout.",
    )
    return parser.parse_args()


def build_opener() -> urllib.request.OpenerDirector:
    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))
    opener.addheaders = [("User-Agent", UA)]
    return opener


def fetch_text(opener: urllib.request.OpenerDirector, url: str) -> tuple[str, str]:
    with opener.open(url, timeout=TIMEOUT_SECONDS) as resp:
        raw = resp.read()
        charset = resp.headers.get_content_charset() or "utf-8"
        text = raw.decode(charset, errors="replace")
        return text, resp.geturl()


def request_json(
    opener: urllib.request.OpenerDirector,
    url: str,
    method: str = "GET",
    body: dict[str, Any] | None = None,
) -> tuple[int, dict[str, Any] | None, str | None]:
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with opener.open(req, timeout=TIMEOUT_SECONDS) as resp:
            payload = resp.read().decode("utf-8", errors="replace")
            parsed = json.loads(payload) if payload else None
            return resp.getcode(), parsed, None
    except urllib.error.HTTPError as exc:
        payload = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(payload) if payload else None
        except json.JSONDecodeError:
            parsed = None
        return exc.code, parsed, payload or str(exc)
    except urllib.error.URLError as exc:
        return 0, None, str(exc)


def detect_provider(url: str, override: str) -> str:
    if override != "auto":
        return override
    parsed = urllib.parse.urlparse(url)
    host = (parsed.hostname or "").lower()
    if "photos.app.goo.gl" in host or "photos.google.com" in host:
        return "google_photos"
    return "immich"


def ms_to_iso_utc(ms: int | None) -> str | None:
    if ms is None:
        return None
    return dt.datetime.fromtimestamp(ms / 1000, tz=dt.timezone.utc).isoformat()


def evenly_sample(items: list[dict[str, Any]], count: int) -> list[dict[str, Any]]:
    if not items or count <= 0:
        return []
    if len(items) <= count:
        return items.copy()
    idx = [round(i * (len(items) - 1) / (count - 1)) for i in range(count)]
    seen = set()
    sampled = []
    for i in idx:
        if i in seen:
            continue
        seen.add(i)
        sampled.append(items[i])
    return sampled


def decode_js_escaped_string(raw: str) -> str:
    try:
        return json.loads(f"\"{raw}\"")
    except json.JSONDecodeError:
        return raw.replace("\\u0026", "&").replace("\\/", "/")


def parse_google_album(html_text: str, final_url: str) -> dict[str, Any]:
    canonical_match = re.search(
        r'<link rel="canonical" href="([^"]+)"', html_text, flags=re.IGNORECASE
    )
    canonical_url = html.unescape(canonical_match.group(1)) if canonical_match else final_url

    share_id = None
    parsed_canonical = urllib.parse.urlparse(canonical_url)
    parts = [p for p in parsed_canonical.path.split("/") if p]
    if len(parts) >= 2 and parts[0] == "share":
        share_id = parts[1]

    album_id = share_id
    album_title = None
    start_ms = None
    end_ms = None
    if share_id:
        album_meta_pattern = re.compile(
            r'\["'
            + re.escape(share_id)
            + r'","((?:\\.|[^"\\])*)",\[(\d{13}),(\d{13})',
            flags=re.S,
        )
        mm = album_meta_pattern.search(html_text)
        if mm:
            album_title = decode_js_escaped_string(mm.group(1))
            start_ms = int(mm.group(2))
            end_ms = int(mm.group(3))

    item_pattern = re.compile(
        r'\["(AF1Qip[^"]+)",\["(https://lh3\.googleusercontent\.com/pw/[^"]+)",'
        r'(\d+),(\d+).*?\],(\d{13}),"',
        flags=re.S,
    )
    dedup: dict[str, dict[str, Any]] = {}
    for match in item_pattern.finditer(html_text):
        media_id, media_url, width, height, ts = match.groups()
        ts_ms = int(ts)
        dedup[media_id] = {
            "id": media_id,
            "captured_at_ms": ts_ms,
            "captured_at": ms_to_iso_utc(ts_ms),
            "width": int(width),
            "height": int(height),
            "source_url": media_url,
            "source_type": "image",
        }

    items = sorted(dedup.values(), key=lambda x: x.get("captured_at_ms") or 0)
    if items and start_ms is None:
        start_ms = items[0]["captured_at_ms"]
    if items and end_ms is None:
        end_ms = items[-1]["captured_at_ms"]

    return {
        "provider": "google_photos",
        "source_url": final_url,
        "canonical_url": canonical_url,
        "album": {
            "id": album_id,
            "title": album_title,
            "start_ms": start_ms,
            "start": ms_to_iso_utc(start_ms),
            "end_ms": end_ms,
            "end": ms_to_iso_utc(end_ms),
        },
        "items": items,
    }


def parse_timestamp_to_ms(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        ivalue = int(value)
        if ivalue > 10_000_000_000:
            return ivalue
        return ivalue * 1000
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return None
        if stripped.isdigit():
            return parse_timestamp_to_ms(int(stripped))
        iso = stripped.replace("Z", "+00:00")
        try:
            dtt = dt.datetime.fromisoformat(iso)
        except ValueError:
            return None
        if dtt.tzinfo is None:
            dtt = dtt.replace(tzinfo=dt.timezone.utc)
        return int(dtt.timestamp() * 1000)
    return None


def build_immich_candidates(url: str) -> tuple[str, list[tuple[str, str]]]:
    parsed = urllib.parse.urlparse(url)
    base = f"{parsed.scheme}://{parsed.netloc}"
    query = urllib.parse.parse_qs(parsed.query)
    candidates: list[tuple[str, str]] = []

    for key_name in ("key", "slug", "token"):
        for value in query.get(key_name, []):
            if value:
                candidates.append((key_name, value))

    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) >= 2 and parts[0].lower() == "share":
        token = parts[1]
        if token:
            candidates.extend([("key", token), ("slug", token), ("token", token)])

    # Preserve order, remove duplicates.
    unique: list[tuple[str, str]] = []
    seen = set()
    for item in candidates:
        if item in seen:
            continue
        seen.add(item)
        unique.append(item)

    return base, unique


def parse_immich_album(
    opener: urllib.request.OpenerDirector, url: str, password: str | None
) -> dict[str, Any]:
    base_url, candidates = build_immich_candidates(url)
    if not candidates:
        raise RuntimeError(
            "Could not infer Immich share token from URL. Expected /share/<token> or ?key=..."
        )

    chosen_param = None
    shared = None
    errors: list[str] = []

    for param_name, param_value in candidates:
        query = urllib.parse.urlencode({param_name: param_value})
        me_url = f"{base_url}/api/shared-links/me?{query}"
        status, payload, err = request_json(opener, me_url, method="GET")
        if status == 200 and isinstance(payload, dict):
            chosen_param = (param_name, param_value)
            shared = payload
            break

        if status in (401, 403) and password:
            login_url = f"{base_url}/api/shared-links/login?{query}"
            login_status, _, login_err = request_json(
                opener, login_url, method="POST", body={"password": password}
            )
            if login_status in (200, 201, 204):
                status, payload, err = request_json(opener, me_url, method="GET")
                if status == 200 and isinstance(payload, dict):
                    chosen_param = (param_name, param_value)
                    shared = payload
                    break
            errors.append(
                f"{param_name}=*** login failed status={login_status} detail={login_err}"
            )
        else:
            errors.append(f"{param_name}=*** status={status} detail={err}")

    if not shared or not chosen_param:
        raise RuntimeError(
            "Failed to fetch Immich shared link metadata. "
            "Try a public share link or provide --password. "
            f"Attempts: {errors}"
        )

    key_name, key_value = chosen_param
    album = shared.get("album") if isinstance(shared.get("album"), dict) else {}
    assets_raw = []
    if isinstance(shared.get("assets"), list):
        assets_raw.extend(shared["assets"])
    if isinstance(album.get("assets"), list):
        seen_ids = {a.get("id") for a in assets_raw if isinstance(a, dict)}
        for a in album["assets"]:
            if isinstance(a, dict) and a.get("id") not in seen_ids:
                assets_raw.append(a)

    items = []
    for asset in assets_raw:
        if not isinstance(asset, dict):
            continue
        asset_id = asset.get("id")
        if not asset_id:
            continue

        ts_ms = (
            parse_timestamp_to_ms(asset.get("localDateTime"))
            or parse_timestamp_to_ms(asset.get("fileCreatedAt"))
            or parse_timestamp_to_ms(asset.get("createdAt"))
        )
        width = int(asset.get("width") or 0)
        height = int(asset.get("height") or 0)
        thumb_query = urllib.parse.urlencode({key_name: key_value, "size": "preview"})
        original_query = urllib.parse.urlencode({key_name: key_value})

        items.append(
            {
                "id": asset_id,
                "captured_at_ms": ts_ms,
                "captured_at": ms_to_iso_utc(ts_ms),
                "width": width,
                "height": height,
                "source_url": f"{base_url}/api/assets/{urllib.parse.quote(asset_id)}/thumbnail?{thumb_query}",
                "original_url": f"{base_url}/api/assets/{urllib.parse.quote(asset_id)}/original?{original_query}",
                "original_file_name": asset.get("originalFileName"),
                "source_type": "image",
            }
        )

    items.sort(key=lambda x: x.get("captured_at_ms") or 0)
    start_ms = (
        parse_timestamp_to_ms(album.get("startDate"))
        or (items[0]["captured_at_ms"] if items else None)
    )
    end_ms = (
        parse_timestamp_to_ms(album.get("endDate"))
        or (items[-1]["captured_at_ms"] if items else None)
    )

    return {
        "provider": "immich",
        "source_url": url,
        "canonical_url": url,
        "album": {
            "id": shared.get("id"),
            "title": album.get("albumName") or shared.get("description"),
            "description": shared.get("description"),
            "start_ms": start_ms,
            "start": ms_to_iso_utc(start_ms),
            "end_ms": end_ms,
            "end": ms_to_iso_utc(end_ms),
            "share_type": shared.get("type"),
        },
        "auth_hint": {"param": key_name},
        "items": items,
    }


def detect_extension(content_type: str | None, url: str) -> str:
    if content_type:
        lowered = content_type.lower()
        if "jpeg" in lowered or "jpg" in lowered:
            return ".jpg"
        if "png" in lowered:
            return ".png"
        if "webp" in lowered:
            return ".webp"
        if "gif" in lowered:
            return ".gif"
        if "heic" in lowered:
            return ".heic"

    parsed = urllib.parse.urlparse(url)
    suffix = pathlib.Path(parsed.path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"}:
        return ".jpg" if suffix == ".jpeg" else suffix
    return ".jpg"


def build_download_candidates(source_url: str) -> list[str]:
    candidates = []

    # Google Photos shared URLs often default to small previews (e.g., 512px).
    # `=s0` requests the original/full resolution variant.
    if "lh3.googleusercontent.com/pw/" in source_url:
        if "=s0" not in source_url:
            candidates.append(f"{source_url}=s0")
        if "=w4032-h4032-no" not in source_url:
            candidates.append(f"{source_url}=w4032-h4032-no")

    candidates.append(source_url)

    # Keep order while removing duplicates.
    seen = set()
    unique = []
    for c in candidates:
        if c in seen:
            continue
        seen.add(c)
        unique.append(c)
    return unique


def build_day_index(items: list[dict[str, Any]]) -> dict[str, int]:
    day_to_idx: dict[str, int] = {}
    next_idx = 1
    for item in items:
        ts = item.get("captured_at_ms")
        if ts is None:
            day_key = "unknown"
        else:
            day_key = dt.datetime.fromtimestamp(ts / 1000, tz=dt.timezone.utc).date().isoformat()
        if day_key not in day_to_idx:
            day_to_idx[day_key] = next_idx
            next_idx += 1
    return day_to_idx


def download_sampled_items(
    opener: urllib.request.OpenerDirector,
    items: list[dict[str, Any]],
    download_dir: str,
    download_count: int,
) -> list[dict[str, Any]]:
    output_dir = pathlib.Path(download_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    sampled = evenly_sample(items, download_count)
    day_to_idx = build_day_index(sampled)
    day_counters: dict[int, int] = {}
    downloaded = []

    for item in sampled:
        ts = item.get("captured_at_ms")
        if ts is None:
            day_key = "unknown"
        else:
            day_key = dt.datetime.fromtimestamp(ts / 1000, tz=dt.timezone.utc).date().isoformat()
        day_index = day_to_idx[day_key]
        day_counters[day_index] = day_counters.get(day_index, 0) + 1
        index = day_counters[day_index]

        source_url = item.get("source_url")
        if not source_url:
            downloaded.append({**item, "download_error": "missing source_url"})
            continue

        try:
            content = None
            content_type = None
            final_url = source_url

            for candidate in build_download_candidates(source_url):
                try:
                    with opener.open(candidate, timeout=TIMEOUT_SECONDS) as resp:
                        content = resp.read()
                        content_type = resp.headers.get("Content-Type")
                        final_url = candidate
                    if content:
                        break
                except Exception:  # noqa: BLE001
                    continue

            if not content:
                raise RuntimeError("all download candidates failed")

            ext = detect_extension(content_type, final_url)
            filename = f"day{day_index}-{index:02d}{ext}"
            save_path = output_dir / filename
            save_path.write_bytes(content)
            downloaded.append(
                {
                    **item,
                    "download_source_url": final_url,
                    "downloaded_path": str(save_path),
                    "relative_suggested_path": filename,
                }
            )
        except Exception as exc:  # noqa: BLE001
            downloaded.append({**item, "download_error": str(exc)})

    return downloaded


def build_output(
    extracted: dict[str, Any],
    max_items: int,
    sample_count: int,
) -> dict[str, Any]:
    items: list[dict[str, Any]] = extracted.get("items", [])
    sampled = evenly_sample(items, sample_count)
    output = {
        "provider": extracted.get("provider"),
        "source_url": extracted.get("source_url"),
        "canonical_url": extracted.get("canonical_url"),
        "album": extracted.get("album"),
        "items_count": len(items),
        "items": items[:max_items],
        "sampled_items": sampled,
    }
    if len(items) > max_items:
        output["truncated"] = {
            "items_kept": max_items,
            "items_total": len(items),
        }
    if extracted.get("auth_hint"):
        output["auth_hint"] = extracted["auth_hint"]
    return output


def main() -> int:
    args = parse_args()
    opener = build_opener()
    provider = detect_provider(args.url, args.provider)

    try:
        if provider == "google_photos":
            html_text, final_url = fetch_text(opener, args.url)
            extracted = parse_google_album(html_text, final_url)
        elif provider == "immich":
            extracted = parse_immich_album(opener, args.url, args.password)
        else:
            raise RuntimeError(f"Unsupported provider: {provider}")
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc), "provider": provider}, ensure_ascii=False), file=sys.stderr)
        return 1

    output = build_output(extracted, args.max_items, args.sample_count)
    if args.download_dir:
        output["downloaded_items"] = download_sampled_items(
            opener, extracted.get("items", []), args.download_dir, args.download_count
        )

    payload = json.dumps(output, ensure_ascii=False, indent=2)
    if args.output:
        output_path = pathlib.Path(args.output).expanduser().resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(payload + "\n", encoding="utf-8")
    else:
        print(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
