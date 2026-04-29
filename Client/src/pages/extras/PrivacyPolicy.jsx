import React from "react";

export default function PrivacyPolicy() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerRow}>
            <div style={styles.iconBox}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 style={styles.heading}>Privacy Policy</h1>
          </div>
          <p style={styles.date}>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Sections Card */}
        <div style={styles.card}>

          <div style={styles.section}>
            <span style={styles.badge}>01</span>
            <div>
              <h2 style={styles.sectionTitle}>Introduction</h2>
              <p style={styles.sectionText}>
                Welcome to Daily Deals Qatar. We respect your privacy and are
                committed to protecting your personal data. This privacy policy
                explains how we collect, use, and safeguard your information
                when you use our platform.
              </p>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.section}>
            <span style={styles.badge}>02</span>
            <div style={{ flex: 1 }}>
              <h2 style={styles.sectionTitle}>Information We Collect</h2>
              <div style={styles.grid}>
                {[
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    ),
                    label: "Account details",
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                      </svg>
                    ),
                    label: "Uploaded content",
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    ),
                    label: "Usage data",
                  },
                  {
                    icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                    ),
                    label: "Device information",
                  },
                ].map(({ icon, label }) => (
                  <div key={label} style={styles.gridItem}>
                    {icon}
                    <span style={styles.gridLabel}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.section}>
            <span style={styles.badge}>03</span>
            <div style={{ flex: 1 }}>
              <h2 style={styles.sectionTitle}>How We Use Your Information</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "To provide and improve our services",
                  "To personalize user experience",
                  "To communicate updates and offers",
                  "To ensure platform security",
                ].map((item) => (
                  <div key={item} style={styles.checkRow}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={styles.sectionText}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.section}>
            <span style={styles.badge}>04</span>
            <div>
              <h2 style={styles.sectionTitle}>Sharing of Information</h2>
              <p style={styles.sectionText}>
                We do not sell your personal data. We may share information with
                trusted partners for service delivery, analytics, or legal
                compliance.
              </p>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.section}>
            <span style={styles.badge}>05</span>
            <div>
              <h2 style={styles.sectionTitle}>Cookies</h2>
              <p style={styles.sectionText}>
                We use cookies to enhance your browsing experience. You can
                control cookies through your browser settings.
              </p>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.section}>
            <span style={styles.badge}>06</span>
            <div>
              <h2 style={styles.sectionTitle}>Data Security</h2>
              <p style={styles.sectionText}>
                We implement appropriate security measures to protect your data
                from unauthorized access, alteration, or disclosure.
              </p>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.section}>
            <span style={styles.badge}>07</span>
            <div>
              <h2 style={styles.sectionTitle}>Your Rights</h2>
              <p style={styles.sectionText}>
                You have the right to access, update, or delete your personal
                data. Contact us if you wish to exercise these rights.
              </p>
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.section}>
            <span style={styles.badge}>08</span>
            <div>
              <h2 style={styles.sectionTitle}>Contact Us</h2>
              <p style={styles.sectionText}>
                If you have any questions about this privacy policy, please
                reach out:
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
      </div>
    </div>
  );
}

const styles = {
  /* Full-screen white backdrop — overrides any dark global bg */
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
    margin: "0 0 0 48px",
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
    gap: 14,
    padding: "20px 24px",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    margin: "0 24px",
  },
  badge: {
    fontSize: 12,
    fontWeight: 500,
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    padding: "4px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    marginTop: 2,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 500,
    margin: "0 0 8px",
    color: "#111827",
  },
  sectionText: {
    fontSize: 14,
    color: "#6b7280",
    margin: 0,
    lineHeight: 1.7,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 8,
    marginTop: 4,
  },
  gridItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  gridLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
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
    marginTop: 8,
  },
};