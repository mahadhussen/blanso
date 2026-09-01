"use client";

import { useActionState } from "react";
import { addBlock, type BlockState } from "@/app/actions";

const initial: BlockState = { status: "idle" };

export function AddBlockForm({ listingId }: { listingId: string }) {
  const [state, formAction, pending] = useActionState(addBlock, initial);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="listingId" value={listingId} />
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
          Från
        </span>
        <input
          type="date"
          name="checkIn"
          required
          className="rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
          Till
        </span>
        <input
          type="date"
          name="checkOut"
          required
          className="rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </label>
      <label className="block min-w-40 flex-1">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
          Note (optional)
        </span>
        <input
          type="text"
          name="note"
          placeholder="e.g. maintenance"
          className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Blocking…" : "Block"}
      </button>
      {state.status === "error" && (
        <p className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
    </form>
  );
}
