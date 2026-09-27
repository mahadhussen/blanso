"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { priceForDates } from "@/lib/pricing";
import { getPaymentProvider } from "@/lib/payments";
import { bookingSchema, dollarsToCents, listingSchema, roomTypeSchema } from "@/lib/validation";
import { filesToUploads, getImageStore, MAX_PHOTOS, UploadError } from "@/lib/imageStore";
import { randomBytes } from "crypto";
import { isPastDate, nightsBetween, validateStay } from "@/lib/dates";
import { getStore } from "@/lib/store";
import { DEMO_HOST_ID } from "@/lib/store/memory";
import { HOST_COOKIE, hostPasscode, isHostAuthed } from "@/lib/hostAuth";
import { roomsLeftMessage } from "@/lib/roomCopy";

export interface BookingState {
  // Lyckad väg redirectar från servern och returnerar aldrig hit.
  status: "idle" | "error";
  error?: string;
}

// Skapar en bokning av EN rumstyp × antal rum: auktoritativt pris ur den
// deterministiska motorn (rumstypens pris, aldrig klientens), sandbox-betalning,
// atomisk skrivning i DataStore (lagerkoll per natt och insättning i ett steg —
// överbokning kan inte smyga emellan). Kortdata sparas aldrig.
export async function createBookingAndPay(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const input = parsed.data;
  const store = getStore();

  const listing = await store.getListingById(input.propertyId);
  if (!listing || listing.status !== "published") {
    return { status: "error", error: "Stay not found." };
  }
  const roomType = await store.getRoomType(input.roomTypeId);
  if (!roomType || roomType.listingId !== listing.id || roomType.archivedAt !== null) {
    return { status: "error", error: "That room is no longer offered. Go back and choose another room." };
  }
  const capacity = roomType.maxGuests * input.rooms;
  if (input.guests > capacity) {
    return {
      status: "error",
      error: `${input.rooms} × ${roomType.name} sleeps at most ${capacity} ${capacity === 1 ? "guest" : "guests"}.`,
    };
  }
  const stay = validateStay(input.checkIn, input.checkOut);
  if (!stay.ok) return { status: "error", error: stay.error };

  let price;
  try {
    price = priceForDates({
      nightlyPriceCents: roomType.nightlyPriceCents,
      cleaningFeeCents: listing.cleaningFeeCents,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      rooms: input.rooms,
    });
  } catch {
    return { status: "error", error: "Invalid dates. Choose at least one night." };
  }

  // Förkolla lagret INNAN betalning — en gäst ska aldrig betala för rum som
  // redan är tagna. Den atomiska kollen i createBooking ligger kvar som sista
  // skydd mot kapplöpning mellan två samtidiga gäster.
  const current = (await store.getRoomAvailability(listing.id, input.checkIn, input.checkOut)).find(
    (a) => a.roomType.id === roomType.id,
  );
  if (!current || current.closed) {
    return { status: "error", error: `The ${roomType.name} is not available on those dates.` };
  }
  if (current.available < input.rooms) {
    return { status: "error", error: roomsLeftMessage(current.available, input.rooms, roomType.name) };
  }

  // Betalning FÖRE skrivning: ingen bokning utan lyckad betalning.
  const provider = getPaymentProvider();
  let paymentRef = "";
  try {
    const intent = await provider.createPaymentIntent({
      amountCents: price.totalCents,
      currency: listing.currency,
      reference: listing.id,
    });
    const confirmation = await provider.confirmPaymentIntent({
      intentId: intent.id,
      amountCents: price.totalCents,
      currency: listing.currency,
      card: {
        number: input.cardNumber,
        expMonth: input.cardExpMonth,
        expYear: input.cardExpYear,
        cvc: input.cardCvc,
        name: input.cardName,
      },
    });
    if (confirmation.status === "succeeded") paymentRef = confirmation.id;
  } catch {
    paymentRef = "";
  }
  if (!paymentRef) {
    return {
      status: "error",
      error: "The payment was declined. Use sandbox card 4242 4242 4242 4242 to succeed.",
    };
  }

  const result = await store.createBooking({
    listingId: listing.id,
    roomTypeId: roomType.id,
    rooms: input.rooms,
    guestName: `${input.guestFirstName} ${input.guestLastName}`,
    guestEmail: input.guestEmail,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    nights: price.nights,
    subtotalCents: price.subtotalCents,
    cleaningFeeCents: price.cleaningFeeCents,
    serviceFeeCents: price.serviceFeeCents,
    totalCents: price.totalCents,
    currency: listing.currency,
    paymentRef,
  });

  if (!result.ok || !result.booking) {
    // Betalningen lyckades men bokningen kunde inte slutföras (någon hann före i
    // kapplöpningsfönstret). Återkalla betalningen och SÄG det — en gäst får
    // aldrig stå med dragna pengar utan bokning, inte ens i sandbox.
    const voided = await provider.voidPaymentIntent({ intentId: paymentRef }).catch(() => ({ ok: false }));
    const refundNote = voided.ok
      ? " Your payment has been reversed — no money was taken."
      : " Your payment is being reversed — contact us if it does not show up shortly.";
    const reason =
      result.error === "NOT_ENOUGH_ROOMS"
        ? `Someone booked just before you. ${roomsLeftMessage(result.available ?? 0, input.rooms, roomType.name)}`
        : result.error === "UNAVAILABLE"
          ? `The ${roomType.name} was just closed for those dates.`
          : "Could not create the booking.";
    return { status: "error", error: reason + refundNote };
  }

  redirect(`/bookings/${result.booking.accessToken}`);
}

