import { useEffect, useState, useCallback } from "react";
import { fetchAnalytics, fetchUserActivity } from "./Api/analyticsApi";
import AdminLayout from "../AdminLayout";

/* ─── theme ─────────────────────────────────────────────────────────────── */
const T = {
  primary:     "#1a4a6b",
  dark:        "#0d2f45",
  mid:         "#1e5278",
  gradient:    "linear-gradient(135deg, #0d2f45 0%, #1a4a6b 50%, #1e5278 100%)",
  shadow:      "rgba(13,47,69,0.18)",
  accent:      "#4db8ff",
  bg:          "#f0f5f9",
  card:        "#ffffff",
  border:      "#d1dce8",
  text1:       "#0d2035",
  text2:       "#3d5a73",
  text3:       "#7a9bb5",
  green:       "#16a34a",
  amber:       "#d97706",
};

/* ─── fonts (add to your index.html <head> if not present) ──────────────── */
// <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

/* ─── shared style helpers ───────────────────────────────────────────────── */
const SYNE  = { fontFamily: "'Syne', sans-serif" };
const DM    = { fontFamily: "'DM Sans', sans-serif" };

const styles = {
  page: {
    ...DM,
    background: T.bg,
    minHeight: "100%",
    padding: "28px",
    color: T.text1,
  },
  /* ── page header ── */
  pageTitle: { ...SYNE, fontSize: 22, fontWeight: 700, color: T.text1 },
  pageSub:   { fontSize: 13, color: T.text3, marginTop: 3 },

  /* ── stat cards ── */
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
  statIcon: {
    position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
    width: 40, height: 40, borderRadius: 10,
    background: "linear-gradient(135deg,rgba(26,74,107,0.08),rgba(30,82,120,0.14))",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  statLabel: {
    fontSize: 11, fontWeight: 600, color: T.text3,
    letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8,
  },
  statValue: { ...SYNE, fontSize: 26, fontWeight: 700, color: T.text1 },
  statDelta: { fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 },

  /* ── panels ── */
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 },
  panel: {
    background: T.card,
    borderRadius: 12,
    border: `1px solid ${T.border}`,
    overflow: "hidden",
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

  /* ── rank rows ── */
  rankItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "9px 0", borderBottom: `1px solid #f1f5f9`,
  },
  rankNum: { ...SYNE, fontSize: 13, fontWeight: 700, color: T.text3, width: 18, textAlign: "center", flexShrink: 0 },
  rankInfo: { flex: 1, minWidth: 0 },
  rankTitle: { fontSize: 13, fontWeight: 500, color: T.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  rankCat: { fontSize: 11, color: T.text3, marginTop: 1 },
  rankBarWrap: { width: 80, flexShrink: 0 },
  rankBarBg: { height: 4, background: "#e8f0f7", borderRadius: 4, overflow: "hidden" },
  rankBarFill: { height: "100%", borderRadius: 4, background: T.gradient },
  rankVal: { fontSize: 12, fontWeight: 600, color: T.primary, textAlign: "right", marginTop: 3 },

  /* ── user table ── */
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    fontSize: 11, fontWeight: 600, color: T.text3,
    letterSpacing: "0.8px", textTransform: "uppercase",
    padding: "10px 14px", textAlign: "left",
    background: "#f8fafc", borderBottom: `1px solid ${T.border}`,
  },
  td: { padding: "11px 14px", fontSize: 13, color: T.text1, borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" },
  avatarCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: "50%",
    background: T.gradient,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontSize: 12, fontWeight: 600, flexShrink: 0,
  },

  /* ── skeleton ── */
  skl: {
    background: "linear-gradient(90deg,#e8edf2 25%,#d0d8e4 50%,#e8edf2 75%)",
    backgroundSize: "400% 100%",
    animation: "skl-shimmer 1.4s infinite",
    borderRadius: 6,
  },
};

/* ─── keyframes injected once ────────────────────────────────────────────── */
const KEYFRAMES = `
@keyframes skl-shimmer{0%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
`;
if (typeof document !== "undefined" && !document.getElementById("dash-kf")) {
  const s = document.createElement("style");
  s.id = "dash-kf"; s.textContent = KEYFRAMES;
  document.head.appendChild(s);
}

