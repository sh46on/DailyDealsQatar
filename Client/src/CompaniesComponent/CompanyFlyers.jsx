import { useEffect, useState, useMemo, useCallback } from "react";
import { deleteFlyer, toggleFlyer, getCompanyFlyers } from "./api/companyApi";
import CompanyLayout from "../CompaniesComponent/CompanyLayout";
import { API_URL } from "../api/api";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { FileText, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   SAFE BASE URL  — guard against API_URL being a function/undefined
───────────────────────────────────────────────────────────────── */
const BASE =
  typeof API_URL === "string" && API_URL.startsWith("http")
    ? API_URL.replace(/\/$/, "")          // strip trailing slash
    : "http://localhost:8000";

/* ─────────────────────────────────────────────────────────────────
   PDF.JS WORKER
───────────────────────────────────────────────────────────────── */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

const PDF_OPTIONS = { cMapPacked: true };

/* ─────────────────────────────────────────────────────────────────
   PDF Modal palette
───────────────────────────────────────────────────────────────── */
const DARK   = "#1C1F26";
const BORDER = "#E4E1DC";
const MUTED  = "#8A8580";

const CAT_COLORS = {
  1: { bg: "#EFF6FF", accent: "#2563EB" },
  2: { bg: "#ECFDF5", accent: "#059669" },
  3: { bg: "#FFF7ED", accent: "#EA580C" },
  4: { bg: "#FDF2F8", accent: "#DB2777" },
  5: { bg: "#FEF2F2", accent: "#E30613" },
  6: { bg: "#F0FDFA", accent: "#0D9488" },
  7: { bg: "#FFFBEB", accent: "#D97706" },
  8: { bg: "#F5F3FF", accent: "#7C3AED" },
};
const getCat = (id) => CAT_COLORS[id] || { bg: "#F8F9FA", accent: "#E30613" };

/* ─────────────────────────────────────────────────────────────────
   buildPdfUrl
   Accepts a raw string from the API (may be relative, absolute,
   URL-encoded, or wrapped in quotes) and always returns a full URL.
───────────────────────────────────────────────────────────────── */
function buildPdfUrl(raw) {
  if (!raw) return null;

  // Guard: if someone passes a non-string (e.g. a function), bail out
  if (typeof raw !== "string") return null;

  let url = raw.replace(/["']/g, "").trim();

  // Decode percent-encoded chars (e.g. %20 → space)
  try { url = decodeURIComponent(url); } catch { /* keep as-is */ }

  // Already absolute
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }

  // Relative path — prepend BASE
  if (url.startsWith("/")) {
    return `${BASE}${url}`;
  }

  // No scheme, no leading slash — best effort
  return `https://${url}`;
}

/* ─────────────────────────────────────────────────────────────────
   Global + Modal styles
───────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Bricolage+Grotesque:wght@600;700;800&display=swap');

  .cf * { box-sizing: border-box; margin: 0; padding: 0; }

  .cf {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f5f7ff;
    min-height: 100vh;
    padding: 2rem 1.5rem 3rem;
    position: relative;
    overflow-x: hidden;
  }

  .cf-hero {
    position: fixed; top: 0; left: 0; right: 0; height: 260px;
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 52%, #7c3aed 100%);
    z-index: 0; pointer-events: none;
  }
  .cf-hero::after {
    content: ''; position: absolute;
    bottom: -2px; left: 0; right: 0; height: 80px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 80' preserveAspectRatio='none'%3E%3Cpath d='M0,36 C360,80 720,0 1080,36 C1260,54 1360,20 1440,36 L1440,80 L0,80 Z' fill='%23f5f7ff'/%3E%3C/svg%3E") center bottom / 100% 100% no-repeat;
  }
  .cf-inner { position: relative; z-index: 1; max-width: 1020px; margin: 0 auto; }

  .cf-topbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 2.2rem; }
  .cf-page-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 24px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
  .cf-page-sub { font-size: 12px; color: rgba(255,255,255,0.65); margin-top: 2px; }
  .cf-topbar-right { display: flex; align-items: center; gap: 10px; }

  .cf-search-wrap { position: relative; }
  .cf-search {
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.28);
    border-radius: 24px; padding: 8px 16px 8px 36px; font-size: 13px; color: #fff;
    outline: none; width: 200px; font-family: 'Plus Jakarta Sans', sans-serif; transition: background .2s;
  }
  .cf-search::placeholder { color: rgba(255,255,255,0.55); }
  .cf-search:focus { background: rgba(255,255,255,0.22); }
  .cf-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; opacity: .7; }

  .cf-btn-add {
    background: #fff; border: none; border-radius: 24px; padding: 9px 18px;
    font-size: 13px; font-weight: 700; color: #4f46e5; cursor: pointer;
    display: flex; align-items: center; gap: 6px; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s;
    box-shadow: 0 2px 10px rgba(79,70,229,.18);
  }
  .cf-btn-add:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(79,70,229,.28); }

  .cf-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 18px; }
  .cf-stat { background: #fff; border-radius: 16px; padding: 1rem 1.2rem; border: 1.5px solid rgba(99,102,241,.09); box-shadow: 0 2px 12px rgba(79,70,229,.07), 0 1px 3px rgba(0,0,0,.04); }
  .cf-stat-lbl { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #94a3b8; margin-bottom: 4px; }
  .cf-stat-num { font-family: 'Bricolage Grotesque', sans-serif; font-size: 28px; font-weight: 800; line-height: 1; letter-spacing: -.03em; }

  .cf-sec-hd { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
  .cf-sec-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 17px; font-weight: 800; color: #1e293b; letter-spacing: -.01em; }
  .cf-sec-badge { font-size: 11px; font-weight: 700; background: #ede9fe; color: #6d28d9; padding: 3px 11px; border-radius: 20px; }
  .cf-filter-pills { display: flex; gap: 6px; margin-left: auto; }
  .cf-filter-pill { font-size: 11px; font-weight: 600; padding: 4px 14px; border-radius: 20px; border: 1.5px solid transparent; cursor: pointer; background: #f1f5f9; color: #64748b; transition: all .2s; user-select: none; }
  .cf-filter-pill.active { background: #ede9fe; color: #6d28d9; border-color: #c4b5fd; }

  .cf-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

  .cf-card { background: #fff; border-radius: 20px; border: 1.5px solid rgba(99,102,241,.09); box-shadow: 0 2px 14px rgba(79,70,229,.06), 0 1px 3px rgba(0,0,0,.03); position: relative; overflow: hidden; transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s; }
  .cf-card:hover { transform: translateY(-5px); box-shadow: 0 14px 36px rgba(79,70,229,.14), 0 3px 8px rgba(0,0,0,.05); }
  .cf-card-body { padding: 1.3rem 1.35rem 1.2rem; }
  .cf-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .cf-icon { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .cf-status { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 5px 12px; border-radius: 20px; }
  .cf-status.active   { background: #d1fae5; color: #065f46; }
  .cf-status.inactive { background: #f1f5f9; color: #64748b; }
  .cf-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .cf-status.active   .cf-status-dot { background: #10b981; }
  .cf-status.inactive .cf-status-dot { background: #94a3b8; }

  .cf-card-title { font-family: 'Bricolage Grotesque', sans-serif; font-size: 17px; font-weight: 800; color: #1e293b; letter-spacing: -.01em; margin-bottom: 6px; line-height: 1.25; }
  .cf-dates { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #94a3b8; font-weight: 500; margin-bottom: 16px; }
  .cf-dates-sep { width: 20px; height: 1px; background: #cbd5e1; flex-shrink: 0; }
  .cf-created { font-size: 11px; color: #94a3b8; margin-top: 2px; }

  .cf-prog-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 6px; }
  .cf-prog-track { height: 6px; background: #f1f5f9; border-radius: 6px; overflow: hidden; margin-bottom: 16px; }
  .cf-prog-bar { height: 100%; border-radius: 6px; transition: width 1.2s cubic-bezier(.22,1,.36,1); }
  .cf-prog-active   { background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 55%, #06b6d4 100%); }
  .cf-prog-inactive { background: #e2e8f0; }

  .cf-divider { height: 1px; background: #f1f5f9; margin: 0 -1.35rem; }
  .cf-actions { display: flex; gap: 8px; padding: 12px 1.35rem 1.2rem; }

  .cf-btn { flex: 1; border: none; border-radius: 12px; padding: 9px 12px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all .2s; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .cf-btn-view             { background: #f5f3ff; color: #7c3aed; }
  .cf-btn-view:hover       { background: #ede9fe; }
  .cf-btn-deactivate       { background: #fef3c7; color: #92400e; }
  .cf-btn-deactivate:hover { background: #fde68a; }
  .cf-btn-activate         { background: #ecfdf5; color: #065f46; }
  .cf-btn-activate:hover   { background: #d1fae5; }
  .cf-btn-delete { background: #fef2f2; color: #dc2626; flex: none; width: 40px; border-radius: 12px; padding: 9px; }
  .cf-btn-delete:hover { background: #fee2e2; }

  .cf-wave { position: absolute; bottom: 0; left: 0; right: 0; height: 40px; display: block; width: 100%; pointer-events: none; }

  .cf-empty { text-align: center; padding: 3rem 1rem; color: #94a3b8; font-size: 14px; grid-column: 1 / -1; }
  .cf-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 280px; gap: 14px; color: #94a3b8; }
  .cf-spin { width: 32px; height: 32px; border: 3px solid #e0e7ff; border-top-color: #6366f1; border-radius: 50%; animation: cfSpin .7s linear infinite; }

  @keyframes cfSpin { to { transform: rotate(360deg); } }
  @keyframes cfUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .cf-up { animation: cfUp .5s cubic-bezier(.22,1,.36,1) both; }
  .cf-d1 { animation-delay: .05s; }
  .cf-d2 { animation-delay: .12s; }
  .cf-d3 { animation-delay: .19s; }

  @media (max-width: 520px) {
    .cf { padding: 1.2rem 1rem 2.5rem; }
    .cf-grid { grid-template-columns: 1fr; }
    .cf-stats { grid-template-columns: 1fr 1fr; }
    .cf-page-title { font-size: 19px; }
    .cf-search { width: 140px; }
    .cf-filter-pills { display: none; }
  }
  @media (min-width: 768px) { .cf { padding: 2.2rem 2.5rem 3.5rem; } }

  /* ════════════════════════════════════════
     PDF MODAL
  ════════════════════════════════════════ */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(28,31,38,0.55);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
    animation: mFadeIn .18s ease both;
  }
  @keyframes mFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal-pdf-box {
    background: #fff; border-radius: 20px;
    box-shadow: 0 24px 80px rgba(0,0,0,.22);
    width: 100%; max-width: 860px;
    height: 90vh; max-height: 900px;
    display: flex; flex-direction: column; overflow: hidden;
    animation: mSlideUp .22s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes mSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

  .modal-pdf-header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 16px 20px;
    border-bottom: 1px solid #E4E1DC; flex-shrink: 0;
  }
  .modal-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 15px; font-weight: 800; color: #1C1F26;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .modal-close {
    background: #f1f5f9; border: none; border-radius: 50%;
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #64748b; transition: background .18s, color .18s; flex-shrink: 0;
  }
  .modal-close:hover { background: #fee2e2; color: #dc2626; }
  .modal-zoom-btn {
    background: #f1f5f9; border: none; border-radius: 8px;
    width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #475569; transition: background .18s;
  }
  .modal-zoom-btn:hover { background: #e2e8f0; }
  .modal-zoom-pct { font-size: 12px; color: #8A8580; min-width: 38px; text-align: center; font-weight: 500; }
  .modal-open-link {
    background: #f1f5f9; border: none; border-radius: 8px;
    padding: 6px 12px; font-size: 12px; font-weight: 600;
    cursor: pointer; color: #475569; text-decoration: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background .18s; margin-top: 8px; display: inline-block;
  }
  .modal-open-link:hover { background: #e2e8f0; }

  .modal-pdf-viewer { flex: 1; overflow: hidden; position: relative; background: #f8fafc; }

  .pdf-state-center { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; height: 100%; padding: 24px; text-align: center; }
  .pdf-spinner { width: 40px; height: 40px; border: 3px solid #e0e7ff; border-top-color: #6366f1; border-radius: 50%; animation: cfSpin .7s linear infinite; }

  .pdf-nav-bar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 20px; border-top: 1px solid #E4E1DC;
    background: #fff; flex-shrink: 0; gap: 12px;
  }
  .pdf-nav-btn {
    display: flex; align-items: center; gap: 5px;
    background: #f1f5f9; border: none; border-radius: 10px;
    padding: 7px 14px; font-size: 13px; font-weight: 600;
    cursor: pointer; color: #475569; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: background .18s, opacity .18s;
  }
  .pdf-nav-btn:hover:not(:disabled) { background: #e2e8f0; }
  .pdf-nav-btn:disabled { opacity: .38; cursor: not-allowed; }

  .pdf-pips { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; }
  .pip { width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1; border: none; cursor: pointer; padding: 0; transition: background .18s, transform .18s; }
  .pip:hover  { background: #94a3b8; }
  .pip-active { background: #6366f1 !important; transform: scale(1.3); }

  @keyframes slideFromRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes slideFromLeft  { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pageFadeIn     { from { opacity: 0; } to { opacity: 1; } }
  .page-slide-left  { animation: slideFromRight .25s cubic-bezier(.22,1,.36,1) both; }
  .page-slide-right { animation: slideFromLeft  .25s cubic-bezier(.22,1,.36,1) both; }
  .page-fade-in     { animation: pageFadeIn     .2s ease both; }
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
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ─────────────────────────────────────────────────────────────────
   PDF Modal
   Expects: pdf = { url, title, company?, validUntil?, catColorId? }
───────────────────────────────────────────────────────────────── */
function PdfModal({ pdf, onClose }) {
  const c = getCat(pdf?.catColorId);

  const [numPages,   setNumPages]   = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError,   setPdfError]   = useState(false);
  const [scale,      setScale]      = useState(1.2);
  const [slideKey,   setSlideKey]   = useState(0);
  const [slideDir,   setSlideDir]   = useState("");

  // Reset on every new PDF
  useEffect(() => {
    setNumPages(null); setPageNumber(1);
    setPdfLoading(true); setPdfError(false);
    setScale(1.2); setSlideKey(0); setSlideDir("");
  }, [pdf?.url]);

  // ── FIX: build the URL here, not in FlyerCard ──
  const pdfUrl = useMemo(() => buildPdfUrl(pdf?.url), [pdf?.url]);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n); setPdfLoading(false); setPdfError(false);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    console.error("PDF load error:", err);
    setPdfLoading(false); setPdfError(true);
  }, []);

  const goToPage = useCallback((next, dir) => {
    if (!numPages) return;
    const clamped = Math.min(Math.max(1, next), numPages);
    if (clamped === pageNumber) return;
    setSlideDir(dir); setSlideKey(k => k + 1); setPageNumber(clamped);
  }, [numPages, pageNumber]);

  const changePage = useCallback(
    (delta) => goToPage(pageNumber + delta, delta > 0 ? "left" : "right"),
    [goToPage, pageNumber],
  );

  // Keyboard navigation
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowRight") changePage(1);
      if (e.key === "ArrowLeft")  changePage(-1);
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose, changePage]);

  const zoomIn  = () => setScale(p => Math.min(parseFloat((p + 0.2).toFixed(1)), 2.5));
  const zoomOut = () => setScale(p => Math.max(parseFloat((p - 0.2).toFixed(1)), 0.6));

  const slideClass = slideDir === "left"  ? "page-slide-left"
                   : slideDir === "right" ? "page-slide-right"
                   : "page-fade-in";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-pdf-box" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="modal-pdf-header">
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 className="modal-title">{pdf?.title ?? "PDF Viewer"}</h2>
            {(pdf?.company || pdf?.validUntil) && (
              <span style={{ fontSize: 12, color: MUTED }}>
                {pdf.company}{pdf.validUntil ? ` · Valid till ${pdf.validUntil}` : ""}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            {!pdfError && !pdfLoading && numPages && (
              <>
                <button onClick={zoomOut} className="modal-zoom-btn" title="Zoom out">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <span className="modal-zoom-pct">{Math.round(scale * 100)}%</span>
                <button onClick={zoomIn} className="modal-zoom-btn" title="Zoom in">
                  <ZoomIn size={13} />
                </button>
              </>
            )}
            <button className="modal-close" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Viewer body ── */}
        <div className="modal-pdf-viewer">

          {/* Loading */}
          {pdfLoading && (
            <div className="pdf-state-center">
              <div className="pdf-spinner" />
              <p style={{ fontSize: 13, color: MUTED }}>Loading PDF…</p>
            </div>
          )}

          {/* Error */}
          {pdfError && (
            <div className="pdf-state-center">
              <FileText size={56} strokeWidth={1.2} color={c.accent} />
              <p style={{ fontSize: 15, fontWeight: 600, color: DARK, marginBottom: 4 }}>
                Unable to load PDF
              </p>
              <p style={{ fontSize: 13, color: MUTED }}>
                The file may be protected or the URL is invalid.
              </p>
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="modal-open-link">
                  Try opening directly ↗
                </a>
              )}
            </div>
          )}

          {/* No URL */}
          {!pdfUrl && !pdfError && !pdfLoading && (
            <div className="pdf-state-center">
              <FileText size={56} strokeWidth={1.2} color={c.accent} />
              <p style={{ fontSize: 15, fontWeight: 600, color: DARK }}>PDF URL not available</p>
            </div>
          )}

          {/* PDF render */}
          {pdfUrl && !pdfError && (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", padding: "24px 20px" }}>
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                  options={PDF_OPTIONS}
                >
                  <div key={slideKey} className={slideClass}>
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                </Document>
              </div>

              {/* Multi-page nav */}
              {!pdfLoading && numPages && numPages > 1 && (
                <div className="pdf-nav-bar">
                  <button onClick={() => changePage(-1)} disabled={pageNumber <= 1} className="pdf-nav-btn">
                    <ChevronLeft size={16} /><span>Previous</span>
                  </button>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    {numPages <= 20 ? (
                      <div className="pdf-pips">
                        {Array.from({ length: numPages }, (_, i) => (
                          <button
                            key={i}
                            className={`pip${i + 1 === pageNumber ? " pip-active" : ""}`}
                            onClick={() => goToPage(i + 1, (i + 1) > pageNumber ? "left" : "right")}
                          />
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>
                        {pageNumber}
                        <span style={{ fontWeight: 400, color: MUTED }}> / {numPages}</span>
                      </span>
                    )}
                  </div>

                  <button onClick={() => changePage(1)} disabled={pageNumber >= numPages} className="pdf-nav-btn">
                    <span>Next</span><ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Single page label */}
              {!pdfLoading && numPages === 1 && (
                <div style={{ textAlign: "center", padding: "10px", borderTop: `1px solid ${BORDER}`, fontSize: 12, color: MUTED }}>
                  1 page
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Flyer Card
───────────────────────────────────────────────────────────────── */
function FlyerCard({ flyer, delay, onToggle, onDelete, onView }) {
  const [barW, setBarW] = useState(0);
  const prog     = calcProgress(flyer.start_date, flyer.end_date);
  const isActive = flyer.is_active;

  useEffect(() => {
    const t = setTimeout(() => setBarW(prog), 300 + delay * 80);
    return () => clearTimeout(t);
  }, [prog, delay]);

  const waveFill = isActive ? "%23f5f3ff" : "%23f8fafc";
  const waveSrc  = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 40' preserveAspectRatio='none'%3E%3Cpath d='M0,20 C66,40 133,4 200,20 C267,38 334,4 400,20 L400,40 L0,40 Z' fill='${waveFill}'/%3E%3C/svg%3E`;

  // ── FIX: pass the raw pdf path — buildPdfUrl (in PdfModal) handles the rest ──
  const rawPdf = typeof flyer.pdf === "string" ? flyer.pdf : "";

  return (
    <div className="cf-card cf-up" style={{ animationDelay: `${0.14 + delay * 0.09}s` }}>
      <div className="cf-card-body">
        <div className="cf-card-top">
          <div className="cf-icon" style={{ background: isActive ? "#f5f3ff" : "#f8fafc" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke={isActive ? "#7c3aed" : "#94a3b8"} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className={`cf-status ${isActive ? "active" : "inactive"}`}>
            <div className="cf-status-dot" />
            {isActive ? "Active" : "Inactive"}
          </div>
        </div>

        <div className="cf-card-title">{flyer.title}</div>
        <div className="cf-dates">
          <span>{fmtDate(flyer.start_date)}</span>
          <div className="cf-dates-sep" />
          <span>{fmtDate(flyer.end_date)}</span>
        </div>

        <div className="cf-prog-row">
          <span>Campaign progress</span>
          <span style={{ color: isActive ? "#7c3aed" : "#94a3b8" }}>{prog}%</span>
        </div>
        <div className="cf-prog-track">
          <div
            className={`cf-prog-bar ${isActive ? "cf-prog-active" : "cf-prog-inactive"}`}
            style={{ width: `${barW}%` }}
          />
        </div>
        <div className="cf-created">Added {fmtDate(flyer.created_at)}</div>
      </div>

      <div className="cf-divider" />
      <div className="cf-actions">

        {/* ── View PDF → passes raw path; buildPdfUrl resolves it ── */}
        <button
          className="cf-btn cf-btn-view"
          onClick={() => onView({
            url:        rawPdf,        // ← raw value only; no BASE concatenation here
            title:      flyer.title,
            catColorId: 8,
          })}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View PDF
        </button>

        <button
          className={`cf-btn ${isActive ? "cf-btn-deactivate" : "cf-btn-activate"}`}
          onClick={() => onToggle(flyer.id)}
        >
          {isActive ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              Deactivate
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Activate
            </>
          )}
        </button>

        <button className="cf-btn cf-btn-delete" onClick={() => onDelete(flyer.id)} title="Delete flyer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3,6 5,6 21,6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>

      <img className="cf-wave" src={waveSrc} alt="" aria-hidden="true" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main export
───────────────────────────────────────────────────────────────── */
export default function CompanyFlyers() {
  const [flyers,   setFlyers]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("all");  // "all" | "active" | "inactive"
  const [pdfModal, setPdfModal] = useState(null);   // null | { url, title, catColorId, … }

  useEffect(() => { loadFlyers(); }, []);

  const loadFlyers = async () => {
    try {
      const res = await getCompanyFlyers();
      setFlyers(res.data);
    } catch (err) {
      console.error("Failed to load flyers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this flyer?")) return;
    await deleteFlyer(id);
    loadFlyers();
  };

  const handleToggle = async (id) => {
  try {
    const res = await toggleFlyer(id);
    console.log("Toggle response:", res); // check what comes back
    await loadFlyers();
  } catch (err) {
    console.error("Toggle failed:", err);
    alert("Failed to toggle flyer status.");
  }
};

  const visible = flyers.filter(f => {
    const matchFilter =
      filter === "all" ||
      (filter === "active"   &&  f.is_active) ||
      (filter === "inactive" && !f.is_active);
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const activeCount   = flyers.filter(f => f.is_active).length;
  const inactiveCount = flyers.length - activeCount;
  const progs         = flyers.map(f => calcProgress(f.start_date, f.end_date));
  const avgProg       = flyers.length
    ? Math.round(progs.reduce((a, b) => a + b, 0) / flyers.length)
    : 0;

  return (
    <CompanyLayout>
      <style>{STYLES}</style>

      <div className="cf">
        <div className="cf-hero" aria-hidden="true" />

        <div className="cf-inner">
          {loading ? (
            <div className="cf-loading" role="status" aria-live="polite">
              <div className="cf-spin" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Loading flyers…</span>
            </div>
          ) : (
            <>
              {/* ── Top bar ── */}
              <div className="cf-topbar cf-up cf-d1">
                <div>
                  <div className="cf-page-title">Manage Flyers</div>
                  <div className="cf-page-sub">View, activate or remove your campaign flyers</div>
                </div>
                <div className="cf-topbar-right">
                  <div className="cf-search-wrap">
                    <svg className="cf-search-icon" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      className="cf-search" type="text" placeholder="Search flyers…"
                      value={search} onChange={e => setSearch(e.target.value)}
                      aria-label="Search flyers"
                    />
                  </div>
                </div>
              </div>

              {/* ── Stat cards ── */}
              <div className="cf-stats cf-up cf-d2">
                {[
                  { label: "Total flyers", value: flyers.length,  color: "#4f46e5" },
                  { label: "Active",       value: activeCount,    color: "#059669" },
                  { label: "Inactive",     value: inactiveCount,  color: "#ea580c" },
                  { label: "Avg progress", value: `${avgProg}%`,  color: "#7c3aed" },
                ].map(s => (
                  <div className="cf-stat" key={s.label}>
                    <div className="cf-stat-lbl">{s.label}</div>
                    <div className="cf-stat-num" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* ── Section header ── */}
              <div className="cf-sec-hd cf-up cf-d3">
                <span className="cf-sec-title">All flyers</span>
                <span className="cf-sec-badge">{visible.length} total</span>
                <div className="cf-filter-pills">
                  {["all", "active", "inactive"].map(f => (
                    <div
                      key={f}
                      className={`cf-filter-pill${filter === f ? " active" : ""}`}
                      onClick={() => setFilter(f)}
                      role="button" tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && setFilter(f)}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Flyer grid ── */}
              <div className="cf-grid">
                {visible.length === 0 ? (
                  <div className="cf-empty">No flyers match your filter.</div>
                ) : (
                  visible.map((f, i) => (
                    <FlyerCard
                      key={f.id}
                      flyer={f}
                      delay={i}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onView={setPdfModal}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── PDF Modal — only mounted when a flyer is selected ── */}
      {pdfModal && (
        <PdfModal pdf={pdfModal} onClose={() => setPdfModal(null)} />
      )}
    </CompanyLayout>
  );
}