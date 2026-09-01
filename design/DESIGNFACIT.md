# Handoff: Blanso — bokningsplattform för boenden i Östafrika

## Overview
Blanso är en bokningssajt (Booking.com-liknande flöde, premium-estetik à la Four Seasons) för boenden i Östafrika. Denna handoff täcker hela frontend-designen: landing, sökresultat, hotelldetaljsida, checkout och bekräftelse — plus det UI-system alla sidor bygger på. Uppgiften för Claude Code: **bygg backend + återskapa frontend i er valda stack** (t.ex. Next.js + Postgres) med dessa filer som designfacit.

## About the Design Files
Filerna i paketet är **designreferenser i HTML** (prototyper). De visar exakt utseende och beteende men är inte produktionskod. Återskapa dem i målkodbasens miljö och mönster. Finns ingen kodbas ännu: välj lämpligt ramverk (rekommendation: Next.js/React) och implementera designen där.

## Fidelity
**High-fidelity.** Färger, typografi, spacing och interaktioner är slutgiltiga. Återskapa pixel-troget. Alla värden finns som tokens (se Design Tokens).

## Sidor / Flöde
Flödet: Landing → Sök → Hotellsida → Bokning → Bekräftelse.

### 1. Landing (`Blanso Landing v2.dc.html`)
- **Syfte:** Entré, sök och utvalda boenden.
- **Layout:** Header 72px (hairline-underkant) · Hero 560px fullbredd foto med scrim-gradient och H1 display 66px versal i nederkant vänster · Sökrad (1px svart ram, 5 celler: Destination/Ankomst/Avresa/Gäster/Sök-knapp) centrerad maxbredd 1200px · Sektionsrubrik centrerad (etikett + H2 42px) · 3 kort i grid (3 kolumner, gap 36×32px, bild 3:4, etikett + korttitel 26px + pris) · Footer.
- **Interaktion:** Kort och Sök-knapp → sökresultatsidan. Bildhover: zoom 1.04, 700 ms.

### 2. Sökresultat (`Blanso Sök.dc.html`)
- **Syfte:** Lista/filtrera/sortera boenden i en destination.
- **Layout:** Header · Kompakt sökrad under headern · Titelrad: etikett "N BOENDEN · datum · gäster" + H1 destination, till höger sorteringsknappar Pris/Betyg (aktiv = solid svart) · Grid 200px filterspalt + resultatlista (gap 56px) · Resultatrad: grid 240px bild (170px hög) / text / högerspalt (betyg, antal recensioner, pris per natt), skiljda av hairlines, första raden börjar med 1px svart topplinje.
- **Filter:** checkboxgrupper (Pris per natt, Typ, Faciliteter), accent-color svart. I prototypen är filtren statiska; backend ska göra dem funktionella.
- **Sortering (implementerad i prototypen):** state `sort: "price" | "rating"`; pris stigande, betyg fallande.
- **Responsivt:** <1100px: filterspalten lägger sig ovanför som horisontella grupper; <760px: resultatrad stackar (bild fullbredd, högerspalt vänsterställd).
- **Demodata (seed):** 5 boenden i Mogadishu — Lido Beach Suite $85 4,8 (128 rec) · Jazeera Beach House $210 4,9 (64) · Hamarweyne Loft $65 4,7 (92) · Peace Garden Apartment $55 4,6 (41) · Aden Adde Residence $48 4,5 (77).

### 3. Hotellsida (`Blanso Hotell — Lido Beach Suite.dc.html`)
- **Syfte:** Detaljsida för ett boende (Booking-paritet).
- **Layout:** Header · Brödsmula (etikett) + H1 54px versal + adressrad; betyg 38px + "128 RECENSIONER" högerställt · Fotogrid: `2fr 1fr 1fr`, två rader à 280px, gap 8px, huvudbild spänner 2 rader; knapp "Alla 24 foton" (outline) i nedre högra bilden · Tvåspaltslayout `1fr / 380px`, gap 72px:
  - **Vänster:** Om boendet (ingress 19px, max 60ch) · Faciliteter (2-kolumnsgrid, 8 st) · **Välj rum**: 1px svart topplinje, rader `160px bild / info / pris+knapp` — rumsnamn 26px, specrad versal 11px ("48 m² · King size · 2 gäster · Havsutsikt · Terrass"), villkorsrad 17px, pris 30px + "PER NATT" + Välj-knapp (första rummet solid, övriga outline) · **Läget**: kartyta 320px (image-slot i prototypen; ersätt med riktig karta) + 3 nyckelavstånd (siffra 24px + grå text) · **Recensioner**: 2 citat i kursiv display 22px + författaretikett, länk "Läs alla 128 recensioner".
  - **Höger (sticky top 24px, 1px svart ram):** pris 36px + PER NATT · datum/gäst-grid med hairlines · prisuppställning ($85 × 5 nätter / Serviceavgift 8 % / Totalt, svart topplinje) · "Boka" solid fullbredd · trustrad 9px versal.
- **Rumsdata:** Havssviten 48 m² $85 · Familjesviten 72 m² 2 sovrum $130 · Gårdsrummet 32 m² $60. Fri avbokning 48 h; frukost ingår i svit-rummen.
- **Responsivt:** <1100px: bokningsrutan under innehållet; <640px: rumsrader stackar.

