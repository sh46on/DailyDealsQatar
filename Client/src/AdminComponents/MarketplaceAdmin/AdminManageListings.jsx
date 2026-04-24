import { useEffect, useState, useCallback } from "react";
import {
  fetchAdminListings,
  toggleListingStatus,
  deleteListing,
} from "./Api/adminListingsApi";
import AdminLayout from "../AdminLayout";

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  primary:         "#1a4a6b",
  primaryDark:     "#0d2f45",
  primaryMid:      "#1e5278",
  accent:          "#3b9edd",
  shadow:          "rgba(13,47,69,0.14)",
  shadowMd:        "rgba(13,47,69,0.22)",
  bg:              "#eef3f8",
  surface:         "#ffffff",
  surfaceAlt:      "#f8fafc",
  textMain:        "#0d2f45",
  textMuted:       "#6b8fa8",
  textLight:       "#a8c0d0",
  danger:          "#e05555",
  dangerBg:        "#fff0f0",
  success:         "#1aaa6b",
  successBg:       "#edfaf4",
  inactiveTxt:     "#9badb9",
  inactiveBg:      "#f5f7f9",
  border:          "#dde5ec",
  borderLight:     "#edf2f7",
  gradientHeader:  "linear-gradient(135deg,#0d2f45 0%,#1a4a6b 60%,#1e6090 100%)",
};

const PAGE_SIZE_OPTIONS = [6, 12, 18, 24];
const PAGE_SIZE_DEFAULT = 12;

// ─── Currency helper — Qatar Riyal ────────────────────────────────────────────
const fmt = (p) =>
  "ر.ق " + parseFloat(p).toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 14, strokeWidth = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    {Array.isArray(d)
      ? d.map((p, i) => <path key={i} d={p} />)
      : <path d={d} />}
  </svg>
);

const EyeIcon     = () => <Icon d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 100 6 3 3 0 000-6z"]} />;
const TrashIcon   = () => <Icon d={["M3 6h18","M19 6l-1 14H6L5 6","M10 11v6","M14 11v6","M9 6V4h6v2"]} />;
const GridIcon    = () => <Icon d={["M3 3h7v7H3z","M14 3h7v7h-7z","M3 14h7v7H3z","M14 14h7v7h-7z"]} />;
const ListIcon    = () => <Icon d={["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"]} />;
const SearchIcon  = () => <Icon d={["M11 4a7 7 0 100 14A7 7 0 0011 4z","M21 21l-4.35-4.35"]} />;
const ChevL       = () => <Icon d="M15 18l-6-6 6-6" />;
const ChevR       = () => <Icon d="M9 18l6-6-6-6" />;
const CheckIcon   = () => <Icon d="M20 6L9 17l-5-5" size={12} strokeWidth={2.5} />;
const MinusIcon   = () => <Icon d="M8 12h8" size={12} strokeWidth={2.5} />;
const RefreshIcon = () => <Icon d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" size={15} />;
const PackageIcon = () => <Icon d={["M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z","M16 3H8l-2 4h12l-2-4z"]} size={18} />;
const TickIcon    = () => <Icon d="M20 6L9 17l-5-5" size={18} strokeWidth={2.2} />;
const XCircle     = () => <Icon d={["M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2","M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"]} size={18} />;

// ─── Shared Styles ────────────────────────────────────────────────────────────
const chipStyle = {
  background: "rgba(26,74,107,0.07)", color: T.primary,
  padding: "3px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600,
  display: "inline-block", letterSpacing: "0.2px",
};

const btnBase = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
  padding: "7px 14px", borderRadius: 9,
  fontFamily: "'DM Sans',sans-serif", fontSize: 12.5, fontWeight: 600,
  cursor: "pointer", border: "none", transition: "all 0.18s ease",
  lineHeight: 1,
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ active }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: active ? T.successBg : T.inactiveBg,
    color: active ? T.success : T.inactiveTxt,
    whiteSpace: "nowrap", letterSpacing: "0.3px", textTransform: "uppercase",
    border: `1px solid ${active ? "rgba(26,170,107,0.2)" : "rgba(155,173,185,0.2)"}`,
  }}>
    <span style={{
      width: 5, height: 5, borderRadius: "50%",
      background: active ? T.success : T.inactiveTxt, flexShrink: 0,
    }} />
    {active ? "Active" : "Inactive"}
  </span>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, iconColor, iconBg, icon, accent }) => (
  <div style={{
    background: T.surface, borderRadius: 16, padding: "20px 22px",
    boxShadow: `0 2px 12px ${T.shadow}`,
    border: `1px solid ${T.border}`,
    position: "relative", overflow: "hidden",
    display: "flex", alignItems: "center", gap: 16,
  }}>
    {/* Subtle accent line */}
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 3,
      background: accent || `linear-gradient(90deg, ${iconColor}aa, ${iconColor}33)`,
    }} />
    <div style={{
      width: 48, height: 48, borderRadius: 13, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: iconBg, color: iconColor,
      boxShadow: `0 4px 12px ${iconBg}`,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 5, fontWeight: 500, letterSpacing: "0.4px", textTransform: "uppercase" }}>{label}</div>
      <div style={{
        fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 700,
        color: T.textMain, lineHeight: 1,
      }}>{value}</div>
    </div>
  </div>
);

