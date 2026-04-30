/**
 * AdminHome — production-optimised dashboard
 *
 * Key changes vs. original:
 *  1. Removed duplicate `if (!data)` guard
 *  2. All pure sub-components wrapped in React.memo → no re-renders unless props change
 *  3. Recharts lazy-loaded behind React.lazy + Suspense (~200 KB saved on initial bundle)
 *  4. chartData / fmt derived with useMemo — never recomputed unless `data` changes
 *  5. Two countdown/refresh timers merged into one useEffect; both are cleaned up together
 *  6. Error state with retry button — avoids silent failures in production
 *  7. Font <link> injected once via useEffect; removed from render path
 *  8. Module-level constants (C, ROLES, AVATAR_PAIRS, BAR_COLORS) never recreated
 *  9. `fetchData` dependency-array is stable thanks to original useCallback
 * 10. `opacity:0` on row items removed in favour of animation fill-mode `both`
 *     (avoids a flash of invisible content if animation is skipped/slow)
 */

import {
  useEffect, useState, useRef, useCallback, useMemo,
  lazy, Suspense, memo,
} from "react";
import { AUTH_API } from "../api/api";
import AdminLayout from "./AdminLayout";
import {
  Users, Building2, Package, Layers,
  Star, Bookmark, Zap, Flag, RefreshCw,
} from "lucide-react";

/* ─── Lazy-load recharts: not needed until data arrives ────────── */
const LazyBarChart = lazy(() =>
  import("recharts").then(m => ({
    default: function BarChartWrapper({ data, colors, border, C }) {
      const {
        BarChart, Bar, XAxis, YAxis,
        Tooltip, ResponsiveContainer, Cell, CartesianGrid,
      } = m;
      return (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            barCategoryGap="40%"
            margin={{ top: 10, right: 4, left: -16, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={border} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              axisLine={{ stroke: border }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: C.textDim, fontSize: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<BarTip C={C} />} cursor={{ fill: `${C.navDark}06` }} />
            <Bar dataKey="views" radius={[8, 8, 3, 3]}>
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    },
  }))
);

/* ─── Module-level constants — never re-created on render ───────── */
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

const C = {
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
};

const BAR_COLORS  = [C.navBright, C.rose, C.amber, C.teal, C.indigo];
const AVATAR_PAIRS = [
  ["#b91c1c", "#dc2626"],
  ["#92400e", "#d97706"],
  ["#1e40af", "#3b82f6"],
  ["#065f46", "#10b981"],
];
const ROLES = {
  admin:   { bg: "#ffe4e6", color: "#9f1239", label: "Admin"   },
  company: { bg: "#fef3c7", color: "#92400e", label: "Company" },
  user:    { bg: "#d1fae5", color: "#065f46", label: "User"    },
};

const GLOBAL_CSS = `
  @keyframes slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes rowIn    { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:translateX(0)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.3} }
`;

/* ─── Animated counter ──────────────────────────────────────────── */
const Counter = memo(function Counter({ to, duration = 800 }) {
  const [v, setV]   = useState(0);
  const prevRef     = useRef(0);
  const rafRef      = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = to;
    const t0 = performance.now();
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const p    = Math.min((now - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setV(Math.round(from + (to - from) * ease));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, duration]);

  return <>{v}</>;
});

/* ─── Decorative wave ───────────────────────────────────────────── */
const CardWave = memo(function CardWave({ color }) {
  return (
    <svg
      aria-hidden="true"
      style={{ position: "absolute", bottom: 0, left: 0, width: "100%", pointerEvents: "none" }}
      viewBox="0 0 300 48"
      preserveAspectRatio="none"
      height="48"
    >
      <path d="M0,28 C60,8 120,42 180,22 C230,6 270,36 300,18 L300,48 L0,48 Z" fill={color} opacity="0.07" />
      <path d="M0,38 C80,18 160,48 240,30 C270,22 288,38 300,32 L300,48 L0,48 Z" fill={color} opacity="0.05" />
    </svg>
  );
});

/* ─── KPI card ──────────────────────────────────────────────────── */
const KpiCard = memo(function KpiCard({ icon, label, value, accent, delay, trend }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", overflow: "hidden",
        background: C.bgCard,
        border: `1px solid ${hov ? C.borderMid : C.border}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 16,
        padding: "20px 22px 22px",
        boxShadow: hov ? `0 8px 28px ${C.shadowHov}` : `0 2px 10px ${C.shadow}`,
        transition: "transform .22s ease, box-shadow .22s ease",
        transform: hov ? "translateY(-3px)" : "none",
        animation: `slideUp .5s ${delay}s cubic-bezier(.22,.61,.36,1) both`,
        cursor: "default",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <CardWave color={accent} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `${accent}15`, border: `1px solid ${accent}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            {icon}
          </div>
          {trend !== undefined && (
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: trend >= 0 ? C.emerald : C.rose,
              background: trend >= 0 ? "#d1fae5" : "#ffe4e6",
              borderRadius: 20, padding: "3px 8px",
            }}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div style={{
          fontSize: 38, fontWeight: 700, color: C.textH,
          lineHeight: 1, letterSpacing: "-1.5px",
          fontFamily: "'DM Serif Display', serif",
        }}>
          <Counter to={value} />
        </div>
        <div style={{
          fontSize: 12, color: C.textMid, marginTop: 6,
          fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          {label}
        </div>
      </div>
    </div>
  );
});

/* ─── Mini stat ─────────────────────────────────────────────────── */
const MiniStat = memo(function MiniStat({ icon, label, value, color, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        background: hov ? C.bgCardTint : C.bgCardWarm,
        border: `1px solid ${hov ? C.borderMid : C.border}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 14, padding: "14px 16px",
        boxShadow: hov ? `0 4px 16px ${C.shadow}` : "none",
        transition: "all .2s ease",
        animation: `slideUp .5s ${delay}s cubic-bezier(.22,.61,.36,1) both`,
        cursor: "default",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: 10, color: C.textDim,
          textTransform: "uppercase", letterSpacing: "0.08em",
          fontWeight: 600, marginBottom: 3,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 26, fontWeight: 700, color: C.textH, lineHeight: 1,
          fontFamily: "'DM Serif Display', serif",
        }}>
          <Counter to={value} />
        </div>
      </div>
    </div>
  );
});

/* ─── Bar tooltip ───────────────────────────────────────────────── */
const BarTip = memo(function BarTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.borderMid}`,
      borderRadius: 10, padding: "9px 14px",
      boxShadow: `0 4px 16px ${C.shadow}`,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 3 }}>{payload[0].payload.name}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.navDark }}>{payload[0].value} views</div>
    </div>
  );
});

