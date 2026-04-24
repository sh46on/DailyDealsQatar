import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  fetchSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
} from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";

/* ─── Design Tokens (from MarketplaceInterests) ─────────────── */
const BLUE   = "#1565c0";
const BLUELT = "#e3f2fd";
const FONT   = "'Plus Jakarta Sans', sans-serif";
const FONT_D = "'Fraunces', serif";

/* ─── Global CSS ─────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Animations (identical to MarketplaceInterests) ── */
  @keyframes msp-fadeUp    { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;} }
  @keyframes msp-fadeIn    { from{opacity:0;}to{opacity:1;} }
  @keyframes msp-fadeDown  { from{opacity:0;transform:translateY(-18px);}to{opacity:1;transform:none;} }
  @keyframes msp-shimmer   { 0%{background-position:-600px 0;}100%{background-position:600px 0;} }
  @keyframes msp-floatOrb  { 0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);} }
  @keyframes msp-waveSlide { to{transform:translateX(-50%);} }
  @keyframes msp-pulse     { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(1.35);} }
  @keyframes msp-popIn     { from{opacity:0;transform:scale(0.75);}to{opacity:1;transform:scale(1);} }
  @keyframes msp-slideUp   { from{opacity:0;transform:translateY(36px);}to{opacity:1;transform:translateY(0);} }
  @keyframes msp-spin      { to{transform:rotate(360deg);} }

  /* ── Skeleton shimmer ── */
  .msp-skel {
    background: linear-gradient(90deg,#f0f4f8 25%,#e2ecf7 50%,#f0f4f8 75%);
    background-size: 600px 100%;
    animation: msp-shimmer 1.4s linear infinite;
    border-radius: 22px;
  }

  /* ── Product item hover ── */
  .msp-item {
    transition: box-shadow .28s ease, transform .28s ease, border-color .28s ease;
  }
  .msp-item:hover {
    box-shadow: 0 16px 48px rgba(21,101,192,0.16), 0 2px 8px rgba(21,101,192,0.07) !important;
    transform: translateY(-4px) !important;
    border-color: rgba(21,101,192,0.25) !important;
    background: #fff !important;
  }
  .msp-item:hover .msp-thumb { transform: scale(1.04); }
  .msp-thumb { transition: transform 0.5s cubic-bezier(.22,1,.36,1); }

  /* ── Stat pill hover ── */
  .msp-stat-pill:hover {
    background: rgba(255,255,255,0.22) !important;
    transform: translateY(-2px) !important;
  }

  /* ── Tab button hover ── */
  .msp-tab { transition: background .16s, color .16s, border-color .16s, transform .1s; cursor: pointer; }
  .msp-tab:hover:not(.msp-tab--active) {
    background: ${BLUELT} !important;
    border-color: rgba(21,101,192,0.3) !important;
    color: ${BLUE} !important;
  }

  /* ── Action buttons ── */
  .msp-btn { transition: background .16s, transform .12s, box-shadow .14s; }
  .msp-btn:hover { transform: translateY(-1px) !important; }

  /* ── Submit button ── */
  .msp-submit { transition: opacity .18s, transform .18s, box-shadow .18s; }
  .msp-submit:hover:not(:disabled) { opacity:.9; transform:translateY(-2px); box-shadow:0 8px 26px rgba(21,101,192,.36) !important; }
  .msp-submit:active:not(:disabled){ transform:translateY(0); }

  /* ── Form fields focus ── */
  .msp-field input:focus,
  .msp-field select:focus,
  .msp-field textarea:focus {
    border-color: ${BLUE} !important;
    background: #fff !important;
    box-shadow: 0 0 0 3px rgba(21,101,192,0.13) !important;
  }

  /* ── Modal close ── */
  .msp-modal-close { transition: background .15s, transform .15s; }
  .msp-modal-close:hover { background: rgba(239,68,68,0.2) !important; transform: rotate(90deg) !important; }

  /* ── Upload zone ── */
  .msp-upload { transition: border-color .18s, background .18s; }
  .msp-upload:hover { border-color: ${BLUE} !important; background: #dbeafe !important; }

  /* ── Save/Cancel modal btns ── */
  .msp-btn-save { transition: opacity .16s, transform .16s, box-shadow .16s; }
  .msp-btn-save:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
  .msp-btn-cancel { transition: background .15s; }
  .msp-btn-cancel:hover { background: ${BLUELT} !important; color: ${BLUE} !important; }

  /* ── Toast ── */
  .msp-toast {
    position: fixed; bottom: 28px; left: 50%;
    transform: translateX(-50%) translateY(16px);
    display: inline-flex; align-items: center; gap: 9px;
    background: #0f172a; color: #fff;
    padding: 12px 24px; border-radius: 999px;
    font-size: 13px; font-weight: 600; font-family: ${FONT};
    box-shadow: 0 8px 32px rgba(0,0,0,0.22);
    z-index: 9999; opacity: 0; pointer-events: none;
    transition: all 0.26s cubic-bezier(0.22,1,0.36,1); white-space: nowrap;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .msp-toast.on { opacity:1; transform:translateX(-50%) translateY(0); }

  /* ── Responsive ── */
  @media(max-width:900px){
    .msp-layout  { grid-template-columns: 1fr !important; }
    .msp-sidebar { display: none !important; }
    .msp-sidebar-mobile { display: block !important; }
  }
  @media(max-width:600px){
    .msp-page { padding: 0 12px 56px !important; }
    .msp-panel-body { padding: 20px 16px 18px !important; }
    .msp-list { padding: 0 16px 20px !important; }
    .msp-modal-body { padding: 18px 16px 8px !important; }
    .msp-modal-footer { flex-direction: column !important; padding: 14px 16px 18px !important; }
    .msp-btn-cancel, .msp-btn-save { width: 100%; justify-content: center; }
    .msp-row { grid-template-columns: 1fr !important; }
    .msp-item { flex-wrap: wrap !important; }
  }
  @media(max-width:420px){
    .msp-tab .tab-label { display: none; }
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("msp-global-css")) return;
    const el = document.createElement("style");
    el.id = "msp-global-css";
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);
  return null;
}

/* ─── Icons ─────────────────────────────────────────────────── */
const Icon = {
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Pencil: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Camera: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Arrow: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  Spin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display:"block", animation:"msp-spin 0.7s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{display:"block"}}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Tag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  Box: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{display:"block"}}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
};

/* ─── Ad Slot (mirrors Interests AdSlot) ────────────────────── */
function AdSlot({ variant = "leaderboard" }) {
  const dims = variant === "leaderboard"
    ? { h: 90, label: "728 × 90 — Leaderboard Ad" }
    : { h: 250, label: "300 × 250 — Medium Rectangle Ad" };
  return (
    <div style={{
      width:"100%", height:dims.h,
      background:"repeating-linear-gradient(45deg,#f8fafc,#f8fafc 10px,#eef3fa 10px,#eef3fa 20px)",
      border:"1.5px dashed #cbd5e1", borderRadius:14,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:5,
    }}>
      <span style={{ fontSize:9.5, fontWeight:700, color:"#94a3b8", letterSpacing:"1px", fontFamily:FONT, textTransform:"uppercase" }}>Advertisement</span>
      <span style={{ fontSize:12, color:"#cbd5e1", fontFamily:FONT, fontWeight:600 }}>{dims.label}</span>
    </div>
  );
}

/* ─── Status Badge (mirrors Interests StatusBadge) ──────────── */
const STATUS_STYLES = {
  new:      { bg:"#f0fdf4", border:"#86efac", color:"#14532d", dot:"#16a34a" },
  used:     { bg:"#fffbeb", border:"#fde68a", color:"#78350f", dot:"#f59e0b" },
  active:   { bg:"#f0fdf4", border:"#86efac", color:"#14532d", dot:"#16a34a" },
  inactive: { bg:"#fff1f2", border:"#fecdd3", color:"#881337", dot:"#e11d48" },
};

function StatusChip({ type, label }) {
  const st = STATUS_STYLES[type] || STATUS_STYLES.used;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:st.bg, border:`1.5px solid ${st.border}`,
      color:st.color, borderRadius:40, padding:"3px 10px",
      fontFamily:FONT, fontSize:10.5, fontWeight:700,
      letterSpacing:".06em", textTransform:"uppercase",
    }}>
      <span style={{
        width:6, height:6, borderRadius:"50%", background:st.dot, flexShrink:0,
        animation: type === "inactive" ? undefined : "msp-pulse 1.8s infinite",
      }} />
      {label}
    </span>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function SkeletonList() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="msp-skel" style={{ height:110, animationDelay:`${i * 120}ms` }} />
      ))}
    </div>
  );
}

