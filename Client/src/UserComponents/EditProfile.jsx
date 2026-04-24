import { useEffect, useRef, useState } from "react";
import { getProfile, updateProfile } from "./api/userApi";
import UserLayout from "./UserLayout";
import { getImageUrl } from "../api/media";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --maroon:       #7b1c2e;
    --maroon-dark:  #5a0f1e;
    --maroon-deep:  #3d0a14;
    --maroon-light: #a3253b;
    --maroon-pale:  #f9f0f2;
    --maroon-mist:  #f2e8ea;
    --gold:         #c9973a;
    --gold-light:   #e8c07a;
    --white:        #ffffff;
    --off-white:    #fdfbfb;
    --border:       #e8d5d8;
    --text-dark:    #2c0a10;
    --text-mid:     #7a4050;
    --text-soft:    #b08090;
    --success-bg:   #edf7f1;
    --success-fg:   #1a6b40;
    --success-bdr:  #9fd4b8;
    --error-bg:     #fdf0f2;
    --error-fg:     #b01030;
    --error-bdr:    #e8a8b5;
  }

  .ep-wrap {
    min-height: 100vh;
    background: linear-gradient(160deg, #fdf5f6 0%, #f5eaec 50%, #fdf5f6 100%);
    padding: 40px 20px 64px;
    font-family: 'Nunito', sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  /* Animated Background Particles */
  .ep-particles {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }
  .ep-particle {
    position: absolute;
    background: rgba(123, 28, 46, 0.08);
    border-radius: 50%;
    animation: floatParticle linear infinite;
    pointer-events: none;
  }
  @keyframes floatParticle {
    0% {
      transform: translateY(100vh) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 0.6;
    }
    90% {
      opacity: 0.6;
    }
    100% {
      transform: translateY(-100vh) rotate(360deg);
      opacity: 0;
    }
  }

  .ep-card {
    max-width: 680px;
    margin: 0 auto;
    background: var(--white);
    border-radius: 32px;
    box-shadow: 0 8px 32px rgba(123,28,46,0.08),
                0 2px 8px rgba(123,28,46,0.04),
                0 0 0 1px rgba(123,28,46,0.04);
    overflow: hidden;
    transition: all 0.3s ease;
    position: relative;
    z-index: 1;
  }

  /* Header - Fixed height for proper avatar visibility */
  .ep-header {
    background: linear-gradient(150deg, var(--maroon-deep) 0%, var(--maroon) 55%, var(--maroon-light) 100%);
    padding: 40px 32px 70px;
    position: relative;
    text-align: center;
    overflow: visible;
  }
  .ep-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0%, transparent 50%),
                      radial-gradient(circle at 80% 70%, rgba(255,255,255,0.06) 0%, transparent 50%);
    pointer-events: none;
  }
  .ep-header-text h1 {
    font-family: 'Playfair Display', serif;
    color: #fff;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin-bottom: 8px;
  }
  .ep-header-text p {
    color: rgba(255,255,255,0.7);
    font-size: 0.85rem;
    font-weight: 400;
  }

  /* Avatar - Fixed positioning */
  .ep-avatar-container {
    position: relative;
    margin-top: 20px;
  }
  .ep-avatar-ring {
    position: absolute;
    bottom: -70px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 120px;
    border-radius: 50%;
    padding: 4px;
    background: linear-gradient(135deg, var(--gold-light), var(--gold));
    box-shadow: 0 8px 28px rgba(0,0,0,0.2), 0 0 0 4px rgba(255,255,255,0.98);
    z-index: 2;
    transition: transform 0.2s ease;
  }
  .ep-avatar-ring:hover {
    transform: translateX(-50%) scale(1.02);
  }
  .ep-avatar-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, #f0d8dc, #e8c5ca);
    cursor: pointer;
  }
  .ep-avatar-inner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .ep-avatar-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 2.4rem;
    color: var(--maroon);
    font-weight: 700;
  }
  .ep-avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(61,10,20,0.75);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.25s ease;
    gap: 4px;
    backdrop-filter: blur(2px);
  }
  .ep-avatar-inner:hover .ep-avatar-overlay { opacity: 1; }
  .ep-avatar-overlay svg { 
    width: 22px; 
    height: 22px; 
    color: #fff;
  }
  .ep-avatar-overlay span {
    color: rgba(255,255,255,0.95);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .ep-avatar-badge {
    position: absolute;
    bottom: 6px;
    right: 6px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--gold);
    border: 2.5px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 3;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  }
  .ep-avatar-badge svg { 
    width: 14px; 
    height: 14px; 
    color: #fff;
  }
  .ep-file-input { display: none; }

  /* Body */
  .ep-body { 
    padding: 80px 32px 40px; 
    background: var(--white);
  }

  /* Section title */
  .ep-section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: 'Playfair Display', serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--maroon-dark);
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--maroon-mist);
    position: relative;
  }
  .ep-section-title::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 50px;
    height: 2px;
    background: var(--maroon);
    border-radius: 2px;
  }
  .ep-section-title svg { 
    color: var(--maroon);
    width: 18px;
    height: 18px;
  }

  /* Grid */
  .ep-grid-2 { 
    display: grid; 
    grid-template-columns: repeat(2, 1fr); 
    gap: 20px; 
  }
  .ep-grid-full { 
    grid-column: 1 / -1; 
  }

  /* Field */
  .ep-field { 
    display: flex; 
    flex-direction: column; 
    gap: 8px; 
  }
  .ep-label {
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .ep-input-wrap {
    display: flex;
    align-items: center;
    border: 1.5px solid var(--border);
    border-radius: 14px;
    background: var(--off-white);
    transition: all 0.2s ease;
    overflow: hidden;
    min-height: 48px;
  }
  .ep-input-wrap:focus-within {
    border-color: var(--maroon);
    box-shadow: 0 0 0 3px rgba(123,28,46,0.08);
    background: #fff;
  }
  .ep-input-wrap.ep-error {
    border-color: var(--error-fg) !important;
    box-shadow: 0 0 0 3px rgba(176,16,48,0.08);
  }
  .ep-icon {
    padding: 0 12px;
    display: flex;
    align-items: center;
    color: var(--text-soft);
    flex-shrink: 0;
  }
  .ep-icon svg { 
    width: 16px; 
    height: 16px; 
  }
  .ep-phone-prefix {
    padding: 0 10px 0 0;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--maroon);
    border-right: 1.5px solid var(--border);
    white-space: nowrap;
    line-height: 44px;
    letter-spacing: 0.02em;
  }
  .ep-input-wrap input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    padding: 12px 14px;
    font-family: 'Nunito', sans-serif;
    font-size: 0.9rem;
    color: var(--text-dark);
    font-weight: 500;
    min-width: 0;
  }
  .ep-input-wrap input::placeholder { 
    color: #cdbfc2; 
    font-weight: 400;
  }

  /* Eye button */
  .ep-eye-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 12px;
    display: flex;
    align-items: center;
    color: var(--text-soft);
    transition: color 0.2s;
    flex-shrink: 0;
  }
  .ep-eye-btn:hover { 
    color: var(--maroon); 
  }
  .ep-eye-btn svg { 
    width: 18px; 
    height: 18px; 
  }

  /* Password rules */
  .ep-pw-rules {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 6px;
  }
  .ep-pw-hint {
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    transition: color 0.2s;
    color: var(--text-soft);
  }
  .ep-pw-hint svg { 
    width: 12px; 
    height: 12px; 
    flex-shrink: 0; 
  }
  .ep-pw-hint.ok  { 
    color: var(--success-fg); 
  }
  .ep-pw-hint.bad { 
    color: var(--error-fg); 
  }

  /* Field error */
  .ep-field-err {
    font-size: 0.7rem;
    color: var(--error-fg);
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    margin-top: 4px;
  }
  .ep-field-err svg { 
    width: 13px; 
    height: 13px; 
    flex-shrink: 0; 
  }

  /* Divider */
  .ep-divider {
    margin: 32px 0 28px;
    height: 1px;
    background: linear-gradient(to right, transparent, var(--border), transparent);
  }

  /* Toast */
  .ep-toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 14px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 24px;
    animation: epSlideDown 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .ep-toast.success { 
    background: var(--success-bg); 
    color: var(--success-fg); 
    border: 1.5px solid var(--success-bdr); 
  }
  .ep-toast.error   { 
    background: var(--error-bg);   
    color: var(--error-fg);   
    border: 1.5px solid var(--error-bdr); 
  }
  .ep-toast svg { 
    width: 18px; 
    height: 18px; 
    flex-shrink: 0; 
  }
  @keyframes epSlideDown {
    from { 
      opacity: 0; 
      transform: translateY(-12px) scale(0.98); 
    }
    to   { 
      opacity: 1; 
      transform: translateY(0) scale(1); 
    }
  }

  /* Actions */
  .ep-actions {
    display: flex;
    justify-content: flex-end;
    gap: 14px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 2px solid var(--maroon-mist);
  }
  .ep-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    border-radius: 12px;
    font-family: 'Nunito', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
  .ep-btn svg { 
    width: 16px; 
    height: 16px; 
  }
  .ep-btn-primary {
    background: linear-gradient(135deg, var(--maroon) 0%, var(--maroon-dark) 100%);
    color: #fff;
    box-shadow: 0 4px 16px rgba(123,28,46,0.25);
  }
  .ep-btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(123,28,46,0.35);
    background: linear-gradient(135deg, var(--maroon-light) 0%, var(--maroon) 100%);
  }
  .ep-btn-primary:active:not(:disabled) { 
    transform: translateY(0); 
  }
  .ep-btn-primary:disabled { 
    opacity: 0.55; 
    cursor: not-allowed; 
  }
  .ep-btn-ghost {
    background: var(--maroon-pale);
    color: var(--maroon);
    border: 1.5px solid var(--border);
  }
  .ep-btn-ghost:hover:not(:disabled) { 
    background: var(--maroon-mist); 
    border-color: var(--maroon);
    transform: translateY(-1px);
  }

  /* Spinner */
  .ep-spinner {
    width: 16px;
    height: 16px;
    border: 2.5px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: epSpin 0.7s linear infinite;
  }
  @keyframes epSpin { 
    to { transform: rotate(360deg); } 
  }

  /* Loading */
  .ep-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 20px;
    color: var(--text-mid);
    font-size: 0.9rem;
    font-weight: 500;
  }
  .ep-loading-ring {
    width: 44px;
    height: 44px;
    border: 3px solid var(--maroon-mist);
    border-top-color: var(--maroon);
    border-radius: 50%;
    animation: epSpin 0.8s linear infinite;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .ep-wrap {
      padding: 20px 16px 40px;
    }
    .ep-card {
      max-width: 100%;
    }
    .ep-header {
      padding: 32px 24px 65px;
    }
    .ep-header-text h1 {
      font-size: 1.5rem;
    }
    .ep-header-text p {
      font-size: 0.8rem;
    }
    .ep-body {
      padding: 70px 20px 32px;
    }
    .ep-grid-2 {
      gap: 16px;
    }
    .ep-actions {
      flex-direction: column-reverse;
      gap: 10px;
      margin-top: 28px;
    }
    .ep-btn {
      justify-content: center;
      width: 100%;
      padding: 12px 20px;
    }
    .ep-avatar-ring {
      width: 100px;
      height: 100px;
      bottom: -65px;
    }
    .ep-avatar-fallback {
      font-size: 2rem;
    }
    .ep-avatar-badge {
      width: 26px;
      height: 26px;
      bottom: 4px;
      right: 4px;
    }
    .ep-avatar-badge svg {
      width: 12px;
      height: 12px;
    }
  }

  @media (max-width: 640px) {
    .ep-grid-2 {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .ep-body {
      padding: 65px 16px 28px;
    }
    .ep-input-wrap {
      min-height: 44px;
    }
    .ep-input-wrap input {
      padding: 10px 12px;
      font-size: 0.85rem;
    }
    .ep-icon {
      padding: 0 10px;
    }
    .ep-phone-prefix {
      font-size: 0.85rem;
      line-height: 40px;
    }
    .ep-toast {
      padding: 12px 14px;
      font-size: 0.8rem;
      margin-bottom: 20px;
    }
    .ep-section-title {
      font-size: 1rem;
      margin-bottom: 20px;
    }
  }

  @media (max-width: 480px) {
    .ep-header {
      padding: 24px 20px 60px;
    }
    .ep-header-text h1 {
      font-size: 1.3rem;
    }
    .ep-avatar-ring {
      width: 88px;
      height: 88px;
      bottom: -60px;
    }
    .ep-avatar-fallback {
      font-size: 1.8rem;
    }
    .ep-avatar-badge {
      width: 24px;
      height: 24px;
    }
    .ep-section-title {
      font-size: 0.95rem;
      gap: 8px;
    }
    .ep-section-title svg {
      width: 16px;
      height: 16px;
    }
    .ep-divider {
      margin: 28px 0 24px;
    }
  }
`;

/* SVG Icon helper */
const Ic = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const I = {
  user:    <Ic d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>,
  mail:    <Ic d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"/>,
  phone:   <Ic d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72c.179.84.43 1.658.75 2.45a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.79.32 1.61.57 2.45.75A2 2 0 0 1 22 16.92z"/>,
  lock:    <Ic d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4"/>,
  eye:     <Ic d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>,
  eyeOff:  <Ic d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>,
  camera:  <Ic d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>,
  plus:    <Ic d="M12 5v14M5 12h14"/>,
  checkSm: <Ic d="M20 6 9 17l-5-5"/>,
  alert:   <Ic d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>,
  save:    <Ic d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8"/>,
  person:  <Ic d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>,
  shield:  <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  xSm:     <Ic d="M18 6 6 18M6 6l12 12"/>,
};

/* Password rules */
const PW_RULES = [
  { key: "len",   label: "At least 8 characters",         test: v => v.length >= 8 },
  { key: "upper", label: "At least one uppercase letter",  test: v => /[A-Z]/.test(v) },
  { key: "num",   label: "At least one number",            test: v => /[0-9]/.test(v) },
];

function PasswordRules({ value }) {
  if (!value) return null;
  return (
    <div className="ep-pw-rules">
      {PW_RULES.map(r => {
        const ok = r.test(value);
        return (
          <span key={r.key} className={`ep-pw-hint ${ok ? "ok" : "bad"}`}>
            {ok ? I.checkSm : I.xSm}
            {r.label}
          </span>
        );
      })}
    </div>
  );
}

/* Particles Background Component */
function ParticlesBackground() {
  useEffect(() => {
    const container = document.querySelector('.ep-particles');
    if (!container) return;

    const particleCount = 50;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'ep-particle';
      const size = Math.random() * 8 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${Math.random() * 15 + 10}s`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      particle.style.opacity = Math.random() * 0.3 + 0.1;
      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  return <div className="ep-particles" />;
}

