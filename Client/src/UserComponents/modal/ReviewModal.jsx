import { useEffect, useState, useCallback } from "react";
import { getFlyerReviews, postFlyerReview } from "../api/reviewApi";
import {
  X, Star, Send, MessageSquare,
  ChevronDown, Loader2, CheckCircle2, AlertCircle,
  User, Calendar, BarChart2
} from "lucide-react";
import { getImageUrl } from "../../api/media";

/* ─── DESIGN TOKENS (mirrors UserHome.jsx) ─── */
const T = {
  red:         "#E30613",
  redDark:     "#B80010",
  redDeep:     "#7F0009",
  redLight:    "#FFF0F0",
  redGlow:     "rgba(227,6,19,0.18)",
  dark:        "#0D0F14",
  darkMid:     "#1A1D27",
  charcoal:    "#2D3142",
  slate:       "#4A4E6A",
  muted:       "#8B8FA8",
  subtle:      "#C4C6D6",
  border:      "#EAEBF4",
  borderLight: "#F2F3FA",
  bg:          "#F4F5FB",
  bgCard:      "#FAFBFF",
  white:       "#FFFFFF",
  success:     "#00C48C",
  warning:     "#F59E0B",
  gold:        "#FFB800",
  overlay:     "rgba(13,15,20,0.72)",
};

const FONT_URL =
  "https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@300,400,500,700,800&f[]=clash-display@400,500,600,700&display=swap";

/* ─── STAR RATING DISPLAY ─── */
function StarDisplay({ rating, size = 14, showEmpty = true }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = s <= Math.floor(rating);
        const partial = !filled && s === Math.ceil(rating) && rating % 1 !== 0;
        return (
          <svg key={s} width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            {partial ? (
              <defs>
                <linearGradient id={`pg-${s}`}>
                  <stop offset={`${(rating % 1) * 100}%`} stopColor={T.gold} />
                  <stop offset={`${(rating % 1) * 100}%`} stopColor={T.border} />
                </linearGradient>
              </defs>
            ) : null}
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              fill={filled ? T.gold : partial ? `url(#pg-${s})` : (showEmpty ? T.borderLight : T.border)}
              stroke={filled || partial ? T.gold : T.border}
              strokeWidth="1.5"
            />
          </svg>
        );
      })}
    </span>
  );
}

/* ─── INTERACTIVE STAR INPUT ─── */
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
  const active = hover || value;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(s)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "4px", borderRadius: 8, transition: "transform .15s",
              transform: hover === s ? "scale(1.25)" : active >= s ? "scale(1.1)" : "scale(1)",
            }}
            aria-label={`${s} star`}
          >
            <svg width={32} height={32} viewBox="0 0 24 24">
              <polygon
                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                fill={active >= s ? T.gold : T.borderLight}
                stroke={active >= s ? T.gold : T.border}
                strokeWidth="1.5"
                style={{ transition: "all .15s" }}
              />
            </svg>
          </button>
        ))}
      </div>
      <span style={{
        fontSize: 13, fontWeight: 700, color: active ? T.gold : T.muted,
        fontFamily: "'Clash Display', sans-serif", letterSpacing: ".04em",
        minHeight: 20, transition: "color .15s",
      }}>
        {labels[active] || "Tap to rate"}
      </span>
    </div>
  );
}

/* ─── AVATAR ─── */
const PALETTES = [
  { bg: "#EEF2FF", text: "#3730A3" }, { bg: "#F0FDF4", text: "#166534" },
  { bg: "#FFF7ED", text: "#9A3412" }, { bg: "#FDF2F8", text: "#9D174D" },
  { bg: "#F0FDFA", text: "#115E59" }, { bg: "#FEFCE8", text: "#854D0E" },
];

