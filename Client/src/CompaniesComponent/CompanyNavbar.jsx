import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import LogoutButton from "../AuthComponents/LogoutButton";
import { getImageUrl } from "../api/media";


const ChevronIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const HamburgerIcon = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    {open ? (
      <>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>
    ) : (
      <>
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </>
    )}
  </svg>
);

// Desktop dropdown (hover panel)
const NavDropdown = ({ label, icon, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="nav-dropdown" ref={ref}>
      <button className="nav-link nav-dropdown-toggle" onClick={() => setOpen((o) => !o)}>
        {icon}
        {label}
        <span className={`nav-chevron ${open ? "open" : ""}`}>
          <ChevronIcon />
        </span>
      </button>
      <div className={`dropdown-panel ${open ? "open" : ""}`}>
        {children}
      </div>
    </div>
  );
};

// Mobile accordion section
const MobileSection = ({ label, icon, children, onLinkClick }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mob-section">
      <button className="mob-section-toggle" onClick={() => setOpen((o) => !o)}>
        <span className="mob-section-left">{icon}{label}</span>
        <span className={`nav-chevron ${open ? "open" : ""}`}><ChevronIcon /></span>
      </button>
      {open && (
        <div className="mob-section-body" onClick={onLinkClick}>
          {children}
        </div>
      )}
    </div>
  );
};

