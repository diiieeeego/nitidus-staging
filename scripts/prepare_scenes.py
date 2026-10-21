#!/usr/bin/env python3
"""Convert the room photos from docs/dispenseri_nitidus to public/scenes/*.webp.

Photos keep their own aspect ratio (uncropped); hotspot coordinates in data/scenes.json are
percentages of the whole image. Output names carry a content hash (skin-stone.<hash>.webp) so a
changed photo gets a new URL and no stale copy is served from the browser or next/image cache;
the "image" paths in data/scenes.json are updated to match and "aspect" is checked.
Deterministic; re-running yields identical files.

Usage: python3 scripts/prepare_scenes.py
"""
from __future__ import annotations

import hashlib
import io
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "dispenseri_nitidus"
OUT = ROOT / "public" / "scenes"
SCENES_JSON = ROOT / "data" / "scenes.json"
MAX_WIDTH = 1600

# output name -> source file
SCENES = {
    "skin-stone": "skincollection_stone.jpg",
    "skin-white": "skincollection_white.jpg",
    "skin-carbon": "skincollection_carbon.jpg",
    "skin-sand": "skincollection_sand.jpg",
}


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    data = SCENES_JSON.read_text(encoding="utf-8")
    aspects = {s["slug"]: s["aspect"] for s in json.loads(data)}
    for name, file in SCENES.items():
        im = Image.open(SRC / file).convert("RGB")
        w, h = im.size
        if w > MAX_WIDTH:
            im = im.resize((MAX_WIDTH, round(MAX_WIDTH * h / w)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=82, method=6)
        digest = hashlib.sha256(buf.getvalue()).hexdigest()[:8]
        dest = OUT / f"{name}.{digest}.webp"
        for stale in [OUT / f"{name}.webp", *OUT.glob(f"{name}.*.webp")]:
            if stale != dest and stale.exists():
                stale.unlink()
        if not dest.exists():
            dest.write_bytes(buf.getvalue())

        # Hand-formatted JSON: replace the path in place rather than re-serialising.
        data = re.sub(rf'"/scenes/{re.escape(name)}(\.[0-9a-f]{{8}})?\.webp"', f'"/scenes/{dest.name}"', data)
        aw, ah = map(int, aspects[name].split("/"))
        assert abs(aw / ah - im.size[0] / im.size[1]) < 0.005, f"{name}: aspect {aspects[name]} != {im.size}"
        print(f"ok: {dest.relative_to(ROOT)} {im.size[0]}x{im.size[1]}")
    SCENES_JSON.write_text(data, encoding="utf-8")


if __name__ == "__main__":
    main()
