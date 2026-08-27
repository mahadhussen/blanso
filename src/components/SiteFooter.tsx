import { BlansoLogo } from "./BlansoLogo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-panel">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-brand">
            <BlansoLogo />
            <p className="mt-2 max-w-sm text-sm text-muted">
              Boende i hela Östafrika. Byggd för regionen som saknade sin egen
              bokningsplattform.
            </p>
          </div>
          <div className="text-sm text-muted">
            <p>Mogadishu · Hargeisa · Nairobi · Addis Abeba · Zanzibar</p>
            <p className="mt-1">© {new Date().getFullYear()} Blanso. Demo — sandbox-betalning.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
