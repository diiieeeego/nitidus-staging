#!/usr/bin/env python3
"""Import Marplast dispensers/fixtures from docs/marplast_sifre.xlsx into data/marplast.json.

Stdlib only. Every product row of the sheet must be curated in MARPLAST below
or listed in SKIP, otherwise the script fails.

Colour rule: titanium is never imported. Skin-line products are limited to
bijela / stone / carbon; other lines keep their own colours (e.g. crna, satin).
Every dropped colour is logged in data/marplast.json -> "log".

Usage: python3 scripts/import_marplast.py [docs/marplast_sifre.xlsx]
"""
from __future__ import annotations

import io
import json
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from PIL import Image  # noqa: E402

from catalog_curation import COLORS  # noqa: E402
from extract_docx import slugify  # noqa: E402

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

SKIN_COLORS = {"bijela", "stone", "carbon"}
COLOR_MAP = {"bianco": "bijela", "carbon": "carbon", "stone": "stone", "nero": "crna",
             "grigio": "siva", "satin": "satin", "sand": "sand", "titanium": "titanium"}


def n(hr, en):
    return {"hr": hr, "en": en}


# sku -> curation. `fits` lists catalog product slugs this host accepts (from the sheet's
# "Interni artikl" column); `check` marks pairings that need confirmation.
MARPLAST = {
    "903": {"category": "dispenzeri-rucnici", "kind": "dispenser", "type": "towel_vfold",
            "name": n("Marplast Skin dispenzer za složive ručnike – 750 listića",
                      "Marplast Skin interfold towel dispenser – 750 sheets"),
            "desc": n("Dispenzer za složive papirnate ručnike kapaciteta 750 listića, linija Skin.",
                      "Dispenser for interfolded paper towels with a capacity of 750 sheets, Skin line."),
            "fits": ["slozivi-rucnici-cc21v", "slozivi-rucnici-cc21vx"]},
    "901": {"category": "dispenzeri-rucnici", "kind": "dispenser", "type": "towel_zfold",
            "name": n("Marplast Skin dispenzer za složive ručnike – 450 listića",
                      "Marplast Skin interfold towel dispenser – 450 sheets"),
            "desc": n("Dispenzer za složive papirnate ručnike kapaciteta 450 listića, linija Skin.",
                      "Dispenser for interfolded paper towels with a capacity of 450 sheets, Skin line."),
            "fits": ["slozivi-rucnici-ccz"]},
    "884": {"category": "dispenzeri-rucnici", "kind": "dispenser", "type": "towel_autocut",
            "name": n("Marplast Skin dispenzer za ručnike u roli s automatskim rezanjem",
                      "Marplast Skin automatic-cut roll towel dispenser"),
            "desc": n("Dispenzer za papirnate ručnike u roli s automatskim rezanjem, linija Skin.",
                      "Automatic-cut paper towel roll dispenser, Skin line."),
            "fits": ["rucnici-u-roli-ccac130"],
            "check": "Popis navodi \"CCAC140\" – u ponudi postoji samo CCAC130. Provjeriti i art. 889."},
    "935": {"category": "dispenzeri-rucnici", "kind": "dispenser", "type": "centerfeed",
            "name": n("Marplast Skin dispenzer za centralno izvlačenje – Maxi",
                      "Marplast Skin centrefeed dispenser – Maxi"),
            "desc": n("Dispenzer za papirnate role s centralnim izvlačenjem, veličina Maxi, linija Skin.",
                      "Centrefeed paper roll dispenser, Maxi size, Skin line."),
            "fits": ["rola-centralno-izvlacenje-ccsp104", "rola-centralno-izvlacenje-ccsp135"],
            "check": "Popis navodi \"CCSP105\" – u ponudi je CCSP104 (103,5 m)."},
    "932": {"category": "dispenzeri-toaletni-papir", "kind": "dispenser", "type": "toilet_centerfeed",
            "name": n("Marplast Skin dispenzer za centralno izvlačenje – Mini",
                      "Marplast Skin centrefeed dispenser – Mini"),
            "desc": n("Dispenzer za toaletni papir s centralnim izvlačenjem, veličina Mini, linija Skin.",
                      "Centrefeed toilet tissue dispenser, Mini size, Skin line."),
            "fits": ["toaletni-papir-cctms"]},
    "909": {"category": "dispenzeri-toaletni-papir", "kind": "dispenser", "type": "toilet_interfold",
            "name": n("Marplast Skin dispenzer za toaletni papir u listićima",
                      "Marplast Skin interfold toilet tissue dispenser"),
            "desc": n("Dispenzer za toaletni papir u listićima, linija Skin.",
                      "Interfold toilet tissue dispenser, Skin line."),
            "fits": ["toaletni-papir-cct-9000"]},
    "907": {"category": "dispenzeri-toaletni-papir", "kind": "dispenser", "type": "toilet_jumbo_mini",
            "name": n("Marplast Skin držač toaletnog papira Midi Jumbo",
                      "Marplast Skin Midi Jumbo toilet roll dispenser"),
            "desc": n("Držač jumbo role toaletnog papira, veličina Midi, linija Skin.",
                      "Jumbo toilet roll dispenser, Midi size, Skin line."),
            "fits": ["toaletni-papir-cctmj"],
            "check": "Na marplast.it naziv \"Midi Jumbo\" (bijela varijanta još nosi \"Mini\") – isti artikl."},
    "908": {"category": "dispenzeri-toaletni-papir", "kind": "dispenser", "type": "toilet_jumbo_maxi",
            "name": n("Marplast Skin držač toaletnog papira Maxi Jumbo",
                      "Marplast Skin Maxi Jumbo toilet roll dispenser"),
            "desc": n("Držač jumbo role toaletnog papira, veličina Maxi, linija Skin.",
                      "Jumbo toilet roll dispenser, Maxi size, Skin line."),
            "fits": ["toaletni-papir-cctmxj"]},
    "914": {"category": "dozatori-sapuna", "kind": "dispenser", "type": "soap_foam",
            "name": n("Marplast Skin dozator pjenastog sapuna 0,5/0,8 L",
                      "Marplast Skin foam soap dispenser 0.5/0.8 L"),
            "desc": n("Dozator pjenastog sapuna za uloške od 0,5 i 0,8 L, linija Skin.",
                      "Foam soap dispenser for 0.5 and 0.8 L cartridges, Skin line."),
            "fits": ["pjenasti-sapun-za-ruke-za-drzace-0-5-l"]},
    "912": {"category": "dozatori-sapuna", "kind": "dispenser", "type": "soap_liquid",
            "name": n("Marplast Skin dozator tekućeg sapuna 0,5 L",
                      "Marplast Skin liquid soap dispenser 0.5 L"),
            "desc": n("Dozator tekućeg sapuna za uloške od 0,5 L, linija Skin.",
                      "Liquid soap dispenser for 0.5 L cartridges, Skin line."),
            "fits": ["tekuci-sapun-za-ruke-za-drzace-0-5-l"]},
    "929": {"category": "wc-oprema", "kind": "other",
            "name": n("Marplast Skin zidni držač WC četke", "Marplast Skin wall-mounted toilet brush holder"),
            "desc": n("Zidni držač WC četke, linija Skin.", "Wall-mounted toilet brush holder, Skin line.")},
    "740": {"category": "kante-za-smece", "kind": "other",
            "name": n("Marplast Skin kanta za smeće s poklopcem 23 L", "Marplast Skin waste bin with lid 23 L"),
            "desc": n("Kanta za smeće od 23 L s poklopcem i držačem vreće, linija Skin.",
                      "23 L waste bin with lid and bag retainer, Skin line.")},
    "760": {"category": "dozatori-sapuna", "kind": "dispenser", "type": "paste",
            "name": n("Marplast Plus dispenzer za industrijsku pastu 3 L",
                      "Marplast Plus hand paste dispenser 3 L"),
            "desc": n("Dispenzer za industrijsku pastu za pranje ruku, 3 L, linija Plus. Koristi Bag Volflex "
                      "uložak (GEL/GRIT FLUIDE).",
                      "Dispenser for industrial hand cleaning paste, 3 L, Plus line. Uses Bag Volflex "
                      "cartridges (GEL/GRIT FLUIDE)."),
            "fits": ["industrijska-pasta-za-ruke-3-l"],
            "auto": True,
            "check": "Dispenzer koristi Bag Volflex uložak – provjeriti odgovara li naša industrijska pasta 3 L."},
    "565": {"category": "kante-za-smece", "kind": "other",
            "name": n("Marplast kanta za papir 6 L", "Marplast waste paper bin 6 L"),
            "desc": n("Kanta za papir od 6 L.", "6 L waste paper bin.")},
    "579": {"category": "kante-za-smece", "kind": "other",
            "name": n("Marplast pravokutna kanta za smeće 8 L", "Marplast rectangular waste bin 8 L"),
            "desc": n("Pravokutna kanta za smeće od 8 L.", "Rectangular 8 L waste bin."),
            "fits": ["marplast-580-poklopac-na-preklop-za-kantu-579"],
            "check_fits": {"marplast-580-poklopac-na-preklop-za-kantu-579":
                           "Art. 580 predložen umjesto 883 (883 je držač za pelene, ne poklopac)."}},
    "664": {"category": "kante-za-smece", "kind": "other",
            "name": n("Marplast zidni nosač za kantu 579", "Marplast wall bracket for bin 579"),
            "desc": n("Zidni nosač za pravokutnu kantu art. 579.", "Wall bracket for rectangular bin art. 579."),
            "fits": ["marplast-579-pravokutna-kanta-za-smece-8-l"]},
    "580": {"category": "kante-za-smece", "kind": "other",
            "name": n("Marplast poklopac na preklop za kantu 579", "Marplast swing lid for bin 579"),
            "desc": n("Poklopac na preklop za pravokutnu kantu art. 579.", "Swing lid for rectangular bin art. 579.")},
}