export default function CompanyNavbar({ user }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef();
  const location = useLocation();

  // Close profile panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!profileRef.current?.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // --- Derived values from API response with fallbacks ---
  const companyName = user?.company_name || "Company";
  const companyLogo = user?.company_logo || null;
  const companyInitials = companyName.slice(0, 2).toUpperCase();

  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "User";
  const profilePic = user?.profile_pic || null;
  const userInitials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";
  const email = user?.email || "";

  const isActive = (path) => location.pathname === path;

  const flyerIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );

  const productIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );

  return (
    <>
      <nav className="company-navbar">
        {/* LEFT — Company logo + name */}
        <div className="nav-left">
          <Link to="/company" className="nav-brand" onClick={() => setMobileOpen(false)}>
            <div className="brand-mark">
              {companyLogo ? (
                <img src={getImageUrl(companyLogo)} alt={companyName} />
                
              ) : (
                companyInitials
              )}
            </div>
            <div className="brand-text">
              <span className="brand-name">{companyName}</span>
              <span className="brand-sub">Company Panel</span>
            </div>
          </Link>

          <div className="nav-divider desktop-only" />

          {/* Desktop nav links */}
          <div className="desktop-links">
            <Link
              to="/company"
              className={`nav-link ${isActive("/company") ? "active" : ""}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Dashboard
            </Link>

            <NavDropdown label="Flyers" icon={flyerIcon}>
              <div className="dp-section-label">Manage</div>
              <Link to="/company/flyers" className="dp-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 17H7A5 5 0 017 7h2" /><path d="M15 7h2a5 5 0 010 10h-2" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                Manage Flyers
              </Link>
              <Link to="/company/flyers/create" className="dp-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload Flyer
              </Link>
              
            </NavDropdown>

            <NavDropdown label="Products" icon={productIcon}>
              <div className="dp-section-label">Catalog</div>
              <Link to="/company/products" className="dp-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                Manage Products
              </Link>
              <Link to="/company/reviews" className="dp-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                 Reviews
              </Link>
            </NavDropdown>
          </div>
        </div>

        {/* RIGHT */}
        <div className="nav-right">
          {/* Desktop profile dropdown */}
          <div className="nav-profile-wrapper desktop-only" ref={profileRef}>
            <button
              className="profile-btn"
              onClick={() => setProfileOpen((o) => !o)}
              aria-expanded={profileOpen}
            >
              <div className="avatar">
                {profilePic ? (
                  <img src={getImageUrl(profilePic)} alt={fullName} />
                ) : (
                  userInitials
                )}
              </div>
              <div className="profile-info">
                <span className="profile-name">{fullName}</span>
                <span className="profile-role">Company</span>
              </div>
              <span className={`nav-chevron small ${profileOpen ? "open" : ""}`}>
                <ChevronIcon />
              </span>
            </button>

            {profileOpen && (
              <div className="profile-panel">
                <div className="pp-header">
                  <div className="pp-avatar-row">
                    <div className="pp-avatar">
                      {profilePic ? (
                        <img src={getImageUrl(profilePic)} alt={fullName} />
                      ) : (
                        userInitials
                      )}
                    </div>
                    <div>
                      <div className="pp-fullname">{fullName}</div>
                      {email && <div className="pp-email">{email}</div>}
                    </div>
                  </div>
                </div>
                <Link
                  to="/company/profile"
                  className="dp-item"
                  onClick={() => setProfileOpen(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  Edit Profile
                </Link>
                <div className="dp-separator" />
                <div className="dp-item danger">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>

          {/* Mobile: compact avatar badge */}
          <div className="mob-avatar mobile-only">
            <div className="avatar">
              {profilePic ? (
                <img src={getImageUrl(profilePic)} alt={fullName} />
              ) : (
                userInitials
              )}
            </div>
            
            
          </div>

          {/* Hamburger button */}
          <button
            className="hamburger mobile-only"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {mobileOpen && (
        <div className="mob-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile slide-in drawer */}
      <div className={`mob-drawer ${mobileOpen ? "open" : ""}`}>
        {/* User card */}
        <div className="mob-user-card">
          <div className="pp-avatar large">
            {profilePic ? (
              <img src={getImageUrl(profilePic)} alt={fullName} />
            ) : (
              userInitials
            )}
          </div>
          <div>
            <div className="pp-fullname">{fullName}</div>
            {email && <div className="pp-email">{email}</div>}
          </div>
        </div>

        <div className="mob-nav-body">
          <Link
            to="/company"
            className={`mob-link ${isActive("/company") ? "active" : ""}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </Link>

          <MobileSection label="Flyers" icon={flyerIcon} onLinkClick={() => setMobileOpen(false)}>
            <Link to="/company/flyers" className="mob-sub-link">Manage Flyers</Link>
            <Link to="/company/flyers/upload" className="mob-sub-link">Upload Flyer</Link>
          </MobileSection>

          <MobileSection label="Products" icon={productIcon} onLinkClick={() => setMobileOpen(false)}>
            <Link to="/company/products" className="mob-sub-link">Manage Products</Link>
            <Link to="/company/reviews" className="mob-sub-link">Product Reviews</Link>
          </MobileSection>

          <div className="mob-divider" />

          <Link to="/company/profile" className="mob-link" onClick={() => setMobileOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            Edit Profile
          </Link>

          <div className="mob-link danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <LogoutButton />
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        :root {
          --nav-h: 64px;
          --accent: #2563a8;
          --accent-light: #eff6ff;
          --text-primary: #0f172a;
          --text-muted: #64748b;
          --border: #e2e8f0;
          --surface: #ffffff;
          --surface2: #f8fafc;
          --shadow: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05);
          --shadow-lg: 0 10px 25px rgba(0,0,0,.1), 0 4px 6px rgba(0,0,0,.05);
          --radius: 8px;
          --radius-lg: 12px;
          --ease: cubic-bezier(0.4, 0, 0.2, 1);
          --drawer-w: 300px;
        }

        /* ── NAVBAR ───────────────────────────────────── */
        .company-navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: var(--nav-h);
          padding: 0 28px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow);
          position: sticky;
          top: 0;
          z-index: 300;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .nav-left { display: flex; align-items: center; gap: 2px; min-width: 0; }
        .nav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        /* Brand */
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-right: 16px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .brand-mark {
          width: 36px; height: 36px;
          border-radius: 9px;
          background: linear-gradient(135deg, #1a3a5c 0%, #2563a8 100%);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; color: #fff;
          letter-spacing: -0.5px; flex-shrink: 0; overflow: hidden;
        }
        .brand-mark img { width: 100%; height: 100%; object-fit: cover; border-radius: 9px; }
        .brand-text { display: flex; flex-direction: column; line-height: 1.2; }
        .brand-name { font-size: 14px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.3px; }
        .brand-sub  { font-size: 10px; font-weight: 500; color: var(--text-muted); letter-spacing: 0.6px; text-transform: uppercase; }

        .nav-divider { width: 1px; height: 28px; background: var(--border); margin: 0 12px; }

        /* Desktop links */
        .desktop-links { display: flex; align-items: center; gap: 2px; }

        .nav-link {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 11px; border-radius: var(--radius);
          font-size: 13.5px; font-weight: 500; color: var(--text-muted);
          text-decoration: none; cursor: pointer;
          transition: background 0.15s var(--ease), color 0.15s var(--ease);
          border: none; background: none; white-space: nowrap;
          font-family: 'Inter', sans-serif;
        }
        .nav-link:hover  { background: var(--surface2); color: var(--text-primary); }
        .nav-link.active { color: var(--accent); background: var(--accent-light); }

        .nav-chevron { display: flex; align-items: center; transition: transform 0.2s var(--ease); color: var(--text-muted); }
        .nav-chevron.open  { transform: rotate(180deg); }
        .nav-chevron.small { margin-left: 2px; opacity: 0.5; }

        /* Dropdown */
        .nav-dropdown { position: relative; }
        .dropdown-panel {
          position: absolute; top: calc(100% + 8px); left: 0;
          min-width: 200px; background: var(--surface);
          border: 1px solid var(--border); border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg); padding: 6px;
          opacity: 0; transform: translateY(-6px) scale(0.98);
          pointer-events: none;
          transition: opacity 0.18s var(--ease), transform 0.18s var(--ease);
          z-index: 400;
        }
        .dropdown-panel.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

        .dp-section-label {
          padding: 8px 12px 4px; font-size: 10px; font-weight: 600;
          letter-spacing: 0.7px; text-transform: uppercase; color: var(--text-muted);
        }
        .dp-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: 13px; font-weight: 500; color: var(--text-primary);
          text-decoration: none; cursor: pointer;
          transition: background 0.12s, color 0.12s;
          font-family: 'Inter', sans-serif;
          border: none; background: none; width: 100%; text-align: left;
        }
        .dp-item:hover        { background: var(--accent-light); color: var(--accent); }
        .dp-item.danger:hover { background: #fef2f2; color: #dc2626; }
        .dp-separator { height: 1px; background: var(--border); margin: 4px 0; }

        /* Profile button */
        .nav-profile-wrapper { position: relative; }
        .profile-btn {
          display: flex; align-items: center; gap: 9px;
          padding: 5px 10px 5px 5px; border-radius: var(--radius-lg);
          border: 1px solid var(--border); background: var(--surface);
          cursor: pointer; transition: background 0.15s, border-color 0.15s;
          font-family: 'Inter', sans-serif;
        }
        .profile-btn:hover { background: var(--surface2); border-color: #cbd5e1; }

        .avatar {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg, #1a3a5c, #2563a8);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: #fff;
          flex-shrink: 0; overflow: hidden;
        }
        .avatar img { width: 100%; height: 100%; object-fit: cover; }

        .profile-info { display: flex; flex-direction: column; line-height: 1.2; }
        .profile-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
        .profile-role { font-size: 11px; color: var(--text-muted); }

        .profile-panel {
          position: absolute; top: calc(100% + 8px); right: 0;
          width: 240px; background: var(--surface);
          border: 1px solid var(--border); border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg); padding: 8px;
          animation: panelIn 0.18s cubic-bezier(0.4,0,0.2,1) forwards;
          z-index: 400;
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .pp-header { padding: 10px 12px 12px; border-bottom: 1px solid var(--border); margin-bottom: 6px; }
        .pp-avatar-row { display: flex; align-items: center; gap: 10px; }
        .pp-avatar {
          width: 36px; height: 36px; border-radius: 9px;
          background: linear-gradient(135deg, #1a3a5c, #2563a8);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 600; color: #fff;
          flex-shrink: 0; overflow: hidden;
        }
        .pp-avatar.large { width: 44px; height: 44px; font-size: 16px; border-radius: 11px; }
        .pp-avatar img  { width: 100%; height: 100%; object-fit: cover; }
        .pp-fullname { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .pp-email    { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

        /* ── VISIBILITY HELPERS ───────────────────────── */
        .desktop-only { display: flex; }
        .mobile-only  { display: none; }

        /* ── HAMBURGER ────────────────────────────────── */
        .hamburger {
          display: none; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: var(--radius);
          border: 1px solid var(--border); background: var(--surface);
          cursor: pointer; color: var(--text-primary);
          transition: background 0.15s, border-color 0.15s; flex-shrink: 0;
        }
        .hamburger:hover { background: var(--surface2); border-color: #cbd5e1; }

        /* Mobile avatar pill */
        .mob-avatar { display: none; align-items: center; }

        /* ── OVERLAY ──────────────────────────────────── */
        .mob-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(2px);
          z-index: 350;
          animation: fadeIn 0.2s ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }

        /* ── MOBILE DRAWER ────────────────────────────── */
        .mob-drawer {
          display: none; position: fixed;
          top: 0; right: 0;
          width: var(--drawer-w); height: 100dvh;
          background: var(--surface);
          border-left: 1px solid var(--border);
          box-shadow: -8px 0 32px rgba(0,0,0,.12);
          z-index: 400;
          transform: translateX(100%);
          transition: transform 0.28s var(--ease);
          overflow-y: auto;
          flex-direction: column;
        }
        .mob-drawer.open { transform: translateX(0); }

        .mob-user-card {
          display: flex; align-items: center; gap: 12px;
          padding: 24px 20px 18px;
          border-bottom: 1px solid var(--border);
          background: var(--surface2);
        }

        .mob-nav-body {
          padding: 10px 10px 40px;
          display: flex; flex-direction: column; gap: 2px;
        }

        .mob-link {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 12px; border-radius: var(--radius);
          font-size: 14px; font-weight: 500; color: var(--text-primary);
          text-decoration: none; cursor: pointer;
          transition: background 0.12s, color 0.12s;
          font-family: 'Inter', sans-serif;
          border: none; background: none;
          width: 100%; text-align: left;
        }
        .mob-link:hover, .mob-link.active { background: var(--accent-light); color: var(--accent); }
        .mob-link.danger:hover { background: #fef2f2; color: #dc2626; }

        .mob-divider { height: 1px; background: var(--border); margin: 8px 4px; }

        /* Mobile accordion */
        .mob-section { width: 100%; }
        .mob-section-toggle {
          display: flex; align-items: center; justify-content: space-between;
          padding: 11px 12px; border-radius: var(--radius);
          font-size: 14px; font-weight: 500; color: var(--text-primary);
          cursor: pointer; transition: background 0.12s;
          font-family: 'Inter', sans-serif;
          border: none; background: none; width: 100%; text-align: left;
        }
        .mob-section-toggle:hover { background: var(--surface2); }
        .mob-section-left { display: flex; align-items: center; gap: 10px; }
        .mob-section-body {
          padding: 4px 0 4px 32px;
          display: flex; flex-direction: column; gap: 1px;
          animation: slideDown 0.15s ease forwards;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mob-sub-link {
          display: block; padding: 9px 12px; border-radius: var(--radius);
          font-size: 13.5px; font-weight: 500; color: var(--text-muted);
          text-decoration: none; transition: background 0.12s, color 0.12s;
        }
        .mob-sub-link:hover { background: var(--accent-light); color: var(--accent); }

        /* ── RESPONSIVE ───────────────────────────────── */

        /* Tablet (721px – 900px): compact nav, hide subtitle */
        @media (max-width: 900px) {
          .brand-sub { display: none; }
          .desktop-links .nav-link,
          .desktop-links .nav-dropdown-toggle {
            padding: 7px 9px;
            font-size: 13px;
          }
        }

        /* Mobile (≤720px): switch to drawer */
        @media (max-width: 720px) {
          .company-navbar { padding: 0 16px; }
          .nav-brand       { margin-right: 0; }
          .brand-text      { display: none; }
          .desktop-links   { display: none; }

          .desktop-only    { display: none !important; }
          .mobile-only     { display: flex; }

          .hamburger       { display: flex; }
          .mob-avatar      { display: flex; }

          .mob-overlay     { display: block; }
          .mob-drawer      { display: flex; }
        }

        /* Very small screens */
        @media (max-width: 360px) {
          .mob-drawer { width: 100vw; border-left: none; }
        }
      `}</style>
    </>
  );
}