/* ─── tiny helpers ───────────────────────────────────────────────────────── */
const initials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

const pct = (val, max) => Math.round((val / max) * 100);

function Skeleton({ w = "100%", h = 13, mb = 6, mt = 0 }) {
  return <div style={{ ...styles.skl, width: w, height: h, marginBottom: mb, marginTop: mt }} />;
}

function Chip({ label, color = T.primary, bg = "rgba(26,74,107,0.1)" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11.5, fontWeight: 500, padding: "3px 9px", borderRadius: 20, background: bg, color }}>
      {label}
    </span>
  );
}

/* ─── stat card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, delta, positive, delay }) {
  return (
    <div style={{ ...styles.statCard, animation: `fadeUp 0.4s ease ${delay}s both` }}>
      <div style={styles.statAccent} />
      <div style={styles.statLabel}>{label}</div>
      {value === null
        ? <><Skeleton w="60px" h={26} mt={8} mb={8} /><Skeleton w="70%" h={12} /></>
        : <>
            <div style={styles.statValue}>{value}</div>
            <div style={{ ...styles.statDelta, color: positive === null ? T.text3 : positive ? T.green : T.amber }}>
              {positive !== null && (
                <svg style={{ width: 12, height: 12, stroke: "currentColor", fill: "none", strokeWidth: 2.5 }} viewBox="0 0 24 24">
                  <polyline points={positive ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                </svg>
              )}
              {delta}
            </div>
          </>
      }
    </div>
  );
}

/* ─── rank panel ─────────────────────────────────────────────────────────── */
function RankPanel({ title, items, keyId, keyTitle, keyVal, loading }) {
  const max = items.length ? Math.max(...items.map((i) => i[keyVal])) : 1;
  return (
    <div style={styles.panel}>
      <div style={styles.panelHead}>
        <span style={styles.panelTitle}>{title}</span>
        {!loading && <span style={styles.panelBadge}>Top {items.length}</span>}
      </div>
      <div style={styles.panelBody}>
        {loading
          ? [1,2,3].map((k) => (
              <div key={k} style={{ ...styles.rankItem, justifyContent: "space-between" }}>
                <Skeleton w="65%" h={12} mb={4} />
                <Skeleton w="50px" h={12} mb={0} />
              </div>
            ))
          : items.map((item, idx) => (
              <div key={item[keyId]} style={{ ...styles.rankItem, borderBottom: idx === items.length - 1 ? "none" : "1px solid #f1f5f9" }}>
                <span style={{ ...styles.rankNum, color: idx === 0 ? T.primary : T.text3 }}>{idx + 1}</span>
                <div style={styles.rankInfo}>
                  <div style={styles.rankTitle}>{item[keyTitle]}</div>
                  <div style={styles.rankCat}>{item.category_name}</div>
                </div>
                <div style={styles.rankBarWrap}>
                  <div style={styles.rankBarBg}>
                    <div style={{ ...styles.rankBarFill, width: `${pct(item[keyVal], max)}%` }} />
                  </div>
                  <div style={styles.rankVal}>{item[keyVal].toLocaleString()}</div>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}

/* ─── user activity table ────────────────────────────────────────────────── */
function UsersPanel({ users, loading }) {
  const score = (u) => u.total_products + u.total_requests + u.total_cart;
  const actChip = (u) => {
    const s = score(u);
    return s > 200
      ? { label: "High",   color: T.green,  bg: "rgba(22,163,74,0.1)" }
      : s > 100
      ? { label: "Medium", color: T.amber,  bg: "rgba(217,119,6,0.1)" }
      : { label: "Low",    color: T.primary, bg: "rgba(26,74,107,0.1)" };
  };

  return (
    <div style={styles.panel}>
      <div style={styles.panelHead}>
        <span style={styles.panelTitle}>User Activity</span>
        {!loading && <span style={styles.panelBadge}>{users.length} users</span>}
      </div>
      {loading ? (
        <div style={styles.panelBody}>
          {[1, 2, 3].map((k) => <Skeleton key={k} w="100%" h={13} mb={10} />)}
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["User", "Products", "Requests", "Saved", "Activity"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => {
                const chip = actChip(user);
                return (
                  <tr key={user.id} style={{ background: idx % 2 === 0 ? "transparent" : "#fafcfe" }}>
                    <td style={styles.td}>
                      <div style={styles.avatarCell}>
                        <div style={styles.avatar}>{initials(user.full_name || user.email)}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{user.full_name || user.email}</div>
                          <div style={{ fontSize: 11, color: T.text3 }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}><Chip label={user.total_products} /></td>
                    <td style={styles.td}><Chip label={user.total_requests} color={T.amber} bg="rgba(217,119,6,0.1)" /></td>
                    <td style={styles.td}><Chip label={user.total_cart} color={T.green} bg="rgba(22,163,74,0.1)" /></td>
                    <td style={styles.td}><Chip label={chip.label} color={chip.color} bg={chip.bg} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── main dashboard ─────────────────────────────────────────────────────── */
export default function AdminMarketplaceDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers]         = useState(null);
  const [error, setError]         = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [res1, res2] = await Promise.all([fetchAnalytics(), fetchUserActivity()]);
      setAnalytics(res1.data);
      const ud = res2.data?.users ?? res2.data ?? [];
      setUsers(Array.isArray(ud) ? ud : []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data. Please try again.");
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* derived totals (only when data is ready) */
  const totalViews    = analytics ? analytics.most_viewed?.reduce((s, i) => s + i.total_views, 0)       ?? 0 : null;
  const totalSaves    = analytics ? analytics.most_saved?.reduce((s, i) => s + i.total_saves, 0)        ?? 0 : null;
  const totalRequests = analytics ? analytics.most_requested?.reduce((s, i) => s + i.total_requests, 0) ?? 0 : null;
  const activeUsers   = users ? users.length : null;

  const statCards = [
    { label: "Total Views",    value: totalViews    !== null ? totalViews.toLocaleString()    : null, delta: "+12.4%", positive: true,  delay: 0.08 },
    { label: "Total Saves",    value: totalSaves    !== null ? totalSaves.toLocaleString()    : null, delta: "+8.7%",  positive: true,  delay: 0.16 },
    { label: "Total Requests", value: totalRequests !== null ? totalRequests.toLocaleString() : null, delta: "+5.3%",  positive: true,  delay: 0.24 },
    { label: "Active Users",   value: activeUsers   !== null ? activeUsers.toLocaleString()   : null, delta: "Live",   positive: null,  delay: 0.32 },
  ];

  return (
    <AdminLayout>
      <div style={styles.page}>

        {/* header */}
        <div style={{ marginBottom: 24 }}>
          <div style={styles.pageTitle}>Analytics Dashboard</div>
          <div style={styles.pageSub}>
            {error
              ? <span style={{ color: "#e11d48" }}>{error}</span>
              : analytics ? "Live data · refreshed just now" : "Loading data…"
            }
          </div>
        </div>

        {/* stat cards */}
        <div style={styles.statsRow}>
          {statCards.map((sc) => <StatCard key={sc.label} {...sc} />)}
        </div>

        {/* rank panels */}
        <div style={styles.grid3}>
          <RankPanel
            title="Most Viewed"
            items={analytics?.most_viewed ?? []}
            keyId="id" keyTitle="title" keyVal="total_views"
            loading={!analytics}
          />
          <RankPanel
            title="Most Saved"
            items={analytics?.most_saved ?? []}
            keyId="prod_id" keyTitle="product_title" keyVal="total_saves"
            loading={!analytics}
          />
          <RankPanel
            title="Most Requested"
            items={analytics?.most_requested ?? []}
            keyId="prod_id" keyTitle="product_title" keyVal="total_requests"
            loading={!analytics}
          />
        </div>

        {/* user activity */}
        <UsersPanel users={users ?? []} loading={!users} />

      </div>
    </AdminLayout>
  );
}