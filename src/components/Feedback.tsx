export function LoadingGrid({ count = 8 }: { count?: number }) {
  return (
    <div
      className="product-grid"
      role="status"
      aria-label="Loading products"
      aria-busy="true"
      data-testid="loading-overlay"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton skeleton--image" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--short" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-card" role="alert">
      <span className="state-card__icon" aria-hidden="true">
        !
      </span>
      <h2>We couldn’t load this</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="button button--secondary" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state-card">
      <span className="state-card__icon" aria-hidden="true">
        ◇
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  );
}
