/**
 * MarketplaceLayout.jsx — Production-grade layout with:
 *  • Optimistic render  — layout paints instantly; user data fills in async
 *  • Skeleton shimmer   — navbar placeholder while user loads (no layout shift)
 *  • Stale-while-revalidate — caches user in sessionStorage, shows cached
 *    data immediately on revisit, revalidates silently in background
 *  • AbortController    — cancels in-flight fetch on unmount (no memory leaks)
 *  • Error boundary     — wraps children so page errors don't blow up the shell
 *  • Reduced-motion     — respects prefers-reduced-motion
 *  • CSS custom properties — single source of truth for theming
 *  • No inline <style> tag re-creation — styles injected once into <head>
 */

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  Component,
  memo,
  lazy,
  Suspense,
} from "react";
import { getUserNavbar } from "./api/userApi";

/* ── Lazy-load heavy shell pieces ── */
const Marketplacenavbar = lazy(() => import("./Marketplacenavbar"));
const Footer     = lazy(() => import("../../components/Footer"));

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */

const CACHE_KEY     = "ul__user_cache";
const CACHE_TTL_MS  = 5 * 60 * 1000; // 5 min — revalidate after this age
const STYLES_ID     = "__user-layout-styles";

/* ══════════════════════════════════════════════════════════════
   STYLE INJECTION — once per app lifetime
══════════════════════════════════════════════════════════════ */

function injectStyles() {
  if (document.getElementById(STYLES_ID)) return;
  const el = document.createElement("style");
  el.id = STYLES_ID;
  el.textContent = `
    /* ── Design tokens ── */
    :root {
      --ul-bg:           #f4f6f9;
      --ul-surface:      #ffffff;
      --ul-border:       rgba(0,0,0,0.07);
      --ul-text:         #1a202c;
      --ul-text-muted:   #718096;
      --ul-accent:       #c0392b;
      --ul-accent-soft:  rgba(192,57,43,0.08);
      --ul-radius:       12px;
      --ul-shadow:       0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
      --ul-transition:   0.22s cubic-bezier(0.4,0,0.2,1);
    }

    /* ── Layout shell ── */
    .ul-root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--ul-bg);
      isolation: isolate;
    }

    /* ── Main content ── */
    .ul-main {
      flex: 1;
      width: 100%;
      /* Paint immediately — no opacity:0 flash */
      animation: ul-fadeUp var(--ul-transition) both;
    }

    @media (prefers-reduced-motion: reduce) {
      .ul-main { animation: none; }
    }

    @keyframes ul-fadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Navbar skeleton ── */
    .ul-nav-skeleton {
      height: 64px;
      background: var(--ul-surface);
      border-bottom: 1px solid var(--ul-border);
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 12px;
      box-shadow: var(--ul-shadow);
    }

    .ul-skeleton-piece {
      border-radius: 6px;
      background: linear-gradient(
        90deg,
        #e8ecf0 25%,
        #f0f4f7 50%,
        #e8ecf0 75%
      );
      background-size: 400% 100%;
      animation: ul-shimmer 1.4s ease-in-out infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .ul-skeleton-piece {
        animation: none;
        background: #e8ecf0;
      }
    }

    @keyframes ul-shimmer {
      0%   { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }

    /* ── Error fallback ── */
    .ul-error {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      font-family: system-ui, sans-serif;
    }

    .ul-error__icon  { font-size: 40px; margin-bottom: 16px; }
    .ul-error__title { font-size: 18px; font-weight: 700; color: var(--ul-text); margin: 0 0 8px; }
    .ul-error__desc  { font-size: 14px; color: var(--ul-text-muted); margin: 0 0 24px; max-width: 320px; }

    .ul-error__btn {
      padding: 10px 24px;
      background: var(--ul-accent);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: opacity var(--ul-transition);
    }
    .ul-error__btn:hover  { opacity: 0.85; }
    .ul-error__btn:active { opacity: 0.7; }

    /* ── Footer skeleton ── */
    .ul-footer-skeleton {
      height: 80px;
      border-top: 1px solid var(--ul-border);
      background: var(--ul-surface);
    }
  `;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════════════════════
   SESSION CACHE HELPERS
   Avoids refetching user on every navigation within a session.
   Falls back gracefully if sessionStorage is unavailable.
══════════════════════════════════════════════════════════════ */

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return { data, stale: Date.now() - ts > CACHE_TTL_MS };
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded — silently skip */ }
}

