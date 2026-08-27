import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { searchProperties } from "@/lib/queries";

export const metadata = { title: "Sök boende" };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const destination = first(sp.destination);
  const checkIn = first(sp.checkIn);
  const checkOut = first(sp.checkOut);
  const guestsRaw = first(sp.guests);
  const guests = guestsRaw ? Math.max(1, parseInt(guestsRaw, 10) || 1) : undefined;

  const properties = await searchProperties({ destination, guests });

  // Bär datum och gäster vidare till varje boende så bokningen är förifylld.
  const forward = new URLSearchParams();
  if (checkIn) forward.set("checkIn", checkIn);
  if (checkOut) forward.set("checkOut", checkOut);
  if (guests) forward.set("guests", String(guests));
  const query = forward.toString();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <SearchBar
        variant="compact"
        initial={{ destination, checkIn, checkOut, guests: guests ?? 1 }}
      />

      <div className="mt-8 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-ink">
          {destination ? `Boende i ${destination}` : "Alla boenden"}
        </h1>
        <p className="text-sm text-muted">
          {properties.length} {properties.length === 1 ? "träff" : "träffar"}
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-line bg-panel p-10 text-center">
          <p className="text-lg font-semibold text-ink">Inga boenden matchade din sökning</p>
          <p className="mt-1 text-muted">
            Prova en annan stad, till exempel Nairobi, Zanzibar eller Hargeisa.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}
