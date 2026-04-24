import { useEffect, useState } from "react";
import { fetchMyInterests } from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";

// ─── Design tokens (mirrored from MarketplaceProfile) ──────────────────────────
const BLUE   = "#1565c0";
const BLUELT = "#e3f2fd";
const FONT   = "'Plus Jakarta Sans', sans-serif";
const FONT_D = "'Fraunces', serif";

// ─── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  /* ── Animations (same keyframe names as Profile) ── */
  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;} }
  @keyframes fadeIn    { from{opacity:0;}to{opacity:1;} }
  @keyframes shimmer   { 0%{background-position:-600px 0;}100%{background-position:600px 0;} }
  @keyframes floatOrb  { 0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);} }
  @keyframes waveSlide { to{transform:translateX(-50%);} }
  @keyframes pulse     { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(1.35);} }
  @keyframes slideOut  {
    from{opacity:1;transform:scaleY(1);max-height:180px;}
    to{opacity:0;transform:scaleY(0.4) translateX(30px);max-height:0;padding:0;margin:0;}
  }

  /* ── Skeleton (Profile's 90-deg shimmer) ── */
  .mpi-skel {
    background: linear-gradient(90deg,#f0f4f8 25%,#e2ecf7 50%,#f0f4f8 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s linear infinite;
    border-radius: 22px;
  }

  /* ── Card hover ── */
  .mpi-card:hover {
    box-shadow: 0 16px 48px rgba(21,101,192,0.16), 0 2px 8px rgba(21,101,192,0.07) !important;
    transform: translateY(-4px) !important;
    border-color: rgba(21,101,192,0.25) !important;
  }
  .mpi-card:hover .mpi-img img { transform: scale(1.09); }

  /* ── Action button ── */
  .mpi-action-btn:hover {
    background: ${BLUE} !important;
    color: #fff !important;
    transform: translateY(-1px) !important;
  }

  /* ── Stat pill hover ── */
  .mpi-stat:hover {
    background: rgba(255,255,255,0.22) !important;
    transform: translateY(-2px) !important;
  }

  /* ── Responsive ── */
  @media(max-width:900px){
    .mpi-layout { grid-template-columns: 1fr !important; }
    .mpi-sidebar { display: none !important; }
    .mpi-sidebar-mobile { display: block !important; }
  }
  @media(max-width:560px){
    .mpi-card {
      grid-template-columns: 5px 76px 1fr !important;
      grid-template-rows: 1fr auto !important;
    }
    .mpi-card-actions {
      grid-column: 2 / -1 !important;
      border-top: 1px solid #e0ecfb !important;
      border-left: none !important;
      padding: 10px 14px !important;
      justify-content: flex-start !important;
      flex-direction: row !important;
    }
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("mpi-global-css")) return;
    const el = document.createElement("style");
    el.id = "mpi-global-css";
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);
  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_LABELS = { pending: "Pending", accepted: "Accepted", rejected: "Rejected" };

