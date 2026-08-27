import { redirect } from "next/navigation";
import { isHostAuthed } from "@/lib/hostAuth";
import { HostLoginForm } from "@/components/HostLoginForm";

export const metadata = { title: "Värdinloggning" };

export default async function HostLoginPage() {
  if (await isHostAuthed()) redirect("/host");

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-line bg-background p-8 shadow-card">
        <h1 className="text-2xl font-semibold text-ink">Värdinloggning</h1>
        <p className="mt-1 text-sm text-muted">
          Värdpanelen visar gästuppgifter och kräver därför en kod. I demon är koden{" "}
          <span className="font-mono font-semibold text-ink">blanso</span>.
        </p>
        <div className="mt-6">
          <HostLoginForm />
        </div>
      </div>
    </div>
  );
}
