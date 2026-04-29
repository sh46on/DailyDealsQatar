import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import UserLayout from "../UserComponents/UserLayout";
import { BASE_URL, getUserDashboard, toggleSave } from "./api/userApi";
import FlyerModal from "./modal/FlyerModal";
import {
  Search, Bookmark, BookmarkCheck, FileText, Tag,
  Building2, X, Flame, ShoppingCart, Heart,
  Stethoscope, Scissors, Shirt, Home, Globe, Grid,
  ChevronLeft, ChevronRight, SlidersHorizontal, Check,
  Zap, Clock, Inbox, Package, ZoomIn, Sparkles,
  Store, Utensils, Leaf, Star, ArrowRight, TrendingUp,
  Eye, Calendar, Filter, RefreshCw, Percent, MapPin,
  Award, BadgeCheck,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { getImageUrl } from "../api/media";
import ReviewModal from "./modal/ReviewModal";

const BASE = BASE_URL;

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

/* ─── DESIGN TOKENS ─── */
const T = {
  red:         "#E30613",
  redDark:     "#B80010",
  redDeep:     "#7F0009",
  redLight:    "#FFF0F0",
  redGlow:     "rgba(227,6,19,0.18)",
  dark:        "#0D0F14",
  darkMid:     "#1A1D27",
  charcoal:    "#2D3142",
  slate:       "#4A4E6A",
  muted:       "#8B8FA8",
  subtle:      "#C4C6D6",
  border:      "#EAEBF4",
  borderLight: "#F2F3FA",
  bg:          "#F4F5FB",
  bgCard:      "#FAFBFF",
  white:       "#FFFFFF",
  success:     "#00C48C",
  warning:     "#F59E0B",
  gold:        "#FFB800",
  overlay:     "rgba(13,15,20,0.6)",
};

const FONT_URL =
  "https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@300,400,500,700,800&f[]=clash-display@400,500,600,700&display=swap";

/* ─── CATEGORY META ─── */
const CAT_META = {
  "supermarket":  { label: "Supermarkets",     Icon: ShoppingCart, accent: "#059669", bg: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", pill: "#D1FAE5", pillTx: "#065F46", glow: "rgba(5,150,105,0.2)" },
  "restaurant":   { label: "Restaurants",      Icon: Utensils,     accent: "#EA580C", bg: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", pill: "#FFEDD5", pillTx: "#9A3412", glow: "rgba(234,88,12,0.2)" },
  "health":       { label: "Health & Clinics", Icon: Stethoscope,  accent: "#2563EB", bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", pill: "#DBEAFE", pillTx: "#1E3A8A", glow: "rgba(37,99,235,0.2)" },
  "beauty":       { label: "Beauty & Spas",    Icon: Scissors,     accent: "#DB2777", bg: "linear-gradient(135deg,#FDF2F8,#FCE7F3)", pill: "#FCE7F3", pillTx: "#831843", glow: "rgba(219,39,119,0.2)" },
  "fashion":      { label: "Fashion & Sports", Icon: Shirt,        accent: "#7C3AED", bg: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", pill: "#EDE9FE", pillTx: "#4C1D95", glow: "rgba(124,58,237,0.2)" },
  "home":         { label: "Home & Garden",    Icon: Home,         accent: "#0D9488", bg: "linear-gradient(135deg,#F0FDFA,#CCFBF1)", pill: "#CCFBF1", pillTx: "#134E4A", glow: "rgba(13,148,136,0.2)" },
  "online":       { label: "Online Deals",     Icon: Globe,        accent: "#D97706", bg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", pill: "#FEF3C7", pillTx: "#78350F", glow: "rgba(217,119,6,0.2)" },
  "sports":       { label: "Sports",           Icon: Zap,          accent: "#0EA5E9", bg: "linear-gradient(135deg,#F0F9FF,#E0F2FE)", pill: "#E0F2FE", pillTx: "#0C4A6E", glow: "rgba(14,165,233,0.2)" },
};
const CAT_ALL = { label: "All Deals", Icon: Sparkles, accent: T.red, bg: `linear-gradient(135deg,#FFF0F0,#FFE0E0)`, pill: "#FECDD3", pillTx: "#881337", glow: T.redGlow };
const catMeta = (type) => CAT_META[type?.toLowerCase()] || CAT_ALL;

/* ─── AVATAR COLOR PALETTES ─── */
const AVATAR_PALETTES = [
  { bg: "#EEF2FF", text: "#3730A3" },
  { bg: "#F0FDF4", text: "#166534" },
  { bg: "#FFF7ED", text: "#9A3412" },
  { bg: "#FDF2F8", text: "#9D174D" },
  { bg: "#F0FDFA", text: "#115E59" },
  { bg: "#FEFCE8", text: "#854D0E" },
  { bg: "#FEF2F2", text: "#991B1B" },
  { bg: "#F5F3FF", text: "#4C1D95" },
];

/* ─── PDF URL BUILDER ─── */
function buildPdfUrl(raw) {
  if (!raw) return null;
  let url = raw.replace(/["']/g, "").trim();
  try { url = decodeURIComponent(url); } catch {}
  if (url.startsWith("http")) return url;
  if (url.startsWith("/media/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/media/${url}`;
}

/* ─── LAZY VISIBLE HOOK ─── */
function useLazyVisible(rootMargin = "200px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin, visible]);
  return [ref, visible];
}

/* ─── LAZY PDF THUMBNAIL ─── */
function LazyPDFThumb({ pdfUrl, catAccent, title }) {
  const [ref, visible] = useLazyVisible("300px");
  const [thumbState, setThumbState] = useState("idle");
  useEffect(() => {
    if (visible && thumbState === "idle") setThumbState("loading");
  }, [visible, thumbState]);

  return (
    <div ref={ref} className="pdf-thumb-outer">
      <div
        className="pdf-thumb-fallback"
        style={{ opacity: thumbState === "ready" ? 0 : 1, background: catAccent + "18" }}
      >
        {thumbState === "loading" ? (
          <div className="pdf-spin" style={{ borderTopColor: catAccent }} />
        ) : (
          <>
            <FileText size={32} color={catAccent} strokeWidth={1.4} />
            <span className="pdf-fallback-label">{title}</span>
          </>
        )}
      </div>
      {(thumbState === "loading" || thumbState === "ready") && (
        <div className="pdf-thumb-doc" style={{ opacity: thumbState === "ready" ? 1 : 0 }}>
          <Document
            file={pdfUrl}
            onLoadSuccess={() => setThumbState("ready")}
            onLoadError={() => setThumbState("error")}
            loading={null}
            options={PDF_OPTIONS}
          >
            <Page pageNumber={1} height={280} renderTextLayer={false} renderAnnotationLayer={false} />
          </Document>
        </div>
      )}
      {thumbState === "error" && (
        <div className="pdf-thumb-fallback" style={{ background: catAccent + "12" }}>
          <FileText size={32} color={catAccent} strokeWidth={1.4} />
          <span className="pdf-fallback-label">{title}</span>
        </div>
      )}
    </div>
  );
}

/* ─── PRODUCT IMAGE / NAME FALLBACK ─── */
function ProductImage({ image, name, company_name, accent = T.red }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = useMemo(() => {
    const words = (name || "").split(" ").filter(Boolean);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }, [name]);
  const palette = useMemo(() => {
    const idx = (name || "").charCodeAt(0) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[idx];
  }, [name]);

  if (image && !imgErr) {
    return (
      <img
        src={getImageUrl(image)}
        alt={name}
        onError={() => setImgErr(true)}
        loading="lazy"
      />
    );
  }

  return (
    <div className="pcard-name-fallback" style={{ background: palette.bg }}>
      <div className="pcard-fallback-initials" style={{ color: palette.text }}>{initials}</div>
      <div className="pcard-fallback-name" style={{ color: palette.text }}>{name}</div>
      {company_name && (
        <div className="pcard-fallback-brand" style={{ color: palette.text + "99" }}>{company_name}</div>
      )}
    </div>
  );
}

/* ─── LETTER AVATAR ─── */
function LetterAvatar({ name = "", size = 40, bg = T.red, color = "#fff", radius = 10 }) {
  const ini = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  return (
    <div style={{
      width: size, height: size, background: bg, color,
      borderRadius: radius, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'Cabinet Grotesk', sans-serif",
      fontWeight: 800, fontSize: size * 0.35, userSelect: "none", flexShrink: 0,
    }}>
      {ini || "?"}
    </div>
  );
}

/* ─── BRAND TICKER ─── */
function BrandTicker({ companies }) {
  const items = [...companies, ...companies, ...companies, ...companies];
  return (
    <div className="ticker-root">
      <div className="ticker-fade ticker-fade-l" />
      <div className="ticker-fade ticker-fade-r" />
      <div className="ticker-track">
        {items.map((c, i) => {
          const pal = AVATAR_PALETTES[i % AVATAR_PALETTES.length];
          return (
            <div key={i} className="ticker-chip">
              <div className="ticker-avatar" style={!c.logo ? { background: pal.bg, color: pal.text } : {}}>
                {c.logo ? (
                  <img
                    src={getImageUrl(c.logo)}
                    alt={c.name}
                    onError={e => {
                      e.target.style.display = "none";
                      e.target.nextSibling && (e.target.nextSibling.style.display = "flex");
                    }}
                  />
                ) : null}
                <span
                  className="ticker-avatar-letter"
                  style={{ display: c.logo ? "none" : "flex", background: pal.bg, color: pal.text }}
                >
                  {(c.name || "C")[0].toUpperCase()}
                </span>
              </div>
              <span className="ticker-name">{c.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── CATEGORY CAROUSEL ─── */
function CategoryCarousel({ categories, activeType, onSelect, flyerCounts }) {
  const ref = useRef(null);
  const scroll = d => ref.current?.scrollBy({ left: d * 200, behavior: "smooth" });

  return (
    <div className="cat-row">
      <button className="cat-nav-btn" onClick={() => scroll(-1)} aria-label="Scroll left">
        <ChevronLeft size={14} />
      </button>
      <div className="cat-track" ref={ref}>
        {[{ key: "all", ...CAT_ALL }, ...categories.map(t => ({ key: t, ...catMeta(t) }))].map(({ key, label, Icon, accent, glow }) => {
          const active = activeType === key;
          const count = key === "all"
            ? Object.values(flyerCounts).reduce((a, b) => a + b, 0)
            : (flyerCounts[key] || 0);
          return (
            <button
              key={key}
              className={`cat-pill ${active ? "cat-pill-on" : ""}`}
              style={active ? { background: accent, color: "#fff", borderColor: accent, boxShadow: `0 4px 16px ${glow}` } : {}}
              onClick={() => onSelect(key)}
            >
              <Icon size={12} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label || key}</span>
              <em className="cat-pill-count" style={active ? { background: "rgba(255,255,255,0.25)", color: "#fff" } : {}}>
                {count}
              </em>
            </button>
          );
        })}
      </div>
      <button className="cat-nav-btn" onClick={() => scroll(1)} aria-label="Scroll right">
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ─── STAR RATING DISPLAY ─── */
function StarRating({ avgRating, reviewCount }) {
  const rounded = Math.round(avgRating || 0);
  return (
    <div className="fcard-rating-row">
      <span className="fcard-rating-num">
        {avgRating ? avgRating.toFixed(1) : "New"}
      </span>
      <div className="fcard-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} className={`fcard-star ${star <= rounded ? "fcard-star-on" : ""}`}
            viewBox="0 0 12 12" width="12" height="12">
            <path d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.08L6 8.1 3.22 9.53l.53-3.08L1.5 4.25l3.1-.45z"
              fill={star <= rounded ? "#FFB800" : "none"}
              stroke={star <= rounded ? "#FFB800" : "rgba(0,0,0,0.15)"}
              strokeWidth="0.8" strokeLinejoin="round" />
          </svg>
        ))}
      </div>
      <span className="fcard-rating-ct">({reviewCount || 0})</span>
    </div>
  );
}

/* ─── FLYER CARD ─── */
function FlyerCard({ flyer, isSaved, onSave, onView, onReview }) {
  const m = catMeta(flyer.category_type);
  const CIcon = m.Icon;
  const pdfUrl = useMemo(() => buildPdfUrl(flyer.pdf), [flyer.pdf]);
  const [cardRef, cardVisible] = useLazyVisible("150px");

  const daysLeft = flyer.end_date
    ? Math.max(0, Math.ceil((new Date(flyer.end_date) - new Date()) / 86400000))
    : null;

  return (
    <article
      ref={cardRef}
      className={`fcard ${cardVisible ? "fcard-visible" : ""}`}
      aria-label={`${flyer.title} flyer from ${flyer.company_name}`}
    >
      <div className="fcard-visual" onClick={() => onView(flyer)} style={{ cursor: "pointer" }}>
        <div className="fcard-bg-fallback" style={{ background: m.bg || `linear-gradient(135deg, #1a1d27, #0d0f14)` }} />
        {pdfUrl && cardVisible && <LazyPDFThumb pdfUrl={pdfUrl} catAccent={m.accent} title={flyer.title} />}
        {(!pdfUrl || !cardVisible) && (
          <div className="fcard-icon-fallback"><CIcon size={40} color={m.accent} strokeWidth={1.2} /></div>
        )}
        <div className="fcard-gradient-overlay" />

        <div className="fcard-top-row">
          <div className="fcard-badge" style={{ background: m.accent }}>
            <CIcon size={9} strokeWidth={2.5} />
            <span>{m.label || flyer.category_type}</span>
          </div>
          <button
            className={`fcard-heart ${isSaved ? "fcard-heart-on" : ""}`}
            onClick={e => { e.stopPropagation(); onSave(e); }}
            style={isSaved ? { background: m.accent, borderColor: m.accent } : {}}
            aria-label={isSaved ? "Remove from saved" : "Save flyer"}
          >
            {isSaved ? <BookmarkCheck size={12} color="#fff" /> : <Bookmark size={12} />}
          </button>
        </div>

        <div className="fcard-bottom">
          <div className="fcard-co-row">
            {flyer.company_logo
              ? <img src={getImageUrl(flyer.company_logo)} alt={flyer.company_name} className="fcard-co-img" />
              : <div className="fcard-co-dot" style={{ background: m.accent }}>{(flyer.company_name || "C")[0]}</div>
            }
            <span className="fcard-co-name">{flyer.company_name}</span>
            {daysLeft !== null && daysLeft <= 7 && (
              <span className="fcard-urgent">
                <Flame size={9} />
                {daysLeft === 0 ? "Last day!" : `${daysLeft}d left`}
              </span>
            )}
          </div>
          <h4 className="fcard-title">{flyer.title}</h4>
          {flyer.end_date && (
            <div className="fcard-date"><Calendar size={9} />Ends {flyer.end_date}</div>
          )}
        </div>
      </div>

      <div className="fcard-footer">
        <div className="fcard-footer-top">
          <StarRating avgRating={flyer.avg_rating} reviewCount={flyer.review_count} />
          <button
            className="fcard-review-icon-btn"
            onClick={onReview}
            aria-label="Write a review"
            title="Write a review"
          >
            <Star size={13} strokeWidth={2.2} />
          </button>
        </div>

        <button
          className="fcard-btn-primary"
          style={{ "--btn-accent": m.accent, "--btn-glow": m.glow || "rgba(0,0,0,0.15)" }}
          onClick={() => onView(flyer)}
          aria-label="View flyer"
        >
          <span className="fcard-btn-primary-inner">
            <Eye size={14} strokeWidth={2.5} />
            <span>View Flyer</span>
          </span>
          <span className="fcard-btn-arrow">
            <ArrowRight size={13} strokeWidth={2.5} />
          </span>
          <span className="fcard-btn-shine" />
        </button>
      </div>
    </article>
  );
}

/* ─── PRODUCT CARD ─── */
function ProductCard({ product, isSaved, onSave }) {
  const [cardRef, cardVisible] = useLazyVisible("200px");
  const discount = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : null;

  return (
    <article ref={cardRef} className={`pcard ${cardVisible ? "pcard-visible" : ""}`}>
      <div className="pcard-img-wrap">
        {cardVisible ? (
          <ProductImage image={product.image} name={product.name} company_name={product.company_name} />
        ) : (
          <div className="pcard-img-skeleton" />
        )}
        {discount && (
          <div className="pcard-discount">
            <Star size={9} fill="#fff" color="#fff" />{discount}% OFF
          </div>
        )}
        <button
          className={`pcard-save ${isSaved ? "pcard-save-on" : ""}`}
          onClick={e => { e.stopPropagation(); onSave(e); }}
          aria-label={isSaved ? "Remove from saved" : "Save product"}
        >
          {isSaved ? <Heart size={13} fill={T.red} color={T.red} /> : <Heart size={13} />}
        </button>
        <div className="pcard-shine" />
      </div>
      <div className="pcard-body">
        <p className="pcard-name">{product.name}</p>
        <div className="pcard-price-row">
          <span className="pcard-price">₹{Number(product.price).toLocaleString()}</span>
          {product.old_price && <span className="pcard-old">₹{Number(product.old_price).toLocaleString()}</span>}
        </div>
        <div className="pcard-brand">
          <Building2 size={10} color={T.muted} />
          <span>{product.company_name}</span>
        </div>
      </div>
    </article>
  );
}

/* ─── PRODUCT SIDEBAR ─── */
/* FIX: accepts productCatCounts and uses it instead of cat.product_count */
function ProductSidebar({ categories, activeCategory, activeSub, onCat, onSub, productCatCounts = {} }) {
  const [open, setOpen] = useState(null);
  useEffect(() => { setOpen(activeCategory); }, [activeCategory]);

  /* Total across all categories */
  const totalCount = useMemo(
    () => Object.values(productCatCounts).reduce((a, b) => a + b, 0),
    [productCatCounts]
  );

  return (
    <aside className="psidebar">
      <div className="psidebar-head">
        <Filter size={13} color={T.red} />
        <span>Categories</span>
      </div>
      <button
        className={`psidebar-item ${activeCategory === null ? "psidebar-item-on" : ""}`}
        onClick={() => { onCat(null); onSub(null); setOpen(null); }}
      >
        <Sparkles size={12} />
        <span>All Products</span>
        <em className="psidebar-count">{totalCount}</em>
      </button>
      {categories?.map(cat => {
        /* Use computed count, fall back to API field, fall back to 0 */
        const count = productCatCounts[cat.id] ?? cat.product_count ?? 0;
        return (
          <div key={cat.id}>
            <button
              className={`psidebar-item ${activeCategory === cat.id ? "psidebar-item-on" : ""}`}
              onClick={() => { onCat(cat.id); onSub(null); setOpen(open === cat.id ? null : cat.id); }}
            >
              <ChevronRight size={10} style={{ transform: open === cat.id ? "rotate(90deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
              <span>{cat.name}</span>
              <em className="psidebar-count">{count}</em>
            </button>
            {open === cat.id && cat.subcategories?.map(sub => (
              <button
                key={sub.id}
                className={`psidebar-sub ${activeSub === sub.id ? "psidebar-sub-on" : ""}`}
                onClick={() => onSub(sub.id)}
              >
                {activeSub === sub.id && <Check size={8} color={T.red} />}
                <span>{sub.name}</span>
              </button>
            ))}
          </div>
        );
      })}
    </aside>
  );
}

/* ─── PORTAL — escapes any parent overflow/transform ─── */
function Portal({ children }) {
  const [host] = useState(() => {
    if (typeof document === "undefined") return null;
    return document.body;
  });
  if (!host) return null;
  return createPortal(children, host);
}

/* ─── BODY SCROLL LOCK — iOS-safe ─── */
function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;
    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top:      document.body.style.top,
      width:    document.body.style.width,
    };
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top      = `-${scrollY}px`;
    document.body.style.width    = "100%";
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top      = prev.top;
      document.body.style.width    = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}

/* ─── EMPTY STATE ─── */
function EmptyState({ label }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Inbox size={32} strokeWidth={1.2} color={T.subtle} /></div>
      <p className="empty-title">No {label} found</p>
      <p className="empty-sub">Try adjusting your filters or search</p>
    </div>
  );
}

/* ─── AD SLOT ─── */
function AdSlot({ slot, className = "", style = {} }) {
  return (
    <div className={`ad-slot ${className}`} style={style} aria-label="Advertisement">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/* ══════════════════════════════════════
   HERO — compact & creative
══════════════════════════════════════ */
function HeroSection({ data }) {
  return (
    <section className="hero">
      {/* Layered backgrounds */}
      <div className="hero-noise" />
      <div className="hero-mesh" />
      <div className="hero-orbs" aria-hidden="true">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      <div className="hero-content">
        {/* Eyebrow */}
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          <Zap size={10} fill="currentColor" strokeWidth={0} />
          <span>Fresh deals every morning</span>
        </div>

        {/* Title */}
        <h1 className="hero-title">
          Discover <span className="hero-em">Unbeatable</span>
          <br />
          <span className="hero-title-line2">Local Deals</span>
        </h1>

        <p className="hero-sub">
          Flyers, exclusive offers &amp; products from top brands — all in one place.
        </p>

        {/* Stats row */}
        <div className="hero-stats-row">
          {[
            { Icon: Store,        val: `${data?.companies?.length || 0}+`,  label: "Brands"   },
            { Icon: FileText,     val: `${data?.flyers?.length || 0}+`,     label: "Flyers"   },
            { Icon: ShoppingCart, val: `${data?.products?.length || 0}+`,   label: "Products" },
          ].map(({ Icon, val, label }, i) => (
            <div key={i} className="hero-stat-chip">
              <div className="hero-stat-icon"><Icon size={13} /></div>
              <div className="hero-stat-text">
                <strong>{val}</strong>
                <span>{label}</span>
              </div>
              {i < 2 && <div className="hero-stat-sep" />}
            </div>
          ))}
        </div>

        {/* Category quick-links */}
        <div className="hero-quick-cats">
          {Object.entries(CAT_META).slice(0, 5).map(([key, m]) => (
            <div key={key} className="hero-cat-tag" style={{ background: m.accent + "20", borderColor: m.accent + "40" }}>
              <m.Icon size={10} color={m.accent} />
              <span style={{ color: m.accent }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wave bottom */}
      <div className="hero-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 56" preserveAspectRatio="none">
          <path d="M0,28 C360,56 720,0 1080,28 C1260,42 1380,14 1440,28 L1440,56 L0,56 Z" fill={T.bg} />
        </svg>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function UserHome() {
  const [data, setData]                   = useState(null);
  const [view, setView]                   = useState("flyers");
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCat]    = useState(null);
  const [activeSub, setActiveSub]         = useState(null);
  const [activeType, setActiveType]       = useState("all");
  const [savedProducts, setSavedProd]     = useState([]);
  const [savedFlyers, setSavedFlyers]     = useState([]);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [mounted, setMounted]             = useState(false);
  const [selectedFlyer, setSelectedFlyer] = useState(null);
  const [reviewFlyerId, setReviewFlyerId] = useState(null);

  useEffect(() => {
    load();
    setTimeout(() => setMounted(true), 80);
  }, []);

  const load = async () => {
    try {
      const res = await getUserDashboard();
      const d = res.data.data;
      setData(d);
      setSavedProd(d.saved_product_ids || []);
      setSavedFlyers(d.saved_flyer_ids || []);
    } catch (e) { console.error(e); }
  };

  const handleSave = useCallback(async (type, id, e) => {
    e.stopPropagation();
    const payload = type === "product" ? { product_id: id } : { flyer_id: id };
    const res = await toggleSave(payload);
    if (type === "product") {
      setSavedProd(p => res.data.saved ? [...p, id] : p.filter(i => i !== id));
    } else {
      setSavedFlyers(p => res.data.saved ? [...p, id] : p.filter(i => i !== id));
    }
  }, []);

  const sm = useCallback((s) => s?.toLowerCase().includes(search.toLowerCase()), [search]);

  /* ── FIX: compute category counts from actual products data ── */
  const productCatCounts = useMemo(() => {
    if (!data) return {};
    const counts = {};
    data.products.forEach(p => {
      if (p.category_id != null) {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      }
    });
    return counts;
  }, [data]);

  /* ── Flyer counts per category type ── */
  const flyerCounts = useMemo(() => {
    if (!data) return {};
    const counts = {};
    data.flyers.forEach(f => {
      const key = f.category_type?.toLowerCase();
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [data]);

  const filteredFlyers = useMemo(() => {
    if (!data) return [];
    return data.flyers.filter(f => {
      if (search && !sm(f.title) && !sm(f.company_name)) return false;
      if (activeType !== "all" && f.category_type?.toLowerCase() !== activeType.toLowerCase()) return false;
      return true;
    });
  }, [data, search, activeType, sm]);

  const filteredProducts = useMemo(() => {
    if (!data) return [];
    return data.products.filter(p => {
      if (search && !sm(p.name) && !sm(p.company_name)) return false;
      if (activeCategory && p.category_id !== activeCategory) return false;
      if (activeSub && p.subcategory_id !== activeSub) return false;
      return true;
    });
  }, [data, search, activeCategory, activeSub, sm]);

  const allCatTypes = useMemo(() => {
    if (!data) return [];
    const dbTypes = [...new Set(data.flyers.map(f => f.category_type).filter(Boolean))];
    const known = Object.keys(CAT_META);
    return [...new Set([...known, ...dbTypes])].filter(t => flyerCounts[t.toLowerCase()] > 0);
  }, [data, flyerCounts]);

  /* ── Lock body scroll whenever any modal is open ── */
  useScrollLock(!!(selectedFlyer || reviewFlyerId));

  /* ── Splash ── */
  if (!data) return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href={FONT_URL} />
      <GLOBAL_STYLES />
      <div className="splash">
        <div className="splash-logo">
          <svg width="52" height="52" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="18" fill={T.red} />
            <path d="M14 29L24 39L42 17" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="splash-bars">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="splash-bar" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <p className="splash-text">Curating the best deals for you…</p>
      </div>
    </>
  );

  return (
    <UserLayout>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href={FONT_URL} />
      <GLOBAL_STYLES />

      <div className={`uh-root ${mounted ? "uh-in" : ""}`}>

        {/* ── HERO ── */}
        <HeroSection data={data} />

        {/* ── TICKER ── */}
        {data.companies?.length > 0 && <BrandTicker companies={data.companies} />}

        {/* ── TOP BANNER AD ── */}
        <div className="ad-top-wrap">
          <AdSlot slot="1234567890" className="ad-top" />
        </div>

        {/* ── CONTROLS ── */}
        <div className="controls-bar">
          <div className="view-toggle">
            {[
              { id: "flyers",   label: "Flyers",   Icon: FileText,     count: data.flyers.length },
              { id: "products", label: "Products", Icon: ShoppingCart, count: data.products.length },
            ].map(({ id, label, Icon, count }) => (
              <button
                key={id}
                className={`vt-btn ${view === id ? "vt-on" : ""}`}
                onClick={() => { setView(id); setSearch(""); setActiveType("all"); }}
              >
                <Icon size={14} />
                <span>{label}</span>
                <em>{count}</em>
              </button>
            ))}
          </div>
          <div className="searchbar">
            <Search size={14} color={T.red} strokeWidth={2.2} />
            <input
              type="text"
              placeholder={view === "flyers" ? "Search flyers, brands…" : "Search products…"}
              value={search}
              onChange={e => setSearch(e.target.value)}
              spellCheck={false}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}><X size={12} /></button>
            )}
          </div>
          {view === "products" && (
            <button className="mobile-filter" onClick={() => setDrawerOpen(true)}>
              <SlidersHorizontal size={14} />
              <span>Filter</span>
            </button>
          )}
        </div>

        {/* ── CATEGORY BAR ── */}
        {view === "flyers" && (
          <div className="cat-section">
            <CategoryCarousel
              categories={allCatTypes}
              activeType={activeType}
              onSelect={setActiveType}
              flyerCounts={flyerCounts}
            />
          </div>
        )}

        {/* ── MAIN ── */}
        <div className="main-outer">
          <div className="main-wrap">
            {view === "products" && (
              <div className="sidebar-col">
                <ProductSidebar
                  categories={data.categories}
                  activeCategory={activeCategory}
                  activeSub={activeSub}
                  onCat={setActiveCat}
                  onSub={setActiveSub}
                  productCatCounts={productCatCounts}
                />
              </div>
            )}

            <main className="content-col">
              <div className="results-bar">
                <div className="results-count">
                  <TrendingUp size={12} color={T.red} />
                  <span>
                    <strong>{view === "flyers" ? filteredFlyers.length : filteredProducts.length}</strong>
                    {" "}{view === "flyers" ? "flyers" : "products"}
                    {search && <em className="results-q"> · "{search}"</em>}
                  </span>
                </div>
              </div>

              {view === "flyers" && (
                <div className="flyers-grid">
                  {filteredFlyers.map((flyer) => (
                    <FlyerCard
                      key={flyer.id}
                      flyer={flyer}
                      isSaved={savedFlyers.includes(flyer.id)}
                      onSave={e => handleSave("flyer", flyer.id, e)}
                      onView={() => setSelectedFlyer(flyer)}
                      onReview={() => setReviewFlyerId(flyer.id)}
                    />
                  ))}
                  {filteredFlyers.length === 0 && <EmptyState label="flyers" />}
                </div>
              )}

              {view === "products" && (
                <div className="products-grid">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isSaved={savedProducts.includes(product.id)}
                      onSave={e => handleSave("product", product.id, e)}
                    />
                  ))}
                  {filteredProducts.length === 0 && <EmptyState label="products" />}
                </div>
              )}
            </main>
          </div>

          {/* RIGHT AD COLUMN */}
          <aside className="ad-right-col">
            <div className="ad-right-sticky">
              <AdSlot slot="0987654321" className="ad-right-rect" />
              <AdSlot slot="1122334455" className="ad-right-half" />
            </div>
          </aside>
        </div>

        {/* MODALS — rendered via Portal to escape parent overflow/transform */}
        {selectedFlyer && (
          <Portal>
            <FlyerModal flyer={selectedFlyer} onClose={() => setSelectedFlyer(null)} />
          </Portal>
        )}
        {reviewFlyerId && (
          <Portal>
            <ReviewModal flyerId={reviewFlyerId} onClose={() => setReviewFlyerId(null)} />
          </Portal>
        )}

        {/* MOBILE DRAWER */}
        {drawerOpen && (
          <>
            <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
            <div className="drawer">
              <div className="drawer-head">
                <span>Filter Products</span>
                <button onClick={() => setDrawerOpen(false)}><X size={18} /></button>
              </div>
              <ProductSidebar
                categories={data.categories}
                activeCategory={activeCategory}
                activeSub={activeSub}
                onCat={c => { setActiveCat(c); setDrawerOpen(false); }}
                onSub={s => { setActiveSub(s); setDrawerOpen(false); }}
                productCatCounts={productCatCounts}
              />
            </div>
          </>
        )}

      </div>
    </UserLayout>
  );
}

/* ══════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════ */
function GLOBAL_STYLES() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Cabinet Grotesk', -apple-system, sans-serif; }

      @keyframes spin          { to { transform: rotate(360deg); } }
      @keyframes barPulse      { 0%,100% { transform:scaleY(.3); opacity:.3; } 50% { transform:scaleY(1); opacity:1; } }
      @keyframes logoBounce    { from { opacity:0; transform:scale(.5) rotate(-15deg); } to { opacity:1; transform:none; } }
      @keyframes cardReveal    { from { opacity:0; transform:translateY(16px) scale(.97); } to { opacity:1; transform:none; } }
      @keyframes ticker        { 0% { transform:translateX(0); } 100% { transform:translateX(-25%); } }
      @keyframes drawerSlide   { from { transform:translateX(-100%); } to { transform:translateX(0); } }
      @keyframes fadeIn        { from { opacity:0; } to { opacity:1; } }
      @keyframes orbFloat      { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-20px) scale(1.05); } }
      @keyframes urgentPulse   { 0%,100% { opacity:1; } 50% { opacity:.65; } }
      @keyframes shineSweep    { 0% { left:-60%; opacity:0; } 30% { opacity:1; } 100% { left:130%; opacity:0; } }
      @keyframes reviewPop     { 0% { transform:scale(1); } 40% { transform:scale(1.25) rotate(-8deg); } 100% { transform:scale(1); } }
      @keyframes modalIn       { from { opacity:0; transform:translateY(28px) scale(.96); } to { opacity:1; transform:none; } }
      @keyframes sheetUp       { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
      @keyframes skeletonPulse { 0%,100% { opacity:.5; } 50% { opacity:1; } }
      @keyframes heroReveal    { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:none; } }
      @keyframes dotPulse      { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.6); } }

      /* ── Root ── */
      .uh-root {
        min-height: 100vh;
        background: #F4F5FB;
        color: #0D0F14;
        opacity: 0;
        transition: opacity .45s ease;
        font-family: 'Cabinet Grotesk', sans-serif;
      }
      .uh-in { opacity: 1; }

      /* ── Splash ── */
      .splash {
        min-height: 100vh;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 24px; background: #FFFFFF;
      }
      .splash-logo { animation: logoBounce .6s cubic-bezier(.34,1.56,.64,1) both; }
      .splash-bars { display: flex; gap: 5px; align-items: center; height: 36px; }
      .splash-bar  { width: 4px; height: 24px; background: #E30613; border-radius: 4px; animation: barPulse .9s ease-in-out infinite; transform-origin: center; }
      .splash-text { font-size: 13px; color: #8B8FA8; font-weight: 500; }

      /* ══════════════════════════════
         HERO — compact
      ══════════════════════════════ */
      .hero {
        position: relative;
        background: linear-gradient(140deg, #080003 0%, #5A0006 30%, #B5000E 60%, #E30613 85%, #FF3A22 100%);
        padding: 44px 0 0;
        overflow: hidden;
        /* max vertical footprint */
        min-height: 0;
      }

      .hero-noise {
        position: absolute; inset: 0; pointer-events: none; z-index: 1;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
        background-size: 128px; opacity: .4;
      }
      .hero-mesh {
        position: absolute; inset: 0; z-index: 1; pointer-events: none;
        background-image:
          linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: radial-gradient(ellipse 80% 90% at 50% 10%, black 20%, transparent 75%);
      }
      .hero-orbs { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 1; }
      .hero-orb   { position: absolute; border-radius: 50%; filter: blur(70px); }
      .hero-orb-1 { width: 400px; height: 400px; background: rgba(255,80,80,.2);  top: -140px; right: -80px;  animation: orbFloat 9s ease-in-out infinite; }
      .hero-orb-2 { width: 280px; height: 280px; background: rgba(255,180,0,.14); bottom: 0;   left: -60px;   animation: orbFloat 11s ease-in-out infinite 2s; }
      .hero-orb-3 { width: 200px; height: 200px; background: rgba(255,60,130,.15);top: 30%;    left: 50%;     animation: orbFloat 7s ease-in-out infinite 1s; }

      .hero-content {
        position: relative; z-index: 3;
        max-width: 640px; margin: 0 auto;
        text-align: center; padding: 0 20px 52px;
        animation: heroReveal .65s cubic-bezier(.2,.9,.4,1) .1s both;
      }

      /* Eyebrow pill */
      .hero-eyebrow {
        display: inline-flex; align-items: center; gap: 7px;
        background: rgba(255,255,255,.11);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255,255,255,.18); border-radius: 100px;
        padding: 5px 16px; font-size: 11px; font-weight: 600;
        color: rgba(255,255,255,.8); margin-bottom: 18px;
        letter-spacing: .06em; text-transform: uppercase;
      }
      .hero-eyebrow-dot {
        width: 6px; height: 6px; border-radius: 50%; background: #00C48C;
        flex-shrink: 0; animation: dotPulse 2s ease-in-out infinite;
      }

      /* Title */
      .hero-title {
        font-family: 'Clash Display', 'Cabinet Grotesk', sans-serif;
        font-size: clamp(30px, 6vw, 52px);
        font-weight: 700; color: #FFFFFF;
        line-height: 1.1; margin-bottom: 14px;
        letter-spacing: -0.03em;
      }
      .hero-em {
        background: linear-gradient(115deg, #FFD580 0%, #FF9060 50%, #FF6BAD 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text; display: inline-block;
      }
      .hero-title-line2 {
        display: inline-block; position: relative;
      }
      .hero-title-line2::after {
        content: '';
        position: absolute; bottom: -3px; left: 0; right: 0;
        height: 2.5px;
        background: linear-gradient(90deg, #FFD580, #FF6BAD);
        border-radius: 2px; opacity: .55;
      }

      .hero-sub {
        font-size: clamp(12.5px, 2vw, 15px);
        color: rgba(255,255,255,.52);
        margin-bottom: 22px; line-height: 1.65; font-weight: 400;
        max-width: 460px; margin-left: auto; margin-right: auto;
      }

      /* Stats row */
      .hero-stats-row {
        display: inline-flex; align-items: stretch;
        background: rgba(255,255,255,.09);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255,255,255,.14); border-radius: 18px;
        overflow: hidden; margin-bottom: 18px;
      }
      .hero-stat-chip {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 20px; position: relative;
      }
      .hero-stat-sep {
        position: absolute; right: 0; top: 25%; bottom: 25%;
        width: 1px; background: rgba(255,255,255,.12);
      }
      .hero-stat-icon {
        width: 32px; height: 32px; border-radius: 10px;
        background: rgba(255,255,255,.14);
        display: flex; align-items: center; justify-content: center;
        color: rgba(255,255,255,.88); flex-shrink: 0;
      }
      .hero-stat-text { display: flex; flex-direction: column; }
      .hero-stat-text strong {
        font-family: 'Clash Display', sans-serif;
        font-size: 17px; font-weight: 700; color: #FFF; line-height: 1;
      }
      .hero-stat-text span { font-size: 10.5px; color: rgba(255,255,255,.45); font-weight: 500; margin-top: 2px; }

      /* Quick category tags */
      .hero-quick-cats {
        display: flex; align-items: center; justify-content: center;
        gap: 7px; flex-wrap: wrap;
      }
      .hero-cat-tag {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 4px 10px; border-radius: 100px;
        font-size: 11px; font-weight: 600;
        font-family: 'Cabinet Grotesk', sans-serif;
        border: 1px solid transparent;
        backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        cursor: default;
      }

      /* Wave */
      .hero-wave { position: relative; line-height: 0; z-index: 3; }
      .hero-wave svg { width: 100%; height: 56px; display: block; }

      /* ── Ticker ── */
      .ticker-root {
        position: relative; background: #FFFFFF;
        border-bottom: 1px solid #EAEBF4;
        overflow: hidden; padding: 12px 0;
      }
      .ticker-fade { position: absolute; top: 0; bottom: 0; width: 100px; z-index: 2; pointer-events: none; }
      .ticker-fade-l { left: 0; background: linear-gradient(to right, #FFFFFF, transparent); }
      .ticker-fade-r { right: 0; background: linear-gradient(to left, #FFFFFF, transparent); }
      .ticker-track {
        display: flex; width: max-content;
        animation: ticker 35s linear infinite;
        align-items: center;
      }
      .ticker-track:hover { animation-play-state: paused; }
      .ticker-chip {
        display: inline-flex; align-items: center; gap: 9px;
        padding: 3px 24px 3px 16px;
        border-right: 1px solid #F2F3FA;
        white-space: nowrap; transition: transform .2s; cursor: default;
      }
      .ticker-chip:hover { transform: scale(1.03); }
      .ticker-avatar {
        width: 38px; height: 38px; border-radius: 10px;
        background: #F2F3FA;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden; flex-shrink: 0;
        border: 1.5px solid #EAEBF4; position: relative;
      }
      .ticker-avatar img { width: 100%; height: 100%; object-fit: contain; padding: 4px; display: block; }
      .ticker-avatar-letter {
        width: 100%; height: 100%; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: 800;
        font-family: 'Clash Display', sans-serif; position: absolute; inset: 0;
      }
      .ticker-name {
        font-size: 13px; font-weight: 700; color: #2D3142;
        font-family: 'Cabinet Grotesk', sans-serif; letter-spacing: -.01em;
      }

      /* ── Top Ad ── */
      .ad-top-wrap {
        background: #FFFFFF; border-bottom: 1px solid #EAEBF4;
        display: flex; align-items: center; justify-content: center;
        padding: 8px 24px; min-height: 66px;
      }
      .ad-top { width: 100%; max-width: 970px; min-height: 50px; border-radius: 8px; overflow: hidden; background: #F2F3FA; }
      .ad-top .adsbygoogle { min-height: 50px; }

      /* ── Controls Bar ── */
      .controls-bar {
        max-width: 1340px; margin: 0 auto;
        padding: 14px 24px;
        display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      }
      .view-toggle {
        display: flex; background: #FFFFFF;
        border: 1.5px solid #EAEBF4; border-radius: 14px; padding: 4px;
        flex-shrink: 0; gap: 3px;
      }
      .vt-btn {
        display: flex; align-items: center; gap: 7px;
        padding: 8px 18px; border: none; background: transparent;
        border-radius: 10px; font-size: 13px; font-weight: 700;
        color: #8B8FA8; cursor: pointer;
        transition: all .2s; font-family: 'Cabinet Grotesk', sans-serif;
      }
      .vt-btn em {
        font-style: normal; font-size: 11px; padding: 2px 7px;
        border-radius: 20px; background: #F2F3FA; color: #8B8FA8;
        transition: all .2s;
      }
      .vt-on { background: #E30613 !important; color: #FFFFFF !important; box-shadow: 0 4px 12px rgba(227,6,19,0.2); }
      .vt-on em { background: rgba(255,255,255,.22) !important; color: #FFFFFF !important; }
      .searchbar {
        flex: 1; display: flex; align-items: center; gap: 10px;
        background: #FFFFFF; border: 1.5px solid #EAEBF4;
        border-radius: 14px; padding: 10px 16px;
        transition: all .2s; min-width: 0;
      }
      .searchbar:focus-within { border-color: #E30613; box-shadow: 0 0 0 3px rgba(227,6,19,0.12); }
      .searchbar input {
        flex: 1; border: none; outline: none;
        font-size: 14px; background: transparent;
        font-family: 'Cabinet Grotesk', sans-serif; color: #0D0F14; font-weight: 500;
      }
      .searchbar input::placeholder { color: #C4C6D6; }
      .search-clear {
        background: none; border: none; cursor: pointer;
        color: #8B8FA8; display: flex; padding: 2px; border-radius: 6px;
        transition: color .15s;
      }
      .search-clear:hover { color: #E30613; }
      .mobile-filter {
        display: none; align-items: center; gap: 7px;
        padding: 10px 16px; background: #FFFFFF;
        border: 1.5px solid #EAEBF4; border-radius: 14px;
        font-size: 13px; font-weight: 700; color: #E30613;
        cursor: pointer; transition: all .2s;
        font-family: 'Cabinet Grotesk', sans-serif;
      }
      .mobile-filter:hover { border-color: #E30613; background: #FFF0F0; }

      /* ── Category ── */
      .cat-section { max-width: 1340px; margin: 0 auto; padding: 0 24px 14px; }
      .cat-row { display: flex; align-items: center; gap: 8px; }
      .cat-nav-btn {
        flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%;
        border: 1.5px solid #EAEBF4; background: #FFFFFF;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: #2D3142; transition: all .2s;
      }
      .cat-nav-btn:hover { background: #E30613; border-color: #E30613; color: #FFFFFF; }
      .cat-track {
        display: flex; gap: 7px; overflow-x: auto;
        scrollbar-width: none; padding: 3px 2px; flex: 1;
      }
      .cat-track::-webkit-scrollbar { display: none; }
      .cat-pill {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 7px 13px; border: 1.5px solid #EAEBF4;
        border-radius: 100px; background: #FFFFFF;
        font-size: 12.5px; font-weight: 700; color: #4A4E6A;
        white-space: nowrap; cursor: pointer;
        transition: all .2s; font-family: 'Cabinet Grotesk', sans-serif;
      }
      .cat-pill:hover { border-color: #E30613; color: #E30613; transform: translateY(-1px); }
      .cat-pill-on { transform: translateY(-1px); }
      .cat-pill-count {
        font-style: normal; font-size: 10px; font-weight: 700;
        padding: 1px 7px; border-radius: 100px;
        background: #F2F3FA; color: #8B8FA8;
        transition: all .2s; min-width: 20px; text-align: center;
      }

      /* ── Main outer ── */
      .main-outer {
        max-width: 1680px; margin: 0 auto;
        padding: 0 24px 60px;
        display: flex; align-items: flex-start; gap: 24px;
      }
      .main-wrap { flex: 1; min-width: 0; display: flex; gap: 24px; max-width: 1340px; }
      .sidebar-col { width: 230px; flex-shrink: 0; }
      .content-col { flex: 1; min-width: 0; }

      /* ── Right Ad Column ── */
      .ad-right-col { width: 300px; flex-shrink: 0; }
      .ad-right-sticky { position: sticky; top: 88px; display: flex; flex-direction: column; gap: 16px; }
      .ad-right-rect { width: 300px; min-height: 250px; border-radius: 12px; overflow: hidden; background: #F2F3FA; }
      .ad-right-rect .adsbygoogle { min-height: 250px; }
      .ad-right-half { width: 300px; min-height: 600px; border-radius: 12px; overflow: hidden; background: #F2F3FA; }
      .ad-right-half .adsbygoogle { min-height: 600px; }

      /* ── Sidebar ── */
      .psidebar {
        background: #FFFFFF; border: 1.5px solid #EAEBF4;
        border-radius: 18px; padding: 16px 12px;
        position: sticky; top: 88px;
      }
      .psidebar-head {
        display: flex; align-items: center; gap: 7px;
        font-family: 'Clash Display', sans-serif;
        font-size: 11px; font-weight: 600; color: #0D0F14;
        text-transform: uppercase; letter-spacing: .1em;
        padding-bottom: 12px; border-bottom: 1.5px solid #F2F3FA;
        margin-bottom: 12px;
      }
      .psidebar-item {
        width: 100%; display: flex; align-items: center; gap: 8px;
        padding: 8px 10px; border: none; background: transparent;
        border-radius: 10px; font-size: 13px; font-weight: 600;
        color: #2D3142; cursor: pointer; transition: all .16s;
        margin-bottom: 2px; font-family: 'Cabinet Grotesk', sans-serif; text-align: left;
      }
      .psidebar-item:hover { background: #F4F5FB; }
      .psidebar-item-on { background: #FFF0F0 !important; color: #E30613; }
      .psidebar-count {
        margin-left: auto; font-style: normal; font-size: 10.5px; color: #8B8FA8;
        background: #F2F3FA; padding: 2px 7px; border-radius: 8px;
      }
      .psidebar-sub {
        width: 100%; display: flex; align-items: center; gap: 6px;
        padding: 6px 10px 6px 26px; border: none; background: transparent;
        border-radius: 8px; font-size: 12px; color: #8B8FA8;
        cursor: pointer; transition: all .16s;
        font-family: 'Cabinet Grotesk', sans-serif; text-align: left;
      }
      .psidebar-sub:hover { background: #F4F5FB; color: #0D0F14; }
      .psidebar-sub-on { color: #E30613; font-weight: 700; }

      /* ── Results Bar ── */
      .results-bar { margin-bottom: 16px; }
      .results-count {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 5px 14px; background: #FFFFFF;
        border: 1.5px solid #EAEBF4; border-radius: 100px;
        font-size: 13px; font-weight: 600; color: #4A4E6A;
        font-family: 'Cabinet Grotesk', sans-serif;
      }
      .results-count strong { color: #0D0F14; }
      .results-q { color: #E30613; font-style: italic; }

      /* ══════════════════════════════
         FLYER CARD
      ══════════════════════════════ */
      .flyers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 18px;
      }
      .fcard {
        position: relative; border-radius: 20px; overflow: hidden;
        cursor: default; background: #FFFFFF;
        display: flex; flex-direction: column;
        transition: transform .32s cubic-bezier(.2,.9,.4,1.1), box-shadow .32s;
        box-shadow: 0 3px 16px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04);
        border: 1.5px solid #EAEBF4;
        opacity: 0;
      }
      .fcard-visible { animation: cardReveal .4s cubic-bezier(.34,1,.64,1) both; opacity: 1; }
      .fcard:hover {
        transform: translateY(-7px) scale(1.01);
        box-shadow: 0 20px 42px rgba(0,0,0,.12), 0 4px 14px rgba(0,0,0,.07);
        border-color: #C4C6D6;
      }
      .fcard-visual {
        position: relative; aspect-ratio: 3/4; overflow: hidden;
        border-radius: 18px 18px 0 0; flex-shrink: 0;
      }
      .fcard-bg-fallback { position: absolute; inset: 0; z-index: 0; }
      .fcard-icon-fallback {
        position: absolute; inset: 0; z-index: 1;
        display: flex; align-items: center; justify-content: center; opacity: 0.5;
      }
      .pdf-thumb-outer { position: absolute; inset: 0; z-index: 2; overflow: hidden; }
      .pdf-thumb-fallback {
        position: absolute; inset: 0; z-index: 1;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 10px;
        transition: opacity .35s ease;
      }
      .pdf-fallback-label {
        font-size: 11px; font-weight: 600; color: #0D0F14; line-height: 1.3;
        text-align: center; padding: 0 12px;
        display: -webkit-box; -webkit-line-clamp: 2;
        -webkit-box-orient: vertical; overflow: hidden; opacity: 0.7;
      }
      .pdf-spin {
        width: 24px; height: 24px; border-radius: 50%;
        border: 3px solid rgba(0,0,0,.1); animation: spin .75s linear infinite;
      }
      .pdf-thumb-doc {
        position: absolute; inset: 0; z-index: 2;
        display: flex; align-items: flex-start; justify-content: center;
        overflow: hidden; transition: opacity .35s ease;
      }
      .pdf-thumb-doc .react-pdf__Document { width: 100%; }
      .pdf-thumb-doc .react-pdf__Page__canvas { width: 100% !important; height: auto !important; display: block; }
      .fcard-gradient-overlay {
        position: absolute; inset: 0; z-index: 3;
        background: linear-gradient(to bottom, rgba(0,0,0,.48) 0%, transparent 35%, transparent 50%, rgba(0,0,0,.7) 100%);
      }
      .fcard-top-row {
        position: absolute; top: 11px; left: 11px; right: 11px;
        z-index: 4; display: flex; align-items: flex-start; justify-content: space-between;
      }
      .fcard-badge {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 4px 9px; border-radius: 100px;
        font-size: 9px; font-weight: 800; text-transform: uppercase;
        letter-spacing: .07em; color: #fff;
        font-family: 'Clash Display', sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,.22);
      }
      .fcard-heart {
        width: 32px; height: 32px; border-radius: 50%;
        background: rgba(255,255,255,.16); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,.22);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: rgba(255,255,255,.88);
        transition: all .2s; flex-shrink: 0;
      }
      .fcard-heart:hover { background: rgba(255,255,255,.32); transform: scale(1.1); }
      .fcard-heart-on { background: rgba(255,255,255,.88) !important; }
      .fcard-bottom { position: absolute; bottom: 0; left: 0; right: 0; z-index: 4; padding: 14px 12px 12px; }
      .fcard-co-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
      .fcard-co-img { width: 18px; height: 18px; border-radius: 5px; object-fit: cover; border: 1.5px solid rgba(255,255,255,.4); }
      .fcard-co-dot {
        width: 18px; height: 18px; border-radius: 5px;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 9px; font-weight: 800;
        font-family: 'Clash Display', sans-serif; border: 1.5px solid rgba(255,255,255,.4);
        flex-shrink: 0;
      }
      .fcard-co-name { font-size: 10px; font-weight: 600; color: rgba(255,255,255,.72); font-family: 'Cabinet Grotesk', sans-serif; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .fcard-urgent {
        display: inline-flex; align-items: center; gap: 3px;
        padding: 2px 7px; border-radius: 100px;
        background: rgba(255,200,0,.9); color: #000;
        font-size: 9px; font-weight: 800; font-family: 'Clash Display', sans-serif;
        letter-spacing: .04em; animation: urgentPulse 1.5s ease-in-out infinite;
        flex-shrink: 0;
      }
      .fcard-title {
        font-family: 'Clash Display', sans-serif;
        font-size: 13.5px; font-weight: 600; color: #FFFFFF;
        line-height: 1.3; margin-bottom: 5px;
        display: -webkit-box; -webkit-line-clamp: 2;
        -webkit-box-orient: vertical; overflow: hidden;
        text-shadow: 0 1px 4px rgba(0,0,0,.38);
      }
      .fcard-date { display: flex; align-items: center; gap: 4px; font-size: 9.5px; color: rgba(255,255,255,.5); font-family: 'Cabinet Grotesk', sans-serif; }

      .fcard-footer {
        padding: 10px 11px 12px; background: #FFFFFF;
        border-top: 1px solid #F2F3FA;
        display: flex; flex-direction: column; gap: 8px;
      }
      .fcard-footer-top { display: flex; align-items: center; justify-content: space-between; gap: 5px; }
      .fcard-rating-row { display: flex; align-items: center; gap: 5px; flex: 1; min-width: 0; }
      .fcard-stars { display: flex; align-items: center; gap: 1px; }
      .fcard-star-on { filter: drop-shadow(0 0 2px rgba(255,184,0,0.35)); }
      .fcard-rating-num { font-family: 'Clash Display', sans-serif; font-size: 12px; font-weight: 700; color: #0D0F14; line-height: 1; }
      .fcard-rating-ct { font-size: 10.5px; color: #8B8FA8; font-weight: 500; font-family: 'Cabinet Grotesk', sans-serif; }
      .fcard-review-icon-btn {
        flex-shrink: 0; width: 30px; height: 30px; border-radius: 10px;
        border: 1.5px solid #FFD966;
        background: linear-gradient(135deg, #FFF8E1, #FFF3CC);
        color: #B07D1A;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: all .2s cubic-bezier(.2,.9,.4,1.2);
        box-shadow: 0 2px 5px rgba(255,184,0,0.12);
      }
      .fcard-review-icon-btn:hover {
        background: linear-gradient(135deg, #FFD966, #FFB800);
        border-color: #FFB800; color: #5C3D00;
        transform: scale(1.14) rotate(-8deg);
        box-shadow: 0 4px 12px rgba(255,184,0,0.35);
      }

      .fcard-btn-primary {
        position: relative; width: 100%;
        display: flex; align-items: center; justify-content: space-between;
        padding: 0; border: none; border-radius: 12px;
        cursor: pointer; overflow: hidden;
        background: var(--btn-accent, #E30613);
        box-shadow: 0 3px 12px var(--btn-glow, rgba(227,6,19,0.22));
        transition: transform .22s cubic-bezier(.2,.9,.4,1.1), box-shadow .22s, filter .18s;
        font-family: 'Clash Display', sans-serif;
        font-size: 13px; font-weight: 700; color: #FFFFFF;
        letter-spacing: .025em; min-height: 38px;
      }
      .fcard-btn-primary:hover {
        transform: translateY(-2px) scale(1.015);
        box-shadow: 0 7px 20px var(--btn-glow, rgba(227,6,19,0.3));
        filter: brightness(1.06);
      }
      .fcard-btn-primary:active { transform: scale(.97); filter: brightness(.97); }
      .fcard-btn-primary-inner { display: flex; align-items: center; gap: 6px; padding: 9px 13px; flex: 1; }
      .fcard-btn-arrow {
        display: flex; align-items: center; justify-content: center;
        width: 34px; height: 100%;
        background: rgba(0,0,0,.18); border-left: 1px solid rgba(255,255,255,.15);
        flex-shrink: 0; transition: background .18s, transform .18s; padding: 9px 0;
      }
      .fcard-btn-primary:hover .fcard-btn-arrow { background: rgba(0,0,0,.28); transform: translateX(2px); }
      .fcard-btn-shine {
        position: absolute; top: 0; bottom: 0; width: 55%;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.16) 50%, transparent 100%);
        transform: skewX(-12deg) translateX(-180%); pointer-events: none;
      }
      .fcard-btn-primary:hover .fcard-btn-shine { animation: shineSweep .5s ease forwards; }

      /* ══════════════════════════════
         PRODUCT CARD
      ══════════════════════════════ */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
        gap: 16px;
      }
      .pcard {
        background: #FFFFFF; border-radius: 18px;
        border: 1.5px solid #EAEBF4; overflow: hidden; cursor: pointer;
        transition: transform .28s cubic-bezier(.2,.9,.4,1.1), box-shadow .28s, border-color .2s;
        opacity: 0;
      }
      .pcard-visible { animation: cardReveal .4s cubic-bezier(.34,1,.64,1) both; opacity: 1; }
      .pcard:hover { transform: translateY(-5px); box-shadow: 0 18px 36px rgba(17,19,24,.08), 0 3px 10px rgba(17,19,24,.05); border-color: #C4C6D6; }
      .pcard-img-wrap { position: relative; width: 100%; aspect-ratio: 1; background: #F4F5FB; overflow: hidden; }
      .pcard-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s cubic-bezier(.2,.9,.4,1.05); }
      .pcard:hover .pcard-img-wrap img { transform: scale(1.06); }
      .pcard-name-fallback {
        width: 100%; height: 100%;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 6px; padding: 14px;
        transition: transform .4s cubic-bezier(.2,.9,.4,1.05);
      }
      .pcard:hover .pcard-name-fallback { transform: scale(1.03); }
      .pcard-fallback-initials {
        width: 48px; height: 48px; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Clash Display', sans-serif; font-size: 18px; font-weight: 700;
        background: rgba(255,255,255,0.6); margin-bottom: 3px;
        box-shadow: 0 2px 8px rgba(0,0,0,.07);
      }
      .pcard-fallback-name {
        font-family: 'Cabinet Grotesk', sans-serif;
        font-size: 11px; font-weight: 700; text-align: center; line-height: 1.35;
        display: -webkit-box; -webkit-line-clamp: 3;
        -webkit-box-orient: vertical; overflow: hidden;
      }
      .pcard-fallback-brand { font-size: 10px; font-weight: 500; font-family: 'Cabinet Grotesk', sans-serif; opacity: 0.6; }
      .pcard-img-skeleton {
        width: 100%; height: 100%;
        background: linear-gradient(90deg, #F2F3FA 25%, #E8EAF2 50%, #F2F3FA 75%);
        background-size: 200% 100%;
        animation: skeletonPulse 1.4s ease-in-out infinite;
      }
      .pcard-shine { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.18) 0%, transparent 50%); pointer-events: none; }
      .pcard-discount {
        position: absolute; top: 9px; left: 9px;
        display: inline-flex; align-items: center; gap: 4px;
        background: #00C48C; color: #fff;
        padding: 3px 9px; border-radius: 7px;
        font-size: 9px; font-weight: 800; z-index: 1;
        font-family: 'Clash Display', sans-serif; letter-spacing: .04em;
        box-shadow: 0 2px 7px rgba(0,196,140,.38);
      }
      .pcard-save {
        position: absolute; top: 9px; right: 9px;
        width: 30px; height: 30px; border-radius: 50%;
        background: rgba(255,255,255,.9);
        border: none; display: flex; align-items: center;
        justify-content: center; cursor: pointer;
        transition: all .2s; backdrop-filter: blur(8px); z-index: 1; color: #8B8FA8;
      }
      .pcard-save:hover { transform: scale(1.14); color: #E30613; }
      .pcard-save-on { background: #FFF0F0 !important; color: #E30613; }
      .pcard-body { padding: 12px; }
      .pcard-name {
        font-family: 'Cabinet Grotesk', sans-serif;
        font-size: 12.5px; font-weight: 700; color: #0D0F14;
        margin-bottom: 7px; line-height: 1.4;
        display: -webkit-box; -webkit-line-clamp: 2;
        -webkit-box-orient: vertical; overflow: hidden;
      }
      .pcard-price-row { display: flex; align-items: baseline; gap: 7px; margin-bottom: 7px; }
      .pcard-price { font-family: 'Clash Display', sans-serif; font-size: 16px; font-weight: 700; color: #E30613; }
      .pcard-old { font-size: 11.5px; color: #8B8FA8; text-decoration: line-through; }
      .pcard-brand { display: flex; align-items: center; gap: 5px; font-size: 10.5px; color: #8B8FA8; font-family: 'Cabinet Grotesk', sans-serif; }

      /* ── Empty ── */
      .empty-state { grid-column: 1 / -1; text-align: center; padding: 72px 20px; }
      .empty-icon { width: 68px; height: 68px; margin: 0 auto 16px; background: #FFFFFF; border: 1.5px solid #EAEBF4; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      .empty-title { font-family: 'Clash Display', sans-serif; font-size: 16px; font-weight: 600; color: #0D0F14; margin-bottom: 5px; }
      .empty-sub { font-size: 13px; color: #8B8FA8; }

      /* ══════════════════════════════
         MODALS — viewport-locked
         KEY FIX: overlay never scrolls.
         Modal box is flex column, body scrolls.
      ══════════════════════════════ */
      .modal-overlay {
        position: fixed; inset: 0;
        background: rgba(13,15,20,0.75);
        backdrop-filter: blur(7px); -webkit-backdrop-filter: blur(7px);
        z-index: 200;
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
        /* Prevent the overlay itself from scrolling */
        overflow: hidden;
        animation: fadeIn .2s ease;
      }
      .modal-box {
        background: #FFFFFF; border-radius: 24px;
        width: 100%; max-width: 500px;
        /* Critical: constrain height so it fits in viewport */
        max-height: min(calc(100dvh - 32px), 700px);
        overflow: hidden;
        position: relative;
        /* Flex column so body can scroll independently */
        display: flex; flex-direction: column;
        animation: modalIn .3s cubic-bezier(.34,1.06,.64,1) both;
        border: 1.5px solid #EAEBF4;
        box-shadow: 0 32px 80px rgba(13,15,20,.26), 0 8px 28px rgba(13,15,20,.14);
      }
      .modal-pdf-box {
        max-width: 920px;
        max-height: min(94dvh, 880px);
      }
      .modal-close {
        position: absolute; top: 12px; right: 12px;
        width: 34px; height: 34px; border-radius: 50%;
        border: 1.5px solid #EAEBF4;
        background: rgba(255,255,255,.94); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        color: #8B8FA8; cursor: pointer;
        transition: all .18s cubic-bezier(.2,.9,.4,1.2); z-index: 10;
        box-shadow: 0 2px 8px rgba(0,0,0,.09);
        flex-shrink: 0;
      }
      .modal-close:hover { border-color: #E30613; color: #E30613; background: #FFF0F0; transform: scale(1.1) rotate(90deg); }
      .modal-img-wrap {
        /* Fixed height header area */
        height: 220px; display: flex; align-items: center; justify-content: center;
        overflow: hidden; flex-shrink: 0;
        background: linear-gradient(135deg, #F4F5FB 0%, #EAEBF4 100%); position: relative;
      }
      .modal-img-wrap::after {
        content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 48px;
        background: linear-gradient(to top, #FFFFFF, transparent); pointer-events: none;
      }
      .modal-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
      /* Body scrolls, not the overlay */
      .modal-body {
        padding: 20px 22px 24px;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
      }
      .modal-title { font-family: 'Clash Display', sans-serif; font-size: 17px; font-weight: 700; color: #0D0F14; line-height: 1.35; margin-bottom: 12px; padding-right: 38px; }
      .modal-pricing { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
      .modal-price { font-family: 'Clash Display', sans-serif; font-size: 22px; font-weight: 700; color: #E30613; }
      .modal-orig { font-size: 13px; color: #8B8FA8; text-decoration: line-through; }
      .modal-meta { display: flex; gap: 14px; flex-wrap: wrap; padding-top: 12px; border-top: 1.5px solid #EAEBF4; }
      .modal-pdf-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 18px; border-bottom: 1.5px solid #EAEBF4;
        gap: 10px; flex-shrink: 0; background: #FFFFFF; position: relative;
      }
      .modal-pdf-viewer { flex: 1; overflow: hidden; min-height: 0; display: flex; flex-direction: column; background: #F4F5FB; }
      .modal-action-btn {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 7px 14px; border-radius: 10px;
        border: 1.5px solid #EAEBF4; background: #FFFFFF;
        color: #0D0F14; font-size: 12px; font-weight: 700;
        transition: all .14s; cursor: pointer;
        font-family: 'Cabinet Grotesk', sans-serif;
      }
      .modal-action-btn:hover { border-color: #E30613; color: #E30613; background: #FFF0F0; }
      .pdf-nav-bar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 8px 18px; border-top: 1.5px solid #EAEBF4;
        background: #FFFFFF; flex-shrink: 0; gap: 10px;
      }
      .pdf-nav-btn {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 7px 16px; border-radius: 10px;
        border: 1.5px solid #EAEBF4; background: #FFFFFF;
        color: #0D0F14; font-size: 12.5px; font-weight: 700;
        cursor: pointer; transition: all .14s;
        font-family: 'Cabinet Grotesk', sans-serif;
      }
      .pdf-nav-btn:hover:not(:disabled) { border-color: #E30613; color: #E30613; background: #FFF0F0; }
      .pdf-nav-btn:disabled { opacity: .3; cursor: default; }
      .pdf-pips { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; justify-content: center; max-width: 280px; }
      .pip { width: 7px; height: 7px; border-radius: 50%; border: none; background: #EAEBF4; cursor: pointer; padding: 0; transition: all .16s; flex-shrink: 0; }
      .pip:hover { background: #C4C6D6; transform: scale(1.3); }
      .pip-active { background: #E30613 !important; transform: scale(1.35); }
      .react-pdf__Page { background: #FFFFFF !important; box-shadow: 0 2px 14px rgba(0,0,0,.1); }
      .react-pdf__Page__canvas { max-width: 100%; height: auto !important; display: block; }

      /* ── Drawer ── */
      .drawer-overlay { position: fixed; inset: 0; background: rgba(13,15,20,0.6); z-index: 100; animation: fadeIn .2s ease; }
      .drawer {
        position: fixed; top: 0; left: 0; bottom: 0;
        width: 278px; background: #FFFFFF;
        z-index: 101; padding: 18px 12px; overflow-y: auto;
        animation: drawerSlide .28s cubic-bezier(.4,0,.2,1);
        box-shadow: 6px 0 32px rgba(0,0,0,.14);
      }
      .drawer-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1.5px solid #F2F3FA; margin-bottom: 12px; }
      .drawer-head span { font-family: 'Clash Display', sans-serif; font-size: 14px; font-weight: 600; color: #0D0F14; }
      .drawer-head button { background: none; border: none; cursor: pointer; color: #8B8FA8; display: flex; padding: 4px; border-radius: 8px; transition: color .14s; }
      .drawer-head button:hover { color: #E30613; }

      /* ── Responsive ── */
      @media (max-width: 1400px) { .ad-right-half { display: none; } }
      @media (max-width: 1100px) {
        .sidebar-col { width: 200px; }
        .ad-right-col { display: none; }
        .main-outer { padding: 0 20px 48px; }
      }
      @media (max-width: 900px) {
        .sidebar-col { display: none; }
        .mobile-filter { display: flex; }
      }

      /* ── Mobile modal: bottom sheet ── */
      @media (max-width: 768px) {
        .modal-overlay {
          align-items: flex-end;
          padding: 0;
        }
        .modal-box {
          border-radius: 22px 22px 0 0;
          max-width: 100%;
          max-height: 92dvh;
          animation: sheetUp .32s cubic-bezier(.32,1,.5,1) both;
        }
        /* Drag handle */
        .modal-box::before {
          content: '';
          display: block;
          width: 36px; height: 4px;
          background: #C4C6D6; border-radius: 4px;
          margin: 9px auto 0; flex-shrink: 0;
        }
        .modal-pdf-box {
          max-height: 94dvh;
          border-radius: 22px 22px 0 0;
        }
        .modal-img-wrap { height: 190px; }
        .modal-body { padding: 14px 16px 24px; }
        .modal-title { font-size: 15.5px; }
        .modal-close { top: 16px; right: 14px; }
        .pdf-nav-btn span { display: none; }
        .pdf-nav-btn { padding: 8px 12px; }
        .modal-pdf-header { padding: 9px 14px; }
        .pdf-nav-bar { padding: 8px 12px; }
      }

      @media (max-width: 680px) {
        .hero { padding: 36px 0 0; }
        .hero-content { padding: 0 18px 48px; }
        .hero-stats-row { display: none; }
        .hero-quick-cats { display: none; }
        .hero-title { letter-spacing: -.025em; }
        .controls-bar { padding: 10px 14px; gap: 9px; }
        .cat-section { padding: 0 14px 10px; }
        .main-outer { padding: 0 14px 36px; }
        .flyers-grid { grid-template-columns: repeat(2, 1fr); gap: 11px; }
        .fcard { border-radius: 16px; }
        .fcard-title { font-size: 12px; }
        .fcard-footer { padding: 8px 9px 10px; gap: 7px; }
        .fcard-btn-primary { border-radius: 10px; min-height: 36px; }
        .fcard-btn-primary-inner { padding: 8px 10px; font-size: 12px; gap: 5px; }
        .fcard-btn-arrow { width: 30px; }
        .fcard-review-icon-btn { width: 28px; height: 28px; border-radius: 8px; }
        .products-grid { grid-template-columns: repeat(2, 1fr); gap: 11px; }
        .vt-btn span { display: none; }
        .vt-btn { padding: 8px 12px; }
        .ticker-avatar { width: 34px; height: 34px; border-radius: 8px; }
        .ad-top-wrap { min-height: 50px; padding: 6px 14px; }
        .ad-top { min-height: 50px; }
        .ad-top .adsbygoogle { min-height: 50px; }
      }

      @media (max-width: 420px) {
        .searchbar { min-width: 100%; order: 3; }
        .controls-bar { flex-wrap: wrap; }
        .flyers-grid { grid-template-columns: repeat(2, 1fr); gap: 9px; }
        .products-grid { grid-template-columns: repeat(2, 1fr); gap: 9px; }
        .cat-pill { padding: 6px 9px; font-size: 11px; }
        .cat-pill-count { display: none; }
        .fcard-title { font-size: 11px; }
        .fcard-co-name { display: none; }
        .fcard-btn-primary-inner span { display: none; }
        .fcard-btn-primary { border-radius: 9px; }
        .fcard-btn-primary-inner { justify-content: center; }
        .fcard-btn-arrow { display: none; }
      }
    `}</style>
  );
}