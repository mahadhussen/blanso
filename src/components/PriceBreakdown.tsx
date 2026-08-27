import { formatMoney } from "@/lib/money";
import type { PriceBreakdown as Breakdown } from "@/lib/pricing";

export function PriceBreakdown({
  breakdown,
  currency = "USD",
}: {
  breakdown: Breakdown;
  currency?: string;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <Row
        label={`${formatMoney(breakdown.nightlyPriceCents, currency)} × ${breakdown.nights} ${
          breakdown.nights === 1 ? "natt" : "nätter"
        }`}
        value={formatMoney(breakdown.subtotalCents, currency)}
      />
      {breakdown.cleaningFeeCents > 0 && (
        <Row label="Städavgift" value={formatMoney(breakdown.cleaningFeeCents, currency)} />
      )}
      <Row label="Blanso serviceavgift" value={formatMoney(breakdown.serviceFeeCents, currency)} />
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-base font-semibold text-ink">
        <dt>Totalt</dt>
        <dd>{formatMoney(breakdown.totalCents, currency)}</dd>
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