# Product photos in docs/dispenseri_nitidus (supplied by Nitidus), first = main image.
IMAGE_DIR = ROOT / "docs" / "dispenseri_nitidus"
IMAGES = {
    "901": ["901-bianco_dispenser-carta-asciugamani_marplast.jpg", "901-stone_dispenser-carta-asciugamani_marplast.jpg"],
    "914": ["914-stone_dispenser-sapone-a-ricarica_marplast.jpg"],
    "885": ["885_sand_towel_paper_dispesner_marplast_automatic.png"],
    "911": ["911-bianco_dispenser-sapone-a-riempimento_marplast.jpg"],
    "923": ["923-sand_dispenser-sapone-a-ricarica.jpg"],
    "943": ["943-carbon_dispenser-sapone-a-riempimento_marplast.jpg"],
    "949": ["949-carbon_dispenser-carta-compact_towel_marplast.jpg"],
}

# Models known only from the supplied photos (not in the xlsx). Names come from the
# Italian file names; colours only where the photo shows an allowed colour.
FROM_IMAGES = {
    "885": {"category": "dispenzeri-rucnici", "kind": "dispenser", "type": "towel_autocut", "line": "Skin",
            "colors": [],
            "name": n("Marplast Skin automatski dispenzer za ručnike u roli (senzor)",
                      "Marplast Skin automatic roll towel dispenser (sensor)"),
            "desc": n("Beskontaktni dispenzer za papirnate ručnike u roli sa senzorom, linija Skin.",
                      "Touch-free sensor paper towel roll dispenser, Skin line."),
            "fits": ["rucnici-u-roli-ccac130"],
            "check": "Model samo sa slike (boja Sand) – provjeriti kompatibilnost role i dostupne boje."},
    "911": {"category": "dozatori-sapuna", "kind": "dispenser", "type": "soap_bulk", "line": "Skin",
            "colors": ["bijela"],
            "name": n("Marplast Skin dozator sapuna s punjenjem", "Marplast Skin refillable soap dispenser"),
            "desc": n("Dozator tekućeg sapuna koji se puni iz kanistra, linija Skin.",
                      "Refillable liquid soap dispenser (topped up from a canister), Skin line."),
            "fits": ["tekuci-sapun-za-ruke-5-l"],
            "check": "Model samo sa slike – pretpostavka: puni se tekućim sapunom 5 L."},
    "923": {"category": "dozatori-sapuna", "kind": "dispenser", "type": "soap_liquid", "line": "Skin",
            "colors": [],
            "name": n("Marplast Skin automatski dozator sapuna za uloške (senzor)",
                      "Marplast Skin automatic cartridge soap dispenser (sensor)"),
            "desc": n("Beskontaktni dozator sapuna za uloške sa senzorom, linija Skin.",
                      "Touch-free sensor soap dispenser for cartridges, Skin line."),
            "fits": ["tekuci-sapun-za-ruke-za-drzace-0-5-l"],
            "check": "Model samo sa slike (boja Sand) – provjeriti koji uložak prima i dostupne boje."},
    "943": {"category": "dozatori-sapuna", "kind": "dispenser", "type": "soap_bulk", "line": "Skin",
            "colors": ["carbon"],
            "name": n("Marplast Skin dozator sapuna s punjenjem i polugom",
                      "Marplast Skin refillable soap dispenser with lever"),
            "desc": n("Dozator tekućeg sapuna s polugom koji se puni iz kanistra, linija Skin.",
                      "Lever-operated refillable liquid soap dispenser (topped up from a canister), Skin line."),
            "fits": ["tekuci-sapun-za-ruke-5-l"],
            "check": "Model samo sa slike – pretpostavka: puni se tekućim sapunom 5 L."},
    "949": {"category": "dispenzeri-rucnici", "kind": "dispenser", "type": "towel_vfold", "line": "Skin",
            "colors": ["carbon"],
            "name": n("Marplast Skin dispenzer za složive ručnike – Compact",
                      "Marplast Skin interfold towel dispenser – Compact"),
            "desc": n("Kompaktni dispenzer za složive papirnate ručnike, linija Skin.",
                      "Compact dispenser for interfolded paper towels, Skin line."),
            "fits": ["slozivi-rucnici-cc21v", "slozivi-rucnici-cc21vx"],
            "check": "Model samo sa slike – provjeriti koje složive ručnike prima."},
}