// ---- Värdflödet -------------------------------------------------------------

async function requireHost(): Promise<string | null> {
  return (await isHostAuthed()) ? DEMO_HOST_ID : null;
}

// Laddar upp värdens foton (fält `photos`). Kastar UploadError med ett
// värdvänligt meddelande. Tom lista om inga foton valdes ELLER om ingen
// lagring är konfigurerad (lokal demo) — anroparen väljer då reserv.
async function uploadPhotos(formData: FormData, keyPrefix: string): Promise<string[]> {
  const photoFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (photoFiles.length > MAX_PHOTOS) throw new UploadError(`Add at most ${MAX_PHOTOS} photos.`);
  if (photoFiles.length === 0) return [];
  const uploads = await filesToUploads(photoFiles);
  return getImageStore().uploadListingImages(`${keyPrefix}-${randomBytes(8).toString("hex")}`, uploads);
}

export interface ListingActionState {
  status: "idle" | "error" | "success";
  error?: string;
  slug?: string;
}

// Nytt boende + dess första rumstyp. Värden landar sedan i extranätet för
// boendet och lägger till fler rumstyper där.
export async function createListing(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const hostId = await requireHost();
  if (!hostId) return { status: "error", error: "Sign in as a host before publishing." };

  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Invalid details" };
  }
  const d = parsed.data;

  // Foton laddas upp FÖRE skrivning: validering + uppladdning kan kasta, och då
  // skapas ingen halvfärdig annons.
  let images: string[];
  try {
    images = await uploadPhotos(formData, "lst");
  } catch (err) {
    if (err instanceof UploadError) return { status: "error", error: err.message };
    throw err;
  }

  // Ingen lagring konfigurerad (demo) eller inga foton: deterministiska
  // platshållarbilder så annonssidan aldrig står tom.
  if (images.length === 0) {
    const seed =
      `${d.title}-${d.city}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") ||
      "stay";
    images = Array.from(
      { length: 4 },
      (_, i) => `https://picsum.photos/seed/blanso-${seed}-${i + 1}/1200/800`,
    );
  }

  const store = getStore();
  const host = await store.getHostById(hostId);
  const roomPriceCents = dollarsToCents(d.roomNightlyPrice);

  const listing = await store.createListing(hostId, {
    hostId,
    hostName: host?.name ?? "Host",
    title: d.title,
    city: d.city,
    country: d.country,
    description: d.description,
    // Arvsfält (se domain.ts) — speglar första rumstypen, används aldrig för pris.
    nightlyPriceCents: roomPriceCents,
    cleaningFeeCents: dollarsToCents(d.cleaningFee),
    currency: "USD",
    maxGuests: d.roomMaxGuests,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    images,
    amenities: d.amenities
      ? d.amenities.split(",").map((a) => a.trim()).filter(Boolean)
      : [],
  });

  await store.createRoomType(listing.id, hostId, {
    name: d.roomName,
    sizeSqm: d.roomSizeSqm,
    bedConfig: d.roomBedConfig,
    maxGuests: d.roomMaxGuests,
    units: d.roomUnits,
    nightlyPriceCents: roomPriceCents,
    images: [],
    sortOrder: 0,
  });

  await store.setListingStatus(listing.id, hostId, "published");

  redirect(`/host/listings/${listing.id}?created=1#rooms`);
}

