import { useEffect, useState, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import {
  Building2, User, Phone, Mail, MapPin, FileText,
  CheckCircle, XCircle, RefreshCw, Clock, Eye,
  KeyRound, ShieldCheck, X, Calendar, Copy, Check,
  AlertTriangle, ChevronDown, ChevronUp, Inbox,
} from "lucide-react";
import {
  getCompanyRequests,
  approveCompany,
  rejectCompany,
} from "../api/companyApi";

/* ─────────────────────────────────────────────────────────────────
   DESIGN TOKENS  (mirrors ManageCategories palette)
───────────────────────────────────────────────────────────────── */
const C = {
  bg:         "#fdf6f0",
  bgCard:     "#ffffff",
  bgCardWarm: "#fff9f6",
  bgCardTint: "#fef2ee",

  navDark:    "#5c0f0f",
  navMid:     "#8b1a1a",
  navBright:  "#c0392b",

  rose:       "#e11d48",
  amber:      "#d97706",
  teal:       "#0d9488",
  indigo:     "#4338ca",
  emerald:    "#059669",
  violet:     "#7c3aed",
  sky:        "#0284c7",

  textH:      "#1a0505",
  textP:      "#3d1010",
  textMid:    "#6b2a2a",
  textDim:    "#a05050",

  border:     "rgba(140,30,30,0.12)",
  borderMid:  "rgba(140,30,30,0.22)",
  shadow:     "rgba(80,10,10,0.10)",
  shadowHov:  "rgba(80,10,10,0.18)",
};

const FONT      = "'Plus Jakarta Sans', sans-serif";
const FONT_D    = "'DM Serif Display', serif";
const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

const ACCENT_CYCLE = [C.navBright, C.teal, C.indigo, C.amber, C.violet, C.emerald, C.sky];

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
function generatePassword(len = 12) {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function statusLabel(req) {
  if (req.is_approved) return { label: "Approved", color: C.emerald, bg: "#d1fae5", icon: <CheckCircle size={11} /> };
  if (req.is_rejected) return { label: "Rejected", color: C.rose,    bg: "#ffe4e6", icon: <XCircle    size={11} /> };
  return                       { label: "Pending",  color: C.amber,   bg: "#fef3c7", icon: <Clock       size={11} /> };
}

/* ─────────────────────────────────────────────────────────────────
   STYLED INPUT
───────────────────────────────────────────────────────────────── */
function StyledInput({ value, onChange, placeholder, type = "text", style: extra = {} }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      placeholder={placeholder}
      style={{
        flex: 1, height: 40, padding: "0 14px",
        border: `1.5px solid ${focus ? C.navBright : C.border}`,
        borderRadius: 10,
        background: focus ? "#fff" : C.bgCardWarm,
        fontSize: 13, color: C.textH, fontFamily: FONT,
        outline: "none",
        transition: "border-color .18s, background .18s",
        ...extra,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────
   CONFIRM MODAL  (reject)
───────────────────────────────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(30,0,0,0.38)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: C.bgCard, border: `1px solid ${C.borderMid}`,
        borderRadius: 18, padding: "28px 28px 24px", width: "100%", maxWidth: 380,
        boxShadow: "0 16px 48px rgba(80,10,10,0.24)",
        fontFamily: FONT, animation: "slideUp .25s ease both",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "#ffe4e6",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14,
        }}>
          <AlertTriangle size={18} color={C.rose} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: C.textH, fontFamily: FONT_D, marginBottom: 8 }}>
          Reject Request
        </div>
        <div style={{ fontSize: 13, color: C.textMid, marginBottom: 22, lineHeight: 1.6 }}>
          {message}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px 0",
            background: C.bgCardWarm, border: `1px solid ${C.border}`,
            borderRadius: 10, color: C.textMid,
            fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: FONT,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px 0",
            background: C.rose, border: "none",
            borderRadius: 10, color: "#fff",
            fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: FONT,
          }}>Reject</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PASSWORD RULES  — shared validation logic
