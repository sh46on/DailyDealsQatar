import { useEffect, useState } from "react";
import {
  fetchSavedProducts,
  toggleSaveProduct,
  requestProduct,
} from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";

/* ═══════════════════════════════════════════════════
   DESIGN TOKENS — mirrored 1-to-1 from MarketplaceProfile
═══════════════════════════════════════════════════ */
const FONT   = "'Plus Jakarta Sans', sans-serif";   // replaces Sora + DM Sans
const FONT_D = "'Fraunces', serif";                 // display / headings

const BLUE   = "#1565c0";
const BLUE2  = "#1976d2";
const BLUELT = "#e3f2fd";
const BLUEM  = "#bfdbfe";

/* ═══════════════════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════════════════ */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Keyframes (shared names with Profile / Home / Interests) ── */
  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;} }
  @keyframes fadeIn    { from{opacity:0;}to{opacity:1;} }
  @keyframes shimmer   { 0%{background-position:-600px 0;}100%{background-position:600px 0;} }
  @keyframes floatOrb  { 0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);} }
  @keyframes waveSlide { to{transform:translateX(-50%);} }
  @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(1.35);} }
  @keyframes toastIn   { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;} }
  @keyframes mspSpin   { to{transform:rotate(360deg);} }
  @keyframes mspSlideOut {
    from{opacity:1;max-height:200px;transform:translateX(0);}
    to  {opacity:0;max-height:0;   transform:translateX(28px);padding:0;margin:0;}
  }

  /* ── Page ── */
  .msp-page {
    font-family: ${FONT};
    background: #f0f6ff;          /* Profile's page background */
    min-height: 100vh;
  }

  /* ── Hero ── */
  .msp-hero {
    position: relative;
    background: linear-gradient(130deg, #0f3460 0%, ${BLUE} 50%, ${BLUE2} 100%);
    overflow: hidden;
  }
  /* dot grid — identical to Profile */
  .msp-hero-dots {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  /* floating orbs — same floatOrb animation, no blur */
  .msp-orb {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    animation: floatOrb 7s ease-in-out infinite;
    pointer-events: none;
  }
  /* dual-path wave — same waveSlide as Profile */
  .msp-wave-svg {
    position: absolute;
    bottom: 0; left: 0;
    width: 200%; height: 60px;
    z-index: 1;
    pointer-events: none;
  }
  .msp-hero-inner {
    position: relative;
    z-index: 2;
    max-width: 960px;
    margin: 0 auto;
    padding: clamp(36px,6vw,64px) clamp(16px,5vw,48px) clamp(52px,7vw,80px);
  }

  /* eyebrow chip — Profile's glass pill */
  .msp-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.13);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 40px;
    padding: 5px 14px;
    margin-bottom: 16px;
    backdrop-filter: blur(8px);
    font-family: ${FONT};
    font-size: 12px;
    font-weight: 700;
    color: rgba(255,255,255,0.90);
    letter-spacing: 0.04em;
    animation: fadeIn .4s ease both;
  }
  .msp-eyebrow-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #34d399;
    animation: pulse 1.6s infinite;
    flex-shrink: 0;
  }

  /* hero title — Fraunces 900, same as Profile */
  .msp-hero h1 {
    font-family: ${FONT_D};
    font-size: clamp(26px, 5vw, 42px);
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.5px;
    line-height: 1.15;
    margin-bottom: 10px;
    animation: fadeUp .45s ease both;
    animation-delay: .08s;
  }
  .msp-hero-sub {
    color: rgba(255,255,255,0.70);
    font-family: ${FONT};
    font-size: clamp(13px, 2vw, 15px);
    font-weight: 400;
    line-height: 1.6;
    max-width: 440px;
    animation: fadeUp .45s ease both;
    animation-delay: .16s;
  }

  /* count badge — Profile's glass stat pill */
  .msp-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    margin-top: 24px;
    background: rgba(255,255,255,0.13);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.22);
    border-radius: 40px;
    padding: 8px 18px;
    font-family: ${FONT};
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    animation: fadeUp .45s ease both;
    animation-delay: .24s;
    cursor: default;
    transition: background .2s;
  }
  .msp-hero-badge:hover { background: rgba(255,255,255,0.22); }

  /* ── Ad slots — Profile's hatched-diagonal placeholder ── */
  .msp-ad-wrap  { max-width: 960px; margin: 0 auto; padding: 0 clamp(12px,4vw,24px); }
  .msp-ad-top   { margin-top: 20px; }
  .msp-ad-bottom{ padding-bottom: 40px; margin-top: 4px; }

  .msp-ad-slot {
    width: 100%;
    background: repeating-linear-gradient(
      45deg,#f8fafc,#f8fafc 10px,#eef3fa 10px,#eef3fa 20px
    );
    border: 1.5px dashed #cbd5e1;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: box-shadow .18s, transform .18s;
  }
  .msp-ad-slot:hover { box-shadow: 0 8px 28px rgba(21,101,192,0.12); transform: translateY(-2px); }
  .msp-ad-label {
    font-size: 9.5px; font-weight: 700;
    color: #94a3b8; letter-spacing: 1px;
    text-transform: uppercase; font-family: ${FONT};
  }
  .msp-ad-sub { font-size: 12px; color: #cbd5e1; font-family: ${FONT}; font-weight: 600; }
  .msp-ad-leaderboard { height: 90px; max-width: 728px; margin: 0 auto; }
  .msp-ad-rect-wrap { display: flex; justify-content: center; margin: 2px 0; }
  .msp-ad-rect { height: 250px; max-width: 300px; width: 100%; }

  /* ── Content ── */
  .msp-content {
    max-width: 960px;
    margin: 0 auto;
    padding: 20px clamp(12px,4vw,24px) 48px;
  }

  /* ── Empty state ── */
  .msp-empty {
    text-align: center;
    padding: clamp(48px,8vw,88px) 24px;
    animation: fadeUp .45s ease both;
  }
  .msp-empty-icon {
    width: 84px; height: 84px;
    background: ${BLUELT};
    border: 1.5px solid ${BLUEM};
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
    color: ${BLUE};
    animation: floatOrb 4s ease-in-out infinite;
  }
  .msp-empty h3 {
    font-family: ${FONT_D};
    font-size: clamp(18px,4vw,24px);
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 8px;
    letter-spacing: -0.03em;
  }
  .msp-empty p { color: #94a3b8; font-size: 14px; line-height: 1.6; font-family: ${FONT}; }

  /* ── Card grid ── */
  .msp-grid { display: flex; flex-direction: column; gap: 14px; }

  /* ── Card — Profile card dimensions + border + shadow ── */
  .msp-card {
    background: #fff;
    border-radius: 22px;                                   /* Profile radius */
    border: 1.5px solid #e0ecfb;                           /* Profile border */
    box-shadow: 0 4px 32px rgba(21,101,192,0.09),          /* Profile shadow */
                0 1px 4px rgba(0,0,0,0.04);
    display: grid;
    grid-template-columns: 128px 1fr auto;
    overflow: hidden;
    transition: transform .3s cubic-bezier(.22,1,.36,1),
                box-shadow .3s cubic-bezier(.22,1,.36,1),
                border-color .3s cubic-bezier(.22,1,.36,1);
    animation: fadeUp .42s cubic-bezier(.22,1,.36,1) both;
    position: relative;
    min-height: 128px;
  }
  .msp-card:hover {
    box-shadow: 0 16px 48px rgba(21,101,192,0.16), 0 2px 8px rgba(21,101,192,0.07);
    transform: translateY(-4px);
    border-color: ${BLUEM};
  }
  .msp-card.removing { animation: mspSlideOut .32s cubic-bezier(.22,1,.36,1) forwards; }

  /* ── Image ── */
  .msp-img-wrap {
    width: 128px; height: 128px;
    overflow: hidden;
    background: ${BLUELT};
    flex-shrink: 0;
    position: relative;
  }
  .msp-img-wrap img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: transform .42s cubic-bezier(.22,1,.36,1);
  }
  .msp-card:hover .msp-img-wrap img { transform: scale(1.07); }
  .msp-img-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    color: #93c5fd;
    background: linear-gradient(135deg, ${BLUELT}, #ddeeff);
  }

  /* ── Card body ── */
  .msp-card-body {
    padding: 18px 12px 16px 18px;
    display: flex; flex-direction: column;
    justify-content: center; gap: 7px;
    min-width: 0;
  }
  .msp-card-title {
    font-family: ${FONT};
    font-size: clamp(13px, 2.2vw, 16px);
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    letter-spacing: -0.02em; line-height: 1.3;
  }
  .msp-card-price {
    font-family: ${FONT_D};                                /* Fraunces for price */
    font-size: clamp(17px, 3.5vw, 22px);
    font-weight: 800;
    color: ${BLUE};
    letter-spacing: -0.03em; line-height: 1;
  }
  .msp-card-city {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: ${FONT};
    font-size: 11.5px; font-weight: 600;
    color: #3b4a6b;
    background: ${BLUELT};
    border: 1px solid ${BLUEM};
    border-radius: 40px;
    padding: 3px 10px 3px 7px;
    width: fit-content;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* ── Actions column ── */
  .msp-actions {
    display: flex; flex-direction: column;
    align-items: stretch; gap: 8px;
    padding: 14px 16px 14px 10px;
    justify-content: center;
    flex-shrink: 0; min-width: 112px;
    border-left: 1px solid #e0ecfb;
  }

  /* base button — matches Profile's input/button style */
  .msp-btn {
    display: inline-flex; align-items: center;
    justify-content: center; gap: 6px;
    font-family: ${FONT};
    font-size: 12.5px; font-weight: 700;
    border-radius: 10px;
    padding: 9px 14px;
    cursor: pointer;
    transition: background .18s, color .18s, border-color .18s,
                transform .18s, box-shadow .18s, opacity .15s;
    white-space: nowrap; outline: none;
    width: 100%; border: 1.5px solid;
  }
  .msp-btn svg { flex-shrink: 0; }

  /* unsave — red semantic, consistent with other pages */
  .msp-btn-unsave {
    background: #fff1f2;
    color: #dc2626;
    border-color: #fecdd3;
  }
  .msp-btn-unsave:hover:not(:disabled) {
    background: #fee2e2;
    border-color: #fca5a5;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(220,38,38,0.14);
  }

  /* request — Profile's blue gradient button */
  .msp-btn-request {
    background: linear-gradient(135deg, ${BLUE} 0%, ${BLUE2} 100%);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 3px 12px rgba(21,101,192,0.28);
  }
  .msp-btn-request:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(21,101,192,0.34);
    filter: brightness(1.06);
  }
  .msp-btn:disabled { opacity: .5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

  /* ── Skeleton — Profile's 90-deg shimmer ── */
  .msp-skeleton {
    border-radius: 22px;
    height: 128px;
    background: linear-gradient(90deg,#f0f4f8 25%,#e2ecf7 50%,#f0f4f8 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s linear infinite;
  }

  /* ── Toast — Profile's bottom-center semantic style ── */
  .msp-toast {
    position: fixed;
    bottom: 28px; left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex; align-items: center; gap: 10px;
    padding: 13px 22px;
    border-radius: 14px;
    font-family: ${FONT}; font-size: 13.5px; font-weight: 600;
    box-shadow: 0 12px 40px rgba(0,0,0,0.14);
    animation: toastIn .3s cubic-bezier(.34,1.56,.64,1) both;
    white-space: nowrap; pointer-events: none;
    /* success colours by default — override via class */
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    color: #15803d;
  }
  .msp-toast.error {
    background: #fff1f2;
    border-color: #fca5a5;
    color: #dc2626;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .msp-card { grid-template-columns: 108px 1fr auto; min-height: 108px; }
    .msp-img-wrap { width: 108px; height: 108px; }
    .msp-actions { min-width: 96px; padding: 12px 12px 12px 8px; gap: 7px; }
    .msp-btn { font-size: 12px; padding: 8px 10px; }
    .msp-card-body { padding: 14px 10px 12px 14px; }
  }
  @media (max-width: 480px) {
    .msp-card { grid-template-columns: 88px 1fr auto; min-height: 88px; border-radius: 16px; }
    .msp-img-wrap { width: 88px; height: 88px; }
    .msp-hero-inner { padding: 24px 14px 68px; }
    .msp-content { padding: 14px 12px 40px; }
    .msp-grid { gap: 10px; }
    .msp-card-body { padding: 10px 8px 10px 11px; gap: 5px; }
    .msp-card-title { font-size: 12.5px; }
    .msp-card-price { font-size: 16px; }
    .msp-card-city  { font-size: 10.5px; }
    .msp-actions { min-width: 82px; padding: 9px 10px 9px 4px; gap: 6px; border-left: none; border-top: 1px solid #e0ecfb; }
    .msp-card { grid-template-columns: 88px 1fr; grid-template-rows: 1fr auto; }
    .msp-actions { grid-column: 1 / -1; flex-direction: row; }
    .msp-btn { font-size: 11.5px; padding: 7px 10px; border-radius: 8px; }
    .msp-ad-leaderboard { height: 50px; max-width: 320px; }
  }
  @media (max-width: 360px) {
    .msp-card { grid-template-columns: 76px 1fr; }
    .msp-img-wrap { width: 76px; height: 76px; }
    .msp-btn-label { display: none; }
    .msp-btn { padding: 8px; }
  }
`;

/* ═══════════════════════════════════════════════════
   SVG ICONS  (unchanged from original)
═══════════════════════════════════════════════════ */
const Icon = {
  Bookmark: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  BookmarkFilled: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill="currentColor" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  MapPin: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  X: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Send: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Spinner: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "mspSpin 0.75s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  ShoppingBag: ({ size = 36 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  CheckCircle: ({ size = 17 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════
   TOAST  — Profile's bottom-center semantic style
═══════════════════════════════════════════════════ */
function Toast({ message, visible, type = "success" }) {
  if (!visible) return null;
  return (
    <div className={`msp-toast${type === "error" ? " error" : ""}`}>
      <Icon.CheckCircle />
      {message}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AD SLOTS  — Profile's hatched-diagonal placeholder
═══════════════════════════════════════════════════ */
function AdLeaderboard({ id }) {
  return (
    <div className="msp-ad-slot msp-ad-leaderboard" id={id} aria-label="Advertisement">
      <span className="msp-ad-label">Advertisement</span>
      <span className="msp-ad-sub">728 × 90 — Leaderboard Ad</span>
    </div>
  );
}
function AdRect({ id }) {
  return (
    <div className="msp-ad-rect-wrap">
      <div className="msp-ad-slot msp-ad-rect" id={id} aria-label="Advertisement">
        <span className="msp-ad-label">Advertisement</span>
        <span className="msp-ad-sub">300 × 250 — Medium Rectangle</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRODUCT CARD  — Profile card dimensions + border + shadow
═══════════════════════════════════════════════════ */
function ProductCard({ product, onUnsave, onRequest, delay = 0 }) {
  const [removing,   setRemoving]   = useState(false);
  const [requesting, setRequesting] = useState(false);

  const handleUnsave = () => {
    setRemoving(true);
    setTimeout(() => onUnsave(product.product_id), 320);
  };
  const handleRequest = async () => {
    setRequesting(true);
    await onRequest(product.product_id);
    setRequesting(false);
  };

  return (
    <div
      className={`msp-card${removing ? " removing" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image */}
      <div className="msp-img-wrap">
        {product.image
          ? <img src={product.image} alt={product.title} loading="lazy" />
          : (
            <div className="msp-img-placeholder">
              <Icon.ShoppingBag size={36} />
            </div>
          )
        }
      </div>

      {/* Info */}
      <div className="msp-card-body">
        <h3 className="msp-card-title" title={product.title}>
          {product.title}
        </h3>
        <p className="msp-card-price">
           ر.ق {Number(product.price).toLocaleString("en-IN")}
        </p>
        {product.city && (
          <span className="msp-card-city">
            <Icon.MapPin />
            {product.city}
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="msp-actions">
        <button
          className="msp-btn msp-btn-unsave"
          onClick={handleUnsave}
          disabled={removing}
          aria-label="Remove from saved"
        >
          <Icon.X />
          <span className="msp-btn-label">Unsave</span>
        </button>
        <button
          className="msp-btn msp-btn-request"
          onClick={handleRequest}
          disabled={requesting}
          aria-label="Send request"
        >
          {requesting
            ? <><Icon.Spinner size={13} /><span className="msp-btn-label">Sending…</span></>
            : <><Icon.Send size={13} /><span className="msp-btn-label">Request</span></>
          }
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN  — MarketplaceSaved
═══════════════════════════════════════════════════ */
export default function MarketplaceSaved() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState({ message: "", visible: false });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchSavedProducts();
      setItems(res.data?.data || res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800);
  };

  const handleUnsave = async (id) => {
    await toggleSaveProduct(id);
    setItems(prev => prev.filter(p => p.product_id !== id));
    showToast("Removed from saved");
  };

  const handleRequest = async (id) => {
    await requestProduct(id);
    showToast("Request sent successfully ✓");
  };

  // Interleave 300×250 rect ads every 4 cards
  const renderItems = () => {
    const out = [];
    items.forEach((p, i) => {
      out.push(
        <ProductCard
          key={p.product_id ?? p.id}
          product={p}
          onUnsave={handleUnsave}
          onRequest={handleRequest}
          delay={i * 55}
        />
      );
      if ((i + 1) % 4 === 0 && i + 1 < items.length) {
        out.push(<AdRect key={`ad-rect-${i}`} id={`ad-rect-${i}`} />);
      }
    });
    return out;
  };

  const count = (items || []).length;

  return (
    <MarketplaceLayout>
      <style>{styles}</style>

      <div className="msp-page">

        {/* ════════════════════════════════════
            HERO — Profile's exact structure:
            dot-grid div + floatOrb orbs + dual-path waveSlide + Fraunces h1
        ════════════════════════════════════ */}
        <div className="msp-hero">
          {/* Dot grid */}
          <div className="msp-hero-dots" />

          {/* Floating orbs — no blur, floatOrb animation */}
          <div className="msp-orb" style={{ width:260, height:260, top:"-90px", right:"-60px", animationDelay:"0s" }} />
          <div className="msp-orb" style={{ width:140, height:140, bottom:"10px", left:"50px",  animationDelay:"2s" }} />
          <div className="msp-orb" style={{ width:90,  height:90,  top:"40px",   left:"38%",   animationDelay:"4s", opacity:.6 }} />

          {/* Dual-path wave — waveSlide, same fill colours as Profile */}
          <svg className="msp-wave-svg" viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path
              style={{ animation: "waveSlide 10s linear infinite" }}
              d="M0,30 C240,55 480,5 720,30 C960,55 1200,5 1440,30 C1680,55 1920,5 2160,30 L2160,60 L0,60 Z"
              fill="#f0f6ff"
            />
            <path
              style={{ animation: "waveSlide 15s linear infinite reverse" }}
              d="M0,42 C300,18 600,56 900,38 C1200,20 1500,52 1800,36 C2000,24 2160,46 2160,40 L2160,60 L0,60 Z"
              fill="#e3f2fd" opacity="0.7"
            />
          </svg>

          {/* Inner content */}
          <div className="msp-hero-inner">
            {/* Eyebrow — glass pill */}
            <div className="msp-eyebrow">
              <span className="msp-eyebrow-dot" />
              <Icon.Bookmark size={13} />
              My Wishlist
            </div>

            {/* Title — Fraunces 900 */}
            <h1>
              Saved{" "}
              <span style={{
                background: "linear-gradient(90deg, #93c5fd, #34d399)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                Products
              </span>
            </h1>

            <p className="msp-hero-sub">
              Items you've bookmarked — ready whenever you are.
            </p>

            {/* Count badge — glass stat pill */}
            {!loading && (
              <div className="msp-hero-badge">
                <Icon.BookmarkFilled size={14} />
                {count} {count === 1 ? "item" : "items"} saved
              </div>
            )}
          </div>
        </div>

        {/* ── Top leaderboard ad ── */}
        <div className="msp-ad-wrap msp-ad-top">
          <AdLeaderboard id="ad-top-leaderboard" />
        </div>

        {/* ── Product list ── */}
        <div className="msp-content">
          {loading ? (
            <div className="msp-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="msp-skeleton" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          ) : count === 0 ? (
            <div className="msp-empty">
              <div className="msp-empty-icon">
                <Icon.ShoppingBag size={38} />
              </div>
              <h3>Nothing saved yet</h3>
              <p>Browse the marketplace and bookmark items you love.</p>
            </div>
          ) : (
            <div className="msp-grid">{renderItems()}</div>
          )}
        </div>

        {/* ── Bottom leaderboard ad ── */}
        {!loading && count > 0 && (
          <div className="msp-ad-wrap msp-ad-bottom">
            <AdLeaderboard id="ad-bottom-leaderboard" />
          </div>
        )}
      </div>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </MarketplaceLayout>
  );
}