"use client";

import { useActionState } from "react";
import { addBlock, type BlockState } from "@/app/actions";

// Stäng datum för hela boendet eller för en rumstyp. "Reopens" är första
// natten som är öppen igen (samma halvöppna intervall som bokningar).

const initial: BlockState = { status: "idle" };

export function AddBlockForm({
  listingId,
  roomTypes,
}: {
  listingId: string;
  roomTypes: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(addBlock, initial);

  return (
    <form action={formAction} className="b-block-form">
      <input type="hidden" name="listingId" value={listingId} />
      <label htmlFor="blk-room">
        <span className="b-field-label">Close</span>
        <select id="blk-room" name="roomTypeId" className="b-input" defaultValue="">
          <option value="">Whole property (all rooms)</option>
          {roomTypes.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </label>
      <label htmlFor="blk-from">
        <span className="b-field-label">First closed night</span>
        <input id="blk-from" type="date" name="checkIn" required className="b-input" />
      </label>
      <label htmlFor="blk-to">
        <span className="b-field-label">Reopens on</span>
        <input id="blk-to" type="date" name="checkOut" required className="b-input" />
      </label>
      <label htmlFor="blk-note">
        <span className="b-field-label">Note (optional)</span>
        <input id="blk-note" type="text" name="note" placeholder="e.g. maintenance" className="b-input" />
      </label>
      <button type="submit" disabled={pending} className="b-btn b-btn-solid">
        {pending ? "Closing…" : "Close dates"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="b-form-error" style={{ gridColumn: "1 / -1" }}>{state.error}</p>
      )}
    </form>
  );
}
