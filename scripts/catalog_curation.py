"""Hand-written curation for scripts/extract_docx.py.

Maps every product row of the offer .docx (matched by the first line of its
text cell) to a catalog product: category, kind, display names, EN text,
variants. HR descriptions come from the document (with TYPO_FIXES applied)
unless `description_hr` overrides them. Product codes (sku) are kept exactly
as written in the document.
"""

# --------------------------------------------------------------------------- helpers
COLORS = {
    "bijela": {"hr": "bijela", "en": "white"},
    "plava": {"hr": "plava", "en": "blue"},
    "crvena": {"hr": "crvena", "en": "red"},
    "zelena": {"hr": "zelena", "en": "green"},
    "crna": {"hr": "crna", "en": "black"},
    "bordo": {"hr": "bordo", "en": "burgundy"},
    "zuta": {"hr": "žuta", "en": "yellow"},
    "antracit": {"hr": "antracit", "en": "anthracite"},
    "antracit-zelena": {"hr": "antracit / zelena", "en": "anthracite / green"},
    "antracit-crvena": {"hr": "antracit / crvena", "en": "anthracite / red"},
    "antracit-plava": {"hr": "antracit / plava", "en": "anthracite / blue"},
}

PAPER_FORMATS = {
    "papirnata": {"hr": "papirnata rola", "en": "paper roll"},
    "industrijska": {"hr": "industrijska rola", "en": "industrial roll"},
    "medicinska": {"hr": "medicinska rola", "en": "medical roll"},
}


def n(hr, en):
    return {"hr": hr, "en": en}


def size(*values):
    return [{"label": n(v, v.replace(",", ".")), "size": v} for v in values]


def color(*keys):
    return [{"label": COLORS[k], "color": k} for k in keys]


def label(*values):
    return [{"label": n(v, v)} for v in values]


# Shared Vermop text (EN) -----------------------------------------------------
BOIL_EN = "- Washable and boilable at 95 °C without fabric softener."
WHITE_MAGIC_EN = [
    "- Mop for all surfaces, especially glossy ones.",
    "- Leaves no streaks. Ideal for ceramic tiles.",
    "- High-quality microfibres pick up dirt very well.",
    "- Extra top layer acts as a moisture reservoir.",
    "- Wet and damp cleaning, especially of structured floors.",
    "- Very durable (approx. 600–1000 boil washes).",
    BOIL_EN,
]
TRONIC_EN = [
    "- Premium mop made of high-quality materials.",
    "- Optimal dirt removal thanks to microfibres combined with good water absorption.",
    "- Very durable (600–1000 boil washes); material: stronger cotton/polyester blend and microfibre.",
    "- Versatile for many applications, picks up lint.",
    BOIL_EN,
]
CERAN_EN = [
    "- Ceran is a dry-cleaning mop. Dust-free cleaning thanks to its electrostatic charge.",
    "- High level of dirt removal.",
    "- No bacterial contamination even though it is used without water.",
    "- Use: dry floor cleaning, ideal for occasional or pre-cleaning of moisture-sensitive floors.",
    BOIL_EN,
]
HOLDER_EN = [
    "- Premium German-made mop holder with hands-free foot release.",
    "- Best in class: a metal ring prevents the plastic from breaking at the joint.",
]
SANITAR_EN = [
    "Toilet bowl cleaner with disinfecting and bleaching agents that effectively removes limescale "
    "and urine scale as well as other dirt from the bowl walls and rim. Ensures perfect hygiene and "
    "brilliant whiteness."
]
HAND_DISH_EN = [
    "Detergent for washing dishes and other washable surfaces by hand. Effectively removes grease "
    "and leaves dishes sparkling."
]

# --------------------------------------------------------------------------- text fixes (HR display text)
TYPO_FIXES = [
    ("Unverzalno", "Univerzalno"),
    ("rotirajučom", "rotirajućom"),
    ("fixnom", "fiksnom"),
    ("kojisluži", "koji služi"),
    ("odvisokokvalitetnih", "od visokokvalitetnih"),
    ("ORIGNAL", "ORIGINAL"),
    ("jačisastav", "jači sastav"),
    ("kombinacij s", "kombinaciji s"),
    ("apsorbcijomvode", "apsorpcijom vode"),
    ("abrazivniza", "abrazivni, za"),
    ("nehrđajućih površia, reznica salame", "nehrđajućih površina, rezača salame"),
    ("cijeviumivaonika", "cijevi umivaonika"),
    (" iu kućnoj", " i u kućnoj"),
    ("mopovim jamči", "mopovima jamči"),
    ("WC školjka i odvoda", "WC školjki i odvoda"),
    ("pripravaka", "pripravka"),
    ("odstranjiva i najtvrdokornije", "uklanja i najtvrdokornije"),
    ("masti i ulje.", "masti i ulja."),
    ("Izrađen od izdržljive", "Izrađena od izdržljive"),
    ("kontaminacija bez", "kontaminacije bez"),
    ("Namjena:suho", "Namjena: suho"),
    ("namjena:suho", "namjena: suho"),
    ("95°C", "95 °C"),
    ("Twixtronic", "Twix Tronic"),
    ("Inteligentnom 2-faznom čišćenje s jednom krpom.", "Inteligentno dvofazno čišćenje jednom krpom."),
    ("čišćenje,svih", "čišćenje svih"),
    ("(npr. Prostori", "(npr. prostori"),
    ("npr.sportske", "npr. sportske"),
    ("svih površina podovi,zidovi stropovi, a posebno strukturiranih podovi",
     "svih površina – podova, zidova i stropova, a posebno strukturiranih podova"),
    ("lako cijeđenja", "lako cijeđenje"),
    ("kutija s ladicama nude", "kutija s ladicama nudi"),
    ("kompletna set kolica sadrže", "kompletan set kolica sadrži"),
    ("Perive na 95 C°", "Perive na 95 °C"),
    ("u kombinacij s", "u kombinaciji s"),
    ("tel. štapa", "teleskopskog štapa"),
    ("Tekuće sredstvo za čišćenje pećnica, roštilja i napa", "Tekuće sredstvo za čišćenje pećnica, roštilja i napa."),
    ("ZAMJENA ZA RIBAĆU ČETKU", "Zamjena za ribaću četku."),
    ("(cca 600- 1000", "(cca 600–1000"),
    ("(600-1000", "(600–1000"),
    ("(100 – 170 cm)", "(100–170 cm)"),
    ("(80 – 171cm)", "(80–171 cm)"),
]

# --------------------------------------------------------------------------- categories
def cat(slug, parent, hr, en, image_rid=None):
    return {"slug": slug, "parent": parent, "name": n(hr, en), "image_rid": image_rid}


CATEGORIES = [
    cat("papirnata-konfekcija", None, "Papirnata konfekcija", "Paper products"),
    cat("rucnici-slozivi", "papirnata-konfekcija", "Složivi ručnici (V/Z)", "Folded towels (V/Z)"),
    cat("rucnici-u-roli", "papirnata-konfekcija", "Ručnici u roli (Autocut)", "Towel rolls (Autocut)"),
    cat("centralno-izvlacenje", "papirnata-konfekcija", "Centralno izvlačenje", "Centrefeed rolls"),
    cat("industrijske-role", "papirnata-konfekcija", "Industrijske role", "Industrial rolls"),
    cat("toaletni-papir", "papirnata-konfekcija", "Toaletni papir", "Toilet paper"),
    cat("salvete", "papirnata-konfekcija", "Salvete", "Napkins"),
    cat("medicinske-role", "papirnata-konfekcija", "Medicinske role", "Medical rolls"),

    cat("kemija", None, "Kemija", "Chemicals"),
    cat("strojno-pranje-posuda", "kemija", "Strojno pranje posuđa", "Machine dishwashing"),
    cat("rucno-pranje-posuda", "kemija", "Ručno pranje posuđa", "Hand dishwashing"),
    cat("ciscenje-povrsina", "kemija", "Čišćenje površina", "Surface cleaning"),
    cat("sanitarije", "kemija", "Sanitarije", "Washrooms"),
    cat("sapuni-i-dezinfekcija", "kemija", "Sapuni i dezinfekcija", "Soaps and disinfection"),
    cat("mirisi", "kemija", "Mirisi", "Fragrances"),
    cat("ostala-kemija", "kemija", "Ostala kemija", "Other chemicals"),

    cat("vrece-i-folije", None, "Vreće i folije", "Bags and films"),

    cat("pribor-za-ciscenje", None, "Pribor za čišćenje", "Cleaning supplies"),
    cat("metle-i-lopatice", "pribor-za-ciscenje", "Metle, lopatice i vještice", "Brooms, dustpans and mop heads"),
    cat("drske-i-kante", "pribor-za-ciscenje", "Drške i kante", "Handles and buckets"),
    cat("cetke", "pribor-za-ciscenje", "Četke", "Brushes"),
    cat("spuzve-i-krpe", "pribor-za-ciscenje", "Spužve i krpe", "Sponges and cloths"),
    cat("rukavice", "pribor-za-ciscenje", "Rukavice", "Gloves"),

    cat("vermop", None, "Vermop profesionalni sustavi", "Vermop professional systems", image_rid="rId101"),
    cat("vermop-sprint", "vermop", "Sprint sustav", "Sprint system"),
    cat("vermop-clipper", "vermop", "Clipper sustav", "Clipper system"),
    cat("vermop-scandic-mono", "vermop", "Scandic Mono sustav", "Scandic Mono system"),
    cat("vermop-twix", "vermop", "Twix sustav", "Twix system"),
    cat("vermop-moco", "vermop", "Močo sustavi", "Močo systems"),
    cat("vermop-stapovi", "vermop", "Štapovi i adapteri", "Handles and adapters"),
    cat("vermop-kolica", "vermop", "Kolica i kante", "Trolleys and buckets"),
    cat("vermop-velike-povrsine", "vermop", "Sustavi za velike površine", "Large-area systems"),
    cat("vermop-krpe", "vermop", "Krpe i oprema", "Cloths and equipment"),
    cat("vermop-radne-kute", "vermop", "Radne kute", "Work coats"),

    cat("zastitne-podloge", None, "Zaštitne podloge", "Safety mats"),
    cat("staklene-case", None, "Staklene čaše", "Glassware", image_rid="rId142"),

    cat("ambalaza", None, "Ambalaža", "Packaging", image_rid="rId144"),
    cat("ambalaza-kraft", "ambalaza", "Kraft asortiman", "Kraft range", image_rid="rId144"),
    cat("ugostiteljski-pribor", "ambalaza", "Ugostiteljski pribor", "Catering supplies", image_rid="rId143"),

    cat("dispenzeri", None, "Dispenzeri (Marplast)", "Dispensers (Marplast)"),
]