// Accepts the raw relative path from the API (e.g. "users/profile/IMG.jpeg").
// Calls getImageUrl() once internally; falls back to initials/color on error or null.
function Avatar({ name = "?", avatarUrl = null }) {
  const [imgError, setImgError] = useState(false);
  const idx = name.charCodeAt(0) % PALETTES.length;
  const pal = PALETTES[idx];
  const ini = name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("");

  const fullUrl = avatarUrl ? getImageUrl(avatarUrl) : null;

  if (fullUrl && !imgError) {
    return (
      <img
        src={fullUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          objectFit: "cover", border: `1.5px solid ${T.border}`,
          display: "block",
        }}
      />
    );
  }

  return (
    <div style={{
      width: 38, height: 38, borderRadius: 12, flexShrink: 0,
      background: pal.bg, color: pal.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
      fontSize: 13, userSelect: "none", border: `1.5px solid ${T.border}`,
    }}>
      {ini || <User size={16} />}
    </div>
  );
}

/* ─── RATING SUMMARY BAR ─── */
function RatingBar({ label, count, total, accent }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, width: 14, textAlign: "right", flexShrink: 0 }}>{label}</span>
      <svg width={10} height={10} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill={T.gold} stroke={T.gold} strokeWidth="1.5" />
      </svg>
      <div style={{ flex: 1, height: 6, background: T.borderLight, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: accent, borderRadius: 99, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
      </div>
      <span style={{ fontSize: 11, color: T.muted, width: 28, textAlign: "right", flexShrink: 0 }}>{count}</span>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function ReviewModal({ flyerId, flyerTitle = "Flyer", onClose }) {
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState(null);
  const [rating, setRating]         = useState(0);
  const [comment, setComment]       = useState("");
  const [tab, setTab]               = useState("reviews"); // "reviews" | "write"
  const [showAll, setShowAll]       = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFlyerReviews(flyerId);
      setReviews(res.data.data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [flyerId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!rating) { setError("Please select a rating before submitting."); return; }
    setError(null);
    setSubmitting(true);
    try {
      await postFlyerReview(flyerId, { rating, comment });
      setSubmitted(true);
      setRating(0);
      setComment("");
      await fetchReviews();
      setTimeout(() => { setSubmitted(false); setTab("reviews"); }, 2200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* Computed stats */
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const dist = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
  }));

  const visibleReviews = showAll ? reviews : reviews.slice(0, 4);

  const barAccent = (s) => {
    if (s >= 4) return T.success;
    if (s === 3) return T.warning;
    return T.red;
  };

  return (
    <>
      <link rel="stylesheet" href={FONT_URL} />
      <MODAL_STYLES />

      <div className="rm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Reviews">
        <div className="rm-sheet" onClick={e => e.stopPropagation()}>

          {/* ── Header ── */}
          <div className="rm-header">
            <div className="rm-header-left">
              <div className="rm-header-icon">
                <MessageSquare size={16} color={T.red} strokeWidth={2} />
              </div>
              <div>
                <p className="rm-header-label">Customer Reviews</p>
                <p className="rm-header-title">{flyerTitle}</p>
              </div>
            </div>
            <button className="rm-close" onClick={onClose} aria-label="Close">
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="rm-tabs">
            <button
              className={`rm-tab ${tab === "reviews" ? "rm-tab-on" : ""}`}
              onClick={() => setTab("reviews")}
            >
              <BarChart2 size={13} />
              <span>Reviews{reviews.length > 0 ? ` (${reviews.length})` : ""}</span>
            </button>
            <button
              className={`rm-tab ${tab === "write" ? "rm-tab-on" : ""}`}
              onClick={() => setTab("write")}
            >
              <Star size={13} />
              <span>Write a Review</span>
            </button>
          </div>

          {/* ── Body ── */}
          <div className="rm-body">

            {/* REVIEWS TAB */}
            {tab === "reviews" && (
              <div className="rm-reviews-tab">
                {/* Summary */}
                {reviews.length > 0 && (
                  <div className="rm-summary">
                    <div className="rm-summary-score">
                      <span className="rm-big-score">{avgRating}</span>
                      <div>
                        <StarDisplay rating={parseFloat(avgRating)} size={16} />
                        <p className="rm-score-sub">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="rm-summary-bars">
                      {dist.map(({ star, count }) => (
                        <RatingBar key={star} label={star} count={count} total={reviews.length} accent={barAccent(star)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Review list */}
                {loading ? (
                  <div className="rm-loading">
                    <Loader2 size={24} color={T.red} style={{ animation: "rm-spin 1s linear infinite" }} />
                    <span>Loading reviews…</span>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="rm-empty">
                    <div className="rm-empty-icon">
                      <Star size={28} color={T.subtle} strokeWidth={1.4} />
                    </div>
                    <p className="rm-empty-title">No reviews yet</p>
                    <p className="rm-empty-sub">Be the first to share your experience</p>
                    <button className="rm-cta-btn" onClick={() => setTab("write")}>
                      <Star size={13} /> Write a Review
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="rm-list">
                      {visibleReviews.map((r) => (
                        <div key={r.id} className="rm-card">
                          <div className="rm-card-top">
                            {/* Pass raw path — Avatar resolves URL internally via getImageUrl() */}
                            <Avatar name={r.user_name || "User"} avatarUrl={r.user_avatar} />
                            <div className="rm-card-meta">
                              <span className="rm-card-name">{r.user_name || "Anonymous"}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <StarDisplay rating={r.rating} size={12} />
                                {r.created_at && (
                                  <span className="rm-card-date">
                                    <Calendar size={9} />
                                    {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="rm-card-badge" style={{ background: barAccent(r.rating) + "18", color: barAccent(r.rating) }}>
                              {r.rating}.0
                            </div>
                          </div>
                          {r.comment && <p className="rm-card-comment">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                    {reviews.length > 4 && (
                      <button className="rm-show-more" onClick={() => setShowAll(v => !v)}>
                        <ChevronDown size={14} style={{ transform: showAll ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                        {showAll ? "Show less" : `Show ${reviews.length - 4} more reviews`}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* WRITE TAB */}
            {tab === "write" && (
              <div className="rm-write-tab">
                {submitted ? (
                  <div className="rm-success">
                    <div className="rm-success-icon">
                      <CheckCircle2 size={36} color={T.success} />
                    </div>
                    <p className="rm-success-title">Review Submitted!</p>
                    <p className="rm-success-sub">Thank you for sharing your experience.</p>
                  </div>
                ) : (
                  <>
                    <div className="rm-write-section">
                      <label className="rm-label">Your Rating</label>
                      <div className="rm-star-wrap">
                        <StarInput value={rating} onChange={setRating} />
                      </div>
                    </div>

                    <div className="rm-write-section">
                      <label className="rm-label">Your Review <span style={{ color: T.muted }}>(optional)</span></label>
                      <textarea
                        className="rm-textarea"
                        placeholder="What did you think about this deal? Was it worth it?"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={4}
                        maxLength={500}
                      />
                      <div className="rm-char-count">{comment.length}/500</div>
                    </div>

                    {error && (
                      <div className="rm-error">
                        <AlertCircle size={13} />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      className="rm-submit"
                      onClick={handleSubmit}
                      disabled={submitting || !rating}
                    >
                      {submitting
                        ? <><Loader2 size={15} style={{ animation: "rm-spin 1s linear infinite" }} /> Submitting…</>
                        : <><Send size={15} /> Submit Review</>
                      }
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Styles ── */
function MODAL_STYLES() {
  return (
    <style>{`
      @keyframes rm-fadeIn    { from { opacity:0; }                        to { opacity:1; } }
      @keyframes rm-slideUp   { from { opacity:0; transform:translateY(32px) scale(.97); } to { opacity:1; transform:none; } }
      @keyframes rm-spin      { to   { transform:rotate(360deg); } }
      @keyframes rm-scaleIn   { from { transform:scale(.85); opacity:0; }  to { transform:scale(1); opacity:1; } }

      .rm-overlay {
        position: fixed; inset: 0;
        background: ${T.overlay};
        backdrop-filter: blur(6px);
        z-index: 9999;
        display: flex; align-items: flex-end; justify-content: center;
        padding: 0;
        animation: rm-fadeIn .22s ease;
      }
      @media (min-width: 600px) {
        .rm-overlay { align-items: center; padding: 20px; }
      }

      .rm-sheet {
        background: ${T.white};
        border-radius: 28px 28px 0 0;
        width: 100%;
        max-height: 92vh;
        display: flex; flex-direction: column;
        overflow: hidden;
        animation: rm-slideUp .3s cubic-bezier(.34,1.1,.64,1);
        box-shadow: 0 -8px 60px rgba(0,0,0,.18), 0 -2px 12px rgba(0,0,0,.08);
        position: relative;
      }
      @media (min-width: 600px) {
        .rm-sheet {
          border-radius: 24px;
          max-width: 560px;
          max-height: 88vh;
          box-shadow: 0 32px 80px rgba(13,15,20,.24), 0 8px 24px rgba(13,15,20,.12);
        }
      }

      /* drag handle on mobile */
      .rm-sheet::before {
        content: '';
        display: block;
        width: 40px; height: 4px;
        background: ${T.border};
        border-radius: 99px;
        margin: 12px auto 0;
        flex-shrink: 0;
      }
      @media (min-width: 600px) {
        .rm-sheet::before { display: none; }
      }

      /* ── Header ── */
      .rm-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px 14px;
        border-bottom: 1.5px solid ${T.borderLight};
        flex-shrink: 0;
        gap: 12px;
      }
      .rm-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
      .rm-header-icon {
        width: 38px; height: 38px; border-radius: 12px;
        background: ${T.redLight}; display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; border: 1.5px solid rgba(227,6,19,.15);
      }
      .rm-header-label {
        font-size: 10px; text-transform: uppercase; letter-spacing: .1em;
        color: ${T.muted}; font-weight: 700; margin-bottom: 1px;
        font-family: 'Cabinet Grotesk', sans-serif;
      }
      .rm-header-title {
        font-family: 'Clash Display', sans-serif;
        font-size: 15px; font-weight: 600; color: ${T.dark};
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        max-width: 260px;
      }
      .rm-close {
        width: 34px; height: 34px; border-radius: 50%;
        border: 1.5px solid ${T.border}; background: ${T.white};
        display: flex; align-items: center; justify-content: center;
        color: ${T.muted}; cursor: pointer; flex-shrink: 0;
        transition: all .15s; font-family: 'Cabinet Grotesk', sans-serif;
      }
      .rm-close:hover { border-color: ${T.red}; color: ${T.red}; background: ${T.redLight}; }

      /* ── Tabs ── */
      .rm-tabs {
        display: flex; gap: 4px; padding: 10px 16px;
        border-bottom: 1.5px solid ${T.borderLight};
        background: ${T.bg};
        flex-shrink: 0;
      }
      .rm-tab {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
        padding: 9px 14px; border-radius: 12px; border: none;
        background: transparent; font-size: 13px; font-weight: 700;
        color: ${T.muted}; cursor: pointer;
        transition: all .2s; font-family: 'Cabinet Grotesk', sans-serif;
      }
      .rm-tab:hover { background: ${T.white}; color: ${T.charcoal}; }
      .rm-tab-on {
        background: ${T.white} !important;
        color: ${T.red} !important;
        box-shadow: 0 2px 10px rgba(0,0,0,.07), 0 1px 3px rgba(0,0,0,.05);
      }

      /* ── Body (scrollable) ── */
      .rm-body {
        flex: 1; overflow-y: auto; min-height: 0;
      }
      .rm-body::-webkit-scrollbar { width: 5px; }
      .rm-body::-webkit-scrollbar-track { background: transparent; }
      .rm-body::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }

      /* ── Reviews Tab ── */
      .rm-reviews-tab { padding: 18px 20px 24px; }

      .rm-summary {
        display: flex; gap: 20px; padding: 18px 20px;
        background: linear-gradient(135deg, ${T.bg}, ${T.white});
        border: 1.5px solid ${T.border}; border-radius: 20px;
        margin-bottom: 20px; align-items: center; flex-wrap: wrap;
      }
      .rm-summary-score { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
      .rm-big-score {
        font-family: 'Clash Display', sans-serif;
        font-size: 42px; font-weight: 700; color: ${T.dark}; line-height: 1;
      }
      .rm-score-sub { font-size: 11px; color: ${T.muted}; margin-top: 5px; font-family: 'Cabinet Grotesk', sans-serif; }
      .rm-summary-bars { flex: 1; min-width: 160px; display: flex; flex-direction: column; gap: 5px; }

      .rm-loading {
        display: flex; flex-direction: column; align-items: center; gap: 14px;
        padding: 48px 20px; color: ${T.muted};
        font-size: 13px; font-family: 'Cabinet Grotesk', sans-serif;
      }

      .rm-empty {
        display: flex; flex-direction: column; align-items: center;
        padding: 48px 20px; text-align: center; gap: 10px;
      }
      .rm-empty-icon {
        width: 64px; height: 64px; border-radius: 50%;
        background: ${T.bg}; border: 1.5px solid ${T.border};
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 6px;
      }
      .rm-empty-title {
        font-family: 'Clash Display', sans-serif; font-size: 16px; font-weight: 600; color: ${T.dark};
      }
      .rm-empty-sub { font-size: 13px; color: ${T.muted}; font-family: 'Cabinet Grotesk', sans-serif; }
      .rm-cta-btn {
        display: inline-flex; align-items: center; gap: 7px;
        margin-top: 8px; padding: 10px 22px;
        background: ${T.red}; color: ${T.white};
        border: none; border-radius: 12px; cursor: pointer;
        font-size: 13px; font-weight: 700;
        font-family: 'Cabinet Grotesk', sans-serif;
        transition: all .18s; box-shadow: 0 4px 14px ${T.redGlow};
      }
      .rm-cta-btn:hover { background: ${T.redDark}; transform: translateY(-1px); }

      .rm-list { display: flex; flex-direction: column; gap: 12px; }

      .rm-card {
        background: ${T.white}; border: 1.5px solid ${T.border};
        border-radius: 18px; padding: 16px 18px;
        transition: border-color .18s, box-shadow .18s;
      }
      .rm-card:hover {
        border-color: ${T.subtle};
        box-shadow: 0 4px 16px rgba(0,0,0,.06);
      }
      .rm-card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
      .rm-card-meta { flex: 1; min-width: 0; }
      .rm-card-name {
        font-family: 'Cabinet Grotesk', sans-serif;
        font-size: 13.5px; font-weight: 700; color: ${T.dark}; margin-bottom: 4px;
      }
      .rm-card-date {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 10.5px; color: ${T.muted}; font-family: 'Cabinet Grotesk', sans-serif;
      }
      .rm-card-badge {
        font-family: 'Clash Display', sans-serif; font-size: 11px; font-weight: 700;
        padding: 3px 9px; border-radius: 8px; flex-shrink: 0;
      }
      .rm-card-comment {
        font-size: 13px; color: ${T.slate}; line-height: 1.6;
        font-family: 'Cabinet Grotesk', sans-serif; margin: 0;
        padding-left: 50px;
      }

      .rm-show-more {
        width: 100%; margin-top: 14px;
        display: flex; align-items: center; justify-content: center; gap: 7px;
        padding: 11px; border: 1.5px solid ${T.border};
        background: ${T.white}; border-radius: 14px;
        font-size: 13px; font-weight: 700; color: ${T.slate};
        cursor: pointer; font-family: 'Cabinet Grotesk', sans-serif;
        transition: all .18s;
      }
      .rm-show-more:hover { border-color: ${T.red}; color: ${T.red}; background: ${T.redLight}; }

      /* ── Write Tab ── */
      .rm-write-tab { padding: 22px 20px 28px; display: flex; flex-direction: column; gap: 20px; }
      .rm-write-section { display: flex; flex-direction: column; gap: 10px; }

      .rm-label {
        font-family: 'Cabinet Grotesk', sans-serif;
        font-size: 12px; font-weight: 700; color: ${T.charcoal};
        text-transform: uppercase; letter-spacing: .08em;
      }

      .rm-star-wrap {
        background: ${T.bg}; border: 1.5px solid ${T.border};
        border-radius: 18px; padding: 20px; display: flex;
        align-items: center; justify-content: center;
      }

      .rm-textarea {
        width: 100%; border: 1.5px solid ${T.border};
        border-radius: 16px; padding: 14px 16px;
        font-size: 14px; font-family: 'Cabinet Grotesk', sans-serif;
        color: ${T.dark}; background: ${T.white};
        resize: none; outline: none;
        transition: border-color .18s, box-shadow .18s;
        line-height: 1.6;
        box-sizing: border-box;
      }
      .rm-textarea:focus {
        border-color: ${T.red};
        box-shadow: 0 0 0 3.5px ${T.redGlow};
      }
      .rm-textarea::placeholder { color: ${T.subtle}; }

      .rm-char-count {
        font-size: 11px; color: ${T.muted}; text-align: right;
        font-family: 'Cabinet Grotesk', sans-serif;
      }

      .rm-error {
        display: flex; align-items: center; gap: 8px;
        padding: 12px 16px; background: ${T.redLight};
        border: 1.5px solid rgba(227,6,19,.2); border-radius: 12px;
        font-size: 12.5px; color: ${T.red}; font-weight: 600;
        font-family: 'Cabinet Grotesk', sans-serif;
      }

      .rm-submit {
        display: flex; align-items: center; justify-content: center; gap: 9px;
        padding: 14px 24px; background: ${T.red}; color: ${T.white};
        border: none; border-radius: 16px; cursor: pointer;
        font-size: 14px; font-weight: 800;
        font-family: 'Clash Display', sans-serif;
        transition: all .2s; box-shadow: 0 6px 20px ${T.redGlow};
        letter-spacing: .02em;
      }
      .rm-submit:hover:not(:disabled) {
        background: ${T.redDark}; transform: translateY(-2px);
        box-shadow: 0 10px 28px ${T.redGlow};
      }
      .rm-submit:disabled {
        opacity: .45; cursor: not-allowed; transform: none;
        box-shadow: none;
      }

      /* ── Success ── */
      .rm-success {
        display: flex; flex-direction: column; align-items: center;
        padding: 48px 20px; text-align: center; gap: 12px;
      }
      .rm-success-icon { animation: rm-scaleIn .4s cubic-bezier(.34,1.56,.64,1); }
      .rm-success-title {
        font-family: 'Clash Display', sans-serif;
        font-size: 20px; font-weight: 700; color: ${T.dark};
      }
      .rm-success-sub { font-size: 13px; color: ${T.muted}; font-family: 'Cabinet Grotesk', sans-serif; }

      /* ── Mobile tweaks ── */
      @media (max-width: 480px) {
        .rm-header { padding: 14px 16px 12px; }
        .rm-header-title { font-size: 14px; max-width: 200px; }
        .rm-tabs { padding: 8px 12px; }
        .rm-reviews-tab { padding: 14px 14px 20px; }
        .rm-write-tab { padding: 16px 14px 24px; }
        .rm-summary { padding: 14px 16px; gap: 14px; }
        .rm-big-score { font-size: 36px; }
        .rm-card { padding: 14px; }
        .rm-card-comment { padding-left: 0; margin-top: 8px; }
      }
    `}</style>
  );
}