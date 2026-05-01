import React, {
  useEffect, useState, useCallback, useMemo, useRef, lazy, Suspense,
} from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  updateRequestStatus,
} from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";

/* ─── Design Tokens ───────────────────────────────────────────────────────── */
const C = {
  ink:       "#0b0f1a",
  inkMid:    "#2d3550",
  inkLight:  "#6b7594",
  ink3:      "#9ba3be",
  line:      "#e6eaf5",
  lineSoft:  "#f0f3fb",
  bg:        "#f5f7fe",
  white:     "#ffffff",
  accent:    "#3d5afe",
  accentDk:  "#1a237e",
  accentLt:  "#e8ecff",
  accentMid: "#c5ceff",
  pend:      "#f59e0b",
  pendBg:    "#fffbeb",
  pendLine:  "#fde68a",
  acpt:      "#10b981",
  acptBg:    "#ecfdf5",
  acptLine:  "#6ee7b7",
  rjct:      "#ef4444",
  rjctBg:    "#fef2f2",
  rjctLine:  "#fca5a5",
};

const F = {
  display: "'DM Serif Display', Georgia, serif",
  body:    "'DM Sans', system-ui, sans-serif",
  mono:    "'DM Mono', monospace",
};

/* ─── Global CSS injection ────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

  @keyframes fadeUp   { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;} }
  @keyframes fadeIn   { from{opacity:0;}to{opacity:1;} }
  @keyframes shimmer  { 0%{background-position:-800px 0;}100%{background-position:800px 0;} }
  @keyframes spin     { to{transform:rotate(360deg);} }
  @keyframes pulse    { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(1.45);} }
  @keyframes slideIn  { from{opacity:0;transform:translateY(22px) scale(0.98);}to{opacity:1;transform:none;} }
  @keyframes bdIn     { from{opacity:0;}to{opacity:1;} }
  @keyframes flashBg  { 0%{background:${C.accentLt};}100%{background:${C.white};} }
  @keyframes marquee  { 0%{transform:translateX(0);}100%{transform:translateX(-50%);} }

  .mn-skel{
    background:linear-gradient(90deg,#eceef8 25%,#dde3f5 50%,#eceef8 75%);
    background-size:800px 100%;
    animation:shimmer 1.6s linear infinite;
    border-radius:16px;
  }

  .mn-card{
    animation:fadeUp .3s cubic-bezier(.22,1,.36,1) both;
    transition:box-shadow .2s ease, border-color .2s ease, transform .2s ease;
    will-change:transform;accent
    cursor:pointer;
  }
  .mn-card:hover{
    transform:translateY(-2px);
    box-shadow:0 12px 40px rgba(61,90,254,.12),0 2px 8px rgba(61,90,254,.06)!important;
    border-color:${C.accentMid}!important;
  }
  .mn-card:active{transform:translateY(0) scale(.995);}
  .mn-card.mn-flash{animation:flashBg .55s ease forwards;}

  .mn-tab{
    cursor:pointer; border:none; outline:none;
    transition:all .15s ease;
  }
  .mn-tab:hover:not(.mn-tab-on){
    background:${C.accentLt}!important;
    color:${C.accent}!important;
    border-color:${C.accentMid}!important;
  }

  .mn-btn-mark{transition:all .15s ease; cursor:pointer;}
  .mn-btn-mark:hover{background:${C.accentLt}!important; color:${C.accent}!important;}

  .mn-status-btn{
    cursor:pointer; outline:none;
    transition:all .15s ease;
  }
  .mn-status-btn:hover:not(.mn-status-active){
    transform:translateY(-1px);
    box-shadow:0 3px 12px rgba(0,0,0,.12);
  }
  .mn-status-btn:active{transform:scale(.96);}

  .mn-modal-close{
    cursor:pointer; border:none;
    transition:all .15s ease;
  }
  .mn-modal-close:hover{background:rgba(239,68,68,.18)!important; transform:scale(1.1);}

  .mn-done-btn{transition:all .15s ease; cursor:pointer;}
  .mn-done-btn:hover{box-shadow:0 8px 24px rgba(61,90,254,.38)!important; transform:translateY(-1px)!important;}

  .mn-cancel-btn{transition:all .15s ease; cursor:pointer;}
  .mn-cancel-btn:hover{background:${C.accentLt}!important; color:${C.accent}!important;}

  .mn-scroll::-webkit-scrollbar{width:4px;}
  .mn-scroll::-webkit-scrollbar-track{background:transparent;}
  .mn-scroll::-webkit-scrollbar-thumb{background:#d0d9f0;border-radius:9px;}
  .mn-scroll::-webkit-scrollbar-thumb:hover{background:#b0bde8;}

  @media(max-width:860px){
    .mn-layout{grid-template-columns:1fr!important;}
    .mn-sidebar{display:none!important;}
  }
  @media(max-width:520px){
    .mn-header-row{flex-direction:column!important;align-items:flex-start!important;gap:10px!important;}
    .mn-modal-wrap{max-width:calc(100vw - 16px)!important;max-height:96vh!important;}
    .mn-stat-row{gap:6px!important;}
    .mn-stat-pill{padding:6px 12px!important;font-size:11px!important;}
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("mn-css")) return;
    const el = document.createElement("style");
    el.id = "mn-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
  return null;
}

/* ─── SVG Icon library ────────────────────────────────────────────────────── */
const Icon = {
  Bell: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Check: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  CheckCircle: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  X: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  XCircle: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  Clock: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  MapPin: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  User: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Mail: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  Phone: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.55a16 16 0 0 0 6.08 6.08l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Home: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Tag: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Eye: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Hash: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/>
      <line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>
    </svg>
  ),
  Package: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Info: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Activity: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Inbox: (p) => (
    <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  ),
};