KRAFT_CATEGORY = "ambalaza-kraft"

# --------------------------------------------------------------------------- brands
BRANDS = [
    {"slug": "marplast", "name": "Marplast", "url": None},
    {"slug": "vermop", "name": "Vermop", "url": None, "logo_rid": "rId101"},
    {"slug": "kobold", "name": "Kobold", "url": None},
    {"slug": "labud", "name": "Labud", "url": None},
    {"slug": "radion", "name": "Radion", "url": None, "logo_rid": "rId74"},
    {"slug": "splendida", "name": "Splendida", "url": None, "logo_rid": "rId75"},
]

# --------------------------------------------------------------------------- products
PAPER_SLUG_PREFIX = {
    "rucnici-slozivi": "slozivi-rucnici",
    "rucnici-u-roli": "rucnici-u-roli",
    "centralno-izvlacenje": "rola-centralno-izvlacenje",
    "industrijske-role": "industrijska-rola",
    "toaletni-papir": "toaletni-papir",
    "medicinske-role": "medicinska-rola",
    "salvete": "salvete",
}


def paper(sku, row, category, hr, en):
    return {"rows": [row], "sku": sku, "category": category, "kind": "consumable",
            "paper": True, "name": n(hr, en),
            "slug_base": PAPER_SLUG_PREFIX[category]}


