import { useEffect, useState } from "react";
import { getFlyerReviews } from "./api/companyApi";
import CompanyLayout from "../CompaniesComponent/CompanyLayout";

/* ─────────────────────────────────────────────────────────────────
   Global styles — same palette as CompanyDashboard & AddFlyer
───────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Bricolage+Grotesque:wght@600;700;800&display=swap');

  .fr * { box-sizing: border-box; margin: 0; padding: 0; }

  .fr {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f5f7ff;
    min-height: 100vh;
    padding: 2rem 1.5rem 3rem;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Gradient hero ── */
  .fr-hero {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 320px;
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 52%, #7c3aed 100%);
    z-index: 0;
    pointer-events: none;
  }
  .fr-hero::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0; right: 0; height: 80px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 80' preserveAspectRatio='none'%3E%3Cpath d='M0,36 C360,80 720,0 1080,36 C1260,54 1360,20 1440,36 L1440,80 L0,80 Z' fill='%23f5f7ff'/%3E%3C/svg%3E") center bottom / 100% 100% no-repeat;
  }

  .fr-inner {
    position: relative; z-index: 1;
    max-width: 860px; margin: 0 auto;
  }

  /* ── Top bar ── */
  .fr-topbar {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
    margin-bottom: 2.4rem;
  }
  .fr-page-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.02em;
  }
  .fr-page-sub { font-size: 12px; color: rgba(255,255,255,0.65); margin-top: 2px; }
  .fr-count-pill {
    font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9);
    background: rgba(255,255,255,0.16);
    border: 1px solid rgba(255,255,255,0.24);
    border-radius: 24px; padding: 7px 17px;
    white-space: nowrap;
  }

  /* ── Summary metric strip ── */
  .fr-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px; margin-bottom: 20px;
  }
  .fr-metric {
    background: #fff; border-radius: 18px;
    padding: 1.1rem 1.25rem;
    border: 1.5px solid rgba(99,102,241,0.09);
    box-shadow: 0 2px 14px rgba(79,70,229,0.07), 0 1px 3px rgba(0,0,0,0.04);
    position: relative; overflow: hidden;
    transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s;
    cursor: default;
  }
  .fr-metric:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 28px rgba(79,70,229,0.13);
  }
  .fr-metric-orb {
    position: absolute; top: -20px; right: -20px;
    width: 72px; height: 72px; border-radius: 50%; opacity: 0.11;
    pointer-events: none;
  }
  .fr-metric-icon {
    width: 36px; height: 36px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 10px;
  }
  .fr-metric-lbl {
    font-size: 10px; font-weight: 700; letter-spacing: .09em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 3px;
  }
  .fr-metric-num {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 30px; font-weight: 800; line-height: 1; letter-spacing: -0.03em;
  }
  .fr-metric-hint { font-size: 11px; color: #94a3b8; margin-top: 4px; }

  /* ── Flyer block ── */
  .fr-flyer {
    background: #fff; border-radius: 20px;
    border: 1.5px solid rgba(99,102,241,0.09);
    box-shadow: 0 2px 14px rgba(79,70,229,0.07), 0 1px 3px rgba(0,0,0,0.04);
    margin-bottom: 18px;
    overflow: hidden;
    transition: box-shadow .3s;
  }
  .fr-flyer:hover { box-shadow: 0 8px 30px rgba(79,70,229,0.12); }

  /* Flyer header */
  .fr-flyer-hd {
    padding: 1.3rem 1.5rem 1.1rem;
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 14px;
    flex-wrap: wrap;
    border-bottom: 1.5px solid #f1f5f9;
    position: relative; overflow: hidden;
  }
  .fr-flyer-hd-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .fr-flyer-hd-icon {
    width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
    background: #ede9fe;
    display: flex; align-items: center; justify-content: center;
  }
  .fr-flyer-name {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 17px; font-weight: 800; color: #1e293b;
    letter-spacing: -0.01em;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .fr-flyer-meta { font-size: 12px; color: #94a3b8; margin-top: 3px; font-weight: 500; }

  /* Rating badge */
  .fr-rating-badge {
    display: flex; align-items: center; gap: 8px;
    background: #faf5ff; border: 1.5px solid #e9d5ff;
    border-radius: 14px; padding: 8px 14px; flex-shrink: 0;
  }
  .fr-rating-num {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 22px; font-weight: 800; color: #6d28d9; line-height: 1;
  }
  .fr-rating-right { display: flex; flex-direction: column; gap: 3px; }
  .fr-stars-row { display: flex; gap: 2px; }
  .fr-star-filled { color: #f59e0b; font-size: 13px; line-height: 1; }
  .fr-star-empty  { color: #e2e8f0; font-size: 13px; line-height: 1; }
  .fr-rating-count { font-size: 10.5px; color: #94a3b8; font-weight: 600; letter-spacing: .04em; }

  /* Rating bar chart */
  .fr-rating-bars {
    padding: 1rem 1.5rem;
    border-bottom: 1.5px solid #f1f5f9;
    display: flex; flex-direction: column; gap: 7px;
  }
  .fr-bar-row { display: flex; align-items: center; gap: 10px; }
  .fr-bar-label { font-size: 11px; font-weight: 600; color: #64748b; width: 30px; flex-shrink: 0; text-align: right; }
  .fr-bar-track { flex: 1; height: 7px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
  .fr-bar-fill {
    height: 100%; border-radius: 6px;
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 55%, #06b6d4 100%);
    transition: width 1.1s cubic-bezier(.22,1,.36,1);
  }
  .fr-bar-count { font-size: 11px; font-weight: 600; color: #94a3b8; width: 22px; flex-shrink: 0; }

  /* Toggle reviews */
  .fr-toggle-btn {
    width: 100%; background: none; border: none; cursor: pointer;
    padding: 12px 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 700; letter-spacing: .07em;
    text-transform: uppercase; color: #6366f1;
    transition: background .2s;
    border-bottom: 1.5px solid transparent;
  }
  .fr-toggle-btn:hover { background: #faf8ff; }
  .fr-toggle-btn.open { border-bottom-color: #f1f5f9; }
  .fr-chevron {
    transition: transform .3s cubic-bezier(.22,1,.36,1);
  }
  .fr-chevron.open { transform: rotate(180deg); }

  /* Reviews list */
  .fr-reviews-wrap {
    overflow: hidden;
    transition: max-height .5s cubic-bezier(.22,1,.36,1);
  }

  /* Individual review */
  .fr-review {
    padding: 1.1rem 1.5rem;
    border-bottom: 1px solid #f8faff;
    display: flex; gap: 13px; align-items: flex-start;
    transition: background .2s;
  }
  .fr-review:last-child { border-bottom: none; }
  .fr-review:hover { background: #fdfcff; }

  /* Avatar */
  .fr-avatar {
    width: 38px; height: 38px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 13px; font-weight: 800; color: #fff;
  }
  .fr-review-body { flex: 1; min-width: 0; }
  .fr-review-top {
    display: flex; align-items: center; justify-content: space-between;
    gap: 10px; margin-bottom: 5px; flex-wrap: wrap;
  }
  .fr-reviewer-name { font-size: 13.5px; font-weight: 700; color: #1e293b; }
  .fr-review-stars { display: flex; gap: 2px; }
  .fr-review-comment { font-size: 13px; color: #64748b; line-height: 1.65; }
  .fr-review-date { font-size: 11px; color: #c4cada; margin-top: 5px; font-weight: 500; }

  /* No reviews */
  .fr-no-reviews {
    padding: 2rem 1.5rem; text-align: center;
    color: #c4cada; font-size: 13px; font-weight: 500;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
  }
  .fr-no-icon {
    width: 44px; height: 44px; border-radius: 13px;
    background: #f8faff; display: flex; align-items: center; justify-content: center;
  }

  /* Empty page state */
  .fr-empty {
    text-align: center; padding: 4rem 1rem;
    color: #94a3b8; font-size: 14px;
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }
  .fr-empty-icon {
    width: 60px; height: 60px; border-radius: 18px;
    background: #fff; border: 1.5px solid rgba(99,102,241,0.09);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 14px rgba(79,70,229,0.07);
  }

  /* Loading */
  .fr-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 340px; gap: 14px; color: #94a3b8;
  }
  .fr-spin {
    width: 34px; height: 34px;
    border: 3px solid #e0e7ff; border-top-color: #6366f1;
    border-radius: 50%; animation: fr-spin .7s linear infinite;
  }

  /* Section heading */
  .fr-sec-hd { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .fr-sec-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 17px; font-weight: 800; color: #1e293b; letter-spacing: -0.01em;
  }
  .fr-sec-badge {
    font-size: 11px; font-weight: 700;
    background: #ede9fe; color: #6d28d9;
    padding: 3px 11px; border-radius: 20px;
  }

  /* Animations */
  @keyframes fr-spin { to { transform: rotate(360deg); } }
  @keyframes fr-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fr-up { animation: fr-up .5s cubic-bezier(.22,1,.36,1) both; }
  .fr-d1 { animation-delay: .05s; }
  .fr-d2 { animation-delay: .12s; }
  .fr-d3 { animation-delay: .19s; }

  /* Responsive */
  @media (max-width: 480px) {
    .fr { padding: 1.2rem 1rem 2.5rem; }
    .fr-page-title { font-size: 18px; }
    .fr-metrics { grid-template-columns: 1fr 1fr; }
    .fr-metric-num { font-size: 24px; }
    .fr-flyer-hd { padding: 1rem 1.1rem .9rem; }
    .fr-review { padding: .9rem 1.1rem; }
    .fr-rating-bars { padding: .9rem 1.1rem; }
    .fr-toggle-btn { padding: 11px 1.1rem; }
  }
  @media (min-width: 768px) {
    .fr { padding: 2.2rem 2.5rem 3.5rem; }
  }
`;

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */
const AVATAR_COLORS = [
  ["#6366f1","#4338ca"], ["#7c3aed","#5b21b6"], ["#0891b2","#0e7490"],
  ["#059669","#047857"], ["#d97706","#b45309"], ["#db2777","#be185d"],
];
function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name?.length ?? 0); i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name) {
  if (!name) return "?";
  const p = name.trim().split(" ");
  return (p[0][0] + (p[1]?.[0] ?? "")).toUpperCase();
}
function Stars({ value, size = 13 }) {
  return (
    <div className="fr-review-stars" aria-label={`${value} out of 5 stars`}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(value) ? "#f59e0b" : "#e2e8f0"}
          stroke={i <= Math.round(value) ? "#f59e0b" : "#e2e8f0"}
          strokeWidth="1" aria-hidden="true">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Rating bar breakdown for a flyer
───────────────────────────────────────────────────────────────── */
function RatingBars({ reviews, animate }) {
  const counts = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating) === star).length,
  }));
  const max = Math.max(...counts.map(c => c.count), 1);
  return (
    <div className="fr-rating-bars">
      {counts.map(({ star, count }) => (
        <div className="fr-bar-row" key={star}>
          <span className="fr-bar-label">{star}★</span>
          <div className="fr-bar-track">
            <div
              className="fr-bar-fill"
              style={{ width: animate ? `${(count / max) * 100}%` : "0%" }}
            />
          </div>
          <span className="fr-bar-count">{count}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Single flyer block (collapsible)
───────────────────────────────────────────────────────────────── */
function FlyerBlock({ flyer, index }) {
  const [open, setOpen]         = useState(index === 0);
  const [barAnim, setBarAnim]   = useState(index === 0);

  const toggle = () => {
    if (!open) setBarAnim(true);
    setOpen(o => !o);
  };

  const reviews     = flyer.reviews ?? [];
  const avg         = parseFloat(flyer.avg_rating) || 0;
  const total       = flyer.total_reviews ?? reviews.length;
  const reviewsH    = open ? `${reviews.length * 90 + 60}px` : "0px";

  const waveFill    = encodeURIComponent("#f5f3ff");
  const waveSrc     = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 860 44' preserveAspectRatio='none'%3E%3Cpath d='M0,22 C143,44 287,4 430,22 C573,40 717,4 860,22 L860,44 L0,44 Z' fill='${waveFill}'/%3E%3C/svg%3E`;

  return (
    <div
      className="fr-flyer fr-up"
      style={{ animationDelay: `${0.12 + index * 0.08}s` }}
    >
      {/* ── Header ── */}
      <div className="fr-flyer-hd">
        <div className="fr-flyer-hd-left">
          <div className="fr-flyer-hd-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="fr-flyer-name">{flyer.flyer_title}</div>
            <div className="fr-flyer-meta">{total} review{total !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {/* Rating badge */}
        <div className="fr-rating-badge" aria-label={`Average rating: ${avg.toFixed(1)} out of 5`}>
          <span className="fr-rating-num">{avg.toFixed(1)}</span>
          <div className="fr-rating-right">
            <Stars value={avg} />
            <span className="fr-rating-count">out of 5</span>
          </div>
        </div>

        {/* Decorative wave strip inside header */}
        <img
          src={waveSrc} alt="" aria-hidden="true"
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 24, width: "100%", pointerEvents: "none",
            display: "block", opacity: 0.6,
          }}
        />
      </div>

      {/* ── Rating breakdown bars ── */}
      {reviews.length > 0 && <RatingBars reviews={reviews} animate={barAnim} />}

      {/* ── Toggle button ── */}
      <button
        className={`fr-toggle-btn ${open ? "open" : ""}`}
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`fr-reviews-${flyer.flyer_id}`}
      >
        <span>{open ? "Hide reviews" : `Show ${total} review${total !== 1 ? "s" : ""}`}</span>
        <svg
          className={`fr-chevron ${open ? "open" : ""}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* ── Reviews list ── */}
      <div
        id={`fr-reviews-${flyer.flyer_id}`}
        className="fr-reviews-wrap"
        style={{ maxHeight: reviewsH }}
      >
        {reviews.length === 0 ? (
          <div className="fr-no-reviews">
            <div className="fr-no-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#c4cad4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            No reviews yet for this flyer
          </div>
        ) : (
          reviews.map(r => {
            const [bg] = avatarColor(r.user_name);
            return (
              <div className="fr-review" key={r.id}>
                <div
                  className="fr-avatar"
                  style={{ background: bg }}
                  aria-hidden="true"
                >
                  {initials(r.user_name)}
                </div>
                <div className="fr-review-body">
                  <div className="fr-review-top">
                    <span className="fr-reviewer-name">{r.user_name}</span>
                    <Stars value={r.rating} size={12} />
                  </div>
                  {r.comment && (
                    <p className="fr-review-comment">{r.comment}</p>
                  )}
                  {r.created_at && (
                    <div className="fr-review-date">
                      {new Date(r.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────── */
export default function CompanyFlyerReviews() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getFlyerReviews();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Aggregate metrics ── */
  const totalFlyers  = data.length;
  const totalReviews = data.reduce((s, f) => s + (f.total_reviews ?? f.reviews?.length ?? 0), 0);
  const allRatings   = data.flatMap(f => f.reviews?.map(r => r.rating) ?? []);
  const overallAvg   = allRatings.length
    ? (allRatings.reduce((s, v) => s + v, 0) / allRatings.length).toFixed(1)
    : "—";
  const topFlyer     = [...data].sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))[0];

  const METRICS = [
    {
      label: "Total flyers", val: totalFlyers, hint: "With reviews",
      color: "#2563eb", iconBg: "#eff6ff", orb: "#3b82f6",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg>,
    },
    {
      label: "Total reviews", val: totalReviews, hint: "Across all flyers",
      color: "#7c3aed", iconBg: "#faf5ff", orb: "#7c3aed",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>,
    },
    {
      label: "Overall avg", val: overallAvg, hint: "Combined rating",
      color: "#f59e0b", iconBg: "#fffbeb", orb: "#f59e0b",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </svg>,
    },
    {
      label: "Top rated",
      val: topFlyer ? parseFloat(topFlyer.avg_rating).toFixed(1) : "—",
      hint: topFlyer ? topFlyer.flyer_title.slice(0, 18) + (topFlyer.flyer_title.length > 18 ? "…" : "") : "No data",
      color: "#059669", iconBg: "#ecfdf5", orb: "#10b981",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>,
    },
  ];

  return (
    <CompanyLayout>
      <style>{STYLES}</style>

      <div className="fr">
        <div className="fr-hero" aria-hidden="true" />

        <div className="fr-inner">

          {/* ── Top bar ── */}
          <div className="fr-topbar fr-up fr-d1">
            <div>
              <div className="fr-page-title">Flyer reviews</div>
              <div className="fr-page-sub">Customer feedback across all campaigns</div>
            </div>
            {!loading && (
              <div className="fr-count-pill">{totalReviews} review{totalReviews !== 1 ? "s" : ""} total</div>
            )}
          </div>

          {loading ? (
            <div className="fr-loading" role="status" aria-live="polite">
              <div className="fr-spin" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Loading reviews…</span>
            </div>
          ) : (
            <>
              {/* ── Metric strip ── */}
              <div className="fr-metrics fr-up fr-d2">
                {METRICS.map(m => (
                  <div className="fr-metric" key={m.label}>
                    <div className="fr-metric-orb" style={{ background: m.orb }} />
                    <div className="fr-metric-icon" style={{ background: m.iconBg }}>
                      {m.icon}
                    </div>
                    <div className="fr-metric-lbl">{m.label}</div>
                    <div className="fr-metric-num" style={{ color: m.color }}>{m.val}</div>
                    <div className="fr-metric-hint">{m.hint}</div>
                  </div>
                ))}
              </div>

              {/* ── Section heading ── */}
              <div className="fr-sec-hd fr-up fr-d3">
                <span className="fr-sec-title">All flyers</span>
                <span className="fr-sec-badge">{totalFlyers} total</span>
              </div>

              {data.length === 0 ? (
                <div className="fr-empty fr-up">
                  <div className="fr-empty-icon" aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                      stroke="#c4cad4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  No flyer reviews found
                </div>
              ) : (
                data.map((flyer, i) => (
                  <FlyerBlock key={flyer.flyer_id} flyer={flyer} index={i} />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </CompanyLayout>
  );
}