/* ─── Status configuration ────────────────────────────────────────────────── */
const STATUS = {
  pending:  { bg:C.pendBg,  color:"#92400e", border:C.pendLine,  dot:C.pend,  label:"Pending",  bar:"linear-gradient(180deg,#fcd34d,#f59e0b)" },
  accepted: { bg:C.acptBg,  color:"#065f46", border:C.acptLine,  dot:C.acpt,  label:"Accepted", bar:"linear-gradient(180deg,#6ee7b7,#10b981)" },
  rejected: { bg:C.rjctBg,  color:"#991b1b", border:C.rjctLine,  dot:C.rjct,  label:"Rejected", bar:"linear-gradient(180deg,#fca5a5,#ef4444)" },
};
const STATUS_BTN_CFG = {
  pending:  { activeBg:C.pend, activeColor:"#fff", activeBorder:C.pend },
  accepted: { activeBg:C.acpt, activeColor:"#fff", activeBorder:C.acpt },
  rejected: { activeBg:C.rjct, activeColor:"#fff", activeBorder:C.rjct },
};
const getStatus = (s) => STATUS[s] ?? { bg:C.lineSoft, color:C.inkLight, border:C.line, dot:C.ink3, label:s ?? "Unknown", bar:"#e0e7ff" };

const FILTERS = ["all","pending","accepted","rejected"];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const str     = (v)  => (typeof v === "string" && v.trim() ? v.trim() : null);
const FALLBACK = "—";
const getBuyerName = (n) =>
  [str(n?.buyer_first_name), str(n?.buyer_last_name)].filter(Boolean).join(" ") || "Unknown Buyer";
const getInitials = (name = "") => {
  const p = name.trim().split(" ").filter(Boolean);
  return p.length >= 2 ? (p[0][0]+p[1][0]).toUpperCase() : name.slice(0,2).toUpperCase() || "?";
};
const timeAgo = (d) => {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};
const formatDate  = (d) => !d ? "—" : new Date(d).toLocaleString(undefined, { dateStyle:"medium", timeStyle:"short" });
const formatPrice = (p) => { const n = parseFloat(p); return isNaN(n) ? null : `ر.ق${n.toLocaleString("en-IN",{ maximumFractionDigits:0 })}`; };
const countByStatus = (items, status) => (Array.isArray(items) ? items : []).filter(i => i?.status === status).length;