SKIP = {"883": "Pogrešan artikl u popisu (držač za pelene, ne poklopac) – zamijenjen art. 580."}

# Paper products the sheet marks as discontinued ("ukinut") -> hidden from the site.
DISCONTINUED = {"CCAC80": "\"AC80 ukinut\" (red 884)", "CCSP46": "\"CCSP46 ukinut\" (red 935)"}


def save_product_images(sku: str, slug: str) -> list[str]:
    paths = []
    for i, file in enumerate(IMAGES.get(sku, [])):
        im = Image.open(IMAGE_DIR / file)
        im.load()
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        if im.mode == "RGBA" and im.getextrema()[3][0] == 255:
            im = im.convert("RGB")
        if sku == "885":  # photo on black background – flatten to white for the catalog
            im = flatten_black(im)
        im.thumbnail((1200, 1200), Image.LANCZOS)
        name = f"{slug}{'' if i == 0 else '-' + str(i + 1)}.webp"
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=82, method=6)
        dest = ROOT / "public" / "products" / name
        if not dest.exists() or dest.read_bytes() != buf.getvalue():
            dest.write_bytes(buf.getvalue())
        paths.append(f"/products/{name}")
    return paths


def flatten_black(im: Image.Image) -> Image.Image:
    """Replace the near-black background connected to the image border with white."""
    from PIL import ImageDraw
    rgb = im.convert("RGB")
    w, h = rgb.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if max(rgb.getpixel(seed)) < 30:
            ImageDraw.floodfill(rgb, seed, (255, 255, 255), thresh=28)
    return rgb