───────────────────────────────────────────────────────────────── */
const PWD_RULES = [
  { id: "len",   label: "At least 6 characters",          test: v => v.length >= 6          },
  { id: "upper", label: "At least one uppercase letter",  test: v => /[A-Z]/.test(v)        },
  { id: "num",   label: "At least one number",            test: v => /[0-9]/.test(v)        },
];

function pwdValid(v) { return v.length > 0 && PWD_RULES.every(r => r.test(v)); }

/* ─────────────────────────────────────────────────────────────────
   PASSWORD INPUT  — with show/hide + strength bar
───────────────────────────────────────────────────────────────── */
function PasswordInput({ value, onChange }) {
  const [focus,   setFocus]   = useState(false);
  const [visible, setVisible] = useState(false);

  /* derive border color: neutral → red (touched, invalid) → green (valid) */
  const touched = value.length > 0;
  const valid   = pwdValid(value);
  const borderColor = !touched ? (focus ? C.navBright : C.border)
                    : valid    ? C.emerald
                               : C.rose;

  /* strength bar: count passing rules */
  const score = PWD_RULES.filter(r => r.test(value)).length;
  const barColors = ["#ef4444", "#f97316", C.emerald];
  const barColor  = score === 0 ? C.border : barColors[score - 1];

  return (
    <div>
      {/* Input row */}
      <div style={{
        display: "flex", alignItems: "center",
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10,
        background: focus ? "#fff" : C.bgCardWarm,
        transition: "border-color .18s, background .18s",
        overflow: "hidden",
      }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="Enter custom password…"
          style={{
            flex: 1, height: 40, padding: "0 12px",
            border: "none", outline: "none",
            fontSize: 13, color: C.textH,
            fontFamily: "monospace", letterSpacing: "0.4px",
            background: "transparent",
          }}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          title={visible ? "Hide password" : "Show password"}
          style={{
            height: 40, padding: "0 12px",
            background: "none", border: "none", cursor: "pointer",
            color: C.textDim, display: "flex", alignItems: "center",
            borderLeft: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          {/* eye / eye-off inline SVG to avoid extra import */}
          {visible ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          )}
        </button>
      </div>

      {/* Strength bar */}
      {touched && (
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          {PWD_RULES.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: i < score ? barColor : C.border,
              transition: "background .25s",
            }} />
          ))}
        </div>
      )}

      {/* Rule checklist */}
      {touched && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 5,
          marginTop: 10, animation: "fadeIn .2s ease both",
        }}>
          {PWD_RULES.map(rule => {
            const pass = rule.test(value);
            return (
              <div key={rule.id} style={{
                display: "flex", alignItems: "center", gap: 7,
                fontSize: 11.5, fontFamily: FONT,
                color: pass ? C.emerald : C.rose,
                transition: "color .2s",
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                  background: pass ? "#d1fae5" : "#ffe4e6",
                  border: `1px solid ${pass ? C.emerald : C.rose}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background .2s, border-color .2s",
                }}>
                  {pass
                    ? <Check size={8} strokeWidth={3} />
                    : <X    size={8} strokeWidth={3} />}
                </div>
                {rule.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   APPROVE MODAL  — password input + auto-generate
───────────────────────────────────────────────────────────────── */
function ApproveModal({ request, onConfirm, onCancel }) {
  const [password,    setPassword]    = useState("");
  const [autoGen,     setAutoGen]     = useState(true);
  const [copied,      setCopied]      = useState(false);
  const [touched,     setTouched]     = useState(false);
  const [genPreview,  setGenPreview]  = useState(() => generatePassword());

  const regenerate = () => setGenPreview(generatePassword());

  const handleCopy = () => {
    navigator.clipboard.writeText(autoGen ? genPreview : password).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* If custom mode and password is empty → fall back to auto-gen */
  const effectivePass = (!autoGen && password.trim()) ? password.trim() : genPreview;
  const canSubmit = autoGen || password.trim() === "" || pwdValid(password);

  const handleConfirm = () => {
    if (!autoGen && password.trim() !== "" && !pwdValid(password)) {
      setTouched(true);
      return;
    }
    onConfirm(effectivePass);
  };

  const handleToggle = () => {
    setAutoGen(v => !v);
    setPassword("");
    setTouched(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(20,0,0,0.38)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: C.bgCard, border: `1px solid ${C.borderMid}`,
        borderRadius: 20, padding: "28px 28px 24px", width: "100%", maxWidth: 420,
        boxShadow: "0 16px 56px rgba(80,10,10,0.22)",
        fontFamily: FONT, animation: "slideUp .25s ease both",
      }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "#d1fae5", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={18} color={C.emerald} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.textH, fontFamily: FONT_D }}>
              Approve Company
            </div>
            <div style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>
              {request.company_name}
            </div>
          </div>
        </div>

        {/* ── Auto-generate toggle ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: C.bgCardWarm, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "12px 14px", marginBottom: 14,
        }}>
          <KeyRound size={14} color={C.navMid} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, color: C.textP, fontWeight: 600 }}>
              Auto-generate password
            </span>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
              {autoGen ? "A secure password will be created automatically" : "You are setting a custom password"}
            </div>
          </div>
          <button
            onClick={handleToggle}
            style={{
              width: 40, height: 22, borderRadius: 99,
              background: autoGen ? C.emerald : "#cbd5e1",
              border: "none", cursor: "pointer", position: "relative",
              transition: "background .2s", flexShrink: 0,
            }}
          >
            <span style={{
              position: "absolute", top: 3,
              left: autoGen ? 21 : 3,
              width: 16, height: 16, borderRadius: "50%",
              background: "#fff", transition: "left .2s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }} />
          </button>
        </div>

        {/* ── Auto-gen preview ── */}
        {autoGen && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 10, padding: "10px 14px", marginBottom: 14,
            animation: "fadeIn .2s ease both",
          }}>
            <code style={{
              flex: 1, fontSize: 13, color: C.emerald,
              fontFamily: "monospace", letterSpacing: "0.5px", wordBreak: "break-all",
            }}>
              {genPreview}
            </code>
            <button onClick={regenerate} title="Re-generate" style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.textDim, padding: 4, borderRadius: 6,
              display: "flex", flexShrink: 0,
            }}>
              <RefreshCw size={13} />
            </button>
            <button onClick={handleCopy} title="Copy password" style={{
              background: "none", border: "none", cursor: "pointer",
              color: copied ? C.emerald : C.textDim, padding: 4, borderRadius: 6,
              display: "flex", flexShrink: 0,
            }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        )}

        {/* ── Custom password input ── */}
        {!autoGen && (
          <div style={{ marginBottom: 16, animation: "fadeIn .2s ease both" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8,
            }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.textMid }}>
                Set custom password
              </label>
              <span style={{ fontSize: 10.5, color: C.textDim }}>
                Leave blank to auto-generate
              </span>
            </div>

            <PasswordInput
              value={password}
              onChange={e => { setPassword(e.target.value); setTouched(true); }}
            />

            {/* Fallback notice when field is empty */}
            {password.trim() === "" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                marginTop: 10, fontSize: 11.5, color: C.amber,
                background: "#fef3c7", border: "1px solid #fde68a",
                borderRadius: 8, padding: "7px 10px",
                animation: "fadeIn .2s ease both",
              }}>
                <KeyRound size={11} />
                Empty field — auto-generated password will be used instead.
              </div>
            )}
          </div>
        )}

        {/* ── Actions ── */}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px 0",
            background: C.bgCardWarm, border: `1px solid ${C.border}`,
            borderRadius: 10, color: C.textMid,
            fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: FONT,
          }}>Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            style={{
              flex: 1, padding: "10px 0",
              background: canSubmit ? C.emerald : "#d1fae5",
              border: "none", borderRadius: 10, color: "#fff",
              fontSize: 13, fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed",
              fontFamily: FONT,
              boxShadow: canSubmit ? `0 4px 14px ${C.emerald}40` : "none",
              transition: "background .2s, box-shadow .2s",
            }}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DETAIL DRAWER  — full request info
───────────────────────────────────────────────────────────────── */
function DetailDrawer({ request, accent, onClose }) {
  const status = statusLabel(request);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 998,
      background: "rgba(20,0,0,0.32)",
      display: "flex", justifyContent: "flex-end",
      padding: 0,
    }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%", maxWidth: 440, height: "100%",
          background: C.bgCard,
          boxShadow: "-8px 0 40px rgba(80,10,10,0.16)",
          display: "flex", flexDirection: "column",
          animation: "slideInRight .28s cubic-bezier(.22,1,.36,1) both",
          overflowY: "auto",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer header */}
        <div style={{
          borderBottom: `1px solid ${C.border}`,
          padding: "20px 22px 16px",
          background: C.bgCardWarm,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                background: `${accent}18`,
                border: `1.5px solid ${accent}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Building2 size={20} color={accent} />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.textH, fontFamily: FONT_D, lineHeight: 1.2 }}>
                  {request.company_name}
                </div>
                <div style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>
                  Request #{request.id} · {fmtDate(request.created_at)}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8,
              background: C.bgCardTint, border: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}>
              <X size={15} color={C.textDim} />
            </button>
          </div>

          {/* Status pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: status.bg, color: status.color,
            border: `1px solid ${status.color}30`,
            borderRadius: 99, padding: "4px 12px", fontSize: 11, fontWeight: 700,
            marginTop: 12,
          }}>
            {status.icon} {status.label}
          </div>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Contact */}
          <Section title="Contact Information" accent={accent}>
            <Row icon={<User size={13} color={accent} />}   label="Full Name" value={`${request.first_name} ${request.last_name}`} />
            <Row icon={<Mail size={13} color={accent} />}   label="Email"     value={request.email} mono />
            <Row icon={<Phone size={13} color={accent} />}  label="Phone"     value={request.phone} />
          </Section>

          {/* Location */}
          <Section title="Location" accent={accent}>
            <Row icon={<MapPin size={13} color={accent} />}     label="City"    value={request.city} />
            <Row icon={<Building2 size={13} color={accent} />}  label="Address" value={request.address} />
          </Section>

          {/* Description */}
          {request.description && (
            <Section title="Description" accent={accent}>
              <div style={{
                fontSize: 13, color: C.textP, lineHeight: 1.65,
                fontFamily: FONT, background: C.bgCardWarm,
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: 10, padding: "10px 14px",
              }}>
                {request.description}
              </div>
            </Section>
          )}

          {/* Meta */}
          <Section title="Request Meta" accent={accent}>
            <Row icon={<Calendar size={13} color={accent} />}    label="Submitted"  value={fmtDate(request.created_at)} />
            <Row icon={<Clock size={13} color={accent} />}       label="Time ago"   value={timeAgo(request.created_at)} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, accent, children }) {
  return (
    <div>
      <div style={{
        fontSize: 9.5, fontWeight: 700, color: accent,
        textTransform: "uppercase", letterSpacing: "1.2px",
        marginBottom: 10, fontFamily: FONT,
      }}>
        {title}
      </div>
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

function Row({ icon, label, value, mono = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "11px 14px",
      borderBottom: `1px solid ${C.border}`,
      fontFamily: FONT,
    }}
      className="drawer-row"
    >
      <div style={{ marginTop: 1, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{
          fontSize: 13, color: C.textP, fontWeight: 500,
          fontFamily: mono ? "monospace" : FONT,
          wordBreak: "break-all", lineHeight: 1.4,
        }}>
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   REQUEST CARD
───────────────────────────────────────────────────────────────── */
function RequestCard({ request, index, accent, onApprove, onReject, onView }) {
  const [hov, setHov] = useState(false);
  const status = statusLabel(request);
  const isPending = !request.is_approved && !request.is_rejected;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.bgCard,
        border: `1px solid ${hov ? C.borderMid : C.border}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 16,
        boxShadow: hov ? `0 8px 28px ${C.shadowHov}` : `0 2px 10px ${C.shadow}`,
        transition: "box-shadow .22s ease, border-color .22s ease",
        animation: `slideUp .45s ${0.07 + index * 0.06}s cubic-bezier(.22,.61,.36,1) both`,
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}
    >
      {/* Card header */}
      <div style={{ padding: "16px 18px 14px", display: "flex", alignItems: "flex-start", gap: 13 }}>
        {/* Avatar */}
        <div style={{
          width: 44, height: 44, borderRadius: 13, flexShrink: 0,
          background: `${accent}16`,
          border: `1.5px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: FONT_D, fontSize: 18,
            color: accent, lineHeight: 1, userSelect: "none",
          }}>
            {request.company_name?.[0]?.toUpperCase() ?? "C"}
          </span>
        </div>

        {/* Name + email */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 700, color: C.textH,
            fontFamily: FONT_D, lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {request.company_name}
          </div>
          <div style={{
            fontSize: 11.5, color: C.textDim, marginTop: 3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {request.email}
          </div>
          {/* Status pill */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: status.bg, color: status.color,
            border: `1px solid ${status.color}28`,
            borderRadius: 99, padding: "3px 9px",
            fontSize: 10, fontWeight: 700, fontFamily: FONT, marginTop: 7,
          }}>
            {status.icon} {status.label}
          </div>
        </div>

        {/* View details button */}
        <button
          onClick={() => onView(request)}
          title="View details"
          style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: C.bgCardWarm, border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Eye size={14} color={C.textMid} />
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: C.border, margin: "0 18px" }} />

      {/* Info row */}
      <div style={{
        padding: "12px 18px",
        display: "flex", flexWrap: "wrap", gap: "8px 16px",
      }}>
        {[
          { icon: <User    size={11} color={C.textDim} />, val: `${request.first_name} ${request.last_name}` },
          { icon: <Phone   size={11} color={C.textDim} />, val: request.phone },
          { icon: <MapPin  size={11} color={C.textDim} />, val: request.city },
          { icon: <Clock   size={11} color={C.textDim} />, val: timeAgo(request.created_at) },
        ].map(({ icon, val }, i) => (
          <span key={i} style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 11.5, color: C.textMid, fontFamily: FONT, fontWeight: 500,
          }}>
            {icon} {val}
          </span>
        ))}
      </div>

      {/* Actions — only show for pending */}
      {isPending && (
        <>
          <div style={{ height: 1, background: C.border, margin: "0 18px" }} />
          <div style={{ padding: "12px 18px", display: "flex", gap: 8 }}>
            <button
              onClick={() => onApprove(request)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 0",
                background: C.emerald, border: "none",
                borderRadius: 10, color: "#fff",
                fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer",
                boxShadow: `0 3px 10px ${C.emerald}35`,
                transition: "filter .15s",
              }}
            >
              <CheckCircle size={13} /> Approve
            </button>
            <button
              onClick={() => onReject(request)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 0",
                background: "#ffe4e6", border: `1px solid #fca5a530`,
                borderRadius: 10, color: C.rose,
                fontSize: 12, fontWeight: 700, fontFamily: FONT, cursor: "pointer",
              }}
            >
              <XCircle size={13} /> Reject
            </button>
          </div>
        </>
      )}

      {/* Processed badge */}
      {!isPending && (
        <>
          <div style={{ height: 1, background: C.border, margin: "0 18px" }} />
          <div style={{ padding: "10px 18px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 11.5, color: C.textDim, fontFamily: FONT,
            }}>
              <ShieldCheck size={12} color={C.textDim} />
              This request has been {request.is_approved ? "approved" : "rejected"}.
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function AdminCompanyRequest() {
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState("all"); // all | pending | approved | rejected
  const [viewItem,   setViewItem]   = useState(null);
  const [approveItem, setApproveItem] = useState(null);
  const [rejectItem,  setRejectItem]  = useState(null);

  /* ── Fetch ── */
  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await getCompanyRequests();
      setRequests(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  /* ── Filtered list ── */
  const filtered = requests.filter(r => {
    if (filter === "pending")  return !r.is_approved && !r.is_rejected;
    if (filter === "approved") return r.is_approved;
    if (filter === "rejected") return r.is_rejected;
    return true;
  });

  /* ── Stats ── */
  const pending  = requests.filter(r => !r.is_approved && !r.is_rejected).length;
  const approved = requests.filter(r => r.is_approved).length;
  const rejected = requests.filter(r => r.is_rejected).length;

  /* ── Actions ── */
  const handleApproveConfirm = async (password) => {
    try {
      await approveCompany(approveItem.id, password);
      setApproveItem(null);
      fetchRequests(true);
    } catch (err) { console.error(err); }
  };

  const handleRejectConfirm = async () => {
    try {
      await rejectCompany(rejectItem.id);
      setRejectItem(null);
      fetchRequests(true);
    } catch (err) { console.error(err); }
  };

  /* ── Loading spinner ── */
  if (loading) return (
    <AdminLayout>
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: 280, gap: 12, fontFamily: FONT,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `3px solid ${C.border}`,
          borderTopColor: C.navBright,
          animation: "spin .8s linear infinite",
        }} />
        <span style={{ fontSize: 13, color: C.textDim }}>Loading requests…</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <link rel="stylesheet" href={FONT_LINK} />
      <style>{`
        @keyframes slideUp       { from{opacity:0;transform:translateY(18px)}   to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn        { from{opacity:0}                              to{opacity:1} }
        @keyframes spin          { to{transform:rotate(360deg)} }
        @keyframes slideInRight  { from{opacity:0;transform:translateX(32px)}  to{opacity:1;transform:translateX(0)} }

        /* last drawer-row has no bottom border */
        .drawer-row:last-child { border-bottom: none !important; }

        /* Responsive grid */
        .req-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }
        @media (max-width: 640px) {
          .req-grid { grid-template-columns: 1fr !important; }
          .req-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .req-stats  { flex-wrap: wrap !important; }
          .req-filters{ flex-wrap: wrap !important; }
          .req-page   { padding: 16px 14px 32px !important; }
        }
        @media (max-width: 900px) and (min-width: 641px) {
          .req-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Modals */}
      {approveItem && (
        <ApproveModal
          request={approveItem}
          onConfirm={handleApproveConfirm}
          onCancel={() => setApproveItem(null)}
        />
      )}
      {rejectItem && (
        <ConfirmModal
          message={`Reject the request from "${rejectItem.company_name}" (${rejectItem.first_name} ${rejectItem.last_name})? This cannot be undone.`}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectItem(null)}
        />
      )}
      {viewItem && (
        <DetailDrawer
          request={viewItem}
          accent={ACCENT_CYCLE[requests.indexOf(viewItem) % ACCENT_CYCLE.length]}
          onClose={() => setViewItem(null)}
        />
      )}

      <div
        className="req-page"
        style={{
          padding: "28px 32px 40px 28px",
          background: C.bg, minHeight: "100%",
          fontFamily: FONT,
        }}
      >
        {/* ── Page header ── */}
        <div
          className="req-header"
          style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", gap: 12,
            marginBottom: 26, animation: "fadeIn .4s ease both",
          }}
        >
          <div>
            <h1 style={{
              margin: 0, fontSize: 34, fontWeight: 400,
              fontFamily: FONT_D, color: C.navDark,
              letterSpacing: "-0.5px", lineHeight: 1.1,
            }}>
              Company Requests
            </h1>
            <p style={{
              margin: "6px 0 0", fontSize: 13, color: C.textMid,
              fontWeight: 500, letterSpacing: "0.02em",
            }}>
              Daily Deals &nbsp;·&nbsp; Qatar &nbsp;·&nbsp; Admin Panel v1.0
            </p>
          </div>

          <button
            onClick={() => fetchRequests()}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: C.bgCard, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: "10px 18px",
              boxShadow: `0 2px 8px ${C.shadow}`,
              cursor: "pointer", color: C.navMid,
              fontSize: 13, fontWeight: 600, fontFamily: FONT,
              flexShrink: 0,
            }}
          >
            <RefreshCw
              size={13}
              style={{ animation: refreshing ? "spin .6s linear infinite" : "none" }}
            />
            Refresh
          </button>
        </div>

        {/* ── Summary chips ── */}
        <div
          className="req-stats"
          style={{
            display: "flex", gap: 12, marginBottom: 22, flexWrap: "wrap",
            animation: "slideUp .4s .04s ease both",
          }}
        >
          {[
            { label: "Total",     value: requests.length, color: C.navBright, bg: `${C.navBright}12`, icon: <Building2  size={13} color={C.navBright} /> },
            { label: "Pending",   value: pending,         color: C.amber,     bg: "#fef3c7",          icon: <Clock      size={13} color={C.amber}     /> },
            { label: "Approved",  value: approved,        color: C.emerald,   bg: "#d1fae5",          icon: <CheckCircle size={13} color={C.emerald}  /> },
            { label: "Rejected",  value: rejected,        color: C.rose,      bg: "#ffe4e6",          icon: <XCircle    size={13} color={C.rose}      /> },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: C.bgCard, border: `1px solid ${C.border}`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 12, padding: "12px 20px",
              boxShadow: `0 2px 8px ${C.shadow}`,
              cursor: "pointer",
              transition: "box-shadow .18s",
            }}
              onClick={() => setFilter(label.toLowerCase())}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 9, background: bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  {label}
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 700, color: C.textH, lineHeight: 1,
                  fontFamily: FONT_D,
                }}>
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ── */}
        <div
          className="req-filters"
          style={{
            display: "flex", gap: 7, marginBottom: 24,
            animation: "slideUp .4s .08s ease both",
          }}
        >
          {["all", "pending", "approved", "rejected"].map(f => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 18px", borderRadius: 40,
                  fontSize: 12.5, fontWeight: 700, fontFamily: FONT,
                  cursor: "pointer", border: "1.5px solid",
                  background:  active ? C.navBright : "#fff",
                  color:       active ? "#fff"       : C.textMid,
                  borderColor: active ? C.navBright  : C.border,
                  boxShadow:   active ? `0 4px 14px ${C.navBright}30` : "none",
                  transition: "all .18s",
                  textTransform: "capitalize",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* ── Cards grid ── */}
        {filtered.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: 200, gap: 10,
            background: C.bgCard, border: `1px solid ${C.border}`,
            borderRadius: 16, animation: "fadeIn .4s ease both",
          }}>
            <Inbox size={32} color={C.textDim} opacity={0.4} />
            <span style={{ fontSize: 14, color: C.textDim, fontFamily: FONT }}>
              No {filter === "all" ? "" : filter} requests found.
            </span>
          </div>
        ) : (
          <div className="req-grid">
            {filtered.map((req, i) => (
              <RequestCard
                key={req.id}
                request={req}
                index={i}
                accent={ACCENT_CYCLE[i % ACCENT_CYCLE.length]}
                onApprove={r => setApproveItem(r)}
                onReject={r  => setRejectItem(r)}
                onView={r    => setViewItem(r)}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}