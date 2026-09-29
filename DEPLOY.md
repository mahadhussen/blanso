# Deploy — Balaanso (Vercel + Supabase)

Live: **https://blanso-orbit10.vercel.app** — kör mot Supabase-projektet
**Balaanso** (EU) via SupabaseStore. Auto-deploy från `main` på GitHub
(`mahadhussen/blanso`), Vercel-projekt `orbit10/blanso`.

## Miljövariabler (satta i Vercel Production)
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — databasen. Utan dem kastar
  produktionsvakten i `src/lib/store/index.ts` (tyst RAM-demo kräver `BLANSO_DEMO=1`).
- `BLANSO_HOST_PASSCODE` (valfri) — värdpanelens kod, standard `blanso`. **Sätt egen.**
- `CRON_SECRET` (rekommenderad) — skyddar `/api/keepalive`; Vercel skickar den
  automatiskt till cron-anropet. Utan den är routen en öppen läsning av ett antal.

## Keepalive
`vercel.json` kör `/api/keepalive` dagligen 06:00 UTC (gratis Vercel Cron). Den gör
en läsning så Supabase-gratisprojektet inte pausas efter 7 dagars inaktivitet
(hände 2026-09-29: värdnamnet slutade resolva, `/s` och boendesidor gav 500).
Ett redan pausat projekt väcks INTE av den — "Restore project" i Supabase.
Kontrollera körningarna under Vercel → Logs (200 `{"ok":true,"published":N}`).

## Databas
Schema: `supabase/migrations/` (körs via `~/.claude/skills/db-migrate` eller
`turso`-mönstret i skillen). Seed: `npx tsx scripts/seed-supabase.mts` (idempotent,
skriver aldrig över värdändringar). Verifiering mot riktiga db:
`npx tsx scripts/verify-supabase.mts` (rumstypskontraktet: 20 samtidiga mot 3 rum ⇒
exakt 3, kalender, stängningar, INVALID_REQUEST; städar i `finally`).

### Ordning vid schemaändring med ny kod (rumstyper, 2026-09-29)
1. Backup. 2. Migration (gammal kod fungerar via 15-arg-delegaten av `create_booking`).
3. Seed. 4. Merge + deploy. 5. `verify-supabase.mts` + röktest. Steg 2–4 i direkt följd.
**Aldrig deploy före migration** — ny kod mot gammalt schema ger 500 överallt.
Återställning: Vercel "Promote" föregående deploy; schemat är additivt, så ingen
databasåterställning behövs. Lokal bevisning av migrationen:
`PGHOST=127.0.0.1 PGPORT=<port> PGUSER=postgres scripts/verify-room-types.sh`.

## Lokalt
```bash
npm install
cp .env.example .env   # fyll i SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
npm run dev            # http://localhost:3000
```
Utan Supabase-env lokalt körs in-memory-demon (ofarligt i dev).

## Bra att veta
- **Betalning är sandbox** — kort `4242 4242 4242 4242` lyckas, `4000…0002` nekas.
  Inga riktiga pengar. Riktig Stripe: implementera bakom `PaymentProvider`.
- Designfacit: `design/DESIGNFACIT.md`. Avvikelselogg: `WORKLOG.md`.
