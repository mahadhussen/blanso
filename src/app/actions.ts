"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { priceForDates } from "@/lib/pricing";
import { isAvailable } from "@/lib/availability";
import { getPaymentProvider } from "@/lib/payments";
import { bookingSchema, listingSchema } from "@/lib/validation";
import { activeBookingWhere } from "@/lib/queries";
import { validateStay } from "@/lib/dates";
import { HOST_COOKIE, hostPasscode, isHostAuthed } from "@/lib/hostAuth";

// Caching-anrop får aldrig kunna vända en lyckad, betald bokning till ett fel
// mot gästen. Alla revalideringar körs därför bäst-möjligt.
function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // en caching-miss får inte dölja en genomförd betalning
  }
}

export interface BookingState {
  // Lyckad väg redirectar från servern och returnerar aldrig hit, så bara
  // idle (start) och error förekommer.
  status: "idle" | "error";
  error?: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Skapar en bokning och tar betalt via sandbox-betalmotorn. Priset räknas om på
// servern (auktoritativt) — klientens siffror litas aldrig på. Kortdata sparas
// aldrig, den skickas bara till betalleverantören för att avgöra utfallet.
export async function createBookingAndPay(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" };
  }
  const input = parsed.data;

  const property = await db.property.findUnique({ where: { id: input.propertyId } });
  if (!property) return { status: "error", error: "Boendet hittades inte." };

  if (input.guests > property.maxGuests) {
    return { status: "error", error: `Max ${property.maxGuests} gäster för detta boende.` };
  }

  // Datumen måste vara giltiga i tid: minst en natt och inte i det förflutna.
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

  // Stark, ogenomskinlig åtkomsttoken till bekräftelsesidan (skild från id).
  const accessToken = randomBytes(24).toString("hex");

  // Skapa bokningen i en transaktion med tillgänglighetskoll för att undvika
  // dubbelbokning.
  let bookingId: string;
  try {
    bookingId = await db.$transaction(async (tx) => {
      const existing = await tx.booking.findMany({
        where: activeBookingWhere(property.id),
        select: { checkIn: true, checkOut: true, status: true },
      });
      if (!isAvailable({ checkIn: input.checkIn, checkOut: input.checkOut }, existing)) {
        throw new Error("UNAVAILABLE");
      }
      const booking = await tx.booking.create({
        data: {
          propertyId: property.id,
          accessToken,
          guestName: input.guestName,
          guestEmail: input.guestEmail,
          checkIn: new Date(`${input.checkIn}T00:00:00.000Z`),
          checkOut: new Date(`${input.checkOut}T00:00:00.000Z`),
          guests: input.guests,
          nights: price.nights,
          subtotalCents: price.subtotalCents,
          cleaningFeeCents: price.cleaningFeeCents,
          serviceFeeCents: price.serviceFeeCents,
          totalCents: price.totalCents,
          currency: property.currency,
          status: "pending",
        },
      });
      return booking.id;
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAVAILABLE") {
      return { status: "error", error: "De valda datumen är tyvärr redan bokade." };
    }
    return { status: "error", error: "Kunde inte skapa bokningen. Försök igen." };
  }

  // Betalning via sandbox-leverantören. Allt som kan kasta wrappas: en pending
  // bokning får aldrig lämnas kvar och blockera datumen om betalningen fallerar.
  const provider = getPaymentProvider();
  let succeeded = false;
  try {
    const intent = await provider.createPaymentIntent({
      amountCents: price.totalCents,
      currency: property.currency,
      bookingId,
    });
    await db.payment.create({
      data: {
        bookingId,
        provider: intent.provider,
        providerRef: intent.id,
        amountCents: price.totalCents,
        currency: property.currency,
        status: "requires_confirmation",
      },
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
    // Frigör datumen: avboka bokningen och markera betalningen misslyckad om den finns.
    await db.booking.update({ where: { id: bookingId }, data: { status: "cancelled" } });
    await db.payment
      .update({ where: { bookingId }, data: { status: "failed" } })
      .catch(() => undefined);
    return {
      status: "error",
      error:
        "Betalningen nekades. Använd sandbox-kortet 4242 4242 4242 4242 för att lyckas.",
    };
  }

  await db.$transaction([
    db.payment.update({ where: { bookingId }, data: { status: "succeeded" } }),
    db.booking.update({ where: { id: bookingId }, data: { status: "confirmed" } }),
  ]);

  safeRevalidate(`/rooms/${property.slug}`);
  safeRevalidate("/host/bookings");
  // Redirecta från servern, inte från klienten: annars hinner checkout-sidan
  // rendera om (och se datumen som nyss bokade = "redan bokade") innan en
  // klient-redirect kör. redirect() kastar NEXT_REDIRECT och navigerar direkt.
  redirect(`/bookings/${accessToken}`);
}

export interface ListingState {
  status: "idle" | "error" | "success";
  error?: string;
  slug?: string;
}

export async function createListing(
  _prev: ListingState,
  formData: FormData,
): Promise<ListingState> {
  if (!(await isHostAuthed())) {
    return { status: "error", error: "Logga in som värd innan du publicerar." };
  }
  const parsed = listingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter" };
  }
  const d = parsed.data;

  const base = slugify(`${d.title}-${d.city}`) || "boende";
  let slug = base;
  let n = 1;
  while (await db.property.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }

  const images = JSON.stringify(
    Array.from({ length: 4 }, (_, i) => `https://picsum.photos/seed/${slug}-${i + 1}/1200/800`),
  );

  await db.property.create({
    data: {
      slug,
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
      rating: 0,
      reviewsCount: 0,
      images,
      amenities: "[]",
      hostName: d.hostName,
    },
  });

  safeRevalidate("/");
  safeRevalidate("/s");
  safeRevalidate("/host");
  return { status: "success", slug };
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
