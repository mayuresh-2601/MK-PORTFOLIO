const DEFAULT_MAX_LIMIT = 48;

const parsePositiveInteger = (value) => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value.trim())) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Parse optional `page` and `limit` query parameters.
 *
 * Requests without either parameter keep the original unpaginated response,
 * so the admin dashboard and existing clients are unaffected.
 */
export const parsePagination = (
  query = {},
  { defaultLimit = 9, maxLimit = DEFAULT_MAX_LIMIT } = {}
) => {
  const hasPage = query.page !== undefined;
  const hasLimit = query.limit !== undefined;

  if (!hasPage && !hasLimit) {
    return { paginated: false };
  }

  const page = hasPage ? parsePositiveInteger(query.page) : 1;
  const limit = hasLimit
    ? parsePositiveInteger(query.limit)
    : defaultLimit;

  if (page === null) {
    return { error: "page must be a positive integer." };
  }

  if (limit === null) {
    return { error: "limit must be a positive integer." };
  }

  if (limit > maxLimit) {
    return { error: `limit must be ${maxLimit} or fewer.` };
  }

  return {
    paginated: true,
    page,
    limit,
    offset: (page - 1) * limit,
  };
};

/**
 * Build response metadata and clamp an out-of-range page to the last page.
 */
export const buildPagination = (total, page, limit) => {
  const safeTotal =
    Number.isFinite(Number(total)) && Number(total) > 0
      ? Math.trunc(Number(total))
      : 0;

  const safeLimit =
    Number.isFinite(Number(limit)) && Number(limit) > 0
      ? Math.trunc(Number(limit))
      : 1;

  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));
  const safePage = Math.min(Math.max(1, Math.trunc(Number(page)) || 1), totalPages);

  return {
    total: safeTotal,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
    offset: (safePage - 1) * safeLimit,
  };
};
