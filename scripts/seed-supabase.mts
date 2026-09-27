// Seedar Balaanso med Blansos 12 startboenden OCH deras rumstyper ur
// src/lib/listings.ts (samma sanningskälla som MemoryStore — aldrig en
// parallell kopia i SQL). Idempotent. Kör EFTER migrationen
// 20260927120000_room_types.sql: npx tsx scripts/seed-supabase.mts
import { readFileSync } from "fs";
import { LISTINGS, ROOM_TYPES } from "../src/lib/listings";
import { createServerClient } from "../src/lib/store/supabase";

// Läs .env själv (ingen dotenv-dep): KEY="value"-rader.
for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY saknas i .env");
  process.exit(1);
}

const client = createServerClient(url, key);

const rows = LISTINGS.map((l) => ({
  id: l.id,
  host_id: "host-demo",
  host_name: l.hostName,
  slug: l.slug,
  status: "published",
  title: l.title,
  city: l.city,
  country: l.country,
  description: l.description,
  nightly_price_cents: l.nightlyPriceCents,
  cleaning_fee_cents: l.cleaningFeeCents,
  currency: l.currency,
  max_guests: l.maxGuests,
  bedrooms: l.bedrooms,
  beds: l.beds,
  baths: l.baths,
  rating: l.rating,
  reviews_count: l.reviewsCount,
  images: l.images,
  amenities: l.amenities,
}));

// ignoreDuplicates: en omsådd får ALDRIG skriva över en värds ändringar
// (t.ex. återpublicera en avpublicerad listning) — bara lägga till nya rader.
// SEED_OVERWRITE=1 uppdaterar befintliga rader (används vid innehållsbyten som
// engelska-migrationen). Standard: ignoreDuplicates — skriver aldrig över värdändringar.
const overwrite = process.env.SEED_OVERWRITE === "1";
const { error } = await client
  .from("listings")
  .upsert(rows, { onConflict: "slug", ignoreDuplicates: !overwrite });
if (error) {
  console.error("Seed misslyckades:", error.message);
  process.exit(1);
}
// ---- Rumstyper ----------------------------------------------------------------
// Migrationens backfill gav varje boende en härledd "Standard Room" med id
// rt-<boende>. Seedens första typ per boende har SAMMA id: den härledda typen
// ersätts (uppdateras) med den riktiga — men bara så länge den fortfarande är
// orörd (namnet "Standard Room"), så en värds egna ändringar aldrig skrivs över.
// Övriga typer infogas om de saknas. SEED_OVERWRITE=1 skriver över allt.
const DERIVED_NAME = "Standard Room";
const { data: existing, error: rtErr } = await client
  .from("room_types")
  .select("id, name")
  .in("id", ROOM_TYPES.map((r) => r.id));
if (rtErr) {
  console.error("Seed av rumstyper misslyckades (är migrationen körd?):", rtErr.message);
  process.exit(1);
}
const byId = new Map((existing ?? []).map((r) => [String(r.id), String(r.name)]));
let inserted = 0;
let replaced = 0;
let kept = 0;
for (const r of ROOM_TYPES) {
  const row = {
    id: r.id,
    listing_id: r.listingId,
    name: r.name,
    size_sqm: r.sizeSqm,
    bed_config: r.bedConfig,
    max_guests: r.maxGuests,
    units: r.units,
    nightly_price_cents: r.nightlyPriceCents,
    images: r.images,
    sort_order: r.sortOrder,
    updated_at: new Date().toISOString(),
  };
  const cur = byId.get(r.id);
  if (cur === undefined) {
    const { error: e } = await client.from("room_types").insert(row);
    if (e) {
      console.error(`Rumstyp ${r.id}:`, e.message);
      process.exit(1);
    }
    inserted++;
  } else if (overwrite || cur === DERIVED_NAME) {
    const { error: e } = await client.from("room_types").update(row).eq("id", r.id);
    if (e) {
      console.error(`Rumstyp ${r.id}:`, e.message);
      process.exit(1);
    }
    replaced++;
  } else {
    kept++;
  }
}

const { count } = await client
  .from("listings")
  .select("*", { count: "exact", head: true });
const { count: rtCount } = await client
  .from("room_types")
  .select("*", { count: "exact", head: true })
  .is("archived_at", null);
console.log(
  `Klart: ${count} boenden, ${rtCount} aktiva rumstyper i Balaanso ` +
    `(rumstyper: ${inserted} nya, ${replaced} ersatta härledda, ${kept} orörda värdändringar).`,
);
