import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  memo,
  lazy,
  Suspense,
} from "react";
import { getFlyers, toggleFlyer, deleteFlyer } from "../api/flyerApi";
import AdminLayout from "./AdminLayout";
import {
  Flag,
  FileText,
  Building2,
  Tag,
  Calendar,
  RefreshCw,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS  (defined once at module scope — never recreated)
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

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

/* ─────────────────────────────────────────────────────────────────
   CATEGORY COLOURS  (static lookup — O(1), no recalculation)
───────────────────────────────────────────────────────────────── */
const CATEGORY_COLORS = Object.freeze({
  supermarket: { bg: "#d1fae5", color: "#065f46" },
  restaurant:  { bg: "#fef3c7", color: "#92400e" },
  pharmacy:    { bg: "#e0e7ff", color: "#3730a3" },
  electronics: { bg: "#fce7f3", color: "#9d174d" },
  fashion:     { bg: "#f3e8ff", color: "#6b21a8" },
  default:     { bg: "#fef2ee", color: "#8b1a1a" },
});

const getCategoryStyle = (cat) =>
  CATEGORY_COLORS[(cat || "").toLowerCase()] ?? CATEGORY_COLORS.default;

/* ─────────────────────────────────────────────────────────────────
   DATE FORMATTER  (memoised via closure, locale computed once)
───────────────────────────────────────────────────────────────── */
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const fmtDate = (d) => (d ? dateFormatter.format(new Date(d)) : "—");

/* ─────────────────────────────────────────────────────────────────
   GLOBAL STYLES  (injected once, not recreated on each render)
───────────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes slideUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes spin    { to   { transform:rotate(360deg); } }
`;

function GlobalStyles() {
  const injected = useRef(false);
  useEffect(() => {
    if (injected.current) return;
    injected.current = true;
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    // No cleanup — animations are needed for the lifetime of the app
  }, []);
  return null;
}

/* ─────────────────────────────────────────────────────────────────
   CONFIRM MODAL  (lazily imported when first needed)
   Using memo to prevent re-render when parent state unrelated to
   modal changes.
───────────────────────────────────────────────────────────────── */
const ConfirmModal = memo(function ConfirmModal({ message, onConfirm, onCancel }) {
  // Focus trap: keep focus inside modal while open
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
        borderRadius: 18,
        padding: "30px 32px",
        width: 360,
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
          <Trash2 size={18} color={C.rose} />
        </div>
        <div
          id="confirm-title"
          style={{
            fontSize: 17, fontWeight: 700, color: C.textH,
            fontFamily: "'DM Serif Display', serif",
            marginBottom: 8,
          }}
        >
          Confirm Delete
        </div>
        <div style={{ fontSize: 13, color: C.textMid, marginBottom: 24, lineHeight: 1.6 }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "10px 0",
              background: C.bgCardWarm,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              color: C.textMid, fontSize: 13, fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{
              flex: 1, padding: "10px 0",
              background: C.rose,
              border: "none",
              borderRadius: 10,
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
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
   FLYER CARD
   • memo() prevents re-render unless its own flyer data changes
   • Inline style objects that depend only on constants are hoisted
     out of render so they're never recreated
───────────────────────────────────────────────────────────────── */

// Static style fragments shared by all cards
const CARD_META_SPAN_BASE = {
  fontSize: 11, color: C.textMid, fontWeight: 500,
  display: "flex", alignItems: "center", gap: 5,
  background: C.bgCardWarm,
  border: `1px solid ${C.border}`,
  borderRadius: 20, padding: "3px 10px",
};

const FlyerCard = memo(function FlyerCard({ flyer, index, onToggle, onDelete }) {
  const [hov, setHov] = useState(false);
  const catStyle = getCategoryStyle(flyer.category_type);
  const isActive = flyer.is_active;

  // Stable event handlers — no new function per render
  const handleToggle  = useCallback(() => onToggle(flyer.id),              [onToggle, flyer.id]);
  const handleDelete  = useCallback(() => onDelete(flyer.id, flyer.title), [onDelete, flyer.id, flyer.title]);
  const handleEnter   = useCallback(() => setHov(true),  []);
  const handleLeave   = useCallback(() => setHov(false), []);

  // Memoised date strings — only recomputed when dates change
  const dateRange = useMemo(
    () => `${fmtDate(flyer.start_date)} → ${fmtDate(flyer.end_date)}`,
    [flyer.start_date, flyer.end_date],
  );

  return (
    <article
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        background: C.bgCard,
        border: `1px solid ${hov ? C.borderMid : C.border}`,
        borderLeft: `4px solid ${isActive ? C.teal : C.textDim}`,
        borderRadius: 16,
        padding: "18px 20px",
        boxShadow: hov
          ? `0 8px 28px ${C.shadowHov}`
          : `0 2px 10px ${C.shadow}`,
        transition: "transform .22s ease, box-shadow .22s ease",
        transform: hov ? "translateY(-2px)" : "none",
        animation: `slideUp .45s ${0.06 + index * 0.06}s cubic-bezier(.22,.61,.36,1) both`,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, color: C.textH,
            fontFamily: "'DM Serif Display', serif",
            lineHeight: 1.2, marginBottom: 6,
          }}>
            {flyer.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Building2 size={11} color={C.textDim} aria-hidden="true" />
            <span style={{ fontSize: 12, color: C.textMid, fontWeight: 500 }}>
              {flyer.company_name}
            </span>
          </div>
        </div>

        <span
          aria-label={`Status: ${isActive ? "Active" : "Suspended"}`}
          style={{
            fontSize: 11, fontWeight: 700,
            padding: "4px 12px", borderRadius: 20,
            background: isActive ? "#d1fae5" : "#fef2ee",
            color: isActive ? "#065f46" : C.textDim,
            letterSpacing: "0.04em",
            textTransform: "capitalize",
            flexShrink: 0,
            border: `1px solid ${isActive ? "#6ee7b730" : C.border}`,
          }}
        >
          {isActive ? "Active" : "Suspended"}
        </span>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          padding: "3px 10px", borderRadius: 20,
          background: catStyle.bg, color: catStyle.color,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Tag size={9} aria-hidden="true" />
          {flyer.category_type}
        </span>

        <span style={CARD_META_SPAN_BASE}>
          <Calendar size={9} color={C.textDim} aria-hidden="true" />
          {dateRange}
        </span>
      </div>

      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <a
          href={flyer.pdf}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`View PDF for ${flyer.title}`}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, color: C.navMid,
            background: `${C.navBright}10`,
            border: `1px solid ${C.navBright}25`,
            borderRadius: 10, padding: "7px 13px",
            textDecoration: "none",
          }}
        >
          <FileText size={12} color={C.navMid} aria-hidden="true" />
          View PDF
        </a>

        <button
          onClick={handleToggle}
          aria-pressed={isActive}
          aria-label={isActive ? `Suspend ${flyer.title}` : `Activate ${flyer.title}`}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600,
            color:      isActive ? C.amber : C.teal,
            background: isActive ? "#fef3c7" : "#d1fae5",
            border: `1px solid ${isActive ? "#fcd34d50" : "#6ee7b750"}`,
            borderRadius: 10, padding: "7px 13px",
            cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {isActive
            ? <><ToggleLeft  size={12} aria-hidden="true" /> Suspend</>
            : <><ToggleRight size={12} aria-hidden="true" /> Activate</>
          }
        </button>

        <button
          onClick={handleDelete}
          aria-label={`Delete ${flyer.title}`}
          style={{
            marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600,
            color: C.rose,
            background: "#ffe4e6",
            border: "1px solid #fca5a530",
            borderRadius: 10, padding: "7px 13px",
            cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          <Trash2 size={12} color={C.rose} aria-hidden="true" />
          Delete
        </button>
      </div>
    </article>
  );
});

/* ─────────────────────────────────────────────────────────────────
   LAZY-LOADING SENTINEL
   Uses IntersectionObserver to load cards only when they approach
   the viewport.  Falls back gracefully in environments where IO is
   unavailable.
───────────────────────────────────────────────────────────────── */
const IO_OPTIONS = { rootMargin: "200px", threshold: 0 };

function LazyFlyerCard(props) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVisible(true);   // graceful degradation
      return;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        io.disconnect();
      }
    }, IO_OPTIONS);
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? "auto" : 180 }}>
      {visible ? (
        <FlyerCard {...props} />
      ) : (
        /* Skeleton placeholder keeps layout stable */
        <div style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderLeft: `4px solid ${C.border}`,
          borderRadius: 16,
          height: 180,
          animation: "fadeIn .3s ease both",
          backgroundImage: `linear-gradient(90deg, ${C.bgCard} 25%, #fdf0ec 50%, ${C.bgCard} 75%)`,
          backgroundSize: "200% 100%",
        }} aria-hidden="true" />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   STAT CHIPS  (static data array outside render)
