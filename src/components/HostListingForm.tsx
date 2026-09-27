"use client";

import { useActionState } from "react";
import { createListing, type ListingActionState } from "@/app/actions";

// Nytt boende: själva boendet + dess första rumstyp (booking.com-extranätets
// ordning). Fler rumstyper läggs till i extranätet dit värden skickas efteråt.

const initial: ListingActionState = { status: "idle" };

export function HostListingForm() {
  const [state, formAction, pending] = useActionState(createListing, initial);

  return (
    <form action={formAction} encType="multipart/form-data" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Field name="title" label="Property name" placeholder="Harbour View Hotel" required />
      <div className="b-form-2">
        <Field name="city" label="City" placeholder="Mogadishu" required />
        <Field name="country" label="Country" placeholder="Somalia" required />
      </div>
      <label>
        <span className="b-field-label">Description</span>
        <textarea
          name="description"
          rows={4}
          required
          className="b-input"
          placeholder="Describe the property, the location and what makes it special."
        />
      </label>
      <div className="b-form-2">
        <Field name="cleaningFee" label="Cleaning fee per room (USD)" type="number" min={0} defaultValue="0" />
        <Field name="amenities" label="Amenities (comma-separated)" placeholder="Wi-Fi, Breakfast, Parking" />
      </div>
      <label>
        <span className="b-field-label">Property photos</span>
        <input name="photos" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="b-input" />
        <span style={{ display: "block", fontSize: 14, color: "var(--muted)", marginTop: 6 }}>
          Up to 8 photos, JPG/PNG/WebP, max 5 MB each. Leave empty and we add placeholder photos for now.
        </span>
      </label>

      <fieldset style={{ border: "1px solid var(--hairline)", padding: 16, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        <legend className="b-label b-label-ink" style={{ padding: "0 6px" }}>Your first room type</legend>
        <Field name="roomName" label="Room type name" placeholder="Deluxe Double Room" required />
        <div className="b-form-2">
          <Field name="roomSizeSqm" label="Size (m²)" type="number" min={5} placeholder="24" required />
          <Field name="roomBedConfig" label="Beds" placeholder="1 king bed" required />
        </div>
        <div className="b-form-3">
          <Field name="roomMaxGuests" label="Guests / room" type="number" min={1} defaultValue="2" required />
          <Field name="roomUnits" label="Number of rooms" type="number" min={1} defaultValue="1" required />
          <Field name="roomNightlyPrice" label="Price / night (USD)" type="number" min={1} step="0.01" placeholder="95" required />
        </div>
      </fieldset>

      {state.status === "error" && (
        <p role="alert" className="b-form-error">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="b-btn b-btn-solid b-btn-block">
        {pending ? "Publishing…" : "Publish the property"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span className="b-field-label">{label}</span>
      <input name={name} type={type} className="b-input" {...rest} />
    </label>
  );
}