PRODUCTS = [
    # Papirnata konfekcija ------------------------------------------------------
    paper("CC21V", "CC21V", "rucnici-slozivi",
          "Složivi papirnati ručnici V, 2-slojni, 200 listića", "V-fold paper towels, 2-ply, 200 sheets"),
    paper("CC21VX", "CC21VX", "rucnici-slozivi",
          "Složivi papirnati ručnici V, 2-slojni, 250 listića", "V-fold paper towels, 2-ply, 250 sheets"),
    paper("CCZ", "CCZ", "rucnici-slozivi",
          "Složivi papirnati ručnici Z, 2-slojni, 150 listića", "Z-fold paper towels, 2-ply, 150 sheets"),
    paper("CCAC80", "CCAC80", "rucnici-u-roli",
          "Papirnati ručnici u roli Autocut 80 m, 3-slojni", "Autocut paper towel roll 80 m, 3-ply"),
    paper("CCAC130", "CCAC130", "rucnici-u-roli",
          "Papirnati ručnici u roli Autocut 130 m, 2-slojni", "Autocut paper towel roll 130 m, 2-ply"),
    paper("CCSP46", "CCSP46", "centralno-izvlacenje",
          "Rola za centralno izvlačenje 46 m", "Centrefeed roll 46 m"),
    paper("CCSP104", "CCSP104", "centralno-izvlacenje",
          "Rola za centralno izvlačenje 103,5 m", "Centrefeed roll 103.5 m"),
    paper("CCSP135", "CCSP135", "centralno-izvlacenje",
          "Rola za centralno izvlačenje 135 m", "Centrefeed roll 135 m"),
    paper("CCIN110", "CCIN110", "industrijske-role",
          "Industrijska rola 110 m, 2-slojna", "Industrial roll 110 m, 2-ply"),
    paper("CCIN176", "CCIN176", "industrijske-role",
          "Industrijska rola 176 m, 3-slojna", "Industrial roll 176 m, 3-ply"),
    paper("CCIN234", "CCIN234", "industrijske-role",
          "Industrijska rola 234 m, 2-slojna", "Industrial roll 234 m, 2-ply"),
    paper("CCIPL170", "CCIPL170", "industrijske-role",
          "Industrijska rola plava 170 m, 3-slojna", "Blue industrial roll 170 m, 3-ply"),
    paper("CCIPL340", "CCIPL340", "industrijske-role",
          "Industrijska rola plava 340 m, 3-slojna", "Blue industrial roll 340 m, 3-ply"),
    paper("CCT(9000)", "CCT(9000)", "toaletni-papir",
          "Toaletni papir u listićima, 225 listića", "Interfold toilet tissue, 225 sheets"),
    paper("CCTMS", "CCTMS (mini smart)", "toaletni-papir",
          "Toaletni papir Mini Smart 115 m", "Mini Smart toilet roll 115 m"),
    paper("CCTMJ", "CCTMJ (mini jumbo)", "toaletni-papir",
          "Toaletni papir Mini Jumbo 115 m", "Mini Jumbo toilet roll 115 m"),
    paper("CCTMXJ", "CCTMXJ (maxi jumbo)", "toaletni-papir",
          "Toaletni papir Maxi Jumbo 230 m", "Maxi Jumbo toilet roll 230 m"),
    paper("CCTP", "CCTP", "toaletni-papir",
          "Toaletni papir 3-slojni, 250 listića", "Toilet paper, 3-ply, 250 sheets"),
    paper("CCTC", "CCTC", "toaletni-papir",
          "Toaletni papir 2-slojni, 500 listića", "Toilet paper, 2-ply, 500 sheets"),
    paper("CCM", "CCM", "medicinske-role",
          "Medicinska rola 80 m", "Medical couch roll 80 m"),
    paper("CCS Only one", "CCS Only one", "salvete",
          "Salvete Only One 16 × 21 cm, 2-slojne", "Only One napkins 16 × 21 cm, 2-ply"),
    paper("CCS33", "CCS33", "salvete",
          "Salvete 33 × 33 cm, 1-slojne", "Napkins 33 × 33 cm, 1-ply"),
    paper("CCSCRV", "CCSCRV", "salvete",
          "Salvete 38 × 38 cm, 2-slojne, crvene", "Napkins 38 × 38 cm, 2-ply, red"),
    paper("CCSCZEL", "CCSCZEL", "salvete",
          "Salvete 38 × 38 cm, 2-slojne, zelene", "Napkins 38 × 38 cm, 2-ply, green"),
    paper("CCSCRN", "CCSCRN", "salvete",
          "Salvete 38 × 38 cm, 2-slojne, crne", "Napkins 38 × 38 cm, 2-ply, black"),
    paper("CCSBOR", "CCSBOR", "salvete",
          "Salvete 38 × 38 cm, 2-slojne, bordo", "Napkins 38 × 38 cm, 2-ply, burgundy"),
    paper("CCSBIL", "CCSBIL", "salvete",
          "Salvete 38 × 38 cm, 2-slojne, bijele", "Napkins 38 × 38 cm, 2-ply, white"),
    paper("CCS17", "CCS17", "salvete",
          "Salvete 17 × 17 cm, 1-slojne", "Napkins 17 × 17 cm, 1-ply"),
    paper("CCSTIS", "CCSTIS", "salvete",
          "Salvete 21 × 21 cm, 2-slojne", "Napkins 21 × 21 cm, 2-ply"),

    # Kemija ----------------------------------------------------------------
    {"rows": ["Sredstvo za strojno pranje posuđa i čaša 5L"], "title_lines": 3,
     "category": "strojno-pranje-posuda", "kind": "chemical",
     "name": n("Sredstvo za strojno pranje posuđa i čaša", "Machine dishwashing detergent"),
     "variants": size("5 L", "10 L", "25 L"),
     "description_en": [
         "Liquid alkaline detergent for dishes, cutlery, cups, glasses and coffee ware in automatic "
         "dishwashers. Its balanced formula delivers optimal washing results, effectively removing food "
         "and drink residues, grease, and coffee and tea stains."]},
    {"rows": ["Sredstvo za strojno ispiranje posuđa i čaša 5L"], "title_lines": 2,
     "category": "strojno-pranje-posuda", "kind": "chemical",
     "name": n("Sredstvo za strojno ispiranje posuđa i čaša", "Machine rinse aid"),
     "variants": size("5 L", "10 L"),
     "description_en": [
         "Rinse aid for dishwashers. Ensures complete rinsing and fast drying for a spotless, streak-free "
         "shine. Reduces corrosion of glassware. Also suitable for plastic dishes."]},
    {"rows": ["Sredstvo za ručno pranje posuđa i čaša 5L", "Sredstvo za ručno pranje posuđa i čaša 1L"],
     "title_lines": {"Sredstvo za ručno pranje posuđa i čaša 5L": 1,
                     "Sredstvo za ručno pranje posuđa i čaša 1L": 2},
     "category": "rucno-pranje-posuda", "kind": "chemical",
     "name": n("Sredstvo za ručno pranje posuđa i čaša", "Hand dishwashing detergent"),
     "variants": size("5 L", "1 L", "0,5 L"),
     "description_en": HAND_DISH_EN},
    {"rows": ["Unverzalno sredstvo za čišćenje podova 5L"], "title_lines": 2,
     "category": "ciscenje-povrsina", "kind": "chemical",
     "name": n("Univerzalno sredstvo za čišćenje podova", "All-purpose floor cleaner"),
     "variants": size("5 L", "1 L"),
     "description_en": [
         "Highly effective cleaner for machine or manual cleaning and care of floor coverings and "
         "water-resistant surfaces (ceramics, plastic, linoleum, parquet or laminate)."]},
    {"rows": ["Sredstvo za čišćenje drvenih površina"], "title_lines": 2,
     "category": "ciscenje-povrsina", "kind": "chemical",
     "name": n("Sredstvo za čišćenje drvenih površina ARENA LES 1 L", "ARENA LES wood cleaner 1 L"),
     "description_en": [
         "Cleaner for washable wooden surfaces such as parquet, furniture, skirting boards, doors and "
         "window frames. Gently cleans and cares for wood."]},
    {"rows": ["Sredstvo za čišćenje staklenih površina VERTIX 1L"], "title_lines": 2,
     "category": "ciscenje-povrsina", "kind": "chemical",
     "name": n("Sredstvo za čišćenje staklenih površina VERTIX", "VERTIX glass cleaner"),
     "variants": size("1 L", "0,75 L"),
     "description_hr": [
         "Koncentrirano sredstvo za čišćenje i dezinfekciju svih vrsta staklenih i glatkih površina. "
         "Ne ostavlja tragove brisanja i vraća prvobitni blistavi sjaj."],
     "description_en": [
         "Concentrated cleaner and disinfectant for all types of glass and smooth surfaces. Leaves no "
         "streaks and restores the original brilliant shine."]},
    {"rows": ["Sredstvo za dezinfekciju površina i prostora ANTIBAC KOBOLD 0,75L"],
     "category": "ciscenje-povrsina", "kind": "chemical", "brand": "kobold",
     "name": n("Sredstvo za dezinfekciju površina i prostora ANTIBAC KOBOLD 0,75 L",
               "ANTIBAC KOBOLD surface and room disinfectant 0.75 L"),
     "description_en": [
         "Destroys bacteria, including bacterial spores. Long-lasting effect, leaves no harmful residues. "
         "Environmentally friendly."]},
    {"rows": ["Sredstvo za odmašćivanje 1L"],
     "category": "ciscenje-povrsina", "kind": "chemical",
     "name": n("Sredstvo za odmašćivanje 1 L", "Degreaser 1 L"),
     "description_en": [
         "Highly effective microorganism-based cleaner for machine or manual cleaning of floor coverings "
         "and water-resistant surfaces (ceramics, plastic, linoleum, parquet or laminate). Especially "
         "suited to removing grease, protein deposits and other stains."]},
    {"rows": ["Sredstvo za čišćenje roštilja i pećnica ŽAR GRILL 1L"],
     "category": "ciscenje-povrsina", "kind": "chemical",
     "name": n("Sredstvo za čišćenje roštilja i pećnica ŽAR GRILL 1 L", "ŽAR GRILL grill and oven cleaner 1 L"),
     "description_en": [
         "Fast, effective cleaner and degreaser. Removes baked-on and other stubborn dirt. For all "
         "washable/water-resistant surfaces, ovens, hoods and filters, grills, dishes, stainless steel "
         "surfaces, meat slicers and similar."]},
    {"rows": ["Sredstvo za čišćenje i odmašćivanje PERMETAL 1L"],
     "category": "ciscenje-povrsina", "kind": "chemical",
     "name": n("Sredstvo za čišćenje i odmašćivanje PERMETAL 1 L", "PERMETAL cleaner and degreaser 1 L"),
     "description_en": ["Liquid cleaner for ovens, grills and extractor hoods."]},
    {"rows": ["Sredstvo za čišćenje aparata za kavu CLEANCOFFEE 0,65L"],
     "category": "ciscenje-povrsina", "kind": "chemical",
     "name": n("Sredstvo za čišćenje aparata za kavu CLEANCOFFEE 0,65 L",
               "CLEANCOFFEE coffee machine cleaner 0.65 L"),
     "description_en": [
         "Alkaline cleaner for coffee and beverage machines in catering and hospitality. Cleans filters "
         "and strainers for flawless dispensing. Also suitable for internal cleaning of dishwashers and "
         "washing machines."]},
    {"rows": ["Tekuće sredstvo za čišćenje WC školjka i odvoda SANITAR LABUD 1L"],
     "category": "sanitarije", "kind": "chemical", "brand": "labud",
     "name": n("Sredstvo za čišćenje WC školjki i odvoda SANITAR LABUD 1 L",
               "SANITAR LABUD toilet and drain cleaner 1 L"),
     "description_en": SANITAR_EN},
    {"rows": ["Tekuće sredstvo za čišćenje WC školjka i odvoda SANITAR ANTICALC 750ml"],
     "category": "sanitarije", "kind": "chemical",
     "name": n("Sredstvo za čišćenje WC školjki i odvoda SANITAR ANTICALC 750 ml",
               "SANITAR ANTICALC toilet and drain cleaner 750 ml"),
     "description_en": SANITAR_EN},
    {"rows": ["Tekuće sredstvo za čišćenje WC školjka i odvoda SANITAR BATH 750ml"],
     "category": "sanitarije", "kind": "chemical",
     "name": n("Sredstvo za čišćenje WC školjki i odvoda SANITAR BATH 750 ml",
               "SANITAR BATH toilet and drain cleaner 750 ml"),
     "description_en": SANITAR_EN},
    {"rows": ["Tekuće sredstvo za čišćenje WC školjka i odvoda SANITAR LABUD SAN CITRO 1L"],
     "category": "sanitarije", "kind": "chemical", "brand": "labud",
     "name": n("Sredstvo za čišćenje WC školjki i odvoda SANITAR LABUD SAN CITRO 1 L",
               "SANITAR LABUD SAN CITRO toilet and drain cleaner 1 L"),
     "description_en": SANITAR_EN},
    {"rows": ["Tekuće abrazivno sredstvo za čišćenje ARF ORIGNAL CREAM 400ml"],
     "category": "ciscenje-povrsina", "kind": "chemical",
     "name": n("Abrazivno sredstvo za čišćenje ARF ORIGINAL CREAM 400 ml", "ARF ORIGINAL CREAM abrasive cleaner 400 ml"),
     "description_en": [
         "Abrasive cleaner that removes even the toughest stains without scratching. Indispensable for "
         "cleaning cookers, sinks, ceramic tiles, bathtubs and washbasins."]},
    {"rows": ["Sredstvo za čišćenje odvoda i sifona CEVOKIM 1L"],
     "category": "sanitarije", "kind": "chemical",
     "name": n("Sredstvo za čišćenje odvoda i sifona CEVOKIM 1 L", "CEVOKIM drain and siphon cleaner 1 L"),
     "description_en": [
         "Concentrated alkaline cleaner and degreaser for washbasin and shower drain pipes in households, "
         "the food industry or anywhere drains clog with grease and other dirt."]},
    {"rows": ["Tekući sapun za ruke 5L"],
     "category": "sapuni-i-dezinfekcija", "kind": "chemical",
     "name": n("Tekući sapun za ruke 5 L", "Liquid hand soap 5 L")},
    {"rows": ["Pjenasti sapun za ruke 5L"],
     "category": "sapuni-i-dezinfekcija", "kind": "chemical",
     "name": n("Pjenasti sapun za ruke 5 L", "Foam hand soap 5 L")},
    {"rows": ["Tekući sapun za ruke za držače 0,5L"],
     "category": "sapuni-i-dezinfekcija", "kind": "chemical",
     "name": n("Tekući sapun za ruke za držače 0,5 L", "Liquid hand soap cartridge 0.5 L"),
     "description_hr": ["Uložak sapuna za ruke za držače."],
     "description_en": ["Hand soap refill cartridge for dispensers."]},
    {"rows": ["Pjenasti sapun za ruke za držače 0,5L"],
     "category": "sapuni-i-dezinfekcija", "kind": "chemical",
     "name": n("Pjenasti sapun za ruke za držače 0,5 L", "Foam hand soap cartridge 0.5 L"),
     "description_hr": ["Uložak pjenastog sapuna za ruke za držače."],
     "description_en": ["Foam hand soap refill cartridge for dispensers."]},
    {"rows": ["Solna kiselina 1L"],
     "category": "sanitarije", "kind": "chemical",
     "name": n("Solna kiselina 1 L", "Hydrochloric acid 1 L"),
     "description_hr": [
         "Solna kiselina za domaćinstvo (HCl 19 %) – sredstvo za uklanjanje kamenca s površina "
         "kiselootporne keramike, porculana i plastike."],
     "description_en": [
         "Household hydrochloric acid (HCl 19%) for removing limescale from acid-resistant ceramics, "
         "porcelain and plastic."]},
    {"rows": ["Varekina 1L"],
     "category": "sanitarije", "kind": "chemical",
     "name": n("Varekina 1 L", "Bleach 1 L"),
     "description_en": [
         "Liquid bleaching and disinfecting agent; biocidal product type 2 (disinfectants and other "
         "biocidal products for household use and for surfaces in public health areas)."]},
    {"rows": ["Sol za deporator 25kg"],
     "category": "ostala-kemija", "kind": "chemical",
     "name": n("Sol za deporator 25 kg", "Tablet salt for water treatment 25 kg"),
     "description_en": [
         "Non-iodised tablet salt for keeping water clean and safe. Enables effective cleaning, keeps the "
         "water pH stable and allows automated maintenance in combination with electrolysis. Also used in "
         "households, industry and agriculture."]},
    {"rows": ["Industrijska pasta 3L"],
     "category": "sapuni-i-dezinfekcija", "kind": "chemical",
     "name": n("Industrijska pasta za ruke 3 L", "Industrial hand cleaning paste 3 L"),
     "description_hr": [
         "Prirodno sredstvo za čišćenje ruku koje ne sadrži naftna otapala. Čisti bez vode i uklanja "
         "masnoću, prljavštinu, tintu, zemlju, boju, cementne brtve, epokside i ljepila. Sadrži ekstra fine "
         "abrazive koji čiste duboko u pore."],
     "description_en": [
         "Natural hand cleaner free of petroleum solvents. Cleans without water and removes grease, dirt, "
         "ink, soil, paint, cement sealants, epoxies and adhesives. Contains extra-fine abrasives that "
         "clean deep into the pores."]},
    {"rows": ["Sredstvo za dezinfekciju ruku"],
     "category": "sapuni-i-dezinfekcija", "kind": "chemical",
     "name": n("Sredstvo za dezinfekciju ruku", "Hand sanitiser"),
     "description_en": ["Liquid alcohol-based hand sanitiser."]},
    {"rows": ["Šampon za kosu i tijelo VITALITY AND SHINE 5L"],
     "category": "sapuni-i-dezinfekcija", "kind": "chemical",
     "name": n("Šampon za kosu i tijelo VITALITY AND SHINE 5 L", "VITALITY AND SHINE hair and body shampoo 5 L")},
    {"rows": ["Mirisi za dozatore 250ml"], "title_lines": 2,
     "category": "mirisi", "kind": "chemical",
     "name": n("Mirisi za dozatore 250 ml", "Air freshener refills for dispensers 250 ml"),
     "variants": label("Grapes", "Scandal", "Cherry", "Airguard")},
    {"rows": ["Osvježivači prostora 300ml"],
     "category": "mirisi", "kind": "chemical",
     "name": n("Osvježivači prostora 300 ml", "Room air fresheners 300 ml")},
    {"rows": ["Mirisni štapići za prostor 200ml"],
     "category": "mirisi", "kind": "chemical",
     "name": n("Mirisni štapići za prostor 200 ml", "Reed diffuser 200 ml")},
    {"rows": ["Nitril rukavice"],
     "category": "rukavice", "kind": "consumable",
     "name": n("Nitrilne rukavice", "Nitrile gloves"),
     "variants": color("crna", "plava", "bijela") + size("S", "M", "L", "XL"),
     "description_en": ["- Available in black, blue or white", "- Sizes S / M / L / XL", "- 100 pieces per pack"]},
    {"rows": ["Latex rukavice"],
     "category": "rukavice", "kind": "consumable",
     "name": n("Lateks rukavice", "Latex gloves"),
     "variants": color("crna", "plava") + size("S", "M", "L", "XL"),
     "description_en": ["- Black or blue", "- Sizes S / M / L / XL", "- 100 pieces per pack"]},
    {"rows": ["Gumene rukavice višekratne"],
     "category": "rukavice", "kind": "consumable",
     "name": n("Gumene rukavice višekratne", "Reusable rubber gloves"),
     "variants": size("S", "M", "L"),
     "description_en": ["- Sizes S / M / L"]},
    {"rows": ["Mrežice za pisoar"],
     "category": "sanitarije", "kind": "consumable",
     "name": n("Mrežice za pisoar", "Urinal screens"),
     "description_en": ["- Neutralises unpleasant odours", "- Suitable for urinals", "- Prevents bacterial growth"]},
    {"rows": ["Osvježivač za wc školjku"],
     "category": "sanitarije", "kind": "consumable",
     "name": n("Osvježivač za WC školjku", "Toilet bowl freshener"),
     "description_en": ["Freshens and cleans the toilet bowl with a long-lasting scent."]},

    # Vreće i folije ----------------------------------------------------------
    {"rows": ["Vreće za smeće LD 50 x 70cm", "Vreće za smeće LD 70 x 110cm", "Vreće za smeće LD 80 x 120cm"],
     "category": "vrece-i-folije", "kind": "consumable",
     "name": n("Vreće za smeće LD, crne", "LD garbage bags, black"),
     "variants": size("50 × 70 cm (40 L)", "70 × 110 cm (120 L)", "80 × 120 cm (150 L)"),
     "specs": [{"key": "color", "value": COLORS["crna"]}],
     "description_hr": ["- 50 × 70 cm, zapremnina 40 L – 20 komada u pakiranju",
                        "- 70 × 110 cm, zapremnina 120 L – 10 komada u pakiranju",
                        "- 80 × 120 cm, zapremnina 150 L – 10 komada u pakiranju"],
     "description_en": ["- 50 × 70 cm, 40 L capacity – 20 pieces per pack",
                        "- 70 × 110 cm, 120 L capacity – 10 pieces per pack",
                        "- 80 × 120 cm, 150 L capacity – 10 pieces per pack"]},
    {"rows": ["Strech folija industrijska"],
     "category": "vrece-i-folije", "kind": "packaging",
     "name": n("Stretch folija industrijska", "Industrial stretch film")},

    # Pribor za čišćenje ----------------------------------------------------
    {"rows": ["Metlica i lopatica"], "category": "metle-i-lopatice", "kind": "tool",
     "name": n("Metlica i lopatica", "Hand brush and dustpan set")},
    {"rows": ["Lopatica za smeće sa gumom"], "category": "metle-i-lopatice", "kind": "tool",
     "name": n("Lopatica za smeće s gumom", "Dustpan with rubber lip")},
    {"rows": ["Četka sa drškom mala"], "category": "cetke", "kind": "tool",
     "name": n("Četka s drškom, mala", "Small brush with handle")},
    {"rows": ["Četka bez drške"], "category": "cetke", "kind": "tool",
     "name": n("Četka bez drške", "Brush without handle")},
    {"rows": ["Metla industrijska"], "category": "metle-i-lopatice", "kind": "tool",
     "name": n("Metla industrijska", "Industrial broom")},
    {"rows": ["Metla Allegra"], "category": "metle-i-lopatice", "kind": "tool",
     "name": n("Metla Allegra", "Allegra broom")},
    {"rows": ["Metla Helen"], "category": "metle-i-lopatice", "kind": "tool",
     "name": n("Metla Helen", "Helen broom")},
    {"rows": ["Vještica pamučna 300g"], "title_lines": 2, "category": "metle-i-lopatice", "kind": "consumable",
     "name": n("Vještica pamučna 300 g (bez drške)", "Cotton mop head 300 g (without handle)")},
    {"rows": ["Drška drvena 120 cm"], "category": "drske-i-kante", "kind": "tool",
     "name": n("Drška drvena 120 cm", "Wooden handle 120 cm")},
    {"rows": ["Drška PVC 120 cm"], "category": "drske-i-kante", "kind": "tool",
     "name": n("Drška PVC 120 cm", "PVC handle 120 cm")},
    {"rows": ["Drška kromirana 130 cm"], "category": "drske-i-kante", "kind": "tool",
     "name": n("Drška kromirana 130 cm", "Chrome-plated handle 130 cm")},
    {"rows": ["Kanta sa cjedilom 13L"], "category": "drske-i-kante", "kind": "tool",
     "name": n("Kanta s cjedilom 13 L", "Bucket with wringer 13 L")},
    {"rows": ["Četka za wc"], "category": "cetke", "kind": "tool",
     "name": n("Četka za WC", "Toilet brush")},
    {"rows": ["Četka za wc sa stalkom Lusso"], "category": "cetke", "kind": "tool",
     "name": n("Četka za WC sa stalkom Lusso", "Lusso toilet brush with holder")},
    {"rows": ["Spužva abrazivna 3/1"], "category": "spuzve-i-krpe", "kind": "consumable",
     "name": n("Spužva abrazivna 3/1", "Abrasive sponge, 3-pack"),
     "description_en": ["- 3 pieces per pack"]},
    {"rows": ["Spužva čelična 3/1"], "category": "spuzve-i-krpe", "kind": "consumable",
     "name": n("Spužva čelična 3/1", "Steel wool sponge, 3-pack"),
     "description_en": ["- 3 pieces per pack"]},
    {"rows": ["Žica inox 2/1"], "category": "spuzve-i-krpe", "kind": "consumable",
     "name": n("Žica inox 2/1", "Stainless steel scourer, 2-pack"),
     "description_en": ["- 3 pieces per pack"]},
    {"rows": ["Krpa spužvasta trulex profesional"], "category": "spuzve-i-krpe", "kind": "consumable",
     "name": n("Krpa spužvasta Trulex Profesional", "Trulex Professional sponge cloth"),
     "variants": color("zuta", "crvena", "plava"),
     "description_en": ["- 5 pieces per pack", "- Available in several colours (yellow / red / blue)"]},
    {"rows": ["Čačkalice higijenske"], "category": "ugostiteljski-pribor", "kind": "consumable",
     "name": n("Čačkalice higijenske", "Hygienic toothpicks"),
     "description_en": ["- 1000 pieces per pack"]},
    {"rows": ["Štapići grill 20 cm"], "category": "ugostiteljski-pribor", "kind": "consumable",
     "name": n("Štapići za roštilj 20 cm", "Grill skewers 20 cm"),
     "description_en": ["- 50 pieces per pack"]},
    {"rows": ["Kocke za potpalu"], "title_lines": 2, "category": "ugostiteljski-pribor", "kind": "consumable",
     "name": n("Kocke za potpalu PLAMENKO", "PLAMENKO fire lighter cubes"),
     "description_en": ["- 48 pieces per pack"]},

    # Zaštitne podloge --------------------------------------------------------
    {"rows": ["Gume za podove antislip"], "category": "zastitne-podloge", "kind": "other",
     "name": n("Antislip gumena podloga za pod", "Anti-slip rubber floor mat"),
     "variants": color("crvena", "crna"),
     "specs": [{"key": "dimensions", "value": "90 × 152 cm"}],
     "description_en": [
         "Made of durable rubber that withstands harsh chemicals while creating a slip-resistant surface. "
         "Nitrile material available in red and black, for heavy-duty conditions and various levels of "
         "grease and oil protection. A drainage system with large and small holes carries liquids and "
         "debris away from the work area. Bevelled edges on all four sides eliminate tripping hazards. "
         "Size 90 × 152 cm."]},
    {"rows": ["Gume za čaše"], "category": "zastitne-podloge", "kind": "other",
     "name": n("Gumena podloga za čaše", "Rubber glass drying mat"),
     "specs": [{"key": "dimensions", "value": "32,5 × 32,5 cm"}],
     "description_en": [
         "- Dries glasses faster, greatly improves hygiene and makes cleaning and maintenance easier",
         "- Size 32.5 × 32.5 cm",
         "- Several mats can be combined"]},

    # Vermop ----------------------------------------------------------------
    {"rows": ["Držač mopa Sprint plus 40 cm"], "category": "vermop-sprint", "kind": "holder", "brand": "vermop",
     "name": n("Držač mopa Sprint Plus 40 cm", "Sprint Plus mop holder 40 cm"),
     "description_en": HOLDER_EN},
    {"rows": ["Držač mopa Clipper 40 cm"], "category": "vermop-clipper", "kind": "holder", "brand": "vermop",
     "name": n("Držač mopa Clipper 40 cm", "Clipper mop holder 40 cm"),
     "description_en": HOLDER_EN},
    {"rows": ["Mop Clipper Basic 40 cm"], "category": "vermop-clipper", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Clipper Basic 40 cm", "Clipper Basic mop 40 cm"),
     "description_en": ["- Mop for all surfaces, very durable and long-lasting; washable and boilable at 95 °C "
                        "without fabric softener. Material: cotton, polyester."]},
    {"rows": ["Mop Clipper Tronic 40 cm"], "category": "vermop-clipper", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Clipper Tronic 40 cm", "Clipper Tronic mop 40 cm"),
     "description_en": ["- Mop for all surfaces, very durable and long-lasting; washable and boilable at 95 °C "
                        "without fabric softener. Material: polyester, cotton, microfibre."]},
    {"rows": ["Mop Clipper White Magic 40 cm"], "category": "vermop-clipper", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Clipper White Magic 40 cm", "Clipper White Magic mop 40 cm"),
     "description_en": ["- Mop for all surfaces, very durable and long-lasting; washable and boilable at 95 °C "
                        "without fabric softener. Material: polyester, microfibre."]},
    {"rows": ["Aluminijski štap 140 cm"], "category": "vermop-stapovi", "kind": "tool", "brand": "vermop",
     "name": n("Aluminijski štap 140 cm", "Aluminium handle 140 cm"),
     "description_en": ["- Anodised aluminium handle of high strength and thickness.",
                        "- Diameter 23.5 mm, length 140 cm. High-quality handle with rubber trim.",
                        "- Its strength ensures long-lasting use."]},
    {"rows": ["Scandic teleskopski štap s rotirajučom kuglom s fixnom kuglom s rotirajučom kuglom"],
     "category": "vermop-stapovi", "kind": "tool", "brand": "vermop",
     "name": n("Scandic teleskopski štap 100–170 cm", "Scandic telescopic handle 100–170 cm"),
     "description_en": ["- Extremely sturdy telescopic handle (100–170 cm) with a connector that accepts all "
                        "professional cleaning attachments.",
                        "- Diameter 23.5 mm. Extends or retracts with a simple twist."]},
    {"rows": ["Scandic teleskopski štap s rotirajučom kuglom"],
     "category": "vermop-stapovi", "kind": "tool", "brand": "vermop",
     "name": n("Scandic teleskopski štap s rotirajućom kuglom 80–171 cm",
               "Scandic telescopic handle with swivel ball 80–171 cm"),
     "description_en": ["- Extremely sturdy telescopic handle (80–171 cm) with a universal X connector for all "
                        "professional cleaning attachments.",
                        "- Diameter 23.5 mm. Extends or retracts at the press of a button."]},
    {"rows": ["Scandic X adapteri"], "title_lines": 4,
     "category": "vermop-stapovi", "kind": "tool", "brand": "vermop",
     "name": n("Scandic X adapteri", "Scandic X adapters"),
     "variants": label("TopLock", "Scandic Mono/Duo", "Handle all Ø23,5 mm")},
    {"rows": ["Mop Sprint Plus Basic 40 cm"], "category": "vermop-sprint", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Sprint Plus Basic 40 cm", "Sprint Plus Basic mop 40 cm"),
     "description_en": ["- Mop for all surfaces, very durable and long-lasting; washable and boilable at 95 °C "
                        "without fabric softener. Material: cotton, polyester."]},
    {"rows": ["Mop sprint brush Progresive 40 cm"], "category": "vermop-sprint", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Sprint Brush Progressive 40 cm", "Sprint Brush Progressive mop 40 cm"),
     "description_en": ["- Removes dirt well, excellent cleaning on safety (anti-slip) tiles.",
                        "- Contains bristles that clean grout lines while rinsing out easily.",
                        BOIL_EN]},
    {"rows": ["Mop Sprint Plus Tronic 40 cm"], "category": "vermop-sprint", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Sprint Plus Tronic 40 cm", "Sprint Plus Tronic mop 40 cm"),
     "description_en": TRONIC_EN},
    {"rows": ["Mop Sprint White Magic 40 cm"], "category": "vermop-sprint", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Sprint White Magic 40 cm", "Sprint White Magic mop 40 cm"),
     "description_en": WHITE_MAGIC_EN},
    {"rows": ["Mop Sprint Blue 40 cm"], "category": "vermop-sprint", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Sprint Blue 40 cm", "Sprint Blue mop 40 cm"),
     "description_en": ["- Abrasive mop for optimal mechanical dirt removal. Cleans even the most delicate "
                        "surfaces without scratching.",
                        "- Ideal in combination with the White Magic mop.",
                        "- Designed for structured stone floors and safety tiles in kitchens and sanitary areas.",
                        BOIL_EN,
                        "A replacement for a scrubbing brush."]},
    {"rows": ["Scandic Mono držač mopa 28 cm", "Scandic Mono držač mopa 40 cm"],
     "title_lines": {"Scandic Mono držač mopa 28 cm": 1, "Scandic Mono držač mopa 40 cm": 4},
     "category": "vermop-scandic-mono", "kind": "holder", "brand": "vermop",
     "name": n("Scandic Mono držač mopa", "Scandic Mono mop holder"),
     "variants": size("28 cm", "40 cm", "60 cm", "80 cm", "120 cm"),
     "description_en": ["- Single-sided Velcro mop system for wet, damp and dry floor cleaning on all surfaces.",
                        "- Suitable for small areas (e.g. rooms with lots of furniture) up to large areas such "
                        "as sports and production halls or large receptions.",
                        "- Ideal for cleaning ceilings and walls.",
                        "- Combined with high-quality mops it guarantees optimal results."]},
    {"rows": ["Mop Scandic Mono White Magic 28 cm"],
     "category": "vermop-scandic-mono", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Scandic Mono White Magic 28 cm", "Scandic Mono White Magic mop 28 cm"),
     "description_en": ["- Mop for all surfaces, especially glossy ones.",
                        "- Leaves no streaks. Ideal for ceramic tiles.",
                        "- High-quality microfibres pick up dirt very well.",
                        "- Wet and damp cleaning of all surfaces – floors, walls and ceilings – especially "
                        "structured floors.",
                        BOIL_EN]},
    {"rows": ["Mop Scandic Mono Ceran 28 cm"], "title_lines": 5,
     "category": "vermop-scandic-mono", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Scandic Mono Ceran", "Scandic Mono Ceran mop"),
     "variants": size("28 cm", "40 cm", "60 cm", "80 cm", "120 cm"),
     "description_en": CERAN_EN},
    {"rows": ["Twix držač mopa 30 cm"], "category": "vermop-twix", "kind": "holder", "brand": "vermop",
     "name": n("Twix držač mopa 30 cm", "Twix mop holder 30 cm"),
     "description_en": ["- The Twix mop holder is a double-sided wiping system.",
                        "- Intelligent two-phase cleaning with a single cloth.",
                        "- Wet and dry wiping in one step.",
                        "- Saves time and costs.",
                        "- All the benefits of professional cleaning, such as hands-free rinsing, wringing "
                        "and cloth release.",
                        "- Guarantees outstanding cleaning results."]},
    {"rows": ["Twix Tronic Mop 30 cm"], "category": "vermop-twix", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Twix Tronic 30 cm", "Twix Tronic mop 30 cm"),
     "description_en": TRONIC_EN},
    {"rows": ["Twix White Magic Mop 30 cm"], "category": "vermop-twix", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Twix White Magic 30 cm", "Twix White Magic mop 30 cm"),
     "description_en": WHITE_MAGIC_EN},
    {"rows": ["Twix Ceran Mop 30 cm"], "category": "vermop-twix", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Twix Ceran 30 cm", "Twix Ceran mop 30 cm"),
     "description_en": CERAN_EN},
    {"rows": ["Twix Red Mop 30 cm"], "category": "vermop-twix", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Twix Red 30 cm", "Twix Red mop 30 cm"),
     "description_en": ["Abrasive mop for optimal mechanical dirt removal. Cleans even the most delicate "
                        "surfaces without scratching.",
                        "- Ideal for double cleaning (scrubbing immediately followed by cleaning).",
                        "- Designed for structured stone floors and safety tiles in kitchens and sanitary areas.",
                        BOIL_EN]},
    {"rows": ["Twix Progressive Mop 30 cm"], "category": "vermop-twix", "kind": "consumable", "brand": "vermop",
     "name": n("Mop Twix Progressive 30 cm", "Twix Progressive mop 30 cm"),
     "description_en": ["- Mop for all surfaces.", "- Leaves no streaks.",
                        "- High-quality microfibres, excellent cleaning.",
                        "- Wet and damp cleaning of all types of floors.", BOIL_EN]},
    {"rows": ["Vermop radna kuta"], "category": "vermop-radne-kute", "kind": "other", "brand": "vermop",
     "name": n("Vermop radna kuta", "Vermop work coat"),
     "variants": color("antracit-zelena", "antracit-crvena", "antracit-plava")
                 + size("XS", "S", "M", "L", "XL", "XXL"),
     "description_hr": ["- Dostupne veličine: XS / S / M / L / XL / XXL",
                        "- Boje: antracit sa zelenom, crvenom ili plavom"],
     "description_en": ["- Sizes: XS / S / M / L / XL / XXL",
                        "- Colours: anthracite with green, red or blue"]},
    {"rows": ["Vermop Držač Moča Profi"], "category": "vermop-moco", "kind": "holder", "brand": "vermop",
     "name": n("Vermop držač Moča Profi", "Vermop Močo Profi holder")},
    {"rows": ["Vermop Močo Aqua Basic"], "category": "vermop-moco", "kind": "consumable", "brand": "vermop",
     "name": n("Vermop Močo Aqua Basic", "Vermop Močo Aqua Basic mop")},
    {"rows": ["Vermop WringBoy kanta s ocjeđivačem"], "category": "vermop-kolica", "kind": "tool", "brand": "vermop",
     "name": n("Vermop WringBoy kanta s ocjeđivačem", "Vermop WringBoy bucket with wringer")},
    {"rows": ["Aqua Wet mop kolica 1x17L + 1x6L"], "category": "vermop-kolica", "kind": "tool", "brand": "vermop",
     "name": n("Aqua Wet kolica za mop 1 × 17 L + 1 × 6 L", "Aqua Wet mop trolley 1 × 17 L + 1 × 6 L"),
     "description_en": ["- Plastic cleaning trolley with wringer, a 17 L bucket and a 6 L bucket for "
                        "separated cleaning."]},
    {"rows": ["Shopster Twix-Press kolica"], "category": "vermop-kolica", "kind": "tool", "brand": "vermop",
     "name": n("Shopster Twix-Press kolica", "Shopster Twix-Press trolley"),
     "specs": [{"key": "dimensions", "value": "82 × 70 × 95 cm"}],
     "description_en": ["- Trolley dimensions: W 82 × D 70 × H 95 cm",
                        "- Very compact",
                        "- Twix-Press trolley with flat press: easy hands-free wringing of mops without "
                        "removing them from the holder.",
                        "- The drawer box offers plenty of space for clean cloths and similar supplies.",
                        "- The complete trolley set consists of 19 parts forming one harmonious unit.",
                        "- Best value for money.",
                        "- Anthracite/yellow as standard. Other colours (anthracite with green, blue or red) "
                        "at extra charge."]},
    {"rows": ["Vermop držač Mop Damp 80 cm"], "title_lines": 4,
     "category": "vermop-velike-povrsine", "kind": "holder", "brand": "vermop",
     "slug": "vermop-drzac-mopa-damp",
     "name": n("Vermop držač mopa Damp", "Vermop Damp mop holder"),
     "variants": size("80 cm", "130 cm")},
    {"rows": ["Vermop držač Mop Damp 80 cm"], "title_lines": 4,
     "category": "vermop-velike-povrsine", "kind": "consumable", "brand": "vermop",
     "slug": "vermop-damp-mop-basic",
     "name": n("Vermop Damp Mop Basic", "Vermop Damp Mop Basic"),
     "variants": size("80 cm", "130 cm")},
    {"rows": ["Podni gurač vode 45 cm"], "title_lines": 3,
     "category": "vermop-velike-povrsine", "kind": "tool", "brand": "vermop",
     "name": n("Podni gurač vode", "Floor squeegee"),
     "variants": size("45 cm", "55 cm", "75 cm"),
     "description_en": ["Double siliconised rubber blade on a chemical-resistant metal frame that easily "
                        "removes water from floors (e.g. in kitchens)."]},
    {"rows": ["VERMOP magične krpe"], "category": "vermop-krpe", "kind": "consumable", "brand": "vermop",
     "name": n("Vermop magične krpe", "Vermop magic microfibre cloths"),
     "variants": color("crvena", "plava", "zelena", "zuta", "antracit"),
     "description_en": ["- Magic microfibre cloth 35 × 40 cm", "- 270 g/m³", "- Washable at 95 °C",
                        "- Colours: red, blue, green, yellow, anthracite"]},
    {"rows": ["Vermop višenamjenska Fleece krpa"], "category": "vermop-krpe", "kind": "consumable", "brand": "vermop",
     "name": n("Vermop višenamjenska Fleece krpa", "Vermop multi-purpose fleece cloth"),
     "description_en": ["- Available in several colours"]},
    {"rows": ["Oprema za pranje prozora, radnih površina te čišćenje stropova, namještaja cijevi i sl."],
     "category": "vermop-krpe", "kind": "tool", "brand": "vermop",
     "name": n("Oprema za pranje prozora i radnih površina", "Window and surface cleaning equipment"),
     "description_hr": ["Oprema za pranje prozora, radnih površina te čišćenje stropova, namještaja, cijevi i sl."],
     "description_en": ["Equipment for cleaning windows and work surfaces as well as ceilings, furniture, "
                        "pipes and similar."]},

    # Staklene čaše -----------------------------------------------------------
    {"rows": ["Čaša CASABLANCA COCKTAIL 3,55 dcl"], "category": "staklene-case", "kind": "glassware",
     "name": n("Čaša Casablanca Cocktail 3,55 dl", "Casablanca cocktail glass 3.55 dl")},
    {"rows": ["Čaša CASABLANCA WHISKY 2,69 dcl"], "category": "staklene-case", "kind": "glassware",
     "name": n("Čaša Casablanca Whisky 2,69 dl", "Casablanca whisky glass 2.69 dl")},
    {"rows": ["Čaša BOSTON SHOTS 0,04 dcl"], "category": "staklene-case", "kind": "glassware",
     "name": n("Čaša Boston Shots 0,04 dl", "Boston shot glass 0.04 dl")},
    {"rows": ["Čaša ALLEGRA BIJELO VINO 3,50 dcl"], "category": "staklene-case", "kind": "glassware",
     "name": n("Čaša Allegra za bijelo vino 3,50 dl", "Allegra white wine glass 3.50 dl")},
    {"rows": ["Čaša SYMETRIE 0,45 dcl"], "category": "staklene-case", "kind": "glassware",
     "name": n("Čaša Symetrie 0,45 dl", "Symetrie glass 0.45 dl")},
]

