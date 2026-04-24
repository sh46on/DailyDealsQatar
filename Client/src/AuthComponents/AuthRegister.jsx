import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";
import {
  User, Mail, Lock, Eye, EyeOff, Camera, ArrowLeft,
  CheckCircle, XCircle, AlertTriangle, Info, X, Loader2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────
const BRAND = "#8B1A1A";
const FONT  = "'Sora', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── CSS Injection ────────────────────────────────────────────────
const CSS_KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

  @keyframes waveMove  { to { transform: translateX(-50%); } }
  @keyframes floatOrb  { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.04)} }
  @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  @keyframes toastSlide{ from{opacity:0;transform:translateX(48px)} to{opacity:1;transform:none} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes avatarPop { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
  @keyframes liquidBurst {
    0%   { transform:translate(-50%,-50%) scale(0); opacity:.55; border-radius:50%; }
    60%  { border-radius:38%; opacity:.25; }
    100% { transform:translate(-50%,-50%) scale(7); opacity:0; border-radius:28%; }
  }

  .back-fixed   { display: flex !important; }
  .back-in-card { display: none !important; }

  @media (max-width: 768px) {
    .back-fixed   { display: none !important; }
    .back-in-card { display: flex !important; }
    .back-in-card button {
      background: rgba(139,26,26,0.12) !important;
      border-color: rgba(139,26,26,0.45) !important;
      color: #8B1A1A !important;
    }
    .back-in-card button:hover {
      background: rgba(139,26,26,0.2) !important;
      border-color: rgba(139,26,26,0.7) !important;
    }
  }

  @media (max-width: 420px) {
    .reg-card { padding: 24px 18px 22px !important; }
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("ddq-reg-styles")) return;
    const el = document.createElement("style");
    el.id = "ddq-reg-styles";
    el.textContent = CSS_KEYFRAMES;
    document.head.appendChild(el);
  }, []);
  return null;
}

