import { useState, useEffect, useRef } from "react";
import { Search, X, ShoppingBag, Store, Tag, FileText } from "lucide-react";
import { useHomeData } from "../hooks/useHomeData";
import { useMarketplaceData } from "../hooks/useMarketplaceData"; // import your marketplace hook
import { Document, Page, pdfjs } from "react-pdf";

// ─── Detail Popup ────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  product:  { badge: "Product",  badgeBg: "#E6F1FB", badgeColor: "#0C447C", imgBg: "#E6F1FB", btnBg: "#E24B4A" },
  company:  { badge: "Store",    badgeBg: "#EAF3DE", badgeColor: "#27500A", imgBg: "#EAF3DE", btnBg: "#3B6D11" },
  category: { badge: "Category", badgeBg: "#FAEEDA", badgeColor: "#633806", imgBg: "#FAEEDA", btnBg: "#854F0B" },
  flyer:    { badge: "Flyer",    badgeBg: "#FBEAF0", badgeColor: "#72243E", imgBg: "#FBEAF0", btnBg: "#993556" },
  // Marketplace-specific types
  mp_product:  { badge: "Item",     badgeBg: "#EFF6FF", badgeColor: "#1E40AF", imgBg: "#EFF6FF", btnBg: "#2563EB" },
  mp_category: { badge: "Category", badgeBg: "#DBEAFE", badgeColor: "#1D4ED8", imgBg: "#DBEAFE", btnBg: "#1D4ED8" },
  mp_store:    { badge: "Shop",     badgeBg: "#EFF6FF", badgeColor: "#1E40AF", imgBg: "#EFF6FF", btnBg: "#2563EB" },
};

