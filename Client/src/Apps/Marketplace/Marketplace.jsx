import { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  fetchHomeProducts, addToCart, removeFromCart, fetchCart,
} from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";
import {
  ShoppingCart, Eye, MapPin, Tag,
  ChevronLeft, ChevronRight, Clock, Search, X,
  CheckCircle, Lock, Heart, Package,
  ChevronUp, ChevronDown, Share2, MessageCircle,
  ZoomIn, ArrowLeft, ArrowRight, User, Calendar,
  BadgeCheck, Layers, DollarSign, Phone,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════ */
const FONT   = "'Plus Jakarta Sans', sans-serif";
const FONT_D = "'Fraunces', serif";
const FONT_S = "'Sora', sans-serif";

const BLUE    = "#1565c0";
const BLUE2   = "#1976d2";
const BLUE5   = "#3b82f6";
const BLUE6   = "#2563eb";
const BLUE7   = "#1d4ed8";
const BLUELT  = "#e3f2fd";
const BLUELT2 = "#eff6ff";
const BLUEM   = "#bfdbfe";
const BLUEM3  = "#93c5fd";

/* ═══════════════════════════════════════════════════
   SHARED SIDEBAR STYLES
═══════════════════════════════════════════════════ */
const s = {
  infoCard: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e0ecfb",
    padding: "16px 18px",
    boxShadow: "0 2px 16px rgba(21,101,192,0.07)",
  },
  infoHead: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
  },
  infoTitle: {
    fontSize: 14, fontWeight: 800, color: "#0f172a", fontFamily: FONT,
  },
};

