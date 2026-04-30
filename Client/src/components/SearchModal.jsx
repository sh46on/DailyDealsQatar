import {
  useState, useEffect, useRef, useMemo,
  useCallback, lazy, Suspense,
} from "react";
import { Search, X } from "lucide-react";
import { useHomeData } from "../hooks/useHomeData";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

// Lazy-load heavy PDF components — only downloaded when a flyer is opened
const Document = lazy(() =>
  import("react-pdf").then(m => ({ default: m.Document }))
);
const Page = lazy(() =>
  import("react-pdf").then(m => ({ default: m.Page }))
);

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#E24B4A";

const TYPE_CFG = {
  product: { badge: "Product", badgeBg: "#E6F1FB", badgeColor: "#0C447C", imgBg: "#E6F1FB" },
  flyer:   { badge: "Flyer",   badgeBg: "#FBEAF0", badgeColor: "#72243E", imgBg: "#FBEAF0" },
};

// ─── useDebounce ──────────────────────────────────────────────────────────────

function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Lazy row (IntersectionObserver) ─────────────────────────────────────────

function LazyRow({ children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "100px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : 44 }}>
      {visible ? children : null}
    </div>
  );
}

// ─── Small shared components ──────────────────────────────────────────────────

const CloseBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.28)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <X size={12} color="#fff" />
  </button>
);

const Badge = ({ cfg }) => (
  <span style={{ display: "inline-block", fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "999px", background: cfg.badgeBg, color: cfg.badgeColor }}>
    {cfg.badge}
  </span>
);

const MetaItem = ({ label, value, valueColor }) => (
  <div style={{ background: "#F7F7F5", borderRadius: "10px", padding: "10px 12px" }}>
    <div style={{ fontSize: "11px", color: "#b0b0a8", marginBottom: "2px" }}>{label}</div>
    <div style={{ fontSize: "13px", fontWeight: "500", color: valueColor || "#1A1A1A" }}>{value}</div>
  </div>
);

