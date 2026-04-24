import { useEffect, useState, useRef, useCallback } from "react";
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
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

const BASE = BASE_URL;

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/* ─── DESIGN TOKENS ─── */
const T = {
  red:         "#E30613",
  redDark:     "#B80010",
  redDeep:     "#7F0009",
  redLight:    "#FFF0F0",
  redGlow:     "rgba(227,6,19,0.18)",
  dark:        "#111318",
  darkMid:     "#1E2028",
  charcoal:    "#2D3142",
  slate:       "#4A4E6A",
  muted:       "#8B8FA8",
  subtle:      "#C4C6D6",
  border:      "#E8E9F0",
  borderLight: "#F0F1F7",
  bg:          "#F6F7FB",
  bgWarm:      "#FAFAFA",
  white:       "#FFFFFF",
  success:     "#00B37E",
  warning:     "#F59E0B",
  overlay:     "rgba(17,19,24,0.55)",
};

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap";

/* ─── CATEGORY META ─── */
const CAT_META = {
  "Supermarkets":     { Icon: ShoppingCart, accent: "#16a34a", bg: "#f0fdf4", pill: "#bbf7d0", pillTx: "#14532d" },
  "Restaurants":      { Icon: Utensils,     accent: "#ea580c", bg: "#fff7ed", pill: "#fed7aa", pillTx: "#7c2d12" },
  "Health & Clinics": { Icon: Stethoscope,  accent: "#2563eb", bg: "#eff6ff", pill: "#bfdbfe", pillTx: "#1e3a8a" },
  "Beauty & Spas":    { Icon: Scissors,     accent: "#db2777", bg: "#fdf2f8", pill: "#fbcfe8", pillTx: "#831843" },
  "Fashion & Sports": { Icon: Shirt,        accent: "#7c3aed", bg: "#f5f3ff", pill: "#ddd6fe", pillTx: "#4c1d95" },
  "Home & Garden":    { Icon: Home,         accent: "#0d9488", bg: "#f0fdfa", pill: "#99f6e4", pillTx: "#134e4a" },
  "Online Deals":     { Icon: Globe,        accent: "#d97706", bg: "#fffbeb", pill: "#fde68a", pillTx: "#78350f" },
};
const CAT_ALL = { Icon: Sparkles, accent: T.red, bg: "#FFF0F0", pill: "#fecdd3", pillTx: "#881337" };
const catMeta = (type) => CAT_META[type] || CAT_ALL;

