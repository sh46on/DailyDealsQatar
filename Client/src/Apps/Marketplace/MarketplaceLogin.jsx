import { useState, useEffect, useRef, useCallback } from "react";
import { loginUser } from "../../api/authApi";      
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Info, X, Loader2, ArrowLeft, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Qatar Flag SVG ─────────────────────────────────────────────
function QatarFlag() {
  return (
    <svg width="24" height="16" viewBox="0 0 24 16" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="7" height="16" fill="#fff" />
      <polygon points="7,0 24,0 24,16 7,16 10,14 7,12 10,10 7,8 10,6 7,4 10,2" fill="#8D0B2B" />
    </svg>
  );
}

// ─── Animated Background ─────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div style={bgStyles.wrapper}>
      {/* Soft orbs */}
      {[0, 1, 2, 3].map((i) => (
        <div key={i} style={{ ...bgStyles.orb, ...bgStyles[`orb${i}`] }} />
      ))}

      {/* Grid overlay */}
      <div style={bgStyles.grid} />

      {/* Floating rings */}
      <div style={{ ...bgStyles.ring, ...bgStyles.ring0 }} />
      <div style={{ ...bgStyles.ring, ...bgStyles.ring1 }} />

      {/* Bottom wave */}
      <svg style={bgStyles.wave} viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path
          style={{ animation: "waveShift 9s linear infinite" }}
          d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 C1680,100 1920,20 2160,60 L2160,120 L0,120 Z"
          fill="rgba(255,255,255,0.07)"
        />
        <path
          style={{ animation: "waveShift 12s linear infinite reverse" }}
          d="M0,75 C300,35 600,95 900,65 C1200,35 1500,90 1800,65 C2000,45 2160,75 2160,70 L2160,120 L0,120 Z"
          fill="rgba(255,255,255,0.05)"
        />
      </svg>
    </div>
  );
}

// ─── Toast System ─────────────────────────────────────────────────
const TOAST_ICONS = {
  success: <CheckCircle size={15} />,
  error:   <XCircle size={15} />,
  warning: <AlertTriangle size={15} />,
  info:    <Info size={15} />,
};

