# Deploya Blanso live (Vercel + Supabase)

Blanso är en dynamisk Next.js-app (server actions + databas). GitHub Pages kan
**inte** köra den. Den här guiden ger en delbar live-URL via **Vercel** (kör
appen) + **Supabase** (Postgres — samma stack som Pathly och Sökt).

Allt kodarbete är gjort. Kvar är kontostegen som kräver dig: skapa Supabase-
projektet, ladda schema + data, sätt env-variablerna i Vercel.

Repo: https://github.com/mahadhussen/blanso

## 1. Skapa Supabase-projektet
1. Gå till https://supabase.com → New project. Välj region nära Östafrika/EU.
2. Sätt ett databaslösenord (spara det).
3. När projektet är klart: **Settings → Database → Connection string**. Du behöver två:
   - **Transaction** (pooler, port `6543`) → detta blir `DATABASE_URL`.
     Lägg till `?pgbouncer=true&connection_limit=1` på slutet.
   - **Session/Direct** (port `5432`) → detta blir `DIRECT_URL`.

   De ser ut ungefär så här:
   ```
   DATABASE_URL = postgresql://postgres.<ref>:<lösen>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL   = postgresql://postgres.<ref>:<lösen>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```

## 2. Ladda schema + exempeldata
Kör lokalt i repot, med dina två strängar:

```bash
# Skapa tabellerna i Supabase
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma migrate deploy

# Seeda 12 östafrikanska boenden
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npm run db:seed
```

## 3. Deploya på Vercel
Du har redan kopplat repot `mahadhussen/blanso` till Vercel. Kvar:
1. **Settings → Environment Variables**, lägg till (för Production):
   - `DATABASE_URL` = din pooled-sträng (port 6543, med `?pgbouncer=true...`)
   - `DIRECT_URL` = din direct-sträng (port 5432)
   - (valfritt) `BLANSO_HOST_PASSCODE` = din egen kod till värdpanelen
2. **Deployments → Redeploy** (senaste från `main`).

Efter någon minut får du en delbar URL, t.ex. `blanso-git-main-orbit10.vercel.app`.

## Klart
- Dela URL:en — vem som helst kan söka, boka (sandbox-betalning) och se bekräftelse.
- Claude Design kan nu **se sajten direkt via URL:en** i stället för skärmbilder.

## Kör lokalt
Appen använder Postgres nu, så även lokalt pekar `.env` mot Supabase:
```bash
cp .env.example .env      # fyll i dina Supabase-strängar
npm install
npm run dev               # http://localhost:3000
```
(Tips: skapa gärna ett separat Supabase-projekt för lokalt/dev om du vill hålla
det skilt från produktion.)

## Bra att veta
- **Inga riktiga pengar.** Betalningen är sandbox (kort `4242 4242 4242 4242`
  lyckas, `4000 0000 0000 0002` nekas). Byt till riktig Stripe-testintegration
  bakom `PaymentProvider` (`src/lib/payments.ts`) när det ska bli skarpt.
- **Värdpanelen** (`/host`) ligger bakom `BLANSO_HOST_PASSCODE` (standard `blanso`).
- Commit-mejlet i repot är `mahad@arbetsklivet.se` (annars blockeras Vercel tyst).
