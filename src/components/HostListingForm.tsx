"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createListing, type ListingState } from "@/app/actions";

const initial: ListingState = { status: "idle" };

export function HostListingForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createListing, initial);

  useEffect(() => {
    if (state.status === "success" && state.slug) {
      router.push(`/rooms/${state.slug}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      <Field name="title" label="Titel" placeholder="Ljus lägenhet nära stranden" required />
      <div className="grid grid-cols-2 gap-4">
        <Field name="city" label="Stad" placeholder="Mogadishu" required />
        <Field name="country" label="Land" placeholder="Somalia" required />
      </div>
      <Field
        name="description"
        label="Beskrivning"
        placeholder="Beskriv boendet, läget och vad som gör det speciellt."
        textarea
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Field name="nightlyPrice" label="Pris per natt (USD)" type="number" defaultValue="75" required />
        <Field name="cleaningFee" label="Städavgift (USD)" type="number" defaultValue="20" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Field name="maxGuests" label="Gäster" type="number" defaultValue="4" required />
        <Field name="bedrooms" label="Sovrum" type="number" defaultValue="2" required />
        <Field name="beds" label="Sängar" type="number" defaultValue="2" required />
        <Field name="baths" label="Badrum" type="number" defaultValue="1" required />
      </div>
      <Field name="hostName" label="Värdens namn" placeholder="Amina" required />

      {state.status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Publicerar…" : "Publicera boendet"}
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
