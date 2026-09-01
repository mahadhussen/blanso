"use client";

import { useActionState, useState } from "react";
import { createBookingAndPay, type BookingState } from "@/app/actions";

// Bokningsformuläret — 1:1 från "Balaanso Booking.dc.html". Kort är funktionellt
// (sandbox); EVC Plus/Zaad och Pay on arrival visas som i prototypen men är
// ärligt märkta "coming soon" — inga fejkade pengaflöden.

const initial: BookingState = { status: "idle" };

const label9: React.CSSProperties = { fontSize: 9, letterSpacing: "var(--ls-label-tight)" };
const inputS: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  border: "1px solid var(--hairline)",
  padding: "12px 14px",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-body)",
  background: "var(--paper)",
  color: "var(--ink)",
};

type Method = "card" | "mobile" | "arrival";

export function CheckoutForm({
  propertyId,
  checkIn,
  checkOut,
  guests,
  title,
}: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  title: string;
}) {
  const [state, formAction, pending] = useActionState(createBookingAndPay, initial);
  const [method, setMethod] = useState<Method>("card");

  const radioRow = (m: Method, text: string, note?: string) => (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: method === m ? "1px solid var(--ink)" : "1px solid var(--hairline)",
        padding: "var(--s-3) var(--s-4)",
        cursor: note ? "not-allowed" : "pointer",
        fontSize: "var(--text-body)",
        color: note ? "var(--faint)" : "var(--ink)",
      }}
    >
      <input
        type="radio"
        name="pay"
        checked={method === m}
        disabled={Boolean(note)}
        onChange={() => setMethod(m)}
        style={{ accentColor: "#000" }}
      />
      {text}
      {note && <span className="b-label" style={{ marginLeft: "auto" }}>{note}</span>}
    </label>
  );

  return (
    <form id="booking-form" action={formAction} style={{ display: "flex", flexDirection: "column", gap: "var(--s-6)" }}>
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="checkIn" value={checkIn} />
      <input type="hidden" name="checkOut" value={checkOut} />
      <input type="hidden" name="guests" value={guests} />

      <div>
        <div className="b-label b-label-ink">1 · Your stay</div>
        <div style={{ marginTop: "var(--s-3)", border: "1px solid var(--hairline)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div style={{ padding: "var(--s-3) var(--s-4)", borderRight: "1px solid var(--hairline)" }}>
              <div className="b-label" style={label9}>Check-in</div>
              <div style={{ fontSize: "var(--text-body)", marginTop: 4 }}>{checkIn}</div>
            </div>
            <div style={{ padding: "var(--s-3) var(--s-4)", borderRight: "1px solid var(--hairline)" }}>
              <div className="b-label" style={label9}>Check-out</div>
              <div style={{ fontSize: "var(--text-body)", marginTop: 4 }}>{checkOut}</div>
            </div>
            <div style={{ padding: "var(--s-3) var(--s-4)" }}>
              <div className="b-label" style={label9}>Room</div>
              <div style={{ fontSize: "var(--text-body)", marginTop: 4 }}>
                {title} · {guests} {guests === 1 ? "adult" : "adults"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="b-label b-label-ink">2 · Guest details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--s-3)", marginTop: "var(--s-3)" }}>
          <label style={{ display: "block" }}>
            <span className="b-label" style={label9}>First name</span>
            <input type="text" name="guestFirstName" placeholder="Amina" required style={inputS} />
          </label>
          <label style={{ display: "block" }}>
            <span className="b-label" style={label9}>Last name</span>
            <input type="text" name="guestLastName" placeholder="Hassan" required style={inputS} />
          </label>
          <label style={{ display: "block" }}>
            <span className="b-label" style={label9}>Email</span>
            <input type="email" name="guestEmail" placeholder="amina@example.com" required style={inputS} />
          </label>
          <label style={{ display: "block" }}>
            <span className="b-label" style={label9}>Phone</span>
            <input type="tel" name="guestPhone" placeholder="+252 61 234 5678" style={inputS} />
          </label>
        </div>
        <label style={{ display: "block", marginTop: "var(--s-3)" }}>
          <span className="b-label" style={label9}>Message to your host (optional)</span>
          <textarea
            name="guestMessage"
            rows={3}
            placeholder="We land at 14:30 and would like a transfer."
            style={{ ...inputS, resize: "vertical" }}
          />
        </label>
      </div>

      <div>
        <div className="b-label b-label-ink">3 · Payment</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)", marginTop: "var(--s-3)" }}>
          {radioRow("card", "Card — Visa / Mastercard")}
          {radioRow("mobile", "EVC Plus / Zaad", "Coming soon")}
          {radioRow("arrival", "Pay on arrival", "Coming soon")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "var(--s-3)", marginTop: "var(--s-3)" }}>
          <label style={{ display: "block" }}>
            <span className="b-label" style={label9}>Card number</span>
            <input type="text" name="cardNumber" defaultValue="4242 4242 4242 4242" inputMode="numeric" required style={inputS} />
          </label>
          <label style={{ display: "block" }}>
            <span className="b-label" style={label9}>Month</span>
            <input type="text" name="cardExpMonth" defaultValue="12" inputMode="numeric" required style={inputS} />
          </label>
          <label style={{ display: "block" }}>
            <span className="b-label" style={label9}>Year</span>
            <input type="text" name="cardExpYear" defaultValue="2030" inputMode="numeric" required style={inputS} />
          </label>
          <label style={{ display: "block" }}>
            <span className="b-label" style={label9}>CVC</span>
            <input type="text" name="cardCvc" defaultValue="123" inputMode="numeric" required style={inputS} />
          </label>
        </div>
        <input type="hidden" name="cardName" value="Sandbox Guest" />
        <div style={{ fontSize: "var(--text-body)", color: "var(--muted)", marginTop: "var(--s-2)" }}>
          Demo — sandbox payment, no real money is charged. Card 4242 4242 4242 4242 succeeds, 4000 0000 0000 0002 declines.
        </div>
      </div>

      {state.status === "error" && (
        <div role="alert" style={{ fontSize: 15, borderLeft: "2px solid var(--ink)", paddingLeft: 12 }}>
          {state.error}
        </div>
      )}
      {pending && (
        <div className="b-label" aria-live="polite">Processing payment…</div>
      )}
    </form>
  );
}