/* ─── Form Fields ────────────────────────────────────────────── */
const FIELD_STYLE = {
  width:"100%", border:"1.5px solid #e0ecfb",
  borderRadius:10, background:"#f7fbff",
  color:"#0f172a", fontFamily:FONT,
  fontSize:14, fontWeight:400, padding:"11px 14px",
  outline:"none", transition:"border-color .18s, background .18s, box-shadow .18s",
};
const LABEL_STYLE = {
  display:"block", fontSize:10.5, fontWeight:800,
  color:"#64748b", letterSpacing:"0.09em",
  textTransform:"uppercase", marginBottom:7, fontFamily:FONT,
};

const FormFields = React.memo(function FormFields({ data, onChange }) {
  return (
    <>
      <div style={{ marginBottom:18 }}>
        <label style={LABEL_STYLE}>Product Title *</label>
        <input className="msp-field-input" name="title" placeholder="e.g. iPhone 14, 128 GB Midnight" value={data.title} onChange={onChange} style={FIELD_STYLE} />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }} className="msp-row">
        <div>
          <label style={LABEL_STYLE}>Price ( ر.ق ) *</label>
          <input className="msp-field-input" name="price" type="number" min="0" placeholder="0.00" value={data.price} onChange={onChange} style={FIELD_STYLE} />
        </div>
        <div>
          <label style={LABEL_STYLE}>City *</label>
          <input className="msp-field-input" name="city" placeholder="e.g. Doha" value={data.city} onChange={onChange} style={FIELD_STYLE} />
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:18 }} className="msp-row">
        <div>
          <label style={LABEL_STYLE}>Condition</label>
          <select name="condition" value={data.condition} onChange={onChange} style={{
            ...FIELD_STYLE,
            backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
            backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center",
            paddingRight:38, cursor:"pointer", appearance:"none",
          }}>
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
        </div>
        <div>
          <label style={LABEL_STYLE}>Category</label>
          <input className="msp-field-input" name="category" placeholder="e.g. Electronics" value={data.category} onChange={onChange} style={FIELD_STYLE} />
        </div>
      </div>
      <div style={{ marginBottom:18 }}>
        <label style={LABEL_STYLE}>Negotiable</label>
        <select name="is_negotiable" value={data.is_negotiable} onChange={onChange} style={{
          ...FIELD_STYLE,
          backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
          backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center",
          paddingRight:38, cursor:"pointer", appearance:"none",
        }}>
          <option value="true">Yes — price is negotiable</option>
          <option value="false">No — fixed price</option>
        </select>
      </div>
      <div>
        <label style={LABEL_STYLE}>Description</label>
        <textarea
          className="msp-field-input"
          name="description"
          placeholder="Describe condition, features, reason for selling…"
          value={data.description}
          onChange={onChange}
          rows={4}
          style={{ ...FIELD_STYLE, resize:"vertical", minHeight:96, lineHeight:1.6 }}
        />
      </div>
    </>
  );
});

