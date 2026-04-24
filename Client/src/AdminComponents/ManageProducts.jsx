import { useEffect, useState, useCallback } from "react";
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
   DESIGN TOKENS — shared with AdminHome & ManageFlyers
───────────────────────────────────────────────────────────────── */
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

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

/* ── Category colour map ─────────────────────────────────────── */
const CAT_COLORS = {
  electronics: { bg: "#e0e7ff", color: "#3730a3" },
  fashion:     { bg: "#f3e8ff", color: "#6b21a8" },
  supermarket: { bg: "#d1fae5", color: "#065f46" },
  restaurant:  { bg: "#fef3c7", color: "#92400e" },
  pharmacy:    { bg: "#fce7f3", color: "#9d174d" },
  default:     { bg: "#fef2ee", color: "#8b1a1a" },
};
const catStyle = (cat) =>
  CAT_COLORS[(cat || "").toLowerCase()] || CAT_COLORS.default;

/* ── Currency formatter ──────────────────────────────────────── */
const fmtPrice = (v) =>
  Number(v).toLocaleString("en-QA", { minimumFractionDigits: 0 });

/* ── Delete confirm modal ────────────────────────────────────── */
function ConfirmModal({ title, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(30,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
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
          <Trash2 size={18} color={C.rose} />
        </div>
        <div style={{
          fontSize: 17, fontWeight: 700, color: C.textH,
          fontFamily: "'DM Serif Display', serif", marginBottom: 8,
        }}>
          Confirm Delete
        </div>
        <div style={{ fontSize: 13, color: C.textMid, marginBottom: 24, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong>"{title}"</strong>? This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px 0",
            background: C.bgCardWarm, border: `1px solid ${C.border}`,
            borderRadius: 10, color: C.textMid, fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px 0",
            background: C.rose, border: "none",
            borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Product card ────────────────────────────────────────────── */
function ProductCard({ product: p, index, onToggle, onFeature, onDelete }) {
  const [hov, setHov] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const cs = catStyle(p.category_name);
  const discount = p.old_price
    ? Math.round((1 - Number(p.price) / Number(p.old_price)) * 100)
    : null;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
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
      {/* ── Image strip ── */}
      <div style={{
        position: "relative",
        height: 160,
        background: C.bgCardTint,
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!imgErr ? (
          <img
            src={p.image} alt={p.name}
            onError={() => setImgErr(true)}
            style={{
              width: "100%", height: "100%",
              objectFit: "cover",
              transition: "transform .3s ease",
              transform: hov ? "scale(1.04)" : "scale(1)",
            }}
          />
        ) : (
          <Package size={40} color={C.textDim} opacity={0.35} />
        )}

        {/* Discount badge */}
        {discount && (
          <span style={{
            position: "absolute", top: 10, left: 10,
            fontSize: 11, fontWeight: 700,
            background: C.rose, color: "#fff",
            borderRadius: 8, padding: "3px 9px",
          }}>
            -{discount}%
          </span>
        )}

        {/* Featured star */}
        {p.is_featured && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            width: 28, height: 28, borderRadius: "50%",
            background: "#fef3c7",
            border: "1px solid #fcd34d50",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Star size={13} color={C.amber} fill={C.amber} />
          </span>
        )}

        {/* Status ribbon */}
        {!p.is_active && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(160,80,80,0.82)",
            color: "#fff", fontSize: 11, fontWeight: 700,
            textAlign: "center", padding: "5px 0",
            letterSpacing: "0.06em",
          }}>
            SUSPENDED
          </div>
        )}
      </div>

      {/* ── Body ── */}
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
            <Building2 size={10} color={C.textDim} />
            <span style={{ fontSize: 11, color: C.textMid, fontWeight: 500 }}>
              {p.company_name}
            </span>
          </div>
        </div>

        {/* Badges row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 600,
            padding: "3px 9px", borderRadius: 20,
            background: cs.bg, color: cs.color,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Tag size={8} />{p.category_name}
          </span>
          {p.subcategory_name && (
            <span style={{
              fontSize: 10, fontWeight: 500,
              padding: "3px 9px", borderRadius: 20,
              background: C.bgCardWarm, color: C.textMid,
              border: `1px solid ${C.border}`,
            }}>
              {p.subcategory_name}
            </span>
          )}
          {p.quantity && (
            <span style={{
              fontSize: 10, fontWeight: 500,
              padding: "3px 9px", borderRadius: 20,
              background: C.bgCardWarm, color: C.textDim,
              border: `1px solid ${C.border}`,
            }}>
              {p.quantity}
            </span>
          )}
        </div>

        {/* Price row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{
            fontSize: 22, fontWeight: 700, color: C.navDark,
            fontFamily: "'DM Serif Display', serif",
          }}>
            QAR {fmtPrice(p.price)}
          </span>
          {p.old_price && (
            <span style={{
              fontSize: 12, color: C.textDim,
              textDecoration: "line-through",
            }}>
              QAR {fmtPrice(p.old_price)}
            </span>
          )}
        </div>

        {/* Views */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          fontSize: 11, color: C.textDim, fontWeight: 500,
        }}>
          <Eye size={11} color={C.textDim} />
          {p.view_count} views
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 2 }} />

        {/* Actions */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {/* Toggle active */}
          <button onClick={() => onToggle(p.id)} style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600,
            color:      p.is_active ? C.amber : C.teal,
            background: p.is_active ? "#fef3c7" : "#d1fae5",
            border: `1px solid ${p.is_active ? "#fcd34d50" : "#6ee7b750"}`,
            borderRadius: 9, padding: "6px 11px",
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {p.is_active
              ? <><ToggleLeft  size={11} /> Suspend</>
              : <><ToggleRight size={11} /> Activate</>}
          </button>

          {/* Toggle featured */}
          <button onClick={() => onFeature(p.id)} style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600,
            color:      p.is_featured ? C.violet : C.amber,
            background: p.is_featured ? "#f3e8ff" : "#fef3c7",
            border: `1px solid ${p.is_featured ? "#c4b5fd50" : "#fcd34d50"}`,
            borderRadius: 9, padding: "6px 11px",
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            <Star size={11} fill={p.is_featured ? C.violet : "none"} />
            {p.is_featured ? "Unfeature" : "Feature"}
          </button>

          {/* Delete */}
          <button onClick={() => onDelete(p.id, p.name)} style={{
            marginLeft: "auto",
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600,
            color: C.rose, background: "#ffe4e6",
            border: "1px solid #fca5a530",
            borderRadius: 9, padding: "6px 11px",
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            <Trash2 size={11} color={C.rose} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function ManageProducts() {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirm, setConfirm]       = useState(null); // { id, name }
  const [filter, setFilter]         = useState("all"); // all | active | suspended | featured

  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleToggle  = async (id) => { await toggleProduct(id);  fetchProducts(true); };
  const handleFeature = async (id) => { await toggleFeatured(id); fetchProducts(true); };
  const handleDeleteRequest = (id, name) => setConfirm({ id, name });
  const handleDeleteConfirm = async () => {
    await deleteProduct(confirm.id);
    setConfirm(null);
    fetchProducts(true);
  };

  /* ── filter logic ── */
  const visible = products.filter(p => {
    if (filter === "active")    return p.is_active;
    if (filter === "suspended") return !p.is_active;
    if (filter === "featured")  return p.is_featured;
    return true;
  });

  /* ── summary stats ── */
  const total    = products.length;
  const active   = products.filter(p => p.is_active).length;
  const featured = products.filter(p => p.is_featured).length;
  const suspended = total - active;

  const FILTERS = [
    { key: "all",       label: `All (${total})`,           color: C.navBright },
    { key: "active",    label: `Active (${active})`,       color: C.teal      },
    { key: "suspended", label: `Suspended (${suspended})`, color: C.textDim   },
    { key: "featured",  label: `Featured (${featured})`,   color: C.amber     },
  ];

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
        <span style={{ fontSize: 13, color: C.textDim }}>Loading products…</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <link rel="stylesheet" href={FONT_LINK} />
      <style>{`
        @keyframes slideUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes spin     { to{transform:rotate(360deg)} }
      `}</style>

      {confirm && (
        <ConfirmModal
          title={confirm.name}
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

          <button onClick={() => fetchProducts()} style={{
            display: "flex", alignItems: "center", gap: 8,
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 14, padding: "10px 18px",
            boxShadow: `0 2px 8px ${C.shadow}`,
            cursor: "pointer", color: C.navMid,
            fontSize: 13, fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            <RefreshCw size={13} style={{ animation: refreshing ? "spin .6s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>

        {/* ── Summary chips ── */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap",
          animation: "slideUp .4s .05s ease both",
        }}>
          {[
            { label: "Total Products", value: total,    color: C.navBright, bg: `${C.navBright}12`, icon: <ShoppingBag size={13} color={C.navBright}/> },
            { label: "Active",         value: active,   color: C.teal,      bg: "#d1fae5",          icon: <Zap         size={13} color={C.teal}      /> },
            { label: "Featured",       value: featured, color: C.amber,     bg: "#fef3c7",          icon: <Star        size={13} color={C.amber}      /> },
            { label: "Suspended",      value: suspended,color: C.textDim,   bg: "#fef2ee",          icon: <TrendingUp  size={13} color={C.textDim}    /> },
          ].map(({ label, value, color, bg, icon }) => (
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
                {icon}
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

        {/* ── Filter tabs ── */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap",
          animation: "slideUp .4s .1s ease both",
        }}>
          {FILTERS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                fontSize: 12, fontWeight: 600,
                padding: "7px 16px", borderRadius: 20,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all .18s",
                border: filter === key
                  ? `1.5px solid ${color}`
                  : `1px solid ${C.border}`,
                background: filter === key ? `${color}15` : C.bgCard,
                color: filter === key ? color : C.textMid,
                boxShadow: filter === key ? `0 2px 8px ${C.shadow}` : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Product grid ── */}
        {visible.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: 200, gap: 10,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
          }}>
            <Package size={32} color={C.textDim} opacity={0.4} />
            <span style={{ fontSize: 14, color: C.textDim }}>No products found</span>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 18,
          }}>
            {visible.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                onToggle={handleToggle}
                onFeature={handleFeature}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}