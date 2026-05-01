import { useEffect, useState, useCallback, useMemo, useRef, memo, lazy, Suspense } from "react";
import { fetchMyInterests } from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";

// ─── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  ink:       "#0a0f1e",
  navy:      "#0d1b3e",
  blue:      "#1a56db",
  blueMid:   "#2563eb",
  blueLight: "#dbeafe",
  blueGhost: "#eff6ff",
  slate:     "#64748b",
  muted:     "#94a3b8",
  border:    "#e2eaf6",
  white:     "#ffffff",
  amber:     "#f59e0b",
  emerald:   "#10b981",
  rose:      "#f43f5e",
  font:      "'DM Sans', sans-serif",
  display:   "'Playfair Display', serif",
};

// ─── Inline CSS ─────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

@keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
@keyframes shimmer  { 0%   { background-position:-700px 0; } 100% { background-position:700px 0; } }
@keyframes floatY   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-12px); } }
@keyframes wave     { to   { transform:translateX(-50%); } }
@keyframes pulse    { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(1.4); } }
@keyframes spin     { to   { transform:rotate(360deg); } }
@keyframes slideIn  { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:none; } }
@keyframes revealCard {
  from { opacity:0; transform:translateY(28px) scale(0.98); }
  to   { opacity:1; transform:none; }
}

