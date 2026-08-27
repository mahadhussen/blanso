"use client";

import { useActionState } from "react";
import { loginHost, type HostLoginState } from "@/app/actions";

const initial: HostLoginState = { status: "idle" };

export function HostLoginForm() {
  const [state, formAction, pending] = useActionState(loginHost, initial);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Värdkod</span>
        <input
          name="passcode"
          type="password"
          autoComplete="off"
          className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-brand"
          placeholder="Ange värdkod"
          required
        />
      </label>
      {state.status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Loggar in…" : "Logga in"}
      </button>
    </form>
  );
}