/* ─── Ad Slot ─────────────────────────────────────────────────────────────── */
function AdSlot({ variant = "leaderboard" }) {
  const h = variant === "leaderboard" ? 90 : 250;
  const label = variant === "leaderboard" ? "728 × 90 — Leaderboard" : "300 × 250 — Rectangle";
  return (
    <div style={{
      width:"100%", height:h, borderRadius:12,
      background:`repeating-linear-gradient(45deg,${C.bg},${C.bg} 8px,${C.lineSoft} 8px,${C.lineSoft} 16px)`,
      border:`1.5px dashed ${C.line}`,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4,
    }}>
      <span style={{ fontSize:9, fontWeight:700, color:C.ink3, letterSpacing:"1.5px", fontFamily:F.body, textTransform:"uppercase" }}>
        Advertisement
      </span>
      <span style={{ fontSize:11, color:C.line, fontFamily:F.mono, fontWeight:500 }}>{label}</span>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function SkeletonCard({ delay = 0 }) {
  return (
    <div className="mn-skel" style={{
      height:104, animationDelay:`${delay}ms`,
      border:`1px solid ${C.line}`,
    }} />
  );
}

/* ─── Status Badge ────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const st = getStatus(status);
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      background:st.bg, border:`1px solid ${st.border}`,
      color:st.color, borderRadius:6, padding:"3px 10px",
      fontFamily:F.body, fontSize:10.5, fontWeight:700,
      letterSpacing:".08em", textTransform:"uppercase",
    }}>
      <span style={{
        width:6, height:6, borderRadius:"50%", background:st.dot, flexShrink:0,
        animation: status === "pending" ? "pulse 1.8s infinite" : undefined,
      }}/>
      {st.label}
    </span>
  );
}

/* ─── Avatar ──────────────────────────────────────────────────────────────── */
function Avatar({ name, initials, image, size = 32 }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:`linear-gradient(135deg,${C.accentLt},${C.accentMid})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:Math.round(size*.34), fontWeight:700, color:C.accent,
      flexShrink:0, overflow:"hidden", fontFamily:F.body,
      border:`1.5px solid ${C.line}`,
    }}>
      {image && !failed
        ? <img src={image} alt={name} loading="lazy" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={() => setFailed(true)}/>
        : initials
      }
    </div>
  );
}

/* ─── Product Thumbnail ───────────────────────────────────────────────────── */
function Thumb({ src, alt, size, fullHeight = false }) {
  const [failed, setFailed] = useState(false);
  const dim = typeof size === "number"
    ? { width:size, height:size }
    : { width:"100%", height: fullHeight ? "100%" : size };
  if (src && !failed) {
    return <img src={src} alt={alt} loading="lazy" decoding="async" style={{ ...dim, objectFit:"cover", display:"block" }} onError={() => setFailed(true)}/>;
  }
  return (
    <div style={{
      ...dim, background:`linear-gradient(135deg,${C.accentLt},${C.accentMid})`,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <Icon.Package width={typeof size === "number" ? Math.round(size*.38) : 28} height={typeof size === "number" ? Math.round(size*.38) : 28} style={{ color:C.accent }}/>
    </div>
  );
}

/* ─── Stat Pills ──────────────────────────────────────────────────────────── */
function StatPills({ pending, accepted, rejected, total, unread }) {
  const pills = [
    { dot:C.pend, num:pending,  label:"Pending"  },
    { dot:C.acpt, num:accepted, label:"Accepted" },
    { dot:C.rjct, num:rejected, label:"Rejected" },
    { dot:C.accent, num:total,  label:"Total"    },
    { dot:"#a78bfa", num:unread, label:"Unread"  },
  ];
  return (
    <div className="mn-stat-row" style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:24, animation:"fadeUp .4s ease .22s both" }}>
      {pills.map(({ dot, num, label }) => (
        <div key={label} style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"rgba(255,255,255,0.11)", backdropFilter:"blur(10px)",
          border:"1px solid rgba(255,255,255,0.2)",
          borderRadius:8, padding:"7px 16px", className:"mn-stat-pill",
          fontFamily:F.body, fontSize:12, fontWeight:500, color:"#fff",
        }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:dot, flexShrink:0 }}/>
          <b style={{ fontWeight:700, fontSize:15, letterSpacing:"-0.5px" }}>{num}</b>
          <span style={{ opacity:.75 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Summary Sidebar ─────────────────────────────────────────────────────── */
function SummaryCard({ items }) {
  const pending  = countByStatus(items, "pending");
  const accepted = countByStatus(items, "accepted");
  const rejected = countByStatus(items, "rejected");
  const total    = items.length || 1;
  const rows = [
    { label:"Pending",  val:pending,  dot:C.pend, pct:(pending/total)*100  },
    { label:"Accepted", val:accepted, dot:C.acpt, pct:(accepted/total)*100 },
    { label:"Rejected", val:rejected, dot:C.rjct, pct:(rejected/total)*100 },
  ];
  return (
    <div style={S.sideCard}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{ width:32, height:32, borderRadius:9, background:C.accentLt, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon.Activity width={16} height={16} style={{ color:C.accent }}/>
        </div>
        <span style={{ fontFamily:F.body, fontSize:13.5, fontWeight:700, color:C.ink }}>Overview</span>
      </div>
      <p style={{ fontFamily:F.body, fontSize:11, color:C.ink3, marginBottom:14, fontWeight:500 }}>
        {items.length} notification{items.length !== 1 ? "s" : ""} total
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {rows.map(row => (
          <div key={row.label}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, fontFamily:F.body, fontSize:12, color:C.inkLight, fontWeight:500 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:row.dot }}/>
                {row.label}
              </div>
              <span style={{ fontFamily:F.body, fontSize:13, fontWeight:700, color:C.ink }}>{row.val}</span>
            </div>
            <div style={{ height:4, background:C.lineSoft, borderRadius:99, overflow:"hidden" }}>
              <div style={{
                height:"100%", borderRadius:99, background:row.dot,
                width:`${Math.min(100, row.pct)}%`,
                transition:"width .8s cubic-bezier(.22,1,.36,1)",
              }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tips Card ───────────────────────────────────────────────────────────── */
function TipsCard() {
  const tips = [
    "Click any notification to view buyer details and update its status.",
    "Use Accept to confirm interest and initiate a deal with the buyer.",
    "Rejected requests are hidden from buyers but stay in your records.",
  ];
  return (
    <div style={S.sideCard}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <div style={{ width:32, height:32, borderRadius:9, background:C.accentLt, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon.Info width={16} height={16} style={{ color:C.accent }}/>
        </div>
        <span style={{ fontFamily:F.body, fontSize:13.5, fontWeight:700, color:C.ink }}>Quick Tips</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        {tips.map((t, i) => (
          <div key={i} style={{ display:"flex", gap:9, alignItems:"flex-start" }}>
            <div style={{
              width:18, height:18, borderRadius:5, background:C.accentLt,
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, marginTop:1,
            }}>
              <span style={{ fontSize:9, fontWeight:800, color:C.accent, fontFamily:F.mono }}>
                {String(i+1).padStart(2,"0")}
              </span>
            </div>
            <p style={{ fontFamily:F.body, fontSize:12, color:C.inkLight, lineHeight:1.55, margin:0 }}>{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Empty State ─────────────────────────────────────────────────────────── */
function EmptyState({ filter }) {
  return (
    <div style={{ textAlign:"center", padding:"80px 24px", animation:"fadeUp .4s ease both" }}>
      <div style={{
        width:64, height:64, borderRadius:20, background:C.accentLt,
        display:"flex", alignItems:"center", justifyContent:"center",
        margin:"0 auto 20px",
      }}>
        <Icon.Inbox width={30} height={30} style={{ color:C.accent }}/>
      </div>
      <h3 style={{ fontFamily:F.display, fontSize:22, fontWeight:700, color:C.ink, marginBottom:8 }}>
        No {filter !== "all" ? filter : ""} notifications
      </h3>
      <p style={{ fontFamily:F.body, fontSize:13, color:C.ink3, lineHeight:1.6, maxWidth:280, margin:"0 auto" }}>
        You're all caught up — nothing here right now.
      </p>
    </div>
  );
}

/* ─── Notification Card ───────────────────────────────────────────────────── */
const NotificationCard = React.memo(function NotificationCard({ n, i, isFlashing, onOpen }) {
  const st        = getStatus(n?.status);
  const buyerName = getBuyerName(n);
  const price     = formatPrice(n?.product_price);
  const statusKey = (n?.status || "pending").toLowerCase();

  return (
    <div
      className={`mn-card${isFlashing ? " mn-flash" : ""}`}
      style={{
        animationDelay:`${i * 0.04}s`,
        background: n.is_read ? C.white : "#f7f9ff",
        border:`1px solid ${n.is_read ? C.line : C.accentMid}`,
        borderRadius:16,
        boxShadow:`0 2px 16px rgba(61,90,254,0.05)`,
        display:"grid",
        gridTemplateColumns:"4px 80px 1fr auto",
        alignItems:"stretch",
        overflow:"hidden",
        minHeight:100,
      }}
      onClick={() => onOpen(n)}
    >
      {/* Accent bar */}
      <div style={{ width:4, background:st.bar, flexShrink:0 }}/>

      {/* Thumbnail */}
      <div style={{ position:"relative", overflow:"hidden", background:C.accentLt, flexShrink:0 }}>
        <Thumb src={n.product_image} alt={str(n.product_title) ?? "Product"} size="100%" fullHeight/>
        {n.product_city && (
          <div style={{
            position:"absolute", bottom:6, left:6,
            background:"rgba(11,15,26,0.72)", backdropFilter:"blur(6px)",
            borderRadius:5, padding:"2px 6px",
            display:"flex", alignItems:"center", gap:3,
          }}>
            <Icon.MapPin width={8} height={8} style={{ color:"rgba(255,255,255,0.7)", flexShrink:0 }}/>
            <span style={{ fontSize:8.5, fontWeight:600, color:"rgba(255,255,255,0.9)", fontFamily:F.body, letterSpacing:".04em" }}>
              {n.product_city}
            </span>
          </div>
        )}
        {!n.is_read && (
          <span style={{
            position:"absolute", top:7, right:7,
            width:8, height:8, borderRadius:"50%",
            background:C.accent, border:"2px solid #fff",
          }}/>
        )}
      </div>

      {/* Body */}
      <div style={{ padding:"12px 14px", display:"flex", flexDirection:"column", justifyContent:"space-between", gap:6, minWidth:0 }}>
        <div>
          <h3 style={{
            fontFamily:F.body, fontSize:13.5, fontWeight:700, color:C.ink,
            letterSpacing:"-0.02em", whiteSpace:"nowrap", overflow:"hidden",
            textOverflow:"ellipsis", marginBottom:6,
          }} title={str(n.product_title) ?? "Untitled Product"}>
            {str(n.product_title) ?? "Untitled Product"}
          </h3>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <Avatar name={buyerName} initials={getInitials(buyerName)} image={n.buyer_profile_image} size={20}/>
            <span style={{ fontSize:11.5, color:C.inkLight, fontFamily:F.body, fontWeight:500 }}>{buyerName}</span>
            <span style={{ fontSize:11, color:C.ink3, fontFamily:F.body }}>· interested</span>
          </div>
          {price && (
            <span style={{ fontSize:12.5, fontWeight:800, color:C.accent, fontFamily:F.body, letterSpacing:"-0.02em" }}>{price}</span>
          )}
        </div>
        <StatusBadge status={statusKey}/>
      </div>

      {/* Meta */}
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"flex-end", justifyContent:"space-between",
        padding:"12px 14px", borderLeft:`1px solid ${C.lineSoft}`, minWidth:72, flexShrink:0,
      }}>
        <span style={{ fontSize:10, color:C.ink3, fontFamily:F.body, fontWeight:500, whiteSpace:"nowrap" }}>
          {timeAgo(n.created_at)}
        </span>
        {!n.is_read && (
          <span style={{
            fontSize:9, fontWeight:700, color:C.accent,
            background:C.accentLt, borderRadius:5,
            padding:"2px 7px", fontFamily:F.body, letterSpacing:".07em", textTransform:"uppercase",
          }}>New</span>
        )}
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════════ */
export default function MarketplaceNotifications() {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [flashId, setFlashId] = useState(null);
  const [modal,   setModal]   = useState(null);

  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchNotifications();
      const p   = res?.data ?? res;
      const arr = Array.isArray(p?.data) ? p.data : Array.isArray(p) ? p : [];
      setItems(arr);
      setTotal(p?.total ?? p?.count ?? arr.length);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const handleMarkAll = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setItems(prev => prev.map(n => ({ ...n, is_read:true })));
    } catch(e) { console.error(e); }
  }, []);

  const handleRead = useCallback(async (id) => {
    const n = itemsRef.current.find(x => x.id === id);
    if (!n || n.is_read) return;
    try {
      await markNotificationRead(id);
      setFlashId(id);
      setTimeout(() => setFlashId(null), 600);
      setItems(prev => prev.map(x => x.id === id ? { ...x, is_read:true } : x));
    } catch(e) { console.error(e); }
  }, []);

  const handleStatusUpdate = useCallback((id, newStatus) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, status:newStatus } : x));
    setModal(prev => prev?.id === id ? { ...prev, status:newStatus } : prev);
  }, []);

  const openModal  = useCallback((n) => { setModal(n); handleRead(n.id); }, [handleRead]);
  const closeModal = useCallback(() => setModal(null), []);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [closeModal]);

  const safe     = useMemo(() => Array.isArray(items) ? items : [], [items]);
  const filtered = useMemo(
    () => filter === "all" ? safe : safe.filter(n => n?.status === filter),
    [safe, filter]
  );
  const unread  = useMemo(() => safe.filter(n => !n?.is_read).length, [safe]);
  const countOf = useCallback(
    (f) => f === "all" ? safe.length : safe.filter(n => n?.status === f).length,
    [safe]
  );

  const pending  = countByStatus(safe, "pending");
  const accepted = countByStatus(safe, "accepted");
  const rejected = countByStatus(safe, "rejected");

  return (
    <MarketplaceLayout>
      <InjectStyles/>

      <div style={{ minHeight:"100vh", background:C.bg, fontFamily:F.body }}>

        {/* ── HERO ── */}
        <div style={{
          position:"relative",
          background:`linear-gradient(135deg, ${C.accentDk} 30%, ${C.accent} 70%, #3147c7 90%)`,
          overflow:"hidden",
        }}>
          {/* Subtle grid texture */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize:"40px 40px",
          }}/>
          {/* Glow orbs */}
          <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.05)", top:-150, right:-100, pointerEvents:"none" }}/>
          <div style={{ position:"absolute", width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", bottom:-60, left:80, pointerEvents:"none" }}/>

          <div style={{ position:"relative", zIndex:1, maxWidth:1080, margin:"0 auto", padding:"40px 28px 80px" }}>
            {/* Eyebrow label */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:7,
              background:"rgba(255,255,255,0.12)", backdropFilter:"blur(10px)",
              border:"1px solid rgba(255,255,255,0.22)", borderRadius:7,
              padding:"5px 13px", marginBottom:14,
              fontFamily:F.body, fontSize:11, fontWeight:700,
              color:"rgba(255,255,255,0.85)", letterSpacing:".06em", textTransform:"uppercase",
              animation:"fadeIn .4s ease both",
            }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#6ee7b7", animation:"pulse 2s infinite" }}/>
              Notifications Dashboard
            </div>

            <h1 style={{
              fontFamily:F.display,
              fontSize:"clamp(28px,4.5vw,46px)",
              fontWeight:700, color:"#fff",
              letterSpacing:"-0.5px", lineHeight:1.12,
              marginBottom:10,
              animation:"fadeUp .4s ease .08s both",
            }}>
              Buyer Requests &amp;{" "}
              <span style={{ fontStyle:"italic", color:"rgba(255,255,255,0.72)" }}>Notifications</span>
            </h1>

            <p style={{
              fontFamily:F.body, fontSize:13.5,
              color:"rgba(255,255,255,0.65)", fontWeight:400,
              animation:"fadeUp .4s ease .16s both", maxWidth:480,
            }}>
              Stay on top of every buyer interest — review, respond, and manage requests in real time.
            </p>

            {!loading && safe.length > 0 && (
              <StatPills pending={pending} accepted={accepted} rejected={rejected} total={safe.length} unread={unread}/>
            )}
          </div>

          {/* Wave separator */}
          <svg style={{ position:"absolute", bottom:0, left:0, width:"100%", pointerEvents:"none" }} viewBox="0 0 1440 48" preserveAspectRatio="none">
            <path d="M0,24 C360,48 720,0 1080,24 C1260,36 1380,18 1440,24 L1440,48 L0,48 Z" fill={C.bg}/>
          </svg>
        </div>

        {/* ── BODY ── */}
        <div style={{ maxWidth:1080, margin:"0 auto", padding:"clamp(16px,3vw,28px) clamp(12px,3vw,24px)" }}>
          {/* Leaderboard ad */}
          <div style={{ marginBottom:20 }}>
            <AdSlot variant="leaderboard"/>
          </div>

          <div className="mn-layout" style={{ display:"grid", gridTemplateColumns:"1fr 268px", gap:20, alignItems:"start" }}>

            {/* ── Main list ── */}
            <div style={{ minWidth:0 }}>
              {/* Filter bar */}
              <div style={{
                background:C.white, borderRadius:16,
                border:`1px solid ${C.line}`,
                boxShadow:"0 2px 20px rgba(61,90,254,0.06)",
                overflow:"hidden",
                position:"sticky", top:10, zIndex:50,
                animation:"fadeUp .35s ease both",
                marginBottom:14,
              }}>
                {/* Header */}
                <div className="mn-header-row" style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  gap:10, padding:"14px 18px", borderBottom:`1px solid ${C.lineSoft}`,
                  flexWrap:"wrap",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{
                      width:36, height:36, borderRadius:10, flexShrink:0,
                      background:`linear-gradient(135deg,${C.accentDk},${C.accent})`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      <Icon.Bell width={17} height={17} style={{ color:"#fff" }}/>
                    </div>
                    <div>
                      <h2 style={{ fontFamily:F.body, fontSize:15, fontWeight:700, color:C.ink, letterSpacing:"-0.03em", marginBottom:1 }}>
                        Inbox
                      </h2>
                      <p style={{ fontFamily:F.body, fontSize:11, color:C.ink3, fontWeight:500 }}>
                        {total} total &middot; {unread} unread
                      </p>
                    </div>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
                    {unread > 0 && (
                      <span style={{
                        display:"inline-flex", alignItems:"center", gap:5,
                        background:C.accentLt, color:C.accent,
                        fontSize:11, fontWeight:700, padding:"4px 10px",
                        borderRadius:6, border:`1px solid ${C.accentMid}`,
                        fontFamily:F.body,
                      }}>
                        <span style={{ width:6, height:6, borderRadius:"50%", background:C.accent, animation:"pulse 1.6s infinite" }}/>
                        {unread} new
                      </span>
                    )}
                    <button className="mn-btn-mark" onClick={handleMarkAll} style={{
                      fontFamily:F.body, fontSize:12, fontWeight:600, color:C.inkLight,
                      background:C.lineSoft, border:`1px solid ${C.line}`,
                      padding:"6px 14px", borderRadius:8, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap",
                    }}>
                      <Icon.Check width={12} height={12}/>
                      Mark all read
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display:"flex", gap:5, padding:"8px 16px", flexWrap:"wrap" }}>
                  {FILTERS.map(f => {
                    const active = filter === f;
                    const dotColor = STATUS[f]?.dot;
                    return (
                      <button
                        key={f}
                        className={`mn-tab${active ? " mn-tab-on" : ""}`}
                        onClick={() => setFilter(f)}
                        style={{
                          fontFamily:F.body, fontSize:11.5, fontWeight: active ? 700 : 500,
                          padding:"4px 12px", borderRadius:7,
                          border:`1px solid ${active ? C.accent : C.line}`,
                          background: active ? C.accent : C.white,
                          color: active ? "#fff" : C.inkLight,
                          display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap",
                        }}
                      >
                        {dotColor && (
                          <span style={{
                            width:6, height:6, borderRadius:"50%", flexShrink:0,
                            background: active ? "rgba(255,255,255,0.6)" : dotColor,
                          }}/>
                        )}
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span style={{
                          fontSize:10, fontWeight:700, padding:"1px 5px",
                          borderRadius:4, minWidth:18, textAlign:"center",
                          background: active ? "rgba(255,255,255,0.2)" : C.accentLt,
                          color: active ? "#fff" : C.accent,
                          fontFamily:F.mono,
                        }}>{countOf(f)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card list */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {loading
                  ? [0,1,2,3].map(i => <SkeletonCard key={i} delay={i * 100}/>)
                  : filtered.length === 0
                    ? <EmptyState filter={filter}/>
                    : filtered.map((n, i) => (
                        <NotificationCard
                          key={n.id}
                          n={n} i={i}
                          isFlashing={flashId === n.id}
                          onOpen={openModal}
                        />
                      ))
                }
              </div>

              {!loading && filtered.length > 0 && (
                <p style={{ fontFamily:F.body, fontSize:11, color:C.ink3, textAlign:"center", padding:"14px 0 4px", fontWeight:500 }}>
                  Showing {filtered.length} of {total} notification{total !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* ── Sidebar ── */}
            <aside className="mn-sidebar" style={{
              display:"flex", flexDirection:"column", gap:14,
              position:"sticky", top:70,
              animation:"fadeUp .4s ease .18s both",
            }}>
              {!loading && safe.length > 0 && <SummaryCard items={safe}/>}
              <TipsCard/>
              <AdSlot variant="rectangle"/>
              <div style={{ marginTop:4 }}>
                <AdSlot variant="rectangle"/>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {modal && (
        <DetailModal n={modal} onClose={closeModal} onStatusUpdate={handleStatusUpdate}/>
      )}
    </MarketplaceLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DETAIL MODAL
════════════════════════════════════════════════════════════════════════════ */
function DetailModal({ n, onClose, onStatusUpdate }) {
  const buyerName = getBuyerName(n);
  const initials  = getInitials(buyerName);
  const price     = formatPrice(n.product_price);

  const [status, setStatus] = useState(n.status ?? "pending");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleStatusChange = useCallback(async (val) => {
    if (val === status || saving) return;
    const prev = status;
    setStatus(val);
    setSaving(true);
    setSaved(false);
    try {
      await updateRequestStatus(n.id, val);
      onStatusUpdate(n.id, val);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch(e) {
      console.error(e);
      setStatus(prev);
    } finally {
      setSaving(false);
    }
  }, [status, saving, n.id, onStatusUpdate]);

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:200,
        background:"rgba(11,15,26,0.6)", backdropFilter:"blur(8px)",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:12, animation:"bdIn .18s ease",
      }}
    >
      <div
        className="mn-modal-wrap"
        onClick={e => e.stopPropagation()}
        style={{
          background:C.white, borderRadius:20, width:"100%", maxWidth:500,
          maxHeight:"88vh", overflow:"hidden",
          boxShadow:"0 40px 80px rgba(11,15,26,.22), 0 8px 24px rgba(11,15,26,.08)",
          animation:"slideIn .22s cubic-bezier(.22,1,.36,1)",
          display:"flex", flexDirection:"column",
          border:`1px solid ${C.line}`,
        }}
      >
        {/* Modal Header */}
        <div style={{
          background:`linear-gradient(135deg, ${C.accentDk} 0%, ${C.accent} 100%)`,
          padding:"20px 20px 0", flexShrink:0, position:"relative", overflow:"hidden",
        }}>
          {/* Grid texture */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            backgroundImage:"linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize:"24px 24px",
          }}/>

          {/* Close */}
          <button className="mn-modal-close" onClick={onClose} style={{
            position:"absolute", top:12, right:12, zIndex:1,
            width:30, height:30, borderRadius:"50%",
            background:"rgba(255,255,255,0.12)",
            color:"#fff", fontSize:0,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <Icon.X width={14} height={14} style={{ color:"#fff" }}/>
          </button>

          {/* Product row */}
          <div style={{ position:"relative", zIndex:1, display:"flex", gap:14, alignItems:"center", paddingRight:40, marginBottom:16 }}>
            <div style={{ width:56, height:56, borderRadius:12, overflow:"hidden", flexShrink:0, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.1)" }}>
              <Thumb src={n.product_image} alt={str(n.product_title) ?? "Product"} size={56} fullHeight/>
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <p style={{
                fontFamily:F.display, fontSize:18, fontWeight:700, color:"#fff",
                marginBottom:6, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                letterSpacing:"-0.2px",
              }}>{str(n.product_title) ?? "Untitled Product"}</p>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                {price
                  ? <span style={{ fontSize:14, fontWeight:700, color:"#bfdbfe", fontFamily:F.body }}>{price}</span>
                  : <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)", fontStyle:"italic", fontFamily:F.body }}>Price not listed</span>
                }
                {str(n.product_city) && (
                  <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:11.5, color:"rgba(255,255,255,0.6)", fontFamily:F.body }}>
                    <Icon.MapPin width={10} height={10}/> {n.product_city}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status strip */}
          <div style={{
            background:"rgba(0,0,0,0.2)", margin:"0 -20px",
            padding:"10px 20px",
            display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
            position:"relative", zIndex:1,
          }}>
            <span style={{
              fontSize:9.5, color:"rgba(255,255,255,0.45)", fontWeight:700,
              letterSpacing:".12em", textTransform:"uppercase", fontFamily:F.body, flexShrink:0,
            }}>Set Status</span>

            <div style={{ display:"flex", gap:5, flex:1, flexWrap:"wrap" }}>
              {Object.entries(STATUS_BTN_CFG).map(([key, cfg]) => {
                const isActive = status === key;
                const IconComp = key === "accepted" ? Icon.CheckCircle : key === "rejected" ? Icon.XCircle : Icon.Clock;
                return (
                  <button key={key} className={`mn-status-btn${isActive ? " mn-status-active" : ""}`}
                    onClick={() => handleStatusChange(key)}
                    style={{
                      fontFamily:F.body, fontSize:11.5, fontWeight:700,
                      padding:"5px 12px", borderRadius:7,
                      border:`1.5px solid ${isActive ? cfg.activeBorder : "rgba(255,255,255,0.2)"}`,
                      background: isActive ? cfg.activeBg : "rgba(255,255,255,0.08)",
                      color: isActive ? cfg.activeColor : "rgba(255,255,255,0.75)",
                      display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap",
                    }}
                  >
                    <IconComp width={11} height={11}/>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                );
              })}
            </div>

            <span style={{
              fontSize:10.5, color:"rgba(255,255,255,0.5)",
              display:"flex", alignItems:"center", gap:4, flexShrink:0,
              fontFamily:F.body,
            }}>
              {saving ? (
                <>
                  <span style={{
                    width:10, height:10, borderRadius:"50%",
                    border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff",
                    animation:"spin .7s linear infinite", display:"inline-block",
                  }}/>
                  Saving…
                </>
              ) : saved ? (
                <>
                  <Icon.Check width={10} height={10}/>
                  Saved
                </>
              ) : null}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="mn-scroll" style={{
          flex:1, padding:"18px 20px 8px",
          overflowY:"auto", overscrollBehavior:"contain",
          WebkitOverflowScrolling:"touch",
        }}>
          {/* Buyer Details */}
          <SectionLabel icon={<Icon.User width={11} height={11}/>}>Buyer Details</SectionLabel>
          <div style={S.modalBox}>
            <div style={{
              padding:"14px 16px", display:"flex", alignItems:"center", gap:12,
              borderBottom:`1px solid ${C.lineSoft}`,
            }}>
              <Avatar name={buyerName} initials={initials} image={n.buyer_profile_image} size={48}/>
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ fontFamily:F.body, fontWeight:700, fontSize:15, color:C.ink, marginBottom:3, letterSpacing:"-0.02em" }}>
                  {buyerName}
                </p>
                {str(n.buyer_email)
                  ? <a href={`mailto:${n.buyer_email}`}
                      onClick={e => e.stopPropagation()}
                      style={{ color:C.accent, textDecoration:"none", fontFamily:F.body, fontSize:12 }}
                    >{n.buyer_email}</a>
                  : <span style={{ color:C.ink3, fontStyle:"italic", fontFamily:F.body, fontSize:12 }}>No email provided</span>
                }
              </div>
              <StatusBadge status={status}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
              {[
                { label:"Phone",   Icon_:Icon.Phone,  value:`+974 ${str(n.buyer_phone) || FALLBACK}` },
                { label:"City",    Icon_:Icon.MapPin,  value:str(n.buyer_city)    ?? FALLBACK },
                { label:"State",   Icon_:Icon.Tag,     value:str(n.buyer_state)   ?? FALLBACK },
                { label:"Address", Icon_:Icon.Home,    value:str(n.buyer_address) ?? FALLBACK, wide:true },
              ].map((row, idx) => (
                <div key={row.label} style={{
                  gridColumn: row.wide ? "1/-1" : undefined,
                  padding:"10px 16px",
                  borderTop:`1px solid ${C.lineSoft}`,
                  borderRight: (!row.wide && idx % 2 === 0) ? `1px solid ${C.lineSoft}` : undefined,
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                    <row.Icon_ width={10} height={10} style={{ color:C.ink3 }}/>
                    <span style={{ fontSize:9.5, color:C.ink3, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", fontFamily:F.body }}>
                      {row.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize:12.5, fontWeight:600, fontFamily:F.body,
                    color: row.value === FALLBACK ? C.line : C.ink,
                    fontStyle: row.value === FALLBACK ? "italic" : "normal",
                  }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Request Info */}
          <SectionLabel icon={<Icon.Hash width={11} height={11}/>}>Request Info</SectionLabel>
          <div style={{ ...S.modalBox, marginBottom:18 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
              {[
                { label:"Status",     Icon_:Icon.Tag,   node:<StatusBadge status={status}/> },
                { label:"Product ID", Icon_:Icon.Hash,  text: n.product_id != null ? `#${n.product_id}` : FALLBACK },
                { label:"Received",   Icon_:Icon.Clock, text: formatDate(n.created_at), wide:true },
                { label:"Read",       Icon_:Icon.Eye,   text: n.is_read ? "Read" : "Unread" },
              ].map((row, idx) => (
                <div key={row.label} style={{
                  gridColumn: row.wide ? "1/-1" : undefined,
                  padding:"10px 16px",
                  borderTop: idx > 0 ? `1px solid ${C.lineSoft}` : undefined,
                  borderRight: (!row.wide && idx % 2 === 0) ? `1px solid ${C.lineSoft}` : undefined,
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                    <row.Icon_ width={10} height={10} style={{ color:C.ink3 }}/>
                    <span style={{ fontSize:9.5, color:C.ink3, fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", fontFamily:F.body }}>
                      {row.label}
                    </span>
                  </div>
                  <div>
                    {row.node ?? (
                      <span style={{ fontSize:12.5, fontWeight:600, fontFamily:F.body, color:C.ink }}>{row.text}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding:"12px 20px", borderTop:`1px solid ${C.line}`,
          background:C.lineSoft, display:"flex", justifyContent:"flex-end", gap:8, flexShrink:0,
        }}>
          <button className="mn-cancel-btn" onClick={onClose} style={{
            fontFamily:F.body, fontSize:12.5, fontWeight:600, color:C.inkLight,
            background:C.white, border:`1px solid ${C.line}`,
            padding:"7px 18px", borderRadius:9, cursor:"pointer",
          }}>Cancel</button>

          <button className="mn-done-btn" onClick={onClose} style={{
            fontFamily:F.body, fontSize:12.5, fontWeight:700, color:"#fff",
            background:`linear-gradient(135deg,${C.accentDk},${C.accent})`,
            border:"none", padding:"7px 22px", borderRadius:9, cursor:"pointer",
            boxShadow:`0 4px 16px rgba(61,90,254,.28)`,
          }}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ─── SectionLabel ────────────────────────────────────────────────────────── */
function SectionLabel({ children, icon }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
      {icon && <span style={{ color:C.ink3 }}>{icon}</span>}
      <p style={{ fontFamily:F.body, fontSize:9.5, fontWeight:800, letterSpacing:".12em", color:C.ink3, textTransform:"uppercase" }}>
        {children}
      </p>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const S = {
  sideCard: {
    background:C.white, borderRadius:14,
    border:`1px solid ${C.line}`, padding:"14px 16px",
    boxShadow:"0 2px 12px rgba(61,90,254,0.05)",
  },
  modalBox: {
    background:C.white,
    borderRadius:12,
    border:`1px solid ${C.line}`,
    overflow:"hidden",
    marginBottom:14,
  },
};