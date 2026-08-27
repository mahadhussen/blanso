"use client";

import { useActionState } from "react";
import { createBookingAndPay, type BookingState } from "@/app/actions";
import { SANDBOX_CARDS } from "@/lib/payments";

const initial: BookingState = { status: "idle" };

export function CheckoutForm({
  propertyId,
  checkIn,
  checkOut,
  guests,
}: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  // Vid lyckad betalning redirectar server-actionen själv till /bookings/[token];
  // klienten behöver bara visa fel och pågående-tillstånd.
  const [state, formAction, pending] = useActionState(createBookingAndPay, initial);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      <input type="hidden" name="guests" value={guests} />

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-ink">Dina uppgifter</legend>
        <Input name="guestName" label="Namn" autoComplete="name" required />
        <Input name="guestEmail" type="email" label="E-post" autoComplete="email" required />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-ink">Betalning</legend>
        <p className="rounded-lg bg-brand-tint px-3 py-2 text-sm text-brand-dark">
          Sandbox-läge. Inga riktiga pengar dras. Kort {SANDBOX_CARDS.SUCCESS_CARD} lyckas,
          {" "}
          {SANDBOX_CARDS.DECLINE_CARD} nekas.
        </p>
        <Input name="cardName" label="Kortinnehavare" defaultValue="Test Gäst" required />
        <Input
          name="cardNumber"
          label="Kortnummer"
          defaultValue={SANDBOX_CARDS.SUCCESS_CARD}
          inputMode="numeric"
          required
        />
        <div className="grid grid-cols-3 gap-3">
          <Input name="cardExpMonth" label="Månad" defaultValue="12" inputMode="numeric" required />
          <Input name="cardExpYear" label="År" defaultValue="2030" inputMode="numeric" required />
          <Input name="cardCvc" label="CVC" defaultValue="123" inputMode="numeric" required />
        </div>
      </fieldset>

      {state.status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Behandlar betalning…" : "Bekräfta och betala"}
      </button>
    </form>
  );
}

function Input({
  name,
  label,
  type = "text",
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-brand"
        {...rest}
      />
    </label>
  );
}
