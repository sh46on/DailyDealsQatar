import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { X, ArrowLeft, ArrowRight, FileText, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import  {BASE_URL}  from "../../api/api";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_OPTIONS = {
  cMapUrl:             `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked:          true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

/* ── Category themes (maroon/white palette) ─────── */
const CATEGORY_THEMES = {
  "Supermarkets":     { pill: "#f0faf4", pillText: "#155f3a", accent: "#166534", pip: "#166534" },
  "Restaurants":      { pill: "#eff6ff", pillText: "#1e3a8a", accent: "#1d4ed8", pip: "#1d4ed8" },
  "Health & Clinics": { pill: "#f5f3ff", pillText: "#4c1d95", accent: "#6d28d9", pip: "#6d28d9" },
  "Beauty & Spas":    { pill: "#fff0f4", pillText: "#7f1d3a", accent: "#9f1239", pip: "#9f1239" },
  "Fashion & Sports": { pill: "#fdf4ff", pillText: "#581c87", accent: "#7e22ce", pip: "#7e22ce" },
  "Home & Garden":    { pill: "#f0fdfa", pillText: "#134e4a", accent: "#0f766e", pip: "#0f766e" },
  "Online Deals":     { pill: "#fffbeb", pillText: "#78350f", accent: "#b45309", pip: "#b45309" },
};
const DEFAULT_THEME = { pill: "#fff0f3", pillText: "#7f1d1d", accent: "#991b1b", pip: "#991b1b" };

/* Primary maroon brand color */
const MAROON = "#8b1a1a";
const MAROON_DEEP = "#6b1212";
const MAROON_LIGHT = "#fff0f0";
const MAROON_MID = "#c0392b";

/* ── Build PDF URL ─────────────────────────────────── */
function buildPdfUrl(raw) {
  if (!raw) return null;
  let url = raw.replace(/["']/g, "").trim();
  try { url = decodeURIComponent(url); } catch (_) {}
  if (url.startsWith("/media/") || url.startsWith("/static/")) return BASE_URL + url;
  if (url.startsWith("/") && !url.startsWith("//")) return window.location.origin + url;
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("blob:"))
    return "https://" + url;
  return url;
}

/* ── Animated Page Loader ──────────────────────────── */
function PageLoader() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 20, padding: "48px 24px", width: "100%",
    }}>
      {/* Animated document silhouette */}
      <div style={{ position: "relative", width: 72, height: 90 }}>
        {/* Paper shadow */}
        <div style={{
          position: "absolute", bottom: -4, left: 4, right: -4, height: "100%",
          borderRadius: "4px 12px 12px 4px",
          background: "rgba(139,26,26,0.08)",
        }} />
        {/* Main paper */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "4px 12px 12px 12px",
          background: "#fff",
          border: "1.5px solid rgba(139,26,26,0.15)",
          overflow: "hidden",
        }}>
          {/* Folded corner */}
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: 20, height: 20,
            background: `linear-gradient(225deg, #f5e8e8 50%, transparent 50%)`,
            borderLeft: "1.5px solid rgba(139,26,26,0.15)",
            borderBottom: "1.5px solid rgba(139,26,26,0.15)",
          }} />
          {/* Animated shimmer lines */}
          {[14, 26, 38, 50, 62].map((top, i) => (
            <div key={i} style={{
              position: "absolute", left: 10, right: i === 4 ? 24 : 10,
              top, height: 5, borderRadius: 3,
              background: "linear-gradient(90deg, #f5e0e0 25%, #ffd6d6 50%, #f5e0e0 75%)",
              backgroundSize: "200% 100%",
              animation: `fm-shimmer 1.6s ease-in-out ${i * 0.12}s infinite`,
            }} />
          ))}
        </div>
      </div>

      {/* Pulsing dots */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: MAROON,
            animation: `fm-bounce 1.2s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>

      <p style={{
        margin: 0, fontSize: 12.5, fontWeight: 500,
        color: "#b07070", letterSpacing: "0.04em",
      }}>
        Loading flyer…
      </p>
    </div>
  );
}

/* ── Page Turn Loader (between pages) ─────────────── */
function PageTurnLoader() {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(255,250,250,0.85)",
      backdropFilter: "blur(2px)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: `3px solid ${MAROON_LIGHT}`,
        borderTop: `3px solid ${MAROON}`,
        animation: "fm-spin 0.7s linear infinite",
      }} />
    </div>
  );
}

/* ── Error State ───────────────────────────────────── */
function ErrorState({ theme, pdfUrl }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 14, padding: "52px 28px", minHeight: 280,
      textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: `linear-gradient(135deg, ${MAROON_LIGHT}, #ffd6d6)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px rgba(139,26,26,0.12)`,
      }}>
        <FileText size={30} strokeWidth={1.4} color={MAROON} />
      </div>
      <div>
        <p style={{ margin: "0 0 6px", fontSize: 15.5, fontWeight: 700, color: "#2a1010" }}>
          Unable to load PDF
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#a07070", lineHeight: 1.5 }}>
          The file may be protected or<br />the URL is invalid.
        </p>
      </div>
      {pdfUrl && (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 4, fontSize: 13, fontWeight: 600,
            color: "#fff", textDecoration: "none",
            padding: "9px 22px", borderRadius: 10,
            background: `linear-gradient(135deg, ${MAROON}, ${MAROON_DEEP})`,
            boxShadow: `0 4px 14px rgba(139,26,26,0.3)`,
            transition: "transform 0.15s, box-shadow 0.15s",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = `0 6px 18px rgba(139,26,26,0.4)`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = `0 4px 14px rgba(139,26,26,0.3)`;
          }}
        >
          Open directly ↗
        </a>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   FLYER MODAL
══════════════════════════════════════════════════════ */
export default function FlyerModal({ flyer, onClose }) {
  const pdfUrl = useMemo(() => buildPdfUrl(flyer?.pdf), [flyer]);
  const theme  = CATEGORY_THEMES[flyer?.category_type] ?? DEFAULT_THEME;

  const [numPages,     setNumPages]     = useState(null);
  const [page,         setPage]         = useState(1);
  const [scale,        setScale]        = useState(1.2);
  const [loading,      setLoading]      = useState(true);
  const [pageLoading,  setPageLoading]  = useState(false);
  const [pdfError,     setPdfError]     = useState(false);
  const [visible,      setVisible]      = useState(false);
  const [slideKey,     setSlideKey]     = useState(0);
  const [slideDir,     setSlideDir]     = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 260);
  }, [onClose]);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n); setLoading(false); setPdfError(false);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    console.error("PDF load error:", err);
    setLoading(false); setPdfError(true);
  }, []);

  const goToPage = useCallback((next, dir) => {
    if (!numPages) return;
    const c = Math.min(Math.max(1, next), numPages);
    if (c === page) return;
    setSlideDir(dir);
    setSlideKey(k => k + 1);
    setPageLoading(true);
    setPage(c);
  }, [numPages, page]);

  const changePage = useCallback(
    (d) => goToPage(page + d, d > 0 ? "left" : "right"),
    [goToPage, page],
  );

  const zoomIn  = useCallback(() => setScale(s => Math.min(+(s + 0.2).toFixed(1), 2.8)), []);
  const zoomOut = useCallback(() => setScale(s => Math.max(+(s - 0.2).toFixed(1), 0.5)), []);

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape")     handleClose();
      if (e.key === "ArrowRight") changePage(1);
      if (e.key === "ArrowLeft")  changePage(-1);
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [handleClose, changePage]);

  if (!flyer) return null;

  const canPrev = page > 1;
  const canNext = page < (numPages ?? 1);

  const slideAnim =
    slideDir === "left"  ? "fm-slide-from-right" :
    slideDir === "right" ? "fm-slide-from-left"  : "fm-fade";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fm-shimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fm-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
        @keyframes fm-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fm-slide-from-right {
          from { opacity: 0; transform: translateX(40px) scale(0.98); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
        @keyframes fm-slide-from-left {
          from { opacity: 0; transform: translateX(-40px) scale(0.98); }
          to   { opacity: 1; transform: translateX(0)     scale(1);    }
        }
        @keyframes fm-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fm-sheet-rise {
          from { opacity: 0; transform: translateY(32px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes fm-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .fm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(20, 4, 4, 0);
          display: flex; align-items: center; justify-content: center;
          padding: 12px;
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          transition: background 280ms ease, backdrop-filter 280ms ease;
        }
        .fm-overlay.fm-visible {
          background: rgba(20, 4, 4, 0.72);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .fm-sheet {
          font-family: 'DM Sans', system-ui, sans-serif;
          background: #fffaf9;
          border-radius: 24px;
          width: 100%;
          max-width: 600px;
          max-height: 94vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(139,26,26,0.08),
            0 32px 80px rgba(20,4,4,0.30),
            0 8px 24px rgba(139,26,26,0.12);
          opacity: 0;
          transform: translateY(32px) scale(0.96);
          transition: transform 300ms cubic-bezier(0.22,1,0.36,1), opacity 260ms ease;
        }
        .fm-visible .fm-sheet {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* ── Header ── */
        .fm-header {
          padding: 22px 58px 0 22px;
          flex-shrink: 0;
          position: relative;
          background: #fffaf9;
          border-bottom: 1px solid rgba(139,26,26,0.09);
        }

        .fm-pill {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.09em; text-transform: uppercase;
          padding: 3px 10px; border-radius: 20px; margin-bottom: 9px;
        }

        .fm-title {
          font-family: 'Playfair Display', Georgia, serif;
          margin: 0 0 5px;
          font-size: clamp(15px, 3.8vw, 19px);
          font-weight: 700;
          color: #1e0a0a;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .fm-meta {
          margin: 0;
          font-size: 13px;
          color: #8a5050;
          font-weight: 500;
        }

        /* ── Toolbar ── */
        .fm-toolbar {
          display: flex; align-items: center; gap: 6px;
          padding: 11px 0 13px;
        }

        .fm-zbtn {
          width: 30px; height: 30px; border-radius: 9px;
          border: 1px solid rgba(139,26,26,0.16);
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 130ms, border-color 130ms, transform 110ms, box-shadow 130ms;
          flex-shrink: 0;
          color: ${MAROON};
        }
        .fm-zbtn:hover {
          background: ${MAROON_LIGHT};
          border-color: rgba(139,26,26,0.28);
          box-shadow: 0 2px 8px rgba(139,26,26,0.1);
        }
        .fm-zbtn:active { transform: scale(0.88); }

        .fm-zoom-label {
          font-size: 12px; font-weight: 600;
          color: #7a3030; min-width: 40px; text-align: center;
        }

        .fm-divider {
          width: 1px; height: 18px;
          background: rgba(139,26,26,0.12);
          margin: 0 6px;
        }

        .fm-page-badge {
          font-size: 12px; color: #9a5555;
          background: rgba(139,26,26,0.06);
          padding: 3px 11px; border-radius: 20px;
          border: 1px solid rgba(139,26,26,0.1);
          font-weight: 500;
        }
        .fm-page-badge b { font-weight: 700; color: #5a1a1a; }

        /* ── Close ── */
        .fm-close-btn {
          position: absolute; top: 16px; right: 16px;
          width: 32px; height: 32px; border-radius: 50%;
          border: 1px solid rgba(139,26,26,0.16);
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 150ms, transform 200ms, border-color 150ms, box-shadow 150ms;
          color: ${MAROON};
        }
        .fm-close-btn:hover {
          background: ${MAROON_LIGHT};
          border-color: rgba(139,26,26,0.3);
          box-shadow: 0 2px 12px rgba(139,26,26,0.12);
          transform: rotate(90deg);
        }

        /* ── Body / PDF viewport ── */
        .fm-body {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          display: flex; flex-direction: column; align-items: center;
          background: #f7eded;
          background-image:
            radial-gradient(circle at 20% 20%, rgba(139,26,26,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(139,26,26,0.03) 0%, transparent 50%);
          padding: 20px 14px 24px;
          position: relative;
        }
        .fm-body::-webkit-scrollbar { width: 5px; }
        .fm-body::-webkit-scrollbar-track { background: transparent; }
        .fm-body::-webkit-scrollbar-thumb {
          background: rgba(139,26,26,0.2); border-radius: 10px;
        }
        .fm-body::-webkit-scrollbar-thumb:hover {
          background: rgba(139,26,26,0.35);
        }

        /* ── PDF Page wrapper ── */
        .fm-pdf-wrap {
          border-radius: 12px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px rgba(139,26,26,0.1),
            0 8px 30px rgba(20,4,4,0.16),
            0 2px 8px rgba(139,26,26,0.08);
          position: relative;
          display: inline-flex;
        }

        .fm-pdf-anim {
          animation-duration: 240ms;
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          animation-fill-mode: both;
        }

        /* ── Footer nav ── */
        .fm-footer {
          flex-shrink: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px;
          border-top: 1px solid rgba(139,26,26,0.09);
          background: #fffaf9;
          gap: 8px;
        }

        .fm-nav-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 8px 16px; border-radius: 10px;
          border: 1px solid rgba(139,26,26,0.18);
          background: #fff;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 13px; font-weight: 600;
          color: ${MAROON};
          cursor: pointer;
          transition: background 140ms, border-color 140ms, transform 120ms, box-shadow 140ms;
          white-space: nowrap;
        }
        .fm-nav-btn:disabled {
          opacity: 0.3; cursor: default;
          box-shadow: none !important;
          transform: none !important;
        }
        .fm-nav-btn:not(:disabled):hover {
          background: ${MAROON_LIGHT};
          border-color: rgba(139,26,26,0.3);
          box-shadow: 0 2px 10px rgba(139,26,26,0.12);
        }
        .fm-nav-btn:not(:disabled):active { transform: scale(0.95); }

        /* ── Pip dots ── */
        .fm-pips {
          display: flex; align-items: center; gap: 6px;
          flex-wrap: wrap; justify-content: center; max-width: 200px;
        }
        .fm-pip {
          width: 7px; height: 7px; border-radius: 50%;
          border: none; padding: 0; cursor: pointer;
          background: rgba(139,26,26,0.18);
          transition: background 150ms, transform 150ms, box-shadow 150ms;
          flex-shrink: 0;
        }
        .fm-pip:hover { background: rgba(139,26,26,0.38); transform: scale(1.3); }
        .fm-pip.fm-active {
          transform: scale(1.5);
          box-shadow: 0 0 0 2px rgba(139,26,26,0.18);
        }

        /* ── Single page footer ── */
        .fm-single-page {
          text-align: center; padding: 9px 0;
          border-top: 1px solid rgba(139,26,26,0.09);
          font-size: 12px; color: #b08080;
          background: #fffaf9;
          font-weight: 500;
        }

        /* ── Valid badge ── */
        .fm-valid-badge {
          display: inline-flex; align-items: center;
          margin-left: 8px; padding: 2px 9px;
          border-radius: 12px; font-size: 11px; font-weight: 600;
          background: rgba(139,26,26,0.07);
          color: #7a2a2a;
          border: 1px solid rgba(139,26,26,0.12);
        }

        /* ── Responsive ── */
        @media (max-width: 520px) {
          .fm-sheet   { border-radius: 20px; max-height: 97vh; }
          .fm-header  { padding: 18px 52px 0 18px; }
          .fm-body    { padding: 14px 8px 18px; }
          .fm-nav-btn { padding: 7px 12px; font-size: 12px; gap: 4px; }
          .fm-footer  { padding: 8px 10px; }
          .fm-title   { font-size: 15px; }
        }

        @media (min-width: 600px) {
          .fm-sheet { border-radius: 28px; }
        }

        /* Tablet portrait */
        @media (min-width: 521px) and (max-width: 768px) {
          .fm-sheet { max-width: 520px; }
        }
      `}</style>

      <div
        className={`fm-overlay${visible ? " fm-visible" : ""}`}
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
        aria-label={flyer.title}
      >
        <div className="fm-sheet" onClick={e => e.stopPropagation()}>

          {/* ── HEADER ──────────────────────────────── */}
          <div className="fm-header">
            <button className="fm-close-btn" onClick={handleClose} aria-label="Close">
              <X size={14} strokeWidth={2.8} />
            </button>

            {/* Category pill */}
            <span
              className="fm-pill"
              style={{ background: theme.pill, color: theme.pillText }}
            >
              <span style={{
                width: 5, height: 5, borderRadius: "50%",
                background: theme.accent, display: "inline-block",
              }} />
              {flyer.category_type}
            </span>

            <h2 className="fm-title">{flyer.title}</h2>

            <p className="fm-meta">
              {flyer.company_name}
              {flyer.valid_until && (
                <span className="fm-valid-badge">
                  Valid till {flyer.valid_until}
                </span>
              )}
            </p>

            {/* Zoom toolbar — only when loaded */}
            {!pdfError && !loading && numPages && (
              <div className="fm-toolbar">
                <button className="fm-zbtn" onClick={zoomOut} aria-label="Zoom out">
                  <Minus size={12} strokeWidth={2.8} />
                </button>
                <span className="fm-zoom-label">{Math.round(scale * 100)}%</span>
                <button className="fm-zbtn" onClick={zoomIn} aria-label="Zoom in">
                  <Plus size={12} strokeWidth={2.8} />
                </button>

                <div className="fm-divider" />

                <span className="fm-page-badge">
                  <b>{page}</b> / {numPages}
                </span>
              </div>
            )}
          </div>

          {/* ── PDF BODY ─────────────────────────────── */}
          <div ref={scrollRef} className="fm-body">

            {/* Initial document loader */}
            {loading && <PageLoader />}

            {/* Error state */}
            {pdfError && <ErrorState theme={theme} pdfUrl={pdfUrl} />}

            {/* No PDF available */}
            {!pdfUrl && !pdfError && !loading && (
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 10, minHeight: 240,
                color: "#b08080", fontSize: 14, fontWeight: 500,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: MAROON_LIGHT,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FileText size={28} strokeWidth={1.4} color={MAROON} style={{ opacity: 0.5 }} />
                </div>
                <span>No PDF available</span>
              </div>
            )}

            {/* PDF Document */}
            {pdfUrl && !pdfError && (
              <div style={{
                display: loading ? "none" : "flex",
                justifyContent: "center",
                width: "100%",
                position: "relative",
              }}>
                <Document
                  file={pdfUrl}
                  options={PDF_OPTIONS}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={null}
                >
                  <div
                    className="fm-pdf-wrap"
                    style={{ position: "relative" }}
                  >
                    {pageLoading && <PageTurnLoader />}
                    <div
                      key={slideKey}
                      className="fm-pdf-anim"
                      style={{ animationName: slideAnim }}
                    >
                      <Page
                        pageNumber={page}
                        scale={scale}
                        renderAnnotationLayer={true}
                        renderTextLayer={true}
                        loading={null}
                        onRenderSuccess={() => setPageLoading(false)}
                      />
                    </div>
                  </div>
                </Document>
              </div>
            )}
          </div>

          {/* ── FOOTER NAVIGATION ────────────────────── */}
          {!loading && !pdfError && numPages && numPages > 1 && (
            <div className="fm-footer">
              <button
                className="fm-nav-btn"
                onClick={() => changePage(-1)}
                disabled={!canPrev}
              >
                <ChevronLeft size={14} strokeWidth={2.5} /> Prev
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
                {numPages <= 18 ? (
                  <div className="fm-pips">
                    {Array.from({ length: numPages }, (_, i) => (
                      <button
                        key={i}
                        className={`fm-pip${i + 1 === page ? " fm-active" : ""}`}
                        style={i + 1 === page ? { background: theme.pip } : undefined}
                        onClick={() => goToPage(i + 1, (i + 1) > page ? "left" : "right")}
                        aria-label={`Go to page ${i + 1}`}
                      />
                    ))}
                  </div>
                ) : (
                  <span className="fm-page-badge" style={{ fontSize: 13 }}>
                    <b>{page}</b> / {numPages}
                  </span>
                )}
              </div>

              <button
                className="fm-nav-btn"
                onClick={() => changePage(1)}
                disabled={!canNext}
              >
                Next <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {!loading && !pdfError && numPages === 1 && (
            <div className="fm-single-page">1 page</div>
          )}

        </div>
      </div>
    </>
  );
}