function Toast({ toasts, onRemove }) {
  return (
    <div style={toastStyles.stack}>
      {toasts.map((t) => (
        <div key={t.id} style={{ ...toastStyles.toast, ...toastStyles[t.type] }}>
          <span style={toastStyles.icon}>{TOAST_ICONS[t.type]}</span>
          <span style={toastStyles.msg}>{t.message}</span>
          <button onClick={() => onRemove(t.id)} style={toastStyles.close}><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback((id) => {
    setToasts((p) => p.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
  }, []);

  const add = useCallback((message, type = "error", duration = 4500) => {
    const id = `t_${Date.now()}_${Math.random()}`;
    setToasts((p) => [...p, { id, message, type }]);
    timers.current[id] = setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);
  return { toasts, add, remove };
}

// ─── Progress Bar ─────────────────────────────────────────────────
function ProgressBar({ progress }) {
  if (progress <= 0) return null;
  return (
    <div style={progStyles.track}>
      <div style={{ ...progStyles.fill, width: `${progress}%` }} />
    </div>
  );
}

// ─── Server Busy Banner ───────────────────────────────────────────
function BusyBanner({ visible, attempt }) {
  if (!visible) return null;
  return (
    <div style={bannerStyles.wrap}>
      <div style={bannerStyles.dot} />
      <span>Server is busy. Retrying… (attempt {attempt}/3)</span>
    </div>
  );
}

// ─── Error Parser ─────────────────────────────────────────────────
function parseApiError(err) {
  const status = err?.response?.status;
  const data   = err?.response?.data;
  if (!status || status === 0)  return { global: "Server is not responding. Please check your connection.", busy: true };
  if (status === 503)           return { global: "Server is busy. Retrying automatically…", busy: true };
  if (status === 500)           return { global: "Something went wrong on our end. Our team has been notified." };
  if (status === 401)           return { global: "Invalid phone number or password." };
  if (status === 400) {
    return {
      phone: data?.phone?.[0] || null,
      password: data?.password?.[0] || null,
      global: data?.non_field_errors?.[0] || data?.message || null,
    };
  }
  return { global: data?.message || "Login failed. Please try again." };
}

// ─── Back Button ─────────────────────────────────────────────────
function BackButton({ onClick }) {
  const [ripples, setRipples] = useState([]);
  const [hovered, setHovered] = useState(false);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 750);
    setTimeout(() => onClick(), 300);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...backBtn.base, ...(hovered ? backBtn.hovered : {}) }}
    >
      {ripples.map((r) => (
        <span key={r.id} style={{ ...backBtn.ripple, left: r.x, top: r.y }} />
      ))}
      <span style={backBtn.track}>
        <span style={{ ...backBtn.arrowSlide, ...(hovered ? backBtn.arrowSlideHovered : {}) }}>
          <ArrowLeft size={13} strokeWidth={2.5} />
          <ArrowLeft size={13} strokeWidth={2.5} />
        </span>
      </span>
      <span style={{ ...backBtn.label, ...(hovered ? backBtn.labelHovered : {}) }}>
        Back to Marketplace
      </span>
    </button>
  );
}

// ─── Keyframes ────────────────────────────────────────────────────
const CSS_KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  @keyframes waveShift    { to { transform: translateX(-50%); } }
  @keyframes floatOrb     { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(-22px) scale(1.05);} }
  @keyframes fadeUp       { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:none;} }
  @keyframes toastSlide   { from{opacity:0;transform:translateX(48px);} to{opacity:1;transform:none;} }
  @keyframes spin         { to{transform:rotate(360deg);} }
  @keyframes pulse        { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes ringPulse    { 0%{transform:scale(1);opacity:0.15;} 100%{transform:scale(1.9);opacity:0;} }
  @keyframes liquidBurst  {
    0%  {transform:translate(-50%,-50%) scale(0);opacity:0.5;border-radius:50%;}
    60% {border-radius:38%;opacity:0.2;}
    100%{transform:translate(-50%,-50%) scale(7);opacity:0;border-radius:28%;}
  }
  @keyframes bagBounce    { 0%,100%{transform:translateY(0) rotate(-4deg);} 50%{transform:translateY(-4px) rotate(4deg);} }
  @keyframes shimmer      {
    0%  { background-position: -200% center; }
    100%{ background-position: 200% center; }
  }

  .ddq-input-row:focus-within {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3.5px rgba(59,130,246,0.14) !important;
  }
  .ddq-btn-primary:not(:disabled):hover {
    transform: translateY(-1.5px);
    box-shadow: 0 10px 32px rgba(37,99,235,0.38) !important;
  }
  .ddq-btn-outline:hover {
    background: rgba(59,130,246,0.06) !important;
    transform: translateY(-1px);
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("ddq-blue-styles")) return;
    const el = document.createElement("style");
    el.id = "ddq-blue-styles";
    el.textContent = CSS_KEYFRAMES;
    document.head.appendChild(el);
  }, []);
  return null;
}

