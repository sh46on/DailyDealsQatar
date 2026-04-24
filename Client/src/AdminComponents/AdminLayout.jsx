import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";
import { AdminThemeProvider } from "./AdminThemeContext";
import { Outlet } from "react-router-dom";
import {AUTH_API} from "../api/api";

// ─── CSS Injection ────────────────────────────────────────────────
const stylesLoaded = new Set();

function injectStyles(id, css) {
  if (stylesLoaded.has(id)) return;
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
  stylesLoaded.add(id);
}

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* ── Loader animations ── */
  @keyframes loaderFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes loaderFadeOut {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
  @keyframes loaderPulse {
    0%, 100% { transform: scale(1);   opacity: 1;   }
    50%       { transform: scale(1.1); opacity: 0.7; }
  }
  @keyframes loaderRing {
    0%   { transform: rotate(0deg);   }
    100% { transform: rotate(360deg); }
  }
  @keyframes loaderRingRev {
    0%   { transform: rotate(0deg);    }
    100% { transform: rotate(-360deg); }
  }
  @keyframes loaderDot {
    0%, 80%, 100% { transform: scale(0);   opacity: 0.3; }
    40%            { transform: scale(1.1); opacity: 1;   }
  }
  @keyframes loaderBar {
    0%   { left: -40%; width: 40%; }
    50%  { left: 30%;  width: 60%; }
    100% { left: 100%; width: 40%; }
  }
  @keyframes loaderWordIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0);   }
  }

  @keyframes sbItemIn {
    from { opacity: 0; transform: translateX(-16px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes dropFadeIn {
    from { opacity: 0; transform: translateY(-12px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .sb-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 12px; cursor: pointer;
    color: rgba(255,255,255,0.65);
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
    transition: all 0.2s ease; position: relative; overflow: hidden;
  }
  .sb-item:hover { color: white; background: rgba(255,255,255,0.1); transform: translateX(2px); }
  .sb-item.active { background: white; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
  .sb-item .sb-arrow { margin-left: auto; opacity: 0; transform: translateX(-6px); transition: all 0.2s ease; }
  .sb-item:hover .sb-arrow,
  .sb-item.active .sb-arrow { opacity: 1; transform: translateX(0); }

  .sb-logout {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 12px; cursor: pointer;
    color: rgba(255,255,255,0.55);
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 500;
    transition: all 0.2s ease; margin-top: 8px;
  }
  .sb-logout:hover { background: rgba(255,90,90,0.18); color: #ffaaaa; transform: translateX(2px); }

  .nb-tab {
    position: relative; padding: 6px 22px; border-radius: 30px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; color: rgba(255,255,255,0.7);
    transition: color 0.2s ease; white-space: nowrap;
    background: transparent; border: none; z-index: 2;
  }
  .nb-tab:hover { color: white; }
  .nb-tab.active { font-weight: 600; }

  .nb-slider {
    position: absolute; height: calc(100% - 8px); top: 4px;
    background: white; border-radius: 30px;
    transition: left 0.35s cubic-bezier(0.34, 1.2, 0.64, 1),
                width 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
    z-index: 1;
  }

  .nb-profile-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 12px 5px 5px; border-radius: 40px; cursor: pointer;
    border: 1.5px solid rgba(255,255,255,0.25);
    transition: all 0.2s ease; background: transparent;
  }
  .nb-profile-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.5); }

  .nb-chevron { transition: transform 0.25s cubic-bezier(0.34, 1.2, 0.64, 1); }
  .nb-chevron.open { transform: rotate(180deg); }

  .nb-drop-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px; font-size: 13.5px; cursor: pointer;
    color: #2c2c2c; font-weight: 500;
    font-family: 'DM Sans', sans-serif; transition: all 0.15s ease;
  }
  .nb-drop-item:hover { background: #f5f5fa; }
  .nb-drop-item.danger:hover { background: #fff1f2; color: #c0392b; }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
  ::-webkit-scrollbar-thumb { background: #999; border-radius: 10px; }
`;

// ─── Page Loader ──────────────────────────────────────────────────
const MESSAGES = [
  "Preparing your dashboard…",
  "Fetching latest data…",
  "Almost ready…",
  "Loading components…",
];

function PageLoader({ visible }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  /* cycle tip messages */
  useEffect(() => {
    const t = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 1400);
    return () => clearInterval(t);
  }, []);

  /* fake progress bar */
  useEffect(() => {
    if (!visible) return;
    setProgress(0);
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 90) { clearInterval(t); return 90; }
        return p + Math.random() * 12;
      });
    }, 200);
    return () => clearInterval(t);
  }, [visible]);

  /* trigger exit animation */
  useEffect(() => {
    if (!visible) {
      setProgress(100);
      const t = setTimeout(() => setExiting(true), 300);
      return () => clearTimeout(t);
    }
    setExiting(false);
  }, [visible]);

  if (!visible && exiting) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#fdf6f0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 0,
      animation: exiting
        ? "loaderFadeOut .45s ease forwards"
        : "loaderFadeIn .3s ease both",
      pointerEvents: visible ? "all" : "none",
    }}>

      {/* ── Top progress bar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 3,
        background: "rgba(140,30,30,0.1)",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0,
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #8b1a1a, #c0392b, #e11d48)",
          borderRadius: "0 2px 2px 0",
          transition: "width .4s ease",
          boxShadow: "0 0 8px rgba(192,57,43,0.5)",
        }} />
      </div>

      {/* ── Spinner assembly ── */}
      <div style={{ position: "relative", width: 110, height: 110, marginBottom: 36 }}>

        {/* Outer ring */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "2px solid rgba(140,30,30,0.08)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "2.5px solid transparent",
          borderTopColor: "#c0392b",
          borderRightColor: "#e11d48",
          animation: "loaderRing 1.1s linear infinite",
        }} />

        {/* Middle ring */}
        <div style={{
          position: "absolute", inset: 14,
          borderRadius: "50%",
          border: "2px solid rgba(140,30,30,0.06)",
        }} />
        <div style={{
          position: "absolute", inset: 14,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "#d97706",
          borderLeftColor: "#ea580c",
          animation: "loaderRingRev .85s linear infinite",
        }} />

        {/* Centre logo mark */}
        <div style={{
          position: "absolute", inset: 28,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #5c0f0f, #8b1a1a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "loaderPulse 2s ease-in-out infinite",
          boxShadow: "0 4px 18px rgba(80,10,10,0.35)",
        }}>
          {/* Simple "D" monogram for Daily Deals */}
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 20,
            color: "#ffe8e8",
            lineHeight: 1,
            userSelect: "none",
          }}>D</span>
        </div>
      </div>

      {/* ── Brand name ── */}
      <div style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 28,
        color: "#5c0f0f",
        letterSpacing: "-0.5px",
        lineHeight: 1,
        marginBottom: 6,
      }}>
        Daily Deals
      </div>
      <div style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 11,
        fontWeight: 600,
        color: "#a05050",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        marginBottom: 32,
      }}>
        Admin Panel
      </div>

      {/* ── Dot indicators ── */}
      <div style={{ display: "flex", gap: 7, marginBottom: 28 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#c0392b",
            animation: `loaderDot 1.3s ${i * 0.18}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* ── Cycling message ── */}
      <div
        key={msgIndex}
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13,
          color: "#6b2a2a",
          fontWeight: 500,
          letterSpacing: "0.01em",
          animation: "loaderWordIn .4s ease both",
        }}
      >
        {MESSAGES[msgIndex]}
      </div>

      {/* ── Progress % ── */}
      <div style={{
        marginTop: 10,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 11,
        color: "#a05050",
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
      }}>
        {Math.min(Math.round(progress), 100)}%
      </div>

    </div>
  );
}

// ─── Inner layout ─────────────────────────────────────────────────
function LayoutInner({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await AUTH_API.get("/user/me/");
        setUser(res.data);
      } catch (err) {
        console.error("User fetch error:", err);
      } finally {
        /* small grace period so the loader doesn't flash for cached data */
        setTimeout(() => setAppReady(true), 600);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <PageLoader visible={!appReady} />

      <div style={{
        ...styles.root,
        opacity: appReady ? 1 : 0,
        transition: "opacity .35s ease",
      }}>
        <AdminSidebar onLogout={handleLogout} />
        <div style={styles.main}>
          <AdminNavbar user={user} onLogout={handleLogout} />
          <main style={styles.pageContent}>{children || <Outlet />}</main>
        </div>
      </div>
    </>
  );
}

// ─── AdminLayout ──────────────────────────────────────────────────
export default function AdminLayout({ children }) {
  useEffect(() => {
    injectStyles("admin-layout-global", GLOBAL_CSS);
  }, []);

  return (
    <AdminThemeProvider>
      <LayoutInner>{children}</LayoutInner>
    </AdminThemeProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'DM Sans', sans-serif",
    background: "#f8f2f2",
  },
  main: {
    marginLeft: 260,
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  pageContent: {
    flex: 1,
    overflowY: "auto",
    minHeight: "calc(100vh - 64px)",
  },
};