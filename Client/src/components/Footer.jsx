import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FiShield,
  FiFileText,
  FiBell,
  FiMail,
  FiPhone,
  FiMapPin,
  FiArrowRight,
} from "react-icons/fi";
import {
  FaWhatsapp,
  FaShieldAlt,
  FaFileAlt,
  FaFacebookF,
  FaInstagram,
} from "react-icons/fa";
import { getPublicSettings } from "../api/titleApi";
import { getImageUrl } from "../api/media";

/* ── Palette ──────────────────────────────────────────────── */
const C = {
  accent:    "#D94040",
  bg:        "#111518",
  bgBottom:  "#0D1013",
  border:    "rgba(255,255,255,0.07)",
  white:     "#FFFFFF",
  text:      "#C8D0D4",
  textMuted: "#6C7A82",
  textHead:  "#F0F4F6",
  green:     "#22C55E",
};

/* ── isEmpty helper ───────────────────────────────────────── */
function isEmpty(val) {
  return val === null || val === undefined || (typeof val === "string" && val.trim() === "");
}

/* ── Section Label ────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <span style={{
        display: "inline-block", fontSize: "10px", fontWeight: "700",
        letterSpacing: "2px", textTransform: "uppercase",
        color: C.accent, marginBottom: "8px",
      }}>
        ●&nbsp;&nbsp;{children}
      </span>
      <div style={{
        height: "1px",
        background: `linear-gradient(90deg, ${C.accent} 0%, transparent 100%)`,
        width: "48px",
      }} />
    </div>
  );
}

/* ── Nav Link ─────────────────────────────────────────────── */
function NavLink({ to = "#", icon, children }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 0", borderBottom: `1px solid ${C.border}`,
        textDecoration: "none",
        color: hov ? C.textHead : C.text,
        fontSize: "13.5px", transition: "color 0.18s ease",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "9px" }}>
        <span style={{ color: hov ? C.accent : C.textMuted, transition: "color 0.18s ease", display: "flex" }}>
          {icon}
        </span>
        {children}
      </span>
      <FiArrowRight size={12} style={{
        color: C.accent,
        opacity: hov ? 1 : 0,
        transform: hov ? "translateX(0)" : "translateX(-6px)",
        transition: "opacity 0.18s ease, transform 0.18s ease",
      }} />
    </Link>
  );
}

/* ── Contact Row ──────────────────────────────────────────── */
function ContactRow({ icon, href, children }) {
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
        display: "flex", alignItems: "flex-start", gap: "12px",
        padding: "10px 0", borderBottom: `1px solid ${C.border}`,
        textDecoration: "none",
        color: hov && href ? C.textHead : C.text,
        fontSize: "13.5px", transition: "color 0.18s ease",
        cursor: href ? "pointer" : "default",
      }}
    >
      <span style={{
        color: hov && href ? C.accent : C.textMuted,
        marginTop: "2px", transition: "color 0.18s ease",
        flexShrink: 0, display: "flex",
      }}>
        {icon}
      </span>
      <span style={{ lineHeight: "1.5" }}>{children}</span>
    </Tag>
  );
}

/* ── WhatsApp CTA ─────────────────────────────────────────── */
function WhatsAppCTA({ href }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "9px",
        padding: "11px 22px", borderRadius: "6px",
        background: hov ? C.green : "transparent",
        border: `1.5px solid ${hov ? C.green : "rgba(34,197,94,0.35)"}`,
        color: hov ? C.white : C.green,
        fontSize: "13px", fontWeight: "600", letterSpacing: "0.3px",
        textDecoration: "none",
        transition: "background 0.22s ease, border-color 0.22s ease, color 0.22s ease",
        marginTop: "4px",
      }}
    >
      <FaWhatsapp size={16} />
      Message us on WhatsApp
    </a>
  );
}

/* ── Social Icon Button ───────────────────────────────────── */
function SocialBtn({ href, children }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "34px", height: "34px", borderRadius: "6px",
        border: `1px solid ${hov ? C.accent : C.border}`,
        color: hov ? C.accent : C.textMuted,
        textDecoration: "none",
        transition: "border-color 0.18s, color 0.18s",
      }}
    >
      {children}
    </a>
  );
}

/* ── Policy Link ──────────────────────────────────────────── */
function PolicyLink({ to, icon, children }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        fontSize: "12px",
        color: hov ? C.textHead : C.textMuted,
        textDecoration: "none", transition: "color 0.18s ease",
      }}
    >
      {icon}{children}
    </Link>
  );
}

/* ── Skeleton shimmer ─────────────────────────────────────── */
function Skeleton({ width = "70%", style = {} }) {
  return (
    <div style={{
      height: "12px", width, borderRadius: "6px",
      background: "rgba(255,255,255,0.06)",
      animation: "ddqPulse 1.4s ease infinite",
      ...style,
    }} />
  );
}

