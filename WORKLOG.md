# WORKLOG — Blanso

NEEDS-DECISION: Värdinloggningen är en delad demokod (`blanso`). Ägarskyddet i
DataStore är byggt och testat per hostId, men innan en ANDRA riktig värd någonsin
släpps in måste per-värd-inloggning byggas (kommer naturligt med Supabase Auth).
Flaggat av Heisenberg 2026-09-01; beslut och tidpunkt är Mahads.

## 2026-09-01 — Backend-skiva: DataStore-arkitektur (natt 2)
Hela appen bakom `DataStore`-interfacet (in-memory nu, Supabase = EN fil sen).
Fullt värdflöde (lägg upp rum, publicera/avpublicera, blockera datum, avboka)
och gästflöde mot lagret. 38 tester. E2E bevisad i webbläsare: värd lade upp
"Takvåning vid Liido Beach" → gäst bokade ($272 korrekt) → syns i värdpanelen.
Heisenberg-rond: betala-och-förlora-hålet stängt (void + ärligt besked),
gäst-ärlighet om demodata, enstegsskrivningar, maxGuests-vakt i kontraktet.

## Slutdom: General Naadir CLEAN (2026-08-28)
Fyra granskningsronder. Heisenberg: 5 defekter. Naadir R1: D1 (IDOR) som båda
missat. Naadir R2: CLEAN + 2 efter (bak-fil i git, cuid-footgun). BOB:s egen
slutkoll i webbläsaren: redirect-bugg på lyckad väg som båda missat. Naadir R3:
NOT CLEAN på död kod (de sista 2 %). Naadir R4: **CLEAN — grönt ljus.**
Grindar gröna genom hela: tsc, eslint, vitest 26/26, next build.

## 2026-08-27/28 — Nattbygge, MVP (Byggaren BOB)

Byggt från noll enligt Byggkedjan. Mål: fullt fungerande booking.com-liknande
plattform med betalning, allt lokalt.

### Klart och verifierat
- Scaffold: Next.js 16 + React 19 + TS + Tailwind v4 + Prisma 6 + SQLite. Kör lokalt.
- Datamodell: Property, Booking, Payment. Pengar som heltal cent (determinism).
- Deterministisk prismotor + tillgänglighetslogik. 17 facittester gröna.
- Betal-sandbox (Stripe-formad, `PaymentProvider`-interface). Kortdata sparas aldrig.
- Sidor: startsida med sök, sökresultat, boendesida, checkout, bekräftelse, värdpanel,
  bokningsöversikt.
- Server actions: bokning skapas i transaktion med tillgänglighetskoll; pris räknas
  om auktoritativt på servern.
- Grindar gröna: `tsc --noEmit`, `eslint`, `vitest` (17/17), `next build`.
- End-to-end kört i webbläsare: bokade Lido Beach 2026-09-20/24, betalning succeeded,
  total $400.80 (verifierat mot motorn: 34000 + 2000 + round(34000*0.12)=4080 = 40080).

### Beslut med skäl
- **Prisma 6, inte 7.** Prisma 7:s nya ESM-klient + separat configfil + icke-laddad
  .env gav onödig friktion för ett snabbt lokalt bygge. Prisma 6 är den beprövade vägen.
- **SQLite, inte Postgres.** Ingen Docker/psql på maskinen; SQLite kör helt lokalt utan
  server. Prisma gör byte till Postgres enkelt senare.
- **Sandbox-betalning, inte riktig Stripe.** Hårt skyddsräcke: inga riktiga pengar.
  Interfacet är Stripe-format så testnycklar kan slå in senare.
- **Bilder via picsum (deterministiska seeds).** Garanterat aldrig trasiga bilder.
  Byt till kuraterad hotellfotografering som polish.

### Heisenberg-ronden (felkapplöpning) — 5 defekter funna och åtgärdade
1. Bokning i det förflutna accepterades → `validateStay` (src/lib/dates.ts) enda källan,
   enforced i action, checkout-sida och widget. Verifierat: 2020-datum ger Problem.
2. Pending som aldrig betalas blockerade datum för alltid → hålltid `PENDING_HOLD_MS`
   (15 min) i `activeBookingWhere`; betalsteget wrappat så fel avbokar bokningen.
3. Öppen gäst-PII och öppen listningspublicering → minimal värdgrind (`hostAuth.ts`,
   `/host/login`). Verifierat: /host och /host/bookings ger 307 → login, noll e-post läcker.
4. `formatPriceShort` avrundade tyst så kort ≠ checkout → visar nu decimaler för ojämna
   belopp, facittestat mot `formatMoney`.
5. Oskyddad `revalidatePath` kunde vända en betald bokning till fel → `safeRevalidate`.
Plus: CVC valideras numeriskt. Efter fixar: tsc, lint, vitest (26/26), next build gröna.

### Naadir-ronden (slutdom) — 1 blockerande defekt funnen och åtgärdad
General Naadir dömde NOT CLEAN. Han bekräftade att Heisenbergs 5 fixar höll och
grindarna var gröna, men fångade en sjätte som både BOB och Heisenberg missade:
- **D1 (IDOR):** `/bookings/[id]` serverade gäst-PII oautentiserat via gissningsbart id.
  → Bekräftelsen nås nu bara via en ogenomskinlig 48-teckens `accessToken` (skild från id),
  `/bookings/[token]`. Verifierat: `/bookings/<id>` → 404, `/bookings/<token>` → 200.
- Efter-punkter åtgärdade: nya boendens 0-betyg visas som "Ny", tomma amenities döljs,
  guests > maxGuests stoppas redan på checkout-sidan. Arbetet flyttat till featuregren.
Timezone (villkor 4): nätter är UTC-normaliserade (kanonisk enhet). Beslut åt Mahad om
bokningstidszon ska låsas till EAT — inte blockerande.

### BOB:s slutkoll (sett det fungera) — 1 lyckad-väg-bugg
Vid den avslutande end-to-end-bokningen i webbläsaren fångade BOB något både
Heisenberg och Naadir missade (de testade komponenter/rutter via curl, inte
klick→redirect): efter lyckad betalning renderade server-actionen om checkout-
sidan, som såg datumen nyss bokade och visade "redan bokade" i stället för
bekräftelsen. Åtgärd: redirecta från server-actionen själv (`redirect()`,
actions.ts) i stället för från klienten. Verifierat i webbläsaren: betalning →
"Bokning bekräftad", $344.20, /bookings/[token].

### Kända nästa steg (inte blockerande för MVP)
- Riktig autentisering per värd (nu en delad demokod `blanso`), och gäst-konton.
- Riktig Stripe-testintegration bakom `PaymentProvider`.
- Kuraterad fotografering, kartvy, recensioner, avbokning i UI.
- Byt SQLite → Postgres (Supabase) inför delning/deploy.
