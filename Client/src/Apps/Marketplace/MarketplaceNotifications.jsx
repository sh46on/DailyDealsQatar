import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  updateRequestStatus,
} from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";

/* ─── Design Tokens ─────────────────────────────────────────── */
const BLUE   = "#1565c0";
const BLUELT = "#e3f2fd";
const FONT   = "'Plus Jakarta Sans', sans-serif";
const FONT_D = "'Fraunces', serif";

/* ─── Global CSS ─────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;} }
  @keyframes fadeIn    { from{opacity:0;}to{opacity:1;} }
  @keyframes shimmer   { 0%{background-position:-600px 0;}100%{background-position:600px 0;} }
  @keyframes floatOrb  { 0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);} }
  @keyframes waveSlide { to{transform:translateX(-50%);} }
  @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(1.35);} }
  @keyframes spin      { to{transform:rotate(360deg);} }
  @keyframes dotPulse  { 0%,100%{box-shadow:0 0 0 0 rgba(21,101,192,0.55);}60%{box-shadow:0 0 0 5px rgba(21,101,192,0);} }
  @keyframes readFlash { 0%{background-color:${BLUELT};}100%{background-color:#ffffff;} }
  @keyframes modalIn   { from{opacity:0;transform:translateY(20px) scale(0.982);}to{opacity:1;transform:translateY(0) scale(1);} }
  @keyframes backdropIn{ from{opacity:0;}to{opacity:1;} }

  .mn-skel {
    background: linear-gradient(90deg,#f0f4f8 25%,#e2ecf7 50%,#f0f4f8 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s linear infinite;
    border-radius: 22px;
  }

  .mn-card {
    animation: fadeUp 0.32s cubic-bezier(0.22,1,0.36,1) both;
    transition: transform .18s cubic-bezier(0.22,1,0.36,1), box-shadow .18s ease, border-color .18s ease;
    cursor: pointer;
  }
  .mn-card:hover {
    transform: translateY(-3px) !important;
    box-shadow: 0 14px 44px rgba(21,101,192,0.14), 0 2px 8px rgba(21,101,192,0.06) !important;
    border-color: rgba(21,101,192,0.30) !important;
  }
  .mn-card:active { transform: translateY(0) !important; }
  .mn-card.flash  { animation: readFlash .5s ease forwards; }

  .mn-tab { transition: background .16s, color .16s, border-color .16s; cursor: pointer; border: none; }
  .mn-tab:hover:not(.mn-tab-active) {
    background: ${BLUELT} !important;
    border-color: rgba(21,101,192,0.35) !important;
    color: ${BLUE} !important;
  }

  .mn-mark-all { transition: background .16s, transform .12s, box-shadow .16s; }
  .mn-mark-all:hover  { background: ${BLUELT} !important; transform:translateY(-1px); box-shadow:0 3px 10px rgba(21,101,192,.15); }
  .mn-mark-all:active { transform:scale(.97); }

  .mn-stat-pill { transition: background .2s, transform .2s; }
  .mn-stat-pill:hover {
    background: rgba(255,255,255,0.22) !important;
    transform: translateY(-2px) !important;
  }

  .mn-modal-close { transition: background .15s, transform .15s; }
  .mn-modal-close:hover { background:rgba(239,68,68,.22)!important; transform:scale(1.12)!important; }

  .mn-status-btn { transition: background .16s, color .16s, border-color .16s, transform .12s, box-shadow .16s; cursor: pointer; }
  .mn-status-btn:hover  { transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,.12); }
  .mn-status-btn:active { transform:scale(.96); }

  .mn-footer-done { transition: transform .15s, box-shadow .15s; }
  .mn-footer-done:hover { transform:translateY(-1px)!important; box-shadow:0 6px 20px rgba(21,101,192,.38)!important; }
  .mn-btn-cancel  { transition: background .15s; }
  .mn-btn-cancel:hover { background: ${BLUELT} !important; color: ${BLUE} !important; }

  /* Smooth scroll in modal body */
  .mn-modal-body {
    overflow-y: auto;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
  .mn-modal-body::-webkit-scrollbar { width: 4px; }
  .mn-modal-body::-webkit-scrollbar-track { background: transparent; }
  .mn-modal-body::-webkit-scrollbar-thumb { background: #dde8f7; border-radius: 99px; }
  .mn-modal-body::-webkit-scrollbar-thumb:hover { background: #b3cef0; }

  @media(max-width:900px){
    .mn-layout   { grid-template-columns: 1fr !important; }
    .mn-sidebar  { display: none !important; }
    .mn-sidebar-mobile { display: block !important; }
  }
  @media(max-width:560px){
    .mn-header-row { flex-direction:column!important; align-items:flex-start!important; gap:10px!important; }
    .mn-modal-box  { max-width:calc(100vw - 16px)!important; max-height:96vh!important; }
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("mn-global-css")) return;
    const el = document.createElement("style");
    el.id = "mn-global-css";
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);
  return null;
}

/* ─── Status config ─────────────────────────────────────────── */
const STATUS_MAP = {
  pending:  { bg:"#fffbeb", color:"#78350f", border:"#fde68a", dot:"#f59e0b", label:"Pending"  },
  accepted: { bg:"#f0fdf4", color:"#14532d", border:"#86efac", dot:"#16a34a", label:"Accepted" },
  rejected: { bg:"#fff1f2", color:"#881337", border:"#fecdd3", dot:"#e11d48", label:"Rejected" },
};
const STATUS_BTN = {
  pending:  { activeBg:"#f59e0b", activeColor:"#fff", activeBorder:"#f59e0b" },
  accepted: { activeBg:"#16a34a", activeColor:"#fff", activeBorder:"#16a34a" },
  rejected: { activeBg:"#e11d48", activeColor:"#fff", activeBorder:"#e11d48" },
};
const getStatus = (s) =>
  STATUS_MAP[s] ?? { bg:"#f0f4f8", color:"#475569", border:"#cbd5e1", dot:"#94a3b8", label: s ?? "Unknown" };

const FILTERS = ["all", "pending", "accepted", "rejected"];
const FALLBACK = "—";

/* ─── Pure helpers ──────────────────────────────────────────── */
const str = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const getBuyerName = (n) =>
  [str(n?.buyer_first_name), str(n?.buyer_last_name)].filter(Boolean).join(" ") || "Unknown Buyer";
const getInitials = (name = "") => {
  const p = name.trim().split(" ").filter(Boolean);
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name.slice(0,2).toUpperCase() || "?";
};
const timeAgo = (d) => {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};
const formatDate = (d) =>
  !d ? "—" : new Date(d).toLocaleString(undefined, { dateStyle:"medium", timeStyle:"short" });
const formatPrice = (p) => {
  const n = parseFloat(p);
  if (isNaN(n)) return null;
  return `ر.ق${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};
const countByStatus = (items, status) =>
  (Array.isArray(items) ? items : []).filter(i => i?.status === status).length;

/* ─── Ad Slot ───────────────────────────────────────────────── */
function AdSlot({ variant = "leaderboard" }) {
  const dims = variant === "leaderboard"
    ? { h: 90,  label: "728 × 90 — Leaderboard Ad" }
    : { h: 250, label: "300 × 250 — Medium Rectangle Ad" };
  return (
    <div style={{
      width:"100%", height:dims.h,
      background:"repeating-linear-gradient(45deg,#f8fafc,#f8fafc 10px,#eef3fa 10px,#eef3fa 20px)",
      border:"1.5px dashed #cbd5e1", borderRadius:14,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", gap:5,
    }}>
      <span style={{ fontSize:9.5, fontWeight:700, color:"#94a3b8", letterSpacing:"1px", fontFamily:FONT, textTransform:"uppercase" }}>
        Advertisement
      </span>
      <span style={{ fontSize:12, color:"#cbd5e1", fontFamily:FONT, fontWeight:600 }}>
        {dims.label}
      </span>
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────── */
function SkeletonList() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="mn-skel" style={{ height:110, animationDelay:`${i * 120}ms` }} />
      ))}
    </div>
  );
}

/* ─── Status Badge ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const st = getStatus(status);
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      background:st.bg, border:`1.5px solid ${st.border}`,
      color:st.color, borderRadius:40, padding:"5px 12px",
      fontFamily:FONT, fontSize:11, fontWeight:700,
      letterSpacing:".06em", textTransform:"uppercase", width:"fit-content",
    }}>
      <span style={{
        width:7, height:7, borderRadius:"50%", background:st.dot, flexShrink:0,
        animation: status === "pending" ? "pulse 1.6s infinite" : undefined,
      }} />
      {st.label}
    </span>
  );
}

/* ─── Summary Sidebar Card ───────────────────────────────────── */
function SummaryCard({ items }) {
  const pending  = countByStatus(items, "pending");
  const accepted = countByStatus(items, "accepted");
  const rejected = countByStatus(items, "rejected");
  const total    = items.length || 1;
  return (
    <div style={s.infoCard}>
      <div style={s.infoHead}>
        <div style={{ fontSize:20 }}>🔔</div>
        <span style={s.infoTitle}>Notification Overview</span>
      </div>
      <p style={{ fontFamily:FONT, fontSize:11.5, color:"#94a3b8", margin:"0 0 14px", fontWeight:500 }}>
        {items.length} total notification{items.length !== 1 ? "s" : ""}
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {[
          { label:"Pending",  val:pending,  dot:"#f59e0b" },
          { label:"Accepted", val:accepted, dot:"#16a34a" },
          { label:"Rejected", val:rejected, dot:"#e11d48" },
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
          background:"linear-gradient(90deg, #f59e0b, #16a34a, #e11d48)",
          width:`${Math.min(100, ((pending + accepted) / total) * 100)}%`,
          transition:"width 0.8s cubic-bezier(.22,1,.36,1)",
        }} />
      </div>
    </div>
  );
}

/* ─── Notification Card ──────────────────────────────────────── */
const NotificationCard = React.memo(function NotificationCard({ n, i, isFlashing, onOpen }) {
  const st        = getStatus(n?.status);
  const buyerName = getBuyerName(n);
  const price     = formatPrice(n?.product_price);

  const barColors = {
    pending:  "linear-gradient(180deg,#fbbf24,#f59e0b)",
    accepted: "linear-gradient(180deg,#4ade80,#16a34a)",
    rejected: "linear-gradient(180deg,#fb7185,#e11d48)",
  };
  const statusKey = (n?.status || "pending").toLowerCase();

  return (
    <div
      className={`mn-card${isFlashing ? " flash" : ""}`}
      style={{
        animationDelay:`${i * 0.045}s`,
        background: n.is_read ? "#fff" : "#f7fbff",
        border:`1.5px solid ${n.is_read ? "#e0ecfb" : "rgba(21,101,192,0.22)"}`,
        borderRadius:22,
        boxShadow:"0 4px 32px rgba(21,101,192,0.06), 0 1px 4px rgba(0,0,0,0.03)",
        display:"grid",
        gridTemplateColumns:"6px 88px 1fr auto",
        alignItems:"stretch",
        overflow:"hidden",
        minHeight:110,
        position:"relative",
      }}
      onClick={() => onOpen(n)}
    >
      {/* Left accent bar */}
      <div style={{ width:6, background: barColors[statusKey] || barColors.pending, borderRadius:"6px 0 0 6px", flexShrink:0 }} />

      {/* Thumbnail */}
      <div style={{ position:"relative", overflow:"hidden", background:BLUELT }}>
        <ProductThumb src={n.product_image} alt={str(n.product_title) ?? "Product"} size="100%" fullHeight />
        {n.product_city && (
          <span style={{
            position:"absolute", bottom:7, left:7,
            background:"rgba(15,52,96,0.75)", backdropFilter:"blur(6px)",
            color:"#fff", fontSize:9, fontWeight:700, letterSpacing:".08em",
            textTransform:"uppercase", borderRadius:6, padding:"3px 8px",
            fontFamily:FONT,
          }}>
            📍 {n.product_city}
          </span>
        )}
        {!n.is_read && (
          <span style={{
            position:"absolute", top:8, right:8,
            width:10, height:10, borderRadius:"50%",
            background:BLUE, border:"2px solid #fff",
            animation:"dotPulse 1.4s ease infinite",
          }} />
        )}
      </div>

      {/* Body */}
      <div style={{
        padding:"14px 16px 12px",
        display:"flex", flexDirection:"column", justifyContent:"space-between", gap:8, minWidth:0,
      }}>
        <div>
          <h3 style={{
            fontFamily:FONT, fontSize:"clamp(14px,2.2vw,15px)",
            fontWeight:700, color:"#0f172a", letterSpacing:"-0.02em",
            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
            margin:"0 0 6px",
          }} title={str(n.product_title) ?? "Untitled Product"}>
            {str(n.product_title) ?? "Untitled Product"}
          </h3>

          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
            <AvatarCircle
              name={buyerName}
              initials={getInitials(buyerName)}
              image={n.buyer_profile_image}
              size={22}
            />
            <span style={{ fontSize:12.5, color:"#475569", fontWeight:500, fontFamily:FONT }}>{buyerName}</span>
            <span style={{ fontSize:11.5, color:"#94a3b8", fontFamily:FONT }}>is interested</span>
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:6 }}>
            {price && (
              <span style={{
                fontSize:13, fontWeight:800, color:BLUE,
                letterSpacing:"-0.02em", fontFamily:FONT,
              }}>{price}</span>
            )}
          </div>
        </div>
        <StatusBadge status={statusKey} />
      </div>

      {/* Actions column */}
      <div style={{
        display:"flex", flexDirection:"column",
        alignItems:"flex-end", justifyContent:"space-between",
        padding:"14px 16px", gap:10,
        borderLeft:"1px solid #e0ecfb", minWidth:80,
      }}>
        <span style={{ fontSize:10.5, color:"#94a3b8", fontFamily:FONT, fontWeight:500, whiteSpace:"nowrap" }}>
          {timeAgo(n.created_at)}
        </span>
        {!n.is_read && (
          <span style={{
            fontSize:9, fontWeight:700, color:BLUE,
            background:BLUELT, border:`1px solid rgba(21,101,192,0.25)`,
            borderRadius:40, padding:"2px 8px", fontFamily:FONT, letterSpacing:".06em", textTransform:"uppercase",
          }}>
            New
          </span>
        )}
      </div>
    </div>
  );
});

/* ─── Empty State ────────────────────────────────────────────── */
function EmptyState({ filter }) {
  return (
    <div style={{ textAlign:"center", padding:"clamp(48px,8vw,88px) 24px", animation:"fadeUp 0.45s ease both" }}>
      <div style={{ fontSize:64, display:"block", marginBottom:20, animation:"floatOrb 4s ease-in-out infinite" }}>
        🔔
      </div>
      <h3 style={{ fontFamily:FONT_D, fontSize:"clamp(18px,4vw,24px)", fontWeight:700, color:"#0f172a", marginBottom:10, letterSpacing:"-0.03em" }}>
        No {filter !== "all" ? filter : ""} notifications
      </h3>
      <p style={{ color:"#94a3b8", fontSize:14, lineHeight:1.6, fontFamily:FONT }}>
        You're all caught up — nothing to show here.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
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

  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications();
      const p   = res?.data ?? res;
      const arr = Array.isArray(p?.data) ? p.data : Array.isArray(p) ? p : [];
      setItems(arr);
      setTotal(p?.total ?? p?.count ?? arr.length);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleMarkAll = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) { console.error(e); }
  }, []);

  const handleRead = useCallback(async (id) => {
    const n = itemsRef.current.find(x => x.id === id);
    if (!n || n.is_read) return;
    try {
      await markNotificationRead(id);
      setFlashId(id);
      setTimeout(() => setFlashId(null), 500);
      setItems(prev => prev.map(x => x.id === id ? { ...x, is_read: true } : x));
    } catch (e) { console.error(e); }
  }, []);

  const handleStatusUpdate = useCallback((id, newStatus) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, status: newStatus } : x));
    setModal(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);
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
  const unread   = useMemo(() => safe.filter(n => !n?.is_read).length, [safe]);
  const countOf  = useCallback(
    (f) => f === "all" ? safe.length : safe.filter(n => n?.status === f).length,
    [safe]
  );

  const pending  = countByStatus(safe, "pending");
  const accepted = countByStatus(safe, "accepted");
  const rejected = countByStatus(safe, "rejected");

  return (
    <MarketplaceLayout>
      <InjectStyles />

      <div style={s.page}>

        {/* ── HERO ── */}
        <div style={s.hero}>
          <div style={s.heroDots} />
          <div style={{ ...s.orb, width:260, height:260, top:-90,  right:-70,  animationDelay:"0s" }} />
          <div style={{ ...s.orb, width:140, height:140, bottom:20, left:50,   animationDelay:"2s" }} />
          <div style={{ ...s.orb, width:90,  height:90,  top:30,   left:"35%", animationDelay:"4s" }} />

          <svg style={s.heroWave} viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path
              style={{ animation:"waveSlide 10s linear infinite" }}
              d="M0,30 C240,55 480,5 720,30 C960,55 1200,5 1440,30 C1680,55 1920,5 2160,30 L2160,60 L0,60 Z"
              fill="#f0f6ff"
            />
            <path
              style={{ animation:"waveSlide 15s linear infinite reverse" }}
              d="M0,42 C300,18 600,56 900,38 C1200,20 1500,52 1800,36 C2000,24 2160,46 2160,40 L2160,60 L0,60 Z"
              fill="#e3f2fd"
              opacity="0.7"
            />
          </svg>

          <div style={s.heroInner}>
            <div style={s.heroLabel}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#34d399", animation:"pulse 1.8s infinite", flexShrink:0 }} />
              My Dashboard
            </div>

            <h1 style={s.heroTitle}>
              My{" "}
              <span style={{
                background:"linear-gradient(90deg, #93c5fd, #34d399)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
              }}>
                Notifications
              </span>
            </h1>

            <p style={s.heroSub}>
              Stay on top of every buyer interest — review, respond, and manage requests in real time.
            </p>

            {!loading && safe.length > 0 && (
              <div style={s.statRow}>
                {[
                  { dot:"#f59e0b", num:pending,     label:"Pending"  },
                  { dot:"#16a34a", num:accepted,    label:"Accepted" },
                  { dot:"#e11d48", num:rejected,    label:"Rejected" },
                  { dot:"#93c5fd", num:safe.length, label:"Total"    },
                  { dot:"#a78bfa", num:unread,      label:"Unread"   },
                ].map(({ dot, num, label }) => (
                  <div key={label} className="mn-stat-pill" style={s.statPill}>
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

          <div className="mn-layout" style={s.layout}>

            {/* ── Main list column ── */}
            <div style={{ flex:1, minWidth:0 }}>
              <div className="mn-sidebar-mobile" style={{ display:"none", marginBottom:16 }}>
                <AdSlot variant="rectangle" />
              </div>

              {/* ── Sticky filter bar ── */}
              <div style={s.filterBar}>
                <div className="mn-header-row" style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  gap:12, flexWrap:"wrap", padding:"16px 20px 12px",
                  borderBottom:`1px solid #e0ecfb`,
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{
                      width:40, height:40, borderRadius:13, flexShrink:0,
                      background:`linear-gradient(135deg, #0f3460, ${BLUE})`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:`0 4px 14px rgba(21,101,192,.28)`,
                    }}>
                      <BellIcon />
                    </div>
                    <div>
                      <h2 style={{ fontFamily:FONT, fontSize:16, fontWeight:800, color:"#0f172a", margin:0, letterSpacing:"-0.03em" }}>
                        Inbox
                      </h2>
                      <p style={{ fontSize:11.5, color:"#94a3b8", margin:"2px 0 0", fontFamily:FONT }}>
                        {total} total · {unread} unread
                      </p>
                    </div>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    {unread > 0 && (
                      <div style={{
                        display:"flex", alignItems:"center", gap:6,
                        background:BLUELT, color:BLUE,
                        fontSize:11.5, fontWeight:700, padding:"5px 12px",
                        borderRadius:20, border:`1px solid rgba(21,101,192,0.25)`,
                        fontFamily:FONT,
                      }}>
                        <span style={{ width:7, height:7, borderRadius:"50%", background:BLUE, display:"block", animation:"dotPulse 1.4s ease infinite" }} />
                        {unread} new
                      </div>
                    )}
                    <button className="mn-mark-all" onClick={handleMarkAll} style={{
                      fontSize:12.5, color:BLUE, background:BLUELT,
                      border:`1px solid rgba(21,101,192,0.25)`,
                      padding:"7px 16px", borderRadius:20, cursor:"pointer",
                      fontWeight:700, fontFamily:FONT,
                      display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap",
                    }}>
                      <CheckIcon /> Mark all read
                    </button>
                  </div>
                </div>

                <div style={{ display:"flex", gap:6, padding:"10px 20px", flexWrap:"wrap" }}>
                  {FILTERS.map(f => {
                    const active = filter === f;
                    return (
                      <button key={f}
                        className={`mn-tab${active ? " mn-tab-active" : ""}`}
                        onClick={() => setFilter(f)}
                        style={{
                          fontSize:12, fontWeight: active ? 700 : 500,
                          padding:"5px 14px", borderRadius:40,
                          border:`1.5px solid ${active ? BLUE : "#dde8ff"}`,
                          background: active ? BLUE : "#fff",
                          color: active ? "#fff" : "#64748b",
                          fontFamily:FONT,
                          display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
                        }}
                      >
                        {STATUS_MAP[f] && (
                          <span style={{
                            width:6, height:6, borderRadius:"50%", flexShrink:0,
                            background: active ? "rgba(255,255,255,0.7)" : STATUS_MAP[f].dot,
                          }} />
                        )}
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span style={{
                          fontSize:10, fontWeight:700, padding:"1px 6px",
                          borderRadius:10, minWidth:20, textAlign:"center",
                          background: active ? "rgba(255,255,255,0.22)" : BLUELT,
                          color: active ? "#fff" : BLUE,
                        }}>{countOf(f)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card list */}
              <div style={{ display:"flex", flexDirection:"column", gap:14, marginTop:16 }}>
                {loading
                  ? <SkeletonList />
                  : filtered.length === 0
                    ? <EmptyState filter={filter} />
                    : filtered.map((n, i) => (
                        <NotificationCard
                          key={n.id}
                          n={n}
                          i={i}
                          isFlashing={flashId === n.id}
                          onOpen={openModal}
                        />
                      ))
                }
              </div>

              {!loading && filtered.length > 0 && (
                <p style={{ fontSize:12, color:"#94a3b8", textAlign:"center", padding:"16px 0 4px", fontFamily:FONT }}>
                  Showing {filtered.length} of {total} notification{total !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* ── Sidebar ── */}
            <aside className="mn-sidebar" style={s.sidebar}>
              {!loading && safe.length > 0 && <SummaryCard items={safe} />}

              <div style={s.infoCard}>
                <div style={s.infoHead}>
                  <div style={{ fontSize:20 }}>💡</div>
                  <span style={s.infoTitle}>Managing Requests</span>
                </div>
                <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    "Click any notification to view full buyer details and update its status.",
                    "Use Accept to confirm interest and initiate a deal with the buyer.",
                    "Rejected requests are hidden from buyers but remain in your records.",
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
        </div>
      </div>

      {modal && (
        <DetailModal n={modal} onClose={closeModal} onStatusUpdate={handleStatusUpdate} />
      )}
    </MarketplaceLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL MODAL
════════════════════════════════════════════════════════════════ */
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
    } catch (e) {
      console.error(e);
      setStatus(prev);
    } finally {
      setSaving(false);
    }
  }, [status, saving, n.id, onStatusUpdate]);

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:200,
      background:"rgba(15,52,96,0.58)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:12, animation:"backdropIn 0.18s ease",
    }}>
      <div
        className="mn-modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fff", borderRadius:24, width:"100%", maxWidth:520,
          maxHeight:"88vh", overflow:"hidden",
          boxShadow:"0 32px 72px rgba(15,52,96,.20), 0 6px 24px rgba(15,52,96,.08)",
          animation:"modalIn 0.24s cubic-bezier(0.22,1,0.36,1)",
          display:"flex", flexDirection:"column",
          border:"1.5px solid #e0ecfb",
          willChange:"transform, opacity",
        }}
      >
        {/* ── MODAL HEADER ── */}
        <div style={{
          background:"linear-gradient(130deg, #0f3460 0%, #1565c0 55%, #1976d2 100%)",
          padding:"20px 20px 16px", flexShrink:0, position:"relative",
          overflow:"hidden",
        }}>
          {/* Dot grid */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            backgroundImage:"radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize:"20px 20px",
          }} />

          {/* Close button */}
          <button className="mn-modal-close" onClick={onClose} style={{
            position:"absolute", top:14, right:14,
            width:32, height:32, borderRadius:"50%",
            background:"rgba(255,255,255,0.12)", border:"none",
            color:"#fff", fontSize:20, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1,
            zIndex:1,
          }}>×</button>

          {/* Product row */}
          <div style={{
            display:"flex", alignItems:"center", gap:14,
            marginBottom:14, paddingRight:44, position:"relative", zIndex:1,
          }}>
            <div style={{
              width:60, height:60, borderRadius:14, flexShrink:0,
              overflow:"hidden", border:"1.5px solid rgba(255,255,255,0.2)",
              background:"rgba(255,255,255,0.1)",
            }}>
              <ProductThumb src={n.product_image} alt={str(n.product_title) ?? "Product"} size={60} fullHeight />
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              <p style={{
                fontFamily:FONT_D, fontSize:18, fontWeight:900, color:"#fff",
                margin:"0 0 6px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                letterSpacing:"-0.3px",
              }}>{str(n.product_title) ?? "Untitled Product"}</p>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                {price
                  ? <span style={{ fontSize:15, fontWeight:800, color:"#bfdbfe", letterSpacing:"-0.2px", fontFamily:FONT }}>{price}</span>
                  : <span style={{ fontSize:13, color:"rgba(255,255,255,0.4)", fontStyle:"italic", fontFamily:FONT }}>Price not listed</span>
                }
                {str(n.product_city) && (
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", gap:3, fontFamily:FONT }}>
                    📍 {n.product_city}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status selector strip */}
          <div style={{
            background:"rgba(0,0,0,0.18)", borderRadius:12, padding:"10px 14px",
            display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
            position:"relative", zIndex:1,
          }}>
            <span style={{
              fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:700,
              letterSpacing:"0.10em", textTransform:"uppercase",
              whiteSpace:"nowrap", flexShrink:0, fontFamily:FONT,
            }}>Set Status</span>

            <div style={{ display:"flex", gap:6, flex:1, flexWrap:"wrap" }}>
              {Object.entries(STATUS_BTN).map(([key, cfg]) => {
                const isActive = status === key;
                return (
                  <button key={key} className="mn-status-btn"
                    onClick={() => handleStatusChange(key)}
                    style={{
                      fontSize:12, fontWeight:700, padding:"6px 14px", borderRadius:40,
                      border:`1.5px solid ${isActive ? cfg.activeBorder : "rgba(255,255,255,0.22)"}`,
                      background: isActive ? cfg.activeBg : "rgba(255,255,255,0.10)",
                      color: isActive ? cfg.activeColor : "rgba(255,255,255,0.82)",
                      fontFamily:FONT,
                      display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap",
                    }}
                  >
                    {isActive && <CheckIcon size={11} />}
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                );
              })}
            </div>

            <span style={{
              fontSize:11, color:"rgba(255,255,255,0.55)",
              minWidth:52, textAlign:"right",
              display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end",
              flexShrink:0, fontFamily:FONT,
            }}>
              {saving ? (
                <>
                  <span style={{
                    width:11, height:11, borderRadius:"50%",
                    border:"2px solid rgba(255,255,255,0.25)", borderTopColor:"#fff",
                    display:"inline-block", animation:"spin 0.7s linear infinite",
                  }} />
                  Saving…
                </>
              ) : saved ? "✓ Saved" : ""}
            </span>
          </div>
        </div>

        {/* ── MODAL BODY — smooth scroll ── */}
        <div className="mn-modal-body" style={{
          flex:1, padding:"20px 22px 8px",
          contain:"content",
        }}>

          {/* ── Buyer Details ── */}
          <SectionLabel>Buyer Details</SectionLabel>
          <div style={s.modalSection}>
            {/* Avatar + name + badge row */}
            <div style={{
              padding:"16px 18px",
              display:"flex", alignItems:"center", gap:14,
              borderBottom:"1px solid #e8f0fb",
            }}>
              <AvatarCircle name={buyerName} initials={initials} image={n.buyer_profile_image} size={52} />
              <div style={{ minWidth:0, flex:1 }}>
                <p style={{ fontFamily:FONT, fontWeight:800, fontSize:15.5, color:"#0f172a", margin:"0 0 3px", letterSpacing:"-0.02em" }}>
                  {buyerName}
                </p>
                {str(n.buyer_email)
                  ? <a href={`mailto:${n.buyer_email}`}
                      style={{ color:BLUE, textDecoration:"none", fontFamily:FONT, fontSize:12.5 }}
                      onClick={e => e.stopPropagation()}
                    >{n.buyer_email}</a>
                  : <span style={{ color:"#94a3b8", fontStyle:"italic", fontFamily:FONT, fontSize:12.5 }}>No email provided</span>
                }
              </div>
              <StatusBadge status={status} />
            </div>

            {/* Detail rows — 2-column grid for compactness */}
            <div style={{
              display:"grid", gridTemplateColumns:"1fr 1fr",
              gap:0,
            }}>
              {[
                { label:"Phone",   icon:"📞", value: `+974 ${str(n.buyer_phone) || FALLBACK}` },
                { label:"City",    icon:"🏙️",  value: str(n.buyer_city)    ?? FALLBACK },
                { label:"State",   icon:"📌", value: str(n.buyer_state)   ?? FALLBACK },
                { label:"Address", icon:"🏠", value: str(n.buyer_address) ?? FALLBACK, wide: true },
              ].map((row, idx) => (
                <div
                  key={row.label}
                  style={{
                    gridColumn: row.wide ? "1 / -1" : undefined,
                    display:"flex", flexDirection:"column", gap:3,
                    padding:"12px 18px",
                    borderTop:"1px solid #f0f6ff",
                    borderRight: (!row.wide && idx % 2 === 0) ? "1px solid #f0f6ff" : undefined,
                  }}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12 }}>{row.icon}</span>
                    <span style={{ fontSize:11, color:"#94a3b8", fontWeight:700, letterSpacing:".04em", textTransform:"uppercase", fontFamily:FONT }}>
                      {row.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize:13, fontWeight:600, fontFamily:FONT,
                    color: row.value === FALLBACK ? "#d1d5db" : "#1e293b",
                    fontStyle: row.value === FALLBACK ? "italic" : "normal",
                    paddingLeft:18,
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Request Info ── */}
          <SectionLabel>Request Info</SectionLabel>
          <div style={{ ...s.modalSection, marginBottom:20 }}>
            <div style={{
              display:"grid", gridTemplateColumns:"1fr 1fr",
              gap:0,
            }}>
              {[
                { label:"Status",     icon:"🔖", node: <StatusBadge status={status} /> },
                { label:"Product ID", icon:"#",  text: n.product_id != null ? `#${n.product_id}` : FALLBACK },
                { label:"Received",   icon:"🕐", text: formatDate(n.created_at), wide: true },
                { label:"Read",       icon:"👁️",  text: n.is_read ? "Yes — read" : "No — unread" },
              ].map((row, idx) => (
                <div
                  key={row.label}
                  style={{
                    gridColumn: row.wide ? "1 / -1" : undefined,
                    display:"flex", flexDirection:"column", gap:3,
                    padding:"12px 18px",
                    borderTop: idx > 0 ? "1px solid #f0f6ff" : undefined,
                    borderRight: (!row.wide && idx % 2 === 0) ? "1px solid #f0f6ff" : undefined,
                  }}
                >
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12 }}>{row.icon}</span>
                    <span style={{ fontSize:11, color:"#94a3b8", fontWeight:700, letterSpacing:".04em", textTransform:"uppercase", fontFamily:FONT }}>
                      {row.label}
                    </span>
                  </div>
                  <div style={{ paddingLeft:18 }}>
                    {row.node
                      ? row.node
                      : <span style={{ fontSize:13, fontWeight:600, color:"#1e293b", fontFamily:FONT }}>{row.text}</span>
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MODAL FOOTER ── */}
        <div style={{
          padding:"14px 22px", borderTop:"1px solid #e0ecfb",
          display:"flex", justifyContent:"flex-end", gap:10,
          background:"#f7fbff", flexShrink:0,
        }}>
          <button className="mn-btn-cancel" onClick={onClose} style={{
            fontFamily:FONT, fontSize:13, fontWeight:600,
            color:"#64748b", background:"#fff", border:"1.5px solid #e0ecfb",
            padding:"8px 20px", borderRadius:12, cursor:"pointer",
          }}>Cancel</button>

          <button className="mn-footer-done" onClick={onClose} style={{
            fontFamily:FONT, fontSize:13, fontWeight:700,
            color:"#fff", background:`linear-gradient(130deg, #0f3460, ${BLUE})`,
            border:"none", padding:"8px 24px", borderRadius:12, cursor:"pointer",
            boxShadow:`0 4px 14px rgba(21,101,192,.26)`,
          }}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
════════════════════════════════════════════════════════════════ */
function AvatarCircle({ name, initials, image, size = 32 }) {
  const [failed, setFailed] = useState(false);
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", background:BLUELT,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:Math.round(size * 0.35), fontWeight:800, color:BLUE,
      flexShrink:0, overflow:"hidden", fontFamily:FONT,
    }}>
      {image && !failed
        ? <img src={image} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={() => setFailed(true)} />
        : initials
      }
    </div>
  );
}

