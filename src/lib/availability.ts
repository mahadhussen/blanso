// Tillgänglighet. En förfrågad vistelse [checkIn, checkOut) krockar med en
// befintlig bokning om intervallen överlappar. Avbokade bokningar ignoreras.
// Utcheckningsdagen är ledig igen (halvöppet intervall), så rygg-i-rygg går.

import { toUTCDate } from "./dates";

export interface DateRange {
  checkIn: Date | string;
  checkOut: Date | string;
  status?: string;
}

export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  const aStart = toUTCDate(a.checkIn).getTime();
  const aEnd = toUTCDate(a.checkOut).getTime();
  const bStart = toUTCDate(b.checkIn).getTime();
  const bEnd = toUTCDate(b.checkOut).getTime();
  return aStart < bEnd && bStart < aEnd;
}

// Är den förfrågade vistelsen ledig givet befintliga bokningar?
export function isAvailable(
  requested: DateRange,
  existing: DateRange[],
): boolean {
  const reqStart = toUTCDate(requested.checkIn).getTime();
  const reqEnd = toUTCDate(requested.checkOut).getTime();
  if (reqEnd <= reqStart) return false; // minst en natt krävs

  return !existing.some(
    (b) => b.status !== "cancelled" && rangesOverlap(requested, b),
  );
}
