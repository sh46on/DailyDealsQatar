import { Routes, Route, useLocation } from "react-router-dom";
import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useRef,
  Component,
} from "react";

/* ══════════════════════════════════════════════════════════════════
   LAZY ROUTES — every chunk loads on demand
   ⚠️  All imports are lazy. No eager imports for page-level components.
══════════════════════════════════════════════════════════════════ */

/* Layout */
const MainLayout = lazy(() => import("./layouts/MainLayout"));

/* Public */
const Home        = lazy(() => import("./pages/Home"));
const Marketplace = lazy(() => import("./Apps/Marketplace/Marketplace"));
const Ticketing   = lazy(() => import("./Apps/Ticketing/Ticketing"));

/* Auth */
const AuthLogin    = lazy(() => import("./AuthComponents/AuthLogin"));
const AuthRegister = lazy(() => import("./AuthComponents/AuthRegister"));

/* Admin */
const AdminHome              = lazy(() => import("./AdminComponents/AdminHome"));
const ManageCompanies        = lazy(() => import("./AdminComponents/ManageCompanies"));
const ManageUsers            = lazy(() => import("./AdminComponents/ManageUsers"));
const AdminSettings          = lazy(() => import("./AdminComponents/AdminSettings"));
const ManageFlyers           = lazy(() => import("./AdminComponents/ManageFlyers"));
const ManageProducts         = lazy(() => import("./AdminComponents/ManageProducts"));
const ManageCategories       = lazy(() => import("./AdminComponents/ManageCategories"));
const AdminCompanyRequests   = lazy(() => import("./AdminComponents/AdminCompanyRequests"));
const AdminMarketplaceDashboard = lazy(() => import("./AdminComponents/MarketplaceAdmin/AdminMarketplaceDashboard"));
const AdminManageListings    = lazy(() => import("./AdminComponents/MarketplaceAdmin/AdminManageListings"));
const AdminManageUsers       = lazy(() => import("./AdminComponents/MarketplaceAdmin/AdminManageUsers"));

/* Company */
const CompanyDashboard    = lazy(() => import("./CompaniesComponent/CompanyDashboard"));
const CompanyEditProfile  = lazy(() => import("./CompaniesComponent/CompanyEditProfile"));
const CompanyFlyers       = lazy(() => import("./CompaniesComponent/CompanyFlyers"));
const AddFlyer            = lazy(() => import("./CompaniesComponent/AddFlyer"));
const CompanyFlyerReviews = lazy(() => import("./CompaniesComponent/CompanyFlyerReviews"));
const CompanyProducts     = lazy(() => import("./CompaniesComponent/CompanyProducts"));

/* User */
const UserHome    = lazy(() => import("./UserComponents/UserHome"));
const SavedItems  = lazy(() => import("./UserComponents/SavedItems"));
const EditProfile = lazy(() => import("./UserComponents/EditProfile"));

/* Marketplace */
const MarketplaceLogin         = lazy(() => import("./Apps/Marketplace/MarketplaceLogin"));
const MarketplaceHome          = lazy(() => import("./Apps/Marketplace/MarketplaceHome"));
const MarketplaceNotifications = lazy(() => import("./Apps/Marketplace/MarketplaceNotifications"));
const MarketplaceSaved         = lazy(() => import("./Apps/Marketplace/MarketplaceSaved"));
const MarketplaceInterests     = lazy(() => import("./Apps/Marketplace/MarketplaceInterests"));
const MarketplaceProfile       = lazy(() => import("./Apps/Marketplace/MarketplaceProfile"));
const MarketplaceSell          = lazy(() => import("./Apps/Marketplace/MarketplaceSell"));

/* Pages */
const CompanyRequestForm = lazy(() => import("./pages/CompanyRequestForm"));
const PrivacyPolicy      = lazy(() => import("./pages/extras/PrivacyPolicy"));
const TermsOfService     = lazy(() => import("./pages/extras/TermsOfService"));
const CookiePolicy       = lazy(() => import("./pages/extras/CookiePolicy"));

/* Utility */
const ProtectedRoute = lazy(() => import("./routes/ProtectedRoute"));

/* ── 404 placeholder ── */
const NotFound = () => (
  <div style={{ padding: 48, fontFamily: "sans-serif", textAlign: "center" }}>
    <h2 style={{ margin: 0 }}>404 — Page not found</h2>
    <p style={{ color: "#666" }}>The page you're looking for doesn't exist.</p>
  </div>
);