def read_sheet(path: Path) -> list[dict]:
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).iter(NS + "si"):
            shared.append("".join(t.text or "" for t in si.iter(NS + "t")))
    rows = []
    for row in ET.fromstring(z.read("xl/worksheets/sheet1.xml")).iter(NS + "row"):
        cells = {}
        for c in row.iter(NS + "c"):
            col = "".join(ch for ch in c.get("r") if ch.isalpha())
            v, inline = c.find(NS + "v"), c.find(NS + "is")
            if c.get("t") == "s" and v is not None:
                cells[col] = shared[int(v.text)]
            elif inline is not None:
                cells[col] = "".join(t.text or "" for t in inline.iter(NS + "t"))
            elif v is not None:
                cells[col] = v.text or ""
        rows.append(cells)
    header = rows[0]
    keys = {"A": "sku", "B": "internal", "C": "original_name", "D": "line", "E": "colors",
            "F": "status", "G": "note", "H": "link"}
    assert header.get("A") == "Šifra" and header.get("H") == "Link", f"unexpected header: {header}"
    return [{keys[k]: v.strip() for k, v in r.items() if k in keys}
            for r in rows[1:] if r.get("A", "").strip().isdigit()]


def main(path: Path) -> None:
    rows = read_sheet(path)
    for sku in FROM_IMAGES:
        rows.append({"sku": sku, "line": FROM_IMAGES[sku]["line"], "colors": "", "from_images": True})
    errors, log, products, edges = [], [], [], []

    for r in rows:
        sku = r["sku"]
        if sku in SKIP:
            log.append(f"preskočen art. {sku}: {SKIP[sku]}")
            continue
        spec = FROM_IMAGES.get(sku) if r.get("from_images") else MARPLAST.get(sku)
        if not spec:
            errors.append(f"sheet row {sku} not curated")
            continue
        skin = r.get("line") == "Skin"
        colors = []
        for raw in r.get("colors", "").split(","):
            base = raw.strip().split("/")[0].strip().lower()
            if not base:
                continue
            key = COLOR_MAP.get(base)
            if key is None:
                errors.append(f"{sku}: unknown colour {raw!r}")
            elif key == "titanium":
                log.append(f"art. {sku}: boja \"{raw.strip()}\" preskočena (titanium)")
            elif skin and key not in SKIN_COLORS:
                log.append(f"art. {sku}: boja \"{raw.strip()}\" preskočena (Skin linija: samo bijela/stone/carbon)")
            elif key not in colors:
                colors.append(key)
        if r.get("from_images"):
            colors = list(spec["colors"])

        slug = slugify(f"marplast {sku} {spec['name']['hr'].replace('Marplast ', '').replace('Skin ', '').replace('Plus ', '')}")
        specs = [{"key": "manufacturer_code", "value": sku}]
        if r.get("line") and r["line"] != "—":
            specs.append({"key": "line", "value": r["line"]})
        products.append({
            "slug": slug,
            "sku": sku,
            "category": spec["category"],
            "brand": "marplast",
            "kind": spec["kind"],
            "is_active": True,
            "name": spec["name"],
            "short_description": spec["desc"],
            "description": {"hr": [spec["desc"]["hr"]], "en": [spec["desc"]["en"]]},
            "specs": specs,
            "variants": [{"label": COLORS[c], "color": c, "size": None, "sku": None} for c in colors],
            "images": save_product_images(sku, slug),
            "manufacturer_url": r.get("link") or None,
            "dispenser_type": spec.get("type"),
            "sort": 1000 + len(products),
        })
        for fits in spec.get("fits", []):
            check = spec.get("check_fits", {}).get(fits) or spec.get("check")
            if spec.get("auto"):
                note = "auto:format" + (f" – {check}" if check else "")
            elif check:
                note = f"check – {check}"
            else:
                note = None  # pairing given in the sheet's "Interni artikl" column
            edges.append({"host": slug, "fits": fits, "note": note})

    # resolve forward references (e.g. 579 -> 580) and validate targets
    known = {p["slug"] for p in products}
    catalog = json.loads((ROOT / "data" / "catalog.json").read_text(encoding="utf8"))
    known |= {p["slug"] for p in catalog["products"]}
    for e in edges:
        if e["fits"] not in known:
            errors.append(f"edge target not found: {e['fits']}")

    if errors:
        print("\n".join("ERROR " + e for e in errors), file=sys.stderr)
        raise SystemExit(1)

    out = {"products": products, "compatibility": edges,
           "discontinued": [{"sku": k, "reason": v} for k, v in DISCONTINUED.items()], "log": log}
    (ROOT / "data" / "marplast.json").write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"ok: {len(products)} Marplast products, {len(edges)} compatibility edges")
    for line in log:
        print("  log:", line)


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs" / "marplast_sifre.xlsx")
