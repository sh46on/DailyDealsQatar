import {
  useState, useEffect, useCallback, useRef,
  lazy, Suspense, memo,
} from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Menu, X } from 'lucide-react'
import { getPublicSettings } from '../api/titleApi'
import { getImageUrl } from '../api/media'

// SearchModal lazy-loaded — only downloaded when user opens search
const SearchModal = lazy(() => import('./SearchModal'))

/* ── Theme tokens ── */
const themes = {
  default: {
    accent: '#E24B4A', accentDark: '#C23937', accentLight: '#FCE8E8',
    accentText: '#A32D2D', pillBg: '#F7F7F5', pillBorder: '#EBEBEB',
    signinBg: '#E24B4A', activePill: '#E24B4A',
    logoPrimary: '#C23937', logoSecondary: '#C23937',
    logoGradient: 'linear-gradient(135deg, #C23937 0%, #E24B4A 100%)',
    logoShadow: 'rgba(226,75,74,0.35)',
    searchPlaceholder: 'Search deals…',
  },
  marketplace: {
    accent: '#2563EB', accentDark: '#1D4ED8', accentLight: '#EFF6FF',
    accentText: '#1E40AF', pillBg: '#EFF6FF', pillBorder: '#BFDBFE',
    signinBg: '#2563EB', activePill: '#2563EB',
    logoPrimary: '#1D4ED8', logoSecondary: '#2563EB',
    logoGradient: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
    logoShadow: 'rgba(37,99,235,0.35)',
    searchPlaceholder: 'Search marketplace…',
  },
}

const navLinks = [
  { name: 'Offers',      path: '/'            },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Ticketing',   path: '/ticketing',  disabled: true },
]

/* ── Inject fonts + keyframes once ── */
if (typeof document !== 'undefined') {
  if (!document.getElementById('navbar-fonts')) {
    const link = document.createElement('link')
    link.id = 'navbar-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap'
    document.head.appendChild(link)
  }
  if (!document.getElementById('navbar-kf')) {
    const s = document.createElement('style')
    s.id = 'navbar-kf'
    s.textContent = `
      @keyframes skeletonSlide {
        0%   { background-position: 200% 0 }
        100% { background-position: -200% 0 }
      }
      .nav-add-company {
        transition: background-color 0.22s ease, color 0.22s ease, box-shadow 0.22s ease !important;
      }
      .nav-add-company:hover {
        background-color: #800000 !important;
        color: #ffffff !important;
        box-shadow: 0 4px 14px rgba(128,0,0,0.25) !important;
        border-color: #800000 !important;
      }
    `
    document.head.appendChild(s)
  }
}

