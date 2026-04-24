import { useEffect } from "react";
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
const getCat = (id) =>
  CAT_COLORS[id] || { bg: "#F8F9FA", accent: R, pill: "#FFE4E6", pillText: "#9F1239" };

/* ══════════════════════════════════════════════
   PRODUCT MODAL
   Popup showing product image + full details.
══════════════════════════════════════════════ */
export default function ProductModal({ product, onClose }) {
  const c = getCat(product.categoryId);

  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>

        <div className="modal-img-wrap" style={{ background: c.bg }}>
          {product.image
            ? <img src={product.image} alt={product.title}
                style={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain" }} />
            : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 48 }}>
                <Package size={64} strokeWidth={1.2} color={c.accent} />
                <span style={{ fontSize: 13, color: MUTED }}>No image available</span>
              </div>
            )
          }
        </div>

        <div className="modal-body">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <h2 className="modal-title" style={{ marginBottom: 0 }}>{product.title}</h2>
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
            {product.originalPrice && <span className="modal-orig">{product.originalPrice}</span>}
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
  );
}