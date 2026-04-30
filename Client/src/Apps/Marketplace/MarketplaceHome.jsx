/**
 * MarketplaceHome — Production-Optimised v3 (Fixed)
 *
 * Changes from previous version:
 *  - All emojis replaced with lucide-react icons (Store, MapPin, Lightbulb, Search)
 *  - Pagination Prev/Next buttons enhanced: prominent shadow, disabled-state bg, larger hit area
 *  - Store + Lightbulb added to lucide-react import
 */

import {
  useEffect, useState, useRef, useCallback,
  useMemo, useReducer, memo,
} from "react";
import {
  fetchProducts, addToCart, removeFromCart,
  requestProduct, fetchRequestedProducts, fetchCart,
} from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";
import {
  ShoppingCart, MessageCircle, Eye, MapPin, Tag,
  ChevronLeft, ChevronRight, Clock, Search, X,
  CheckCircle, Lock, PhoneForwarded, User, Hash,
  BadgeCheck, Package, ExternalLink, Navigation,
  Loader, Heart, Zap, Star, Store, Lightbulb,
} from "lucide-react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const FONT      = "'DM Sans', 'Plus Jakarta Sans', sans-serif";
const FONT_D    = "'Playfair Display', 'Fraunces', Georgia, serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const C = {
  primary:   "#1a237e",
  primary2:  "#283593",
  primaryLt: "#e8eaf6",
  primaryM:  "#9fa8da",
  accent:    "#ff6f00",
  accentLt:  "#fff8e1",
  success:   "#00897b",
  successLt: "#e0f2f1",
  bg:        "#f5f7ff",
  surface:   "#ffffff",
  border:    "#e0e4f0",
  muted:     "#8c93b5",
  text:      "#0d1033",
  textSub:   "#4a5280",
};

/* ─────────────────────────────────────────────
   SHARED INTERSECTION OBSERVER POOL
───────────────────────────────────────────── */
const imgObserverCallbacks = new Map();
let sharedImgObserver = null;

function getImgObserver() {
  if (!sharedImgObserver && typeof IntersectionObserver !== "undefined") {
    sharedImgObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const cb = imgObserverCallbacks.get(entry.target);
            if (cb) {
              cb();
              imgObserverCallbacks.delete(entry.target);
              sharedImgObserver.unobserve(entry.target);
            }
          }
        });
      },
      { rootMargin: "400px" }
    );
  }
  return sharedImgObserver;
}

