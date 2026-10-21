#!/usr/bin/env python3
"""Build data/compatibility.json, data/relations.json, data/featured.json and
data/compatibility.review.md from data/catalog.json + data/marplast.json.

Run after extract_docx.py and import_marplast.py. Deterministic.

Edge notes: null = pairing confirmed (Marplast sheet "Interni artikl" column);
"check – …" = confirmed pairing with an open question; "auto:format" = rule-based
assumption awaiting confirmation.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# --------------------------------------------------------------------------- Vermop rules (auto)
SPRINT_HOLDER = "drzac-mopa-sprint-plus-40-cm"
CLIPPER_HOLDER = "drzac-mopa-clipper-40-cm"
SCANDIC_HOLDER = "scandic-mono-drzac-mopa"
TWIX_HOLDER = "twix-drzac-mopa-30-cm"
DAMP_HOLDER = "vermop-drzac-mopa-damp"
MOCO_HOLDER = "vermop-drzac-moca-profi"

VERMOP = [
    (SPRINT_HOLDER, ["mop-sprint-plus-basic-40-cm", "mop-sprint-brush-progressive-40-cm",
                     "mop-sprint-plus-tronic-40-cm", "mop-sprint-white-magic-40-cm", "mop-sprint-blue-40-cm"], None),
    (CLIPPER_HOLDER, ["mop-clipper-basic-40-cm", "mop-clipper-tronic-40-cm", "mop-clipper-white-magic-40-cm"], None),
    (SCANDIC_HOLDER, ["mop-scandic-mono-white-magic-28-cm"], "samo držač 28 cm"),
    (SCANDIC_HOLDER, ["mop-scandic-mono-ceran"], "mop iste širine kao držač"),
    (TWIX_HOLDER, ["mop-twix-tronic-30-cm", "mop-twix-white-magic-30-cm", "mop-twix-ceran-30-cm",
                   "mop-twix-red-30-cm", "mop-twix-progressive-30-cm"], None),
    (DAMP_HOLDER, ["vermop-damp-mop-basic"], "mop iste širine kao držač"),
    (MOCO_HOLDER, ["vermop-moco-aqua-basic"], None),
]
HANDLES = ["aluminijski-stap-140-cm", "scandic-teleskopski-stap-100-170-cm",
           "scandic-teleskopski-stap-s-rotirajucom-kuglom-80-171-cm"]
HANDLE_HOSTS = [SPRINT_HOLDER, CLIPPER_HOLDER, SCANDIC_HOLDER, TWIX_HOLDER, DAMP_HOLDER]

# --------------------------------------------------------------------------- generic relations (both directions)
RELATED_PAIRS = [
    ("tekuci-sapun-za-ruke-5-l", "tekuci-sapun-za-ruke-za-drzace-0-5-l"),
    ("pjenasti-sapun-za-ruke-5-l", "pjenasti-sapun-za-ruke-za-drzace-0-5-l"),
    ("shopster-twix-press-kolica", TWIX_HOLDER),
    ("vermop-wringboy-kanta-s-ocjedivacem", SPRINT_HOLDER),
    ("aqua-wet-kolica-za-mop-1-17-l-1-6-l", SPRINT_HOLDER),
    ("scandic-x-adapteri", "scandic-teleskopski-stap-s-rotirajucom-kuglom-80-171-cm"),
    ("scandic-x-adapteri", "scandic-teleskopski-stap-100-170-cm"),
    ("vjestica-pamucna-300-g-bez-drske", "kanta-s-cjedilom-13-l"),
    ("vjestica-pamucna-300-g-bez-drske", "drska-drvena-120-cm"),
    ("metla-industrijska", "drska-drvena-120-cm"),
    ("metla-allegra", "drska-pvc-120-cm"),
    ("metla-helen", "drska-kromirana-130-cm"),
    ("cetka-za-wc", "marplast-929-zidni-drzac-wc-cetke"),
    ("sredstvo-za-dezinfekciju-ruku", "tekuci-sapun-za-ruke-za-drzace-0-5-l"),
    ("mirisi-za-dozatore-250-ml", "osvjezivaci-prostora-300-ml"),
    ("vrece-za-smece-ld-crne", "marplast-740-kanta-za-smece-s-poklopcem-23-l"),
]

# --------------------------------------------------------------------------- featured fallback (no docs/udarni.txt)
# Marplast dispensers + one key consumable per dispenser type.
FEATURED_CONSUMABLES = [
    "slozivi-rucnici-cc21v", "slozivi-rucnici-ccz", "rucnici-u-roli-ccac130",
    "rola-centralno-izvlacenje-ccsp135", "toaletni-papir-cctms", "toaletni-papir-cct-9000",
    "toaletni-papir-cctmj", "toaletni-papir-cctmxj", "tekuci-sapun-za-ruke-za-drzace-0-5-l",
    "pjenasti-sapun-za-ruke-za-drzace-0-5-l", "industrijska-pasta-za-ruke-3-l",
]


def main() -> None:
    catalog = json.loads((DATA / "catalog.json").read_text(encoding="utf8"))
    marplast = json.loads((DATA / "marplast.json").read_text(encoding="utf8"))
    products = {p["slug"]: p for p in catalog["products"] + marplast["products"]}
    discontinued = {d["sku"] for d in marplast["discontinued"]}
    inactive = {p["slug"] for p in products.values() if p["sku"] in discontinued}

    edges = list(marplast["compatibility"])
    for host, fits_list, extra in VERMOP:
        for fits in fits_list:
            edges.append({"host": host, "fits": fits, "note": "auto:format" + (f" – {extra}" if extra else "")})
    for host in HANDLE_HOSTS:
        for handle in HANDLES:
            edges.append({"host": host, "fits": handle, "note": "auto:format – štap Ø 23,5 mm"})

    relations = []
    for a, b in RELATED_PAIRS:
        relations += [{"product": a, "related": b}, {"product": b, "related": a}]

    dispensers = [p for p in marplast["products"] if p["kind"] == "dispenser"]
    dispensers.sort(key=lambda p: not p["images"])  # photographed dispensers first (stable sort)
    featured = [p["slug"] for p in dispensers] + FEATURED_CONSUMABLES
    udarni = ROOT / "docs" / "udarni.txt"
    if udarni.exists():
        by_sku = {p["sku"]: s for s, p in products.items() if p["sku"]}
        featured = []
        for line in udarni.read_text(encoding="utf8").splitlines():
            key = line.strip()
            if key:
                featured.append(key if key in products else by_sku[key])

    refs = [s for e in edges for s in (e["host"], e["fits"])] + \
           [s for r in relations for s in (r["product"], r["related"])] + featured
    missing = sorted({s for s in refs if s not in products})
    if missing:
        raise SystemExit(f"unknown product slugs: {missing}")

    dump = lambda name, obj: (DATA / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    dump("compatibility.json", edges)
    dump("relations.json", relations)
    dump("featured.json", featured)
    write_review(edges, products, inactive, marplast["log"], featured, udarni.exists())
    print(f"ok: {len(edges)} compatibility edges, {len(relations)} relations, {len(featured)} featured")


def write_review(edges, products, inactive, log, featured, from_file) -> None:
    name = lambda s: f"{products[s]['name']['hr']}" + (f" ({products[s]['sku']})" if products[s]["sku"] else "")
    status = lambda note: "✅ potvrđeno (tvoj popis)" if note is None else (
        "⚠️ provjeriti" if note.startswith("check") else "🤖 pretpostavka")
    lines = [
        "# Pregled kompatibilnosti (generirano – ne uređivati ručno)",
        "",
        "Izvor: `docs/marplast_sifre.xlsx` (stupac \"Interni artikl\") + pravila za Vermop sustave.",
        "",
        "- ✅ potvrđeno – veza iz tvog Marplast popisa (`note = null`)",
        "- ⚠️ provjeriti – veza iz popisa, ali s otvorenim pitanjem",
        "- 🤖 pretpostavka – generirano po formatu/sustavu (`note = auto:format`), čeka potvrdu",
        "",
        "| Host (dispenzer / držač) | Prihvaća | Status | Napomena |",
        "|---|---|---|---|",
    ]
    for e in edges:
        note = e["note"] or ""
        detail = note.split(" – ", 1)[1] if " – " in note else ""
        lines.append(f"| {name(e['host'])} | {name(e['fits'])} | {status(e['note'])} | {detail} |")
    lines += ["", "## Skriveni artikli (ukinuti prema popisu)", ""]
    lines += [f"- {name(s)}" for s in sorted(inactive)] or ["- –"]
    lines += ["", "## Udarni proizvodi", "",
              "Iz `docs/udarni.txt`." if from_file else
              "`docs/udarni.txt` ne postoji → privremeno: Marplast dispenzeri + po jedan ključni potrošni artikl po tipu.",
              ""]
    lines += [f"- {name(s)}" for s in featured]
    lines += ["", "## Log uvoza Marplast", ""] + [f"- {x}" for x in log]
    (DATA / "compatibility.review.md").write_text("\n".join(lines) + "\n", encoding="utf8")


if __name__ == "__main__":
    main()
