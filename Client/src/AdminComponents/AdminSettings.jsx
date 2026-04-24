import { useEffect, useState } from 'react'
import {
  getSettings,
  updateSettings,
  getProfile,
  updateProfile,
} from '../api/authApi'
import AdminLayout from './AdminLayout'

/* ─────────────────────────────────────────────────────────────────
   THEME
───────────────────────────────────────────────────────────────── */
const C = {
  bg: '#fdf6f0',
  bgCard: '#ffffff',
  bgCardWarm: '#fff9f6',
  bgCardTint: '#fef2ee',
  navDark: '#5c0f0f',
  navMid: '#8b1a1a',
  navBright: '#c0392b',
  emerald: '#059669',
  rose: '#e11d48',
  textH: '#1a0505',
  textP: '#3d1010',
  textMid: '#6b2a2a',
  textDim: '#a05050',
  textOnDark: '#ffe8e8',
  border: 'rgba(140,30,30,0.12)',
  borderMid: 'rgba(140,30,30,0.22)',
  shadow: 'rgba(80,10,10,0.08)',
}

const FONT_LINK =
  'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'

/* ── Helpers ─────────────────────────────────────────────────── */
function fullName(p) {
  return [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Admin'
}
function nameInitials(p) {
  const f = p.first_name?.[0]?.toUpperCase() ?? ''
  const l = p.last_name?.[0]?.toUpperCase() ?? ''
  return f + l || 'AD'
}

/* ── Avatar with overlay upload button ──────────────────────── */
function AvatarUpload({ preview, initials, onFile, shape = 'circle' }) {
  const isCircle = shape === 'circle'
  const radius = isCircle ? '50%' : 14
  return (
    <label
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: 'pointer',
        marginBottom: 22,
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: radius,
          overflow: 'hidden',
          background: 'rgba(139,26,26,.09)',
          border: `2px solid ${C.borderMid}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: C.navMid,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {initials}
          </span>
        )}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: C.navMid,
          border: `2px solid ${C.bgCard}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1v10M1 6h10"
            stroke={C.textOnDark}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files[0]
          if (f) onFile(f)
        }}
      />
    </label>
  )
}

