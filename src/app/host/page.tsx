import Link from "next/link";
import { redirect } from "next/navigation";
import { HostListingForm } from "@/components/HostListingForm";
import { getStore } from "@/lib/store";
import { DEMO_HOST_ID } from "@/lib/store/memory";
import { formatPriceShort } from "@/lib/money";
import { isHostAuthed } from "@/lib/hostAuth";
import { isoDate, todayUTC } from "@/lib/dates";
import { publishListing, unpublishListing, logoutHost } from "@/app/actions";

export const metadata = { title: "Host dashboard" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = { published: "Published", unlisted: "Unlisted", draft: "Draft" };

export default async function HostPage() {
  if (!(await isHostAuthed())) redirect("/host/login");
  const store = getStore();
  const listings = await store.listListingsByHost(DEMO_HOST_ID);
  const today = isoDate(todayUTC());

  // Beläggning i natt per boende — samma lagermotor som kalendern.
  const tonight = await Promise.all(
    listings.map(async (l) => {
      const rows = await store.getInventoryCalendar(l.id, today, 1);
      const units = rows.reduce((s, r) => s + r.roomType.units, 0);
      const booked = rows.reduce((s, r) => s + Math.min(r.days[0]?.booked ?? 0, r.roomType.units), 0);
      const closed = rows.reduce((s, r) => s + (r.days[0]?.closed ? r.roomType.units - Math.min(r.days[0].booked, r.roomType.units) : 0), 0);
      const from = rows.length ? Math.min(...rows.map((r) => r.roomType.nightlyPriceCents)) : null;
      return { units, booked, closed, types: rows.length, from };
    }),
  );
  const totalUnits = tonight.reduce((s, t) => s + t.units, 0);
  const totalBooked = tonight.reduce((s, t) => s + t.booked, 0);

  return (
    <div className="b-page" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div className="b-label">Extranet</div>
          <h1 className="b-h2" style={{ margin: "8px 0 0" }}>Host dashboard</h1>
          <p style={{ margin: "8px 0 0", color: "var(--ink-2)" }} data-testid="occupancy-total">
            Tonight: {totalBooked} of {totalUnits} {totalUnits === 1 ? "room" : "rooms"} booked across {listings.length}{" "}
            {listings.length === 1 ? "property" : "properties"}.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/host/bookings" className="b-btn">Bookings</Link>
          <form action={logoutHost}>
            <button className="b-btn">Sign out</button>
          </form>
        </div>
      </div>

      <div className="b-host-grid">
        <div>
          <div className="b-label b-label-ink">Your properties ({listings.length})</div>
          <ul className="b-host-list">
            {listings.map((l, i) => {
              const t = tonight[i];
              return (
                <li key={l.id} data-listing={l.title}>
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/host/listings/${l.id}`} style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>
                      {l.title}
                    </Link>
                    <div className="b-label" style={{ letterSpacing: 1.5, marginTop: 4 }}>
                      {l.city}, {l.country} · {STATUS[l.status] ?? l.status}
                      {t.from !== null ? ` · from ${formatPriceShort(t.from)}` : ""}
                    </div>
                    <div style={{ marginTop: 6 }} data-testid="occupancy">
                      {t.types === 0 ? (
                        <span style={{ color: "var(--ink-2)" }}>No room types yet — add one to take bookings.</span>
                      ) : (
                        <>
                          <strong style={{ fontWeight: 500 }}>
                            {t.booked} of {t.units} {t.units === 1 ? "room" : "rooms"} booked tonight
                          </strong>
                          {t.closed > 0 && <span style={{ color: "var(--ink-2)" }}> · {t.closed} closed</span>}
                          <OccupancyBar booked={t.booked} closed={t.closed} units={t.units} />
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <Link href={`/host/listings/${l.id}`} className="b-btn" style={{ padding: "10px 16px" }}>Manage</Link>
                    {l.status === "published" ? (
                      <form action={unpublishListing}>
                        <input type="hidden" name="listingId" value={l.id} />
                        <button className="b-btn" style={{ padding: "10px 16px" }}>Unlist</button>
                      </form>
                    ) : (
                      <form action={publishListing}>
                        <input type="hidden" name="listingId" value={l.id} />
                        <button className="b-btn b-btn-solid" style={{ padding: "10px 16px" }}>Publish</button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="b-host-card" style={{ alignSelf: "start" }}>
          <div className="b-label b-label-ink">List a property</div>
          <p style={{ margin: "6px 0 20px", color: "var(--ink-2)" }}>
            Add the property and its first room type. It is published right away; you add more room types next.
          </p>
          <HostListingForm />
        </div>
      </div>
    </div>
  );
}

// Beläggningsstapel i gråskala: svart = bokat, streckat = stängt, papper = ledigt.
function OccupancyBar({ booked, closed, units }: { booked: number; closed: number; units: number }) {
  if (units === 0) return null;
  const pct = (n: number) => `${(n / units) * 100}%`;
  return (
    <div aria-hidden style={{ display: "flex", height: 6, marginTop: 8, border: "1px solid var(--hairline)", maxWidth: 280 }}>
      <span style={{ width: pct(booked), background: "var(--ink)" }} />
      <span className="b-cal-closed" style={{ width: pct(closed) }} />
    </div>
  );
}