/* ── Logo — memoized, only re-renders when settings/theme changes ── */
const NavLogo = memo(function NavLogo({ settings, loading, t }) {
  if (loading) return (
    <div style={{
      width: 140, height: 32, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(90deg,#f0f0f0 25%,#fafafa 50%,#f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonSlide 1.4s ease infinite',
    }} />
  )

  if (!settings?.app_name) return null

  const parts = settings.app_name.split(' ')
  const [first, second, ...rest] = parts
  const imageUrl = getImageUrl(settings?.logo)

  return (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="logo"
          style={{ width: 32, height: 32, borderRadius: 45, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', flexShrink: 0 }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
      ) : (
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: t.logoGradient,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 8px ${t.logoShadow}`,
        }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: '#fff', lineHeight: 1, userSelect: 'none' }}>
            {first?.[0]}
          </span>
        </div>
      )}
      <span style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 19, fontWeight: 400, letterSpacing: '-0.3px',
        color: t.logoPrimary, lineHeight: 1.1, whiteSpace: 'nowrap',
      }}>
        {first}
        {second && <span style={{ color: t.logoSecondary }}> {second}</span>}
        {rest.length > 0 && <span style={{ color: '#1A1A1A', fontStyle: 'italic' }}> {rest.join(' ')}</span>}
      </span>
    </Link>
  )
})

/* ── useIsMobile — debounced resize ── */
function useIsMobile(breakpoint = 680) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    let t
    const handler = () => {
      clearTimeout(t)
      t = setTimeout(() => setIsMobile(window.innerWidth < breakpoint), 100)
    }
    window.addEventListener('resize', handler)
    return () => { window.removeEventListener('resize', handler); clearTimeout(t) }
  }, [breakpoint])
  return isMobile
}

/* ── Main Navbar ── */
export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [settings, setSettings]         = useState(null)
  const [loading, setLoading]           = useState(true)

  const isMobile  = useIsMobile()
  const location  = useLocation()

  const isMarketplace = location.pathname.startsWith('/marketplace')
  const isOffers      = !isMarketplace && !location.pathname.startsWith('/ticketing')
  const t             = isMarketplace ? themes.marketplace : themes.default
  const loginUrl      = isMarketplace ? '/marketplace/login' : '/login'

  // Use AbortController instead of cancelled flag
  useEffect(() => {
    const controller = new AbortController()
    getPublicSettings({ signal: controller.signal })
      .then(res => setSettings(res.data))
      .catch(err => {
        if (err?.name === 'AbortError') return
        if (err?.response?.status !== 404) console.warn('Could not load navbar settings:', err.message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const openSearch  = useCallback(() => { setIsSearchOpen(true);  setMenuOpen(false) }, [])
  const closeSearch = useCallback(() => setIsSearchOpen(false), [])
  const toggleMenu  = useCallback(() => setMenuOpen(p => !p), [])

  const isLinkActive = useCallback((path) =>
    location.pathname === path ||
    (path === '/marketplace' && isMarketplace && path !== '/'),
    [location.pathname, isMarketplace]
  )

  const pillStyle = useCallback((isActive) => ({
    padding: '6px 18px', borderRadius: 999,
    fontSize: 13.5, textDecoration: 'none',
    whiteSpace: 'nowrap', fontFamily: 'inherit',
    transition: 'background 0.15s, color 0.15s',
    backgroundColor: isActive ? t.activePill : 'transparent',
    color: isActive ? '#FFFFFF' : '#6B6B6B',
    fontWeight: isActive ? 600 : 400,
  }), [t.activePill])

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, left: 0, width: '100%',
        backgroundColor: '#FFFFFF',
        borderBottom: `1px solid ${t.pillBorder}`,
        boxShadow: isMarketplace ? '0 1px 4px rgba(37,99,235,0.08)' : '0 1px 4px rgba(0,0,0,0.05)',
        zIndex: 50, fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 60,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr auto' : '1fr auto 1fr',
          alignItems: 'center', gap: 16,
        }}>

          {/* LEFT */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NavLogo settings={settings} loading={loading} t={t} />
          </div>

          {/* CENTRE — desktop pill nav */}
          {!isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2,
              backgroundColor: t.pillBg, border: `1px solid ${t.pillBorder}`,
              borderRadius: 999, padding: 4, justifySelf: 'center',
              transition: 'background-color 0.25s, border-color 0.25s',
            }}>
              {navLinks.map(({ name, path, disabled }) => (
                <Link key={name} to={disabled ? '#' : path} style={{
                  ...pillStyle(isLinkActive(path)),
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.4 : 1,
                  pointerEvents: disabled ? 'none' : 'auto',
                }}>
                  {name}
                </Link>
              ))}
            </div>
          )}

          {/* RIGHT — actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, justifyContent: 'flex-end' }}>

            {!isMobile && !isMarketplace && (
              <button onClick={openSearch} style={{
                height: 36, borderRadius: 999,
                border: `1px solid ${t.pillBorder}`, backgroundColor: t.pillBg,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 14px 0 10px',
                cursor: 'pointer', color: '#6B6B6B', fontSize: 13,
                transition: 'border-color 0.25s, background-color 0.25s',
              }} title="Search">
                <Search size={14} />
                <span>{t.searchPlaceholder}</span>
              </button>
            )}

            {isMobile && !isMarketplace && (
              <button onClick={openSearch} style={{
                width: 36, height: 36, borderRadius: 8,
                border: `1px solid ${t.pillBorder}`, backgroundColor: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#6B6B6B',
              }} title="Search">
                <Search size={15} />
              </button>
            )}

            {!isMobile && (
              <Link to={loginUrl} style={{
                padding: '7px 20px', backgroundColor: t.signinBg, color: '#FFFFFF',
                borderRadius: 999, fontSize: 13.5, fontWeight: 600,
                whiteSpace: 'nowrap', fontFamily: 'inherit',
                textDecoration: 'none', display: 'inline-block',
                transition: 'background 0.25s',
              }}>
                Sign in
              </Link>
            )}

            {!isMobile && (
              <Link to="/companyrequest" className="nav-add-company" style={{
                padding: '6px 18px', backgroundColor: '#FFFFFF',
                color: t.accentText, border: `1.5px solid ${t.accent}`,
                borderRadius: 999, fontSize: 13.5, fontWeight: 600,
                whiteSpace: 'nowrap', fontFamily: 'inherit',
                textDecoration: 'none', display: 'inline-block', flexShrink: 0,
                visibility: isOffers ? 'visible' : 'hidden',
                pointerEvents: isOffers ? 'auto' : 'none',
              }}>
                Add Your Company
              </Link>
            )}

            {isMobile && (
              <button onClick={toggleMenu} style={{
                width: 36, height: 36, borderRadius: 8,
                border: `1px solid ${t.pillBorder}`, backgroundColor: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#6B6B6B',
              }}>
                {menuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* MOBILE MENU */}
        {isMobile && menuOpen && (
          <div style={{
            borderTop: `1px solid ${t.pillBorder}`, padding: '12px 16px 16px',
            display: 'flex', flexDirection: 'column', gap: 6, backgroundColor: '#FFFFFF',
          }}>
            {navLinks.map(({ name, path, disabled }) => {
              const isActive = isLinkActive(path)
              return (
                <Link key={name} to={disabled ? '#' : path}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'block', padding: '10px 14px', borderRadius: 10,
                    fontSize: 14, textDecoration: 'none', fontFamily: 'inherit',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    backgroundColor: isActive ? t.accentLight : 'transparent',
                    color: isActive ? t.accentText : '#1A1A1A',
                    fontWeight: isActive ? 600 : 400,
                    opacity: disabled ? 0.4 : 1,
                    pointerEvents: disabled ? 'none' : 'auto',
                    transition: 'background-color 0.2s, color 0.2s',
                  }}>
                  {name}
                </Link>
              )
            })}

            <div style={{ height: 1, backgroundColor: t.pillBorder, margin: '4px 0' }} />

            <div style={{ display: 'flex', gap: 8 }}>
              {!isMarketplace && (
                <button onClick={openSearch} style={{
                  flex: 1, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, padding: 10, borderRadius: 10,
                  border: `1px solid ${t.pillBorder}`, backgroundColor: t.pillBg,
                  color: '#6B6B6B', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <Search size={14} /> Search
                </button>
              )}
              <Link to={loginUrl} style={{
                flex: 1, padding: 10, borderRadius: 10,
                backgroundColor: t.signinBg, color: '#FFFFFF',
                fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background-color 0.25s',
              }}>
                Sign in
              </Link>
            </div>

            {isOffers && (
              <Link to="/companyrequest" className="nav-add-company" style={{
                marginTop: 2, padding: '10px 18px', backgroundColor: '#FFFFFF',
                color: t.accentText, border: `1.5px solid ${t.accent}`,
                borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                fontFamily: 'inherit', textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                Add Your Company
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* SearchModal only mounted when open; Suspense handles lazy load */}
      {isSearchOpen && (
        <Suspense fallback={null}>
          <SearchModal onClose={closeSearch} />
        </Suspense>
      )}
    </>
  )
}