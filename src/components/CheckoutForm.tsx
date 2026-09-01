"use client";

import { useActionState, useState } from "react";
import { createBookingAndPay, type BookingState } from "@/app/actions";
import { SANDBOX_CARDS } from "@/lib/payments";

const initial: BookingState = { status: "idle" };

type Method = "card" | "mobile" | "arrival";

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
  // Lyckad väg redirectar från servern till /bookings/[token].
  const [state, formAction, pending] = useActionState(createBookingAndPay, initial);
  const [method, setMethod] = useState<Method>("card");

  return (
    <form action={formAction} className="space-y-12">
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      <input type="hidden" name="guests" value={guests} />

      {/* 1 · Din vistelse */}
      <Section num="1" title="Din vistelse">
        <div className="grid grid-cols-3" style={{ border: "1px solid var(--hairline)" }}>
          <ReadOnly label="Incheckning" value={checkIn} />
          <ReadOnly label="Utcheckning" value={checkOut} borderX />
          <ReadOnly label="Gäster" value={String(guests)} />
        </div>
      </Section>

      {/* 2 · Gästuppgifter */}
      <Section num="2" title="Gästuppgifter">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input name="guestName" label="Fullständigt namn" autoComplete="name" required />
          <Input name="guestEmail" type="email" label="E-post" autoComplete="email" required />
        </div>
      </Section>

      {/* 3 · Betalning */}
      <Section num="3" title="Betalning">
        <div className="space-y-3">
          <MethodRow
            checked={method === "card"}
            onSelect={() => setMethod("card")}
            title="Kort"
            note="Sandbox — inga riktiga pengar dras"
          />
          <MethodRow
            checked={method === "mobile"}
            onSelect={() => setMethod("mobile")}
            title="EVC Plus · Zaad"
            note="Kommer snart"
            disabled
          />
          <MethodRow
            checked={method === "arrival"}
            onSelect={() => setMethod("arrival")}
            title="Betala på plats"
            note="Kommer snart"
            disabled
          />
        </div>

        {method === "card" && (
          <div className="mt-6 space-y-5">
            <p className="b-label">
              Testkort: {SANDBOX_CARDS.SUCCESS_CARD} lyckas · {SANDBOX_CARDS.DECLINE_CARD} nekas
            </p>
            <Input name="cardName" label="Kortinnehavare" defaultValue="Test Gäst" required />
            <Input
              name="cardNumber"
              label="Kortnummer"
              defaultValue={SANDBOX_CARDS.SUCCESS_CARD}
              inputMode="numeric"
              required
            />
            <div className="grid grid-cols-3 gap-4">
              <Input name="cardExpMonth" label="Månad" defaultValue="12" inputMode="numeric" required />
              <Input name="cardExpYear" label="År" defaultValue="2030" inputMode="numeric" required />
              <Input name="cardCvc" label="CVC" defaultValue="123" inputMode="numeric" required />
            </div>
          </div>
        )}
      </Section>

      {state.status === "error" && (
        <p
          role="alert"
          style={{ fontSize: 15, borderLeft: "2px solid var(--ink)", paddingLeft: 12 }}
        >
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="b-btn b-btn-solid b-btn-block">
        {pending ? "Behandlar betalning…" : "Bekräfta och betala"}
      </button>
    </form>
  );
}

function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
      <legend className="flex items-baseline gap-4" style={{ padding: 0, marginBottom: 20 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500 }}>
          {num}
        </span>
        <span className="b-h3">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function ReadOnly({ label, value, borderX = false }: { label: string; value: string; borderX?: boolean }) {
  return (
    <div
      className="p-3"
      style={borderX ? { borderLeft: "1px solid var(--hairline)", borderRight: "1px solid var(--hairline)" } : undefined}
    >
      <span className="b-field-label">{label}</span>
      <span style={{ fontSize: 15 }}>{value}</span>
    </div>
  );
}

function MethodRow({
  checked,
  onSelect,
  title,
  note,
  disabled = false,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  note: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={checked}
      className="flex w-full items-center justify-between px-5 py-4 text-left"
      style={{
        border: checked ? "1px solid var(--ink)" : "1px solid var(--hairline)",
        background: "var(--paper)",
        color: disabled ? "var(--faint)" : "var(--ink)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "border-color var(--dur) var(--ease)",
      }}
    >
      <span style={{ fontSize: "var(--text-body)" }}>{title}</span>
      <span className="b-label">{note}</span>
    </button>
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
      <span className="b-field-label">{label}</span>
      <input name={name} type={type} className="b-input" {...rest} />
    </label>
  );
}
