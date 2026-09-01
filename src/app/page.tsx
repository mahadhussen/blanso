import Link from "next/link";
import Image from "next/image";
import { SearchBar } from "@/components/SearchBar";
import { PropertyCard } from "@/components/PropertyCard";
import { searchProperties } from "@/lib/queries";

// Hämta listningarna vid varje förfrågan, aldrig vid build (databas krävs ej
// vid build-tid på Vercel).
export const dynamic = "force-dynamic";

const HERO_IMAGE = "https://picsum.photos/seed/blanso-hero-lido/2000/1100";

export default async function HomePage() {
  const properties = await searchProperties();
  const featured = properties.slice(0, 6);

  return (
    <div>
      {/* Hero: fullbreddsfoto 560px med scrim, display-rubrik i nederkant. */}
      <section className="relative" style={{ height: 560 }}>
        <Image
          src={HERO_IMAGE}
          alt="Kusten vid Lido Beach, Mogadishu"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0" style={{ background: "var(--scrim)" }} />
        <div className="b-page absolute inset-x-0 bottom-0 pb-12">
          <p className="b-label b-rise" style={{ color: "rgba(255,255,255,.85)" }}>
            Östafrika · Somalia · Kenya · Tanzania
          </p>
          <h1 className="b-display b-rise-2 mt-3" style={{ color: "#fff", maxWidth: 900 }}>
            Östafrikas egen plats att boka boende
          </h1>
        </div>
      </section>

      {/* Sökrad */}
      <section className="b-page" style={{ marginTop: "var(--s-6)" }}>
        <SearchBar />
      </section>

      {/* Utvalda boenden */}
      <section className="b-page" style={{ marginTop: "var(--s-8)" }}>
        <div className="text-center">
          <p className="b-label">Utvalda boenden</p>
          <h2 className="b-h2 mt-2">Från Lido Beach till Stone Town</h2>
        </div>
        <div
          className="mt-12 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3"
        >
          {featured.map((p, i) => (
            <div key={p.id} className={i < 3 ? `b-rise-${Math.min(i + 1, 3)}`.replace("b-rise-1", "b-rise") : undefined}>
              <PropertyCard property={p} />
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Link href="/s" className="b-btn">
            Visa alla boenden
          </Link>
        </div>
      </section>

      {/* För värdar */}
      <section
        className="mt-24"
        style={{ background: "var(--wash)", paddingTop: "var(--s-8)", paddingBottom: "var(--s-8)" }}
      >
        <div className="b-page text-center">
          <p className="b-label">För värdar</p>
          <h2 className="b-h2 mt-2">Har du ett ledigt rum?</h2>
          <p className="b-lead mx-auto mt-4" style={{ maxWidth: "52ch" }}>
            Lägg upp ditt boende på Blanso och nå resenärer i hela Östafrika.
            Du bestämmer pris, datum och regler — vi sköter bokningen.
          </p>
          <div className="mt-8">
            <Link href="/host" className="b-btn b-btn-solid">
              Bli värd
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
