import { useEffect, useState, useRef, useCallback, memo, useMemo } from "react";
import {
  fetchHomeProducts, addToCart, removeFromCart, fetchCart,
} from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";
import {
  ShoppingCart, Eye, MapPin, Tag,
  ChevronLeft, ChevronRight, Clock, Search, X,
  CheckCircle, Lock, Heart, Package,
  ZoomIn, ArrowLeft, ArrowRight, User, Calendar,
  BadgeCheck, Layers, DollarSign, Phone, Sparkles,
  TrendingUp, Shield, Star, Zap, Flame, Building2, Edit2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════
   SEO INJECTION
═══════════════════════════════════════════════════ */
function SEOMeta({ title, description, keywords }) {
  useEffect(() => {
    document.title = title;
    const setMeta = (name, content, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        prop ? el.setAttribute("property", name) : el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("description", description);
    setMeta("keywords", keywords);
    setMeta("robots", "index, follow");
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "website", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", window.location.href.split("?")[0]);
  }, [title, description, keywords]);
  return null;
}

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════ */
const T = {
  font:    "'Plus Jakarta Sans', sans-serif",
  fontD:   "'Fraunces', serif",
  fontS:   "'Sora', sans-serif",

  blue:    "#1565c0",
  blue2:   "#1976d2",
  blue5:   "#3b82f6",
  blue6:   "#2563eb",
  blue7:   "#1d4ed8",
  blueDk:  "#0d47a1",
  blueLt:  "#e3f2fd",
  blueLt2: "#eff6ff",
  blueM:   "#bfdbfe",
  blueM3:  "#93c5fd",

  ink:     "#0a0f1e",
  inkMd:   "#1e2a3a",
  slate:   "#475569",
  muted:   "#94a3b8",
  border:  "#e0ecfb",
  bg:      "#f0f6ff",
  white:   "#ffffff",

  green:   "#059669",
  amber:   "#d97706",
  red:     "#dc2626",
};

/* ═══════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Fraunces:ital,wght@0,700;0,900;1,700&family=Sora:wght@400;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
button, a { font-family: inherit; }

/* ── Animations ── */
@keyframes fadeUp      { from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:none;} }
@keyframes fadeIn      { from{opacity:0;}to{opacity:1;} }
@keyframes shimmer     { 0%{background-position:-700px 0;}100%{background-position:700px 0;} }
@keyframes floatOrb    { 0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-18px) rotate(3deg);} }
@keyframes waveSlide   { to{transform:translateX(-50%);} }
@keyframes pulse       { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(1.4);} }
@keyframes popIn       { 0%{opacity:0;transform:scale(0.78);}65%{transform:scale(1.04);}100%{opacity:1;transform:scale(1);} }
@keyframes cardReveal  { from{opacity:0;transform:translateY(24px) scale(.96);}to{opacity:1;transform:none;} }
@keyframes modalUp     { from{opacity:0;transform:translateY(40px) scale(0.96);}to{opacity:1;transform:none;} }
@keyframes blurIn      { from{opacity:0;filter:blur(8px);}to{opacity:1;filter:blur(0);} }
@keyframes heartPop    { 0%{transform:scale(1);}40%{transform:scale(1.5);}100%{transform:scale(1);} }
@keyframes countUp     { from{transform:translateY(6px);opacity:0;}to{transform:none;opacity:1;} }
@keyframes urgentPulse { 0%,100%{opacity:1;}50%{opacity:.55;} }
@keyframes softPulse   { 0%,100%{opacity:1;}50%{opacity:.4;} }
@keyframes imgReveal   { from{opacity:0;transform:scale(1.04);}to{opacity:1;transform:scale(1);} }

/* ── Skeleton ── */
.mh-skel {
  background: linear-gradient(90deg,#e8f0fb 25%,#d6e5f7 50%,#e8f0fb 75%);
  background-size: 700px 100%;
  animation: shimmer 1.5s linear infinite;
  border-radius: 8px;
}

/* ══════════════════════════════════════════════════
   NEW PRODUCT CARD  — editorial split-layout
══════════════════════════════════════════════════ */
.mh-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
  border: 0.5px solid #e0ecfb;
  display: flex;
  flex-direction: column;
  opacity: 0;
  will-change: transform;
  transition: transform .32s cubic-bezier(.2,.9,.4,1.1), box-shadow .32s ease !important;
}
.mh-card.mh-card-visible {
  animation: cardReveal .42s cubic-bezier(.34,1,.64,1) both !important;
  opacity: 1;
}
.mh-card:hover {
  transform: translateY(-6px) !important;
  box-shadow: 0 20px 48px rgba(10,15,40,.13), 0 4px 12px rgba(10,15,40,.06) !important;
}

/* Image wrapper — 4:3 */
.mh-card-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #eff6ff;
  flex-shrink: 0;
}
.mh-card-img-wrap img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  transition: transform .55s cubic-bezier(.25,.46,.45,.94);
  animation: imgReveal .4s ease both;
}
.mh-card:hover .mh-card-img-wrap img {
  transform: scale(1.06);
}

/* Bottom gradient on image */
.mh-card-img-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(5,12,35,.55) 100%);
  pointer-events: none;
  z-index: 1;
}

/* Top badges row */
.mh-card-top-badges {
  position: absolute; top: 11px; left: 11px;
  display: flex; gap: 5px; align-items: center;
  z-index: 3;
}

