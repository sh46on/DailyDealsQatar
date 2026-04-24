import { useNavigate, useLocation } from "react-router-dom";
import { memo } from "react";
import {
  LogOut, LayoutDashboard, Building2, Users, Image, Package, Tags,
  Settings, Sparkles, ArrowRight,
  ShoppingBag, Star, BarChart2, Percent, Store,
  Ticket, CalendarDays, MapPin, Clock, HeadphonesIcon,MailPlus,
} from "lucide-react";
import { useAdminTheme } from "./AdminThemeContext";

// ─── Per-tab sidebar menus ────────────────────────────────────────
const MENUS = {
  offers: [
    { label: "Dashboard",         icon: LayoutDashboard, path: "/admin" },
    { label: "Manage Companies",  icon: Building2,       path: "/admin/companies" },
    { label: "Manage Users",      icon: Users,           path: "/admin/users" },
    { label: "Manage Flyers",     icon: Image,           path: "/admin/flyers" },
    { label: "Manage Products",   icon: Package,         path: "/admin/products" },
    { label: "Manage Categories", icon: Tags,            path: "/admin/categories" },
    { label: "Company Requests",  icon: MailPlus,        path: "/admin/company-requests" },
    { label: "Settings",          icon: Settings,        path: "/admin/settings" },
  ],
  marketplace: [
    { label: "Overview",          icon: BarChart2,       path: "/admin/marketplace" },
    { label: "Manage Listings",          icon: ShoppingBag,     path: "/admin/marketplace/listings" },
    { label: "Manage Users",             icon: Users,           path: "/admin/marketplace/users" },
  ],
  ticketing: [
    { label: "Overview",          icon: BarChart2,       path: "/admin/ticketing" },
    { label: "All Tickets",       icon: Ticket,          path: "/admin/ticketing/tickets" },
    { label: "Events",            icon: CalendarDays,    path: "/admin/ticketing/events" },
    { label: "Venues",            icon: MapPin,          path: "/admin/ticketing/venues" },
    { label: "Schedules",         icon: Clock,           path: "/admin/ticketing/schedules" },
    { label: "Support",           icon: HeadphonesIcon,  path: "/admin/ticketing/support" },
    { label: "Settings",          icon: Settings,        path: "/admin/ticketing/settings" },
  ],
};

const SECTION_LABELS = {
  offers:      "ADMIN MENU",
  marketplace: "MARKETPLACE",
  ticketing:   "TICKETING",
};

// ─── SVG Background ───────────────────────────────────────────────
const SidebarCurves = memo(() => (
  <svg
    viewBox="0 0 260 900"
    preserveAspectRatio="none"
    style={{ position: "absolute", width: "100%", height: "100%", top: 0, left: 0 }}
  >
    <path d="M-20,120 Q80,160 140,220 Q200,280 260,260"   stroke="rgba(255,255,255,0.06)"  strokeWidth="2"   fill="none" />
    <path d="M-20,260 Q60,300 130,350 Q200,400 280,378"   stroke="rgba(255,255,255,0.04)"  strokeWidth="1.5" fill="none" />
    <path d="M20,500 Q120,478 180,540 Q240,600 260,648"   stroke="rgba(255,255,255,0.05)"  strokeWidth="2"   fill="none" />
    <path d="M-10,690 Q80,665 150,714 Q220,762 270,805"   stroke="rgba(255,255,255,0.035)" strokeWidth="1.5" fill="none" />
    <circle cx="220" cy="76"  r="62" fill="rgba(255,255,255,0.02)" />
    <circle cx="30"  cy="830" r="84" fill="rgba(255,255,255,0.015)" />
  </svg>
));
SidebarCurves.displayName = "SidebarCurves";