/* ─────────────────────────────────────────────
   CSS — injected once
───────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Playfair+Display:wght@700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

  @keyframes fadeUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes shimmer  { 0%{background-position:-800px 0} 100%{background-position:800px 0} }
  @keyframes floatOrb { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(3deg)} }
  @keyframes pulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.4)} }
  @keyframes popIn    { 0%{opacity:0;transform:scale(.8)} 70%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes modalIn  { from{opacity:0;transform:scale(.92) translateY(24px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes bdropIn  { from{opacity:0} to{opacity:1} }
  @keyframes imgSlide { from{opacity:0;transform:translateX(10px)} to{opacity:1;transform:none} }
  @keyframes slideDown{ from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:none} }
  @keyframes countUp  { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }
  @keyframes waveFlow { to{transform:translateX(-50%)} }

  /* ── SKELETON ── */
  .mh-skel {
    background: linear-gradient(90deg, #eef0f8 25%, #e0e4f5 50%, #eef0f8 75%);
    background-size: 800px 100%;
    animation: shimmer 1.6s linear infinite;
    border-radius: 8px;
  }

  /* ── CARD ── */
  .mh-card {
    cursor: pointer;
    transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s cubic-bezier(.22,1,.36,1), border-color .25s !important;
    position: relative;
  }
  .mh-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 21px;
    background: linear-gradient(135deg, rgba(26,35,126,.12), rgba(255,111,0,.08));
    opacity: 0;
    transition: opacity .35s;
    z-index: 0;
    pointer-events: none;
  }
  .mh-card:hover { transform: translateY(-8px) !important; box-shadow: 0 28px 56px rgba(26,35,126,.18), 0 6px 16px rgba(0,0,0,.06) !important; border-color: #9fa8da !important; }
  .mh-card:hover::before { opacity: 1; }
  .mh-card:hover .mh-card-img { transform: scale(1.08) !important; }
  .mh-card-img { transition: transform .45s cubic-bezier(.22,1,.36,1) !important; }

  /* ── BUTTONS ── */
  .mh-btn-primary {
    transition: background .18s, transform .18s, box-shadow .18s, filter .18s !important;
  }
  .mh-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px) !important;
    box-shadow: 0 10px 26px rgba(26,35,126,.38) !important;
    filter: brightness(1.07) !important;
  }
  .mh-btn-outline {
    transition: background .18s, color .18s, border-color .18s, transform .18s !important;
  }
  .mh-btn-outline:hover:not(:disabled) {
    background: #1a237e !important;
    color: #fff !important;
    border-color: #1a237e !important;
    transform: translateY(-2px) !important;
  }

  /* ── CHIPS ── */
  .mh-chip { transition: background .18s, color .18s, border-color .18s, transform .15s, box-shadow .18s !important; }
  .mh-chip:hover:not(.mh-chip-on) { background: #e8eaf6 !important; color: #1a237e !important; border-color: #9fa8da !important; transform: translateY(-1px) !important; }
  .mh-chip-on { background: #1a237e !important; color: #fff !important; border-color: #1a237e !important; box-shadow: 0 4px 14px rgba(26,35,126,.32) !important; }

  .mh-city-chip { transition: all .18s !important; }
  .mh-city-chip:hover:not(.mh-city-on) { background: #e0f2f1 !important; color: #00897b !important; border-color: #80cbc4 !important; transform: translateY(-1px) !important; }
  .mh-city-on { background: #00897b !important; color: #fff !important; border-color: #00897b !important; box-shadow: 0 4px 14px rgba(0,137,123,.30) !important; }

  /* ── PAGINATION ── */
  .mh-pg-btn {
    transition: background .18s, color .18s, border-color .18s, transform .18s, box-shadow .18s !important;
  }
  .mh-pg-btn:hover:not(:disabled):not(.mh-pg-on) {
    background: #e8eaf6 !important;
    color: #1a237e !important;
    border-color: #9fa8da !important;
    transform: scale(1.08) !important;
  }
  .mh-pg-on {
    background: #1a237e !important;
    color: #fff !important;
    border-color: #1a237e !important;
    box-shadow: 0 4px 14px rgba(26,35,126,.32) !important;
    font-weight: 800 !important;
  }
  .mh-pg-btn:disabled { opacity: .4 !important; cursor: not-allowed !important; }

  /* ── PREV / NEXT specific ── */
  .mh-pg-nav:not(:disabled):hover {
    background: #1a237e !important;
    color: #fff !important;
    border-color: #1a237e !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 22px rgba(26,35,126,.30) !important;
  }

  /* ── TOAST ── */
  .mh-toast {
    position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(20px);
    display: inline-flex; align-items: center; gap: 9px;
    background: #0d1033; color: #fff;
    padding: 12px 24px; border-radius: 999px;
    font-family: ${FONT}; font-size: 13px; font-weight: 600;
    box-shadow: 0 10px 36px rgba(0,0,0,.28);
    z-index: 9999999; opacity: 0; pointer-events: none;
    transition: all .28s cubic-bezier(.22,1,.36,1); white-space: nowrap;
    border: 1px solid rgba(255,255,255,.10);
  }
  .mh-toast.on { opacity: 1; transform: translateX(-50%) translateY(0); }
  .mh-toast-err { background: #7f1d1d !important; }

  /* ── MODAL ── */
  .mh-backdrop {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999;
    background: rgba(8,12,42,.78); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    overflow-y: auto; -webkit-overflow-scrolling: touch;
    display: flex; align-items: flex-start; justify-content: center; padding: 40px 20px;
    animation: bdropIn .22s ease both;
  }
  .mh-modal {
    position: relative; background: #fff; border-radius: 24px;
    width: min(900px, calc(100vw - 40px)); display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 40px 100px rgba(8,12,42,.36), 0 0 0 1px rgba(26,35,126,.08);
    animation: modalIn .34s cubic-bezier(.22,1,.36,1) both; flex-shrink: 0;
  }
  .mh-modal-close {
    width: 34px; height: 34px; border-radius: 50%; background: #f0f2ff;
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .18s, transform .18s; color: #4a5280; flex-shrink: 0;
  }
  .mh-modal-close:hover { background: #e0e4f0; transform: scale(1.12) rotate(90deg); }
  .mh-img-nav {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer;
    background: rgba(255,255,255,.94); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 18px rgba(0,0,0,.2); color: #1a237e;
    transition: background .15s, transform .15s, box-shadow .15s; z-index: 3;
  }
  .mh-img-nav:hover { background: #fff; transform: translateY(-50%) scale(1.16); box-shadow: 0 6px 22px rgba(26,35,126,.3); }
  .mh-thumb {
    width: 52px; height: 52px; border-radius: 10px; overflow: hidden; flex-shrink: 0;
    border: 2.5px solid transparent; cursor: pointer;
    transition: border-color .15s, transform .15s, box-shadow .15s;
  }
  .mh-thumb.on { border-color: #1a237e; transform: scale(1.08); box-shadow: 0 4px 14px rgba(26,35,126,.3); }
  .mh-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* ── WISHLIST BTN ── */
  .mh-wish-btn {
    position: absolute; top: 10px; right: 10px; z-index: 5;
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba(255,255,255,.9); backdrop-filter: blur(8px);
    border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background .18s, transform .18s, box-shadow .18s; color: #94a3b8;
    box-shadow: 0 2px 10px rgba(0,0,0,.14);
  }
  .mh-wish-btn:hover { background: #fff; transform: scale(1.18); box-shadow: 0 4px 16px rgba(239,68,68,.28); color: #ef4444; }
  .mh-wish-btn.on { color: #ef4444; background: #fff5f5; }

  /* ── SEARCH ── */
  .mh-search-wrap:focus-within .mh-search-box {
    border-color: #9fa8da !important;
    box-shadow: 0 0 0 3.5px rgba(26,35,126,.10), 0 4px 18px rgba(26,35,126,.08) !important;
    background: #fff !important;
  }

  /* ── AD SLOT ── */
  .mh-ad { transition: box-shadow .18s, transform .18s !important; }
  .mh-ad:hover { box-shadow: 0 8px 30px rgba(26,35,126,.12) !important; transform: translateY(-2px) !important; }

  /* ── LOCATE BTN ── */
  .mh-locate { transition: background .2s, transform .2s, box-shadow .2s !important; }
  .mh-locate:hover:not(:disabled) { transform: translateY(-1px) !important; box-shadow: 0 6px 18px rgba(0,137,123,.32) !important; }
  .mh-locate:disabled { opacity: .65 !important; cursor: not-allowed !important; }

  /* ── SELLER INFO ── */
  .mh-seller-row { transition: background .15s !important; }
  .mh-seller-row:hover { background: rgba(255,255,255,.95) !important; }
  .mh-info-item { transition: border-color .15s, background .15s !important; }
  .mh-info-item:hover { background: #f0f4ff !important; border-color: #9fa8da !important; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1100px) {
    .mh-layout { grid-template-columns: 1fr 200px !important; }
  }
  @media (max-width: 860px) {
    .mh-layout { grid-template-columns: 1fr !important; }
    .mh-sidebar { display: none !important; }
    .mh-top-ad { display: flex !important; }
    .mh-desk-ad { display: none !important; }
    .mh-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
    .mh-backdrop { padding: 20px 12px !important; }
    .mh-modal { border-radius: 18px !important; }
    .mh-modal-body { grid-template-columns: 1fr !important; height: auto !important; }
    .mh-modal-left { height: 260px !important; }
    .mh-modal-right { height: auto !important; overflow-y: visible !important; padding: 14px 16px 16px !important; }
  }
  @media (max-width: 560px) {
    .mh-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
    .mh-backdrop { padding: 14px 8px !important; }
    .mh-modal { border-radius: 16px !important; width: calc(100vw - 16px) !important; }
    .mh-modal-left { height: 220px !important; }
    .mh-pg-wrap { gap: 5px !important; }
    .mh-pg-btn { width: 34px !important; height: 34px !important; font-size: 12px !important; }
    .mh-pg-nav { width: auto !important; padding: 0 10px !important; }
  }
  @media (max-width: 380px) {
    .mh-grid { grid-template-columns: 1fr !important; }
    .mh-modal-left { height: 190px !important; }
  }
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === "undefined") return;
  cssInjected = true;
  const el = document.createElement("style");
  el.id = "mh-styles-v3";
  el.textContent = CSS;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────────
   PAGINATION CONSTANTS
───────────────────────────────────────────── */
const PAGE_SIZE = 12;

/* ─────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────── */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function useToast() {
  const [toast, setToast] = useState({ on: false, msg: "", error: false });
  const timerRef = useRef(null);
  const add = useCallback((msg, type = "success") => {
    clearTimeout(timerRef.current);
    setToast({ on: true, msg, error: type === "error" });
    timerRef.current = setTimeout(() => setToast(p => ({ ...p, on: false })), 3000);
  }, []);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return { toast, add };
}

function useDeviceLocation() {
  const [state, setState] = useState({ city: null, address: null, loading: false, error: null });
  const detect = useCallback(() => {
    if (!navigator.geolocation) { setState(p => ({ ...p, error: "Geolocation not supported" })); return; }
    setState(p => ({ ...p, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.county || addr.state || null;
          setState({ city, address: data.display_name, loading: false, error: null });
        } catch { setState(p => ({ ...p, loading: false, error: "Geocode failed" })); }
      },
      (err) => {
        const msgs = { 1: "Permission denied", 2: "Location unavailable", 3: "Request timed out" };
        setState(p => ({ ...p, loading: false, error: msgs[err.code] || "Location error" }));
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);
  return { ...state, detect };
}

/* ─────────────────────────────────────────────
   LISTING REDUCER
───────────────────────────────────────────── */
const INIT_STATE = {
  products: [], allFetched: false, loading: true, error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_START":   return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS": return { ...state, loading: false, products: action.payload, allFetched: true, error: null };
    case "FETCH_ERROR":   return { ...state, loading: false, error: action.payload };
    default: return state;
  }
}

/* ─────────────────────────────────────────────
   LAZY IMAGE — shared observer pool
───────────────────────────────────────────── */
const LazyImage = memo(function LazyImage({ src, alt, style, className, onError }) {
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = getImgObserver();
    if (!observer) { setVisible(true); return; }
    imgObserverCallbacks.set(el, () => setVisible(true));
    observer.observe(el);
    return () => { imgObserverCallbacks.delete(el); observer.unobserve(el); };
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%", position: "relative" }}>
      {!loaded && <div className="mh-skel" style={{ position: "absolute", inset: 0, borderRadius: 0 }} />}
      {visible && (
        <img
          src={src} alt={alt} className={className}
          loading="lazy" decoding="async"
          style={{ ...style, opacity: loaded ? 1 : 0, transition: "opacity .3s ease" }}
          onLoad={() => setLoaded(true)}
          onError={e => { setLoaded(true); onError?.(e); }}
        />
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────
   GOOGLE AD SLOT
───────────────────────────────────────────── */
const AD_CONFIGS = {
  leaderboard: { label: "728 × 90 — Leaderboard",  h: 90,  note: "Replace with: <ins class='adsbygoogle' style='display:block' data-ad-client='ca-pub-XXXX' data-ad-slot='XXXX' data-ad-format='auto'></ins>" },
  banner:      { label: "468 × 60 — Banner",        h: 60,  note: "data-ad-format='banner'" },
  rectangle:   { label: "300 × 250 — Rectangle",    h: 250, note: "data-ad-format='rectangle'" },
  inline:      { label: "Responsive — Inline",       h: 90,  note: "data-ad-format='fluid'" },
};

function AdSlot({ variant = "leaderboard", style: extra = {} }) {
  const cfg = AD_CONFIGS[variant] || AD_CONFIGS.leaderboard;
  return (
    <div className="mh-ad" style={{
      width: "100%", minHeight: cfg.h,
      background: "repeating-linear-gradient(45deg,#f5f7ff,#f5f7ff 8px,#eef0f8 8px,#eef0f8 16px)",
      border: "1.5px dashed #c7cde8", borderRadius: 12,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
      position: "relative", overflow: "hidden",
      ...extra,
    }}>
      <span style={{ fontSize: 9, fontWeight: 800, color: "#a0aabf", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: FONT }}>
        Advertisement · Google AdSense
      </span>
      <span style={{ fontSize: 11, color: "#c0c8e0", fontFamily: FONT_MONO, fontWeight: 600 }}>{cfg.label}</span>
      <span style={{ fontSize: 9, color: "#d0d5e8", fontFamily: FONT_MONO, textAlign: "center", padding: "0 12px", lineHeight: 1.5 }}>{cfg.note}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
function ToastPill({ toast }) {
  return (
    <div className={`mh-toast${toast.on ? " on" : ""}${toast.error ? " mh-toast-err" : ""}`}>
      <span style={{ display: "flex", flexShrink: 0, color: toast.error ? "#fca5a5" : "#34d399" }}>
        {toast.error ? <X size={14} /> : <CheckCircle size={14} />}
      </span>
      {toast.msg}
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO BANNER
───────────────────────────────────────────── */
function HeroBanner() {
  return (
    <div style={{ position: "relative", background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primary2} 45%, #1b5e20 100%)`, overflow: "hidden", minHeight: 200 }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1.5px,transparent 1.5px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />
      {[
        { w: 320, h: 320, top: -100, right: -80, delay: 0 },
        { w: 160, h: 160, bottom: -20, left: 40,  delay: 2 },
        { w: 100, h: 100, top: 30,    left: "42%", delay: 4 },
      ].map((o, i) => (
        <div key={i} style={{
          position: "absolute", width: o.w, height: o.h, top: o.top, right: o.right, bottom: o.bottom, left: o.left,
          borderRadius: "50%", background: "rgba(255,255,255,.05)",
          animation: `floatOrb ${8 + i * 2.5}s ease-in-out infinite`, animationDelay: `${o.delay}s`, pointerEvents: "none",
        }} />
      ))}
      <svg style={{ position: "absolute", bottom: 0, left: 0, width: "200%", height: 56, zIndex: 1, pointerEvents: "none" }} viewBox="0 0 1440 56" preserveAspectRatio="none">
        <path style={{ animation: "waveFlow 12s linear infinite" }} d="M0,28 C240,52 480,4 720,28 C960,52 1200,4 1440,28 C1680,52 1920,4 2160,28 L2160,56 L0,56 Z" fill={C.bg} />
      </svg>
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", padding: "clamp(32px,5vw,56px) clamp(16px,4vw,44px) clamp(48px,7vw,72px)" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 40, padding: "5px 14px", marginBottom: 14, backdropFilter: "blur(8px)", animation: "fadeIn .4s ease both" }}>
          <span style={{ width: 7, height: 7, background: "#4ade80", borderRadius: "50%", animation: "pulse 1.8s infinite", flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.88)", fontFamily: FONT }}>Live Marketplace · Kerala, India</span>
        </div>
        <h1 style={{ fontFamily: FONT_D, fontSize: "clamp(28px,5.5vw,52px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.12, marginBottom: 10, animation: "fadeUp .5s ease both", animationDelay: "0.08s" }}>
          Find Deals That{" "}
          <span style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Spark Joy</span>
        </h1>
        <p style={{ fontSize: "clamp(13px,2vw,15px)", color: "rgba(255,255,255,.68)", fontFamily: FONT, lineHeight: 1.65, animation: "fadeUp .5s ease both", animationDelay: "0.16s" }}>
          Buy &amp; sell locally — electronics, furniture, fashion &amp; more near you
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SEARCH BAR
───────────────────────────────────────────── */
function SearchBar({ value, onChange }) {
  return (
    <div className="mh-search-wrap" style={{ marginBottom: 14 }}>
      <div className="mh-search-box" style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#fafcff", border: `1.5px solid ${C.border}`,
        borderRadius: 14, padding: "0 16px", height: 52,
        boxShadow: "0 2px 12px rgba(26,35,126,.06)", transition: "all .2s",
      }}>
        <Search size={17} color={C.muted} style={{ flexShrink: 0 }} />
        <input
          type="text" placeholder="Search products, brands, locations…"
          value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: FONT, color: C.text, background: "transparent" }}
        />
        {value && (
          <button onClick={() => onChange("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", padding: 3, borderRadius: 6 }}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CATEGORY CHIPS
───────────────────────────────────────────── */
function CategoryBar({ categories, active, setActive }) {
  return (
    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
      {["All", ...categories].map(c => (
        <button key={c} onClick={() => setActive(c)}
          className={`mh-chip${active === c ? " mh-chip-on" : ""}`}
          style={{
            padding: "7px 16px", borderRadius: 40, fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
            cursor: "pointer", whiteSpace: "nowrap", border: "1.5px solid",
            background: active === c ? C.primary : "#fff",
            color: active === c ? "#fff" : C.textSub,
            borderColor: active === c ? C.primary : C.border,
          }}>
          {c}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOCATION BAR
───────────────────────────────────────────── */
function LocationBar({ cities, activeCity, setActiveCity, deviceLocation }) {
  if (!cities?.length) return null;
  const { city: detected, address, loading, error, detect } = deviceLocation;
  return (
    <div style={{ marginBottom: 18, animation: "slideDown .22s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.successLt, border: "1.5px solid #80cbc4", borderRadius: 40, padding: "4px 12px", flexShrink: 0 }}>
          <MapPin size={12} color={C.success} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 800, color: "#004d40", fontFamily: FONT, letterSpacing: "0.06em", textTransform: "uppercase" }}>Filter by City</span>
          {activeCity !== "All" && <span style={{ fontSize: 10, fontWeight: 700, background: C.success, color: "#fff", borderRadius: 40, padding: "1px 7px", marginLeft: 2 }}>Active</span>}
        </div>
        <button className="mh-locate" onClick={detect} disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 40,
            border: "1.5px solid #80cbc4", background: detected ? "#e0f2f1" : C.successLt,
            color: detected ? "#004d40" : C.success, fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer",
          }}>
          {loading
            ? <><Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> Detecting…</>
            : detected ? <><Navigation size={12} /> {detected}</> : <><Navigation size={12} /> Use My Location</>
          }
        </button>
        {activeCity !== "All" && (
          <button onClick={() => setActiveCity("All")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: C.success, background: "none", border: "none", cursor: "pointer", fontFamily: FONT }}>
            <X size={11} /> Clear
          </button>
        )}
      </div>
      {address && <div style={{ fontSize: 10.5, color: C.muted, fontFamily: FONT, marginBottom: 7, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={9} color="#c0c8e0" />{address.slice(0, 80)}…</div>}
      {error && <div style={{ fontSize: 11, color: "#dc2626", fontFamily: FONT, marginBottom: 7, display: "flex", alignItems: "center", gap: 4 }}><X size={10} /> {error}</div>}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {["All", ...cities].map(city => {
          const isOn  = activeCity === city;
          const isNear = detected && city !== "All" && city.toLowerCase().includes(detected.toLowerCase());
          return (
            <button key={city} onClick={() => setActiveCity(city)}
              className={`mh-city-chip${isOn ? " mh-city-on" : ""}`}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 40,
                fontSize: 12.5, fontWeight: 700, fontFamily: FONT, cursor: "pointer", whiteSpace: "nowrap", border: "1.5px solid",
                background: isOn ? C.success : isNear ? C.successLt : "#fff",
                color: isOn ? "#fff" : isNear ? "#004d40" : C.textSub,
                borderColor: isOn ? C.success : isNear ? "#80cbc4" : "#c8f5ef",
              }}>
              {city !== "All" && <MapPin size={11} color={isOn ? "rgba(255,255,255,.8)" : "#80cbc4"} />}
              {city}
              {isNear && !isOn && <span style={{ fontSize: 9, fontWeight: 800, background: C.success, color: "#fff", borderRadius: 40, padding: "0 5px" }}>Near</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGINATION  — enhanced Prev / Next
───────────────────────────────────────────── */
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;

  const getRange = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const range = [];
    if (page <= 4) {
      range.push(1, 2, 3, 4, 5, "…", totalPages);
    } else if (page >= totalPages - 3) {
      range.push(1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      range.push(1, "…", page - 1, page, page + 1, "…", totalPages);
    }
    return range;
  };

  const navBase = {
    display: "flex", alignItems: "center", gap: 7,
    height: 44, padding: "0 20px", borderRadius: 11,
    fontSize: 13.5, fontWeight: 700, fontFamily: FONT,
    cursor: "pointer", border: `1.5px solid ${C.border}`,
    background: "#fff", color: C.primary,
    boxShadow: "0 2px 10px rgba(26,35,126,.10)",
    transition: "all .2s",
  };

  return (
    <div className="mh-pg-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 28, flexWrap: "wrap" }}>

      {/* ── Prev ── */}
      <button
        className="mh-pg-btn mh-pg-nav"
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        style={{ ...navBase, ...(page === 1 ? { opacity: 0.38, cursor: "not-allowed", boxShadow: "none", background: "#f5f7ff" } : {}) }}
      >
        <ChevronLeft size={17} />
        Previous
      </button>

      {/* ── Page numbers ── */}
      {getRange().map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} style={{ width: 38, height: 44, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14, fontFamily: FONT }}>…</span>
        ) : (
          <button
            key={p}
            className={`mh-pg-btn${page === p ? " mh-pg-on" : ""}`}
            onClick={() => onPage(p)}
            style={{
              width: 44, height: 44, borderRadius: 11,
              border: `1.5px solid ${page === p ? C.primary : C.border}`,
              background: page === p ? C.primary : "#fff",
              color: page === p ? "#fff" : C.textSub,
              fontSize: 13.5, fontWeight: 700, fontFamily: FONT, cursor: "pointer",
              boxShadow: page === p ? "0 4px 14px rgba(26,35,126,.30)" : "none",
            }}>
            {p}
          </button>
        )
      )}

      {/* ── Next ── */}
      <button
        className="mh-pg-btn mh-pg-nav"
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        style={{ ...navBase, ...(page === totalPages ? { opacity: 0.38, cursor: "not-allowed", boxShadow: "none", background: "#f5f7ff" } : {}) }}
      >
        Next
        <ChevronRight size={17} />
      </button>

      {/* ── Page info ── */}
      <span style={{ fontSize: 12, color: C.muted, fontFamily: FONT, marginLeft: 4, whiteSpace: "nowrap" }}>
        Page {page} of {totalPages}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: `1.5px solid ${C.border}` }}>
      <div className="mh-skel" style={{ height: 190, borderRadius: 0 }} />
      <div style={{ padding: "14px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {[["38%", "22%"], ["80%"], ["44%", "20%"], ["60%"]].map(([a, b], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div className="mh-skel" style={{ height: i === 2 ? 20 : i === 0 ? 11 : 14, width: a, borderRadius: 6 }} />
            {b && <div className="mh-skel" style={{ height: 11, width: b, borderRadius: 6 }} />}
          </div>
        ))}
        <div style={{ display: "flex", gap: 7, marginTop: 2 }}>
          <div className="mh-skel" style={{ height: 38, flex: 1, borderRadius: 10 }} />
          <div className="mh-skel" style={{ height: 38, flex: 1, borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TIME AGO
───────────────────────────────────────────── */
function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/* ─────────────────────────────────────────────
   PRODUCT CARD
───────────────────────────────────────────── */
const ProductCard = memo(function ProductCard({
  product, idx, onCart, onRequest, cartSet, requestedSet, userId, onOpenModal,
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [wished, setWished] = useState(false);

  const isOwn     = !!userId && Number(product.seller_id) === Number(userId);
  const inCart    = cartSet.has(product.id);
  const requested = requestedSet.has(product.id);
  const isNew     = product.condition === "new";
  const images    = product.images || [];
  const imgSrc    = images.length > 1 ? images[imgIdx]?.image : product.primary_image;
  const sellerName = [product.seller_first_name, product.seller_last_name].filter(Boolean).join(" ") || null;
  const priceNum  = Number(product.price);

  return (
    <div
      className="mh-card"
      onClick={() => onOpenModal(product)}
      style={{
        background: "#fff", borderRadius: 20, overflow: "hidden",
        display: "flex", flexDirection: "column",
        border: `1.5px solid ${C.border}`,
        boxShadow: "0 4px 24px rgba(26,35,126,.08), 0 1px 4px rgba(0,0,0,.04)",
        animation: "fadeUp .42s cubic-bezier(.22,1,.36,1) both",
        animationDelay: `${(idx % 8) * 0.055}s`, position: "relative",
      }}
    >
      {/* Image area */}
      <div style={{ position: "relative", height: 190, background: C.primaryLt, overflow: "hidden", flexShrink: 0 }}>
        <LazyImage
          src={imgSrc || "https://via.placeholder.com/400x280?text=No+Image"}
          alt={product.title}
          className="mh-card-img"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={e => { e.target.src = "https://via.placeholder.com/400x280?text=No+Image"; }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,16,51,.32) 0%, transparent 52%)", pointerEvents: "none" }} />

        <span style={{
          position: "absolute", top: 10, left: 10, zIndex: 3,
          padding: "3px 10px", borderRadius: 40, fontSize: 10, fontWeight: 800, color: "#fff", fontFamily: FONT,
          background: isNew ? "linear-gradient(135deg,#00897b,#00695c)" : "linear-gradient(135deg,#e65100,#bf360c)",
          boxShadow: "0 2px 8px rgba(0,0,0,.2)",
        }}>
          {isNew ? "✦ New" : "◈ Used"}
        </span>

        <span style={{
          position: "absolute", bottom: 10, left: 10, zIndex: 3,
          background: "rgba(13,16,51,.55)", backdropFilter: "blur(6px)",
          borderRadius: 40, padding: "3px 9px", fontSize: 10.5, fontWeight: 600, color: "#fff",
          display: "flex", alignItems: "center", gap: 4, fontFamily: FONT,
        }}>
          <Eye size={10} /> {product.view_count ?? 0}
        </span>

        <button
          className={`mh-wish-btn${wished ? " on" : ""}`}
          onClick={e => { e.stopPropagation(); setWished(w => !w); }}
          aria-label="Wishlist"
        >
          <Heart size={15} fill={wished ? "#ef4444" : "none"} />
        </button>

        {images.length > 1 && (
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5, zIndex: 4 }}>
            {images.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i); }}
                style={{ width: 6, height: 6, borderRadius: "50%", border: "none", cursor: "pointer", padding: 0, background: i === imgIdx ? "#fff" : "rgba(255,255,255,.4)", transform: i === imgIdx ? "scale(1.5)" : "scale(1)", transition: "all .15s" }} />
            ))}
          </div>
        )}

        {product.is_negotiable && (
          <span style={{
            position: "absolute", top: 0, right: 0, zIndex: 3,
            background: "linear-gradient(135deg,#f59e0b,#d97706)",
            color: "#fff", fontSize: 9, fontWeight: 800, fontFamily: FONT,
            padding: "5px 10px 5px 14px",
            clipPath: "polygon(8px 0,100% 0,100% 100%,0 100%)",
          }}>
            NEGO
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "12px 13px 8px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, color: C.primary, background: C.primaryLt,
            borderRadius: 40, padding: "2px 9px", fontFamily: FONT, maxWidth: "65%",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            border: `1px solid ${C.primaryM}`,
          }}>
            {product.category_name}
          </span>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: FONT, display: "flex", alignItems: "center", gap: 3, fontWeight: 500, flexShrink: 0 }}>
            <Clock size={9} /> {timeAgo(product.created_at)}
          </span>
        </div>

        <h3 style={{
          fontSize: 13.5, fontWeight: 700, color: C.text, fontFamily: FONT, lineHeight: 1.38,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {product.title}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: C.primary, fontFamily: FONT_D, letterSpacing: "-0.5px" }}>
            ر.ق{priceNum.toLocaleString("en-IN")}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.muted, fontFamily: FONT, fontWeight: 500 }}>
          <MapPin size={10} color="#c0c8e0" style={{ flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.city}</span>
          {sellerName && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 5, color: "#c0c8e0", flexShrink: 0 }}>
              <User size={9} /> <span style={{ maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sellerName}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 7, padding: "7px 13px 13px" }}>
        {isOwn ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, height: 38, background: C.primaryLt, border: `1.5px solid ${C.primaryM}`, borderRadius: 10 }}>
            <Lock size={12} color={C.primary} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, fontFamily: FONT }}>Your Product</span>
          </div>
        ) : (
          <>
            <button
              className="mh-btn-primary"
              onClick={e => { e.stopPropagation(); onCart(product); }}
              style={{
                flex: 1, height: 38, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: FONT, border: "none", cursor: "pointer",
                background: inCart ? "linear-gradient(135deg,#00897b,#00695c)" : `linear-gradient(135deg,${C.primary},${C.primary2})`,
                color: "#fff", boxShadow: inCart ? "0 3px 12px rgba(0,137,123,.28)" : "0 3px 12px rgba(26,35,126,.28)",
              }}>
              {inCart ? <CheckCircle size={13} /> : <ShoppingCart size={13} />}
              <span>{inCart ? "Added" : "Cart"}</span>
            </button>
            <button
              className="mh-btn-outline"
              onClick={e => { e.stopPropagation(); onRequest(product); }}
              disabled={requested}
              style={{
                flex: 1, height: 38, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: FONT,
                border: `1.5px solid ${C.primaryM}`, background: requested ? C.primaryLt : "transparent",
                color: C.primary, cursor: requested ? "not-allowed" : "pointer", opacity: requested ? 0.75 : 1,
              }}>
              <MessageCircle size={13} />
              <span>{requested ? "Sent ✓" : "Request"}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}, (prev, next) => (
  prev.product === next.product &&
  prev.cartSet.has(prev.product.id) === next.cartSet.has(next.product.id) &&
  prev.requestedSet.has(prev.product.id) === next.requestedSet.has(next.product.id)
));

/* ─────────────────────────────────────────────
   PRODUCT MODAL
───────────────────────────────────────────── */
const ProductModal = memo(function ProductModal({
  product, onClose, onCart, onRequest, cartSet, requestedSet, userId,
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  const images     = product?.images?.length ? product.images.map(i => i.image) : [product.primary_image];
  const isOwn      = !!userId && Number(product.seller_id) === Number(userId);
  const inCart     = cartSet.has(product.id);
  const requested  = requestedSet.has(product.id);
  const isNew      = product.condition === "new";
  const sellerName = [product.seller_first_name, product.seller_last_name].filter(Boolean).join(" ") || `Seller #${product.seller_id}`;
  const formatDate = d => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const handleImgChange = useCallback(i => { setImgLoaded(false); setImgIdx(i); }, []);

  useEffect(() => { setImgIdx(0); setImgLoaded(false); }, [product.id]);
  useEffect(() => {
    const h = e => {
      if (e.key === "Escape")      onClose();
      if (e.key === "ArrowRight")  setImgIdx(i => (i + 1) % images.length);
      if (e.key === "ArrowLeft")   setImgIdx(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, images.length]);

  const infoItems = useMemo(() => [
    { label: "Condition", val: isNew ? "✦ Brand New" : "◈ Used",                        icon: <Package size={10} /> },
    { label: "City",      val: product.city,                                              icon: <MapPin size={10} /> },
    { label: "Category",  val: product.category_name,                                    icon: <Tag size={10} /> },
    { label: "Listed",    val: timeAgo(product.created_at),                              icon: <Clock size={10} /> },
    { label: "Date",      val: formatDate(product.created_at),                           icon: <Clock size={10} /> },
    { label: "Views",     val: `${product.view_count ?? 0} views`,                       icon: <Eye size={10} /> },
    { label: "Listing",   val: `#${product.id}`,                                         icon: <Hash size={10} /> },
    { label: "Price",     val: `ر.ق ${Number(product.price).toLocaleString("en-IN")}`, icon: <Tag size={10} /> },
  ], [product.id, isNew, product.city, product.category_name, product.created_at, product.view_count, product.price]);

  return (
    <div className="mh-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={product.title}>
      <div className="mh-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px 12px", borderBottom: `1px solid ${C.border}`, background: "#fff", position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.primaryLt, border: `1px solid ${C.primaryM}`, borderRadius: 40, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: C.primary, fontFamily: FONT, whiteSpace: "nowrap", flexShrink: 0 }}>
              <Tag size={10} /> {product.category_name}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: C.text, fontFamily: FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.title}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, marginLeft: 12 }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontFamily: FONT_D, fontSize: 18, fontWeight: 900, color: C.primary, letterSpacing: "-0.04em", whiteSpace: "nowrap", display: "block" }}>ر.ق{Number(product.price).toLocaleString("en-IN")}</span>
              {product.is_negotiable && <span style={{ fontSize: 9, fontWeight: 700, color: C.accent, fontFamily: FONT, display: "block", textAlign: "right" }}>Negotiable</span>}
            </div>
            <button className="mh-modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="mh-modal-body" style={{ display: "grid", gridTemplateColumns: "42% 58%", flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* Gallery */}
          <div style={{ position: "relative", background: `linear-gradient(145deg,${C.primaryLt} 0%,#e0f2fe 100%)`, overflow: "hidden", display: "flex", flexDirection: "column", height: 500 }}>
            <div style={{ flex: 1, overflow: "hidden", position: "relative", minHeight: 0 }}>
              {!imgLoaded && <div className="mh-skel" style={{ position: "absolute", inset: 0, borderRadius: 0, zIndex: 1 }} />}
              <img key={imgIdx}
                src={images[imgIdx] || "https://via.placeholder.com/600x400?text=No+Image"}
                alt={`${product.title} ${imgIdx + 1}`} loading="lazy" decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: imgLoaded ? 1 : 0, transition: "opacity .28s ease", animation: "imgSlide .28s ease both" }}
                onLoad={() => setImgLoaded(true)}
                onError={e => { setImgLoaded(true); e.target.src = "https://via.placeholder.com/600x400?text=No+Image"; }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(13,16,51,.36) 0%,transparent 52%)", pointerEvents: "none", zIndex: 2 }} />
              <span style={{ position: "absolute", top: 12, left: 12, zIndex: 4, background: isNew ? "linear-gradient(135deg,#00897b,#00695c)" : "linear-gradient(135deg,#e65100,#bf360c)", color: "#fff", fontSize: 10, fontWeight: 800, padding: "4px 12px", borderRadius: 40, fontFamily: FONT }}>
                {isNew ? "✦ Brand New" : "◈ Used"}
              </span>
              {images.length > 1 && <span style={{ position: "absolute", bottom: 10, right: 10, zIndex: 4, background: "rgba(13,16,51,.64)", backdropFilter: "blur(4px)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 40, fontFamily: FONT, pointerEvents: "none" }}>{imgIdx + 1} / {images.length}</span>}
              {images.length > 1 && (
                <>
                  <button className="mh-img-nav" style={{ left: 10, zIndex: 5 }} onClick={() => handleImgChange((imgIdx - 1 + images.length) % images.length)} aria-label="Prev"><ChevronLeft size={17} /></button>
                  <button className="mh-img-nav" style={{ right: 10, zIndex: 5 }} onClick={() => handleImgChange((imgIdx + 1) % images.length)} aria-label="Next"><ChevronRight size={17} /></button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display: "flex", gap: 6, padding: "8px 10px", background: "rgba(255,255,255,.84)", backdropFilter: "blur(6px)", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0 }}>
                {images.map((src, i) => (
                  <div key={i} className={`mh-thumb${i === imgIdx ? " on" : ""}`} onClick={() => handleImgChange(i)} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && handleImgChange(i)}>
                    <img src={src} alt={`Thumb ${i + 1}`} loading="lazy" decoding="async" onError={e => { e.target.src = "https://via.placeholder.com/52?text=X"; }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 0, scrollbarWidth: "thin", scrollbarColor: `${C.primaryM} transparent`, height: 500 }}>
            <h2 style={{ fontFamily: FONT_D, fontSize: "clamp(15px,2.2vw,20px)", fontWeight: 900, color: C.text, lineHeight: 1.25, letterSpacing: "-0.03em", marginBottom: 4 }}>{product.title}</h2>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontFamily: FONT_D, fontSize: "clamp(20px,3vw,26px)", fontWeight: 900, color: C.primary, letterSpacing: "-0.04em" }}>
                ر.ق{Number(product.price).toLocaleString("en-IN")}
              </span>
              {product.is_negotiable
                ? <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: C.accentLt, border: `1px solid #fde68a`, borderRadius: 40, padding: "3px 9px", fontSize: 10.5, fontWeight: 700, color: C.accent, fontFamily: FONT }}><Zap size={9} /> Negotiable</span>
                : <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: C.successLt, border: "1px solid #80cbc4", borderRadius: 40, padding: "3px 9px", fontSize: 10.5, fontWeight: 700, color: C.success, fontFamily: FONT }}><Star size={9} /> Fixed Price</span>
              }
            </div>

            <div style={{ height: 1, background: C.border, margin: "0 0 10px" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {infoItems.map(r => (
                <div key={r.label} className="mh-info-item" style={{ background: "#f8faff", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 11px" }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.muted, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 3, fontFamily: FONT, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: C.primary, display: "flex" }}>{r.icon}</span>{r.label}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.text, fontFamily: FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.val}</div>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: C.border, margin: "12px 0 0" }} />

            {/* Seller card */}
            <div style={{ background: `linear-gradient(135deg,${C.primaryLt} 0%,${C.successLt} 100%)`, border: `1.5px solid ${C.primaryM}`, borderRadius: 14, padding: "13px 14px", marginTop: 12 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: C.primary, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 10, fontFamily: FONT, display: "flex", alignItems: "center", gap: 6 }}>
                <BadgeCheck size={12} color={C.primary} /> Seller Info
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", overflow: "hidden", border: "2.5px solid #fff", boxShadow: "0 3px 12px rgba(26,35,126,.18)", flexShrink: 0, background: C.primaryLt, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {product.seller_profile_image
                    ? <img src={product.seller_profile_image} alt={sellerName} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                    : <span style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>{(product.seller_first_name?.[0] || "") + (product.seller_last_name?.[0] || "") || "??"}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FONT }}>{sellerName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <span style={{ fontSize: 9.5, fontWeight: 700, color: C.success, background: C.successLt, borderRadius: 40, padding: "1px 7px", fontFamily: FONT }}>✓ Verified</span>
                    <span style={{ fontSize: 9.5, fontWeight: 600, color: C.muted, fontFamily: FONT }}>ID #{product.seller_id}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                {[
                  { icon: <PhoneForwarded size={11} />, label: "Phone",    text: `+974 ${product.seller_name}` },
                  { icon: <MapPin size={11} />,         label: "Location", text: product.city },
                  { icon: <User size={11} />,           label: "Name",     text: sellerName },
                  { icon: <Clock size={11} />,          label: "Listed",   text: timeAgo(product.created_at) },
                ].map((d, i) => (
                  <div key={i} className="mh-seller-row" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.78)", borderRadius: 9, padding: "6px 9px" }}>
                    <span style={{ color: C.primary, display: "flex", flexShrink: 0 }}>{d.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 8.5, fontWeight: 700, color: C.muted, fontFamily: FONT, textTransform: "uppercase", letterSpacing: "0.3px" }}>{d.label}</div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.text, fontFamily: FONT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isOwn ? (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 42, background: C.primaryLt, border: `1.5px solid ${C.primaryM}`, borderRadius: 12 }}>
                <Lock size={13} color={C.primary} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.primary, fontFamily: FONT }}>This is your product</span>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="mh-btn-primary" onClick={() => onCart(product)}
                  style={{
                    flex: 1, height: 42, borderRadius: 11, border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: FONT,
                    background: inCart ? "linear-gradient(135deg,#00897b,#00695c)" : `linear-gradient(135deg,${C.primary},${C.primary2})`,
                    boxShadow: inCart ? "0 4px 16px rgba(0,137,123,.30)" : "0 4px 16px rgba(26,35,126,.30)",
                  }}>
                  {inCart ? <CheckCircle size={14} /> : <ShoppingCart size={14} />}
                  {inCart ? "Added to Cart" : "Add to Cart"}
                </button>
                <button className="mh-btn-outline" onClick={() => { if (!requested) onRequest(product); }} disabled={requested}
                  style={{
                    flex: 1, height: 42, borderRadius: 11, cursor: requested ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    fontSize: 13, fontWeight: 700, color: C.primary, fontFamily: FONT,
                    background: "#fff", border: `1.5px solid ${C.primaryM}`, opacity: requested ? .72 : 1,
                  }}>
                  <MessageCircle size={14} />
                  {requested ? "Requested ✓" : "Request Info"}
                </button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${C.border}` }}>
              <span style={{ fontSize: 9.5, color: "#b0bec5", fontWeight: 500, fontFamily: FONT }}>Listing #{product.id} · Esc to close</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f8fafc", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 10, fontWeight: 600, color: C.muted, fontFamily: FONT_MONO }}>
                <Hash size={8} />{product.slug}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   SIDEBAR  — emojis replaced with lucide icons
───────────────────────────────────────────── */
function SidebarContent({ totalCount, cartSize, categories, cities, activeCity, setActiveCity }) {
  const card = {
    background: "#fff", borderRadius: 16, border: `1px solid ${C.border}`,
    padding: "16px 17px", boxShadow: "0 2px 16px rgba(26,35,126,.07)",
  };
  return (
    <>
      {/* ── Stats card ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: C.primaryLt, flexShrink: 0 }}>
            <Store size={18} color={C.primary} />
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FONT }}>Marketplace</span>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 11.5, color: C.muted, margin: "0 0 14px", fontWeight: 500 }}>
          {totalCount > 0 ? `${totalCount} active listings` : "Browse all categories"}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Categories", val: categories.length, dot: C.primary },
            { label: "Cities",     val: cities.length,     dot: C.success },
            { label: "In Cart",    val: cartSize,           dot: "#16a34a" },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.textSub, fontFamily: FONT, fontWeight: 500 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: row.dot }} />
                {row.label}
              </div>
              <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: C.text }}>{row.val}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 6, background: C.border, borderRadius: 99, overflow: "hidden", marginTop: 14 }}>
          <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg,${C.primary},${C.success})`, width: cartSize > 0 ? "60%" : "10%", transition: "width 0.8s cubic-bezier(.22,1,.36,1)" }} />
        </div>
      </div>

      {/* ── City filter card ── */}
      {cities.length > 0 && (
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: C.successLt, flexShrink: 0 }}>
              <MapPin size={18} color={C.success} />
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FONT }}>Browse by City</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {["All", ...cities].map(city => {
              const isOn = activeCity === city;
              return (
                <button key={city} onClick={() => setActiveCity(city)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 11px", borderRadius: 10, border: "none", background: isOn ? C.successLt : "transparent", cursor: "pointer", fontFamily: FONT, transition: "background .15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: isOn ? C.success : "#b2dfdb", transition: "background .15s" }} />
                    <span style={{ fontSize: 13, fontWeight: isOn ? 700 : 500, color: isOn ? "#004d40" : C.textSub }}>{city}</span>
                  </div>
                  {isOn && <span style={{ fontSize: 9, fontWeight: 700, color: C.success, background: "#c8e6c9", borderRadius: 40, padding: "1px 7px" }}>Active</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tips card ── */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: C.accentLt, flexShrink: 0 }}>
            <Lightbulb size={18} color={C.accent} />
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: C.text, fontFamily: FONT }}>Tips</span>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
          {[
            "Click any card to see full details & seller info.",
            "Use 'Request' to contact the seller directly.",
            "Add items to Cart to compare prices.",
            "Check condition: 'New' vs 'Used'.",
          ].map((tip, i) => (
            <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: C.textSub, fontFamily: FONT, lineHeight: 1.55 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.primary, marginTop: 5, flexShrink: 0, opacity: 0.65 }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <AdSlot variant="rectangle" />
      <div style={{ position: "sticky", top: 80 }}>
        <AdSlot variant="rectangle" />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function MarketplaceHome() {
  injectCSS();

  const [state, dispatch]         = useReducer(reducer, INIT_STATE);
  const [search, setSearch]       = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeCity, setActiveCity]         = useState("All");
  const [cartSet, setCartSet]               = useState(() => new Set());
  const [requestedSet, setRequestedSet]     = useState(() => new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage]         = useState(1);

  const { toast, add }   = useToast();
  const deviceLocation   = useDeviceLocation();
  const debouncedSearch  = useDebounce(search, 300);

  const userId = useMemo(() => (
    Number(localStorage.getItem("user_id") ?? localStorage.getItem("userId") ?? 0) || 0
  ), []);

  /* ── Fetch all products ── */
  useEffect(() => {
    let ctrl = new AbortController();
    (async () => {
      dispatch({ type: "FETCH_START" });
      try {
        const res = await fetchProducts({ signal: ctrl.signal });
        const raw = res?.data || res || [];
        dispatch({ type: "FETCH_SUCCESS", payload: Array.isArray(raw) ? raw : [] });
      } catch (err) {
        if (err.name !== "AbortError")
          dispatch({ type: "FETCH_ERROR", payload: "Failed to load products. Please try again." });
      }
    })();
    return () => ctrl.abort();
  }, []);

  /* ── Cart ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchCart();
        if (alive) setCartSet(new Set(res?.data?.data || res?.data || []));
      } catch { /* silent */ }
    })();
    return () => { alive = false; };
  }, []);

  /* ── Requested ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchRequestedProducts();
        const raw = res?.data?.data ?? res?.data ?? res ?? [];
        const ids = (Array.isArray(raw) ? raw : []).map(item => {
          if (typeof item === "number") return item;
          if (typeof item === "string") return Number(item);
          return item?.product_id ?? item?.product?.id ?? item?.id;
        }).filter(Boolean);
        if (alive) setRequestedSet(new Set(ids));
      } catch { /* silent */ }
    })();
    return () => { alive = false; };
  }, []);

  /* ── Derived ── */
  const { categories, cities } = useMemo(() => ({
    categories: [...new Set(state.products.map(p => p?.category_name).filter(Boolean))].sort(),
    cities:     [...new Set(state.products.map(p => p?.city).filter(Boolean))].sort(),
  }), [state.products]);

  /* ── Auto-select city from device ── */
  useEffect(() => {
    if (!deviceLocation.city || !cities.length) return;
    const match = cities.find(c =>
      c.toLowerCase().includes(deviceLocation.city.toLowerCase()) ||
      deviceLocation.city.toLowerCase().includes(c.toLowerCase())
    );
    if (match) setActiveCity(match);
  }, [deviceLocation.city, cities]);

  /* ── Reset page on filter changes ── */
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, activeCategory, activeCity]);

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    if (!state.products.length) return [];
    const q = debouncedSearch.toLowerCase();
    return state.products.filter(p => {
      if (!p) return false;
      const matchSearch = !q ||
        p.title?.toLowerCase().includes(q) ||
        p.category_name?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.seller_first_name?.toLowerCase().includes(q) ||
        p.seller_last_name?.toLowerCase().includes(q);
      return matchSearch &&
        (activeCategory === "All" || p.category_name === activeCategory) &&
        (activeCity === "All" || p.city === activeCity);
    });
  }, [state.products, debouncedSearch, activeCategory, activeCity]);

  /* ── Paginated list ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  /* ── Page change handler ── */
  const gridRef = useRef(null);
  const handlePageChange = useCallback((p) => {
    setCurrentPage(p);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* ── Cart handler ── */
  const handleCart = useCallback(async (product) => {
    if (Number(product.seller_id) === userId) { add("You can't add your own product", "error"); return; }
    const was = cartSet.has(product.id);
    setCartSet(prev => { const n = new Set(prev); was ? n.delete(product.id) : n.add(product.id); return n; });
    try {
      if (was) { await removeFromCart(product.id); add("Removed from cart"); }
      else { const r = await addToCart(product.id); add(r?.data?.already_exists ? "Already in cart" : "Added to cart ✓"); }
    } catch {
      setCartSet(prev => { const n = new Set(prev); was ? n.add(product.id) : n.delete(product.id); return n; });
      add("Cart action failed", "error");
    }
  }, [cartSet, add, userId]);

  /* ── Request handler ── */
  const handleRequest = useCallback(async (product) => {
    if (Number(product.seller_id) === userId) { add("You can't request your own product", "error"); return; }
    if (requestedSet.has(product.id)) return;
    setRequestedSet(prev => new Set(prev).add(product.id));
    try {
      const r = await requestProduct(product.id);
      add(r?.data?.already_requested ? "Already requested ✓" : "Request sent ✓");
    } catch {
      setRequestedSet(prev => { const n = new Set(prev); n.delete(product.id); return n; });
      add("Request failed", "error");
    }
  }, [requestedSet, add, userId]);

  const handleOpenModal       = useCallback(p => setSelectedProduct(p), []);
  const handleCloseModal      = useCallback(() => setSelectedProduct(null), []);
  const handleCategoryChange  = useCallback(c => setActiveCategory(c), []);
  const handleCityChange      = useCallback(c => setActiveCity(c), []);

  return (
    <MarketplaceLayout>
      <ToastPill toast={toast} />

      <div style={{ minHeight: "100vh", background: C.bg, fontFamily: FONT }}>
        <HeroBanner />

        {/* Mobile top ad */}
        <div className="mh-top-ad" style={{ display: "none", padding: "14px 14px 0", background: C.bg }}>
          <AdSlot variant="banner" />
        </div>

        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "clamp(14px,3vw,28px) clamp(12px,3vw,28px)" }}>

          {/* Desktop leaderboard ad */}
          <div className="mh-desk-ad" style={{ marginBottom: 20 }}>
            <AdSlot variant="leaderboard" />
          </div>

          <SearchBar value={search} onChange={setSearch} />

          {categories.length > 0 && (
            <CategoryBar categories={categories} active={activeCategory} setActive={handleCategoryChange} />
          )}

          {!state.loading && (
            <LocationBar cities={cities} activeCity={activeCity} setActiveCity={handleCityChange} deviceLocation={deviceLocation} />
          )}

          {/* Section header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }} ref={gridRef}>
            <div>
              <h2 style={{ fontFamily: FONT_D, fontSize: "clamp(17px,3vw,22px)", fontWeight: 900, color: C.text, letterSpacing: "-0.03em" }}>
                {activeCategory === "All" ? "All Listings" : activeCategory}
                {activeCity !== "All" && <span style={{ fontSize: "clamp(13px,2vw,16px)", fontWeight: 600, color: C.success, marginLeft: 8, fontFamily: FONT }}>· {activeCity}</span>}
              </h2>
              <p style={{ fontSize: 13, color: C.muted, fontFamily: FONT, marginTop: 3 }}>
                {state.loading
                  ? "Loading listings…"
                  : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}${filtered.length > PAGE_SIZE ? ` · Page ${currentPage} of ${totalPages}` : ""}`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              {activeCity !== "All" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.successLt, color: "#004d40", border: "1.5px solid #80cbc4", borderRadius: 40, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, fontFamily: FONT, animation: "popIn .3s ease both" }}>
                  <MapPin size={12} color={C.success} />
                  {activeCity}
                  <button onClick={() => setActiveCity("All")} style={{ background: "none", border: "none", cursor: "pointer", color: C.success, display: "flex", padding: 0, marginLeft: 2 }}>
                    <X size={12} />
                  </button>
                </div>
              )}
              {cartSet.size > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, background: C.successLt, color: "#16a34a", border: "1.5px solid #80cbc4", borderRadius: 40, padding: "7px 16px", fontSize: 13, fontWeight: 700, fontFamily: FONT, animation: "popIn .3s ease both", flexShrink: 0 }}>
                  <ShoppingCart size={14} /> {cartSet.size} in cart
                </div>
              )}
            </div>
          </div>

          {/* Main layout */}
          <div className="mh-layout" style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 22, alignItems: "flex-start" }}>

            <div style={{ minWidth: 0 }}>
              {/* Error */}
              {state.error && !state.loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 14, padding: "14px 16px", fontSize: 13.5, color: "#9f1239", fontFamily: FONT, marginBottom: 16 }}>
                  <X size={17} color="#e11d48" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{state.error}</span>
                  <button onClick={() => window.location.reload()} style={{ padding: "7px 16px", background: `linear-gradient(135deg,${C.primary},${C.primary2})`, color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Retry</button>
                </div>
              )}

              {/* Grid */}
              <div className="mh-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {state.loading
                  ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                  : paginated.length === 0
                    ? (
                      <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 20px", textAlign: "center" }}>
                        {/* Search icon replaces the 🔍 emoji */}
                        <div style={{ marginBottom: 16, animation: "floatOrb 4s ease-in-out infinite", color: C.primaryM }}>
                          <Search size={56} strokeWidth={1.5} />
                        </div>
                        <h3 style={{ fontFamily: FONT_D, fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 8 }}>No listings found</h3>
                        <p style={{ fontSize: 13.5, color: C.muted, fontFamily: FONT }}>
                          {activeCity !== "All" ? `No listings in ${activeCity} — try another city` : "Try a different search term or category"}
                        </p>
                        {activeCity !== "All" && (
                          <button onClick={() => setActiveCity("All")} style={{ marginTop: 14, padding: "9px 22px", borderRadius: 40, background: C.success, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Show all cities</button>
                        )}
                      </div>
                    )
                    : paginated.map((p, i) => (
                      <ProductCard
                        key={p.id} product={p} idx={i}
                        onCart={handleCart} onRequest={handleRequest}
                        cartSet={cartSet} requestedSet={requestedSet}
                        userId={userId} onOpenModal={handleOpenModal}
                      />
                    ))
                }
              </div>

              {/* Inline ad */}
              {!state.loading && paginated.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <AdSlot variant="inline" />
                </div>
              )}

              {/* Pagination */}
              {!state.loading && filtered.length > PAGE_SIZE && (
                <Pagination page={currentPage} totalPages={totalPages} onPage={handlePageChange} />
              )}

              {/* Bottom leaderboard ad */}
              {!state.loading && paginated.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <AdSlot variant="leaderboard" />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="mh-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16, flexShrink: 0, animation: "fadeUp 0.45s ease both", animationDelay: "0.2s" }}>
              <SidebarContent
                totalCount={state.products.length}
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

      {selectedProduct && (
        <ProductModal
          product={selectedProduct} onClose={handleCloseModal}
          onCart={handleCart} onRequest={handleRequest}
          cartSet={cartSet} requestedSet={requestedSet} userId={userId}
        />
      )}
    </MarketplaceLayout>
  );
}