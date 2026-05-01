import { memo, useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiMail, FiPhone, FiMapPin,
  FiShield, FiFileText, FiBell,
} from "react-icons/fi";
import {
  FaWhatsapp, FaFacebookF, FaInstagram,
} from "react-icons/fa";
import { getPublicSettings } from "../api/titleApi";
import { getImageUrl } from "../api/media";

/* ─────────────────────────────────────────────────────────────
   PALETTE
───────────────────────────────────────────────────────────── */
const C = {
  accent:     "#D94040",
  accentDim:  "#8B1A1A",
  bg:         "#111518",
  bgBottom:   "#0D1013",
  bgCard:     "rgba(255,255,255,0.03)",
  border:     "rgba(255,255,255,0.07)",
  borderHov:  "rgba(255,255,255,0.14)",
  white:      "#FFFFFF",
  text:       "#C8D0D4",
  textMuted:  "#6C7A82",
  textHead:   "#F0F4F6",
  green:      "#22C55E",
};

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const isEmpty = (v) =>
  v === null || v === undefined || (typeof v === "string" && v.trim() === "");

/* ─────────────────────────────────────────────────────────────
   SKELETON
───────────────────────────────────────────────────────────── */
const Skeleton = memo(({ width = "70%", height = "12px", style = {} }) => (
  <div
    style={{
      height,
      width,
      borderRadius: "6px",
      background: "rgba(255,255,255,0.06)",
      animation: "ftrPulse 1.4s ease infinite",
      ...style,
    }}
  />
));

/* ─────────────────────────────────────────────────────────────
   DIVIDER  (subtle gradient)
───────────────────────────────────────────────────────────── */
const Divider = memo(() => (
  <div style={{
    height: "1px",
    background: `linear-gradient(90deg, transparent, ${C.border} 20%, ${C.border} 80%, transparent)`,
    margin: "0",
  }} />
));

/* ─────────────────────────────────────────────────────────────
   CONTACT ROW
───────────────────────────────────────────────────────────── */
const ContactRow = memo(({ icon, href, children }) => {
  const [hov, setHov] = useState(false);
  const Tag = href ? "a" : "div";
  return (
    <Tag
      href={href || undefined}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "11px",
        padding: "9px 0",
        borderBottom: `1px solid ${C.border}`,
        textDecoration: "none",
        color: hov && href ? C.textHead : C.text,
        fontSize: "13px",
        transition: "color 0.18s ease",
        cursor: href ? "pointer" : "default",
      }}
    >
      <span style={{
        color: hov && href ? C.accent : C.textMuted,
        marginTop: "2px",
        transition: "color 0.18s ease",
        flexShrink: 0,
        display: "flex",
      }}>
        {icon}
      </span>
      <span style={{ lineHeight: "1.55" }}>{children}</span>
    </Tag>
  );
});

/* ─────────────────────────────────────────────────────────────
   WHATSAPP CTA
───────────────────────────────────────────────────────────── */
const WhatsAppCTA = memo(({ href }) => {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "9px",
        padding: "10px 20px",
        borderRadius: "8px",
        background: hov ? C.green : "rgba(34,197,94,0.08)",
        border: `1.5px solid ${hov ? C.green : "rgba(34,197,94,0.3)"}`,
        color: hov ? C.white : C.green,
        fontSize: "13px",
        fontWeight: "600",
        letterSpacing: "0.2px",
        textDecoration: "none",
        transition: "all 0.22s ease",
        marginTop: "4px",
        backdropFilter: "blur(4px)",
      }}
    >
      <FaWhatsapp size={15} />
      Message us on WhatsApp
    </a>
  );
});

/* ─────────────────────────────────────────────────────────────
   SOCIAL BUTTON
───────────────────────────────────────────────────────────── */
const SocialBtn = memo(({ href, label, children }) => {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        border: `1px solid ${hov ? C.accent : C.border}`,
        background: hov ? "rgba(217,64,64,0.10)" : "transparent",
        color: hov ? C.accent : C.textMuted,
        textDecoration: "none",
        transition: "all 0.18s ease",
      }}
    >
      {children}
    </a>
  );
});

/* ─────────────────────────────────────────────────────────────
   POLICY LINK
───────────────────────────────────────────────────────────── */
const PolicyLink = memo(({ to, icon, children }) => {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "12px",
        color: hov ? C.textHead : C.textMuted,
        textDecoration: "none",
        transition: "color 0.18s ease",
        whiteSpace: "nowrap",
      }}
    >
      {icon}{children}
    </Link>
  );
});

