import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { searchProperties, listCities } from "@/lib/queries";

// Hämta listningarna vid varje förfrågan, aldrig vid build. Annars försöker
// Next prerendera startsidan vid build-tid och kräver en databas som inte finns
// på Vercel då (bygget dog på "Environment variable not found: DATABASE_URL").
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [properties, cities] = await Promise.all([searchProperties(), listCities()]);
  const featured = properties.slice(0, 8);
  const uniqueCities = cities.slice(0, 6);

  return (
    <div>
      <section className="blanso-hero-gradient">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Östafrikas egen plats att boka boende
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/85">
            Från Lido Beach i Mogadishu till Stone Town i Zanzibar. Trygg bokning,
            tydliga priser, hem som känns som hem.
          </p>
          <div className="mt-8 max-w-4xl">
            <SearchBar variant="hero" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {uniqueCities.map((c) => (
              <Link
                key={c.city}
                href={`/s?destination=${encodeURIComponent(c.city)}`}
                className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur hover:bg-white/25"
              >
                {c.city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-ink">Populära boenden</h2>
          <Link href="/s" className="text-sm font-semibold text-brand hover:text-brand-dark">
            Visa alla →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
