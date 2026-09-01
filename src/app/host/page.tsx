import Link from "next/link";
import { redirect } from "next/navigation";
import { HostListingForm } from "@/components/HostListingForm";
import { getStore } from "@/lib/store";
import { DEMO_HOST_ID } from "@/lib/store/memory";
import { formatPriceShort } from "@/lib/money";
import { isHostAuthed } from "@/lib/hostAuth";
import { publishListing, unpublishListing, logoutHost } from "@/app/actions";

export const metadata = { title: "Värdpanel" };

const statusLabel: Record<string, { text: string; cls: string }> = {
  published: { text: "Publicerad", cls: "bg-brand-tint text-brand-dark" },
  unlisted: { text: "Avpublicerad", cls: "bg-panel text-muted" },
  draft: { text: "Utkast", cls: "bg-amber-50 text-amber-700" },
};

export default async function HostPage() {
  if (!(await isHostAuthed())) redirect("/host/login");
  const listings = await getStore().listListingsByHost(DEMO_HOST_ID);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Värdpanel</h1>
          <p className="mt-1 text-muted">Lägg upp lediga rum och hantera dina boenden.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/host/bookings"
            className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
          >
            Bokningar
          </Link>
          <form action={logoutHost}>
            <button className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-muted hover:text-ink">
              Logga ut
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[24rem_1fr]">
        <div className="rounded-2xl border border-line bg-background p-6 shadow-card lg:self-start">
          <h2 className="text-lg font-semibold text-ink">Lägg upp ett rum</h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Publiceras direkt och blir bokningsbart. Bilder genereras i demon.
          </p>
          <HostListingForm />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-ink">Dina boenden ({listings.length})</h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-background">
            {listings.map((l) => {
              const s = statusLabel[l.status] ?? statusLabel.draft;
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/host/listings/${l.id}`}
                        className="truncate font-medium text-ink hover:text-brand"
                      >
                        {l.title}
                      </Link>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}>
                        {s.text}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted">
                      {l.city}, {l.country} · {formatPriceShort(l.nightlyPriceCents, l.currency)}/natt
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/host/listings/${l.id}`}
                      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
                    >
                      Hantera
                    </Link>
                    {l.status === "published" ? (
                      <form action={unpublishListing}>
                        <input type="hidden" name="listingId" value={l.id} />
                        <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink">
                          Avpublicera
                        </button>
                      </form>
                    ) : (
                      <form action={publishListing}>
                        <input type="hidden" name="listingId" value={l.id} />
                        <button className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">
                          Publicera
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