/* ─────────────────────────────────────────────────────────────
   BRAND LOGO BLOCK
───────────────────────────────────────────────────────────── */
const BrandLogo = memo(({ loading, logoUrl, appName, managedBy }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "13px", marginBottom: "18px" }}>
    {loading ? (
      <Skeleton width="42px" height="42px" style={{ borderRadius: "10px", flexShrink: 0 }} />
    ) : logoUrl ? (
      <img
        src={logoUrl}
        alt={appName}
        loading="lazy"
        decoding="async"
        width={42}
        height={42}
        style={{ width: 42, height: 42, borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
      />
    ) : (
      <div style={{
        width: 42, height: 42, borderRadius: "10px",
        background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: 14, fontWeight: "800", color: C.white,
        letterSpacing: "-0.5px",
      }}>
        DD
      </div>
    )}
    <div>
      {loading
        ? <Skeleton width="130px" style={{ marginBottom: 6 }} />
        : <div style={{ fontSize: "15px", fontWeight: "700", color: C.textHead, letterSpacing: "-0.3px" }}>{appName}</div>
      }
      {!loading && !isEmpty(managedBy) && (
        <div style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.5px", marginTop: "3px" }}>
          🇶🇦&nbsp; {managedBy}
        </div>
      )}
    </div>
  </div>
));

/* ─────────────────────────────────────────────────────────────
   CONTACT SKELETON
───────────────────────────────────────────────────────────── */
const ContactSkeleton = memo(() => (
  <div style={{ display: "flex", flexDirection: "column", gap: "18px", paddingTop: "4px" }}>
    {[55, 80, 60].map((w, i) => <Skeleton key={i} width={`${w}%`} />)}
  </div>
));

/* ─────────────────────────────────────────────────────────────
   SECTION LABEL  (accent dot + gradient underline)
───────────────────────────────────────────────────────────── */
const SectionLabel = memo(({ children }) => (
  <div style={{ marginBottom: "20px" }}>
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "7px",
      fontSize: "10px",
      fontWeight: "700",
      letterSpacing: "2px",
      textTransform: "uppercase",
      color: C.accent,
    }}>
      <span style={{
        display: "inline-block",
        width: "6px", height: "6px",
        borderRadius: "50%",
        background: C.accent,
        boxShadow: `0 0 6px ${C.accent}`,
        flexShrink: 0,
      }} />
      {children}
    </span>
    <div style={{
      height: "1px",
      background: `linear-gradient(90deg, ${C.accent} 0%, transparent 100%)`,
      width: "36px",
      marginTop: "8px",
    }} />
  </div>
));