// ─── Main Component ───────────────────────────────────────────────
export default function MarketplaceLogin() {
  const [form, setForm]             = useState({ phone: "", password: "" });
  const [errors, setErrors]         = useState({});
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [busy, setBusy]             = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimer                  = useRef(null);
  const { toasts, add, remove }     = useToast();
  const navigate                    = useNavigate();

  const MAX_RETRIES = 3;

  const validatePhone = (n) => /^[3456789]\d{7}$/.test(n.trim());

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" && !/^\d*$/.test(value)) return;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateLocally = () => {
    const e = {};
    if (!form.phone)                     e.phone    = "Phone number is required";
    else if (!validatePhone(form.phone)) e.phone    = "Enter a valid 8-digit Qatar mobile number";
    if (!form.password)                  e.password = "Password is required";
    return e;
  };

  const attemptLogin = useCallback(async (attempt = 1) => {
    try {
      setLoading(true);
      setProgress(20);
      const progressTimer = setTimeout(() => setProgress(60), 800);

      const res = await loginUser({
  phone: form.phone.trim(),
  password: form.password,
});

if (!res.success) {
  add(res.message || "Login failed", "error");
  return;
}

      clearTimeout(progressTimer);
      setProgress(100);
      setBusy(false);
      setRetryCount(0);

      localStorage.setItem("access",  res.access);
      localStorage.setItem("refresh", res.refresh);
      localStorage.setItem("user",    JSON.stringify(res.user));
      const role = (res.role || "").toLowerCase();

localStorage.removeItem("role");   // clear old
localStorage.setItem("role", role);

      add("Login successful! Redirecting…", "success", 2500);

  const roleRedirect = {
  admin: "/admin/marketplace",
  user: "/marketplace/home",
  company: "/marketplace/home",
};

setTimeout(() => {
  console.log("ROLE AFTER NORMALIZE:", role);
  navigate(roleRedirect[role] || "/marketplace/home");
}, 1800);

    } catch (err) {
      setProgress(0);
      const parsed = parseApiError(err);

      if (parsed.busy) {
        if (attempt <= MAX_RETRIES) {
          setBusy(true);
          setRetryCount(attempt);
          setLoading(false);
          add(`Server busy. Retrying in 5s… (${attempt}/${MAX_RETRIES})`, "warning", 5000);
          clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(() => attemptLogin(attempt + 1), 5000);
        } else {
          setBusy(false);
          setRetryCount(0);
          setLoading(false);
          add("Server is unavailable. Please try again later.", "error");
        }
        return;
      }

      setBusy(false);
      setLoading(false);
      if (parsed.phone)    setErrors((p) => ({ ...p, phone: parsed.phone }));
      if (parsed.password) setErrors((p) => ({ ...p, password: parsed.password }));
      if (parsed.global)   add(parsed.global, "error");
    }
  }, [form, add, navigate]);

  const handleSubmit = () => {
    if (loading) return;
    clearTimeout(retryTimer.current);
    setRetryCount(0);
    setBusy(false);
    setErrors({});
    const localErrors = validateLocally();
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      add("Please fix the highlighted errors.", "warning");
      return;
    }
    attemptLogin(1);
  };

  useEffect(() => () => clearTimeout(retryTimer.current), []);

  return (
    <>
      <InjectStyles />
      <Toast toasts={toasts} onRemove={remove} />

      <div style={styles.page}>
        <AnimatedBackground />

        {/* Back Button */}
        <div style={styles.backWrap}>
          <BackButton onClick={() => navigate("/marketplace")} />
        </div>

        <div style={styles.card}>

          {/* Brand block */}
          <div style={styles.brandBlock}>
            <div style={styles.iconRing}>
              <ShoppingBag size={22} color="#2563eb" style={{ animation: "bagBounce 3s ease-in-out infinite" }} />
            </div>
            <div>
              <div style={styles.brandName}>Daily Deals</div>
              <div style={styles.brandTag}>MARKETPLACE · QATAR</div>
            </div>
          </div>

          {/* Heading */}
          <div style={styles.headingBlock}>
            <h1 style={styles.title}>Login to Marketplace</h1>
            {/* <p style={styles.subtitle}>Sign in to shop, track orders & more</p> */}
          </div>

          {/* Decorative accent line */}
          <div style={styles.accentLine}>
            <div style={styles.accentDot} />
            <div style={styles.accentBar} />
            <div style={styles.accentDot} />
          </div>

          <BusyBanner visible={busy} attempt={retryCount} />
          <ProgressBar progress={progress} />

          {/* Phone */}
          <div style={styles.field}>
            <label style={styles.label}>MOBILE NUMBER</label>
            <div
              className="ddq-input-row"
              style={{ ...styles.inputRow, ...(errors.phone ? styles.inputErr : {}) }}
            >
              <div style={styles.prefix}>
                <QatarFlag />
                <span style={styles.code}>+974</span>
              </div>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="3312 3456"
                maxLength={8}
                inputMode="numeric"
                style={styles.input}
                onKeyDown={(e) => e.key === "Enter" && document.getElementById("ddq-pass").focus()}
              />
            </div>
            {errors.phone && <span style={styles.errText}>⚠ {errors.phone}</span>}
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <div
              className="ddq-input-row"
              style={{ ...styles.inputRow, ...(errors.password ? styles.inputErr : {}) }}
            >
              <div style={styles.iconSlot}><Lock size={15} color="#94a3b8" /></div>
              <input
                id="ddq-pass"
                type={showPw ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                style={styles.input}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) { e.preventDefault(); handleSubmit(); }
                }}
              />
              <button onClick={() => setShowPw((p) => !p)} style={styles.eyeBtn} type="button">
                {showPw ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
              </button>
            </div>
            {errors.password && <span style={styles.errText}>⚠ {errors.password}</span>}
          </div>

          {/* Submit */}
          <button
            className="ddq-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...styles.btnPrimary, ...(loading ? styles.btnDisabled : {}) }}
          >
            {loading ? (
              <>
                <Loader2 size={17} style={{ animation: "spin .7s linear infinite" }} />
                Signing in…
              </>
            ) : (
              <>
                <ShoppingBag size={16} />
                Sign in to Marketplace
              </>
            )}
          </button>

          <div style={styles.divider}>
            <div style={styles.divLine} />
            <span style={styles.divText}>new here?</span>
            <div style={styles.divLine} />
          </div>

          <button
            className="ddq-btn-outline"
            onClick={() => navigate("/register")}
            style={styles.btnOutline}
          >
            Create an account
          </button>
        </div>

        {/* Decorative floating tags */}
        <div style={floatTag(true)}>🛒 Free Delivery</div>
        <div style={floatTag(false)}>🏷️ Best Deals</div>
      </div>
    </>
  );
}

