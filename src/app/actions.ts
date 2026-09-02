"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { priceForDates } from "@/lib/pricing";
import { isAvailable } from "@/lib/availability";
import { getPaymentProvider } from "@/lib/payments";
import { bookingSchema, listingSchema } from "@/lib/validation";
import { filesToUploads, getImageStore, MAX_PHOTOS, UploadError } from "@/lib/imageStore";
import { randomBytes } from "crypto";
import { validateStay } from "@/lib/dates";
import { getStore } from "@/lib/store";
import { DEMO_HOST_ID } from "@/lib/store/memory";
import { HOST_COOKIE, hostPasscode, isHostAuthed } from "@/lib/hostAuth";

export interface BookingState {
  // Lyckad väg redirectar från servern och returnerar aldrig hit.
  status: "idle" | "error";
  error?: string;
}

// Skapar en bokning: auktoritativt pris ur den deterministiska motorn,
// sandbox-betalning, atomisk skrivning i DataStore (tillgänglighetskoll och
// insättning i ett steg — dubbelbokning kan inte smyga emellan). Kortdata
// sparas aldrig.
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
  if (input.guests > listing.maxGuests) {
    return { status: "error", error: `This stay takes at most ${listing.maxGuests} guests.` };
  }
  const stay = validateStay(input.checkIn, input.checkOut);
  if (!stay.ok) return { status: "error", error: stay.error };

  let price;
  try {
    price = priceForDates({
      nightlyPriceCents: listing.nightlyPriceCents,
      cleaningFeeCents: listing.cleaningFeeCents,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });
  } catch {
    return { status: "error", error: "Invalid dates. Choose at least one night." };
  }

  // Förkolla tillgängligheten INNAN betalning — en gäst ska aldrig betala för
  // datum som redan är tagna. Den atomiska kollen i createBooking ligger kvar
  // som sista skydd mot kapplöpning mellan två samtidiga gäster.
  {
    const blocked = await store.getBlockedRanges(listing.id);
    if (!isAvailable({ checkIn: input.checkIn, checkOut: input.checkOut }, blocked)) {
      return { status: "error", error: "Those dates are already booked." };
    }
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
    // Betalningen lyckades men bokningen kunde inte slutföras (t.ex. någon hann
    // före i kapplöpningsfönstret). Återkalla betalningen och SÄG det — en gäst
    // får aldrig stå med dragna pengar utan bokning, inte ens i sandbox.
    const voided = await provider.voidPaymentIntent({ intentId: paymentRef }).catch(() => ({ ok: false }));
    const refundNote = voided.ok
      ? " Your payment has been reversed — no money was taken."
      : " Your payment is being reversed — contact us if it does not show up shortly.";
    return {
      status: "error",
      error:
        (result.error === "UNAVAILABLE"
          ? "Someone else booked those dates just before you."
          : "Could not create the booking.") + refundNote,
    };
  }

  redirect(`/bookings/${result.booking.accessToken}`);
}

// ---- Värdflödet -------------------------------------------------------------

async function requireHost(): Promise<string | null> {
  return (await isHostAuthed()) ? DEMO_HOST_ID : null;
}

export interface ListingActionState {
  status: "idle" | "error" | "success";
  error?: string;
  slug?: string;
}

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

  // Ladda upp värdens foton FÖRE bokningen skapas. Validering + uppladdning kan
  // kasta; då returnerar vi felet och skapar ingen halvfärdig annons. Nyckeln är
  // ett slumpprefix (inte slug), så uppladdningen är oberoende av att annonsen
  // finns än. Filerna kommer som File i FormData (server action).
  const photoFiles = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (photoFiles.length > MAX_PHOTOS) {
    return { status: "error", error: `Add at most ${MAX_PHOTOS} photos.` };
  }

  let images: string[] = [];
  if (photoFiles.length > 0) {
    try {
      const uploads = await filesToUploads(photoFiles);
      images = await getImageStore().uploadListingImages(
        `lst-${randomBytes(8).toString("hex")}`,
        uploads,
      );
    } catch (err) {
      if (err instanceof UploadError) return { status: "error", error: err.message };
      throw err;
    }
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

  const listing = await store.createListing(hostId, {
    hostId,
    hostName: host?.name ?? "Host",
    title: d.title,
    city: d.city,
    country: d.country,
    description: d.description,
    nightlyPriceCents: Math.round(d.nightlyPrice * 100),
    cleaningFeeCents: Math.round(d.cleaningFee * 100),
    currency: "USD",
    maxGuests: d.maxGuests,
    bedrooms: d.bedrooms,
    beds: d.beds,
    baths: d.baths,
    images,
    amenities: d.amenities
      ? d.amenities.split(",").map((a) => a.trim()).filter(Boolean)
      : [],
  });

  // Publicera direkt — utkast-läget finns för framtida redigeringsflöde.
  await store.setListingStatus(listing.id, hostId, "published");

  redirect(`/rooms/${listing.slug}`);
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

  const stay = validateStay(checkIn, checkOut);
  if (!stay.ok) return { status: "error", error: stay.error };

  const created = await getStore().addAvailabilityBlock(listingId, hostId, {
    checkIn,
    checkOut,
    note,
  });
  if (!created) return { status: "error", error: "Could not block those dates." };
  redirect(`/host/listings/${listingId}`);
}

export async function removeBlock(formData: FormData): Promise<void> {
  const hostId = await requireHost();
  if (!hostId) return;
  const id = String(formData.get("blockId") ?? "");
  const listingId = String(formData.get("listingId") ?? "");
  await getStore().removeAvailabilityBlock(id, hostId);
  redirect(`/host/listings/${listingId}`);
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
