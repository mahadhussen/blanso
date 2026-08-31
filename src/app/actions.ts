"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { priceForDates } from "@/lib/pricing";
import { isAvailable } from "@/lib/availability";
import { getPaymentProvider } from "@/lib/payments";
import { bookingSchema } from "@/lib/validation";
import { getPropertyById, getBookedRanges } from "@/lib/queries";
import { validateStay } from "@/lib/dates";
import { HOST_COOKIE, hostPasscode } from "@/lib/hostAuth";

export interface BookingState {
  // Lyckad väg redirectar från servern och returnerar aldrig hit, så bara
  // idle (start) och error förekommer.
  status: "idle" | "error";
  error?: string;
}

// Skapar en bokning och tar betalt via sandbox-betalmotorn. Demoläge: bokningen
// sparas inte i någon databas — priset räknas om på servern (aldrig från
// klienten) och gästen skickas till en bekräftelse byggd ur boende + datum.
// Kortdata sparas aldrig, den skickas bara till betalleverantören.
export async function createBookingAndPay(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" };
  }
  const input = parsed.data;

  const property = await getPropertyById(input.propertyId);
  if (!property) return { status: "error", error: "Boendet hittades inte." };

  if (input.guests > property.maxGuests) {
    return { status: "error", error: `Max ${property.maxGuests} gäster för detta boende.` };
  }

  const stay = validateStay(input.checkIn, input.checkOut);
  if (!stay.ok) return { status: "error", error: stay.error };

  // Auktoritativt pris ur den deterministiska motorn.
  let price;
  try {
    price = priceForDates({
      nightlyPriceCents: property.nightlyPriceCents,
      cleaningFeeCents: property.cleaningFeeCents,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
    });
  } catch {
    return { status: "error", error: "Ogiltiga datum. Välj minst en natt." };
  }

  const booked = await getBookedRanges(property.id);
  if (!isAvailable({ checkIn: input.checkIn, checkOut: input.checkOut }, booked)) {
    return { status: "error", error: "De valda datumen är tyvärr redan bokade." };
  }

  // Betalning via sandbox-leverantören.
  const provider = getPaymentProvider();
  let succeeded = false;
  try {
    const intent = await provider.createPaymentIntent({
      amountCents: price.totalCents,
      currency: property.currency,
      bookingId: property.id,
    });
    const confirmation = await provider.confirmPaymentIntent({
      intentId: intent.id,
      amountCents: price.totalCents,
      currency: property.currency,
      card: {
        number: input.cardNumber,
        expMonth: input.cardExpMonth,
        expYear: input.cardExpYear,
        cvc: input.cardCvc,
        name: input.cardName,
      },
    });
    succeeded = confirmation.status === "succeeded";
  } catch {
    succeeded = false;
  }

  if (!succeeded) {
    return {
      status: "error",
      error: "Betalningen nekades. Använd sandbox-kortet 4242 4242 4242 4242 för att lyckas.",
    };
  }

  // Bekräftelsen byggs ur boende + datum (inga personuppgifter i URL:en).
  const params = new URLSearchParams({
    slug: property.slug,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: String(input.guests),
  });
  redirect(`/bookings/confirm?${params.toString()}`);
}

export interface ListingState {
  status: "idle" | "error" | "success";
  error?: string;
  slug?: string;
}

// Demoläge: nya boenden kan inte sparas utan databas. Signaturen tar inga
// argument — en funktion med färre parametrar är kompatibel med useActionState.
export async function createListing(): Promise<ListingState> {
  return {
    status: "error",
    error:
      "Demon sparar inte nya boenden (kör utan databas). Den fullständiga versionen med databas gör det.",
  };
}

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

export async function logoutHost() {
  const store = await cookies();
  store.delete(HOST_COOKIE);
  redirect("/host/login");
}