export async function unpublishListing(formData: FormData): Promise<void> {
  const hostId = await requireHost();
  if (!hostId) return;
  const id = String(formData.get("listingId") ?? "");
  await getStore().setListingStatus(id, hostId, "unlisted");
  redirect("/host");
}

export async function publishListing(formData: FormData): Promise<void> {
  const hostId = await requireHost();
  if (!hostId) return;
  const id = String(formData.get("listingId") ?? "");
  await getStore().setListingStatus(id, hostId, "published");
  redirect("/host");
}

// ---- Rumstyper (extranätet) --------------------------------------------------

export interface RoomTypeState {
  status: "idle" | "error";
  error?: string;
}

function roomTypeFields(formData: FormData) {
  return roomTypeSchema.safeParse({
    name: formData.get("name"),
    sizeSqm: formData.get("sizeSqm"),
    bedConfig: formData.get("bedConfig"),
    maxGuests: formData.get("maxGuests"),
    units: formData.get("units"),
    nightlyPrice: formData.get("nightlyPrice"),
  });
}

export async function saveRoomType(_prev: RoomTypeState, formData: FormData): Promise<RoomTypeState> {
  const hostId = await requireHost();
  if (!hostId) return { status: "error", error: "Sign in as a host." };
  const listingId = String(formData.get("listingId") ?? "");
  const roomTypeId = String(formData.get("roomTypeId") ?? "");
  const parsed = roomTypeFields(formData);
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Invalid room details" };
  }
  const d = parsed.data;

  let images: string[];
  try {
    images = await uploadPhotos(formData, "rt");
  } catch (err) {
    if (err instanceof UploadError) return { status: "error", error: err.message };
    throw err;
  }

  const store = getStore();
  const fields = {
    name: d.name,
    sizeSqm: d.sizeSqm,
    bedConfig: d.bedConfig,
    maxGuests: d.maxGuests,
    units: d.units,
    nightlyPriceCents: dollarsToCents(d.nightlyPrice),
  };

  if (roomTypeId) {
    // Nya foton ersätter de gamla; inga nya foton = behåll befintliga.
    const res = await store.updateRoomType(roomTypeId, hostId, images.length ? { ...fields, images } : fields);
    if (!res.ok) {
      return {
        status: "error",
        error:
          res.error === "UNITS_BELOW_BOOKED"
            ? `You already have ${res.detail} rooms of this type booked on one night ahead — keep at least ${res.detail}.`
            : "Could not find that room type.",
      };
    }
  } else {
    const existing = await store.listRoomTypes(listingId);
    const created = await store.createRoomType(listingId, hostId, {
      ...fields,
      images,
      sortOrder: existing.reduce((m, r) => Math.max(m, r.sortOrder + 1), 0),
    });
    if (!created) return { status: "error", error: "Could not add the room type." };
  }
  redirect(`/host/listings/${listingId}#rooms`);
}