const EMPTY = { title:"", price:"", city:"", condition:"used", description:"", category:"", is_negotiable:"true" };

/* ─── Product Item ───────────────────────────────────────────── */
const ProductItem = React.memo(function ProductItem({ p, idx, onEdit, onDelete, onToggle }) {
  const barColors = {
    new:  "linear-gradient(180deg,#4ade80,#16a34a)",
    used: "linear-gradient(180deg,#fbbf24,#f59e0b)",
  };

  return (
    <div
      className="msp-item"
      style={{
        background:"#fff",
        borderRadius:22,
        boxShadow:"0 4px 32px rgba(21,101,192,0.07), 0 1px 4px rgba(0,0,0,0.03)",
        border:"1.5px solid #e0ecfb",
        display:"grid",
        gridTemplateColumns:"6px 100px 1fr auto",
        alignItems:"stretch",
        overflow:"hidden",
        minHeight:110,
        animation:"msp-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both",
        animationDelay:`${idx * 0.05}s`,
      }}
    >
      {/* Left accent bar */}
      <div style={{ width:6, background: barColors[p.condition] || barColors.used, borderRadius:"6px 0 0 6px", flexShrink:0 }} />

      {/* Thumbnail */}
      <div style={{ position:"relative", overflow:"hidden", background:BLUELT }}>
        {p.image_urls?.[0]
          ? <img src={p.image_urls[0]} className="msp-thumb" alt={p.title} loading="lazy"
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
              background:`linear-gradient(135deg, ${BLUELT}, #ddeeff)` }}>
              <span style={{ fontSize:28 }}>📦</span>
            </div>
        }
        {p.category_name && (
          <span style={{
            position:"absolute", bottom:7, left:7,
            background:"rgba(15,52,96,0.75)", backdropFilter:"blur(6px)",
            color:"#fff", fontSize:9, fontWeight:700, letterSpacing:".08em",
            textTransform:"uppercase", borderRadius:6, padding:"3px 8px", fontFamily:FONT,
          }}>{p.category_name}</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:"14px 16px 12px", display:"flex", flexDirection:"column", justifyContent:"space-between", gap:8, minWidth:0 }}>
        <div>
          <h3 style={{
            fontFamily:FONT, fontSize:"clamp(13px,2vw,15px)", fontWeight:700,
            color:"#0f172a", letterSpacing:"-0.02em",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", margin:"0 0 4px",
          }}>{p.title}</h3>
          <p style={{ fontFamily:FONT, fontSize:"clamp(16px,2.5vw,20px)", fontWeight:800, color:BLUE, letterSpacing:"-0.03em", lineHeight:1, margin:"0 0 8px" }}>
            ر.ق{Number(p.price).toLocaleString("en-IN")}
          </p>
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:6 }}>
            <StatusChip type={p.condition} label={p.condition === "new" ? "New" : "Used"} />
            <StatusChip type={p.is_active ? "active" : "inactive"} label={p.is_active ? "Active" : "Inactive"} />
            {p.city && (
              <span style={{
                display:"inline-flex", alignItems:"center", gap:4,
                fontSize:11, fontWeight:600, color:"#3b4a6b",
                background:BLUELT, border:"1px solid #bfdbfe",
                borderRadius:40, padding:"3px 10px", fontFamily:FONT,
              }}>
                <span style={{ fontSize:10 }}>📍</span> {p.city}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
          <button className="msp-btn" onClick={() => onEdit(p)} style={{
            display:"inline-flex", alignItems:"center", gap:5,
            fontFamily:FONT, fontSize:11, fontWeight:700,
            padding:"5px 12px", borderRadius:8, border:`1px solid #bfdbfe`,
            background:BLUELT, color:BLUE, cursor:"pointer",
          }}>
            <span style={{ width:12, height:12 }}><Icon.Pencil /></span> Edit
          </button>
          <button className="msp-btn" onClick={() => onDelete(p.id)} style={{
            display:"inline-flex", alignItems:"center", gap:5,
            fontFamily:FONT, fontSize:11, fontWeight:700,
            padding:"5px 12px", borderRadius:8, border:"1px solid #fecdd3",
            background:"#fff1f2", color:"#881337", cursor:"pointer",
          }}>
            <span style={{ width:12, height:12 }}><Icon.Trash /></span> Delete
          </button>
          <button className="msp-btn" onClick={() => onToggle(p.id)} style={{
            display:"inline-flex", alignItems:"center", gap:5,
            fontFamily:FONT, fontSize:11, fontWeight:700,
            padding:"5px 12px", borderRadius:8, cursor:"pointer",
            border: p.is_active ? "1px solid #fecdd3" : "1px solid #86efac",
            background: p.is_active ? "#fff1f2" : "#f0fdf4",
            color: p.is_active ? "#881337" : "#14532d",
          }}>
            {p.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {/* Right column — date */}
      <div style={{
        display:"flex", flexDirection:"column",
        alignItems:"flex-end", justifyContent:"flex-start",
        padding:"14px 16px", gap:8,
        borderLeft:"1px solid #e0ecfb", minWidth:70,
      }}>
        {p.created_at && (
          <span style={{ fontSize:10, color:"#94a3b8", fontFamily:FONT, fontWeight:500, whiteSpace:"nowrap" }}>
            {new Date(p.created_at).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })}
          </span>
        )}
      </div>
    </div>
  );
});

