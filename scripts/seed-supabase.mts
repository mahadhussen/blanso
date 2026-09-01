// Seedar Balaanso med Blansos 12 startboenden ur src/lib/listings.ts (samma
// sanningskälla som MemoryStore — aldrig en parallell kopia i SQL).
// Idempotent: upsert på slug. Kör: npx tsx scripts/seed-supabase.mts
import { readFileSync } from "fs";
import { LISTINGS } from "../src/lib/listings";
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
const { error } = await client
  .from("listings")
  .upsert(rows, { onConflict: "slug", ignoreDuplicates: true });
if (error) {
  console.error("Seed misslyckades:", error.message);
  process.exit(1);
}
const { count } = await client
  .from("listings")
  .select("*", { count: "exact", head: true });
console.log(`Klart: ${count} boenden i Balaanso.`);
