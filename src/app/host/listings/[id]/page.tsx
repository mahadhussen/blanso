import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { DEMO_HOST_ID } from "@/lib/store/memory";
import { isHostAuthed } from "@/lib/hostAuth";
import { AddBlockForm } from "@/components/AddBlockForm";

export const metadata = { title: "Hantera boende" };

export default async function HostListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isHostAuthed())) redirect("/host/login");
  const { id } = await params;
  const store = getStore();
  const listing = await store.getListingById(id);
  if (!listing || listing.hostId !== DEMO_HOST_ID) notFound();

  const ranges = await store.getBlockedRanges(id);
  const allBookingsByHost = await store.listBookingsByHost(DEMO_HOST_ID);
  const listingBookings = allBookingsByHost.filter((b) => b.listingId === id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/host" className="text-sm font-semibold text-brand hover:text-brand-dark">
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-ink">{listing.title}</h1>
      <p className="text-muted">
        {listing.city}, {listing.country} ·{" "}
        <Link href={`/rooms/${listing.slug}`} className="text-brand hover:underline">
          view as guest →
        </Link>
      </p>

      <section className="mt-8 rounded-2xl border border-line bg-background p-6">
        <h2 className="text-lg font-semibold text-ink">Block dates</h2>
        <p className="mt-1 text-sm text-muted">
          Close periods for maintenance or personal use. Guests cannot book blocked dates.
        </p>
        <div className="mt-4">
          <AddBlockForm listingId={listing.id} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-background p-6">
        <h2 className="text-lg font-semibold text-ink">Upptagna perioder</h2>
        {ranges.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No bookings or blocks yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {ranges.map((r, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink">
                  {r.checkIn} → {r.checkOut}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    r.source === "booking"
                      ? "bg-brand-tint text-brand-dark"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {r.source === "booking" ? "Booking" : "Blocked by you"}
                </span>
              </li>
            ))}
          </ul>
        )}
        {listingBookings.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            {listingBookings.length} {listingBookings.length === 1 ? "booking" : "bookings"} —
            hantera under{" "}
            <Link href="/host/bookings" className="text-brand hover:underline">
              Bookings
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
