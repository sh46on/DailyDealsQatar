// UserNavbar.jsx — optimised + lazy-loading + hamburger fix

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
  lazy,
  Suspense,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, User } from "lucide-react";
import { getUserNavbar, BASE_URL } from "./api/userApi";

// ─── Lazy-load heavy/auth-gated component ────────────────────────────────────
const LogoutButton = lazy(() => import("../AuthComponents/LogoutButton"));

// ─── Constants (module-level = never recreated) ───────────────────────────────
const BASE = typeof BASE_URL === "function" ? BASE_URL() : BASE_URL;
const FONT = "'DM Sans', sans-serif";
const GRADIENT = "linear-gradient(105deg,#6B0F1A,#8B1A2A,#B5243C,#D4445A)";

const LINKS = [
  { to: "/user/home",        label: "Dashboard"    },
  { to: "/user/saved-items", label: "Saved Items"  },
  { to: "/user/profile",     label: "Edit Profile" },
];

// ─── Pure decorative SVG — memoised so it never re-renders ───────────────────
const NavbarCurves = memo(() => (
  <svg
    viewBox="0 0 1200 64"
    preserveAspectRatio="none"
    aria-hidden="true"
    style={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0 }}
  >
    <path d="M0,64 Q200,18 400,44 Q600,64 800,28 Q1000,0 1200,36"  stroke="rgba(255,255,255,0.08)" strokeWidth="2"   fill="none" />
    <path d="M0,28 Q300,56 600,20 Q900,0 1200,50"                   stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" fill="none" />
    <path d="M0,52 Q150,10 350,36 Q550,62 750,16 Q950,0 1200,32"   stroke="rgba(255,255,255,0.04)" strokeWidth="1"   fill="none" />
    <circle cx="1140" cy="8"  r="48" fill="rgba(255,255,255,0.02)" />
    <circle cx="40"   cy="56" r="30" fill="rgba(255,255,255,0.02)" />
  </svg>
));
NavbarCurves.displayName = "NavbarCurves";

// ─── Hamburger icon — isolated memo to skip re-renders on unrelated state ─────
const HamburgerIcon = memo(({ open }) => (
  <>
    <span style={{ ...styles.hLine, transform: open ? "translateY(6.5px) rotate(45deg)" : "translateY(0) rotate(0deg)" }} />
    <span style={{ ...styles.hLine, opacity: open ? 0 : 1 }} />
    <span style={{ ...styles.hLine, transform: open ? "translateY(-6.5px) rotate(-45deg)" : "translateY(0) rotate(0deg)" }} />
  </>
));
HamburgerIcon.displayName = "HamburgerIcon";

