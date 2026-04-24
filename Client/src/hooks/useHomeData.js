import { useEffect, useState, useRef } from "react";
import { fetchHomeData } from "../api/homeApi";

export const useHomeData = ({ page = 1, filters = {} } = {}) => {
  const [data, setData] = useState({
    companies: [],
    categories: [],
    pdfCategoryTypes: [],
    products: [],
    pdfs: [],
  });

  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
  });

  const [pageUrl, setPageUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);

  // ================= MAIN FETCH =================
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    let isMounted = true;

    setLoading(true);
    setError(null);

    fetchHomeData({
      ...(pageUrl ? { url: pageUrl } : { page }),
      ...filters,
      signal: controller.signal,
    })
      .then(res => {
        if (!isMounted) return;

        setData({
          companies: res.companies || [],
          categories: res.categories || [],
          pdfCategoryTypes: res.pdfCategoryTypes || [],
          products: res.products || [],
          pdfs: res.pdfs || [],
        });

        setPagination({
          count: res.count || 0,
          next: res.next || null,
          previous: res.previous || null,
        });
      })
      .catch(err => {
        if (!isMounted) return;
        if (err.name === "AbortError") return;

        console.error("useHomeData error:", err);
        setError("Failed to load data.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    pageUrl,
    page,
    filters.category,
    filters.sub,
    filters.company,
    filters.type,
  ]);

  // ================= RESET PAGINATION =================
  useEffect(() => {
    setPageUrl(null);
  }, [
    filters.category,
    filters.sub,
    filters.company,
    filters.type,
  ]);

  // ================= ACTIONS =================
  const goNext = () => {
    if (pagination.next) {
      setPageUrl(pagination.next);
    }
  };

  const goPrevious = () => {
    if (pagination.previous) {
      setPageUrl(pagination.previous);
    }
  };

  return {
    ...data,
    pagination,
    loading,
    error,
    goNext,
    goPrevious,
  };
};