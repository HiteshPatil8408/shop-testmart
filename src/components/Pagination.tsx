export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  const visible = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === pages || Math.abs(value - page) <= 1,
  );
  return (
    <nav className="pagination" aria-label="Product pages">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      {visible.map((value, index) => (
        <span key={value}>
          {index > 0 && value - visible[index - 1] > 1 && <span aria-hidden="true">…</span>}
          <button
            type="button"
            aria-current={value === page ? 'page' : undefined}
            onClick={() => onPage(value)}
          >
            {value}
          </button>
        </span>
      ))}
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  );
}
