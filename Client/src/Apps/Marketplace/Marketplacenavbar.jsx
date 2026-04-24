// MarketplaceNavbar.jsx — Blue & White Marketplace Theme

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, Bell, User, Tag, Bookmark, Heart,
  ChevronDown, LogOut, Settings, ShoppingBag,
  Menu, X as CloseIcon,
} from "lucide-react";
import LogoutButton from "../../AuthComponents/LogoutButton";
import { getUserNavbar, BASE_URL } from "./api/userApi";
import { fetchNotifications } from "./api/marketplaceApi";


const BASE = BASE_URL;
const FONT = "'Plus Jakarta Sans', sans-serif";

// ─── Nav link definitions ─────────────────────────────────────────
const NAV_LINKS = [
  { to: "/marketplace/home",          label: "Home",          icon: Home     },
  { to: "/marketplace/saved",         label: "Saved",         icon: Bookmark },
  { to: "/marketplace/notifications", label: "Notifications", icon: Bell     },
  { to: "/marketplace/interests",    label: " My Interests",     icon: Heart     },
  { to: "/marketplace/profile",       label: "Profile",       icon: User     },
];

// ─── Decorative SVG background curves ────────────────────────────
const NavBg = memo(() => (
  <svg
    aria-hidden="true"
    viewBox="0 0 1400 72"
    preserveAspectRatio="none"
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
  >
    <defs>
      <linearGradient id="curve-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.00)" />
        <stop offset="50%"  stopColor="rgba(255,255,255,0.08)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
      </linearGradient>
    </defs>
    <path d="M0,52 Q350,10 700,38 Q1050,66 1400,22"  stroke="url(#curve-grad)" strokeWidth="1.5" fill="none" />
    <path d="M0,28 Q280,60 560,20 Q840,0 1120,44 Q1280,60 1400,32" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
    {/* Soft highlight orbs */}
    <ellipse cx="1320" cy="12" rx="70" ry="20" fill="rgba(255,255,255,0.04)" />
    <ellipse cx="80"   cy="58" rx="50" ry="16" fill="rgba(255,255,255,0.04)" />
  </svg>
));
NavBg.displayName = "NavBg";