/* Skeleton shimmer */
.mi-skel {
  background: linear-gradient(90deg,#edf2fb 25%,#dce8f8 50%,#edf2fb 75%);
  background-size: 700px 100%;
  animation: shimmer 1.5s linear infinite;
  border-radius: 20px;
}

/* Card interactions */
.mi-card {
  transition: box-shadow .3s ease, transform .3s ease, border-color .3s ease;
}
.mi-card:hover {
  box-shadow: 0 20px 60px rgba(26,86,219,.13), 0 4px 16px rgba(26,86,219,.07) !important;
  transform: translateY(-5px) !important;
  border-color: rgba(37,99,235,.3) !important;
}
.mi-card:hover .mi-thumb img { transform: scale(1.07); }
.mi-card:hover .mi-card-index { opacity:1 !important; transform:scale(1) !important; }

/* Icon button */
.mi-icon-btn:hover { background: ${T.blue} !important; color:#fff !important; transform:translateY(-1px) !important; }
.mi-icon-btn:hover svg { stroke:#fff !important; }

/* Status pill hover */
.mi-stat-pill:hover { background:rgba(255,255,255,.2) !important; transform:translateY(-2px) !important; }

/* Sidebar info item */
.mi-tip-row:hover .mi-tip-dot { transform:scale(1.4); }

/* Scroll-reveal: cards animate when .mi-visible is added */
.mi-reveal { opacity:0; }
.mi-reveal.mi-visible { animation: revealCard .5s cubic-bezier(.22,1,.36,1) both; opacity:1; }

/* Responsive */
@media (max-width:900px) {
  .mi-layout  { grid-template-columns:1fr !important; }
  .mi-sidebar { display:none !important; }
  .mi-mobile-summary { display:flex !important; }
}
@media (max-width:620px) {
  .mi-card { grid-template-columns:5px 80px 1fr !important; min-height:auto !important; }
  .mi-card-right { display:none !important; }
  .mi-card-body  { padding:12px 14px !important; }
}
@media (max-width:380px) {
  .mi-hero-inner { padding:28px 16px 64px !important; }
  .mi-card { grid-template-columns:4px 64px 1fr !important; }
}
`;

// ─── Style injector (idempotent) ────────────────────────────────────────────────
function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("mi-css")) return;
    const el = document.createElement("style");
    el.id = "mi-css";
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => { /* leave styles in DOM — safe for SPA */ };
  }, []);
  return null;
}

// ─── SVG icon library (tree-shakeable, no external dep) ─────────────────────────
const Icon = memo(({ name, size = 16, stroke = T.slate, style = {} }) => {
  const paths = {
    mapPin:    <><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></>,
    calendar:  <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    tag:       <><path d="M20 7l-8-5-9 5v10l9 5 8-5V7z"/><path d="M12 2v20M3 7l9 5 8-5"/></>,
    package:   <><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></>,
    clipBoard: <><path d="M8 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2h-2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></>,
    info:      <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
    arrowRight:<path d="M5 12h14M12 5l7 7-7 7"/>,
    layers:    <><path d="M2 12l10 6 10-6M2 17l10 6 10-6"/><path d="M12 2L2 7l10 5 10-5-10-5z"/></>,
    eye:       <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    star:      <path d="M12 2l3 6.3 6.8.9-5 4.7 1.2 6.8L12 17.3 5 20.7l1.2-6.8-5-4.7 6.8-.9z"/>,
    clock:     <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    check:     <path d="M20 6L9 17l-5-5"/>,
    x:         <path d="M18 6L6 18M6 6l12 12"/>,
    dash:      <path d="M5 12h14"/>,
    grid:      <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  };
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {paths[name] || null}
    </svg>
  );
});
Icon.displayName = "Icon";

// ─── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_META = {
  pending:  { label: "Pending",  bg: "#fffbeb", border: "#fde68a", color: "#78350f", dot: T.amber,   icon: "clock" },
  accepted: { label: "Accepted", bg: "#ecfdf5", border: "#6ee7b7", color: "#064e3b", dot: T.emerald, icon: "check" },
  rejected: { label: "Rejected", bg: "#fff1f2", border: "#fecdd3", color: "#881337", dot: T.rose,    icon: "x"     },
};

const formatINR  = (v) => Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const formatDate = (iso) => iso
  ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  : "";
const daysAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  if (diff < 30)  return `${diff} days ago`;
  if (diff < 60)  return "1 month ago";
  const months = Math.floor(diff / 30);
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
};
const countBy    = (arr, status) => (Array.isArray(arr) ? arr : []).filter(i => i?.status === status).length;

// ─── Scroll-reveal hook ─────────────────────────────────────────────────────────
function useReveal(rootMargin = "0px 0px -60px 0px") {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("mi-visible"); obs.disconnect(); } },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return ref;
}

// ─── Lazy image with placeholder ────────────────────────────────────────────────
const LazyImage = memo(({ src, alt, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);
  return (
    <>
      {!loaded && !error && <div className="mi-skel" style={{ position: "absolute", inset: 0, borderRadius: 0 }} />}
      {!error && src
        ? <img src={src} alt={alt} loading="lazy" decoding="async"
            onLoad={() => setLoaded(true)} onError={() => setError(true)}
            style={{ ...style, opacity: loaded ? 1 : 0, transition: "opacity .4s" }}
          />
        : <FallbackThumb />
      }
    </>
  );
});
LazyImage.displayName = "LazyImage";

function FallbackThumb() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(135deg, ${T.blueGhost}, ${T.blueLight})`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon name="package" size={28} stroke={T.blueMid} style={{ opacity: .5 }} />
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────────
const StatusBadge = memo(({ status }) => {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: m.bg, border: `1.5px solid ${m.border}`,
      color: m.color, borderRadius: 40, padding: "4px 11px",
      fontFamily: T.font, fontSize: 10.5, fontWeight: 700,
      letterSpacing: ".07em", textTransform: "uppercase",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: m.dot, flexShrink: 0,
        animation: status === "pending" ? "pulse 1.8s infinite" : undefined,
      }} />
      {m.label}
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

// ─── Ad slot ────────────────────────────────────────────────────────────────────
const AdSlot = memo(({ height = 90, label = "728 × 90" }) => (
  <div style={{
    width: "100%", height,
    background: "repeating-linear-gradient(45deg,#f8fafc,#f8fafc 10px,#f1f5fd 10px,#f1f5fd 20px)",
    border: "1.5px dashed #cbd5e1", borderRadius: 16,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 4,
  }}>
    <span style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", letterSpacing: "1.2px", fontFamily: T.font, textTransform: "uppercase" }}>
      Advertisement
    </span>
    <span style={{ fontSize: 11, color: "#cbd5e1", fontFamily: T.font, fontWeight: 600 }}>{label}</span>
  </div>
));
AdSlot.displayName = "AdSlot";

// ─── Skeleton loader ────────────────────────────────────────────────────────────
function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="mi-skel" style={{ height: 140, animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      textAlign: "center", padding: "clamp(56px,10vw,96px) 24px",
      animation: "fadeUp .45s ease both",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: T.blueGhost, border: `1.5px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px", animation: "floatY 4s ease-in-out infinite",
      }}>
        <Icon name="clipBoard" size={30} stroke={T.blueMid} />
      </div>
      <h3 style={{ fontFamily: T.display, fontSize: "clamp(18px,4vw,22px)", fontWeight: 700, color: T.ink, marginBottom: 8 }}>
        No requests yet
      </h3>
      <p style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.65, fontFamily: T.font }}>
        When you express interest in a listing,<br />it will appear here.
      </p>
    </div>
  );
}

// ─── Interest card (lazy reveal) ─────────────────────────────────────────────────
const InterestCard = memo(({ item, index }) => {
  const status = (item.status || "pending").toLowerCase();
  const revRef = useReveal();

  const accentGrad = {
    pending:  "linear-gradient(180deg,#fde68a,#f59e0b)",
    accepted: "linear-gradient(180deg,#6ee7b7,#10b981)",
    rejected: "linear-gradient(180deg,#fca5a5,#f43f5e)",
  }[status] || "linear-gradient(180deg,#93c5fd,#1a56db)";

  return (
    <article
      ref={revRef}
      className="mi-card mi-reveal"
      style={{
        background: T.white,
        borderRadius: 20,
        boxShadow: "0 2px 20px rgba(10,15,30,.06), 0 1px 4px rgba(10,15,30,.03)",
        border: `1.5px solid ${T.border}`,
        display: "grid",
        gridTemplateColumns: "5px 118px 1fr auto",
        alignItems: "stretch",
        overflow: "hidden",
        minHeight: 138,
        animationDelay: `${Math.min(index * 55, 400)}ms`,
        willChange: "transform, opacity",
      }}
    >
      {/* Accent bar */}
      <div style={{ background: accentGrad, flexShrink: 0 }} />

      {/* Thumbnail */}
      <div style={{ position: "relative", overflow: "hidden", background: T.blueGhost, flexShrink: 0 }}>
        <LazyImage src={item.image} alt={item.title || "Product"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        {/* Index badge */}
        <div className="mi-card-index" style={{
          position: "absolute", top: 8, left: 8,
          width: 22, height: 22,
          background: "rgba(10,15,30,.55)", backdropFilter: "blur(6px)",
          borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 0, transform: "scale(.8)",
          transition: "opacity .2s, transform .2s",
        }}>
          <span style={{ fontFamily: T.font, fontSize: 10, fontWeight: 700, color: "#fff" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        {/* Category chip */}
        {item.category && (
          <span style={{
            position: "absolute", bottom: 7, left: 7,
            background: "rgba(10,15,30,.65)", backdropFilter: "blur(8px)",
            color: "#fff", fontSize: 8.5, fontWeight: 700, letterSpacing: ".09em",
            textTransform: "uppercase", borderRadius: 5, padding: "3px 7px",
            fontFamily: T.font,
          }}>
            {item.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="mi-card-body" style={{
        padding: "14px 18px", display: "flex", flexDirection: "column",
        justifyContent: "space-between", gap: 8, minWidth: 0,
      }}>
        <div>
          <h3 style={{
            fontFamily: T.display, fontSize: "clamp(13px,2vw,15px)",
            fontWeight: 700, color: T.ink, letterSpacing: "-.02em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            marginBottom: 5,
          }}>
            {item.title}
          </h3>

          <p style={{
            fontFamily: T.font, fontSize: "clamp(17px,2.5vw,20px)",
            fontWeight: 700, color: T.blue, letterSpacing: "-.03em", lineHeight: 1,
            marginBottom: 10,
          }}>
            ر.ق{formatINR(item.price)}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
            {item.city && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 600, color: "#374a6b",
                background: T.blueGhost, border: `1px solid ${T.blueLight}`,
                borderRadius: 40, padding: "3px 9px", fontFamily: T.font,
              }}>
                <Icon name="mapPin" size={10} stroke="#374a6b" />
                {item.city}
              </span>
            )}
            {item.created_at && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: T.muted, fontFamily: T.font }}>
                <Icon name="calendar" size={10} stroke={T.muted} />
                {formatDate(item.created_at)}
              </span>
            )}
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      {/* Right column — date + day count */}
      <div className="mi-card-right" style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "14px 18px", gap: 5,
        borderLeft: `1px solid ${T.border}`,
        minWidth: 96,
        background: T.blueGhost,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: T.white, border: `1px solid ${T.blueLight}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 4,
          boxShadow: "0 1px 4px rgba(26,86,219,.08)",
        }}>
          <Icon name="calendar" size={14} stroke={T.blue} />
        </div>
        <span style={{
          fontFamily: T.font, fontSize: 10.5, fontWeight: 700,
          color: T.ink, textAlign: "center", lineHeight: 1.3,
          whiteSpace: "nowrap",
        }}>
          {item.created_at ? formatDate(item.created_at) : "—"}
        </span>
        {item.created_at && (
          <span style={{
            fontFamily: T.font, fontSize: 9.5, fontWeight: 600,
            color: T.muted, background: T.white,
            border: `1px solid ${T.border}`,
            borderRadius: 40, padding: "2px 8px",
            whiteSpace: "nowrap", marginTop: 2,
          }}>
            {daysAgo(item.created_at)}
          </span>
        )}
      </div>
    </article>
  );
});
InterestCard.displayName = "InterestCard";

