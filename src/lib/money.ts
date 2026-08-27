// Pengar är alltid heltal i minsta enhet (cent). En kanonisk enhet internt,
// formatera först vid visning. Determinism i pengar.

export function formatMoney(cents: number, currency = "USD", locale = "en-US"): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`formatMoney kräver heltal cent, fick ${cents}`);
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// Kompakt form för listkort: döljer decimaler bara när beloppet faktiskt är
// jämnt. Ett ojämnt pris (t.ex. 7999) visas som 79,99 så kortets pris ALDRIG
// avviker från vad checkout tar betalt via formatMoney.
export function formatPriceShort(cents: number, currency = "USD", locale = "en-US"): string {
  if (!Number.isInteger(cents)) {
    throw new Error(`formatPriceShort kräver heltal cent, fick ${cents}`);
  }
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}