// ─── Floating tag helper ──────────────────────────────────────────
const floatTag = (left) => ({
  position: "fixed",
  [left ? "left" : "right"]: "clamp(10px, 3vw, 32px)",
  bottom: "clamp(24px, 6vh, 60px)",
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: "20px",
  padding: "7px 14px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#fff",
  letterSpacing: "0.2px",
  animation: `floatOrb ${left ? "6" : "8"}s ease-in-out infinite`,
  animationDelay: left ? "0s" : "2s",
  pointerEvents: "none",
  display: "none", // shown only on wider screens via inline override
  "@media(minWidth:640px)": { display: "block" },
});

// ─── Styles ───────────────────────────────────────────────────────
const BLUE   = "#2563eb";
const BLUE2  = "#1d4ed8";
const FONT   = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(140deg, #0f3460 0%, #1565c0 30%, #1e88e5 60%, #29b6f6 100%)",
    padding: "16px",
    position: "relative",
    overflow: "hidden",
    fontFamily: FONT,
  },
  backWrap: {
    position: "fixed",
    top: "20px",
    left: "20px",
    zIndex: 30,
  },
  card: {
    position: "relative",
    zIndex: 10,
    background: "rgba(255,255,255,0.97)",
    borderRadius: "24px",
    padding: "clamp(26px, 5vw, 40px)",
    width: "100%",
    maxWidth: "410px",
    boxShadow: "0 32px 72px rgba(15,52,96,0.35), 0 4px 20px rgba(0,0,0,0.1)",
    animation: "fadeUp .45s cubic-bezier(0.22,1,0.36,1) both",
  },
  brandBlock: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginBottom: "20px",
  },
  iconRing: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    border: "1.5px solid #bfdbfe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(37,99,235,0.15)",
  },
  brandName: {
    fontSize: "20px",
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-0.6px",
    lineHeight: 1.1,
  },
  brandTag: {
    fontSize: "9.5px",
    fontWeight: 700,
    color: BLUE,
    letterSpacing: "2px",
    marginTop: "2px",
    opacity: 0.75,
  },
  headingBlock: {
    marginBottom: "12px",
    
  },
  title: {
    fontSize: "clamp(22px, 5vw, 27px)",
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 5px",
    letterSpacing: "-0.8px",
    lineHeight: 1.2,
    
  },
  subtitle: {
    fontSize: "13.5px",
    color: "#64748b",
    margin: 0,
    fontWeight: 400,
  },
  accentLine: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "14px 0 18px",
  },
  accentDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: BLUE,
    opacity: 0.5,
    flexShrink: 0,
  },
  accentBar: {
    flex: 1,
    height: "1.5px",
    background: `linear-gradient(90deg, ${BLUE}55, #bfdbfe, transparent)`,
    borderRadius: "2px",
  },
  field:    { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" },
  label:    { fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", letterSpacing: ".7px" },
  inputRow: {
    display: "flex", alignItems: "center",
    border: "1.5px solid #e2e8f0",
    borderRadius: "12px", overflow: "hidden",
    background: "#fff",
    transition: "border-color .18s, box-shadow .18s",
  },
  inputErr: { borderColor: "#f87171" },
  prefix: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "0 12px",
    borderRight: "1.5px solid #f1f5f9",
    background: "#f8fafc",
    height: "48px", flexShrink: 0,
  },
  code:     { fontSize: "13px", color: "#475569", fontWeight: 600 },
  input: {
    border: "none", outline: "none", flex: 1,
    fontSize: "14px", padding: "0 13px", height: "48px",
    background: "transparent", color: "#0f172a",
    fontFamily: FONT,
  },
  iconSlot: {
    padding: "0 12px", display: "flex", alignItems: "center", flexShrink: 0,
  },
  eyeBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: "0 12px", display: "flex", alignItems: "center", height: "48px",
  },
  errText:  { fontSize: "11.5px", color: "#ef4444", marginTop: "2px", fontWeight: 500 },
  btnPrimary: {
    width: "100%", height: "50px",
    background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE2} 100%)`,
    color: "#fff", border: "none", borderRadius: "12px",
    fontSize: "14.5px", fontWeight: 700, cursor: "pointer",
    marginTop: "6px", letterSpacing: ".2px",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "9px",
    transition: "opacity .15s, transform .15s, box-shadow .15s",
    fontFamily: FONT,
    boxShadow: `0 6px 24px rgba(37,99,235,0.32)`,
  },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed", transform: "none !important" },
  divider:  { display: "flex", alignItems: "center", gap: "10px", margin: "16px 0" },
  divLine:  { flex: 1, height: "1px", background: "#f1f5f9" },
  divText:  { fontSize: "11px", color: "#cbd5e1", fontWeight: 600, letterSpacing: "0.5px" },
  btnOutline: {
    width: "100%", height: "50px",
    background: "transparent", color: BLUE,
    border: `1.5px solid #bfdbfe`,
    borderRadius: "12px", fontSize: "14px", fontWeight: 600,
    cursor: "pointer", letterSpacing: ".1px",
    transition: "background .15s, transform .12s, border-color .15s",
    fontFamily: FONT,
  },
};

