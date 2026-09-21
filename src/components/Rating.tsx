export function Rating({
  value,
  count,
  compact = false,
}: {
  value: number;
  count?: number;
  compact?: boolean;
}) {
  return (
    <span
      className="rating"
      aria-label={`${value} out of 5 stars${count !== undefined ? ` from ${count} reviews` : ''}`}
    >
      <span aria-hidden="true">★</span> {value.toFixed(1)}{' '}
      {!compact && count !== undefined && <span className="muted">({count})</span>}
    </span>
  );
}
