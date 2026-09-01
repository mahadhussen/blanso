"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { priceForDates } from "@/lib/pricing";
import { getPaymentProvider } from "@/lib/payments";
import { bookingSchema, listingSchema } from "@/lib/validation";
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
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" };
  }
  const input = parsed.data;
  const store = getStore();

  const listing = await store.getListingById(input.propertyId);
  if (!listing || listing.status !== "published") {
    return { status: "error", error: "Boendet hittades inte." };
  }
  if (input.guests > listing.maxGuests) {
    return { status: "error", error: `Max ${listing.maxGuests} gäster för detta boende.` };
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
    return { status: "error", error: "Ogiltiga datum. Välj minst en natt." };
  }

  // Betalning FÖRE skrivning: ingen bokning utan lyckad betalning.
  const provider = getPaymentProvider();
  let paymentRef = "";
  try {
    const intent = await provider.createPaymentIntent({
      amountCents: price.totalCents,
      currency: listing.currency,
      bookingId: listing.id,
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
      error: "Betalningen nekades. Använd sandbox-kortet 4242 4242 4242 4242 för att lyckas.",
    };
  }

  const result = await store.createBooking({
    listingId: listing.id,
    guestName: input.guestName,
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
    return {
      status: "error",
      error:
        result.error === "UNAVAILABLE"
          ? "De valda datumen är tyvärr redan bokade."
          : "Kunde inte skapa bokningen. Försök igen.",
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
  if (!hostId) return { status: "error", error: "Logga in som värd innan du publicerar." };

  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" };
  }
  const d = parsed.data;
  const store = getStore();
  const host = await store.getHostById(hostId);

  const listing = await store.createListing(hostId, {
    hostId,
    hostName: host?.name ?? "Värd",
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
    images: [],
    amenities: d.amenities
      ? d.amenities.split(",").map((a) => a.trim()).filter(Boolean)
      : [],
  });

  // Deterministiska platshållarbilder tills värden laddar upp egna.
  await store.updateListing(listing.id, hostId, {
    images: Array.from(
      { length: 4 },
      (_, i) => `https://picsum.photos/seed/blanso-${listing.slug}-${i + 1}/1200/800`,
    ),
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
  if (!hostId) return { status: "error", error: "Logga in som värd." };
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
  if (!created) return { status: "error", error: "Kunde inte blockera datumen." };
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
  await getStore().cancelBooking(id, hostId);
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
    return { status: "error", error: "Fel kod. Prova igen." };
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
