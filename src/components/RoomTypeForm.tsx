"use client";

import { useActionState, useState } from "react";
import { deleteRoomTypeAction, saveRoomType, type RoomTypeState } from "@/app/actions";
import type { RoomType } from "@/lib/domain";

// Extranätets rumstypsformulär — lägg till eller redigera en rumstyp.
// Pris anges i dollar och blir heltal cent på servern (validation.ts).

const initial: RoomTypeState = { status: "idle" };

export function RoomTypeForm({ listingId, roomType }: { listingId: string; roomType?: RoomType }) {
  const [state, formAction, pending] = useActionState(saveRoomType, initial);
  const editing = Boolean(roomType);
  const idp = roomType ? `rt-${roomType.id}` : "rt-new";

  return (
    <form action={formAction} encType="multipart/form-data" className="b-rt-form">
      <input type="hidden" name="listingId" value={listingId} />
      {roomType && <input type="hidden" name="roomTypeId" value={roomType.id} />}

      <Field id={`${idp}-name`} name="name" label="Room type name" wide defaultValue={roomType?.name} placeholder="Deluxe Double Room" required />
      <Field id={`${idp}-size`} name="sizeSqm" label="Size (m²)" type="number" min={5} defaultValue={roomType?.sizeSqm ?? undefined} placeholder="24" required />
      <Field id={`${idp}-beds`} name="bedConfig" label="Beds" defaultValue={roomType?.bedConfig} placeholder="1 king bed" required />
      <Field id={`${idp}-guests`} name="maxGuests" label="Max guests per room" type="number" min={1} defaultValue={roomType?.maxGuests ?? 2} required />
      <Field id={`${idp}-units`} name="units" label="Number of rooms" type="number" min={1} defaultValue={roomType?.units ?? 1} required />
      <Field
        id={`${idp}-price`}
        name="nightlyPrice"
        label="Price per night (USD)"
        type="number"
        min={1}
        step="0.01"
        defaultValue={roomType ? roomType.nightlyPriceCents / 100 : undefined}
        placeholder="95"
        required
      />
      <label className="b-rt-wide" htmlFor={`${idp}-photos`}>
        <span className="b-field-label">Room photos (optional)</span>
        <input id={`${idp}-photos`} name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="b-input" />
        <span style={{ display: "block", fontSize: 14, color: "var(--muted)", marginTop: 6 }}>
          {editing && roomType!.images.length > 0
            ? `${roomType!.images.length} photo${roomType!.images.length === 1 ? "" : "s"} now. New photos replace them.`
            : "Without photos we show the property's photos."}
        </span>
      </label>

      {state.status === "error" && (
        <p role="alert" className="b-rt-wide b-form-error">{state.error}</p>
      )}
      <div className="b-rt-wide">
        <button type="submit" disabled={pending} className="b-btn b-btn-solid">
          {pending ? "Saving…" : editing ? "Save changes" : "Add room type"}
        </button>
      </div>
    </form>
  );
}

// Två steg: ett felklick får aldrig ta bort en rumstyp från gästsidan.
export function DeleteRoomTypeButton({ listingId, roomTypeId, name }: { listingId: string; roomTypeId: string; name: string }) {
  const [state, formAction, pending] = useActionState(deleteRoomTypeAction, initial);
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="b-btn" style={{ padding: "10px 16px" }} aria-label={`Remove ${name}`}>
        Remove
      </button>
    );
  }
  return (
    <form action={formAction} style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="roomTypeId" value={roomTypeId} />
      <span style={{ fontSize: 14, color: "var(--ink-2)" }}>Remove {name}? Guests can no longer book it.</span>
      <button type="submit" disabled={pending} className="b-btn b-btn-solid" style={{ padding: "10px 16px" }}>
        {pending ? "Removing…" : "Yes, remove"}
      </button>
      <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="b-btn" style={{ padding: "10px 16px" }}>
        Cancel
      </button>
      {state.status === "error" && (
        <p role="alert" className="b-form-error" style={{ marginTop: 10 }}>{state.error}</p>
      )}
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  wide = false,
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  wide?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={id} className={wide ? "b-rt-wide" : undefined}>
      <span className="b-field-label">{label}</span>
      <input id={id} name={name} type={type} className="b-input" {...rest} />
    </label>
  );
}
