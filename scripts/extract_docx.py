#!/usr/bin/env python3
"""Extract the Nitidus catalog from the offer .docx into data/catalog.json.

Stdlib + Pillow only (no python-docx needed). Reads per table row ONLY the
image cell (column 1) and the text cell (column 2); quantity and price columns
are never read, so no price can leak into the output.

Every product row in the document must be claimed by an entry in
scripts/catalog_curation.py (or listed in its SKIP), otherwise the script
fails -- nothing is silently dropped.

Usage:  python3 scripts/extract_docx.py ["docs/Nitudus d.o.o ponuda.docx"]
Output: data/catalog.json, data/catalog.review.md,
        public/products/*.webp, public/brands/*.webp
The output is deterministic: re-running on the same input yields identical files.
"""
from __future__ import annotations

import io
import json
import re
import sys
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import catalog_curation as cur  # noqa: E402

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PKG_REL = "{http://schemas.openxmlformats.org/package/2006/relationships}"

MAX_IMAGE_PX = 1200
PRICE_RE = re.compile(r"\d+[.,]\d{2}\s*€|€\s*\d")


# --------------------------------------------------------------------------- docx parsing
def cell_lines(el: ET.Element) -> list[str]:
    out: list[str] = []
    for p in el.iter(W + "p"):
        buf = ""
        for r in p.iter(W + "r"):
            for ch in r:
                if ch.tag == W + "t":
                    buf += ch.text or ""
                elif ch.tag == W + "br":
                    buf += "\n"
                elif ch.tag == W + "tab":
                    buf += " "
        out.extend(line.strip() for line in buf.split("\n") if line.strip())
    return out