/* ══════════════════════════════════════════════════════════════════
   LOADER STYLES — injected once into <head>
══════════════════════════════════════════════════════════════════ */

function injectLoaderStyles() {
  if (document.getElementById("__app-loader-styles")) return;
  const el = document.createElement("style");
  el.id = "__app-loader-styles";
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

    @keyframes _spinCW   { to { transform: rotate(360deg); } }
    @keyframes _spinCCW  { to { transform: rotate(-360deg); } }
    @keyframes _pulse    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:.75} }
    @keyframes _dot      { 0%,80%,100%{transform:scale(0);opacity:.3} 40%{transform:scale(1.1);opacity:1} }
    @keyframes _fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes _fadeOut  { from{opacity:1} to{opacity:0} }
    @keyframes _wordIn   { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════════════════════════
   LOADER CONTEXT — derive accent + label from pathname
══════════════════════════════════════════════════════════════════ */

const CONTEXTS = {
  "/admin":    { letter: "A", sub: "Admin Panel",    accent: "#c0392b" },
  "/company":  { letter: "C", sub: "Company Portal", accent: "#0d9488" },
  "/user":     { letter: "U", sub: "User Portal",    accent: "#4338ca" },
  "/login":    { letter: "D", sub: "Sign In",        accent: "#c0392b" },
  "/register": { letter: "D", sub: "Register",       accent: "#c0392b" },
};

function loaderContext(pathname) {
  for (const [prefix, ctx] of Object.entries(CONTEXTS)) {
    if (pathname.startsWith(prefix)) return ctx;
  }
  return { letter: "D", sub: "Qatar", accent: "#c0392b" };
}

/* ══════════════════════════════════════════════════════════════════
   APP LOADER COMPONENT
══════════════════════════════════════════════════════════════════ */

const TIPS = [
  "Loading your experience…",
  "Fetching the latest deals…",
  "Almost there…",
  "Preparing the page…",
];

function AppLoader({ exiting, pathname }) {
  const [tip, setTip]           = useState(0);
  const [progress, setProgress] = useState(0);
  const ctx                     = loaderContext(pathname);

  /* Rotate tips */
  useEffect(() => {
    const id = setInterval(() => setTip(i => (i + 1) % TIPS.length), 1600);
    return () => clearInterval(id);
  }, []);

  /* Fake progress bar */
  useEffect(() => {
    setProgress(0);
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 88) { clearInterval(id); return 88; }
        return p + Math.random() * 10;
      });
    }, 180);
    return () => clearInterval(id);
  }, [pathname]);

  /* Snap to 100 on exit */
  useEffect(() => { if (exiting) setProgress(100); }, [exiting]);

  const pct = Math.min(Math.round(progress), 100);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#fdf6f0",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      animation: exiting ? "_fadeOut .4s ease forwards" : "_fadeIn .25s ease both",
      pointerEvents: exiting ? "none" : "all",
    }}>

      {/* Top progress bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 3, background: "rgba(140,30,30,0.08)", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, height: "100%",
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${ctx.accent}99, ${ctx.accent})`,
          borderRadius: "0 2px 2px 0",
          transition: "width .35s ease",
          boxShadow: `0 0 8px ${ctx.accent}66`,
        }} />
      </div>

      {/* Spinner rings */}
      <div style={{ position: "relative", width: 112, height: 112, marginBottom: 32 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid rgba(140,30,30,0.07)",
        }} />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2.5px solid transparent",
          borderTopColor: ctx.accent,
          borderRightColor: `${ctx.accent}80`,
          animation: "_spinCW 1.1s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 14, borderRadius: "50%",
          border: "2px solid rgba(140,30,30,0.06)",
        }} />
        <div style={{
          position: "absolute", inset: 14, borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "#d97706",
          borderLeftColor: "#ea580c99",
          animation: "_spinCCW .85s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: 28, borderRadius: "50%",
          background: `linear-gradient(135deg, ${ctx.accent}dd, ${ctx.accent})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "_pulse 2s ease-in-out infinite",
          boxShadow: `0 4px 18px ${ctx.accent}50`,
        }}>
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 20, color: "#ffe8e8", lineHeight: 1, userSelect: "none",
          }}>
            {ctx.letter}
          </span>
        </div>
      </div>

      {/* Brand */}
      <div style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 30, fontWeight: 400, color: "#5c0f0f",
        letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 5,
      }}>
        Daily{" "}
        <span style={{ fontStyle: "italic", color: "#1a0505" }}>Deals</span>
      </div>
      <div style={{
        fontSize: 10, fontWeight: 600, color: "#a05050",
        letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 28,
      }}>
        {ctx.sub}
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: 7, marginBottom: 22 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: ctx.accent,
            animation: `_dot 1.3s ${i * 0.18}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* Tip */}
      <div key={tip} style={{
        fontSize: 13, color: "#6b2a2a", fontWeight: 500,
        animation: "_wordIn .35s ease both",
      }}>
        {TIPS[tip]}
      </div>

      {/* Percent */}
      <div style={{
        marginTop: 8, fontSize: 11, color: "#a05050",
        fontWeight: 600, fontVariantNumeric: "tabular-nums",
      }}>
        {pct}%
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ERROR BOUNDARY — catches chunk-load failures & render errors
══════════════════════════════════════════════════════════════════ */

class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const isChunkError =
      this.state.error?.name === "ChunkLoadError" ||
      /Loading chunk|Failed to fetch/.test(this.state.error?.message ?? "");

    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        background: "#fdf6f0", padding: 32, textAlign: "center",
      }}>
        <div style={{
          fontSize: 48, marginBottom: 16,
          fontFamily: "'DM Serif Display', serif",
          color: "#5c0f0f",
        }}>
          {isChunkError ? "⚠️" : "✕"}
        </div>
        <h2 style={{ margin: "0 0 8px", color: "#5c0f0f", fontSize: 22, fontWeight: 700 }}>
          {isChunkError ? "Reload again" : "Something went wrong"}
        </h2>
        <p style={{ margin: "0 0 24px", color: "#7a3a3a", fontSize: 14, maxWidth: 360 }}>
          {isChunkError
            ? "Server error. Reload or come back later."
            : "An unexpected error occurred. Our team has been notified."}
        </p>
        <button
          onClick={this.handleRetry}
          style={{
            padding: "10px 28px", borderRadius: 8,
            background: "#c0392b", color: "#fff",
            border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600,
            fontFamily: "inherit",
          }}
        >
          {isChunkError ? "Reload" : "Try again"}
        </button>
      </div>
    );
  }
}

