#!/usr/bin/env python3
"""Crop the room photos from docs/dispenseri_nitidus to 4:3 and write public/scenes/*.webp.

Hotspot coordinates in data/scenes.json are percentages of the *cropped* image.
Deterministic; re-running yields identical files.

Usage: python3 scripts/prepare_scenes.py
"""
from __future__ import annotations

import io
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "dispenseri_nitidus"
OUT = ROOT / "public" / "scenes"
MAX_WIDTH = 1600

# output name -> (source file, crop box in source pixels: left, top, right, bottom)
SCENES = {
    "skin-stone": ("skincollection_stone.jpg", (0, 50, 1200, 950)),
    "skin-white": ("skincollection_white.jpg", (84, 0, 617, 400)),
    "skin-carbon": ("skincollection_carbon.jpg", (40, 0, 1165, 844)),
    "skin-sand": ("skincollection_sand.jpg", (0, 100, 1200, 1000)),
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (file, box) in SCENES.items():
        im = Image.open(SRC / file).convert("RGB").crop(box)
        w, h = im.size
        assert abs(w / h - 4 / 3) < 0.01, f"{name}: crop is {w}x{h}, not 4:3"
        if w > MAX_WIDTH:
            im = im.resize((MAX_WIDTH, round(MAX_WIDTH * h / w)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=82, method=6)
        dest = OUT / f"{name}.webp"
        if not dest.exists() or dest.read_bytes() != buf.getvalue():
            dest.write_bytes(buf.getvalue())
        print(f"ok: {dest.relative_to(ROOT)} {im.size[0]}x{im.size[1]}")


if __name__ == "__main__":
    main()
