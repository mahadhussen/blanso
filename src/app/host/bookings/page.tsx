import Link from "next/link";
import { redirect } from "next/navigation";
import { isHostAuthed } from "@/lib/hostAuth";

export const metadata = { title: "Bokningar" };

export default async function HostBookingsPage() {
  if (!(await isHostAuthed())) redirect("/host/login");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Bokningar</h1>
        <Link href="/host" className="text-sm font-semibold text-brand hover:text-brand-dark">
          ← Till värdpanelen
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-panel p-8 text-center">
        <p className="text-lg font-semibold text-ink">Den här versionen sparar inga bokningar</p>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Blanso körs som en delbar demo utan databas — gäster kan söka, boka och se en
          bekräftelse, men inget lagras. Den fullständiga versionen (med databas) visar alla
          bokningar och intäkter här.
        </p>
        <Link
          href="/s"
          className="mt-6 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Testa bokningsflödet
        </Link>
      </div>
    </div>
  );
}
