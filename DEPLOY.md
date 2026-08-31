# Deploya Blanso live (Vercel + Turso)

Blanso är en dynamisk Next.js-app (server actions + databas). GitHub Pages kan
**inte** köra den. Den här guiden ger en delbar live-URL via **Vercel** (kör
appen) + **Turso** (serverlös SQLite, samma dialekt som lokalt).

Allt kodarbete är redan gjort — appen väljer Turso automatiskt när
`TURSO_DATABASE_URL` finns, annars den lokala filen. Kvar är tre kontosteg som
kräver dig: skapa databasen, ladda schemat, koppla Vercel.

Repo: https://github.com/mahadhussen/blanso

## 1. Skapa Turso-databasen (gratis)

```bash
# Installera CLI (macOS)
brew install tursodatabase/tap/turso
# Logga in / skapa konto
turso auth signup
# Skapa databasen
turso db create blanso
```

Hämta anslutningsuppgifterna (spara dem, de behövs i Vercel):

```bash
turso db show blanso --url          # -> libsql://blanso-<...>.turso.io  (TURSO_DATABASE_URL)
turso db tokens create blanso       # -> en lång token                  (TURSO_AUTH_TOKEN)
```

## 2. Ladda schema + exempeldata

Schemat finns färdigt i `prisma/turso-schema.sql` (genererat ur Prisma-modellen).

```bash
# Skapa tabellerna i Turso
turso db shell blanso < prisma/turso-schema.sql

# Seeda 12 östafrikanska boenden mot Turso
TURSO_DATABASE_URL="libsql://blanso-<...>.turso.io" \
TURSO_AUTH_TOKEN="<token>" \
npm run db:seed
```

## 3. Deploya på Vercel

1. Gå till https://vercel.com/new och importera repot `mahadhussen/blanso`.
2. Framework detekteras som Next.js. Rör inte build-kommandot (`prisma generate`
   körs automatiskt via `postinstall`).
3. Lägg till miljövariabler (Settings → Environment Variables):
   - `TURSO_DATABASE_URL` = `libsql://blanso-<...>.turso.io`
   - `TURSO_AUTH_TOKEN` = `<token>`
   - `DATABASE_URL` = `file:./dev.db` (dummy, krävs bara för att Prisma-schemat
     ska validera vid build — den används inte när Turso är satt)
   - (valfritt) `BLANSO_HOST_PASSCODE` = din egen kod till värdpanelen
4. Deploy. Efter någon minut får du en delbar URL, t.ex.
   `https://blanso.vercel.app`.

## Klart
- Dela URL:en — vem som helst kan söka, boka (sandbox-betalning) och se bekräftelse.
- Claude Design kan nu **se sajten direkt via URL:en** i stället för skärmbilder.

## Bra att veta
- **Inga riktiga pengar.** Betalningen är sandbox (kort `4242 4242 4242 4242`
  lyckas, `4000 0000 0000 0002` nekas). Byt till riktig Stripe-testintegration
  bakom `PaymentProvider` (`src/lib/payments.ts`) när det ska bli skarpt.
- **Värdpanelen** (`/host`) ligger bakom `BLANSO_HOST_PASSCODE` (standard `blanso`).
- **Lokalt** är inget ändrat: `npm run dev` kör mot fil-SQLite som förut.
- Commit-mejlet i repot är `mahad@arbetsklivet.se` (annars blockeras Vercel tyst).
