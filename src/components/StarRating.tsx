// Monokromt betyg: siffran i display-snitt + antal recensioner som etikett.
// Inga stjärnikoner — systemet bygger hierarki av typografi, inte symboler.
export function StarRating({
  rating,
  reviewsCount,
  className = "",
}: {
  rating: number;
  reviewsCount?: number;
  className?: string;
}) {
  if (rating <= 0) {
    return <span className={`b-label b-label-ink ${className}`}>Ny</span>;
  }
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500 }}>
        {rating.toFixed(1)}
      </span>
      {typeof reviewsCount === "number" && reviewsCount > 0 && (
        <span className="b-label">{reviewsCount} recensioner</span>
      )}
    </span>
  );
}
