// Betalmotor. Stripe-formad men körs som en lokal sandbox: inga riktiga pengar
// rör sig, inga externa nycklar krävs. Gränssnittet är avsiktligt Stripe-likt så
// en riktig Stripe-testintegration kan slå in bakom samma interface senare
// (env STRIPE_SECRET_KEY) utan att flödet ändras.

import { randomUUID } from "crypto";

export type PaymentStatus = "requires_confirmation" | "succeeded" | "failed";

export interface PaymentIntent {
  id: string;
  provider: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  clientSecret: string;
}

export interface CardInput {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  name: string;
}

export interface PaymentProvider {
  name: string;
  createPaymentIntent(params: {
    amountCents: number;
    currency: string;
    bookingId: string;
  }): Promise<PaymentIntent>;
  confirmPaymentIntent(params: {
    intentId: string;
    amountCents: number;
    currency: string;
    card: CardInput;
  }): Promise<PaymentIntent>;
  // Återkallar/återbetalar en genomförd eller påbörjad betalning. MÅSTE anropas
  // när en betalning lyckats men bokningen inte kunde slutföras — en gäst får
  // aldrig stå med dragna pengar utan bokning. Mappas till refund i Stripe.
  voidPaymentIntent(params: { intentId: string }): Promise<{ ok: boolean }>;
}

// Testkort som speglar Stripes sandbox: 4242… lyckas, 4000000000000002 nekas.
const SUCCESS_CARD = "4242424242424242";
const DECLINE_CARD = "4000000000000002";

function normalizeCard(num: string): string {
  return num.replace(/\s+/g, "");
}

export function isValidCardNumber(num: string): boolean {
  const n = normalizeCard(num);
  return /^\d{13,19}$/.test(n);
}

// Ren, deterministisk regel för sandboxutfallet — testbar utan sidoeffekter.
export function decideSandboxOutcome(card: CardInput): PaymentStatus {
  const n = normalizeCard(card.number);
  if (n === DECLINE_CARD) return "failed";
  if (!isValidCardNumber(n)) return "failed";
  if (!/^\d{3,4}$/.test(card.cvc)) return "failed";
  const now = new Date();
  const exp = new Date(card.expYear, card.expMonth, 0, 23, 59, 59);
  if (exp.getTime() < now.getTime()) return "failed";
  return "succeeded";
}

class MockProvider implements PaymentProvider {
  name = "mock";

  async createPaymentIntent(params: {
    amountCents: number;
    currency: string;
    bookingId: string;
  }): Promise<PaymentIntent> {
    const id = `mock_pi_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
    return {
      id,
      provider: this.name,
      amountCents: params.amountCents,
      currency: params.currency,
      status: "requires_confirmation",
      clientSecret: `${id}_secret_${randomUUID().slice(0, 8)}`,
    };
  }

  async confirmPaymentIntent(params: {
    intentId: string;
    amountCents: number;
    currency: string;
    card: CardInput;
  }): Promise<PaymentIntent> {
    const status = decideSandboxOutcome(params.card);
    return {
      id: params.intentId,
      provider: this.name,
      amountCents: params.amountCents,
      currency: params.currency,
      status,
      clientSecret: `${params.intentId}_secret`,
    };
  }

  async voidPaymentIntent(params: { intentId: string }): Promise<{ ok: boolean }> {
    // Sandbox: inga riktiga pengar rör sig, återkallning lyckas alltid för en
    // känd intent. Stripe-implementationen gör en riktig refund här.
    return { ok: params.intentId.length > 0 };
  }
}

let provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  // Krok för framtida riktig Stripe-testintegration:
  // if (process.env.STRIPE_SECRET_KEY) return new StripeProvider(...)
  if (!provider) provider = new MockProvider();
  return provider;
}

export const SANDBOX_CARDS = { SUCCESS_CARD, DECLINE_CARD };
