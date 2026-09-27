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

// ---- Rumstyper -------------------------------------------------------------
// Seed-katalogens rumstyper (booking.com-modellen: rumstyp × antal rum). Samma
// sanningskälla för MemoryStore och scripts/seed-supabase.mts. Billigaste typen
// har exakt boendets listpris, så landningssidans "From $X" förblir sann.
// Första typen per boende får id `rt-<boendets id>` — samma id som migrationens
// härledda standardtyp, så seeden ersätter den i stället för att lägga en till.

// Rumsfoton ur designfacit/landningen (Unsplash, redan i drift på sajten).
const ROOM_PHOTO = {
  standard: "photo-1566665797739-1674de7a421a",
  deluxe: "photo-1590490360182-c33d57733427",
  suite: "photo-1611892440504-42a792e24d32",
  family: "photo-1582719478250-c89cae4dc85b",
  apartment: "photo-1522708323590-d24dbb6b0267",
  hotel: "photo-1582719508461-905c673771fd",
} as const;
type PhotoKey = keyof typeof ROOM_PHOTO;
const roomPhoto = (k: PhotoKey) =>
  `https://images.unsplash.com/${ROOM_PHOTO[k]}?auto=format&fit=crop&w=900&q=70`;

interface RoomSeed {
  key: string;
  name: string;
  sizeSqm: number;
  bedConfig: string;
  maxGuests: number;
  units: number;
  price: number; // USD per natt
  photo: PhotoKey;
}

const R = (key: string, name: string, sizeSqm: number, bedConfig: string, maxGuests: number, units: number, price: number, photo: PhotoKey): RoomSeed => ({
  key, name, sizeSqm, bedConfig, maxGuests, units, price, photo,
});

const roomSeeds: Record<string, RoomSeed[]> = {
  "zanzibar-stonetown-villa": [
    R("standard", "Standard Double Room", 18, "1 queen bed", 2, 4, 120, "standard"),
    R("deluxe", "Deluxe Sea View Room", 26, "1 king bed", 2, 3, 155, "deluxe"),
    R("family", "Family Room", 34, "1 queen bed and 2 single beds", 4, 2, 195, "family"),
    R("suite", "Rooftop Suite", 45, "1 king bed and 1 sofa bed", 3, 1, 240, "suite"),
  ],
  "lido-beach-suite-mogadishu": [
    R("courtyard", "Courtyard Double Room", 22, "1 queen bed", 2, 4, 85, "standard"),
    R("suite", "Sea View Suite", 48, "1 king bed", 2, 3, 115, "suite"),
    R("family", "Family Suite", 72, "1 king bed and 2 single beds", 4, 2, 160, "family"),
  ],
  "nairobi-westlands-loft": [
    R("studio", "Studio Loft", 28, "1 queen bed", 2, 6, 95, "apartment"),
    R("deluxe", "Deluxe Loft", 38, "1 king bed", 2, 4, 125, "deluxe"),
    R("penthouse", "Penthouse Loft", 60, "1 king bed and 1 sofa bed", 3, 1, 210, "suite"),
  ],
  "mombasa-oldtown-riad": [
    R("standard", "Standard Double Room", 16, "1 double bed", 2, 5, 75, "standard"),
    R("deluxe", "Deluxe Courtyard Room", 24, "1 king bed", 2, 3, 98, "deluxe"),
    R("family", "Family Room", 32, "1 double bed and 2 single beds", 4, 2, 130, "family"),
  ],
  "kampala-kololo-house": [
    R("garden", "Garden Double Room", 20, "1 queen bed", 2, 6, 65, "standard"),
    R("twin", "Deluxe Twin Room", 24, "2 single beds", 2, 4, 80, "deluxe"),
    R("family", "Family Room", 36, "1 queen bed and 2 single beds", 4, 2, 120, "family"),
  ],
  "kigali-nyarutarama-flat": [
    R("one-bed", "One-Bedroom Apartment", 45, "1 queen bed", 2, 5, 70, "apartment"),
    R("two-bed", "Two-Bedroom Apartment", 78, "1 king bed and 2 single beds", 4, 2, 125, "family"),
  ],
  "hargeisa-city-apartment": [
    R("single", "Standard Single Room", 12, "1 single bed", 1, 6, 45, "standard"),
    R("double", "Standard Double Room", 16, "1 double bed", 2, 8, 55, "hotel"),
    R("deluxe", "Deluxe Room", 22, "1 queen bed and 1 single bed", 3, 3, 75, "deluxe"),
  ],
  "dar-masaki-apartment": [
    R("garden", "Garden View Room", 24, "1 queen bed", 2, 4, 110, "standard"),
    R("ocean", "Ocean View Room", 28, "1 king bed", 2, 4, 140, "deluxe"),
    R("suite", "Beach Suite", 52, "1 king bed and 1 sofa bed", 4, 2, 230, "suite"),
  ],
  "addis-bole-residence": [
    R("standard", "Standard Double Room", 18, "1 queen bed", 2, 8, 60, "standard"),
    R("deluxe", "Deluxe King Room", 24, "1 king bed", 2, 6, 78, "deluxe"),
    R("family", "Family Room", 34, "1 queen bed and 2 single beds", 4, 2, 105, "family"),
    R("suite", "Terrace Suite", 40, "1 king bed and 1 sofa bed", 3, 2, 120, "suite"),
  ],
  "bosaso-harbor-view": [
    R("standard", "Standard Double Room", 16, "1 double bed", 2, 6, 60, "standard"),
    R("harbour", "Harbour View Room", 22, "1 queen bed", 2, 4, 75, "deluxe"),
    R("family", "Family Room", 30, "1 double bed and 2 single beds", 4, 2, 110, "family"),
  ],
  "djibouti-marina-studio": [
    R("studio", "Marina Studio", 26, "1 queen bed", 2, 6, 70, "apartment"),
    R("deluxe", "Deluxe Marina Studio", 32, "1 king bed", 2, 3, 92, "deluxe"),
  ],
  "kismayo-garden-rooms": [
    R("double", "Garden Double Room", 16, "1 double bed", 2, 6, 45, "standard"),
    R("twin", "Garden Twin Room", 18, "2 single beds", 2, 4, 50, "hotel"),
    R("triple", "Triple Room", 24, "1 double bed and 1 single bed", 3, 2, 65, "family"),
  ],
};

// Id för en boendes härledda standardrumstyp (samma i SQL-migrationens backfill).
export const defaultRoomTypeId = (listingId: string) => `rt-${listingId}`;

export const ROOM_TYPES = LISTINGS.flatMap((l) =>
  (roomSeeds[l.id] ?? []).map((r, i) => ({
    id: i === 0 ? defaultRoomTypeId(l.id) : `rt-${l.id}-${r.key}`,
    listingId: l.id,
    name: r.name,
    sizeSqm: r.sizeSqm,
    bedConfig: r.bedConfig,
    maxGuests: r.maxGuests,
    units: r.units,
    nightlyPriceCents: r.price * 100,
    images: [roomPhoto(r.photo)],
    sortOrder: i,
  })),
);
