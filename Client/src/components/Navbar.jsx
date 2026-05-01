import {
  useState, useEffect, useCallback, useRef,
  lazy, Suspense, memo,
} from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Menu, X } from 'lucide-react'
import { getPublicSettings } from '../api/titleApi'
import { getImageUrl } from '../api/media'

// ─── Lazy-loaded heavy components ────────────────────────────────────────────
const SearchModal = lazy(() => import('./SearchModal'))

// ─── Constants (defined once, never recreated) ───────────────────────────────
const THEMES = {
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

const NAV_LINKS = [
  { name: 'Offers',      path: '/'            },
  { name: 'Marketplace', path: '/marketplace' },
  { name: 'Ticketing',   path: '/ticketing',  disabled: true },
]

const MOBILE_BREAKPOINT = 680

// ─── One-time side effects (fonts + keyframes) ───────────────────────────────
// Runs at module evaluation time — zero runtime overhead on re-renders.
if (typeof document !== 'undefined') {
  if (!document.getElementById('navbar-fonts')) {
    const link = Object.assign(document.createElement('link'), {
      id: 'navbar-fonts', rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap',
    })
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
        transition: background-color .22s ease, color .22s ease, box-shadow .22s ease !important;
      }
      .nav-add-company:hover {
        background-color: #800000 !important;
        color: #fff !important;
        box-shadow: 0 4px 14px rgba(128,0,0,.25) !important;
        border-color: #800000 !important;
      }
    `
    document.head.appendChild(s)
  }
}

// ─── Pure style helpers (no closure, no hook, zero allocation on re-render) ──
function pillStyle(isActive, activePill) {
  return {
    padding: '6px 18px', borderRadius: 999,
    fontSize: 13.5, textDecoration: 'none',
    whiteSpace: 'nowrap', fontFamily: 'inherit',
    transition: 'background .15s, color .15s',
    backgroundColor: isActive ? activePill : 'transparent',
    color: isActive ? '#fff' : '#6B6B6B',
    fontWeight: isActive ? 600 : 400,
  }
}

// ─── Custom hook: debounced mobile check ─────────────────────────────────────
function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < breakpoint
  )
  useEffect(() => {
    let timer
    const handler = () => {
      clearTimeout(timer)
      timer = setTimeout(() => setIsMobile(window.innerWidth < breakpoint), 100)
    }
    window.addEventListener('resize', handler, { passive: true })
    return () => { window.removeEventListener('resize', handler); clearTimeout(timer) }
  }, [breakpoint])
  return isMobile
}

// ─── NavLogo — memoized; only re-renders when its props change ────────────────
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

  const [first, second, ...rest] = settings.app_name.split(' ')
  const imageUrl = getImageUrl(settings?.logo)

  return (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="logo"
          style={{ width: 32, height: 32, borderRadius: 45, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,.12)', flexShrink: 0 }}
          onError={(e) => { e.target.style.display = 'none' }}
          loading="lazy"
          decoding="async"
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

// ─── MobileMenu — memoized sub-component to avoid re-rendering nav on every open/close ──
const MobileMenu = memo(function MobileMenu({ t, isMarketplace, isOffers, isLinkActive, loginUrl, onSearch }) {
  return (
    <div style={{
      borderTop: `1px solid ${t.pillBorder}`, padding: '12px 16px 16px',
      display: 'flex', flexDirection: 'column', gap: 6, backgroundColor: '#fff',
    }}>
      {NAV_LINKS.map(({ name, path, disabled }) => {
        const isActive = isLinkActive(path)
        return (
          <Link
            key={name}
            to={disabled ? '#' : path}
            style={{
              display: 'block', padding: '10px 14px', borderRadius: 10,
              fontSize: 14, textDecoration: 'none', fontFamily: 'inherit',
              cursor: disabled ? 'not-allowed' : 'pointer',
              backgroundColor: isActive ? t.accentLight : 'transparent',
              color: isActive ? t.accentText : '#1A1A1A',
              fontWeight: isActive ? 600 : 400,
              opacity: disabled ? 0.4 : 1,
              pointerEvents: disabled ? 'none' : 'auto',
              transition: 'background-color .2s, color .2s',
            }}
          >
            {name}
          </Link>
        )
      })}

      <div style={{ height: 1, backgroundColor: t.pillBorder, margin: '4px 0' }} />

      <div style={{ display: 'flex', gap: 8 }}>
        {!isMarketplace && (
          <button
            onClick={onSearch}
            style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8, padding: 10, borderRadius: 10,
              border: `1px solid ${t.pillBorder}`, backgroundColor: t.pillBg,
              color: '#6B6B6B', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Search size={14} /> Search
          </button>
        )}
        <Link
          to={loginUrl}
          style={{
            flex: 1, padding: 10, borderRadius: 10,
            backgroundColor: t.signinBg, color: '#fff',
            fontSize: 13.5, fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color .25s',
          }}
        >
          Sign in
        </Link>
      </div>

      {isOffers && (
        <Link
          to="/companyrequest"
          className="nav-add-company"
          style={{
            marginTop: 2, padding: '10px 18px', backgroundColor: '#fff',
            color: t.accentText, border: `1.5px solid ${t.accent}`,
            borderRadius: 10, fontSize: 13.5, fontWeight: 600,
            fontFamily: 'inherit', textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          Add Your Company
        </Link>
      )}
    </div>
  )
})

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [settings, setSettings]         = useState(null)
  const [loading, setLoading]           = useState(true)

  const isMobile = useIsMobile()
  const location = useLocation()

  // Derived state — cheap boolean checks, no useMemo needed
  const isMarketplace = location.pathname.startsWith('/marketplace')
  const isOffers      = !isMarketplace && !location.pathname.startsWith('/ticketing')
  const t             = isMarketplace ? THEMES.marketplace : THEMES.default
  const loginUrl      = isMarketplace ? '/marketplace/login' : '/login'

  // Fetch public settings once; abort on unmount
  useEffect(() => {
    const controller = new AbortController()
    getPublicSettings({ signal: controller.signal })
      .then(res => setSettings(res.data))
      .catch(err => {
        if (err?.name === 'AbortError') return
        if (err?.response?.status !== 404) console.warn('Navbar settings error:', err.message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, []) // empty dep array — intentional single fetch

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  const openSearch  = useCallback(() => { setIsSearchOpen(true); setMenuOpen(false) }, [])
  const closeSearch = useCallback(() => setIsSearchOpen(false), [])
  const toggleMenu  = useCallback(() => setMenuOpen(p => !p), [])

  // Pure path comparison — no closure over derived booleans
  const isLinkActive = useCallback((path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path),
    [location.pathname]
  )

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'sticky', top: 0, left: 0, width: '100%',
          backgroundColor: '#fff',
          borderBottom: `1px solid ${t.pillBorder}`,
          boxShadow: isMarketplace
            ? '0 1px 4px rgba(37,99,235,.08)'
            : '0 1px 4px rgba(0,0,0,.05)',
          zIndex: 50, fontFamily: 'system-ui, -apple-system, sans-serif',
          transition: 'border-color .25s, box-shadow .25s',
        }}
      >
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 60,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr auto' : '1fr auto 1fr',
          alignItems: 'center', gap: 16,
        }}>

          {/* LEFT — Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NavLogo settings={settings} loading={loading} t={t} />
          </div>

          {/* CENTRE — Desktop pill nav */}
          {!isMobile && (
            <nav
              aria-label="Section navigation"
              style={{
                display: 'flex', alignItems: 'center', gap: 2,
                backgroundColor: t.pillBg, border: `1px solid ${t.pillBorder}`,
                borderRadius: 999, padding: 4, justifySelf: 'center',
                transition: 'background-color .25s, border-color .25s',
              }}
            >
              {NAV_LINKS.map(({ name, path, disabled }) => (
                <Link
                  key={name}
                  to={disabled ? '#' : path}
                  aria-disabled={disabled}
                  aria-current={isLinkActive(path) ? 'page' : undefined}
                  style={{
                    ...pillStyle(isLinkActive(path), t.activePill),
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                    pointerEvents: disabled ? 'none' : 'auto',
                  }}
                >
                  {name}
                </Link>
              ))}
            </nav>
          )}

          {/* RIGHT — Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, justifyContent: 'flex-end' }}>

            {/* Desktop search */}
            {!isMobile && !isMarketplace && (
              <button
                onClick={openSearch}
                aria-label="Open search"
                style={{
                  height: 36, borderRadius: 999,
                  border: `1px solid ${t.pillBorder}`, backgroundColor: t.pillBg,
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '0 14px 0 10px',
                  cursor: 'pointer', color: '#6B6B6B', fontSize: 13,
                  transition: 'border-color .25s, background-color .25s',
                }}
              >
                <Search size={14} />
                <span>{t.searchPlaceholder}</span>
              </button>
            )}

            {/* Mobile search icon */}
            {isMobile && !isMarketplace && (
              <button
                onClick={openSearch}
                aria-label="Open search"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: `1px solid ${t.pillBorder}`, backgroundColor: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6B6B6B',
                }}
              >
                <Search size={15} />
              </button>
            )}

            {/* Desktop sign in */}
            {!isMobile && (
              <Link
                to={loginUrl}
                style={{
                  padding: '7px 20px', backgroundColor: t.signinBg, color: '#fff',
                  borderRadius: 999, fontSize: 13.5, fontWeight: 600,
                  whiteSpace: 'nowrap', fontFamily: 'inherit',
                  textDecoration: 'none', display: 'inline-block',
                  transition: 'background .25s',
                }}
              >
                Sign in
              </Link>
            )}

            {/* Desktop add company — visibility toggled via CSS property, node stays mounted */}
            {!isMobile && (
              <Link
                to="/companyrequest"
                className="nav-add-company"
                aria-hidden={!isOffers}
                style={{
                  padding: '6px 18px', backgroundColor: '#fff',
                  color: t.accentText, border: `1.5px solid ${t.accent}`,
                  borderRadius: 999, fontSize: 13.5, fontWeight: 600,
                  whiteSpace: 'nowrap', fontFamily: 'inherit',
                  textDecoration: 'none', display: 'inline-block', flexShrink: 0,
                  visibility: isOffers ? 'visible' : 'hidden',
                  pointerEvents: isOffers ? 'auto' : 'none',
                }}
              >
                Add Your Company
              </Link>
            )}

            {/* Mobile hamburger */}
            {isMobile && (
              <button
                onClick={toggleMenu}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: `1px solid ${t.pillBorder}`, backgroundColor: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#6B6B6B',
                }}
              >
                {menuOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu — separate memoized component */}
        {isMobile && menuOpen && (
          <MobileMenu
            t={t}
            isMarketplace={isMarketplace}
            isOffers={isOffers}
            isLinkActive={isLinkActive}
            loginUrl={loginUrl}
            onSearch={openSearch}
          />
        )}
      </nav>

      {/* SearchModal — lazy-loaded, only mounted when open */}
      {isSearchOpen && (
        <Suspense fallback={null}>
          <SearchModal onClose={closeSearch} />
        </Suspense>
      )}
    </>
  )
}