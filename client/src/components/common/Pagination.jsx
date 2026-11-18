import { ChevronLeft, ChevronRight } from "lucide-react";

const pageWindow = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    totalPages,
    page - 1,
    page,
    page + 1,
  ]);

  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right);

  const result = [];
  let previous = 0;

  for (const value of sorted) {
    if (value - previous > 1) result.push(`gap-${value}`);
    result.push(value);
    previous = value;
  }

  return result;
};

export default function Pagination({
  page,
  totalPages,
  onChange,
  label = "Pagination",
  total,
  pageSize,
}) {
  if (!Number.isFinite(totalPages) || totalPages <= 1) {
    return null;
  }

  const pages = pageWindow(page, totalPages);
  const hasRange =
    Number.isFinite(total) && Number.isFinite(pageSize) && pageSize > 0;
  const rangeStart = hasRange ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = hasRange ? Math.min(page * pageSize, total) : 0;

  return (
    <nav className="pagination" aria-label={label}>
      <span className="pagination__summary" aria-live="polite">
        {hasRange
          ? `Showing ${rangeStart}–${rangeEnd} of ${total}`
          : `Page ${page} of ${totalPages}`}
      </span>

      <div className="pagination__controls">
        <button
          type="button"
          className="pagination__button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <ol className="pagination__list">
          {pages.map((value) =>
            typeof value === "string" ? (
              <li key={value} className="pagination__ellipsis" aria-hidden="true">
                ...
              </li>
            ) : (
              <li key={value}>
                <button
                  type="button"
                  className="pagination__button"
                  onClick={() => onChange(value)}
                  aria-label={`Page ${value}`}
                  aria-current={value === page ? "page" : undefined}
                >
                  {value}
                </button>
              </li>
            )
          )}
        </ol>

        <button
          type="button"
          className="pagination__button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
