import Link from "next/link";
import { redirect } from "next/navigation";
import { HostListingForm } from "@/components/HostListingForm";
import { searchProperties } from "@/lib/queries";
import { formatPriceShort } from "@/lib/money";
import { isHostAuthed } from "@/lib/hostAuth";

export const metadata = { title: "Bli värd" };

export default async function HostPage() {
  if (!(await isHostAuthed())) redirect("/host/login");
  const properties = await searchProperties();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Bli värd på Blanso</h1>
          <p className="mt-1 text-muted">Lägg upp ditt boende och nå resenärer i hela Östafrika.</p>
        </div>
        <Link
          href="/host/bookings"
          className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
        >
          Se bokningar
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[24rem_1fr]">
        <div className="rounded-2xl border border-line bg-background p-6 shadow-card">
          <h2 className="text-lg font-semibold text-ink">Nytt boende</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Bilder genereras automatiskt i demon. Priset anges i USD.
          </p>
          <HostListingForm />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Publicerade boenden ({properties.length})</h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-background">
            {properties.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/rooms/${p.slug}`} className="truncate font-medium text-ink hover:text-brand">
                    {p.title}
                  </Link>
                  <p className="truncate text-sm text-muted">
                    {p.city}, {p.country} · värd {p.hostName}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-ink">
                  {formatPriceShort(p.nightlyPriceCents, p.currency)}/natt
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