// ─── Notification Badge ───────────────────────────────────────────
function NotifBadge({ count }) {
  if (!count) return null;
  return (
    <span style={{
      position: "absolute",
      top: -4, right: -4,
      minWidth: 16, height: 16,
      background: "#f43f5e",
      borderRadius: 99,
      fontSize: 9,
      fontWeight: 800,
      color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 3px",
      border: "2px solid #1565c0",
      lineHeight: 1,
      fontFamily: FONT,
      animation: "badgePop 0.3s cubic-bezier(.34,1.56,.64,1) both",
    }}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────
export default function MarketplaceNavbar() {
  const [dropOpen,   setDropOpen]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [user,       setUser]       = useState(null);
  const [slider,     setSlider]     = useState({ left: 0, width: 0, opacity: 0 });
  const [scrolled,   setScrolled]   = useState(false);
  const [notifCount, setNotifCount] = useState(0); 

  const dropRef = useRef(null);
  const tabsRef = useRef(null);
  const location = useLocation();

  // Fetch user
  useEffect(() => {
    (async () => {
      try {
        const res = await getUserNavbar();
        setUser(res.data.data);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  useEffect(() => {
  loadNotifications();

  const interval = setInterval(() => {
    loadNotifications();
  }, 10000); 

  return () => clearInterval(interval);
}, []);

// Notification count
const loadNotifications = async () => {
  try {
    const res = await fetchNotifications();
    setNotifCount(res.data.count);
  } catch (err) {
    console.error(err);
  }
};
  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Sliding active indicator
  const updateSlider = useCallback(() => {
    if (!tabsRef.current) return;
    const activeEl = tabsRef.current.querySelector(".mp-tab.active");
    if (!activeEl) { setSlider(s => ({ ...s, opacity: 0 })); return; }
    const cR = tabsRef.current.getBoundingClientRect();
    const aR = activeEl.getBoundingClientRect();
    setSlider({ left: aR.left - cR.left, width: aR.width, opacity: 1 });
  }, []);

  useEffect(() => {
    const t = setTimeout(updateSlider, 60);
    window.addEventListener("resize", updateSlider);
    return () => { clearTimeout(t); window.removeEventListener("resize", updateSlider); };
  }, [location.pathname, updateSlider]);

  const firstName   = user?.first_name || "";
  const lastName    = user?.last_name  || "";
  const fullName    = [firstName, lastName].filter(Boolean).join(" ") || "User";
  const displayName = firstName || "User";

  const avatarSrc = user?.profile_pic
    ? (user.profile_pic.startsWith("http") ? user.profile_pic : `${BASE}${user.profile_pic}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1565c0&color=fff&size=128`;

  const appLogo = user?.app_logo || "/logo.png";
  const appName = user?.app_name || "Daily Deals";

  return (
    <>
      <style>{STYLES_CSS}</style>

      <header
        className="mp-navbar"
        style={{
          ...styles.navbar,
          boxShadow: scrolled
            ? "0 4px 32px rgba(15,52,96,0.22), 0 1px 0 rgba(255,255,255,0.08)"
            : "0 2px 16px rgba(15,52,96,0.18)",
        }}
      >
        <NavBg />

        {/* ── Brand ── */}
        <Link to="/marketplace/home" style={styles.brand} className="mp-brand">
          <div style={styles.brandIconWrap}>
            <img src={appLogo} alt={appName} style={styles.brandLogo} />
          </div>
          <span className="mp-brand-text" style={styles.brandText}>{appName}</span>
        </Link>

        {/* ── Center Nav Tabs ── */}
        <nav className="mp-tabs-wrap" style={styles.tabsWrap}>
          <div style={styles.tabsTrack} ref={tabsRef}>
            {/* Animated slider pill */}
            <div
              aria-hidden="true"
              style={{
                ...styles.sliderPill,
                left:    slider.left,
                width:   slider.width,
                opacity: slider.opacity,
              }}
            />

            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname === to;
              const isNotif  = label === "Notifications";
              return (
                <Link
                  key={to}
                  to={to}
                  className={`mp-tab${isActive ? " active" : ""}`}
                  style={{
                    ...styles.tab,
                    color: isActive ? "#1565c0" : "rgba(255,255,255,0.72)",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Icon
                      size={15}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      style={{ flexShrink: 0, transition: "stroke-width 0.2s" }}
                    />
                    {isNotif && <NotifBadge count={notifCount} />}
                  </span>
                  <span className="mp-tab-label">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ── Right: Sell CTA + Profile + Hamburger ── */}
        <div style={styles.right}>

          {/* Sell button */}
          <Link to="/marketplace/sell" className="mp-sell-btn" style={styles.sellBtn}>
            <Tag size={14} strokeWidth={2.2} />
            <span className="mp-sell-label">Sell</span>
          </Link>

          {/* Profile dropdown */}
          <div ref={dropRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropOpen(p => !p)}
              className="mp-profile-btn"
              style={styles.profileBtn}
              aria-expanded={dropOpen}
            >
              <img src={avatarSrc} alt="avatar" style={styles.avatar} />
              <span className="mp-uname" style={styles.uname}>{displayName}</span>
              <ChevronDown
                size={13}
                style={{
                  color: "rgba(255,255,255,0.85)",
                  transition: "transform 0.25s cubic-bezier(.34,1.56,.64,1)",
                  transform: dropOpen ? "rotate(180deg)" : "none",
                  flexShrink: 0,
                }}
              />
            </button>

            {dropOpen && (
              <div style={styles.dropdown} className="mp-dropdown">
                {/* Header */}
                <div style={styles.dropHead}>
                  <img src={avatarSrc} alt="" style={styles.dropAvatar} />
                  <div>
                    <div style={styles.dropName}>{fullName}</div>
                    {user?.email && <div style={styles.dropEmail}>{user.email}</div>}
                    <span style={styles.dropBadge}>User</span>
                  </div>
                </div>

                <div style={styles.dropDivider} />

                <Link
                  to="/marketplace/profile"
                  onClick={() => setDropOpen(false)}
                  style={styles.dropItem}
                  className="mp-drop-item"
                >
                  <User size={14} />
                  My Profile
                </Link>
                {/* <Link
                  to="/marketplace/settings"
                  onClick={() => setDropOpen(false)}
                  style={styles.dropItem}
                  className="mp-drop-item"
                >
                  <Settings size={14} />
                  Settings
                </Link> */}

                <div style={styles.dropDivider} />

                <div style={{ ...styles.dropItem, ...styles.dropDanger }} className="mp-drop-item mp-drop-danger">
                  <LogOut size={14} />
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="mp-hamburger"
            onClick={() => setMenuOpen(p => !p)}
            style={styles.hamburger}
            aria-label="Toggle menu"
          >
            {menuOpen
              ? <CloseIcon size={18} color="#fff" strokeWidth={2.2} />
              : <Menu      size={18} color="#fff" strokeWidth={2.2} />
            }
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      <div
        className="mp-mobile-menu"
        style={{
          ...styles.mobileMenu,
          maxHeight: menuOpen ? "440px" : "0px",
          opacity:   menuOpen ? 1 : 0,
        }}
      >
        {/* Mobile nav links */}
        {NAV_LINKS.map(({ to, label, icon: Icon }) => {
          const isActive  = location.pathname === to;
          const isNotif   = label === "Notifications";
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className="mp-mobile-link"
              style={{
                ...styles.mobileLink,
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                color:      isActive ? "#fff"                  : "rgba(255,255,255,0.72)",
              }}
            >
              <span style={{ position: "relative" }}>
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                {isNotif && <NotifBadge count={notifCount} />}
              </span>
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <span style={styles.mobileDot} />}
            </Link>
          );
        })}

        {/* Sell inside mobile */}
        <Link
          to="/marketplace/sell"
          onClick={() => setMenuOpen(false)}
          className="mp-mobile-sell"
          style={styles.mobileSell}
        >
          <Tag size={18} strokeWidth={2} />
          <span>Sell an Item</span>
          <span style={styles.mobileSellBadge}>+List</span>
        </Link>
      </div>
    </>
  );
}

// ─── Inline CSS ────────────────────────────────────────────────────
const STYLES_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes dropIn {
    from { opacity:0; transform: translateY(-10px) scale(0.96); }
    to   { opacity:1; transform: none; }
  }
  @keyframes badgePop {
    from { transform: scale(0); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  @keyframes mobileSlideIn {
    from { opacity:0; transform: translateX(-6px); }
    to   { opacity:1; transform: none; }
  }

  /* Tab hover */
  .mp-tab:hover:not(.active) {
    color: rgba(255,255,255,0.95) !important;
    background: rgba(255,255,255,0.1);
    border-radius: 28px;
  }

  /* Sell button */
  .mp-sell-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #fff;
    color: #1565c0 !important;
    border: none;
    border-radius: 40px;
    font-size: 13.5px;
    font-weight: 700;
    font-family: ${FONT};
    cursor: pointer;
    text-decoration: none;
    transition: transform 0.18s cubic-bezier(.34,1.56,.64,1), box-shadow 0.18s ease, background 0.15s;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    letter-spacing: 0.1px;
    white-space: nowrap;
  }
  .mp-sell-btn:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 6px 22px rgba(0,0,0,0.2);
    background: #f0f7ff;
  }

  /* Profile button */
  .mp-profile-btn:hover {
    background: rgba(255,255,255,0.2) !important;
    border-color: rgba(255,255,255,0.38) !important;
  }

  /* Dropdown items */
  .mp-drop-item { transition: background 0.15s, padding-left 0.15s; }
  .mp-drop-item:hover { background: #f0f7ff !important; padding-left: 22px !important; }
  .mp-drop-danger:hover { background: #fff1f3 !important; }

  /* Mobile link */
  .mp-mobile-link { transition: background 0.15s, color 0.15s, padding-left 0.2s; }
  .mp-mobile-link:hover { background: rgba(255,255,255,0.12) !important; padding-left: 28px !important; }

  /* Responsive breakpoints */
  @media (max-width: 1024px) {
    .mp-tab { padding: 7px 12px !important; font-size: 12.5px !important; }
    .mp-tab-label { display: none !important; }
    .mp-tab { gap: 0 !important; padding: 8px 13px !important; }
  }
  @media (max-width: 820px) {
    .mp-tabs-wrap { display: none !important; }
    .mp-hamburger { display: flex !important; }
    .mp-uname     { display: none !important; }
    .mp-sell-label { display: none !important; }
    .mp-sell-btn  { padding: 8px 10px !important; }
  }
  @media (max-width: 480px) {
    .mp-brand-text { display: none !important; }
  }
`;

// ─── Style objects ────────────────────────────────────────────────
const styles = {
  navbar: {
    height: 66,
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "linear-gradient(105deg, #0f3460 0%, #1565c0 50%, #1976d2 100%)",
    fontFamily: FONT,
    gap: 12,
    flexShrink: 0,
    transition: "box-shadow 0.3s ease",
    overflow: "visible",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    textDecoration: "none",
    flexShrink: 0,
    zIndex: 2,
  },
  brandIconWrap: {
    width: 36,
    height: 36,
    borderRadius: "10px",
    background: "rgba(255,255,255,0.18)",
    border: "1.5px solid rgba(255,255,255,0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backdropFilter: "blur(6px)",
  },
  brandLogo: {
    width: 32, height: 32,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.4)",
  },
  brandText: {
    fontSize: 15,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.3px",
    fontFamily: FONT,
    whiteSpace: "nowrap",
  },

  tabsWrap: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2,
  },
  tabsTrack: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 40,
    padding: "4px 5px",
    position: "relative",
    backdropFilter: "blur(8px)",
  },
  sliderPill: {
    position: "absolute",
    top: 4,
    height: "calc(100% - 8px)",
    background: "#fff",
    borderRadius: 40,
    transition: "left 0.3s cubic-bezier(.4,0,.2,1), width 0.3s cubic-bezier(.4,0,.2,1), opacity 0.2s",
    pointerEvents: "none",
    zIndex: 0,
    boxShadow: "0 2px 10px rgba(21,101,192,0.2)",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    padding: "7px 15px",
    borderRadius: 40,
    fontSize: 13.5,
    fontFamily: FONT,
    textDecoration: "none",
    cursor: "pointer",
    position: "relative",
    zIndex: 1,
    transition: "color 0.2s, background 0.2s",
    whiteSpace: "nowrap",
    letterSpacing: "0.1px",
    border: "none",
    background: "transparent",
  },

  right: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
    zIndex: 2,
  },

  sellBtn: {},   // handled by CSS class

  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.14)",
    border: "1.5px solid rgba(255,255,255,0.22)",
    borderRadius: 40,
    padding: "5px 11px 5px 5px",
    cursor: "pointer",
    fontFamily: FONT,
    transition: "background 0.18s, border-color 0.18s",
  },
  avatar: {
    width: 30, height: 30,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.55)",
    flexShrink: 0,
  },
  uname: {
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "0.1px",
    fontFamily: FONT,
    whiteSpace: "nowrap",
  },

  dropdown: {
    position: "absolute",
    top: "calc(100% + 14px)",
    right: 0,
    background: "#fff",
    borderRadius: 18,
    minWidth: 230,
    maxWidth: "calc(100vw - 32px)",
    boxShadow: "0 24px 48px rgba(15,52,96,0.18), 0 4px 16px rgba(0,0,0,0.08)",
    border: "1px solid rgba(21,101,192,0.1)",
    overflow: "hidden",
    animation: "dropIn 0.22s cubic-bezier(.4,0,.2,1) forwards",
    zIndex: 200,
    fontFamily: FONT,
  },
  dropHead: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "16px 16px 12px",
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    borderBottom: "1px solid #dbeafe",
  },
  dropAvatar: {
    width: 44, height: 44,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2.5px solid #bfdbfe",
    flexShrink: 0,
  },
  dropName:  { fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: FONT },
  dropEmail: { fontSize: 11, color: "#64748b", fontFamily: FONT, marginTop: 2 },
  dropBadge: {
    display: "inline-block",
    marginTop: 4,
    fontSize: 9.5,
    fontWeight: 700,
    color: "#1565c0",
    background: "#dbeafe",
    borderRadius: 20,
    padding: "1px 8px",
    letterSpacing: "0.5px",
    fontFamily: FONT,
  },
  dropDivider: { height: 1, background: "#f1f5f9" },
  dropItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 18px",
    cursor: "pointer",
    fontSize: 13.5,
    color: "#1e293b",
    fontFamily: FONT,
    textDecoration: "none",
    background: "transparent",
    border: "none",
    width: "100%",
    textAlign: "left",
  },
  dropDanger: { color: "#e11d48" },

  hamburger: {
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    background: "rgba(255,255,255,0.12)",
    border: "1.5px solid rgba(255,255,255,0.22)",
    borderRadius: 10,
    cursor: "pointer",
    transition: "background 0.18s",
    flexShrink: 0,
  },

  mobileMenu: {
    background: "linear-gradient(180deg, #0d47a1 0%, #1565c0 60%, #1976d2 100%)",
    overflow: "hidden",
    transition: "max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.25s ease",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    fontFamily: FONT,
  },
  mobileLink: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "13px 24px",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: FONT,
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    cursor: "pointer",
    animation: "mobileSlideIn 0.2s ease both",
  },
  mobileDot: {
    width: 6, height: 6,
    borderRadius: "50%",
    background: "#93c5fd",
    flexShrink: 0,
  },
  mobileSell: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 24px",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: FONT,
    color: "#fff",
    background: "rgba(255,255,255,0.1)",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  mobileSellBadge: {
    marginLeft: "auto",
    fontSize: 11,
    fontWeight: 700,
    background: "#fff",
    color: "#1565c0",
    borderRadius: 20,
    padding: "2px 10px",
    fontFamily: FONT,
  },
};