// ─── Toast ────────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: <CheckCircle size={14} />,
  error:   <XCircle size={14} />,
  warning: <AlertTriangle size={14} />,
  info:    <Info size={14} />,
};
const TOAST_CFG = {
  success: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" },
  error:   { background: "#fff1f2", color: "#9f1239", border: "1px solid #fecdd3" },
  warning: { background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" },
  info:    { background: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" },
};

function Toast({ toasts, onRemove }) {
  return (
    <div style={{
      position: "fixed", top: 20, right: 20, zIndex: 9999,
      display: "flex", flexDirection: "column", gap: 8,
      maxWidth: 320, width: "calc(100vw - 40px)",
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          padding: "10px 12px", borderRadius: 11,
          fontSize: 13, fontWeight: 500, lineHeight: 1.45,
          animation: "toastSlide .22s ease both",
          boxShadow: "0 4px 18px rgba(0,0,0,.11)",
          fontFamily: FONT, ...TOAST_CFG[t.type],
        }}>
          <span style={{ display: "flex", alignItems: "center", flexShrink: 0, marginTop: 1 }}>
            {TOAST_ICONS[t.type]}
          </span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => onRemove(t.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            opacity: .5, padding: 0, color: "inherit", display: "flex",
          }}>
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const remove = useCallback(id => {
    setToasts(p => p.filter(t => t.id !== id));
    clearTimeout(timers.current[id]);
  }, []);

  const add = useCallback((message, type = "error", duration = 4500) => {
    const id = `t_${Date.now()}_${Math.random()}`;
    setToasts(p => [...p, { id, message, type }]);
    timers.current[id] = setTimeout(() => remove(id), duration);
  }, [remove]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);
  return { toasts, add, remove };
}

// ─── Sub-components ───────────────────────────────────────────────
function QatarFlag() {
  return (
    <svg width="22" height="15" viewBox="0 0 24 16" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="7" height="16" fill="#fff" />
      <polygon points="7,0 24,0 24,16 7,16 10,14 7,12 10,10 7,8 10,6 7,4 10,2" fill="#8D0B2B" />
    </svg>
  );
}

function WavyBackground() {
  const orbs = [
    { w: 300, h: 300, style: { top: "-110px", left: "-110px", animationDelay: "0s" } },
    { w: 200, h: 200, style: { bottom: "40px",  right: "-70px",  animationDelay: "3s" } },
    { w: 110, h: 110, style: { top: "42%",      left: "6%",      animationDelay: "1.5s" } },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {orbs.map((o, i) => (
        <div key={i} style={{
          position: "absolute", borderRadius: "50%",
          width: o.w, height: o.h,
          background: "rgba(255,255,255,0.07)",
          animation: "floatOrb 8s ease-in-out infinite",
          ...o.style,
        }} />
      ))}
      <svg style={{ position: "absolute", bottom: 0, left: 0, width: "200%", height: 90 }}
        viewBox="0 0 1440 90" preserveAspectRatio="none">
        <path style={{ animation: "waveMove 7s linear infinite" }}
          d="M0,40 C180,80 360,0 540,40 C720,80 900,0 1080,40 C1260,80 1440,0 1620,40 C1800,80 1980,0 2160,40 L2160,90 L0,90 Z"
          fill="rgba(255,255,255,0.06)" />
        <path style={{ animation: "waveMove 12s linear infinite reverse" }}
          d="M0,55 C200,15 400,75 600,45 C800,10 1000,70 1200,45 C1400,15 1600,70 1800,50 C2000,20 2160,60 2160,50 L2160,90 L0,90 Z"
          fill="rgba(255,255,255,0.04)" />
      </svg>
      <svg style={{ position: "absolute", top: 0, left: 0, width: "200%", height: 65, transform: "rotate(180deg)" }}
        viewBox="0 0 1440 65" preserveAspectRatio="none">
        <path style={{ animation: "waveMove 10s linear infinite" }}
          d="M0,28 C200,55 400,8 600,32 C800,56 1000,8 1200,32 C1400,56 1600,8 1800,32 C2000,56 2160,8 2160,32 L2160,65 L0,65 Z"
          fill="rgba(255,255,255,0.05)" />
      </svg>
    </div>
  );
}

function BackButton({ onClick }) {
  const [ripples, setRipples] = useState([]);
  const [hovered, setHovered] = useState(false);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(p => [...p, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 800);
    setTimeout(onClick, 320);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 16px 9px 12px",
        background: hovered ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.13)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.28)"}`,
        borderRadius: 40, cursor: "pointer", fontFamily: FONT,
        fontSize: 13, fontWeight: 600,
        color: hovered ? "#fff" : "rgba(255,255,255,0.88)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        transition: "background .22s, border-color .22s, color .22s, transform .18s, box-shadow .22s",
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered ? "0 6px 24px rgba(0,0,0,0.22)" : "0 2px 14px rgba(0,0,0,0.15)",
        position: "relative", overflow: "hidden", letterSpacing: "0.1px",
      }}
    >
      {ripples.map(r => (
        <span key={r.id} style={{
          position: "absolute", width: 28, height: 28,
          background: "rgba(255,255,255,0.35)", borderRadius: "50%",
          pointerEvents: "none", left: r.x, top: r.y,
          transform: "translate(-50%,-50%) scale(0)",
          animation: "liquidBurst 0.75s cubic-bezier(0.2,0.8,0.4,1) forwards",
        }} />
      ))}
      <span style={{ display: "flex", alignItems: "center", width: 13, overflow: "hidden", flexShrink: 0 }}>
        <span style={{
          display: "flex", gap: 13,
          transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1)",
          transform: hovered ? "translateX(-13px)" : "none",
        }}>
          <ArrowLeft size={13} strokeWidth={2.5} />
          <ArrowLeft size={13} strokeWidth={2.5} />
        </span>
      </span>
      <span style={{ letterSpacing: hovered ? "0.3px" : "0.1px", transition: "letter-spacing .2s" }}>
        Back to Home
      </span>
    </button>
  );
}