# Rows that legitimately feed two products (one cell lists holder + mop).
SHARED_ROWS = {"Vermop držač Mop Damp 80 cm"}

# Rows that are not products (their images are used as category images).
SKIP = [
    "Ostatak raznovrsnih čaša na upit",
    "Ostatak raznovrsne opreme na upit",
    "Kraft asortiman",
]

# --------------------------------------------------------------------------- Kraft list (paragraphs)
# key = text as in the document; duplicates are disambiguated with "#<occurrence>"
KRAFT = {
    "Papir za zamatanje 32x30cm 1000/1": n("Papir za zamatanje 32 × 30 cm (1000/1)", "Wrapping paper 32 × 30 cm (1000/pack)"),
    "Papir za zamatanje 32x50cm 1000/1": n("Papir za zamatanje 32 × 50 cm (1000/1)", "Wrapping paper 32 × 50 cm (1000/pack)"),
    "Papirnata hamburger vrećica 18x18cm 1000/1": n("Papirnata vrećica za hamburger 18 × 18 cm (1000/1)", "Paper burger bag 18 × 18 cm (1000/pack)"),
    "Papirnata hamburger vrećica 25x25cm 1000/1": n("Papirnata vrećica za hamburger 25 × 25 cm (1000/1)", "Paper burger bag 25 × 25 cm (1000/pack)"),
    "Kraft posuda 750ml": n("Kraft posuda 750 ml", "Kraft bowl 750 ml"),
    "Kraft posuda 1000ml": n("Kraft posuda 1000 ml", "Kraft bowl 1000 ml"),
    "Kraft posuda 1100ml - okrugla": n("Kraft posuda okrugla 1100 ml", "Round kraft bowl 1100 ml"),
    "Kraft posuda 1300ml - okrugla": n("Kraft posuda okrugla 1300 ml", "Round kraft bowl 1300 ml"),
    "PET poklopac za kraft posude 500,750,1000ml": n("PET poklopac za kraft posude 500/750/1000 ml", "PET lid for kraft bowls 500/750/1000 ml"),
    "PET poklopac okrugli 187mm": n("PET poklopac okrugli 187 mm", "Round PET lid 187 mm"),
    "Aluminijska posuda 450ml": n("Aluminijska posuda 450 ml", "Aluminium container 450 ml"),
    "ALU poklopac": n("ALU poklopac za posudu 450 ml", "Aluminium lid for 450 ml container"),
    "Aluminijska posuda 845ml": n("Aluminijska posuda 845 ml", "Aluminium container 845 ml"),
    "Poklopac za posudu#0": n("Poklopac za aluminijsku posudu 845 ml", "Lid for 845 ml aluminium container"),
    "Aluminijska posuda 940ml": n("Aluminijska posuda 940 ml", "Aluminium container 940 ml"),
    "Poklopac za posudu#1": n("Poklopac za aluminijsku posudu 940 ml", "Lid for 940 ml aluminium container"),
    "PP posuda 1000ml crna + poklopac transparent": n("PP posuda crna 1000 ml + prozirni poklopac", "Black PP container 1000 ml + clear lid"),
    "PP posuda 750ml crna + poklopac transparent": n("PP posuda crna 750 ml + prozirni poklopac", "Black PP container 750 ml + clear lid"),
    "PP posuda 1250ml crna + transparent poklopac": n("PP posuda crna 1250 ml + prozirni poklopac", "Black PP container 1250 ml + clear lid"),
    "Aluminijska pladanj - mali": n("Aluminijski pladanj – mali", "Aluminium tray – small"),
    "Aluminijski pladanj - srednji": n("Aluminijski pladanj – srednji", "Aluminium tray – medium"),
    "Rukavice - nitril S/M/L/XL 100/1": n("Rukavice nitrilne S/M/L/XL (100/1)", "Nitrile gloves S/M/L/XL (100/pack)"),
    "Kartonski tanjur fi23cm": n("Kartonski tanjur Ø 23 cm", "Cardboard plate Ø 23 cm"),
    "Kraft posuda okrugla 480/550ml": n("Kraft posuda okrugla 480/550 ml", "Round kraft bowl 480/550 ml"),
    "Kraft poklopac za posudu za juhu 500ml": n("Kraft poklopac za posudu za juhu 500 ml", "Kraft lid for soup cup 500 ml"),
    "Kraft posuda za hamburger 11,4x11,4x9cm": n("Kraft kutija za hamburger 11,4 × 11,4 × 9 cm", "Kraft burger box 11.4 × 11.4 × 9 cm"),
    "Kraft posuda za hamburger 13x13x10cm": n("Kraft kutija za hamburger 13 × 13 × 10 cm", "Kraft burger box 13 × 13 × 10 cm"),
    "Kraft vrećica 26x17x25cm 250/1": n("Kraft vrećica 26 × 17 × 25 cm (250/1)", "Kraft bag 26 × 17 × 25 cm (250/pack)"),
    "Kraft posuda za wok 1000ml": n("Kraft posuda za wok 1000 ml", "Kraft wok box 1000 ml"),
    "Papirnate slamke crne/u boji - FI8x210mm 500/1": n("Papirnate slamke crne/u boji Ø 8 × 210 mm (500/1)", "Paper straws black/coloured Ø 8 × 210 mm (500/pack)"),
    "Papirnate slamke crne - FI8x150mm 500/1": n("Papirnate slamke crne Ø 8 × 150 mm (500/1)", "Black paper straws Ø 8 × 150 mm (500/pack)"),
    "Slamke BIO plastika 21cm": n("Slamke od BIO plastike 21 cm", "Bio-plastic straws 21 cm"),
    "PS Vilica REUSABLE - crna 17cm": n("Vilica PS višekratna, crna 17 cm", "Reusable PS fork, black 17 cm"),
    "PS Nož REUSABLE - crni 17cm": n("Nož PS višekratni, crni 17 cm", "Reusable PS knife, black 17 cm"),
    "PS Žlica REUSABLE - crna 17cm": n("Žlica PS višekratna, crna 17 cm", "Reusable PS spoon, black 17 cm"),
    "PS REUSABLE - Set vilica,nož,žlica,salv.-lux": n("Set pribora PS višekratni – vilica, nož, žlica, salveta (lux)", "Reusable PS cutlery set – fork, knife, spoon, napkin (lux)"),
    "PS REUSABLE - Set vilica, nož, salv. - lux": n("Set pribora PS višekratni – vilica, nož, salveta (lux)", "Reusable PS cutlery set – fork, knife, napkin (lux)"),
    "Kraft plitica 400ml": n("Kraft plitica 400 ml", "Kraft tray 400 ml"),
    "Kraft plitica 800ml": n("Kraft plitica 800 ml", "Kraft tray 800 ml"),
    "Kraft plitica 1200ml": n("Kraft plitica 1200 ml", "Kraft tray 1200 ml"),
    "Čaša 300ml": n("Plastična čaša 300 ml", "Plastic cup 300 ml"),
    "Čaša 400ml": n("Plastična čaša 400 ml", "Plastic cup 400 ml"),
    "Čaša 500ml": n("Plastična čaša 500 ml", "Plastic cup 500 ml"),
    "Poklopac - kupola bez rupe": n("Poklopac kupola bez rupe", "Dome lid without hole"),
    "Poklopac - kupola sa rupom": n("Poklopac kupola s rupom", "Dome lid with hole"),
    "Ravni poklopac sa križićem": n("Ravni poklopac s križićem", "Flat lid with straw slot"),
    "Preklopna kutija za umak 50ml": n("Preklopna kutija za umak 50 ml", "Hinged sauce container 50 ml"),
    "Stiroporna kutija 240x210x70 - jednodijelna": n("Stiroporna kutija 240 × 210 × 70 – jednodijelna", "Foam box 240 × 210 × 70 – single compartment"),
    "Stiroporna kutija 240x210x70 - dvodijelna": n("Stiroporna kutija 240 × 210 × 70 – dvodijelna", "Foam box 240 × 210 × 70 – two compartments"),
    "Stiroporna kutija 240x210x70 - trodijelna": n("Stiroporna kutija 240 × 210 × 70 – trodijelna", "Foam box 240 × 210 × 70 – three compartments"),
    "Kutija za 1 kolač": n("Kutija za 1 kolač", "Box for 1 cake slice"),
    "Kutija za 2 kolača": n("Kutija za 2 kolača", "Box for 2 cake slices"),
    "Kutija za 4 kolača": n("Kutija za 4 kolača", "Box for 4 cake slices"),
    "Kutija za 6-8 kolača": n("Kutija za 6–8 kolača", "Box for 6–8 cake slices"),
    "Čačkalice 1000/1": n("Čačkalice (1000/1)", "Toothpicks (1000/pack)"),
    "Posuda za sladoled 130ml": n("Posuda za sladoled 130 ml", "Ice cream cup 130 ml"),
    "Posuda za sladoled 250ml": n("Posuda za sladoled 250 ml", "Ice cream cup 250 ml"),
    "Finger Food pikalica 15cm 100/1": n("Finger food pikalica 15 cm (100/1)", "Finger food pick 15 cm (100/pack)"),
    "PP poklopac za posude MB": n("PP poklopac za posude MB", "PP lid for MB containers"),
    "Crna PP posuda MB1 - H50": n("PP posuda MB1 crna – H50", "Black PP container MB1 – H50"),
    "PP posuda MB2 - H50": n("PP posuda MB2 – H50", "PP container MB2 – H50"),
    "PP posuda MB3 - H50": n("PP posuda MB3 – H50", "PP container MB3 – H50"),
    "PP posuda okrugla 500ml crna + poklopac transparent": n("PP posuda okrugla crna 500 ml + prozirni poklopac", "Round black PP container 500 ml + clear lid"),
    "Finger Food pikalica 12cm 250/1": n("Finger food pikalica 12 cm (250/1)", "Finger food pick 12 cm (250/pack)"),
    "Aluminijska posuda 1250ml": n("Aluminijska posuda 1250 ml", "Aluminium container 1250 ml"),
    "ALU poklopac za S1250L": n("ALU poklopac za posudu S1250L", "Aluminium lid for S1250L container"),
    "Aluminijska posuda 2380ml": n("Aluminijska posuda 2380 ml", "Aluminium container 2380 ml"),
    "Aluminijska posuda 3240ml": n("Aluminijska posuda 3240 ml", "Aluminium container 3240 ml"),
    "Aluminijska posuda 4750ml": n("Aluminijska posuda 4750 ml", "Aluminium container 4750 ml"),
    "Ovalna posuda 250ml": n("Ovalna posuda 250 ml", "Oval container 250 ml"),
    "Ovalna preklopna posuda 375ml": n("Ovalna preklopna posuda 375 ml", "Oval hinged container 375 ml"),
    "Ovalna posuda 500ml": n("Ovalna posuda 500 ml", "Oval container 500 ml"),
    "Preklopna posuda 750ml": n("Preklopna posuda 750 ml", "Hinged container 750 ml"),
    "Ovalna posuda 1000ml": n("Ovalna posuda 1000 ml", "Oval container 1000 ml"),
    "Preklopna posuda 125ml": n("Preklopna posuda 125 ml", "Hinged container 125 ml"),
    "Preklopna posuda 250ml PET": n("Preklopna posuda PET 250 ml", "Hinged PET container 250 ml"),
    "ALU folija 45x150": n("ALU folija 45 × 150", "Aluminium foil 45 × 150"),
    "STRECH folija 45x300": n("Stretch folija 45 × 300", "Stretch film 45 × 300"),
    "Čaša 200ml 1 kom": n("Plastična čaša 200 ml", "Plastic cup 200 ml"),
    "Stiroporna kutija 150x150x70": n("Stiroporna kutija 150 × 150 × 70", "Foam box 150 × 150 × 70"),
    "ALU folija 30x150": n("ALU folija 30 × 150", "Aluminium foil 30 × 150"),
    "Crna posuda dno - 1000ml": n("Crna posuda (dno) 1000 ml", "Black container (base) 1000 ml"),
    "Prozirni poklopac za B48 1000ml": n("Prozirni poklopac za posudu B48 1000 ml", "Clear lid for B48 container 1000 ml"),
    "Kutije za pizzu 26x26 cm": n("Kutija za pizzu 26 × 26 cm", "Pizza box 26 × 26 cm"),
    "Kutije za pizzu 33x33 cm": n("Kutija za pizzu 33 × 33 cm", "Pizza box 33 × 33 cm"),
    "Kutije za pizzu 45x45 cm": n("Kutija za pizzu 45 × 45 cm", "Pizza box 45 × 45 cm"),
}