/* ─── Chart skeleton while recharts loads ───────────────────────── */
function ChartSkeleton() {
  return (
    <div style={{
      height: 220, display: "flex", alignItems: "center",
      justifyContent: "center", gap: 8,
    }}>
      {[40, 80, 55, 95, 65].map((h, i) => (
        <div key={i} style={{
          width: 28, height: h, borderRadius: 6,
          background: `${C.navBright}20`,
          animation: `pulse 1.4s ${i * 0.1}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

/* ─── Spinner ───────────────────────────────────────────────────── */
function Spinner({ label = "Loading…" }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: 280, gap: 12,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: `3px solid ${C.border}`, borderTopColor: C.navBright,
        animation: "spin .8s linear infinite",
      }} />
      <span style={{ fontSize: 13, color: C.textDim }}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function AdminHome() {
  const [data, setData]         = useState(null);
  const [error, setError]       = useState(null);
  const [lastRefresh, setLast]  = useState(null);
  const [countdown, setCountdown] = useState(10);
  const [refreshing, setRefreshing] = useState(false);

  /* Inject font once — never on every render */
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  /* Inject keyframes once */
  useEffect(() => {
    if (document.getElementById("admin-home-styles")) return;
    const style = document.createElement("style");
    style.id = "admin-home-styles";
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    setError(null);
    try {
      const res = await AUTH_API.get("/admin/dashboard/");
      setData(res.data);
      setLast(new Date());
    } catch (err) {
      console.error(err);
      if (!silent) setError("Failed to load dashboard. Check your connection.");
    } finally {
      setRefreshing(false);
      setCountdown(10);
    }
  }, []);

  /* Initial load */
  useEffect(() => { fetchData(); }, [fetchData]);

  /* Auto-refresh + countdown — single effect, single cleanup */
  useEffect(() => {
    const refreshId  = setInterval(() => fetchData(true), 10_000);
    const countdownId = setInterval(() => setCountdown(c => (c <= 1 ? 10 : c - 1)), 1_000);
    return () => {
      clearInterval(refreshId);
      clearInterval(countdownId);
    };
  }, [fetchData]);

  /* Derived values — recomputed only when data changes */
  const chartData = useMemo(() => {
    const products =
      data?.top_products       ||
      data?.popular_products   ||
      data?.trending_products  ||
      [];
    if (!products.length) return [{ name: "No Data", views: 0 }];
    return products.map(p => ({
      name:  p.product_name || p.name || p.title || "Unnamed",
      views: p.view_count   || p.views || p.total_views || 0,
    }));
  }, [data]);

  const fmt = useMemo(() => (d) =>
    d
      ? d.toLocaleTimeString("en-GB", {
          timeZone: "Asia/Qatar",
          hour:     "2-digit",
          minute:   "2-digit",
          second:   "2-digit",
        })
      : "--:--:--",
  []);

  /* ── Loading ── */
  if (!data && !error) return <AdminLayout><Spinner label="Loading dashboard…" /></AdminLayout>;

  /* ── Error ── */
  if (error) return (
    <AdminLayout>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: 280, gap: 16,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <span style={{ fontSize: 15, color: C.rose, fontWeight: 600 }}>{error}</span>
        <button
          onClick={() => fetchData()}
          style={{
            padding: "9px 22px", borderRadius: 10, border: "none",
            background: C.navBright, color: "#fff", cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13, fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    </AdminLayout>
  );

  const hasCategoryViews = data.category_views?.length > 0 &&
    data.category_views.some(c => c.views > 0);

  return (
    <AdminLayout>
      <div style={{
        padding: "28px 32px 40px 28px",
        background: C.bg,
        minHeight: "100%",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* ── Header ──────────────────────────────────────────── */}
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
              Dashboard Overview
            </h1>
            <p style={{
              margin: "6px 0 0", fontSize: 13,
              color: C.textMid, fontWeight: 500, letterSpacing: "0.02em",
            }}>
              Daily Deals &nbsp;·&nbsp; Qatar &nbsp;·&nbsp; Admin Panel v1.0
            </p>
          </div>

          {/* Refresh control */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 14, padding: "10px 16px",
            boxShadow: `0 2px 8px ${C.shadow}`,
          }}>
            <button
              onClick={() => fetchData()}
              aria-label="Refresh dashboard"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                color: C.navMid, fontSize: 12, fontWeight: 600,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                padding: 0,
              }}
            >
              <RefreshCw
                size={13}
                style={{ animation: refreshing ? "spin .6s linear infinite" : "none" }}
              />
            </button>
            <div style={{ width: 1, height: 16, background: C.border }} />
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: 10, color: C.textDim,
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                Last updated
              </div>
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: C.textMid, fontVariantNumeric: "tabular-nums",
              }}>
                {fmt(lastRefresh)}
              </div>
            </div>
            {/* Countdown ring */}
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: C.bgCardTint,
              border: `2px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              <svg
                width="30" height="30" viewBox="0 0 30 30"
                aria-hidden="true"
                style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
              >
                <circle cx="15" cy="15" r="12" fill="none" stroke={C.border} strokeWidth="2" />
                <circle
                  cx="15" cy="15" r="12" fill="none"
                  stroke={C.navBright} strokeWidth="2"
                  strokeDasharray="75.4"
                  strokeDashoffset={75.4 - (countdown / 10) * 75.4}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset .9s linear" }}
                />
              </svg>
              <span style={{
                fontSize: 10, fontWeight: 700, color: C.navMid,
                position: "relative", zIndex: 1,
              }}>
                {countdown}
              </span>
            </div>
          </div>
        </div>

        {/* ── Primary KPI Cards ────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(172px,1fr))",
          gap: 16, marginBottom: 16,
        }}>
          <KpiCard delay={0.05} label="Total Accounts" value={data.total_users}      accent={C.rose}   icon={<Users     size={17} color={C.rose}   />} trend={12} />
          <KpiCard delay={0.10} label="Companies"      value={data.total_companies}  accent={C.amber}  icon={<Building2 size={17} color={C.amber}  />} trend={0}  />
          <KpiCard delay={0.15} label="Products"       value={data.total_products}   accent={C.teal}   icon={<Package   size={17} color={C.teal}   />} trend={5}  />
          <KpiCard delay={0.20} label="Categories"     value={data.total_categories} accent={C.indigo} icon={<Layers    size={17} color={C.indigo} />} trend={-2} />
        </div>

        {/* ── Secondary stats ──────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))",
          gap: 12, marginBottom: 26,
        }}>
          <MiniStat delay={0.25} label="Active Products" value={data.active_products}      color={C.amber}  icon={<Zap      size={14} color={C.amber}  />} />
          <MiniStat delay={0.28} label="Featured"        value={data.featured_products}    color={C.orange} icon={<Star     size={14} color={C.orange} />} />
          <MiniStat delay={0.31} label="Saved Products"  value={data.total_saved_products} color={C.violet} icon={<Bookmark size={14} color={C.violet} />} />
          <MiniStat delay={0.34} label="Reviews"         value={data.total_reviews}        color={C.rose}   icon={<Star     size={14} color={C.rose}   />} />
          <MiniStat delay={0.37} label="Flyers"          value={data.total_flyers}         color={C.teal}   icon={<Flag     size={14} color={C.teal}   />} />
        </div>

        {/* ── Charts + Users ───────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>

          {/* Bar chart — recharts is lazy-loaded */}
          <div style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "22px 22px 16px",
            boxShadow: `0 2px 10px ${C.shadow}`,
            animation: "slideUp .5s .44s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, fontFamily: "'DM Serif Display', serif" }}>
                  Views by Category
                </div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>total product views per category</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, color: C.navMid,
                background: `${C.navBright}12`,
                border: `1px solid ${C.navBright}25`,
                borderRadius: 10, padding: "4px 11px",
              }}>
                Bar chart
              </span>
            </div>

            {hasCategoryViews ? (
              <Suspense fallback={<ChartSkeleton />}>
                <LazyBarChart
                  data={data.category_views}
                  colors={BAR_COLORS}
                  border={C.border}
                  C={C}
                />
              </Suspense>
            ) : (
              <div style={{
                height: 220, display: "flex", alignItems: "center",
                justifyContent: "center", color: C.textDim,
                fontSize: 13, flexDirection: "column", gap: 8,
              }}>
                <Layers size={32} opacity={0.3} />
                <span>No category data available</span>
              </div>
            )}
          </div>

          {/* Recent users */}
          <div style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "22px 22px 20px",
            boxShadow: `0 2px 10px ${C.shadow}`,
            animation: "slideUp .5s .52s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.textH, fontFamily: "'DM Serif Display', serif" }}>
                  Recent Users
                </div>
                <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>latest registrations</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, color: C.navMid,
                background: `${C.navBright}12`,
                border: `1px solid ${C.navBright}25`,
                borderRadius: 10, padding: "4px 11px",
              }}>
                {data.recent_users.length} accounts
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.recent_users.map((u, i) => {
                const rc   = ROLES[u.role] || ROLES.user;
                const init = u.phone.replace(/\D/g, "").slice(-2);
                const [a1, a2] = AVATAR_PAIRS[i % AVATAR_PAIRS.length];
                return (
                  <div key={u.phone /* more stable than index */} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    background: i % 2 === 0 ? C.bgCardWarm : C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    animation: `rowIn .4s ${0.56 + i * 0.07}s ease both`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: `linear-gradient(135deg,${a1},${a2})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#fff",
                      boxShadow: `0 2px 8px ${a1}55`,
                    }}>
                      {init}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.textP, fontVariantNumeric: "tabular-nums" }}>
                        ···{u.phone.slice(-7)}
                      </div>
                      <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>
                        {u.phone.length} digit number
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      padding: "4px 12px", borderRadius: 20,
                      background: rc.bg, color: rc.color,
                      letterSpacing: "0.04em", textTransform: "capitalize",
                    }}>
                      {rc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}