function buildPdfUrl(raw) {
  if (!raw) return null;
  let url = raw.replace(/["']/g, "").trim();
  try { url = decodeURIComponent(url); } catch {}
  if (url.startsWith("/media/")) return BASE_URL + url;
  if (!url.startsWith("http"))   return BASE_URL + url;
  return url;
}

/* ─── LETTER AVATAR ─── */
function LetterAvatar({ name = "", size = 48, bg = T.red, color = "#fff", radius = 10 }) {
  const ini = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
  return (
    <div style={{
      width: size, height: size, background: bg, color,
      borderRadius: radius, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'Sora', sans-serif",
      fontWeight: 700, fontSize: size * 0.33, userSelect: "none", flexShrink: 0,
    }}>
      {ini || "?"}
    </div>
  );
}

/* ─── AD SLOT ─── */
function AdSlot({ style = {}, format = "banner", label = "Sponsored" }) {
  const h = { banner: 90, box: 260, leaderboard: 52 };
  return (
    <div style={{
      width: "100%", background: T.white, border: `1.5px dashed ${T.border}`,
      borderRadius: 14, padding: 14, ...style,
    }}>
      <span style={{
        display: "block", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: T.muted, marginBottom: 10,
        fontFamily: "'DM Sans', sans-serif",
      }}>{label}</span>
      <div style={{
        width: "100%", height: h[format] || 90,
        background: `linear-gradient(135deg, ${T.bg} 0%, ${T.borderLight} 100%)`,
        borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={T.subtle} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/>
          <path d="M2 10h20"/>
        </svg>
      </div>
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
        {items.map((c, i) => (
          <div key={i} className="ticker-chip">
            <div className="ticker-avatar">
              {c.logo
                ? <img src={BASE + c.logo} alt={c.name} onError={e => { e.target.style.display = "none"; }} />
                : <span>{(c.name || "C")[0].toUpperCase()}</span>
              }
            </div>
            <span>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── CATEGORY CAROUSEL ─── */
function CategoryCarousel({ categories, activeType, onSelect }) {
  const ref = useRef(null);
  const scroll = d => ref.current?.scrollBy({ left: d * 220, behavior: "smooth" });
  const all = ["all", ...categories];

  return (
    <div className="cat-row">
      <button className="cat-nav-btn" onClick={() => scroll(-1)} aria-label="scroll left">
        <ChevronLeft size={15} />
      </button>
      <div className="cat-track" ref={ref}>
        {all.map(type => {
          const m = type === "all" ? CAT_ALL : catMeta(type);
          const CIcon = m.Icon;
          const active = activeType === type;
          return (
            <button
              key={type}
              className={`cat-pill ${active ? "cat-pill-on" : ""}`}
              style={active ? {
                background: m.accent, color: "#fff", borderColor: m.accent,
                boxShadow: `0 4px 14px ${m.accent}40`,
              } : {}}
              onClick={() => onSelect(type)}
            >
              <CIcon size={13} strokeWidth={active ? 2.5 : 1.8} />
              <span>{type === "all" ? "All Deals" : type}</span>
            </button>
          );
        })}
      </div>
      <button className="cat-nav-btn" onClick={() => scroll(1)} aria-label="scroll right">
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

/* ─── FLYER CARD ─── */
function FlyerCard({ flyer, isSaved, onSave, onView }) {
  const [thumbState, setThumbState] = useState("loading");
  const m = catMeta(flyer.category_type);
  const CIcon = m.Icon;
  const pdfUrl = buildPdfUrl(flyer.pdf);

  return (
    <article className="fcard">
      {/* Thumbnail */}
      <div className="fcard-thumb" onClick={() => onView(flyer)}>
        <div className="fcard-fallback" style={{ opacity: thumbState === "ready" ? 0 : 1 }}>
          {thumbState === "loading"
            ? <div className="spin-ring" style={{ borderTopColor: m.accent }} />
            : <LetterAvatar name={flyer.company_name || flyer.title || "F"} size={72} bg={m.accent} radius={0} />
          }
        </div>
        {pdfUrl && (
          <div className="fcard-pdf-thumb" style={{ opacity: thumbState === "ready" ? 1 : 0 }}>
            <Document file={pdfUrl}
              onLoadSuccess={() => setThumbState("ready")}
              onLoadError={() => setThumbState("error")} loading={null}>
              <Page pageNumber={1} width={210} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>
          </div>
        )}
        <div className="fcard-hover-overlay">
          <div className="fcard-overlay-pill">
            <ZoomIn size={14} />
            <span>Quick View</span>
          </div>
        </div>
      </div>

      {/* Category badge */}
      <div className="fcard-type-badge" style={{ background: m.bg, color: m.accent }}>
        <CIcon size={9} strokeWidth={2.5} />
        <span>{flyer.category_type || "Offer"}</span>
      </div>

      {/* Body */}
      <div className="fcard-body">
        <div className="fcard-company-row">
          {flyer.company_logo
            ? <img src={`${BASE}${flyer.company_logo}`} alt={flyer.company_name} className="fcard-co-logo" />
            : <div className="fcard-co-dot" style={{ background: m.accent }}>
                {(flyer.company_name || "C")[0]}
              </div>
          }
          <span className="fcard-co-name">{flyer.company_name}</span>
        </div>
        <h4 className="fcard-title">{flyer.title}</h4>
        {flyer.end_date && (
          <div className="fcard-expiry">
            <Clock size={10} />
            <span>Ends {flyer.end_date}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fcard-foot">
        <button className="fcard-view-btn" style={{ background: m.accent }} onClick={() => onView(flyer)}>
          <FileText size={12} />
          <span>View Flyer</span>
        </button>
        <button
          className={`fcard-save-btn ${isSaved ? "fcard-save-btn-on" : ""}`}
          onClick={onSave}
          title={isSaved ? "Saved" : "Save"}
          style={isSaved ? { background: m.bg, borderColor: m.accent, color: m.accent } : {}}
        >
          {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>
      </div>
    </article>
  );
}

/* ─── PRODUCT CARD ─── */
function ProductCard({ product, isSaved, onSave }) {
  const [imgErr, setImgErr] = useState(false);
  const discount = product.old_price
    ? `${Math.round(((product.old_price - product.price) / product.old_price) * 100)}% OFF`
    : null;

  return (
    <article className="pcard">
      <div className="pcard-img">
        {product.image && !imgErr
          ? <img src={product.image} alt={product.name} onError={() => setImgErr(true)} />
          : <div className="pcard-img-ph"><Package size={28} strokeWidth={1.4} color={T.subtle} /></div>
        }
        {discount && <div className="pcard-discount-tag">{discount}</div>}
        <button
          className={`pcard-save-icon ${isSaved ? "pcard-save-icon-on" : ""}`}
          onClick={onSave}
        >
          {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
        </button>
        <div className="pcard-img-overlay"><ZoomIn size={18} color="#fff" /></div>
      </div>
      <div className="pcard-body">
        <p className="pcard-name">{product.name}</p>
        <div className="pcard-pricing">
          <span className="pcard-price">₹{product.price.toLocaleString()}</span>
          {product.old_price && (
            <span className="pcard-old">₹{product.old_price.toLocaleString()}</span>
          )}
        </div>
        <div className="pcard-company">
          <Building2 size={10} color={T.muted} />
          <span>{product.company_name}</span>
        </div>
      </div>
    </article>
  );
}

/* ─── PRODUCT SIDEBAR ─── */
function ProductSidebar({ categories, activeCategory, activeSub, onCat, onSub }) {
  const [open, setOpen] = useState(null);
  useEffect(() => { setOpen(activeCategory); }, [activeCategory]);

  return (
    <aside className="psidebar">
      <div className="psidebar-head">
        <Tag size={14} color={T.red} />
        <span>Browse Categories</span>
      </div>
      <button
        className={`psidebar-item ${activeCategory === null ? "psidebar-item-on" : ""}`}
        onClick={() => { onCat(null); onSub(null); setOpen(null); }}
      >
        <Sparkles size={13} />
        <span>All Products</span>
      </button>
      {categories?.map(cat => (
        <div key={cat.id}>
          <button
            className={`psidebar-item ${activeCategory === cat.id ? "psidebar-item-on" : ""}`}
            onClick={() => { onCat(cat.id); onSub(null); setOpen(open === cat.id ? null : cat.id); }}
          >
            <ChevronRight size={11} style={{
              transform: open === cat.id ? "rotate(90deg)" : "none",
              transition: "transform 0.22s cubic-bezier(.4,0,.2,1)", flexShrink: 0,
            }} />
            <span>{cat.name}</span>
            <span className="psidebar-count">{cat.product_count || 0}</span>
          </button>
          {open === cat.id && cat.subcategories?.map(sub => (
            <button
              key={sub.id}
              className={`psidebar-sub ${activeSub === sub.id ? "psidebar-sub-on" : ""}`}
              onClick={() => onSub(sub.id)}
            >
              {activeSub === sub.id && <Check size={9} />}
              <span>{sub.name}</span>
            </button>
          ))}
        </div>
      ))}
      <div style={{ marginTop: 20 }}>
        <AdSlot format="box" />
      </div>
    </aside>
  );
}

/* ─── EMPTY STATE ─── */
function EmptyState({ label }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Inbox size={36} strokeWidth={1.2} color={T.subtle} /></div>
      <p className="empty-title">No {label} found</p>
      <p className="empty-sub">Try adjusting your search or filters</p>
    </div>
  );
}

/* ─── HERO STAT CARD ─── */
function StatPill({ icon: Icon, value, label }) {
  return (
    <div className="hero-stat">
      <div className="hero-stat-icon"><Icon size={15} /></div>
      <div>
        <strong>{value}+</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function UserHome() {
  const [data, setData]               = useState(null);
  const [view, setView]               = useState("flyers");
  const [search, setSearch]           = useState("");
  const [activeCategory, setActiveCat] = useState(null);
  const [activeSub, setActiveSub]     = useState(null);
  const [activeType, setActiveType]   = useState("all");
  const [savedProducts, setSavedProd] = useState([]);
  const [savedFlyers, setSavedFlyers] = useState([]);
  const [modalFlyer, setModalFlyer]   = useState(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => { load(); setTimeout(() => setMounted(true), 100); }, []);

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

  /* ── Splash ── */
  if (!data) return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href={FONT_URL} />
      <div className="splash">
        <div className="splash-logo">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <rect width="52" height="52" rx="16" fill={T.red}/>
            <path d="M13 27L23 37L39 16" stroke="white" strokeWidth="4"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="splash-bars">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="splash-bar" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <p className="splash-text">Finding the best deals for you…</p>
        <GLOBAL_STYLES />
      </div>
    </>
  );

  const sm = s => s?.toLowerCase().includes(search.toLowerCase());

  const filteredFlyers = data.flyers.filter(f => {
    if (search && !sm(f.title) && !sm(f.company_name)) return false;
    if (activeType !== "all" && f.category_type?.toLowerCase() !== activeType.toLowerCase()) return false;
    return true;
  });

  const filteredProducts = data.products.filter(p => {
    if (search && !sm(p.name) && !sm(p.company_name)) return false;
    if (activeCategory && p.category_id !== activeCategory) return false;
    if (activeSub && p.subcategory_id !== activeSub) return false;
    return true;
  });

  const predefinedTypes = Object.keys(CAT_META);
  const dbTypes = [...new Set(data.flyers.map(f => f.category_type).filter(Boolean))];
  const allCatTypes = [...new Set([...predefinedTypes, ...dbTypes])];

  return (
    <UserLayout>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href={FONT_URL} />
      <GLOBAL_STYLES />

      <div className={`uh-root ${mounted ? "uh-root-in" : ""}`}>

        {/* ── HERO ── */}
        <section className="hero">
          <div className="hero-mesh" />
          <div className="hero-grid-lines" />
          <div className="hero-content">
            <div className="hero-eyebrow">
              <Zap size={11} />
              <span>Updated daily — fresh deals every morning</span>
            </div>
            <h1 className="hero-title">
              Discover <em>Unbeatable</em><br />
              Deals Near You
            </h1>
            <p className="hero-sub">
              Browse flyers, exclusive offers & products from top brands — all in one place.
            </p>
            <div className="hero-stats-row">
              <StatPill icon={Store}       value={data.companies?.length || 0}  label="Brands" />
              <div className="hero-stat-div" />
              <StatPill icon={FileText}    value={data.flyers?.length || 0}     label="Flyers" />
              <div className="hero-stat-div" />
              <StatPill icon={ShoppingCart} value={data.products?.length || 0}  label="Products" />
            </div>
          </div>
          <div className="hero-wave">
            <svg viewBox="0 0 1440 64" preserveAspectRatio="none">
              <path d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z" fill={T.bg} />
            </svg>
          </div>
        </section>

        {/* ── BRAND TICKER ── */}
        {data.companies?.length > 0 && <BrandTicker companies={data.companies} />}

        {/* ── TOP AD ── */}
        <div className="ad-wrap">
          <AdSlot format="banner" label="Advertisement" />
        </div>

        {/* ── CONTROLS BAR ── */}
        <div className="controls-bar">
          {/* View Toggle */}
          <div className="view-toggle">
            {[
              { id: "flyers",   label: "Flyers",   Icon: FileText,    count: data.flyers.length },
              { id: "products", label: "Products", Icon: ShoppingCart, count: data.products.length },
            ].map(({ id, label, Icon, count }) => (
              <button
                key={id}
                className={`vt-btn ${view === id ? "vt-btn-on" : ""}`}
                onClick={() => { setView(id); setSearch(""); }}
              >
                <Icon size={14} strokeWidth={view === id ? 2.5 : 1.8} />
                <span>{label}</span>
                <em>{count}</em>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="searchbar">
            <Search size={15} color={T.red} strokeWidth={2} />
            <input
              type="text"
              placeholder={view === "flyers" ? "Search flyers, brands…" : "Search products…"}
              value={search}
              onChange={e => setSearch(e.target.value)}
              spellCheck={false}
            />
            {search && (
              <button className="searchbar-clear" onClick={() => setSearch("")}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Mobile filter btn */}
          {view === "products" && (
            <button className="mobile-filter-btn" onClick={() => setDrawerOpen(true)}>
              <SlidersHorizontal size={14} />
              <span>Filter</span>
            </button>
          )}
        </div>

        {/* ── CATEGORY CAROUSEL (Flyers) ── */}
        {view === "flyers" && (
          <div className="cat-section">
            <CategoryCarousel
              categories={allCatTypes}
              activeType={activeType}
              onSelect={setActiveType}
            />
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        <div className="main-wrap">

          {/* Sidebar desktop */}
          {view === "products" && (
            <div className="sidebar-col">
              <ProductSidebar
                categories={data.categories}
                activeCategory={activeCategory}
                activeSub={activeSub}
                onCat={setActiveCat}
                onSub={setActiveSub}
              />
            </div>
          )}

          {/* Content */}
          <main className="content-col">
            {/* Results header */}
            <div className="results-bar">
              <div className="results-count">
                <TrendingUp size={13} color={T.red} strokeWidth={2.5} />
                <span>
                  {view === "flyers"
                    ? `${filteredFlyers.length} flyer${filteredFlyers.length !== 1 ? "s" : ""}`
                    : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""}`
                  }
                  {search && <em className="results-query"> — "{search}"</em>}
                </span>
              </div>
            </div>

            {/* Flyers */}
            {view === "flyers" && (
              <div className="flyers-grid">
                {filteredFlyers.map((flyer, idx) => (
                  <div key={flyer.id} className="card-enter" style={{ animationDelay: `${Math.min(idx * 35, 400)}ms` }}>
                    <FlyerCard
                      flyer={flyer}
                      isSaved={savedFlyers.includes(flyer.id)}
                      onSave={e => handleSave("flyer", flyer.id, e)}
                      onView={setModalFlyer}
                    />
                  </div>
                ))}
                {filteredFlyers.length === 0 && <EmptyState label="flyers" />}
              </div>
            )}

            {/* Products */}
            {view === "products" && (
              <div className="products-grid">
                {filteredProducts.map((product, idx) => (
                  <div key={product.id} className="card-enter" style={{ animationDelay: `${Math.min(idx * 35, 400)}ms` }}>
                    <ProductCard
                      product={product}
                      isSaved={savedProducts.includes(product.id)}
                      onSave={e => handleSave("product", product.id, e)}
                    />
                  </div>
                ))}
                {filteredProducts.length === 0 && <EmptyState label="products" />}
              </div>
            )}
          </main>
        </div>

        {/* ── FOOTER AD ── */}
        <div className="ad-wrap ad-wrap-footer">
          <AdSlot format="leaderboard" />
        </div>

        {/* ── MOBILE DRAWER ── */}
        {drawerOpen && (
          <>
            <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
            <div className="drawer">
              <div className="drawer-header">
                <span>Filter Products</span>
                <button onClick={() => setDrawerOpen(false)}><X size={18} /></button>
              </div>
              <ProductSidebar
                categories={data.categories}
                activeCategory={activeCategory}
                activeSub={activeSub}
                onCat={c => { setActiveCat(c); setDrawerOpen(false); }}
                onSub={s => { setActiveSub(s); setDrawerOpen(false); }}
              />
            </div>
          </>
        )}

        {/* ── FLYER MODAL ── */}
        {modalFlyer && <FlyerModal flyer={modalFlyer} onClose={() => setModalFlyer(null)} />}
      </div>
    </UserLayout>
  );
}

/* ══════════════════════════════════════
   GLOBAL STYLES COMPONENT
══════════════════════════════════════ */
function GLOBAL_STYLES() {
  return (
    <style>{`
      /* ── Fonts & Reset ── */
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'DM Sans', -apple-system, sans-serif; }

      /* ── Root & Enter Animation ── */
      .uh-root {
        min-height: 100vh;
        background: ${T.bg};
        font-family: 'DM Sans', -apple-system, sans-serif;
        color: ${T.dark};
        opacity: 0;
        transition: opacity 0.4s ease;
      }
      .uh-root-in { opacity: 1; }

      /* ── Keyframes ── */
      @keyframes spin        { to { transform: rotate(360deg); } }
      @keyframes barPulse    { 0%,100% { transform:scaleY(.35); opacity:.35; } 50% { transform:scaleY(1); opacity:1; } }
      @keyframes logoBounce  { from { opacity:0; transform:scale(.6) rotate(-12deg); } to { opacity:1; transform:scale(1) rotate(0); } }
      @keyframes cardEnter   { from { opacity:0; transform:translateY(22px) scale(.97); } to { opacity:1; transform:none; } }
      @keyframes tickerScroll { 0% { transform:translateX(0); } 100% { transform:translateX(-25%); } }
      @keyframes fadeSlideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:none; } }
      @keyframes drawerIn    { from { transform:translateX(-100%); } to { transform:translateX(0); } }
      @keyframes overlayIn   { from { opacity:0; } to { opacity:1; } }

      /* ── Splash ── */
      .splash {
        min-height: 100vh;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 28px; background: ${T.white};
        font-family: 'DM Sans', sans-serif;
      }
      .splash-logo { animation: logoBounce .55s cubic-bezier(.34,1.56,.64,1) both; }
      .splash-bars { display: flex; gap: 6px; align-items: center; height: 40px; }
      .splash-bar  {
        width: 4px; height: 30px; background: ${T.red};
        border-radius: 3px; animation: barPulse .85s ease-in-out infinite;
        transform-origin: center;
      }
      .splash-text { font-size: 13px; color: ${T.muted}; font-weight: 500; letter-spacing: .01em; }

      /* ── Hero ── */
      .hero {
        position: relative;
        background: linear-gradient(140deg, #1a0004 0%, ${T.redDeep} 30%, ${T.redDark} 65%, ${T.red} 100%);
        padding: 72px 0 0;
        overflow: hidden;
      }
      .hero-mesh {
        position: absolute; inset: 0;
        background:
          radial-gradient(ellipse 60% 50% at 80% 20%, rgba(255,100,80,.18) 0%, transparent 60%),
          radial-gradient(ellipse 40% 40% at 10% 80%, rgba(255,200,0,.1) 0%, transparent 55%),
          radial-gradient(ellipse 30% 30% at 50% 50%, rgba(255,80,80,.12) 0%, transparent 50%);
        pointer-events: none;
      }
      .hero-grid-lines {
        position: absolute; inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
        background-size: 48px 48px;
        pointer-events: none;
      }
      .hero-content {
        position: relative;
        max-width: 720px; margin: 0 auto;
        text-align: center; padding-bottom: 56px;
        z-index: 2;
      }
      .hero-eyebrow {
        display: inline-flex; align-items: center; gap: 7px;
        background: rgba(255,255,255,.1);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,.2);
        border-radius: 100px; padding: 7px 18px;
        font-family: 'DM Sans', sans-serif;
        font-size: 11.5px; font-weight: 500; color: rgba(255,255,255,.88);
        margin-bottom: 24px; letter-spacing: .02em;
      }
      .hero-title {
        font-family: 'Sora', sans-serif;
        font-size: clamp(30px, 6vw, 54px);
        font-weight: 800; color: ${T.white};
        line-height: 1.15; margin-bottom: 18px;
        letter-spacing: -0.03em;
      }
      .hero-title em {
        font-style: normal;
        background: linear-gradient(120deg, #fda4af 0%, #fb923c 60%, #fbbf24 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .hero-sub {
        font-size: clamp(13px, 2.2vw, 16px);
        color: rgba(255,255,255,.65);
        margin-bottom: 36px; line-height: 1.6;
        font-weight: 400;
      }
      .hero-stats-row {
        display: inline-flex; align-items: center;
        background: rgba(255,255,255,.1);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 18px; overflow: hidden;
      }
      .hero-stat {
        display: flex; align-items: center; gap: 11px;
        padding: 14px 26px;
      }
      .hero-stat-div {
        width: 1px; height: 36px;
        background: rgba(255,255,255,.15);
      }
      .hero-stat-icon {
        width: 34px; height: 34px; border-radius: 10px;
        background: rgba(255,255,255,.15);
        display: flex; align-items: center; justify-content: center;
        color: rgba(255,255,255,.9); flex-shrink: 0;
      }
      .hero-stat strong {
        display: block; font-family: 'Sora', sans-serif;
        font-size: 17px; font-weight: 800; color: ${T.white};
      }
      .hero-stat span {
        font-size: 11px; color: rgba(255,255,255,.55);
        font-weight: 400; letter-spacing: .02em;
      }
      .hero-wave { position: relative; line-height: 0; }
      .hero-wave svg { width: 100%; height: 64px; display: block; }

      /* ── Ticker ── */
      .ticker-root {
        position: relative; background: ${T.white};
        border-top: 1px solid ${T.border}; border-bottom: 1px solid ${T.border};
        overflow: hidden; padding: 13px 0;
      }
      .ticker-fade {
        position: absolute; top: 0; bottom: 0; width: 80px; z-index: 2;
        pointer-events: none;
      }
      .ticker-fade-l { left: 0; background: linear-gradient(to right, ${T.white}, transparent); }
      .ticker-fade-r { right: 0; background: linear-gradient(to left, ${T.white}, transparent); }
      .ticker-track {
        display: flex; width: max-content;
        animation: tickerScroll 32s linear infinite;
      }
      .ticker-track:hover { animation-play-state: paused; }
      .ticker-chip {
        display: inline-flex; align-items: center; gap: 9px;
        padding: 4px 22px 4px 14px;
        border-right: 1px solid ${T.borderLight};
        white-space: nowrap;
      }
      .ticker-avatar {
        width: 30px; height: 30px; border-radius: 50%;
        background: ${T.red}; display: flex; align-items: center;
        justify-content: center; overflow: hidden; flex-shrink: 0;
      }
      .ticker-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .ticker-avatar span { color: #fff; font-size: 11px; font-weight: 700; font-family: 'Sora', sans-serif; }
      .ticker-chip span {
        font-size: 13px; font-weight: 500; color: ${T.charcoal};
        font-family: 'DM Sans', sans-serif;
      }

      /* ── Ad Wrap ── */
      .ad-wrap { max-width: 1320px; margin: 0 auto; padding: 20px 24px; }
      .ad-wrap-footer { padding-bottom: 48px; }

      /* ── Controls Bar ── */
      .controls-bar {
        max-width: 1320px; margin: 0 auto;
        padding: 16px 24px;
        display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
      }
      .view-toggle {
        display: flex; background: ${T.white};
        border: 1px solid ${T.border}; border-radius: 14px; padding: 5px;
        flex-shrink: 0;
      }
      .vt-btn {
        display: flex; align-items: center; gap: 8px;
        padding: 9px 22px; border: none; background: transparent;
        border-radius: 10px; font-size: 13px; font-weight: 600;
        color: ${T.muted}; cursor: pointer;
        transition: all 0.22s cubic-bezier(.4,0,.2,1);
        font-family: 'DM Sans', sans-serif;
      }
      .vt-btn em {
        font-style: normal; font-size: 11px; padding: 2px 8px;
        border-radius: 20px; background: ${T.borderLight}; color: ${T.muted};
        transition: all 0.22s;
      }
      .vt-btn-on { background: ${T.red}; color: ${T.white}; }
      .vt-btn-on em { background: rgba(255,255,255,.22); color: ${T.white}; }
      .searchbar {
        flex: 1; display: flex; align-items: center; gap: 12px;
        background: ${T.white}; border: 1.5px solid ${T.border};
        border-radius: 14px; padding: 11px 18px;
        transition: all 0.2s; min-width: 0;
      }
      .searchbar:focus-within {
        border-color: ${T.red};
        box-shadow: 0 0 0 3px ${T.redGlow};
      }
      .searchbar input {
        flex: 1; border: none; outline: none;
        font-size: 14px; background: transparent;
        font-family: 'DM Sans', sans-serif; color: ${T.dark};
      }
      .searchbar input::placeholder { color: ${T.subtle}; }
      .searchbar-clear {
        background: none; border: none; cursor: pointer;
        color: ${T.muted}; display: flex; padding: 2px;
        transition: color .15s;
      }
      .searchbar-clear:hover { color: ${T.red}; }
      .mobile-filter-btn {
        display: none; align-items: center; gap: 8px;
        padding: 11px 18px; background: ${T.white};
        border: 1.5px solid ${T.border}; border-radius: 14px;
        font-size: 13px; font-weight: 600; color: ${T.red};
        cursor: pointer; transition: all .2s;
        font-family: 'DM Sans', sans-serif;
      }
      .mobile-filter-btn:hover { border-color: ${T.red}; background: ${T.redLight}; }

      /* ── Category Section ── */
      .cat-section { max-width: 1320px; margin: 0 auto; padding: 0 24px 16px; }
      .cat-row { display: flex; align-items: center; gap: 8px; }
      .cat-nav-btn {
        flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%;
        border: 1.5px solid ${T.border}; background: ${T.white};
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: ${T.charcoal};
        transition: all .2s cubic-bezier(.4,0,.2,1);
      }
      .cat-nav-btn:hover {
        background: ${T.red}; border-color: ${T.red}; color: ${T.white};
        box-shadow: 0 4px 12px ${T.redGlow};
      }
      .cat-track {
        display: flex; gap: 9px; overflow-x: auto;
        scrollbar-width: none; padding: 4px 2px;
      }
      .cat-track::-webkit-scrollbar { display: none; }
      .cat-pill {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 8px 18px; border: 1.5px solid ${T.border};
        border-radius: 100px; background: ${T.white};
        font-size: 12.5px; font-weight: 600; color: ${T.slate};
        white-space: nowrap; cursor: pointer;
        transition: all .22s cubic-bezier(.4,0,.2,1);
        font-family: 'DM Sans', sans-serif;
      }
      .cat-pill:hover {
        border-color: ${T.red}; color: ${T.red};
        transform: translateY(-1px);
      }
      .cat-pill-on { transform: translateY(-1px); }

      /* ── Main Wrap ── */
      .main-wrap {
        max-width: 1320px; margin: 0 auto;
        padding: 0 24px 48px;
        display: flex; gap: 24px;
      }
      .sidebar-col { width: 250px; flex-shrink: 0; }
      .content-col { flex: 1; min-width: 0; }

      /* ── Product Sidebar ── */
      .psidebar {
        background: ${T.white}; border: 1.5px solid ${T.border};
        border-radius: 18px; padding: 18px 14px;
        position: sticky; top: 84px;
      }
      .psidebar-head {
        display: flex; align-items: center; gap: 8px;
        font-family: 'Sora', sans-serif;
        font-size: 12px; font-weight: 700; color: ${T.dark};
        text-transform: uppercase; letter-spacing: .06em;
        padding-bottom: 14px; border-bottom: 1.5px solid ${T.borderLight};
        margin-bottom: 14px;
      }
      .psidebar-item {
        width: 100%; display: flex; align-items: center; gap: 9px;
        padding: 10px 12px; border: none; background: transparent;
        border-radius: 11px; font-size: 13px; font-weight: 500;
        color: ${T.charcoal}; cursor: pointer;
        transition: all .18s; margin-bottom: 2px;
        font-family: 'DM Sans', sans-serif; text-align: left;
      }
      .psidebar-item:hover { background: ${T.bg}; color: ${T.dark}; }
      .psidebar-item-on {
        background: ${T.redLight}; color: ${T.red}; font-weight: 700;
      }
      .psidebar-count {
        margin-left: auto; font-size: 10.5px; color: ${T.muted};
        background: ${T.borderLight}; padding: 2px 8px; border-radius: 8px;
      }
      .psidebar-sub {
        width: 100%; display: flex; align-items: center; gap: 7px;
        padding: 7px 12px 7px 32px; border: none; background: transparent;
        border-radius: 9px; font-size: 12px; color: ${T.muted};
        cursor: pointer; transition: all .18s;
        font-family: 'DM Sans', sans-serif; text-align: left;
      }
      .psidebar-sub:hover { background: ${T.bg}; color: ${T.dark}; }
      .psidebar-sub-on { color: ${T.red}; font-weight: 600; }

      /* ── Results Bar ── */
      .results-bar { margin-bottom: 20px; }
      .results-count {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 7px 16px; background: ${T.white};
        border: 1.5px solid ${T.border}; border-radius: 100px;
        font-size: 13px; font-weight: 600; color: ${T.slate};
        font-family: 'DM Sans', sans-serif;
      }
      .results-query { color: ${T.red}; font-style: italic; }

      /* ── Card Enter Animation ── */
      .card-enter {
        animation: cardEnter .42s cubic-bezier(.2,.9,.4,1.05) both;
      }

      /* ── Flyers Grid ── */
      .flyers-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 20px;
      }

      /* ── Flyer Card ── */
      .fcard {
        background: ${T.white}; border-radius: 18px;
        border: 1.5px solid ${T.border}; overflow: hidden;
        cursor: pointer; position: relative;
        transition: transform .3s cubic-bezier(.2,.9,.4,1.1), box-shadow .3s, border-color .2s;
        display: flex; flex-direction: column;
      }
      .fcard:hover {
        transform: translateY(-7px);
        box-shadow: 0 24px 48px rgba(17,19,24,.11), 0 6px 16px rgba(17,19,24,.07);
        border-color: ${T.subtle};
      }
      .fcard-thumb {
        position: relative; width: 100%; height: 260px; aspect-ratio: 3/4;
        background: ${T.bg}; overflow: hidden; cursor: pointer;
      }
      .fcard-fallback {
        position: absolute; inset: 0; display: flex;
        align-items: center; justify-content: center;
        transition: opacity .3s; background: inherit;
      }
      .fcard-pdf-thumb {
        position: absolute; inset: 0;
        transition: opacity .35s; display: flex;
        align-items: flex-start; justify-content: center;
        overflow: hidden;
      }
      .fcard-pdf-thumb canvas {
        width: 100% !important; height: auto !important;
      }
      .fcard-hover-overlay {
        position: absolute; inset: 0;
        background: linear-gradient(to top, rgba(17,19,24,.7) 0%, rgba(17,19,24,.3) 50%, transparent 100%);
        display: flex; align-items: flex-end; justify-content: center;
        padding-bottom: 20px; opacity: 0;
        transition: opacity .28s;
      }
      .fcard:hover .fcard-hover-overlay { opacity: 1; }
      .fcard-overlay-pill {
        display: flex; align-items: center; gap: 7px;
        background: rgba(255,255,255,.95); color: ${T.dark};
        padding: 7px 18px; border-radius: 100px;
        font-size: 12px; font-weight: 700;
        font-family: 'DM Sans', sans-serif;
        backdrop-filter: blur(8px);
      }
      .fcard-type-badge {
        position: absolute; top: 12px; left: 12px; z-index: 2;
        display: inline-flex; align-items: center; gap: 5px;
        padding: 4px 10px; border-radius: 20px;
        font-size: 9.5px; font-weight: 700; text-transform: uppercase;
        letter-spacing: .05em; backdrop-filter: blur(6px);
        font-family: 'Sora', sans-serif;
      }
      .fcard-body { padding: 14px 15px 10px; flex: 1; }
      .fcard-company-row {
        display: flex; align-items: center; gap: 8px; margin-bottom: 9px;
      }
      .fcard-co-logo {
        width: 24px; height: 24px; border-radius: 7px; object-fit: cover;
        border: 1px solid ${T.borderLight};
      }
      .fcard-co-dot {
        width: 24px; height: 24px; border-radius: 7px;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 12px; font-weight: 800;
        font-family: 'Sora', sans-serif;
      }
      .fcard-co-name {
        font-size: 11.5px; font-weight: 500; color: ${T.muted};
        font-family: 'DM Sans', sans-serif;
      }
      .fcard-title {
        font-family: 'Sora', sans-serif;
        font-size: 13.5px; font-weight: 700; color: ${T.dark};
        line-height: 1.4; margin-bottom: 8px;
        display: -webkit-box; -webkit-line-clamp: 2;
        -webkit-box-orient: vertical; overflow: hidden;
      }
      .fcard-expiry {
        display: flex; align-items: center; gap: 5px;
        font-size: 11px; color: ${T.muted};
        font-family: 'DM Sans', sans-serif;
      }
      .fcard-foot {
        display: flex; align-items: center; gap: 9px;
        padding: 11px 14px; border-top: 1px solid ${T.borderLight};
        background: ${T.bg};
      }
      .fcard-view-btn {
        flex: 1; display: flex; align-items: center; justify-content: center;
        gap: 6px; padding: 9px; border: none; border-radius: 10px;
        color: white; font-size: 12px; font-weight: 700; cursor: pointer;
        transition: all .2s; font-family: 'DM Sans', sans-serif;
        letter-spacing: .01em;
      }
      .fcard-view-btn:hover { filter: brightness(1.08); transform: scale(1.02); }
      .fcard-save-btn {
        width: 38px; height: 38px; display: flex; align-items: center;
        justify-content: center; border: 1.5px solid ${T.border};
        border-radius: 10px; background: ${T.white}; cursor: pointer;
        color: ${T.muted}; transition: all .2s;
        flex-shrink: 0;
      }
      .fcard-save-btn:hover { border-color: ${T.red}; color: ${T.red}; }

      /* ── Products Grid ── */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
        gap: 20px;
      }

      /* ── Product Card ── */
      .pcard {
        background: ${T.white}; border-radius: 18px;
        border: 1.5px solid ${T.border}; overflow: hidden;
        cursor: pointer;
        transition: transform .3s cubic-bezier(.2,.9,.4,1.1), box-shadow .3s, border-color .2s;
      }
      .pcard:hover {
        transform: translateY(-5px);
        box-shadow: 0 16px 36px rgba(17,19,24,.10), 0 4px 12px rgba(17,19,24,.06);
        border-color: ${T.subtle};
      }
      .pcard-img {
        position: relative; width: 100%; aspect-ratio: 1;
        background: ${T.bg}; overflow: hidden;
      }
      .pcard-img img {
        width: 100%; height: 100%; object-fit: cover;
        transition: transform .4s cubic-bezier(.2,.9,.4,1.05);
      }
      .pcard:hover .pcard-img img { transform: scale(1.06); }
      .pcard-img-ph {
        width: 100%; height: 100%; display: flex;
        align-items: center; justify-content: center;
      }
      .pcard-img-overlay {
        position: absolute; inset: 0;
        background: rgba(17,19,24,.32);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity .25s;
      }
      .pcard:hover .pcard-img-overlay { opacity: 1; }
      .pcard-discount-tag {
        position: absolute; top: 10px; left: 10px;
        background: ${T.success}; color: #fff;
        padding: 4px 9px; border-radius: 7px;
        font-size: 10px; font-weight: 800;
        font-family: 'Sora', sans-serif; letter-spacing: .03em;
        z-index: 1;
      }
      .pcard-save-icon {
        position: absolute; top: 10px; right: 10px;
        width: 32px; height: 32px; border-radius: 9px;
        background: rgba(255,255,255,.92);
        border: none; display: flex; align-items: center;
        justify-content: center; cursor: pointer;
        transition: all .2s; backdrop-filter: blur(6px); z-index: 1;
      }
      .pcard-save-icon:hover { background: ${T.white}; color: ${T.red}; transform: scale(1.1); }
      .pcard-save-icon-on { background: ${T.redLight} !important; color: ${T.red} !important; }
      .pcard-body { padding: 13px 14px 14px; }
      .pcard-name {
        font-family: 'Sora', sans-serif;
        font-size: 13px; font-weight: 600; color: ${T.dark};
        margin-bottom: 7px; line-height: 1.4;
        display: -webkit-box; -webkit-line-clamp: 2;
        -webkit-box-orient: vertical; overflow: hidden;
      }
      .pcard-pricing {
        display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;
      }
      .pcard-price {
        font-family: 'Sora', sans-serif;
        font-size: 16px; font-weight: 800; color: ${T.red};
      }
      .pcard-old {
        font-size: 12px; color: ${T.muted};
        text-decoration: line-through;
      }
      .pcard-company {
        display: flex; align-items: center; gap: 5px;
        font-size: 11px; color: ${T.muted};
        font-family: 'DM Sans', sans-serif;
      }

      /* ── Empty State ── */
      .empty-state {
        grid-column: 1 / -1; text-align: center; padding: 80px 20px;
      }
      .empty-icon {
        width: 72px; height: 72px; margin: 0 auto 20px;
        background: ${T.white}; border: 1.5px solid ${T.border};
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
      }
      .empty-title {
        font-family: 'Sora', sans-serif;
        font-size: 17px; font-weight: 700; color: ${T.dark}; margin-bottom: 8px;
      }
      .empty-sub {
        font-size: 13px; color: ${T.muted};
        font-family: 'DM Sans', sans-serif;
      }

      /* ── Spin Ring ── */
      .spin-ring {
        width: 32px; height: 32px; border-radius: 50%;
        border: 3px solid rgba(0,0,0,.1);
        animation: spin .75s linear infinite;
      }

      /* ── Drawer ── */
      .drawer-overlay {
        position: fixed; inset: 0; background: ${T.overlay};
        z-index: 100; animation: overlayIn .22s ease;
      }
      .drawer {
        position: fixed; top: 0; left: 0; bottom: 0;
        width: 290px; background: ${T.white};
        z-index: 101; padding: 20px 16px;
        overflow-y: auto;
        animation: drawerIn .3s cubic-bezier(.4,0,.2,1);
        box-shadow: 6px 0 32px rgba(0,0,0,.14);
      }
      .drawer-header {
        display: flex; align-items: center; justify-content: space-between;
        padding-bottom: 16px; border-bottom: 1.5px solid ${T.borderLight};
        margin-bottom: 16px;
      }
      .drawer-header span {
        font-family: 'Sora', sans-serif;
        font-size: 15px; font-weight: 700; color: ${T.dark};
      }
      .drawer-header button {
        background: none; border: none; cursor: pointer;
        color: ${T.muted}; display: flex; padding: 4px;
        border-radius: 8px; transition: color .15s;
      }
      .drawer-header button:hover { color: ${T.red}; }

      /* ── Responsive ── */
      @media (max-width: 1100px) {
        .sidebar-col { width: 220px; }
      }
      @media (max-width: 900px) {
        .sidebar-col { display: none; }
        .mobile-filter-btn { display: flex; }
        .hero-stats-row { flex-wrap: wrap; }
      }
      @media (max-width: 680px) {
        .hero { padding: 52px 0px 0; }
        .hero-stats-row { display: none; }
        .controls-bar { padding: 12px 16px; gap: 10px; }
        .cat-section { padding: 0 16px 12px; }
        .main-wrap { padding: 0 16px 36px; }
        .ad-wrap { padding: 16px; }
        .flyers-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .products-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .vt-btn span { display: none; }
        .vt-btn { padding: 9px 14px; }
        .fcard-title { font-size: 12.5px; }
        .pcard-name { font-size: 12px; }
        .pcard-price { font-size: 14px; }
        .hero-title { letter-spacing: -.02em; }
      }
      @media (max-width: 420px) {
        .controls-bar { flex-wrap: wrap; }
        .searchbar { min-width: 100%; order: 3; }
        .flyers-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .products-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .cat-pill { padding: 7px 13px; font-size: 12px; }
      }
    `}</style>
  );
}