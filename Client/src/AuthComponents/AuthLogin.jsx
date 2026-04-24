import { useState, useEffect, useRef, useCallback } from "react";
import { loginUser } from "../api/authApi";
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle, Info, X, Loader2, ArrowLeft } from "lucide-react";
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

// ─── Wavy Background ─────────────────────────────────────────────
function WavyBackground() {
  return (
    <div style={bgStyles.wrapper}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ ...bgStyles.orb, ...bgStyles[`orb${i}`] }} />
      ))}
      <svg style={bgStyles.waveBottom} viewBox="0 0 1440 90" preserveAspectRatio="none">
        <path style={{ animation: "waveMove 7s linear infinite" }} d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,0 1620,40 C1800,80 1980,0 2160,40 L2160,90 L0,90 Z" fill="rgba(255,255,255,0.06)" />
        <path style={{ animation: "waveMove 10s linear infinite reverse" }} d="M0,55 C200,20 400,75 600,45 C800,15 1000,70 1200,45 C1400,20 1600,70 1800,50 C2000,25 2160,60 2160,50 L2160,90 L0,90 Z" fill="rgba(255,255,255,0.04)" />
        <path style={{ animation: "waveMove 14s linear infinite" }} d="M0,65 C240,35 480,80 720,55 C960,30 1200,75 1440,55 C1680,35 1920,70 2160,55 L2160,90 L0,90 Z" fill="rgba(255,255,255,0.08)" />
      </svg>
      <svg style={bgStyles.waveTop} viewBox="0 0 1440 70" preserveAspectRatio="none">
        <path style={{ animation: "waveMove 9s linear infinite" }} d="M0,30 C200,60 400,10 600,35 C800,60 1000,10 1200,35 C1400,60 1600,10 1800,35 C2000,60 2160,10 2160,35 L2160,70 L0,70 Z" fill="rgba(255,255,255,0.05)" />
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

// ─── Back Button — Liquid Morph Effect ───────────────────────────
function BackButton({ onClick }) {
  const [ripples, setRipples] = useState([]);
  const [hovered, setHovered] = useState(false);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 800);
    setTimeout(() => onClick(), 320);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...backBtn.base,
        ...(hovered ? backBtn.hovered : {}),
      }}
    >
      {/* Liquid ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          style={{
            ...backBtn.ripple,
            left: r.x,
            top: r.y,
          }}
        />
      ))}

      {/* Sliding arrow track */}
      <span style={backBtn.track}>
        <span style={{ ...backBtn.arrowSlide, ...(hovered ? backBtn.arrowSlideHovered : {}) }}>
          <ArrowLeft size={13} strokeWidth={2.5} />
          <ArrowLeft size={13} strokeWidth={2.5} />
        </span>
      </span>

      <span style={{ ...backBtn.label, ...(hovered ? backBtn.labelHovered : {}) }}>
        Back to Home
      </span>
    </button>
  );
}

// ─── Keyframes ────────────────────────────────────────────────────
const CSS_KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');
  @keyframes waveMove    { to { transform: translateX(-50%); } }
  @keyframes floatOrb    { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.04); } }
  @keyframes fadeUp      { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }
  @keyframes toastSlide  { from { opacity:0; transform: translateX(50px); } to { opacity:1; transform:none; } }
  @keyframes spin        { to { transform: rotate(360deg); } }
  @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes liquidBurst {
    0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.55; border-radius: 50%; }
    60%  { border-radius: 38%; opacity: 0.25; }
    100% { transform: translate(-50%,-50%) scale(7); opacity: 0; border-radius: 28%; }
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("ddq-styles")) return;
    const el = document.createElement("style");
    el.id = "ddq-styles";
    el.textContent = CSS_KEYFRAMES;
    document.head.appendChild(el);
  }, []);
  return null;
}

