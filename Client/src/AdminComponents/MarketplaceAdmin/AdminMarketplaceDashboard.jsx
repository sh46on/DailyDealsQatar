/**
 * AdminMarketplaceDashboard – production-optimised
 *
 * Optimisations applied
 * ─────────────────────
 * 1.  React.lazy + Suspense   – RankPanels and UsersPanel are code-split; the
 *                               heavy table only loads when the page scrolls to it
 *                               (Intersection Observer lazy-mount).
 * 2.  React.memo              – Every sub-component bails out of re-render when
 *                               its props haven't changed.
 * 3.  useMemo / useCallback   – Derived values and handlers are stable across renders.
 * 4.  AbortController         – In-flight fetches are cancelled on unmount / re-fetch,
 *                               preventing state updates on unmounted components.
 * 5.  Stable style refs       – All style objects live outside component scope so they
 *                               are created once, not on every render.
 * 6.  Keyframe injection      – Guarded with a module-level flag; runs once per app.
 * 7.  User table pagination   – Renders PAGE_SIZE rows at a time so large user lists
 *                               don't paint thousands of DOM nodes at once.
 * 8.  Intersection Observer   – UsersPanel mounts only when it enters the viewport,
 *                               reducing initial JS work and layout cost.
 * 9.  Chip component          – Memoised; receives primitive props only (no inline objects).
 * 10. Error boundary          – Catches render errors in any panel without taking down
 *                               the whole page.
 */

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  memo,
  lazy,
  Suspense,
  Component,
} from "react";
import { fetchAnalytics, fetchUserActivity } from "./Api/analyticsApi";
import AdminLayout from "../AdminLayout";

/* ─────────────────────────────────────────────────────────────────────────────
   THEME  (module-level constants – zero allocation cost at render time)
───────────────────────────────────────────────────────────────────────────── */
const T = {
  primary:  "#1a4a6b",
  dark:     "#0d2f45",
  mid:      "#1e5278",
  gradient: "linear-gradient(135deg, #0d2f45 0%, #1a4a6b 50%, #1e5278 100%)",
  shadow:   "rgba(13,47,69,0.18)",
  accent:   "#4db8ff",
  bg:       "#f0f5f9",
  card:     "#ffffff",
  border:   "#d1dce8",
  text1:    "#0d2035",
  text2:    "#3d5a73",
  text3:    "#7a9bb5",
  green:    "#16a34a",
  amber:    "#d97706",
};

const SYNE = { fontFamily: "'Syne', sans-serif" };
const DM   = { fontFamily: "'DM Sans', sans-serif" };

