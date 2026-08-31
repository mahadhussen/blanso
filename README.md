# Blanso

Bokningsplattform för Östafrika — en booking.com-liknande upplevelse byggd för
regionen som saknade sin egen. Från Lido Beach i Mogadishu till Stone Town i
Zanzibar: sök, jämför, boka och betala.

Byggd genom Byggkedjan (Byggaren BOB → Heisenberg → General Naadir).

## Vad som fungerar

- **Sök** på destination, datum och antal gäster.
- **Boendesidor** med galleri, betyg, bekvämligheter och en levande prisnedbrytning.
- **Bokningsflöde** hela vägen: välj datum → checkout → betalning → bekräftelse.
- **Betalning** via en sandbox-motor (Stripe-formad). Inga riktiga pengar rör sig.
- **Värdpanel**: publicera nya boenden och se alla bokningar med intäkt.
- **Deterministisk prismotor** (heltal cent) och tillgänglighetslogik, båda facittestade.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma 6 + SQLite.
Allt kör lokalt utan externa konton.

## Kom igång

```bash
npm install
npx prisma migrate dev      # skapar den lokala SQLite-databasen
npm run db:seed             # 12 östafrikanska boenden
npm run dev                 # http://localhost:3000
```

## Deploya och dela

Blanso är dynamisk (server actions + databas), så den körs inte på GitHub Pages.
För en delbar live-URL: **Vercel** (kör appen) + **Turso** (serverlös SQLite).
Appen väljer Turso automatiskt när `TURSO_DATABASE_URL` finns, annars den lokala
filen — lokalt är inget ändrat. Steg för steg: [DEPLOY.md](DEPLOY.md).

## Kvalitetsgrindar

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest — prismotor, tillgänglighet, betal-sandbox
npm run build        # produktion-build
```

## Betalning (sandbox)

Betalmotorn i `src/lib/payments.ts` är avsiktligt Stripe-formad. I sandbox-läge
avgörs utfallet lokalt:

- `4242 4242 4242 4242` → betalning lyckas
- `4000 0000 0000 0002` → betalning nekas

En riktig Stripe-testintegration kan slå in bakom samma `PaymentProvider`-interface
via en miljövariabel, utan att bokningsflödet ändras. Kortuppgifter sparas aldrig.

## Arkitektur i korthet

- `src/lib/pricing.ts` — enda källan till bokningens siffror (nätter × pris + avgifter).
- `src/lib/availability.ts` — överlappskoll, halvöppna intervall (rygg-i-rygg tillåtet).
- `src/lib/payments.ts` — betalabstraktion + sandbox-leverantör.
- `src/app/actions.ts` — server actions: skapar bokning i transaktion, tar betalt.
  Priset räknas alltid om på servern; klientens siffror litas aldrig på.
- `prisma/schema.prisma` — Property, Booking, Payment. Pengar som heltal cent.

## Status

MVP verifierad lokalt: alla grindar gröna, hela boknings- och betalflödet kört
end-to-end. Se `WORKLOG.md` för byggloggen och kända nästa steg.
