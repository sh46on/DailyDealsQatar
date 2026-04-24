import { useEffect, useState, useCallback } from "react";
import { getFlyers, toggleFlyer, deleteFlyer } from "../api/flyerApi";
import AdminLayout from "./AdminLayout";
import { Flag, FileText, Building2, Tag, Calendar, RefreshCw, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS — matches AdminHome palette exactly
───────────────────────────────────────────────────────────────── */
const C = {
  bg:          "#fdf6f0",
  bgCard:      "#ffffff",
  bgCardWarm:  "#fff9f6",
  bgCardTint:  "#fef2ee",

  navDark:     "#5c0f0f",
  navMid:      "#8b1a1a",
  navBright:   "#c0392b",

  rose:        "#e11d48",
  amber:       "#d97706",
  teal:        "#0d9488",
  indigo:      "#4338ca",
  emerald:     "#059669",
  violet:      "#7c3aed",
  orange:      "#ea580c",

  textH:       "#1a0505",
  textP:       "#3d1010",
  textMid:     "#6b2a2a",
  textDim:     "#a05050",

  border:      "rgba(140,30,30,0.12)",
  borderMid:   "rgba(140,30,30,0.22)",
  shadow:      "rgba(80,10,10,0.10)",
  shadowHov:   "rgba(80,10,10,0.18)",
};

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

/* ── Category badge colours ──────────────────────────────────── */
const CATEGORY_COLORS = {
  supermarket: { bg: "#d1fae5", color: "#065f46" },
  restaurant:  { bg: "#fef3c7", color: "#92400e" },
  pharmacy:    { bg: "#e0e7ff", color: "#3730a3" },
  electronics: { bg: "#fce7f3", color: "#9d174d" },
  fashion:     { bg: "#f3e8ff", color: "#6b21a8" },
  default:     { bg: "#fef2ee", color: "#8b1a1a" },
};

function getCategoryStyle(cat) {
  const key = (cat || "").toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

/* ── Confirm modal ───────────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(30,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: C.bgCard,
        border: `1px solid ${C.borderMid}`,
        borderRadius: 18,
        padding: "30px 32px",
        width: 360,
        boxShadow: `0 16px 48px rgba(80,10,10,0.22)`,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: "slideUp .25s ease both",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "#ffe4e6", border: `1px solid #fca5a530`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}>
          <Trash2 size={18} color={C.rose} />
        </div>
        <div style={{
          fontSize: 17, fontWeight: 700, color: C.textH,
          fontFamily: "'DM Serif Display', serif",
          marginBottom: 8,
        }}>
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
}

/* ── Single flyer card ───────────────────────────────────────── */
function FlyerCard({ flyer, index, onToggle, onDelete }) {
  const [hov, setHov] = useState(false);
  const catStyle = getCategoryStyle(flyer.category_type);
  const isActive = flyer.is_active;

  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit", month: "short", year: "numeric",
        })
      : "—";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
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
      {/* ── Top row ── */}
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
            <Building2 size={11} color={C.textDim} />
            <span style={{ fontSize: 12, color: C.textMid, fontWeight: 500 }}>
              {flyer.company_name}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <span style={{
          fontSize: 11, fontWeight: 700,
          padding: "4px 12px", borderRadius: 20,
          background: isActive ? "#d1fae5" : "#fef2ee",
          color: isActive ? "#065f46" : C.textDim,
          letterSpacing: "0.04em",
          textTransform: "capitalize",
          flexShrink: 0,
          border: `1px solid ${isActive ? "#6ee7b730" : C.border}`,
        }}>
          {isActive ? "Active" : "Suspended"}
        </span>
      </div>

      {/* ── Meta row ── */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
      }}>
        {/* Category */}
        <span style={{
          fontSize: 11, fontWeight: 600,
          padding: "3px 10px", borderRadius: 20,
          background: catStyle.bg, color: catStyle.color,
          display: "flex", alignItems: "center", gap: 5,
        }}>
          <Tag size={9} />
          {flyer.category_type}
        </span>

        {/* Date range */}
        <span style={{
          fontSize: 11, color: C.textMid, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 5,
          background: C.bgCardWarm,
          border: `1px solid ${C.border}`,
          borderRadius: 20, padding: "3px 10px",
        }}>
          <Calendar size={9} color={C.textDim} />
          {fmt(flyer.start_date)} → {fmt(flyer.end_date)}
        </span>
      </div>

      {/* ── Divider ── */}
      <div style={{ borderTop: `1px solid ${C.border}` }} />

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: 8 }}>
        {/* View PDF */}
        <a
          href={flyer.pdf}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, color: C.navMid,
            background: `${C.navBright}10`,
            border: `1px solid ${C.navBright}25`,
            borderRadius: 10, padding: "7px 13px",
            textDecoration: "none",
            transition: "background .18s",
          }}
        >
          <FileText size={12} color={C.navMid} />
          View PDF
        </a>

        {/* Toggle */}
        <button
          onClick={() => onToggle(flyer.id)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600,
            color: isActive ? C.amber : C.teal,
            background: isActive ? "#fef3c7" : "#d1fae5",
            border: `1px solid ${isActive ? "#fcd34d50" : "#6ee7b750"}`,
            borderRadius: 10, padding: "7px 13px",
            cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            transition: "opacity .18s",
          }}
        >
          {isActive
            ? <><ToggleLeft  size={12} /> Suspend</>
            : <><ToggleRight size={12} /> Activate</>
          }
        </button>

        {/* Delete — pushed to the right */}
        <button
          onClick={() => onDelete(flyer.id, flyer.title)}
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
            transition: "opacity .18s",
          }}
        >
          <Trash2 size={12} color={C.rose} />
          Delete
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function ManageFlyers() {
  const [flyers, setFlyers]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirm, setConfirm]     = useState(null); // { id, title }

  const fetchFlyers = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await getFlyers();
      setFlyers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFlyers(); }, [fetchFlyers]);

  const handleToggle = async (id) => {
    await toggleFlyer(id);
    fetchFlyers(true);
  };

  const handleDeleteRequest = (id, title) => {
    setConfirm({ id, title });
  };

  const handleDeleteConfirm = async () => {
    await deleteFlyer(confirm.id);
    setConfirm(null);
    fetchFlyers(true);
  };

  /* ── stats ── */
  const total    = flyers.length;
  const active   = flyers.filter(f => f.is_active).length;
  const inactive = total - active;

  /* ── loading ── */
  if (loading) return (
    <AdminLayout>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: 280, gap: 12,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `3px solid ${C.border}`,
          borderTopColor: C.navBright,
          animation: "spin .8s linear infinite",
        }}/>
        <span style={{ fontSize: 13, color: C.textDim }}>Loading flyers…</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <link rel="stylesheet" href={FONT_LINK} />
      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; } to { opacity:1; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {confirm && (
        <ConfirmModal
          message={`Are you sure you want to delete "${confirm.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div style={{
        padding: "28px 32px 40px 28px",
        background: C.bg,
        minHeight: "100%",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* ── Header ── */}
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

          {/* Refresh */}
          <button
            onClick={() => fetchFlyers()}
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
              style={{ animation: refreshing ? "spin .6s linear infinite" : "none" }}
            />
            Refresh
          </button>
        </div>

        {/* ── Summary chips ── */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 26, flexWrap: "wrap",
          animation: "slideUp .4s .05s ease both",
        }}>
          {[
            { label: "Total Flyers",  value: total,    color: C.navBright, bg: `${C.navBright}12` },
            { label: "Active",        value: active,   color: C.teal,      bg: "#d1fae5" },
            { label: "Suspended",     value: inactive, color: C.textDim,   bg: "#fef2ee" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 12, padding: "12px 18px",
              boxShadow: `0 2px 8px ${C.shadow}`,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Flag size={13} color={color} />
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

        {/* ── Cards grid ── */}
        {flyers.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: 200, gap: 10,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
          }}>
            <Flag size={32} color={C.textDim} opacity={0.4} />
            <span style={{ fontSize: 14, color: C.textDim }}>No flyers found</span>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
          }}>
            {flyers.map((flyer, i) => (
              <FlyerCard
                key={flyer.id}
                flyer={flyer}
                index={i}
                onToggle={handleToggle}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}