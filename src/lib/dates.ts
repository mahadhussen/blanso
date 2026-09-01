// Datumhjälpare. Bokningar räknas i hela nätter (kalenderdagar), UTC-normaliserat
// så tidszon aldrig påverkar antalet nätter.

export function toUTCDate(input: Date | string): Date {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Antal nätter mellan incheckning och utcheckning. Alltid heltal, aldrig negativt.
export function nightsBetween(checkIn: Date | string, checkOut: Date | string): number {
  const a = toUTCDate(checkIn).getTime();
  const b = toUTCDate(checkOut).getTime();
  const nights = Math.round((b - a) / MS_PER_DAY);
  return nights;
}

export function isoDate(input: Date | string): string {
  return toUTCDate(input).toISOString().slice(0, 10);
}

export function addDays(input: Date | string, days: number): Date {
  const d = toUTCDate(input);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function todayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

export function isPastDate(input: Date | string): boolean {
  return toUTCDate(input).getTime() < todayUTC().getTime();
}

// Enda källan till om en vistelse är giltig i tid: minst en natt och inte i det
// förflutna. Används av bokningswidget, checkout-sida och server action.
export function validateStay(
  checkIn: string | undefined,
  checkOut: string | undefined,
): { ok: true } | { ok: false; error: string } {
  if (!checkIn || !checkOut) return { ok: false, error: "Choose check-in and check-out dates." };
  if (nightsBetween(checkIn, checkOut) < 1) {
    return { ok: false, error: "Check-out must be after check-in." };
  }
  if (isPastDate(checkIn)) {
    return { ok: false, error: "The check-in date cannot be in the past." };
  }
  return { ok: true };
}
