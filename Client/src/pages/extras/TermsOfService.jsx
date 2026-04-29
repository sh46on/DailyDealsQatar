import React from "react";

const sections = [
  {
    num: "01",
    title: "Use of the Website",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    intro: "Daily Deals Qatar provides users with access to promotional offers, discounts, and deals across various categories including supermarkets, restaurants, fashion, and more.",
    items: [
      "Use the website only for lawful purposes",
      "Not misuse, copy, or exploit content without permission",
      "Not attempt to disrupt or harm the platform",
    ],
  },
  {
    num: "02",
    title: "User Accounts",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    intro: "To access certain features, you may create an account. You are responsible for:",
    items: [
      "Maintaining the confidentiality of your account",
      "Providing accurate information",
      "All activities under your account",
    ],
    note: "We reserve the right to suspend or terminate accounts that violate these terms.",
  },
  {
    num: "03",
    title: "Content and Deals",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    intro: "We aggregate deals and offers from various sources.",
    items: [
      "We do not guarantee accuracy of prices, availability, or validity",
      "Offers may change or expire without notice",
      "Users should verify details directly with the provider",
    ],
  },
  {
    num: "04",
    title: "User-Generated Content",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    intro: "If you submit content (reviews, uploads, etc.):",
    items: [
      "You grant us a non-exclusive right to use and display it",
      "You must not upload illegal, harmful, or misleading content",
    ],
  },
  {
    num: "05",
    title: "Intellectual Property",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
      </svg>
    ),
    intro: "All content on this website (excluding third-party content) is owned by Daily Deals Qatar.",
    items: [
      "You may not copy, distribute, or reuse content without permission",
    ],
  },
  {
    num: "06",
    title: "Third-Party Links",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    ),
    intro: "Our website may contain links to third-party websites. We are not responsible for:",
    items: [
      "Their content",
      "Their privacy practices",
      "Any transactions made with them",
    ],
  },
  {
    num: "07",
    title: "Limitation of Liability",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    intro: 'Daily Deals Qatar is provided "as is". We are not liable for:',
    items: [
      "Errors or inaccuracies in deals",
      "Losses from using third-party offers",
      "Service interruptions",
    ],
  },
  {
    num: "08",
    title: "Termination",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    intro: "We may suspend or terminate access at any time if:",
    items: [
      "Terms are violated",
      "Suspicious activity is detected",
    ],
  },
  {
    num: "09",
    title: "Changes to Terms",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
      </svg>
    ),
    intro: "We may update these Terms at any time. Continued use of the website means you accept the updated terms.",
  },
  {
    num: "10",
    title: "Governing Law",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 12 8 10 12 16 16 10 19 12 21 6" /><line x1="3" y1="20" x2="21" y2="20" />
      </svg>
    ),
    intro: "These Terms are governed by the laws of Qatar.",
  },
];

export default function TermsOfService() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>

        

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerRow}>
            <div style={styles.iconBox}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h1 style={styles.heading}>Terms of Service</h1>
          </div>
          <p style={styles.date}>Effective Date: April 28, 2025</p>
          <p style={styles.intro}>
            Welcome to <strong style={{ color: "#111827" }}>Daily Deals Qatar</strong>. By accessing or using our website{" "}
            <a href="https://dailydealsqatar.com" style={styles.link}>dailydealsqatar.com</a>,
            you agree to these Terms of Service.
          </p>
        </div>

        {/* Sections */}
        <div style={styles.card}>
          {sections.map((sec, i) => (
            <React.Fragment key={sec.num}>
              {i !== 0 && <div style={styles.divider} />}
              <div style={styles.section}>
                {/* Left: icon + badge */}
                <div style={styles.sectionLeft}>
                  <div style={styles.sectionIconBox}>{sec.icon}</div>
                  <span style={styles.badge}>{sec.num}</span>
                </div>
                {/* Right: content */}
                <div style={styles.sectionBody}>
                  <h2 style={styles.sectionTitle}>{sec.title}</h2>
                  {sec.intro && <p style={styles.sectionText}>{sec.intro}</p>}
                  {sec.items && (
                    <div style={styles.itemList}>
                      {sec.items.map((item) => (
                        <div key={item} style={styles.itemRow}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                          <span style={styles.itemText}>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {sec.note && (
                    <div style={styles.noteBanner}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span style={styles.noteText}>{sec.note}</span>
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Divider before contact */}
          <div style={styles.divider} />

          {/* 11 Contact */}
          <div style={styles.section}>
            <div style={styles.sectionLeft}>
              <div style={styles.sectionIconBox}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <span style={styles.badge}>11</span>
            </div>
            <div style={styles.sectionBody}>
              <h2 style={styles.sectionTitle}>Contact</h2>
              <p style={styles.sectionText}>For any questions about these Terms of Service, please reach out:</p>
              <a href="mailto:support@dailydealsqatar.com" style={styles.emailBtn}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                info@dailydealsqatar.com
              </a>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p style={styles.footerNote}>
          By using Daily Deals Qatar, you acknowledge that you have read and understood these Terms of Service.
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
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 28,
    padding: "8px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    backgroundColor: "#fff",
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
    margin: "0 0 6px",
    color: "#111827",
  },
  sectionText: {
    fontSize: 14,
    color: "#6b7280",
    margin: "0 0 10px",
    lineHeight: 1.7,
  },
  itemList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 4,
  },
  itemRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
  },
  itemText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 1.6,
  },
  noteBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    padding: "10px 14px",
    backgroundColor: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 8,
  },
  noteText: {
    fontSize: 13,
    color: "#92400e",
    lineHeight: 1.6,
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
    marginTop: 4,
  },
  footerNote: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 28,
    lineHeight: 1.6,
  },
};