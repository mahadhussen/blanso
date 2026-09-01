import { formatMoney } from "@/lib/money";
import type { PriceBreakdown as Breakdown } from "@/lib/pricing";
import { SERVICE_FEE_RATE } from "@/lib/pricing";

// Prisuppställning enligt facit: rader i löptext, svart topplinje före totalen.
export function PriceBreakdown({
  breakdown,
  currency = "USD",
}: {
  breakdown: Breakdown;
  currency?: string;
}) {
  return (
    <dl className="space-y-2" style={{ fontSize: "var(--text-body)" }}>
      <Row
        label={`${formatMoney(breakdown.nightlyPriceCents, currency)} × ${breakdown.nights} ${
          breakdown.nights === 1 ? "natt" : "nätter"
        }`}
        value={formatMoney(breakdown.subtotalCents, currency)}
      />
      {breakdown.cleaningFeeCents > 0 && (
        <Row label="Städavgift" value={formatMoney(breakdown.cleaningFeeCents, currency)} />
      )}
      <Row
        label={`Serviceavgift ${Math.round(SERVICE_FEE_RATE * 100)} %`}
        value={formatMoney(breakdown.serviceFeeCents, currency)}
      />
      <div
        className="mt-3 flex items-baseline justify-between pt-3"
        style={{ borderTop: "1px solid var(--ink)" }}
      >
        <dt className="b-label b-label-ink">Totalt</dt>
        <dd style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500 }}>
          {formatMoney(breakdown.totalCents, currency)}
        </dd>
      </div>
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted">
      <dt>{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
