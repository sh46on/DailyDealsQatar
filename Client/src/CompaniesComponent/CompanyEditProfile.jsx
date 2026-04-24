import { useState, useEffect, useRef } from "react";
import { getCurrentUser } from "../api/userApi";
import { updateCompanyProfile } from "./api/companyApi";
import CompanyLayout from "../CompaniesComponent/CompanyLayout";
import { getImageUrl } from "../api/media";

/* ─────────────────────────────────────────────────────────────────
   Styles
───────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Bricolage+Grotesque:wght@600;700;800&display=swap');

  .ep * { box-sizing: border-box; margin: 0; padding: 0; }

  .ep {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f4f6fe;
    min-height: 100vh;
    padding: 2rem 1.5rem 5rem;
    position: relative;
    overflow-x: hidden;
  }

  /* ── Hero banner ── */
  .ep-hero {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 280px;
    background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 48%, #7c3aed 100%);
    z-index: 0; pointer-events: none;
  }
  .ep-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  .ep-hero::after {
    content: '';
    position: absolute;
    bottom: -2px; left: 0; right: 0; height: 90px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 90' preserveAspectRatio='none'%3E%3Cpath d='M0,45 C180,90 360,0 540,45 C720,90 900,10 1080,45 C1260,80 1380,20 1440,45 L1440,90 L0,90 Z' fill='%23f4f6fe'/%3E%3C/svg%3E") center bottom / 100% 100% no-repeat;
  }

  .ep-inner {
    position: relative; z-index: 1;
    max-width: 820px; margin: 0 auto;
  }

  /* ── Top bar ── */
  .ep-topbar {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px; margin-bottom: 2rem;
  }
  .ep-brand { display: flex; align-items: center; gap: 14px; }
  .ep-hero-avatar {
    width: 52px; height: 52px; border-radius: 15px;
    background: rgba(255,255,255,0.18);
    border: 2px solid rgba(255,255,255,0.35);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 18px; font-weight: 800; color: #fff; flex-shrink: 0;
    box-shadow: 0 4px 18px rgba(0,0,0,0.18);
    overflow: hidden;
  }
  .ep-hero-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .ep-page-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 23px; font-weight: 800; color: #fff; letter-spacing: -0.025em; line-height: 1.15;
  }
  .ep-page-sub { font-size: 12.5px; color: rgba(255,255,255,0.62); margin-top: 2px; font-weight: 400; }
  .ep-date-pill {
    font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.22);
    border-radius: 30px; padding: 7px 18px; white-space: nowrap;
  }

  /* ── Section card ── */
  .ep-card {
    background: #ffffff; border-radius: 22px;
    border: 1.5px solid rgba(99,102,241,0.1);
    box-shadow: 0 2px 20px rgba(79,70,229,0.07), 0 1px 4px rgba(0,0,0,0.04);
    margin-bottom: 18px; overflow: hidden; position: relative;
  }

  /* ── Card header strip ── */
  .ep-card-header {
    display: flex; align-items: center; gap: 12px;
    padding: 1.4rem 1.8rem 1.2rem;
    border-bottom: 1.5px solid #f1f5f9;
  }
  .ep-card-icon {
    width: 40px; height: 40px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ep-card-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 16px; font-weight: 800; color: #1e293b; letter-spacing: -0.01em;
  }
  .ep-card-sub { font-size: 12px; color: #94a3b8; margin-top: 1px; font-weight: 400; }

  /* ── Card body ── */
  .ep-card-body { padding: 1.5rem 1.8rem 1.8rem; }

  /* ── Image uploader ── */
  .ep-uploader-row {
    display: flex; align-items: center; gap: 18px;
    padding: 1rem 1.3rem;
    background: #f8faff; border: 1.5px dashed #c7d2fe; border-radius: 16px;
    margin-bottom: 1.6rem; cursor: pointer;
    transition: border-color .22s, background .22s;
    flex-wrap: wrap;
  }
  .ep-uploader-row:hover { border-color: #6366f1; background: #eef2ff; }

  .ep-uploader-ring { position: relative; flex-shrink: 0; }
  .ep-uploader-circle {
    width: 76px; height: 76px; border-radius: 50%;
    border: 3px solid #e0e7ff; overflow: hidden; background: #f5f3ff;
    display: flex; align-items: center; justify-content: center;
    transition: border-color .22s, transform .22s;
  }
  .ep-uploader-row:hover .ep-uploader-circle { border-color: #6366f1; transform: scale(1.05); }
  .ep-uploader-circle img { width: 100%; height: 100%; object-fit: cover; }

  .ep-uploader-overlay {
    position: absolute; inset: 0; border-radius: 50%;
    background: rgba(99,102,241,0.55);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .2s;
  }
  .ep-uploader-row:hover .ep-uploader-overlay { opacity: 1; }

  .ep-uploader-badge {
    position: absolute; bottom: 1px; right: 1px;
    width: 24px; height: 24px; border-radius: 50%;
    background: #6366f1; border: 2px solid #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(99,102,241,0.4); pointer-events: none;
  }
  .ep-uploader-text { flex: 1; min-width: 140px; }
  .ep-uploader-label { font-size: 13.5px; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
  .ep-uploader-hint { font-size: 11.5px; color: #94a3b8; line-height: 1.55; }
  .ep-uploader-fname { font-size: 11.5px; color: #6366f1; margin-top: 5px; font-weight: 600; word-break: break-all; }
  .ep-uploader-action {
    flex-shrink: 0; font-size: 11.5px; font-weight: 700; color: #6366f1;
    background: #eef2ff; border-radius: 8px; padding: 6px 14px; white-space: nowrap;
  }
  @media (max-width: 440px) { .ep-uploader-action { display: none; } }

  /* ── Field grid ── */
  .ep-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 18px;
  }
  .ep-col-2 { grid-column: 1 / -1; }
  @media (max-width: 540px) {
    .ep-grid { grid-template-columns: 1fr; }
    .ep-col-2 { grid-column: 1; }
  }

  /* ── Field ── */
  .ep-field { display: flex; flex-direction: column; gap: 5px; }
  .ep-label {
    font-size: 10.5px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: #64748b;
    display: flex; align-items: center; gap: 4px;
  }
  .ep-req { color: #f43f5e; font-size: 13px; line-height: 1; }

  .ep-input-wrap { position: relative; }
  .ep-icon-mid {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    pointer-events: none; color: #b0bcd4; display: flex;
  }
  .ep-icon-top {
    position: absolute; left: 12px; top: 13px;
    pointer-events: none; color: #b0bcd4; display: flex;
  }
  .ep-input {
    width: 100%; padding: 10px 13px 10px 38px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 13.5px; color: #1e293b; font-weight: 500;
    background: #f8faff; border: 1.5px solid #e2e8f0; border-radius: 12px;
    outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
    -webkit-appearance: none;
  }
  .ep-input.no-icon { padding-left: 13px; }
  .ep-input:focus {
    border-color: #6366f1; background: #fff;
    box-shadow: 0 0 0 3.5px rgba(99,102,241,0.13);
  }
  .ep-input::placeholder { color: #c4cde0; font-weight: 400; }
  textarea.ep-input {
    padding-top: 11px; padding-bottom: 11px;
    resize: vertical; min-height: 94px; line-height: 1.65;
  }

  /* ── Submit strip ── */
  .ep-actions {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
    padding: 1.1rem 1.8rem 1.3rem;
    background: #fafbff; border-top: 1.5px solid #f1f5f9;
  }
  .ep-hint-txt { font-size: 12px; color: #94a3b8; font-style: italic; }
  .ep-btn {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%);
    border: none; border-radius: 12px; padding: 11px 30px; cursor: pointer;
    display: flex; align-items: center; gap: 9px;
    box-shadow: 0 4px 16px rgba(99,102,241,0.38);
    transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s;
  }
  .ep-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.45); }
  .ep-btn:active { transform: scale(0.97); }
  .ep-btn:disabled { opacity: .6; cursor: not-allowed; transform: none !important; box-shadow: none; }

  /* ── Card wave decoration ── */
  .ep-wave { display: block; width: 100%; height: 38px; pointer-events: none; }

  /* ── Toast ── */
  .ep-toast {
    position: fixed; bottom: 26px; left: 50%;
    transform: translateX(-50%) translateY(90px);
    background: #fff; border: 1.5px solid rgba(99,102,241,0.14);
    border-radius: 14px; padding: 11px 20px;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 8px 30px rgba(79,70,229,0.15);
    font-size: 13.5px; font-weight: 600; color: #1e293b;
    z-index: 9999; white-space: nowrap;
    transition: transform .42s cubic-bezier(.22,1,.36,1), opacity .42s;
    opacity: 0; pointer-events: none;
  }
  .ep-toast.show { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }
  .ep-toast-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; flex-shrink: 0; }
  .ep-toast-err .ep-toast-dot { background: #ef4444; }

  /* ── Animations ── */
  @keyframes ep-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ep-spin { to { transform: rotate(360deg); } }
  .ep-up { animation: ep-up .52s cubic-bezier(.22,1,.36,1) both; }
  .ep-d1 { animation-delay: .05s; }
  .ep-d2 { animation-delay: .13s; }
  .ep-d3 { animation-delay: .21s; }
  .ep-d4 { animation-delay: .29s; }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .ep { padding: 1.2rem .9rem 4rem; }
    .ep-card-header, .ep-card-body, .ep-actions { padding-left: 1.1rem; padding-right: 1.1rem; }
    .ep-page-title { font-size: 19px; }
  }
  @media (min-width: 768px) {
    .ep { padding: 2.4rem 2.5rem 5rem; }
  }
`;

/* ─────────────────────────────────────────────────────────────────
   Inline SVG icons
───────────────────────────────────────────────────────────────── */
const IC = {
  user:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  mail:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  text:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>,
  map:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  city:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  save:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  spin:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "ep-spin .7s linear infinite" }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  upload:   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  pencil:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
};

/* ─────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────── */
const todayStr = () => new Date().toLocaleDateString("en-US", {
  weekday: "short", month: "short", day: "numeric", year: "numeric",
});
const waveUri = hex =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 38' preserveAspectRatio='none'%3E%3Cpath d='M0,19 C75,38 150,0 225,19 C300,38 375,0 450,19 C525,38 575,8 600,19 L600,38 L0,38 Z' fill='${hex}'/%3E%3C/svg%3E`;

/* ─────────────────────────────────────────────────────────────────
   ImageUploader
───────────────────────────────────────────────────────────────── */
function ImageUploader({ label, hint, name, value, onChange, initials = "", initialPreview = null }) {
  const inputRef = useRef();
  const [preview, setPreview] = useState(initialPreview);

  useEffect(() => { setPreview(initialPreview); }, [initialPreview]);

  const trigger    = () => inputRef.current?.click();
  const handleKey  = e => e.key === "Enter" && trigger();
  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onChange(e);
  };

  return (
    <div className="ep-uploader-row" onClick={trigger}
      role="button" tabIndex={0} aria-label={`Upload ${label}`} onKeyDown={handleKey}>
      <div className="ep-uploader-ring">
        <div className="ep-uploader-circle">
          {preview
            ? <img src={preview} alt={label} />
            : <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif",
                fontSize: 22, fontWeight: 800, color: "#6366f1", userSelect: "none" }}>
                {initials}
              </span>
          }
        </div>
        <div className="ep-uploader-overlay" aria-hidden="true">{IC.upload}</div>
        <div className="ep-uploader-badge" aria-hidden="true">{IC.pencil}</div>
        <input ref={inputRef} type="file" name={name} accept="image/*"
          style={{ display: "none" }} onChange={handleFile} />
      </div>

      <div className="ep-uploader-text">
        <div className="ep-uploader-label">{label}</div>
        <div className="ep-uploader-hint">{hint}</div>
        {value && (
          <div className="ep-uploader-fname">
            {typeof value === "string" ? value : value.name}
          </div>
        )}
      </div>
      <div className="ep-uploader-action">Choose file</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Field
───────────────────────────────────────────────────────────────── */
function Field({ label, name, value, onChange, placeholder, type = "text",
  as, className = "", icon, required = false }) {
  const isTA = as === "textarea";
  return (
    <div className={`ep-field ${className}`}>
      <label className="ep-label" htmlFor={name}>
        {label}{required && <span className="ep-req" aria-hidden="true">*</span>}
      </label>
      <div className="ep-input-wrap">
        {icon && <span className={isTA ? "ep-icon-top" : "ep-icon-mid"} aria-hidden="true">{icon}</span>}
        {isTA
          ? <textarea id={name} name={name}
              className={`ep-input${icon ? "" : " no-icon"}`}
              value={value} onChange={onChange} placeholder={placeholder} rows={3} />
          : <input id={name} type={type} name={name}
              className={`ep-input${icon ? "" : " no-icon"}`}
              value={value} onChange={onChange} placeholder={placeholder}
              required={required} />
        }
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────── */
export default function CompanyEditProfile() {
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", profile_pic: null, profile_pic_url: null,
    company: { name: "", description: "", logo: null, logo_url: null, address: "", city: "" },
  });
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState({ show: false, msg: "", err: false });

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const res  = await getCurrentUser();
      const user = res.data;
      setForm({
        first_name:      user.first_name   || "",
        last_name:       user.last_name    || "",
        email:           user.email        || "",
        profile_pic:     null,
        profile_pic_url: getImageUrl(user?.profile_pic) || null,
        company: {
          name:        user.company_name  || "",
          description: user.company_description || "",
          logo:        null,
          logo_url:    getImageUrl(user?.company_logo) || null,
          address:     user.company_address || "",
          city:        user.company_city  || "",
        },
      });
    } catch (err) { console.error(err); }
  };

  const handleChange        = e => { const { name, value } = e.target; setForm(f => ({ ...f, [name]: value })); };
  const handleCompanyChange = e => { const { name, value } = e.target; setForm(f => ({ ...f, company: { ...f.company, [name]: value } })); };
  const handleFile          = e => setForm(f => ({ ...f, [e.target.name]: e.target.files[0] }));
  const handleCompanyFile   = e => setForm(f => ({ ...f, company: { ...f.company, [e.target.name]: e.target.files[0] } }));

  const showToast = (msg, err = false) => {
    setToast({ show: true, msg, err });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  };

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true);
    try {
      const data = new FormData();
      if (form.first_name)               data.append("first_name",          form.first_name);
      if (form.last_name)                data.append("last_name",           form.last_name);
      if (form.email)                    data.append("email",               form.email);
      if (form.profile_pic)              data.append("profile_pic",         form.profile_pic);
      if (form.company.name)             data.append("company_name",        form.company.name);
      if (form.company.description)      data.append("company_description", form.company.description);
      if (form.company.address)          data.append("company_address",     form.company.address);
      if (form.company.city)             data.append("company_city",        form.company.city);
      if (form.company.logo instanceof File) data.append("company_logo",   form.company.logo);
      await updateCompanyProfile(data);
      showToast("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.", true);
    } finally { setSaving(false); }
  };

  const initials     = [form.first_name, form.last_name].filter(Boolean).map(s => s[0].toUpperCase()).join("") || "?";
  const compInitials = form.company.name ? form.company.name.slice(0, 2).toUpperCase() : "CO";

  return (
    <CompanyLayout>
      <style>{STYLES}</style>

      <div className="ep">
        <div className="ep-hero" aria-hidden="true" />

        <div className="ep-inner">

          {/* ── Top bar ── */}
          <div className="ep-topbar ep-up ep-d1">
            <div className="ep-brand">
              <div className="ep-hero-avatar">
                {form.profile_pic_url ? <img src={form.profile_pic_url} alt="profile" /> : initials}
              </div>
              <div>
                <div className="ep-page-title">Edit Profile</div>
                <div className="ep-page-sub">Manage your personal &amp; company details</div>
              </div>
            </div>
            <div className="ep-date-pill">{todayStr()}</div>
          </div>

          <form onSubmit={handleSubmit} encType="multipart/form-data">

            {/* ══ User card ══ */}
            <div className="ep-card ep-up ep-d2">
              <div className="ep-card-header">
                <div className="ep-card-icon" style={{ background: "#eff6ff" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2563eb"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <div className="ep-card-title">User information</div>
                  <div className="ep-card-sub">Your personal account details</div>
                </div>
              </div>

              <div className="ep-card-body">
                <ImageUploader
                  label="Profile photo"
                  hint="JPG, PNG or WEBP · max 5 MB · click to change"
                  name="profile_pic" value={form.profile_pic}
                  onChange={handleFile} initials={initials}
                  initialPreview={form.profile_pic_url}
                />
                <div className="ep-grid">
                  <Field label="First name"     name="first_name" value={form.first_name}
                    onChange={handleChange}  placeholder="John"             icon={IC.user} required />
                  <Field label="Last name"      name="last_name"  value={form.last_name}
                    onChange={handleChange}  placeholder="Smith"            icon={IC.user} />
                  <Field label="Email address"  name="email"      value={form.email}
                    onChange={handleChange}  placeholder="you@example.com"  icon={IC.mail}
                    type="email" required className="ep-col-2" />
                </div>
              </div>

              <img className="ep-wave" src={waveUri("%23eff6ff")} alt="" aria-hidden="true" />
            </div>

            {/* ══ Company card ══ */}
            <div className="ep-card ep-up ep-d3">
              <div className="ep-card-header">
                <div className="ep-card-icon" style={{ background: "#faf5ff" }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#7c3aed"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                    <line x1="12" y1="12" x2="12" y2="16"/>
                    <line x1="10" y1="14" x2="14" y2="14"/>
                  </svg>
                </div>
                <div>
                  <div className="ep-card-title">Company information</div>
                  <div className="ep-card-sub">Your business profile details</div>
                </div>
              </div>

              <div className="ep-card-body">
                <ImageUploader
                  label="Company logo"
                  hint="Square image recommended · JPG or PNG · max 5 MB"
                  name="logo" value={form.company.logo}
                  onChange={handleCompanyFile} initials={compInitials}
                  initialPreview={form.company.logo_url}
                />
                <div className="ep-grid">
                  {/* row 1 — full width */}
                  <Field label="Company name" name="name" value={form.company.name}
                    onChange={handleCompanyChange} placeholder="e.g. Acme Corporation"
                    icon={IC.building} required className="ep-col-2" />
                  {/* row 2 — two columns */}
                  <Field label="Street address" name="address" value={form.company.address}
                    onChange={handleCompanyChange} placeholder="123 Main Street" icon={IC.map} />
                  <Field label="City" name="city" value={form.company.city}
                    onChange={handleCompanyChange} placeholder="e.g. Kochi" icon={IC.city} />
                  {/* row 3 — full width */}
                  <Field label="Description" name="description" as="textarea"
                    value={form.company.description} onChange={handleCompanyChange}
                    placeholder="A short description of what your company does…"
                    icon={IC.text} className="ep-col-2" />
                </div>
              </div>

              <img className="ep-wave" src={waveUri("%23faf5ff")} alt="" aria-hidden="true" />

              {/* Submit strip sits inside company card */}
              <div className="ep-actions ep-up ep-d4">
                <span className="ep-hint-txt">Fields marked * are required</span>
                <button type="submit" className="ep-btn" disabled={saving}>
                  {saving ? <>{IC.spin} Saving…</> : <>{IC.save} Save changes</>}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* ── Toast ── */}
      <div className={`ep-toast${toast.show ? " show" : ""}${toast.err ? " ep-toast-err" : ""}`}
        role="status" aria-live="polite">
        <span className="ep-toast-dot" />
        {toast.msg}
      </div>
    </CompanyLayout>
  );
}