/* Badge base */
.mh-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 100px;
  font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.15px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.mh-badge-cat  { background: rgba(255,255,255,0.92); color: #185FA5; border: 0.5px solid rgba(255,255,255,0.5); }
.mh-badge-new  { background: #185FA5; color: #E6F1FB; }
.mh-badge-used { background: rgba(80,80,80,0.82); color: #e2e8f0; }
.mh-badge-neg  { background: rgba(15,110,86,0.9); color: #9FE1CB; }
.mh-badge-hot  {
  background: rgba(217,56,15,.9); color: #fde8e0;
  animation: urgentPulse 1.6s ease-in-out infinite;
}

/* Save button */
.mh-save {
  position: absolute; top: 11px; right: 11px; z-index: 3;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,0.9);
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10px);
  color: #94a3b8;
  transition: transform .2s ease, background .2s ease, color .2s ease !important;
}
.mh-save:hover { transform: scale(1.2) !important; background: #fff !important; }
.mh-save.active { animation: heartPop .3s ease !important; color: #ef4444 !important; }

/* Price band — overlaid on photo bottom */
.mh-price-band {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 10px 13px 10px;
  display: flex; align-items: center; justify-content: space-between;
  z-index: 2;
}
.mh-price-main {
  font-family: 'Sora', sans-serif;
  font-size: 20px; font-weight: 800;
  color: #fff; letter-spacing: -0.4px; line-height: 1;
  text-shadow: 0 1px 8px rgba(0,0,0,0.35);
}
.mh-price-currency {
  font-size: 12px; font-weight: 600;
  vertical-align: super; margin-right: 1px; opacity: 0.85;
}
.mh-view-count {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: rgba(255,255,255,0.72);
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500;
}

/* Card body */
.mh-card-body {
  padding: 13px 14px 14px;
  display: flex; flex-direction: column; gap: 9px;
  flex: 1;
}
.mh-card-title {
  font-family: 'Sora', sans-serif;
  font-size: 13.5px; font-weight: 600;
  color: #0a0f1e; line-height: 1.42;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Meta row */
.mh-meta-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.mh-meta-item {
  display: flex; align-items: center; gap: 4px;
  font-size: 11.5px; color: #94a3b8;
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 500;
}
.mh-meta-dot {
  width: 3px; height: 3px; border-radius: 50%;
  background: #cbd5e1; flex-shrink: 0;
}
.mh-days-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 100px;
  font-size: 10px; font-weight: 700;
  background: #FAEEDA; color: #854F0B;
  border: 0.5px solid #FAC775;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

/* Seller row */
.mh-seller-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 11px;
  background: #f7faff;
  border: 0.5px solid #e0ecfb;
}
.mh-seller-avatar {
  width: 26px; height: 26px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  font-family: 'Sora', sans-serif;
  color: #fff; flex-shrink: 0;
}
.mh-seller-name {
  font-size: 11.5px; font-weight: 600;
  color: #475569;
  font-family: 'Plus Jakarta Sans', sans-serif;
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  filter: blur(4px);
  transition: filter .32s ease;
  user-select: none;
}
.mh-card:hover .mh-seller-name { filter: blur(0); }
.mh-seller-lock {
  font-size: 10.5px; color: #94a3b8;
  display: flex; align-items: center; gap: 3px;
  white-space: nowrap; flex-shrink: 0;
  transition: opacity .32s ease;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.mh-card:hover .mh-seller-lock { opacity: 0; }

/* Card footer */
.mh-card-footer {
  display: flex; align-items: center; gap: 7px;
}
.mh-btn-cart {
  flex: 1; height: 36px; border-radius: 10px;
  border: none; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12.5px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: transform .18s ease, filter .18s ease, background .18s ease !important;
  background: #1565c0; color: #eff6ff;
}
.mh-btn-cart:hover:not(:disabled) {
  transform: translateY(-1px) !important;
  filter: brightness(1.1) !important;
}
.mh-btn-cart.in-cart { background: #0F6E56 !important; color: #9FE1CB !important; }
.mh-btn-cart:disabled { opacity: 0.45; cursor: not-allowed; background: #e2e8f0; color: #94a3b8; }
.mh-btn-view {
  width: 36px; height: 36px; border-radius: 10px;
  border: 0.5px solid #e0ecfb;
  background: #f7faff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #94a3b8; flex-shrink: 0;
  transition: background .15s, color .15s, border-color .15s !important;
}
.mh-btn-view:hover {
  background: #eff6ff !important;
  color: #1565c0 !important;
  border-color: #bfdbfe !important;
}

/* Live dot */
.mh-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #1D9E75; display: inline-block; flex-shrink: 0;
  animation: softPulse 2s ease-in-out infinite;
}

/* Skeleton card — same proportions */
.mh-skel-card {
  border-radius: 20px;
  overflow: hidden;
  border: 0.5px solid #e0ecfb;
  background: #fff;
}
.mh-skel-card-img {
  width: 100%; aspect-ratio: 4/3;
}
.mh-skel-card-body {
  padding: 13px 14px 14px;
  display: flex; flex-direction: column; gap: 9px;
}

/* ── Cart btn (non-card, e.g. modal) ── */
.mh-cart-btn {
  transition: transform .18s ease, box-shadow .18s ease, filter .18s ease !important;
}
.mh-cart-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.03) !important;
  filter: brightness(1.08) !important;
}

/* ── Chips ── */
.mh-chip { transition: all .18s ease !important; }
.mh-chip:hover:not(.active) {
  background: ${T.blueLt} !important; color: ${T.blue} !important;
  border-color: ${T.blueM} !important; transform: translateY(-1px) !important;
}
.mh-chip.active {
  background: ${T.blue6} !important; color: #fff !important;
  border-color: ${T.blue6} !important;
  box-shadow: 0 4px 16px rgba(37,99,235,.3) !important;
}

/* ── Pagination ── */
.mh-pgbtn { transition: all .18s ease !important; }
.mh-pgbtn:hover:not(:disabled) {
  background: ${T.blue} !important; color:#fff !important;
  border-color: ${T.blue} !important; transform: scale(1.1) !important;
  box-shadow: 0 4px 14px rgba(21,101,192,0.35) !important;
}
.mh-pgbtn.cur {
  background: ${T.blue} !important; color:#fff !important;
  border-color: ${T.blue} !important;
  box-shadow: 0 4px 16px rgba(21,101,192,0.38) !important;
  font-weight:800 !important;
}

/* ── Search ── */
.mh-srch:focus-within .mh-sbox {
  border-color: ${T.blueM} !important;
  box-shadow: 0 0 0 4px rgba(37,99,235,0.1), 0 4px 18px rgba(21,101,192,0.09) !important;
  background: #fff !important;
}

/* ── Toast ── */
.mh-toast {
  position:fixed; bottom:28px; left:50%;
  transform:translateX(-50%) translateY(20px);
  display:inline-flex; align-items:center; gap:9px;
  background:${T.ink}; color:#fff;
  padding:12px 26px; border-radius:999px;
  font-size:13px; font-weight:600;
  box-shadow:0 10px 36px rgba(0,0,0,0.24);
  z-index:99999; opacity:0; pointer-events:none;
  transition:all .28s cubic-bezier(.22,1,.36,1);
  border:1px solid rgba(255,255,255,0.1);
  font-family:${T.font};
}
.mh-toast.on { opacity:1; transform:translateX(-50%) translateY(0); }
.mh-toast.err { background:#7f1d1d !important; }

/* ── Modal ── */
.mh-overlay {
  position:fixed; inset:0; z-index:9000;
  background:rgba(5,15,40,0.78);
  backdrop-filter:blur(8px);
  display:flex; align-items:center; justify-content:center;
  padding:16px;
  animation:fadeIn .2s ease both;
  overflow-y:auto;
}
.mh-modal {
  background:#fff;
  border-radius:24px;
  width:100%; max-width:880px;
  max-height:92vh;
  display:flex; flex-direction:column;
  overflow:hidden;
  box-shadow:0 40px 100px rgba(10,25,70,0.38), 0 8px 32px rgba(0,0,0,0.12);
  animation:modalUp .32s cubic-bezier(.22,1,.36,1) both;
  position:relative;
}
.mh-modal-grid {
  display:grid;
  grid-template-columns:1.1fr 1fr;
  min-height:0; flex:1; overflow:hidden;
}
.mh-modal-img-col {
  position:relative; background:${T.blueLt2};
  overflow:hidden; display:flex; flex-direction:column;
}
.mh-modal-main-img {
  width:100%; height:100%;
  min-height:300px; max-height:420px;
  object-fit:cover; display:block;
  animation:blurIn .3s ease both; flex:1;
}
.mh-modal-info-col {
  overflow-y:auto;
  padding:28px 24px 24px;
  display:flex; flex-direction:column; gap:16px;
  scrollbar-width:thin; scrollbar-color:${T.blueM} transparent;
  max-height:92vh;
}
.mh-modal-info-col::-webkit-scrollbar { width:4px; }
.mh-modal-info-col::-webkit-scrollbar-thumb { background:${T.blueM}; border-radius:99px; }

/* ── Seller blur in modal ── */
.mh-seller-blur { filter:blur(5px); user-select:none; pointer-events:none; }
.mh-seller-wrap:hover .mh-seller-blur { filter:blur(0.3); transition:filter .3s ease; }
.mh-seller-gate {
  position:absolute; inset:0; z-index:2;
  background:rgba(239,246,255,0.7);
  backdrop-filter:blur(2px);
  display:flex; align-items:center; justify-content:center;
  border-radius:14px; cursor:pointer;
  transition:opacity .18s ease;
}
.mh-seller-gate:hover { opacity:0; }

/* ── Lazy ── */
.mh-lazy-hidden { opacity:0; transform:translateY(20px); }
.mh-lazy-visible { opacity:1; transform:none; transition:opacity .5s ease, transform .5s ease; }

/* ── City scroll ── */
.mh-cscroll { scrollbar-width:none; }
.mh-cscroll::-webkit-scrollbar { display:none; }

/* ── Responsive ── */
@media (max-width:1100px) {
  .mh-layout { grid-template-columns:1fr 200px !important; }
}
@media (max-width:860px) {
  .mh-layout  { grid-template-columns:1fr !important; }
  .mh-sidebar { display:none !important; }
  .mh-topad   { display:flex !important; }
  .mh-desktop-ad { display:none !important; }
  .mh-grid    { grid-template-columns:repeat(2,1fr) !important; gap:12px !important; }
  .mh-modal-grid { grid-template-columns:1fr !important; }
  .mh-modal-main-img { min-height:220px !important; max-height:260px !important; }
  .mh-hero-title { font-size:28px !important; }
}
@media (max-width:640px) {
  .mh-modal { border-radius:20px 20px 0 0; max-height:95vh; align-self:flex-end; }
  .mh-overlay { align-items:flex-end; padding:0; }
  .mh-modal-info-col { padding:16px 16px 24px !important; gap:12px !important; }
  .mh-hero-inner { padding:28px 16px 72px !important; }
  .mh-hero-title { font-size:22px !important; }
  .mh-hero-stats { gap:20px !important; }
}
@media (max-width:580px) {
  .mh-grid    { grid-template-columns:repeat(2,1fr) !important; gap:10px !important; }
  .mh-wrap    { padding:12px !important; }
  .mh-sechdr  { flex-direction:column !important; align-items:flex-start !important; gap:8px !important; }
}
@media (max-width:400px) {
  .mh-grid { grid-template-columns:1fr !important; }
  .mh-hero-title { font-size:19px !important; }
}
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("mh-styles")) return;
    const el = document.createElement("style");
    el.id = "mh-styles";
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.getElementById("mh-styles")?.remove();
  }, []);
  return null;
}

/* ═══════════════════════════════════════════════════
   LAZY REVEAL
═══════════════════════════════════════════════════ */
function LazyReveal({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: "60px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={visible ? "mh-lazy-visible" : "mh-lazy-hidden"}
      style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AD SLOT
═══════════════════════════════════════════════════ */
function AdSlot({ variant = "banner", style: extra = {} }) {
  const cfg = { banner:{h:90,label:"728 × 90"}, sidebar:{h:250,label:"300 × 250"}, inline:{h:90,label:"Responsive"} }[variant] ?? { h:90, label:"Ad" };
  return (
    <div style={{
      width:"100%", minHeight:cfg.h,
      background:"repeating-linear-gradient(45deg,#f8fafc,#f8fafc 10px,#eef3fa 10px,#eef3fa 20px)",
      border:"1.5px dashed #cbd5e1", borderRadius:14,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5,
      ...extra,
    }}>
      <span style={{ fontSize:9, fontWeight:800, color:"#94a3b8", letterSpacing:"1.2px", textTransform:"uppercase", fontFamily:T.font }}>Advertisement</span>
      <span style={{ fontSize:11.5, color:"#cbd5e1", fontFamily:T.font, fontWeight:600 }}>{cfg.label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
function useToast() {
  const [toast, setToast] = useState({ on:false, msg:"", error:false });
  const timer = useRef(null);
  const add = useCallback((message, type="success") => {
    clearTimeout(timer.current);
    setToast({ on:true, msg:message, error:type==="error" });
    timer.current = setTimeout(() => setToast(p => ({ ...p, on:false })), 3200);
  }, []);
  return { toast, add };
}
function ToastPill({ toast }) {
  return (
    <div className={`mh-toast${toast.on?" on":""}${toast.error?" err":""}`}>
      {toast.error ? <X size={14} color="#fca5a5"/> : <CheckCircle size={14} color="#34d399"/>}
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
      position:"relative",
      background:`linear-gradient(150deg,${T.blueDk} 0%,${T.blue} 45%,${T.blue6} 80%,${T.blue5} 100%)`,
      overflow:"hidden",
    }}>
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", backgroundImage:"radial-gradient(rgba(255,255,255,0.06) 1.5px,transparent 1.5px)", backgroundSize:"30px 30px" }} />
      {[
        { w:380, h:380, t:-120, r:-80, d:"0s" },
        { w:180, h:180, t:30, l:"35%", d:"3s" },
        { w:120, h:120, b:20, l:60, d:"5s" },
      ].map((b,i) => (
        <div key={i} style={{ position:"absolute", width:b.w, height:b.h, top:b.t, right:b.r, bottom:b.b, left:b.l, borderRadius:"50%", background:"rgba(255,255,255,0.05)", animation:`floatOrb ${7+i*2}s ease-in-out infinite`, animationDelay:b.d, pointerEvents:"none" }} />
      ))}
      <svg style={{ position:"absolute", bottom:0, left:0, width:"200%", height:64, zIndex:1, pointerEvents:"none" }} viewBox="0 0 1440 64" preserveAspectRatio="none">
        <path style={{ animation:"waveSlide 12s linear infinite" }} d="M0,32 C240,58 480,6 720,32 C960,58 1200,6 1440,32 C1680,58 1920,6 2160,32 L2160,64 L0,64 Z" fill="#f0f6ff" />
      </svg>
      <div className="mh-hero-inner" style={{ position:"relative", zIndex:2, maxWidth:1240, margin:"0 auto", padding:"clamp(40px,7vw,72px) clamp(16px,5vw,48px) clamp(56px,8vw,88px)", textAlign:"center" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.22)", borderRadius:40, padding:"5px 16px", marginBottom:18, backdropFilter:"blur(10px)", animation:"fadeIn .4s ease both" }}>
          <span style={{ width:7, height:7, background:"#34d399", borderRadius:"50%", animation:"pulse 1.6s infinite", flexShrink:0 }} />
          <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.9)", fontFamily:T.font }}>Live Marketplace · Kerala, India</span>
        </div>
        <h1 className="mh-hero-title" style={{ fontFamily:T.fontD, fontSize:"clamp(26px,5.5vw,50px)", fontWeight:900, color:"#fff", letterSpacing:"-0.5px", lineHeight:1.1, marginBottom:14, animation:"fadeUp .48s ease both", animationDelay:"0.07s" }}>
          Discover Amazing{" "}
          <em style={{ fontStyle:"italic", background:"linear-gradient(90deg,#a5f3fc,#34d399)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Deals</em>
          {" "}Near You
        </h1>
        <p style={{ fontSize:"clamp(13px,1.8vw,15.5px)", color:"rgba(255,255,255,0.7)", fontFamily:T.font, fontWeight:400, lineHeight:1.65, marginBottom:32, animation:"fadeUp .48s ease both", animationDelay:"0.15s", maxWidth:520, margin:"0 auto 32px" }}>
          Buy &amp; sell locally — electronics, furniture, fashion &amp; everything in between.
        </p>
        <div className="mh-hero-stats" style={{ display:"flex", justifyContent:"center", gap:"clamp(28px,5vw,60px)", animation:"fadeUp .48s ease both", animationDelay:"0.23s" }}>
          {[
            { num:totalCount, label:"Listings",  icon:<Layers size={16}/> },
            { num:totalNew,   label:"Brand New", icon:<Sparkles size={16}/> },
            { num:totalUsed,  label:"Used",      icon:<TrendingUp size={16}/> },
          ].map(({ num, label, icon }) => (
            <div key={label} style={{ textAlign:"center" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, color:"rgba(255,255,255,0.55)", marginBottom:4 }}>{icon}<span style={{ fontSize:11, fontWeight:700, fontFamily:T.font, textTransform:"uppercase", letterSpacing:"0.6px" }}>{label}</span></div>
              <span style={{ display:"block", fontFamily:T.fontS, fontSize:"clamp(1.3rem,3vw,1.8rem)", fontWeight:800, color:"#fff", letterSpacing:"-1px", animation:"countUp .5s ease both" }}>{num}</span>
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
    <div className="mh-srch" style={{ marginBottom:16 }}>
      <div className="mh-sbox" style={{ display:"flex", alignItems:"center", gap:10, background:"#f7faff", border:`1.5px solid ${T.blueM}`, borderRadius:16, padding:"0 18px", height:52, boxShadow:"0 2px 14px rgba(21,101,192,0.08)", transition:"border-color .18s, box-shadow .18s, background .18s" }}>
        <Search size={17} color={T.muted} style={{ flexShrink:0 }} />
        <input type="search" placeholder="Search products, brands, cities…" value={value} onChange={e => onChange(e.target.value)} aria-label="Search products"
          style={{ flex:1, border:"none", outline:"none", fontSize:14, fontFamily:T.font, color:T.ink, background:"transparent" }} />
        {value && (
          <button onClick={() => onChange("")} aria-label="Clear search" style={{ background:"none", border:"none", cursor:"pointer", color:T.muted, display:"flex", padding:3, borderRadius:6, flexShrink:0 }}>
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
  const chips = useMemo(() => [...new Set(["All","New","Used","Negotiable",...categories])], [categories]);
  return (
    <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:14 }}>
      {chips.map(c => (
        <button key={c} onClick={() => setActive(c)} className={`mh-chip${active===c?" active":""}`}
          style={{ padding:"7px 17px", borderRadius:40, fontSize:12.5, fontWeight:700, fontFamily:T.font, cursor:"pointer", border:"1.5px solid", background:active===c?T.blue6:"#fff", color:active===c?"#fff":T.slate, borderColor:active===c?T.blue6:"#e2e8f0" }}>
          {c}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CITY FILTER
═══════════════════════════════════════════════════ */
function CityFilter({ cities, active, setActive }) {
  if (!cities.length) return null;
  const all = ["All Cities", ...cities];
  return (
    <div style={{ marginBottom:20, background:"#fff", border:`1.5px solid ${T.border}`, borderRadius:18, padding:"13px 15px", boxShadow:"0 2px 14px rgba(21,101,192,0.06)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:11 }}>
        <div style={{ width:28, height:28, borderRadius:9, background:T.blueLt, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <MapPin size={14} color={T.blue6} />
        </div>
        <span style={{ fontSize:11.5, fontWeight:800, color:T.ink, fontFamily:T.font, textTransform:"uppercase", letterSpacing:"0.7px" }}>Filter by City</span>
        {active!=="All Cities" && (
          <button onClick={() => setActive("All Cities")} style={{ marginLeft:"auto", background:T.blueLt, border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:11.5, fontWeight:700, color:T.blue6, fontFamily:T.font, borderRadius:40, padding:"4px 10px" }}>
            <X size={11}/> Clear
          </button>
        )}
      </div>
      <div className="mh-cscroll" style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
        {all.map(city => {
          const isA = active===city;
          return (
            <button key={city} onClick={() => setActive(city)} className={`mh-chip${isA?" active":""}`}
              style={{ padding:"6px 14px", borderRadius:40, fontSize:12, fontWeight:700, fontFamily:T.font, cursor:"pointer", whiteSpace:"nowrap", border:"1.5px solid", flexShrink:0, display:"flex", alignItems:"center", gap:5, background:isA?T.blue6:"#f7faff", color:isA?"#fff":T.slate, borderColor:isA?T.blue6:"#e2e8f0" }}>
              {city!=="All Cities" && <MapPin size={10} style={{ flexShrink:0, opacity:isA?1:0.6 }} />}
              {city}
            </button>
          );
        })}
      </div>
      {active!=="All Cities" && (
        <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6, fontSize:12, color:T.blue6, fontFamily:T.font, fontWeight:600 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"#34d399", flexShrink:0, animation:"pulse 1.6s infinite" }} />
          Showing listings in <strong style={{ color:T.ink }}>{active}</strong>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SKELETON CARD — matches new 4:3 layout
═══════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="mh-skel-card">
      <div className="mh-skel mh-skel-card-img" />
      <div className="mh-skel-card-body">
        <div className="mh-skel" style={{ height:14, width:"90%", borderRadius:6 }} />
        <div className="mh-skel" style={{ height:14, width:"65%", borderRadius:6 }} />
        <div style={{ display:"flex", gap:6, marginTop:2 }}>
          <div className="mh-skel" style={{ height:10, width:60, borderRadius:4 }} />
          <div className="mh-skel" style={{ height:10, width:50, borderRadius:4 }} />
        </div>
        <div className="mh-skel" style={{ height:34, borderRadius:10, marginTop:4 }} />
        <div className="mh-skel" style={{ height:36, borderRadius:10 }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AVATAR COLOR
═══════════════════════════════════════════════════ */
const AVATAR_COLORS = ["#185FA5","#3B6D11","#993C1D","#854F0B","#533AB7","#0F6E56","#7F1D1D","#065F46"];
function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/* ═══════════════════════════════════════════════════
   PRODUCT CARD  — New editorial 4:3 design
═══════════════════════════════════════════════════ */
const ProductCard = memo(function ProductCard({ product, idx, onCart, onView, cartSet, userId }) {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [imgErr,  setImgErr]  = useState(false);
  const [inCart,  setInCart]  = useState(false); // local optimistic

  useEffect(() => {
    setInCart(cartSet.has(product.id));
  }, [cartSet, product.id]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.06, rootMargin: "80px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  const isOwn  = !!userId && Number(product.seller_id) === Number(userId);
  const isNew  = product.condition === "new";

  const daysLeft = product.end_date
    ? Math.max(0, Math.ceil((new Date(product.end_date) - new Date()) / 86400000))
    : null;

  const timeAgo = d => {
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 3600)  return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  const accentHue = (product.category_name?.[0]?.charCodeAt(0) || 200) * 137 % 360;
  const accentClr = `hsl(${accentHue},60%,44%)`;

  const imgSrc = imgErr
    ? "https://via.placeholder.com/400x300?text=No+Image"
    : (product.primary_image || product.images?.[0]?.image);

  const maskedName = product.seller_name
    ? product.seller_name.length > 4
      ? product.seller_name.slice(0, 4) + "xxxx"
      : product.seller_name + "xxxx"
    : "Seller";

  return (
    <article
      ref={cardRef}
      className={`mh-card${visible ? " mh-card-visible" : ""}`}
      style={{ animationDelay: `${(idx % 8) * 55}ms` }}
      onClick={() => onView?.(product)}
      aria-label={`${product.title} — ر.ق${Number(product.price).toLocaleString("en-IN")}`}
    >
      {/* ── Image area ── */}
      <div className="mh-card-img-wrap">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${T.blueLt2},${T.blueLt})` }}>
            <Package size={40} color={T.blueM3} strokeWidth={1.2} />
          </div>
        )}

        {/* Gradient */}
        <div className="mh-card-img-gradient" />

        {/* Top badges */}
        <div className="mh-card-top-badges">
          <span className="mh-badge mh-badge-cat">
            <Tag size={9} strokeWidth={2.5} />
            {product.category_name}
          </span>
          {isNew
            ? <span className="mh-badge mh-badge-new">✦ New</span>
            : <span className="mh-badge mh-badge-used">Used</span>
          }
          {product.is_negotiable && <span className="mh-badge mh-badge-neg">Nego</span>}
          {daysLeft !== null && daysLeft <= 7 && (
            <span className="mh-badge mh-badge-hot">
              <Flame size={9} />
              {daysLeft === 0 ? "Last day" : `${daysLeft}d`}
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          className={`mh-save${saved ? " active" : ""}`}
          onClick={e => { e.stopPropagation(); setSaved(v => !v); }}
          aria-label={saved ? "Unsave" : "Save"}
        >
          <Heart size={13} fill={saved ? "#ef4444" : "none"} stroke={saved ? "#ef4444" : "currentColor"} />
        </button>

        {/* Price band */}
        <div className="mh-price-band">
          <div className="mh-price-main">
            <span className="mh-price-currency">ر.ق</span>
            {Number(product.price).toLocaleString("en-IN")}
          </div>
          <div className="mh-view-count">
            <Eye size={11} />
            {product.view_count ?? 0}
          </div>
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="mh-card-body">
        {/* Title */}
        <h2 className="mh-card-title">{product.title}</h2>

        {/* Meta row */}
        <div className="mh-meta-row">
          <span className="mh-meta-item">
            <MapPin size={10} color={T.muted} />
            {product.city}
          </span>
          <span className="mh-meta-dot" />
          <span className="mh-meta-item">
            <Clock size={10} color={T.muted} />
            {timeAgo(product.created_at)}
          </span>
          {daysLeft !== null && daysLeft <= 7 && (
            <>
              <span className="mh-meta-dot" />
              <span className="mh-days-badge">
                <Flame size={9} />
                {daysLeft === 0 ? "Last day!" : `${daysLeft}d left`}
              </span>
            </>
          )}
          {/* Live dot for very fresh listings (under 1h) */}
          {(Date.now() - new Date(product.created_at)) / 1000 < 3600 && (
            <>
              <span className="mh-meta-dot" />
              <span className="mh-live-dot" title="Just listed" />
            </>
          )}
        </div>

        {/* Seller row */}
        <div className="mh-seller-row">
          <div className="mh-seller-avatar" style={{ background: getAvatarColor(product.seller_name) }}>
            {(product.seller_name?.[0] || "S").toUpperCase()}
          </div>
          {isOwn ? (
            <span style={{ fontSize:11.5, fontWeight:600, color:T.blue6, fontFamily:T.font, flex:1 }}>Your listing</span>
          ) : (
            <span className="mh-seller-name">{maskedName}</span>
          )}
          <span className="mh-seller-lock">
            <Lock size={10} />
            {isOwn ? "owned" : "hover"}
          </span>
        </div>

        {/* Footer */}
        <div className="mh-card-footer">
          {isOwn ? (
            <>
              <button className="mh-btn-cart" disabled style={{ flex:1 }}>
                <Lock size={12} /> Your item
              </button>
              <button
                className="mh-btn-view"
                onClick={e => { e.stopPropagation(); window.location.href = `/marketplace/product/${product.slug ?? product.id}`; }}
                title="Edit listing"
                aria-label="Edit listing"
              >
                <Edit2 size={13} />
              </button>
            </>
          ) : (
            <>
              <button
                className={`mh-btn-cart${inCart ? " in-cart" : ""}`}
                onClick={e => { e.stopPropagation(); onCart(product); }}
                aria-label={inCart ? "Remove from cart" : "Add to cart"}
              >
                {inCart
                  ? <><CheckCircle size={12} /> In cart</>
                  : <><ShoppingCart size={12} /> Add to cart</>
                }
              </button>
              <button
                className="mh-btn-view"
                onClick={e => { e.stopPropagation(); onView?.(product); }}
                title="Quick view"
                aria-label="Quick view"
              >
                <Eye size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
});

/* ═══════════════════════════════════════════════════
   PRODUCT MODAL  — unchanged from original
═══════════════════════════════════════════════════ */
function ProductModal({ product, onClose, onCart, cartSet, userId }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [saved,  setSaved]  = useState(false);
  const overlayRef          = useRef(null);

  const images   = product?.images?.length ? product.images : [];
  const allImgs  = images.length > 0
    ? images.map(i => i.image)
    : product.primary_image ? [product.primary_image] : [];
  const curImg   = allImgs[imgIdx] || "https://via.placeholder.com/800x600?text=No+Image";
  const isNew    = product.condition === "new";
  const inCart   = cartSet.has(product.id);
  const isOwn    = !!userId && Number(product.seller_id) === Number(userId);

  const prev = useCallback(e => { e?.stopPropagation(); setImgIdx(i => (i-1+allImgs.length)%allImgs.length); }, [allImgs.length]);
  const next = useCallback(e => { e?.stopPropagation(); setImgIdx(i => (i+1)%allImgs.length); }, [allImgs.length]);

  useEffect(() => {
    const fn = e => { if (e.key==="Escape") onClose(); if (e.key==="ArrowLeft") prev(); if (e.key==="ArrowRight") next(); };
    window.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose, prev, next]);

  const timeAgo = d => {
    const s = (Date.now()-new Date(d))/1000;
    if (s<3600)  return `${Math.floor(s/60)}m ago`;
    if (s<86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  const accentHue = (product.category_name?.[0]?.charCodeAt(0)||200)*137%360;
  const accentClr = `hsl(${accentHue},60%,46%)`;
  const accentBg  = `hsl(${accentHue},80%,95%)`;

  return (
    <div className="mh-overlay" ref={overlayRef} onClick={e => { if (e.target===overlayRef.current) onClose(); }}>
      <div className="mh-modal" role="dialog" aria-modal="true" aria-label={product.title}>

        <button onClick={onClose} aria-label="Close"
          style={{ position:"absolute", top:14, right:14, zIndex:20, width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.94)", border:"1px solid rgba(0,0,0,0.08)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:T.slate, backdropFilter:"blur(6px)", boxShadow:"0 2px 12px rgba(0,0,0,0.14)" }}>
          <X size={16} />
        </button>

        <div className="mh-modal-grid">
          {/* Image column */}
          <div className="mh-modal-img-col">
            <div style={{ position:"relative", flex:1, overflow:"hidden", minHeight:300 }}>
              <img key={curImg} src={curImg} alt={product.title}
                style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block", animation:"blurIn .28s ease both" }}
                onError={e => { e.target.src = "https://via.placeholder.com/800x600?text=No+Image"; }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(8,20,55,0.5) 0%,transparent 40%)", pointerEvents:"none" }} />

              <div style={{ position:"absolute", top:14, left:14, display:"flex", gap:6, zIndex:3 }}>
                <span style={{ padding:"4px 13px", borderRadius:40, fontSize:11, fontWeight:800, color:"#fff", fontFamily:T.font, backdropFilter:"blur(8px)", background:isNew?"rgba(37,99,235,0.88)":"rgba(100,116,139,0.85)", boxShadow:"0 2px 10px rgba(0,0,0,0.18)" }}>
                  {isNew ? "✦ New" : "Used"}
                </span>
                {product.is_negotiable && (
                  <span style={{ padding:"4px 13px", borderRadius:40, fontSize:11, fontWeight:800, fontFamily:T.font, backdropFilter:"blur(8px)", background:"rgba(255,255,255,0.9)", color:T.blue6, border:`1px solid rgba(96,165,250,0.35)`, boxShadow:"0 2px 10px rgba(0,0,0,0.08)" }}>Negotiable</span>
                )}
              </div>

              <button className={`mh-save${saved?" active":""}`}
                onClick={e => { e.stopPropagation(); setSaved(v => !v); }}
                style={{ position:"absolute", top:14, right:52, zIndex:3, width:34, height:34, borderRadius:"50%", background:"rgba(255,255,255,0.88)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", boxShadow:"0 2px 8px rgba(0,0,0,0.12)", color:saved?"#ef4444":T.muted }}>
                <Heart size={15} fill={saved?"#ef4444":"none"} stroke={saved?"#ef4444":"currentColor"} />
              </button>

              {allImgs.length > 1 && (
                <>
                  <button onClick={prev} aria-label="Previous" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", zIndex:3, width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.88)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", boxShadow:"0 4px 16px rgba(0,0,0,0.18)" }}>
                    <ArrowLeft size={16} color={T.inkMd} />
                  </button>
                  <button onClick={next} aria-label="Next" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", zIndex:3, width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.88)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", boxShadow:"0 4px 16px rgba(0,0,0,0.18)" }}>
                    <ArrowRight size={16} color={T.inkMd} />
                  </button>
                  <div style={{ position:"absolute", bottom:12, right:12, zIndex:3, background:"rgba(8,20,55,0.55)", backdropFilter:"blur(6px)", borderRadius:40, padding:"3px 11px", fontSize:11, fontWeight:700, color:"#fff", fontFamily:T.font }}>
                    {imgIdx+1} / {allImgs.length}
                  </div>
                </>
              )}
            </div>

            {allImgs.length > 1 && (
              <div style={{ display:"flex", gap:8, padding:"11px 14px", overflowX:"auto", background:"#f7faff", borderTop:`1px solid ${T.border}`, scrollbarWidth:"none", flexShrink:0 }}>
                {allImgs.map((img,i) => (
                  <div key={i} onClick={() => setImgIdx(i)}
                    style={{ width:58, height:46, borderRadius:10, overflow:"hidden", flexShrink:0, cursor:"pointer", border:i===imgIdx?`2.5px solid ${T.blue6}`:`2px solid ${T.border}`, boxShadow:i===imgIdx?`0 4px 14px rgba(37,99,235,0.28)`:"none", transition:"all .18s" }}>
                    <img src={img} alt={`View ${i+1}`} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => { e.target.src="https://via.placeholder.com/60x46?text=✕"; }} />
                  </div>
                ))}
              </div>
            )}

            {allImgs.length > 1 && (
              <div style={{ display:"flex", justifyContent:"center", gap:5, padding:"8px 0", background:"#f7faff", flexShrink:0 }}>
                {allImgs.map((_,i) => (
                  <button key={i} onClick={() => setImgIdx(i)} style={{ width:i===imgIdx?20:7, height:7, borderRadius:99, border:"none", cursor:"pointer", padding:0, background:i===imgIdx?T.blue6:T.blueM, transition:"all .2s" }} />
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="mh-modal-info-col">
            <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:accentBg, color:accentClr, border:`1px solid ${accentClr}33`, borderRadius:40, padding:"4px 12px", fontSize:11, fontWeight:800, fontFamily:T.font, alignSelf:"flex-start", letterSpacing:"0.3px" }}>
              <Tag size={10} /> {product.category_name}
            </span>

            <h2 style={{ fontFamily:T.fontS, fontSize:"clamp(16px,2.5vw,21px)", fontWeight:800, color:T.ink, lineHeight:1.25, letterSpacing:"-0.3px" }}>
              {product.title}
            </h2>

            <div style={{ display:"flex", alignItems:"baseline", gap:10, flexWrap:"wrap" }}>
              <span style={{ fontFamily:T.fontS, fontSize:"clamp(22px,3.5vw,30px)", fontWeight:900, color:T.blue6, letterSpacing:"-1px" }}>
                ر.ق{Number(product.price).toLocaleString("en-IN")}
              </span>
              {product.is_negotiable && (
                <span style={{ fontSize:12, fontWeight:700, color:"#16a34a", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:40, padding:"3px 10px", fontFamily:T.font }}>Negotiable</span>
              )}
            </div>

            <div style={{ background:"#f7faff", borderRadius:14, padding:"13px 15px", border:`1px solid ${T.border}`, display:"flex", flexDirection:"column", gap:9 }}>
              {[
                { icon:<Layers size={13}/>,     label:"Category",  val:product.category_name },
                { icon:<BadgeCheck size={13}/>, label:"Condition", val:isNew?"Brand New":"Used" },
                { icon:<MapPin size={13}/>,     label:"Location",  val:product.city },
                { icon:<Calendar size={13}/>,   label:"Posted",    val:timeAgo(product.created_at) },
                { icon:<Eye size={13}/>,        label:"Views",     val:product.view_count ?? 0 },
              ].filter(r => r.val !== undefined && r.val !== null && r.val !== "")
               .map(({ icon, label, val }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:T.blueLt, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:T.blue6 }}>{icon}</div>
                  <span style={{ fontSize:12, color:T.muted, fontWeight:600, fontFamily:T.font, minWidth:66 }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:T.ink, marginLeft:"auto", textAlign:"right", fontFamily:T.font, maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{String(val)}</span>
                </div>
              ))}
            </div>

            {product.description && (
              <div>
                <p style={{ fontSize:11, fontWeight:800, color:T.muted, textTransform:"uppercase", letterSpacing:"0.8px", fontFamily:T.font, marginBottom:7 }}>Description</p>
                <p style={{ fontSize:13.5, color:"#334155", fontFamily:T.font, lineHeight:1.7, fontWeight:400 }}>{product.description}</p>
              </div>
            )}

            {product.seller_name && (
              <div style={{ position:"relative" }}>
                <p style={{ fontSize:11, fontWeight:800, color:T.muted, textTransform:"uppercase", letterSpacing:"0.8px", fontFamily:T.font, marginBottom:8 }}>Seller</p>
                <div className="mh-seller-wrap" style={{ position:"relative" }}>
                  <div className="mh-seller-blur" style={{ display:"flex", alignItems:"center", gap:12, background:T.blueLt2, border:`1px solid ${T.blueM}`, borderRadius:14, padding:"12px 16px" }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:`linear-gradient(135deg,${T.blue6},${T.blue5})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:16, fontFamily:T.fontS, flexShrink:0 }}>
                      {product.seller_name?.[0]?.toUpperCase() ?? "S"}
                    </div>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:T.ink, fontFamily:T.font }}>{product.seller_name}</p>
                      <p style={{ fontSize:11.5, color:T.muted, fontFamily:T.font }}>{product.seller_phone || "+968 ×× ×××× ××××"}</p>
                    </div>
                  </div>
                  <div className="mh-seller-gate">
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"8px 16px" }}>
                      <Lock size={16} color={T.blue6} />
                      <span style={{ fontSize:11.5, fontWeight:700, color:T.blue6, fontFamily:T.font, whiteSpace:"nowrap" }}>Hover to peek · Login to contact</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:"auto", paddingTop:4 }}>
              {isOwn ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, height:48, background:T.blueLt, border:`1.5px solid ${T.blueM}`, borderRadius:14, fontSize:14, fontWeight:700, color:T.blue, fontFamily:T.font }}>
                  <Lock size={14} /> This is your listing
                </div>
              ) : userId ? (
                <>
                  <button className="mh-cart-btn"
                    onClick={e => { e.stopPropagation(); onCart(product); }}
                    style={{ height:50, borderRadius:14, border:"none", cursor:"pointer", fontFamily:T.font, fontSize:14.5, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:9, color:"#fff", background:inCart?"linear-gradient(135deg,#059669,#047857)":`linear-gradient(135deg,${T.blue},${T.blue2})`, boxShadow:inCart?"0 6px 20px rgba(5,150,105,0.32)":"0 6px 20px rgba(21,101,192,0.32)" }}>
                    {inCart ? <><CheckCircle size={17}/>Remove from Cart</> : <><ShoppingCart size={17}/>Add to Cart</>}
                  </button>
                  <button onClick={() => window.location.href=`/marketplace/product/${product.slug ?? product.id}`}
                    style={{ height:44, borderRadius:14, border:`2px solid ${T.blue6}`, background:"#fff", color:T.blue6, cursor:"pointer", fontFamily:T.font, fontSize:13.5, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all .15s" }}>
                    <Eye size={15}/> View Full Details
                  </button>
                </>
              ) : (
                <>
                  <a href="/marketplace/login"
                    style={{ height:50, borderRadius:14, textDecoration:"none", background:`linear-gradient(135deg,${T.blue},${T.blue2})`, color:"#fff", fontFamily:T.font, fontSize:14.5, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:9, boxShadow:"0 6px 20px rgba(21,101,192,0.3)" }}>
                    <Lock size={16}/> Login to Buy
                  </a>
                  <p style={{ textAlign:"center", fontSize:12, color:T.muted, fontFamily:T.font, fontWeight:500 }}>Sign in to add to cart or contact the seller</p>
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
   PAGINATION
═══════════════════════════════════════════════════ */
function Pagination({ page, totalPages, onChange }) {
  const pages = [];
  const s = Math.max(1, page-2), e = Math.min(totalPages, page+2);
  for (let i=s; i<=e; i++) pages.push(i);
  const base = { width:38, height:38, borderRadius:10, background:"#fff", border:`1.5px solid ${T.border}`, fontSize:13, fontWeight:600, color:T.slate, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:T.font, boxShadow:"0 2px 8px rgba(21,101,192,0.06)" };
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, margin:"30px 0 10px", flexWrap:"wrap" }} role="navigation" aria-label="Pagination">
      <button className="mh-pgbtn" style={{ ...base, opacity:page===1?.42:1 }} disabled={page===1} onClick={() => onChange(page-1)} aria-label="Previous page"><ChevronLeft size={16}/></button>
      {s>1 && <><button className="mh-pgbtn" style={base} onClick={() => onChange(1)}>1</button>{s>2 && <span style={{ fontSize:15, color:T.muted }}>…</span>}</>}
      {pages.map(p => (
        <button key={p} className={`mh-pgbtn${p===page?" cur":""}`} style={{ ...base, background:p===page?T.blue:"#fff", color:p===page?"#fff":T.slate, borderColor:p===page?T.blue:T.border }} onClick={() => onChange(p)} aria-label={`Page ${p}`} aria-current={p===page?"page":undefined}>{p}</button>
      ))}
      {e<totalPages && <>{e<totalPages-1 && <span style={{ fontSize:15, color:T.muted }}>…</span>}<button className="mh-pgbtn" style={base} onClick={() => onChange(totalPages)}>{totalPages}</button></>}
      <button className="mh-pgbtn" style={{ ...base, opacity:page===totalPages?.42:1 }} disabled={page===totalPages} onClick={() => onChange(page+1)} aria-label="Next page"><ChevronRight size={16}/></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════ */
function Sidebar({ totalCount, cartSize, categories, cities, activeCity }) {
  const card = { background:"#fff", borderRadius:18, border:`1px solid ${T.border}`, padding:"16px 18px", boxShadow:"0 2px 16px rgba(21,101,192,0.07)" };
  return (
    <aside style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={card}>
        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:T.blueLt, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Zap size={15} color={T.blue6} />
          </div>
          <span style={{ fontSize:14, fontWeight:800, color:T.ink, fontFamily:T.font }}>Marketplace</span>
        </div>
        <p style={{ fontFamily:T.font, fontSize:11.5, color:T.muted, marginBottom:14, fontWeight:500 }}>{totalCount>0?`${totalCount} active listings`:"Browse all categories"}</p>
        {[
          { label:"Categories", val:categories.length, clr:T.blue5 },
          { label:"Cities",     val:cities.length,     clr:"#f59e0b" },
          { label:"In Cart",    val:cartSize,           clr:"#16a34a" },
        ].map(r => (
          <div key={r.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:T.slate, fontFamily:T.font, fontWeight:500 }}>
              <span style={{ width:10, height:10, borderRadius:"50%", background:r.clr, flexShrink:0 }} />{r.label}
            </div>
            <span style={{ fontFamily:T.fontS, fontSize:16, fontWeight:800, color:T.ink }}>{r.val}</span>
          </div>
        ))}
        {activeCity!=="All Cities" && (
          <div style={{ marginTop:12, display:"flex", alignItems:"center", gap:7, background:T.blueLt, border:`1px solid ${T.blueM}`, borderRadius:40, padding:"6px 12px" }}>
            <MapPin size={11} color={T.blue6} style={{ flexShrink:0 }} />
            <span style={{ fontSize:11.5, fontWeight:700, color:T.blue6, fontFamily:T.font, flex:1 }}>{activeCity}</span>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#34d399", animation:"pulse 1.6s infinite", flexShrink:0 }} />
          </div>
        )}
        <div style={{ height:5, background:T.border, borderRadius:99, overflow:"hidden", marginTop:14 }}>
          <div style={{ height:"100%", borderRadius:99, background:`linear-gradient(90deg,${T.blue6},#16a34a)`, width:cartSize>0?"62%":"8%", transition:"width 0.8s cubic-bezier(.22,1,.36,1)" }} />
        </div>
      </div>

      <div style={card}>
        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"#fef3c7", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Star size={15} color="#d97706" />
          </div>
          <span style={{ fontSize:14, fontWeight:800, color:T.ink, fontFamily:T.font }}>Quick Tips</span>
        </div>
        <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:10 }}>
          {[
            "Tap the cart to compare before deciding.",
            "Heart saves listings for later.",
            "Hover over seller name to reveal contact.",
            "Condition badges show New vs Used value.",
          ].map((tip,i) => (
            <li key={i} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12.5, color:T.slate, fontFamily:T.font, lineHeight:1.55 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:T.blue6, marginTop:5, flexShrink:0, opacity:0.65 }} />{tip}
            </li>
          ))}
        </ul>
      </div>

      <AdSlot variant="sidebar" />
      <div style={{ position:"sticky", top:80 }}>
        <AdSlot variant="sidebar" />
      </div>
    </aside>
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
  const [activeCat,      setActiveCat]      = useState("All");
  const [activeCity,     setActiveCity]     = useState("All Cities");
  const [cartSet,        setCartSet]        = useState(new Set());
  const [modalProduct,   setModalProduct]   = useState(null);
  const { toast, add }                      = useToast();

  const userId = useMemo(() => Number(localStorage.getItem("user_id") ?? localStorage.getItem("userId") ?? 0) || 0, []);

  const safe   = useMemo(() => Array.isArray(products) ? products : [], [products]);
  const cats   = useMemo(() => [...new Set(safe.map(p => p?.category_name).filter(Boolean))].sort(), [safe]);
  const cities = useMemo(() => [...new Set(safe.map(p => p?.city).filter(Boolean))].sort(), [safe]);
  const totalNew  = useMemo(() => safe.filter(p => p.condition==="new").length,  [safe]);
  const totalUsed = useMemo(() => safe.filter(p => p.condition==="used").length, [safe]);

  const filtered = useMemo(() => safe.filter(p => {
    if (!p) return false;
    const q = search.toLowerCase();
    const mS = !search || p.title?.toLowerCase().includes(q) || p.category_name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q);
    const mC = activeCat==="All" || (activeCat==="New"&&p.condition==="new") || (activeCat==="Used"&&p.condition==="used") || (activeCat==="Negotiable"&&p.is_negotiable) || p.category_name===activeCat;
    const mCi = activeCity==="All Cities" || p.city===activeCity;
    return mS && mC && mCi;
  }), [safe, search, activeCat, activeCity]);

  const loadProducts = useCallback(async (pg) => {
    setLoading(true); setError(null);
    try {
      const res  = await fetchHomeProducts({ page: pg, limit: 12 });
      const data = res?.data || res || [];
      setProducts(Array.isArray(data) ? data : []);
      setTotalPages(res?.total_pages || 1);
      setTotalCount(res?.count || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load listings. Please try again.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProducts(page); }, [page, loadProducts]);

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

  const handleView  = useCallback(p => setModalProduct(p), []);
  const handleClose = useCallback(() => setModalProduct(null), []);
  const handlePage  = useCallback(p => { setPage(p); window.scrollTo({ top:0, behavior:"smooth" }); }, []);
  const handleCity  = useCallback(c => { setActiveCity(c); setPage(1); }, []);

  return (
    <div>
      <InjectStyles />
      <SEOMeta
        title="Marketplace — Find Local Deals in Kerala | Buy &amp; Sell Near You"
        description="Discover amazing deals on electronics, furniture, fashion and more. Browse thousands of local listings in Kerala. Buy and sell safely with our trusted marketplace."
        keywords="marketplace Kerala, buy sell locally, second hand goods, deals Kerala, electronics furniture fashion"
      />
      <ToastPill toast={toast} />

      {modalProduct && (
        <ProductModal
          product={modalProduct}
          onClose={handleClose}
          onCart={handleCart}
          cartSet={cartSet}
          userId={userId}
        />
      )}

      <div style={{ minHeight:"100vh", background:T.bg, fontFamily:T.font }}>
        <HeroBanner totalCount={loading?"–":totalCount} totalNew={loading?"–":totalNew} totalUsed={loading?"–":totalUsed} />

        {/* Mobile top ad */}
        <div className="mh-topad" style={{ display:"none", padding:"14px 14px 0" }}>
          <AdSlot variant="banner" />
        </div>

        <main className="mh-wrap" style={{ maxWidth:1240, margin:"0 auto", padding:"clamp(14px,3vw,28px) clamp(12px,3vw,28px)" }}>

          <div className="mh-desktop-ad" style={{ marginBottom:20 }}>
            <AdSlot variant="banner" />
          </div>

          <SearchBar value={search} onChange={setSearch} />

          {!loading && (
            <>
              <CategoryBar categories={cats} active={activeCat} setActive={setActiveCat} />
              <CityFilter cities={cities} active={activeCity} setActive={handleCity} />
            </>
          )}

          <div className="mh-sechdr" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
            <div>
              <h2 style={{ fontFamily:T.fontD, fontSize:"clamp(17px,3vw,22px)", fontWeight:900, color:T.ink, letterSpacing:"-0.03em" }}>
                {activeCat==="All" ? "All Listings" : activeCat}
                {activeCity!=="All Cities" && <span style={{ fontFamily:T.font, fontSize:"clamp(13px,2vw,15px)", fontWeight:600, color:T.blue5, marginLeft:8 }}>· {activeCity}</span>}
              </h2>
              <p style={{ fontSize:13, color:T.muted, fontFamily:T.font, marginTop:3 }}>
                {loading ? "Loading listings…" : `${filtered.length} listing${filtered.length!==1?"s":""}${totalCount>filtered.length?` of ${totalCount}`:""} found`}
              </p>
            </div>
            {cartSet.size>0 && (
              <div style={{ display:"flex", alignItems:"center", gap:7, background:"#f0fdf4", color:"#16a34a", border:"1.5px solid #bbf7d0", borderRadius:40, padding:"7px 16px", fontSize:13, fontWeight:700, fontFamily:T.font, animation:"popIn .3s ease both", flexShrink:0 }}>
                <ShoppingCart size={14}/> {cartSet.size} in cart
              </div>
            )}
          </div>

          <div className="mh-layout" style={{ display:"grid", gridTemplateColumns:"1fr 220px", gap:22, alignItems:"flex-start" }}>

            <div style={{ minWidth:0 }}>
              {error && !loading && (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"#fff1f2", border:"1px solid #fecdd3", borderRadius:14, padding:"14px 16px", fontSize:13.5, color:"#9f1239", fontFamily:T.font, marginBottom:18 }}>
                  <X size={17} color="#e11d48" style={{ flexShrink:0 }}/>
                  <span style={{ flex:1 }}>{error}</span>
                  <button onClick={() => loadProducts(page)} style={{ padding:"7px 16px", background:`linear-gradient(135deg,${T.blue6},${T.blue7})`, color:"#fff", border:"none", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:T.font }}>Retry</button>
                </div>
              )}

              <div className="mh-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:16 }}>
                {loading
                  ? Array.from({length:8}).map((_,i) => <SkeletonCard key={i}/>)
                  : filtered.length===0
                    ? (
                      <div style={{ gridColumn:"1/-1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                        <Package size={60} color={T.blueM3} style={{ marginBottom:18, animation:"floatOrb 4s ease-in-out infinite" }}/>
                        <h3 style={{ fontFamily:T.fontS, fontSize:18, fontWeight:800, color:T.ink, marginBottom:8 }}>No listings found</h3>
                        <p style={{ fontSize:13.5, color:T.muted, fontFamily:T.font }}>
                          {activeCity!=="All Cities" ? `No listings in ${activeCity}` : "Try adjusting your search or filter"}
                        </p>
                        {activeCity!=="All Cities" && (
                          <button onClick={() => handleCity("All Cities")} style={{ marginTop:18, padding:"9px 22px", background:`linear-gradient(135deg,${T.blue6},${T.blue7})`, color:"#fff", border:"none", borderRadius:40, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:T.font }}>
                            Show all cities
                          </button>
                        )}
                      </div>
                    )
                    : filtered.map((p,i) => (
                      <ProductCard key={p.id} product={p} idx={i} onCart={handleCart} onView={handleView} cartSet={cartSet} userId={userId}/>
                    ))
                }
              </div>

              {!loading && filtered.length>0 && <div style={{ marginTop:24 }}><AdSlot variant="inline"/></div>}
              {!loading && totalPages>1 && <Pagination page={page} totalPages={totalPages} onChange={handlePage}/>}
            </div>

            <div className="mh-sidebar" style={{ display:"flex", flexDirection:"column", gap:16, flexShrink:0, animation:"fadeUp .45s ease both", animationDelay:"0.18s" }}>
              <Sidebar totalCount={totalCount} cartSize={cartSet.size} categories={cats} cities={cities} activeCity={activeCity}/>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}