// Kontraktsverifiering av SupabaseStore mot RIKTIGA Balaanso — motsvarigheten
// till store.test.ts fast mot verkligheten. Skapar egen testlistning, städar
// efter sig. Kör: npx tsx scripts/verify-supabase.mts
import { readFileSync } from "fs";
import { SupabaseStore, createServerClient } from "../src/lib/store/supabase";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const store = new SupabaseStore(url, key);
const raw = createServerClient(url, key);

let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`${cond ? "OK " : "FEL"} ${name}${detail ? " — " + detail : ""}`);
  if (!cond) failed++;
}

const HOST = "host-demo";
const booking = (listingId: string, ci: string, co: string, guests = 2) => ({
  listingId,
  guestName: "Verifierings Gäst",
  guestEmail: "verify@blanso.example",
  checkIn: ci,
  checkOut: co,
  guests,
  nights: 3,
  subtotalCents: 30000,
  cleaningFeeCents: 2000,
  serviceFeeCents: 3600,
  totalCents: 35600,
  currency: "USD",
  paymentRef: "mock_pi_verify",
});

const created = await store.createListing(HOST, {
  hostId: HOST,
  hostName: "Verify Värd",
  title: "VERIFY testrum (raderas)",
  city: "Testville",
  country: "Testland",
  description: "Skapad av verify-supabase, ska raderas automatiskt.",
  nightlyPriceCents: 10000,
  cleaningFeeCents: 2000,
  currency: "USD",
  maxGuests: 3,
  bedrooms: 1,
  beds: 1,
  baths: 1,
  images: [],
  amenities: ["Test"],
});
check("createListing", created.id.startsWith("lst_"), created.id);
check("createListing börjar som draft", created.status === "draft");

const draftBook = await store.createBooking(booking(created.id, "2027-03-01", "2027-03-04"));
check("draft kan inte bokas", !draftBook.ok && draftBook.error === "LISTING_NOT_PUBLISHED");

const published = await store.setListingStatus(created.id, HOST, "published");
check("publicera", published?.status === "published");
const stolen = await store.setListingStatus(created.id, "annan-vard", "unlisted");
check("främmande värd kan INTE ändra status", stolen === null);

// Kronjuvelen: 20 samtidiga bokningar av samma datum — exakt 1 ska vinna.
const results = await Promise.all(
  Array.from({ length: 20 }, () =>
    store.createBooking(booking(created.id, "2027-03-01", "2027-03-04")),
  ),
);
const wins = results.filter((r) => r.ok);
const losses = results.filter((r) => !r.ok && r.error === "UNAVAILABLE");
check("atomisk bokning: exakt 1 vinnare av 20", wins.length === 1, `${wins.length} vann, ${losses.length} UNAVAILABLE`);

const winner = wins[0].booking!;
check("token 48 hex", /^[0-9a-f]{48}$/.test(winner.accessToken));
const byToken = await store.getBookingByToken(winner.accessToken);
check("getBookingByToken", byToken?.id === winner.id);

const tooMany = await store.createBooking(booking(created.id, "2027-04-01", "2027-04-04", 99));
check("TOO_MANY_GUESTS ur kontraktet", !tooMany.ok && tooMany.error === "TOO_MANY_GUESTS");

const block = await store.addAvailabilityBlock(created.id, HOST, {
  checkIn: "2027-05-01",
  checkOut: "2027-05-10",
  note: "underhåll",
});
check("addAvailabilityBlock", block !== null);
const blockedBook = await store.createBooking(booking(created.id, "2027-05-03", "2027-05-06"));
check("blockerade datum kan inte bokas", !blockedBook.ok && blockedBook.error === "UNAVAILABLE");
const foreignBlock = await store.addAvailabilityBlock(created.id, "annan-vard", {
  checkIn: "2027-06-01",
  checkOut: "2027-06-05",
});
check("främmande värd kan INTE blockera", foreignBlock === null);

const hostBookings = await store.listBookingsByHost(HOST);
check("listBookingsByHost innehåller vinnaren", hostBookings.some((b) => b.id === winner.id));

const cancelForeign = await store.cancelBooking(winner.id, "annan-vard");
check("främmande värd kan INTE avboka", cancelForeign === false);
const cancelled = await store.cancelBooking(winner.id, HOST);
check("värden kan avboka", cancelled === true);
const rebook = await store.createBooking(booking(created.id, "2027-03-01", "2027-03-04"));
check("avbokade datum blir lediga igen", rebook.ok === true);

// Städning: ta bort allt testdata.
await raw.from("bookings").delete().eq("listing_id", created.id);
await raw.from("availability_blocks").delete().eq("listing_id", created.id);
await raw.from("listings").delete().eq("id", created.id);
const { data: gone } = await raw.from("listings").select("id").eq("id", created.id);
check("städning: testlistningen borta", (gone ?? []).length === 0);

console.log(failed === 0 ? "\nALLT GRÖNT mot riktiga Balaanso." : `\n${failed} FEL.`);
process.exit(failed === 0 ? 0 : 1);