const backBtn = {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 16px 9px 12px",
    background: "rgba(255,255,255,0.16)",
    border: "1px solid rgba(255,255,255,0.32)",
    borderRadius: "40px",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: "12.5px",
    fontWeight: 700,
    color: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    transition: "background .2s, border-color .2s, transform .18s, box-shadow .2s",
    position: "relative",
    overflow: "hidden",
    letterSpacing: "0.2px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.14)",
  },
  hovered: {
    background: "rgba(255,255,255,0.26)",
    borderColor: "rgba(255,255,255,0.55)",
    color: "#fff",
    transform: "translateY(-1px)",
    boxShadow: "0 8px 28px rgba(0,0,0,0.2)",
  },
  ripple: {
    position: "absolute",
    width: "28px",
    height: "28px",
    background: "rgba(255,255,255,0.4)",
    borderRadius: "50%",
    pointerEvents: "none",
    transform: "translate(-50%, -50%) scale(0)",
    animation: "liquidBurst 0.72s cubic-bezier(0.2, 0.8, 0.4, 1) forwards",
  },
  track: {
    display: "flex",
    alignItems: "center",
    width: "13px",
    overflow: "hidden",
    flexShrink: 0,
  },
  arrowSlide: {
    display: "flex",
    gap: "13px",
    transition: "transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  arrowSlideHovered: { transform: "translateX(-13px)" },
  label: { transition: "letter-spacing 0.18s ease" },
  labelHovered: { letterSpacing: "0.4px" },
};

