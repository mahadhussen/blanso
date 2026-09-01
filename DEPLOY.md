# Deploya Blanso (Vercel — ingen databas)

Blanso kör som en **delbar demo utan extern databas**. All lagring går genom
`DataStore`-interfacet med en in-memory-implementation: värdar kan lägga upp rum
och gäster kan boka på riktigt inom en serverprocess, men datan nollställs vid
omstart/ny serverless-instans (sägs öppet i UI:t). Därför deployar den **gratis
på Vercel utan konton, databaser eller miljövariabler**. Riktig persistens =
en Supabase-implementation av samma interface, när det är dags.

Repo: https://github.com/mahadhussen/blanso

## Deploya
1. Gå till https://vercel.com/new och importera `mahadhussen/blanso` (redan kopplat).
2. Framework detekteras som Next.js. Inga env-variabler behövs.
3. Deploy. Efter någon minut lever URL:en, t.ex. `blanso-git-main-orbit10.vercel.app`.

Det är allt. Ingen databas, ingen kostnad, öppnas direkt.

## Valfritt
- **Värdpanelen** (`/host`) ligger bakom en kod (standard `blanso`). Sätt
  `BLANSO_HOST_PASSCODE` i Vercels Environment Variables om du vill byta den.

## Kör lokalt
```bash
npm install
npm run dev      # http://localhost:3000
```

## Bra att veta
- **Inga riktiga pengar.** Betalningen är sandbox (kort `4242 4242 4242 4242`
  lyckas, `4000 0000 0000 0002` nekas).
- **Bokningar sparas inte** i den här versionen (det är poängen — noll drift, noll
  kostnad). Vill du ha riktig persistens finns databas-versionen i git-historiken
  (commit före demo-omställningen) — då kopplas en Postgres på.
- Boendedatan bor i `src/lib/listings.ts` — ändra där för att byta boenden.
