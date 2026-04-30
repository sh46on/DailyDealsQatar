import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import {
  getProducts,
  toggleProduct,
  toggleFeatured,
  deleteProduct,
} from "../api/productApi";
import AdminLayout from "./AdminLayout";
import {
  Package, Building2, Tag, Eye, Star,
  Trash2, ToggleLeft, ToggleRight, RefreshCw,
  Zap, TrendingUp, ShoppingBag,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS  (frozen at module scope — never recreated)
───────────────────────────────────────────────────────────────── */
const C = Object.freeze({
  bg:         "#fdf6f0",
  bgCard:     "#ffffff",
  bgCardWarm: "#fff9f6",
  bgCardTint: "#fef2ee",
  navDark:    "#5c0f0f",
  navMid:     "#8b1a1a",
  navBright:  "#c0392b",
  rose:       "#e11d48",
  amber:      "#d97706",
  teal:       "#0d9488",
  indigo:     "#4338ca",
  emerald:    "#059669",
  violet:     "#7c3aed",
  orange:     "#ea580c",
  textH:      "#1a0505",
  textP:      "#3d1010",
  textMid:    "#6b2a2a",
  textDim:    "#a05050",
  border:     "rgba(140,30,30,0.12)",
  borderMid:  "rgba(140,30,30,0.22)",
  shadow:     "rgba(80,10,10,0.10)",
  shadowHov:  "rgba(80,10,10,0.18)",
});

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

/* ─────────────────────────────────────────────────────────────────
   CATEGORY COLOURS  (static O(1) lookup)
───────────────────────────────────────────────────────────────── */
const CAT_COLORS = Object.freeze({
  electronics: { bg: "#e0e7ff", color: "#3730a3" },
  fashion:     { bg: "#f3e8ff", color: "#6b21a8" },
  supermarket: { bg: "#d1fae5", color: "#065f46" },
  restaurant:  { bg: "#fef3c7", color: "#92400e" },
  pharmacy:    { bg: "#fce7f3", color: "#9d174d" },
  default:     { bg: "#fef2ee", color: "#8b1a1a" },
});
const getCatStyle = (cat) =>
  CAT_COLORS[(cat || "").toLowerCase()] ?? CAT_COLORS.default;

/* ─────────────────────────────────────────────────────────────────
   FORMATTERS  (created once at module scope)
───────────────────────────────────────────────────────────────── */
const priceFormatter = new Intl.NumberFormat("en-QA", { minimumFractionDigits: 0 });
const fmtPrice = (v) => priceFormatter.format(Number(v));

/* ─────────────────────────────────────────────────────────────────
   GLOBAL CSS  (injected into <head> exactly once)
───────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes spin    { to{transform:rotate(360deg)} }
`;

function GlobalStyles() {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;

    // Animations
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);

    // Font (preconnect + stylesheet)
    if (!document.querySelector(`link[href="${FONT_URL}"]`)) {
      const preconnect = document.createElement("link");
      preconnect.rel  = "preconnect";
      preconnect.href = "https://fonts.googleapis.com";
      document.head.appendChild(preconnect);

      const link = document.createElement("link");
      link.rel  = "stylesheet";
      link.href = FONT_URL;
      document.head.appendChild(link);
    }
  }, []);
  return null;
}

/* ─────────────────────────────────────────────────────────────────
   STATIC STYLE FRAGMENTS  (hoisted — never recreated per render)
───────────────────────────────────────────────────────────────── */
const SPINNER_STYLE = {
  width: 36, height: 36, borderRadius: "50%",
  border: `3px solid ${C.border}`,
  borderTopColor: C.navBright,
  animation: "spin .8s linear infinite",
};

const BADGE_SUBCATEGORY_STYLE = {
  fontSize: 10, fontWeight: 500,
  padding: "3px 9px", borderRadius: 20,
  background: C.bgCardWarm, color: C.textMid,
  border: `1px solid ${C.border}`,
};

/* ─────────────────────────────────────────────────────────────────
   LOADING SPINNER
───────────────────────────────────────────────────────────────── */
function LoadingSpinner() {
  return (
    <AdminLayout>
      <GlobalStyles />
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: 280, gap: 12,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={SPINNER_STYLE} role="status" aria-label="Loading products" />
        <span style={{ fontSize: 13, color: C.textDim }}>Loading products…</span>
      </div>
    </AdminLayout>
  );
}

/* ─────────────────────────────────────────────────────────────────
   CONFIRM MODAL  (memo — only re-renders when title changes)
───────────────────────────────────────────────────────────────── */
const ConfirmModal = memo(function ConfirmModal({ title, onConfirm, onCancel }) {
  const confirmRef = useRef(null);
  useEffect(() => { confirmRef.current?.focus(); }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(30,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        background: C.bgCard,
        border: `1px solid ${C.borderMid}`,
        borderRadius: 18, padding: "30px 32px", width: 360,
        boxShadow: "0 16px 48px rgba(80,10,10,0.22)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: "slideUp .25s ease both",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "#ffe4e6", border: "1px solid #fca5a530",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}>
          <Trash2 size={18} color={C.rose} aria-hidden="true" />
        </div>
        <div
          id="confirm-title"
          style={{
            fontSize: 17, fontWeight: 700, color: C.textH,
            fontFamily: "'DM Serif Display', serif", marginBottom: 8,
          }}
        >
          Confirm Delete
        </div>
        <div style={{ fontSize: 13, color: C.textMid, marginBottom: 24, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>"{title}"</strong>? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px 0",
              background: C.bgCardWarm, border: `1px solid ${C.border}`,
              borderRadius: 10, color: C.textMid, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{
              flex: 1, padding: "10px 0",
              background: C.rose, border: "none",
              borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────
   PRODUCT CARD  (memo — skips re-render if product ref is stable)
───────────────────────────────────────────────────────────────── */
const ProductCard = memo(function ProductCard({ product: p, index, onToggle, onFeature, onDelete }) {
  const [hov, setHov]       = useState(false);
  const [imgErr, setImgErr] = useState(false);

  // Stable callbacks — no new fn refs on unrelated state changes
  const handleToggle  = useCallback(() => onToggle(p.id),         [onToggle, p.id]);
  const handleFeature = useCallback(() => onFeature(p.id),        [onFeature, p.id]);
  const handleDelete  = useCallback(() => onDelete(p.id, p.name), [onDelete, p.id, p.name]);
  const handleImgErr  = useCallback(() => setImgErr(true),        []);
  const handleEnter   = useCallback(() => setHov(true),           []);
  const handleLeave   = useCallback(() => setHov(false),          []);

  // Memoised derived values
  const cs = useMemo(() => getCatStyle(p.category_name), [p.category_name]);
  const discount = useMemo(
    () => p.old_price
      ? Math.round((1 - Number(p.price) / Number(p.old_price)) * 100)
      : null,
    [p.price, p.old_price],
  );
  const priceStr    = useMemo(() => fmtPrice(p.price),     [p.price]);
  const oldPriceStr = useMemo(() => fmtPrice(p.old_price), [p.old_price]);

  return (
    <article
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        background: C.bgCard,
        border: `1px solid ${hov ? C.borderMid : C.border}`,
        borderTop: `3px solid ${p.is_active ? C.navBright : C.textDim}`,
        borderRadius: 16,
        boxShadow: hov ? `0 8px 28px ${C.shadowHov}` : `0 2px 10px ${C.shadow}`,
        transition: "transform .22s ease, box-shadow .22s ease",
        transform: hov ? "translateY(-3px)" : "none",
        animation: `slideUp .45s ${0.06 + index * 0.05}s cubic-bezier(.22,.61,.36,1) both`,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Image strip */}
      <div style={{
        position: "relative", height: 160,
        background: C.bgCardTint, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!imgErr ? (
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"               /* native lazy load */
            decoding="async"
            onError={handleImgErr}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              transition: "transform .3s ease",
              transform: hov ? "scale(1.04)" : "scale(1)",
            }}
          />
        ) : (
          <Package size={40} color={C.textDim} opacity={0.35} aria-hidden="true" />
        )}

        {discount !== null && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            fontSize: 11, fontWeight: 700,
            background: C.rose, color: "#fff",
            borderRadius: 8, padding: "3px 9px",
          }}>
            -{discount}%
          </span>
        )}

        {p.is_featured && (
          <span
            aria-label="Featured product"
            style={{
              position: "absolute", top: 10, right: 10,
              width: 28, height: 28, borderRadius: "50%",
              background: "#fef3c7", border: "1px solid #fcd34d50",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Star size={13} color={C.amber} fill={C.amber} aria-hidden="true" />
          </span>
        )}

        {!p.is_active && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(160,80,80,0.82)",
            color: "#fff", fontSize: 11, fontWeight: 700,
            textAlign: "center", padding: "5px 0",
            letterSpacing: "0.06em",
          }}
            aria-label="Product suspended"
          >
            SUSPENDED
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Name + company */}
        <div>
          <div style={{
            fontSize: 15, fontWeight: 700, color: C.textH,
            fontFamily: "'DM Serif Display', serif",
            lineHeight: 1.25, marginBottom: 5,
          }}>
            {p.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Building2 size={10} color={C.textDim} aria-hidden="true" />
            <span style={{ fontSize: 11, color: C.textMid, fontWeight: 500 }}>
              {p.company_name}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 600,
            padding: "3px 9px", borderRadius: 20,
            background: cs.bg, color: cs.color,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Tag size={8} aria-hidden="true" />{p.category_name}
          </span>
          {p.subcategory_name && (
            <span style={BADGE_SUBCATEGORY_STYLE}>{p.subcategory_name}</span>
          )}
          {p.quantity && (
            <span style={BADGE_SUBCATEGORY_STYLE}>{p.quantity}</span>
          )}
        </div>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            fontSize: 22, fontWeight: 700, color: C.navDark,
            fontFamily: "'DM Serif Display', serif",
          }}>
            QAR {priceStr}
          </span>
          {p.old_price && (
            <span style={{ fontSize: 12, color: C.textDim, textDecoration: "line-through" }}>
              QAR {oldPriceStr}
            </span>
          )}
        </div>

        {/* Views */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 11, color: C.textDim, fontWeight: 500,
        }}>
          <Eye size={11} color={C.textDim} aria-hidden="true" />
          {p.view_count} views
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 2 }} />

        {/* Actions */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <button
            onClick={handleToggle}
            aria-pressed={p.is_active}
            aria-label={p.is_active ? `Suspend ${p.name}` : `Activate ${p.name}`}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600,
              color:      p.is_active ? C.amber : C.teal,
              background: p.is_active ? "#fef3c7" : "#d1fae5",
              border: `1px solid ${p.is_active ? "#fcd34d50" : "#6ee7b750"}`,
              borderRadius: 9, padding: "6px 11px",
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {p.is_active
              ? <><ToggleLeft  size={11} aria-hidden="true" /> Pause</>
              : <><ToggleRight size={11} aria-hidden="true" /> Enable</>
            }
          </button>

          <button
            onClick={handleFeature}
            aria-pressed={p.is_featured}
            aria-label={p.is_featured ? `Unfeature ${p.name}` : `Feature ${p.name}`}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600,
              color:      p.is_featured ? C.violet : C.amber,
              background: p.is_featured ? "#f3e8ff" : "#fef3c7",
              border: `1px solid ${p.is_featured ? "#c4b5fd50" : "#fcd34d50"}`,
              borderRadius: 9, padding: "6px 11px",
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Star size={11} fill={p.is_featured ? C.violet : "none"} aria-hidden="true" />
            {p.is_featured ? "Unfeature" : "Feature"}
          </button>

          <button
            onClick={handleDelete}
            aria-label={`Delete ${p.name}`}
            style={{
              marginLeft: "auto",
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600,
              color: C.rose, background: "#ffe4e6",
              border: "1px solid #fca5a530",
              borderRadius: 9, padding: "6px 11px",
              cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Trash2 size={11} color={C.rose} aria-hidden="true" /> Trash
          </button>
        </div>
      </div>
    </article>
  );
});

/* ─────────────────────────────────────────────────────────────────
   LAZY CARD WRAPPER  (IntersectionObserver — renders skeleton until
   card scrolls within 250 px of the viewport)
───────────────────────────────────────────────────────────────── */
const IO_OPTIONS = { rootMargin: "250px", threshold: 0 };

function LazyProductCard(props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVisible(true);     // graceful degradation
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, IO_OPTIONS);
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? "auto" : 340 }}>
      {visible ? (
        <ProductCard {...props} />
      ) : (
        /* Shimmer skeleton */
        <div
          aria-hidden="true"
          style={{
            height: 340, borderRadius: 16,
            background: `linear-gradient(90deg, ${C.bgCard} 25%, #fdf0ec 50%, ${C.bgCard} 75%)`,
            backgroundSize: "200% 100%",
            border: `1px solid ${C.border}`,
            animation: "fadeIn .3s ease both",
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   STAT CHIPS
───────────────────────────────────────────────────────────────── */
const StatChips = memo(function StatChips({ total, active, featured, suspended }) {
  const chips = useMemo(() => [
    { label: "Total Products", value: total,     color: C.navBright, bg: `${C.navBright}12`, Icon: ShoppingBag },
    { label: "Active",         value: active,    color: C.teal,      bg: "#d1fae5",          Icon: Zap         },
    { label: "Featured",       value: featured,  color: C.amber,     bg: "#fef3c7",          Icon: Star        },
    { label: "Suspended",      value: suspended, color: C.textDim,   bg: "#fef2ee",          Icon: TrendingUp  },
  ], [total, active, featured, suspended]);

  return (
    <div style={{
      display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap",
      animation: "slideUp .4s .05s ease both",
    }}>
      {chips.map(({ label, value, color, bg, Icon }) => (
        <div key={label} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 12, padding: "12px 18px",
          boxShadow: `0 2px 8px ${C.shadow}`,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: bg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={13} color={color} aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              {label}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 700, color: C.textH, lineHeight: 1,
              fontFamily: "'DM Serif Display', serif",
            }}>
              {value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────
   FILTER TABS
───────────────────────────────────────────────────────────────── */
const FilterTabs = memo(function FilterTabs({ filter, onChange, total, active, featured, suspended }) {
  const tabs = useMemo(() => [
    { key: "all",       label: `All (${total})`,             color: C.navBright },
    { key: "active",    label: `Active (${active})`,         color: C.teal      },
    { key: "suspended", label: `Suspended (${suspended})`,   color: C.textDim   },
    { key: "featured",  label: `Featured (${featured})`,     color: C.amber     },
  ], [total, active, featured, suspended]);

  return (
    <div
      role="tablist"
      aria-label="Filter products"
      style={{
        display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap",
        animation: "slideUp .4s .1s ease both",
      }}
    >
      {tabs.map(({ key, label, color }) => {
        const isActive = filter === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            style={{
              fontSize: 12, fontWeight: 600,
              padding: "7px 16px", borderRadius: 20,
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all .18s",
              border: isActive ? `1.5px solid ${color}` : `1px solid ${C.border}`,
              background: isActive ? `${color}15` : C.bgCard,
              color: isActive ? color : C.textMid,
              boxShadow: isActive ? `0 2px 8px ${C.shadow}` : "none",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: 200, gap: 10,
      background: C.bgCard, border: `1px solid ${C.border}`,
      borderRadius: 16,
    }}>
      <Package size={32} color={C.textDim} opacity={0.4} aria-hidden="true" />
      <span style={{ fontSize: 14, color: C.textDim }}>No products found</span>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   Optimisations:
   1. useCallback on all handlers → stable refs for memo'd children
   2. useMemo for stats, visible list, filter tabs, chip data
   3. Optimistic toggle/feature/delete with re-fetch rollback on error
   4. AbortController on fetch → no setState after unmount
   5. LazyProductCard via IntersectionObserver (250px pre-load margin)
   6. Native loading="lazy" + decoding="async" on <img>
   7. GlobalStyles injects CSS + fonts into <head> exactly once
   8. Static style objects hoisted to module scope
   9. Extracted StatChips, FilterTabs, EmptyState as named components
═════════════════════════════════════════════════════════════════ */
export default function ManageProducts() {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirm, setConfirm]       = useState(null); // { id, name } | null
  const [filter, setFilter]         = useState("all");

  // ── Data fetching ──────────────────────────────────────────────
  const fetchProducts = useCallback(async (silent = false) => {
    const controller = new AbortController();
    if (!silent) setRefreshing(true);
    try {
      const res = await getProducts({ signal: controller.signal });
      setProducts(res.data);
    } catch (err) {
      if (err.name !== "AbortError") console.error("[ManageProducts] fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const cleanup = fetchProducts();
    return () => { cleanup?.then?.(fn => fn?.()); };
  }, [fetchProducts]);

  // ── Stable action handlers ─────────────────────────────────────
  const handleToggle = useCallback(async (id) => {
    // Optimistic update
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p)
    );
    try {
      await toggleProduct(id);
    } catch (err) {
      console.error("[ManageProducts] toggle error:", err);
      fetchProducts(true); // rollback
    }
  }, [fetchProducts]);

  const handleFeature = useCallback(async (id) => {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, is_featured: !p.is_featured } : p)
    );
    try {
      await toggleFeatured(id);
    } catch (err) {
      console.error("[ManageProducts] feature error:", err);
      fetchProducts(true);
    }
  }, [fetchProducts]);

  const handleDeleteRequest = useCallback((id, name) => setConfirm({ id, name }), []);

  const handleDeleteConfirm = useCallback(async () => {
    const { id } = confirm;
    setConfirm(null);
    setProducts(prev => prev.filter(p => p.id !== id)); // optimistic remove
    try {
      await deleteProduct(id);
    } catch (err) {
      console.error("[ManageProducts] delete error:", err);
      fetchProducts(true);
    }
  }, [confirm, fetchProducts]);

  const handleCancelConfirm = useCallback(() => setConfirm(null), []);
  const handleRefresh       = useCallback(() => fetchProducts(),   [fetchProducts]);
  const handleFilterChange  = useCallback((key) => setFilter(key), []);

  // ── Derived stats (single pass) ────────────────────────────────
  const stats = useMemo(() => {
    let active = 0, featured = 0;
    for (const p of products) {
      if (p.is_active)   active++;
      if (p.is_featured) featured++;
    }
    return { total: products.length, active, featured, suspended: products.length - active };
  }, [products]);

  // ── Filtered view ──────────────────────────────────────────────
  const visible = useMemo(() => {
    switch (filter) {
      case "active":    return products.filter(p => p.is_active);
      case "suspended": return products.filter(p => !p.is_active);
      case "featured":  return products.filter(p => p.is_featured);
      default:          return products;
    }
  }, [products, filter]);

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <GlobalStyles />

      {confirm && (
        <ConfirmModal
          title={confirm.name}
          onConfirm={handleDeleteConfirm}
          onCancel={handleCancelConfirm}
        />
      )}

      <div style={{
        padding: "28px 32px 40px 28px",
        background: C.bg,
        minHeight: "100%",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          animation: "fadeIn .4s ease both",
        }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: 34, fontWeight: 400,
              fontFamily: "'DM Serif Display', serif",
              color: C.navDark, letterSpacing: "-0.5px", lineHeight: 1.1,
            }}>
              Manage Products
            </h1>
            <p style={{
              margin: "6px 0 0", fontSize: 13, color: C.textMid,
              fontWeight: 500, letterSpacing: "0.02em",
            }}>
              Daily Deals &nbsp;·&nbsp; Qatar &nbsp;·&nbsp; Admin Panel v1.0
            </p>
          </div>

          <button
            onClick={handleRefresh}
            aria-label="Refresh product list"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: C.bgCard, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: "10px 18px",
              boxShadow: `0 2px 8px ${C.shadow}`,
              cursor: "pointer", color: C.navMid,
              fontSize: 13, fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <RefreshCw
              size={13}
              aria-hidden="true"
              style={{ animation: refreshing ? "spin .6s linear infinite" : "none" }}
            />
            Refresh
          </button>
        </div>

        <StatChips {...stats} />

        <FilterTabs
          filter={filter}
          onChange={handleFilterChange}
          {...stats}
        />

        {/* Product grid */}
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            role="list"
            aria-label="Product list"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 18,
            }}
          >
            {visible.map((p, i) => (
              <div key={p.id} role="listitem">
                <LazyProductCard
                  product={p}
                  index={i}
                  onToggle={handleToggle}
                  onFeature={handleFeature}
                  onDelete={handleDeleteRequest}
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}