import { useState, useRef, useCallback } from "react";
import { submitCompanyRequest } from "../api/companyApi";

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=Playfair+Display:wght@700&display=swap";

// ─── Field definitions ────────────────────────────────────────────────────────
const PERSONAL_FIELDS = [
  { name: "first_name",  label: "First name",    type: "text",     autoComplete: "given-name"   },
  { name: "last_name",   label: "Last name",     type: "text",     autoComplete: "family-name"  },
  { name: "email",       label: "Email address", type: "email",    autoComplete: "email"        },
  { name: "phone",       label: "Phone number",  type: "tel",      autoComplete: "tel"          },
];

const COMPANY_FIELDS = [
  { name: "company_name", label: "Company name",  type: "text",     autoComplete: "organization",  fullWidth: true  },
  { name: "city",         label: "City",           type: "text",     autoComplete: "address-level2"                  },
  { name: "address",      label: "Street address", type: "text",     autoComplete: "street-address"                  },
  { name: "description",  label: "Description",    type: "textarea", autoComplete: "off",           fullWidth: true, optional: true },
];

const REQUIRED = ["first_name", "last_name", "email", "phone", "company_name", "city", "address"];

const EMPTY_FORM = {
  first_name: "", last_name: "", email: "", phone: "",
  company_name: "", city: "", address: "", description: "",
};

