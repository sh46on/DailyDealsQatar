import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useCallback, memo } from "react";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";
import { useAdminTheme } from "./AdminThemeContext";
import { getImageUrl } from "../api/media";

const FONT = "'DM Sans', sans-serif";

const NAV_TABS = [
  { label: "Offers",      path: "/admin" },
  { label: "Marketplace", path: "/admin/marketplace",  },
  { label: "Ticketing",   path: "/admin/ticketing" },
];

// ─── SVG Background ───────────────────────────────────────────────
const NavbarCurves = memo(() => (
  <svg
    viewBox="0 0 1200 66"
    preserveAspectRatio="none"
    style={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0 }}
  >
    <path d="M0,66 Q200,18 400,44 Q600,66 800,28 Q1000,0 1200,36"  stroke="rgba(255,255,255,0.08)" strokeWidth="2"   fill="none" />
    <path d="M0,28 Q300,56 600,20 Q900,0 1200,50"                   stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" fill="none" />
    <path d="M0,52 Q150,10 350,36 Q550,62 750,16 Q950,0 1200,32"    stroke="rgba(255,255,255,0.04)" strokeWidth="1"   fill="none" />
    <circle cx="1110" cy="8"  r="42" fill="rgba(255,255,255,0.02)" />
    <circle cx="45"   cy="58" r="28" fill="rgba(255,255,255,0.02)" />
  </svg>
));
NavbarCurves.displayName = "NavbarCurves";

// ─── AdminNavbar ──────────────────────────────────────────────────
export default function AdminNavbar({ user = {}, onLogout }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme } = useAdminTheme();

  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const tabsRef = useRef(null);
  const [slider, setSlider] = useState({ left: 0, width: 0 });

  // Offers is active for /admin/** and /offers; otherwise match by prefix
  const getActiveTabPath = () => {
    if (location.pathname.startsWith("/admin/marketplace")) return "/admin/marketplace";
    if (location.pathname.startsWith("/admin/ticketing"))   return "/admin/ticketing";
    return "/admin";
  };
  const activeTabPath = getActiveTabPath();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Slider position
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
    const timer = setTimeout(updateSlider, 50);
    window.addEventListener("resize", updateSlider);
    return () => { clearTimeout(timer); window.removeEventListener("resize", updateSlider); };
  }, [location.pathname, updateSlider]);

  // User display
  const firstName    = user?.first_name || "";
  const lastName     = user?.last_name  || "";
  const fullName     = [firstName, lastName].filter(Boolean).join(" ") || "Admin";
  const displayName  = firstName || "Admin";
  const initials     = (firstName[0] || "A") + (lastName[0] || "");
  const imageUrl = getImageUrl(user?.profile_pic);
  const hasProfilePic = !!imageUrl;
  console.log("AdminNavbar render", { user, imageUrl });

  return (
    <header
      style={{
        ...styles.navbar,
        background: theme.gradientNavbar,
        boxShadow:  `0 2px 20px ${theme.shadow}`,
        transition: "background 0.4s ease",
      }}
    >
      <div style={styles.curvesWrap}><NavbarCurves /></div>

      {/* Center Tabs with Slider */}
      <div style={styles.nbTabsWrapper}>
        <div style={styles.nbTabs} ref={tabsRef}>
          <div className="nb-slider" style={{ left: slider.left, width: slider.width }} />
          {NAV_TABS.map(({ label, path }) => {
            const isActive = activeTabPath === path;
            return (
              <button
                key={path}
                className={`nb-tab ${isActive ? "active" : ""}`}
                // Override active text color to match current theme
                style={isActive ? { color: theme.activeText } : {}}
                onClick={() => navigate(path)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Dropdown */}
      <div style={styles.nbRight} ref={dropRef}>
        <button className="nb-profile-btn" onClick={() => setDropOpen((p) => !p)}>
          {hasProfilePic ? (
            <img src={imageUrl} alt="avatar" style={styles.nbAvatar} />
          ) : (
            <div style={styles.nbAvatarFallback}>{initials.slice(0, 2)}</div>
          )}
          <span style={styles.nbProfileName}>{displayName}</span>
          <ChevronDown size={14} className={`nb-chevron ${dropOpen ? "open" : ""}`} />
        </button>

        {dropOpen && (
          <div style={styles.dropdown}>
            <div style={styles.dropHeader}>
              {imageUrl ? (
  <img
    src={imageUrl}
    alt="avatar"
    style={{
      ...styles.dropAvatar,
      objectFit: "cover",
      background: theme.primary,
    }}
    onError={(e) => {
      e.target.style.display = "none";
    }}
  />
) : (
  <div style={{ ...styles.dropAvatar, background: theme.primary }}>
    {initials.slice(0, 2)}
  </div>
)}
              <div>
                <div style={styles.dropName}>{fullName}</div>
                {user?.email && <div style={styles.dropEmail}>{user.email}</div>}
                <div style={styles.dropRole}>Administrator</div>
              </div>
            </div>

            <div style={styles.dropDivider} />

            
            <div className="nb-drop-item" onClick={() => { navigate("/admin/settings"); setDropOpen(false); }}>
              <Settings size={14} /> Settings
            </div>

            <div style={styles.dropDivider} />

            <div className="nb-drop-item danger" onClick={onLogout}>
              <LogOut size={14} /> Logout
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = {
  navbar: {
    height: 64,
    display: "flex",
    alignItems: "center",
    padding: "0 28px",
    position: "sticky",
    top: 0,
    zIndex: 90,
    overflow: "visible",
    gap: 20,
    flexShrink: 0,
  },
  curvesWrap: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  nbTabsWrapper: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2,
  },
  nbTabs: {
    display: "flex",
    alignItems: "center",
    background: "rgba(0,0,0,0.2)",
    borderRadius: 40,
    padding: "4px",
    gap: 2,
    border: "1px solid rgba(255,255,255,0.1)",
    position: "relative",
  },
  nbRight: {
    marginLeft: "auto",
    position: "relative",
    zIndex: 2,
  },
  nbAvatar: {
    width: 36, height: 36,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(255,255,255,0.6)",
  },
  nbAvatarFallback: {
    width: 36, height: 36,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    border: "2px solid rgba(255,255,255,0.5)",
    color: "#fff",
    fontSize: 13, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: FONT,
  },
  nbProfileName: {
    fontSize: 13.5, fontWeight: 600,
    color: "#fff", letterSpacing: "0.2px",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 12px)",
    right: 0,
    background: "#fff",
    borderRadius: 20,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08)",
    minWidth: 230,
    overflow: "hidden",
    border: "1px solid rgba(0,0,0,0.06)",
    animation: "dropFadeIn 0.2s ease forwards",
    zIndex: 200,
  },
  dropHeader: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "14px 16px 12px",
    background: "linear-gradient(135deg, #f8f8fc, #fff)",
  },
  dropAvatar: {
    width: 44, height: 44,
    borderRadius: "50%",
    color: "#fff",
    fontSize: 14, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontFamily: FONT,
    transition: "background 0.3s ease",
  },
  dropName:    { fontSize: 14, fontWeight: 600, color: "#1a1a1a", fontFamily: FONT },
  dropRole:    { fontSize: 11, color: "#888", fontFamily: FONT, marginTop: 2 },
  dropEmail:   { fontSize: 10.5, color: "#aaa", fontFamily: FONT, marginTop: 1 },
  dropDivider: { height: 1, background: "#f0f0f0" },
};