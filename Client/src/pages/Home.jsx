import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Package, X, ZoomIn, Tag,
} from "lucide-react";

import ProductModal from "../components/modals/ProductModal";
import PdfModal     from "../components/modals/PdfModal";
import {getImageUrl} from "../api/media"
/* ─────────────────────────────────────────────
   PDF.JS WORKER
───────────────────────────────────────────── */
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_OPTIONS = {
  cMapUrl:             `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked:          true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

/* ─────────────────────────────────────────────
   BRAND PALETTE
───────────────────────────────────────────── */
const R      = "#E30613";
const DARK   = "#1C1F26";
const BG     = "#F5F4F1";
const WHITE  = "#FFFFFF";
const BORDER = "#E4E1DC";
const MUTED  = "#8A8580";
const RED_BG = "#FFF1F1";


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

const CAT_COLORS = {
  1: { bg: "#EFF6FF", accent: "#2563EB", pill: "#DBEAFE", pillText: "#1E3A8A" },
  2: { bg: "#ECFDF5", accent: "#059669", pill: "#D1FAE5", pillText: "#064E3B" },
  3: { bg: "#FFF7ED", accent: "#EA580C", pill: "#FFEDD5", pillText: "#7C2D12" },
  4: { bg: "#FDF2F8", accent: "#DB2777", pill: "#FCE7F3", pillText: "#831843" },
  5: { bg: "#FEF2F2", accent: R,         pill: "#FEE2E2", pillText: "#7F1D1D" },
  6: { bg: "#F0FDFA", accent: "#0D9488", pill: "#CCFBF1", pillText: "#134E4A" },
  7: { bg: "#FFFBEB", accent: "#D97706", pill: "#FEF3C7", pillText: "#78350F" },
  8: { bg: "#F5F3FF", accent: "#7C3AED", pill: "#EDE9FE", pillText: "#4C1D95" },
};
const getCat = (id) =>
  CAT_COLORS[id] || { bg: "#F8F9FA", accent: R, pill: "#FFE4E6", pillText: "#9F1239" };

/* ─────────────────────────────────────────────
   PDF URL BUILDER
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
  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("blob:")
  ) {
    url = "https://" + url;
  }
  return url;
}

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
// FIX 4 (partial): derive current page number from pagination URLs
function derivePageFromPagination(next, previous) {
  if (next) {
    try {
      const p = parseInt(new URL(next).searchParams.get("page") || "2", 10);
      return p - 1; // next page is p, so current is p-1
    } catch (_) {}
  }
  if (previous) {
    try {
      const p = parseInt(new URL(previous).searchParams.get("page") || "1", 10);
      return p + 1; // previous page is p, so current is p+1
    } catch (_) {}
  }
  return 1;
}

/* ══════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════ */
function FullScreenLoader() {
  return (
    <div className="fsloader">
      <div className="fsloader-inner">
        <div className="fsloader-logo">
          <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
            <rect width="46" height="46" rx="13" fill={R} />
            <path d="M11 24L20 33L35 14" stroke={WHITE}
              strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="fsloader-bars">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="fsloader-bar"
              style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <p className="fsloader-text">Loading today's deals…</p>
      </div>
    </div>
  );
}

function AdPlaceholder({ label = "Advertisement" }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 6, width: "100%", height: "100%", minHeight: "inherit",
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke={MUTED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
      <span style={{
        fontSize: 10, color: MUTED, fontWeight: 600,
        letterSpacing: ".06em", textTransform: "uppercase",
      }}>
        {label}
      </span>
    </div>
  );
}

function PDFCard({ pdf, onView }) {
  const c        = getCat(pdf.catColorId);
  const palette  = AVATAR_PALETTES[(pdf.id || 0) % AVATAR_PALETTES.length];
  const initials = pdf.company?.slice(0, 2).toUpperCase() || "??";
  const [thumbState, setThumbState] = useState("loading");
  const pdfUrl = useMemo(() => buildPdfUrl(pdf.url), [pdf.url]);

  return (
    <div className="pcard" onClick={() => onView(pdf)}>
      {pdf.categoryTypeLabel && (
        <div className="pcard-badge" style={{ background: c.pill, color: c.pillText }}>
          {pdf.categoryTypeLabel}
        </div>
      )}
      <div className="pcard-img" style={{ background: c.bg }}>
        <div className="pcard-thumb-fallback" style={{
          opacity: thumbState === "ready" ? 0 : 1,
          pointerEvents: "none", color: c.accent, background: c.bg,
        }}>
          {thumbState === "loading" && pdfUrl
            ? <div className="spinner"
                style={{ borderColor: `${c.accent}33`, borderTopColor: c.accent }} />
            : (
              <>
                <FileText size={36} strokeWidth={1.4} />
                <span style={{
                  fontSize: 11, fontWeight: 600, marginTop: 8,
                  textAlign: "center", padding: "0 8px", color: DARK, lineHeight: 1.3,
                }}>
                  {pdf.title}
                </span>
              </>
            )
          }
        </div>
        {pdfUrl && (
          <div className="pcard-thumb-pdf" style={{ opacity: thumbState === "ready" ? 1 : 0 }}>
            <Document
              file={pdfUrl}
              onLoadSuccess={() => setThumbState("ready")}
              onLoadError={() => setThumbState("error")}
              loading={null}
              options={PDF_OPTIONS}
            >
              <Page
                pageNumber={1}
                height={165}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        )}
        <div className="pcard-img-overlay"><FileText size={20} color={WHITE} /></div>
      </div>
      <div className="pcard-body">
        <p className="pcard-title">{pdf.title}</p>
        {pdf.validUntil && (
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>
            Valid till {pdf.validUntil}
          </p>
        )}
        <div className="pcard-footer">
          <div className="pcard-company">
            <div className="pcard-avatar" style={{ background: palette.bg, color: palette.text }}>
              {pdf.companyLogo
                ? <img src={pdf.companyLogo} alt={pdf.company}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : initials
              }
            </div>
            <span className="pcard-cname">{pdf.company}</span>
          </div>
          <button
            className="pcard-btn"
            style={{ background: c.accent }}
            onClick={e => { e.stopPropagation(); onView(pdf); }}
          >
            View Flyer
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onViewDeal }) {
  const c        = getCat(product.categoryId);
  const initials = product.company?.slice(0, 2).toUpperCase() || "??";
  const palette  = AVATAR_PALETTES[(product.companyId || 0) % AVATAR_PALETTES.length];

  return (
    <div className="pcard" onClick={() => onViewDeal(product)}>
      {product.badge && (
        <div className="pcard-badge" style={{ background: c.pill, color: c.pillText }}>
          {product.badge}
        </div>
      )}
      <div className="pcard-img" style={{ background: c.bg }}>
        {product.image
          ? <img src={product.image} alt={product.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : (
            <div className="pcard-img-placeholder" style={{ color: c.accent }}>
              <Package size={36} strokeWidth={1.4} />
              <span style={{ fontSize: 10, marginTop: 6, opacity: 0.6 }}>{product.company}</span>
            </div>
          )
        }
        <div className="pcard-img-overlay"><ZoomIn size={20} color={WHITE} /></div>
      </div>
      <div className="pcard-body">
        <p className="pcard-title">{product.title}</p>
        <div className="pcard-pricing">
          <span className="pcard-price">{product.price}</span>
          {product.originalPrice && <span className="pcard-orig">{product.originalPrice}</span>}
        </div>
        {product.discount && (
          <div className="pcard-discount" style={{ background: c.pill, color: c.pillText }}>
            {product.discount}
          </div>
        )}
        <div className="pcard-footer">
          <div className="pcard-company">
            <div className="pcard-avatar" style={{ background: palette.bg, color: palette.text }}>
              {initials}
            </div>
            <span className="pcard-cname">{product.company}</span>
          </div>
          <button
            className="pcard-btn"
            style={{ background: c.accent }}
            onClick={e => { e.stopPropagation(); onViewDeal(product); }}
          >
            View Deal
          </button>
        </div>
      </div>
    </div>
  );
}

function CompanyCarousel({ companies, selectedCompanyId, onSelect }) {
  const trackRef = useRef(null);
  const wrapRef  = useRef(null);
  const [offset, setOffset] = useState(0);
  const STEP = 220;

  const getMax = () => {
    if (!trackRef.current || !wrapRef.current) return 0;
    return Math.max(0, trackRef.current.scrollWidth - wrapRef.current.clientWidth);
  };

  useEffect(() => {
    if (trackRef.current)
      trackRef.current.style.transform = `translateX(-${offset}px)`;
  }, [offset]);

  useEffect(() => { setOffset(0); }, [companies]);

  if (!companies?.length) return null;

  return (
    <div className="carousel">
      <button className="car-arrow" disabled={offset === 0}
        onClick={() => setOffset(o => Math.max(0, o - STEP))}>
        <ChevronLeft size={14} />
      </button>
      <div ref={wrapRef} className="car-wrap">
        <div ref={trackRef} className="car-track">
          <div
            className={`car-cell car-cell-all ${selectedCompanyId === null ? "car-cell-active" : ""}`}
            onClick={() => onSelect(null)}
          >
            <span style={{ fontSize: 11, fontWeight: 700 }}>All</span>
          </div>
          {companies.map((c, i) => {
            const pal      = AVATAR_PALETTES[i % AVATAR_PALETTES.length];
            const isActive = selectedCompanyId === c.id;
            return (
              <div
                key={c.id}
                className={`car-cell ${isActive ? "car-cell-active" : ""}`}
                title={c.name}
                onClick={() => onSelect(isActive ? null : c.id)}
              >
                {c.logo
                  ? <img src={c.logo} alt={c.name}
                      style={{ maxWidth: "80%", maxHeight: "70%", objectFit: "contain" }} />
                  : (
                    <div className="car-initials" style={{ background: pal.bg, color: pal.text }}>
                      <span className="car-abbr">{c.name?.slice(0, 2).toUpperCase()}</span>
                      <span className="car-fullname">{c.name?.split(" ")[0]}</span>
                    </div>
                  )
                }
              </div>
            );
          })}
        </div>
      </div>
      <button className="car-arrow"
        onClick={() => setOffset(o => Math.min(getMax(), o + STEP))}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function Sidebar({ categories, active, onSelect, onClose }) {
  const [openIds, setOpenIds] = useState({});
  const toggle = id => setOpenIds(p => ({ ...p, [id]: !p[id] }));

  return (
    <aside className="sidebar">
      {onClose && <button className="sidebar-close" onClick={onClose}>✕</button>}
      <div className="sidebar-heading">Categories</div>

      <button
        className={`scat-item ${active.catId === null && active.subId === null ? "active" : ""}`}
        onClick={() => { onSelect({ catId: null, subId: null }); onClose?.(); }}
      >
        <span className="scat-dot" style={{ background: active.catId === null ? R : BORDER }} />
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
            <button className={`scat-item ${isActive ? "active" : ""}`}>
              <span className="scat-dot" style={{ background: isActive ? c.accent : BORDER }} />
              <span className="scat-label"
                onClick={() => { onSelect({ catId: cat.id, subId: null }); onClose?.(); }}>
                {cat.name}
              </span>
              {cat.count > 0 && <span className="scat-count">{cat.count}</span>}
              {hasSub && (
                <span className="scat-expand"
                  onClick={e => { e.stopPropagation(); toggle(cat.id); }}>
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
                      style={{ background: active.subId === sub.id ? c.accent : "#D1C8C0" }} />
                    {sub.name}
                    {sub.count > 0 && <span className="scat-count">{sub.count}</span>}
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
    <div className="empty">
      <div className="empty-icon"><Inbox size={44} strokeWidth={1.2} color="#C9C0B8" /></div>
      <p className="empty-title">{message}</p>
      <p className="empty-sub">{sub}</p>
    </div>
  );
}

function PaginationBar({ page, total, onNext, onPrev, hasNext, hasPrev }) {
  return (
    <div className="pagination">
      <button className="pg-btn" onClick={onPrev} disabled={!hasPrev}>
        <ChevronLeft size={14} />
        Prev
      </button>

      <span style={{ padding: "0 10px", fontSize: 13 }}>
        Page {page} of {total}
      </span>

      <button className="pg-btn" onClick={onNext} disabled={!hasNext}>
        Next
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN HOME
══════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();

  // ── STATE ──
  const [activeNav,       setActiveNav]       = useState("all");
  const [activeTab,       setActiveTab]       = useState("top");
  const [active,          setActive]          = useState({ catId: null, subId: null });
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [productModal,    setProductModal]    = useState(null);
  const [pdfModal,        setPdfModal]        = useState(null);

  // ── DERIVED ──
  const showPDFs = activeNav !== PRODUCTS_NAV_KEY;

  // ── ROLE REDIRECT ──
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin")        navigate("/admin");
    else if (role === "company") navigate("/company");
    else if (role === "user")    navigate("/user/home");
  }, [navigate]);

  // ── STEP 1: build nav items with a placeholder typeValue for dynamic keys ──
  // We call the hook ONCE with a stable seed, then rebuild after pdfCategoryTypes loads.
  // To break the circular dependency we pass typeValue from a ref that updates post-render.
  const [resolvedTypeValue, setResolvedTypeValue] = useState(null);

  // ── HOOK CALL ──
  const {
    companies,
    categories,
    pdfCategoryTypes,
    products,
    pdfs,
    pagination,
    loading,
    error,
    goNext,
    goPrevious,
  } = useHomeData({
    filters: {
      category: active.catId,
      sub:      active.subId,
      company:  selectedCompany,
      // FIX 2: use resolvedTypeValue which covers both fixed and dynamic nav keys
      type:     resolvedTypeValue,
      // FIX 3: forward activeTab to hook so sorting actually works
      ordering: activeTab === "latest" ? "-created_at" : "-is_featured",
    },
  });

  // ── STEP 2: build full nav list once pdfCategoryTypes is available ──
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

  // ── STEP 3: resolve typeValue from full nav list (FIX 2 — covers dynamic keys) ──
  useEffect(() => {
    const navItem = pdfNavItems.find(n => n.key === activeNav);
    setResolvedTypeValue(navItem ? navItem.typeValue : null);
  }, [pdfNavItems, activeNav]);

  // current nav object for labels / section titles
  const currentPdfNav = useMemo(
    () => pdfNavItems.find(n => n.key === activeNav) ?? pdfNavItems[0],
    [pdfNavItems, activeNav],
  );

  // ── RESET filters when nav changes ──
  useEffect(() => {
    setSelectedCompany(null);
    setActive({ catId: null, subId: null });
  }, [activeNav]);

  // ── FIX 4: derive current page from backend pagination URLs ──
  // This removes the hand-rolled page counter that diverged from the hook's internal state.
  const page = useMemo(
    () => derivePageFromPagination(pagination?.next, pagination?.previous),
    [pagination?.next, pagination?.previous],
  );

  const totalPages = showPDFs
    ? 1
    : Math.max(1, Math.ceil((pagination?.count || 0) / 10));

  // ── PAGINATION HANDLERS (FIX 4: no manual setPage, no double-increment) ──
  const handleNext = () => {
    if (!pagination?.next) return;
    goNext();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    if (!pagination?.previous) return;
    goPrevious();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── FORMAT PDFs ──
  const formattedPdfs = useMemo(() => {
    const fromTop = (pdfs || []).map(p => ({
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
    return [...fromTop, ...fromCompanies].filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [pdfs, companies]);

  // ── FORMAT PRODUCTS ──
  const formattedProducts = useMemo(() =>
    (products || []).map(p => ({
      id:            p.id,
      title:         p.name,
      price:         `QAR ${parseFloat(p.price).toLocaleString("en-QA")}`,
      originalPrice: p.old_price
        ? `QAR ${parseFloat(p.old_price).toLocaleString("en-QA")}` : null,
      discount: p.old_price
        ? `${Math.round(
            ((parseFloat(p.old_price) - parseFloat(p.price)) / parseFloat(p.old_price)) * 100
          )}% OFF`
        : null,
      image:         p.image          || null,
      categoryId:    p.category_id,
      categoryName:  p.category_name  || "",
      subCategoryId: p.subcategory_id || null,
      company:       p.company_name   || "",
      companyId:     p.company_id     || null,
      badge:         p.is_featured    ? "Featured" : null,
    })),
  [products]);

  // ── SIDEBAR CATEGORIES ──
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

  // ── ITEMS TO RENDER ──
  const displayItems = showPDFs ? formattedPdfs : formattedProducts;

  // ── SECTION TITLE ──
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

  // ── RENDER ──
  if (loading) return <><style>{CSS}</style><FullScreenLoader /></>;

  if (error) return (
    <>
      <style>{CSS}</style>
      <div className="full-center">
        <AlertTriangle size={40} color={R} strokeWidth={1.5} />
        <p style={{ color: R, marginTop: 14, fontSize: 14 }}>{error}</p>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="root">

        {productModal && (
          <ProductModal product={productModal} onClose={() => setProductModal(null)} />
        )}
        {pdfModal && (
          <PdfModal pdf={pdfModal} onClose={() => setPdfModal(null)} />
        )}

        {/* ── Top Nav ── */}
        <nav className="topnav">
          <div className="topnav-inner">
            <button
              className={`navpill navpill-products ${activeNav === PRODUCTS_NAV_KEY ? "active" : ""}`}
              onClick={() => {
                setActiveNav(PRODUCTS_NAV_KEY);
                setActive({ catId: null, subId: null });
              }}
            >
              <ShoppingCart size={13} strokeWidth={2} />
              Products
            </button>

            <div className="nav-divider" />

            {pdfNavItems.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`navpill ${activeNav === key ? "active" : ""}`}
                onClick={() => {
                  setActiveNav(key);
                  setActive({ catId: null, subId: null });
                }}
              >
                <Icon size={13} strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Top Banner Ad ── */}
        <div className="top-ad-container">
          <AdPlaceholder label="Advertisement · 728×90" />
        </div>

        {/* ── Body ── */}
        <div className="body">

          <div className={`sidebar-col ${showPDFs ? "sidebar-col-hidden" : ""}`}>
            <Sidebar
              categories={sidebarCategories}
              active={active}
              onSelect={sel => setActive(sel)}
            />
          </div>

          <div className="main">

            {showPDFs && (
              <CompanyCarousel
                companies={companies}
                selectedCompanyId={selectedCompany}
                onSelect={setSelectedCompany}
              />
            )}

            {/* Section header */}
            <div className="sec-hdr">
              <div>
                <div className="sec-title">
                  <span className="sec-bold">{sectionTitle}</span>
                  <span className="sec-muted">
                    {showPDFs
                      ? " — Flyers & Catalogues · Daily Deals Qatar"
                      : " — Deals & Offers · Daily Deals Qatar"}
                  </span>
                </div>
                <div className="sec-count" style={{ color: displayItems.length ? MUTED : R }}>
                  {showPDFs
                    ? `${displayItems.length} flyer${displayItems.length !== 1 ? "s" : ""}`
                    : `${pagination?.count ?? 0} product${(pagination?.count ?? 0) !== 1 ? "s" : ""}${totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}`
                  }
                </div>
              </div>

              <div className="sec-controls">
                {!showPDFs && (
                  <button className="filter-btn" onClick={() => setDrawerOpen(true)}>
                    <SlidersHorizontal size={13} /> Categories
                  </button>
                )}
                {showPDFs && selectedCompany !== null && (
                  <button className="clear-chip" onClick={() => setSelectedCompany(null)}>
                    <X size={11} /> Clear store
                  </button>
                )}
                {!showPDFs && (
                  <div className="tabs">
                    {[
                      { id: "top",    label: "Top Picks", Icon: TrendingUp },
                      { id: "latest", label: "Latest",    Icon: Clock },
                    ].map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        className={`tab ${activeTab === id ? "active" : ""}`}
                        onClick={() => setActiveTab(id)}
                      >
                        <Icon size={12} strokeWidth={2} /> {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Grid */}
            {displayItems.length > 0 ? (
              <div className="grid">
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

            {/* Pagination — only for products (server-paginated) */}
            {!showPDFs && (
              <PaginationBar
                page={page}
                total={totalPages}
                onNext={handleNext}
                onPrev={handlePrev}
                hasNext={!!pagination?.next}
                hasPrev={!!pagination?.previous}
              />
            )}
          </div>

          <div className="right-ad-col">
            <div className="right-ad-container">
              <AdPlaceholder label="Advertisement · 300×250" />
            </div>
            <div className="right-ad-container right-ad-tall" style={{ marginTop: 16 }}>
              <AdPlaceholder label="Advertisement · 300×600" />
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {!showPDFs && drawerOpen && (
          <div className="overlay" onClick={() => setDrawerOpen(false)} />
        )}
        {!showPDFs && (
          <div className={`drawer ${drawerOpen ? "open" : ""}`}>
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
   CSS
══════════════════════════════════════════════ */
const CSS = `
@keyframes spin     { to { transform: rotate(360deg); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes slideUp  { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
@keyframes fadeInUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
@keyframes barPulse {
  0%,100% { transform: scaleY(0.4); opacity: 0.4; }
  50%      { transform: scaleY(1);   opacity: 1;   }
}
@keyframes logoIn {
  from { opacity:0; transform: scale(0.7) rotate(-10deg); }
  to   { opacity:1; transform: scale(1) rotate(0deg); }
}
@keyframes slideInFromRight {
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: none; }
}
@keyframes slideInFromLeft {
  from { opacity: 0; transform: translateX(-60px); }
  to   { opacity: 1; transform: none; }
}
@keyframes pageFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
.page-slide-left  { animation: slideInFromRight .26s cubic-bezier(.25,.46,.45,.94) both; }
.page-slide-right { animation: slideInFromLeft  .26s cubic-bezier(.25,.46,.45,.94) both; }
.page-fade-in     { animation: pageFadeIn .3s ease both; }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
button { font-family: inherit; cursor: pointer; }
a { text-decoration: none; }

.root {
  font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif;
  background: ${BG}; min-height: 100vh; color: ${DARK};
}

.fsloader { position: fixed; inset: 0; background: ${WHITE}; display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn .2s ease; }
.fsloader-inner { display: flex; flex-direction: column; align-items: center; gap: 28px; }
.fsloader-logo  { animation: logoIn .5s cubic-bezier(.34,1.56,.64,1) both; filter: drop-shadow(0 8px 24px rgba(227,6,19,.25)); }
.fsloader-bars  { display: flex; align-items: center; gap: 5px; height: 36px; }
.fsloader-bar   { width: 4px; height: 28px; background: ${R}; border-radius: 4px; animation: barPulse .9s ease-in-out infinite; transform-origin: bottom; }
.fsloader-text  { font-size: 13px; color: ${MUTED}; font-weight: 500; letter-spacing: .02em; animation: fadeInUp .6s .3s ease both; }

.topnav { background: ${WHITE}; border-bottom: 1px solid ${BORDER}; position: sticky; top: 0; z-index: 40; box-shadow: 0 1px 10px rgba(0,0,0,.06); }
.topnav-inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; gap: 5px; overflow-x: auto; padding: 10px 20px; scrollbar-width: none; }
.topnav-inner::-webkit-scrollbar { display: none; }
.navpill { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; padding: 7px 18px; border-radius: 24px; border: 1px solid ${BORDER}; background: ${WHITE}; color: ${DARK}; font-size: 13px; font-weight: 500; white-space: nowrap; transition: all .15s; }
.navpill:hover      { border-color: ${R}; color: ${R}; }
.navpill.active     { background: ${R}; border-color: ${R}; color: ${WHITE}; }
.navpill.active svg { stroke: ${WHITE}; }
.navpill-products         { border-color: #C8C4BE; background: #FAFAF8; }
.navpill-products.active  { background: ${DARK}; border-color: ${DARK}; color: ${WHITE}; }
.nav-divider { flex-shrink: 0; width: 1px; height: 28px; background: ${BORDER}; margin: 0 4px; }

.top-ad-container { max-width: 1400px; margin: 16px auto 0; padding: 0 20px; min-height: 90px; background: #F7F7F5; border: 1.5px dashed ${BORDER}; border-radius: 12px; display: flex; align-items: center; justify-content: center; }

.body { max-width: 1400px; margin: 0 auto; padding: 20px 20px 60px; display: flex; gap: 20px; align-items: flex-start; }
.sidebar-col        { width: 220px; flex-shrink: 0; }
.sidebar-col-hidden { width: 0 !important; overflow: hidden; }
.main               { flex: 1; min-width: 0; }
.right-ad-col       { width: 300px; flex-shrink: 0; }
.right-ad-container { position: sticky; top: 80px; min-width: 300px; min-height: 250px; background: #F7F7F5; border: 1.5px dashed ${BORDER}; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.right-ad-tall { min-height: 600px; }

.sidebar { background: ${WHITE}; border: 1px solid ${BORDER}; border-radius: 14px; padding: 16px 10px; position: sticky; top: 64px; max-height: calc(100vh - 88px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: ${BORDER} transparent; }
.sidebar-close { position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 16px; color: ${MUTED}; cursor: pointer; }
.sidebar-heading { font-size: 10px; font-weight: 700; color: ${MUTED}; text-transform: uppercase; letter-spacing: .09em; padding-left: 8px; margin-bottom: 10px; }
.scat-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-radius: 9px; border: none; background: transparent; color: ${DARK}; font-size: 12.5px; font-weight: 500; transition: background .12s; text-align: left; cursor: pointer; }
.scat-item:hover  { background: ${BG}; }
.scat-item.active { background: ${RED_BG}; color: ${R}; font-weight: 600; }
.scat-dot   { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.scat-label { flex: 1; cursor: pointer; }
.scat-count { font-size: 10px; color: ${MUTED}; background: #EDE9E4; padding: 1px 6px; border-radius: 8px; }
.scat-badge { font-size: 10px; background: ${R}; color: ${WHITE}; padding: 1px 7px; border-radius: 8px; font-weight: 700; }
.scat-expand { color: ${MUTED}; display: flex; align-items: center; padding: 2px; cursor: pointer; }
.scat-subs  { padding: 2px 0 4px 22px; display: flex; flex-direction: column; gap: 1px; }
.scat-sub { width: 100%; display: flex; align-items: center; gap: 7px; padding: 5px 9px; border-radius: 7px; border: none; background: transparent; font-size: 11.5px; color: #6B6560; cursor: pointer; text-align: left; font-family: inherit; transition: all .12s; }
.scat-sub:hover  { background: #F0EDE8; color: ${DARK}; }
.scat-sub.active { background: ${RED_BG}; color: ${R}; font-weight: 600; }
.sub-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

.carousel { background: ${WHITE}; border: 1px solid ${BORDER}; border-radius: 14px; padding: 10px 12px; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
.car-wrap  { flex: 1; overflow: hidden; }
.car-track { display: flex; gap: 8px; transition: transform .35s cubic-bezier(.4,0,.2,1); }
.car-cell  { flex-shrink: 0; width: 90px; height: 48px; border: 1px solid ${BORDER}; border-radius: 10px; background: ${WHITE}; overflow: hidden; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color .15s, transform .15s, box-shadow .15s; }
.car-cell-all { width: 54px; background: ${BG}; }
.car-cell:hover               { border-color: ${R}; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(0,0,0,.07); }
.car-cell-active              { border-color: ${R} !important; box-shadow: 0 0 0 2px ${R}33; }
.car-cell-all.car-cell-active { background: ${RED_BG}; color: ${R}; }
.car-initials  { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; border-radius: 9px; }
.car-abbr      { font-size: 14px; font-weight: 700; line-height: 1; }
.car-fullname  { font-size: 8.5px; font-weight: 500; opacity: 0.65; }
.car-arrow { width: 30px; height: 30px; border-radius: 50%; border: 1px solid ${BORDER}; background: ${WHITE}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: ${DARK}; transition: all .14s; cursor: pointer; }
.car-arrow:hover:not(:disabled) { border-color: ${R}; color: ${R}; }
.car-arrow:disabled              { opacity: 0.3; cursor: default; }

.sec-hdr { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.sec-title    { font-size: 15px; line-height: 1.4; }
.sec-bold     { font-weight: 700; color: ${DARK}; }
.sec-muted    { font-weight: 400; color: ${MUTED}; }
.sec-count    { font-size: 12px; margin-top: 3px; }
.sec-controls { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.filter-btn { display: none; align-items: center; gap: 6px; padding: 7px 13px; background: ${WHITE}; border: 1px solid ${BORDER}; border-radius: 9px; font-size: 12.5px; font-weight: 500; color: ${DARK}; transition: all .13s; cursor: pointer; }
.filter-btn:hover { border-color: ${R}; color: ${R}; }
.clear-chip { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 9px; border: 1px solid ${R}; background: ${RED_BG}; color: ${R}; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .14s; }
.clear-chip:hover { background: ${R}; color: ${WHITE}; }
.tabs { display: flex; border: 1px solid ${BORDER}; border-radius: 10px; overflow: hidden; background: ${WHITE}; }
.tab { display: inline-flex; align-items: center; gap: 5px; padding: 7px 15px; border: none; background: transparent; font-size: 12.5px; font-weight: 600; color: ${MUTED}; transition: all .15s; white-space: nowrap; cursor: pointer; }
.tab:first-child        { border-right: 1px solid ${BORDER}; }
.tab.active             { background: ${R}; color: ${WHITE}; }
.tab.active svg         { stroke: ${WHITE}; }
.tab:not(.active):hover { background: ${BG}; color: ${DARK}; }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }

.pcard { background: ${WHITE}; border: 1px solid ${BORDER}; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; cursor: pointer; position: relative; transition: transform .2s, box-shadow .2s, border-color .2s; animation: fadeInUp .35s ease both; }
.pcard:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,.09); border-color: #D0CECA; }
.pcard-badge { position: absolute; top: 9px; left: 9px; z-index: 2; font-size: 9.5px; font-weight: 700; padding: 3px 9px; border-radius: 12px; letter-spacing: .02em; }
.pcard-img   { height: 165px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
.pcard-thumb-fallback { position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; transition: opacity .3s ease; }
.pcard-thumb-pdf { position: absolute; inset: 0; z-index: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: opacity .3s ease; }
.pcard-thumb-pdf .react-pdf__Document { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.pcard-thumb-pdf .react-pdf__Page     { overflow: hidden; }
.pcard-thumb-pdf .react-pdf__Page__canvas { display: block; width: 100% !important; height: auto !important; }
.pcard-img-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; }
.pcard-img-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; z-index: 3; }
.pcard:hover .pcard-img-overlay { opacity: 1; }
.pcard-body    { padding: 11px 12px 12px; display: flex; flex-direction: column; flex: 1; }
.pcard-title   { font-size: 13px; font-weight: 600; color: ${DARK}; line-height: 1.35; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pcard-pricing { display: flex; align-items: baseline; gap: 7px; margin-bottom: 7px; }
.pcard-price   { font-size: 15px; font-weight: 700; color: ${DARK}; }
.pcard-orig    { font-size: 11px; color: ${MUTED}; text-decoration: line-through; }
.pcard-discount { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 8px; margin-bottom: 10px; align-self: flex-start; }
.pcard-footer  { display: flex; align-items: center; gap: 8px; margin-top: auto; }
.pcard-company { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
.pcard-avatar  { width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9.5px; font-weight: 700; flex-shrink: 0; overflow: hidden; }
.pcard-cname   { font-size: 11px; color: ${MUTED}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pcard-btn     { flex-shrink: 0; padding: 5px 12px; color: ${WHITE}; border: none; border-radius: 7px; font-size: 11px; font-weight: 700; transition: opacity .14px; letter-spacing: .02em; cursor: pointer; }
.pcard-btn:hover { opacity: 0.85; }

/* FIX 1: gap added so chevron icon and label don't overlap */
.pagination { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 24px 0 8px; flex-wrap: wrap; }
.pg-btn { min-width: 36px; height: 36px; border-radius: 9px; border: 1px solid ${BORDER}; background: ${WHITE}; color: ${DARK}; font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 0 14px; transition: all .15s; cursor: pointer; }
.pg-btn:hover:not(:disabled) { border-color: ${R}; color: ${R}; }
.pg-btn:disabled              { opacity: 0.35; cursor: default; }
.pg-btn.active                { background: ${R}; border-color: ${R}; color: ${WHITE}; }
.pg-ellipsis { font-size: 13px; color: ${MUTED}; padding: 0 2px; line-height: 36px; }

.empty { text-align: center; padding: 72px 20px; display: flex; flex-direction: column; align-items: center; animation: fadeInUp .3s ease both; }
.empty-icon  { margin-bottom: 16px; }
.empty-title { font-size: 15px; font-weight: 600; color: ${DARK}; }
.empty-sub   { font-size: 12.5px; color: ${MUTED}; margin-top: 5px; }

.spinner { display: inline-block; width: 24px; height: 24px; border: 2.5px solid #FFD6D6; border-top-color: ${R}; border-radius: 50%; animation: spin .7s linear infinite; }
.spinner.lg { width: 40px; height: 40px; border-width: 3px; }
.full-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn .2s ease; }
.modal-box { background: ${WHITE}; border-radius: 18px; width: 100%; max-width: 520px; overflow: hidden; position: relative; animation: slideUp .25s ease; max-height: 90vh; display: flex; flex-direction: column; }
.modal-pdf-box  { max-width: 900px; height: 92vh; }
.modal-close { position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 50%; border: 1px solid ${BORDER}; background: ${WHITE}; display: flex; align-items: center; justify-content: center; color: ${MUTED}; transition: all .14s; cursor: pointer; z-index: 2; }
.modal-close:hover { border-color: ${R}; color: ${R}; }
.modal-img-wrap { height: 280px; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.modal-body     { padding: 20px 24px 24px; overflow-y: auto; }
.modal-title    { font-size: 17px; font-weight: 700; color: ${DARK}; line-height: 1.35; }
.modal-pricing  { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.modal-price    { font-size: 22px; font-weight: 700; color: ${DARK}; }
.modal-orig     { font-size: 14px; color: ${MUTED}; text-decoration: line-through; }
.modal-meta     { display: flex; gap: 20px; flex-wrap: wrap; padding-top: 14px; border-top: 1px solid ${BORDER}; }
.modal-pdf-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 14px; border-bottom: 1px solid ${BORDER}; gap: 12px; flex-shrink: 0; }
.modal-pdf-viewer { flex: 1; overflow: hidden; min-height: 0; display: flex; flex-direction: column; }
.modal-action-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 9px; border: 1px solid ${BORDER}; background: ${WHITE}; color: ${DARK}; font-size: 12px; font-weight: 500; transition: all .14s; cursor: pointer; font-family: inherit; }
.modal-action-btn:hover { border-color: ${R}; color: ${R}; }
.zoom-btn { padding: 6px 10px !important; }
.pdf-state-center { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 14px; padding: 32px; text-align: center; }
.pdf-nav-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; border-top: 1px solid ${BORDER}; background: ${WHITE}; flex-shrink: 0; gap: 12px; }
.pdf-nav-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 18px; border-radius: 10px; border: 1px solid ${BORDER}; background: ${WHITE}; color: ${DARK}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit; }
.pdf-nav-btn:hover:not(:disabled) { border-color: ${R}; color: ${R}; background: ${RED_BG}; }
.pdf-nav-btn:disabled { opacity: 0.32; cursor: default; }
.pdf-page-indicator { display: flex; align-items: center; justify-content: center; flex: 1; }
.pdf-pips { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; justify-content: center; max-width: 320px; }
.pip { width: 8px; height: 8px; border-radius: 50%; border: none; background: ${BORDER}; cursor: pointer; padding: 0; transition: all .18s; flex-shrink: 0; }
.pip:hover  { background: #B0AAA2; transform: scale(1.3); }
.pip-active { background: ${R} !important; transform: scale(1.35); }
.modal-pdf-viewer ::-webkit-scrollbar       { width: 7px; height: 7px; }
.modal-pdf-viewer ::-webkit-scrollbar-track { background: #F0EDE8; border-radius: 4px; }
.modal-pdf-viewer ::-webkit-scrollbar-thumb { background: #C0BAB2; border-radius: 4px; }
.modal-pdf-viewer ::-webkit-scrollbar-thumb:hover { background: #9E9890; }
.react-pdf__Page { background: white !important; box-shadow: 0 2px 16px rgba(0,0,0,.14); }
.react-pdf__Page__canvas { max-width: 100%; height: auto !important; display: block; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 50; }
.drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 275px; background: ${WHITE}; z-index: 60; padding: 20px 14px; overflow-y: auto; transform: translateX(-100%); transition: transform .3s cubic-bezier(.4,0,.2,1); box-shadow: 4px 0 24px rgba(0,0,0,.13); }
.drawer.open { transform: translateX(0); }

@media (max-width: 960px) {
  .sidebar-col  { display: none !important; }
  .right-ad-col { display: none; }
  .filter-btn   { display: inline-flex; }
  .top-ad-container { min-height: 70px; }
}
@media (max-width: 680px) {
  .body { padding: 14px 12px 40px; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 10px; }
  .sec-hdr { flex-direction: column; align-items: flex-start; }
  .car-cell { width: 74px; height: 42px; }
  .car-abbr { font-size: 12px; }
  .pcard-img { height: 140px; }
  .top-ad-container { min-height: 60px; margin: 10px 12px 0; padding: 0; }
  .modal-box     { border-radius: 14px; }
  .modal-pdf-box { height: 96vh; border-radius: 0; }
  .carousel-label { display: none; }
  .pdf-nav-btn span { display: none; }
  .pdf-nav-btn { padding: 7px 11px; }
}
@media (max-width: 400px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}
`;