/* Main Component */
export default function EditProfile() {
  const fileRef = useRef();

  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showCfm, setShowCfm] = useState(false);

  /* Inject CSS */
  useEffect(() => {
    if (!document.getElementById("ep-styles")) {
      const tag = document.createElement("style");
      tag.id = "ep-styles";
      tag.textContent = STYLES;
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      const d = res.data;
      setForm({
        first_name: d.first_name || "",
        last_name: d.last_name || "",
        email: d.email || "",
        phone: d.phone || "",
      });
      setPreview(d.profile_pic || null);
      setImgError(false);
      setImage(null);
      setPasswords({ password: "", confirm: "" });
      setFieldErrors({});
    } catch {
      showToast("error", "Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  };

  const pwValid = pw => pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "First name is required";
    if (!form.last_name.trim()) e.last_name = "Last name is required";
    if (!form.email.trim()) e.email = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email address";
    if (form.phone && !/^\d{7,}$/.test(form.phone)) e.phone = "Enter a valid phone number (digits only)";

    if (passwords.password || passwords.confirm) {
      if (!pwValid(passwords.password))
        e.password = "Must be 8+ chars, include uppercase & number";
      if (!passwords.confirm)
        e.confirm = "Please confirm your new password";
      else if (passwords.password !== passwords.confirm)
        e.confirm = "Passwords do not match";
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) setFieldErrors(f => ({ ...f, [e.target.name]: null }));
  };

  const handlePw = e => {
    setPasswords(p => ({ ...p, [e.target.name]: e.target.value }));
    if (fieldErrors[e.target.name]) setFieldErrors(f => ({ ...f, [e.target.name]: null }));
  };

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Please select a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image size must be less than 5MB");
      return;
    }
    setImage(file);
    setImgError(false);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) {
      showToast("error", "Please fix the highlighted errors before saving.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("first_name", form.first_name);
      fd.append("last_name", form.last_name);
      fd.append("email", form.email);
      fd.append("phone", form.phone);
      if (image) fd.append("profile_pic", image);
      if (passwords.password) fd.append("password", passwords.password);
      await updateProfile(fd);
      showToast("success", "Profile updated successfully!");
      setPasswords({ password: "", confirm: "" });
      setImage(null);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Update failed. Please try again.";
      showToast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const initials = `${form.first_name?.[0] || ""}${form.last_name?.[0] || ""}`.toUpperCase() || "U";
  const confirmMatch = passwords.confirm.length > 0 && passwords.password === passwords.confirm;
  const confirmMismatch = passwords.confirm.length > 0 && passwords.password !== passwords.confirm && !fieldErrors.confirm;

  if (loading) return (
    <UserLayout>
      <div className="ep-wrap">
        <ParticlesBackground />
        <div className="ep-card">
          <div className="ep-loading">
            <div className="ep-loading-ring" />
            <span>Loading your profile...</span>
          </div>
        </div>
      </div>
    </UserLayout>
  );

  return (
    <UserLayout>
      <div className="ep-wrap">
        <ParticlesBackground />
        <div className="ep-card">
          {/* Header */}
          <div className="ep-header">
            <div className="ep-header-text">
              <h1>Edit Profile</h1>
              <p>Update your personal details and account security</p>
            </div>
          </div>

          {/* Avatar - Moved outside header for better positioning */}
          <div className="ep-avatar-container">
            <div className="ep-avatar-ring">
              <div
                className="ep-avatar-inner"
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === "Enter" && fileRef.current?.click()}
                aria-label="Change profile picture"
                title="Click to change photo"
              >
                {preview && !imgError ? (
                  <img
                    src={getImageUrl(preview)}
                    alt={`${form.first_name} ${form.last_name}`}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="ep-avatar-fallback">{initials}</div>
                )}
                <div className="ep-avatar-overlay">
                  {I.camera}
                  <span>Change</span>
                </div>
              </div>
              <div className="ep-avatar-badge">{I.plus}</div>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="ep-file-input"
            onChange={handleImage}
          />

          {/* Body */}
          <div className="ep-body">
            {toast && (
              <div className={`ep-toast ${toast.type}`} role="alert" aria-live="polite">
                {toast.type === "success" ? I.checkSm : I.alert}
                <span>{toast.msg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Personal Info */}
              <div className="ep-section-title">
                {I.person}
                Personal Information
              </div>

              <div className="ep-grid-2">
                <div className="ep-field">
                  <label className="ep-label">First Name</label>
                  <div className={`ep-input-wrap${fieldErrors.first_name ? " ep-error" : ""}`}>
                    <span className="ep-icon">{I.user}</span>
                    <input
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="First name"
                      autoComplete="given-name"
                    />
                  </div>
                  {fieldErrors.first_name && (
                    <span className="ep-field-err">{I.xSm}{fieldErrors.first_name}</span>
                  )}
                </div>

                <div className="ep-field">
                  <label className="ep-label">Last Name</label>
                  <div className={`ep-input-wrap${fieldErrors.last_name ? " ep-error" : ""}`}>
                    <span className="ep-icon">{I.user}</span>
                    <input
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="Last name"
                      autoComplete="family-name"
                    />
                  </div>
                  {fieldErrors.last_name && (
                    <span className="ep-field-err">{I.xSm}{fieldErrors.last_name}</span>
                  )}
                </div>

                <div className="ep-field ep-grid-full">
                  <label className="ep-label">Email Address</label>
                  <div className={`ep-input-wrap${fieldErrors.email ? " ep-error" : ""}`}>
                    <span className="ep-icon">{I.mail}</span>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                  </div>
                  {fieldErrors.email && (
                    <span className="ep-field-err">{I.xSm}{fieldErrors.email}</span>
                  )}
                </div>

                <div className="ep-field ep-grid-full">
                  <label className="ep-label">Phone Number</label>
                  <div className={`ep-input-wrap${fieldErrors.phone ? " ep-error" : ""}`}>
                    <span className="ep-icon">{I.phone}</span>
                    <span className="ep-phone-prefix">+974</span>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="XXXX XXXX"
                      autoComplete="tel-national"
                      inputMode="numeric"
                    />
                  </div>
                  {fieldErrors.phone && (
                    <span className="ep-field-err">{I.xSm}{fieldErrors.phone}</span>
                  )}
                  <small style={{ fontSize: '0.65rem', color: 'var(--text-soft)', marginTop: '4px' }}>
                    Enter 8-digit number (e.g., 99473199)
                  </small>
                </div>
              </div>

              <div className="ep-divider" />

              {/* Change Password */}
              <div className="ep-section-title">
                {I.shield}
                Change Password
              </div>

              <div className="ep-grid-2">
                <div className="ep-field">
                  <label className="ep-label">New Password</label>
                  <div className={`ep-input-wrap${fieldErrors.password ? " ep-error" : ""}`}>
                    <span className="ep-icon">{I.lock}</span>
                    <input
                      name="password"
                      type={showPw ? "text" : "password"}
                      value={passwords.password}
                      onChange={handlePw}
                      placeholder="Create new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="ep-eye-btn"
                      onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? I.eyeOff : I.eye}
                    </button>
                  </div>
                  <PasswordRules value={passwords.password} />
                  {fieldErrors.password && (
                    <span className="ep-field-err">{I.xSm}{fieldErrors.password}</span>
                  )}
                </div>

                <div className="ep-field">
                  <label className="ep-label">Confirm Password</label>
                  <div className={`ep-input-wrap${fieldErrors.confirm ? " ep-error" : ""}`}>
                    <span className="ep-icon">{I.lock}</span>
                    <input
                      name="confirm"
                      type={showCfm ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={handlePw}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="ep-eye-btn"
                      onClick={() => setShowCfm(v => !v)}
                      aria-label={showCfm ? "Hide password" : "Show password"}
                    >
                      {showCfm ? I.eyeOff : I.eye}
                    </button>
                  </div>
                  {confirmMatch && (
                    <span className="ep-pw-hint ok">{I.checkSm}Passwords match</span>
                  )}
                  {confirmMismatch && (
                    <span className="ep-pw-hint bad">{I.xSm}Passwords do not match</span>
                  )}
                  {fieldErrors.confirm && (
                    <span className="ep-field-err">{I.xSm}{fieldErrors.confirm}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="ep-actions">
                <button
                  type="button"
                  className="ep-btn ep-btn-ghost"
                  onClick={loadProfile}
                  disabled={submitting}
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className="ep-btn ep-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="ep-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {I.save}
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}