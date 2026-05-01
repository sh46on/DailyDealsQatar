import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { createFlyer } from "./api/companyApi";
import CompanyLayout from "../CompaniesComponent/CompanyLayout"
// const CompanyLayout = lazy(() => import("../CompaniesComponent/CompanyLayout"));

/* ─────────────────────────────────────────────────────────────────
   Global styles — mirrors CompanyDashboard palette & motifs
───────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Bricolage+Grotesque:wght@600;700;800&display=swap');

  .af * { box-sizing: border-box; margin: 0; padding: 0; }

  .af {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f5f7ff;
    min-height: 100vh;
    padding: 2rem 1.5rem 3rem;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Gradient hero ── */
  .af-hero {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 320px;
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 52%, #7c3aed 100%);
    z-index: 0;
    pointer-events: none;
  }
  .af-hero::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0; right: 0; height: 80px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 80' preserveAspectRatio='none'%3E%3Cpath d='M0,36 C360,80 720,0 1080,36 C1260,54 1360,20 1440,36 L1440,80 L0,80 Z' fill='%23f5f7ff'/%3E%3C/svg%3E") center bottom / 100% 100% no-repeat;
  }

  .af-inner {
    position: relative; z-index: 1;
    max-width: 620px; margin: 0 auto;
  }

  /* ── Top bar ── */
  .af-topbar {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 2.4rem;
  }
  .af-back-btn {
    width: 38px; height: 38px; border-radius: 12px;
    background: rgba(255,255,255,0.16);
    border: 1.5px solid rgba(255,255,255,0.28);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .2s;
    flex-shrink: 0;
  }
  .af-back-btn:hover { background: rgba(255,255,255,0.26); }
  .af-page-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.02em;
  }
  .af-page-sub { font-size: 12px; color: rgba(255,255,255,0.65); margin-top: 2px; }

  /* ── Card ── */
  .af-card {
    background: #fff;
    border-radius: 22px;
    border: 1.5px solid rgba(99,102,241,0.09);
    box-shadow: 0 4px 28px rgba(79,70,229,0.09), 0 1px 4px rgba(0,0,0,0.04);
    padding: 2rem 2rem 2.2rem;
    position: relative;
    overflow: hidden;
  }
  .af-card-wave {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 56px; pointer-events: none;
    width: 100%; display: block;
  }

  /* ── Card section header ── */
  .af-card-hd {
    font-size: 10.5px; font-weight: 700; letter-spacing: .09em;
    text-transform: uppercase; color: #94a3b8; margin-bottom: 1.4rem;
  }

  /* ── Form field ── */
  .af-field { margin-bottom: 1.3rem; }
  .af-label {
    display: block; font-size: 12.5px; font-weight: 600;
    color: #475569; margin-bottom: 7px; letter-spacing: .01em;
  }
  .af-required { color: #7c3aed; margin-left: 2px; }

  .af-input {
    width: 100%; height: 46px;
    background: #f8faff;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 0 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13.5px; color: #1e293b;
    outline: none;
    transition: border-color .22s, box-shadow .22s, background .22s;
    -webkit-appearance: none;
  }
  .af-input:focus {
    border-color: #6366f1;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
  }
  .af-input::placeholder { color: #c0c7d4; }
  .af-input.af-input-error {
    border-color: #f87171;
    box-shadow: 0 0 0 3px rgba(248,113,113,0.12);
  }

  /* ── Date row ── */
  .af-date-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 480px) { .af-date-row { grid-template-columns: 1fr; } }

  /* ── Toggle switch ── */
  .af-toggle-wrap {
    display: flex; align-items: center; justify-content: space-between;
    background: #f8faff; border: 1.5px solid #e2e8f0;
    border-radius: 14px; padding: 13px 16px;
    cursor: pointer; transition: border-color .22s, background .22s;
    user-select: none;
  }
  .af-toggle-wrap:hover { border-color: #c4b5fd; background: #faf8ff; }
  .af-toggle-wrap.active { border-color: #a5b4fc; background: #faf8ff; }
  .af-toggle-info { display: flex; align-items: center; gap: 11px; }
  .af-toggle-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    transition: background .25s;
  }
  .af-toggle-title { font-size: 13.5px; font-weight: 600; color: #1e293b; }
  .af-toggle-sub { font-size: 11.5px; color: #94a3b8; margin-top: 2px; }
  .af-switch {
    width: 44px; height: 24px; border-radius: 12px;
    position: relative; flex-shrink: 0;
    transition: background .28s cubic-bezier(.22,1,.36,1);
  }
  .af-switch::after {
    content: '';
    position: absolute; top: 3px; left: 3px;
    width: 18px; height: 18px; border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.14);
    transition: transform .28s cubic-bezier(.22,1,.36,1);
  }
  .af-switch.on { background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%); }
  .af-switch.off { background: #e2e8f0; }
  .af-switch.on::after { transform: translateX(20px); }

  /* ── Drop zone ── */
  .af-drop {
    border: 2px dashed #c4b5fd;
    border-radius: 16px;
    padding: 2.4rem 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: border-color .25s, background .25s, transform .25s;
    background: #faf8ff;
    position: relative;
    overflow: hidden;
  }
  .af-drop:hover, .af-drop.dragover {
    border-color: #7c3aed;
    background: #f5f0ff;
    transform: scale(1.01);
  }
  .af-drop.has-file {
    border-color: #a5b4fc;
    background: #f0f0ff;
  }
  .af-drop input[type="file"] {
    position: absolute; inset: 0; opacity: 0; cursor: pointer;
  }
  .af-drop-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: #ede9fe; margin: 0 auto 14px;
    display: flex; align-items: center; justify-content: center;
  }
  .af-drop-title { font-size: 14px; font-weight: 700; color: #4c1d95; margin-bottom: 5px; }
  .af-drop-sub { font-size: 12px; color: #94a3b8; }
  .af-drop-sub span { color: #6366f1; font-weight: 600; }
  .af-drop-file-name {
    font-size: 13px; font-weight: 600; color: #4f46e5;
    margin-top: 10px; display: flex; align-items: center;
    justify-content: center; gap: 7px;
  }
  .af-drop-size { font-size: 11px; color: #94a3b8; font-weight: 400; }
  .af-drop-clear {
    width: 22px; height: 22px; border-radius: 50%;
    background: #f1f5f9; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .2s; flex-shrink: 0;
    padding: 0;
  }
  .af-drop-clear:hover { background: #fee2e2; }

  /* ── Error hint ── */
  .af-err { font-size: 11.5px; color: #ef4444; margin-top: 5px; font-weight: 500; display: flex; align-items: center; gap: 5px; }

  /* ── Submit button ── */
  .af-btn {
    width: 100%; height: 52px;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border: none; border-radius: 14px;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 16px; font-weight: 800; color: #fff;
    cursor: pointer; letter-spacing: -0.01em;
    display: flex; align-items: center; justify-content: center; gap: 9px;
    transition: transform .24s cubic-bezier(.22,1,.36,1), box-shadow .24s, opacity .2s;
    box-shadow: 0 4px 18px rgba(99,102,241,0.32);
    margin-top: 1.5rem;
    position: relative; overflow: hidden;
  }
  .af-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%);
    pointer-events: none;
  }
  .af-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(99,102,241,0.42);
  }
  .af-btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }
  .af-btn:disabled { opacity: 0.65; cursor: not-allowed; }

  /* ── Spinner ── */
  .af-btn-spin {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: af-spin .65s linear infinite;
    flex-shrink: 0;
  }

  /* ── Toast ── */
  .af-toast-wrap {
    position: fixed; bottom: 28px; left: 50%;
    transform: translateX(-50%) translateY(80px);
    z-index: 9999;
    transition: transform .42s cubic-bezier(.22,1,.36,1), opacity .42s;
    opacity: 0; pointer-events: none;
  }
  .af-toast-wrap.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1; pointer-events: auto;
  }
  .af-toast {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 20px; border-radius: 16px;
    font-size: 13.5px; font-weight: 600; color: #fff;
    box-shadow: 0 8px 28px rgba(0,0,0,0.22);
    backdrop-filter: blur(8px);
    min-width: 240px; max-width: 88vw;
    white-space: nowrap;
  }
  .af-toast.success { background: linear-gradient(135deg, #059669 0%, #0d9488 100%); }
  .af-toast.error   { background: linear-gradient(135deg, #dc2626 0%, #be185d 100%); }
  .af-toast.warn    { background: linear-gradient(135deg, #d97706 0%, #dc2626 100%); }
  .af-toast-icon {
    width: 26px; height: 26px; border-radius: 8px;
    background: rgba(255,255,255,0.22);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .af-toast-close {
    margin-left: auto; width: 22px; height: 22px;
    border-radius: 7px; background: rgba(255,255,255,0.18);
    border: none; cursor: pointer; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; transition: background .18s; flex-shrink: 0;
  }
  .af-toast-close:hover { background: rgba(255,255,255,0.32); }
  .af-toast-bar {
    position: absolute; bottom: 0; left: 0; height: 3px;
    border-radius: 0 0 16px 16px;
    background: rgba(255,255,255,0.4);
    animation: af-shrink 3.2s linear forwards;
  }
  @keyframes af-shrink { from { width: 100%; } to { width: 0%; } }

  /* ── Animations ── */
  @keyframes af-spin { to { transform: rotate(360deg); } }
  @keyframes af-up {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .af-up { animation: af-up .5s cubic-bezier(.22,1,.36,1) both; }
  .af-d1 { animation-delay: .06s; }
  .af-d2 { animation-delay: .14s; }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .af { padding: 1.2rem 1rem 2.5rem; }
    .af-card { padding: 1.4rem 1.2rem 1.8rem; }
    .af-page-title { font-size: 18px; }
  }
  @media (min-width: 768px) {
    .af { padding: 2.2rem 2.5rem 3.5rem; }
  }

  /* ═══════════════════════════════════════════════════════════════
     PUBLISH LOADER OVERLAY
  ═══════════════════════════════════════════════════════════════ */
  .afl-overlay {
    position: fixed; inset: 0; z-index: 8000;
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    animation: afl-fade-in .3s ease both;
  }
  .afl-backdrop {
    position: absolute; inset: 0;
    background: rgba(15, 12, 41, 0.72);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  /* Orbiting particles */
  .afl-orbit {
    position: absolute; inset: 0; pointer-events: none;
    overflow: hidden;
  }
  .afl-particle {
    position: absolute; border-radius: 50%;
    animation: afl-drift linear infinite;
    opacity: 0;
  }
  @keyframes afl-drift {
    0%   { opacity: 0; transform: translateY(100vh) scale(0.4) rotate(0deg); }
    10%  { opacity: 1; }
    90%  { opacity: 0.6; }
    100% { opacity: 0; transform: translateY(-20vh) scale(1.1) rotate(360deg); }
  }

  /* Card */
  .afl-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 380px;
    background: #ffffff;
    border-radius: 28px;
    padding: 2.4rem 2rem 2rem;
    box-shadow: 0 32px 80px rgba(0,0,0,0.36), 0 2px 8px rgba(0,0,0,0.12);
    animation: afl-card-in .42s cubic-bezier(.22,1,.36,1) both;
    overflow: hidden;
    text-align: center;
  }
  @keyframes afl-card-in {
    from { opacity: 0; transform: translateY(28px) scale(0.94); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Card shimmer sweep */
  .afl-card::before {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.07), transparent);
    animation: afl-shimmer 2.2s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes afl-shimmer {
    0%   { left: -100%; }
    100% { left: 160%; }
  }

  /* Icon stage */
  .afl-icon-stage {
    width: 88px; height: 88px; border-radius: 24px;
    margin: 0 auto 1.5rem;
    background: linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%);
    display: flex; align-items: center; justify-content: center;
    position: relative;
    animation: afl-pulse-ring 1.8s ease-in-out infinite;
  }
  @keyframes afl-pulse-ring {
    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.28); }
    50%       { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
  }

  /* Floating document SVG */
  .afl-doc {
    animation: afl-float 2.4s ease-in-out infinite;
    transform-origin: center;
  }
  @keyframes afl-float {
    0%, 100% { transform: translateY(0px) rotate(-2deg); }
    50%       { transform: translateY(-7px) rotate(2deg); }
  }

  /* Sparkles around icon */
  .afl-sparkle {
    position: absolute;
    width: 6px; height: 6px; border-radius: 50%;
    background: #7c3aed;
    animation: afl-sparkle-pop 1.6s ease-in-out infinite;
    opacity: 0;
  }
  .afl-sparkle:nth-child(1) { top: 8px;  left: 18px;  animation-delay: 0s;    background: #6366f1; }
  .afl-sparkle:nth-child(2) { top: 12px; right: 14px; animation-delay: .4s;   background: #a78bfa; }
  .afl-sparkle:nth-child(3) { bottom: 10px; left: 14px; animation-delay: .8s; background: #818cf8; }
  .afl-sparkle:nth-child(4) { bottom: 8px; right: 18px; animation-delay: 1.2s; background: #7c3aed; }
  @keyframes afl-sparkle-pop {
    0%         { opacity: 0; transform: scale(0) rotate(0deg); }
    30%        { opacity: 1; transform: scale(1.4) rotate(90deg); }
    60%, 100%  { opacity: 0; transform: scale(0) rotate(180deg); }
  }

  /* Title */
  .afl-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 20px; font-weight: 800;
    color: #1e293b; letter-spacing: -0.02em;
    margin-bottom: 4px;
  }
  .afl-subtitle {
    font-size: 12.5px; color: #94a3b8;
    font-weight: 500; margin-bottom: 1.8rem;
    min-height: 18px;
    transition: opacity .3s;
  }

  /* Progress bar */
  .afl-bar-wrap {
    height: 6px; background: #f1f5f9;
    border-radius: 999px; overflow: hidden;
    margin-bottom: 1.6rem;
  }
  .afl-bar-fill {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, #6366f1, #7c3aed, #a78bfa);
    background-size: 200% 100%;
    transition: width .65s cubic-bezier(.22,1,.36,1);
    animation: afl-bar-flow 1.8s linear infinite;
  }
  @keyframes afl-bar-flow {
    0%   { background-position: 0% 0%; }
    100% { background-position: -200% 0%; }
  }

  /* Steps */
  .afl-steps {
    display: flex; flex-direction: column;
    gap: 10px; text-align: left;
  }
  .afl-step {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 13px; border-radius: 12px;
    transition: background .3s, transform .3s;
    background: transparent;
  }
  .afl-step.active {
    background: #f5f3ff;
    transform: translateX(3px);
  }
  .afl-step.done {
    background: #f0fdf4;
  }
  .afl-step-dot {
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background .3s, border-color .3s;
    border: 2px solid #e2e8f0;
    background: #f8faff;
  }
  .afl-step.active .afl-step-dot {
    border-color: #7c3aed;
    background: #ede9fe;
    animation: afl-step-pulse .9s ease-in-out infinite;
  }
  .afl-step.done .afl-step-dot {
    border-color: #059669;
    background: #d1fae5;
  }
  @keyframes afl-step-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.3); }
    50%       { box-shadow: 0 0 0 5px rgba(124,58,237,0); }
  }
  .afl-step-spin {
    width: 13px; height: 13px;
    border: 2px solid rgba(124,58,237,0.25);
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: af-spin .7s linear infinite;
  }
  .afl-step-label {
    font-size: 13px; font-weight: 600;
    transition: color .3s;
  }
  .afl-step.pending  .afl-step-label { color: #cbd5e1; }
  .afl-step.active   .afl-step-label { color: #4c1d95; }
  .afl-step.done     .afl-step-label { color: #065f46; }
  .afl-step-sub {
    font-size: 11px; color: #94a3b8; margin-top: 1px; font-weight: 400;
  }
  .afl-step.active .afl-step-sub { color: #a78bfa; }
  .afl-step.done   .afl-step-sub { color: #6ee7b7; }

  @keyframes afl-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  @media (max-width: 420px) {
    .afl-card { padding: 2rem 1.4rem 1.6rem; max-width: 340px; }
    .afl-title { font-size: 17px; }
    .afl-icon-stage { width: 72px; height: 72px; border-radius: 20px; }
  }
`;

/* ─────────────────────────────────────────────────────────────────
   Loader Steps config
───────────────────────────────────────────────────────────────── */
const LOADER_STEPS = [
  { label: "Validating details",  sub: "Checking form fields…",      pct: 28  },
  { label: "Uploading PDF",       sub: "Sending file to server…",    pct: 62  },
  { label: "Publishing flyer",    sub: "Making it live…",            pct: 88  },
  { label: "All done!",           sub: "Flyer published successfully", pct: 100 },
];

/* SVG check icon */
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="#059669" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* Floating particles data — defined once outside renders */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  size:  4 + (i % 5) * 3,
  left:  `${5 + (i * 7) % 90}%`,
  dur:   `${5 + (i % 4) * 1.5}s`,
  delay: `${(i * 0.4) % 3.6}s`,
  color: ["#a78bfa","#818cf8","#c4b5fd","#6366f1","#7c3aed"][i % 5],
}));

/* ─────────────────────────────────────────────────────────────────
   FlyerLoader — creative publish overlay
───────────────────────────────────────────────────────────────── */
function FlyerLoader({ step }) {
  const pct = LOADER_STEPS[step]?.pct ?? 0;

  return (
    <div className="afl-overlay" role="dialog" aria-modal="true" aria-label="Publishing flyer">
      <div className="afl-backdrop" aria-hidden="true" />

      {/* Drifting background particles */}
      <div className="afl-orbit" aria-hidden="true">
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="afl-particle"
            style={{
              width: p.size, height: p.size,
              left: p.left, bottom: "-10%",
              background: p.color,
              animationDuration: p.dur,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      <div className="afl-card">
        {/* Floating document icon with sparkles */}
        <div className="afl-icon-stage" aria-hidden="true">
          <div className="afl-sparkle" />
          <div className="afl-sparkle" />
          <div className="afl-sparkle" />
          <div className="afl-sparkle" />
          <svg className="afl-doc" width="44" height="44" viewBox="0 0 24 24"
            fill="none" stroke="#7c3aed" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              fill="#ede9fe" stroke="#7c3aed" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        <div className="afl-title">Publishing Flyer</div>
        <div className="afl-subtitle">{LOADER_STEPS[step]?.sub}</div>

        {/* Progress bar */}
        <div className="afl-bar-wrap" role="progressbar"
          aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="afl-bar-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* Steps list */}
        <div className="afl-steps">
          {LOADER_STEPS.slice(0, 3).map((s, i) => {
            const state = i < step ? "done" : i === step ? "active" : "pending";
            return (
              <div key={i} className={`afl-step ${state}`}>
                <div className="afl-step-dot">
                  {state === "done"   && <CheckIcon />}
                  {state === "active" && <div className="afl-step-spin" />}
                  {state === "pending" && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="afl-step-label">{s.label}</div>
                  <div className="afl-step-sub">{s.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Toast component
───────────────────────────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  return (
    <div className={`af-toast-wrap ${toast.visible ? "show" : ""}`} role="alert" aria-live="assertive">
      <div className={`af-toast ${toast.type}`} style={{ position: "relative", overflow: "hidden" }}>
        <div className="af-toast-icon" aria-hidden="true">
          {toast.type === "success" && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
          {toast.type === "warn" && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </div>
        <span>{toast.message}</span>
        <button className="af-toast-close" onClick={onClose} aria-label="Close notification">×</button>
        {toast.visible && <div className="af-toast-bar" key={toast.key} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */
function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function validate(form) {
  const errs = {};
  if (!form.title.trim()) errs.title = "Title is required";
  if (!form.start_date)   errs.start_date = "Pick a start date";
  if (!form.end_date)     errs.end_date = "Pick an end date";
  if (!form.category_type) errs.category_type = "Please select a category";
  if (form.start_date && form.end_date && form.end_date <= form.start_date)
    errs.end_date = "End date must be after start date";
  if (!form.pdf)          errs.pdf = "Please upload a PDF file";
  return errs;
}

/* ─────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────── */
export default function AddFlyer() {
  const [form, setForm] = useState({
    title: "", pdf: null, start_date: "", end_date: "", is_active: true, category_type: "",
  });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [loaderStep, setLoaderStep] = useState(0);
  const [drag, setDrag]         = useState(false);
  const [toast, setToast]       = useState({ visible: false, type: "success", message: "", key: 0 });
  const toastTimer  = useRef(null);
  const stepTimer   = useRef(null);

  /* ── toast helper ── */
  const showToast = useCallback((type, message) => {
    clearTimeout(toastTimer.current);
    setToast(t => ({ visible: true, type, message, key: t.key + 1 }));
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), 3400);
  }, []);

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    clearTimeout(stepTimer.current);
  }, []);

  /* ── field change ── */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: undefined }));
  }, []);

  /* ── toggle active ── */
  const toggleActive = useCallback(() => setForm(f => ({ ...f, is_active: !f.is_active })), []);

  /* ── file pick / drop ── */
  const applyFile = useCallback((file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      showToast("warn", "Only PDF files are accepted");
      return;
    }
    setForm(f => ({ ...f, pdf: file }));
    setErrors(er => ({ ...er, pdf: undefined }));
  }, [showToast]);

  const handleFile    = useCallback((e) => applyFile(e.target.files[0]), [applyFile]);
  const handleDrop    = useCallback((e) => { e.preventDefault(); setDrag(false); applyFile(e.dataTransfer.files[0]); }, [applyFile]);
  const handleDragOver = useCallback((e) => { e.preventDefault(); setDrag(true); }, []);
  const removePdf     = useCallback((e) => { e.stopPropagation(); setForm(f => ({ ...f, pdf: null })); }, []);

  /* ── step ticker: advances loader step every ~900 ms ── */
  const startStepTicker = useCallback(() => {
    setLoaderStep(0);
    let s = 0;
    const tick = () => {
      s += 1;
      if (s < 3) {
        setLoaderStep(s);
        stepTimer.current = setTimeout(tick, 900);
      }
    };
    stepTimer.current = setTimeout(tick, 900);
  }, []);

  /* ── submit ── */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      showToast("warn", "Please fix the errors before submitting");
      return;
    }
    setLoading(true);
    startStepTicker();

    const data = new FormData();
    data.append("title",         form.title);
    data.append("start_date",    form.start_date);
    data.append("end_date",      form.end_date);
    data.append("pdf",           form.pdf);
    data.append("category_type", form.category_type);

    try {
      await createFlyer(data);
      setLoaderStep(3);
      await new Promise(r => setTimeout(r, 700)); // brief "All done!" moment
      showToast("success", "Flyer created successfully!");
      setForm({ title: "", pdf: null, start_date: "", end_date: "", is_active: true, category_type: "" });
      setErrors({});
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        Object.values(err?.response?.data || {}).flat().join(", ") ||
        "Something went wrong";
      showToast("error", msg);
    } finally {
      clearTimeout(stepTimer.current);
      setLoading(false);
      setLoaderStep(0);
    }
  }, [form, showToast, startStepTicker]);

  const waveSrc = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 620 56' preserveAspectRatio='none'%3E%3Cpath d='M0,28 C103,56 207,4 310,28 C413,52 517,6 620,28 L620,56 L0,56 Z' fill='%23f5f0ff'/%3E%3C/svg%3E`;

  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f5f7ff" }} />}>
      <CompanyLayout>
        <style>{STYLES}</style>

        <div className="af">
          <div className="af-hero" aria-hidden="true" />

          <div className="af-inner">
            {/* ── Top bar ── */}
            <div className="af-topbar af-up af-d1">
              <div>
                <div className="af-page-title">Add new flyer</div>
                <div className="af-page-sub">Create &amp; publish a campaign flyer</div>
              </div>
            </div>

            {/* ── Form card ── */}
            <div className="af-card af-up af-d2">

              {/* Section: Details */}
              <div className="af-card-hd">Campaign details</div>

              <div className="af-field">
                <label className="af-label" htmlFor="af-title">
                  Flyer title <span className="af-required">*</span>
                </label>
                <input
                  id="af-title"
                  className={`af-input ${errors.title ? "af-input-error" : ""}`}
                  name="title"
                  placeholder="e.g. Summer Sale 2025"
                  value={form.title}
                  onChange={handleChange}
                  autoComplete="off"
                />
                {errors.title && (
                  <div className="af-err" role="alert">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errors.title}
                  </div>
                )}
              </div>

              {/* Date row */}
              <div className="af-date-row">
                <div className="af-field">
                  <label className="af-label" htmlFor="af-start">
                    Start date <span className="af-required">*</span>
                  </label>
                  <input
                    id="af-start"
                    className={`af-input ${errors.start_date ? "af-input-error" : ""}`}
                    type="date" name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                  />
                  {errors.start_date && <div className="af-err" role="alert">{errors.start_date}</div>}
                </div>

                <div className="af-field">
                  <label className="af-label" htmlFor="af-end">
                    End date <span className="af-required">*</span>
                  </label>
                  <input
                    id="af-end"
                    className={`af-input ${errors.end_date ? "af-input-error" : ""}`}
                    type="date" name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                  />
                  {errors.end_date && <div className="af-err" role="alert">{errors.end_date}</div>}
                </div>
              </div>

              {/* Active toggle */}
              <div className="af-field">
                <label className="af-label">Status</label>
                <div
                  className={`af-toggle-wrap ${form.is_active ? "active" : ""}`}
                  onClick={toggleActive}
                  role="checkbox"
                  aria-checked={form.is_active}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === " " && toggleActive()}
                >
                  <div className="af-toggle-info">
                    <div className="af-toggle-icon" style={{ background: form.is_active ? "#ede9fe" : "#f1f5f9" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke={form.is_active ? "#7c3aed" : "#94a3b8"}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                    </div>
                    <div>
                      <div className="af-toggle-title">
                        {form.is_active ? "Active" : "Inactive"}
                      </div>
                      <div className="af-toggle-sub">
                        {form.is_active ? "Flyer will go live immediately" : "Flyer will be saved as draft"}
                      </div>
                    </div>
                  </div>
                  <div className={`af-switch ${form.is_active ? "on" : "off"}`} aria-hidden="true" />
                </div>
              </div>

              <div className="af-field">
                <label className="af-label">
                  Category <span className="af-required">*</span>
                </label>
                <select
                  name="category_type"
                  value={form.category_type}
                  onChange={handleChange}
                  className="af-input"
                >
                  <option value="">Select category</option>
                  <option value="supermarket">Supermarkets</option>
                  <option value="restaurant">Restaurants</option>
                  <option value="health">Health &amp; Clinics</option>
                  <option value="beauty">Beauty &amp; Spas</option>
                  <option value="fashion">Fashion</option>
                  <option value="sports">Sports</option>
                  <option value="home">Home &amp; Garden</option>
                  <option value="online">Online Deals</option>
                </select>
                {errors.category_type && (
                  <div className="af-err">{errors.category_type}</div>
                )}
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1.5px solid #f1f5f9", margin: "1.4rem 0 1.4rem" }} />

              {/* PDF upload */}
              <div className="af-card-hd">Upload flyer PDF</div>
              <div className="af-field">
                <div
                  className={`af-drop ${drag ? "dragover" : ""} ${form.pdf ? "has-file" : ""} ${errors.pdf ? "af-input-error" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                  aria-label="PDF upload drop zone"
                >
                  {!form.pdf ? (
                    <>
                      <input type="file" accept="application/pdf" onChange={handleFile} aria-label="Upload PDF file" />
                      <div className="af-drop-icon" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                          stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <div className="af-drop-title">
                        {drag ? "Drop it here!" : "Drag & drop your PDF"}
                      </div>
                      <div className="af-drop-sub">
                        or <span>browse files</span> — PDF only, max 20 MB
                      </div>
                    </>
                  ) : (
                    <div className="af-drop-file-name">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                        stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                      </svg>
                      <span>{form.pdf.name}</span>
                      <span className="af-drop-size">{fmtBytes(form.pdf.size)}</span>
                      <button className="af-drop-clear" onClick={removePdf} aria-label="Remove file">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                          stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                {errors.pdf && (
                  <div className="af-err" role="alert">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {errors.pdf}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                className="af-btn"
                onClick={handleSubmit}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="af-btn-spin" aria-hidden="true" />
                    Uploading flyer…
                  </>
                ) : (
                  <>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                      stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Publish flyer
                  </>
                )}
              </button>

              {/* Decorative wave */}
              <img className="af-card-wave" src={waveSrc} alt="" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* ── Publish Loader Overlay ── */}
        {loading && <FlyerLoader step={loaderStep} />}

        {/* Toast */}
        <Toast toast={toast} onClose={() => setToast(t => ({ ...t, visible: false }))} />
      </CompanyLayout>
    </Suspense>
  );
}