function PasswordStrength({ value }) {
  if (!value) return null;
  let score = 0;
  if (value.length >= 6)  score++;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const cfg = [
    { color: "#f0f0f0", label: "",       labelColor: "#ccc"    },
    { color: "#e74c3c", label: "Weak",   labelColor: "#e74c3c" },
    { color: "#f39c12", label: "Fair",   labelColor: "#f39c12" },
    { color: "#3498db", label: "Good",   labelColor: "#3498db" },
    { color: "#27ae60", label: "Strong", labelColor: "#27ae60" },
  ];
  const c = cfg[score];
  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: "flex", gap: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < score ? c.color : "#f0f0f0",
            transition: "background .25s",
          }} />
        ))}
      </div>
      {c.label && <div style={{ fontSize: 10.5, color: c.labelColor, marginTop: 3 }}>{c.label}</div>}
    </div>
  );
}

function AvatarUpload({ file, onChange }) {
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <label style={{
        position: "relative", cursor: "pointer",
        width: 80, height: 80, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "avatarPop .4s ease both", flexShrink: 0,
      }}>
        <input type="file" accept="image/*" onChange={onChange} style={{
          position: "absolute", inset: 0, opacity: 0, cursor: "pointer",
          width: "100%", height: "100%", borderRadius: "50%",
        }} />
        {preview ? (
          <img src={preview} alt="profile" style={{
            width: 80, height: 80, borderRadius: "50%", objectFit: "cover",
            border: `3px solid ${BRAND}`, boxShadow: `0 0 0 4px rgba(139,26,26,.12)`,
          }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg,#f5e6e6,#fce8e8)",
            border: "2.5px dashed #d4a0a0",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
          }}>
            <Camera size={20} color={BRAND} strokeWidth={1.8} />
          </div>
        )}
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          width: 24, height: 24, borderRadius: "50%", background: BRAND,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid #fff", boxShadow: "0 2px 6px rgba(139,26,26,.35)",
        }}>
          <Camera size={11} color="#fff" strokeWidth={2} />
        </div>
      </label>
      <div style={{ textAlign: "center", lineHeight: 1.3 }}>
        {file
          ? <span style={{ fontSize: 10.5, color: BRAND, fontWeight: 600 }}>Change</span>
          : <><div style={{ fontSize: 10.5, color: "#aaa" }}>Photo</div><div style={{ fontSize: 10, color: "#ccc" }}>Optional</div></>
        }
      </div>
    </div>
  );
}

function ProgressBar({ progress }) {
  if (!progress) return null;
  return (
    <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
      <div style={{
        height: "100%", borderRadius: 2,
        background: `linear-gradient(90deg,${BRAND},#c0392b)`,
        width: `${progress}%`, transition: "width .35s ease",
      }} />
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 11 }}>
      <div style={styles.label}>{label}</div>
      {children}
      {error && <span style={styles.errText}>{error}</span>}
    </div>
  );
}

function InputRow({ hasError, children }) {
  return (
    <div style={{ ...styles.inputRow, ...(hasError ? styles.inputErr : {}) }}>
      {children}
    </div>
  );
}

// ─── Error Parser ─────────────────────────────────────────────────
function parseApiError(err) {
  const status = err?.response?.status;
  const data   = err?.response?.data;
  if (!status || status === 0) return { global: "Server is not responding. Please check your connection." };
  if (status === 503)          return { global: "Server is busy. Please try again shortly." };
  if (status === 500)          return { global: "Something went wrong on our end. Please try again." };
  if (status === 409)          return { global: "An account with this email or phone already exists." };
  if (status === 400 && data?.errors) {
    return {
      first_name: data.errors?.first_name?.[0] || null,
      phone:      data.errors?.phone?.[0]      || null,
      email:      data.errors?.email?.[0]      || null,
      password:   data.errors?.password?.[0]   || null,
      global:     data.errors?.non_field_errors?.[0] || data?.message || null,
    };
  }
  return { global: data?.message || "Registration failed. Please try again." };
}