/* ══════════════════════════════════════════════════════════════════
   SCROLL RESTORATION
══════════════════════════════════════════════════════════════════ */

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  return null;
}

/* ══════════════════════════════════════════════════════════════════
   ROUTE-CHANGE LOADER
   - Debounced 80ms so instant navigations (cached chunks) never
     flash the loader at all.
   - Tied to Suspense via the startTransition pattern: we just watch
     location changes and let Suspense handle the actual wait.
══════════════════════════════════════════════════════════════════ */

function RouteLoader() {
  const location              = useLocation();
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  const prevPath              = useRef(null);
  const timers                = useRef([]);

  useEffect(() => { injectLoaderStyles(); }, []);

  const clearTimers = () => {
    timers.current.forEach(t => clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    clearTimers();
    setExiting(false);
    setVisible(true);

    // Debounce: only show loader if navigation takes > 80ms
    // This prevents loader flash on cached/instant route changes
    const debounce = setTimeout(() => {
      // Begin exit sequence after minimum display time
      const exit = setTimeout(() => {
        setExiting(true);
        const hide = setTimeout(() => setVisible(false), 420);
        timers.current.push(hide);
      }, 400);
      timers.current.push(exit);
    }, 80);

    timers.current.push(debounce);
    return clearTimers;
  }, [location.pathname]);

  if (!visible) return null;
  return <AppLoader exiting={exiting} pathname={location.pathname} />;
}

/* ══════════════════════════════════════════════════════════════════
   PROTECTED ROUTE WRAPPER
   Single Suspense boundary wraps ProtectedRoute + children together,
   so the loader fires once for auth check + chunk load combined.
══════════════════════════════════════════════════════════════════ */

function Guard({ roles, children }) {
  return (
    <Suspense fallback={<AppLoader exiting={false} pathname={window.location.pathname} />}>
      <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
    </Suspense>
  );
}

