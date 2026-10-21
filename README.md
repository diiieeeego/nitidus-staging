# Nitidus d.o.o. – web katalog

Katalog higijenskih i sanitarnih potrepština za Nitidus d.o.o. (Zadar). Sve cijene su **na upit** –
cijene iz ponude se ne uvoze i ne prikazuju nigdje.

- **Next.js 16** (App Router, Cache Components, TypeScript strict), Tailwind CSS v4
- **next-intl** – `hr` (zadano) i `en`, rute pod `/[locale]/…`
- **Bez baze podataka** – katalog je JSON u repou (`data/`), validiran zod shemama pri buildu
- Upiti se šalju e-mailom (SMTP, `nodemailer`); ništa se ne sprema

## Pokretanje lokalno

```bash
npm install
cp .env.example .env.local   # pa postavi MAIL_TRANSPORT=log za lokalni rad
npm run dev                  # http://localhost:3000
```

Uz `MAIL_TRANSPORT=log` upiti se ispisuju u konzolu servera umjesto slanja.

Provjere prije commita: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Struktura

| Putanja | Sadržaj |
|---|---|
| `app/[locale]/` | stranice: naslovna, `proizvodi`, `proizvodi/[slug]`, `pretraga` |
| `app/api/search` | `GET /api/search?q=&locale=` – pretraga za navbar |
| `components/` | layout, naslovna (scene s pinovima, carousel), proizvod, pretraga, forma upita |
| `lib/catalog/` | zod sheme, pristup podacima (jedino mjesto koje čita `data/`), pretraga |
| `lib/inquiry/` | Server Action za upite, zod shema (dijeljena s klijentom), SMTP, rate limit |
| `messages/hr.json`, `messages/en.json` | sav tekst sučelja |
| `data/` | generirani katalog + ručno uređene scene (`scenes.json`) |
| `scripts/` | uvoz iz `docs/` (Python, samo standardna biblioteka + Pillow) |
| `env.ts` | validacija env varijabli – neispravne/nedostajuće ruše build |

## Katalog: uvoz i ažuriranje

```bash
npm run catalog
```

Pokreće redom:

1. `scripts/extract_docx.py` – čita `docs/Nitudus d.o.o ponuda.docx` (samo stupce slika + opis; količine i
   cijene se ne čitaju) → `data/catalog.json`, slike u `public/products/*.webp`, `data/catalog.review.md`.
   Nazivi, kategorije, varijante, EN tekst i ispravci tipfelera su u `scripts/catalog_curation.py`.
   Svaki redak dokumenta mora biti pokriven kuracijom, inače skripta javlja grešku.
2. `scripts/import_marplast.py` – čita `docs/marplast_sifre.xlsx` → `data/marplast.json`.
   Titanium boje se nikad ne uvoze; Skin linija samo bijela / stone / carbon. Artikli označeni kao ukinuti
   (CCAC80, CCSP46) skriveni su sa stranice.
3. `scripts/build_links.py` – kompatibilnosti (`data/compatibility.json`), povezani proizvodi, udarni
   proizvodi i `data/compatibility.review.md`.

Skripte su idempotentne – ponovno pokretanje na istom ulazu daje identične datoteke.

### Kompatibilnosti

Usmjereni brid `host → fits` (dispenzer/držač → papir, uložak, mop…), stranica proizvoda čita ga u oba
smjera („Kompatibilni potrošni artikli“ / „Kompatibilno s“). `note`:

- `null` – potvrđeno (iz Marplast popisa)
- `check – …` – iz popisa, ali s otvorenim pitanjem
- `auto:format – …` – pretpostavka po pravilu (Vermop sustavi), čeka potvrdu

Pregled: `data/compatibility.review.md`. Za potvrdu/izmjenu uredi pravila u `scripts/build_links.py`
ili `scripts/import_marplast.py` i pokreni `npm run catalog`.

### Udarni proizvodi

Ako postoji `docs/udarni.txt` (jedan slug ili šifra po retku), koristi se on. Inače privremeno:
Marplast dispenzeri + po jedan ključni potrošni artikl po tipu.

### Scene s pinovima (naslovna)