// ─── Main Component ───────────────────────────────────────────────
export default function AuthRegister() {
  const navigate = useNavigate();
  const { toasts, add, remove } = useToast();

  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", email: "",
    password: "", confirm_password: "", profile_pic: null,
  });
  const [errors, setErrors]     = useState({});
  const [showPw, setShowPw]     = useState(false);
  const [showCpw, setShowCpw]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_pic") {
      setForm(p => ({ ...p, profile_pic: files[0] || null }));
      return;
    }
    if (name === "phone" && !/^\d*$/.test(value)) return;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
    if (name === "password" || name === "confirm_password")
      setErrors(p => ({ ...p, confirm_password: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.first_name.trim())
      e.first_name = "First name is required";
    if (!form.phone)
      e.phone = "Phone number is required";
    else if (!/^[3456789]\d{7}$/.test(form.phone))
      e.phone = "Enter a valid 8-digit Qatar mobile number";
    if (!form.email)
      e.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (!form.password || form.password.length < 6)
      e.password = "Password must be at least 6 characters";
    if (!form.confirm_password)
      e.confirm_password = "Please confirm your password";
    else if (form.password !== form.confirm_password)
      e.confirm_password = "Passwords do not match";
    return e;
  };

  const handleSubmit = async () => {
    if (loading) return;
    const localErrors = validate();
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors);
      add("Please fix the highlighted errors.", "warning");
      return;
    }
    try {
      setLoading(true);
      setProgress(20);

      const data = new FormData();
      data.append("phone",      "+974" + form.phone.trim());
      data.append("email",      form.email.trim());
      data.append("first_name", form.first_name.trim());
      data.append("last_name",  form.last_name.trim());
      data.append("password",   form.password);
      if (form.profile_pic) data.append("profile_pic", form.profile_pic);

      const progressTimer = setTimeout(() => setProgress(65), 700);
      const res = await registerUser(data);
      clearTimeout(progressTimer);

      if (!res.success) {
        setProgress(0);
        if (res.errors?.first_name?.[0]) setErrors(p => ({ ...p, first_name: res.errors.first_name[0] }));
        if (res.errors?.phone?.[0])      setErrors(p => ({ ...p, phone:      res.errors.phone[0] }));
        if (res.errors?.email?.[0])      setErrors(p => ({ ...p, email:      res.errors.email[0] }));
        if (res.errors?.password?.[0])   setErrors(p => ({ ...p, password:   res.errors.password[0] }));
        add(res.message || "Registration failed. Please try again.", "error");
        return;
      }

      setProgress(100);
      localStorage.setItem("access",  res.access);
      localStorage.setItem("refresh", res.refresh);
      localStorage.setItem("user",    JSON.stringify(res.user));
      localStorage.setItem("role",    res.role);

      add("Account created successfully! Redirecting…", "success", 2500);
      setTimeout(() => {navigate("/user/home");}, 1800);

    } catch (err) {
      setProgress(0);
      const parsed = parseApiError(err);
      if (parsed.first_name) setErrors(p => ({ ...p, first_name: parsed.first_name }));
      if (parsed.phone)      setErrors(p => ({ ...p, phone:      parsed.phone }));
      if (parsed.email)      setErrors(p => ({ ...p, email:      parsed.email }));
      if (parsed.password)   setErrors(p => ({ ...p, password:   parsed.password }));
      if (parsed.global)     add(parsed.global, "error");
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = form.confirm_password && form.password === form.confirm_password;
  const focusNext = (id) => (e) => e.key === "Enter" && document.getElementById(id)?.focus();

  return (
    <>
      <InjectStyles />
      <Toast toasts={toasts} onRemove={remove} />

      <div style={styles.page}>
        <WavyBackground />

        {/* Desktop back button — fixed top-left */}
        <div className="back-fixed" style={styles.backWrap}>
          <BackButton onClick={() => navigate("/")} />
        </div>

        <div className="reg-card" style={styles.card}>
          {/* Mobile/tablet back button — inside card */}
          <div className="back-in-card" style={{ marginBottom: 14 }}>
            <BackButton onClick={() => navigate("/")} />
          </div>

          <ProgressBar progress={progress} />

          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={styles.brandName}>Daily Deals Qatar</div>
            <div style={styles.brandTag}>REGISTER YOUR ACCOUNT</div>
          </div>

          {/* Avatar + Name grid */}
          <div style={styles.avatarNameGrid}>
            <div style={styles.avatarCell}>
              <AvatarUpload
                file={form.profile_pic}
                onChange={e => setForm(p => ({ ...p, profile_pic: e.target.files[0] || null }))}
              />
            </div>

            <Field label="FIRST NAME" error={errors.first_name}>
              <InputRow hasError={!!errors.first_name}>
                <div style={styles.iconSlot}><User size={14} /></div>
                <input name="first_name" value={form.first_name} onChange={handleChange}
                  placeholder="Ali" style={styles.input} onKeyDown={focusNext("reg-ln")} />
              </InputRow>
            </Field>

            <Field label="LAST NAME">
              <InputRow>
                <div style={styles.iconSlot}><User size={14} /></div>
                <input id="reg-ln" name="last_name" value={form.last_name} onChange={handleChange}
                  placeholder="Hassan" style={styles.input} onKeyDown={focusNext("reg-phone")} />
              </InputRow>
            </Field>
          </div>

          {/* Phone */}
          <Field label="MOBILE NUMBER" error={errors.phone}>
            <InputRow hasError={!!errors.phone}>
              <div style={styles.prefix}>
                <QatarFlag />
                <span style={styles.prefixCode}>+974</span>
              </div>
              <input id="reg-phone" name="phone" type="tel" value={form.phone}
                onChange={handleChange} placeholder="3312 3456"
                maxLength={8} inputMode="numeric" style={styles.input}
                onKeyDown={focusNext("reg-email")} />
            </InputRow>
          </Field>

          {/* Email */}
          <Field label="EMAIL ADDRESS" error={errors.email}>
            <InputRow hasError={!!errors.email}>
              <div style={styles.iconSlot}><Mail size={14} /></div>
              <input id="reg-email" name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="ali@example.com" style={styles.input}
                onKeyDown={focusNext("reg-pass")} />
            </InputRow>
          </Field>

          {/* Password */}
          <Field label="PASSWORD" error={errors.password}>
            <InputRow hasError={!!errors.password}>
              <div style={styles.iconSlot}><Lock size={14} /></div>
              <input id="reg-pass" name="password" type={showPw ? "text" : "password"}
                value={form.password} onChange={handleChange}
                placeholder="Min 6 characters" style={styles.input}
                onKeyDown={focusNext("reg-cpw")} />
              <button onClick={() => setShowPw(p => !p)} style={styles.eyeBtn} type="button">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </InputRow>
            <PasswordStrength value={form.password} />
          </Field>

          {/* Confirm Password */}
          <Field label="CONFIRM PASSWORD" error={errors.confirm_password}>
            <InputRow hasError={!!errors.confirm_password}>
              <div style={styles.iconSlot}><Lock size={14} /></div>
              <input id="reg-cpw" name="confirm_password" type={showCpw ? "text" : "password"}
                value={form.confirm_password} onChange={handleChange}
                placeholder="Re-enter password" style={styles.input}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
              {passwordsMatch ? (
                <div style={{ padding: "0 10px", display: "flex", alignItems: "center" }}>
                  <CheckCircle size={15} color="#27ae60" />
                </div>
              ) : (
                <button onClick={() => setShowCpw(p => !p)} style={styles.eyeBtn} type="button">
                  {showCpw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}
            </InputRow>
          </Field>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading} style={{
            ...styles.btnPrimary,
            ...(loading ? { opacity: .65, cursor: "not-allowed" } : {}),
          }}>
            {loading
              ? <><Loader2 size={16} style={{ animation: "spin .7s linear infinite" }} /> Creating account…</>
              : "Create account"
            }
          </button>

          <div style={styles.divider}>
            <div style={styles.divLine} />
            <span style={styles.divText}>already have an account?</span>
            <div style={styles.divLine} />
          </div>

          <button onClick={() => navigate("/login")} style={styles.btnOutline}>
            Sign in instead
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg,#6b0f1a 0%,#8B1A1A 45%,#a01f1f 75%,#6b0f1a 100%)",
    padding: "24px 16px", position: "relative", overflow: "hidden", fontFamily: FONT,
  },
  backWrap: {
    position: "fixed", top: 22, left: 22, zIndex: 20,
  },
  card: {
    position: "relative", zIndex: 10,
    background: "rgba(255,255,255,0.97)",
    borderRadius: 24,
    padding: "clamp(24px, 4vw, 36px) clamp(24px, 4vw, 40px) 28px",
    width: "100%",
    maxWidth: "clamp(340px, 90vw, 540px)",
    boxShadow: "0 28px 70px rgba(107,15,26,0.38), 0 4px 18px rgba(0,0,0,0.13)",
    animation: "fadeUp .45s ease both",
  },
  brandName: {
    fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 800, color: BRAND,
    letterSpacing: "-0.8px", lineHeight: 1.1,
  },
  brandTag: {
    fontSize: 10, fontWeight: 700, color: "#c07070",
    letterSpacing: "3px", marginTop: 3,
  },
  avatarNameGrid: {
    display: "grid",
    gridTemplateColumns: "100px 1fr",
    gridTemplateRows: "auto auto",
    gap: "0 16px",
    alignItems: "start",
    marginBottom: 4,
  },
  avatarCell: {
    gridRow: "1 / 3",
    display: "flex", alignItems: "center", justifyContent: "center",
    paddingTop: 18,
  },
  label:    { fontSize: 10, fontWeight: 600, color: "#bbb", letterSpacing: ".7px", textTransform: "uppercase" },
  inputRow: {
    display: "flex", alignItems: "center",
    border: "1.5px solid #ebebeb", borderRadius: 12,
    overflow: "hidden", transition: "border-color .18s",
    background: "#fff",
  },
  inputErr:   { borderColor: "#e74c3c" },
  prefix: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "0 11px", borderRight: "1.5px solid #f2f2f2",
    background: "#fafafa", height: 44, flexShrink: 0,
  },
  prefixCode: { fontSize: 12, color: "#555", fontWeight: 600 },
  input: {
    border: "none", outline: "none", flex: 1, fontSize: 13.5,
    padding: "0 11px", height: 44, background: "transparent",
    color: "#111", fontFamily: FONT, minWidth: 0,
  },
  iconSlot: { padding: "0 10px", color: "#ccc", display: "flex", alignItems: "center", flexShrink: 0 },
  eyeBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: "0 10px", color: "#ccc", display: "flex", alignItems: "center", height: 44,
  },
  errText: { fontSize: 11, color: "#e74c3c", marginTop: 1 },
  btnPrimary: {
    width: "100%", height: 48,
    background: `linear-gradient(135deg,${BRAND} 0%,#a72020 100%)`,
    color: "#fff", border: "none", borderRadius: 12,
    fontSize: 14.5, fontWeight: 700, cursor: "pointer",
    marginTop: 6, letterSpacing: ".2px",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
    transition: "opacity .15s, transform .1s", fontFamily: FONT,
    boxShadow: `0 6px 24px rgba(139,26,26,.32)`,
  },
  divider: { display: "flex", alignItems: "center", gap: 10, margin: "14px 0" },
  divLine: { flex: 1, height: 1, background: "#f0f0f0" },
  divText: { fontSize: 11, color: "#ccc", whiteSpace: "nowrap" },
  btnOutline: {
    width: "100%", height: 48, background: "transparent", color: BRAND,
    border: `1.5px solid ${BRAND}`, borderRadius: 12,
    fontSize: 13.5, fontWeight: 600, cursor: "pointer",
    letterSpacing: ".2px", transition: "background .15s", fontFamily: FONT,
  },
};