/* ════════════════════════════════════════════════════════════
   FOOTER
════════════════════════════════════════════════════════════ */
export default function Footer() {
  const year = new Date().getFullYear();
  const [s, setS]           = useState(null);   // settings object
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicSettings()
      .then((res) => setS(res.data))
      .catch((err) => console.error("Footer: failed to load settings", err))
      .finally(() => setLoading(false));
  }, []);

  /* ── Derived values ── */
  const appName   = s?.app_name   || "Daily Deals Qatar";
  const logoUrl   = getImageUrl(s?.logo);
  const city      = s?.city;
  const email     = s?.email;
  const phone     = s?.phone;
  const whatsapp  = s?.whatsapp;
  const facebook  = s?.facebook;
  const instagram = s?.instagram;
  const managedBy = s?.managed_by;

  /* tel href — prepend +974 only if not already a full number */
  const telHref = !isEmpty(phone)
    ? phone.startsWith("+") ? `tel:${phone}` : `tel:+974${phone.replace(/\D/g, "")}`
    : null;

  const hasContact = !isEmpty(city) || !isEmpty(email) || !isEmpty(phone) || !isEmpty(whatsapp);
  const hasSocial  = !isEmpty(facebook) || !isEmpty(instagram);

  return (
    <>
      <style>{`
        @keyframes ddqPulse {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.9; }
        }
        @media (max-width: 900px) {
          .ddq-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 40px !important;
            padding: 48px 24px 36px !important;
          }
          .ddq-footer-grid > div:first-child { grid-column: span 2; }
        }
        @media (max-width: 560px) {
          .ddq-footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            padding: 36px 20px 28px !important;
          }
          .ddq-footer-grid > div:first-child { grid-column: span 1 !important; }
          .ddq-footer-bottom {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>

      {/* Top accent bar */}
      <div style={{
        height: "3px",
        background: `linear-gradient(90deg, ${C.accent} 0%, #8B1A1A 50%, ${C.accent} 100%)`,
      }} />

      <footer style={{ backgroundColor: C.bg, fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif", width: "100%" }}>

        {/* ── Main Grid ── */}
        <div
          className="ddq-footer-grid"
          style={{
            maxWidth: "1200px", margin: "0 auto",
            padding: "60px 32px 48px",
            display: "grid",
            gridTemplateColumns: hasContact || loading ? "1.4fr 1fr 1fr" : "1.4fr 1fr",
            gap: "56px",
          }}
        >

          {/* ── Col 1: Brand ── */}
          <div>
            <SectionLabel>About Us</SectionLabel>

            {/* Logo + app name */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              {loading ? (
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(255,255,255,0.06)", animation: "ddqPulse 1.4s ease infinite" }} />
              ) : logoUrl ? (
                <img src={logoUrl} alt={appName} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
                  DD
                </div>
              )}
              <div>
                {loading
                  ? <Skeleton width="130px" />
                  : <div style={{ fontSize: "15px", fontWeight: "700", color: C.textHead, letterSpacing: "-0.3px" }}>{appName}</div>
                }
                {!loading && !isEmpty(managedBy) && (
                  <div style={{ fontSize: "11px", color: C.textMuted, letterSpacing: "0.6px", marginTop: "3px" }}>
                    🇶🇦&nbsp; {managedBy}
                  </div>
                )}
              </div>
            </div>

            <p style={{ fontSize: "13.5px", color: C.text, lineHeight: "1.85", margin: "0 0 24px" }}>
              Your one-stop place for the best deals, discounts &amp; promotions across Qatar. We curate top offers daily to help you discover and save.
            </p>

            {/* WhatsApp CTA */}
            {!loading && !isEmpty(whatsapp) && <WhatsAppCTA href={whatsapp} />}

            {/* Social icons */}
            {!loading && hasSocial && (
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                {!isEmpty(facebook)  && <SocialBtn href={facebook}><FaFacebookF size={14} /></SocialBtn>}
                {!isEmpty(instagram) && <SocialBtn href={instagram}><FaInstagram size={14} /></SocialBtn>}
              </div>
            )}
          </div>

          {/* ── Col 2: Contact ── */}
          {(hasContact || loading) && (
            <div>
              <SectionLabel>Contact Info</SectionLabel>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <Skeleton width="55%" />
                  <Skeleton width="80%" />
                  <Skeleton width="60%" />
                </div>
              ) : (
                <>
                  {!isEmpty(city) && (
                    <ContactRow icon={<FiMapPin size={14} />}>{city}, Qatar</ContactRow>
                  )}
                  {!isEmpty(email) && (
                    <ContactRow icon={<FiMail size={14} />} href={`mailto:${email}`}>{email}</ContactRow>
                  )}
                  {!isEmpty(phone) && (
                    <ContactRow icon={<FiPhone size={14} />} href={telHref}>
                      {phone.startsWith("+") ? phone : `+974 ${phone}`}
                    </ContactRow>
                  )}
                  {!isEmpty(whatsapp) && (
                    <ContactRow icon={<FaWhatsapp size={14} />} href={whatsapp}>WhatsApp Chat</ContactRow>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Col 3: Quick Links ── */}
          <div>
            <SectionLabel>Quick Links</SectionLabel>
            <NavLink to="/terms-of-service"   icon={<FaFileAlt size={13} />}>Terms of Service</NavLink>
            <NavLink to="/privacy-policy" icon={<FaShieldAlt size={13} />}>Privacy Policy</NavLink>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ height: "1px", background: C.border }} />
        </div>

        {/* ── Bottom Bar ── */}
        <div style={{ backgroundColor: C.bgBottom }}>
          <div
            className="ddq-footer-bottom"
            style={{
              maxWidth: "1200px", margin: "0 auto", padding: "18px 32px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: "14px",
            }}
          >
            <span style={{ fontSize: "12.5px", color: C.textMuted }}>
              © {year} {loading ? "Daily Deals Qatar" : appName}. All rights reserved.
              {!loading && !isEmpty(managedBy) && (
                <>&nbsp;&nbsp;·&nbsp;&nbsp;Managed by&nbsp;
                  <span style={{ color: C.text, fontWeight: "600" }}>{managedBy}</span>
                </>
              )}
            </span>

            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <PolicyLink to="/privacy-policy" icon={<FiShield size={11} />}>Privacy Policy</PolicyLink>
              <PolicyLink to="/terms-of-service"   icon={<FiFileText size={11} />}>Terms of Service</PolicyLink>
              <PolicyLink to="/cookies" icon={<FiBell size={11} />}>Cookie Policy</PolicyLink>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}