export async function deleteRoomTypeAction(_prev: RoomTypeState, formData: FormData): Promise<RoomTypeState> {
  const hostId = await requireHost();
  if (!hostId) return { status: "error", error: "Sign in as a host." };
  const listingId = String(formData.get("listingId") ?? "");
  const roomTypeId = String(formData.get("roomTypeId") ?? "");
  const res = await getStore().deleteRoomType(roomTypeId, hostId);
  if (!res.ok) {
    return {
      status: "error",
      error:
        res.error === "HAS_FUTURE_BOOKINGS"
          ? `This room type has ${res.detail} upcoming ${res.detail === 1 ? "booking" : "bookings"}. Cancel or complete ${res.detail === 1 ? "it" : "them"} before removing the room type.`
          : "Could not find that room type.",
    };
  }
  redirect(`/host/listings/${listingId}#rooms`);
}

// ---- Stängningar -------------------------------------------------------------

export interface BlockState {
  status: "idle" | "error";
  error?: string;
}

export async function addBlock(_prev: BlockState, formData: FormData): Promise<BlockState> {
  const hostId = await requireHost();
  if (!hostId) return { status: "error", error: "Sign in as a host." };
  const listingId = String(formData.get("listingId") ?? "");
  const checkIn = String(formData.get("checkIn") ?? "");
  const checkOut = String(formData.get("checkOut") ?? "");
  const note = String(formData.get("note") ?? "").trim() || undefined;
  const roomTypeId = String(formData.get("roomTypeId") ?? "") || null;

  if (!checkIn || !checkOut) return { status: "error", error: "Choose the first night and the day it reopens." };
  if (nightsBetween(checkIn, checkOut) < 1) return { status: "error", error: "The reopen date must be after the first closed night." };
  if (isPastDate(checkIn)) return { status: "error", error: "You cannot close nights in the past." };

  const created = await getStore().addAvailabilityBlock(listingId, hostId, {
    checkIn,
    checkOut,
    note,
    roomTypeId,
  });
  if (!created) return { status: "error", error: "Could not close those dates." };
  redirect(`/host/listings/${listingId}?from=${checkIn}#availability`);
}

export async function removeBlock(formData: FormData): Promise<void> {
  const hostId = await requireHost();
  if (!hostId) return;
  const id = String(formData.get("blockId") ?? "");
  const listingId = String(formData.get("listingId") ?? "");
  await getStore().removeAvailabilityBlock(id, hostId);
  redirect(`/host/listings/${listingId}#availability`);
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const hostId = await requireHost();
  if (!hostId) return;
  const id = String(formData.get("bookingId") ?? "");
  const store = getStore();
  // Avbokning av en betald bokning ÅTERKALLAR alltid betalningen — en gäst får
  // aldrig stå som debiterad för en avbokad vistelse (refund i riktig Stripe).
  const booking = (await store.listBookingsByHost(hostId)).find((b) => b.id === id);
  const cancelled = await store.cancelBooking(id, hostId);
  if (cancelled && booking?.paymentRef) {
    await getPaymentProvider()
      .voidPaymentIntent({ intentId: booking.paymentRef })
      .catch(() => undefined);
  }
  redirect("/host/bookings");
}

// ---- Värdinloggning ---------------------------------------------------------

export interface HostLoginState {
  status: "idle" | "error";
  error?: string;
}

export async function loginHost(
  _prev: HostLoginState,
  formData: FormData,
): Promise<HostLoginState> {
  const code = String(formData.get("passcode") ?? "").trim();
  if (code !== hostPasscode()) {
    return { status: "error", error: "Wrong passcode. Try again." };
  }
  const store = await cookies();
  store.set(HOST_COOKIE, hostPasscode(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/host");
}

export async function logoutHost(): Promise<void> {
  const store = await cookies();
  store.delete(HOST_COOKIE);
  redirect("/host/login");
}
