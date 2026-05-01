import { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import {
  fetchSavedProducts,
  toggleSaveProduct,
  requestProduct,
} from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";

/* ─────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────── */
const FONT   = "'DM Sans', sans-serif";
const FONT_D = "'Playfair Display', serif";

const C = {
  navy:    "#1c3560",
  blue:    "#1a56db",
  blueM:   "#3b82f6",
  blueLt:  "#eff6ff",
  blueMid: "#bfdbfe",
  amber:   "#d97706",
  red:     "#dc2626",
  redLt:   "#fff1f2",
  redBd:   "#fecdd3",
  green:   "#16a34a",
  greenLt: "#f0fdf4",
  greenBd: "#86efac",
  teal:    "#0d9488",
  tealLt:  "#f0fdfa",
  tealBd:  "#99f6e4",
  slate:   "#64748b",
  slateL:  "#94a3b8",
  border:  "#e2e8f0",
  bg:      "#f8fafc",
  card:    "#ffffff",
};

/* ─────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:wght@700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;} }
  @keyframes fadeIn    { from{opacity:0;}to{opacity:1;} }
  @keyframes shimmer   { 0%{background-position:-600px 0;}100%{background-position:600px 0;} }
  @keyframes floatY    { 0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);} }
  @keyframes waveDrift { to{transform:translateX(-50%);} }
  @keyframes spin      { to{transform:rotate(360deg);} }
  @keyframes pulseDot  { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(1.4);} }
  @keyframes slideOut  {
    from { opacity:1; max-height:120px; margin-bottom:10px; transform:translateX(0); }
    to   { opacity:0; max-height:0;     margin-bottom:0;    transform:translateX(24px); padding:0; }
  }
  @keyframes toastPop  { from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);} }
  @keyframes imgReveal { from{opacity:0;transform:scale(1.06);}to{opacity:1;transform:scale(1);} }

  .ms-page {
    font-family: ${FONT};
    background: ${C.bg};
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Hero ── */
  .ms-hero {
    position: relative;
    background: linear-gradient(135deg, ${C.navy} 0%, #123786 50%, #244ba0 100%);
    overflow: hidden;
  }
  .ms-hero-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
    background-size: 36px 36px;
  }
  .ms-orb {
    position: absolute; border-radius: 50%; pointer-events: none;
    animation: floatY 8s ease-in-out infinite;
  }
  .ms-wave {
    position: absolute; bottom: 0; left: 0;
    width: 200%; height: 52px; z-index: 1; pointer-events: none;
  }
  .ms-hero-body {
    position: relative; z-index: 2;
    max-width: 1080px; margin: 0 auto;
    padding: clamp(32px,5vw,60px) clamp(16px,5vw,40px) clamp(48px,7vw,76px);
  }
  .ms-eyebrow {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2);
    border-radius: 99px; padding: 4px 13px;
    font-size: 10.5px; font-weight: 700; letter-spacing: .07em;
    text-transform: uppercase; color: rgba(255,255,255,.85);
    margin-bottom: 14px; backdrop-filter: blur(8px);
    animation: fadeIn .4s ease both;
  }
  .ms-eyebrow-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #34d399; flex-shrink: 0;
    animation: pulseDot 1.7s ease-in-out infinite;
  }
  .ms-hero-title {
    font-family: ${FONT_D};
    font-size: clamp(24px,4.5vw,40px);
    font-weight: 900; color: #fff;
    line-height: 1.12; letter-spacing: -.025em;
    margin-bottom: 8px;
    animation: fadeUp .4s ease both .06s;
  }
  .ms-hero-title span {
    background: linear-gradient(90deg, #60a5fa 0%, #34d399 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .ms-hero-sub {
    color: rgba(255,255,255,.58); font-size: clamp(12.5px,1.8vw,14px);
    line-height: 1.65; max-width: 380px;
    animation: fadeUp .4s ease both .13s;
  }
  .ms-hero-pills {
    display: flex; flex-wrap: wrap; gap: 8px;
    margin-top: 20px; animation: fadeUp .4s ease both .2s;
  }
  .ms-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.1); backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,.17); border-radius: 99px;
    padding: 6px 14px; font-size: 12.5px; font-weight: 600; color: #fff;
    cursor: default; transition: background .2s;
  }
  .ms-pill:hover { background: rgba(255,255,255,.17); }
  .ms-pill-num { font-family: ${FONT_D}; font-size: 15px; font-weight: 700; color: #60a5fa; }

  /* ── Ads ── */
  .ms-ad-wrap { max-width: 1080px; margin: 0 auto; padding: 0 clamp(14px,4vw,24px); }
  .ms-ad-top  { margin-top: 20px; }
  .ms-ad-bot  { margin-top: 6px; padding-bottom: 40px; }
  .ms-ad {
    width: 100%; border-radius: 12px;
    background: repeating-linear-gradient(45deg,#f8fafc,#f8fafc 10px,#f1f5f9 10px,#f1f5f9 20px);
    border: 1.5px dashed #cbd5e1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 3px;
  }
  .ms-ad-lbl { font-size: 9px; font-weight: 800; letter-spacing: .1em; color: #94a3b8; text-transform: uppercase; }
  .ms-ad-sub { font-size: 11px; font-weight: 600; color: #cbd5e1; }
  .ms-ad-leader { height: 80px; max-width: 728px; margin: 0 auto; }
  .ms-ad-rect-wrap { display: flex; justify-content: center; margin: 2px 0; grid-column: 1 / -1; }
  .ms-ad-rect { height: 240px; max-width: 300px; width: 100%; }

  /* ── Content ── */
  .ms-content {
    max-width: 1080px; margin: 0 auto;
    padding: 20px clamp(14px,4vw,24px) 52px;
  }
  .ms-section-head {
    display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
  }
  .ms-section-title {
    font-family: ${FONT_D}; font-size: 15px; font-weight: 700;
    color: ${C.navy}; letter-spacing: -.015em; white-space: nowrap;
  }
  .ms-divider {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, ${C.blueMid}, transparent);
  }

  /* ── Grid: 2-col ≥640, 1-col below ── */
  .ms-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  /* ── Card ── */
  .ms-card {
    background: ${C.card};
    border-radius: 14px;
    border: 1.5px solid ${C.border};
    box-shadow: 0 1px 8px rgba(10,22,40,.05), 0 1px 2px rgba(0,0,0,.03);
    display: grid;
    grid-template-columns: 84px 1fr auto;
    align-items: stretch;
    overflow: hidden;
    transition:
      transform .26s cubic-bezier(.22,1,.36,1),
      box-shadow .26s cubic-bezier(.22,1,.36,1),
      border-color .22s;
    animation: fadeUp .36s cubic-bezier(.22,1,.36,1) both;
    position: relative;
    contain: layout style;
    will-change: transform;
    min-height: 84px;
  }
  .ms-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 32px rgba(26,86,219,.12), 0 2px 5px rgba(0,0,0,.05);
    border-color: ${C.blueMid};
  }
  .ms-card.removing {
    animation: slideOut .26s cubic-bezier(.22,1,.36,1) forwards;
    pointer-events: none;
  }
  /* left accent bar */
  .ms-card-bar {
    position: absolute; top: 0; left: 0; bottom: 0; width: 3px;
    background: linear-gradient(180deg, ${C.blue}, #06b6d4);
    border-radius: 14px 0 0 14px;
    opacity: 0; transition: opacity .22s;
  }
  .ms-card:hover .ms-card-bar { opacity: 1; }

  /* ── Image ── */
  .ms-img-cell {
    width: 84px; height: 84px;
    overflow: hidden; background: ${C.blueLt};
    position: relative; flex-shrink: 0;
  }
  .ms-img-cell img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transition: transform .42s cubic-bezier(.22,1,.36,1);
    opacity: 0;
  }
  .ms-img-cell img.loaded { animation: imgReveal .32s ease both; opacity: 1; }
  .ms-card:hover .ms-img-cell img { transform: scale(1.09); }
  .ms-img-ph {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    color: #93c5fd;
    background: linear-gradient(135deg, ${C.blueLt}, #ddeeff);
  }

  /* condition pill on image */
  .ms-cond {
    position: absolute; bottom: 4px; left: 4px;
    font-size: 8.5px; font-weight: 700; letter-spacing: .05em;
    text-transform: uppercase; border-radius: 4px;
    padding: 2px 5px; backdrop-filter: blur(6px); border: 1px solid;
    line-height: 1.4; pointer-events: none;
  }
  .ms-cond-new   { background:rgba(240,253,250,.92); color:#0d9488; border-color:#0d9488; }
  .ms-cond-used  { background:rgba(255,251,235,.92); color:${C.amber}; border-color:${C.amber}; }
  .ms-cond-refurb{ background:rgba(239,246,255,.92); color:${C.blue}; border-color:${C.blueM}; }

  /* ── Info ── */
  .ms-info {
    padding: 10px 8px 10px 12px;
    display: flex; flex-direction: column;
    justify-content: center; gap: 4px;
    min-width: 0;
  }
  .ms-card-title {
    font-family: ${FONT_D};
    font-size: 13.5px; font-weight: 700;
    color: ${C.navy}; line-height: 1.25;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    letter-spacing: -.01em;
  }
  .ms-card-price {
    font-family: ${FONT_D};
    font-size: 16px; font-weight: 900;
    color: ${C.blue}; line-height: 1; letter-spacing: -.03em;
  }
  .ms-card-price small {
    font-family: ${FONT}; font-size: 9.5px; font-weight: 600;
    color: ${C.slateL}; margin-right: 3px; letter-spacing: 0;
  }
  .ms-card-tags {
    display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
    margin-top: 1px;
  }
  .ms-city {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 10px; font-weight: 600; color: ${C.slate};
    background: ${C.bg}; border: 1px solid ${C.border};
    border-radius: 99px; padding: 2px 7px 2px 5px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 100px;
  }
  /* requested inline badge */
  .ms-req-badge {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 9.5px; font-weight: 700; letter-spacing: .04em;
    text-transform: uppercase;
    color: ${C.teal}; background: ${C.tealLt};
    border: 1px solid ${C.tealBd}; border-radius: 99px;
    padding: 2px 7px 2px 5px; white-space: nowrap;
  }

  /* ── Actions ── */
  .ms-actions {
    display: flex; flex-direction: column;
    align-items: stretch; gap: 5px;
    padding: 9px 10px 9px 7px;
    justify-content: center;
    flex-shrink: 0;
    border-left: 1px solid ${C.border};
  }
  .ms-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 4px;
    font-family: ${FONT}; font-size: 11.5px; font-weight: 700;
    border-radius: 8px; padding: 6px 10px;
    cursor: pointer; border: 1.5px solid; white-space: nowrap;
    outline: none; line-height: 1;
    transition:
      background .15s, color .15s, border-color .15s,
      transform .2s cubic-bezier(.22,1,.36,1), box-shadow .2s;
    will-change: transform;
  }
  .ms-btn:disabled { opacity: .5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
  .ms-btn svg { flex-shrink: 0; }

  .ms-btn-unsave {
    background: ${C.redLt}; color: ${C.red}; border-color: ${C.redBd};
    padding: 6px 8px;           /* icon-only, stays square */
  }
  .ms-btn-unsave:hover:not(:disabled) {
    background: #fee2e2; border-color: #fca5a5;
    transform: translateY(-1px); box-shadow: 0 3px 8px rgba(220,38,38,.16);
  }
  .ms-btn-request {
    background: linear-gradient(135deg, ${C.blue} 0%, ${C.blueM} 100%);
    color: #fff; border-color: transparent;
    box-shadow: 0 2px 7px rgba(26,86,219,.28);
  }
  .ms-btn-request:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(26,86,219,.36);
    filter: brightness(1.07);
  }
  .ms-btn-requested {
    background: ${C.tealLt}; color: ${C.teal};
    border-color: ${C.tealBd}; cursor: default;
  }

  /* ── Skeleton ── */
  .ms-skel {
    border-radius: 14px; overflow: hidden;
    background: ${C.card}; border: 1.5px solid ${C.border};
    display: grid; grid-template-columns: 84px 1fr;
    min-height: 84px;
  }
  .ms-skel-img { width: 84px; background: #f1f5f9; align-self: stretch; }
  .ms-skel-body {
    padding: 12px 14px; display: flex;
    flex-direction: column; justify-content: center; gap: 7px;
  }
  .ms-skel-line {
    border-radius: 4px; height: 10px;
    background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s linear infinite;
  }

  /* ── Empty ── */
  .ms-empty {
    grid-column: 1 / -1; text-align: center;
    padding: clamp(52px,8vw,84px) 24px;
    animation: fadeUp .4s ease both;
  }
  .ms-empty-icon {
    width: 70px; height: 70px; border-radius: 50%;
    background: ${C.blueLt}; border: 1.5px solid ${C.blueMid};
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px; color: ${C.blue};
    animation: floatY 4s ease-in-out infinite;
  }
  .ms-empty h3 {
    font-family: ${FONT_D}; font-size: clamp(16px,3.5vw,21px); font-weight: 700;
    color: ${C.navy}; margin-bottom: 7px; letter-spacing: -.02em;
  }
  .ms-empty p { color: ${C.slateL}; font-size: 13px; line-height: 1.6; max-width: 240px; margin: 0 auto; }

  /* ── Toast ── */
  .ms-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    z-index: 9999; pointer-events: none;
    display: flex; align-items: center; gap: 7px;
    padding: 10px 17px; border-radius: 10px;
    font-family: ${FONT}; font-size: 13px; font-weight: 600;
    box-shadow: 0 8px 28px rgba(0,0,0,.12); white-space: nowrap;
    animation: toastPop .26s cubic-bezier(.34,1.56,.64,1) both;
    background: ${C.greenLt}; border: 1.5px solid ${C.greenBd}; color: ${C.green};
  }
  .ms-toast.error { background:${C.redLt}; border-color:${C.redBd}; color:${C.red}; }

  /* ── Responsive ── */

  /* ≤900px — keep 2-col, tighten hero */
  @media (max-width: 900px) {
    .ms-hero-body { padding-bottom: clamp(52px,6vw,68px); }
  }

  /* ≤639px — 1-col grid, slightly smaller image */
  @media (max-width: 639px) {
    .ms-grid { grid-template-columns: 1fr; gap: 8px; }
    .ms-content { padding: 14px 12px 40px; }
    .ms-card { grid-template-columns: 76px 1fr auto; min-height: 76px; }
    .ms-img-cell { width: 76px; height: 76px; }
    .ms-skel { grid-template-columns: 76px 1fr; min-height: 76px; }
    .ms-skel-img { width: 76px; }
    .ms-card-title { font-size: 13px; }
    .ms-card-price { font-size: 15px; }
    .ms-info { padding: 9px 7px 9px 11px; }
    .ms-actions { padding: 8px 9px 8px 6px; gap: 5px; }
    .ms-btn { font-size: 11px; padding: 5px 9px; }
    .ms-btn-unsave { padding: 5px 7px; }
  }

  /* ≤479px — compact, hide button text labels */
  @media (max-width: 479px) {
    .ms-hero-body { padding: 22px 14px 60px; }
    .ms-ad-leader { height: 50px; }
    .ms-card { grid-template-columns: 68px 1fr auto; min-height: 68px; border-radius: 12px; }
    .ms-img-cell { width: 68px; height: 68px; }
    .ms-skel { grid-template-columns: 68px 1fr; min-height: 68px; border-radius: 12px; }
    .ms-skel-img { width: 68px; }
    .ms-card-title { font-size: 12.5px; }
    .ms-card-price { font-size: 14px; }
    .ms-info { padding: 8px 6px 8px 10px; gap: 3px; }
    .ms-actions { padding: 7px 8px 7px 5px; border-left: none; border-top: 1px solid ${C.border}; }
    /* stack actions into a row at very small sizes */
    .ms-card { grid-template-columns: 68px 1fr; grid-template-rows: 1fr auto; }
    .ms-actions { grid-column: 1 / -1; flex-direction: row; }
    .ms-btn-label { display: none; }
    .ms-btn { padding: 7px; border-radius: 7px; }
    .ms-btn-unsave { padding: 7px; }
  }

  /* ≤360px */
  @media (max-width: 360px) {
    .ms-card { grid-template-columns: 60px 1fr; }
    .ms-img-cell { width: 60px; height: 60px; }
    .ms-skel-img { width: 60px; }
    .ms-card-price { font-size: 13.5px; }
  }
`;

/* ─────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────── */
const IC = {
  Bookmark:    ({ s=12 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  BookmarkFill:({ s=14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  MapPin:      ({ s=10 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Trash:       ({ s=14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Send:        ({ s=12 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Loader:      ({ s=12 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{animation:"spin .75s linear infinite"}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  Check:       ({ s=14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  CheckCircle: ({ s=10 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Alert:       ({ s=14 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Bag:         ({ s=28 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Image:       ({ s=26 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
};

/* ─────────────────────────────────────────────────
   LAZY IMAGE
───────────────────────────────────────────────── */
const LazyImage = memo(function LazyImage({ src, alt }) {
  const ref                   = useRef(null);
  const [visible, setVisible] = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!src) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { rootMargin: "180px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  return (
    <div className="ms-img-cell" ref={ref}>
      {visible && src && !errored && (
        <img
          src={src} alt={alt}
          className={loaded ? "loaded" : ""}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          decoding="async" loading="lazy"
        />
      )}
      {(!loaded || !src || errored) && (
        <div className="ms-img-ph" aria-hidden><IC.Image s={26} /></div>
      )}
    </div>
  );
});

/* ─────────────────────────────────────────────────
   CONDITION BADGE
───────────────────────────────────────────────── */
const COND_MAP = {
  new:         { label: "New",    cls: "ms-cond-new"    },
  used:        { label: "Used",   cls: "ms-cond-used"   },
  refurbished: { label: "Refurb", cls: "ms-cond-refurb" },
};
function CondBadge({ condition }) {
  if (!condition) return null;
  const c = COND_MAP[condition.toLowerCase()] ?? { label: condition, cls: "ms-cond-used" };
  return <span className={`ms-cond ${c.cls}`}>{c.label}</span>;
}

/* ─────────────────────────────────────────────────
   AD SLOTS
───────────────────────────────────────────────── */
const AdLeader = memo(({ id }) => (
  <div className="ms-ad ms-ad-leader" id={id} aria-label="Advertisement">
    <span className="ms-ad-lbl">Advertisement</span>
    <span className="ms-ad-sub">728 × 90</span>
  </div>
));
const AdRect = memo(({ id }) => (
  <div className="ms-ad-rect-wrap">
    <div className="ms-ad ms-ad-rect" id={id} aria-label="Advertisement">
      <span className="ms-ad-lbl">Advertisement</span>
      <span className="ms-ad-sub">300 × 250</span>
    </div>
  </div>
));

/* ─────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────── */
const Toast = memo(function Toast({ message, visible, type }) {
  if (!visible) return null;
  return (
    <div className={`ms-toast${type === "error" ? " error" : ""}`} role="status" aria-live="polite">
      {type === "error" ? <IC.Alert s={14} /> : <IC.Check s={14} />}
      {message}
    </div>
  );
});

/* ─────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────── */
const Skeleton = memo(({ delay = 0 }) => (
  <div className="ms-skel" style={{ animationDelay: `${delay}ms` }}>
    <div className="ms-skel-img" />
    <div className="ms-skel-body">
      <div className="ms-skel-line" style={{ width: "58%", animationDelay: `${delay+60}ms` }} />
      <div className="ms-skel-line" style={{ width: "34%", height: "13px", animationDelay: `${delay+110}ms` }} />
      <div className="ms-skel-line" style={{ width: "42%", animationDelay: `${delay+160}ms` }} />
    </div>
  </div>
));

/* ─────────────────────────────────────────────────
   PRODUCT CARD
───────────────────────────────────────────────── */
const ProductCard = memo(function ProductCard({
  product, requested, onUnsave, onRequest, delay,
}) {
  const [removing, setRemoving] = useState(false);
  const [sending,  setSending]  = useState(false);

  const handleUnsave = useCallback(() => {
    setRemoving(true);
    setTimeout(() => onUnsave(product.product_id), 260);
  }, [onUnsave, product.product_id]);

  const handleRequest = useCallback(async () => {
    if (requested || sending) return;
    setSending(true);
    await onRequest(product.product_id);
    setSending(false);
  }, [requested, sending, onRequest, product.product_id]);

  const price = useMemo(
    () => Number(product.price).toLocaleString("en-QA"),
    [product.price]
  );

  return (
    <article
      className={`ms-card${removing ? " removing" : ""}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="ms-card-bar" aria-hidden />

      {/* Image + condition */}
      <div style={{ position: "relative" }}>
        <LazyImage src={product.image} alt={product.title} />
        <CondBadge condition={product.condition} />
      </div>

      {/* Info */}
      <div className="ms-info">
        <h3 className="ms-card-title" title={product.title}>{product.title}</h3>
        <p className="ms-card-price">
          <small>QAR</small>{price}
        </p>
        <div className="ms-card-tags">
          {product.city && (
            <span className="ms-city">
              <IC.MapPin s={10} />{product.city}
            </span>
          )}
          {requested && (
            <span className="ms-req-badge">
              <IC.CheckCircle s={9} />Requested
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="ms-actions">
        <button
          className="ms-btn ms-btn-unsave"
          onClick={handleUnsave}
          disabled={removing}
          aria-label={`Remove ${product.title} from saved`}
          title="Remove from saved"
        >
          <IC.Trash s={14} />
        </button>
        <button
          className={`ms-btn ${requested ? "ms-btn-requested" : "ms-btn-request"}`}
          onClick={handleRequest}
          disabled={requested || sending || removing}
          aria-label={requested ? "Already requested" : `Request ${product.title}`}
          title={requested ? "Request already sent" : "Send request"}
        >
          {sending
            ? <><IC.Loader s={12} /><span className="ms-btn-label">Sending</span></>
            : requested
              ? <><IC.CheckCircle s={11} /><span className="ms-btn-label">Requested</span></>
              : <><IC.Send s={12} /><span className="ms-btn-label">Request</span></>
          }
        </button>
      </div>
    </article>
  );
});

/* ─────────────────────────────────────────────────
   MAIN
───────────────────────────────────────────────── */
export default function MarketplaceSaved() {
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [requestedIds, setRequestedIds] = useState(() => new Set());
  const [toast,        setToast]        = useState({ message: "", visible: false, type: "success" });
  const toastTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchSavedProducts();
        if (!cancelled) setItems(res.data?.data ?? res.data ?? []);
      } catch {
        if (!cancelled) showToast("Failed to load saved items", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = useCallback((msg, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message: msg, visible: true, type });
    toastTimer.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      2600
    );
  }, []);

  const handleUnsave = useCallback(async (id) => {
    try {
      await toggleSaveProduct(id);
      setItems(prev => prev.filter(p => p.product_id !== id));
      setRequestedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      showToast("Removed from saved");
    } catch {
      showToast("Could not remove item", "error");
    }
  }, [showToast]);

  const handleRequest = useCallback(async (id) => {
    try {
      await requestProduct(id);
      setRequestedIds(prev => new Set(prev).add(id));
      showToast("Request sent successfully");
    } catch {
      showToast("Request failed — please try again", "error");
    }
  }, [showToast]);

  /* interleave rect ads every 8 cards */
  const renderedItems = useMemo(() => {
    const out = [];
    items.forEach((p, i) => {
      out.push(
        <ProductCard
          key={p.product_id ?? p.id}
          product={p}
          requested={requestedIds.has(p.product_id)}
          onUnsave={handleUnsave}
          onRequest={handleRequest}
          delay={Math.min(i * 40, 220)}
        />
      );
      if ((i + 1) % 8 === 0 && i + 1 < items.length) {
        out.push(<AdRect key={`rect-${i}`} id={`ad-rect-${i}`} />);
      }
    });
    return out;
  }, [items, requestedIds, handleUnsave, handleRequest]);

  const count = items.length;

  return (
    <MarketplaceLayout>
      <style>{STYLES}</style>
      <div className="ms-page">

        {/* Hero */}
        <header className="ms-hero">
          <div className="ms-hero-grid" aria-hidden />
          <div className="ms-orb" aria-hidden style={{ width:220,height:220,top:"-70px",right:"-45px",background:"rgba(96,165,250,.07)",animationDelay:"0s" }} />
          <div className="ms-orb" aria-hidden style={{ width:110,height:110,bottom:"2px",left:"50px",background:"rgba(52,211,153,.06)",animationDelay:"2.5s" }} />
          <div className="ms-orb" aria-hidden style={{ width:65,height:65,top:"40px",left:"40%",background:"rgba(255,255,255,.04)",animationDelay:"4.5s" }} />
          <svg className="ms-wave" viewBox="0 0 1440 52" preserveAspectRatio="none" aria-hidden>
            <path d="M0,26 C240,49 480,3 720,26 C960,49 1200,3 1440,26 C1680,49 1920,3 2160,26 L2160,52 L0,52 Z"
              fill={C.bg} style={{ animation: "waveDrift 10s linear infinite" }} />
            <path d="M0,38 C300,14 600,50 900,33 C1200,16 1500,48 1800,31 L2160,35 L2160,52 L0,52 Z"
              fill={C.blueLt} opacity=".65" style={{ animation: "waveDrift 14s linear infinite reverse" }} />
          </svg>

          <div className="ms-hero-body">
            <div className="ms-eyebrow">
              <span className="ms-eyebrow-dot" aria-hidden />
              <IC.Bookmark s={11} />
              Wishlist
            </div>
            <h1 className="ms-hero-title">Saved <span>Products</span></h1>
            <p className="ms-hero-sub">Items you have bookmarked — ready whenever you are.</p>
            {!loading && (
              <div className="ms-hero-pills">
                <div className="ms-pill">
                  <IC.BookmarkFill s={13} />
                  <span className="ms-pill-num">{count}</span>
                  {count === 1 ? "item" : "items"} saved
                </div>
                {requestedIds.size > 0 && (
                  <div className="ms-pill">
                    <IC.CheckCircle s={13} />
                    <span className="ms-pill-num">{requestedIds.size}</span>
                    {requestedIds.size === 1 ? "request" : "requests"} sent
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Top ad */}
        <div className="ms-ad-wrap ms-ad-top">
          <AdLeader id="ad-top" />
        </div>

        {/* List */}
        <main className="ms-content">
          {!loading && count > 0 && (
            <div className="ms-section-head">
              <h2 className="ms-section-title">Your collection</h2>
              <div className="ms-divider" aria-hidden />
            </div>
          )}
          {loading ? (
            <div className="ms-grid">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} delay={i * 85} />)}
            </div>
          ) : count === 0 ? (
            <div className="ms-grid">
              <div className="ms-empty">
                <div className="ms-empty-icon"><IC.Bag s={28} /></div>
                <h3>Nothing saved yet</h3>
                <p>Browse the marketplace and bookmark items you love.</p>
              </div>
            </div>
          ) : (
            <div className="ms-grid">{renderedItems}</div>
          )}
        </main>

        {/* Bottom ad */}
        {!loading && count > 0 && (
          <div className="ms-ad-wrap ms-ad-bot">
            <AdLeader id="ad-bot" />
          </div>
        )}
      </div>

      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </MarketplaceLayout>
  );
}