function ProductThumb({ src, alt, size, fullHeight = false }) {
  const [failed, setFailed] = useState(false);
  const dim = typeof size === "number" ? { width:size, height:size } : { width:"100%", height: fullHeight ? "100%" : size };
  if (src && !failed) {
    return <img src={src} alt={alt} style={{ ...dim, objectFit:"cover", display:"block" }} onError={() => setFailed(true)} />;
  }
  return (
    <div style={{
      ...dim, background:`linear-gradient(135deg, ${BLUELT}, #ddeeff)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize: typeof size === "number" ? Math.round(size * 0.4) : 28,
    }}>📦</div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontFamily:FONT, fontSize:10, fontWeight:800, letterSpacing:"0.10em",
      color:"#94a3b8", textTransform:"uppercase", margin:"0 0 8px",
    }}>{children}</p>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CheckIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const s = {
  page: {
    minHeight:"100vh",
    background:"#f0f6ff",
    fontFamily:FONT,
  },
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
    animation:"floatOrb 7s ease-in-out infinite",
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
    animation:"fadeIn 0.4s ease both",
  },
  heroTitle: {
    fontFamily:FONT_D,
    fontSize:"clamp(26px, 4vw, 42px)",
    fontWeight:900, color:"#fff",
    letterSpacing:"-0.5px", lineHeight:1.15,
    margin:"0 0 8px",
    animation:"fadeUp 0.45s ease both",
    animationDelay:"0.08s",
  },
  heroSub: {
    fontSize:14, color:"rgba(255,255,255,0.7)",
    fontFamily:FONT, fontWeight:400, margin:0,
    animation:"fadeUp 0.45s ease both", animationDelay:"0.16s",
  },
  statRow: {
    display:"flex", flexWrap:"wrap", gap:10, marginTop:24,
    animation:"fadeUp 0.45s ease both", animationDelay:"0.24s",
  },
  statPill: {
    display:"inline-flex", alignItems:"center", gap:8,
    background:"rgba(255,255,255,0.13)",
    backdropFilter:"blur(12px)",
    border:"1px solid rgba(255,255,255,0.22)",
    borderRadius:40, padding:"8px 18px",
    color:"#fff", fontFamily:FONT, fontSize:13, fontWeight:600,
    cursor:"default",
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
  filterBar: {
    background:"#fff",
    borderRadius:22,
    boxShadow:"0 4px 32px rgba(21,101,192,0.08), 0 1px 4px rgba(0,0,0,0.03)",
    border:"1.5px solid #e0ecfb",
    overflow:"hidden",
    position:"sticky", top:12, zIndex:50,
    animation:"fadeUp 0.45s ease both",
  },
  sidebar: {
    display:"flex", flexDirection:"column", gap:16,
    position:"sticky", top:82,
    animation:"fadeUp 0.45s ease both", animationDelay:"0.2s",
  },
  infoCard: {
    background:"#fff", borderRadius:18,
    border:"1px solid #e0ecfb", padding:"16px 18px",
    boxShadow:"0 2px 16px rgba(21,101,192,0.06)",
  },
  infoHead: {
    display:"flex", alignItems:"center", gap:10, marginBottom:10,
  },
  infoTitle: {
    fontSize:14, fontWeight:800, color:"#0f172a", fontFamily:FONT,
  },
  modalSection: {
    background:"#f7fbff",
    borderRadius:14,
    border:"1px solid #e4eef9",
    overflow:"hidden",
    marginBottom:16,
  },
};