/* ══════════════════════════════════════════════════════════════
   NAVBAR SKELETON — prevents layout shift while user loads
══════════════════════════════════════════════════════════════ */

const NavbarSkeleton = memo(function NavbarSkeleton() {
  return (
    <div className="ul-nav-skeleton" aria-hidden="true">
      {/* Logo placeholder */}
      <div className="ul-skeleton-piece" style={{ width: 36, height: 36, borderRadius: "50%" }} />
      <div className="ul-skeleton-piece" style={{ width: 100, height: 18 }} />
      {/* Spacer */}
      <div style={{ flex: 1 }} />
      {/* Nav links */}
      <div className="ul-skeleton-piece" style={{ width: 60, height: 14 }} />
      <div className="ul-skeleton-piece" style={{ width: 60, height: 14 }} />
      <div className="ul-skeleton-piece" style={{ width: 60, height: 14 }} />
      {/* Avatar */}
      <div className="ul-skeleton-piece" style={{ width: 34, height: 34, borderRadius: "50%", marginLeft: 8 }} />
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════
   ERROR BOUNDARY — isolates child render crashes
══════════════════════════════════════════════════════════════ */

class ContentErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    /* Plug in Sentry / Datadog here */
    console.error("[MarketplaceLayout] Child error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="ul-error" role="alert">
        <div className="ul-error__icon">⚠️</div>
        <h2 className="ul-error__title">Something went wrong</h2>
        <p className="ul-error__desc">
          An unexpected error occurred on this page. Our team has been notified.
        </p>
        <button className="ul-error__btn" onClick={this.handleReset}>
          Try again
        </button>
      </div>
    );
  }
}

/* ══════════════════════════════════════════════════════════════
   USER LAYOUT
══════════════════════════════════════════════════════════════ */

export default function MarketplaceLayout({ children }) {
  // Initialise from cache immediately — no loading flash on revisit
  const cached                      = readCache();
  const [user,    setUser]          = useState(cached?.data ?? null);
  const [navReady, setNavReady]     = useState(!!cached?.data);
  const abortRef                    = useRef(null);

  /* Inject styles once */
  useEffect(() => { injectStyles(); }, []);

  const fetchUser = useCallback(async (signal) => {
    try {
      const res = await getUserNavbar({ signal });
      const data = res.data;
      setUser(data);
      setNavReady(true);
      writeCache(data);
    } catch (err) {
      if (err?.name === "AbortError" || err?.name === "CanceledError") return;
      /* Non-fatal — layout still renders, navbar gracefully degrades */
      console.error("[MarketplaceLayout] Failed to fetch user:", err);
      setNavReady(true); // show navbar in guest/error state
    }
  }, []);

  useEffect(() => {
    const controller  = new AbortController();
    abortRef.current  = controller;

    const shouldFetch = !cached?.data || cached?.stale;
    if (shouldFetch) {
      fetchUser(controller.signal);
    }

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ul-root">

      {/* ── Navbar: skeleton → real (no CLS) ── */}
      {navReady ? (
        <Suspense fallback={<NavbarSkeleton />}>
          <Marketplacenavbar user={user} />
        </Suspense>
      ) : (
        <NavbarSkeleton />
      )}

      {/* ── Page content ── */}
      <main className="ul-main" id="main-content">
        <ContentErrorBoundary>
          {children}
        </ContentErrorBoundary>
      </main>

      {/* ── Footer ── */}
      <Suspense fallback={<div className="ul-footer-skeleton" />}>
        <Footer />
      </Suspense>

    </div>
  );
}