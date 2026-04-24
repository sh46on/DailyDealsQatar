import { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  fetchProducts, addToCart, removeFromCart,
  requestProduct, fetchRequestedProducts, fetchCart,
} from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";
import {
  ShoppingCart, MessageCircle, Eye, MapPin, Tag,
  ChevronLeft, ChevronRight, Clock, Search, X,
  CheckCircle, Lock, PhoneForwarded,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════ */
const FONT   = "'Plus Jakarta Sans', sans-serif";
const FONT_D = "'Fraunces', serif";
const BLUE   = "#1565c0";
const BLUE2  = "#1976d2";
const BLUELT = "#e3f2fd";
const BLUEM  = "#bfdbfe";

/* ═══════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;} }
  @keyframes fadeIn    { from{opacity:0;}to{opacity:1;} }
  @keyframes shimmer   { 0%{background-position:-600px 0;}100%{background-position:600px 0;} }
  @keyframes floatOrb  { 0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);} }
  @keyframes waveSlide { to{transform:translateX(-50%);} }
  @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(1.35);} }
  @keyframes popIn     { 0%{opacity:0;transform:scale(0.82);}70%{transform:scale(1.05);}100%{opacity:1;transform:scale(1);} }
  @keyframes spin      { to{transform:rotate(360deg);} }
  @keyframes slideDown { from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:none;} }

  .mph-skel {
    background: linear-gradient(90deg,#f0f4f8 25%,#e2ecf7 50%,#f0f4f8 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s linear infinite;
    border-radius: 8px;
  }

  .mph-card {
    transition: transform .3s cubic-bezier(.22,1,.36,1),
                box-shadow .3s cubic-bezier(.22,1,.36,1),
                border-color .3s cubic-bezier(.22,1,.36,1) !important;
  }
  .mph-card:hover {
    transform: translateY(-6px) !important;
    box-shadow: 0 20px 48px rgba(21,101,192,0.16), 0 4px 14px rgba(0,0,0,0.05) !important;
    border-color: ${BLUEM} !important;
  }
  .mph-card:hover .mph-card-img { transform: scale(1.06) !important; }
  .mph-card-img { transition: transform .42s cubic-bezier(.22,1,.36,1) !important; }

  .mph-btn-cart {
    transition: background .18s, transform .18s, box-shadow .18s, opacity .15s !important;
  }
  .mph-btn-cart:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 22px rgba(21,101,192,0.34) !important;
    filter: brightness(1.06) !important;
  }
  .mph-btn-req {
    transition: background .18s, color .18s, border-color .18s, transform .18s !important;
  }
  .mph-btn-req:hover:not(:disabled) {
    background: ${BLUE} !important;
    color: #fff !important;
    border-color: ${BLUE} !important;
    transform: translateY(-2px) !important;
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
    background: ${BLUE} !important;
    color: #fff !important;
    border-color: ${BLUE} !important;
    box-shadow: 0 4px 14px rgba(21,101,192,0.32) !important;
  }

  /* ── Location chip — teal/green accent ── */
  .mph-loc-chip {
    transition: background .18s, color .18s, border-color .18s,
                transform .18s, box-shadow .18s !important;
  }
  .mph-loc-chip:hover:not(.mph-loc-chip-active) {
    background: #ecfdf5 !important;
    color: #065f46 !important;
    border-color: #6ee7b7 !important;
    transform: translateY(-1px) !important;
  }
  .mph-loc-chip-active {
    background: #059669 !important;
    color: #fff !important;
    border-color: #059669 !important;
    box-shadow: 0 4px 14px rgba(5,150,105,0.30) !important;
  }

  /* ── Location bar wrapper ── */
  .mph-loc-bar-inner {
    animation: slideDown .22s cubic-bezier(.22,1,.36,1) both;
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
  }
  @media (max-width: 380px) {
    .mph-grid       { grid-template-columns: 1fr !important; }
    .mph-hero-title { font-size: 20px !important; }
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
function HeroBanner() {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(130deg, #0f3460 0%, #1565c0 50%, #1976d2 100%)",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />
      <div style={{ position:"absolute", width:280, height:280, top:-90,  right:-60, borderRadius:"50%", background:"rgba(255,255,255,0.06)", animation:"floatOrb 7s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:150, height:150, bottom:10, left:50,  borderRadius:"50%", background:"rgba(255,255,255,0.06)", animation:"floatOrb 7s ease-in-out infinite", animationDelay:"2s", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:100, height:100, top:40,   left:"38%",borderRadius:"50%", background:"rgba(255,255,255,0.04)", animation:"floatOrb 9s ease-in-out infinite", animationDelay:"4s", pointerEvents:"none" }} />

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
          Discover Great{" "}
          <span style={{
            background: "linear-gradient(90deg, #93c5fd, #34d399)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Deals
          </span>
          <br />Near You
        </h1>

        <p style={{
          fontSize: "clamp(13px,2vw,15px)", color: "rgba(255,255,255,0.7)",
          fontFamily: FONT, fontWeight: 400, lineHeight: 1.6, margin: 0,
          animation: "fadeUp .45s ease both", animationDelay: "0.16s",
        }}>
          Buy &amp; sell locally — electronics, furniture, fashion &amp; more
        </p>
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
   CATEGORY CHIPS
═══════════════════════════════════════════════════ */
function CategoryBar({ categories, active, setActive }) {
  return (
    <div className="mph-cat-bar" style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
      {["All", ...categories].map(c => (
        <button
          key={c}
          onClick={() => setActive(c)}
          className={`mph-chip${active === c ? " mph-chip-active" : ""}`}
          style={{
            padding: "7px 16px", borderRadius: 40,
            fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
            cursor: "pointer", whiteSpace: "nowrap", border: "1.5px solid",
            background:  active === c ? BLUE   : "#fff",
            color:       active === c ? "#fff" : "#475569",
            borderColor: active === c ? BLUE   : "#e2e8f0",
          }}
        >{c}</button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LOCATION FILTER BAR
═══════════════════════════════════════════════════ */
function LocationBar({ cities, activeCity, setActiveCity }) {
  if (!cities || cities.length === 0) return null;

  return (
    <div className="mph-loc-bar-inner" style={{ marginBottom: 20 }}>
      {/* Divider label row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 9,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#f0fdf4", border: "1.5px solid #bbf7d0",
          borderRadius: 40, padding: "4px 12px",
          flexShrink: 0,
        }}>
          <MapPin size={12} color="#059669" style={{ flexShrink: 0 }} />
          <span style={{
            fontSize: 11, fontWeight: 800, color: "#065f46",
            fontFamily: FONT, letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            Filter by City
          </span>
          {activeCity !== "All" && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              background: "#059669", color: "#fff",
              borderRadius: 40, padding: "1px 7px",
              marginLeft: 2,
            }}>
              1 active
            </span>
          )}
        </div>
        <div style={{ flex: 1, height: 1, background: "#e0f2f1" }} />
        {activeCity !== "All" && (
          <button
            onClick={() => setActiveCity("All")}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11.5, fontWeight: 700, color: "#059669",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: FONT, padding: "3px 6px", borderRadius: 6,
              flexShrink: 0,
            }}
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* City chips */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {["All", ...cities].map(city => {
          const isActive = activeCity === city;
          return (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`mph-loc-chip${isActive ? " mph-loc-chip-active" : ""}`}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 14px", borderRadius: 40,
                fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
                cursor: "pointer", whiteSpace: "nowrap", border: "1.5px solid",
                background:  isActive ? "#059669" : "#fff",
                color:       isActive ? "#fff"    : "#475569",
                borderColor: isActive ? "#059669" : "#d1fae5",
              }}
            >
              {city !== "All" && (
                <MapPin
                  size={11}
                  color={isActive ? "rgba(255,255,255,0.85)" : "#6ee7b7"}
                  style={{ flexShrink: 0 }}
                />
              )}
              {city}
            </button>
          );
        })}
      </div>
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
      <div className="mph-skel" style={{ height: 180, borderRadius: 0 }} />
      <div style={{ padding: "13px 14px 14px", display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div className="mph-skel" style={{ height: 11, width: "40%", borderRadius: 6 }} />
          <div className="mph-skel" style={{ height: 11, width: "20%", borderRadius: 6 }} />
        </div>
        <div className="mph-skel" style={{ height: 15, width: "80%", borderRadius: 6 }} />
        <div className="mph-skel" style={{ height: 18, width: "45%", borderRadius: 6 }} />
        <div className="mph-skel" style={{ height: 11, width: "55%", borderRadius: 6 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
          <div className="mph-skel" style={{ height: 36, flex: 1, borderRadius: 10 }} />
          <div className="mph-skel" style={{ height: 36, flex: 1, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRODUCT CARD
═══════════════════════════════════════════════════ */
const ProductCard = memo(function ProductCard({
  product, idx, onCart, onRequest, cartSet, requestedSet, userId,
}) {
  const [imgIdx, setImgIdx] = useState(0);

  const isOwn     = !!userId && Number(product.seller_id) === Number(userId);
  const inCart    = cartSet.has(product.id);
  const requested = requestedSet?.has(product.id);
  const isNew     = product.condition === "new";

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
        boxShadow: "0 4px 32px rgba(21,101,192,0.09), 0 1px 4px rgba(0,0,0,0.04)",
        animation: "fadeUp .4s cubic-bezier(.22,1,.36,1) both",
        animationDelay: `${(idx % 8) * 0.06}s`,
        position: "relative",
      }}
    >
      {/* ── Image ── */}
      <div className="mph-card-img-wrap" style={{
        position: "relative", height: 185,
        background: BLUELT, overflow: "hidden",
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
          background: "linear-gradient(to top,rgba(15,52,96,0.24) 0%,transparent 55%)",
          pointerEvents: "none",
        }} />

        <span style={{
          position: "absolute", top: 10, left: 10,
          padding: "3px 10px", borderRadius: 40,
          fontSize: 10, fontWeight: 700, color: "#fff",
          fontFamily: FONT, letterSpacing: "0.3px",
          background: isNew
            ? "linear-gradient(135deg,#059669,#047857)"
            : "linear-gradient(135deg,#d97706,#b45309)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        }}>
          {isNew ? "Brand New" : "Used"}
        </span>

        <span style={{
          position: "absolute", top: 10, right: 10,
          background: "rgba(15,52,96,0.52)", backdropFilter: "blur(6px)",
          borderRadius: 40, padding: "3px 9px",
          fontSize: 10.5, fontWeight: 600, color: "#fff",
          display: "flex", alignItems: "center", gap: 4, fontFamily: FONT,
        }}>
          <Eye size={11} /> {product.view_count ?? 0}
        </span>

        {images.length > 1 && (
          <div style={{
            position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
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

      {/* ── Body ── */}
      <div className="mph-card-body" style={{
        padding: "13px 14px 8px",
        display: "flex", flexDirection: "column", gap: 5, flex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: BLUE,
            background: BLUELT, borderRadius: 40, padding: "2px 9px",
            fontFamily: FONT, letterSpacing: "0.2px",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "65%",
            border: `1px solid ${BLUEM}`,
          }}>{product.category_name}</span>

          <span style={{
            fontSize: 10.5, color: "#94a3b8", fontFamily: FONT,
            display: "flex", alignItems: "center", gap: 3, fontWeight: 500, flexShrink: 0,
          }}>
            <Clock size={10} /> {timeAgo(product.created_at)}
          </span>
        </div>

        <h3 style={{
          fontSize: 13.5, fontWeight: 700, color: "#0f172a", fontFamily: FONT,
          lineHeight: 1.38, overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{product.title}</h3>

        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 17, fontWeight: 800, color: BLUE,
            fontFamily: FONT_D, letterSpacing: "-0.4px",
          }}>ر.ق{Number(product.price).toLocaleString("en-IN")}</span>
          {product.is_negotiable && (
            <span style={{
              fontSize: 9.5, fontWeight: 700, color: "#d97706",
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 40, padding: "2px 7px",
              display: "flex", alignItems: "center", gap: 3, fontFamily: FONT,
            }}>
              <Tag size={9} /> Nego
            </span>
          )}
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 11.5, color: "#64748b", fontFamily: FONT, fontWeight: 500,
        }}>
          <MapPin size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.city}
          </span>
          <span style={{ margin: "0 14px", color: "#cbd5e1" }}><PhoneForwarded size={14} /> +974 {product.seller_name}</span>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="mph-card-actions" style={{ display: "flex", gap: 7, padding: "8px 14px 14px" }}>
        {isOwn ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            height: 40, background: BLUELT, border: `1.5px solid ${BLUEM}`, borderRadius: 10,
          }}>
            <Lock size={12} color={BLUE} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: BLUE, fontFamily: FONT }}>Your Product</span>
          </div>
        ) : (
          <>
            <button className="mph-btn-cart" onClick={() => onCart(product)} style={{
              flex: 1, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: FONT,
              border: "none", cursor: "pointer",
              background: inCart
                ? "linear-gradient(135deg,#059669,#047857)"
                : `linear-gradient(135deg,${BLUE},${BLUE2})`,
              color: "#fff",
              boxShadow: inCart
                ? "0 3px 12px rgba(5,150,105,0.28)"
                : "0 3px 12px rgba(21,101,192,0.28)",
            }}>
              {inCart ? <CheckCircle size={13} /> : <ShoppingCart size={13} />}
              <span>{inCart ? "Added" : "Cart"}</span>
            </button>

            <button className="mph-btn-req" onClick={() => onRequest(product)} disabled={requested} style={{
              flex: 1, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: FONT,
              border: `1.5px solid ${BLUEM}`,
              background: requested ? BLUELT : "transparent",
              color: BLUE, cursor: requested ? "not-allowed" : "pointer",
              opacity: requested ? 0.75 : 1,
            }}>
              <MessageCircle size={13} />
              <span>{requested ? "Requested" : "Request"}</span>
            </button>
          </>
        )}
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
          <button className="mph-pg-btn" style={btnBase} onClick={() => onChange(totalPages)}>
            {totalPages}
          </button>
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
function SidebarContent({ totalCount, cartSize, categories, cities, activeCity, setActiveCity }) {
  return (
    <>
      {/* Stats card */}
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
            { label: "Categories", val: categories.length, dot: "#3b82f6" },
            { label: "Cities",     val: cities.length,     dot: "#059669" },
            { label: "In Cart",    val: cartSize,          dot: "#16a34a" },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#475569", fontFamily: FONT, fontWeight: 500 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: row.dot, flexShrink: 0 }} />
                {row.label}
              </div>
              <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{row.val}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 6, background: "#e0ecfb", borderRadius: 99, overflow: "hidden", marginTop: 14 }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: "linear-gradient(90deg, #1565c0, #16a34a)",
            width: cartSize > 0 ? "60%" : "10%",
            transition: "width 0.8s cubic-bezier(.22,1,.36,1)",
          }} />
        </div>
      </div>

      {/* Location quick-filter card */}
      {cities.length > 0 && (
        <div style={s.infoCard}>
          <div style={s.infoHead}>
            <div style={{ fontSize: 20 }}>📍</div>
            <span style={s.infoTitle}>Browse by City</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {["All", ...cities].map(city => {
              const isActive = activeCity === city;
              return (
                <button
                  key={city}
                  onClick={() => setActiveCity(city)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 10, border: "none",
                    background: isActive ? "#f0fdf4" : "transparent",
                    cursor: "pointer", fontFamily: FONT,
                    transition: "background .15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: isActive ? "#059669" : "#d1fae5",
                      transition: "background .15s",
                    }} />
                    <span style={{
                      fontSize: 13, fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#065f46" : "#475569",
                    }}>
                      {city}
                    </span>
                  </div>
                  {isActive && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: "#059669",
                      background: "#dcfce7", borderRadius: 40, padding: "1px 7px",
                    }}>
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips card */}
      <div style={s.infoCard}>
        <div style={s.infoHead}>
          <div style={{ fontSize: 20 }}>💡</div>
          <span style={s.infoTitle}>Buying Tips</span>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Use Request to contact the seller directly about an item.",
            "Add items to Cart to compare prices before deciding.",
            "Check the condition badge — 'Brand New' vs 'Used' affects value.",
          ].map((tip, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#475569", fontFamily: FONT, lineHeight: 1.55 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: BLUE, marginTop: 5, flexShrink: 0, opacity: 0.7 }} />
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
  const [activeCity,     setActiveCity]     = useState("All");
  const [cartSet,        setCartSet]        = useState(new Set());
  const [requestedSet,   setRequestedSet]   = useState(new Set());
  const { toast, add }                      = useToast();

  const userId = Number(localStorage.getItem("user_id") ?? localStorage.getItem("userId") ?? 0) || 0;

  /* Derived lists — categories and cities from loaded products */
  const categories = Array.isArray(products)
    ? [...new Set(products.map(p => p?.category_name).filter(Boolean))].sort()
    : [];

  const cities = Array.isArray(products)
    ? [...new Set(products.map(p => p?.city).filter(Boolean))].sort()
    : [];

  /* Reset city filter when category changes and vice versa */
  const handleCategoryChange = useCallback((cat) => {
    setActiveCategory(cat);
  }, []);

  const handleCityChange = useCallback((city) => {
    setActiveCity(city);
  }, []);

  const filtered = Array.isArray(products)
    ? products.filter(p => {
        if (!p) return false;
        const q = search.toLowerCase();
        const matchSearch = !search
          || p.title?.toLowerCase().includes(q)
          || p.category_name?.toLowerCase().includes(q)
          || p.city?.toLowerCase().includes(q);
        const matchCat  = activeCategory === "All" || p.category_name === activeCategory;
        const matchCity = activeCity === "All"     || p.city === activeCity;
        return matchSearch && matchCat && matchCity;
      })
    : [];

  /* ── Loaders ── */
  const loadProducts = useCallback(async (pageNumber) => {
    setLoading(true); setError(null);
    try {
      const res  = await fetchProducts({ page: pageNumber, limit: 12 });
      const data = res?.data || res || [];
      setProducts(Array.isArray(data) ? data : []);
      setTotalPages(res?.total_pages || 1);
      setTotalCount(res?.count || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load products. Please try again.");
    } finally { setLoading(false); }
  }, []);

  const loadCart = useCallback(async () => {
    try {
      const res = await fetchCart();
      setCartSet(new Set(res?.data?.data || res?.data || []));
    } catch { setCartSet(new Set()); }
  }, []);

  const loadRequested = useCallback(async () => {
    try {
      const res = await fetchRequestedProducts();
      const raw = res?.data?.data ?? res?.data ?? res ?? [];
      const arr = Array.isArray(raw) ? raw : [];
      const ids = arr.map(item => {
        if (typeof item === "number") return item;
        if (typeof item === "string") return Number(item);
        return item?.product_id ?? item?.product?.id
          ?? (typeof item?.product === "number" ? item.product : undefined)
          ?? item?.id;
      }).filter(id => id != null);
      setRequestedSet(new Set(ids));
    } catch { setRequestedSet(new Set()); }
  }, []);

  useEffect(() => { loadCart(); loadRequested(); }, [loadCart, loadRequested]);
  useEffect(() => { loadProducts(page); }, [page, loadProducts]);

  /* ── Handlers ── */
  const handleCart = useCallback(async (product) => {
    if (Number(product.seller_id) === userId) { add("You can't add your own product", "error"); return; }
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

  const handleRequest = useCallback(async (product) => {
    if (Number(product.seller_id) === userId) { add("You can't request your own product", "error"); return; }
    if (requestedSet?.has(product.id)) return;
    setRequestedSet(prev => new Set(prev).add(product.id));
    try {
      const res = await requestProduct(product.id);
      add(res?.data?.already_requested ? "Already requested ✓" : "Request sent ✓");
    } catch {
      setRequestedSet(prev => { const next = new Set(prev); next.delete(product.id); return next; });
      add("Request failed", "error");
    }
  }, [requestedSet, add, userId]);

  const handlePageChange = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <MarketplaceLayout>
      <InjectStyles />
      <ToastPill toast={toast} />

      <div style={{ minHeight: "100vh", background: "#f0f6ff", fontFamily: FONT }}>

        {/* ── HERO ── */}
        <HeroBanner />

        {/* ── Mobile top ad ── */}
        <div className="mph-top-ad" style={{ display: "none", padding: "14px 14px 0", background: "#f0f6ff" }}>
          <AdSlot variant="banner" />
        </div>

        {/* ── BODY ── */}
        <div className="mph-wrap" style={{
          maxWidth: 1240, margin: "0 auto",
          padding: "clamp(14px,3vw,28px) clamp(12px,3vw,28px)",
        }}>

          <div className="mph-desk-ad" style={{ marginBottom: 20 }}>
            <AdSlot variant="banner" />
          </div>

          {/* Search */}
          <SearchBar value={search} onChange={setSearch} />

          {/* Categories */}
          {categories.length > 0 && (
            <CategoryBar
              categories={categories}
              active={activeCategory}
              setActive={handleCategoryChange}
            />
          )}

          {/* Location filter — sits directly below categories */}
          {!loading && cities.length > 0 && (
            <LocationBar
              cities={cities}
              activeCity={activeCity}
              setActiveCity={handleCityChange}
            />
          )}

          {/* Section header */}
          <div className="mph-sec-head" style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            marginBottom: 16, flexWrap: "wrap", gap: 10,
          }}>
            <div>
              <h2 style={{
                fontFamily: FONT_D,
                fontSize: "clamp(17px,3vw,22px)",
                fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em",
              }}>
                {activeCategory === "All" ? "All Listings" : activeCategory}
                {activeCity !== "All" && (
                  <span style={{
                    fontSize: "clamp(13px,2vw,16px)", fontWeight: 600,
                    color: "#059669", marginLeft: 8, fontFamily: FONT,
                  }}>
                    · {activeCity}
                  </span>
                )}
              </h2>
              <p style={{ fontSize: 13, color: "#94a3b8", fontFamily: FONT, marginTop: 3 }}>
                {loading
                  ? "Loading listings…"
                  : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}${totalCount > filtered.length ? ` of ${totalCount}` : ""}`
                }
              </p>
            </div>

            {/* Active filter pills summary */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              {activeCity !== "All" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#f0fdf4", color: "#065f46",
                  border: "1.5px solid #bbf7d0", borderRadius: 40,
                  padding: "6px 12px", fontSize: 12.5, fontWeight: 700,
                  fontFamily: FONT, animation: "popIn .3s ease both",
                }}>
                  <MapPin size={12} color="#059669" />
                  {activeCity}
                  <button onClick={() => setActiveCity("All")} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#059669", display: "flex", padding: 0, marginLeft: 2,
                  }}>
                    <X size={12} />
                  </button>
                </div>
              )}
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
          </div>

          {/* Two-column layout */}
          <div className="mph-layout" style={{
            display: "grid", gridTemplateColumns: "1fr 220px",
            gap: 22, alignItems: "flex-start",
          }}>

            {/* ── PRODUCT GRID ── */}
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
                    background: `linear-gradient(135deg,${BLUE},${BLUE2})`,
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
                        <div style={{ fontSize: 56, marginBottom: 16, animation: "floatOrb 4s ease-in-out infinite" }}>🔍</div>
                        <h3 style={{ fontFamily: FONT_D, fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 8, letterSpacing: "-0.03em" }}>
                          No listings found
                        </h3>
                        <p style={{ fontSize: 13.5, color: "#94a3b8", fontFamily: FONT }}>
                          {activeCity !== "All"
                            ? `No listings in ${activeCity} — try another city`
                            : "Try a different search term or category"
                          }
                        </p>
                        {activeCity !== "All" && (
                          <button onClick={() => setActiveCity("All")} style={{
                            marginTop: 14, padding: "9px 22px", borderRadius: 40,
                            background: "#059669", color: "#fff", border: "none",
                            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
                          }}>
                            Show all cities
                          </button>
                        )}
                      </div>
                    )
                    : filtered.map((p, i) => (
                      <ProductCard
                        key={p.id} product={p} idx={i}
                        onCart={handleCart} onRequest={handleRequest}
                        cartSet={cartSet} requestedSet={requestedSet}
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

            {/* ── SIDEBAR ── */}
            <aside className="mph-sidebar" style={{
              display: "flex", flexDirection: "column", gap: 16,
              flexShrink: 0,
              animation: "fadeUp 0.45s ease both", animationDelay: "0.2s",
            }}>
              <SidebarContent
                totalCount={totalCount}
                cartSize={cartSet.size}
                categories={categories}
                cities={cities}
                activeCity={activeCity}
                setActiveCity={handleCityChange}
              />
            </aside>

          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}

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