// ─── Main Component ───────────────────────────────────────────────
export default function AuthLogin() {
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
    if (!form.phone)                    e.phone    = "Phone number is required";
    else if (!validatePhone(form.phone)) e.phone   = "Enter a valid 8-digit Qatar mobile number";
    if (!form.password)                 e.password = "Password is required";
    return e;
  };

  const attemptLogin = useCallback(async (attempt = 1) => {
    try {
      setLoading(true);
      setProgress(20);
      const progressTimer = setTimeout(() => setProgress(60), 800);

      const res = await loginUser({
        phone:    "+974" + form.phone.trim(),
        password: form.password,
      });

      clearTimeout(progressTimer);
      setProgress(100);
      setBusy(false);
      setRetryCount(0);

      localStorage.setItem("access",  res.access);
      localStorage.setItem("refresh", res.refresh);
      localStorage.setItem("user",    JSON.stringify(res.user));
      localStorage.setItem("role",    res.role);

      add("Login successful! Redirecting…", "success", 2500);

      setTimeout(() => {
        const role = res.role;
        if (role === "admin")        navigate("/admin");
        else if (role === "company") navigate("/company");
        else                         navigate("/user/home");
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
        <WavyBackground />

        {/* Back Button — top left, outside card */}
        <div style={styles.backWrap}>
          <BackButton onClick={() => navigate("/")} />
        </div>

        <div style={styles.card}>
          {/* Brand wordmark — centered, no icon */}
          <div style={styles.brandBlock}>
            <div style={styles.brandName}>Daily Deals</div>
            <div style={styles.brandTag}>QATAR</div>
          </div>

          <h1 style={styles.title}>Welcome back</h1>
          <p  style={styles.subtitle}>Sign in to your account</p>

          <BusyBanner visible={busy} attempt={retryCount} />
          <ProgressBar progress={progress} />

          {/* Phone */}
          <div style={styles.field}>
            <label style={styles.label}>MOBILE NUMBER</label>
            <div style={{ ...styles.inputRow, ...(errors.phone ? styles.inputErr : {}) }}>
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
            {errors.phone && <span style={styles.errText}>{errors.phone}</span>}
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>PASSWORD</label>
            <div style={{ ...styles.inputRow, ...(errors.password ? styles.inputErr : {}) }}>
              <div style={styles.iconSlot}><Lock size={15} /></div>
              <input
                id="ddq-pass"
                type={showPw ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                style={styles.input}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) { e.preventDefault(); handleSubmit(); }
                }}
              />
              <button onClick={() => setShowPw((p) => !p)} style={styles.eyeBtn} type="button">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <span style={styles.errText}>{errors.password}</span>}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...styles.btnPrimary, ...(loading ? styles.btnDisabled : {}) }}
          >
            {loading
              ? <><Loader2 size={17} style={{ animation: "spin .7s linear infinite" }} /> Signing in…</>
              : "Sign in"
            }
          </button>

          <div style={styles.divider}>
            <div style={styles.divLine} />
            <span style={styles.divText}>or</span>
            <div style={styles.divLine} />
          </div>

          <button onClick={() => navigate("/register")} style={styles.btnOutline}>
            Create an account
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const BRAND = "#8B1A1A";
const FONT  = "'Sora', -apple-system, BlinkMacSystemFont, sans-serif";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #6b0f1a 0%, #8B1A1A 45%, #a01f1f 75%, #6b0f1a 100%)",
    padding: "16px",
    position: "relative",
    overflow: "hidden",
    fontFamily: FONT,
  },
  backWrap: {
    position: "fixed",
    top: "22px",
    left: "22px",
    zIndex: 20,
  },
  card: {
    position: "relative",
    zIndex: 10,
    background: "rgba(255,255,255,0.97)",
    borderRadius: "22px",
    padding: "clamp(24px, 5vw, 36px)",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 24px 64px rgba(107,15,26,0.35), 0 4px 16px rgba(0,0,0,0.12)",
    animation: "fadeUp .45s ease both",
  },
  brandBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "18px",
    gap: "2px",
  },
  brandName: {
    fontSize: "28px",
    fontWeight: 800,
    color: BRAND,
    letterSpacing: "-0.8px",
    lineHeight: 1.1,
  },
  brandTag: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#c07070",
    letterSpacing: "3px",
  },
  title: {
    fontSize: "clamp(22px, 5vw, 26px)",
    fontWeight: 800,
    color: "#111",
    margin: "0 0 4px",
    letterSpacing: "-0.7px",
    textAlign: "center",
  },
  subtitle: {
    fontSize: "13px",
    color: "#999",
    margin: "0 0 20px",
    textAlign: "center",
  },
  field:    { display: "flex", flexDirection: "column", gap: "5px", marginBottom: "13px" },
  label:    { fontSize: "10.5px", fontWeight: 600, color: "#aaa", letterSpacing: ".6px" },
  inputRow: {
    display: "flex", alignItems: "center",
    border: "1.5px solid #ebebeb",
    borderRadius: "11px", overflow: "hidden",
    transition: "border-color .18s, box-shadow .18s",
    background: "#fff",
  },
  inputErr: { borderColor: "#e74c3c" },
  prefix: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "0 11px",
    borderRight: "1.5px solid #f2f2f2",
    background: "#fafafa",
    height: "46px", flexShrink: 0,
  },
  code:     { fontSize: "12.5px", color: "#555", fontWeight: 600 },
  input: {
    border: "none", outline: "none", flex: 1,
    fontSize: "14px", padding: "0 12px", height: "46px",
    background: "transparent", color: "#111", fontFamily: FONT,
  },
  iconSlot: { padding: "0 11px", color: "#ccc", display: "flex", alignItems: "center" },
  eyeBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: "0 11px", color: "#ccc",
    display: "flex", alignItems: "center", height: "46px",
  },
  errText:  { fontSize: "11.5px", color: "#e74c3c", marginTop: "2px" },
  btnPrimary: {
    width: "100%", height: "48px",
    background: `linear-gradient(135deg, ${BRAND} 0%, #a72020 100%)`,
    color: "#fff", border: "none", borderRadius: "11px",
    fontSize: "14px", fontWeight: 700, cursor: "pointer",
    marginTop: "4px", letterSpacing: ".2px",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "9px",
    transition: "opacity .15s, transform .1s",
    fontFamily: FONT,
    boxShadow: `0 6px 22px rgba(139,26,26,0.30)`,
  },
  btnDisabled: { opacity: 0.65, cursor: "not-allowed" },
  divider:  { display: "flex", alignItems: "center", gap: "10px", margin: "15px 0" },
  divLine:  { flex: 1, height: "1px", background: "#f0f0f0" },
  divText:  { fontSize: "11px", color: "#ccc" },
  btnOutline: {
    width: "100%", height: "48px",
    background: "transparent", color: BRAND,
    border: `1.5px solid ${BRAND}`,
    borderRadius: "11px", fontSize: "14px", fontWeight: 600,
    cursor: "pointer", letterSpacing: ".2px",
    transition: "background .15s, transform .1s",
    fontFamily: FONT,
  },
};

