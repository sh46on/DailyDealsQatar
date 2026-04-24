import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

// ─── Theme Definitions ────────────────────────────────────────────
export const THEMES = {
  offers: {
    key: "offers",
    primary: "#8B1A1A",
    gradientSidebar: "linear-gradient(145deg, #5a0b14 0%, #8B1A1A 45%, #7a1515 100%)",
    gradientNavbar:  "linear-gradient(105deg, #620e18 0%, #8B1A1A 50%, #7a1515 100%)",
    shadow: "rgba(107,15,26,0.25)",
    activeText: "#8B1A1A",
  },
  marketplace: {
    key: "marketplace",
    primary: "#1a4a6b",
    gradientSidebar: "linear-gradient(145deg, #0d2f45 0%, #1a4a6b 45%, #1e5278 100%)",
    gradientNavbar:  "linear-gradient(105deg, #0d2f45 0%, #1a4a6b 50%, #1e5278 100%)",
    shadow: "rgba(13,47,69,0.25)",
    activeText: "#1a4a6b",
  },
  ticketing: {
    key: "ticketing",
    primary: "#4a1a7a",
    gradientSidebar: "linear-gradient(145deg, #2d0e4e 0%, #4a1a7a 45%, #551f8a 100%)",
    gradientNavbar:  "linear-gradient(105deg, #2d0e4e 0%, #4a1a7a 50%, #551f8a 100%)",
    shadow: "rgba(45,14,78,0.25)",
    activeText: "#4a1a7a",
  },
};

// ─── Route → Theme mapping ────────────────────────────────────────
export function getThemeFromPath(pathname) {
  if (pathname.startsWith("/admin/marketplace")) return THEMES.marketplace;
  if (pathname.startsWith("/admin/ticketing"))   return THEMES.ticketing;
  return THEMES.offers; // /admin/**, /offers, default
}

// ─── Context ──────────────────────────────────────────────────────
const AdminThemeContext = createContext({ theme: THEMES.offers });

export function AdminThemeProvider({ children }) {
  const location = useLocation();
  const [theme, setTheme] = useState(() => getThemeFromPath(location.pathname));

  useEffect(() => {
    setTheme(getThemeFromPath(location.pathname));
  }, [location.pathname]);

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}