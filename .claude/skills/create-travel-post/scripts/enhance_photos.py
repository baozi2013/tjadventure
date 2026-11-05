#!/usr/bin/env python3
"""Gentle batch photo retouch for travel posts and social cards.

Runs fully locally (PIL + numpy + scikit-image). Per image:
  1. auto levels on luminance (percentile stretch, partially blended)
  2. shadow lift / highlight protect tone curve
  3. local contrast (CLAHE on Lab L, blended)
  4. vibrance (boosts muted colors more than already-saturated ones)
  5. gray-world white balance (auto: only on normally lit shots, so neon/sunset moods survive)
  6. light unsharp mask

Usage:
  python3 enhance_photos.py IN_DIR OUT_DIR [--strength 1.0] [--wb -1] [--sheet before_after.jpg]
"""

import argparse
import glob
import os

import numpy as np
from PIL import Image, ImageFilter, ImageOps
from skimage import color, exposure


def enhance(img: Image.Image, strength: float, wb: float) -> Image.Image:
    rgb = np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0

    # night / neon scene: the darkest tenth of the frame is near black
    night = float(np.percentile(color.rgb2lab(rgb)[..., 0], 10)) / 100.0 < 0.2
    if wb < 0:  # auto: neutralize casts only on normally lit shots; keep neon/night moods
        wb = 0.0 if night else 0.35
    if wb > 0:
        means = rgb.reshape(-1, 3).mean(axis=0)
        gains = means.mean() / np.maximum(means, 1e-4)
        rgb = np.clip(rgb * (1 + (gains - 1) * wb), 0, 1)

    lab = color.rgb2lab(rgb)
    L = lab[..., 0] / 100.0

    # 1. auto levels
    lo, hi = np.percentile(L, (0.5, 99.7))
    if hi - lo > 0.05:
        stretched = np.clip((L - lo) / (hi - lo), 0, 1)
        L = L + (stretched - L) * (0.35 if night else 0.6) * strength

    # 2. shadow lift (stronger for dark scenes), soft highlight shoulder
    lift = (0.08 if night else 0.12) * strength
    L = L + lift * L * (1 - L) ** 2 * 2.2
    L = L - 0.06 * strength * np.clip(L - 0.85, 0, 1) * 4 * L

    # 3. local contrast
    clahe = exposure.equalize_adapthist(np.clip(L, 0, 1), clip_limit=0.008 if night else 0.012)
    L = L + (clahe - L) * (0.15 if night else 0.35) * strength

    # keep night blacks deep so neon scenes don't turn hazy
    if night:
        black = float(np.percentile(L, 1.0)) * 0.9
        L = np.clip((L - black) / max(1 - black, 1e-3), 0, 1)
        L = L - 0.05 * strength * L * (1 - L) * (L < 0.35)

    lab[..., 0] = np.clip(L, 0, 1) * 100.0

    # 4. vibrance on chroma
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    boost = 1 + (0.10 if night else 0.18) * strength * (1 - np.clip(chroma / 80.0, 0, 1))
    lab[..., 1] *= boost
    lab[..., 2] *= boost

    out = np.clip(color.lab2rgb(lab), 0, 1)
    result = Image.fromarray((out * 255 + 0.5).astype(np.uint8))

    # 6. light sharpening (less on night shots to avoid amplifying noise)
    return result.filter(ImageFilter.UnsharpMask(radius=1.6, percent=int((35 if night else 60) * strength), threshold=3))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("in_dir")
    ap.add_argument("out_dir")
    ap.add_argument("--strength", type=float, default=1.0)
    ap.add_argument("--wb", type=float, default=-1.0, help="gray-world white balance blend 0-1; -1 = auto (off for night shots)")
    ap.add_argument("--quality", type=int, default=88)
    ap.add_argument("--sheet", help="write a before/after contact sheet to this path")
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)
    files = sorted(f for f in glob.glob(os.path.join(args.in_dir, "*")) if f.lower().endswith((".jpg", ".jpeg", ".png")))
    pairs = []
    for f in files:
        src = ImageOps.exif_transpose(Image.open(f))
        dst = enhance(src, args.strength, args.wb)
        out_path = os.path.join(args.out_dir, os.path.splitext(os.path.basename(f))[0] + ".jpg")
        dst.save(out_path, quality=args.quality, optimize=True, progressive=True)
        pairs.append((src, dst, os.path.basename(f)))
        print(f"enhanced {os.path.basename(f)}")

    if args.sheet and pairs:
        tile = 360
        sheet = Image.new("RGB", (tile * 2 * 4, tile * ((len(pairs) + 3) // 4)), "white")
        for i, (a, b, _) in enumerate(pairs):
            for j, im in enumerate((a, b)):
                t = im.copy()
                t.thumbnail((tile - 6, tile - 6))
                sheet.paste(t, ((i % 4) * tile * 2 + j * tile + 3, (i // 4) * tile + 3))
        sheet.save(args.sheet, quality=82)
        print(f"sheet {args.sheet}")


if __name__ == "__main__":
    main()
