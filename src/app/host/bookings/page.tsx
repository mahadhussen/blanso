import Link from "next/link";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { DEMO_HOST_ID } from "@/lib/store/memory";
import { formatMoney } from "@/lib/money";
import { isHostAuthed } from "@/lib/hostAuth";
import { cancelBookingAction } from "@/app/actions";

export const metadata = { title: "Bokningar" };

export default async function HostBookingsPage() {
  if (!(await isHostAuthed())) redirect("/host/login");
  const bookings = await getStore().listBookingsByHost(DEMO_HOST_ID);

  const revenueCents = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + b.totalCents, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Bokningar</h1>
        <Link href="/host" className="text-sm font-semibold text-brand hover:text-brand-dark">
          ← Till värdpanelen
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <Stat label="Totalt antal" value={String(bookings.length)} />
        <Stat
          label="Bekräftade"
          value={String(bookings.filter((b) => b.status === "confirmed").length)}
        />
        <Stat label="Intäkt (bekräftad)" value={formatMoney(revenueCents, "USD")} />
      </div>

      {bookings.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-line bg-panel p-8 text-center text-muted">
          Inga bokningar ännu. När en gäst bokar dyker den upp här direkt.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-panel text-muted">
              <tr>
                <Th>Boende</Th>
                <Th>Gäst</Th>
                <Th>Datum</Th>
                <Th>Belopp</Th>
                <Th>Status</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {bookings.map((b) => (
                <tr key={b.id} className="bg-background">
                  <td className="px-4 py-3 font-medium text-ink">{b.listingTitle}</td>
                  <td className="px-4 py-3 text-ink">
                    {b.guestName}
                    <div className="text-xs text-muted">{b.guestEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {b.checkIn} → {b.checkOut}
                    <div className="text-xs text-muted">
                      {b.nights} nätter · {b.guests} gäster
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatMoney(b.totalCents, b.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        b.status === "confirmed"
                          ? "bg-brand-tint text-brand-dark"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {b.status === "confirmed" ? "Bekräftad" : "Avbokad"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {b.status === "confirmed" && (
                      <form action={cancelBookingAction}>
                        <input type="hidden" name="bookingId" value={b.id} />
                        <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-red-300 hover:text-red-700">
                          Avboka
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-background px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}