/* ─── Sidebar Info Card ──────────────────────────────────────── */
function SummaryCard({ products }) {
  const active   = products.filter(p => p.is_active).length;
  const inactive = products.length - active;
  const newItems = products.filter(p => p.condition === "new").length;
  const used     = products.length - newItems;
  const total    = products.length || 1;

  return (
    <div style={s.infoCard}>
      <div style={s.infoHead}>
        <div style={{ fontSize:20 }}>📦</div>
        <span style={s.infoTitle}>Listings Overview</span>
      </div>
      <p style={{ fontFamily:FONT, fontSize:11.5, color:"#94a3b8", margin:"0 0 14px", fontWeight:500 }}>
        {products.length} total listing{products.length !== 1 ? "s" : ""}
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {[
          { label:"Active",   val:active,   dot:"#16a34a" },
          { label:"Inactive", val:inactive, dot:"#e11d48" },
          { label:"New",      val:newItems, dot:"#3b82f6" },
          { label:"Used",     val:used,     dot:"#f59e0b" },
        ].map(row => (
          <div key={row.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:"#475569", fontFamily:FONT, fontWeight:500 }}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:row.dot, flexShrink:0 }} />
              {row.label}
            </div>
            <span style={{ fontFamily:FONT, fontSize:16, fontWeight:800, color:"#0f172a" }}>{row.val}</span>
          </div>
        ))}
      </div>
      <div style={{ height:6, background:"#e0ecfb", borderRadius:99, overflow:"hidden", marginTop:14 }}>
        <div style={{
          height:"100%", borderRadius:99,
          background:"linear-gradient(90deg, #16a34a, #3b82f6)",
          width:`${Math.min(100, (active / total) * 100)}%`,
          transition:"width 0.8s cubic-bezier(.22,1,.36,1)",
        }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function MarketplaceSell() {
  const [products,    setProducts]    = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [form,        setForm]        = useState(EMPTY);
  const [images,      setImages]      = useState([]);
  const [previews,    setPreviews]    = useState([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [toast,       setToast]       = useState({ on:false, msg:"" });
  const [tab,         setTab]         = useState("add");
  const [editTarget,  setEditTarget]  = useState(null);
  const [editForm,    setEditForm]    = useState(EMPTY);
  const [editLoading, setEditLoading] = useState(false);
  const fileRef = useRef();

  const load = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetchSellerProducts();
      setProducts(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    } catch { setProducts([]); }
    finally { setListLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = useCallback((msg) => {
    setToast({ on:true, msg });
    setTimeout(() => setToast({ on:false, msg:"" }), 3000);
  }, []);

  const handleToggle = useCallback(async (id) => {
    try {
      const res = await toggleProductStatus(id);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: res.is_active } : p));
      showToast(res.is_active ? "Product activated" : "Product deactivated");
    } catch { showToast("Failed to update status"); }
  }, [showToast]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleImages = useCallback((e) => {
    const files = [...e.target.files];
    if (files.length > 5) { showToast("Maximum 5 images allowed"); return; }
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  }, [showToast]);

  const handleSubmit = useCallback(async () => {
    if (!form.title || !form.price || !form.city) { showToast("Please fill in required fields"); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(k => fd.append(k, form[k]));
      images.forEach(img => fd.append("images", img));
      await createProduct(fd);
      showToast("Listing posted successfully!");
      setForm(EMPTY); setImages([]); setPreviews([]);
      if (fileRef.current) fileRef.current.value = "";
      load(); setTab("listings");
    } catch { showToast("Failed to post listing"); }
    finally { setSubmitting(false); }
  }, [form, images, showToast, load]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast("Listing deleted");
    } catch { showToast("Failed to delete"); }
  }, [showToast]);

  const openEdit = useCallback((product) => {
    setEditTarget(product);
    setEditForm({
      title:         product.title         || "",
      price:         product.price         || "",
      city:          product.city          || "",
      condition:     product.condition     || "used",
      description:   product.description   || "",
      category:      product.category || "",
      is_negotiable: product.is_negotiable ? "true" : "false",
    });
  }, []);
  const closeEdit = useCallback(() => { setEditTarget(null); setEditForm(EMPTY); }, []);
  const handleEditChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  }, []);
  const handleSaveEdit = useCallback(async () => {
    setEditLoading(true);
    try {
      const fd = new FormData();
      Object.keys(editForm).forEach(k => fd.append(k, editForm[k]));
      await updateProduct(editTarget.id, fd);
      showToast("Listing updated!");
      closeEdit(); load();
    } catch { showToast("Failed to update"); }
    finally { setEditLoading(false); }
  }, [editForm, editTarget, showToast, closeEdit, load]);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") closeEdit(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [closeEdit]);

  const productCount = products.length;
  const activeCount  = products.filter(p => p.is_active).length;

  return (
    <MarketplaceLayout>
      <InjectStyles />

      <div style={{ minHeight:"100vh", background:"#f0f6ff", fontFamily:FONT }}>

        {/* ── HERO (exact mirror of MarketplaceInterests) ── */}
        <div style={s.hero}>
          <div style={s.heroDots} />
          <div style={{ ...s.orb, width:260, height:260, top:-90,  right:-70,  animationDelay:"0s" }} />
          <div style={{ ...s.orb, width:140, height:140, bottom:20, left:50,   animationDelay:"2s" }} />
          <div style={{ ...s.orb, width:90,  height:90,  top:30,   left:"35%", animationDelay:"4s" }} />

          <svg style={s.heroWave} viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path
              style={{ animation:"msp-waveSlide 10s linear infinite" }}
              d="M0,30 C240,55 480,5 720,30 C960,55 1200,5 1440,30 C1680,55 1920,5 2160,30 L2160,60 L0,60 Z"
              fill="#f0f6ff"
            />
            <path
              style={{ animation:"msp-waveSlide 15s linear infinite reverse" }}
              d="M0,42 C300,18 600,56 900,38 C1200,20 1500,52 1800,36 C2000,24 2160,46 2160,40 L2160,60 L0,60 Z"
              fill="#e3f2fd"
              opacity="0.7"
            />
          </svg>

          <div style={s.heroInner}>
            <div style={s.heroLabel}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#34d399", animation:"msp-pulse 1.8s infinite", flexShrink:0 }} />
              Seller Dashboard
            </div>
            <h1 style={s.heroTitle}>
              Your{" "}
              <span style={{
                background:"linear-gradient(90deg, #93c5fd, #34d399)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
              }}>
                Marketplace
              </span>
            </h1>
            <p style={s.heroSub}>
              List products, manage pricing, and track your active inventory — all in one place.
            </p>

            {/* Stat pills */}
            {!listLoading && productCount > 0 && (
              <div style={s.statRow}>
                {[
                  { dot:"#93c5fd", num:productCount,               label:"Listings" },
                  { dot:"#16a34a", num:activeCount,                label:"Active"   },
                  { dot:"#e11d48", num:productCount - activeCount, label:"Inactive" },
                ].map(({ dot, num, label }) => (
                  <div key={label} className="msp-stat-pill" style={s.statPill}>
                    <span style={{ width:9, height:9, borderRadius:"50%", background:dot, flexShrink:0 }} />
                    <span style={{ fontSize:16, fontWeight:800 }}>{num}</span>
                    <span style={{ fontWeight:600 }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={s.body}>
          <div style={{ marginBottom:24 }}>
            <AdSlot variant="leaderboard" />
          </div>

          <div className="msp-layout" style={s.layout}>

            {/* ── Main column ── */}
            <div style={{ flex:1, minWidth:0 }}>

              {/* Mobile sidebar ad */}
              <div className="msp-sidebar-mobile" style={{ display:"none", marginBottom:16 }}>
                <AdSlot variant="rectangle" />
              </div>

              {/* ── Tab Switcher ── */}
              <div style={{
                display:"flex", gap:6,
                background:"#fff",
                padding:"5px", borderRadius:22,
                border:"1.5px solid #e0ecfb",
                boxShadow:"0 4px 32px rgba(21,101,192,0.07)",
                marginBottom:20,
                animation:"msp-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both",
              }}>
                {[
                  { key:"add",      icon:<Icon.Plus />,  label:"Add Product"  },
                  { key:"listings", icon:<Icon.List />,  label:"My Listings", badge: listLoading ? "…" : productCount },
                ].map(({ key, icon, label, badge }) => {
                  const active = tab === key;
                  return (
                    <button key={key}
                      className={`msp-tab${active ? " msp-tab--active" : ""}`}
                      onClick={() => setTab(key)}
                      style={{
                        flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                        padding:"11px 20px", borderRadius:18, border:"none",
                        fontFamily:FONT, fontSize:13, fontWeight:700,
                        background: active
                          ? "linear-gradient(130deg, #0f3460, #1565c0)"
                          : "transparent",
                        color: active ? "#fff" : "#64748b",
                        boxShadow: active ? "0 4px 14px rgba(21,101,192,0.30)" : "none",
                        whiteSpace:"nowrap",
                      }}
                    >
                      <span style={{ width:15, height:15 }}>{icon}</span>
                      <span className="tab-label">{label}</span>
                      {badge !== undefined && (
                        <span style={{
                          fontSize:10, fontWeight:700, padding:"2px 7px",
                          borderRadius:999, minWidth:22, textAlign:"center",
                          background: active ? "rgba(255,255,255,0.22)" : BLUELT,
                          color: active ? "#fff" : BLUE,
                        }}>{badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ── Add Product Panel ── */}
              {tab === "add" && (
                <div style={{
                  background:"#fff", borderRadius:22,
                  boxShadow:"0 4px 32px rgba(21,101,192,0.09), 0 1px 4px rgba(0,0,0,0.04)",
                  border:"1.5px solid #e0ecfb", overflow:"hidden",
                  animation:"msp-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both",
                }}>
                  {/* Panel header — same gradient as Interests hero */}
                  <div style={{
                    background:"linear-gradient(130deg, #0f3460 0%, #1565c0 50%, #1976d2 100%)",
                    padding:"20px 26px", display:"flex", alignItems:"center", gap:12,
                    position:"relative", overflow:"hidden",
                  }}>
                    <div style={{
                      position:"absolute", inset:0, pointerEvents:"none",
                      backgroundImage:"radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
                      backgroundSize:"20px 20px",
                    }} />
                    <span style={{ width:18, height:18, color:"rgba(255,255,255,0.88)", flexShrink:0, position:"relative" }}>
                      <Icon.Plus />
                    </span>
                    <h2 style={{ fontFamily:FONT_D, fontSize:18, fontWeight:900, color:"#fff", letterSpacing:"-0.02em", position:"relative" }}>
                      New Listing
                    </h2>
                  </div>

                  <div style={{ padding:"28px 26px 24px" }}>
                    <FormFields data={form} onChange={handleChange} />

                    {/* Photo upload */}
                    <div style={{ marginTop:18 }}>
                      <label style={LABEL_STYLE}>Photos (Max 5)</label>
                      <div style={{
                        border:`2px dashed #bfdbfe`, borderRadius:14,
                        background:BLUELT, padding:"24px 20px",
                        textAlign:"center", cursor:"pointer", position:"relative",
                      }} className="msp-upload">
                        <input type="file" multiple accept="image/*" ref={fileRef} onChange={handleImages}
                          style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer", width:"100%", height:"100%" }} />
                        <div style={{ width:32, height:32, color:BLUE, margin:"0 auto 8px" }}><Icon.Camera /></div>
                        <p style={{ fontSize:13, color:"#475569", fontFamily:FONT, lineHeight:1.5 }}>
                          <strong style={{ color:BLUE, fontWeight:700 }}>Click to upload</strong> or drag &amp; drop
                        </p>
                        <p style={{ marginTop:4, fontSize:11.5, color:"#94a3b8", fontFamily:FONT }}>
                          JPG, PNG, WEBP · max 5 MB each
                        </p>
                      </div>
                      {previews.length > 0 && (
                        <div style={{ marginTop:14 }}>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                            {previews.map((src, i) => (
                              <img key={i} src={src} alt="" loading="lazy" style={{
                                width:66, height:66, borderRadius:10,
                                objectFit:"cover", border:`2px solid #bfdbfe`,
                                animation:"msp-popIn 0.2s cubic-bezier(0.22,1,0.36,1) both",
                                animationDelay:`${i * 0.05}s`,
                              }} />
                            ))}
                          </div>
                          <p style={{ fontSize:11.5, color:"#94a3b8", marginTop:6, fontFamily:FONT }}>
                            {previews.length} photo{previews.length !== 1 ? "s" : ""} selected
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submit button */}
                    <button
                      className="msp-submit"
                      onClick={handleSubmit}
                      disabled={submitting || !form.title || !form.price}
                      style={{
                        width:"100%", padding:"13px 20px", marginTop:22,
                        background:"linear-gradient(130deg, #0f3460 0%, #1565c0 100%)",
                        color:"#fff", border:"none", borderRadius:14,
                        fontFamily:FONT, fontSize:14, fontWeight:700,
                        letterSpacing:"0.01em", cursor:"pointer",
                        boxShadow:"0 4px 18px rgba(21,101,192,0.28)",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:9,
                        opacity: (submitting || !form.title || !form.price) ? 0.5 : 1,
                      }}
                    >
                      <span style={{ width:17, height:17 }}>
                        {submitting ? <Icon.Spin /> : <Icon.Arrow />}
                      </span>
                      {submitting ? "Posting…" : "Post Listing"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Listings Panel ── */}
              {tab === "listings" && (
                <div style={{
                  background:"#fff", borderRadius:22,
                  boxShadow:"0 4px 32px rgba(21,101,192,0.09), 0 1px 4px rgba(0,0,0,0.04)",
                  border:"1.5px solid #e0ecfb", overflow:"hidden",
                  animation:"msp-fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both",
                }}>
                  {/* Panel header */}
                  <div style={{
                    background:"linear-gradient(130deg, #0f3460 0%, #1565c0 50%, #1976d2 100%)",
                    padding:"20px 26px", display:"flex", alignItems:"center", justifyContent:"space-between",
                    position:"relative", overflow:"hidden",
                  }}>
                    <div style={{
                      position:"absolute", inset:0, pointerEvents:"none",
                      backgroundImage:"radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
                      backgroundSize:"20px 20px",
                    }} />
                    <div style={{ display:"flex", alignItems:"center", gap:12, position:"relative" }}>
                      <span style={{ width:18, height:18, color:"rgba(255,255,255,0.88)", flexShrink:0 }}><Icon.List /></span>
                      <h2 style={{ fontFamily:FONT_D, fontSize:18, fontWeight:900, color:"#fff", letterSpacing:"-0.02em" }}>
                        My Listings
                      </h2>
                    </div>
                    {!listLoading && productCount > 0 && (
                      <span style={{
                        fontSize:11, fontWeight:700, color:"#bfdbfe",
                        background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)",
                        borderRadius:40, padding:"4px 12px", fontFamily:FONT, position:"relative",
                        backdropFilter:"blur(8px)",
                      }}>
                        {productCount} listing{productCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div style={{ padding:"20px 22px 22px" }}>
                    {listLoading ? (
                      <SkeletonList />
                    ) : productCount === 0 ? (
                      <div style={{ textAlign:"center", padding:"56px 20px", animation:"msp-fadeUp 0.45s ease both" }}>
                        <div style={{ fontSize:56, display:"block", marginBottom:16, animation:"msp-floatOrb 4s ease-in-out infinite" }}>📦</div>
                        <h3 style={{ fontFamily:FONT_D, fontSize:20, fontWeight:700, color:"#0f172a", marginBottom:8, letterSpacing:"-0.03em" }}>
                          No listings yet
                        </h3>
                        <p style={{ color:"#94a3b8", fontSize:14, lineHeight:1.6, fontFamily:FONT }}>
                          Switch to the Add Product tab<br />to post your first listing.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                        {products.map((p, i) => (
                          <ProductItem
                            key={p.id} p={p} idx={i}
                            onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle}
                          />
                        ))}
                      </div>
                    )}

                    {/* Inline ad after listings */}
                    {!listLoading && productCount > 0 && (
                      <div style={{ marginTop:20 }}>
                        <AdSlot variant="leaderboard" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar (desktop only) ── */}
            <aside className="msp-sidebar" style={s.sidebar}>
              {!listLoading && productCount > 0 && <SummaryCard products={products} />}

              {/* Tips card */}
              <div style={s.infoCard}>
                <div style={s.infoHead}>
                  <div style={{ fontSize:20 }}>💡</div>
                  <span style={s.infoTitle}>Seller Tips</span>
                </div>
                <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    "Add clear photos to increase buyer interest significantly.",
                    "Set a competitive price by checking similar listings first.",
                    "Mark items as inactive rather than deleting to keep history.",
                  ].map((tip, i) => (
                    <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12.5, color:"#475569", fontFamily:FONT, lineHeight:1.55 }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:BLUE, marginTop:5, flexShrink:0, opacity:0.7 }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <AdSlot variant="rectangle" />
              <div style={{ marginTop:16 }}>
                <AdSlot variant="rectangle" />
              </div>
            </aside>
          </div>

          <div style={{ marginTop:32 }}>
            <AdSlot variant="leaderboard" />
          </div>
        </div>
      </div>

      {/* ── EDIT MODAL ── */}
      {editTarget && (
        <div
          onClick={(e) => e.target === e.currentTarget && closeEdit()}
          style={{
            position:"fixed", inset:0, zIndex:1000,
            background:"rgba(15,52,96,0.62)", backdropFilter:"blur(6px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:16, animation:"msp-fadeIn 0.18s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <div role="dialog" aria-modal="true" style={{
            background:"#fff", borderRadius:24, width:"100%", maxWidth:540,
            maxHeight:"90vh", overflowY:"auto",
            boxShadow:"0 32px 72px rgba(15,52,96,.22), 0 6px 24px rgba(15,52,96,.10)",
            animation:"msp-slideUp 0.28s cubic-bezier(0.22,1,0.36,1) both",
            border:"1.5px solid #e0ecfb",
          }}>
            {/* Modal header */}
            <div style={{
              background:"linear-gradient(130deg, #0f3460 0%, #1565c0 50%, #1976d2 100%)",
              padding:"20px 24px",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              borderRadius:"24px 24px 0 0",
              position:"sticky", top:0, zIndex:2, overflow:"hidden",
            }}>
              <div style={{
                position:"absolute", inset:0, pointerEvents:"none",
                backgroundImage:"radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
                backgroundSize:"20px 20px",
              }} />
              <div style={{ display:"flex", alignItems:"center", gap:10, position:"relative" }}>
                <span style={{ width:17, height:17, color:"rgba(255,255,255,0.88)" }}><Icon.Pencil /></span>
                <h3 style={{ fontFamily:FONT_D, fontSize:18, fontWeight:900, color:"#fff", letterSpacing:"-0.02em" }}>
                  Edit Listing
                </h3>
              </div>
              <button
                className="msp-modal-close"
                onClick={closeEdit}
                aria-label="Close"
                style={{
                  width:32, height:32, background:"rgba(255,255,255,0.13)", border:"none",
                  borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer", color:"#fff", position:"relative",
                }}
              >
                <span style={{ width:15, height:15 }}><Icon.X /></span>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding:"24px 24px 8px" }}>
              <FormFields data={editForm} onChange={handleEditChange} />
            </div>

            {/* Modal footer */}
            <div style={{
              display:"flex", gap:10, justifyContent:"flex-end",
              padding:"18px 24px 24px",
              borderTop:"1px solid #e0ecfb",
              background:"#f7fbff",
            }}>
              <button className="msp-btn-cancel" onClick={closeEdit} style={{
                padding:"10px 22px", background:"#fff", color:"#64748b",
                border:"1.5px solid #e0ecfb", borderRadius:12,
                fontFamily:FONT, fontSize:13, fontWeight:600, cursor:"pointer",
              }}>Cancel</button>
              <button
                className="msp-btn-save"
                onClick={handleSaveEdit}
                disabled={editLoading || !editForm.title || !editForm.price}
                style={{
                  display:"flex", alignItems:"center", gap:8, padding:"10px 24px",
                  background:"linear-gradient(130deg, #0f3460, #1565c0)",
                  color:"#fff", border:"none", borderRadius:12,
                  fontFamily:FONT, fontSize:13, fontWeight:700, cursor:"pointer",
                  boxShadow:"0 3px 12px rgba(21,101,192,0.28)",
                  opacity: (editLoading || !editForm.title || !editForm.price) ? 0.5 : 1,
                }}
              >
                <span style={{ width:14, height:14 }}>{editLoading ? <Icon.Spin /> : <Icon.Save />}</span>
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      <div className={`msp-toast${toast.on ? " on" : ""}`}>
        <span style={{ width:15, height:15, color:"#34d399", flexShrink:0 }}><Icon.Check /></span>
        {toast.msg}
      </div>
    </MarketplaceLayout>
  );
}

/* ─── Shared Styles ──────────────────────────────────────────── */
const s = {
  hero: {
    position:"relative",
    background:"linear-gradient(130deg, #0f3460 0%, #1565c0 50%, #1976d2 100%)",
    overflow:"hidden",
  },
  heroDots: {
    position:"absolute", inset:0, pointerEvents:"none",
    backgroundImage:"radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize:"28px 28px",
  },
  orb: {
    position:"absolute", borderRadius:"50%",
    background:"rgba(255,255,255,0.06)",
    animation:"msp-floatOrb 7s ease-in-out infinite",
    pointerEvents:"none",
  },
  heroWave: {
    position:"absolute", bottom:0, left:0,
    width:"200%", height:60, zIndex:1, pointerEvents:"none",
  },
  heroInner: {
    position:"relative", zIndex:2,
    padding:"36px 32px 72px",
    maxWidth:1100, margin:"0 auto",
  },
  heroLabel: {
    display:"inline-flex", alignItems:"center", gap:7,
    background:"rgba(255,255,255,0.13)",
    border:"1px solid rgba(255,255,255,0.25)",
    borderRadius:40, padding:"5px 14px",
    fontSize:12, fontWeight:700, color:"#bfdbfe",
    fontFamily:FONT, marginBottom:12,
    backdropFilter:"blur(8px)",
    animation:"msp-fadeIn 0.4s ease both",
  },
  heroTitle: {
    fontFamily:FONT_D,
    fontSize:"clamp(26px, 4vw, 42px)",
    fontWeight:900, color:"#fff",
    letterSpacing:"-0.5px", lineHeight:1.15,
    margin:"0 0 8px",
    animation:"msp-fadeUp 0.45s ease both",
    animationDelay:"0.08s",
  },
  heroSub: {
    fontSize:14, color:"rgba(255,255,255,0.7)",
    fontFamily:FONT, fontWeight:400, margin:0,
    animation:"msp-fadeUp 0.45s ease both", animationDelay:"0.16s",
  },
  statRow: {
    display:"flex", flexWrap:"wrap", gap:10, marginTop:24,
    animation:"msp-fadeUp 0.45s ease both", animationDelay:"0.24s",
  },
  statPill: {
    display:"inline-flex", alignItems:"center", gap:8,
    background:"rgba(255,255,255,0.13)",
    backdropFilter:"blur(12px)",
    border:"1px solid rgba(255,255,255,0.22)",
    borderRadius:40, padding:"8px 18px",
    color:"#fff", fontFamily:FONT, fontSize:13, fontWeight:600,
    cursor:"default", transition:"background 0.2s, transform 0.2s",
  },
  body: {
    maxWidth:1100, margin:"0 auto",
    padding:"clamp(16px, 3vw, 32px) clamp(12px, 3vw, 28px)",
    position:"relative", zIndex:2,
  },
  layout: {
    display:"grid",
    gridTemplateColumns:"1fr 280px",
    gap:24, alignItems:"start",
  },
  sidebar: {
    display:"flex", flexDirection:"column", gap:16,
    position:"sticky", top:82,
    animation:"msp-fadeUp 0.45s ease both", animationDelay:"0.2s",
  },
  infoCard: {
    background:"#fff", borderRadius:18,
    border:"1px solid #e0ecfb", padding:"16px 18px",
    boxShadow:"0 2px 16px rgba(21,101,192,0.07)",
  },
  infoHead: {
    display:"flex", alignItems:"center", gap:10, marginBottom:10,
  },
  infoTitle: {
    fontSize:14, fontWeight:800, color:"#0f172a", fontFamily:FONT,
  },
};