// ─── Summary card (sidebar) ──────────────────────────────────────────────────────
const SummaryCard = memo(({ items }) => {
  const pending  = countBy(items, "pending");
  const accepted = countBy(items, "accepted");
  const rejected = countBy(items, "rejected");
  const total    = items.length || 1;
  const pct      = (n) => Math.round((n / total) * 100);

  const rows = [
    { label: "Pending",  val: pending,  dot: T.amber,   pct: pct(pending)  },
    { label: "Accepted", val: accepted, dot: T.emerald, pct: pct(accepted) },
    { label: "Rejected", val: rejected, dot: T.rose,    pct: pct(rejected) },
  ];

  return (
    <div style={S.infoCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: T.blueGhost, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="layers" size={15} stroke={T.blue} />
        </div>
        <div>
          <p style={{ fontFamily: T.font, fontSize: 12.5, fontWeight: 700, color: T.ink }}>Request Overview</p>
          <p style={{ fontFamily: T.font, fontSize: 11, color: T.muted, fontWeight: 500 }}>{items.length} total</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map(row => (
          <div key={row.label}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: T.font, fontSize: 12, color: T.slate, fontWeight: 500 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: row.dot, flexShrink: 0 }} />
                {row.label}
              </span>
              <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 800, color: T.ink }}>{row.val}</span>
            </div>
            <div style={{ height: 4, background: "#edf2fb", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99, background: row.dot,
                width: `${row.pct}%`, transition: "width .9s cubic-bezier(.22,1,.36,1)",
                opacity: .85,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
SummaryCard.displayName = "SummaryCard";

// ─── Status tips card ────────────────────────────────────────────────────────────
const TipsCard = memo(() => {
  const tips = [
    { icon: "clock", color: T.amber,   text: "Pending means the seller hasn't reviewed your request yet." },
    { icon: "check", color: T.emerald, text: "Accepted means the seller is ready to proceed with you."   },
    { icon: "x",     color: T.rose,    text: "Rejected means the item is unavailable or was declined."    },
  ];
  return (
    <div style={S.infoCard}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: T.blueGhost, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="info" size={15} stroke={T.blue} />
        </div>
        <p style={{ fontFamily: T.font, fontSize: 12.5, fontWeight: 700, color: T.ink }}>Status Guide</p>
      </div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {tips.map((t, i) => (
          <li key={i} className="mi-tip-row" style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
            <span style={{
              width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
              background: `${t.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={t.icon} size={11} stroke={t.color} />
            </span>
            <span style={{ fontFamily: T.font, fontSize: 12, color: T.slate, lineHeight: 1.6 }}>{t.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
TipsCard.displayName = "TipsCard";

// ─── Mobile summary strip ────────────────────────────────────────────────────────
const MobileSummary = memo(({ pending, accepted, rejected, total }) => (
  <div className="mi-mobile-summary" style={{
    display: "none",
    background: T.white, borderRadius: 16,
    border: `1.5px solid ${T.border}`,
    padding: "12px 16px",
    marginBottom: 16,
    boxShadow: "0 2px 12px rgba(10,15,30,.05)",
    flexWrap: "wrap", gap: 8,
    justifyContent: "space-between",
    animation: "fadeUp .4s ease both",
  }}>
    {[
      { label: "Total",    val: total,    dot: T.blue    },
      { label: "Pending",  val: pending,  dot: T.amber   },
      { label: "Accepted", val: accepted, dot: T.emerald },
      { label: "Rejected", val: rejected, dot: T.rose    },
    ].map(({ label, val, dot }) => (
      <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <span style={{ fontFamily: T.font, fontSize: 18, fontWeight: 800, color: T.ink }}>{val}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: T.font, fontSize: 10.5, color: T.muted, fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
          {label}
        </span>
      </div>
    ))}
  </div>
));
MobileSummary.displayName = "MobileSummary";

// ─── Main component ──────────────────────────────────────────────────────────────
export default function MarketplaceInterests() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchMyInterests();
      setItems(res.data?.data ?? res.data ?? []);
    } catch (err) {
      console.error("[MarketplaceInterests] fetch failed:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending  = useMemo(() => countBy(items, "pending"),  [items]);
  const accepted = useMemo(() => countBy(items, "accepted"), [items]);
  const rejected = useMemo(() => countBy(items, "rejected"), [items]);

  // Interleave inline ads every 4 cards
  const cardList = useMemo(() => {
    const out = [];
    items.forEach((item, i) => {
      out.push(<InterestCard key={item.id ?? i} item={item} index={i} />);
      if ((i + 1) % 4 === 0 && i + 1 < items.length) {
        out.push(<AdSlot key={`ad-${i}`} height={80} label="728 × 90 · Leaderboard" />);
      }
    });
    return out;
  }, [items]);

  const hasItems = items.length > 0;

  return (
    <MarketplaceLayout>
      <InjectStyles />

      <div style={{ minHeight: "100vh", background: "#f4f7fd", fontFamily: T.font }}>

        {/* ── Hero ── */}
        <header style={S.hero}>
          <div style={S.heroDots} aria-hidden="true" />
          {/* Orbs */}
          {[[300,300,-110,-80,"0s"],[160,160,10,-30,"2.2s"],[100,100,40,"38%","4.5s"]].map(([w,h,top,right,delay],i) => (
            <div key={i} aria-hidden="true" style={{
              position:"absolute", width:w, height:h, top, right,
              borderRadius:"50%", background:"rgba(255,255,255,.05)",
              animation:`floatY 8s ease-in-out infinite`, animationDelay:delay, pointerEvents:"none",
            }} />
          ))}
          {/* Wave */}
          <svg style={S.heroWave} viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
            <path style={{ animation:"wave 12s linear infinite" }}
              d="M0,30 C240,56 480,4 720,30 C960,56 1200,4 1440,30 C1680,56 1920,4 2160,30 L2160,60 L0,60 Z"
              fill="#eef4ff" />
            <path style={{ animation:"wave 18s linear infinite reverse" }}
              d="M0,42 C300,18 600,56 900,38 C1200,20 1500,52 1800,36 L2160,36 L2160,60 L0,60 Z"
              fill="#dce9ff" opacity=".6" />
          </svg>

          <div className="mi-hero-inner" style={S.heroInner}>
            {/* Eyebrow */}
            <div style={S.heroLabel}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80", animation:"pulse 1.8s infinite", flexShrink:0 }} />
              My Dashboard
            </div>

            {/* Title */}
            <h1 style={S.heroTitle}>
              My{" "}
              <span style={{ background:"linear-gradient(90deg,#93c5fd,#6ee7b7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
                Interests
              </span>
            </h1>

            <p style={S.heroSub}>
              Track every product request and monitor its status in real time.
            </p>

            {/* Stat pills */}
            {!loading && hasItems && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:22, animation:"fadeUp .45s ease both", animationDelay:".22s" }}>
                {[
                  { dot:"#f59e0b", num:pending,       label:"Pending"  },
                  { dot:"#10b981", num:accepted,      label:"Accepted" },
                  { dot:"#f43f5e", num:rejected,      label:"Rejected" },
                  { dot:"#93c5fd", num:items.length,  label:"Total"    },
                ].map(({ dot, num, label }) => (
                  <div key={label} className="mi-stat-pill" style={S.statPill}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:dot, flexShrink:0 }} />
                    <span style={{ fontWeight:800, fontSize:15 }}>{num}</span>
                    <span style={{ fontWeight:600, fontSize:12 }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* ── Body ── */}
        <main style={S.body}>

          {/* Top leaderboard ad */}
          <div style={{ marginBottom: 22 }}>
            <AdSlot height={88} label="728 × 90 · Leaderboard" />
          </div>

          {/* Mobile summary strip */}
          {!loading && hasItems && (
            <MobileSummary
              pending={pending} accepted={accepted}
              rejected={rejected} total={items.length}
            />
          )}

          {/* Two-column layout */}
          <div className="mi-layout" style={S.layout}>

            {/* Card list */}
            <section aria-label="Interest listings" style={{ flex:1, minWidth:0 }}>
              {/* Mobile sidebar ad (shows on <900px) */}
              <div className="mi-sidebar" style={{ display:"none", marginBottom:14 }}>
                <AdSlot height={200} label="300 × 250 · Rectangle" />
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {loading ? <SkeletonList /> : !hasItems ? <EmptyState /> : cardList}
              </div>
            </section>

            {/* Sidebar (desktop only) */}
            <aside className="mi-sidebar" style={S.sidebar} aria-label="Summary sidebar">
              {!loading && hasItems && <SummaryCard items={items} />}
              <TipsCard />
              <AdSlot height={250} label="300 × 250 · Rectangle" />
              <AdSlot height={250} label="300 × 250 · Rectangle" />
            </aside>

          </div>
        </main>

      </div>
    </MarketplaceLayout>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────────
const S = {
  hero: {
    position: "relative",
    background: "linear-gradient(135deg,#0a1628 0%,#0d2151 45%,#1565c0 100%)",
    overflow: "hidden",
  },
  heroDots: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "radial-gradient(rgba(255,255,255,.07) 1px,transparent 1px)",
    backgroundSize: "26px 26px",
  },
  heroWave: {
    position: "absolute", bottom: 0, left: 0,
    width: "200%", height: 60, zIndex: 1, pointerEvents: "none",
  },
  heroInner: {
    position: "relative", zIndex: 2,
    padding: "38px 32px 76px",
    maxWidth: 1100, margin: "0 auto",
  },
  heroLabel: {
    display: "inline-flex", alignItems: "center", gap: 7,
    background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.22)",
    borderRadius: 40, padding: "5px 14px",
    fontSize: 11.5, fontWeight: 700, color: "#bfdbfe",
    fontFamily: T.font, marginBottom: 14,
    backdropFilter: "blur(10px)",
    animation: "fadeIn .4s ease both",
  },
  heroTitle: {
    fontFamily: T.display,
    fontSize: "clamp(28px,4.5vw,46px)",
    fontWeight: 900, color: "#fff",
    letterSpacing: "-.5px", lineHeight: 1.12,
    marginBottom: 8,
    animation: "fadeUp .45s ease both",
    animationDelay: ".06s",
  },
  heroSub: {
    fontSize: 14, color: "rgba(255,255,255,.65)",
    fontFamily: T.font, fontWeight: 400, lineHeight: 1.6,
    animation: "fadeUp .45s ease both", animationDelay: ".14s",
  },
  statPill: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(255,255,255,.12)", backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: 40, padding: "7px 16px",
    color: "#fff", fontFamily: T.font, fontSize: 12, fontWeight: 600,
    cursor: "default", transition: "background .2s, transform .2s",
  },
  body: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "clamp(16px,3vw,32px) clamp(12px,3vw,28px)",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 270px",
    gap: 22,
    alignItems: "start",
  },
  sidebar: {
    display: "flex", flexDirection: "column", gap: 14,
    position: "sticky", top: 80,
    animation: "fadeUp .45s ease both", animationDelay: ".18s",
  },
  infoCard: {
    background: T.white,
    borderRadius: 18,
    border: `1px solid ${T.border}`,
    padding: "16px 18px",
    boxShadow: "0 2px 16px rgba(10,15,30,.06)",
  },
};