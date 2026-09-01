export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="b-page flex flex-col gap-4 py-12 sm:flex-row sm:items-center sm:justify-between">
        <p className="b-label">
          Mogadishu · Hargeisa · Nairobi · Addis Abeba · Zanzibar · Kigali
        </p>
        <p className="b-label">
          © {new Date().getFullYear()} Blanso · Demo — sandbox-betalning
        </p>
      </div>
    </footer>
  );
}