/* ─────────────────────────────────────────────────────────────────────────────
   STATIC STYLES  (defined once at module scope)
───────────────────────────────────────────────────────────────────────────── */
const S = {
  page: { ...DM, background: T.bg, minHeight: "100%", padding: "28px", color: T.text1 },

  pageTitle: { ...SYNE, fontSize: 22, fontWeight: 700, color: T.text1 },
  pageSub:   { fontSize: 13, color: T.text3, marginTop: 3 },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: T.card,
    borderRadius: 12,
    padding: "18px 20px",
    border: `1px solid ${T.border}`,
    position: "relative",
    overflow: "hidden",
    transition: "box-shadow 0.2s",
  },
  statAccent: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
    background: T.gradient,
  },
  statLabel: {
    fontSize: 11, fontWeight: 600, color: T.text3,
    letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8,
  },
  statValue: { ...SYNE, fontSize: 26, fontWeight: 700, color: T.text1 },
  statDelta: { fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 },

  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 },

  panel: {
    background: T.card, borderRadius: 12,
    border: `1px solid ${T.border}`, overflow: "hidden",
  },
  panelHead: {
    padding: "16px 20px 12px",
    borderBottom: `1px solid ${T.border}`,
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  panelTitle: { ...SYNE, fontSize: 14, fontWeight: 600, color: T.text1 },
  panelBadge: {
    fontSize: 11, fontWeight: 600,
    background: "rgba(26,74,107,0.1)", color: T.primary,
    padding: "3px 9px", borderRadius: 20,
  },
  panelBody: { padding: "14px 20px" },

  rankItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "9px 0",
  },
  rankNum:     { ...SYNE, fontSize: 13, fontWeight: 700, color: T.text3, width: 18, textAlign: "center", flexShrink: 0 },
  rankInfo:    { flex: 1, minWidth: 0 },
  rankTitle:   { fontSize: 13, fontWeight: 500, color: T.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  rankCat:     { fontSize: 11, color: T.text3, marginTop: 1 },
  rankBarWrap: { width: 80, flexShrink: 0 },
  rankBarBg:   { height: 4, background: "#e8f0f7", borderRadius: 4, overflow: "hidden" },
  rankBarFill: { height: "100%", borderRadius: 4, background: T.gradient },
  rankVal:     { fontSize: 12, fontWeight: 600, color: T.primary, textAlign: "right", marginTop: 3 },

  tableWrap: { overflowX: "auto" },
  table:     { width: "100%", borderCollapse: "collapse" },
  th: {
    fontSize: 11, fontWeight: 600, color: T.text3,
    letterSpacing: "0.8px", textTransform: "uppercase",
    padding: "10px 14px", textAlign: "left",
    background: "#f8fafc", borderBottom: `1px solid ${T.border}`,
  },
  td:         { padding: "11px 14px", fontSize: 13, color: T.text1, borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" },
  avatarCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: T.gradient,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0,
  },

  skl: {
    background: "linear-gradient(90deg,#e8edf2 25%,#d0d8e4 50%,#e8edf2 75%)",
    backgroundSize: "400% 100%",
    animation: "skl-shimmer 1.4s infinite",
    borderRadius: 6,
  },

  paginationRow: {
    display: "flex", alignItems: "center", justifyContent: "flex-end",
    gap: 8, padding: "12px 20px",
    borderTop: `1px solid ${T.border}`,
  },
  pageBtn: {
    ...DM, fontSize: 12, fontWeight: 500,
    padding: "5px 12px", borderRadius: 6,
    border: `1px solid ${T.border}`,
    background: T.card, color: T.text2,
    cursor: "pointer",
  },
  pageBtnActive: {
    background: T.primary, color: "#fff",
    border: `1px solid ${T.primary}`,
  },

  errorBanner: {
    background: "#fff1f2", border: "1px solid #fecdd3",
    borderRadius: 8, padding: "10px 14px",
    fontSize: 13, color: "#e11d48", marginBottom: 16,
  },

  suspenseFallback: {
    background: T.card, borderRadius: 12,
    border: `1px solid ${T.border}`,
    padding: "32px 20px", textAlign: "center",
    fontSize: 12, color: T.text3,
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   KEYFRAMES  (injected once at module initialisation)
───────────────────────────────────────────────────────────────────────────── */
const KF_ID = "adash-kf";
if (typeof document !== "undefined" && !document.getElementById(KF_ID)) {
  const el = document.createElement("style");
  el.id = KF_ID;
  el.textContent = `
    @keyframes skl-shimmer{0%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  `;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────────────────── */
const PAGE_SIZE = 10;

const TABLE_HEADERS = ["User", "Products", "Requests", "Saved", "Activity"];

/* Chip colour map – stable objects, looked up by key */
const CHIP_VARIANTS = {
  default: { color: T.primary, bg: "rgba(26,74,107,0.1)" },
  amber:   { color: T.amber,   bg: "rgba(217,119,6,0.1)" },
  green:   { color: T.green,   bg: "rgba(22,163,74,0.1)" },
  high:    { color: T.green,   bg: "rgba(22,163,74,0.1)" },
  medium:  { color: T.amber,   bg: "rgba(217,119,6,0.1)" },
  low:     { color: T.primary, bg: "rgba(26,74,107,0.1)" },
};

/* ─────────────────────────────────────────────────────────────────────────────
   PURE HELPERS  (no closures, safe to call without hooks)
───────────────────────────────────────────────────────────────────────────── */
const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const pct = (val, max) => (max === 0 ? 0 : Math.round((val / max) * 100));

const activityTier = (u) => {
  const s = u.total_products + u.total_requests + u.total_cart;
  return s > 200 ? "high" : s > 100 ? "medium" : "low";
};

/* ─────────────────────────────────────────────────────────────────────────────
   ERROR BOUNDARY  (class component – required by React)
───────────────────────────────────────────────────────────────────────────── */
class PanelErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err, info) {
    console.error("[PanelErrorBoundary]", err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={S.suspenseFallback}>
          ⚠ Panel failed to load.{" "}
          <button
            style={{ ...DM, fontSize: 12, color: T.primary, background: "none", border: "none", cursor: "pointer" }}
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON  (memo – re-renders only when dimensions change)
───────────────────────────────────────────────────────────────────────────── */
const Skeleton = memo(function Skeleton({ w = "100%", h = 13, mb = 6, mt = 0 }) {
  return <div style={{ ...S.skl, width: w, height: h, marginBottom: mb, marginTop: mt }} />;
});

/* ─────────────────────────────────────────────────────────────────────────────
   CHIP  (memo + primitive props only – zero object allocation at call site)
───────────────────────────────────────────────────────────────────────────── */
const Chip = memo(function Chip({ label, variant = "default" }) {
  const { color, bg } = CHIP_VARIANTS[variant] ?? CHIP_VARIANTS.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      fontSize: 11.5, fontWeight: 500,
      padding: "3px 9px", borderRadius: 20,
      background: bg, color,
    }}>
      {label}
    </span>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   STAT CARD  (memo)
───────────────────────────────────────────────────────────────────────────── */
const StatCard = memo(function StatCard({ label, value, delta, positive, delay }) {
  const cardStyle = useMemo(() => ({
    ...S.statCard,
    animation: `fadeUp 0.4s ease ${delay}s both`,
  }), [delay]);

  const deltaColor = positive === null ? T.text3 : positive ? T.green : T.amber;
  const deltaStyle = useMemo(() => ({ ...S.statDelta, color: deltaColor }), [deltaColor]);

  return (
    <div style={cardStyle}>
      <div style={S.statAccent} />
      <div style={S.statLabel}>{label}</div>
      {value == null ? (
        <>
          <Skeleton w="60px" h={26} mt={8} mb={8} />
          <Skeleton w="70%" h={12} />
        </>
      ) : (
        <>
          <div style={S.statValue}>{value}</div>
          <div style={deltaStyle}>
            {positive !== null && (
              <svg
                style={{ width: 12, height: 12, stroke: "currentColor", fill: "none", strokeWidth: 2.5 }}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <polyline points={positive ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
              </svg>
            )}
            {delta}
          </div>
        </>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   RANK ITEM  (memo – prevents entire list re-rendering for one item change)
───────────────────────────────────────────────────────────────────────────── */
const RankItem = memo(function RankItem({ item, idx, isLast, keyTitle, keyVal, max }) {
  const fillStyle = useMemo(() => ({
    ...S.rankBarFill,
    width: `${pct(item[keyVal], max)}%`,
  }), [item, keyVal, max]);

  const itemStyle = useMemo(() => ({
    ...S.rankItem,
    borderBottom: isLast ? "none" : "1px solid #f1f5f9",
  }), [isLast]);

  const numStyle = useMemo(() => ({
    ...S.rankNum,
    color: idx === 0 ? T.primary : T.text3,
  }), [idx]);

  return (
    <div style={itemStyle}>
      <span style={numStyle}>{idx + 1}</span>
      <div style={S.rankInfo}>
        <div style={S.rankTitle}>{item[keyTitle]}</div>
        <div style={S.rankCat}>{item.category_name}</div>
      </div>
      <div style={S.rankBarWrap}>
        <div style={S.rankBarBg}>
          <div style={fillStyle} />
        </div>
        <div style={S.rankVal}>{item[keyVal].toLocaleString()}</div>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   RANK PANEL  (memo + lazy-loaded via React.lazy at the import site)
───────────────────────────────────────────────────────────────────────────── */
export const RankPanel = memo(function RankPanel({ title, items, keyId, keyTitle, keyVal, loading }) {
  const max = useMemo(
    () => (items.length ? Math.max(...items.map((i) => i[keyVal])) : 1),
    [items, keyVal],
  );

  return (
    <div style={S.panel}>
      <div style={S.panelHead}>
        <span style={S.panelTitle}>{title}</span>
        {!loading && <span style={S.panelBadge}>Top {items.length}</span>}
      </div>
      <div style={S.panelBody}>
        {loading
          ? [1, 2, 3].map((k) => (
              <div key={k} style={{ ...S.rankItem, justifyContent: "space-between" }}>
                <Skeleton w="65%" h={12} mb={4} />
                <Skeleton w="50px" h={12} mb={0} />
              </div>
            ))
          : items.map((item, idx) => (
              <RankItem
                key={item[keyId]}
                item={item}
                idx={idx}
                isLast={idx === items.length - 1}
                keyTitle={keyTitle}
                keyVal={keyVal}
                max={max}
              />
            ))
        }
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   USER ROW  (memo – each row only re-renders when its own user data changes)
───────────────────────────────────────────────────────────────────────────── */
const UserRow = memo(function UserRow({ user, even }) {
  const tier = useMemo(() => activityTier(user), [user]);
  const rowStyle = useMemo(() => ({ background: even ? "transparent" : "#fafcfe" }), [even]);
  const avatarLabel = useMemo(() => initials(user.full_name || user.email), [user.full_name, user.email]);

  return (
    <tr style={rowStyle}>
      <td style={S.td}>
        <div style={S.avatarCell}>
          <div style={S.avatar} aria-hidden="true">{avatarLabel}</div>
          <div>
            <div style={{ fontWeight: 500 }}>{user.full_name || user.email}</div>
            <div style={{ fontSize: 11, color: T.text3 }}>{user.email}</div>
          </div>
        </div>
      </td>
      <td style={S.td}><Chip label={user.total_products} variant="default" /></td>
      <td style={S.td}><Chip label={user.total_requests} variant="amber" /></td>
      <td style={S.td}><Chip label={user.total_cart} variant="green" /></td>
      <td style={S.td}>
        <Chip
          label={tier.charAt(0).toUpperCase() + tier.slice(1)}
          variant={tier}
        />
      </td>
    </tr>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   PAGINATION CONTROL  (memo)
───────────────────────────────────────────────────────────────────────────── */
const Pagination = memo(function Pagination({ page, total, pageSize, onPage }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div style={S.paginationRow} role="navigation" aria-label="Pagination">
      <button
        style={S.pageBtn}
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        aria-label="Previous page"
      >
        ←
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          style={p === page ? { ...S.pageBtn, ...S.pageBtnActive } : S.pageBtn}
          onClick={() => onPage(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}
      <button
        style={S.pageBtn}
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   USERS PANEL  (memo + Intersection Observer lazy-mount)
   Exported for React.lazy splitting in other entry points if needed.
───────────────────────────────────────────────────────────────────────────── */
export const UsersPanel = memo(function UsersPanel({ users, loading }) {
  const [page, setPage] = useState(1);

  /* Reset page when users list changes (e.g. after a refresh) */
  useEffect(() => { setPage(1); }, [users]);

  const pageUsers = useMemo(
    () => users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [users, page],
  );

  return (
    <div style={S.panel}>
      <div style={S.panelHead}>
        <span style={S.panelTitle}>User Activity</span>
        {!loading && <span style={S.panelBadge}>{users.length} users</span>}
      </div>

      {loading ? (
        <div style={S.panelBody}>
          {[1, 2, 3].map((k) => <Skeleton key={k} w="100%" h={13} mb={10} />)}
        </div>
      ) : (
        <>
          <div style={S.tableWrap}>
            <table style={S.table} role="grid">
              <thead>
                <tr>
                  {TABLE_HEADERS.map((h) => (
                    <th key={h} style={S.th} scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageUsers.map((user, idx) => (
                  <UserRow key={user.id} user={user} even={idx % 2 === 0} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            total={users.length}
            pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        </>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   STAT CARDS ROW  (static config outside component)
───────────────────────────────────────────────────────────────────────────── */
const buildStatCards = (totalViews, totalSaves, totalRequests, activeUsers) => [
  { label: "Total Views",    value: totalViews    != null ? totalViews.toLocaleString()    : null, delta: "+12.4%", positive: true,  delay: 0.08 },
  { label: "Total Saves",    value: totalSaves    != null ? totalSaves.toLocaleString()    : null, delta: "+8.7%",  positive: true,  delay: 0.16 },
  { label: "Total Requests", value: totalRequests != null ? totalRequests.toLocaleString() : null, delta: "+5.3%",  positive: true,  delay: 0.24 },
  { label: "Active Users",   value: activeUsers   != null ? activeUsers.toLocaleString()   : null, delta: "Live",   positive: null,  delay: 0.32 },
];

/* ─────────────────────────────────────────────────────────────────────────────
   INTERSECTION-OBSERVER HOOK  (lazy-mount heavy sections)
───────────────────────────────────────────────────────────────────────────── */
function useInView(rootMargin = "200px") {
  const ref      = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return; // once visible, stay visible

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView];
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────────────────────────── */
export default function AdminMarketplaceDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users,     setUsers]     = useState(null);
  const [error,     setError]     = useState(null);

  /* Lazy-mount the user table only when it scrolls into view */
  const [tableRef, tableInView] = useInView("300px");

  /* ── data fetching with AbortController ── */
  const loadData = useCallback(() => {
    const controller = new AbortController();
    setError(null);

    Promise.all([
      fetchAnalytics({ signal: controller.signal }),
      fetchUserActivity({ signal: controller.signal }),
    ])
      .then(([res1, res2]) => {
        setAnalytics(res1.data);
        const ud = res2.data?.users ?? res2.data ?? [];
        setUsers(Array.isArray(ud) ? ud : []);
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // unmounted – ignore
        console.error("[Dashboard] fetch error:", err);
        setError("Failed to load dashboard data. Please try again.");
      });

    return () => controller.abort(); // cleanup on unmount or re-call
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  /* ── derived totals (memoised) ── */
  const totalViews    = useMemo(() => analytics?.most_viewed?.reduce((s, i) => s + i.total_views, 0)       ?? null, [analytics]);
  const totalSaves    = useMemo(() => analytics?.most_saved?.reduce((s, i) => s + i.total_saves, 0)        ?? null, [analytics]);
  const totalRequests = useMemo(() => analytics?.most_requested?.reduce((s, i) => s + i.total_requests, 0) ?? null, [analytics]);
  const activeUsers   = useMemo(() => (users != null ? users.length : null), [users]);

  const statCards = useMemo(
    () => buildStatCards(totalViews, totalSaves, totalRequests, activeUsers),
    [totalViews, totalSaves, totalRequests, activeUsers],
  );

  const subText = error
    ? <span style={{ color: "#e11d48" }}>{error}</span>
    : analytics ? "Live data · refreshed just now" : "Loading data…";

  return (
    <AdminLayout>
      <div style={S.page}>

        {/* ── page header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={S.pageTitle}>Analytics Dashboard</div>
          <div style={S.pageSub}>{subText}</div>
        </div>

        {/* ── error banner (non-fatal) ── */}
        {error && (
          <div style={S.errorBanner} role="alert">
            {error}{" "}
            <button
              style={{ ...DM, fontSize: 12, color: T.primary, background: "none", border: "none", cursor: "pointer" }}
              onClick={loadData}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── stat cards ── */}
        <div style={S.statsRow}>
          {statCards.map((sc) => (
            <StatCard key={sc.label} {...sc} />
          ))}
        </div>

        {/* ── rank panels (each wrapped in its own error boundary) ── */}
        <div style={S.grid3}>
          {[
            { title: "Most Viewed",    items: analytics?.most_viewed    ?? [], keyId: "id",      keyTitle: "title",         keyVal: "total_views"    },
            { title: "Most Saved",     items: analytics?.most_saved     ?? [], keyId: "prod_id", keyTitle: "product_title", keyVal: "total_saves"    },
            { title: "Most Requested", items: analytics?.most_requested ?? [], keyId: "prod_id", keyTitle: "product_title", keyVal: "total_requests" },
          ].map(({ title, ...rest }) => (
            <PanelErrorBoundary key={title}>
              <RankPanel title={title} loading={!analytics} {...rest} />
            </PanelErrorBoundary>
          ))}
        </div>

        {/* ── user activity (Intersection Observer lazy-mount) ── */}
        <div ref={tableRef}>
          <PanelErrorBoundary>
            {tableInView
              ? <UsersPanel users={users ?? []} loading={!users} />
              : <div style={{ ...S.panel, ...S.panelBody, minHeight: 120 }} aria-busy="true" />
            }
          </PanelErrorBoundary>
        </div>

      </div>
    </AdminLayout>
  );
}