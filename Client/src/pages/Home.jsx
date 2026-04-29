import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useHomeData } from "../hooks/useHomeData";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ShoppingCart, FileText, Sparkles, Moon,
  Home as HomeIcon, Heart, Utensils, Shirt,
  GraduationCap, Smartphone, SlidersHorizontal,
  TrendingUp, Clock, AlertTriangle, Inbox,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Package, X, ZoomIn, Tag, Search,
  Flame, Calendar, Eye, Building2, Star,
} from "lucide-react";

import ProductModal from "../components/modals/ProductModal";
import PdfModal from "../components/modals/PdfModal";
import { getImageUrl } from "../api/media";

/* ─────────────────────────────────────────────
   PDF.JS WORKER
───────────────────────────────────────────── */
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
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
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&family=Poppins:wght@400;500;600;700&display=swap";

/* ─────────────────────────────────────────────
   CATEGORY TYPE META
───────────────────────────────────────────── */
const CAT_META = {
  supermarket:  { label: "Supermarkets",     Icon: ShoppingCart, accent: "#059669", bg: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", pill: "#D1FAE5", pillTx: "#065F46", glow: "rgba(5,150,105,0.2)"   },
  restaurant:   { label: "Restaurants",      Icon: Utensils,     accent: "#EA580C", bg: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", pill: "#FFEDD5", pillTx: "#9A3412", glow: "rgba(234,88,12,0.2)"   },
  health:       { label: "Health & Clinics", Icon: Heart,        accent: "#2563EB", bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", pill: "#DBEAFE", pillTx: "#1E3A8A", glow: "rgba(37,99,235,0.2)"   },
  beauty:       { label: "Beauty & Spas",    Icon: Smartphone,   accent: "#DB2777", bg: "linear-gradient(135deg,#FDF2F8,#FCE7F3)", pill: "#FCE7F3", pillTx: "#831843", glow: "rgba(219,39,119,0.2)" },
  fashion:      { label: "Fashion & Sports", Icon: Shirt,        accent: "#7C3AED", bg: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", pill: "#EDE9FE", pillTx: "#4C1D95", glow: "rgba(124,58,237,0.2)" },
  home:         { label: "Home & Garden",    Icon: HomeIcon,     accent: "#0D9488", bg: "linear-gradient(135deg,#F0FDFA,#CCFBF1)", pill: "#CCFBF1", pillTx: "#134E4A", glow: "rgba(13,148,136,0.2)" },
  online:       { label: "Online Deals",     Icon: Moon,         accent: "#D97706", bg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", pill: "#FEF3C7", pillTx: "#78350F", glow: "rgba(217,119,6,0.2)"  },
  electronics:  { label: "Electronics",      Icon: Smartphone,   accent: "#0891B2", bg: "linear-gradient(135deg,#ECFEFF,#CFFAFE)", pill: "#CFFAFE", pillTx: "#164E63", glow: "rgba(8,145,178,0.2)"  },
};
const CAT_ALL = { label: "All Offers", Icon: Sparkles, accent: T.red, bg: `linear-gradient(135deg,#FFF0F0,#FFE0E0)`, pill: "#FECDD3", pillTx: "#881337", glow: T.redGlow };
const catTypeMeta = (type) => CAT_META[type?.toLowerCase()] ?? CAT_ALL;

/* ─────────────────────────────────────────────
   NUMERIC CATEGORY COLORS
───────────────────────────────────────────── */
const CAT_COLORS = {
  1: { bg: "#EFF6FF", accent: "#2563EB", pill: "#DBEAFE", pillText: "#1E3A8A" },
  2: { bg: "#ECFDF5", accent: "#059669", pill: "#D1FAE5", pillText: "#064E3B" },
  3: { bg: "#FFF7ED", accent: "#EA580C", pill: "#FFEDD5", pillText: "#7C2D12" },
  4: { bg: "#FDF2F8", accent: "#DB2777", pill: "#FCE7F3", pillText: "#831843" },
  5: { bg: "#FEF2F2", accent: T.red,     pill: "#FEE2E2", pillText: "#7F1D1D" },
  6: { bg: "#F0FDFA", accent: "#0D9488", pill: "#CCFBF1", pillText: "#134E4A" },
  7: { bg: "#FFFBEB", accent: "#D97706", pill: "#FEF3C7", pillText: "#78350F" },
  8: { bg: "#F5F3FF", accent: "#7C3AED", pill: "#EDE9FE", pillText: "#4C1D95" },
};
const getCat = (id) => CAT_COLORS[id] ?? { bg: "#F8F9FA", accent: T.red, pill: "#FFE4E6", pillText: "#9F1239" };

/* ─────────────────────────────────────────────
   AVATAR PALETTES
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────── */
const PRODUCTS_NAV_KEY = "products";

const FIXED_PDF_NAV = [
  { key: "all",         label: "All Offers",      Icon: Sparkles,      typeValue: null          },
  { key: "supermarket", label: "Supermarkets",     Icon: ShoppingCart,  typeValue: "supermarket" },
  { key: "restaurant",  label: "Restaurants",      Icon: Utensils,      typeValue: "restaurant"  },
  { key: "health",      label: "Health & Clinics", Icon: Heart,         typeValue: "health"      },
  { key: "beauty",      label: "Beauty & Spa",     Icon: Smartphone,    typeValue: "beauty"      },
  { key: "fashion",     label: "Fashion & Sports", Icon: Shirt,         typeValue: "fashion"     },
  { key: "home",        label: "Home & Garden",    Icon: HomeIcon,      typeValue: "home"        },
  { key: "electronics", label: "Electronics",      Icon: GraduationCap, typeValue: "electronics" },
  { key: "online",      label: "Online Deals",     Icon: Moon,          typeValue: "online"      },
];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function buildPdfUrl(raw) {
  if (!raw) return null;
  let url = raw.replace(/["']/g, "").trim();
  try { url = decodeURIComponent(url); } catch (_) {}
  if (url.startsWith("/media/") || url.startsWith("/static/")) {
    url = getImageUrl(url);
  } else if (url.startsWith("/") && !url.startsWith("//")) {
    url = window.location.origin + url;
  }
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("blob:")) {
    url = "https://" + url;
  }
  return url;
}

/* ─────────────────────────────────────────────
   LAZY VISIBLE HOOK
───────────────────────────────────────────── */
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

/* ══════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════ */

function FullScreenLoader() {
  return (
    <div className="fsloader" role="status" aria-label="Loading deals">
      <div className="fsloader-inner">
        <div className="fsloader-logo">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
            <rect width="52" height="52" rx="16" fill={T.red} />
            <path d="M13 27L22 36L39 16" stroke={T.white}
              strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="fsloader-bars" aria-hidden="true">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="fsloader-bar" style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <p className="fsloader-text">Loading today's deals…</p>
      </div>
    </div>
  );
}

function AdPlaceholder({ label = "Advertisement" }) {
  return (
    <div aria-label={label} role="complementary" style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 6, width: "100%", height: "100%", minHeight: "inherit",
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
      <span style={{ fontSize: 10, color: T.muted, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

/* ── Lazy PDF Thumbnail ── */
function LazyPDFThumb({ pdfUrl, catAccent, title }) {
  const [ref, visible] = useLazyVisible("300px");
  const [thumbState, setThumbState] = useState("idle");

  useEffect(() => {
    if (visible && thumbState === "idle") setThumbState("loading");
  }, [visible, thumbState]);

  return (
    <div ref={ref} className="pdf-mag-thumb-outer">
      <div
        className="pdf-mag-fallback"
        style={{ opacity: thumbState === "ready" ? 0 : 1, background: catAccent + "18" }}
      >
        {thumbState === "loading"
          ? <div className="pdf-spin" style={{ borderTopColor: catAccent }} />
          : (
            <>
              <FileText size={32} color={catAccent} strokeWidth={1.4} />
              <span className="pdf-fallback-label">{title}</span>
            </>
          )
        }
      </div>

      {(thumbState === "loading" || thumbState === "ready") && (
        <div className="pdf-mag-doc" style={{ opacity: thumbState === "ready" ? 1 : 0 }}>
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
        <div className="pdf-mag-fallback" style={{ background: catAccent + "12" }}>
          <FileText size={32} color={catAccent} strokeWidth={1.4} />
          <span className="pdf-fallback-label">{title}</span>
        </div>
      )}
    </div>
  );
}

/* ── PDF Card ── */
function PDFCard({ pdf, onView }) {
  const m = catTypeMeta(pdf.categoryType);
  const CIcon = m.Icon;
  const pdfUrl = useMemo(() => buildPdfUrl(pdf.url), [pdf.url]);
  const [cardRef, cardVisible] = useLazyVisible("150px");

  const daysLeft = pdf.validUntil
    ? Math.max(0, Math.ceil((new Date(pdf.validUntil) - new Date()) / 86400000))
    : null;

  return (
    <article
      ref={cardRef}
      className={`pdf-mag-card ${cardVisible ? "pdf-mag-visible" : ""}`}
      onClick={() => onView(pdf)}
      aria-label={`${pdf.title} flyer from ${pdf.company}`}
    >
      <div className="pdf-mag-visual">
        <div className="pdf-mag-bg" style={{ background: m.bg }} />

        {pdfUrl && cardVisible && (
          <LazyPDFThumb pdfUrl={pdfUrl} catAccent={m.accent} title={pdf.title} />
        )}

        {(!pdfUrl || !cardVisible) && (
          <div className="pdf-mag-icon-fallback">
            <CIcon size={40} color={m.accent} strokeWidth={1.2} />
          </div>
        )}

        <div className="pdf-mag-gradient" />

        <div className="pdf-mag-top">
          <div className="pdf-mag-badge" style={{ background: m.accent }}>
            <CIcon size={9} strokeWidth={2.5} />
            <span>{m.label || pdf.categoryTypeLabel}</span>
          </div>
          {daysLeft !== null && daysLeft <= 7 && (
            <span className="pdf-mag-urgent">
              <Flame size={9} />
              {daysLeft === 0 ? "Last day!" : `${daysLeft}d left`}
            </span>
          )}
        </div>

        <div className="pdf-mag-bottom">
          <div className="pdf-mag-co-row">
            {pdf.companyLogo
              ? <img src={getImageUrl(pdf.companyLogo)} alt={pdf.company} className="pdf-mag-co-img" loading="lazy" />
              : <div className="pdf-mag-co-dot" style={{ background: m.accent }}>{(pdf.company || "C")[0]}</div>
            }
            <span className="pdf-mag-co-name">{pdf.company}</span>
          </div>
          <h4 className="pdf-mag-title">{pdf.title}</h4>
          <div className="pdf-mag-meta-row">
            {pdf.validUntil && (
              <span className="pdf-mag-date">
                <Calendar size={9} />
                Ends {pdf.validUntil}
              </span>
            )}
            <span className="pdf-mag-view-cta" style={{ background: m.accent }}>
              <Eye size={10} />
              View
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── Product Card ── */
function ProductCard({ product, onViewDeal }) {
  const [imgErr, setImgErr] = useState(false);
  const c = getCat(product.categoryId);

  return (
    <article
      className="prd-card"
      onClick={() => onViewDeal(product)}
      aria-label={`${product.title} — ${product.price}`}
    >
      <div className="prd-img-wrap">
        {product.image && !imgErr
          ? <img src={product.image} alt={product.title} onError={() => setImgErr(true)} loading="lazy" decoding="async" />
          : <div className="prd-img-ph"><Package size={32} strokeWidth={1.2} color={T.subtle} /></div>
        }
        {product.discount && (
          <div className="prd-discount">
            <Star size={9} fill={T.white} color={T.white} />
            {product.discount}
          </div>
        )}
        {product.badge && (
          <div className="prd-badge" style={{ background: c.accent }}>{product.badge}</div>
        )}
        <div className="prd-shine" />
      </div>

      <div className="prd-body">
        <p className="prd-name">{product.title}</p>
        <div className="prd-price-row">
          <span className="prd-price">{product.price}</span>
          {product.originalPrice && <span className="prd-old">{product.originalPrice}</span>}
        </div>
        <div className="prd-company">
          <Building2 size={10} color={T.muted} />
          <span>{product.company}</span>
        </div>
      </div>
    </article>
  );
}

/* ── Company Carousel ── */
function CompanyCarousel({ companies, selectedCompanyId, onSelect }) {
  const trackRef = useRef(null);
  const wrapRef  = useRef(null);
  const [offset, setOffset] = useState(0);
  const STEP = 220;

  const getMax = useCallback(() => {
    if (!trackRef.current || !wrapRef.current) return 0;
    return Math.max(0, trackRef.current.scrollWidth - wrapRef.current.clientWidth);
  }, []);

  useEffect(() => {
    if (trackRef.current)
      trackRef.current.style.transform = `translateX(-${offset}px)`;
  }, [offset]);

  useEffect(() => { setOffset(0); }, [companies]);

  if (!companies?.length) return null;

  return (
    <nav className="co-carousel" aria-label="Filter by store">
      <button className="co-nav-btn" disabled={offset === 0}
        onClick={() => setOffset(o => Math.max(0, o - STEP))} aria-label="Scroll left">
        <ChevronLeft size={14} />
      </button>
      <div ref={wrapRef} className="co-wrap">
        <div ref={trackRef} className="co-track">
          <button
            className={`co-pill co-pill-all ${selectedCompanyId === null ? "co-pill-on" : ""}`}
            onClick={() => onSelect(null)}
            aria-pressed={selectedCompanyId === null}
          >
            <Sparkles size={12} strokeWidth={selectedCompanyId === null ? 2.5 : 1.8} />
            <span>All</span>
          </button>

          {companies.map((c, i) => {
            const pal      = AVATAR_PALETTES[i % AVATAR_PALETTES.length];
            const isActive = selectedCompanyId === c.id;
            return (
              <button
                key={c.id}
                className={`co-pill ${isActive ? "co-pill-on" : ""}`}
                title={c.name}
                aria-pressed={isActive}
                aria-label={`Filter by ${c.name}`}
                onClick={() => onSelect(isActive ? null : c.id)}
              >
                <div className="co-pill-avatar" style={!c.logo ? { background: pal.bg, color: pal.text } : {}}>
                  {c.logo
                    ? <img src={getImageUrl(c.logo)} alt={c.name} loading="lazy" />
                    : <span>{c.name?.slice(0, 2).toUpperCase()}</span>
                  }
                </div>
                <span>{c.name?.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
      <button className="co-nav-btn" onClick={() => setOffset(o => Math.min(getMax(), o + STEP))} aria-label="Scroll right">
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}

/* ── Sidebar ── */
function Sidebar({ categories, active, onSelect, onClose }) {
  const [openIds, setOpenIds] = useState({});
  const toggle = id => setOpenIds(p => ({ ...p, [id]: !p[id] }));

  return (
    <aside className="sidebar" aria-label="Product categories">
      {onClose && (
        <button className="sidebar-close" onClick={onClose} aria-label="Close categories">
          <X size={16} />
        </button>
      )}
      <div className="sidebar-heading">
        <SlidersHorizontal size={13} color={T.red} />
        Categories
      </div>

      <button
        className={`scat-item ${active.catId === null && active.subId === null ? "active" : ""}`}
        onClick={() => { onSelect({ catId: null, subId: null }); onClose?.(); }}
      >
        <span className="scat-dot" style={{ background: active.catId === null ? T.red : T.border }} />
        <span className="scat-label">All Products</span>
        {active.catId === null && <span className="scat-badge">All</span>}
      </button>

      {categories?.map(cat => {
        const hasSub   = cat.subcategories?.length > 0;
        const isOpen   = openIds[cat.id];
        const isActive = active.catId === cat.id && active.subId === null;
        const c        = getCat(cat.id);
        return (
          <div key={cat.id}>
            <button className={`scat-item ${isActive ? "active" : ""}`}
              style={isActive ? { background: T.redLight } : {}}>
              <span className="scat-dot" style={{ background: isActive ? c.accent : T.border }} />
              <span className="scat-label"
                onClick={() => { onSelect({ catId: cat.id, subId: null }); onClose?.(); }}>
                {cat.name}
              </span>
              {cat.count > 0 && <em className="scat-count">{cat.count}</em>}
              {hasSub && (
                <span className="scat-expand"
                  onClick={e => { e.stopPropagation(); toggle(cat.id); }}
                  aria-label={isOpen ? "Collapse" : "Expand"}>
                  {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>
              )}
            </button>
            {hasSub && isOpen && (
              <div className="scat-subs">
                {cat.subcategories.map(sub => (
                  <button
                    key={sub.id}
                    className={`scat-sub ${active.subId === sub.id ? "active" : ""}`}
                    onClick={() => { onSelect({ catId: cat.id, subId: sub.id }); onClose?.(); }}
                  >
                    <span className="sub-dot"
                      style={{ background: active.subId === sub.id ? c.accent : T.subtle }} />
                    {sub.name}
                    {sub.count > 0 && <em className="scat-count">{sub.count}</em>}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
}

function EmptyState({ message, sub }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-icon"><Inbox size={40} strokeWidth={1.2} color={T.subtle} /></div>
      <p className="empty-title">{message}</p>
      <p className="empty-sub">{sub}</p>
    </div>
  );
}

function PaginationBar({ page, total, onNext, onPrev, hasNext, hasPrev }) {
  return (
    <nav className="pagination" aria-label="Page navigation">
      <button className="pg-btn" onClick={onPrev} disabled={!hasPrev} aria-label="Previous page">
        <ChevronLeft size={14} /> Prev
      </button>
      <span style={{ padding: "0 10px", fontSize: 13, color: T.slate }} aria-current="page">
        Page {page} of {total}
      </span>
      <button className="pg-btn" onClick={onNext} disabled={!hasNext} aria-label="Next page">
        Next <ChevronRight size={14} />
      </button>
    </nav>
  );
}

/* ══════════════════════════════════════════════
   MAIN HOME
══════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();

  const [activeNav,       setActiveNav]       = useState("all");
  const [activeTab,       setActiveTab]       = useState("top");
  const [active,          setActive]          = useState({ catId: null, subId: null });
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [productModal,    setProductModal]    = useState(null);
  const [pdfModal,        setPdfModal]        = useState(null);

  // Independent pagination cursors — null means "page 1"
  const [productPageUrl, setProductPageUrl] = useState(null);
  const [flyerPageUrl,   setFlyerPageUrl]   = useState(null);

  const showPDFs = activeNav !== PRODUCTS_NAV_KEY;

  // Redirect logged-in users to their own dashboards
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin")        navigate("/admin");
    else if (role === "company") navigate("/company");
    else if (role === "user")    navigate("/user/home");
  }, [navigate]);

  const [resolvedTypeValue, setResolvedTypeValue] = useState(null);

  // ── Hook — stateless about pagination; cursors come from above ──
  const {
    companies, categories, pdfCategoryTypes,
    products, pdfs, pagination, loading, error,
  } = useHomeData({
    filters: {
      category: active.catId,
      sub:      active.subId,
      company:  selectedCompany,
      type:     resolvedTypeValue,
      ordering: activeTab === "latest" ? "-created_at" : "-is_featured",
    },
    productPageUrl,
    flyerPageUrl,
  });

  const pdfResults = pdfs?.results || [];

  const pdfNavItems = useMemo(() => {
    if (!pdfCategoryTypes?.length) return FIXED_PDF_NAV;
    const fixedKeys = new Set(FIXED_PDF_NAV.map(n => n.typeValue).filter(Boolean));
    const extras = pdfCategoryTypes
      .filter(ct => {
        const key = (ct.type_key || ct.name || "").toLowerCase().replace(/\s+/g, "_");
        return !fixedKeys.has(key);
      })
      .map(ct => ({
        key:       `type_${ct.id}`,
        label:     ct.name,
        Icon:      Tag,
        typeValue: ct.type_key || ct.name?.toLowerCase().replace(/\s+/g, "_"),
      }));
    return [...FIXED_PDF_NAV, ...extras];
  }, [pdfCategoryTypes]);

  useEffect(() => {
    const navItem = pdfNavItems.find(n => n.key === activeNav);
    setResolvedTypeValue(navItem ? navItem.typeValue : null);
  }, [pdfNavItems, activeNav]);

  const currentPdfNav = useMemo(
    () => pdfNavItems.find(n => n.key === activeNav) ?? pdfNavItems[0],
    [pdfNavItems, activeNav],
  );

  // ── Reset BOTH cursors on tab switch → always lands on page 1 ──
  useEffect(() => {
    setSelectedCompany(null);
    setActive({ catId: null, subId: null });
    setProductPageUrl(null);
    setFlyerPageUrl(null);
  }, [activeNav]);

  // ── Reset product cursor when product filters change ──
  useEffect(() => {
    setProductPageUrl(null);
  }, [active.catId, active.subId, selectedCompany, activeTab]);

  // ── Reset flyer cursor when flyer filters change ──
  useEffect(() => {
    setFlyerPageUrl(null);
  }, [resolvedTypeValue, selectedCompany]);

  // ── Pagination source depends on which tab is active ──
  const paginationSource = showPDFs ? (pdfs || {}) : pagination;

  const page = useMemo(() => {
    const activeUrl = showPDFs ? flyerPageUrl : productPageUrl;
    if (!activeUrl) return 1;
    try {
      const param = showPDFs ? "flyer_page" : "page";
      return parseInt(new URL(activeUrl).searchParams.get(param) || "1", 10);
    } catch (_) {
      return 1;
    }
  }, [showPDFs, flyerPageUrl, productPageUrl]);

  const totalPages = Math.max(
    1,
    Math.ceil((paginationSource?.count || 0) / 10),
  );

  // ── Advance only the relevant cursor ──
  const handleNext = useCallback(() => {
    if (!paginationSource?.next) return;
    if (showPDFs) setFlyerPageUrl(paginationSource.next);
    else          setProductPageUrl(paginationSource.next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paginationSource?.next, showPDFs]);

  const handlePrev = useCallback(() => {
    if (!paginationSource?.previous) return;
    if (showPDFs) setFlyerPageUrl(paginationSource.previous);
    else          setProductPageUrl(paginationSource.previous);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paginationSource?.previous, showPDFs]);

  // ── Format PDFs ──
  const formattedPdfs = useMemo(() => {
    const fromTop = (pdfResults || []).map(p => ({
      id:                p.id,
      title:             p.title,
      url:               p.pdf ? p.pdf.replace(/["']/g, "").trim() : null,
      company:           p.company_name  || "",
      companyId:         p.company_id    || null,
      companyLogo:       p.company_logo  || null,
      validUntil:        p.end_date      || null,
      categoryType:      p.category_type || null,
      categoryTypeLabel: p.category_type || null,
      catColorId:        p.cat_color_id  || p.category_id || null,
    }));

    const fromCompanies = (companies || []).flatMap(co =>
      (co.pdfs || []).map(p => ({
        id:                p.id,
        title:             p.title,
        url:               p.pdf ? p.pdf.replace(/["']/g, "").trim() : null,
        company:           co.name,
        companyId:         co.id,
        companyLogo:       co.logo         || null,
        validUntil:        p.end_date      || null,
        categoryType:      p.category_type || co.category_type || null,
        categoryTypeLabel: p.category_type || co.category_type || null,
        catColorId:        p.cat_color_id  || p.category_id    || null,
      }))
    );

    const seen = new Set();
    let all = [...fromTop, ...fromCompanies].filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    if (selectedCompany !== null)
      all = all.filter(p => p.companyId === selectedCompany);
    if (resolvedTypeValue !== null)
      all = all.filter(p => p.categoryType?.toLowerCase() === resolvedTypeValue.toLowerCase());
    return all;
  }, [pdfs, companies, selectedCompany, resolvedTypeValue]);

  // ── Format Products ──
  const formattedProducts = useMemo(() => {
    let list = (products || []).map(p => ({
      id:            p.id,
      title:         p.name,
      price:         `QAR ${parseFloat(p.price).toLocaleString("en-QA")}`,
      originalPrice: p.old_price
        ? `QAR ${parseFloat(p.old_price).toLocaleString("en-QA")}` : null,
      discount: p.old_price
        ? `${Math.round(((parseFloat(p.old_price) - parseFloat(p.price)) / parseFloat(p.old_price)) * 100)}% OFF`
        : null,
      image:         p.image          || null,
      categoryId:    p.category_id,
      categoryName:  p.category_name  || "",
      subCategoryId: p.subcategory_id || null,
      company:       p.company_name   || "",
      companyId:     p.company_id     || null,
      badge:         p.is_featured    ? "Featured" : null,
    }));
    if (selectedCompany !== null)
      list = list.filter(p => p.companyId === selectedCompany);
    return list;
  }, [products, selectedCompany]);

  const sidebarCategories = useMemo(() =>
    (categories || []).map(cat => ({
      id:    cat.id,
      name:  cat.name,
      count: (cat.products?.length || 0) +
             (cat.subcategories || []).reduce((acc, s) => acc + (s.products?.length || 0), 0),
      subcategories: (cat.subcategories || []).map(sub => ({
        id:    sub.id,
        name:  sub.name,
        count: sub.products?.length || 0,
      })),
    })),
  [categories]);

  const displayItems = showPDFs ? formattedPdfs : formattedProducts;

  const sectionTitle = useMemo(() => {
    if (!showPDFs) {
      if (active.subId !== null) {
        for (const cat of (categories || [])) {
          const sub = cat.subcategories?.find(s => s.id === active.subId);
          if (sub) return `${cat.name} › ${sub.name}`;
        }
      }
      if (active.catId !== null)
        return categories?.find(c => c.id === active.catId)?.name || "Products";
      return "All Products";
    }
    const companyName = selectedCompany
      ? companies?.find(c => c.id === selectedCompany)?.name : null;
    return companyName
      ? `${companyName} — ${currentPdfNav.label}`
      : currentPdfNav.label;
  }, [showPDFs, active, categories, selectedCompany, companies, currentPdfNav]);

  useEffect(() => {
    document.title = showPDFs
      ? `${sectionTitle} | Daily Deals Qatar — Flyers & Catalogues`
      : `${sectionTitle} | Daily Deals Qatar — Products & Offers`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.content = showPDFs
        ? `Browse ${sectionTitle} flyers and catalogues. Find the best deals in Qatar.`
        : `Discover ${sectionTitle} deals and discounts in Qatar. Compare prices and save.`;
    }
  }, [sectionTitle, showPDFs]);

  /* ── RENDER ── */
  if (loading) return <><style>{CSS}</style><FullScreenLoader /></>;

  if (error) return (
    <>
      <style>{CSS}</style>
      <div className="full-center" role="alert">
        <AlertTriangle size={40} color={T.red} strokeWidth={1.5} />
        <p style={{ color: T.red, marginTop: 14, fontSize: 14 }}>{error}</p>
      </div>
    </>
  );

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <style>{CSS}</style>

      <div className="root">

        {productModal && <ProductModal product={productModal} onClose={() => setProductModal(null)} />}
        {pdfModal    && <PdfModal     pdf={pdfModal}         onClose={() => setPdfModal(null)}     />}

        {/* ── TOP NAV ── */}
        <nav className="topnav" aria-label="Main navigation">
          <div className="topnav-inner">
            <button
              className={`navpill navpill-products ${activeNav === PRODUCTS_NAV_KEY ? "active" : ""}`}
              onClick={() => setActiveNav(PRODUCTS_NAV_KEY)}
              aria-pressed={activeNav === PRODUCTS_NAV_KEY}
            >
              <ShoppingCart size={13} strokeWidth={2} />
              Products
            </button>

            <div className="nav-divider" aria-hidden="true" />

            {pdfNavItems.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`navpill ${activeNav === key ? "active" : ""}`}
                onClick={() => setActiveNav(key)}
                aria-pressed={activeNav === key}
              >
                <Icon size={13} strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── TOP BANNER AD ── */}
        <div className="top-ad-container">
          <AdPlaceholder label="Advertisement · 728×90" />
        </div>

        {/* ── BODY ── */}
        <div className="body">

          <div className={`sidebar-col ${showPDFs ? "sidebar-col-hidden" : ""}`}>
            <Sidebar
              categories={sidebarCategories}
              active={active}
              onSelect={sel => setActive(sel)}
            />
          </div>

          <main className="main" id="main-content">

            <CompanyCarousel
              companies={companies}
              selectedCompanyId={selectedCompany}
              onSelect={setSelectedCompany}
            />

            <div className="sec-hdr">
              <div>
                <h1 className="sec-title">
                  <span className="sec-bold">{sectionTitle}</span>
                  <span className="sec-muted">
                    {showPDFs ? " — Flyers & Catalogues" : " — Deals & Offers"}
                  </span>
                </h1>
                <div className="sec-count">
                  {showPDFs
                    ? `${displayItems.length} flyer${displayItems.length !== 1 ? "s" : ""}`
                    : `${pagination?.count ?? 0} product${(pagination?.count ?? 0) !== 1 ? "s" : ""}${totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}`
                  }
                </div>
              </div>

              <div className="sec-controls">
                {!showPDFs && (
                  <button className="filter-btn" onClick={() => setDrawerOpen(true)}
                    aria-label="Open categories filter">
                    <SlidersHorizontal size={13} /> Categories
                  </button>
                )}
                {selectedCompany !== null && (
                  <button className="clear-chip" onClick={() => setSelectedCompany(null)}
                    aria-label="Clear store filter">
                    <X size={11} /> Clear store
                  </button>
                )}
                {!showPDFs && (
                  <div className="tabs" role="tablist" aria-label="Sort products">
                    {[
                      { id: "top",    label: "Top Picks", Icon: TrendingUp },
                      { id: "latest", label: "Latest",    Icon: Clock      },
                    ].map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        role="tab"
                        className={`tab ${activeTab === id ? "active" : ""}`}
                        aria-selected={activeTab === id}
                        onClick={() => setActiveTab(id)}
                      >
                        <Icon size={12} strokeWidth={2} /> {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {displayItems.length > 0 ? (
              <div className={showPDFs ? "pdf-grid" : "prd-grid"} role="list"
                aria-label={showPDFs ? "Flyers" : "Products"}>
                {displayItems.map(item =>
                  showPDFs
                    ? <PDFCard     key={item.id} pdf={item}     onView={p => setPdfModal(p)}         />
                    : <ProductCard key={item.id} product={item} onViewDeal={p => setProductModal(p)} />
                )}
              </div>
            ) : (
              <EmptyState
                message={showPDFs ? "No flyers found" : "No products found"}
                sub={
                  showPDFs
                    ? selectedCompany
                      ? "This store has no flyers in this category"
                      : currentPdfNav.key !== "all"
                        ? `No flyers available for ${currentPdfNav.label} yet`
                        : "Check back soon for new deals"
                    : "Try a different category from the sidebar"
                }
              />
            )}

            <PaginationBar
              page={page}
              total={totalPages}
              onNext={handleNext}
              onPrev={handlePrev}
              hasNext={!!paginationSource?.next}
              hasPrev={!!paginationSource?.previous}
            />
          </main>

          <aside className="right-ad-col" aria-label="Advertisements">
            <div className="right-ad-container">
              <AdPlaceholder label="Advertisement · 300×250" />
            </div>
            <div className="right-ad-container right-ad-tall" style={{ marginTop: 16 }}>
              <AdPlaceholder label="Advertisement · 300×600" />
            </div>
          </aside>
        </div>

        {/* Mobile drawer */}
        {!showPDFs && drawerOpen && (
          <div className="overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
        )}
        {!showPDFs && (
          <div className={`drawer ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
            <Sidebar
              categories={sidebarCategories}
              active={active}
              onSelect={sel => { setActive(sel); setDrawerOpen(false); }}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════
   CSS  (unchanged from original)
══════════════════════════════════════════════ */
const CSS = `
@keyframes spin        { to { transform: rotate(360deg); } }
@keyframes fadeIn      { from { opacity:0; } to { opacity:1; } }
@keyframes slideUp     { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
@keyframes fadeInUp    { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
@keyframes barPulse    { 0%,100% { transform:scaleY(.4); opacity:.4; } 50% { transform:scaleY(1); opacity:1; } }
@keyframes logoIn      { from { opacity:0; transform:scale(.65) rotate(-12deg); } to { opacity:1; transform:scale(1) rotate(0); } }
@keyframes cardReveal  { from { opacity:0; transform:translateY(20px) scale(.96); } to { opacity:1; transform:none; } }
@keyframes urgentPulse { 0%,100% { opacity:1; } 50% { opacity:.6; } }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
button { font-family: inherit; cursor: pointer; }
a      { text-decoration: none; }

.root {
  font-family: 'Inter', sans-serif, -apple-system, 'Segoe UI', sans-serif;
  background: ${T.bg};
  min-height: 100vh;
  color: ${T.dark};
}

/* ── Loader ── */
.fsloader       { position:fixed; inset:0; background:${T.white}; display:flex; align-items:center; justify-content:center; z-index:9999; animation:fadeIn .2s; }
.fsloader-inner { display:flex; flex-direction:column; align-items:center; gap:28px; }
.fsloader-logo  { animation:logoIn .55s cubic-bezier(.34,1.56,.64,1) both; filter:drop-shadow(0 8px 24px ${T.redGlow}); }
.fsloader-bars  { display:flex; align-items:center; gap:5px; height:36px; }
.fsloader-bar   { width:4px; height:28px; background:${T.red}; border-radius:4px; animation:barPulse .9s ease-in-out infinite; transform-origin:bottom; }
.fsloader-text  { font-size:13px; color:${T.muted}; font-weight:500; letter-spacing:.02em; animation:fadeInUp .5s .25s ease both; }

/* ── Top Nav ── */
.topnav       { background:${T.white}; border-bottom:1px solid ${T.border}; position:sticky; top:0; z-index:40; box-shadow:0 1px 16px rgba(13,15,20,.06); }
.topnav-inner { max-width:1400px; margin:0 auto; display:flex; align-items:center; gap:5px; overflow-x:auto; padding:10px 20px; scrollbar-width:none; }
.topnav-inner::-webkit-scrollbar { display:none; }

.navpill {
  display:inline-flex; align-items:center; gap:6px; flex-shrink:0;
  padding:8px 17px; border-radius:100px; border:1.5px solid ${T.border};
  background:${T.white}; color:${T.slate}; font-size:12.5px; font-weight:700;
  white-space:nowrap; transition:all .18s cubic-bezier(.4,0,.2,1);
  font-family:'Inter', sans-serif; letter-spacing:.01em;
}
.navpill:hover            { border-color:${T.red}; color:${T.red}; background:${T.redLight}; transform:translateY(-1px); }
.navpill.active           { background:${T.red}; border-color:${T.red}; color:${T.white}; box-shadow:0 4px 14px ${T.redGlow}; }
.navpill-products         { border-color:${T.border}; background:${T.bgCard}; }
.navpill-products.active  { background:${T.dark}; border-color:${T.dark}; color:${T.white}; box-shadow:0 4px 14px rgba(13,15,20,.25); }
.nav-divider              { flex-shrink:0; width:1px; height:28px; background:${T.border}; margin:0 4px; }

/* ── Banner Ad ── */
.top-ad-container {
  max-width:1400px; margin:16px auto 0; padding:0 20px;
  min-height:90px; background:${T.white};
  border:1.5px dashed ${T.border}; border-radius:16px;
  display:flex; align-items:center; justify-content:center;
}

/* ── Layout ── */
.body         { max-width:1400px; margin:0 auto; padding:20px 20px 60px; display:flex; gap:20px; align-items:flex-start; }
.sidebar-col  { width:240px; flex-shrink:0; }
.sidebar-col-hidden { width:0 !important; overflow:hidden; }
.main         { flex:1; min-width:0; }
.right-ad-col { width:300px; flex-shrink:0; }
.right-ad-container { position:sticky; top:80px; min-width:300px; min-height:250px; background:${T.white}; border:1.5px dashed ${T.border}; border-radius:16px; display:flex; align-items:center; justify-content:center; }
.right-ad-tall { min-height:600px; }

/* ── Sidebar ── */
.sidebar {
  background:${T.white}; border:1.5px solid ${T.border};
  border-radius:20px; padding:18px 14px;
  position:sticky; top:72px;
  max-height:calc(100vh - 96px); overflow-y:auto;
  scrollbar-width:thin; scrollbar-color:${T.border} transparent;
}
.sidebar-close {
  position:absolute; top:12px; right:12px;
  background:none; border:none; color:${T.muted};
  display:flex; padding:4px; border-radius:8px;
  transition:color .15s; cursor:pointer;
}
.sidebar-close:hover { color:${T.red}; }
.sidebar-heading {
  display:flex; align-items:center; gap:8px;
  font-family: 'Poppins', sans-serif;
  font-size:11px; font-weight:600; color:${T.dark};
  text-transform:uppercase; letter-spacing:.1em;
  padding-bottom:14px; border-bottom:1.5px solid ${T.borderLight};
  margin-bottom:14px;
}
.scat-item {
  width:100%; display:flex; align-items:center; gap:9px;
  padding:9px 11px; border:none; background:transparent;
  border-radius:11px; font-size:13px; font-weight:600;
  color:${T.charcoal}; cursor:pointer;
  transition:all .18s; margin-bottom:2px;
  font-family:'Inter', sans-serif; text-align:left;
}
.scat-item:hover  { background:${T.bg}; }
.scat-item.active { background:${T.redLight} !important; color:${T.red}; }
.scat-dot   { width:7px; height:7px; border-radius:50%; flex-shrink:0; transition:background .15s; }
.scat-label { flex:1; cursor:pointer; }
.scat-count { font-style:normal; font-size:10.5px; color:${T.muted}; background:${T.borderLight}; padding:2px 8px; border-radius:8px; margin-left:auto; }
.scat-badge { font-size:10px; background:${T.red}; color:${T.white}; padding:1px 7px; border-radius:8px; font-weight:700; }
.scat-expand { color:${T.muted}; display:flex; align-items:center; padding:2px; cursor:pointer; }
.scat-subs  { padding:2px 0 4px 22px; display:flex; flex-direction:column; gap:1px; }
.scat-sub {
  width:100%; display:flex; align-items:center; gap:7px;
  padding:6px 9px; border-radius:8px; border:none; background:transparent;
  font-size:12px; color:${T.muted}; cursor:pointer; text-align:left;
  font-family:inherit; transition:all .15s;
}
.scat-sub:hover  { background:${T.bg}; color:${T.dark}; }
.scat-sub.active { background:${T.redLight}; color:${T.red}; font-weight:700; }
.sub-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; transition:background .15s; }

/* ── Company Carousel ── */
.co-carousel {
  background:${T.white}; border:1.5px solid ${T.border};
  border-radius:20px; padding:12px 14px;
  margin-bottom:20px; display:flex; align-items:center; gap:8px;
}
.co-wrap  { flex:1; overflow:hidden; }
.co-track { display:flex; gap:8px; transition:transform .32s cubic-bezier(.4,0,.2,1); }

.co-pill {
  display:inline-flex; align-items:center; gap:8px; flex-shrink:0;
  padding:7px 16px 7px 8px; border-radius:100px;
  border:1.5px solid ${T.border}; background:${T.white};
  color:${T.slate}; font-size:12.5px; font-weight:700;
  white-space:nowrap; cursor:pointer;
  transition:all .2s; font-family:'Inter', sans-serif;
}
.co-pill:hover { border-color:${T.red}; color:${T.red}; transform:translateY(-2px); box-shadow:0 4px 12px ${T.redGlow}; }
.co-pill-on   { background:${T.red}; border-color:${T.red}; color:${T.white}; box-shadow:0 4px 14px ${T.redGlow}; transform:translateY(-2px); }
.co-pill-all  { padding:7px 16px; }

.co-pill-avatar {
  width:26px; height:26px; border-radius:50%;
  overflow:hidden; flex-shrink:0; display:flex;
  align-items:center; justify-content:center;
  font-size:9px; font-weight:800;
  font-family:'Poppins', sans-serif;
}
.co-pill-avatar img  { width:100%; height:100%; object-fit:contain; }
.co-pill-on .co-pill-avatar { background:rgba(255,255,255,.22); color:${T.white}; }

.co-nav-btn {
  flex-shrink:0; width:34px; height:34px; border-radius:50%;
  border:1.5px solid ${T.border}; background:${T.white};
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:${T.charcoal}; transition:all .18s;
}
.co-nav-btn:hover:not(:disabled) { background:${T.red}; border-color:${T.red}; color:${T.white}; }
.co-nav-btn:disabled { opacity:.3; cursor:default; }

/* ── Section header ── */
.sec-hdr { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; gap:12px; flex-wrap:wrap; }
.sec-title { font-size:15px; line-height:1.4; }
.sec-bold  { font-weight:700; color:${T.dark}; font-family:'Poppins', sans-serif; font-size:18px; }
.sec-muted { font-weight:400; color:${T.muted}; font-size:13px; }
.sec-count { font-size:12px; margin-top:4px; color:${T.muted}; font-family:'Inter', sans-serif; }
.sec-controls  { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.filter-btn    { display:none; align-items:center; gap:6px; padding:8px 14px; background:${T.white}; border:1.5px solid ${T.border}; border-radius:12px; font-size:13px; font-weight:700; color:${T.red}; transition:all .15s; cursor:pointer; font-family:inherit; }
.filter-btn:hover { border-color:${T.red}; background:${T.redLight}; }
.clear-chip { display:inline-flex; align-items:center; gap:5px; padding:7px 13px; border-radius:100px; border:1.5px solid ${T.red}; background:${T.redLight}; color:${T.red}; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; }
.clear-chip:hover { background:${T.red}; color:${T.white}; }
.tabs { display:flex; border:1.5px solid ${T.border}; border-radius:12px; overflow:hidden; background:${T.white}; }
.tab  { display:inline-flex; align-items:center; gap:5px; padding:7px 16px; border:none; background:transparent; font-size:12.5px; font-weight:700; color:${T.muted}; transition:all .15s; white-space:nowrap; cursor:pointer; font-family:inherit; }
.tab:first-child        { border-right:1.5px solid ${T.border}; }
.tab.active             { background:${T.red}; color:${T.white}; }
.tab:not(.active):hover { background:${T.bg}; color:${T.dark}; }

/* ══════════════════════════════════
   PDF MAGAZINE GRID & CARD
══════════════════════════════════ */
.pdf-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));
  gap:20px;
}

.pdf-mag-card {
  position:relative; border-radius:22px; overflow:hidden;
  cursor:pointer; background:${T.darkMid};
  aspect-ratio:3/4.2;
  transition:transform .35s cubic-bezier(.2,.9,.4,1.1), box-shadow .35s;
  box-shadow:0 4px 20px rgba(0,0,0,.1);
  opacity:0;
}
.pdf-mag-visible {
  animation:cardReveal .42s cubic-bezier(.34,1,.64,1) both;
  opacity:1;
}
.pdf-mag-card:hover {
  transform:translateY(-10px) rotate(-0.5deg) scale(1.015);
  box-shadow:0 30px 60px rgba(0,0,0,.22), 0 10px 20px rgba(0,0,0,.1);
}

.pdf-mag-visual { position:absolute; inset:0; display:flex; flex-direction:column; }

.pdf-mag-bg { position:absolute; inset:0; z-index:0; }

.pdf-mag-thumb-outer { position:absolute; inset:0; z-index:2; overflow:hidden; }
.pdf-mag-fallback {
  position:absolute; inset:0; z-index:1;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:10px;
  transition:opacity .4s ease;
}
.pdf-fallback-label {
  font-size:11px; font-weight:600; color:${T.dark};
  line-height:1.3; text-align:center; padding:0 12px;
  display:-webkit-box; -webkit-line-clamp:2;
  -webkit-box-orient:vertical; overflow:hidden; opacity:.7;
}
.pdf-spin {
  width:26px; height:26px; border-radius:50%;
  border:3px solid rgba(0,0,0,.1);
  animation:spin .75s linear infinite;
}
.pdf-mag-doc {
  position:absolute; inset:0; z-index:2;
  display:flex; align-items:flex-start; justify-content:center;
  overflow:hidden; transition:opacity .4s ease;
}
.pdf-mag-doc .react-pdf__Document { width:100%; }
.pdf-mag-doc .react-pdf__Page__canvas { width:100% !important; height:auto !important; display:block; }

.pdf-mag-icon-fallback { position:absolute; inset:0; z-index:1; display:flex; align-items:center; justify-content:center; opacity:.5; }

.pdf-mag-gradient {
  position:absolute; inset:0; z-index:3;
  background:
    linear-gradient(to bottom,
      rgba(0,0,0,.55) 0%,
      transparent 35%,
      transparent 50%,
      rgba(0,0,0,.78) 100%
    );
}

.pdf-mag-top {
  position:absolute; top:12px; left:12px; right:12px; z-index:4;
  display:flex; align-items:flex-start; justify-content:space-between; gap:8px;
}
.pdf-mag-badge {
  display:inline-flex; align-items:center; gap:5px;
  padding:5px 11px; border-radius:100px;
  font-size:9px; font-weight:800; text-transform:uppercase;
  letter-spacing:.07em; color:${T.white};
  font-family:'Poppins', sans-serif;
  box-shadow:0 2px 10px rgba(0,0,0,.3);
}
.pdf-mag-urgent {
  display:inline-flex; align-items:center; gap:4px;
  padding:4px 10px; border-radius:100px;
  background:rgba(255,200,0,.92); color:#000;
  font-size:9px; font-weight:800;
  font-family:'Poppins', sans-serif; letter-spacing:.04em;
  animation:urgentPulse 1.5s ease-in-out infinite; flex-shrink:0;
}

.pdf-mag-bottom  { position:absolute; bottom:0; left:0; right:0; z-index:4; padding:18px 16px 16px; }
.pdf-mag-co-row  { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.pdf-mag-co-img  { width:22px; height:22px; border-radius:6px; object-fit:cover; border:1.5px solid rgba(255,255,255,.4); }
.pdf-mag-co-dot  { width:22px; height:22px; border-radius:6px; display:flex; align-items:center; justify-content:center; color:${T.white}; font-size:11px; font-weight:800; font-family:'Poppins', sans-serif; border:1.5px solid rgba(255,255,255,.4); }
.pdf-mag-co-name { font-size:11px; font-weight:600; color:rgba(255,255,255,.75); font-family:'Inter', sans-serif; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.pdf-mag-title   {
  font-family:'Poppins', sans-serif;
  font-size:15px; font-weight:600; color:${T.white};
  line-height:1.35; margin-bottom:10px;
  display:-webkit-box; -webkit-line-clamp:2;
  -webkit-box-orient:vertical; overflow:hidden;
  text-shadow:0 1px 4px rgba(0,0,0,.4);
}
.pdf-mag-meta-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.pdf-mag-date {
  display:flex; align-items:center; gap:5px;
  font-size:10px; color:rgba(255,255,255,.6);
  font-family:'Inter', sans-serif;
}
.pdf-mag-view-cta {
  display:inline-flex; align-items:center; gap:5px;
  padding:5px 14px; border-radius:100px;
  font-size:10.5px; font-weight:800; color:${T.white};
  font-family:'Poppins', sans-serif; letter-spacing:.04em;
  box-shadow:0 3px 12px rgba(0,0,0,.25); transition:transform .2s;
}
.pdf-mag-card:hover .pdf-mag-view-cta { transform:scale(1.06); }

/* ══════════════════════════════════
   PRODUCT GRID & CARD
══════════════════════════════════ */
.prd-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill, minmax(185px, 1fr));
  gap:18px;
}

.prd-card {
  background:${T.white}; border-radius:20px;
  border:1.5px solid ${T.border}; overflow:hidden;
  cursor:pointer;
  transition:transform .3s cubic-bezier(.2,.9,.4,1.1), box-shadow .3s, border-color .2s;
}
.prd-card:hover {
  transform:translateY(-6px);
  box-shadow:0 20px 40px rgba(13,15,20,.09), 0 4px 12px rgba(13,15,20,.06);
  border-color:${T.subtle};
}
.prd-img-wrap {
  position:relative; width:100%; aspect-ratio:1;
  background:${T.bg}; overflow:hidden;
}
.prd-img-wrap img {
  width:100%; height:100%; object-fit:cover;
  transition:transform .45s cubic-bezier(.2,.9,.4,1.05);
}
.prd-card:hover .prd-img-wrap img { transform:scale(1.07); }
.prd-img-ph {
  width:100%; height:100%; display:flex;
  align-items:center; justify-content:center; background:${T.bg};
}
.prd-shine {
  position:absolute; inset:0;
  background:linear-gradient(135deg, rgba(255,255,255,.18) 0%, transparent 50%);
  pointer-events:none;
}
.prd-discount {
  position:absolute; top:10px; left:10px;
  display:inline-flex; align-items:center; gap:4px;
  background:${T.success}; color:${T.white};
  padding:4px 10px; border-radius:8px;
  font-size:9.5px; font-weight:800; z-index:1;
  font-family:'Poppins', sans-serif; letter-spacing:.04em;
  box-shadow:0 2px 8px rgba(0,196,140,.35);
}
.prd-badge {
  position:absolute; bottom:10px; left:10px;
  display:inline-flex; align-items:center;
  color:${T.white}; padding:4px 10px; border-radius:8px;
  font-size:9.5px; font-weight:800; z-index:1;
  font-family:'Poppins', sans-serif; letter-spacing:.04em;
}
.prd-body    { padding:14px; }
.prd-name    { font-family:'Inter', sans-serif; font-size:13px; font-weight:700; color:${T.dark}; margin-bottom:8px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.prd-price-row { display:flex; align-items:baseline; gap:8px; margin-bottom:8px; }
.prd-price   { font-family:'Poppins', sans-serif; font-size:16px; font-weight:700; color:${T.red}; }
.prd-old     { font-size:12px; color:${T.muted}; text-decoration:line-through; }
.prd-company { display:flex; align-items:center; gap:5px; font-size:11px; color:${T.muted}; font-family:'Inter', sans-serif; }

/* ── Empty state ── */
.empty-state { grid-column:1/-1; text-align:center; padding:80px 20px; }
.empty-icon  { width:72px; height:72px; margin:0 auto 18px; background:${T.white}; border:1.5px solid ${T.border}; border-radius:50%; display:flex; align-items:center; justify-content:center; }
.empty-title { font-family:'Poppins', sans-serif; font-size:17px; font-weight:600; color:${T.dark}; margin-bottom:6px; }
.empty-sub   { font-size:13px; color:${T.muted}; }

/* ── Pagination ── */
.pagination { display:flex; align-items:center; justify-content:center; gap:6px; padding:28px 0 8px; flex-wrap:wrap; }
.pg-btn {
  min-width:36px; height:38px; border-radius:12px;
  border:1.5px solid ${T.border}; background:${T.white};
  color:${T.dark}; font-size:13px; font-weight:700;
  display:inline-flex; align-items:center; gap:6px; padding:0 16px;
  transition:all .15s; cursor:pointer; font-family:inherit;
}
.pg-btn:hover:not(:disabled) { border-color:${T.red}; color:${T.red}; background:${T.redLight}; }
.pg-btn:disabled              { opacity:.35; cursor:default; }

/* ── Utility ── */
.full-center { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:60vh; }

/* ── Mobile drawer ── */
.overlay { position:fixed; inset:0; background:${T.overlay}; z-index:50; animation:fadeIn .2s; }
.drawer  {
  position:fixed; top:0; left:0; bottom:0;
  width:280px; background:${T.white}; z-index:60;
  padding:20px 14px; overflow-y:auto;
  transform:translateX(-100%);
  transition:transform .3s cubic-bezier(.4,0,.2,1);
  box-shadow:6px 0 32px rgba(0,0,0,.12);
}
.drawer.open { transform:translateX(0); }

/* ══════════════════════════════════
   MODALS
══════════════════════════════════ */
.modal-overlay {
  position:fixed; inset:0;
  background:${T.overlay};
  z-index:100;
  display:flex; align-items:center; justify-content:center;
  padding:20px;
  animation:fadeIn .2s ease;
}
.modal-box {
  background:${T.white};
  border-radius:22px;
  width:100%; max-width:520px;
  overflow:hidden; position:relative;
  animation:slideUp .25s ease;
  max-height:90vh;
  display:flex; flex-direction:column;
  border:1.5px solid ${T.border};
  box-shadow:0 32px 80px rgba(13,15,20,.22), 0 8px 24px rgba(13,15,20,.12);
}
.modal-pdf-box {
  max-width:900px;
  height:92vh;
}
.modal-close {
  position:absolute; top:14px; right:14px;
  width:34px; height:34px; border-radius:50%;
  border:1.5px solid ${T.border};
  background:${T.white};
  display:flex; align-items:center; justify-content:center;
  color:${T.muted}; cursor:pointer;
  transition:all .15s; z-index:10;
}
.modal-close:hover { border-color:${T.red}; color:${T.red}; background:${T.redLight}; }
.modal-img-wrap {
  height:280px;
  display:flex; align-items:center; justify-content:center;
  overflow:hidden; flex-shrink:0;
  background:${T.bg};
}
.modal-img-wrap img { width:100%; height:100%; object-fit:cover; }
.modal-body { padding:22px 26px 28px; overflow-y:auto; }
.modal-title {
  font-family:'Poppins', sans-serif;
  font-size:18px; font-weight:600;
  color:${T.dark}; line-height:1.35;
  margin-bottom:14px;
}
.modal-pricing { display:flex; align-items:baseline; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
.modal-price   { font-family:'Poppins', sans-serif; font-size:24px; font-weight:700; color:${T.red}; }
.modal-orig    { font-size:14px; color:${T.muted}; text-decoration:line-through; }
.modal-meta    { display:flex; gap:20px; flex-wrap:wrap; padding-top:14px; border-top:1.5px solid ${T.border}; }
.modal-pdf-header {
  display:flex; align-items:center;
  justify-content:space-between;
  padding:16px 22px 14px;
  border-bottom:1.5px solid ${T.border};
  gap:12px; flex-shrink:0;
}
.modal-pdf-viewer { flex:1; overflow:hidden; min-height:0; display:flex; flex-direction:column; }
.modal-action-btn {
  display:inline-flex; align-items:center; gap:6px;
  padding:8px 16px; border-radius:12px;
  border:1.5px solid ${T.border};
  background:${T.white}; color:${T.dark};
  font-size:12.5px; font-weight:700;
  transition:all .15s; cursor:pointer;
  font-family:'Inter', sans-serif;
}
.modal-action-btn:hover { border-color:${T.red}; color:${T.red}; background:${T.redLight}; }
.pdf-nav-bar {
  display:flex; align-items:center;
  justify-content:space-between;
  padding:11px 22px;
  border-top:1.5px solid ${T.border};
  background:${T.white}; flex-shrink:0; gap:12px;
}
.pdf-nav-btn {
  display:inline-flex; align-items:center; gap:6px;
  padding:8px 20px; border-radius:12px;
  border:1.5px solid ${T.border};
  background:${T.white}; color:${T.dark};
  font-size:13px; font-weight:700;
  cursor:pointer; transition:all .15s;
  font-family:'Inter', sans-serif;
}
.pdf-nav-btn:hover:not(:disabled) { border-color:${T.red}; color:${T.red}; background:${T.redLight}; }
.pdf-nav-btn:disabled { opacity:.32; cursor:default; }
.pdf-pips { display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:center; max-width:320px; }
.pip {
  width:8px; height:8px; border-radius:50%;
  border:none; background:${T.border};
  cursor:pointer; padding:0;
  transition:all .18s; flex-shrink:0;
}
.pip:hover  { background:${T.subtle}; transform:scale(1.3); }
.pip-active { background:${T.red} !important; transform:scale(1.35); }
.react-pdf__Page { background:${T.white} !important; box-shadow:0 2px 16px rgba(0,0,0,.12); }
.react-pdf__Page__canvas { max-width:100%; height:auto !important; display:block; }

/* ── Responsive ── */
@media (max-width:1100px) {
  .sidebar-col  { width:210px; }
  .right-ad-col { display:none; }
}
@media (max-width:960px) {
  .sidebar-col  { display:none !important; }
  .filter-btn   { display:inline-flex; }
  .top-ad-container { min-height:70px; }
}
@media (max-width:680px) {
  .body       { padding:14px 14px 40px; }
  .pdf-grid   { grid-template-columns:repeat(2, 1fr); gap:12px; }
  .prd-grid   { grid-template-columns:repeat(2, 1fr); gap:12px; }
  .pdf-mag-card { aspect-ratio:3/4.5; border-radius:16px; }
  .pdf-mag-title { font-size:13px; }
  .pdf-mag-co-name { display:none; }
  .sec-hdr    { flex-direction:column; align-items:flex-start; }
  .co-pill span { display:none; }
  .co-pill    { padding:7px 10px; }
  .co-pill-all span { display:inline; }
  .modal-box     { border-radius:18px; }
  .modal-pdf-box { height:96vh; border-radius:0; border:none; }
  .pdf-nav-btn span { display:none; }
  .pdf-nav-btn { padding:8px 13px; }
  .modal-body  { padding:16px 18px 22px; }
  .modal-img-wrap { height:220px; }
}
@media (max-width:420px) {
  .body     { padding:10px 10px 40px; }
  .pdf-grid { grid-template-columns:repeat(2, 1fr); gap:10px; }
  .prd-grid { grid-template-columns:repeat(2, 1fr); gap:10px; }
  .co-carousel { padding:10px 10px; }
}

/* ── Focus accessibility ── */
:focus-visible { outline:2px solid ${T.red}; outline-offset:2px; }
button:focus:not(:focus-visible) { outline:none; }
`;