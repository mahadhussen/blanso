import { redirect } from "next/navigation";
import { isHostAuthed } from "@/lib/hostAuth";
import { HostLoginForm } from "@/components/HostLoginForm";

export const metadata = { title: "Host sign in" };

export default async function HostLoginPage() {
  if (await isHostAuthed()) redirect("/host");

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-line bg-background p-8 shadow-card">
        <h1 className="text-2xl font-semibold text-ink">Host sign in</h1>
        <p className="mt-1 text-sm text-muted">
          The host dashboard shows guest details and therefore requires a passcode. In the demo it is{" "}
          <span className="font-mono font-semibold text-ink">blanso</span>.
        </p>
        <div className="mt-6">
          <HostLoginForm />
        </div>
      </div>
    </div>
  );
}
