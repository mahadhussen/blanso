// Seed-katalog för DataStoret: de 12 boenden Balaanso startar med.
// Engelska (hela produkten är engelsk), betyg på 10-gradig skala och priser
// enligt designfacits landningskort. Bilder via picsum (deterministiska seeds).

function images(slug: string, count = 5): string[] {
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
    slug: "zanzibar-stonetown-villa",
    title: "Villa in Stone Town",
    city: "Zanzibar",
    country: "Tanzania",
    description:
      "A whitewashed villa with a pool in the heart of Stone Town. Breakfast on the roof terrace overlooking the harbour, carved doors and sea breeze throughout. A guide can be arranged.",
    nightlyPriceCents: 12000,
    cleaningFeeCents: 3000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 3,
    rating: 9.2,
    reviewsCount: 48,
    amenities: A("Wi-Fi", "Pool", "Breakfast included", "Air conditioning", "Sea view", "Guide on request"),
    hostName: "Juma",
  },
  {
    slug: "lido-beach-suite-mogadishu",
    title: "Lido Beach Suite",
    city: "Mogadishu",
    country: "Somalia",
    description:
      "A bright suite a few steps from Lido Beach with its own balcony facing the Indian Ocean. Fast Wi-Fi and generator power around the clock. Your host Amina meets you on arrival and arranges transfers.",
    nightlyPriceCents: 8500,
    cleaningFeeCents: 2000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 3,
    baths: 2,
    rating: 8.9,
    reviewsCount: 61,
    amenities: A("Wi-Fi", "24h electricity", "Sea view", "Air conditioning", "Kitchen", "Airport transfer"),
    hostName: "Amina",
  },
  {
    slug: "nairobi-westlands-loft",
    title: "Design loft in Westlands",
    city: "Nairobi",
    country: "Kenya",
    description:
      "A design loft in the middle of Westlands, walking distance to restaurants and offices. Roof terrace, gym in the building and fast fibre.",
    nightlyPriceCents: 9500,
    cleaningFeeCents: 2500,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    rating: 9.0,
    reviewsCount: 35,
    amenities: A("Wi-Fi", "Gym", "Roof terrace", "Air conditioning", "Kitchen", "Lift"),
    hostName: "Wanjiru",
  },
  {
    slug: "mombasa-oldtown-riad",
    title: "Swahili house in Old Town",
    city: "Mombasa",
    country: "Kenya",
    description:
      "A charming Swahili house with a courtyard, carved doors and sea breeze. A short walk to Fort Jesus and the bazaar.",
    nightlyPriceCents: 7500,
    cleaningFeeCents: 2000,
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    baths: 2,
    rating: 8.7,
    reviewsCount: 29,
    amenities: A("Wi-Fi", "Courtyard", "Air conditioning", "Kitchen", "Beach nearby"),
    hostName: "Salim",
  },
  {
    slug: "kampala-kololo-house",
    title: "Kololo garden house",
    city: "Kampala",
    country: "Uganda",
    description:
      "A peaceful house on Kololo hill with a lush garden. Close to the embassies and the city's best cafés.",
    nightlyPriceCents: 6500,
    cleaningFeeCents: 2000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    rating: 8.8,
    reviewsCount: 41,
    amenities: A("Wi-Fi", "Garden", "Parking", "Kitchen", "24h security"),
    hostName: "Brian",
  },
  {
    slug: "kigali-nyarutarama-flat",
    title: "Apartment in Nyarutarama",
    city: "Kigali",
    country: "Rwanda",
    description:
      "A fresh apartment in Kigali's quietest neighbourhood. Clean, safe and close to the golf course and Kigali Heights.",
    nightlyPriceCents: 7000,
    cleaningFeeCents: 1800,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    rating: 9.1,
    reviewsCount: 22,
    amenities: A("Wi-Fi", "Parking", "Kitchen", "Washing machine", "Balcony"),
    hostName: "Aline",
  },
  {
    slug: "hargeisa-city-apartment",
    title: "City guesthouse",
    city: "Hargeisa",
    country: "Somaliland",
    description:
      "A newly renovated guesthouse near the city market. Quiet area, private parking and reliable power.",
    nightlyPriceCents: 4500,
    cleaningFeeCents: 1500,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    rating: 8.5,
    reviewsCount: 18,
    amenities: A("Wi-Fi", "Parking", "Air conditioning", "Kitchen", "24h electricity"),
    hostName: "Khadar",
  },
  {
    slug: "dar-masaki-apartment",
    title: "Beach villa in Msasani",
    city: "Dar es Salaam",
    country: "Tanzania",
    description:
      "A calm villa in Msasani with sea breeze, close to the peninsula's restaurants and beaches.",
    nightlyPriceCents: 11000,
    cleaningFeeCents: 2000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    rating: 9.3,
    reviewsCount: 57,
    amenities: A("Wi-Fi", "Sea view", "Air conditioning", "Kitchen", "Parking"),
    hostName: "Neema",
  },
  {
    slug: "addis-bole-residence",
    title: "Bole terrace apartment",
    city: "Addis Ababa",
    country: "Ethiopia",
    description:
      "A comfortable apartment in Bole, ten minutes from Bole International. Cafés, malls and embassies around the corner.",
    nightlyPriceCents: 6000,
    cleaningFeeCents: 1800,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    rating: 8.6,
    reviewsCount: 33,
    amenities: A("Wi-Fi", "Parking", "Airport transfer", "Kitchen", "Heating"),
    hostName: "Selam",
  },
  {
    slug: "bosaso-harbor-view",
    title: "Harbour rooms in Bosaso",
    city: "Bosaso",
    country: "Somalia",
    description:
      "A spacious floor with a view of the harbour. Close to the airport — ideal for short work trips.",
    nightlyPriceCents: 6000,
    cleaningFeeCents: 1500,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    rating: 8.4,
    reviewsCount: 24,
    amenities: A("Wi-Fi", "24h electricity", "Air conditioning", "Airport transfer"),
    hostName: "Faisal",
  },
  {
    slug: "djibouti-marina-studio",
    title: "Harbour studio in Djibouti",
    city: "Djibouti",
    country: "Djibouti",
    description:
      "A compact studio by the marina with a view of the bay. Close to the port and the city's French cafés.",
    nightlyPriceCents: 7000,
    cleaningFeeCents: 2000,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    rating: 8.3,
    reviewsCount: 21,
    amenities: A("Wi-Fi", "Air conditioning", "Sea view", "Kitchen"),
    hostName: "Idris",
  },
  {
    slug: "kismayo-garden-rooms",
    title: "Garden rooms in Kismayo",
    city: "Kismayo",
    country: "Somalia",
    description:
      "A peaceful family-run guesthouse with a garden and home-cooked meals. Warm hospitality.",
    nightlyPriceCents: 4500,
    cleaningFeeCents: 1200,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    rating: 8.2,
    reviewsCount: 14,
    amenities: A("Wi-Fi", "Garden", "Breakfast included", "24h electricity"),
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
