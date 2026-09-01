// Seed-katalog för in-memory-DataStoret: de 12 boenden Blanso startar med.
// Bilder via picsum (deterministiska seeds) så inget bildfält någonsin är trasigt.

function images(slug: string, count = 4): string[] {
  return Array.from(
    { length: count },
    (_, i) => `https://picsum.photos/seed/blanso-${slug}-${i + 1}/1200/800`,
  );
}

interface Seed {
  slug: string;
  title: string;
  city: string;
  country: string;
  description: string;
  nightlyPriceCents: number;
  cleaningFeeCents: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  rating: number;
  reviewsCount: number;
  amenities: string[];
  hostName: string;
}

const A = (...a: string[]) => a;

const seeds: Seed[] = [
  {
    slug: "lido-beach-suite-mogadishu",
    title: "Lido Beach Suite med havsutsikt",
    city: "Mogadishu",
    country: "Somalia",
    description:
      "Ljus svit några steg från Lido Beach. Egen balkong mot Indiska oceanen, snabbt wifi och generator dygnet runt. Perfekt för affärsresenärer och familjer.",
    nightlyPriceCents: 8500,
    cleaningFeeCents: 2000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 3,
    baths: 2,
    rating: 4.8,
    reviewsCount: 126,
    amenities: A("Wifi", "Generator", "Havsutsikt", "Luftkonditionering", "Kök", "Säkerhet dygnet runt"),
    hostName: "Amina",
  },
  {
    slug: "hargeisa-city-apartment",
    title: "Modern lägenhet i centrala Hargeisa",
    city: "Hargeisa",
    country: "Somaliland",
    description:
      "Nyrenoverad tvårummare nära Pepsi-korsningen och stadens marknad. Lugnt område, egen parkering och pålitlig el.",
    nightlyPriceCents: 5500,
    cleaningFeeCents: 1500,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    rating: 4.6,
    reviewsCount: 84,
    amenities: A("Wifi", "Parkering", "Luftkonditionering", "Kök", "Tvättmaskin"),
    hostName: "Khadar",
  },
  {
    slug: "bosaso-harbor-view",
    title: "Hamnutsikt i Bosaso",
    city: "Bosaso",
    country: "Somalia",
    description:
      "Rymlig våning med utsikt över hamnen. Nära flygplatsen, idealisk för korta arbetsresor.",
    nightlyPriceCents: 6000,
    cleaningFeeCents: 1500,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    rating: 4.4,
    reviewsCount: 41,
    amenities: A("Wifi", "Generator", "Luftkonditionering", "Nära flygplats"),
    hostName: "Faisal",
  },
  {
    slug: "nairobi-westlands-loft",
    title: "Stilren loft i Westlands, Nairobi",
    city: "Nairobi",
    country: "Kenya",
    description:
      "Designloft mitt i Westlands med gångavstånd till restauranger och kontor. Takterrass, gym i byggnaden och snabbt fiber.",
    nightlyPriceCents: 9500,
    cleaningFeeCents: 2500,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    rating: 4.9,
    reviewsCount: 210,
    amenities: A("Wifi", "Gym", "Takterrass", "Luftkonditionering", "Kök", "Hiss"),
    hostName: "Wanjiru",
  },
  {
    slug: "mombasa-oldtown-riad",
    title: "Swahilihus i Gamla stan, Mombasa",
    city: "Mombasa",
    country: "Kenya",
    description:
      "Charmigt swahilihus med innergård, snidade dörrar och havsbris. Promenad till Fort Jesus och basaren.",
    nightlyPriceCents: 7000,
    cleaningFeeCents: 2000,
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    baths: 2,
    rating: 4.7,
    reviewsCount: 158,
    amenities: A("Wifi", "Innergård", "Luftkonditionering", "Kök", "Strand nära"),
    hostName: "Salim",
  },
  {
    slug: "addis-bole-residence",
    title: "Bole-residens nära flygplatsen, Addis Abeba",
    city: "Addis Ababa",
    country: "Ethiopia",
    description:
      "Bekväm lägenhet i Bole, tio minuter från Bole International. Kaféer, köpcentrum och ambassader runt hörnet.",
    nightlyPriceCents: 6500,
    cleaningFeeCents: 1800,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    rating: 4.6,
    reviewsCount: 97,
    amenities: A("Wifi", "Parkering", "Nära flygplats", "Kök", "Värme"),
    hostName: "Selam",
  },
  {
    slug: "zanzibar-stonetown-villa",
    title: "Villa i Stone Town, Zanzibar",
    city: "Zanzibar",
    country: "Tanzania",
    description:
      "Vitkalkad villa med pool i hjärtat av Stone Town. Frukost på taket med utsikt över hamnen. Guide kan ordnas.",
    nightlyPriceCents: 12000,
    cleaningFeeCents: 3000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 3,
    rating: 4.9,
    reviewsCount: 302,
    amenities: A("Wifi", "Pool", "Frukost", "Luftkonditionering", "Havsutsikt", "Guide"),
    hostName: "Juma",
  },
  {
    slug: "dar-masaki-apartment",
    title: "Masaki-lägenhet vid havet, Dar es Salaam",
    city: "Dar es Salaam",
    country: "Tanzania",
    description:
      "Lugn lägenhet i Masaki med havsbris och närhet till halvöns restauranger och stränder.",
    nightlyPriceCents: 8000,
    cleaningFeeCents: 2000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    rating: 4.5,
    reviewsCount: 73,
    amenities: A("Wifi", "Havsutsikt", "Luftkonditionering", "Kök", "Parkering"),
    hostName: "Neema",
  },
  {
    slug: "kampala-kololo-house",
    title: "Kololo-hus med trädgård, Kampala",
    city: "Kampala",
    country: "Uganda",
    description:
      "Rofyllt hus på Kololo-kullen med frodig trädgård. Nära ambassader och stadens bästa kaféer.",
    nightlyPriceCents: 7500,
    cleaningFeeCents: 2000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    rating: 4.7,
    reviewsCount: 65,
    amenities: A("Wifi", "Trädgård", "Parkering", "Kök", "Säkerhet dygnet runt"),
    hostName: "Brian",
  },
  {
    slug: "kigali-nyarutarama-flat",
    title: "Ljus lägenhet i Nyarutarama, Kigali",
    city: "Kigali",
    country: "Rwanda",
    description:
      "Fräsch lägenhet i Kigalis lugnaste kvarter. Rent, tryggt och nära golfbanan och Kigali Heights.",
    nightlyPriceCents: 7000,
    cleaningFeeCents: 1800,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    rating: 4.8,
    reviewsCount: 112,
    amenities: A("Wifi", "Parkering", "Kök", "Tvättmaskin", "Balkong"),
    hostName: "Aline",
  },
  {
    slug: "djibouti-marina-studio",
    title: "Marinastudio i Djibouti City",
    city: "Djibouti",
    country: "Djibouti",
    description:
      "Kompakt studio vid marinan med utsikt över viken. Nära hamnen och stadens franska kaféer.",
    nightlyPriceCents: 9000,
    cleaningFeeCents: 2000,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    rating: 4.3,
    reviewsCount: 38,
    amenities: A("Wifi", "Luftkonditionering", "Havsutsikt", "Kök"),
    hostName: "Idris",
  },
  {
    slug: "kismayo-garden-rooms",
    title: "Trädgårdsrum i Kismayo",
    city: "Kismayo",
    country: "Somalia",
    description:
      "Fridfullt gästhus med trädgård och hemlagad mat. Familjedrivet med varmt värdskap.",
    nightlyPriceCents: 4500,
    cleaningFeeCents: 1200,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    rating: 4.5,
    reviewsCount: 29,
    amenities: A("Wifi", "Trädgård", "Frukost", "Generator"),
    hostName: "Halima",
  },
];

// Seed-objekt till DataStoret. id = slug (stabilt, läsbart).
export const LISTINGS = seeds.map((s) => ({
  ...s,
  id: s.slug,
  currency: "USD",
  images: images(s.slug),
}));