// ─── Card Grid View ───────────────────────────────────────────────────────────
const CardGrid = ({ items, onToggle, onDelete }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
    gap: 18,
  }}>
    {items.map((item, idx) => (
      <div key={item.id} style={{
        background: T.surface, borderRadius: 18,
        boxShadow: `0 2px 16px ${T.shadow}`, overflow: "hidden",
        display: "flex", flexDirection: "column",
        border: `1px solid ${T.border}`,
        animation: `fadeUp 0.3s ease both`,
        animationDelay: `${idx * 35}ms`,
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${T.shadowMd}`; e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 16px ${T.shadow}`; e.currentTarget.style.transform = "translateY(0)"; }}
      >
        {/* Top accent bar */}
        <div style={{
          height: 4,
          background: item.is_active
            ? `linear-gradient(90deg, ${T.success}, ${T.accent})`
            : `linear-gradient(90deg, ${T.inactiveTxt}, #ccd5db)`,
        }} />

        <div style={{ padding: "18px 18px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ flex: 1, marginRight: 10 }}>
              <div style={{
                fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14.5,
                color: T.textMain, marginBottom: 3, lineHeight: 1.35,
              }}>
                {item.title}
              </div>
              <div style={{ fontSize: 11, color: T.textLight, fontWeight: 500 }}>ID #{item.id}</div>
            </div>
            <StatusBadge active={item.is_active} />
          </div>

          {/* Price */}
          <div style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 22,
            color: T.primary, margin: "4px 0 14px",
            letterSpacing: "-0.3px",
          }}>
            {fmt(item.price)}
          </div>

          {/* Meta chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            <span style={chipStyle}>{item.category_name}</span>
            <span style={{ ...chipStyle, background: "rgba(59,158,221,0.08)", color: T.accent }}>
              {item.seller_name}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Views + date */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 14, paddingBottom: 14, paddingTop: 4,
            borderBottom: `1px solid ${T.borderLight}`,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T.textMuted, fontWeight: 500 }}>
              <EyeIcon /> {item.view_count.toLocaleString()} views
            </span>
            <span style={{ fontSize: 11.5, color: T.textLight }}>{fmtDate(item.created_at)}</span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onToggle(item.id)}
              style={{
                ...btnBase, flex: 1,
                background: item.is_active ? T.dangerBg : T.successBg,
                color: item.is_active ? T.danger : T.success,
                border: `1.5px solid ${item.is_active ? "rgba(224,85,85,0.2)" : "rgba(26,170,107,0.2)"}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = item.is_active ? T.danger : T.success; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = item.is_active ? T.dangerBg : T.successBg; e.currentTarget.style.color = item.is_active ? T.danger : T.success; }}
            >
              {item.is_active ? <><MinusIcon /> Deactivate</> : <><CheckIcon /> Activate</>}
            </button>
            <button
              onClick={() => onDelete(item.id)}
              style={{ ...btnBase, padding: "7px 12px", border: `1.5px solid ${T.border}`, color: T.textLight, background: "transparent", borderRadius: 9 }}
              onMouseEnter={e => { e.currentTarget.style.background = T.dangerBg; e.currentTarget.style.color = T.danger; e.currentTarget.style.borderColor = "rgba(224,85,85,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textLight; e.currentTarget.style.borderColor = T.border; }}
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Table View ───────────────────────────────────────────────────────────────
const TableView = ({ items, onToggle, onDelete }) => (
  <div style={{
    background: T.surface, borderRadius: 18,
    boxShadow: `0 2px 16px ${T.shadow}`, overflow: "hidden",
    border: `1px solid ${T.border}`,
  }}>
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{
            background: "linear-gradient(90deg, #f0f5fa, #e8eef5)",
            borderBottom: `2px solid ${T.border}`,
          }}>
            {["ID", "Product", "Price", "Category", "Seller", "Views", "Status", "Created", "Actions"].map(h => (
              <th key={h} style={{
                padding: "14px 18px", textAlign: "left",
                fontSize: 10.5, fontWeight: 700, letterSpacing: "0.9px",
                textTransform: "uppercase", color: T.textMuted, whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id}
              style={{
                borderBottom: `1px solid ${T.borderLight}`,
                transition: "background 0.15s",
                animation: `fadeUp 0.25s ease both`,
                animationDelay: `${idx * 20}ms`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f6fafd"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <td style={{ padding: "14px 18px", fontSize: 12, color: T.textLight, fontWeight: 700 }}>
                #{item.id}
              </td>
              <td style={{ padding: "14px 18px", minWidth: 160 }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13.5, color: T.textMain, lineHeight: 1.3 }}>{item.title}</div>
              </td>
              <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: T.primary }}>
                  {fmt(item.price)}
                </span>
              </td>
              <td style={{ padding: "14px 18px" }}>
                <span style={chipStyle}>{item.category_name}</span>
              </td>
              <td style={{ padding: "14px 18px", fontSize: 13.5, color: T.textMain, fontWeight: 500, whiteSpace: "nowrap" }}>
                {item.seller_name}
              </td>
              <td style={{ padding: "14px 18px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: T.textMuted, whiteSpace: "nowrap" }}>
                  <EyeIcon /> {item.view_count.toLocaleString()}
                </span>
              </td>
              <td style={{ padding: "14px 18px" }}><StatusBadge active={item.is_active} /></td>
              <td style={{ padding: "14px 18px", fontSize: 12, color: T.textMuted, whiteSpace: "nowrap" }}>
                {fmtDate(item.created_at)}
              </td>
              <td style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => onToggle(item.id)}
                    style={{
                      ...btnBase, whiteSpace: "nowrap",
                      background: item.is_active ? T.dangerBg : T.successBg,
                      color: item.is_active ? T.danger : T.success,
                      border: `1.5px solid ${item.is_active ? "rgba(224,85,85,0.2)" : "rgba(26,170,107,0.2)"}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = item.is_active ? T.danger : T.success; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = item.is_active ? T.dangerBg : T.successBg; e.currentTarget.style.color = item.is_active ? T.danger : T.success; }}
                  >
                    {item.is_active ? <><MinusIcon /> Deactivate</> : <><CheckIcon /> Activate</>}
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    style={{ ...btnBase, padding: "7px 11px", border: `1.5px solid ${T.border}`, color: T.textLight, background: "transparent" }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.dangerBg; e.currentTarget.style.color = T.danger; e.currentTarget.style.borderColor = "rgba(224,85,85,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textLight; e.currentTarget.style.borderColor = T.border; }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Pagination — Prev / Next only ───────────────────────────────────────────
const Pagination = ({ page, totalPages, totalFiltered, perPage, onPage }) => {
  if (totalPages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to   = Math.min(page * perPage, totalFiltered);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginTop: 28, flexWrap: "wrap", gap: 12,
      background: T.surface, borderRadius: 14, padding: "14px 20px",
      border: `1px solid ${T.border}`,
      boxShadow: `0 2px 8px ${T.shadow}`,
    }}>
      {/* Info */}
      <span style={{ fontSize: 13, color: T.textMuted }}>
        Showing{" "}
        <strong style={{ color: T.textMain, fontWeight: 700 }}>{from}–{to}</strong>
        {" "}of{" "}
        <strong style={{ color: T.textMain, fontWeight: 700 }}>{totalFiltered}</strong>
        {" "}listings
      </span>

      {/* Page indicator + Prev / Next */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* Prev */}
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          style={{
            ...btnBase, padding: "7px 18px",
            background: T.surface,
            color: page === 1 ? T.textLight : T.primary,
            border: `1.5px solid ${page === 1 ? T.borderLight : T.border}`,
            cursor: page === 1 ? "not-allowed" : "pointer",
            opacity: page === 1 ? 0.5 : 1,
            fontWeight: 600,
          }}
          onMouseEnter={e => { if (page !== 1) { e.currentTarget.style.background = T.primary; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = T.primary; } }}
          onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = page === 1 ? T.textLight : T.primary; e.currentTarget.style.borderColor = page === 1 ? T.borderLight : T.border; }}
        >
          <ChevL /> Prev
        </button>

        {/* Page counter */}
        <span style={{
          fontSize: 13, color: T.textMuted, fontWeight: 600,
          padding: "7px 14px", background: T.bg, borderRadius: 9,
          border: `1.5px solid ${T.border}`, lineHeight: 1,
          display: "inline-flex", alignItems: "center",
        }}>
          Page <strong style={{ color: T.textMain, margin: "0 4px" }}>{page}</strong> of <strong style={{ color: T.textMain, marginLeft: 4 }}>{totalPages}</strong>
        </span>

        {/* Next */}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          style={{
            ...btnBase, padding: "7px 18px",
            background: T.surface,
            color: page === totalPages ? T.textLight : T.primary,
            border: `1.5px solid ${page === totalPages ? T.borderLight : T.border}`,
            cursor: page === totalPages ? "not-allowed" : "pointer",
            opacity: page === totalPages ? 0.5 : 1,
            fontWeight: 600,
          }}
          onMouseEnter={e => { if (page !== totalPages) { e.currentTarget.style.background = T.primary; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = T.primary; } }}
          onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = page === totalPages ? T.textLight : T.primary; e.currentTarget.style.borderColor = page === totalPages ? T.borderLight : T.border; }}
        >
          Next <ChevR />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminManageListings() {
  const [all,     setAll]     = useState([]);
  const [filter,  setFilter]  = useState("All");
  const [query,   setQuery]   = useState("");
  const [view,    setView]    = useState("grid");
  const [page,    setPage]    = useState(1);
  const [perPage, setPerPage] = useState(PAGE_SIZE_DEFAULT);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadListings(); }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminListings();
      setAll(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    await toggleListingStatus(id);
    setAll(prev => prev.map(l => l.id === id ? { ...l, is_active: !l.is_active } : l));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing? This action cannot be undone.")) return;
    await deleteListing(id);
    setAll(prev => prev.filter(l => l.id !== id));
  };

  // ── Derived state ────────────────────────────────────────────────────────────
  const filtered = all.filter(l => {
    const matchFilter =
      filter === "All"      ? true :
      filter === "Active"   ? l.is_active : !l.is_active;
    const q = query.toLowerCase().trim();
    const matchQuery = !q ||
      l.title.toLowerCase().includes(q) ||
      l.seller_name.toLowerCase().includes(q) ||
      l.category_name.toLowerCase().includes(q);
    return matchFilter && matchQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged      = filtered.slice((page - 1) * perPage, page * perPage);

  // Reset to page 1 whenever filter/search/perPage changes
  useEffect(() => { setPage(1); }, [filter, query, perPage]);

  const activeCount   = all.filter(l => l.is_active).length;
  const inactiveCount = all.length - activeCount;
  const totalViews    = all.reduce((s, l) => s + (l.view_count || 0), 0);

  return (
    <AdminLayout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Syne:wght@600;700&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 5px; width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c4d0da; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8bed0; }
      `}</style>

      <div style={{ padding: "32px 30px", background: T.bg, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Page Header ───────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 28, flexWrap: "wrap", gap: 14,
        }}>
          <div>
            <h1 style={{
              fontFamily: "'Syne',sans-serif", fontSize: 27, fontWeight: 700,
              color: T.primaryDark, lineHeight: 1, margin: 0, letterSpacing: "-0.3px",
            }}>Manage Listings</h1>
            <p style={{ fontSize: 13.5, color: T.textMuted, marginTop: 7, marginBottom: 0, fontWeight: 400 }}>
              Monitor, activate, or remove product listings across the marketplace.
            </p>
          </div>
          <button
            onClick={loadListings}
            style={{
              ...btnBase, padding: "10px 22px",
              background: T.gradientHeader, color: "#fff", border: "none",
              boxShadow: `0 4px 14px ${T.shadow}`, borderRadius: 11,
              fontSize: 13,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <RefreshIcon /> Refresh
          </button>
        </div>

        {/* ── Stat Cards ────────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 26 }}>
          <StatCard
            label="Total Listings" value={all.length}
            iconBg="rgba(26,74,107,0.08)" iconColor={T.primary}
            accent={`linear-gradient(90deg, ${T.primary}88, ${T.accent}44)`}
            icon={<PackageIcon />}
          />
          <StatCard
            label="Active" value={activeCount}
            iconBg="rgba(26,170,107,0.08)" iconColor={T.success}
            accent={`linear-gradient(90deg, ${T.success}88, ${T.success}22)`}
            icon={<TickIcon />}
          />
          <StatCard
            label="Inactive" value={inactiveCount}
            iconBg="rgba(224,85,85,0.08)" iconColor={T.danger}
            accent={`linear-gradient(90deg, ${T.danger}88, ${T.danger}22)`}
            icon={<XCircle />}
          />
          <StatCard
            label="Total Views" value={totalViews.toLocaleString()}
            iconBg="rgba(59,158,221,0.08)" iconColor={T.accent}
            accent={`linear-gradient(90deg, ${T.accent}88, ${T.accent}22)`}
            icon={<Icon d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z","M12 9a3 3 0 100 6 3 3 0 000-6z"]} size={18} />}
          />
        </div>

        {/* ── Toolbar ───────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", flexWrap: "wrap",
          gap: 10, marginBottom: 20,
          background: T.surface, borderRadius: 14, padding: "12px 16px",
          border: `1px solid ${T.border}`, boxShadow: `0 1px 6px ${T.shadow}`,
        }}>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "Active", "Inactive"].map(f => {
              const count = f === "All" ? all.length : f === "Active" ? activeCount : inactiveCount;
              const active = filter === f;
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "6px 15px", borderRadius: 20, cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif", fontSize: 13, transition: "all 0.18s",
                  background: active ? T.primary : "transparent",
                  color:      active ? "#fff"    : T.textMuted,
                  border:     `1.5px solid ${active ? T.primary : T.border}`,
                  fontWeight: active ? 600 : 500,
                }}>
                  {f}
                  <span style={{
                    marginLeft: 6, fontSize: 11, padding: "2px 7px", borderRadius: 10,
                    background: active ? "rgba(255,255,255,0.22)" : T.bg,
                    color:      active ? "#fff" : T.textMuted, fontWeight: 600,
                  }}>{count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />

          {/* Search */}
          <div style={{ position: "relative" }}>
            <span style={{
              position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
              color: T.textMuted, pointerEvents: "none", display: "flex",
            }}><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search title, seller, category…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                borderRadius: 9, border: `1.5px solid ${T.border}`,
                fontSize: 13, outline: "none", width: 230,
                transition: "border 0.2s", background: T.surface, color: T.textMain,
                fontFamily: "'DM Sans', sans-serif",
              }}
              onFocus={e => e.target.style.borderColor = T.primary}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {/* View toggle */}
          <div style={{
            display: "flex", border: `1.5px solid ${T.border}`,
            borderRadius: 10, overflow: "hidden", background: T.bg,
          }}>
            {[
              { key: "grid",  label: "Cards", icon: <GridIcon /> },
              { key: "table", label: "Table", icon: <ListIcon /> },
            ].map(({ key, label, icon }) => (
              <button key={key} onClick={() => setView(key)} style={{
                padding: "7px 16px", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                transition: "all 0.18s",
                background: view === key ? T.primary : "transparent",
                color:      view === key ? "#fff"    : T.textMuted,
                fontWeight: view === key ? 600 : 500,
              }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content area ──────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{
            textAlign: "center", padding: "80px 0",
            background: T.surface, borderRadius: 18, border: `1px solid ${T.border}`,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              border: `3px solid ${T.border}`, borderTopColor: T.primary,
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }} />
            <div style={{ color: T.textMuted, fontSize: 14 }}>Loading listings…</div>
          </div>
        ) : paged.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 0",
            background: T.surface, borderRadius: 18, border: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 46, marginBottom: 14 }}>📦</div>
            <div style={{
              fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700,
              color: T.textMain, marginBottom: 8,
            }}>No listings found</div>
            <div style={{ fontSize: 13.5, color: T.textMuted }}>
              Try adjusting your filters or search query.
            </div>
          </div>
        ) : view === "grid" ? (
          <CardGrid items={paged} onToggle={handleToggle} onDelete={handleDelete} />
        ) : (
          <TableView items={paged} onToggle={handleToggle} onDelete={handleDelete} />
        )}

        {/* ── Pagination ────────────────────────────────────────────────────── */}
        {!loading && filtered.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalFiltered={filtered.length}
            perPage={perPage}
            onPage={setPage}
          />
        )}

      </div>
    </AdminLayout>
  );
}