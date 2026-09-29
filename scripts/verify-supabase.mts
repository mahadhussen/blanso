// Kontraktsverifiering av SupabaseStore mot RIKTIGA Balaanso — motsvarigheten
// till store.test.ts fast mot verkligheten (PostgREST + SQL-funktionen
// create_booking med rumstyp). Skapar ett eget testboende med en rumstyp och
// städar efter sig i finally, även om en kontroll fallerar.
// Kräver att migrationen 20260927120000_room_types.sql är körd.
// Kör: npx tsx scripts/verify-supabase.mts
import { readFileSync } from "fs";
import { nightsBetween } from "../src/lib/dates";
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
const UNITS = 3;
const booking = (listingId: string, roomTypeId: string, ci: string, co: string, rooms = 1, guests = 2) => ({
  listingId,
  roomTypeId,
  rooms,
  guestName: "Verifierings Gäst",
  guestEmail: "verify@blanso.example",
  checkIn: ci,
  checkOut: co,
  guests,
  nights: nightsBetween(ci, co),
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
  title: "VERIFY testboende (raderas)",
  city: "Testville",
  country: "Testland",
  description: "Skapad av verify-supabase, raderas automatiskt.",
  nightlyPriceCents: 10000,
  cleaningFeeCents: 2000,
  currency: "USD",
  maxGuests: 2,
  bedrooms: 1,
  beds: 1,
  baths: 1,
  images: [],
  amenities: ["Test"],
});

