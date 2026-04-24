// UserNavbar.jsx — fully responsive version

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, LogOut, User } from "lucide-react";
import LogoutButton from "../AuthComponents/LogoutButton";
import { getUserNavbar, BASE_URL } from "./api/userApi";


const BASE = BASE_URL;
const FONT = "'DM Sans', sans-serif";

const LINKS = [
  { to: "/user/home",         label: "Dashboard"    },
  { to: "/user/saved-items", label: "Saved Items" },
  { to: "/user/profile",      label: "Edit Profile" },
];

const NavbarCurves = memo(() => (
  <svg
    viewBox="0 0 1200 64"
    preserveAspectRatio="none"
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

export default function UserNavbar() {
  const [dropOpen, setDropOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user,     setUser]     = useState(null);
  const [slider,   setSlider]   = useState({ left: 0, width: 0 });

  const dropRef  = useRef(null);
  const tabsRef  = useRef(null);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const res = await getUserNavbar();
        setUser(res.data.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateSlider = useCallback(() => {
    if (!tabsRef.current) return;
    const container = tabsRef.current;
    const activeTab = container.querySelector(".nb-tab.active");
    if (!activeTab) return;
    const cRect = container.getBoundingClientRect();
    const tRect = activeTab.getBoundingClientRect();
    setSlider({ left: tRect.left - cRect.left - 2, width: tRect.width });
  }, []);

  useEffect(() => {
    const t = setTimeout(updateSlider, 50);
    window.addEventListener("resize", updateSlider);
    return () => { clearTimeout(t); window.removeEventListener("resize", updateSlider); };
  }, [location.pathname, updateSlider]);

  const firstName   = user?.first_name || "";
  const lastName    = user?.last_name  || "";
  const fullName    = [firstName, lastName].filter(Boolean).join(" ") || "User";
  const displayName = firstName || "User";

  const avatarSrc = user?.profile_pic
    ? user.profile_pic.startsWith("http")
      ? user.profile_pic
      : `${BASE}${user.profile_pic}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=8B1A2A&color=fff&size=128`;

  const appLogo = user?.app_logo || "/logo.png";
  const appName = user?.app_name || "Deals";

  return (
    <>
      <header style={styles.navbar}>
        <NavbarCurves />

        {/* Brand */}
        <Link to="/user/home" style={styles.brand}>
          <img src={appLogo} alt={appName} style={styles.brandLogo} />
          {/* FIX: className as JSX prop, not in style object */}
          <span className="nb-brand-name" style={styles.brandName}>{appName}</span>
        </Link>

        {/* Center tabs — FIX: className as JSX prop */}
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

        {/* Right: profile + hamburger */}
        <div style={styles.right} ref={dropRef}>
          <button
            onClick={() => setDropOpen((p) => !p)}
            style={styles.profileBtn}
          >
            <img src={avatarSrc} alt="avatar" style={styles.avatar} />
            {/* FIX: className as JSX prop */}
            <span className="nb-profile-name" style={styles.profileName}>{displayName}</span>
            <ChevronDown
              size={14}
              style={{
                color: "#fff",
                opacity: 0.8,
                transition: "transform 0.22s ease",
                transform: dropOpen ? "rotate(180deg)" : "none",
                flexShrink: 0,
              }}
            />
          </button>

          {dropOpen && (
            <div style={styles.dropdown}>
              <div style={styles.dropHeader}>
                <img src={avatarSrc} alt="avatar" style={styles.dropAvatar} />
                <div>
                  <div style={styles.dropName}>{fullName}</div>
                  {user?.email && <div style={styles.dropEmail}>{user.email}</div>}
                  {/* <div style={styles.dropRole}>Member</div> */}
                </div>
              </div>

              <div style={styles.divider} />    

              <Link
                to="/user/profile"
                onClick={() => setDropOpen(false)}
                style={styles.dropItem}
                onMouseEnter={e => e.currentTarget.style.background = "#fdf5f6"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <User size={14} style={{ opacity: 0.6 }} />
                Profile
              </Link>

              <div style={styles.divider} />

              <div
                style={{ ...styles.dropItem, ...styles.dropItemDanger }}
                onMouseEnter={e => e.currentTarget.style.background = "#fdf2f2"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <LogOut size={14} style={{ opacity: 0.8 }} />
                <LogoutButton />
              </div>
            </div>
          )}

          {/* FIX: className as JSX prop */}
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="nb-hamburger"
            style={styles.hamburger}
            aria-label="Toggle menu"
          >
            <span style={{ ...styles.hLine, transform: menuOpen ? "translateY(6.5px) rotate(45deg)" : "none" }} />
            <span style={{ ...styles.hLine, opacity: menuOpen ? 0 : 1 }} />
            <span style={{ ...styles.hLine, transform: menuOpen ? "translateY(-6.5px) rotate(-45deg)" : "none" }} />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
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
              onClick={() => { setMenuOpen(false); setDropOpen(false); }}
              style={{
                ...styles.mobileLink,
                color:      isActive ? "#fff" : "rgba(255,255,255,0.75)",
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
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }

        /* --- Tablet: shrink tabs before hiding them --- */
        @media (max-width: 1024px) {
          .nb-tab { padding: 6px 10px !important; font-size: 13px !important; }
        }
        @media (max-width: 900px) {
          .nb-tab { padding: 6px 8px !important; font-size: 12px !important; }
        }

        /* --- Mobile: hide tabs, show hamburger --- */
        @media (max-width: 760px) {
          .nb-tabs-wrap    { display: none !important; }
          .nb-hamburger    { display: flex !important; }
          .nb-profile-name { display: none !important; }
          .nb-brand-name   { display: none !important; }
        }
        @media (max-width: 420px) {
          .nb-navbar { padding: 0 14px !important; }
        }
      `}</style>
    </>
  );
}

const GRADIENT = "linear-gradient(105deg,#6B0F1A,#8B1A2A,#B5243C,#D4445A)";

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
  // FIX: removed className key — it belongs on the JSX element
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
    // FIX: prevent overflow on narrow phones
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
  dropName:  { fontSize: 14, fontWeight: 600, color: "#1a1a1a", fontFamily: FONT },
  dropEmail: { fontSize: 10.5, color: "#aaa", fontFamily: FONT, marginTop: 2 },
  dropRole:  { fontSize: 11, color: "#888", fontFamily: FONT, marginTop: 1 },
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
  // FIX: removed className key
  hamburger: {
    display: "none",
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
    transition: "transform 0.2s, opacity 0.2s",
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
    transition: "background 0.15s, color 0.15s, padding-left 0.15s",
  },
  dot: {
    width: 6, height: 6,
    borderRadius: "50%",
    flexShrink: 0,
    transition: "background 0.15s",
  },
};