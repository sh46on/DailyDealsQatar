import { useEffect, useState } from "react";
import { getCompanyDashboard } from "./api/companyApi";
import CompanyLayout from "../CompaniesComponent/CompanyLayout";
import { getImageUrl } from "../api/media";

/* ─────────────────────────────────────────────────────────────────
   Global styles (injected once via <style>)
───────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Bricolage+Grotesque:wght@600;700;800&display=swap');

  .cd * { box-sizing: border-box; margin: 0; padding: 0; }

  .cd {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f5f7ff;
    min-height: 100vh;
    padding: 2rem 1.5rem 3rem;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Gradient hero + wavy bottom ── */
  .cd-hero {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 320px;
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 52%, #7c3aed 100%);
    z-index: 0;
    pointer-events: none;
  }
  .cd-hero::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0; right: 0; height: 80px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 80' preserveAspectRatio='none'%3E%3Cpath d='M0,36 C360,80 720,0 1080,36 C1260,54 1360,20 1440,36 L1440,80 L0,80 Z' fill='%23f5f7ff'/%3E%3C/svg%3E") center bottom / 100% 100% no-repeat;
  }

  .cd-inner {
    position: relative; z-index: 1;
    max-width: 1020px; margin: 0 auto;
  }

  /* ── Top bar ── */
  .cd-topbar {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin-bottom: 2.4rem;
  }
  .cd-brand { display: flex; align-items: center; gap: 13px; }
  .cd-avatar img {
    width: 100px; height: 100px; border-radius: 14px;
    background: rgba(255,255,255,0.2);
    border: 1.5px solid rgba(255,255,255,0.38);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 17px; font-weight: 800; color: #fff;
    flex-shrink: 0;
    box-shadow: 0 4px 16px rgba(0,0,0,0.14);
  }
  // .cd-avatar img  { width: 100%; height: 100%; object-fit: cover; }

  .cd-co-name {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.02em;
  }
  .cd-co-sub { font-size: 12px; color: rgba(255,255,255,0.65); margin-top: 2px; font-weight: 400; }
  .cd-date-pill {
    font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.88);
    background: rgba(255,255,255,0.16);
    border: 1px solid rgba(255,255,255,0.24);
    border-radius: 24px; padding: 7px 17px;
  }

  /* ── Metric grid ── */
  .cd-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
    gap: 14px; margin-bottom: 16px;
  }
  .cd-metric {
    background: #fff; border-radius: 18px;
    padding: 1.25rem 1.35rem;
    border: 1.5px solid rgba(99,102,241,0.09);
    box-shadow: 0 2px 14px rgba(79,70,229,0.07), 0 1px 3px rgba(0,0,0,0.04);
    position: relative; overflow: hidden;
    transition: transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s;
    cursor: default;
  }
  .cd-metric:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(79,70,229,0.13), 0 2px 6px rgba(0,0,0,0.05);
  }
  .cd-metric-orb {
    position: absolute; top: -22px; right: -22px;
    width: 80px; height: 80px; border-radius: 50%; opacity: 0.12;
  }
  .cd-metric-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 13px;
  }
  .cd-metric-lbl {
    font-size: 10.5px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 4px;
  }
  .cd-metric-num {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 36px; font-weight: 800; line-height: 1; letter-spacing: -0.03em;
  }
  .cd-metric-hint { font-size: 11px; color: #94a3b8; margin-top: 5px; font-weight: 400; }

  /* ── Two-col summary ── */
  .cd-row2 {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 14px; margin-bottom: 16px;
  }
  @media (max-width: 580px) { .cd-row2 { grid-template-columns: 1fr; } }

  .cd-card {
    background: #fff; border-radius: 18px;
    padding: 1.25rem 1.35rem;
    border: 1.5px solid rgba(99,102,241,0.09);
    box-shadow: 0 2px 14px rgba(79,70,229,0.07), 0 1px 3px rgba(0,0,0,0.04);
  }
  .cd-card-hd {
    font-size: 10.5px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 13px;
  }

  /* ── Summary rows ── */
  .cd-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13.5px;
  }
  .cd-row:last-child { border-bottom: none; }
  .cd-row-k { color: #64748b; }
  .cd-row-v { font-weight: 600; color: #1e293b; }
  .cd-row-v.green { color: #059669; }

  /* ── Donut ── */
  .cd-donut-wrap {
    display: flex; align-items: center; justify-content: center;
    gap: 20px; padding: 6px 0;
  }
  .cd-legend { display: flex; flex-direction: column; gap: 9px; }
  .cd-leg-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #64748b; font-weight: 500; }
  .cd-leg-sq { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }

  /* ── Section header ── */
  .cd-sec-hd { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .cd-sec-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 17px; font-weight: 800; color: #1e293b; letter-spacing: -0.01em;
  }
  .cd-sec-badge {
    font-size: 11px; font-weight: 700;
    background: #ede9fe; color: #6d28d9;
    padding: 3px 11px; border-radius: 20px;
  }

  /* ── Flyers grid ── */
  .cd-flyers {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
    gap: 14px;
  }

  /* ── Flyer card ── */
  .cd-flyer {
    background: #fff; border-radius: 18px;
    padding: 1.25rem 1.35rem 2.8rem;
    border: 1.5px solid rgba(99,102,241,0.09);
    box-shadow: 0 2px 14px rgba(79,70,229,0.06), 0 1px 3px rgba(0,0,0,0.03);
    position: relative; overflow: hidden;
    transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s;
  }
  .cd-flyer:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 32px rgba(79,70,229,0.13), 0 3px 8px rgba(0,0,0,0.05);
  }
  .cd-flyer-wave {
    position: absolute; bottom: 0; left: 0; right: 0; height: 46px;
    pointer-events: none; display: block; width: 100%;
  }
  .cd-fcard-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .cd-fcard-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
  .cd-pill {
    font-size: 10px; font-weight: 700; letter-spacing: .06em;
    text-transform: uppercase; padding: 4px 12px; border-radius: 20px;
  }
  .cd-pill-active { background: #d1fae5; color: #065f46; }
  .cd-pill-inactive { background: #f1f5f9; color: #64748b; }
  .cd-ftitle {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 16px; font-weight: 800; color: #1e293b;
    letter-spacing: -0.01em; margin-bottom: 6px;
  }
  .cd-fdates {
    font-size: 12px; color: #94a3b8; font-weight: 500;
    display: flex; align-items: center; gap: 7px; margin-bottom: 18px;
  }
  .cd-fdates-line { width: 18px; height: 1px; background: #cbd5e1; flex-shrink: 0; }
  .cd-prog-hd {
    display: flex; justify-content: space-between;
    font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 6px;
  }
  .cd-prog-track { height: 6px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
  .cd-prog-bar {
    height: 100%; border-radius: 6px;
    transition: width 1.2s cubic-bezier(.22,1,.36,1);
  }
  .cd-prog-active { background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 55%, #06b6d4 100%); }
  .cd-prog-inactive { background: #e2e8f0; }

  /* ── Empty / Loading ── */
  .cd-empty { text-align: center; padding: 3rem 1rem; color: #94a3b8; font-size: 14px; }
  .cd-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; min-height: 340px; gap: 14px; color: #94a3b8;
  }
  .cd-spin {
    width: 34px; height: 34px;
    border: 3px solid #e0e7ff; border-top-color: #6366f1;
    border-radius: 50%; animation: cd-spin .7s linear infinite;
  }

  /* ── Keyframes ── */
  @keyframes cd-spin { to { transform: rotate(360deg); } }
  @keyframes cd-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .cd-up { animation: cd-up .52s cubic-bezier(.22,1,.36,1) both; }
  .cd-d1 { animation-delay: .04s; }
  .cd-d2 { animation-delay: .11s; }
  .cd-d3 { animation-delay: .18s; }
  .cd-d4 { animation-delay: .25s; }
  .cd-d5 { animation-delay: .32s; }
  .cd-d6 { animation-delay: .39s; }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .cd { padding: 1.2rem 1rem 2.5rem; }
    .cd-metrics { grid-template-columns: 1fr 1fr; }
    .cd-metric-num { font-size: 28px; }
    .cd-metric { padding: 1rem; }
    .cd-co-name { font-size: 18px; }
  }
  @media (min-width: 768px) {
    .cd { padding: 2.2rem 2.5rem 3.5rem; }
  }
`;

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */
function calcProgress(start, end) {
  const s = new Date(start), e = new Date(end), now = new Date();
  if (now <= s) return 0;
  if (now >= e) return 100;
  return Math.round(((now - s) / (e - s)) * 100);
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function todayStr() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

/* ─────────────────────────────────────────────────────────────────
   Donut Chart (pure SVG, no library)
───────────────────────────────────────────────────────────────── */
function DonutChart({ active, total }) {
  const r = 40, cx = 48, cy = 48, sw = 10;
  const circ = 2 * Math.PI * r;
  const activeDash = total === 0 ? 0 : (active / total) * circ;

  return (
    <div className="cd-donut-wrap">
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ flexShrink: 0 }} aria-hidden="true">
        <defs>
          <linearGradient id="cdg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#cdg1)" strokeWidth={sw}
          strokeDasharray={`${activeDash} ${circ - activeDash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)" }}
        />
        <text x={cx} y={cy - 5} textAnchor="middle"
          fill="#1e293b" fontSize="20" fontWeight="800"
          fontFamily="Bricolage Grotesque, sans-serif">{active}</text>
        <text x={cx} y={cy + 11} textAnchor="middle"
          fill="#94a3b8" fontSize="9.5" fontWeight="600"
          fontFamily="Plus Jakarta Sans, sans-serif">active</text>
      </svg>

      <div className="cd-legend">
        <div className="cd-leg-item">
          <span className="cd-leg-sq" style={{ background: "#6366f1" }} />
          Active ({active})
        </div>
        <div className="cd-leg-item">
          <span className="cd-leg-sq" style={{ background: "#e2e8f0" }} />
          Inactive ({total - active})
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Flyer Card
───────────────────────────────────────────────────────────────── */
function FlyerCard({ flyer, delay }) {
  const [barW, setBarW] = useState(0);
  const prog = calcProgress(flyer.start_date, flyer.end_date);
  const isActive = flyer.is_active;

  useEffect(() => {
    const t = setTimeout(() => setBarW(prog), 350 + delay * 90);
    return () => clearTimeout(t);
  }, [prog, delay]);

  /* Wave colour for SVG fill – encode as %23 for data URI */
  const wfill = isActive ? "%23f5f3ff" : "%23f8fafc";
  const waveSrc = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 46' preserveAspectRatio='none'%3E%3Cpath d='M0,24 C66,46 133,4 200,24 C267,44 334,6 400,24 L400,46 L0,46 Z' fill='${wfill}'/%3E%3C/svg%3E`;

  return (
    <div
      className="cd-flyer cd-up"
      style={{ animationDelay: `${0.32 + delay * 0.09}s` }}
    >
      {/* Header */}
      <div className="cd-fcard-top">
        <div
          className="cd-fcard-icon"
          style={{ background: isActive ? "#f5f3ff" : "#f8fafc" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={isActive ? "#7c3aed" : "#94a3b8"} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <span className={`cd-pill ${isActive ? "cd-pill-active" : "cd-pill-inactive"}`}>
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Title + dates */}
      <div className="cd-ftitle">{flyer.title}</div>
      <div className="cd-fdates">
        <span>{fmtDate(flyer.start_date)}</span>
        <span className="cd-fdates-line" />
        <span>{fmtDate(flyer.end_date)}</span>
      </div>

      {/* Progress */}
      <div className="cd-prog-hd">
        <span>Campaign progress</span>
        <span style={{ color: isActive ? "#7c3aed" : "#94a3b8" }}>{prog}%</span>
      </div>
      <div className="cd-prog-track">
        <div
          className={`cd-prog-bar ${isActive ? "cd-prog-active" : "cd-prog-inactive"}`}
          style={{ width: `${barW}%` }}
        />
      </div>

      {/* Decorative wave */}
      <img className="cd-flyer-wave" src={waveSrc} alt="" aria-hidden="true" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Metric config
───────────────────────────────────────────────────────────────── */
const METRICS = [
  {
    label: "Total products", hint: "In catalogue",
    val: (d) => d.total_products_saved ?? d.total_products ?? 0,
    color: "#2563eb", iconBg: "#eff6ff", orb: "#3b82f6",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>,
  },
  {
    label: "Total flyers", hint: "All time",
    val: (d) => d.total_flyers ?? 0,
    color: "#7c3aed", iconBg: "#faf5ff", orb: "#7c3aed",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
    </svg>,
  },
  {
    label: "Active flyers", hint: "Running now",
    val: (_, fl) => fl.filter(f => f.is_active).length,
    color: "#059669", iconBg: "#ecfdf5", orb: "#10b981",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>,
  },
  {
    label: "Inactive flyers", hint: "Ended or paused",
    val: (_, fl) => fl.filter(f => !f.is_active).length,
    color: "#ea580c", iconBg: "#fff7ed", orb: "#f97316",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>,
  },
];

/* ─────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────── */
export default function CompanyDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getCompanyDashboard();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const flyers      = data?.flyers ?? [];
  const activeCount = flyers.filter(f => f.is_active).length;

  return (
    <CompanyLayout>
      <style>{STYLES}</style>

      <div className="cd">
        {/* Fixed wavy hero */}
        <div className="cd-hero" aria-hidden="true" />

        <div className="cd-inner">

          {loading ? (
            <div className="cd-loading" role="status" aria-live="polite">
              <div className="cd-spin" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Loading dashboard…</span>
            </div>
          ) : (
            <>
              {/* ── Top bar ── */}
              <div className="cd-topbar cd-up cd-d1">
                <div className="cd-brand">
                  <div className="cd-avatar" aria-hidden="true">
                    {/* {(data?.company ?? "?").slice(0, 2).toUpperCase()} */}
                    {data.profilePic ? (
                      <img src={getImageUrl(data.profilePic)} alt={data.fullName} />
                    ) : (
                      data.userInitials
                    )}
                  </div>
                  <div>
                    <div className="cd-co-name">{data?.company ?? "Company"}</div>
                    <div className="cd-co-sub">Analytics overview</div>
                  </div>
                </div>
                <div className="cd-date-pill">{todayStr()}</div>
              </div>

              {/* ── Metric cards ── */}
              <div className="cd-metrics cd-up cd-d2">
                {METRICS.map(m => (
                  <div className="cd-metric" key={m.label}>
                    <div className="cd-metric-orb" style={{ background: m.orb }} />
                    <div className="cd-metric-icon" style={{ background: m.iconBg }}>
                      {m.icon}
                    </div>
                    <div className="cd-metric-lbl">{m.label}</div>
                    <div className="cd-metric-num" style={{ color: m.color }}>
                      {m.val(data, flyers)}
                    </div>
                    <div className="cd-metric-hint">{m.hint}</div>
                  </div>
                ))}
              </div>

              {/* ── Summary + Donut ── */}
              <div className="cd-row2 cd-up cd-d4">
                <div className="cd-card">
                  <div className="cd-card-hd">Flyer overview</div>
                  {[
                    ["Total flyers",   data?.total_flyers ?? 0,                              false],
                    ["Active now",     activeCount,                                           true],
                    ["Inactive",       flyers.length - activeCount,                           false],
                    ["Products saved", data?.total_products_saved ?? data?.total_products ?? 0, false],
                    ["Flyers saved", data?.total_flyers_saved ?? data?.total_flyers_saved ?? 0, false],
                  ].map(([k, v, green]) => (
                    <div className="cd-row" key={k}>
                      <span className="cd-row-k">{k}</span>
                      <span className={`cd-row-v${green ? " green" : ""}`}>{v}</span>
                    </div>
                  ))}
                </div>

                <div className="cd-card" style={{ display: "flex", flexDirection: "column" }}>
                  <div className="cd-card-hd">Active vs inactive</div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <DonutChart active={activeCount} total={Math.max(flyers.length, 1)} />
                  </div>
                </div>
              </div>

              {/* ── Flyers ── */}
              <div className="cd-up cd-d5">
                <div className="cd-sec-hd">
                  <span className="cd-sec-title">All flyers</span>
                  <span className="cd-sec-badge">{flyers.length} total</span>
                </div>

                {flyers.length === 0 ? (
                  <div className="cd-empty">No flyers found.</div>
                ) : (
                  <div className="cd-flyers">
                    {flyers.map((f, i) => (
                      <FlyerCard key={f.id} flyer={f} delay={i} />
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