/* ═══════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@700;900&family=Sora:wght@400;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;} }
  @keyframes fadeIn    { from{opacity:0;}to{opacity:1;} }
  @keyframes shimmer   { 0%{background-position:-600px 0;}100%{background-position:600px 0;} }
  @keyframes floatOrb  { 0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);} }
  @keyframes waveSlide { to{transform:translateX(-50%);} }
  @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(1.35);} }
  @keyframes popIn     { 0%{opacity:0;transform:scale(0.82);}70%{transform:scale(1.05);}100%{opacity:1;transform:scale(1);} }
  @keyframes cardFadeIn{ from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);} }

  @keyframes modalSlideUp {
    from { opacity:0; transform: translateY(32px) scale(0.97); }
    to   { opacity:1; transform: translateY(0)    scale(1);    }
  }
  @keyframes overlayFade {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes imgFade {
    from { opacity:0; transform: scale(1.03); }
    to   { opacity:1; transform: scale(1);    }
  }

  .mph-skel {
    background: linear-gradient(90deg,#f0f4f8 25%,#e2ecf7 50%,#f0f4f8 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s linear infinite;
    border-radius: 8px;
  }

  .mph-card {
    transition: transform .28s cubic-bezier(.22,1,.36,1),
                box-shadow .28s cubic-bezier(.22,1,.36,1),
                border-color .28s cubic-bezier(.22,1,.36,1) !important;
  }
  .mph-card:hover {
    transform: translateY(-6px) scale(1.005) !important;
    box-shadow: 0 20px 48px rgba(21,101,192,0.18), 0 4px 14px rgba(0,0,0,0.06) !important;
    border-color: ${BLUEM} !important;
  }
  .mph-card:hover .mph-card-img { transform: scale(1.06) !important; }
  .mph-card-img { transition: transform .42s cubic-bezier(.22,1,.36,1) !important; }

  .mph-save-btn {
    position: absolute; top: 10px; right: 10px;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,0.88);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #94a3b8;
    transition: color .18s, background .18s !important;
    backdrop-filter: blur(4px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .mph-save-btn:hover { color: ${BLUE5}; background: #fff !important; }
  .mph-save-btn.saved { color: ${BLUE5}; }

  .mph-btn-cart {
    transition: background .18s, transform .18s, box-shadow .18s, opacity .15s !important;
  }
  .mph-btn-cart:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 22px rgba(21,101,192,0.34) !important;
    filter: brightness(1.06) !important;
  }

  .mph-chip {
    transition: background .18s, color .18s, border-color .18s,
                transform .18s, box-shadow .18s !important;
  }
  .mph-chip:hover:not(.mph-chip-active) {
    background: ${BLUELT} !important;
    color: ${BLUE} !important;
    border-color: ${BLUEM} !important;
    transform: translateY(-1px) !important;
  }
  .mph-chip-active {
    background: ${BLUE6} !important;
    color: #fff !important;
    border-color: ${BLUE6} !important;
    box-shadow: 0 4px 14px rgba(37,99,235,.28) !important;
  }

  .mph-pg-btn {
    transition: background .18s, color .18s, border-color .18s,
                transform .18s, box-shadow .18s !important;
  }
  .mph-pg-btn:hover:not(:disabled) {
    background: ${BLUE} !important;
    color: #fff !important;
    border-color: ${BLUE} !important;
    transform: scale(1.08) !important;
    box-shadow: 0 4px 14px rgba(21,101,192,0.32) !important;
  }
  .mph-pg-active {
    background: ${BLUE} !important;
    color: #fff !important;
    border-color: ${BLUE} !important;
    box-shadow: 0 4px 14px rgba(21,101,192,0.36) !important;
    font-weight: 700 !important;
  }

  .mph-search-wrap:focus-within .mph-search-box {
    border-color: ${BLUEM} !important;
    box-shadow: 0 0 0 3.5px rgba(21,101,192,0.12),
                0 4px 18px rgba(21,101,192,0.08) !important;
    background: #fff !important;
  }

  .mph-ad {
    transition: box-shadow .18s, transform .18s !important;
  }
  .mph-ad:hover {
    box-shadow: 0 8px 28px rgba(21,101,192,0.12) !important;
    transform: translateY(-2px) !important;
  }

  .mph-toast {
    position: fixed; bottom: 28px; left: 50%;
    transform: translateX(-50%) translateY(16px);
    display: inline-flex; align-items: center; gap: 9px;
    background: #0f172a; color: #fff;
    padding: 12px 24px; border-radius: 999px;
    font-family: ${FONT}; font-size: 13px; font-weight: 600;
    box-shadow: 0 8px 32px rgba(0,0,0,0.22);
    z-index: 99999; opacity: 0; pointer-events: none;
    transition: all 0.26s cubic-bezier(0.22,1,0.36,1);
    white-space: nowrap;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .mph-toast.on { opacity:1; transform:translateX(-50%) translateY(0); }
  .mph-toast-error { background: #7f1d1d !important; }

  .mph-card:nth-child(1)  { animation-delay:.04s; }
  .mph-card:nth-child(2)  { animation-delay:.08s; }
  .mph-card:nth-child(3)  { animation-delay:.12s; }
  .mph-card:nth-child(4)  { animation-delay:.16s; }
  .mph-card:nth-child(5)  { animation-delay:.20s; }
  .mph-card:nth-child(6)  { animation-delay:.24s; }
  .mph-card:nth-child(n+7){ animation-delay:.28s; }

  /* ── Modal overlay & shell ── */
  .mph-modal-overlay {
    position: fixed; inset: 0; z-index: 9000;
    background: rgba(10,20,50,0.72);
    backdrop-filter: blur(6px);
    display: flex; align-items: flex-end; justify-content: center;
    padding: 0;
    animation: overlayFade 0.22s ease both;
    overflow-y: auto;
  }
  @media (min-width: 641px) {
    .mph-modal-overlay {
      align-items: center;
      padding: 12px;
    }
  }

  .mph-modal {
    background: #fff;
    border-radius: 20px 20px 0 0;
    width: 100%; max-width: 900px;
    max-height: 92vh;
    display: flex; flex-direction: column;
    overflow: hidden;
    box-shadow: 0 -8px 40px rgba(15,52,96,0.18), 0 4px 24px rgba(0,0,0,0.08);
    animation: modalSlideUp 0.32s cubic-bezier(0.22,1,0.36,1) both;
    position: relative;
  }
  @media (min-width: 641px) {
    .mph-modal {
      border-radius: 24px;
      max-height: 90vh;
      box-shadow: 0 32px 96px rgba(15,52,96,0.32), 0 4px 24px rgba(0,0,0,0.08);
    }
  }

  /* Drag-handle pill — mobile only */
  .mph-modal::before {
    content: '';
    display: block;
    width: 36px; height: 4px;
    border-radius: 99px;
    background: #cbd5e1;
    margin: 10px auto 0;
    flex-shrink: 0;
  }
  @media (min-width: 641px) {
    .mph-modal::before { display: none; }
  }

  .mph-modal-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    overflow: hidden;
    flex: 1;
    min-height: 0;
  }
  .mph-modal-img-panel {
    position: relative;
    background: ${BLUELT2};
    overflow: hidden;
    display: flex; flex-direction: column;
  }
  .mph-modal-info-panel {
    overflow-y: auto;
    padding: 28px 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    scrollbar-width: thin;
    scrollbar-color: ${BLUEM} transparent;
  }
  .mph-modal-info-panel::-webkit-scrollbar { width: 5px; }
  .mph-modal-info-panel::-webkit-scrollbar-thumb { background: ${BLUEM}; border-radius: 99px; }

  .mph-modal-main-img {
    width: 100%; height: 320px;
    object-fit: cover;
    display: block;
    animation: imgFade 0.28s ease both;
    flex-shrink: 0;
  }
  .mph-thumb {
    cursor: pointer;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    transition: transform .18s, box-shadow .18s, border-color .18s !important;
  }
  .mph-thumb:hover { transform: scale(1.05) !important; }
  .mph-thumb-active {
    border: 2.5px solid ${BLUE6} !important;
    box-shadow: 0 4px 14px rgba(37,99,235,0.28) !important;
  }
  .mph-modal-nav-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.90); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: #1e3a5f; backdrop-filter: blur(4px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.16);
    transition: background .15s, transform .15s, box-shadow .15s !important;
    z-index: 2;
  }
  .mph-modal-nav-btn:hover {
    background: #fff !important;
    transform: translateY(-50%) scale(1.08) !important;
    box-shadow: 0 6px 20px rgba(0,0,0,0.22) !important;
  }
  .mph-modal-close {
    position: absolute; top: 14px; right: 14px; z-index: 10;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(0,0,0,0.08);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    color: #475569; backdrop-filter: blur(4px);
    box-shadow: 0 2px 12px rgba(0,0,0,0.12);
    transition: background .15s, transform .15s !important;
  }
  .mph-modal-close:hover { background: #fff !important; transform: scale(1.08) !important; }

  .mph-modal-cta {
    transition: transform .18s, box-shadow .18s, filter .18s !important;
  }
  .mph-modal-cta:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    filter: brightness(1.06) !important;
  }

  .mph-detail-row {
    display: flex; align-items: center; gap: 10;
    font-family: ${FONT}; font-size: 13px; color: #475569;
  }
  .mph-detail-icon {
    width: 32px; height: 32px; border-radius: 8px;
    background: ${BLUELT}; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: ${BLUE6};
  }

  /* city filter scrollbar */
  .mph-city-scroll {
    scrollbar-width: none;
  }
  .mph-city-scroll::-webkit-scrollbar { display: none; }

  /* ── General layout breakpoints ── */
  @media (max-width: 1100px) {
    .mph-layout { grid-template-columns: 1fr 200px !important; }
  }
  @media (max-width: 860px) {
    .mph-layout  { grid-template-columns: 1fr !important; }
    .mph-sidebar { display: none !important; }
    .mph-top-ad  { display: flex !important; }
    .mph-desk-ad { display: none !important; }
    .mph-grid    { grid-template-columns: repeat(2,1fr) !important; gap:14px !important; }
    .mph-hero-inner { padding: 32px 18px 72px !important; }
    .mph-hero-title { font-size: 28px !important; }
    .mph-hero-stats { gap: 20px !important; }
  }
  @media (max-width: 580px) {
    .mph-grid       { grid-template-columns: repeat(2,1fr) !important; gap:10px !important; }
    .mph-hero-title { font-size: 22px !important; line-height: 1.25 !important; }
    .mph-hero-inner { padding: 24px 14px 68px !important; }
    .mph-sec-head   { flex-direction: column !important; align-items: flex-start !important; gap:8px !important; }
    .mph-cat-bar    { gap: 6px !important; }
    .mph-wrap       { padding: 12px !important; }
    .mph-card-body  { padding: 10px 11px 6px !important; }
    .mph-card-actions{ padding: 6px 10px 10px !important; gap:6px !important; }
    .mph-card-img-wrap{ height: 140px !important; }
    .mph-hero-stats { display: none !important; }
  }
  @media (max-width: 380px) {
    .mph-grid       { grid-template-columns: 1fr !important; }
    .mph-hero-title { font-size: 20px !important; }
  }

  /* ── Modal breakpoints ── */
  @media (min-width: 641px) and (max-width: 860px) {
    .mph-modal { max-width: 680px; max-height: 88vh; }
    .mph-modal-body { grid-template-columns: 1fr 1fr; }
    .mph-modal-main-img { height: 260px !important; }
    .mph-modal-info-panel { padding: 22px 20px 20px !important; }
  }

  @media (max-width: 640px) {
    .mph-modal { max-height: 90vh; }
    .mph-modal-body { grid-template-columns: 1fr !important; }
    .mph-modal-main-img { height: 220px !important; }
    .mph-modal-info-panel {
      padding: 14px 16px 28px !important;
      gap: 14px !important;
    }
  }

  @media (max-width: 380px) {
    .mph-modal-main-img { height: 190px !important; }
    .mph-modal-info-panel { padding: 12px 12px 24px !important; }
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("mph-styles")) return;
    const el = document.createElement("style");
    el.id = "mph-styles";
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.getElementById("mph-styles")?.remove();
  }, []);
  return null;
}

