import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { DEMO_HOST_ID } from "@/lib/store/memory";
import { isHostAuthed } from "@/lib/hostAuth";
import { isoDate, todayUTC } from "@/lib/dates";
import { formatPriceShort } from "@/lib/money";
import { AddBlockForm } from "@/components/AddBlockForm";
import { DeleteRoomTypeButton, RoomTypeForm } from "@/components/RoomTypeForm";
import { InventoryCalendar } from "@/components/InventoryCalendar";
import { removeBlock } from "@/app/actions";

// Extranätet för ett boende — booking.com-modellen: rumstyper (hur många rum
// av varje typ, storlek, pris), lagerkalender per natt, stängningar.

export const metadata = { title: "Manage property" };
export const dynamic = "force-dynamic";

const CAL_DAYS = 14;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function HostListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isHostAuthed())) redirect("/host/login");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const store = getStore();
  const listing = await store.getListingById(id);
  if (!listing || listing.hostId !== DEMO_HOST_ID) notFound();

  const today = isoDate(todayUTC());
  const fromRaw = first(sp.from);
  const from = fromRaw && /^\d{4}-\d{2}-\d{2}$/.test(fromRaw) && !Number.isNaN(Date.parse(fromRaw)) ? fromRaw : today;
  const justCreated = first(sp.created) === "1";

  const [roomTypes, calendar, blocks, bookings] = await Promise.all([
    store.listRoomTypes(id),
    store.getInventoryCalendar(id, from, CAL_DAYS),
    store.listAvailabilityBlocks(id),
    store.listBookingsByHost(DEMO_HOST_ID),
  ]);
  const roomName = new Map(roomTypes.map((r) => [r.id, r.name]));
  const upcoming = bookings
    .filter((b) => b.listingId === id && b.status === "confirmed" && b.checkOut > today)
    .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1));
  const activeBlocks = blocks.filter((b) => b.checkOut > today);
  const totalRooms = roomTypes.reduce((s, r) => s + r.units, 0);

  return (
    <div className="b-page" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <Link href="/host" className="b-label">← Host dashboard</Link>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div className="b-label">{listing.city}, {listing.country} · {listing.status}</div>
          <h1 className="b-h2" style={{ margin: "8px 0 0" }}>{listing.title}</h1>
          <p style={{ margin: "8px 0 0", color: "var(--ink-2)" }}>
            {roomTypes.length} {roomTypes.length === 1 ? "room type" : "room types"} · {totalRooms} {totalRooms === 1 ? "room" : "rooms"} in total
          </p>
        </div>
        <Link href={`/rooms/${listing.slug}`} className="b-btn">View as guest</Link>
      </div>

      <nav aria-label="Sections" className="b-host-tabs">
        <a href="#rooms">Rooms</a>
        <a href="#availability">Availability</a>
        <a href="#reservations">Reservations ({upcoming.length})</a>
      </nav>

      {/* ---- Rumstyper -------------------------------------------------- */}
      <section id="rooms" className="b-host-section">
        <div className="b-label b-label-ink">Rooms</div>
        {justCreated && (
          <p className="b-note" role="status">
            Your property is live with its first room type. Add your other room types below — each with its own
            size, beds, number of rooms and price.
          </p>
        )}

        {roomTypes.length === 0 ? (
          <p style={{ marginTop: 16, color: "var(--ink-2)" }}>No room types yet. Guests cannot book until you add one.</p>
        ) : (
          <div style={{ marginTop: 16, borderTop: "1px solid var(--ink)" }}>
            {roomTypes.map((r) => (
              <div key={r.id} className="b-host-room" data-room={r.name}>
                <span className="b-media" style={{ width: 120, height: 88, position: "relative" }}>
                  {(r.images[0] ?? listing.images[0]) && (
                    <Image src={r.images[0] ?? listing.images[0]} alt={r.name} fill sizes="120px" />
                  )}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h3)", lineHeight: 1.15 }}>{r.name}</div>
                  <div className="b-label" style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 600, marginTop: 6 }}>
                    {[r.sizeSqm ? `${r.sizeSqm} m²` : "Size not set", r.bedConfig, `Sleeps ${r.maxGuests}`].join(" · ")}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <strong style={{ fontWeight: 500 }}>{r.units} {r.units === 1 ? "room" : "rooms"}</strong>
                    <span style={{ color: "var(--ink-2)" }}> · {formatPriceShort(r.nightlyPriceCents)} per night</span>
                  </div>
                </div>
                <div className="b-host-room-actions">
                  <details className="b-disclosure">
                    <summary className="b-btn" style={{ padding: "10px 16px" }}>Edit</summary>
                    <div className="b-disclosure-body">
                      <RoomTypeForm listingId={listing.id} roomType={r} />
                    </div>
                  </details>
                  <DeleteRoomTypeButton listingId={listing.id} roomTypeId={r.id} name={r.name} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="b-host-card" style={{ marginTop: 32 }}>
          <div className="b-label b-label-ink">Add a room type</div>
          <p style={{ margin: "6px 0 20px", color: "var(--ink-2)" }}>
            One room type = one kind of room you sell, e.g. 3 × Deluxe Double Room at 24 m².
          </p>
          <RoomTypeForm listingId={listing.id} />
        </div>
      </section>

      {/* ---- Lagerkalender ------------------------------------------------ */}
      <section id="availability" className="b-host-section">
        <div className="b-label b-label-ink">Availability</div>
        <p style={{ margin: "6px 0 16px", color: "var(--ink-2)" }}>
          Free rooms per night for the next {CAL_DAYS} nights. Bookings and closures update it instantly.
        </p>
        <InventoryCalendar rows={calendar} from={from} days={CAL_DAYS} today={today} basePath={`/host/listings/${listing.id}`} />

        <div className="b-host-card" style={{ marginTop: 32 }}>
          <div className="b-label b-label-ink">Close or reopen dates</div>
          <p style={{ margin: "6px 0 20px", color: "var(--ink-2)" }}>
            Close the whole property or a single room type for maintenance or private use. Guests cannot book closed nights.
          </p>
          <AddBlockForm listingId={listing.id} roomTypes={roomTypes.map((r) => ({ id: r.id, name: r.name }))} />
        </div>

        {activeBlocks.length > 0 && (
          <ul className="b-host-list" aria-label="Closed dates">
            {activeBlocks.map((b) => (
              <li key={b.id}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontWeight: 500 }}>
                    {b.roomTypeId ? roomName.get(b.roomTypeId) ?? "Removed room type" : "Whole property"}
                  </strong>
                  <span style={{ color: "var(--ink-2)" }}> · closed {b.checkIn} → reopens {b.checkOut}</span>
                  {b.note && <span style={{ color: "var(--muted)" }}> · {b.note}</span>}
                </div>
                <form action={removeBlock}>
                  <input type="hidden" name="blockId" value={b.id} />
                  <input type="hidden" name="listingId" value={listing.id} />
                  <button className="b-btn" style={{ padding: "10px 16px" }}>Reopen</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Kommande bokningar ------------------------------------------- */}
      <section id="reservations" className="b-host-section">
        <div className="b-label b-label-ink">Upcoming reservations</div>
        {upcoming.length === 0 ? (
          <p style={{ marginTop: 12, color: "var(--ink-2)" }}>No upcoming reservations.</p>
        ) : (
          <ul className="b-host-list">
            {upcoming.map((b) => (
              <li key={b.id}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontWeight: 500 }}>{b.rooms} × {b.roomTypeName || "Room"}</strong>
                  <span style={{ color: "var(--ink-2)" }}> · {b.checkIn} → {b.checkOut} · {b.guestName}</span>
                </div>
                <span>{formatPriceShort(b.totalCents)}</span>
              </li>
            ))}
          </ul>
        )}
        <p style={{ marginTop: 12 }}>
          <Link href="/host/bookings" className="b-label b-label-ink" style={{ borderBottom: "1px solid var(--ink)", paddingBottom: 3 }}>
            All bookings
          </Link>
        </p>
      </section>
    </div>
  );
}