// Accent colors per context
const ACCENT = {
  deals:       { main: "#E24B4A", light: "#FCE8E8", text: "#A32D2D" },
  marketplace: { main: "#2563EB", light: "#EFF6FF", text: "#1E40AF" },
};

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function TypeIcon({ type, size = 36 }) {
  const color = {
    product:     "#378ADD",
    company:     "#3B6D11",
    category:    "#854F0B",
    flyer:       "#993556",
    mp_product:  "#2563EB",
    mp_category: "#1D4ED8",
    mp_store:    "#2563EB",
  }[type] ?? "#378ADD";

  if (type === "product" || type === "mp_product") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
  if (type === "company" || type === "mp_store") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
  if (type === "category" || type === "mp_category") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function MetaItem({ label, value, valueColor }) {
  return (
    <div style={{ background: "#F7F7F5", borderRadius: "10px", padding: "10px 12px" }}>
      <div style={{ fontSize: "11px", color: "#b0b0a8", marginBottom: "2px" }}>{label}</div>
      <div style={{ fontSize: "13px", fontWeight: "500", color: valueColor || "#1A1A1A" }}>{value}</div>
    </div>
  );
}

function DetailPopup({ item, onClose, accentColor }) {
  const [visible, setVisible] = useState(false);
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.product;
  const priceColor = accentColor || "#E24B4A";

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 180);
  };

  const savings = (item.type === "product" || item.type === "mp_product") && item.old_price
    ? Math.round(((parseFloat(item.old_price) - parseFloat(item.price)) / parseFloat(item.old_price)) * 100)
    : null;

  const ProductCard = () => (
    <>
      <div style={{ background: cfg.imgBg, height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, position: "relative" }}>
        <CloseBtn onClick={handleClose} />
        {item.image
          ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
          : <><TypeIcon type={item.type} size={44} /><span style={{ fontSize: "11px", color: "#185FA5", fontWeight: "500" }}>{item.category_name}</span></>
        }
      </div>
      <div style={{ padding: "20px" }}>
        <Badge cfg={cfg} />
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1A1A1A", margin: "8px 0 4px", lineHeight: 1.3 }}>{item.name}</h3>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "14px" }}>Sold by {item.company_name || item.store_name}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: priceColor }}>
            QAR {Number(item.price).toLocaleString()}
          </span>
          {item.old_price && (
            <span style={{ fontSize: "15px", color: "#b0b0a8", textDecoration: "line-through" }}>
              QAR {Number(item.old_price).toLocaleString()}
            </span>
          )}
          {savings && (
            <span style={{
              fontSize: "12px", fontWeight: "600", padding: "3px 10px",
              borderRadius: "999px",
              background: accentColor === "#2563EB" ? "#DBEAFE" : "#FCE8E8",
              color: accentColor === "#2563EB" ? "#1E40AF" : "#A32D2D",
            }}>
              {savings}% off
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
          <MetaItem label="Store" value={item.company_name || item.store_name} />
          <MetaItem label="Category" value={item.category_name} />
          {item.old_price && <MetaItem label="You save" value={`QAR ${(Number(item.old_price) - Number(item.price)).toLocaleString()}`} valueColor={priceColor} />}
          <MetaItem label="Featured" value={item.is_featured ? "Yes" : "No"} />
        </div>
      </div>
    </>
  );

  const CompanyCard = () => (
    <>
      <div style={{ background: cfg.imgBg, height: 160, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <CloseBtn onClick={handleClose} />
        {item.logo
          ? <img src={item.logo} alt={item.name} style={{ width: 80, height: 80, borderRadius: 16, objectFit: "contain" }} />
          : <TypeIcon type={item.type} size={44} />
        }
      </div>
      <div style={{ padding: "20px" }}>
        <Badge cfg={cfg} />
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1A1A1A", margin: "8px 0 4px" }}>{item.name}</h3>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "14px" }}>{item.description}</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
          <MetaItem label="City" value={item.city} />
          <MetaItem label="Products" value={item.products?.length ?? 0} />
          <MetaItem label="Flyers" value={item.pdfs?.length ?? 0} />
          <MetaItem label="Country" value="Qatar" />
        </div>
      </div>
    </>
  );

  const CategoryCard = () => (
    <>
      <div style={{ background: cfg.imgBg, height: 160, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <CloseBtn onClick={handleClose} />
        {item.image
          ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
          : <TypeIcon type={item.type} size={44} />
        }
      </div>
      <div style={{ padding: "20px" }}>
        <Badge cfg={cfg} />
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1A1A1A", margin: "8px 0 4px" }}>{item.name}</h3>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "14px" }}>
          {item._parent ? `Sub-category of ${item._parent}` : "Top-level category"}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px", marginBottom: "18px" }}>
          <MetaItem label="Type" value={item._parent ? "Subcategory" : "Main category"} />
          {item.products?.length > 0 && <MetaItem label="Products" value={item.products.length} />}
        </div>
      </div>
    </>
  );

  const FlyerCard = () => {
    const [numPages, setNumPages] = useState(null);
    return (
      <>
        <div style={{ background: "#f5f5f5", height: 220, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          <CloseBtn onClick={handleClose} />
          {item.pdf ? (
            <Document
              file={{ url: item.pdf, withCredentials: false }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading="Loading PDF..."
            >
              <Page pageNumber={1} width={300} renderTextLayer={false} renderAnnotationLayer={false} />
            </Document>
          ) : (
            <TypeIcon type="flyer" size={44} />
          )}
        </div>
        <div style={{ padding: "20px" }}>
          <Badge cfg={cfg} />
          <h3 style={{ fontSize: "18px", fontWeight: "600", margin: "8px 0 4px" }}>{item.title}</h3>
          <p style={{ fontSize: "13px", color: "#888", marginBottom: "14px" }}>By {item.company_name}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <MetaItem label="Store" value={item.company_name} />
            <MetaItem label="Type" value={item.category_type} />
            {item.start_date && <MetaItem label="Start" value={item.start_date} />}
            {item.end_date && <MetaItem label="End" value={item.end_date} />}
          </div>
          <button
            onClick={() => window.open(item.pdf, "_blank")}
            style={{ flex: 1, width: "100%", padding: "10px", background: "#1A1A1A", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
          >
            Open PDF
          </button>
        </div>
      </>
    );
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed", inset: 0,
        background: visible ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)",
        display: "flex", justifyContent: "center", alignItems: "center",
        padding: "20px", zIndex: 10000,
        transition: "background 0.2s ease",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", width: "100%", maxWidth: "400px",
          borderRadius: "20px", overflow: "hidden",
          transform: visible ? "scale(1)" : "scale(0.92)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.24s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease",
        }}
      >
        {(item.type === "product" || item.type === "mp_product") && <ProductCard />}
        {(item.type === "company" || item.type === "mp_store")   && <CompanyCard />}
        {(item.type === "category" || item.type === "mp_category") && <CategoryCard />}
        {item.type === "flyer" && <FlyerCard />}
      </div>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────────────────────

function CloseBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute", top: 12, right: 12,
        width: 28, height: 28, borderRadius: "50%",
        background: "rgba(0,0,0,0.28)", border: "none",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <X size={12} color="#fff" />
    </button>
  );
}

function Badge({ cfg }) {
  return (
    <span style={{
      display: "inline-block", fontSize: "11px", fontWeight: "600",
      padding: "3px 10px", borderRadius: "999px",
      background: cfg.badgeBg, color: cfg.badgeColor,
    }}>
      {cfg.badge}
    </span>
  );
}

// ─── Search result row ────────────────────────────────────────────────────────

const BADGE_STYLES = {
  product:     { bg: "#E6F1FB", color: "#185FA5", label: "Product"  },
  company:     { bg: "#EAF3DE", color: "#3B6D11", label: "Store"    },
  category:    { bg: "#FAEEDA", color: "#854F0B", label: "Category" },
  flyer:       { bg: "#FBEAF0", color: "#993556", label: "Flyer"    },
  mp_product:  { bg: "#EFF6FF", color: "#1E40AF", label: "Item"     },
  mp_category: { bg: "#DBEAFE", color: "#1D4ED8", label: "Category" },
  mp_store:    { bg: "#EFF6FF", color: "#1E40AF", label: "Shop"     },
};

function ResultRow({ type, name, sub, price, oldPrice, accentColor, onClick }) {
  const s = BADGE_STYLES[type] || BADGE_STYLES.product;
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", cursor: "pointer", transition: "background 0.1s" }}
      onMouseEnter={e => e.currentTarget.style.background = "#F7F7F5"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "999px", background: s.bg, color: s.color, flexShrink: 0 }}>
        {s.label}
      </span>
      <span style={{ fontSize: "13.5px", color: "#1A1A1A", flex: 1 }}>{name}</span>
      {price && (
        <span style={{ fontSize: "12px", color: accentColor || "#E24B4A", fontWeight: "600", flexShrink: 0 }}>
          QAR {Number(price).toLocaleString()}
          {oldPrice && <span style={{ color: "#b0b0a8", fontWeight: "400", marginLeft: "4px", textDecoration: "line-through" }}>{Number(oldPrice).toLocaleString()}</span>}
        </span>
      )}
      {sub && !price && <span style={{ fontSize: "12px", color: "#9b9b9b", flexShrink: 0 }}>{sub}</span>}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d0d0cc" strokeWidth="2" style={{ flexShrink: 0 }}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  );
}

// ─── Quick tag sets per context ───────────────────────────────────────────────

const QUICK_TAGS = {
  deals:       ["Garden", "Electronics", "Laptop", "Iphone", "Beauty", "Clinics", "Toys", "Groceries", "Fashion", "Sports"],
  marketplace: ["Phones", "Laptops", "Furniture", "Clothing", "Watches", "Cameras", "Appliances", "Shoes", "Bags", "Gaming"],
};

// ─── Main SearchModal ─────────────────────────────────────────────────────────

/**
 * Props:
 *  onClose          — required, closes the modal
 *  searchContext    — "deals" (default) | "marketplace"
 *  searchPlaceholder — optional override for input placeholder
 */
export default function SearchModal({
  onClose,
  searchContext = "deals",
  searchPlaceholder,
}) {
  const [query, setQuery]       = useState("");
  const [visible, setVisible]   = useState(false);
  const [selected, setSelected] = useState(null);
  const inputRef                = useRef(null);

  const isMarketplace = searchContext === "marketplace";
  const accent        = ACCENT[searchContext] || ACCENT.deals;

  // Always call both hooks — hooks can't be conditional.
  // Each hook is responsible for its own data source.
  const dealsData       = useHomeData();
  const marketplaceData = useMarketplaceData?.() ?? { items: [], categories: [], stores: [], loading: false };

  // Pick which data set to search
  const { companies, categories, products, pdfs, loading: dealsLoading }                    = dealsData;
  const { items: mpItems, categories: mpCategories, stores: mpStores, loading: mpLoading }  = marketplaceData;

  const loading = isMarketplace ? mpLoading : dealsLoading;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e) => { if (e.key === "Escape" && !selected) handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const q = query.toLowerCase().trim();

  // ── Deals filtering (original logic) ─────────────────────────────────────
  const allCategories = (categories ?? []).flatMap(cat => [
    cat,
    ...(cat.subcategories?.map(sub => ({ ...sub, type: "category", _parent: cat.name })) ?? []),
  ]).map(c => ({ ...c, type: "category" }));

  const filteredProducts   = !isMarketplace && q.length >= 2 ? (products ?? []).filter(p => p.name.toLowerCase().includes(q) || p.company_name?.toLowerCase().includes(q) || p.category_name?.toLowerCase().includes(q)) : [];
  const filteredCompanies  = !isMarketplace && q.length >= 2 ? (companies ?? []).filter(c => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)) : [];
  const filteredCategories = !isMarketplace && q.length >= 2 ? allCategories.filter(c => c.name.toLowerCase().includes(q)) : [];
  const filteredPdfs       = !isMarketplace && q.length >= 2 ? (pdfs ?? []).filter(p => p.title.toLowerCase().includes(q) || p.company_name?.toLowerCase().includes(q) || p.category_type?.toLowerCase().includes(q)) : [];

  // ── Marketplace filtering ─────────────────────────────────────────────────
  const filteredMpItems      = isMarketplace && q.length >= 2 ? (mpItems ?? []).filter(i => i.name?.toLowerCase().includes(q) || i.store_name?.toLowerCase().includes(q) || i.category_name?.toLowerCase().includes(q)) : [];
  const filteredMpCategories = isMarketplace && q.length >= 2 ? (mpCategories ?? []).filter(c => c.name?.toLowerCase().includes(q)) : [];
  const filteredMpStores     = isMarketplace && q.length >= 2 ? (mpStores ?? []).filter(s => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)) : [];

  const hasResults = isMarketplace
    ? filteredMpItems.length + filteredMpCategories.length + filteredMpStores.length > 0
    : filteredProducts.length + filteredCompanies.length + filteredCategories.length + filteredPdfs.length > 0;

  const quickTags  = QUICK_TAGS[searchContext] || QUICK_TAGS.deals;
  const placeholder = searchPlaceholder || (isMarketplace ? "Search items, shops, categories…" : "Search products, stores, categories…");

  // Border/divider colors
  const borderColor  = isMarketplace ? "#BFDBFE" : "#EBEBEB";
  const tagBorder    = isMarketplace ? "#BFDBFE" : "#EBEBEB";
  const tagBg        = isMarketplace ? "#EFF6FF" : "#F7F7F5";
  const tagColor     = isMarketplace ? "#1E40AF" : "#5a5a5a";
  const footerBrand  = isMarketplace ? "Marketplace" : "Daily Deals Qatar";

  return (
    <>
      {/* Backdrop + search modal */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0,
          background: visible ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
          display: "flex", justifyContent: "center", alignItems: "flex-start",
          paddingTop: "72px", zIndex: 9999,
          transition: "background 0.2s ease",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff", width: "100%", maxWidth: "560px",
            borderRadius: "16px", overflow: "hidden",
            boxShadow: isMarketplace
              ? "0 20px 60px rgba(37,99,235,0.14)"
              : "0 20px 60px rgba(0,0,0,0.18)",
            transform: visible ? "translateY(0) scale(1)" : "translateY(-14px) scale(0.97)",
            opacity: visible ? 1 : 0,
            transition: "transform 0.25s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease",
            margin: "0 16px",
          }}
        >
          {/* Input row */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderBottom: `1px solid ${borderColor}` }}>
            <Search size={16} color={isMarketplace ? "#2563EB" : "#9b9b9b"} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              style={{ flex: 1, border: "none", outline: "none", fontSize: "15px", color: "#1A1A1A", background: "transparent", fontFamily: "inherit" }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{ border: "none", background: "#F0F0EE", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <X size={12} color="#6b6b6b" />
              </button>
            )}
            <button
              onClick={handleClose}
              style={{ border: `1px solid ${borderColor}`, background: "transparent", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: "#b0b0a8", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
            >
              Esc
            </button>
          </div>

          {/* Results */}
          <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>

            {loading && (
              <div style={{ textAlign: "center", padding: "32px", color: "#9b9b9b", fontSize: "13.5px" }}>Loading…</div>
            )}

            {!loading && q.length < 2 && (
              <div style={{ padding: "12px 8px 4px" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#b0b0a8", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "8px" }}>
                  {isMarketplace ? "Browse marketplace" : "Quick search"}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {quickTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setQuery(tag)}
                      style={{ padding: "5px 14px", borderRadius: "999px", border: `1px solid ${tagBorder}`, background: tagBg, fontSize: "12.5px", color: tagColor, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && q.length >= 2 && !hasResults && (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#9b9b9b", fontSize: "13.5px" }}>
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {/* ── Deals results ── */}
            {filteredProducts.length > 0 && (
              <>
                <SectionLabel label="Products" />
                {filteredProducts.map(p => (
                  <ResultRow key={p.id} type="product" name={p.name} price={p.price} oldPrice={p.old_price} accentColor={accent.main} onClick={() => setSelected({ ...p, type: "product" })} />
                ))}
              </>
            )}
            {filteredCompanies.length > 0 && (
              <>
                <SectionLabel label="Stores" />
                {filteredCompanies.map(c => (
                  <ResultRow key={c.id} type="company" name={c.name} sub={c.city} accentColor={accent.main} onClick={() => setSelected({ ...c, type: "company" })} />
                ))}
              </>
            )}
            {filteredCategories.length > 0 && (
              <>
                <SectionLabel label="Categories" />
                {filteredCategories.map(c => (
                  <ResultRow key={c.id} type="category" name={c.name} sub={c._parent ? `in ${c._parent}` : null} accentColor={accent.main} onClick={() => setSelected({ ...c, type: "category" })} />
                ))}
              </>
            )}
            {filteredPdfs.length > 0 && (
              <>
                <SectionLabel label="Flyers & offers" />
                {filteredPdfs.map(p => (
                  <ResultRow key={p.id} type="flyer" name={p.title} sub={p.company_name} accentColor={accent.main} onClick={() => setSelected({ ...p, type: "flyer" })} />
                ))}
              </>
            )}

            {/* ── Marketplace results ── */}
            {filteredMpItems.length > 0 && (
              <>
                <SectionLabel label="Items" accentColor={accent.main} />
                {filteredMpItems.map(i => (
                  <ResultRow key={i.id} type="mp_product" name={i.name} price={i.price} oldPrice={i.old_price} accentColor={accent.main} onClick={() => setSelected({ ...i, type: "mp_product" })} />
                ))}
              </>
            )}
            {filteredMpCategories.length > 0 && (
              <>
                <SectionLabel label="Categories" accentColor={accent.main} />
                {filteredMpCategories.map(c => (
                  <ResultRow key={c.id} type="mp_category" name={c.name} sub={c._parent ? `in ${c._parent}` : null} accentColor={accent.main} onClick={() => setSelected({ ...c, type: "mp_category" })} />
                ))}
              </>
            )}
            {filteredMpStores.length > 0 && (
              <>
                <SectionLabel label="Shops" accentColor={accent.main} />
                {filteredMpStores.map(s => (
                  <ResultRow key={s.id} type="mp_store" name={s.name} sub={s.city} accentColor={accent.main} onClick={() => setSelected({ ...s, type: "mp_store" })} />
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: `1px solid ${borderColor}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11.5px", color: "#b0b0a8" }}>{footerBrand}</span>
            <span style={{ fontSize: "11px", color: "#b0b0a8" }}>Click a result to view details</span>
          </div>
        </div>
      </div>

      {/* Detail popup */}
      {selected && (
        <DetailPopup
          item={selected}
          onClose={() => setSelected(null)}
          accentColor={accent.main}
        />
      )}
    </>
  );
}

function SectionLabel({ label, accentColor }) {
  return (
    <p style={{
      fontSize: "11px", fontWeight: "600", color: "#b0b0a8",
      textTransform: "uppercase", letterSpacing: "0.6px",
      padding: "8px 10px 4px",
    }}>
      {label}
    </p>
  );
}