# WORKLOG — Blanso

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

### Kända nästa steg (inte blockerande för MVP)
- Riktig autentisering per värd (nu en delad demokod `blanso`), och gäst-konton.
- Riktig Stripe-testintegration bakom `PaymentProvider`.
- Kuraterad fotografering, kartvy, recensioner, avbokning i UI.
- Byt SQLite → Postgres (Supabase) inför delning/deploy.