// ─── Main component ───────────────────────────────────────────────────────────
export default function UserNavbar() {
  const [dropOpen,  setDropOpen]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [user,      setUser]      = useState(null);
  const [slider,    setSlider]    = useState({ left: 0, width: 0 });

  // FIX: use a ref for image cache-busting so it never triggers a re-render
  // on its own — only when the user data itself changes.
  const imgVersionRef = useRef(0);

  const dropRef  = useRef(null);
  const tabsRef  = useRef(null);
  // Keep a stable ref to the latest slider updater for the resize listener
  const updateSliderRef = useRef(null);

  const location = useLocation();

  // ── Fetch user on mount ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getUserNavbar();
        if (!cancelled) setUser(res.data.data);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Listen for external profile updates ──────────────────────────────────
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const cached = sessionStorage.getItem("ul__user_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          imgVersionRef.current = Date.now();
          setUser(parsed.data); // single setState; imgVersion is a ref now
        }
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener("user-updated", handleUpdate);
    return () => window.removeEventListener("user-updated", handleUpdate);
  }, []);

  // ── FIX: outside-click closes dropdown; mobile menu only if hamburger area
  //    is NOT the target (prevents ghost-close when tapping the button itself)
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
        // Only auto-close mobile menu when tapping OUTSIDE the whole header
        // (header contains both the nav and the hamburger button)
        const header = dropRef.current.closest("header") ?? dropRef.current.parentElement;
        if (header && !header.contains(e.target)) {
          setMenuOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Slider (active-tab indicator) ────────────────────────────────────────
  const updateSlider = useCallback(() => {
    if (!tabsRef.current) return;
    const container = tabsRef.current;
    const activeTab = container.querySelector(".nb-tab.active");
    if (!activeTab) return;
    const cRect = container.getBoundingClientRect();
    const tRect = activeTab.getBoundingClientRect();
    setSlider({ left: tRect.left - cRect.left - 2, width: tRect.width });
  }, []);

  // Keep ref in sync so the debounced resize listener always calls the latest fn
  updateSliderRef.current = updateSlider;

  useEffect(() => {
    const t = setTimeout(updateSlider, 50);

    // FIX: debounce resize so it doesn't fire on every pixel during a drag
    let raf = null;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => updateSliderRef.current());
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [location.pathname, updateSlider]);

  // ── Derived display values (memoised) ────────────────────────────────────
  const { firstName, lastName, fullName, displayName, avatarSrc, appLogo, appName } =
    useMemo(() => {
      const fn  = user?.first_name || "";
      const ln  = user?.last_name  || "";
      const full = [fn, ln].filter(Boolean).join(" ") || "User";
      return {
        firstName:   fn,
        lastName:    ln,
        fullName:    full,
        displayName: fn || "User",
        avatarSrc:   user?.profile_pic
          ? `${user.profile_pic}?v=${imgVersionRef.current}`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(full)}&background=8B1A2A&color=fff&size=128`,
        appLogo: user?.app_logo
  ? user.app_logo.startsWith("http")
    ? user.app_logo
    : `${BASE}${user.app_logo}`
  : "/logo.png",
        appName: user?.app_name || "Deals",
      };
    }, [user]); // imgVersionRef is a ref — reading .current inside memo is intentional

  // ── Handlers ─────────────────────────────────────────────────────────────
  const closeAll     = useCallback(() => { setDropOpen(false); setMenuOpen(false); }, []);
  const toggleDrop   = useCallback(() => setDropOpen((p) => !p), []);
  // FIX: hamburger only toggles mobile menu; does NOT touch dropdown state
  const toggleMenu   = useCallback(() => setMenuOpen((p) => !p), []);
  const closeDropdown = useCallback(() => setDropOpen(false), []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <header style={styles.navbar}>
        <NavbarCurves />

        {/* ── Brand ────────────────────────────────────────────────────── */}
        <Link to="/user/home" style={styles.brand}>
          {/* eager: brand logo is above the fold */}
          <img
            src={appLogo}
            alt={appName}
            loading="eager"
            decoding="async"
            style={styles.brandLogo}
          />
          <span className="nb-brand-name" style={styles.brandName}>{appName}</span>
        </Link>

        {/* ── Center tabs ──────────────────────────────────────────────── */}
        <div className="nb-tabs-wrap" style={styles.tabsWrapper}>
          <div style={styles.tabs} ref={tabsRef}>
            <div
              style={{
                ...styles.slider,
                left:  slider.left,
                width: slider.width,
              }}
            />
            {LINKS.map(({ to, label }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`nb-tab${isActive ? " active" : ""}`}
                  style={{
                    ...styles.tab,
                    color:      isActive ? "#8B1A2A" : "rgba(255,255,255,0.65)",
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Right: profile chip + hamburger ──────────────────────────── */}
        <div style={styles.right} ref={dropRef}>

          {/* Profile chip */}
          <button onClick={toggleDrop} style={styles.profileBtn} aria-haspopup="true" aria-expanded={dropOpen}>
            <img
              src={avatarSrc}
              alt="avatar"
              loading="lazy"
              decoding="async"
              style={styles.avatar}
            />
            <span className="nb-profile-name" style={styles.profileName}>{displayName}</span>
            <ChevronDown
              size={14}
              style={{
                color: "#fff",
                opacity: 0.8,
                transition: "transform 0.22s ease",
                transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)",
                flexShrink: 0,
              }}
            />
          </button>

          {/* Dropdown */}
          {dropOpen && (
            <div style={styles.dropdown} role="menu">
              <div style={styles.dropHeader}>
                <img
                  src={avatarSrc}
                  alt="avatar"
                  loading="lazy"
                  decoding="async"
                  style={styles.dropAvatar}
                />
                <div>
                  <div style={styles.dropName}>{fullName}</div>
                  {user?.email && <div style={styles.dropEmail}>{user.email}</div>}
                </div>
              </div>

              <div style={styles.divider} />

              <Link
                to="/user/profile"
                role="menuitem"
                onClick={closeDropdown}
                style={styles.dropItem}
                onMouseEnter={e => { e.currentTarget.style.background = "#fdf5f6"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <User size={14} style={{ opacity: 0.6 }} />
                Profile
              </Link>

              <div style={styles.divider} />

              <div
                role="menuitem"
                style={{ ...styles.dropItem, ...styles.dropItemDanger }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fdf2f2"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <LogOut size={14} style={{ opacity: 0.8 }} />
                {/* Lazy-loaded; show nothing while the tiny chunk loads */}
                <Suspense fallback={<span style={{ opacity: 0.5, fontSize: 13 }}>Logout</span>}>
                  <LogoutButton />
                </Suspense>
              </div>
            </div>
          )}

          {/* ── FIX: hamburger ─────────────────────────────────────────────
               - display is controlled ONLY via the CSS class .nb-hamburger
                 (no `display` in the inline style object) so the media query
                 can override it without needing `!important`.
               - toggleMenu is separated from toggleDrop so opening/closing the
                 mobile drawer never accidentally resets the profile dropdown.
          ─────────────────────────────────────────────────────────────── */}
          <button
            onClick={toggleMenu}
            className="nb-hamburger"
            style={styles.hamburger}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        </div>
      </header>

      {/* ── Mobile slide-down menu ────────────────────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        style={{
          ...styles.mobileMenu,
          maxHeight: menuOpen ? "320px" : "0px",
        }}
      >
        {LINKS.map(({ to, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              // FIX: close BOTH on mobile link click (navigation intent)
              onClick={closeAll}
              style={{
                ...styles.mobileLink,
                color:      isActive ? "#fff"               : "rgba(255,255,255,0.75)",
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              <span
                style={{
                  ...styles.dot,
                  background: isActive ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                }}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Global styles ─────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }

        /* Tablet: shrink tab labels before hiding them */
        @media (max-width: 1024px) {
          .nb-tab { padding: 6px 10px !important; font-size: 13px !important; }
        }
        @media (max-width: 900px) {
          .nb-tab { padding: 6px 8px !important; font-size: 12px !important; }
        }

        /* Mobile: hide tabs, reveal hamburger
           FIX: .nb-hamburger has NO inline display value, so this rule wins
           without needing !important */
        .nb-hamburger { display: none; }

        @media (max-width: 760px) {
          .nb-tabs-wrap    { display: none   !important; }
          .nb-hamburger    { display: flex; }
          .nb-profile-name { display: none   !important; }
          .nb-brand-name   { display: none   !important; }
        }
        @media (max-width: 420px) {
          .nb-navbar { padding: 0 14px !important; }
        }
      `}</style>
    </>
  );
}

