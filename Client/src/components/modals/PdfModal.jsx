/**
 * PdfModal.jsx — Production-optimised
 *
 * ① No pdfjs worker config here — handled once in src/pdfWorker.js
 * ② memo()         — skips re-renders when pdf/onClose props unchanged
 * ③ useCallback()  — all handlers stable; no child re-render cascade
 * ④ useMemo()      — pdfUrl built once; only recomputes on pdf.url change
 * ⑤ Merged keydown listeners — single document listener handles both
 *                   Escape (close) and ArrowLeft/Right (page turn)
 * ⑥ useBodyScrollLock — prevents page scroll bleed while modal is open
 * ⑦ useFocusTrap   — keyboard focus stays inside dialog (WCAG 2.1 §2.1.2)
 * ⑧ role="dialog" + aria-modal — correct screen-reader semantics
 * ⑨ PDF_OPTIONS module-scope — stable object ref; react-pdf won't reload doc
 * ⑩ CAT_COLORS / constants outside component — allocated once at module load
 */

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { FileText, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { API_URL } from "../../api/api";

/* ① Worker is configured in src/pdfWorker.js and imported in main.jsx — not here */

/* ⑨ Stable options — new object ref each render causes react-pdf to reload */
const PDF_OPTIONS = { cMapPacked: true };

/* ⑩ Constants outside component — allocated once at module load */
const R      = "#E30613";
const DARK   = "#1C1F26";
const WHITE  = "#FFFFFF";
const BORDER = "#E4E1DC";
const MUTED  = "#8A8580";

const CAT_COLORS = {
  1: { bg:"#EFF6FF", accent:"#2563EB", pill:"#DBEAFE", pillText:"#1E3A8A" },
  2: { bg:"#ECFDF5", accent:"#059669", pill:"#D1FAE5", pillText:"#064E3B" },
  3: { bg:"#FFF7ED", accent:"#EA580C", pill:"#FFEDD5", pillText:"#7C2D12" },
  4: { bg:"#FDF2F8", accent:"#DB2777", pill:"#FCE7F3", pillText:"#831843" },
  5: { bg:"#FEF2F2", accent:R,         pill:"#FEE2E2", pillText:"#7F1D1D" },
  6: { bg:"#F0FDFA", accent:"#0D9488", pill:"#CCFBF1", pillText:"#134E4A" },
  7: { bg:"#FFFBEB", accent:"#D97706", pill:"#FEF3C7", pillText:"#78350F" },
  8: { bg:"#F5F3FF", accent:"#7C3AED", pill:"#EDE9FE", pillText:"#4C1D95" },
};
const getCat = (id) => CAT_COLORS[id] ?? { bg:"#F8F9FA", accent:R, pill:"#FFE4E6", pillText:"#9F1239" };

/* ④ URL builder — pure function, no closure needed */
function buildPdfUrl(raw) {
  if (!raw) return null;
  try {
    let url = String(raw).replace(/["']/g, "").trim();
    try { url = decodeURIComponent(url); } catch (_) {}
    if (url.startsWith("/media/") || url.startsWith("/static/")) {
      url = API_URL + url;
    } else if (url.startsWith("/") && !url.startsWith("//")) {
      url = window.location.origin + url;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("blob:")) {
      url = "https://" + url;
    }
    return url;
  } catch (_) {
    return null;
  }
}

/* ⑥ Body scroll lock — saves previous overflow, restores on unmount */
function useBodyScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
}

/* ⑦ Focus trap — keeps keyboard focus inside the dialog */
function useFocusTrap(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    first?.focus();
    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    };
    el.addEventListener("keydown", handleTab);
    return () => el.removeEventListener("keydown", handleTab);
  }, [ref]);
}

