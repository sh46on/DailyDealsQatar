import { useEffect, useState } from "react";
import {
  getCompanyProducts,
  deleteProduct,
  toggleProduct
} from "./api/companyApi";
import CompanyLayout from "../CompaniesComponent/CompanyLayout";
import { getImageUrl } from "../api/media";

/* ─────────────────────────────────────────────────────────────────
   Styles — mirrors CompanyDashboard design system exactly
   Prefix: cp2  (avoids any collision with old .cp rules)
───────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Bricolage+Grotesque:wght@600;700;800&display=swap');

  .cp2 * { box-sizing: border-box; margin: 0; padding: 0; }

  .cp2 {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f5f7ff;
    min-height: 100vh;
    padding: 2rem 1.5rem 3rem;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Fixed gradient hero (identical to dashboard) ── */
  .cp2-hero {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 320px;
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 52%, #7c3aed 100%);
    z-index: 0;
    pointer-events: none;
  }
  .cp2-hero::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0; right: 0; height: 80px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 80' preserveAspectRatio='none'%3E%3Cpath d='M0,36 C360,80 720,0 1080,36 C1260,54 1360,20 1440,36 L1440,80 L0,80 Z' fill='%23f5f7ff'/%3E%3C/svg%3E") center bottom / 100% 100% no-repeat;
  }

  .cp2-inner {
    position: relative; z-index: 1;
    max-width: 1020px; margin: 0 auto;
  }

  /* ── Top bar ── */
  .cp2-topbar {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin-bottom: 2.4rem;
  }
  .cp2-brand { display: flex; align-items: center; gap: 13px; }
  .cp2-avatar {
    width: 56px; height: 56px; border-radius: 14px;
    background: rgba(255,255,255,0.18);
    border: 1.5px solid rgba(255,255,255,0.38);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(0,0,0,0.14);
    overflow: hidden;
  }
  .cp2-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .cp2-avatar svg { opacity: 0.9; }
  .cp2-co-name {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.02em;
  }
  .cp2-co-sub { font-size: 12px; color: rgba(255,255,255,0.65); margin-top: 2px; font-weight: 400; }
  .cp2-date-pill {
    font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.88);
    background: rgba(255,255,255,0.16);
    border: 1px solid rgba(255,255,255,0.24);
    border-radius: 24px; padding: 7px 17px;
    white-space: nowrap;
  }

  /* ── Metric strip (4 cards, same as dashboard) ── */
  .cp2-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
    gap: 14px; margin-bottom: 16px;
  }
  .cp2-metric {
    background: #fff; border-radius: 18px;
    padding: 1.25rem 1.35rem;
    border: 1.5px solid rgba(99,102,241,0.09);
    box-shadow: 0 2px 14px rgba(79,70,229,0.07), 0 1px 3px rgba(0,0,0,0.04);
    position: relative; overflow: hidden;
    transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s;
    cursor: default;
    contain: layout style;
  }
  .cp2-metric:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(79,70,229,0.13), 0 2px 6px rgba(0,0,0,0.05);
  }
  .cp2-metric-orb {
    position: absolute; top: -22px; right: -22px;
    width: 80px; height: 80px; border-radius: 50%; opacity: 0.12;
  }
  .cp2-metric-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 13px;
  }
  .cp2-metric-lbl {
    font-size: 10.5px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;
  }
  .cp2-metric-num {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 36px; font-weight: 800; line-height: 1; letter-spacing: -0.03em;
  }
  .cp2-metric-hint { font-size: 11px; color: #94a3b8; margin-top: 5px; font-weight: 400; }

  /* ── Section header ── */
  .cp2-sec-hd {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 10px; margin-bottom: 14px;
  }
  .cp2-sec-left { display: flex; align-items: center; gap: 10px; }
  .cp2-sec-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 17px; font-weight: 800; color: #1e293b; letter-spacing: -0.01em;
  }
  .cp2-sec-badge {
    font-size: 11px; font-weight: 700;
    background: #ede9fe; color: #6d28d9;
    padding: 3px 11px; border-radius: 20px;
  }
  .cp2-filter-wrap {
    display: flex; gap: 8px; align-items: center; flex-wrap: wrap;
  }
  .cp2-filter-btn {
    font-size: 11.5px; font-weight: 600; padding: 5px 14px; border-radius: 20px;
    border: 1.5px solid transparent; cursor: pointer;
    transition: all .2s ease; font-family: 'Plus Jakarta Sans', sans-serif;
    background: #fff; color: #64748b; border-color: #e2e8f0;
  }
  .cp2-filter-btn:hover { border-color: #a5b4fc; color: #4f46e5; }
  .cp2-filter-btn.active { background: #ede9fe; color: #5b21b6; border-color: #c4b5fd; }

  /* ── Products grid ── */
  .cp2-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  /* ── Product card ── */
  .cp2-card {
    background: #fff; border-radius: 20px;
    border: 1.5px solid rgba(99,102,241,0.09);
    box-shadow: 0 2px 14px rgba(79,70,229,0.06), 0 1px 3px rgba(0,0,0,0.03);
    position: relative; overflow: hidden;
    transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s;
    display: flex; flex-direction: column;
    contain: layout style;
  }
  .cp2-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 32px rgba(79,70,229,0.13), 0 3px 8px rgba(0,0,0,0.05);
  }

  /* Decorative wave (like FlyerCard) */
  .cp2-wave {
    position: absolute; bottom: 0; left: 0; right: 0; height: 44px;
    pointer-events: none; display: block; width: 100%; z-index: 0;
  }

  /* ── Card body ── */
  .cp2-body {
    padding: 1.25rem 1.35rem 2.4rem;
    position: relative; z-index: 1; flex: 1;
    display: flex; flex-direction: column;
  }

  /* Card top row: image + info */
  .cp2-card-top {
    display: flex; gap: 14px; margin-bottom: 12px;
  }
  .cp2-img-wrap {
    width: 82px; height: 82px; border-radius: 14px; flex-shrink: 0;
    background: #f8fafc; border: 1.5px solid #f1f5f9; overflow: hidden;
  }
  .cp2-img-wrap img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform .4s ease;
  }
  .cp2-card:hover .cp2-img-wrap img { transform: scale(1.04); }

  .cp2-info { flex: 1; min-width: 0; }
  .cp2-name {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 16px; font-weight: 800; color: #1e293b; letter-spacing: -0.01em;
    line-height: 1.3; margin-bottom: 6px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .cp2-price-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .cp2-price {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 22px; font-weight: 800; color: #2563eb; letter-spacing: -0.02em;
    line-height: 1;
  }
  .cp2-pill {
    font-size: 9.5px; font-weight: 700; letter-spacing: .07em;
    text-transform: uppercase; padding: 4px 11px; border-radius: 20px;
  }
  .cp2-pill-active { background: #d1fae5; color: #065f46; }
  .cp2-pill-inactive { background: #f1f5f9; color: #64748b; }

  /* Description */
  .cp2-desc {
    font-size: 12.5px; color: #64748b; line-height: 1.5;
    margin: 10px 0 12px; flex: 1;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Stock progress (identical pattern to campaign progress in FlyerCard) */
  .cp2-prog-hd {
    display: flex; justify-content: space-between;
    font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 6px;
  }
  .cp2-prog-track {
    height: 6px; background: #f1f5f9; border-radius: 6px; overflow: hidden;
    margin-bottom: 14px;
  }
  .cp2-prog-bar {
    height: 100%; border-radius: 6px;
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 55%, #06b6d4 100%);
    transition: width 1.2s cubic-bezier(.22,1,.36,1);
  }
  .cp2-prog-bar.low { background: linear-gradient(90deg, #f97316 0%, #ef4444 100%); }
  .cp2-prog-bar.inactive { background: #e2e8f0; }

  /* Action buttons */
  .cp2-actions { display: flex; gap: 9px; margin-top: auto; }
  .cp2-btn {
    flex: 1; padding: 8px 0; border-radius: 40px;
    font-size: 12px; font-weight: 600; text-align: center;
    cursor: pointer; border: 1.5px solid transparent;
    transition: transform .2s ease, background .2s ease, box-shadow .2s ease;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .cp2-btn:hover { transform: translateY(-2px); }
  .cp2-btn:active { transform: translateY(0) scale(0.98); }
  .cp2-btn-toggle {
    background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe;
  }
  .cp2-btn-toggle:hover {
    background: #ede9fe;
    box-shadow: 0 4px 12px rgba(109,40,217,0.15);
  }
  .cp2-btn-delete {
    background: #fef2f2; color: #dc2626; border-color: #fecaca;
  }
  .cp2-btn-delete:hover {
    background: #fee2e2;
    box-shadow: 0 4px 12px rgba(220,38,38,0.13);
  }

  /* ── Empty state ── */
  .cp2-empty {
    grid-column: 1 / -1;
    text-align: center; padding: 3.5rem 1.5rem;
    background: #fff; border-radius: 24px;
    border: 1.5px solid rgba(99,102,241,0.09);
    color: #94a3b8; font-size: 14px; font-weight: 500;
  }
  .cp2-empty-icon {
    font-size: 40px; margin-bottom: 10px; opacity: .5; display: block;
  }

  /* ── Loading ── */
  .cp2-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 340px; gap: 14px; color: #94a3b8;
  }
  .cp2-spin {
    width: 34px; height: 34px;
    border: 3px solid #e0e7ff; border-top-color: #6366f1;
    border-radius: 50%; animation: cp2-spin .7s linear infinite;
  }

  /* ── Keyframes ── */
  @keyframes cp2-spin { to { transform: rotate(360deg); } }
  @keyframes cp2-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .cp2-up { animation: cp2-up .52s cubic-bezier(.22,1,.36,1) both; }
  .cp2-d1 { animation-delay: .04s; }
  .cp2-d2 { animation-delay: .11s; }
  .cp2-d3 { animation-delay: .18s; }
  .cp2-d4 { animation-delay: .25s; }
  .cp2-d5 { animation-delay: .32s; }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .cp2 { padding: 1.2rem 1rem 2.5rem; }
    .cp2-metrics { grid-template-columns: 1fr 1fr; }
    .cp2-metric-num { font-size: 28px; }
    .cp2-metric { padding: 1rem; }
    .cp2-co-name { font-size: 18px; }
    .cp2-grid { grid-template-columns: 1fr; }
    .cp2-card-top { flex-direction: column; align-items: center; text-align: center; }
    .cp2-img-wrap { width: 100px; height: 100px; }
    .cp2-name { white-space: normal; }
    .cp2-price-row { justify-content: center; }
    .cp2-filter-wrap { display: none; }
  }
  @media (min-width: 481px) and (max-width: 768px) {
    .cp2 { padding: 1.6rem 1.25rem 2.5rem; }
    .cp2-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 769px) {
    .cp2 { padding: 2.2rem 2.5rem 3.5rem; }
  }
`;

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */
function todayStr() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function stockPercent(product) {
  const max = product.max_stock || product.stock || 100;
  const cur = product.stock || 0;
  return Math.min(100, Math.max(0, (cur / max) * 100));
}

const WAVE_ACTIVE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 44' preserveAspectRatio='none'%3E%3Cpath d='M0,22 C66,44 133,4 200,22 C267,40 334,6 400,22 L400,44 L0,44 Z' fill='%23faf9ff'/%3E%3C/svg%3E`;
const WAVE_INACTIVE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 44' preserveAspectRatio='none'%3E%3Cpath d='M0,22 C66,44 133,4 200,22 C267,40 334,6 400,22 L400,44 L0,44 Z' fill='%23f8fafc'/%3E%3C/svg%3E`;

/* ─────────────────────────────────────────────────────────────────
   Metric config (matches dashboard METRICS pattern)
───────────────────────────────────────────────────────────────── */
function buildMetrics(products) {
  const active = products.filter(p => p.is_active).length;
  const inactive = products.length - active;
  const avgPrice = products.length
    ? Math.round(products.reduce((s, p) => s + Number(p.price || 0), 0) / products.length)
    : 0;

  return [
    {
      label: "Total products", hint: "In catalogue",
      val: products.length, color: "#2563eb", iconBg: "#eff6ff", orb: "#3b82f6",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      ),
    },
    {
      label: "Active products", hint: "Available now",
      val: active, color: "#059669", iconBg: "#ecfdf5", orb: "#10b981",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
      ),
    },
    {
      label: "Inactive products", hint: "Paused or removed",
      val: inactive, color: "#ea580c", iconBg: "#fff7ed", orb: "#f97316",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      ),
    },
    {
      label: "Avg. price", hint: "Across all products",
      val: `ر.ق${avgPrice.toLocaleString()}`, color: "#7c3aed", iconBg: "#faf5ff", orb: "#7c3aed",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
  ];
}

/* ─────────────────────────────────────────────────────────────────
   ProductCard — mirrors FlyerCard pattern exactly
───────────────────────────────────────────────────────────────── */
function ProductCard({ product, delay, onToggle, onDelete }) {
  const [barW, setBarW] = useState(0);
  const pct = stockPercent(product);
  const isActive = product.is_active;

  useEffect(() => {
    const t = setTimeout(() => setBarW(pct), 350 + delay * 90);
    return () => clearTimeout(t);
  }, [pct, delay]);

  const barClass = `cp2-prog-bar${!isActive ? " inactive" : pct < 25 ? " low" : ""}`;

  return (
    <div
      className="cp2-card cp2-up"
      style={{ animationDelay: `${0.32 + delay * 0.07}s` }}
    >
      <div className="cp2-body">
        {/* Image + info row */}
        <div className="cp2-card-top">
          <div className="cp2-img-wrap">
            <img
              src={product.image ? getImageUrl(product.image) : "https://placehold.co/200x200?text=No+Image"}
              alt={product.name}
              loading="lazy"
              onError={e => { e.target.src = "https://placehold.co/200x200?text=No+Image"; }}
            />
          </div>
          <div className="cp2-info">
            <div className="cp2-name" title={product.name}>{product.name}</div>
            <div className="cp2-price-row">
              <span className="cp2-price">ر.ق{Number(product.price).toLocaleString()}</span>
              <span className={`cp2-pill ${isActive ? "cp2-pill-active" : "cp2-pill-inactive"}`}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="cp2-desc">{product.description}</div>
        )}

        {/* Stock progress bar — only if stock data exists */}
        {product.stock !== undefined && (
          <>
            <div className="cp2-prog-hd">
              <span>Stock level</span>
              <span style={{ color: isActive ? "#7c3aed" : "#94a3b8" }}>
                {product.stock || 0} units
              </span>
            </div>
            <div className="cp2-prog-track">
              <div className={barClass} style={{ width: `${barW}%` }} />
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="cp2-actions">
          <button className="cp2-btn cp2-btn-toggle" onClick={() => onToggle(product.id)}>
            {isActive ? "Deactivate" : "Activate"}
          </button>
          <button className="cp2-btn cp2-btn-delete" onClick={() => onDelete(product.id)}>
            Delete
          </button>
        </div>
      </div>

      {/* Decorative wave identical to FlyerCard */}
      <img
        className="cp2-wave"
        src={isActive ? WAVE_ACTIVE : WAVE_INACTIVE}
        alt=""
        aria-hidden="true"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────── */
const FILTERS = ["All", "Active", "Inactive"];

export default function CompanyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("All");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getCompanyProducts();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    load();
  };

  const handleToggle = async (id) => {
    await toggleProduct(id);
    load();
  };

  const metrics  = buildMetrics(products);

  const filtered = products.filter(p => {
    if (filter === "Active")   return p.is_active;
    if (filter === "Inactive") return !p.is_active;
    return true;
  });

  return (
    <CompanyLayout>
      <style>{STYLES}</style>

      <div className="cp2">
        {/* Fixed gradient hero */}
        <div className="cp2-hero" aria-hidden="true" />

        <div className="cp2-inner">

          {loading ? (
            <div className="cp2-loading" role="status" aria-live="polite">
              <div className="cp2-spin" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Loading products…</span>
            </div>
          ) : (
            <>
              {/* ── Top bar ── */}
              <div className="cp2-topbar cp2-up cp2-d1">
                <div className="cp2-brand">
                  <div className="cp2-avatar" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                      stroke="rgba(255,255,255,0.9)" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                      <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                      <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="cp2-co-name">Product Catalog</div>
                    <div className="cp2-co-sub">Manage your inventory</div>
                  </div>
                </div>
                <div className="cp2-date-pill">{todayStr()}</div>
              </div>

              {/* ── Metric cards ── */}
              <div className="cp2-metrics cp2-up cp2-d2">
                {metrics.map(m => (
                  <div className="cp2-metric" key={m.label}>
                    <div className="cp2-metric-orb" style={{ background: m.orb }} />
                    <div className="cp2-metric-icon" style={{ background: m.iconBg }}>
                      {m.icon}
                    </div>
                    <div className="cp2-metric-lbl">{m.label}</div>
                    <div className="cp2-metric-num" style={{ color: m.color }}>{m.val}</div>
                    <div className="cp2-metric-hint">{m.hint}</div>
                  </div>
                ))}
              </div>

              {/* ── Section header + filters ── */}
              <div className="cp2-up cp2-d4">
                <div className="cp2-sec-hd">
                  <div className="cp2-sec-left">
                    <span className="cp2-sec-title">All products</span>
                    <span className="cp2-sec-badge">{filtered.length} shown</span>
                  </div>
                  <div className="cp2-filter-wrap">
                    {FILTERS.map(f => (
                      <button
                        key={f}
                        className={`cp2-filter-btn${filter === f ? " active" : ""}`}
                        onClick={() => setFilter(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Grid ── */}
              <div className="cp2-up cp2-d5">
                {filtered.length === 0 ? (
                  <div className="cp2-empty">
                    <span className="cp2-empty-icon">📭</span>
                    {products.length === 0
                      ? "No products found. Start by adding your first product."
                      : `No ${filter.toLowerCase()} products.`}
                  </div>
                ) : (
                  <div className="cp2-grid">
                    {filtered.map((p, i) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        delay={i}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </CompanyLayout>
  );
}