// ─── Styles (module-level object — never recreated on re-render) ──────────────
const styles = {
  navbar: {
    height: 64,
    display: "flex",
    alignItems: "center",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 90,
    overflow: "visible",
    gap: 16,
    flexShrink: 0,
    background: GRADIENT,
    boxShadow: "0 2px 20px rgba(107,15,26,0.4)",
    transition: "background 0.4s ease",
    fontFamily: FONT,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    color: "#fff",
    zIndex: 2,
    flexShrink: 0,
  },
  brandLogo: {
    width: 32, height: 32,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.4)",
  },
  brandName: {
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "0.3px",
    whiteSpace: "nowrap",
    fontFamily: FONT,
  },
  tabsWrapper: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2,
  },
  tabs: {
    display: "flex",
    alignItems: "center",
    background: "rgba(0,0,0,0.22)",
    borderRadius: 40,
    padding: "4px",
    gap: 2,
    border: "1px solid rgba(255,255,255,0.12)",
    position: "relative",
  },
  slider: {
    position: "absolute",
    top: 4,
    height: "calc(100% - 8px)",
    background: "#fff",
    borderRadius: 40,
    transition: "left 0.28s cubic-bezier(.4,0,.2,1), width 0.28s cubic-bezier(.4,0,.2,1)",
    pointerEvents: "none",
    zIndex: 0,
  },
  tab: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px 16px",
    borderRadius: 40,
    fontSize: 13.5,
    fontFamily: FONT,
    position: "relative",
    zIndex: 1,
    transition: "color 0.2s",
    textDecoration: "none",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
  },
  right: {
    marginLeft: "auto",
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 40,
    padding: "5px 12px 5px 6px",
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
    fontFamily: FONT,
  },
  avatar: {
    width: 32, height: 32,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.5)",
  },
  profileName: {
    fontSize: 13.5,
    fontWeight: 600,
    color: "#fff",
    letterSpacing: "0.2px",
    fontFamily: FONT,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 12px)",
    right: 0,
    background: "#fff",
    borderRadius: 18,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)",
    minWidth: 228,
    maxWidth: "calc(100vw - 32px)",
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.06)",
    animation: "dropIn 0.18s cubic-bezier(.4,0,.2,1) forwards",
    zIndex: 200,
  },
  dropHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px 12px",
    background: "linear-gradient(135deg, #f9f4f5, #fff)",
  },
  dropAvatar: {
    width: 42, height: 42,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },
  dropName:  { fontSize: 14,   fontWeight: 600, color: "#1a1a1a", fontFamily: FONT },
  dropEmail: { fontSize: 10.5, color: "#aaa",   fontFamily: FONT, marginTop: 2 },
  divider:   { height: 1, background: "#f0f0f0" },
  dropItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 16px",
    cursor: "pointer",
    fontSize: 13.5,
    color: "#333",
    transition: "background 0.15s",
    fontFamily: FONT,
    textDecoration: "none",
    background: "transparent",
  },
  dropItemDanger: { color: "#C0392B" },
  // FIX: NO `display` here — visibility is managed entirely by .nb-hamburger CSS rule
  hamburger: {
    flexDirection: "column",
    gap: 4.5,
    cursor: "pointer",
    padding: "6px 7px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 8,
    transition: "background 0.2s",
  },
  hLine: {
    width: 18, height: 2,
    background: "#fff",
    borderRadius: 2,
    display: "block",
    transition: "transform 0.2s ease, opacity 0.2s ease",
  },
  mobileMenu: {
    background: "linear-gradient(180deg, #7A1120, #6B0F1A)",
    overflow: "hidden",
    transition: "max-height 0.3s cubic-bezier(.4,0,.2,1)",
  },
  mobileLink: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 24px",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: FONT,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    transition: "background 0.15s, color 0.15s",
  },
  dot: {
    width: 6, height: 6,
    borderRadius: "50%",
    flexShrink: 0,
    transition: "background 0.15s",
  },
};