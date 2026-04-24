import { useState, useEffect } from "react";

/**
 * useMarketplaceData
 * Fetches marketplace items, categories, and stores.
 * Returns: { items, categories, stores, loading, error }
 *
 * Adjust the API base URL / endpoints to match your backend.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

export function useMarketplaceData() {
  const [items, setItems]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // Fire all three requests in parallel
        const [itemsRes, categoriesRes, storesRes] = await Promise.all([
          fetchJson("/api/marketplace/products/"),
          fetchJson("/api/marketplace/categories/"),
          fetchJson("/api/marketplace/stores/"),
        ]);

        if (cancelled) return;

        // Normalise — your API may return { results: [] } (DRF pagination)
        // or a plain array. Both cases are handled below.
        setItems(      Array.isArray(itemsRes)      ? itemsRes      : (itemsRes.results      ?? []));
        setCategories( Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes.results ?? []));
        setStores(     Array.isArray(storesRes)      ? storesRes      : (storesRes.results      ?? []));
      } catch (err) {
        if (!cancelled) {
          console.error("[useMarketplaceData]", err);
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { items, categories, stores, loading, error };
}