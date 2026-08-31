# Prompt till Claude Design — flera UI-riktningar för Blanso

> Klistra in allt nedanför linjen i Claude (design/artifacts). Bifoga skärmbilderna
> av den nuvarande sajten så Claude ser utgångsläget. Claude kan inte nå din
> localhost, så allt den behöver finns i prompten.

---

Du är en senior produktdesigner. Jag har en fungerande bokningsplattform, **Blanso**, och vill se **flera helt olika UI-riktningar** för den — inte en itererad gissning, utan en designtävling där jag kan jämföra. Bygg varje riktning som en egen, självständig HTML-artifact jag kan öppna och klicka runt i.

## Vad Blanso är
Blanso är en booking.com-liknande plattform för **Östafrika** — regionen som saknat sin egen. Gäster söker, jämför och bokar boenden i städer som Mogadishu, Hargeisa, Nairobi, Addis Abeba, Zanzibar, Dar es Salaam, Kampala, Kigali och Djibouti. Tonen är **trygg, varm och premium** — den ska kännas som en produkt ett toppbolag skulle skeppa, inte en admin-panel. Allt gränssnitt är på **svenska**.

## Sidor att designa (i varje riktning)
1. **Startsida** — hero med rubrik "Östafrikas egen plats att boka boende", ett sökfält (destination, incheckning, utcheckning, gäster) och snabblänkar till städer, sedan ett rutnät "Populära boenden" (bild, titel, stad/land, betyg, pris/natt).
2. **Sökresultat** — sökfält högst upp + rutnät av boendekort med antal träffar och ett tomt-tillstånd.
3. **Boendesida** — bildgalleri, titel, betyg, plats, värd, beskrivning, bekvämligheter, och en **bokningswidget** (datum, gäster, levande prisnedbrytning: pris × nätter + städavgift + serviceavgift + total, samt "Reservera").
4. **Checkout** — gästuppgifter + betalkort, med en ordersammanfattning (boende, datum, gäster, prisnedbrytning).
5. **Bokningsbekräftelse** — "Bokning bekräftad", bokningsnummer, boende, datum, gäst, betalstatus, total.
6. (Valfritt) **Värdpanel** — publicera boende + tabell över bokningar.

## Varumärke (utgångsläget — exakta värden)
Nuvarande palett är låst till djup teal + varm amber:
- Brand (primär): `#0e6e63` · Brand mörk: `#0a544b` · Brand tint: `#e7f1ef`
- Accent (varm): `#f5a524`
- Ink (text): `#1c2b33` · Muted: `#5b6b72` · Linje: `#e6ebec` · Panel: `#f6f8f8` · Bakgrund: `#ffffff`
- Hero-gradient: `linear-gradient(135deg, #0a544b 0%, #0e6e63 55%, #12867a 100%)`
- Typsnitt: Geist (eller liknande ren grotesk). Rundade hörn (~16–20px), mjuka kort-skuggor.

## Vad jag vill ha
Bygg **4 distinkta riktningar**, var och en med eget namn och egen personlighet. Behåll produkten och innehållet, men våga variera det visuella språket rejält mellan riktningarna, till exempel:
1. **Kustnära & varm** — jordnära teal/sand, stora foton, avslappnad lyx.
2. **Editorial premium** — mycket luft, stark typografi, tidskriftskänsla.
3. **Modig & modern** — större färgblock, tydliga CTA:er, självsäker.
4. **Luftig minimalism** — nästan vitt, subtila linjer, lugn och snabb.

Du får föreslå egna riktningar om du har bättre idéer — men de ska vara **tydligt olika**, inte varianter av samma.

## Krav
- **Premium och säljbart** — som något Airbnb/Stripe/Apple skulle skeppa. Genomtänkt typskala, generös luft, tydlig hierarki, återhållsam färg, mikrointeraktioner.
- **Responsivt** — mobil först, funkar på 375 / 768 / 1440.
- **Svenska** i all UI-text.
- **Klickbart** — sök → boende → checkout → bekräftelse ska gå att navigera med exempeldata (fejka gärna 8–12 östafrikanska boenden med riktiga stadsnamn).
- **Tillgängligt** — kontrast, fokusringar, alt-texter.
- Använd **platshållarfoton** (t.ex. Unsplash-teman: hotell, interiör, kust) så det ser levande ut.

## Leverans
- En **egen artifact per riktning**, namngiven, så jag kan öppna och jämföra sida vid sida.
- Börja med en kort rad per riktning: namn + designidén i en mening.
- Efter alla fyra: en kort jämförelse och din rekommendation med skäl.

Bifogade skärmbilder visar nuvarande sajt som utgångsläge — matcha ambitionsnivån och höj den.
