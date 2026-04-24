import { useEffect, useState, useCallback } from "react";
import {
  getCategories,
  createCategory,
  deleteCategory,
  createSubCategory,
  deleteSubCategory,
} from "../api/categoryApi";
import AdminLayout from "./AdminLayout";
import {
  Layers, Tag, Plus, Trash2, RefreshCw,
  ChevronDown, ChevronUp, FolderOpen,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS
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

/* accent palette cycled per category card */
const ACCENTS = [C.navBright, C.teal, C.indigo, C.amber, C.violet, C.emerald, C.rose];

/* ── Styled text input ───────────────────────────────────────── */
function StyledInput({ value, onChange, onKeyDown, placeholder }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      placeholder={placeholder}
      style={{
        flex: 1,
        height: 40,
        padding: "0 14px",
        border: `1.5px solid ${focus ? C.navBright : C.border}`,
        borderRadius: 10,
        background: focus ? "#fff" : C.bgCardWarm,
        fontSize: 13,
        color: C.textH,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        outline: "none",
        transition: "border-color .18s, background .18s",
      }}
    />
  );
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
        borderRadius: 18, padding: "30px 32px", width: 360,
        boxShadow: "0 16px 48px rgba(80,10,10,0.22)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: "slideUp .25s ease both",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "#ffe4e6",
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
          {message}
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

/* ── Sub-category pill ───────────────────────────────────────── */
function SubPill({ sub, accent, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: hov ? C.bgCardTint : C.bgCardWarm,
        border: `1px solid ${hov ? C.borderMid : C.border}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 10,
        padding: "8px 12px",
        transition: "all .18s",
      }}
    >
      <Tag size={10} color={accent} style={{ flexShrink: 0 }} />
      <span style={{
        flex: 1,
        fontSize: 13, color: C.textP, fontWeight: 500,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {sub.name}
      </span>
      <button
        onClick={() => onDelete(sub.id, sub.name)}
        title="Delete subcategory"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 24, height: 24, borderRadius: 6,
          background: hov ? "#ffe4e6" : "transparent",
          border: "none", cursor: "pointer",
          transition: "background .15s",
        }}
      >
        <Trash2 size={11} color={hov ? C.rose : C.textDim} />
      </button>
    </div>
  );
}

/* ── Category card ───────────────────────────────────────────── */
function CategoryCard({ cat, accent, index, onDeleteCat, onAddSub, onDeleteSub }) {
  const [expanded, setExpanded]   = useState(true);
  const [subInput, setSubInput]   = useState("");
  const [showInput, setShowInput] = useState(false);
  const [hov, setHov]             = useState(false);

  const handleAddSub = async () => {
    const name = subInput.trim();
    if (!name) return;
    await onAddSub(cat.id, name);
    setSubInput("");
    setShowInput(false);
  };

  const subCount = cat.subcategories?.length || 0;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.bgCard,
        border: `1px solid ${hov ? C.borderMid : C.border}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 16,
        boxShadow: hov ? `0 8px 28px ${C.shadowHov}` : `0 2px 10px ${C.shadow}`,
        transition: "box-shadow .22s ease",
        animation: `slideUp .45s ${0.07 + index * 0.07}s cubic-bezier(.22,.61,.36,1) both`,
        overflow: "hidden",
      }}
    >
      {/* ── Card header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 18px",
      }}>
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          background: `${accent}15`,
          border: `1px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FolderOpen size={16} color={accent} />
        </div>

        {/* Name + sub count */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, color: C.textH,
            fontFamily: "'DM Serif Display', serif", lineHeight: 1.2,
          }}>
            {cat.name}
          </div>
          <div style={{ fontSize: 11, color: C.textDim, marginTop: 2, fontWeight: 500 }}>
            {subCount} subcategor{subCount === 1 ? "y" : "ies"}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {/* Add sub toggle */}
          <button
            onClick={() => { setShowInput(s => !s); setExpanded(true); }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600,
              color: accent,
              background: `${accent}12`,
              border: `1px solid ${accent}25`,
              borderRadius: 8, padding: "6px 11px",
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <Plus size={11} /> Add Sub
          </button>

          {/* Delete category */}
          <button
            onClick={() => onDeleteCat(cat.id, cat.name)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 8,
              background: "#ffe4e6", border: "1px solid #fca5a530",
              cursor: "pointer",
            }}
          >
            <Trash2 size={13} color={C.rose} />
          </button>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 8,
              background: C.bgCardWarm, border: `1px solid ${C.border}`,
              cursor: "pointer",
            }}
          >
            {expanded
              ? <ChevronUp   size={14} color={C.textMid} />
              : <ChevronDown size={14} color={C.textMid} />}
          </button>
        </div>
      </div>

      {/* ── Collapsible body ── */}
      {expanded && (
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: "14px 18px 18px",
          display: "flex", flexDirection: "column", gap: 10,
        }}>

          {/* Inline add-sub input */}
          {showInput && (
            <div style={{
              display: "flex", gap: 8, marginBottom: 4,
              animation: "slideUp .2s ease both",
            }}>
              <StyledInput
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddSub()}
                placeholder={`New subcategory under ${cat.name}…`}
              />
              <button
                onClick={handleAddSub}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  height: 40, padding: "0 16px",
                  background: accent, border: "none",
                  borderRadius: 10, color: "#fff",
                  fontSize: 12, fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  flexShrink: 0,
                }}
              >
                <Plus size={12} /> Add
              </button>
              <button
                onClick={() => { setShowInput(false); setSubInput(""); }}
                style={{
                  height: 40, padding: "0 12px",
                  background: C.bgCardWarm, border: `1px solid ${C.border}`,
                  borderRadius: 10, color: C.textDim,
                  fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  flexShrink: 0,
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Subcategory pills */}
          {subCount === 0 ? (
            <div style={{
              fontSize: 12, color: C.textDim, fontStyle: "italic",
              padding: "6px 2px",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              No subcategories yet — click Add Sub to create one.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 8,
            }}>
              {cat.subcategories.map(sub => (
                <SubPill
                  key={sub.id}
                  sub={sub}
                  accent={accent}
                  onDelete={onDeleteSub}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function ManageCategories() {
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [confirm, setConfirm]         = useState(null); // { type, id, name }

  const fetchCategories = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  /* ── Add category ── */
  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    await createCategory({ name });
    setNewCategory("");
    fetchCategories(true);
  };

  /* ── Add subcategory (called from card, no prompt()) ── */
  const handleAddSub = async (categoryId, name) => {
    await createSubCategory({ name, category: categoryId });
    fetchCategories(true);
  };

  /* ── Delete request ── */
  const requestDelete = (type, id, name) => setConfirm({ type, id, name });

  /* ── Delete confirm ── */
  const handleConfirm = async () => {
    if (confirm.type === "category")    await deleteCategory(confirm.id);
    if (confirm.type === "subcategory") await deleteSubCategory(confirm.id);
    setConfirm(null);
    fetchCategories(true);
  };

  /* ── Stats ── */
  const totalCats = categories.length;
  const totalSubs = categories.reduce((a, c) => a + (c.subcategories?.length || 0), 0);

  /* ── Loading ── */
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
        }} />
        <span style={{ fontSize: 13, color: C.textDim }}>Loading categories…</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <link rel="stylesheet" href={FONT_LINK} />
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {confirm && (
        <ConfirmModal
          message={`Delete ${confirm.type} "${confirm.name}"? This cannot be undone.`}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div style={{
        padding: "28px 32px 40px 28px",
        background: C.bg,
        minHeight: "100%",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* ── Page header ── */}
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
              Manage Categories
            </h1>
            <p style={{
              margin: "6px 0 0", fontSize: 13, color: C.textMid,
              fontWeight: 500, letterSpacing: "0.02em",
            }}>
              Daily Deals &nbsp;·&nbsp; Qatar &nbsp;·&nbsp; Admin Panel v1.0
            </p>
          </div>

          <button
            onClick={() => fetchCategories()}
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
              style={{ animation: refreshing ? "spin .6s linear infinite" : "none" }}
            />
            Refresh
          </button>
        </div>

        {/* ── Summary chips ── */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap",
          animation: "slideUp .4s .04s ease both",
        }}>
          {[
            { label: "Categories",    value: totalCats, color: C.navBright, bg: `${C.navBright}12`, icon: <Layers size={13} color={C.navBright} /> },
            { label: "Subcategories", value: totalSubs, color: C.teal,      bg: "#d1fae5",          icon: <Tag    size={13} color={C.teal}      /> },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 12, padding: "12px 20px",
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

        {/* ── Add category row ── */}
        <div style={{
          display: "flex", gap: 10, marginBottom: 28,
          animation: "slideUp .4s .08s ease both",
        }}>
          <StyledInput
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddCategory()}
            placeholder="New category name… (press Enter or click Add)"
          />
          <button
            onClick={handleAddCategory}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 40, padding: "0 20px",
              background: C.navBright, border: "none",
              borderRadius: 10, color: "#fff",
              fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              flexShrink: 0,
              boxShadow: `0 4px 14px ${C.navBright}40`,
            }}
          >
            <Plus size={14} /> Add Category
          </button>
        </div>

        {/* ── Category cards ── */}
        {categories.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: 200, gap: 10,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
          }}>
            <Layers size={32} color={C.textDim} opacity={0.4} />
            <span style={{ fontSize: 14, color: C.textDim }}>No categories yet — add one above.</span>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
          }}>
            {categories.map((cat, i) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                accent={ACCENTS[i % ACCENTS.length]}
                index={i}
                onDeleteCat={(id, name) => requestDelete("category", id, name)}
                onAddSub={handleAddSub}
                onDeleteSub={(id, name) => requestDelete("subcategory", id, name)}
              />
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}