const backBtn = {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 16px 9px 12px",
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.28)",
    borderRadius: "40px",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: "13px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.88)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    transition: "background .22s, border-color .22s, color .22s, transform .18s, box-shadow .22s",
    position: "relative",
    overflow: "hidden",
    letterSpacing: "0.1px",
    boxShadow: "0 2px 14px rgba(0,0,0,0.15)",
  },
  hovered: {
    background: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.5)",
    color: "#fff",
    transform: "translateY(-1px)",
    boxShadow: "0 6px 24px rgba(0,0,0,0.22)",
  },
  ripple: {
    position: "absolute",
    width: "28px",
    height: "28px",
    background: "rgba(255,255,255,0.35)",
    borderRadius: "50%",
    pointerEvents: "none",
    transform: "translate(-50%, -50%) scale(0)",
    animation: "liquidBurst 0.75s cubic-bezier(0.2, 0.8, 0.4, 1) forwards",
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
    transition: "transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  arrowSlideHovered: {
    transform: "translateX(-13px)",
  },
  label: {
    transition: "letter-spacing 0.2s ease, opacity 0.2s ease",
  },
  labelHovered: {
    letterSpacing: "0.3px",
  },
};

const bgStyles = {
  wrapper: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" },
  orb0: { width: 320, height: 320, top: -100, left: -100, animationDelay: "0s" },
  orb1: { width: 200, height: 200, bottom: 60,  right: -70,  animationDelay: "3s" },
  orb2: { width: 120, height: 120, top: "40%", left: "8%",  animationDelay: "1.5s" },
  orb: {
    position: "absolute", borderRadius: "50%",
    background: "rgba(255,255,255,0.07)",
    animation: "floatOrb 8s ease-in-out infinite",
  },
  waveBottom: {
    position: "absolute", bottom: 0, left: 0,
    width: "200%", height: 90, zIndex: 0,
  },
  waveTop: {
    position: "absolute", top: 0, left: 0,
    width: "200%", height: 70, zIndex: 0,
    transform: "rotate(180deg)",
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
    padding: "11px 13px", borderRadius: "11px",
    fontSize: "13px", fontWeight: 500,
    boxShadow: "0 4px 18px rgba(0,0,0,0.11)",
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
  track: { height: 3, background: "#f0f0f0", borderRadius: 2, overflow: "hidden", marginBottom: 14 },
  fill:  { height: "100%", background: `linear-gradient(90deg, ${BRAND}, #c0392b)`, borderRadius: 2, transition: "width .35s ease" },
};

const bannerStyles = {
  wrap: {
    background: "#fffbeb", border: "1px solid #fbbf24",
    borderRadius: "9px", padding: "10px 13px",
    fontSize: "12.5px", color: "#92400e",
    display: "flex", alignItems: "center", gap: "8px", marginBottom: "13px",
  },
  dot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#f59e0b", flexShrink: 0,
    animation: "pulse 1.2s ease infinite",
  },
};