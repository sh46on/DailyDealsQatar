import React from "react";

// ── Shared style objects — must be declared before use in module-level arrays ──
const textStyle = { fontSize: 14, color: "#6b7280", margin: 0, lineHeight: 1.7 };
const warningRow = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "9px 12px",
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: 8,
};

const cookieTypes = [
  {
    label: "Essential",
    color: "#eff6ff",
    borderColor: "#bfdbfe",
    textColor: "#1d4ed8",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    desc: "Necessary for the website to function.",
    examples: ["Authentication (login sessions)", "Security and fraud prevention"],
  },
  {
    label: "Performance & Analytics",
    color: "#f0fdf4",
    borderColor: "#bbf7d0",
    textColor: "#15803d",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    desc: "Help us understand how users interact with the website.",
    examples: ["Page visits", "Time spent on pages", "Popular content"],
  },
  {
    label: "Functional",
    color: "#faf5ff",
    borderColor: "#e9d5ff",
    textColor: "#7e22ce",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7e22ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
    desc: "Remember your preferences and settings.",
    examples: ["Saved items", "User settings"],
  },
  {
    label: "Third-Party",
    color: "#fff7ed",
    borderColor: "#fed7aa",
    textColor: "#c2410c",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    ),
    desc: "Set by third-party services such as analytics or embedded content.",
    examples: ["Analytics providers", "Embedded media"],
  },
];

const sections = [
  {
    num: "01",
    title: "What Are Cookies?",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    content: (
      <p style={textStyle}>
        Cookies are small text files stored on your device when you visit a website. They help improve user experience, remember preferences, and analyze website performance.
      </p>
    ),
  },
  {
    num: "02",
    title: "How We Use Cookies",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {[
          "Ensure the website functions properly",
          "Remember user preferences (such as login sessions)",
          "Analyze traffic and usage patterns",
          "Improve performance and user experience",
        ].map((item) => (
          <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 3 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span style={textStyle}>{item}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: "03",
    title: "Types of Cookies We Use",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    content: (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {cookieTypes.map((ct) => (
          <div
            key={ct.label}
            style={{
              backgroundColor: ct.color,
              border: `1px solid ${ct.borderColor}`,
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              {ct.icon}
              <span style={{ fontSize: 13, fontWeight: 600, color: ct.textColor }}>{ct.label}</span>
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>{ct.desc}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ct.examples.map((ex) => (
                <div key={ex} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: ct.textColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#374151" }}>{ex}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: "04",
    title: "Managing Cookies",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
    content: (
      <>
        <p style={{ ...textStyle, marginBottom: 10 }}>
          You can control or disable cookies through your browser settings. However:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "Disabling cookies may affect website functionality",
            "Some features may not work properly",
          ].map((item) => (
            <div key={item} style={warningRow}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>{item}</span>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    num: "05",
    title: "Updates to This Policy",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
    content: (
      <p style={textStyle}>
        We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated effective date.
      </p>
    ),
  },
];

export default function CookiePolicy() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerRow}>
            <div style={styles.iconBox}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                <path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" />
              </svg>
            </div>
            <h1 style={styles.heading}>Cookie Policy</h1>
          </div>
          <p style={styles.date}>Effective Date: April 28, 2025</p>
          <p style={styles.intro}>
            This Cookie Policy explains how{" "}
            <strong style={{ color: "#111827" }}>Daily Deals Qatar</strong> uses cookies and
            similar technologies when you visit{" "}
            <a href="https://dailydealsqatar.com" style={styles.link}>dailydealsqatar.com</a>.
          </p>
        </div>

        {/* Sections card */}
        <div style={styles.card}>
          {sections.map((sec, i) => (
            <React.Fragment key={sec.num}>
              {i !== 0 && <div style={styles.divider} />}
              <div style={styles.section}>
                <div style={styles.sectionLeft}>
                  <div style={styles.sectionIconBox}>{sec.icon}</div>
                  <span style={styles.badge}>{sec.num}</span>
                </div>
                <div style={styles.sectionBody}>
                  <h2 style={styles.sectionTitle}>{sec.title}</h2>
                  {sec.content}
                </div>
              </div>
            </React.Fragment>
          ))}

          <div style={styles.divider} />

          {/* Contact */}
          <div style={styles.section}>
            <div style={styles.sectionLeft}>
              <div style={styles.sectionIconBox}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <span style={styles.badge}>06</span>
            </div>
            <div style={styles.sectionBody}>
              <h2 style={styles.sectionTitle}>Contact</h2>
              <p style={{ ...textStyle, marginBottom: 10 }}>
                If you have any questions about this Cookie Policy, please reach out:
              </p>
              <a href="mailto:info@dailydealsqatar.com" style={styles.emailBtn}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                info@dailydealsqatar.com
              </a>
            </div>
          </div>
        </div>

        <p style={styles.footerNote}>
          By continuing to use Daily Deals Qatar, you consent to our use of cookies as described in this policy.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#f9fafb",
  },
  container: {
    maxWidth: 780,
    margin: "0 auto",
    padding: "40px 20px 60px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.6",
  },
  header: {
    marginBottom: 28,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  iconBox: {
    width: 36,
    height: 36,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heading: {
    fontSize: 22,
    fontWeight: 500,
    margin: 0,
    color: "#111827",
  },
  date: {
    fontSize: 13,
    color: "#9ca3af",
    margin: "4px 0 10px 48px",
  },
  intro: {
    fontSize: 14,
    color: "#6b7280",
    margin: "0 0 0 48px",
    lineHeight: 1.7,
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  section: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    padding: "20px 24px",
  },
  sectionLeft: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  sectionIconBox: {
    width: 36,
    height: 36,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    padding: "3px 8px",
    borderRadius: 999,
    whiteSpace: "nowrap",
  },
  sectionBody: {
    flex: 1,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 600,
    margin: "0 0 8px",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    margin: "0 24px",
  },
  emailBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    color: "#2563eb",
    textDecoration: "none",
    padding: "8px 14px",
    border: "1px solid #bfdbfe",
    borderRadius: 8,
    backgroundColor: "#eff6ff",
  },
  footerNote: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 28,
    lineHeight: 1.6,
  },
};