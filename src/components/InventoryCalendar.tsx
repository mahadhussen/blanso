import Link from "next/link";
import { format } from "date-fns";
import { addDays, isoDate } from "@/lib/dates";
import type { InventoryRow } from "@/lib/store/types";

// Värdens lagerkalender (extranätet): rader = rumstyper, kolumner = nätter,
// cell = lediga/totalt. Status i gråskala: fritt (papper), delvis (tvätt),
// fullbokat (svart fyllnad), stängt (streckat). Scrollar i sidled INOM sin
// ram på smala skärmar; rumsnamnet står kvar (sticky).

type Status = "free" | "partial" | "full" | "closed";

function statusOf(d: { closed: boolean; available: number; units: number }): Status {
  if (d.closed) return "closed";
  if (d.available <= 0) return "full";
  if (d.available < d.units) return "partial";
  return "free";
}

const STATUS_TEXT: Record<Status, string> = {
  free: "all free",
  partial: "partly booked",
  full: "fully booked",
  closed: "closed",
};

// Datumet som en UTC-dag (natten), oberoende av serverns tidszon.
function utcParts(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function InventoryCalendar({
  rows,
  from,
  days,
  today,
  basePath,
}: {
  rows: InventoryRow[];
  from: string;
  days: number;
  today: string;
  basePath: string;
}) {
  const dates = rows[0]?.days.map((d) => d.date) ?? [];
  const prev = isoDate(addDays(from, -7));
  const next = isoDate(addDays(from, 7));
  const last = isoDate(addDays(from, days - 1));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div className="b-label b-label-ink" style={{ letterSpacing: 1.5 }}>
          {format(utcParts(from), "d MMM")} – {format(utcParts(last), "d MMM yyyy")}
        </div>
        <nav aria-label="Calendar weeks" style={{ display: "flex", gap: 8 }}>
          <Link href={`${basePath}?from=${prev}#availability`} className="b-btn" style={{ padding: "10px 14px" }}>← Week</Link>
          <Link href={`${basePath}?from=${today}#availability`} className="b-btn" style={{ padding: "10px 14px" }}>Today</Link>
          <Link href={`${basePath}?from=${next}#availability`} className="b-btn" style={{ padding: "10px 14px" }}>Week →</Link>
        </nav>
      </div>

      {rows.length === 0 ? (
        <p style={{ marginTop: 16, color: "var(--ink-2)" }}>Add a room type to see its calendar.</p>
      ) : (
        <div className="b-cal-wrap" style={{ marginTop: 16 }} tabIndex={0} aria-label="Availability calendar, scrolls sideways">
          <table className="b-cal">
            <thead>
              <tr>
                <th className="b-cal-name" scope="col">Room type</th>
                {dates.map((d) => (
                  <th key={d} scope="col" className={d === today ? "b-cal-today" : undefined}>
                    {format(utcParts(d), "EEE")}
                    <br />
                    {format(utcParts(d), "d MMM")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.roomType.id} data-room={row.roomType.name}>
                  <th scope="row" className="b-cal-name">
                    {row.roomType.name}
                    <small>{row.roomType.units} {row.roomType.units === 1 ? "room" : "rooms"}</small>
                  </th>
                  {row.days.map((d) => {
                    const st = statusOf(d);
                    const label = `${row.roomType.name}, night of ${d.date}: ${d.available} of ${d.units} free, ${d.booked} booked, ${STATUS_TEXT[st]}`;
                    return (
                      <td
                        key={d.date}
                        className={`b-cal-cell b-cal-${st}`}
                        title={label}
                        aria-label={label}
                        data-date={d.date}
                        data-status={st}
                      >
                        {d.available}/{d.units}
                        {st === "closed" && <span>Closed</span>}
                        {st === "full" && <span>Full</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="b-cal-legend" aria-hidden>
        <span><i className="b-cal-free" />Free</span>
        <span><i className="b-cal-partial" />Partly booked</span>
        <span><i className="b-cal-full" style={{ borderColor: "var(--ink)" }} />Fully booked</span>
        <span><i className="b-cal-closed" />Closed by you</span>
        <span>Cells show free / total rooms per night</span>
      </div>
    </div>
  );
}
