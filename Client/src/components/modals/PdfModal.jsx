import { useState, useEffect, useMemo, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  FileText, ChevronLeft, ChevronRight,
  X, ZoomIn,
} from "lucide-react";
import {API_URL} from "../../api/api"
/* ─────────────────────────────────────────────
   PDF.JS WORKER (mirrors Home.jsx)
───────────────────────────────────────────── */
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/* ─────────────────────────────────────────────
   PDF OPTIONS — module-scope so reference never
   changes between renders (suppresses warning).
───────────────────────────────────────────── */
const PDF_OPTIONS = {
  cMapUrl:    `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

/* ─────────────────────────────────────────────
   BRAND PALETTE (mirror of Home.jsx)
───────────────────────────────────────────── */
const R      = "#E30613";
const DARK   = "#1C1F26";
const WHITE  = "#FFFFFF";
const BORDER = "#E4E1DC";
const MUTED  = "#8A8580";
const RED_BG = "#FFF1F1";

const API_BASE_URL = API_URL;

const CAT_COLORS = {
  1: { bg: "#EFF6FF", accent: "#2563EB", pill: "#DBEAFE", pillText: "#1E3A8A" },
  2: { bg: "#ECFDF5", accent: "#059669", pill: "#D1FAE5", pillText: "#064E3B" },
  3: { bg: "#FFF7ED", accent: "#EA580C", pill: "#FFEDD5", pillText: "#7C2D12" },
  4: { bg: "#FDF2F8", accent: "#DB2777", pill: "#FCE7F3", pillText: "#831843" },
  5: { bg: "#FEF2F2", accent: R,         pill: "#FEE2E2", pillText: "#7F1D1D" },
  6: { bg: "#F0FDFA", accent: "#0D9488", pill: "#CCFBF1", pillText: "#134E4A" },
  7: { bg: "#FFFBEB", accent: "#D97706", pill: "#FEF3C7", pillText: "#78350F" },
  8: { bg: "#F5F3FF", accent: "#7C3AED", pill: "#EDE9FE", pillText: "#4C1D95" },
};
const getCat = (id) =>
  CAT_COLORS[id] || { bg: "#F8F9FA", accent: R, pill: "#FFE4E6", pillText: "#9F1239" };

/* ─────────────────────────────────────────────
   BUILD FULL PDF URL (mirrors Home.jsx)
───────────────────────────────────────────── */
function buildPdfUrl(raw) {
  if (!raw) return null;
  let url = raw.replace(/["']/g, "").trim();
  try { url = decodeURIComponent(url); } catch (_) {}
  if (url.startsWith("/media/") || url.startsWith("/static/")) {
    url = API_BASE_URL + url;
  } else if (url.startsWith("/") && !url.startsWith("//")) {
    url = window.location.origin + url;
  }
  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://") &&
    !url.startsWith("blob:")
  ) {
    url = "https://" + url;
  }
  return url;
}

/* ══════════════════════════════════════════════
   PDF MODAL
   Inline PDF viewer with prev/next page navigation,
   slide transition animation, and zoom controls.
══════════════════════════════════════════════ */
export default function PdfModal({ pdf, onClose }) {
  const c = getCat(pdf.catColorId);

  const [numPages,   setNumPages]   = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError,   setPdfError]   = useState(false);
  const [scale,      setScale]      = useState(1.2);
  const [slideKey,   setSlideKey]   = useState(0);
  const [slideDir,   setSlideDir]   = useState("");

  // Escape key → close modal
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  // Build URL once
  const pdfUrl = useMemo(() => buildPdfUrl(pdf.url), [pdf.url]);

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

  // Arrow key → page turn
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "ArrowRight") changePage(1);
      if (e.key === "ArrowLeft")  changePage(-1);
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [changePage]);

  const zoomIn  = () => setScale(p => Math.min(parseFloat((p + 0.2).toFixed(1)), 2.5));
  const zoomOut = () => setScale(p => Math.max(parseFloat((p - 0.2).toFixed(1)), 0.6));

  const slideClass = slideDir === "left"  ? "page-slide-left"
                   : slideDir === "right" ? "page-slide-right"
                   : "page-fade-in";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-pdf-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-pdf-header">
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 className="modal-title" style={{ marginBottom: 2, fontSize: 15 }}>
              {pdf.title}
            </h2>
            <span style={{ fontSize: 12, color: MUTED }}>
              {pdf.company}{pdf.validUntil ? ` · Valid till ${pdf.validUntil}` : ""}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
            {!pdfError && !pdfLoading && numPages && (
              <>
                <button onClick={zoomOut} className="modal-action-btn zoom-btn" title="Zoom out">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8"  y1="11" x2="14"   y2="11" />
                  </svg>
                </button>
                <span style={{ fontSize: 12, color: MUTED, minWidth: 38, textAlign: "center", fontWeight: 500 }}>
                  {Math.round(scale * 100)}%
                </span>
                <button onClick={zoomIn} className="modal-action-btn zoom-btn" title="Zoom in">
                  <ZoomIn size={13} />
                </button>
              </>
            )}
            <button className="modal-close" style={{ position: "static" }} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer */}
        <div className="modal-pdf-viewer">

          {/* Loading state */}
          {pdfLoading && (
            <div className="pdf-state-center">
              <div className="spinner lg" />
              <p style={{ fontSize: 13, color: MUTED }}>Loading PDF…</p>
            </div>
          )}

          {/* Error state */}
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
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="modal-action-btn" style={{ marginTop: 8 }}>
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

              {/* Scrollable canvas area */}
              <div style={{
                flex: 1, overflow: "auto", display: "flex",
                justifyContent: "center", padding: "24px 20px",
              }}>
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

              {/* Page nav bar */}
              {!pdfLoading && numPages && numPages > 1 && (
                <div className="pdf-nav-bar">
                  <button
                    onClick={() => changePage(-1)}
                    disabled={pageNumber <= 1}
                    className="pdf-nav-btn"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <div className="pdf-page-indicator">
                    {numPages <= 20 ? (
                      <div className="pdf-pips">
                        {Array.from({ length: numPages }, (_, i) => (
                          <button
                            key={i}
                            className={`pip ${i + 1 === pageNumber ? "pip-active" : ""}`}
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

                  <button
                    onClick={() => changePage(1)}
                    disabled={pageNumber >= numPages}
                    className="pdf-nav-btn"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {!pdfLoading && numPages === 1 && (
                <div style={{
                  textAlign: "center", padding: "10px",
                  borderTop: `1px solid ${BORDER}`,
                  fontSize: 12, color: MUTED,
                }}>
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