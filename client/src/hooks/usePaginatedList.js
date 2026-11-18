import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/axios";

const readPage = (value) => {
  const parsed = Number.parseInt(value || "", 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const readPayload = (payload) => {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      page: 1,
      totalPages: 1,
      total: payload.length,
    };
  }

  const items = Array.isArray(payload?.data) ? payload.data : [];
  const totalPages = Math.max(
    1,
    Number(payload?.totalPages) || 1
  );

  return {
    items,
    page: Math.max(1, Number(payload?.page) || 1),
    totalPages,
    total: Number.isFinite(Number(payload?.total))
      ? Number(payload.total)
      : items.length,
  };
};

/**
 * Load one page of a public collection and keep the page in the URL.
 *
 * The URL parameter makes pagination shareable and keeps the browser's
 * back/forward buttons working without extra state.
 */
export default function usePaginatedList(endpoint, { limit = 9 } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = searchParams.get("page");
  const page = readPage(rawPage);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(endpoint, {
          params: { page, limit },
        });

        if (cancelled) return;

        const payload = readPayload(response.data);
        setItems(payload.items);
        setMeta({
          page: payload.page,
          totalPages: payload.totalPages,
          total: payload.total,
        });

        // Keep the address bar truthful when it contains an invalid page or
        // a page past the end of the collection. The API clamps the value.
        if (
          (rawPage !== null && String(payload.page) !== rawPage) ||
          (rawPage === null && payload.page !== 1)
        ) {
          setSearchParams(
            (current) => {
              const params = new URLSearchParams(current);

              if (payload.page === 1) {
                params.delete("page");
              } else {
                params.set("page", String(payload.page));
              }

              return params;
            },
            { replace: true }
          );
        }
      } catch (err) {
        if (cancelled) return;

        console.error(`Failed to fetch ${endpoint}:`, err);
        setItems([]);
        setMeta({ page: 1, totalPages: 1, total: 0 });
        setError(
          err.response?.data?.message ||
            "Unable to load this content. Please try again later."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [endpoint, page, rawPage, limit, reloadToken, setSearchParams]);

  const setPage = useCallback(
    (nextPage) => {
      const target = Math.max(
        1,
        Math.min(
          Number(nextPage) || 1,
          Math.max(1, meta.totalPages)
        )
      );

      if (target === page) return;

      const params = new URLSearchParams(searchParams);

      if (target === 1) {
        params.delete("page");
      } else {
        params.set("page", String(target));
      }

      setSearchParams(params);

      requestAnimationFrame(() => {
        document
          .getElementById("pagination-anchor")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [meta.totalPages, page, searchParams, setSearchParams]
  );

  const retry = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    items,
    loading,
    error,
    page: meta.page,
    totalPages: meta.totalPages,
    total: meta.total,
    setPage,
    retry,
  };
}
