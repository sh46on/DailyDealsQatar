import { useEffect, useState, useRef } from "react";
import { fetchHomeData } from "../api/homeApi";

export const useHomeData = ({ filters = {}, productPageUrl = null, flyerPageUrl = null } = {}) => {
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

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const abortRef              = useRef(null);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    let isMounted    = true;

    setLoading(true);
    setError(null);

    const fetchParams = {
      ...filters,
      signal: controller.signal,
    };

    // Use whichever cursor URL is active; the API keeps
    // ?page= and ?flyer_page= completely separate.
    if (productPageUrl)     fetchParams.url = productPageUrl;
    else if (flyerPageUrl)  fetchParams.url = flyerPageUrl;

    fetchHomeData(fetchParams)
      .then(res => {
        if (!isMounted) return;

        setData({
          companies:        res.companies        || [],
          categories:       res.categories       || [],
          pdfCategoryTypes: res.pdfCategoryTypes || [],
          products:         res.products         || [],
          pdfs:             res.pdfs             || [],
        });

        setPagination({
          count:    res.count    || 0,
          next:     res.next     || null,
          previous: res.previous || null,
        });
      })
      .catch(err => {
        if (!isMounted || err.name === "AbortError") return;
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
    productPageUrl,
    flyerPageUrl,
    filters.category,
    filters.sub,
    filters.company,
    filters.type,
    filters.ordering,
  ]);

  return { ...data, pagination, loading, error };
};