/* ── Shared form components ──────────────────────────────────── */
function SectionCard({ children, style }) {
  return (
    <div
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: '26px 28px',
        boxShadow: `0 2px 10px ${C.shadow}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 20,
        fontWeight: 400,
        color: C.navDark,
        marginBottom: 20,
        paddingBottom: 14,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      {children}
    </div>
  )
}

function SubSectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.textDim,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 14,
        paddingTop: 14,
        borderTop: `1px solid ${C.border}`,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {children}
    </div>
  )
}

function Label({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.textDim,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: 6,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {children}
    </div>
  )
}

function FieldIcon({ children }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        color: C.textDim,
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  )
}

function StyledInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  style,
}) {
  return (
    <div>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          background: error ? '#fff5f5' : C.bgCardWarm,
          border: `1.5px solid ${error ? 'rgba(225,29,72,.45)' : C.border}`,
          borderRadius: 10,
          padding: '11px 14px',
          fontSize: 13,
          color: C.textH,
          outline: 'none',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxSizing: 'border-box',
          transition: 'border-color .18s, box-shadow .18s',

          // ✅ ADD THIS LINE
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? C.rose : C.navMid
          e.target.style.boxShadow = error
            ? `0 0 0 3px rgba(225,29,72,.08)`
            : `0 0 0 3px rgba(139,26,26,.08)`
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'rgba(225,29,72,.45)' : C.border
          e.target.style.boxShadow = 'none'
        }}
      />

      {error && (
        <div
          style={{ fontSize: 11, color: C.rose, marginTop: 5, fontWeight: 600 }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

/* ── Toast ───────────────────────────────────────────────────── */
function Toast({ msg, type }) {
  if (!msg) return null
  const ok = type === 'success'
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        right: 28,
        zIndex: 99,
        background: ok ? '#d1fae5' : '#ffe4e6',
        color: ok ? '#065f46' : '#9f1239',
        border: ok
          ? '1px solid rgba(5,150,105,.25)'
          : '1px solid rgba(225,29,72,.2)',
        borderRadius: 10,
        padding: '12px 20px',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxShadow: `0 4px 16px ${C.shadow}`,
        animation: 'slideUp .3s ease',
      }}
    >
      {msg}
    </div>
  )
}

/* ── SVG Icons ───────────────────────────────────────────────── */
const Icons = {
  Phone: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  Mail: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  WhatsApp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  Facebook: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  Instagram: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  MapPin: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  User: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function AdminSettings() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })
  const [profilePicFile, setProfilePicFile] = useState(null)
  const [profilePreview, setProfilePreview] = useState(null)

  const [appSettings, setAppSettings] = useState({
    app_name: '',
    city: '',
    email: '',
    phone: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    managed_by: '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({ msg: '', type: '' })

  /* ── Load ── */
  useEffect(() => {
    ;(async () => {
      try {
        const [sRes, pRes] = await Promise.all([getSettings(), getProfile()])
        const s = sRes.data
        setAppSettings({
          app_name: s.app_name ?? '',
          city: s.city ?? '',
          email: s.email ?? '',
          phone: s.phone ?? '',
          whatsapp: s.whatsapp ?? '',
          facebook: s.facebook ?? '',
          instagram: s.instagram ?? '',
          managed_by: s.managed_by ?? '',
        })
        setLogoPreview(s.logo || null)
        setProfile({
          first_name: pRes.data.first_name ?? '',
          last_name: pRes.data.last_name ?? '',
          email: pRes.data.email ?? '',
          phone: pRes.data.phone ?? '',
        })
        setProfilePreview(pRes.data.profile_pic || null)
      } catch (err) {
        console.error(err)
        showToast('Failed to load settings', 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 3000)
  }

  function setApp(key, val) {
    setAppSettings((prev) => ({ ...prev, [key]: val }))
  }

  /* ── Validate passwords live ── */
  function handleConfirmPw(val) {
    setConfirmPw(val)
    setPwError(
      password && val && password !== val ? 'Passwords do not match' : '',
    )
  }
  function handleNewPw(val) {
    setPassword(val)
    setPwError(confirmPw && val !== confirmPw ? 'Passwords do not match' : '')
  }

  /* ── Save ── */
  const handleSave = async (e) => {
    e.preventDefault()
    if (password && password !== confirmPw) {
      setPwError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      const settingsForm = new FormData()
      Object.entries(appSettings).forEach(([k, v]) => {
        if (v !== null && v !== undefined) settingsForm.append(k, v)
      })
      if (logoFile) settingsForm.append('logo', logoFile)

      const profileForm = new FormData()
      profileForm.append('first_name', profile.first_name)
      profileForm.append('last_name', profile.last_name)
      profileForm.append('email', profile.email)
      profileForm.append('phone', profile.phone)
      if (password) profileForm.append('password', password)
      if (profilePicFile) profileForm.append('profile_pic', profilePicFile)

      await Promise.all([
        updateSettings(settingsForm),
        updateProfile(profileForm),
      ])
      setPassword('')
      setConfirmPw('')
      showToast('All settings saved successfully', 'success')
    } catch (err) {
      console.error(err)
      showToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <link rel="stylesheet" href={FONT_LINK} />
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <div
        style={{
          padding: '28px 32px 48px 28px',
          background: C.bg,
          minHeight: '100%',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          animation: 'fadeIn .4s ease',
        }}
      >
        {/* ── Page header ── */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 400,
              fontFamily: "'DM Serif Display', serif",
              color: C.navDark,
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
            }}
          >
            Settings
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 13,
              color: C.textMid,
              fontWeight: 500,
              letterSpacing: '0.02em',
            }}
          >
            Daily Deals &nbsp;·&nbsp; Qatar &nbsp;·&nbsp; Admin Panel v1.0
          </p>
        </div>

        {loading ? (
          <p style={{ color: C.textDim, padding: 40, textAlign: 'center' }}>
            Loading…
          </p>
        ) : (
          <form onSubmit={handleSave}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 20,
                alignItems: 'start',
              }}
            >
              {/* ══ Profile card ══ */}
              <SectionCard style={{ animation: 'slideUp .45s .05s ease both' }}>
                <SectionTitle>Profile</SectionTitle>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <AvatarUpload
                    preview={profilePreview}
                    initials={nameInitials(profile)}
                    onFile={(f) => {
                      setProfilePicFile(f)
                      setProfilePreview(URL.createObjectURL(f))
                    }}
                    shape="circle"
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: C.textH,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {fullName(profile)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: C.textDim,
                        marginTop: 3,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {profile.phone || 'No phone'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.textDim,
                        marginTop: 2,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Administrator
                    </div>
                  </div>
                </div>

                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                    }}
                  >
                    <div>
                      <Label>First name</Label>
                      <StyledInput
                        value={profile.first_name}
                        onChange={(v) =>
                          setProfile({ ...profile, first_name: v })
                        }
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label>Last name</Label>
                      <StyledInput
                        value={profile.last_name}
                        onChange={(v) =>
                          setProfile({ ...profile, last_name: v })
                        }
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <StyledInput
                      value={profile.email}
                      onChange={(v) => setProfile({ ...profile, email: v })}
                      placeholder="admin@example.com"
                      type="email"
                      icon={<Icons.Mail />}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>

                    <div style={{ position: 'relative' }}>
                      {/* Fixed prefix */}
                      <span
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: 13,
                          color: '#6b2a2a',
                          fontWeight: 600,
                          pointerEvents: 'none',
                        }}
                      >
                        +914
                      </span>

                      <StyledInput
                        value={appSettings.phone}
                        onChange={(v) => {
                          // Remove prefix if user pastes full number
                          const cleaned = v.replace(/^\+914/, '')
                          setApp('phone', cleaned)
                        }}
                        placeholder="0000 0000"
                        icon={<Icons.Phone />}
                        style={{ paddingLeft: 50 }} // space for +914
                      />
                    </div>
                  </div>

                  {/* Change Password */}
                  <div style={{ paddingTop: 4 }}>
                    <SubSectionTitle>Change Password</SubSectionTitle>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      <div>
                        <Label>New password</Label>
                        <StyledInput
                          value={password}
                          onChange={handleNewPw}
                          placeholder="Min. 8 characters"
                          type="password"
                        />
                      </div>
                      <div>
                        <Label>Confirm password</Label>
                        <StyledInput
                          value={confirmPw}
                          onChange={handleConfirmPw}
                          placeholder="Re-enter password"
                          type="password"
                          error={pwError}
                        />
                      </div>
                      {password && <PasswordStrength password={password} />}
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* ══ App Settings card ══ */}
              <SectionCard style={{ animation: 'slideUp .45s .12s ease both' }}>
                <SectionTitle>App Settings</SectionTitle>

                {/* Logo */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  <AvatarUpload
                    preview={logoPreview}
                    initials="DD"
                    onFile={(f) => {
                      setLogoFile(f)
                      setLogoPreview(URL.createObjectURL(f))
                    }}
                    shape="square"
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: C.textH,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {appSettings.app_name || 'App logo'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.textDim,
                        marginTop: 3,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Click to upload logo
                    </div>
                  </div>
                </div>

                {/* General */}
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                    }}
                  >
                    <div>
                      <Label>App name</Label>
                      <StyledInput
                        value={appSettings.app_name}
                        onChange={(v) => setApp('app_name', v)}
                        placeholder="App name"
                      />
                    </div>
                    <div>
                      <Label>City</Label>
                      <StyledInput
                        value={appSettings.city}
                        onChange={(v) => setApp('city', v)}
                        placeholder="Doha"
                        icon={<Icons.MapPin />}
                      />
                    </div>
                  </div>

                  {/* Contact sub-section */}
                  <div style={{ paddingTop: 4 }}>
                    <SubSectionTitle>Contact Details</SubSectionTitle>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 12,
                        }}
                      >
                        <div>
                          <Label>Email</Label>
                          <StyledInput
                            value={appSettings.email}
                            onChange={(v) => setApp('email', v)}
                            placeholder="contact@example.com"
                            type="email"
                            icon={<Icons.Mail />}
                          />
                        </div>
                        <div>
                          <Label>Managed by</Label>
                          <StyledInput
                            value={appSettings.managed_by}
                            onChange={(v) => setApp('managed_by', v)}
                            placeholder="e.g. KEQA TRADING"
                            icon={<Icons.User />}
                          />
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 12,
                        }}
                      >
                        <div>
                          <Label>Phone</Label>

                          <div style={{ position: 'relative' }}>
                            {/* Fixed prefix */}
                            <span
                              style={{
                                position: 'absolute',
                                left: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: 13,
                                color: '#6b2a2a',
                                fontWeight: 600,
                                pointerEvents: 'none',
                              }}
                            >
                              +914
                            </span>

                            <StyledInput
                              value={appSettings.phone}
                              onChange={(v) => {
                                // Remove prefix if user pastes full number
                                const cleaned = v.replace(/^\+914/, '')
                                setApp('phone', cleaned)
                              }}
                              placeholder="0000 0000"
                              icon={<Icons.Phone />}
                              style={{ paddingLeft: 50 }} // space for +914
                            />
                          </div>
                        </div>
                        <div>
                          <Label>WhatsApp</Label>
                          <StyledInput
                            value={appSettings.whatsapp}
                            onChange={(v) => setApp('whatsapp', v)}
                            placeholder="https://wa.me/974XXXXXXXX"
                            icon={<Icons.WhatsApp />}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social sub-section */}
                  <div style={{ paddingTop: 4 }}>
                    <SubSectionTitle>Social Media</SubSectionTitle>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                      }}
                    >
                      <div>
                        <Label>Facebook</Label>
                        <StyledInput
                          value={appSettings.facebook}
                          onChange={(v) => setApp('facebook', v)}
                          placeholder="https://facebook.com/yourpage"
                          icon={<Icons.Facebook />}
                        />
                      </div>
                      <div>
                        <Label>Instagram</Label>
                        <StyledInput
                          value={appSettings.instagram}
                          onChange={(v) => setApp('instagram', v)}
                          placeholder="https://instagram.com/yourhandle"
                          icon={<Icons.Instagram />}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* ── Save button ── */}
            <div
              style={{
                marginTop: 24,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="submit"
                disabled={saving || !!pwError}
                style={{
                  background: saving || pwError ? C.textDim : C.navMid,
                  color: C.textOnDark,
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 32px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving || pwError ? 'not-allowed' : 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: 'background .18s',
                  animation: 'slideUp .45s .2s ease both',
                }}
              >
                {saving ? 'Saving…' : 'Save all changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </AdminLayout>
  )
}

/* ── Password strength meter ─────────────────────────────────── */
function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const levels = [
    { label: 'Weak', color: '#e11d48' },
    { label: 'Fair', color: '#d97706' },
    { label: 'Good', color: '#d97706' },
    { label: 'Strong', color: '#059669' },
  ]
  const { label, color } = levels[score - 1] ?? levels[0]

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 99,
              background: i <= score ? color : 'rgba(140,30,30,.12)',
              transition: 'background .2s',
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {label}
      </div>
    </div>
  )
}
