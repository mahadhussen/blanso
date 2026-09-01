"use client";

import { useActionState } from "react";
import { createListing, type ListingActionState } from "@/app/actions";

const initial: ListingActionState = { status: "idle" };

export function HostListingForm() {
  // Lyckad väg redirectar från servern till boendesidan.
  const [state, formAction, pending] = useActionState(createListing, initial);

  return (
    <form action={formAction} className="space-y-5">
      <Field name="title" label="Title" placeholder="Bright apartment near the beach" required />
      <div className="grid grid-cols-2 gap-4">
        <Field name="city" label="City" placeholder="Mogadishu" required />
        <Field name="country" label="Country" placeholder="Somalia" required />
      </div>
      <Field
        name="description"
        label="Description"
        placeholder="Describe the stay, the location and what makes it special."
        textarea
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Field name="nightlyPrice" label="Price per night (USD)" type="number" defaultValue="75" required />
        <Field name="cleaningFee" label="Cleaning fee (USD)" type="number" defaultValue="20" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Field name="maxGuests" label="Guests" type="number" defaultValue="4" required />
        <Field name="bedrooms" label="Bedrooms" type="number" defaultValue="2" required />
        <Field name="beds" label="Beds" type="number" defaultValue="2" required />
        <Field name="baths" label="Bathrooms" type="number" defaultValue="1" required />
      </div>
      <Field
        name="amenities"
        label="Amenities (comma-separated)"
        placeholder="Wi-Fi, Kitchen, Parking"
      />

      {state.status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Publishing…" : "Publish the room"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  textarea = false,
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
  textarea?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement>) {
  const cls =
    "w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-brand";
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {textarea ? (
        <textarea name={name} rows={4} className={cls} {...rest} />
      ) : (
        <input name={name} type={type} className={cls} {...rest} />
      )}
    </label>
  );
}