// ─── AdminSidebar ─────────────────────────────────────────────────
export default function AdminSidebar({ onLogout }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { theme } = useAdminTheme();

  // Determine which menu set to show
  const getMenuKey = () => {
    if (location.pathname.startsWith("/admin/marketplace")) return "marketplace";
    if (location.pathname.startsWith("/admin/ticketing"))   return "ticketing";
    return "offers";
  };
  const menuKey  = getMenuKey();
  const menuItems = MENUS[menuKey];
  const sectionLabel = SECTION_LABELS[menuKey];

  const isActive = (path) => {
  if (
    path === "/admin" ||
    path === "/admin/marketplace" ||
    path === "/admin/ticketing"
  ) {
    return location.pathname === path;
  }
  return location.pathname.startsWith(path);
};

  return (
    <aside
      style={{
        ...styles.sidebar,
        background: theme.gradientSidebar,
        boxShadow:  `8px 0 32px ${theme.shadow}`,
        transition: "background 0.4s ease",
      }}
    >
      <div style={styles.curvesWrap}><SidebarCurves /></div>

      {/* Logo */}
      <div style={styles.sbLogo}>
        <div style={styles.sbLogoIcon}>D</div>
        <div>
          <div style={styles.sbLogoTitle}>Daily Deals</div>
          <div style={styles.sbLogoSub}>QATAR · ADMIN</div>
        </div>
      </div>

      <div style={styles.divider} />
      <div style={styles.sectionLabel}>{sectionLabel}</div>

      {/* Menu items — re-animate on menu change via key */}
      <nav style={styles.sbMenu} key={menuKey}>
        {menuItems.map(({ label, icon: Icon, path }, i) => (
          <div
            key={path}
            className={`sb-item ${isActive(path) ? "active" : ""}`}
            onClick={() => navigate(path)}
            style={{
              animation: `sbItemIn 0.3s ease both`,
              animationDelay: `${i * 0.04}s`,
              // Override active item text to match theme
              ...(isActive(path) ? { color: theme.activeText } : {}),
            }}
          >
            <Icon size={16} strokeWidth={isActive(path) ? 2.2 : 1.8} />
            <span>{label}</span>
            <ArrowRight size={13} className="sb-arrow" strokeWidth={2.5} />
          </div>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Version Card */}
      <div style={styles.sbBottomCard}>
        <Sparkles size={14} style={{ marginBottom: 6, opacity: 0.5 }} />
        <div style={styles.sbBottomTitle}>Admin Panel v1.0</div>
        <div style={styles.sbBottomSub}>Daily Deals Qatar</div>
      </div>

      <div style={styles.divider} />

      {/* Logout */}
      <div className="sb-logout" onClick={onLogout}>
        <LogOut size={16} strokeWidth={1.8} />
        <span>Logout</span>
      </div>
    </aside>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = {
  sidebar: {
    width: 260,
    minHeight: "100vh",
    position: "fixed",
    left: 0, top: 0,
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px 24px",
    overflow: "hidden",
  },
  curvesWrap: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  sbLogo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    paddingLeft: 4,
    marginBottom: 8,
    position: "relative",
    zIndex: 2,
  },
  sbLogoIcon: {
    width: 44, height: 44,
    borderRadius: 14,
    background: "rgba(255,255,255,0.12)",
    border: "1.5px solid rgba(255,255,255,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Playfair Display', serif",
    fontSize: 24, fontWeight: 700, color: "#fff",
  },
  sbLogoTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 16, fontWeight: 700,
    color: "#fff", letterSpacing: "-0.2px", lineHeight: 1.2,
  },
  sbLogoSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: 500, letterSpacing: "0.6px", marginTop: 2,
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.1)",
    margin: "12px 0 10px",
    borderRadius: 1,
    position: "relative", zIndex: 2, flexShrink: 0,
  },
  sectionLabel: {
    fontSize: 9.5, fontWeight: 700,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: "1.8px",
    paddingLeft: 14, marginBottom: 10,
    position: "relative", zIndex: 2,
  },
  sbMenu: {
    display: "flex", flexDirection: "column", gap: 4,
    position: "relative", zIndex: 2,
  },
  sbBottomCard: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: "12px 14px",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: 8,
    position: "relative", zIndex: 2,
  },
  sbBottomTitle: { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)" },
  sbBottomSub:   { fontSize: 10, color: "rgba(255,255,255,0.32)", marginTop: 3 },
};