try {
  check("createListing", created.id.startsWith("lst_"), created.id);
  check("createListing börjar som draft", created.status === "draft");

  const rt = await store.createRoomType(created.id, HOST, {
    name: "VERIFY Deluxe",
    sizeSqm: 24,
    bedConfig: "1 king bed",
    maxGuests: 2,
    units: UNITS,
    nightlyPriceCents: 10000,
    images: [],
    sortOrder: 0,
  });
  check("createRoomType", rt !== null && rt.units === UNITS, rt?.id ?? "null");
  const foreignRt = await store.createRoomType(created.id, "annan-vard", {
    name: "Stulen", sizeSqm: 10, bedConfig: "1 bed", maxGuests: 1, units: 1,
    nightlyPriceCents: 100, images: [], sortOrder: 1,
  });
  check("främmande värd kan INTE skapa rumstyp", foreignRt === null);
  const RT = rt!.id;

  const draftBook = await store.createBooking(booking(created.id, RT, "2027-03-01", "2027-03-04"));
  check("draft kan inte bokas", !draftBook.ok && draftBook.error === "LISTING_NOT_PUBLISHED");

  const published = await store.setListingStatus(created.id, HOST, "published");
  check("publicera", published?.status === "published");
  const stolen = await store.setListingStatus(created.id, "annan-vard", "unlisted");
  check("främmande värd kan INTE ändra status", stolen === null);

  // Kronjuvelen: 20 samtidiga bokningar av samma nätter mot 3 rum — exakt 3 vinner.
  const results = await Promise.all(
    Array.from({ length: 20 }, () => store.createBooking(booking(created.id, RT, "2027-03-01", "2027-03-04"))),
  );
  const wins = results.filter((r) => r.ok);
  const losses = results.filter((r) => !r.ok && r.error === "NOT_ENOUGH_ROOMS");
  check(
    `atomisk bokning: exakt ${UNITS} vinnare av 20`,
    wins.length === UNITS && losses.length === 20 - UNITS,
    `${wins.length} vann, ${losses.length} NOT_ENOUGH_ROOMS`,
  );
  check("förlorarna får available = 0", losses.every((r) => r.available === 0));

  const winner = wins[0].booking!;
  check("token 48 hex", /^[0-9a-f]{48}$/.test(winner.accessToken));
  check("bokningen bär rumstyp och antal", winner.roomTypeId === RT && winner.rooms === 1);
  const byToken = await store.getBookingByToken(winner.accessToken);
  check("getBookingByToken", byToken?.id === winner.id);

  const avail = await store.getRoomAvailability(created.id, "2027-03-01", "2027-03-04");
  check("getRoomAvailability: 0 lediga när fullt", avail[0]?.available === 0);
  const nextNight = await store.getRoomAvailability(created.id, "2027-03-04", "2027-03-05");
  check("utcheckningsnatten är ledig igen", nextNight[0]?.available === UNITS);

  const two = await store.createBooking(booking(created.id, RT, "2027-04-01", "2027-04-04", 2, 4));
  check("2 rum i en bokning", two.ok && two.booking?.rooms === 2);
  const twoMore = await store.createBooking(booking(created.id, RT, "2027-04-02", "2027-04-03", 2, 2));
  check("2 till vägras med exakt antal kvar", !twoMore.ok && twoMore.error === "NOT_ENOUGH_ROOMS" && twoMore.available === 1,
    `${twoMore.error} available=${twoMore.available}`);

  const tooMany = await store.createBooking(booking(created.id, RT, "2027-05-20", "2027-05-22", 1, 3));
  check("TOO_MANY_GUESTS ur kontraktet", !tooMany.ok && tooMany.error === "TOO_MANY_GUESTS");
  const past = await store.createBooking(booking(created.id, RT, "2020-01-01", "2020-01-03"));
  check("datum i det förflutna vägras (INVALID_REQUEST)", !past.ok && past.error === "INVALID_REQUEST");
  const lying = await store.createBooking({ ...booking(created.id, RT, "2027-05-20", "2027-05-22"), nights: 99 });
  check("felaktiga nätter vägras (INVALID_REQUEST)", !lying.ok && lying.error === "INVALID_REQUEST");

  const block = await store.addAvailabilityBlock(created.id, HOST, {
    checkIn: "2027-05-01",
    checkOut: "2027-05-10",
    note: "underhåll",
    roomTypeId: RT,
  });
  check("stäng rumstyp", block !== null && block.roomTypeId === RT);
  const blockedBook = await store.createBooking(booking(created.id, RT, "2027-05-03", "2027-05-06"));
  check("stängd rumstyp kan inte bokas", !blockedBook.ok && blockedBook.error === "UNAVAILABLE");
  const foreignBlock = await store.addAvailabilityBlock(created.id, "annan-vard", {
    checkIn: "2027-06-01",
    checkOut: "2027-06-05",
  });
  check("främmande värd kan INTE stänga", foreignBlock === null);

  const cal = await store.getInventoryCalendar(created.id, "2027-04-01", 4);
  const cells = cal[0]?.days.map((d) => `${d.available}/${d.units}`).join(" ");
  check("kalendern: 1/3 1/3 1/3 3/3", cells === "1/3 1/3 1/3 3/3", cells ?? "tom");

  const del = await store.deleteRoomType(RT, HOST);
  check("rumstyp med framtida bokningar kan inte tas bort", !del.ok && del.error === "HAS_FUTURE_BOOKINGS");

  const hostBookings = await store.listBookingsByHost(HOST);
  check("listBookingsByHost innehåller vinnaren", hostBookings.some((b) => b.id === winner.id));

  const cancelForeign = await store.cancelBooking(winner.id, "annan-vard");
  check("främmande värd kan INTE avboka", cancelForeign === false);
  const cancelled = await store.cancelBooking(winner.id, HOST);
  check("värden kan avboka", cancelled === true);
  const rebook = await store.createBooking(booking(created.id, RT, "2027-03-01", "2027-03-04"));
  check("avbokat rum blir ledigt igen", rebook.ok === true);
} catch (e) {
  failed++;
  console.log(`FEL oväntat undantag — ${e instanceof Error ? e.message : String(e)}`);
} finally {
  // Städning: allt testdata bort, i FK-ordning.
  await raw.from("bookings").delete().eq("listing_id", created.id);
  await raw.from("availability_blocks").delete().eq("listing_id", created.id);
  await raw.from("room_types").delete().eq("listing_id", created.id);
  await raw.from("listings").delete().eq("id", created.id);
  const { data: gone } = await raw.from("listings").select("id").eq("id", created.id);
  check("städning: testboendet borta", (gone ?? []).length === 0);
}

console.log(failed === 0 ? "\nALLT GRÖNT mot riktiga Balaanso." : `\n${failed} FEL.`);
process.exit(failed === 0 ? 0 : 1);