const ProductIcon = () => (
  <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const FlyerIcon = () => (
  <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke="#993556" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

// ─── Detail cards (lifted outside DetailPopup) ────────────────────────────────

const ProductCard = ({ item, cfg, onClose }) => {
  const savings = item.old_price
    ? Math.round(((parseFloat(item.old_price) - parseFloat(item.price)) / parseFloat(item.old_price)) * 100)
    : null;

  return (
    <>
      <div style={{ background: cfg.imgBg, height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, position: "relative" }}>
        <CloseBtn onClick={onClose} />
        {item.image
          ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
          : <><ProductIcon /><span style={{ fontSize: "11px", color: "#185FA5", fontWeight: "500" }}>{item.category_name}</span></>
        }
      </div>
      <div style={{ padding: "20px" }}>
        <Badge cfg={cfg} />
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#1A1A1A", margin: "8px 0 4px", lineHeight: 1.3 }}>{item.name}</h3>
        <p style={{ fontSize: "13px", color: "#888", marginBottom: "14px" }}>Sold by {item.company_name}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: ACCENT }}>QAR {Number(item.price).toLocaleString()}</span>
          {item.old_price && <span style={{ fontSize: "15px", color: "#b0b0a8", textDecoration: "line-through" }}>QAR {Number(item.old_price).toLocaleString()}</span>}
          {savings > 0 && <span style={{ fontSize: "12px", fontWeight: "600", padding: "3px 10px", borderRadius: "999px", background: "#FCE8E8", color: "#A32D2D" }}>{savings}% off</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <MetaItem label="Store" value={item.company_name} />
          <MetaItem label="Category" value={item.category_name} />
          {item.old_price && <MetaItem label="You save" value={`QAR ${(Number(item.old_price) - Number(item.price)).toLocaleString()}`} valueColor={ACCENT} />}
          <MetaItem label="Featured" value={item.is_featured ? "Yes" : "No"} />
        </div>
      </div>
    </>
  );
};

const FlyerCard = ({ item, cfg, onClose }) => {
  const pdfFile = useMemo(
    () => item.pdf ? { url: item.pdf, withCredentials: false } : null,
    [item.pdf]
  );

  return (
    <>
      <div style={{ background: "#f5f5f5", height: 220, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <CloseBtn onClick={onClose} />
        {pdfFile
          ? <Suspense fallback={<span style={{ fontSize: 13, color: "#999" }}>Loading…</span>}>
              <Document file={pdfFile} loading={null}>
                <Page pageNumber={1} width={300} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </Suspense>
          : <FlyerIcon />
        }
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
        <button onClick={() => window.open(item.pdf, "_blank")} style={{ width: "100%", padding: "10px", background: "#1A1A1A", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>
          Open PDF
        </button>
      </div>
    </>
  );
};

// ─── Detail Popup ─────────────────────────────────────────────────────────────

const DetailPopup = ({ item, onClose }) => {
  const [visible, setVisible] = useState(false);
  const cfg = TYPE_CFG[item.type] || TYPE_CFG.product;

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  return (
    <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: visible ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", zIndex: 10000, transition: "background 0.2s ease", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: "400px", borderRadius: "20px", overflow: "hidden", transform: visible ? "scale(1)" : "scale(0.92)", opacity: visible ? 1 : 0, transition: "transform 0.24s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease" }}>
        {item.type === "product" && <ProductCard item={item} cfg={cfg} onClose={handleClose} />}
        {item.type === "flyer"   && <FlyerCard   item={item} cfg={cfg} onClose={handleClose} />}
      </div>
    </div>
  );
};

// ─── Result Row ───────────────────────────────────────────────────────────────

const BADGE_STYLES = {
  product: { bg: "#E6F1FB", color: "#185FA5", label: "Product" },
  flyer:   { bg: "#FBEAF0", color: "#993556", label: "Flyer"   },
};

const ResultRow = ({ type, name, sub, price, oldPrice, onClick }) => {
  const s = BADGE_STYLES[type] || BADGE_STYLES.product;
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.background = "#F7F7F5"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "999px", background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</span>
      <span style={{ fontSize: "13.5px", color: "#1A1A1A", flex: 1 }}>{name}</span>
      {price
        ? <span style={{ fontSize: "12px", color: ACCENT, fontWeight: "600", flexShrink: 0 }}>
            QAR {Number(price).toLocaleString()}
            {oldPrice && <span style={{ color: "#b0b0a8", fontWeight: "400", marginLeft: "4px", textDecoration: "line-through" }}>{Number(oldPrice).toLocaleString()}</span>}
          </span>
        : sub && <span style={{ fontSize: "12px", color: "#9b9b9b", flexShrink: 0 }}>{sub}</span>
      }
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d0d0cc" strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  );
};

const SectionLabel = ({ label }) => (
  <p style={{ fontSize: "11px", fontWeight: "600", color: "#b0b0a8", textTransform: "uppercase", letterSpacing: "0.6px", padding: "8px 10px 4px" }}>{label}</p>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SearchModal({ onClose }) {
  const [query, setQuery]       = useState("");
  const [visible, setVisible]   = useState(false);
  const [selected, setSelected] = useState(null);
  const inputRef                = useRef(null);

  const debouncedQuery = useDebounce(query, 250);
  const q = debouncedQuery.toLowerCase().trim();

  const { companies, categories, products, pdfs, loading } = useHomeData();

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    setTimeout(() => inputRef.current?.focus(), 80);
    const onKey = (e) => { if (e.key === "Escape" && !selected) handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, selected]);

  const pdfList = useMemo(
    () => pdfs?.results ?? (Array.isArray(pdfs) ? pdfs : []),
    [pdfs]
  );

  // Company and category id/name sets — used to expand matches
  const matchingCompanyIds = useMemo(() => {
    if (q.length < 2) return null;
    const ids = new Set((companies ?? []).filter(c => c.name?.toLowerCase().includes(q)).map(c => c.id));
    return ids.size > 0 ? ids : null;
  }, [companies, q]);

  const matchingCategoryNames = useMemo(() => {
    if (q.length < 2) return null;
    const names = new Set(
      (categories ?? [])
        .flatMap(cat => [cat.name, ...(cat.subcategories?.map(s => s.name) ?? [])])
        .filter(n => n?.toLowerCase().includes(q))
    );
    return names.size > 0 ? names : null;
  }, [categories, q]);

  const filteredProducts = useMemo(() => {
    if (q.length < 2) return [];
    return (products ?? []).filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.category_name?.toLowerCase().includes(q) ||
      matchingCompanyIds?.has(p.company_id) ||
      matchingCategoryNames?.has(p.category_name)
    );
  }, [products, q, matchingCompanyIds, matchingCategoryNames]);

  const filteredPdfs = useMemo(() => {
    if (q.length < 2) return [];
    return pdfList.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.category_type?.toLowerCase().includes(q) ||
      matchingCompanyIds?.has(p.company_id)
    );
  }, [pdfList, q, matchingCompanyIds]);

  const hasResults = filteredProducts.length + filteredPdfs.length > 0;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: visible ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)", display: "flex", justifyContent: "center", alignItems: "flex-start", paddingTop: "72px", zIndex: 9999, transition: "background 0.2s ease", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: "560px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", transform: visible ? "translateY(0) scale(1)" : "translateY(-14px) scale(0.97)", opacity: visible ? 1 : 0, transition: "transform 0.25s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease", margin: "0 16px" }}>

          {/* Input */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderBottom: "1px solid #EBEBEB" }}>
            <Search size={16} color="#9b9b9b" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, flyers, stores…"
              style={{ flex: 1, border: "none", outline: "none", fontSize: "15px", color: "#1A1A1A", background: "transparent", fontFamily: "inherit" }}
            />
            {query && (
              <button onClick={() => setQuery("")} style={{ border: "none", background: "#F0F0EE", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <X size={12} color="#6b6b6b" />
              </button>
            )}
            <button onClick={handleClose} style={{ border: "1px solid #EBEBEB", background: "transparent", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", color: "#b0b0a8", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
              Esc
            </button>
          </div>

          {/* Results */}
          <div style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
            {loading && <div style={{ textAlign: "center", padding: "32px", color: "#9b9b9b", fontSize: "13.5px" }}>Loading…</div>}

            {!loading && q.length < 2 && (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#b0b0a8", fontSize: "13px" }}>
                Type at least 2 characters to search
              </div>
            )}

            {!loading && q.length >= 2 && !hasResults && (
              <div style={{ textAlign: "center", padding: "32px 16px", color: "#9b9b9b", fontSize: "13.5px" }}>
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            {filteredProducts.length > 0 && (
              <>
                <SectionLabel label="Products" />
                {filteredProducts.map(p => (
                  <LazyRow key={p.id}>
                    <ResultRow type="product" name={p.name} price={p.price} oldPrice={p.old_price}
                      onClick={() => setSelected({ ...p, type: "product" })} />
                  </LazyRow>
                ))}
              </>
            )}

            {filteredPdfs.length > 0 && (
              <>
                <SectionLabel label="Flyers & Offers" />
                {filteredPdfs.map(p => (
                  <LazyRow key={p.id}>
                    <ResultRow type="flyer" name={p.title} sub={p.company_name}
                      onClick={() => setSelected({ ...p, type: "flyer" })} />
                  </LazyRow>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: "1px solid #EBEBEB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11.5px", color: "#b0b0a8" }}>Daily Deals Qatar</span>
            <span style={{ fontSize: "11px", color: "#b0b0a8" }}>Click a result to view details</span>
          </div>
        </div>
      </div>

      {selected && <DetailPopup item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}