/* ═══════════════════════════════════════════════════
   AD SLOT
═══════════════════════════════════════════════════ */
function AdSlot({ variant = "banner", style: extra = {} }) {
  const cfg = {
    banner:  { h: 90,  label: "728 × 90 — Leaderboard Ad"      },
    sidebar: { h: 250, label: "300 × 250 — Medium Rectangle Ad" },
    inline:  { h: 100, label: "Responsive Inline Ad"            },
  }[variant] ?? { h: 90, label: "Ad" };

  return (
    <div className="mph-ad" style={{
      width: "100%", minHeight: cfg.h,
      background: "repeating-linear-gradient(45deg,#f8fafc,#f8fafc 10px,#eef3fa 10px,#eef3fa 20px)",
      border: "1.5px dashed #cbd5e1", borderRadius: 14,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 5,
      position: "relative", overflow: "hidden", ...extra,
    }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase", fontFamily: FONT }}>
        Advertisement
      </span>
      <span style={{ fontSize: 12, color: "#cbd5e1", fontFamily: FONT, fontWeight: 600 }}>{cfg.label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
function useToast() {
  const [toast, setToast] = useState({ on: false, msg: "", error: false });
  const timerRef = useRef(null);
  const add = useCallback((message, type = "success") => {
    clearTimeout(timerRef.current);
    setToast({ on: true, msg: message, error: type === "error" });
    timerRef.current = setTimeout(() => setToast(p => ({ ...p, on: false })), 3000);
  }, []);
  return { toast, add };
}

function ToastPill({ toast }) {
  return (
    <div className={`mph-toast${toast.on ? " on" : ""}${toast.error ? " mph-toast-error" : ""}`}>
      <span style={{ width: 15, height: 15, color: toast.error ? "#fca5a5" : "#34d399", flexShrink: 0, display: "flex" }}>
        {toast.error ? <X size={15} /> : <CheckCircle size={15} />}
      </span>
      {toast.msg}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HERO BANNER
═══════════════════════════════════════════════════ */
function HeroBanner({ totalCount, totalNew, totalUsed }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(135deg, #0f3460 0%, #1565c0 55%, #2563eb 85%, #3b82f6 100%)",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />
      <div style={{ position:"absolute", width:320, height:320, top:-100, right:-70, borderRadius:"50%", background:"rgba(255,255,255,0.06)", animation:"floatOrb 7s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:160, height:160, bottom:10, left:50, borderRadius:"50%", background:"rgba(255,255,255,0.05)", animation:"floatOrb 7s ease-in-out infinite", animationDelay:"2s", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:110, height:110, top:40, left:"38%", borderRadius:"50%", background:"rgba(255,255,255,0.04)", animation:"floatOrb 9s ease-in-out infinite", animationDelay:"4s", pointerEvents:"none" }} />

      <svg style={{ position:"absolute", bottom:0, left:0, width:"200%", height:60, zIndex:1, pointerEvents:"none" }}
        viewBox="0 0 1440 60" preserveAspectRatio="none">
        <path style={{ animation:"waveSlide 10s linear infinite" }}
          d="M0,30 C240,55 480,5 720,30 C960,55 1200,5 1440,30 C1680,55 1920,5 2160,30 L2160,60 L0,60 Z"
          fill="#f0f6ff" />
        <path style={{ animation:"waveSlide 15s linear infinite reverse" }}
          d="M0,42 C300,18 600,56 900,38 C1200,20 1500,52 1800,36 C2000,24 2160,46 2160,40 L2160,60 L0,60 Z"
          fill="#e3f2fd" opacity="0.7" />
      </svg>

      <div className="mph-hero-inner" style={{
        position: "relative", zIndex: 2,
        maxWidth: 1240, margin: "0 auto",
        padding: "clamp(36px,6vw,64px) clamp(16px,5vw,48px) clamp(52px,7vw,80px)",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 40, padding: "5px 14px", marginBottom: 16,
          backdropFilter: "blur(8px)", animation: "fadeIn .4s ease both",
        }}>
          <span style={{ width:6, height:6, background:"#34d399", borderRadius:"50%", animation:"pulse 1.6s infinite", flexShrink:0 }} />
          <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.90)", fontFamily:FONT }}>
            Live listings · Kerala, India
          </span>
        </div>

        <h1 className="mph-hero-title" style={{
          fontFamily: FONT_D,
          fontSize: "clamp(26px,5vw,46px)",
          fontWeight: 900, color: "#fff",
          letterSpacing: "-0.5px", lineHeight: 1.15, marginBottom: 12,
          animation: "fadeUp .45s ease both", animationDelay: "0.08s",
        }}>
          Find Great{" "}
          <span style={{
            background: "linear-gradient(90deg, #93c5fd, #34d399)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Deals
          </span>{" "}
          Near You
        </h1>

        <p style={{
          fontSize: "clamp(13px,2vw,15px)", color: "rgba(255,255,255,0.72)",
          fontFamily: FONT, fontWeight: 400, lineHeight: 1.6, marginBottom: 28,
          animation: "fadeUp .45s ease both", animationDelay: "0.16s",
        }}>
          Buy &amp; sell locally — electronics, furniture, fashion &amp; more
        </p>

        <div className="mph-hero-stats" style={{
          display: "flex", justifyContent: "center",
          gap: "clamp(24px,5vw,56px)",
          animation: "fadeUp .45s ease both", animationDelay: "0.24s",
        }}>
          {[
            { num: totalCount, label: "Listings"   },
            { num: totalNew,   label: "Brand New"  },
            { num: totalUsed,  label: "Used"       },
          ].map(({ num, label }) => (
            <div key={label} style={{ textAlign: "center", color: "#fff" }}>
              <span style={{ display: "block", fontFamily: FONT_S, fontSize: "clamp(1.2rem,3vw,1.6rem)", fontWeight: 700 }}>
                {num}
              </span>
              <span style={{ fontSize: ".72rem", opacity: .72, textTransform: "uppercase", letterSpacing: ".5px", fontFamily: FONT }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SEARCH BAR
═══════════════════════════════════════════════════ */
function SearchBar({ value, onChange }) {
  return (
    <div className="mph-search-wrap" style={{ marginBottom: 14 }}>
      <div className="mph-search-box" style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#fafcff", border: `1.5px solid ${BLUEM}`,
        borderRadius: 14, padding: "0 16px", height: 50,
        boxShadow: "0 2px 12px rgba(21,101,192,0.07)",
        transition: "border-color .18s, box-shadow .18s, background .18s",
      }}>
        <Search size={17} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search products, categories, locations…"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, border: "none", outline: "none",
            fontSize: 14, fontFamily: FONT, color: "#0f172a", background: "transparent",
          }}
        />
        {value && (
          <button onClick={() => onChange("")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#94a3b8", display: "flex", padding: 3, borderRadius: 6, flexShrink: 0,
          }}>
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CATEGORY + CONDITION CHIPS
═══════════════════════════════════════════════════ */
function CategoryBar({ categories, active, setActive }) {
  const chips = [...new Set(["All", "New", "Used", "Negotiable", ...categories])];
  return (
    <div className="mph-cat-bar" style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
      {chips.map(c => (
        <button
          key={c}
          onClick={() => setActive(c)}
          className={`mph-chip${active === c ? " mph-chip-active" : ""}`}
          style={{
            padding: "7px 16px", borderRadius: 40,
            fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
            cursor: "pointer", whiteSpace: "nowrap", border: "1.5px solid",
            background:  active === c ? BLUE6  : "#fff",
            color:       active === c ? "#fff" : "#475569",
            borderColor: active === c ? BLUE6  : "#e2e8f0",
          }}
        >{c}</button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CITY FILTER BAR
═══════════════════════════════════════════════════ */
function CityFilter({ cities, active, setActive }) {
  if (!cities.length) return null;

  const all = ["All Cities", ...cities];

  return (
    <div style={{
      marginBottom: 20,
      background: "#fff",
      border: "1.5px solid #e0ecfb",
      borderRadius: 16,
      padding: "12px 14px",
      boxShadow: "0 2px 12px rgba(21,101,192,0.06)",
    }}>
      {/* Header row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 7, marginBottom: 10,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: BLUELT, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <MapPin size={13} color={BLUE6} />
        </div>
        <span style={{
          fontSize: 12, fontWeight: 800, color: "#0f172a",
          fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.7px",
        }}>
          Filter by City
        </span>
        {active !== "All Cities" && (
          <button
            onClick={() => setActive("All Cities")}
            style={{
              marginLeft: "auto", background: BLUELT, border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
              fontSize: 11.5, fontWeight: 700, color: BLUE6, fontFamily: FONT,
              borderRadius: 40, padding: "4px 10px",
              transition: "background .15s",
            }}
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* Scrollable chip row */}
      <div
        className="mph-city-scroll"
        style={{
          display: "flex", gap: 6,
          overflowX: "auto",
          paddingBottom: 2,
        }}
      >
        {all.map(city => {
          const isActive = active === city;
          return (
            <button
              key={city}
              onClick={() => setActive(city)}
              className={`mph-chip${isActive ? " mph-chip-active" : ""}`}
              style={{
                padding: "6px 14px", borderRadius: 40,
                fontSize: 12, fontWeight: 700, fontFamily: FONT,
                cursor: "pointer", whiteSpace: "nowrap", border: "1.5px solid",
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 5,
                background:  isActive ? BLUE6  : "#f8faff",
                color:       isActive ? "#fff" : "#475569",
                borderColor: isActive ? BLUE6  : "#e2e8f0",
              }}
            >
              {city !== "All Cities" && (
                <MapPin size={10} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />
              )}
              {city}
            </button>
          );
        })}
      </div>

      {/* Active city indicator */}
      {active !== "All Cities" && (
        <div style={{
          marginTop: 10,
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, color: BLUE6, fontFamily: FONT, fontWeight: 600,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#34d399", flexShrink: 0,
            animation: "pulse 1.6s infinite",
          }} />
          Showing listings in <strong style={{ color: "#0f172a" }}>{active}</strong>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SKELETON CARD
═══════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div style={{
      background: "#fff", borderRadius: 22, overflow: "hidden",
      border: "1.5px solid #e0ecfb",
      boxShadow: "0 4px 32px rgba(21,101,192,0.07), 0 1px 4px rgba(0,0,0,0.03)",
    }}>
      <div className="mph-skel" style={{ height: 185, borderRadius: 0 }} />
      <div style={{ padding: "13px 14px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div className="mph-skel" style={{ height: 11, width: "40%", borderRadius: 6 }} />
          <div className="mph-skel" style={{ height: 11, width: "20%", borderRadius: 6 }} />
        </div>
        <div className="mph-skel" style={{ height: 15, width: "80%", borderRadius: 6 }} />
        <div className="mph-skel" style={{ height: 18, width: "45%", borderRadius: 6 }} />
        <div className="mph-skel" style={{ height: 11, width: "55%", borderRadius: 6 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0f6ff" }}>
          <div className="mph-skel" style={{ height: 12, width: "28%", borderRadius: 6 }} />
          <div className="mph-skel" style={{ height: 32, width: "38%", borderRadius: 50 }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRODUCT MODAL
═══════════════════════════════════════════════════ */
function ProductModal({ product, onClose, onCart, cartSet, userId }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [saved, setSaved]   = useState(false);
  const overlayRef          = useRef(null);

  const images    = product?.images?.length ? product.images : [];
  const allImages = images.length > 0
    ? images.map(img => img.image)
    : product.primary_image
      ? [product.primary_image]
      : [];

  const currentImage = allImages[imgIdx] || "https://via.placeholder.com/800x600?text=No+Image";
  const isNew        = product.condition === "new";
  const inCart       = cartSet.has(product.id);
  const isOwn        = !!userId && Number(product.seller_id) === Number(userId);

  const prev = useCallback((e) => {
    e?.stopPropagation();
    setImgIdx(i => (i - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  const next = useCallback((e) => {
    e?.stopPropagation();
    setImgIdx(i => (i + 1) % allImages.length);
  }, [allImages.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const timeAgo = (d) => {
    const sec = (Date.now() - new Date(d)) / 1000;
    if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const detailRows = [
    { icon: <Layers size={14} />,      label: "Category",  val: product.category_name },
    { icon: <BadgeCheck size={14} />,  label: "Condition", val: isNew ? "Brand New" : "Used" },
    { icon: <MapPin size={14} />,      label: "Location",  val: product.city },
    { icon: <Calendar size={14} />,    label: "Posted",    val: timeAgo(product.created_at) },
    { icon: <Eye size={14} />,         label: "Views",     val: product.view_count ?? 0 },
  ].filter(r => r.val !== undefined && r.val !== null && r.val !== "");

  return (
    <div className="mph-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="mph-modal" role="dialog" aria-modal="true" aria-label={product.title}>

        {/* Close button */}
        <button className="mph-modal-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        <div className="mph-modal-body">

          {/* ── Image panel ── */}
          <div className="mph-modal-img-panel">
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                key={currentImage}
                className="mph-modal-main-img"
                src={currentImage}
                alt={product.title}
                onError={e => { e.target.src = "https://via.placeholder.com/800x600?text=No+Image"; }}
              />

              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(10,28,64,0.25) 0%, transparent 50%)",
                pointerEvents: "none",
              }} />

              {/* Condition badge */}
              <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
                <span style={{
                  padding: "4px 12px", borderRadius: 40,
                  fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: FONT,
                  backdropFilter: "blur(6px)",
                  background: isNew ? "rgba(37,99,235,0.88)" : "rgba(100,116,139,0.88)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.16)",
                }}>
                  {isNew ? "✦ New" : "Used"}
                </span>
                {product.is_negotiable && (
                  <span style={{
                    padding: "4px 12px", borderRadius: 40,
                    fontSize: 11, fontWeight: 800, fontFamily: FONT,
                    backdropFilter: "blur(6px)",
                    background: "rgba(255,255,255,0.90)", color: BLUE6,
                    border: `1px solid rgba(96,165,250,0.35)`,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                  }}>Negotiable</span>
                )}
              </div>

              {/* Save button */}
              <button
                className={`mph-save-btn${saved ? " saved" : ""}`}
                onClick={e => { e.stopPropagation(); setSaved(v => !v); }}
                aria-label={saved ? "Remove from saved" : "Save listing"}
                style={{ top: 12, right: 12 }}
              >
                <Heart size={15} fill={saved ? BLUE5 : "none"} stroke={saved ? BLUE5 : "currentColor"} />
              </button>

              {/* Nav arrows */}
              {allImages.length > 1 && (
                <>
                  <button className="mph-modal-nav-btn" style={{ left: 10 }} onClick={prev} aria-label="Previous image">
                    <ArrowLeft size={16} />
                  </button>
                  <button className="mph-modal-nav-btn" style={{ right: 10 }} onClick={next} aria-label="Next image">
                    <ArrowRight size={16} />
                  </button>

                  <div style={{
                    position: "absolute", bottom: 12, right: 12,
                    background: "rgba(10,20,50,0.55)", backdropFilter: "blur(6px)",
                    borderRadius: 40, padding: "3px 10px",
                    fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: FONT,
                  }}>
                    {imgIdx + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div style={{
                display: "flex", gap: 8, padding: "12px 14px",
                overflowX: "auto", background: "#f8faff",
                borderTop: "1px solid #e8f0fe",
                scrollbarWidth: "none",
                flexShrink: 0,
              }}>
                {allImages.map((img, i) => (
                  <div
                    key={i}
                    className={`mph-thumb${i === imgIdx ? " mph-thumb-active" : ""}`}
                    onClick={() => setImgIdx(i)}
                    style={{
                      width: 60, height: 48,
                      border: i === imgIdx ? `2.5px solid ${BLUE6}` : "2px solid #e0ecfb",
                      borderRadius: 10, overflow: "hidden", flexShrink: 0,
                    }}
                  >
                    <img
                      src={img}
                      alt={`View ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { e.target.src = "https://via.placeholder.com/60x48?text=✕"; }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Dot indicators */}
            {allImages.length > 1 && (
              <div style={{
                display: "flex", justifyContent: "center", gap: 6,
                padding: "10px 0 8px", background: "#f8faff",
                borderTop: allImages.length <= 1 ? "none" : "0",
              }}>
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    style={{
                      width: i === imgIdx ? 20 : 7, height: 7, borderRadius: 99,
                      border: "none", cursor: "pointer", padding: 0,
                      background: i === imgIdx ? BLUE6 : "#bfdbfe",
                      transition: "all .2s",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Info panel ── */}
          <div className="mph-modal-info-panel">

            {/* Category pill */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: BLUELT, color: BLUE6,
              border: `1px solid ${BLUEM}`, borderRadius: 40,
              padding: "4px 12px", fontSize: 11, fontWeight: 700,
              fontFamily: FONT, alignSelf: "flex-start",
            }}>
              <Tag size={10} /> {product.category_name}
            </span>

            {/* Title */}
            <h2 style={{
              fontFamily: FONT_S, fontSize: "clamp(17px,2.5vw,22px)",
              fontWeight: 700, color: "#0f172a", lineHeight: 1.28,
              letterSpacing: "-0.3px",
            }}>
              {product.title}
            </h2>

            {/* Price row */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: FONT_S, fontSize: "clamp(22px,3vw,30px)",
                fontWeight: 800, color: BLUE6, letterSpacing: "-1px",
              }}>
                ر.ق{Number(product.price).toLocaleString("en-IN")}
              </span>
              {product.is_negotiable && (
                <span style={{
                  fontSize: 12, fontWeight: 700, color: "#16a34a",
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: 40, padding: "3px 10px", fontFamily: FONT,
                }}>Negotiable</span>
              )}
            </div>

            {/* Detail rows */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 10,
              background: "#f8faff", borderRadius: 14,
              padding: "14px 16px", border: "1px solid #e8f0fe",
            }}>
              {detailRows.map(({ icon, label, val }) => (
                <div key={label} className="mph-detail-row">
                  <div className="mph-detail-icon">{icon}</div>
                  <span style={{ color: "#94a3b8", fontWeight: 600, minWidth: 72 }}>{label}</span>
                  <span style={{ color: "#0f172a", fontWeight: 700, marginLeft: "auto", textAlign: "right", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p style={{
                  fontSize: 12, fontWeight: 800, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.8px",
                  fontFamily: FONT, marginBottom: 8,
                }}>Description</p>
                <p style={{
                  fontSize: 13.5, color: "#334155", fontFamily: FONT,
                  lineHeight: 1.7, fontWeight: 400,
                }}>
                  {product.description}
                </p>
              </div>
            )}

            {/* Seller info */}
            {product.seller_name && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: BLUELT2, border: `1px solid ${BLUEM}`,
                borderRadius: 14, padding: "12px 16px",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${BLUE6}, ${BLUE5})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 800, fontSize: 16,
                  fontFamily: FONT_S, flexShrink: 0,
                }}>
                  {product.seller_name?.[0]?.toUpperCase() ?? "S"}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: FONT }}>{product.seller_name}</p>
                  <p style={{ fontSize: 11.5, color: "#64748b", fontFamily: FONT }}>Seller</p>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                  {product.seller_phone && (
                    <a
                      href={`tel:${product.seller_phone}`}
                      style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "#fff", border: `1.5px solid ${BLUEM}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: BLUE6, textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(21,101,192,0.10)",
                      }}
                      title="Call seller"
                    >
                      <Phone size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto", paddingTop: 4 }}>
              {isOwn ? (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  height: 48, background: BLUELT, border: `1.5px solid ${BLUEM}`,
                  borderRadius: 14, fontSize: 14, fontWeight: 700, color: BLUE, fontFamily: FONT,
                }}>
                  <Lock size={14} /> This is your listing
                </div>
              ) : userId ? (
                <>
                  <button
                    className="mph-modal-cta mph-btn-cart"
                    onClick={(e) => { e.stopPropagation(); onCart(product); }}
                    style={{
                      height: 50, borderRadius: 14, border: "none",
                      cursor: "pointer", fontFamily: FONT, fontSize: 14.5, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                      color: "#fff",
                      background: inCart
                        ? "linear-gradient(135deg,#059669,#047857)"
                        : `linear-gradient(135deg,${BLUE},${BLUE2})`,
                      boxShadow: inCart
                        ? "0 6px 20px rgba(5,150,105,0.30)"
                        : "0 6px 20px rgba(21,101,192,0.30)",
                    }}
                  >
                    {inCart
                      ? <><CheckCircle size={17} /> Remove from Cart</>
                      : <><ShoppingCart size={17} /> Add to Cart</>
                    }
                  </button>
                  <button
                    className="mph-modal-cta"
                    onClick={() => window.location.href = `/marketplace/product/${product.slug ?? product.id}`}
                    style={{
                      height: 46, borderRadius: 14,
                      border: `2px solid ${BLUE6}`,
                      background: "#fff", color: BLUE6,
                      cursor: "pointer", fontFamily: FONT, fontSize: 14, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                    }}
                  >
                    <Eye size={16} /> View Full Details
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/marketplace/login"
                    className="mph-modal-cta"
                    style={{
                      height: 50, borderRadius: 14, textDecoration: "none",
                      background: `linear-gradient(135deg,${BLUE},${BLUE2})`,
                      color: "#fff", fontFamily: FONT, fontSize: 14.5, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                      boxShadow: "0 6px 20px rgba(21,101,192,0.30)",
                    }}
                  >
                    <Lock size={16} /> Login to Buy
                  </a>
                  <p style={{
                    textAlign: "center", fontSize: 12, color: "#94a3b8",
                    fontFamily: FONT, fontWeight: 500,
                  }}>
                    Sign in to add to cart or contact the seller
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════════════ */
const ProductCard = memo(function ProductCard({
  product, idx, onCart, onView, cartSet, userId,
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [saved, setSaved]   = useState(false);

  const isOwn  = !!userId && Number(product.seller_id) === Number(userId);
  const inCart = cartSet.has(product.id);
  const isNew  = product.condition === "new";

  const images       = product?.images || [];
  const currentImage = images.length > 1 ? images[imgIdx]?.image : product.primary_image;

  const timeAgo = d => {
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div
      className="mph-card"
      style={{
        background: "#fff", borderRadius: 22, overflow: "hidden",
        display: "flex", flexDirection: "column",
        border: "1.5px solid #e0ecfb",
        boxShadow: "0 4px 24px rgba(21,101,192,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        animation: "cardFadeIn .4s cubic-bezier(.22,1,.36,1) both",
        animationDelay: `${(idx % 8) * 0.06}s`,
        cursor: "pointer",
      }}
      onClick={() => onView?.(product)}
    >
      {/* Image */}
      <div className="mph-card-img-wrap" style={{
        position: "relative", height: 185,
        background: BLUELT2, overflow: "hidden", flexShrink: 0,
      }}>
        <img
          className="mph-card-img"
          src={currentImage || "https://via.placeholder.com/400x280?text=No+Image"}
          alt={product.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={e => { e.target.src = "https://via.placeholder.com/400x280?text=No+Image"; }}
        />

        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top,rgba(15,52,96,0.22) 0%,transparent 55%)",
          pointerEvents: "none",
        }} />

        {/* Condition + negotiable badges */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5 }}>
          <span style={{
            padding: "3px 10px", borderRadius: 40,
            fontSize: 10.5, fontWeight: 700, color: "#fff",
            fontFamily: FONT, letterSpacing: "0.2px",
            backdropFilter: "blur(6px)",
            background: isNew ? "rgba(37,99,235,0.84)" : "rgba(148,163,184,0.84)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
          }}>
            {isNew ? "New" : "Used"}
          </span>
          {product.is_negotiable && (
            <span style={{
              padding: "3px 10px", borderRadius: 40,
              fontSize: 10.5, fontWeight: 700,
              fontFamily: FONT, letterSpacing: "0.2px",
              backdropFilter: "blur(6px)",
              background: "rgba(255,255,255,0.88)",
              color: BLUE6,
              border: `1px solid rgba(96,165,250,0.3)`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>Nego</span>
          )}
        </div>

        {/* Save button */}
        <button
          className={`mph-save-btn${saved ? " saved" : ""}`}
          onClick={e => { e.stopPropagation(); setSaved(v => !v); }}
          aria-label={saved ? "Remove from saved" : "Save listing"}
        >
          <Heart size={14} fill={saved ? BLUE5 : "none"} stroke={saved ? BLUE5 : "currentColor"} />
        </button>

        {/* View count badge */}
        <span style={{
          position: "absolute", bottom: 10, right: 10,
          background: "rgba(15,52,96,0.50)", backdropFilter: "blur(6px)",
          borderRadius: 40, padding: "3px 9px",
          fontSize: 10.5, fontWeight: 600, color: "#fff",
          display: "flex", alignItems: "center", gap: 4, fontFamily: FONT,
        }}>
          <Eye size={11} /> {product.view_count ?? 0}
        </span>

        {/* Image nav dots */}
        {images.length > 1 && (
          <div style={{
            position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 5, zIndex: 2,
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                style={{
                  width: 6, height: 6, borderRadius: "50%",
                  border: "none", cursor: "pointer", padding: 0,
                  background: i === imgIdx ? "#fff" : "rgba(255,255,255,0.4)",
                  transform: i === imgIdx ? "scale(1.4)" : "scale(1)",
                  transition: "all .15s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mph-card-body" style={{
        padding: "12px 14px 8px",
        display: "flex", flexDirection: "column", gap: 5, flex: 1,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: BLUE5,
          textTransform: "uppercase", letterSpacing: "0.6px", fontFamily: FONT,
        }}>{product.category_name}</span>

        <h3 style={{
          fontSize: 13.5, fontWeight: 700, color: "#0f172a", fontFamily: FONT_S,
          lineHeight: 1.3, overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{product.title}</h3>

        <div style={{
          fontSize: 17, fontWeight: 700, color: BLUE6,
          fontFamily: FONT_S, letterSpacing: "-0.4px", marginTop: 2,
        }}>
          ر.ق{Number(product.price).toLocaleString("en-IN")}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 2 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#64748b", fontFamily: FONT, fontWeight: 500 }}>
            <MapPin size={11} color={BLUEM3} style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {product.city}
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11.5, color: "#94a3b8", fontFamily: FONT, fontWeight: 500 }}>
            <Clock size={10} /> {timeAgo(product.created_at)}
          </span>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "auto", paddingTop: 10,
          borderTop: "1px solid #f0f6ff",
        }}>
          {isOwn ? (
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              height: 34, background: BLUELT, border: `1.5px solid ${BLUEM}`, borderRadius: 50,
            }}>
              <Lock size={11} color={BLUE} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: BLUE, fontFamily: FONT }}>Your Product</span>
            </div>
          ) : (
            <>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#94a3b8", fontFamily: FONT }}>
                <Eye size={11} color={BLUEM3} /> {product.view_count ?? 0} views
              </span>
              <button
                className="mph-btn-cart"
                onClick={e => { e.stopPropagation(); onCart(product); }}
                title={inCart ? "Remove from cart" : "Add to cart"}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "none", cursor: "pointer",
                  background: inCart
                    ? "linear-gradient(135deg,#059669,#047857)"
                    : `linear-gradient(135deg,${BLUE},${BLUE2})`,
                  color: "#fff",
                  boxShadow: inCart
                    ? "0 3px 10px rgba(5,150,105,0.26)"
                    : "0 3px 10px rgba(21,101,192,0.26)",
                  flexShrink: 0,
                }}
              >
                {inCart ? <CheckCircle size={13} /> : <ShoppingCart size={13} />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════
   PAGINATION
═══════════════════════════════════════════════════ */
function Pagination({ page, totalPages, onChange }) {
  const pages = [];
  const start = Math.max(1, page - 2);
  const end   = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase = {
    width: 38, height: 38, borderRadius: 10,
    background: "#fff", border: "1.5px solid #e0ecfb",
    fontSize: 13, fontWeight: 600, color: "#475569",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: FONT, boxShadow: "0 2px 8px rgba(21,101,192,0.06)",
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 6, margin: "28px 0 10px", flexWrap: "wrap",
    }}>
      <button className="mph-pg-btn" style={{ ...btnBase, opacity: page === 1 ? .42 : 1 }}
        disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={16} />
      </button>

      {start > 1 && (
        <>
          <button className="mph-pg-btn" style={btnBase} onClick={() => onChange(1)}>1</button>
          {start > 2 && <span style={{ fontSize: 15, color: "#94a3b8", fontFamily: FONT }}>…</span>}
        </>
      )}

      {pages.map(p => (
        <button key={p}
          className={`mph-pg-btn${p === page ? " mph-pg-active" : ""}`}
          style={{ ...btnBase, background: p === page ? BLUE : "#fff", color: p === page ? "#fff" : "#475569", borderColor: p === page ? BLUE : "#e0ecfb" }}
          onClick={() => onChange(p)}
        >{p}</button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ fontSize: 15, color: "#94a3b8", fontFamily: FONT }}>…</span>}
          <button className="mph-pg-btn" style={btnBase} onClick={() => onChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button className="mph-pg-btn" style={{ ...btnBase, opacity: page === totalPages ? .42 : 1 }}
        disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════ */
function SidebarContent({ totalCount, cartSize, categories, cities, activeCity }) {
  return (
    <>
      <div style={s.infoCard}>
        <div style={s.infoHead}>
          <div style={{ fontSize: 20 }}>🏪</div>
          <span style={s.infoTitle}>Marketplace</span>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 11.5, color: "#94a3b8", margin: "0 0 14px", fontWeight: 500 }}>
          {totalCount > 0 ? `${totalCount} active listings` : "Browse all categories"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Categories", val: categories.length, dot: BLUE5     },
            { label: "Cities",     val: cities.length,     dot: "#f59e0b" },
            { label: "In Cart",    val: cartSize,          dot: "#16a34a" },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#475569", fontFamily: FONT, fontWeight: 500 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: row.dot, flexShrink: 0 }} />
                {row.label}
              </div>
              <span style={{ fontFamily: FONT_S, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Active city pill */}
        {activeCity !== "All Cities" && (
          <div style={{
            marginTop: 12, display: "flex", alignItems: "center", gap: 7,
            background: BLUELT, border: `1px solid ${BLUEM}`,
            borderRadius: 40, padding: "6px 12px",
          }}>
            <MapPin size={11} color={BLUE6} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: BLUE6, fontFamily: FONT, flex: 1 }}>
              {activeCity}
            </span>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", animation: "pulse 1.6s infinite", flexShrink: 0 }} />
          </div>
        )}

        <div style={{ height: 6, background: "#e0ecfb", borderRadius: 99, overflow: "hidden", marginTop: 14 }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: `linear-gradient(90deg, ${BLUE6}, #16a34a)`,
            width: cartSize > 0 ? "60%" : "10%",
            transition: "width 0.8s cubic-bezier(.22,1,.36,1)",
          }} />
        </div>
      </div>

      <div style={s.infoCard}>
        <div style={s.infoHead}>
          <div style={{ fontSize: 20 }}>💡</div>
          <span style={s.infoTitle}>Buying Tips</span>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Tap the cart icon to compare prices before deciding.",
            "Use 'Details' to contact the seller directly about an item.",
            "Heart an item to save it for later.",
            "Check condition badges — New vs Used affects value.",
          ].map((tip, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#475569", fontFamily: FONT, lineHeight: 1.55 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: BLUE6, marginTop: 5, flexShrink: 0, opacity: 0.7 }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <AdSlot variant="sidebar" />
      <div style={{ position: "sticky", top: 80 }}>
        <AdSlot variant="sidebar" />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function MarketplaceHome() {
  const [products,       setProducts]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(1);
  const [totalPages,     setTotalPages]     = useState(1);
  const [totalCount,     setTotalCount]     = useState(0);
  const [error,          setError]          = useState(null);
  const [search,         setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeCity,     setActiveCity]     = useState("All Cities");
  const [cartSet,        setCartSet]        = useState(new Set());
  const [modalProduct,   setModalProduct]   = useState(null);
  const { toast, add }                      = useToast();

  const userId = Number(
    localStorage.getItem("user_id") ?? localStorage.getItem("userId") ?? 0
  ) || 0;

  const safeProducts = Array.isArray(products) ? products : [];
  const categories   = [...new Set(safeProducts.map(p => p?.category_name).filter(Boolean))].sort();
  const cities       = [...new Set(safeProducts.map(p => p?.city).filter(Boolean))].sort();
  const totalNew     = safeProducts.filter(p => p.condition === "new").length;
  const totalUsed    = safeProducts.filter(p => p.condition === "used").length;

  const filtered = safeProducts.filter(p => {
    if (!p) return false;
    const q = search.toLowerCase();
    const matchSearch = !search
      || p.title?.toLowerCase().includes(q)
      || p.category_name?.toLowerCase().includes(q)
      || p.city?.toLowerCase().includes(q);
    const matchCat =
      activeCategory === "All"
      || (activeCategory === "New"        && p.condition === "new")
      || (activeCategory === "Used"       && p.condition === "used")
      || (activeCategory === "Negotiable" && p.is_negotiable)
      || p.category_name === activeCategory;
    const matchCity = activeCity === "All Cities" || p.city === activeCity;
    return matchSearch && matchCat && matchCity;
  });

  const loadProducts = useCallback(async (pageNumber) => {
    setLoading(true); setError(null);
    try {
      const res  = await fetchHomeProducts({ page: pageNumber, limit: 12 });
      const data = res?.data || res || [];
      setProducts(Array.isArray(data) ? data : []);
      setTotalPages(res?.total_pages || 1);
      setTotalCount(res?.count || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load products. Please try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProducts(page); }, [page, loadProducts]);

  const handleCart = useCallback(async (product) => {
    if (Number(product.seller_id) === userId) {
      add("You can't add your own product", "error"); return;
    }
    const wasInCart = cartSet.has(product.id);
    setCartSet(prev => {
      const next = new Set(prev);
      wasInCart ? next.delete(product.id) : next.add(product.id);
      return next;
    });
    try {
      if (wasInCart) {
        await removeFromCart(product.id);
        add("Removed from cart");
      } else {
        const res = await addToCart(product.id);
        add(res?.data?.already_exists ? "Already in cart" : "Added to cart ✓");
      }
    } catch {
      setCartSet(prev => {
        const next = new Set(prev);
        wasInCart ? next.add(product.id) : next.delete(product.id);
        return next;
      });
      add("Cart action failed", "error");
    }
  }, [cartSet, add, userId]);

  const handleView = useCallback((product) => {
    setModalProduct(product);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalProduct(null);
  }, []);

  const handlePageChange = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Reset to page 1 when city filter changes
  const handleCityChange = useCallback((city) => {
    setActiveCity(city);
    setPage(1);
  }, []);

  return (
    <div>
      <InjectStyles />
      <ToastPill toast={toast} />

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={handleModalClose}
          onCart={handleCart}
          cartSet={cartSet}
          userId={userId}
        />
      )}

      <div style={{ minHeight: "100vh", background: "#f0f6ff", fontFamily: FONT }}>

        <HeroBanner
          totalCount={loading ? "–" : totalCount}
          totalNew={loading ? "–" : totalNew}
          totalUsed={loading ? "–" : totalUsed}
        />

        {/* Mobile top ad */}
        <div className="mph-top-ad" style={{ display: "none", padding: "14px 14px 0", background: "#f0f6ff" }}>
          <AdSlot variant="banner" />
        </div>

        <div className="mph-wrap" style={{
          maxWidth: 1240, margin: "0 auto",
          padding: "clamp(14px,3vw,28px) clamp(12px,3vw,28px)",
        }}>

          {/* Desktop leaderboard ad */}
          <div className="mph-desk-ad" style={{ marginBottom: 20 }}>
            <AdSlot variant="banner" />
          </div>

          <SearchBar value={search} onChange={setSearch} />

          {!loading && (
            <>
              <CategoryBar
                categories={categories}
                active={activeCategory}
                setActive={setActiveCategory}
              />
              <CityFilter
                cities={cities}
                active={activeCity}
                setActive={handleCityChange}
              />
            </>
          )}

          {/* Section header */}
          <div className="mph-sec-head" style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            marginBottom: 16, flexWrap: "wrap", gap: 10,
          }}>
            <div>
              <h2 style={{
                fontFamily: FONT_D, fontSize: "clamp(17px,3vw,22px)",
                fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em",
              }}>
                {activeCategory === "All" ? "All Listings" : activeCategory}
                {activeCity !== "All Cities" && (
                  <span style={{
                    fontFamily: FONT, fontSize: "clamp(13px,2vw,15px)",
                    fontWeight: 600, color: BLUE5, marginLeft: 8,
                  }}>
                    · {activeCity}
                  </span>
                )}
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", fontFamily: FONT, marginTop: 3 }}>
                {loading
                  ? "Loading listings…"
                  : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""}${totalCount > filtered.length ? ` of ${totalCount}` : ""} found`
                }
              </p>
            </div>

            {cartSet.size > 0 && (
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "#f0fdf4", color: "#16a34a",
                border: "1.5px solid #bbf7d0", borderRadius: 40,
                padding: "7px 16px", fontSize: 13, fontWeight: 700,
                fontFamily: FONT, animation: "popIn .3s ease both", flexShrink: 0,
              }}>
                <ShoppingCart size={14} /> {cartSet.size} in cart
              </div>
            )}
          </div>

          {/* Two-column layout */}
          <div className="mph-layout" style={{
            display: "grid", gridTemplateColumns: "1fr 220px",
            gap: 22, alignItems: "flex-start",
          }}>

            {/* Product grid */}
            <div style={{ minWidth: 0 }}>
              {error && !loading && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#fff1f2", border: "1px solid #fecdd3",
                  borderRadius: 14, padding: "14px 16px",
                  fontSize: 13.5, color: "#9f1239", fontFamily: FONT, marginBottom: 16,
                }}>
                  <X size={17} color="#e11d48" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{error}</span>
                  <button onClick={() => loadProducts(page)} style={{
                    padding: "7px 16px",
                    background: `linear-gradient(135deg,${BLUE6},${BLUE7})`,
                    color: "#fff", border: "none", borderRadius: 10,
                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
                  }}>Retry</button>
                </div>
              )}

              <div className="mph-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))",
                gap: 16,
              }}>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                  : filtered.length === 0
                    ? (
                      <div style={{
                        gridColumn: "1/-1",
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        padding: "72px 20px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: 56, marginBottom: 16, animation: "floatOrb 4s ease-in-out infinite" }}>
                          <Package size={56} color={BLUEM3} />
                        </div>
                        <h3 style={{ fontFamily: FONT_S, fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                          No listings found
                        </h3>
                        <p style={{ fontSize: 13.5, color: "#94a3b8", fontFamily: FONT }}>
                          {activeCity !== "All Cities"
                            ? `No listings in ${activeCity} — try a different city`
                            : "Try adjusting your search or filter"
                          }
                        </p>
                        {activeCity !== "All Cities" && (
                          <button
                            onClick={() => handleCityChange("All Cities")}
                            style={{
                              marginTop: 16, padding: "9px 20px",
                              background: `linear-gradient(135deg,${BLUE6},${BLUE7})`,
                              color: "#fff", border: "none", borderRadius: 40,
                              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
                            }}
                          >
                            Show all cities
                          </button>
                        )}
                      </div>
                    )
                    : filtered.map((p, i) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        idx={i}
                        onCart={handleCart}
                        onView={handleView}
                        cartSet={cartSet}
                        userId={userId}
                      />
                    ))
                }
              </div>

              {!loading && filtered.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <AdSlot variant="inline" />
                </div>
              )}

              {!loading && totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
              )}
            </div>

            {/* Sidebar */}
            <aside className="mph-sidebar" style={{
              display: "flex", flexDirection: "column", gap: 16, flexShrink: 0,
              animation: "fadeUp 0.45s ease both", animationDelay: "0.2s",
            }}>
              <SidebarContent
                totalCount={totalCount}
                cartSize={cartSet.size}
                categories={categories}
                cities={cities}
                activeCity={activeCity}
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}