/* ─────────────────────────────────────────────────────────────
   INLINE STYLES  (injected once)
───────────────────────────────────────────────────────────── */
const STYLE_ID = "footer-ddq-styles";
function injectStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    @keyframes ftrPulse {
      0%,100%{opacity:.4} 50%{opacity:.85}
    }
    @keyframes ftrFadeUp {
      from{opacity:0;transform:translateY(18px)}
      to{opacity:1;transform:translateY(0)}
    }
    .ftr-root{
      animation: ftrFadeUp .55s ease both;
    }
    /* ── tablet ── */
    @media(max-width:900px){
      .ftr-grid{
        grid-template-columns:1fr 1fr !important;
        gap:36px !important;
        padding:44px 28px 36px !important;
      }
      .ftr-brand { grid-column: span 2 !important; }
    }
    /* ── mobile ── */
    @media(max-width:560px){
      .ftr-grid{
        grid-template-columns:1fr !important;
        gap:28px !important;
        padding:36px 20px 28px !important;
      }
      .ftr-brand { grid-column: span 1 !important; }
      .ftr-bottom{
        flex-direction:column !important;
        align-items:flex-start !important;
        gap:16px !important;
      }
      .ftr-policies{
        flex-wrap:wrap !important;
        gap:14px 20px !important;
      }
      .ftr-social-row{
        flex-wrap:wrap !important;
      }
    }
    /* ── very small ── */
    @media(max-width:360px){
      .ftr-grid{ padding:28px 16px 24px !important; }
    }
  `;
  document.head.appendChild(el);
}

/* ─────────────────────────────────────────────────────────────
   FOOTER  (default export — memoised)
───────────────────────────────────────────────────────────── */
const Footer = memo(function Footer() {
  const year         = useRef(new Date().getFullYear()).current;
  const [s, setS]    = useState(null);
  const [loading, setLoading] = useState(true);

  /* inject styles once */
  useEffect(() => { injectStyles(); }, []);

  /* fetch settings */
  const fetchSettings = useCallback(() => {
    getPublicSettings()
      .then((res) => setS(res.data))
      .catch((err) => console.error("Footer: failed to load settings", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  /* ── derived values (stable between renders) ── */
  const appName   = s?.app_name   || "Daily Deals Qatar";
  const logoUrl   = getImageUrl(s?.logo);
  const city      = s?.city;
  const email     = s?.email;
  const phone     = s?.phone;
  const whatsapp  = s?.whatsapp;
  const facebook  = s?.facebook;
  const instagram = s?.instagram;
  const managedBy = s?.managed_by;

  const telHref = !isEmpty(phone)
    ? phone.startsWith("+") ? `tel:${phone}` : `tel:+974${phone.replace(/\D/g, "")}`
    : null;

  const hasContact = !isEmpty(city) || !isEmpty(email) || !isEmpty(phone) || !isEmpty(whatsapp);
  const hasSocial  = !isEmpty(facebook) || !isEmpty(instagram);

  /* ── grid columns: 2 or 3 depending on contact data ── */
  const gridCols = hasContact || loading
    ? "1.35fr 0.95fr"   /* brand + contact — 2 cols, no quick links */
    : "1fr";            /* brand only while detecting */

  return (
    <>
      {/* ── Top accent bar ── */}
      <div style={{
        height: "3px",
        background: `linear-gradient(90deg, ${C.accentDim} 0%, ${C.accent} 40%, ${C.accentDim} 100%)`,
      }} />

      <footer
        className="ftr-root"
        style={{
          backgroundColor: C.bg,
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
          width: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Background texture dots ── */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `radial-gradient(${C.border} 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          opacity: 0.35,
          maskImage: "linear-gradient(180deg, transparent, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.6) 70%, transparent)",
          WebkitMaskImage: "linear-gradient(180deg, transparent, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.6) 70%, transparent)",
        }} />

        {/* ── Accent glow bottom-left ── */}
        <div aria-hidden="true" style={{
          position: "absolute", bottom: 0, left: "-60px",
          width: "320px", height: "220px",
          background: `radial-gradient(ellipse at 30% 80%, rgba(217,64,64,0.08) 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* ════ MAIN GRID ════ */}
        <div
          className="ftr-grid"
          style={{
            maxWidth: "1160px",
            margin: "0 auto",
            padding: "60px 40px 52px",
            display: "grid",
            gridTemplateColumns: gridCols,
            gap: "64px",
            position: "relative",
            zIndex: 1,
          }}
        >

          {/* ── Col 1: Brand ── */}
          <div className="ftr-brand">
            <SectionLabel>About Us</SectionLabel>

            <BrandLogo
              loading={loading}
              logoUrl={logoUrl}
              appName={appName}
              managedBy={managedBy}
            />

            <p style={{
              fontSize: "13.5px",
              color: C.text,
              lineHeight: "1.85",
              margin: "0 0 22px",
              maxWidth: "420px",
            }}>
              Your one-stop place for the best deals, discounts &amp; promotions across Qatar.
              We curate top offers daily to help you discover and save.
            </p>

            {/* WhatsApp CTA */}
            {!loading && !isEmpty(whatsapp) && <WhatsAppCTA href={whatsapp} />}

            {/* Social + loading state */}
            {!loading && hasSocial && (
              <div className="ftr-social-row" style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                {!isEmpty(facebook)  && <SocialBtn href={facebook}  label="Facebook"><FaFacebookF  size={14} /></SocialBtn>}
                {!isEmpty(instagram) && <SocialBtn href={instagram} label="Instagram"><FaInstagram size={14} /></SocialBtn>}
              </div>
            )}
          </div>

          {/* ── Col 2: Contact ── */}
          {(hasContact || loading) && (
            <div>
              <SectionLabel>Contact Info</SectionLabel>
              {loading ? (
                <ContactSkeleton />
              ) : (
                <>
                  {!isEmpty(city) && (
                    <ContactRow icon={<FiMapPin size={13} />}>{city}, Qatar</ContactRow>
                  )}
                  {!isEmpty(email) && (
                    <ContactRow icon={<FiMail size={13} />} href={`mailto:${email}`}>{email}</ContactRow>
                  )}
                  {!isEmpty(phone) && (
                    <ContactRow icon={<FiPhone size={13} />} href={telHref}>
                      {phone.startsWith("+") ? phone : `+974 ${phone}`}
                    </ContactRow>
                  )}
                  {!isEmpty(whatsapp) && (
                    <ContactRow icon={<FaWhatsapp size={13} />} href={whatsapp}>WhatsApp Chat</ContactRow>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "0 40px", position: "relative", zIndex: 1 }}>
          <Divider />
        </div>

        {/* ════ BOTTOM BAR ════ */}
        <div style={{ backgroundColor: C.bgBottom, position: "relative", zIndex: 1 }}>
          <div
            className="ftr-bottom"
            style={{
              maxWidth: "1160px",
              margin: "0 auto",
              padding: "16px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {/* Copyright */}
            <span style={{ fontSize: "12px", color: C.textMuted, lineHeight: 1.6 }}>
              © {year}{" "}
              <span style={{ color: C.text }}>
                {loading ? "Daily Deals Qatar" : appName}
              </span>.
              {" "}All rights reserved.
              {!loading && !isEmpty(managedBy) && (
                <>
                  &nbsp;·&nbsp; Managed by&nbsp;
                  <span style={{ color: C.text, fontWeight: "600" }}>{managedBy}</span>
                </>
              )}
            </span>

            {/* Policy links */}
            <nav aria-label="Legal" className="ftr-policies" style={{ display: "flex", gap: "22px", flexWrap: "wrap" }}>
              <PolicyLink to="/privacy-policy"   icon={<FiShield   size={11} />}>Privacy Policy</PolicyLink>
              <PolicyLink to="/terms-of-service" icon={<FiFileText size={11} />}>Terms of Service</PolicyLink>
              <PolicyLink to="/cookies"          icon={<FiBell     size={11} />}>Cookie Policy</PolicyLink>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
});

export default Footer;