def normalize_key(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def parse_docx(path: Path):
    z = zipfile.ZipFile(path)
    rels_root = ET.fromstring(z.read("word/_rels/document.xml.rels"))
    rels = {r.get("Id"): "word/" + r.get("Target") for r in rels_root.iter(PKG_REL + "Relationship")}
    body = ET.fromstring(z.read("word/document.xml")).find(W + "body")

    rows: list[dict] = []
    para_lines: list[dict] = []  # free paragraphs after the Kraft heading
    in_kraft = False
    for el in body:
        if el.tag == W + "p":
            text = " ".join(cell_lines(el))
            blips = [b.get(R + "embed") for b in el.iter(A + "blip")]
            if text.strip().upper() == "KRAFT ASORTIMAN":
                in_kraft = True
                continue
            if in_kraft and text.strip():
                para_lines.append({"text": normalize_key(text), "images": blips})
        elif el.tag == W + "tbl":
            for tr in el.findall(W + "tr"):
                cells = tr.findall(W + "tc")
                if len(cells) < 2:
                    continue  # subcategory heading rows
                image_cell, text_cell = cells[0], cells[1]
                lines = cell_lines(text_cell)
                if not lines or lines[0] == "Opis proizvoda":
                    continue  # repeated column header rows
                images = [b.get(R + "embed") for b in image_cell.iter(A + "blip")]
                rows.append({"key": normalize_key(lines[0]), "lines": lines, "images": images})
    return z, rels, rows, para_lines


# --------------------------------------------------------------------------- text helpers
def slugify(s: str) -> str:
    s = s.replace("đ", "d").replace("Đ", "D").replace("–", "-")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-{2,}", "-", s)


def fix_typos(s: str) -> str:
    for wrong, right in cur.TYPO_FIXES:
        s = s.replace(wrong, right)
    return re.sub(r"[ \t]{2,}", " ", s).strip()


def split_bullets(lines: list[str]) -> list[str]:
    """Normalise description lines: split merged bullets, join wrapped lines."""
    out: list[str] = []
    for raw in lines:
        line = fix_typos(raw).replace(" – ", " - ").strip()
        # "-  2 slojan- papirnata rola" -> two bullets
        line = re.sub(r"(?<=[a-zčćžšđ])-\s+(?=[a-zčćžšđ])", "\n- ", line)
        # "... korištenje. - Svojom jakošću" -> two bullets
        line = re.sub(r"\s+-\s*(?=[A-ZČĆŠŽĐa-zčćžšđ0-9])", "\n- ", line)
        for part in line.split("\n"):
            part = part.strip()
            if not part:
                continue
            is_bullet = part.startswith(("-", "–"))
            if is_bullet:
                part = part.lstrip("-– ").strip()
                part = "- " + part[:1].upper() + part[1:]
            prev = out[-1] if out else None
            if (not is_bullet and prev is not None and not prev.endswith((".", ":", ")"))
                    and not part.isupper()):
                out[-1] = prev + " " + part
            else:
                out.append(part)
    return [fix_typos(x) for x in out]


def first_sentence(lines: list[str], limit: int = 160) -> str:
    if lines[0].startswith("- "):
        lines = lines[:1]  # bullet list: the first bullet only
    text = " ".join(x.lstrip("- ").strip() for x in lines)
    m = re.match(r"(.+?[.!])(\s|$)", text)
    s = m.group(1) if m else text
    if len(s) > limit:
        s = s[: limit - 1].rsplit(" ", 1)[0] + "…"
    return s


# --------------------------------------------------------------------------- images
def save_webp(z: zipfile.ZipFile, member: str, dest: Path) -> None:
    im = Image.open(io.BytesIO(z.read(member)))
    im.load()
    if member in cur.IMAGE_CROPS:
        im = im.crop(cur.IMAGE_CROPS[member])
    if getattr(im, "is_animated", False):
        im.seek(0)
    has_alpha = im.mode in ("RGBA", "LA", "P") and (
        im.mode != "P" or "transparency" in im.info)
    im = im.convert("RGBA" if has_alpha else "RGB")
    im.thumbnail((MAX_IMAGE_PX, MAX_IMAGE_PX), Image.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=82, method=6)
    data = buf.getvalue()
    if not dest.exists() or dest.read_bytes() != data:  # keep mtime stable on re-run
        dest.write_bytes(data)


# --------------------------------------------------------------------------- specs
def paper_specs(lines: list[str]) -> list[dict]:
    """Parse the bullet list of a paper product into ordered spec entries."""
    specs: list[dict] = []
    unparsed: list[str] = []

    def add(key, value):
        specs.append({"key": key, "value": value})

    for line in lines:
        t = line.lstrip("- ").strip()
        tl = t.lower()
        if m := re.match(r"(\d)\s*sloj", tl):
            add("ply", m.group(1))
        elif m := re.match(r"(v|z) preklop \(fold\)\s*,\s*(\w+)", tl):
            add("fold", m.group(1).upper())
            add("color", cur.COLORS[m.group(2)])
        elif m := re.match(r"(papirnata|industrijska|medicinska) rola\s*,\s*(\w+)", tl):
            add("format", cur.PAPER_FORMATS[m.group(1)])
            add("color", cur.COLORS[m.group(2)])
        elif m := re.match(r"salvete\s*,\s*(\w+)", tl):
            add("color", cur.COLORS[m.group(1)])
        elif tl == "100% celuloza":
            add("material", {"hr": "100 % celuloza", "en": "100% cellulose"})
        elif m := re.match(r"duljina(?: role)? ([\d,]+)\s*m(?:etara)?(?: \((\d+|\?) listića\))?$", tl):
            add("length", m.group(1) + " m")
            if m.group(2) and m.group(2) != "?":
                add("sheets", m.group(2))
        elif m := re.match(r"širina role ([\d,]+) cm", tl):
            add("width", m.group(1) + " cm")
        elif m := re.match(r"(\d+) listića$", tl):
            add("sheets", m.group(1))
        elif m := re.match(r"(\d+) komada$", tl):
            add("pieces", m.group(1))
        elif m := re.match(r"dimenzij[ae] ([\d,]+)\s*x\s*([\d,]+)\s*(cm)?", tl):
            add("sheet_size", f"{m.group(1)} × {m.group(2)} cm")
        elif m := re.match(r"pakiranje (\d+) \((\d+) listića\)", tl):
            add("pack", {"hr": f"{m.group(1)} kom ({m.group(2)} listića)",
                         "en": f"{m.group(1)} pcs ({m.group(2)} sheets)"})
        elif m := re.match(r"(\d+) (rola|komada) u pakiranju", tl):
            add("pack", {"hr": f"{m.group(1)} kom", "en": f"{m.group(1)} pcs"})
        elif m := re.match(r"(\d+)/(\d+) (u paketu|komada u pakiranju)", tl):
            add("pack_unit", {"hr": f"{m.group(1)} kom u paketu", "en": f"{m.group(1)} pcs per bundle"})
        else:
            unparsed.append(line)
    if unparsed:
        raise SystemExit(f"paper spec lines not understood: {unparsed}")
    return specs


def paper_short(specs: list[dict]) -> tuple[str, str]:
    v = {s["key"]: s["value"] for s in specs}
    hr: list[str] = []
    en: list[str] = []
    if "ply" in v:
        hr.append(f"{v['ply']}-slojni")
        en.append(f"{v['ply']}-ply")
    if "fold" in v:
        hr.append(f"{v['fold']} preklop")
        en.append(f"{v['fold']}-fold")
    if "material" in v:
        hr.append(v["material"]["hr"])
        en.append(v["material"]["en"])
    if "length" in v:
        hr.append(v["length"])
        en.append(v["length"].replace(",", "."))
    if "sheet_size" in v:
        hr.append(v["sheet_size"])
        en.append(v["sheet_size"].replace(",", "."))
    return " · ".join(hr), " · ".join(en)


# --------------------------------------------------------------------------- build
def build(docx_path: Path) -> None:
    z, rels, rows, kraft_lines = parse_docx(docx_path)
    by_key: dict[str, list[dict]] = {}
    for r in rows:
        by_key.setdefault(r["key"], []).append(r)

    claimed: set[str] = set()
    errors: list[str] = []
    products: list[dict] = []
    images_written: set[str] = set()

    category_ids = {c["slug"] for c in cur.CATEGORIES}
    brand_ids = {b["slug"] for b in cur.BRANDS}

    for sort, spec in enumerate(cur.PRODUCTS):
        src_rows: list[dict] = []
        for key in spec.get("rows", []):
            found = by_key.get(key)
            if not found:
                errors.append(f"curation row not found in docx: {key!r}")
                continue
            if key in claimed and key not in cur.SHARED_ROWS:
                errors.append(f"row claimed twice: {key!r}")
            claimed.add(key)
            src_rows.extend(found)

        name_hr = spec["name"]["hr"]
        sku = spec.get("sku")
        slug = spec.get("slug") or slugify(spec.get("slug_base", name_hr) + (f" {sku}" if sku else ""))

        if spec["category"] not in category_ids:
            errors.append(f"{slug}: unknown category {spec['category']}")
        if spec.get("brand") and spec["brand"] not in brand_ids:
            errors.append(f"{slug}: unknown brand {spec['brand']}")

        # description = each row's lines after its title lines (deduplicated, in order)
        title_lines = spec.get("title_lines", 1)
        desc_src: list[str] = []
        for r in src_rows:
            n = title_lines.get(r["key"], 1) if isinstance(title_lines, dict) else title_lines
            desc_src.extend(l for l in r["lines"][n:] if l not in desc_src)
        desc_hr = spec.get("description_hr") or split_bullets(desc_src)

        specs = list(spec.get("specs", []))
        if spec.get("paper"):
            specs = paper_specs(split_bullets(desc_src)) + specs
            desc_hr = spec.get("description_hr", [])

        desc_en = spec.get("description_en", [])
        if desc_hr and not desc_en:
            errors.append(f"{slug}: missing description_en")

        if spec.get("paper"):
            short_hr, short_en = paper_short(specs)
        else:
            short_hr = first_sentence(desc_hr) if desc_hr else ""
            short_en = first_sentence(desc_en) if desc_en else ""

        images: list[str] = []
        seen_media: set[str] = set()
        for r in src_rows:
            for rid in r["images"]:
                member = rels[rid]
                if member in seen_media:
                    continue
                seen_media.add(member)
                fname = f"{slug}{'' if not images else '-' + str(len(images) + 1)}.webp"
                save_webp(z, member, ROOT / "public" / "products" / fname)
                images_written.add(fname)
                images.append(f"/products/{fname}")

        products.append({
            "slug": slug,
            "sku": sku,
            "category": spec["category"],
            "brand": spec.get("brand"),
            "kind": spec["kind"],
            "is_active": True,
            "name": {"hr": name_hr, "en": spec["name"]["en"]},
            "short_description": {"hr": short_hr, "en": short_en},
            "description": {"hr": desc_hr, "en": desc_en},
            "specs": specs,
            "variants": [
                {"label": v["label"], "color": v.get("color"), "size": v.get("size"), "sku": v.get("sku")}
                for v in spec.get("variants", [])
            ],
            "images": images,
            "sort": sort,
        })

    # Kraft list: plain paragraphs, one product each, placeholder image
    kraft_names = {k: v for k, v in cur.KRAFT.items()}
    kraft_seen = set()
    for i, line in enumerate(kraft_lines):
        text = line["text"]
        key = f"{text}#{sum(1 for l in kraft_lines[:i] if l['text'] == text)}"
        names = kraft_names.get(key) or kraft_names.get(text)
        if not names:
            errors.append(f"kraft line without curation: {text!r}")
            continue
        kraft_seen.add(key if key in kraft_names else text)
        products.append({
            "slug": slugify(names["hr"]),
            "sku": None,
            "category": cur.KRAFT_CATEGORY,
            "brand": None,
            "kind": "packaging",
            "is_active": True,
            "name": names,
            "short_description": {"hr": "", "en": ""},
            "description": {"hr": [], "en": []},
            "specs": [],
            "variants": [],
            "images": [],
            "sort": len(cur.PRODUCTS) + i,
        })

    unclaimed = sorted(set(by_key) - claimed - set(cur.SKIP))
    if unclaimed:
        errors.append("docx rows not covered by curation: " + "; ".join(map(repr, unclaimed)))
    for k in set(kraft_names) - kraft_seen:
        errors.append(f"kraft curation entry not used: {k!r}")

    slugs = [p["slug"] for p in products]
    dupes = {s for s in slugs if slugs.count(s) > 1}
    if dupes:
        errors.append(f"duplicate slugs: {sorted(dupes)}")
    skus = [p["sku"] for p in products if p["sku"]]
    if len(skus) != len(set(skus)):
        errors.append("duplicate skus")

    # brand logos embedded as free images in the docx
    brands = []
    for b in cur.BRANDS:
        entry = {k: b.get(k) for k in ("slug", "name", "url")}
        entry["logo"] = None
        if b.get("logo_rid"):
            fname = f"{b['slug']}.webp"
            save_webp(z, rels[b["logo_rid"]], ROOT / "public" / "brands" / fname)
            entry["logo"] = f"/brands/{fname}"
        brands.append(entry)

    blob = json.dumps(products, ensure_ascii=False)
    if PRICE_RE.search(blob):
        errors.append("price-like text found in product data: " + PRICE_RE.search(blob).group(0))

    if errors:
        print("\n".join("ERROR " + e for e in errors), file=sys.stderr)
        raise SystemExit(1)

    # remove stale product images from earlier runs
    for f in (ROOT / "public" / "products").glob("*.webp"):
        if f.name not in images_written:
            f.unlink()

    categories = []
    for sort, c in enumerate(cur.CATEGORIES):
        image = None
        if c.get("image_rid"):
            fname = f"{c['slug']}.webp"
            save_webp(z, rels[c["image_rid"]], ROOT / "public" / "categories" / fname)
            image = f"/categories/{fname}"
        categories.append({"slug": c["slug"], "parent": c["parent"], "name": c["name"],
                           "image": image, "sort": sort})

    catalog = {
        "categories": categories,
        "brands": brands,
        "products": products,
    }
    out = ROOT / "data" / "catalog.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    write_review(catalog)
    print(f"ok: {len(products)} products, {len(images_written)} images, {len(brands)} brands -> {out.relative_to(ROOT)}")


def write_review(catalog: dict) -> None:
    cats = {c["slug"]: c for c in catalog["categories"]}

    def cat_path(slug):
        c = cats[slug]
        return (cat_path(c["parent"]) + " › " if c.get("parent") else "") + c["name"]["hr"]

    lines = [
        "# Pregled kataloga (generirano – ne uređivati ručno)",
        "",
        "Izvor: `docs/Nitudus d.o.o ponuda.docx` → `scripts/extract_docx.py` + `scripts/catalog_curation.py`.",
        "Cijene i količine se ne čitaju. EN nazivi su moj prijevod – molim provjeru.",
        "",
        f"Ukupno proizvoda: **{len(catalog['products'])}**",
        "",
        "| # | Šifra | Naziv (hr) | Naziv (en) | Kategorija | Varijante | Slika |",
        "|---|---|---|---|---|---|---|",
    ]
    for i, p in enumerate(catalog["products"], 1):
        variants = ", ".join(v["label"]["hr"] for v in p["variants"]) or "–"
        lines.append(
            f"| {i} | {p['sku'] or '–'} | {p['name']['hr']} | {p['name']['en']} | {cat_path(p['category'])} "
            f"| {variants} | {'da' if p['images'] else 'ne'} |"
        )
    lines += ["", "## Napomene za provjeru", ""] + [f"- {n}" for n in cur.REVIEW_NOTES]
    (ROOT / "data" / "catalog.review.md").write_text("\n".join(lines) + "\n", encoding="utf8")


if __name__ == "__main__":
    build(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs" / "Nitudus d.o.o ponuda.docx")