// ─── Validation ───────────────────────────────────────────────────────────────
function validate(name, value) {
  const v = (value || "").trim();
  switch (name) {
    case "first_name":
    case "last_name": {
      const label = name === "first_name" ? "First name" : "Last name";
      if (!v) return `${label} is required`;
      if (v.length < 2) return "At least 2 characters required";
      if (!/^[a-zA-Z\s'-]+$/.test(v)) return "Letters, spaces, hyphens only";
      break;
    }
    case "email":
      if (!v) return "Email address is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address";
      break;
    case "phone":
      if (!v) return "Phone number is required";
      if (!/^[0-9]{8}$/.test(v)) return "Enter exactly 8 digits";
      break;
    case "company_name":
      if (!v) return "Company name is required";
      if (v.length < 2) return "Company name is too short";
      break;
    case "city":
      if (!v) return "City is required";
      break;
    case "address":
      if (!v) return "Street address is required";
      break;
    default:
      break;
  }
  return null;
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="10" cy="10" r="9" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
    <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 6v4.5M10 13v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const RetryIcon = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M4 10a6 6 0 1 1 1.5 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M4 14v-4h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FieldErrIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 3.5v3M6 8v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// ─── Global styles ────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cfr-root {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: #fdf3f3;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 4rem;
  }

  /* Header */
  .cfr-header {
    width: 100%;
    position: relative;
    height: 210px;
    flex-shrink: 0;
    overflow: hidden;
  }
  .cfr-header svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .cfr-header-text {
    position: absolute; inset: 0; z-index: 2;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: #fff; padding: 0 1.5rem; text-align: center;
  }
  .cfr-header-text h1 {
    font-family: 'Playfair Display', serif;
    font-size: clamp(24px, 5.5vw, 36px);
    font-weight: 700;
    letter-spacing: 0.2px;
    text-shadow: 0 2px 18px rgba(0,0,0,0.22);
    animation: fadeDown 0.6s cubic-bezier(.22,1,.36,1) both;
  }
  .cfr-header-text p {
    font-size: clamp(12px, 2.5vw, 14px);
    opacity: 0.86;
    margin-top: 7px;
    letter-spacing: 0.25px;
    animation: fadeDown 0.7s 0.1s cubic-bezier(.22,1,.36,1) both;
  }

  /* Card */
  .cfr-card {
    background: #fff;
    border-radius: 22px;
    border: 0.5px solid #edd5d5;
    padding: clamp(1.5rem, 5vw, 2.4rem) clamp(1.25rem, 5vw, 2.4rem) 2.2rem;
    width: min(700px, calc(100% - 28px));
    margin-top: -62px;
    position: relative;
    z-index: 3;
    box-shadow: 0 12px 60px rgba(128,0,0,0.09), 0 2px 12px rgba(128,0,0,0.04);
    animation: riseUp 0.6s 0.1s cubic-bezier(.22,1,.36,1) both;
  }

  /* Grid */
  .cfr-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  /* ── Floating-label field wrapper ── */
  .cfr-field {
    position: relative;
  }
  .cfr-field.full { grid-column: 1 / -1; }

  /*
   * All inputs share the same height/padding so labels float identically.
   * Top padding = 22px  → leaves room for the floated label (sits at top: 6px).
   * Bottom padding = 6px → keeps text vertically centred in the remaining space.
   * Total inner height ≈ 52px for single-line inputs.
   */
  .cfr-input {
    width: 100%;
    height: 52px;                   /* fixed height — single-line inputs */
    border: 1.5px solid #e5cdcd;
    border-radius: 11px;
    padding: 22px 14px 6px;         /* top gap for floated label */
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    font-weight: 400;
    color: #1a0808;
    background: #fdf8f8;
    outline: none;
    resize: none;
    line-height: 1.4;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.18s;
    -webkit-appearance: none;
    appearance: none;
  }

  textarea.cfr-input {
    height: auto;                   /* override fixed height for textarea */
    min-height: 90px;
    padding-top: 24px;              /* a touch more room so label clears text */
  }

  .cfr-input:focus {
    border-color: #800000;
    background: #fff;
    box-shadow: 0 0 0 3.5px rgba(128,0,0,0.08);
  }
  .cfr-input.has-error { border-color: #c0392b; background: #fff7f7; }
  .cfr-input.has-error:focus { box-shadow: 0 0 0 3.5px rgba(192,57,43,0.1); }

  /*
   * Float label — absolutely positioned inside .cfr-field.
   * Resting state  : sits at vertical centre of the 52 px input (~17px from top).
   * Floated state  : moves to top: 6px and shrinks.
   */
  .cfr-label {
    position: absolute;
    left: 15px;
    top: 50%;                        /* centre inside the field wrapper */
    transform: translateY(-50%);
    font-size: 14px;
    color: #b08585;
    font-weight: 400;
    pointer-events: none;
    transition:
      top 0.17s cubic-bezier(.4,0,.2,1),
      transform 0.17s cubic-bezier(.4,0,.2,1),
      font-size 0.17s,
      color 0.17s,
      letter-spacing 0.17s;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
    line-height: 1;
  }

  /* Textarea label rests near the top (not centred vertically) */
  .cfr-field:has(textarea) .cfr-label {
    top: 16px;
    transform: none;
  }

  /* Floated — when input is focused OR has content */
  .cfr-input:focus ~ .cfr-label,
  .cfr-input.filled ~ .cfr-label {
    top: 6px;
    transform: none;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.35px;
    color: #800000;
  }

  /* Textarea floated */
  .cfr-field:has(textarea) .cfr-input:focus ~ .cfr-label,
  .cfr-field:has(textarea) .cfr-input.filled ~ .cfr-label {
    top: 6px;
    transform: none;
  }

  .cfr-input.has-error ~ .cfr-label,
  .cfr-input.has-error:focus ~ .cfr-label { color: #c0392b; }

  /* Field error */
  .cfr-err {
    display: flex; align-items: center; gap: 5px;
    margin-top: 5px;
    font-size: 11.5px; color: #c0392b;
    font-family: 'DM Sans', sans-serif;
    padding-left: 2px;
    animation: errIn 0.22s ease both;
  }

  /* Section label */
  .cfr-section-wrap { margin-bottom: 20px; }
  .cfr-section {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px;
  }
  .cfr-section-text {
    font-size: 10.5px; font-weight: 600;
    letter-spacing: 1.4px; text-transform: uppercase;
    color: #9a4040; white-space: nowrap;
    font-family: 'DM Sans', sans-serif;
  }
  .cfr-section-line {
    flex: 1; height: 0.5px;
    background: linear-gradient(90deg, #e5cdcd 0%, transparent 100%);
  }

  /* Banners */
  .cfr-banner {
    border-radius: 13px;
    padding: 14px 16px;
    font-size: 13.5px; font-weight: 500;
    margin-bottom: 1.5rem;
    display: flex; align-items: flex-start; gap: 12px;
    font-family: 'DM Sans', sans-serif;
    line-height: 1.45;
    animation: bannerIn 0.38s cubic-bezier(.22,1,.36,1) both;
  }
  .cfr-banner.success {
    background: linear-gradient(135deg, #6b0000 0%, #a52020 100%);
    color: #fff;
  }
  .cfr-banner.error {
    background: #fff2f2;
    color: #8b1c1c;
    border: 1px solid #f5c2c2;
    flex-wrap: wrap;
  }
  .cfr-banner-body { flex: 1; min-width: 0; }
  .cfr-banner-title { display: block; font-weight: 600; font-size: 14px; margin-bottom: 2px; }
  .cfr-banner-sub { display: block; font-size: 12.5px; opacity: 0.82; }

  /* Retry button */
  .cfr-retry {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 10px;
    padding: 7px 14px;
    border: 1.5px solid #c0392b;
    border-radius: 8px;
    background: transparent;
    color: #c0392b;
    font-size: 12.5px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, transform 0.13s;
    white-space: nowrap;
  }
  .cfr-retry:hover { background: #c0392b; color: #fff; transform: translateY(-1px); }
  .cfr-retry:active { transform: scale(0.97); }
  .cfr-retry:focus-visible { outline: 2px solid #c0392b; outline-offset: 2px; }

  /* Submit button */
  .cfr-btn {
    width: 100%; margin-top: 1.8rem;
    padding: 15.5px;
    background: #800000; color: #fff;
    border: none; border-radius: 13px;
    font-size: 15px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.35px;
    cursor: pointer; overflow: hidden;
    transition: background 0.2s, transform 0.14s, box-shadow 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 9px;
  }
  .cfr-btn:hover:not(:disabled) {
    background: #9e1212;
    transform: translateY(-1.5px);
    box-shadow: 0 10px 30px rgba(128,0,0,0.24);
  }
  .cfr-btn:active:not(:disabled) { transform: scale(0.985); }
  .cfr-btn:disabled { opacity: 0.65; cursor: not-allowed; }
  .cfr-btn:focus-visible { outline: 3px solid rgba(128,0,0,0.35); outline-offset: 3px; }

  /* Spinner */
  .cfr-spinner {
    width: 17px; height: 17px;
    border: 2.5px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }

  /* Ads */
  .cfr-ads {
    margin-top: 2rem;
    border: 1.5px dashed #ddc4c4;
    border-radius: 13px;
    padding: 1.6rem 1rem;
    text-align: center;
    color: #c0a0a0; font-size: 12.5px;
    background: #fdf7f7; letter-spacing: 0.6px;
    min-height: 90px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Phone field with +974 prefix ── */
  .cfr-phone-wrap {
    display: flex;
    align-items: stretch;
    height: 52px;                   /* match .cfr-input height */
    border: 1.5px solid #e5cdcd;
    border-radius: 11px;
    background: #fdf8f8;
    overflow: hidden;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.18s;
  }
  .cfr-phone-wrap:focus-within {
    border-color: #800000;
    background: #fff;
    box-shadow: 0 0 0 3.5px rgba(128,0,0,0.08);
  }
  .cfr-phone-wrap.has-error { border-color: #c0392b; background: #fff7f7; }
  .cfr-phone-wrap.has-error:focus-within { box-shadow: 0 0 0 3.5px rgba(192,57,43,0.1); }

  .cfr-phone-prefix {
    display: flex;
    align-items: flex-end;          /* pin to bottom so it aligns with typed text */
    padding: 0 12px 7px;            /* matches input bottom padding */
    font-size: 14px;
    font-weight: 600;
    color: #800000;
    font-family: 'DM Sans', sans-serif;
    white-space: nowrap;
    user-select: none;
    flex-shrink: 0;
    line-height: 1.4;
  }

  .cfr-phone-divider {
    width: 1px;
    background: #e5cdcd;
    align-self: stretch;
    margin: 8px 0;
    flex-shrink: 0;
  }

  /*
   * Phone input: no border of its own (handled by wrapper).
   * Padding mirrors .cfr-input so typed text sits at the same vertical position.
   */
  .cfr-phone-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    padding: 22px 14px 6px 10px;   /* matches .cfr-input padding */
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #1a0808;
    line-height: 1.4;
    -webkit-appearance: none;
    appearance: none;
  }

  /*
   * Phone float label — offset past the +974 prefix (≈ 12px padding + ~32px text + 1px divider + 10px gap = ~57px).
   * Resting: vertically centred, sits inside the text-input area.
   * Floated: moves to top: 6px and snaps back to left: 15px so it floats
   *          over the full field width (above the prefix) — clear and readable.
   */
  .cfr-phone-label {
    left: 62px;                     /* clear the +974 prefix + divider */
    top: 50%;
    transform: translateY(-50%);
  }

  /* Floated via JS class */
  .cfr-phone-label.phone-active {
    left: 15px;                     /* floated label spans full width above prefix */
    top: 6px;
    transform: none;
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.35px;
    color: #800000;
  }
  .cfr-phone-label.phone-error { color: #c0392b; }

  /* Animations */
  @keyframes riseUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bannerIn {
    from { opacity: 0; transform: translateY(-10px) scale(0.985); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes errIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Responsive */
  @media (max-width: 540px) {
    .cfr-header { height: 172px; }
    .cfr-card { margin-top: -42px; border-radius: 18px; }
    .cfr-grid { grid-template-columns: 1fr; }
    .cfr-field.full { grid-column: 1; }
  }
  @media (min-width: 541px) and (max-width: 720px) {
    .cfr-card { padding: 1.8rem 1.6rem; }
  }
`;

// ─── PhoneField ───────────────────────────────────────────────────────────────
// Separate component so we can track focus state for the label
function PhoneField({ value, error, onChange, onBlur }) {
  const [focused, setFocused] = useState(false);
  const filled = (value || "").length > 0;
  const isActive = focused || filled;

  return (
    <div className="cfr-field">
      <div className={`cfr-phone-wrap${error ? " has-error" : ""}`}>
        <span className="cfr-phone-prefix" aria-hidden="true">+974</span>
        <div className="cfr-phone-divider" />
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={8}
          value={value || ""}
          autoComplete="tel"
          aria-label="Phone number"
          aria-describedby={error ? "err_phone" : undefined}
          aria-invalid={error ? "true" : "false"}
          className="cfr-phone-input"
          onChange={onChange}
          onBlur={(e) => { setFocused(false); onBlur(e); }}
          onFocus={() => setFocused(true)}
        />
      </div>

      {/* Float label — driven by JS state since :focus-within can't reach a sibling */}
      <label
        htmlFor="phone"
        className={[
          "cfr-label",
          "cfr-phone-label",
          isActive && "phone-active",
          error    && "phone-error",
        ].filter(Boolean).join(" ")}
      >
        Phone number
      </label>

      {error && (
        <p id="err_phone" className="cfr-err" role="alert">
          <FieldErrIcon />{error}
        </p>
      )}
    </div>
  );
}

// ─── FloatingField ────────────────────────────────────────────────────────────
function FloatingField({ field, value, error, onChange, onBlur }) {
  const filled = (value || "").length > 0;
  const cls    = ["cfr-input", filled && "filled", error && "has-error"].filter(Boolean).join(" ");

  const shared = {
    id: field.name, name: field.name, value: value || "",
    autoComplete: field.autoComplete,
    "aria-label": field.label,
    "aria-describedby": error ? `err_${field.name}` : undefined,
    "aria-invalid": error ? "true" : "false",
    onChange, onBlur,
  };

  return (
    <div className={`cfr-field${field.fullWidth ? " full" : ""}`}>
      {field.type === "textarea" ? (
        <textarea {...shared} className={cls} rows={3} />
      ) : (
        <input {...shared} type={field.type} className={cls} />
      )}

      <label htmlFor={field.name} className="cfr-label">
        {field.label}{field.optional ? " (optional)" : ""}
      </label>

      {error && (
        <p id={`err_${field.name}`} className="cfr-err" role="alert">
          <FieldErrIcon />{error}
        </p>
      )}
    </div>
  );
}

// ─── SectionBlock ─────────────────────────────────────────────────────────────
function SectionBlock({ label, fields, form, errors, onChange, onBlur }) {
  return (
    <div className="cfr-section-wrap">
      <div className="cfr-section">
        <span className="cfr-section-text">{label}</span>
        <div className="cfr-section-line" />
      </div>
      <div className="cfr-grid">
        {fields.map((f) =>
          f.name === "phone" ? (
            <PhoneField
              key="phone"
              value={form.phone}
              error={errors.phone}
              onChange={onChange}
              onBlur={onBlur}
            />
          ) : (
            <FloatingField
              key={f.name} field={f}
              value={form[f.name]} error={errors[f.name]}
              onChange={onChange} onBlur={onBlur}
            />
          )
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CompanyRequestForm() {
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [errors,    setErrors]    = useState({});
  const [status,    setStatus]    = useState("idle");
  const [serverMsg, setServerMsg] = useState("");
  const bannerRef = useRef(null);

  const handleChange = useCallback((e) => {
    let { name, value } = e.target;
    if (name === "phone") {
      value = value.replace(/\D/g, "");
      if (value.length > 8) value = value.slice(0, 8);
    }
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => (er[name] ? { ...er, [name]: null } : er));
  }, []);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    const err = validate(name, value);
    setErrors((er) => ({ ...er, [name]: err }));
  }, []);

  async function handleSubmit() {
    const newErrors = {};
    REQUIRED.forEach((name) => {
      const err = validate(name, form[name]);
      if (err) newErrors[name] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const first = REQUIRED.find((n) => newErrors[n]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setStatus("submitting");
    setServerMsg("");

    try {
      // Replace with your actual API call:
      const res = await submitCompanyRequest(form);

        if (!res?.data?.success) {
        throw new Error(res?.data?.message || "Request failed");
        }

        const msg = res?.data?.message || "Your company request has been received.";

        setServerMsg(msg);
        setStatus("success");
      setForm(EMPTY_FORM);
      setErrors({});
      setTimeout(() => bannerRef.current?.focus(), 80);
    } catch (err) {
      console.error("[CompanyRequestForm]", err);
      let msg = "Something went wrong. Please try again.";
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === "string") msg = data;
        else if (typeof data === "object") {
          const first = Object.values(data)[0];
          msg = Array.isArray(first) ? first[0] : (first ?? msg);
        }
      } else if (err?.request) {
        msg = "Server unreachable. Please check your connection.";
      }
      setServerMsg(msg);
      setStatus("error");
      setTimeout(() => bannerRef.current?.focus(), 80);
    }
  }

  const handleRetry = () => { setStatus("idle"); setServerMsg(""); };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={FONT_HREF} rel="stylesheet" />
      <style>{CSS}</style>

      <div className="cfr-root">

        {/* Wavy header */}
        <header className="cfr-header">
          <svg viewBox="0 0 1200 210" preserveAspectRatio="none"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="hg" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#560000" />
                <stop offset="48%"  stopColor="#800000" />
                <stop offset="100%" stopColor="#b03030" />
              </linearGradient>
            </defs>
            <rect width="1200" height="210" fill="url(#hg)" />
            <path d="M0,135 C200,185 430,80 640,125 C850,168 1040,72 1200,115 L1200,210 L0,210 Z"
                  fill="rgba(255,255,255,0.09)" />
            <path d="M0,158 C240,128 460,184 680,150 C900,116 1070,172 1200,144 L1200,210 L0,210 Z"
                  fill="rgba(255,255,255,0.06)" />
            <path d="M0,180 C320,168 620,192 920,175 C1070,166 1160,182 1200,178 L1200,210 L0,210 Z"
                  fill="rgba(255,255,255,0.04)" />
          </svg>
          <div className="cfr-header-text">
            <h1>Add Your Company</h1>
            <p>Fill in the details below to register your business</p>
          </div>
        </header>

        {/* Form card */}
        <main className="cfr-card">

          {status === "success" && (
            <div className="cfr-banner success"
                 role="status" aria-live="polite"
                 tabIndex={-1} ref={bannerRef}>
              <CheckIcon />
              <span className="cfr-banner-body">
                <span className="cfr-banner-title">Request Submitted!</span>
                <span className="cfr-banner-sub">{serverMsg}</span>
              </span>
            </div>
          )}

          {status === "error" && (
            <div className="cfr-banner error"
                 role="alert" aria-live="assertive"
                 tabIndex={-1} ref={bannerRef}>
              <AlertIcon />
              <span className="cfr-banner-body">
                <span className="cfr-banner-title">Submission Failed</span>
                <span className="cfr-banner-sub">{serverMsg}</span>
              </span>
              <button className="cfr-retry" onClick={handleRetry}
                      aria-label="Retry submission">
                <RetryIcon />Retry
              </button>
            </div>
          )}

          <SectionBlock label="Personal info" fields={PERSONAL_FIELDS}
                        form={form} errors={errors}
                        onChange={handleChange} onBlur={handleBlur} />

          <SectionBlock label="Company details" fields={COMPANY_FIELDS}
                        form={form} errors={errors}
                        onChange={handleChange} onBlur={handleBlur} />

          <button className="cfr-btn" onClick={handleSubmit}
                  disabled={status === "submitting"}
                  aria-busy={status === "submitting"}>
            {status === "submitting"
              ? <><span className="cfr-spinner" aria-hidden="true" />Submitting…</>
              : "Submit Request"
            }
          </button>

          <div className="cfr-ads" aria-label="Advertisement space">
            Google Ads Space
          </div>
        </main>
      </div>
    </>
  );
}