`data/scenes.json` – slika scene, omjer, naslov/alt (hr/en) i pinovi (`product`, `x_pct`, `y_pct`).
Fotografije prostorija su u `docs/dispenseri_nitidus/skincollection_*.jpg`; `scripts/prepare_scenes.py`
ih reže na 4:3 i sprema u `public/scenes/*.webp` (dio `npm run catalog`). Koordinate pinova su postotci
**izrezane** slike. Za novu scenu ili pomicanje pinova:

1. dodaj sliku i izrez u `SCENES` u `scripts/prepare_scenes.py`, pokreni `npm run catalog`,
2. `npm run dev`, otvori `http://localhost:3000/hr?editPins=1`,
3. klik na sliku ispisuje `x_pct` / `y_pct` (na slici i u konzoli preglednika) – prepiši u `hotspots`.

Pin čiji je proizvod neaktivan ne prikazuje se.

### Slike Marplast proizvoda

`docs/dispenseri_nitidus/<šifra>-<boja>_….jpg` → `IMAGES` u `scripts/import_marplast.py` (prva slika je
glavna). Modeli 885, 911, 923, 943 i 949 nisu u Marplast popisu – dodani su prema fotografijama
(`FROM_IMAGES`), a njihove veze imaju status „provjeriti“.

## Paleta i kontrast (WCAG AA)

| Par | Omjer | Upotreba |
|---|---|---|
| tamni tekst `#171717` na `#74C054` (brand green) | 8.03 : 1 | zeleni elementi s tamnim tekstom |
| bijeli tekst na `#3F7A2A` (green-700) | 5.21 : 1 | primarni gumbi, zeleni naglasci |
| tamni tekst na `#FDBA37` (amber) | 10.46 : 1 | CTA naglasak, banner dostave |
| `#3213DA` (blue) na bijelom | 9.37 : 1 | linkovi, sekundarni gumbi |
| `#3213DA` na amber | 5.47 : 1 | dopušteno |
| `#525252` (muted) na bijelom | 7.81 : 1 | sekundarni tekst |

Ne koristi se: bijeli tekst na `#74C054` (2.23) ni na `#FDBA37` (1.71). Tokeni su u `app/globals.css`.

## Deploy na Vercel

1. Importaj repozitorij u Vercel (Framework preset: **Next.js** – build `next build`, output automatski).
2. Node.js verzija: **24.x** (iz `engines` u `package.json`).
3. Environment Variables (Production i Preview) – vidi `.env.example`:

   | Varijabla | Obavezno | Napomena |
   |---|---|---|
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | da | SMTP račun s kojeg se šalju upiti |
   | `INQUIRY_EMAIL` | ne | zadano `nitidusdoo@gmail.com` |
   | `IP_HASH_SALT` | da | nasumičan string ≥ 16 znakova |
   | `SITE_URL` | preporučeno | npr. `https://nitidus.hr`; bez njega se koristi Vercel production domena |

   Bez SMTP varijabli build pada (namjerno). `MAIL_TRANSPORT=log` nije dopušten u produkciji.
4. Domena: dodaj `nitidus.hr` u Project → Domains i postavi `SITE_URL`.

**SMTP napomena:** za Gmail treba App Password (2FA uključen); za vlastitu domenu bolje je koristiti
SMTP hosting providera i `SMTP_FROM` s te domene (SPF/DKIM), inače mailovi mogu završiti u spamu.
Odgovor na upit ide izravno posjetitelju (`reply-to`).

## Poznata ograničenja

- **Rate limit** upita je u memoriji instance (nema baze): na serverlessu svaka instanca broji zasebno.
  Honeypot i minimalno vrijeme ispunjavanja hvataju većinu botova.
- **404 stranica** vraća ispravan status 404 i `noindex`, ali se u Next.js 16.4.2 sadržaj `not-found.tsx`
  unutar root layouta s dinamičkim segmentom (`app/[locale]`) renderira tek na klijentu (HTML je
  `__next_error__` shell). Reproducira se i na minimalnom projektu – provjeriti nakon nadogradnje Nexta.
- Logotip (`components/layout/Logo.tsx`) i logotipi Marplast/Kobold/Labud su placeholderi do dostave.
- Kraft asortiman i dio Marplast proizvoda nemaju slike (placeholder).
