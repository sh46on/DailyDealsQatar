import { useEffect, useState, useRef } from "react";
import { fetchProfile, updateProfile } from "./api/marketplaceApi";
import MarketplaceLayout from "./MarketplaceLayout";
import {
  Camera, MapPin, Map, Home, Save, CheckCircle,
  User, Loader2, AlertCircle, Edit3, X,
} from "lucide-react";

const FONT  = "'Plus Jakarta Sans', sans-serif";
const BLUE  = "#1565c0";
const BLUELT = "#e3f2fd";

// ─── Global styles ────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:wght@700;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:none;} }
  @keyframes fadeIn    { from{opacity:0;}to{opacity:1;} }
  @keyframes shimmer   { 0%{background-position:-600px 0;}100%{background-position:600px 0;} }
  @keyframes spin      { to{transform:rotate(360deg);} }
  @keyframes ringPulse { 0%{transform:scale(1);opacity:0.6;}100%{transform:scale(1.55);opacity:0;} }
  @keyframes popIn     { 0%{opacity:0;transform:scale(0.82);}65%{transform:scale(1.04);}100%{opacity:1;transform:none;} }
  @keyframes waveSlide { to{transform:translateX(-50%);} }
  @keyframes toastIn   { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;} }
  @keyframes floatOrb  { 0%,100%{transform:translateY(0);}50%{transform:translateY(-14px);} }

  .mp-field-input:focus,
  .mp-field-textarea:focus {
    border-color: ${BLUE} !important;
    box-shadow: 0 0 0 3.5px rgba(21,101,192,0.12) !important;
    background: #fff !important;
  }
  .mp-save-btn:not(:disabled):hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 10px 32px rgba(21,101,192,0.34) !important;
  }
  .mp-avatar-ring { transition: transform 0.3s ease, box-shadow 0.3s ease; }
  .mp-avatar-ring:hover { transform: scale(1.03); box-shadow: 0 12px 40px rgba(21,101,192,0.22) !important; }

  .mp-skel { background: linear-gradient(90deg,#f0f4f8 25%,#e2ecf7 50%,#f0f4f8 75%); background-size:600px 100%; animation: shimmer 1.4s linear infinite; border-radius:8px; }

  @media(max-width:900px){
    .mp-prof-layout { grid-template-columns: 1fr !important; }
    .mp-prof-sidebar { display: none !important; }
  }
  @media(max-width:600px){
    .mp-prof-card { padding: 24px 18px !important; }
    .mp-hero-inner { padding: 28px 18px 70px !important; }
  }
`;

function InjectStyles() {
  useEffect(() => {
    if (document.getElementById("mp-profile-css")) return;
    const el = document.createElement("style");
    el.id = "mp-profile-css";
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);
  return null;
}

// ─── Toast notification ───────────────────────────────────────────
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "13px 22px",
      background: isSuccess ? "#f0fdf4" : "#fff1f2",
      border: `1.5px solid ${isSuccess ? "#86efac" : "#fca5a5"}`,
      color: isSuccess ? "#15803d" : "#dc2626",
      borderRadius: 14,
      fontFamily: FONT, fontSize: 13.5, fontWeight: 600,
      boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
      animation: "toastIn 0.3s cubic-bezier(.34,1.56,.64,1) both",
      whiteSpace: "nowrap",
      pointerEvents: "none",
    }}>
      {isSuccess ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
      {toast.message}
    </div>
  );
}

// ─── Field Component ──────────────────────────────────────────────
function Field({ label, icon: Icon, error, children }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.label}>
        <Icon size={13} color={BLUE} />
        {label}
      </label>
      {children}
      {error && (
        <span style={s.fieldError}>
          <AlertCircle size={11} /> {error}
        </span>
      )}
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────
function SkeletonProfile() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, alignItems:"center" }}>
      <div className="mp-skel" style={{ width:110, height:110, borderRadius:"50%" }} />
      <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:12 }}>
        {[1,2,3].map(i => (
          <div key={i}>
            <div className="mp-skel" style={{ height:13, width:"30%", marginBottom:8, borderRadius:6 }} />
            <div className="mp-skel" style={{ height:50, borderRadius:12 }} />
          </div>
        ))}
        <div className="mp-skel" style={{ height:50, borderRadius:12, marginTop:4 }} />
      </div>
    </div>
  );
}

// ─── Ad Slot ─────────────────────────────────────────────────────
function AdSlot({ variant = "leaderboard" }) {
  const dims = variant === "leaderboard"
    ? { w: "100%", h: 90, label: "728 × 90 — Leaderboard Ad" }
    : { w: "100%", h: 250, label: "300 × 250 — Medium Rectangle Ad" };

  return (
    <div style={{
      width: dims.w, height: dims.h,
      background: "repeating-linear-gradient(45deg,#f8fafc,#f8fafc 10px,#eef3fa 10px,#eef3fa 20px)",
      border: "1.5px dashed #cbd5e1",
      borderRadius: 14,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 5,
    }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", fontFamily: FONT, textTransform: "uppercase" }}>
        Advertisement
      </span>
      <span style={{ fontSize: 12, color: "#cbd5e1", fontFamily: FONT, fontWeight: 600 }}>
        {dims.label}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function MarketplaceProfile() {
  const [form,    setForm]    = useState({ city: "", state: "", address: "" });
  const [image,   setImage]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [errors,  setErrors]  = useState({});
  const [dirty,   setDirty]   = useState(false);
  const fileRef = useRef(null);
  const toastTimer = useRef(null);

  // ── Load profile ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetchProfile();
        const data = res?.data?.data || res?.data || {};
        setForm({
          city:    data?.city    || "",
          state:   data?.state   || "",
          address: data?.address || "",
        });
        if (data?.profile_image){

          setPreview(data?.profile_image);
        } 
      } catch (e) {
        console.error(e);
        showToast("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Toast helper ──────────────────────────────────────────────
  const showToast = (message, type = "success") => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  // ── Form handlers ─────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
    setDirty(true);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5 MB", "error");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setDirty(true);
  };

  const validate = () => {
    const e = {};
    if (!form.city.trim())    e.city    = "City is required";
    if (!form.state.trim())   e.state   = "State is required";
    if (!form.address.trim()) e.address = "Address is required";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("city",    form.city.trim());
      formData.append("state",   form.state.trim());
      formData.append("address", form.address.trim());
      if (image) formData.append("image_file", image);
      await updateProfile(formData);
      setDirty(false);
      setImage(null);
      showToast("Profile updated successfully ✓");
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || "Update failed. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    setImage(null);
    setDirty(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <MarketplaceLayout>
      <InjectStyles />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div style={s.page}>

        {/* ── Hero strip ───────────────────────────────────────── */}
        <div style={s.hero}>
          {/* Dot grid */}
          <div style={s.heroDots} />
          {/* Floating orbs */}
          <div style={{...s.orb, width:220, height:220, top:-80, right:-60, animationDelay:"0s"}} />
          <div style={{...s.orb, width:120, height:120, bottom:10, left:60,  animationDelay:"2s"}} />
          {/* Wave */}
          <svg style={s.heroWave} viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path style={{animation:"waveSlide 10s linear infinite"}}
              d="M0,30 C240,55 480,5 720,30 C960,55 1200,5 1440,30 C1680,55 1920,5 2160,30 L2160,60 L0,60 Z"
              fill="#f0f6ff" />
            <path style={{animation:"waveSlide 15s linear infinite reverse"}}
              d="M0,42 C300,18 600,56 900,38 C1200,20 1500,52 1800,36 C2000,24 2160,46 2160,40 L2160,60 L0,60 Z"
              fill="#e8f1fd" opacity="0.7" />
          </svg>
          <div className="mp-hero-inner" style={s.heroInner}>
            <div style={s.heroLabel}>
              <User size={14} />
              My Account
            </div>
            <h1 style={s.heroTitle}>Edit Profile</h1>
            <p style={s.heroSub}>Keep your information up to date for buyers to reach you</p>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div style={s.body}>

          {/* ── Top leaderboard ad ── */}
          <div style={{ marginBottom: 24 }}>
            <AdSlot variant="leaderboard" />
          </div>

          {/* ── Two-column layout ── */}
          <div className="mp-prof-layout" style={s.layout}>

            {/* ── Main card ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mp-prof-card" style={s.card}>

                {loading ? <SkeletonProfile /> : (
                  <>
                    {/* ── Avatar section ── */}
                    <div style={s.avatarSection}>
                      <div style={s.avatarWrap}>
                        {/* Pulsing ring */}
                        <div style={s.avatarRingPulse} />

                        {/* Avatar */}
                        <div className="mp-avatar-ring" style={s.avatarOuter}>
                          {preview ? (
                            <img
                              src={preview}
                              alt="Profile"
                              style={s.avatarImg}
                            />
                          ) : (
                            <div style={s.avatarPlaceholder}>
                              <User size={36} color="#93c5fd" />
                            </div>
                          )}

                          {/* Camera overlay */}
                          <button
                            onClick={() => fileRef.current?.click()}
                            style={s.cameraBtn}
                            title="Change photo"
                          >
                            <Camera size={15} color="#fff" strokeWidth={2.2} />
                          </button>
                        </div>

                        {/* Remove button */}
                        {preview && (
                          <button onClick={removeImage} style={s.removeBtn} title="Remove photo">
                            <X size={12} color="#64748b" />
                          </button>
                        )}
                      </div>

                      {/* Upload text */}
                      <div style={s.avatarInfo}>
                        <button
                          onClick={() => fileRef.current?.click()}
                          style={s.uploadLink}
                        >
                          <Edit3 size={13} />
                          Change photo
                        </button>
                        <p style={s.uploadHint}>JPG, PNG or WEBP · Max 5 MB</p>
                      </div>

                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImage}
                        style={{ display: "none" }}
                      />
                    </div>

                    {/* ── Divider ── */}
                    <div style={s.divider} />

                    {/* ── Form fields ── */}
                    <div style={s.formGrid}>
                      <Field label="City" icon={MapPin} error={errors.city}>
                        <input
                          className="mp-field-input"
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          placeholder="e.g. Doha"
                          style={{
                            ...s.input,
                            borderColor: errors.city ? "#fca5a5" : "#e2e8f0",
                          }}
                        />
                      </Field>

                      <Field label="State" icon={Map} error={errors.state}>
                        <input
                          className="mp-field-input"
                          name="state"
                          value={form.state}
                          onChange={handleChange}
                          placeholder="e.g. Doha Municipality"
                          style={{
                            ...s.input,
                            borderColor: errors.state ? "#fca5a5" : "#e2e8f0",
                          }}
                        />
                      </Field>
                    </div>

                    <Field label="Address" icon={Home} error={errors.address}>
                      <textarea
                        className="mp-field-textarea"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="e.g. 12, Building 123, Street 45, Zone 56, West Bay, Doha, Qatar"
                        rows={3}
                        style={{
                          ...s.textarea,
                          borderColor: errors.address ? "#fca5a5" : "#e2e8f0",
                        }}
                      />
                    </Field>

                    {/* ── Save button ── */}
                    <div style={s.btnRow}>
                      {dirty && !saving && (
                        <span style={s.unsavedBadge}>
                          <Edit3 size={11} />
                          Unsaved changes
                        </span>
                      )}
                      <button
                        className="mp-save-btn"
                        onClick={handleSubmit}
                        disabled={saving}
                        style={{
                          ...s.saveBtn,
                          opacity: saving ? 0.7 : 1,
                          cursor:  saving ? "not-allowed" : "pointer",
                        }}
                      >
                        {saving
                          ? <><Loader2 size={16} style={{animation:"spin .7s linear infinite"}} /> Saving…</>
                          : <><Save size={16} /> Save Profile</>
                        }
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* ── Below-card ad ── */}
              <div style={{ marginTop: 20 }}>
                <AdSlot variant="leaderboard" />
              </div>
            </div>

            {/* ── Right Sidebar ── */}
            <aside className="mp-prof-sidebar" style={s.sidebar}>
              {/* Info card */}
              <div style={s.infoCard}>
                <div style={s.infoHead}>
                  <div style={s.infoIcon}>💡</div>
                  <span style={s.infoTitle}>Profile Tips</span>
                </div>
                <ul style={s.tipsList}>
                  {[
                    "Add a clear profile photo to build trust with buyers.",
                    "Enter your exact city so nearby buyers can find you.",
                    "A detailed address speeds up delivery coordination.",
                  ].map((tip, i) => (
                    <li key={i} style={s.tip}>
                      <span style={s.tipDot} />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Ad slot 1 */}
              <AdSlot variant="rectangle" />

              {/* Spacer + Ad slot 2 */}
              <div style={{ marginTop: 16 }}>
                <AdSlot variant="rectangle" />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "#f0f6ff",
    fontFamily: FONT,
  },

  // Hero
  hero: {
    position: "relative",
    background: "linear-gradient(130deg, #0f3460 0%, #1565c0 50%, #1976d2 100%)",
    overflow: "hidden",
  },
  heroDots: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
    backgroundSize: "28px 28px",
  },
  orb: {
    position: "absolute", borderRadius: "50%",
    background: "rgba(255,255,255,0.06)",
    animation: "floatOrb 7s ease-in-out infinite",
    pointerEvents: "none",
  },
  heroWave: {
    position: "absolute", bottom: 0, left: 0,
    width: "200%", height: 60, zIndex: 1, pointerEvents: "none",
  },
  heroInner: {
    position: "relative", zIndex: 2,
    padding: "36px 32px 72px",
  },
  heroLabel: {
    display: "inline-flex", alignItems: "center", gap: 7,
    background: "rgba(255,255,255,0.13)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 40, padding: "5px 14px",
    fontSize: 12, fontWeight: 700, color: "#bfdbfe",
    fontFamily: FONT, marginBottom: 12,
    backdropFilter: "blur(8px)",
    animation: "fadeIn 0.4s ease both",
  },
  heroTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: "clamp(26px, 4vw, 38px)",
    fontWeight: 900, color: "#fff",
    letterSpacing: "-0.5px", lineHeight: 1.15,
    margin: "0 0 8px",
    animation: "fadeUp 0.45s ease both",
    animationDelay: "0.08s",
  },
  heroSub: {
    fontSize: 14, color: "rgba(255,255,255,0.7)",
    fontFamily: FONT, fontWeight: 400, margin: 0,
    animation: "fadeUp 0.45s ease both", animationDelay: "0.16s",
  },

  // Body
  body: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "clamp(16px, 3vw, 32px) clamp(12px, 3vw, 28px)",
    position: "relative",
    zIndex: 2,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 280px",
    gap: 24,
    alignItems: "start",
  },

  // Card
  card: {
    background: "#fff",
    borderRadius: 22,
    padding: "clamp(20px,4vw,36px)",
    boxShadow: "0 4px 32px rgba(21,101,192,0.09), 0 1px 4px rgba(0,0,0,0.04)",
    border: "1px solid #e0ecfb",
    animation: "fadeUp 0.45s ease both",
    animationDelay: "0.1s",
  },

  // Avatar
  avatarSection: {
    display: "flex", alignItems: "center", gap: 22,
    marginBottom: 24, flexWrap: "wrap",
  },
  avatarWrap: {
    position: "relative", flexShrink: 0,
  },
  avatarRingPulse: {
    position: "absolute", inset: -6,
    borderRadius: "50%",
    border: "2px solid rgba(21,101,192,0.25)",
    animation: "ringPulse 2.8s ease-out infinite",
    pointerEvents: "none",
  },
  avatarOuter: {
    width: 108, height: 108,
    borderRadius: "50%",
    border: "3.5px solid #bfdbfe",
    boxShadow: "0 8px 28px rgba(21,101,192,0.18)",
    position: "relative",
    cursor: "pointer",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%", height: "100%",
    objectFit: "cover", display: "block",
    borderRadius: "50%",
  },
  avatarPlaceholder: {
    width: "100%", height: "100%",
    background: "#dbeafe",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  cameraBtn: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: "36%",
    background: "rgba(21,101,192,0.82)",
    backdropFilter: "blur(4px)",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.18s",
  },
  removeBtn: {
    position: "absolute", top: 2, right: 2,
    width: 22, height: 22, borderRadius: "50%",
    background: "#fff", border: "1.5px solid #e2e8f0",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "background 0.15s, transform 0.15s",
    padding: 0,
  },
  avatarInfo: {
    display: "flex", flexDirection: "column", gap: 5,
  },
  uploadLink: {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: BLUELT, color: BLUE,
    border: "1.5px solid #bfdbfe",
    borderRadius: 40, padding: "7px 16px",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    fontFamily: FONT,
    transition: "background 0.15s, transform 0.15s",
  },
  uploadHint: {
    fontSize: 11.5, color: "#94a3b8", fontFamily: FONT,
    fontWeight: 500, margin: 0,
  },

  divider: {
    height: 1, background: "#f1f5f9",
    marginBottom: 22,
  },

  // Form
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0 16px",
  },
  fieldGroup: {
    display: "flex", flexDirection: "column", gap: 6,
    marginBottom: 18,
  },
  label: {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 11, fontWeight: 700, color: "#64748b",
    letterSpacing: ".6px", textTransform: "uppercase",
    fontFamily: FONT,
  },
  input: {
    border: "1.5px solid #e2e8f0",
    borderRadius: 12, padding: "0 14px",
    height: 50, fontSize: 14, fontFamily: FONT,
    color: "#0f172a", outline: "none",
    background: "#fafcff",
    transition: "border-color .18s, box-shadow .18s, background .18s",
    width: "100%",
  },
  textarea: {
    border: "1.5px solid #e2e8f0",
    borderRadius: 12, padding: "12px 14px",
    fontSize: 14, fontFamily: FONT,
    color: "#0f172a", outline: "none",
    background: "#fafcff", resize: "vertical",
    transition: "border-color .18s, box-shadow .18s, background .18s",
    width: "100%", lineHeight: 1.6, minHeight: 90,
  },
  fieldError: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 11.5, color: "#dc2626", fontFamily: FONT, fontWeight: 500,
  },

  // Buttons
  btnRow: {
    display: "flex", alignItems: "center",
    justifyContent: "flex-end", gap: 14,
    marginTop: 8, flexWrap: "wrap",
  },
  unsavedBadge: {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 12, color: "#d97706",
    background: "#fffbeb", border: "1px solid #fde68a",
    borderRadius: 40, padding: "5px 12px",
    fontFamily: FONT, fontWeight: 600,
    animation: "popIn 0.3s ease both",
  },
  saveBtn: {
    display: "flex", alignItems: "center", gap: 9,
    padding: "0 28px", height: 50,
    background: `linear-gradient(135deg, ${BLUE} 0%, #1976d2 100%)`,
    color: "#fff", border: "none", borderRadius: 14,
    fontSize: 14.5, fontWeight: 700, fontFamily: FONT,
    letterSpacing: "0.1px",
    boxShadow: "0 6px 22px rgba(21,101,192,0.28)",
    transition: "transform 0.18s, box-shadow 0.18s, opacity 0.15s",
  },

  // Sidebar
  sidebar: {
    display: "flex", flexDirection: "column", gap: 0,
    position: "sticky", top: 82,
    animation: "fadeUp 0.45s ease both", animationDelay: "0.2s",
  },
  infoCard: {
    background: "#fff", borderRadius: 18,
    border: "1px solid #e0ecfb",
    padding: "16px 18px",
    boxShadow: "0 2px 16px rgba(21,101,192,0.07)",
    marginBottom: 16,
  },
  infoHead: {
    display: "flex", alignItems: "center", gap: 10,
    marginBottom: 14,
  },
  infoIcon: { fontSize: 20 },
  infoTitle: { fontSize: 14, fontWeight: 800, color: "#0f172a", fontFamily: FONT },
  tipsList: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 },
  tip: {
    display: "flex", alignItems: "flex-start", gap: 8,
    fontSize: 12.5, color: "#475569", fontFamily: FONT,
    lineHeight: 1.55,
  },
  tipDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: BLUE, marginTop: 5, flexShrink: 0, opacity: 0.7,
  },
};