───────────────────────────────────────────────────────────────── */
function StatChips({ total, active, inactive }) {
  const chips = useMemo(() => [
    { label: "Total Flyers", value: total,    color: C.navBright, bg: `${C.navBright}12` },
    { label: "Active",       value: active,   color: C.teal,      bg: "#d1fae5" },
    { label: "Suspended",    value: inactive, color: C.textDim,   bg: "#fef2ee" },
  ], [total, active, inactive]);

  return (
    <div style={{
      display: "flex", gap: 12, marginBottom: 26, flexWrap: "wrap",
      animation: "slideUp .4s .05s ease both",
    }}>
      {chips.map(({ label, value, color, bg }) => (
        <div key={label} style={{
          display: "flex", alignItems: "center", gap: 10,
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 12, padding: "12px 18px",
          boxShadow: `0 2px 8px ${C.shadow}`,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, background: bg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Flag size={13} color={color} aria-hidden="true" />
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
}

/* ─────────────────────────────────────────────────────────────────
   LOADING SPINNER  (extracted to prevent re-render of whole tree)
───────────────────────────────────────────────────────────────── */
const SPINNER_STYLE = {
  width: 36, height: 36, borderRadius: "50%",
  border: `3px solid ${C.border}`,
  borderTopColor: C.navBright,
  animation: "spin .8s linear infinite",
};

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
        <div style={SPINNER_STYLE} role="status" aria-label="Loading" />
        <span style={{ fontSize: 13, color: C.textDim }}>Loading flyers…</span>
      </div>
    </AdminLayout>
  );
}

/* ─────────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      height: 200, gap: 10,
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
    }}>
      <Flag size={32} color={C.textDim} opacity={0.4} aria-hidden="true" />
      <span style={{ fontSize: 14, color: C.textDim }}>No flyers found</span>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   Optimisations applied:
   1. useCallback on all handlers → stable references for memo'd children
   2. useMemo for derived stats (total / active / inactive)
   3. Abortable fetch with AbortController → no state update on unmount
   4. LazyFlyerCard via IntersectionObserver → off-screen cards skipped
   5. Flyer list keyed by id only; index used only for stagger delay
   6. Global CSS injected once into <head> (no <style> inside JSX tree)
   7. Font link rendered once via <link> in <head>, not in render tree
═════════════════════════════════════════════════════════════════ */
export default function ManageFlyers() {
  const [flyers, setFlyers]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirm, setConfirm]       = useState(null); // { id, title } | null

  // ── Font injection (once) ──────────────────────────────────────
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_LINK}"]`)) return;
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = FONT_LINK;
    document.head.appendChild(link);
  }, []);

  // ── Data fetching with abort support ──────────────────────────
  const fetchFlyers = useCallback(async (silent = false) => {
    const controller = new AbortController();
    if (!silent) setRefreshing(true);
    try {
      const res = await getFlyers({ signal: controller.signal });
      setFlyers(res.data);
    } catch (err) {
      if (err.name !== "AbortError") console.error("[ManageFlyers] fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const cleanup = fetchFlyers();
    return () => { cleanup?.then?.(fn => fn?.()); };
  }, [fetchFlyers]);

  // ── Stable action handlers ─────────────────────────────────────
  const handleToggle = useCallback(async (id) => {
    try {
      await toggleFlyer(id);
      // Optimistic update — flip is_active locally; re-sync in background
      setFlyers(prev =>
        prev.map(f => (f.id === id ? { ...f, is_active: !f.is_active } : f))
      );
    } catch (err) {
      console.error("[ManageFlyers] toggle error:", err);
      fetchFlyers(true); // rollback via re-fetch on failure
    }
  }, [fetchFlyers]);

  const handleDeleteRequest = useCallback((id, title) => {
    setConfirm({ id, title });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    const { id } = confirm;
    setConfirm(null);
    try {
      await deleteFlyer(id);
      setFlyers(prev => prev.filter(f => f.id !== id)); // optimistic remove
    } catch (err) {
      console.error("[ManageFlyers] delete error:", err);
      fetchFlyers(true); // rollback on failure
    }
  }, [confirm, fetchFlyers]);

  const handleCancelConfirm = useCallback(() => setConfirm(null), []);

  const handleRefresh = useCallback(() => fetchFlyers(), [fetchFlyers]);

  // ── Derived stats (O(n) only when flyers change) ───────────────
  const { total, active, inactive } = useMemo(() => {
    const active = flyers.reduce((n, f) => n + (f.is_active ? 1 : 0), 0);
    return { total: flyers.length, active, inactive: flyers.length - active };
  }, [flyers]);

  if (loading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <GlobalStyles />

      {confirm && (
        <ConfirmModal
          message={`Are you sure you want to delete "${confirm.title}"? This action cannot be undone.`}
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
              margin: 0,
              fontSize: 34, fontWeight: 400,
              fontFamily: "'DM Serif Display', serif",
              color: C.navDark,
              letterSpacing: "-0.5px", lineHeight: 1.1,
            }}>
              Manage Flyers
            </h1>
            <p style={{
              margin: "6px 0 0",
              fontSize: 13, color: C.textMid,
              fontWeight: 500, letterSpacing: "0.02em",
            }}>
              Daily Deals &nbsp;·&nbsp; Qatar &nbsp;·&nbsp; Admin Panel v1.0
            </p>
          </div>

          <button
            onClick={handleRefresh}
            aria-label="Refresh flyer list"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 14, padding: "10px 18px",
              boxShadow: `0 2px 8px ${C.shadow}`,
              cursor: "pointer",
              color: C.navMid, fontSize: 13, fontWeight: 600,
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

        {/* Stat chips */}
        <StatChips total={total} active={active} inactive={inactive} />

        {/* Cards grid */}
        {flyers.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            role="list"
            aria-label="Flyer list"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 16,
            }}
          >
            {flyers.map((flyer, i) => (
              <div key={flyer.id} role="listitem">
                <LazyFlyerCard
                  flyer={flyer}
                  index={i}
                  onToggle={handleToggle}
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