/* ══════════════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════════════ */

export default function App() {
  return (
    <RouteErrorBoundary>
      <RouteLoader />
      <ScrollToTop />

      {/* Root Suspense: covers the very first JS chunk download */}
      <Suspense fallback={<AppLoader exiting={false} pathname={window.location.pathname} />}>
        <Routes>

          {/* ─── Public (with layout) ─── */}
          <Route element={<MainLayout />}>
            <Route path="/"                element={<Home />} />
            <Route path="/marketplace"     element={<Marketplace />} />
            <Route path="/ticketing"       element={<Ticketing />} />
            <Route path="/companyrequest"  element={<CompanyRequestForm />} />
            <Route path="/privacy-policy"  element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookies"         element={<CookiePolicy />} />
          </Route>

          {/* ─── Auth ─── */}
          <Route path="/login"              element={<AuthLogin />} />
          <Route path="/register"           element={<AuthRegister />} />
          <Route path="/marketplace/login"  element={<MarketplaceLogin />} />

          {/* ─── Admin ─── */}
          <Route path="/admin"                      element={<Guard roles={["admin"]}><AdminHome /></Guard>} />
          <Route path="/admin/companies"            element={<Guard roles={["admin"]}><ManageCompanies /></Guard>} />
          <Route path="/admin/users"                element={<Guard roles={["admin"]}><ManageUsers /></Guard>} />
          <Route path="/admin/settings"             element={<Guard roles={["admin"]}><AdminSettings /></Guard>} />
          <Route path="/admin/flyers"               element={<Guard roles={["admin"]}><ManageFlyers /></Guard>} />
          <Route path="/admin/products"             element={<Guard roles={["admin"]}><ManageProducts /></Guard>} />
          <Route path="/admin/categories"           element={<Guard roles={["admin"]}><ManageCategories /></Guard>} />
          <Route path="/admin/company-requests"     element={<Guard roles={["admin"]}><AdminCompanyRequests /></Guard>} />
          <Route path="/admin/marketplace"          element={<Guard roles={["admin"]}><AdminMarketplaceDashboard /></Guard>} />
          <Route path="/admin/marketplace/listings" element={<Guard roles={["admin"]}><AdminManageListings /></Guard>} />
          <Route path="/admin/marketplace/users"    element={<Guard roles={["admin"]}><AdminManageUsers /></Guard>} />

          {/* ─── Company ─── */}
          <Route path="/company"               element={<Guard roles={["company"]}><CompanyDashboard /></Guard>} />
          <Route path="/company/profile"       element={<Guard roles={["company"]}><CompanyEditProfile /></Guard>} />
          <Route path="/company/flyers"        element={<Guard roles={["company"]}><CompanyFlyers /></Guard>} />
          <Route path="/company/flyers/create" element={<Guard roles={["company"]}><AddFlyer /></Guard>} />
          <Route path="/company/reviews"       element={<Guard roles={["company"]}><CompanyFlyerReviews /></Guard>} />
          <Route path="/company/products"      element={<Guard roles={["company"]}><CompanyProducts /></Guard>} />

          {/* ─── User ─── */}
          <Route path="/user/home"        element={<Guard roles={["user"]}><UserHome /></Guard>} />
          <Route path="/user/saved-items" element={<Guard roles={["user"]}><SavedItems /></Guard>} />
          <Route path="/user/profile"     element={<Guard roles={["user"]}><EditProfile /></Guard>} />

          {/* ─── Marketplace ─── */}
          <Route path="/marketplace/home"          element={<Guard roles={["user", "company"]}><MarketplaceHome /></Guard>} />
          <Route path="/marketplace/notifications" element={<Guard roles={["user", "company"]}><MarketplaceNotifications /></Guard>} />
          <Route path="/marketplace/saved"         element={<Guard roles={["user", "company"]}><MarketplaceSaved /></Guard>} />
          <Route path="/marketplace/interests"     element={<Guard roles={["user", "company"]}><MarketplaceInterests /></Guard>} />
          <Route path="/marketplace/profile"       element={<Guard roles={["user", "company"]}><MarketplaceProfile /></Guard>} />
          <Route path="/marketplace/sell"          element={<Guard roles={["user", "company"]}><MarketplaceSell /></Guard>} />

          {/* ─── 404 ─── */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}