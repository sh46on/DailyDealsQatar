import { useEffect, useCallback, useRef, useState, memo } from "react";
import { X, Package } from "lucide-react";

/* ─────────────────────────────────────────────
   BRAND PALETTE (mirror of Home.jsx)
───────────────────────────────────────────── */
const R      = "#E30613";
const DARK   = "#1C1F26";
const BORDER = "#E4E1DC";
const MUTED  = "#8A8580";

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

// Memoised lookup – avoids recreating the fallback object on every render
const getCat = (id) =>
  CAT_COLORS[id] ?? { bg: "#F8F9FA", accent: R, pill: "#FFE4E6", pillText: "#9F1239" };

/* ─────────────────────────────────────────────
   LAZY PRODUCT IMAGE
   • Shows a lightweight skeleton while loading
   • Falls back to <Package> icon on error or
     when no src is provided
   • `loading="lazy"` + explicit dimensions let
     the browser skip layout recalculations
───────────────────────────────────────────── */
const LazyProductImage = memo(function LazyProductImage({ src, alt, accent, muted }) {
  const [status, setStatus] = useState(src ? "loading" : "empty");

  // If `src` prop changes (e.g. modal reused for a different product) reset
  const prevSrc = useRef(src);
  if (prevSrc.current !== src) {
    prevSrc.current = src;
    setStatus(src ? "loading" : "empty");
  }

  const handleLoad  = useCallback(() => setStatus("loaded"),  []);
  const handleError = useCallback(() => setStatus("error"),   []);

  if (status === "empty" || status === "error") {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 12, padding: 48, minHeight: 200,
      }}>
        <Package size={64} strokeWidth={1.2} color={accent} aria-hidden="true" />
        <span style={{ fontSize: 13, color: muted }}>No image available</span>
      </div>
    );
  }

  return (
    <>
      {/* Skeleton shown until the image fires onLoad */}
      {status === "loading" && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.4s infinite",
            borderRadius: 4,
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"          // native lazy loading
        decoding="async"        // off main thread decode
        width={400}             // hint prevents layout shift
        height={300}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          maxWidth: "100%", maxHeight: 300,
          objectFit: "contain",
          opacity: status === "loaded" ? 1 : 0,
          transition: "opacity 0.25s ease",
          position: "relative",  // sits above skeleton
        }}
      />
    </>
  );
});

/* ─────────────────────────────────────────────
   FOCUS TRAP
   Keeps keyboard focus inside the modal while
   it is open (WCAG 2.1 §2.1.2)
───────────────────────────────────────────── */
function useFocusTrap(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    // Move focus into the modal on mount
    first?.focus();

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    };

    el.addEventListener("keydown", handleTab);
    return () => el.removeEventListener("keydown", handleTab);
  }, [ref]);
}

/* ─────────────────────────────────────────────
   BODY SCROLL LOCK
   Prevents the page behind the overlay from
   scrolling while the modal is open.
───────────────────────────────────────────── */
function useBodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
}

/* ══════════════════════════════════════════════
   PRODUCT MODAL
   Popup showing product image + full details.

   Optimisations applied
   ─────────────────────
   • memo()          — skips re-renders when props are identical
   • useCallback()   — stable onClose / keyboard handler references
   • LazyProductImage — skeleton + lazy/async loading attrs
   • useFocusTrap    — a11y: keyboard users stay inside the dialog
   • useBodyScrollLock — prevents scroll bleed
   • role="dialog" + aria-modal — screen-reader semantics
   • shimmer keyframe injected once via a <style> tag
══════════════════════════════════════════════ */
const ProductModal = memo(function ProductModal({ product, onClose }) {
  const c       = getCat(product.categoryId);
  const boxRef  = useRef(null);

  // Stable callback – won't cause child re-renders
  const handleClose = useCallback(() => onClose(), [onClose]);

  // Keyboard: Escape closes
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [handleClose]);

  useBodyScrollLock();
  useFocusTrap(boxRef);

  return (
    <>
      {/* One-time shimmer keyframe – injected into <head> */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div
        className="modal-overlay"
        onClick={handleClose}
        role="presentation"   // overlay itself is not the dialog
      >
        <div
          ref={boxRef}
          className="modal-box"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={product.title}
        >
          <button
            className="modal-close"
            onClick={handleClose}
            aria-label="Close product details"
          >
            <X size={18} aria-hidden="true" />
          </button>

          {/* Image area – relative so the skeleton can overlay it */}
          <div
            className="modal-img-wrap"
            style={{ background: c.bg, position: "relative", overflow: "hidden" }}
          >
            <LazyProductImage
              src={product.image}
              alt={product.title}
              accent={c.accent}
              muted={MUTED}
            />
          </div>

          <div className="modal-body">
            <div style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", gap: 12, marginBottom: 12,
            }}>
              <h2 className="modal-title" style={{ marginBottom: 0 }}>
                {product.title}
              </h2>
              {product.badge && (
                <span style={{
                  flexShrink: 0, fontSize: 10, fontWeight: 700,
                  padding: "3px 10px", borderRadius: 12,
                  background: c.pill, color: c.pillText, marginTop: 3,
                }}>
                  {product.badge}
                </span>
              )}
            </div>

            <div className="modal-pricing">
              <span className="modal-price">{product.price}</span>
              {product.originalPrice && (
                <span className="modal-orig">{product.originalPrice}</span>
              )}
              {product.discount && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px",
                  borderRadius: 8, background: c.pill, color: c.pillText,
                }}>
                  {product.discount}
                </span>
              )}
            </div>

            <div className="modal-meta">
              <span style={{ fontSize: 12, color: MUTED }}>
                Category: <b style={{ color: DARK }}>{product.categoryName}</b>
              </span>
              <span style={{ fontSize: 12, color: MUTED }}>
                Store: <b style={{ color: DARK }}>{product.company}</b>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default ProductModal;

/* ─────────────────────────────────────────────
   LAZY-IMPORT USAGE EXAMPLE (in parent file)
   ─────────────────────────────────────────────
   import { lazy, Suspense } from "react";

   const ProductModal = lazy(() => import("./ProductModal"));

   // In JSX:
   {selectedProduct && (
     <Suspense fallback={null}>
       <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
     </Suspense>
   )}

   This defers the entire modal bundle until it is
   first needed, keeping the initial page load lean.
───────────────────────────────────────────── */