function formatINR(val) {
  return Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function countByStatus(items, status) {
  return (Array.isArray(items) ? items : []).filter(i => i?.status === status).length;
}

// ─── Ad Slot (matches Profile's AdSlot) ────────────────────────────────────────
function AdSlot({ variant = "leaderboard" }) {
  const dims = variant === "leaderboard"
    ? { h: 90, label: "728 × 90 — Leaderboard Ad" }
    : { h: 250, label: "300 × 250 — Medium Rectangle Ad" };

  return (
    <div style={{
      width: "100%", height: dims.h,
      background: "repeating-linear-gradient(45deg,#f8fafc,#f8fafc 10px,#eef3fa 10px,#eef3fa 20px)",
      border: "1.5px dashed #cbd5e1",
      borderRadius: 14,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 5,
    }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", fontFamily: FONT, textTransform: "uppercase" }}>
        Advertisement
      </span>
      <span style={{ fontSize: 12, color: "#cbd5e1", fontFamily: FONT, fontWeight: 600 }}>
        {dims.label}
      </span>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="mpi-skel"
          style={{ height: 130, animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:  { bg: "#fffbeb", border: "#fde68a", color: "#78350f", dot: "#f59e0b" },
  accepted: { bg: "#f0fdf4", border: "#86efac", color: "#14532d", dot: "#16a34a" },
  rejected: { bg: "#fff1f2", border: "#fecdd3", color: "#881337", dot: "#e11d48" },
};

function StatusBadge({ status }) {
  const st = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: st.bg, border: `1.5px solid ${st.border}`,
      color: st.color,
      borderRadius: 40, padding: "5px 12px",
      fontFamily: FONT, fontSize: 11, fontWeight: 700,
      letterSpacing: ".06em", textTransform: "uppercase",
      width: "fit-content",
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: st.dot, flexShrink: 0,
        animation: status === "pending" ? "pulse 1.6s infinite" : undefined,
      }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── Interest Card ─────────────────────────────────────────────────────────────
function InterestCard({ item, delay = 0 }) {
  const status = (item.status || "pending").toLowerCase();
  const barColors = {
    pending:  "linear-gradient(180deg,#fbbf24,#f59e0b)",
    accepted: "linear-gradient(180deg,#4ade80,#16a34a)",
    rejected: "linear-gradient(180deg,#fb7185,#e11d48)",
  };

  return (
    <div
      className="mpi-card"
      style={{
        ...s.card,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Left accent bar */}
      <div style={{ width: 6, background: barColors[status] || barColors.pending, borderRadius: "6px 0 0 6px", flexShrink: 0 }} />

      {/* Image */}
      <div style={s.cardImg}>
        {item.image
          ? <img src={item.image} alt={item.title} loading="lazy" style={s.cardImgEl} />
          : (
            <div style={s.cardImgFallback}>
              <span style={{ fontSize: 32 }}>📦</span>
            </div>
          )
        }
        {item.category && (
          <span style={s.imgChip}>{item.category}</span>
        )}
      </div>

      {/* Body */}
      <div style={s.cardBody}>
        <div>
          <h3 style={s.cardTitle} title={item.title}>{item.title}</h3>
          <p style={s.cardPrice}> ر.ق{formatINR(item.price)}</p>
          <div style={s.cardMeta}>
            {item.city && (
              <span style={s.chip}>
                <span style={{ fontSize: 11 }}>📍</span> {item.city}
              </span>
            )}
            {item.created_at && (
              <span style={s.metaDate}>🗓 {formatDate(item.created_at)}</span>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Actions column */}
      <div style={s.cardActions} className="mpi-card-actions">
        <span style={s.actionTime}>
          {item.created_at ? formatDate(item.created_at) : "—"}
        </span>
        
      </div>
    </div>
  );
}

// ─── Summary Card (matches Profile's infoCard sidebar style) ──────────────────
function SummaryCard({ items }) {
  const pending  = countByStatus(items, "pending");
  const accepted = countByStatus(items, "accepted");
  const rejected = countByStatus(items, "rejected");
  const total    = items.length || 1;

  return (
    <div style={s.infoCard}>
      <div style={s.infoHead}>
        <div style={{ fontSize: 20 }}>📋</div>
        <span style={s.infoTitle}>Request Overview</span>
      </div>
      <p style={{ fontFamily: FONT, fontSize: 11.5, color: "#94a3b8", margin: "0 0 14px", fontWeight: 500 }}>
        {items.length} total request{items.length !== 1 ? "s" : ""}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { label: "Pending",  val: pending,  dot: "#f59e0b" },
          { label: "Accepted", val: accepted, dot: "#16a34a" },
          { label: "Rejected", val: rejected, dot: "#e11d48" },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#475569", fontFamily: FONT, fontWeight: 500 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: row.dot, flexShrink: 0 }} />
              {row.label}
            </div>
            <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>{row.val}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, background: "#e0ecfb", borderRadius: 99, overflow: "hidden", marginTop: 14 }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, #f59e0b, #16a34a, #e11d48)`,
          width: `${Math.min(100, ((pending + accepted) / total) * 100)}%`,
          transition: "width 0.8s cubic-bezier(.22,1,.36,1)",
        }} />
      </div>
    </div>
  );
}

// ─── Inline Ad (between cards) ─────────────────────────────────────────────────
function InlineAd({ id }) {
  return (
    <div id={id} style={{
      borderRadius: 14,
      background: "repeating-linear-gradient(45deg,#f8fafc,#f8fafc 10px,#eef3fa 10px,#eef3fa 20px)",
      border: "1.5px dashed #cbd5e1",
      minHeight: 90,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 5,
    }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", fontFamily: FONT, textTransform: "uppercase" }}>
        Advertisement
      </span>
      <span style={{ fontSize: 12, color: "#cbd5e1", fontFamily: FONT, fontWeight: 600 }}>
        Google Ad · 728×90
      </span>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      textAlign: "center",
      padding: "clamp(48px,8vw,88px) 24px",
      animation: "fadeUp 0.45s ease both",
    }}>
      <div style={{ fontSize: 64, display: "block", marginBottom: 20, animation: "floatOrb 4s ease-in-out infinite" }}>
        📋
      </div>
      <h3 style={{ fontFamily: FONT_D, fontSize: "clamp(18px,4vw,24px)", fontWeight: 700, color: "#0f172a", marginBottom: 10, letterSpacing: "-0.03em" }}>
        No requests yet
      </h3>
      <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.6, fontFamily: FONT }}>
        When you show interest in a product,<br />it'll appear right here.
      </p>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MarketplaceInterests() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchMyInterests();
      setItems(res.data?.data || res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const pending  = countByStatus(items, "pending");
  const accepted = countByStatus(items, "accepted");
  const rejected = countByStatus(items, "rejected");

  // Interleave inline ads every 4 cards
  const renderCards = () => {
    const out = [];
    (items || []).forEach((item, i) => {
      out.push(<InterestCard key={item.id} item={item} delay={i * 60} />);
      if ((i + 1) % 4 === 0 && i + 1 < items.length) {
        out.push(<InlineAd key={`ad-${i}`} id={`ad-inline-${i}`} />);
      }
    });
    return out;
  };

  return (
    <MarketplaceLayout>
      <InjectStyles />

      <div style={s.page}>

        {/* ── Hero (mirrors Profile hero exactly) ── */}
        <div style={s.hero}>
          {/* Dot grid — same as Profile */}
          <div style={s.heroDots} />

          {/* Floating orbs — same floatOrb animation as Profile */}
          <div style={{ ...s.orb, width: 260, height: 260, top: -90, right: -70, animationDelay: "0s" }} />
          <div style={{ ...s.orb, width: 140, height: 140, bottom: 20, left: 50, animationDelay: "2s" }} />
          <div style={{ ...s.orb, width: 90,  height: 90,  top: 30, left: "35%", animationDelay: "4s" }} />

          {/* Wave — same dual-path wave as Profile */}
          <svg style={s.heroWave} viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path
              style={{ animation: "waveSlide 10s linear infinite" }}
              d="M0,30 C240,55 480,5 720,30 C960,55 1200,5 1440,30 C1680,55 1920,5 2160,30 L2160,60 L0,60 Z"
              fill="#f0f6ff"
            />
            <path
              style={{ animation: "waveSlide 15s linear infinite reverse" }}
              d="M0,42 C300,18 600,56 900,38 C1200,20 1500,52 1800,36 C2000,24 2160,46 2160,40 L2160,60 L0,60 Z"
              fill="#e3f2fd"
              opacity="0.7"
            />
          </svg>

          <div style={s.heroInner}>
            {/* Eyebrow chip — same glass pill as Profile */}
            <div style={s.heroLabel}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse 1.8s infinite", flexShrink: 0 }} />
              My Dashboard
            </div>

            {/* Title — Fraunces, same as Profile */}
            <h1 style={s.heroTitle}>
              My{" "}
              <span style={{
                background: "linear-gradient(90deg, #93c5fd, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Interests
              </span>
            </h1>

            <p style={s.heroSub}>
              Track every product request and follow its current status in real time.
            </p>

            {/* Stat pills — same glassmorphism style as Profile */}
            {!loading && items.length > 0 && (
              <div style={s.statRow}>
                {[
                  { dot: "#f59e0b", num: pending,  label: "Pending"  },
                  { dot: "#16a34a", num: accepted, label: "Accepted" },
                  { dot: "#e11d48", num: rejected, label: "Rejected" },
                  { dot: "#93c5fd", num: items.length, label: "Total" },
                ].map(({ dot, num, label }) => (
                  <div key={label} className="mpi-stat" style={s.statPill}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 16, fontWeight: 800 }}>{num}</span>
                    <span style={{ fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={s.body}>

          {/* Top leaderboard ad */}
          <div style={{ marginBottom: 24 }}>
            <AdSlot variant="leaderboard" />
          </div>

          {/* Two-column layout */}
          <div className="mpi-layout" style={s.layout}>

            {/* ── Card list ── */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Mobile sidebar ad */}
              <div className="mpi-sidebar-mobile" style={{ display: "none", marginBottom: 16 }}>
                <AdSlot variant="rectangle" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {loading
                  ? <SkeletonList />
                  : items.length === 0
                    ? <EmptyState />
                    : renderCards()
                }
              </div>

              {/* Mobile bottom ad */}
              {!loading && items.length > 0 && (
                <div className="mpi-sidebar-mobile" style={{ display: "none", marginTop: 16 }}>
                  <AdSlot variant="rectangle" />
                </div>
              )}

              {/* Below-list leaderboard ad */}
              {/* {!loading && items.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <AdSlot variant="leaderboard" />
                </div>
              )} */}
            </div>

            {/* ── Sidebar (desktop only) ── */}
            <aside className="mpi-sidebar" style={s.sidebar}>
              {!loading && items.length > 0 && <SummaryCard items={items} />}

              {/* Profile tips card */}
              <div style={s.infoCard}>
                <div style={s.infoHead}>
                  <div style={{ fontSize: 20 }}>💡</div>
                  <span style={s.infoTitle}>About Statuses</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    "Pending means the seller has not yet reviewed your request.",
                    "Accepted means the seller is ready to proceed with you.",
                    "Rejected means the item is unavailable or declined.",
                  ].map((tip, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "#475569", fontFamily: FONT, lineHeight: 1.55 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: BLUE, marginTop: 5, flexShrink: 0, opacity: 0.7 }} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sidebar ad slots */}
              <AdSlot variant="rectangle" />
              <div style={{ marginTop: 16 }}>
                <AdSlot variant="rectangle" />
              </div>
            </aside>
          </div>
        </div>

      </div>
    </MarketplaceLayout>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "#f0f6ff",     // Profile's page bg
    fontFamily: FONT,
  },

  // Hero — exact mirror of Profile
  hero: {
    position: "relative",
    background: "linear-gradient(130deg, #0f3460 0%, #1565c0 50%, #1976d2 100%)",
    overflow: "hidden",
  },
  heroDots: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize: "28px 28px",
  },
  orb: {
    position: "absolute", borderRadius: "50%",
    background: "rgba(255,255,255,0.06)",
    animation: "floatOrb 7s ease-in-out infinite",
    pointerEvents: "none",
  },
  heroWave: {
    position: "absolute", bottom: 0, left: 0,
    width: "200%", height: 60, zIndex: 1, pointerEvents: "none",
  },
  heroInner: {
    position: "relative", zIndex: 2,
    padding: "36px 32px 72px",
    maxWidth: 1100, margin: "0 auto",
  },
  heroLabel: {
    display: "inline-flex", alignItems: "center", gap: 7,
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 40, padding: "5px 14px",
    fontSize: 12, fontWeight: 700, color: "#bfdbfe",
    fontFamily: FONT, marginBottom: 12,
    backdropFilter: "blur(8px)",
    animation: "fadeIn 0.4s ease both",
  },
  heroTitle: {
    fontFamily: FONT_D,            // Fraunces — same as Profile
    fontSize: "clamp(26px, 4vw, 42px)",
    fontWeight: 900, color: "#fff",
    letterSpacing: "-0.5px", lineHeight: 1.15,
    margin: "0 0 8px",
    animation: "fadeUp 0.45s ease both",
    animationDelay: "0.08s",
  },
  heroSub: {
    fontSize: 14, color: "rgba(255,255,255,0.7)",
    fontFamily: FONT, fontWeight: 400, margin: 0,
    animation: "fadeUp 0.45s ease both", animationDelay: "0.16s",
  },
  statRow: {
    display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24,
    animation: "fadeUp 0.45s ease both", animationDelay: "0.24s",
  },
  statPill: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(255,255,255,0.13)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: 40, padding: "8px 18px",
    color: "#fff",
    fontFamily: FONT, fontSize: 13, fontWeight: 600,
    cursor: "default",
    transition: "background 0.2s, transform 0.2s",
  },

  // Body
  body: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "clamp(16px, 3vw, 32px) clamp(12px, 3vw, 28px)",
    position: "relative", zIndex: 2,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 280px",
    gap: 24,
    alignItems: "start",
  },

  // Card — same border-radius, shadow, border as Profile card
  card: {
    background: "#fff",
    borderRadius: 22,
    boxShadow: "0 4px 32px rgba(21,101,192,0.09), 0 1px 4px rgba(0,0,0,0.04)",
    border: "1.5px solid #e0ecfb",
    display: "grid",
    gridTemplateColumns: "6px 120px 1fr auto",
    alignItems: "stretch",
    overflow: "hidden",
    transition: "box-shadow 0.28s, transform 0.28s, border-color 0.28s",
    animation: "fadeUp 0.45s ease both",
    minHeight: 130,
  },
  cardImg: {
    position: "relative", overflow: "hidden",
    background: BLUELT,
  },
  cardImgEl: {
    width: "100%", height: "100%",
    objectFit: "cover", display: "block",
    transition: "transform 0.5s cubic-bezier(.22,1,.36,1)",
  },
  cardImgFallback: {
    width: "100%", height: "100%",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: `linear-gradient(135deg, ${BLUELT}, #ddeeff)`,
  },
  imgChip: {
    position: "absolute", bottom: 7, left: 7,
    background: "rgba(15,52,96,0.75)",
    backdropFilter: "blur(6px)",
    color: "#fff",
    fontSize: 9, fontWeight: 700, letterSpacing: ".08em",
    textTransform: "uppercase",
    borderRadius: 6, padding: "3px 8px",
    fontFamily: FONT,
  },
  cardBody: {
    padding: "16px 16px 14px",
    display: "flex", flexDirection: "column",
    justifyContent: "space-between", gap: 8, minWidth: 0,
  },
  cardTitle: {
    fontFamily: FONT,
    fontSize: "clamp(14px, 2.2vw, 16px)",
    fontWeight: 700, color: "#0f172a",
    letterSpacing: "-0.02em",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    marginBottom: 4, margin: "0 0 4px",
  },
  cardPrice: {
    fontFamily: FONT,
    fontSize: "clamp(18px, 3vw, 22px)",
    fontWeight: 800, color: BLUE,
    letterSpacing: "-0.03em", lineHeight: 1,
    margin: "0 0 8px",
  },
  cardMeta: {
    display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6,
  },
  chip: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 11, fontWeight: 600, color: "#3b4a6b",
    background: BLUELT, border: "1px solid #bfdbfe",
    borderRadius: 40, padding: "3px 10px", fontFamily: FONT,
  },
  metaDate: {
    fontSize: 11, color: "#94a3b8", fontFamily: FONT,
  },
  cardActions: {
    display: "flex", flexDirection: "column",
    alignItems: "flex-end", justifyContent: "space-between",
    padding: "14px 16px", gap: 10,
    borderLeft: "1px solid #e0ecfb",
    minWidth: 80,
  },
  actionTime: {
    fontSize: 10.5, color: "#94a3b8",
    fontFamily: FONT, fontWeight: 500,
    whiteSpace: "nowrap",
  },
  actionBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
    color: BLUE, background: BLUELT,
    border: `1px solid #bfdbfe`,
    borderRadius: 8, padding: "6px 12px",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.18s, color 0.18s, transform 0.15s",
    whiteSpace: "nowrap",
  },

  // Sidebar — same as Profile sidebar
  sidebar: {
    display: "flex", flexDirection: "column", gap: 16,
    position: "sticky", top: 82,
    animation: "fadeUp 0.45s ease both", animationDelay: "0.2s",
  },
  infoCard: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e0ecfb",
    padding: "16px 18px",
    boxShadow: "0 2px 16px rgba(21,101,192,0.07)",
  },
  infoHead: {
    display: "flex", alignItems: "center", gap: 10,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 14, fontWeight: 800, color: "#0f172a", fontFamily: FONT,
  },
};