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
- **Värdpanel** (kodskyddad): lägg upp lediga rum, publicera/avpublicera, blockera
  datum, se bokningar med intäkt och avboka.
- **Deterministisk prismotor** (heltal cent) och tillgänglighetslogik, båda facittestade.

## Arkitektur: DataStore

All lagring går genom ett `DataStore`-interface (`src/lib/store/`). I dag kör en
in-memory-implementation (noll kostnad, data nollställs vid omstart — sägs öppet i
UI:t). När riktig persistens ska på kopplas Supabase/Postgres in som EN fil bakom
samma kontrakt, och kontraktstesterna i `src/lib/store/store.test.ts` bevisar den.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4. Ingen extern
databas krävs — deployar gratis var som helst.

## Kom igång

```bash
npm install
npm run dev      # http://localhost:3000
```

## Deploya och dela

Blanso kör som en delbar demo **utan databas** — deployas gratis på Vercel utan
konton eller miljövariabler. Steg: [DEPLOY.md](DEPLOY.md).

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