/* ══════════════════════════════════════════════
   PDF MODAL
══════════════════════════════════════════════ */
const PdfModal = memo(function PdfModal({ pdf, onClose }) {
  const c      = getCat(pdf.catColorId);
  const boxRef = useRef(null);

  const [numPages,   setNumPages]   = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError,   setPdfError]   = useState(false);
  const [scale,      setScale]      = useState(1.2);
  const [slideKey,   setSlideKey]   = useState(0);
  const [slideDir,   setSlideDir]   = useState("");

  /* ④ Build URL once; only recomputes when pdf.url changes */
  const pdfUrl = useMemo(() => buildPdfUrl(pdf.url), [pdf.url]);

  useBodyScrollLock(); // ⑥
  useFocusTrap(boxRef); // ⑦

  /* ③ Stable handlers */
  const handleClose = useCallback(() => onClose(), [onClose]);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }) => {
    setNumPages(n);
    setPdfLoading(false);
    setPdfError(false);
  }, []);

  const onDocumentLoadError = useCallback((err) => {
    console.error("PDF load error:", err);
    setPdfLoading(false);
    setPdfError(true);
  }, []);

  /* ③ goToPage is stable as long as numPages/pageNumber don't change */
  const goToPage = useCallback((next, dir) => {
    if (!numPages) return;
    const clamped = Math.min(Math.max(1, next), numPages);
    if (clamped === pageNumber) return;
    setSlideDir(dir);
    setSlideKey(k => k + 1);
    setPageNumber(clamped);
  }, [numPages, pageNumber]);

  const changePage = useCallback(
    (delta) => goToPage(pageNumber + delta, delta > 0 ? "left" : "right"),
    [goToPage, pageNumber],
  );

  const zoomIn  = useCallback(() => setScale(p => Math.min(parseFloat((p + 0.2).toFixed(1)), 2.5)), []);
  const zoomOut = useCallback(() => setScale(p => Math.max(parseFloat((p - 0.2).toFixed(1)), 0.6)), []);

  /* ⑤ Single merged keydown listener — Escape + arrow keys */
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape")      { handleClose(); return; }
      if (e.key === "ArrowRight")  changePage(1);
      if (e.key === "ArrowLeft")   changePage(-1);
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [handleClose, changePage]);

  const slideClass = slideDir === "left"  ? "page-slide-left"
                   : slideDir === "right" ? "page-slide-right"
                   : "page-fade-in";

  return (
    <div className="modal-overlay" onClick={handleClose} role="presentation">
      {/* ⑧ dialog semantics */}
      <div
        ref={boxRef}
        className="modal-box modal-pdf-box"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={pdf.title || "PDF Viewer"}
      >
        {/* Header */}
        <div className="modal-pdf-header">
          <div style={{ minWidth:0, flex:1 }}>
            <h2 className="modal-title" style={{ marginBottom:2, fontSize:15 }}>
              {pdf.title}
            </h2>
            <span style={{ fontSize:12, color:MUTED }}>
              {pdf.company}{pdf.validUntil ? ` · Valid till ${pdf.validUntil}` : ""}
            </span>
          </div>

          <div style={{ display:"flex", gap:8, flexShrink:0, alignItems:"center" }}>
            {!pdfError && !pdfLoading && numPages && (
              <>
                <button onClick={zoomOut} className="modal-action-btn zoom-btn" title="Zoom out" aria-label="Zoom out">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8"  y1="11" x2="14"    y2="11" />
                  </svg>
                </button>
                <span style={{ fontSize:12, color:MUTED, minWidth:38, textAlign:"center", fontWeight:500 }}
                  aria-live="polite" aria-label={`Zoom level ${Math.round(scale * 100)}%`}>
                  {Math.round(scale * 100)}%
                </span>
                <button onClick={zoomIn} className="modal-action-btn zoom-btn" title="Zoom in" aria-label="Zoom in">
                  <ZoomIn size={13} aria-hidden="true" />
                </button>
              </>
            )}
            <button
              className="modal-close"
              style={{ position:"static" }}
              onClick={handleClose}
              aria-label="Close PDF viewer"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Viewer */}
        <div className="modal-pdf-viewer">

          {pdfLoading && (
            <div className="pdf-state-center" role="status" aria-label="Loading PDF">
              <div className="spinner lg" aria-hidden="true" />
              <p style={{ fontSize:13, color:MUTED }}>Loading PDF…</p>
            </div>
          )}

          {pdfError && (
            <div className="pdf-state-center" role="alert">
              <FileText size={56} strokeWidth={1.2} color={c.accent} aria-hidden="true" />
              <p style={{ fontSize:15, fontWeight:600, color:DARK, marginBottom:4 }}>
                Unable to load PDF
              </p>
              <p style={{ fontSize:13, color:MUTED }}>
                The file may be protected or the URL is invalid.
              </p>
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="modal-action-btn" style={{ marginTop:8 }}>
                  Try opening directly ↗
                </a>
              )}
            </div>
          )}

          {!pdfUrl && !pdfError && !pdfLoading && (
            <div className="pdf-state-center" role="status">
              <FileText size={56} strokeWidth={1.2} color={c.accent} aria-hidden="true" />
              <p style={{ fontSize:15, fontWeight:600, color:DARK }}>PDF URL not available</p>
            </div>
          )}

          {pdfUrl && !pdfError && (
            <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>

              <div style={{
                flex:1, overflow:"auto", display:"flex",
                justifyContent:"center", padding:"24px 20px",
              }}>
                {/* key={pdfUrl} forces a clean worker when URL changes */}
                <Document
                  key={pdfUrl}
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

              {/* Page nav — only rendered when there are multiple pages */}
              {!pdfLoading && numPages && numPages > 1 && (
                <div className="pdf-nav-bar" role="navigation" aria-label="Page navigation">
                  <button
                    onClick={() => changePage(-1)}
                    disabled={pageNumber <= 1}
                    className="pdf-nav-btn"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                    <span>Previous</span>
                  </button>

                  <div className="pdf-page-indicator" aria-live="polite"
                    aria-label={`Page ${pageNumber} of ${numPages}`}>
                    {numPages <= 20 ? (
                      <div className="pdf-pips" role="list">
                        {Array.from({ length: numPages }, (_, i) => (
                          <button
                            key={i}
                            role="listitem"
                            className={`pip ${i + 1 === pageNumber ? "pip-active" : ""}`}
                            onClick={() => goToPage(i + 1, (i + 1) > pageNumber ? "left" : "right")}
                            aria-label={`Go to page ${i + 1}`}
                            aria-current={i + 1 === pageNumber ? "page" : undefined}
                          />
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize:13, fontWeight:600, color:DARK }}>
                        {pageNumber}
                        <span style={{ fontWeight:400, color:MUTED }}> / {numPages}</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => changePage(1)}
                    disabled={pageNumber >= numPages}
                    className="pdf-nav-btn"
                    aria-label="Next page"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
              )}

              {!pdfLoading && numPages === 1 && (
                <div style={{
                  textAlign:"center", padding:"10px",
                  borderTop:`1px solid ${BORDER}`,
                  fontSize:12, color:MUTED,
                }} aria-label="Single page document">
                  1 page
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default PdfModal;