### 4. Bokning / checkout (`Blanso Bokning.dc.html`)
- **Syfte:** Slutföra bokning.
- **Layout:** Header · Brödsmula + H1 "Slutför bokning" · Samma tvåspaltslayout:
  - **Vänster, tre numrerade sektioner:** 1 · Din vistelse (readonly-grid ankomst/avresa/rum) · 2 · Gästuppgifter (2-kolumnsgrid: förnamn, efternamn, e-post, telefon; textarea meddelande till värden) · 3 · Betalning (radioval: Kort / EVC Plus–Zaad / Betala på plats — vald har svart ram; kortfält kortnummer/giltigt till/CVC) + sandbox-notis.
  - **Höger (sticky):** boendekort med bild 180px, sammanfattning, prisuppställning, "Bekräfta och betala" (solid) → bekräftelsesidan.
- **Inputs:** 1px hairline-ram, padding 12×14px, EB Garamond 17px, etikett 9px versal ovanför. Focus: 2px svart outline.

### 5. Bekräftelse (`Blanso Bekräftelse.dc.html`)
- **Syfte:** Kvitto/bekräftelse.
- **Layout:** Header · Centrerad kolumn max 760px: etikett "BOKNING BLN-2026-04187 · BEKRÄFTAD" + H1 "Välkommen till Lido Beach" + ingress · Kvittokort (1px svart ram): bild 220px, boende, ankomst/avresa/gäster-grid, "Betalt totalt $459" · Två knappar: "Ladda ner kvitto" (solid) + "Fortsätt utforska" (outline).

### UI-systemsida (`Blanso UI System.dc.html`)
Referenssida som visar alla tokens live: typskala, färg, knappar, rytm, rörelse. Länkar till alla sidor.

## Interactions & Behavior
- Alla tillståndsövergångar 300 ms `cubic-bezier(.2,.6,.2,1)`; bilder zoomar 1.04 på 700 ms i `.b-media`-wrapper (overflow hidden).
- Entré-animation `b-rise`: fade + 16px uppåt, 700 ms, stegrad 120/240 ms.
- Hover: solid knapp → #2d2d2d; outline-knapp inverteras till svart/vit; länkar → #6d6d6d.
- Focus-visible: 2px svart outline, offset 2px. Selection: svart bakgrund/vit text.
- Sortering på söksidan enligt ovan. Bokningsflödets navigation är vanliga länkar i prototypen — ersätt med riktig routing + state.

## State Management (backend-krav)
- **Sök:** query-params destination/datum/gäster; filter (prisintervall, typ, faciliteter); sortering pris/betyg; antal träffar.
- **Boende:** id, namn, område, stad, land, beskrivning, faciliteter[], foton[], koordinater, betyg (aggregat), recensioner[].
- **Rum:** boende-id, namn, m², bäddtyp, kapacitet, egenskaper[], pris/natt, avbokningsregel, frukost bool.
- **Bokning:** rum-id, datumintervall, gäster, gästuppgifter, betalmetod (kort/EVC Plus/Zaad/på plats), prisuppställning (nätter × pris + serviceavgift 8 %, avrundad), status, bokningsnummer format `BLN-ÅÅÅÅ-NNNNN`.
- **Betalning:** sandbox i första läget ("Du debiteras inte ännu"); fri avbokning till 48 h före ankomst.
- Valuta USD i prototypen. Svenska som UI-språk.

## Design Tokens (`blanso/styles.css` — komplett i paketet)
- **Färg (monokrom, inga accentfärger):** `--ink #000` text/knappar · `--ink-2 #2d2d2d` sekundär text · `--muted #6d6d6d` etiketter/meta · `--faint #aaa6a3` placeholder · `--hairline #d8d8d8` linjer · `--paper #fff` · `--wash #f7f6f4` · scrim-gradient för hjältebilder.
- **Typografi:** Display/rubriker/siffror: Cormorant Garamond (300/400, versala rubriker, letter-spacing 2px; logga 28px ls 6px) · Löptext: EB Garamond · Etiketter/knappar: Inter 700 versal 10px ls 3px (kompakt variant 9px/2px).
- **Typskala (endast dessa):** 66 display · 54 h1 · 42 h2 · 26 h3/korttitel · 30 siffror/pris · 19 ingress · 17 löptext · 10 etikett.
- **Rytm:** 8/12/16/24/32/48/64/96px · sidmarginal 48px · maxbredd 1200px. Inga border-radius, inga skuggor — hierarki via storlek, versaler, vitrum och 1px-linjer (svart för betoning, #d8d8d8 annars).
- **Rörelse:** `--dur-fast 150ms`, `--dur 300ms`, `--dur-slow 700ms`, easing `cubic-bezier(.2,.6,.2,1)`.
- **Komponenter i CSS:n:** `.b-label`, `.b-btn`/`.b-btn-solid`/`.b-btn-block`, `.b-media`, `.b-rise/-2/-3`, `.b-detail-grid`, `.b-room-row`, `.b-search-grid`, `.b-result-row`, `.b-nowrap` — med responsiva brytpunkter 1100/760/640px.

## Assets
- Foton: Unsplash-platshållare (URL:er i filerna) — ersätt med riktiga boendefoton.
- Kartytan på hotellsidan är en platshållare — implementera riktig karta (t.ex. MapLibre/Leaflet).
- Typsnitt via Google Fonts: Cormorant Garamond, EB Garamond, Inter (importeras i `blanso/styles.css`).
- Ingen logotypfil — ordmärket "BLANSO" är satt i Cormorant Garamond.

## Files
- `blanso/styles.css` — alla tokens + basklasser (källan till sanning för stil)
- `Blanso Landing v2.dc.html` · `Blanso Sök.dc.html` · `Blanso Hotell — Lido Beach Suite.dc.html` · `Blanso Bokning.dc.html` · `Blanso Bekräftelse.dc.html`
- `Blanso UI System.dc.html` — tokenreferens
- Obs: `.dc.html`-filerna innehåller en template-/logikstruktur; läs dem som HTML + inline-styles och ignorera `support.js`-mekaniken.