const bgStyles = {
  wrapper: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" },
  orb: {
    position: "absolute",
    borderRadius: "50%",
    animation: "floatOrb 8s ease-in-out infinite",
  },
  orb0: {
    width: 380, height: 380,
    top: -140, left: -120,
    background: "rgba(255,255,255,0.08)",
    animationDelay: "0s",
  },
  orb1: {
    width: 220, height: 220,
    bottom: 40, right: -80,
    background: "rgba(255,255,255,0.07)",
    animationDelay: "2.5s",
  },
  orb2: {
    width: 130, height: 130,
    top: "38%", left: "6%",
    background: "rgba(255,255,255,0.05)",
    animationDelay: "1.2s",
  },
  orb3: {
    width: 80, height: 80,
    top: "15%", right: "12%",
    background: "rgba(255,255,255,0.06)",
    animationDelay: "3.5s",
  },
  grid: {
    position: "absolute", inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
  },
  ring: {
    position: "absolute",
    borderRadius: "50%",
    border: "1.5px solid rgba(255,255,255,0.12)",
    animation: "ringPulse 5s ease-out infinite",
  },
  ring0: {
    width: 160, height: 160,
    top: "10%", right: "8%",
    animationDelay: "0s",
  },
  ring1: {
    width: 100, height: 100,
    bottom: "18%", left: "5%",
    animationDelay: "2s",
  },
  wave: {
    position: "absolute", bottom: 0, left: 0,
    width: "200%", height: 120, zIndex: 0,
  },
};

const toastStyles = {
  stack: {
    position: "fixed", top: 20, right: 20,
    display: "flex", flexDirection: "column", gap: "8px",
    zIndex: 9999, maxWidth: "320px", width: "calc(100vw - 40px)",
  },
  toast: {
    display: "flex", alignItems: "flex-start", gap: "9px",
    padding: "11px 13px", borderRadius: "12px",
    fontSize: "13px", fontWeight: 500,
    boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
    animation: "toastSlide .22s ease both",
    lineHeight: 1.45, fontFamily: FONT,
  },
  success: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" },
  error:   { background: "#fff1f2", color: "#9f1239", border: "1px solid #fecdd3" },
  warning: { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" },
  info:    { background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" },
  icon:    { display: "flex", alignItems: "center", flexShrink: 0, marginTop: "1px" },
  msg:     { flex: 1 },
  close:   { background: "none", border: "none", cursor: "pointer", opacity: .5, padding: 0, color: "inherit", display: "flex" },
};

const progStyles = {
  track: { height: 3, background: "#e2e8f0", borderRadius: 2, overflow: "hidden", marginBottom: 14 },
  fill:  { height: "100%", background: `linear-gradient(90deg, ${BLUE}, #60a5fa)`, borderRadius: 2, transition: "width .35s ease" },
};

const bannerStyles = {
  wrap: {
    background: "#fffbeb", border: "1px solid #fde68a",
    borderRadius: "10px", padding: "10px 13px",
    fontSize: "12.5px", color: "#92400e",
    display: "flex", alignItems: "center", gap: "8px", marginBottom: "13px",
  },
  dot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#f59e0b", flexShrink: 0,
    animation: "pulse 1.2s ease infinite",
  },
};