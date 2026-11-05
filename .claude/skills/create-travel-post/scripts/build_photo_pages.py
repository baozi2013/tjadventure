#!/usr/bin/env python3
"""Build text-free Xiaohongshu photo pages (3:4, 1080x1440) from a layout file.

Layout file: one page per line, '#' comments allowed.
  day1-03.jpg                 -> single photo, cover-cropped to fill the page
  day1-03.jpg@0.35            -> same, with vertical focal point (0 top .. 1 bottom)
  day1-02.jpg, day1-05.jpg    -> two landscape photos stacked (optional @x focal per photo,
                                  horizontal 0 left .. 1 right)

Usage:
  python3 build_photo_pages.py LAYOUT IMG_DIR OUT_DIR [--start 2] [--gutter 10] [--bg "#0e0d0c"]
"""

import argparse
import os

from PIL import Image, ImageOps

W, H = 1080, 1440


def parse(token):
    name, _, focal = token.strip().partition("@")
    return name.strip(), float(focal) if focal else 0.5


def fill(img, w, h, fx=0.5, fy=0.5):
    """Cover-crop img to w x h around the focal point."""
    scale = max(w / img.width, h / img.height)
    im = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    left = round((im.width - w) * fx)
    top = round((im.height - h) * fy)
    return im.crop((left, top, left + w, top + h))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("layout")
    ap.add_argument("img_dir")
    ap.add_argument("out_dir")
    ap.add_argument("--start", type=int, default=2, help="number of the first page (cover is 01)")
    ap.add_argument("--gutter", type=int, default=10)
    ap.add_argument("--bg", default="#0e0d0c")
    ap.add_argument("--quality", type=int, default=92)
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    lines = [l.split("#", 1)[0].strip() for l in open(args.layout, encoding="utf-8")]
    pages = [l for l in lines if l]

    def load(name):
        return ImageOps.exif_transpose(Image.open(os.path.join(args.img_dir, name))).convert("RGB")

    for i, line in enumerate(pages):
        tokens = [parse(t) for t in line.split(",")]
        page = Image.new("RGB", (W, H), args.bg)
        if len(tokens) == 1:
            name, fy = tokens[0]
            page.paste(fill(load(name), W, H, 0.5, fy), (0, 0))
        elif len(tokens) == 2:
            slot_h = (H - args.gutter) // 2
            for j, (name, fx) in enumerate(tokens):
                page.paste(fill(load(name), W, slot_h, fx, 0.5), (0, j * (slot_h + args.gutter)))
            if (H - args.gutter) % 2:  # odd remainder: stretch the bottom slot by 1px
                page.paste(fill(load(tokens[1][0]), W, H - slot_h - args.gutter, tokens[1][1], 0.5), (0, slot_h + args.gutter))
        else:
            raise SystemExit(f"line {i + 1}: expected 1 or 2 photos, got {len(tokens)}")

        out = os.path.join(args.out_dir, f"{args.start + i:02d}-photo.jpg")
        page.save(out, quality=args.quality, optimize=True)
        print(f"page {os.path.basename(out)}: {line}")


if __name__ == "__main__":
    main()