# --------------------------------------------------------------------------- notes for the review file
REVIEW_NOTES = [
    "**Kraft** (86 stavki): bez slika (placeholder) kako je traženo. Dokument ima 23 \"plutajuće\" slike uz Kraft listu, "
    "ali su usidrene uz krive retke (npr. aluminijski pladanj uz \"PP posuda 750ml\", kutija za pizzu uz \"Crna posuda dno\"), "
    "pa ih ne dodjeljujem bez tvoje potvrde.",
    "**Dvosmisleni poklopci** u Kraft listi: \"ALU poklopac\" i dva puta \"Poklopac za posudu\" – pripisao sam ih posudi iznad "
    "(450 / 845 / 940 ml). Molim potvrdu.",
    "**Duplikati** između Kraft liste i ostatka: \"Čačkalice 1000/1\" ↔ \"Čačkalice higijenske\", \"Rukavice - nitril\" ↔ "
    "\"Nitril rukavice\", \"STRECH folija 45x300\" ↔ \"Strech folija industrijska\". Zasad su odvojeni proizvodi – spojiti?",
    "**Salvete 38 × 38** (CCSCRV/CCSCZEL/CCSCRN/CCSBOR/CCSBIL) su odvojeni proizvodi jer imaju različite šifre. "
    "Mogu ih spojiti u jedan proizvod s bojama kao varijantama (šifra po varijanti).",
    "**Varijante iz jedne ćelije**: strojno pranje 5/10/25 L, ispiranje 5/10 L, ručno pranje 5/1/0,5 L (dvije ćelije spojene), "
    "podovi 5/1 L, VERTIX 1/0,75 L (pretpostavka da je 0,75 L također VERTIX), Scandic Mono držač 28–120 (dvije ćelije), "
    "Ceran 28–120, Damp držač i Damp mop 80/130 (jedna ćelija → dva proizvoda), gurač vode 45/55/75, vreće LD 3 veličine.",
    "**Scandic teleskopski štap**: naslov prvog reda u dokumentu je zbrkan (\"s rotirajučom kuglom s fixnom kuglom s rotirajučom kuglom\"). "
    "Nazvao sam ga po rasponu iz opisa: \"100–170 cm\" (okretni mehanizam) i \"s rotirajućom kuglom 80–171 cm\" (tipka).",
    "**Volumeni čaša** \"Boston Shots 0,04 dcl\" i \"Symetrie 0,45 dcl\" prenio sam doslovno – 0,04 dl = 4 ml djeluje kao greška (0,4 dl?).",
    "**Žica inox 2/1**: naziv kaže 2/1, opis \"3 komada u pakiranju\" – prenio sam oboje, molim ispravak.",
    "**Sol za deporator** – nisam siguran što je \"deporator\"; EN naziv je opisni (\"Tablet salt for water treatment\").",
    "**Kategorizacija izvan ponude**: rukavice → Pribor › Rukavice; čačkalice, štapići za roštilj, kocke za potpalu → Ambalaža › "
    "Ugostiteljski pribor; mrežice za pisoar, WC osvježivač, solna kiselina, varekina, CEVOKIM → Kemija › Sanitarije.",
    "**Brendovi**: Vermop (cijela Vermop sekcija), Kobold (ANTIBAC), Labud (samo artikli s \"LABUD\" u nazivu). "
    "Radion i Splendida logotipi postoje u dokumentu → idu u carousel, ali nisu vezani ni za jedan proizvod.",
    "**Specifikacije papira** parsirane su iz natuknica (slojevi, preklop, boja, duljina, širina, dimenzije listića, pakiranje). "
    "CCTMS ima \"(? listića)\" u dokumentu – broj listića izostavljen.",
    "**Šifre** su prenesene točno kao u dokumentu, uklj. \"CCT(9000)\" i \"CCS Only one\".",
]
