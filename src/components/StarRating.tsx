export function StarRating({
  rating,
  reviewsCount,
  className = "",
}: {
  rating: number;
  reviewsCount?: number;
  className?: string;
}) {
  // Nya boenden har inget betyg ännu — visa "Ny" i stället för ett vilseledande 0.0.
  if (rating <= 0) {
    return (
      <span className={`inline-flex items-center text-sm font-semibold text-brand ${className}`}>
        Ny
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-sm ${className}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-accent)" aria-hidden="true">
        <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
      </svg>
      <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
      {typeof reviewsCount === "number" && reviewsCount > 0 && (
        <span className="text-muted">({reviewsCount})</span>
      )}
    </span>
  );
}
