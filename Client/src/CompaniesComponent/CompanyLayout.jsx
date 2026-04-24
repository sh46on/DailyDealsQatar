import { useEffect, useState } from "react";
import CompanyNavbar from "./CompanyNavbar";
import { getCurrentUser } from "../api/userApi";

export default function CompanyLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await getCurrentUser();
      setUser(res.data);
    } catch (err) {
      console.error("User fetch error", err);
    }
  };

  return (
    <div className="company-layout">
      <CompanyNavbar user={user} companyName="NexaCorp" />
      <main className="company-main">
        {children}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #f1f5f9;
          color: #0f172a;
          -webkit-font-smoothing: antialiased;
        }

        .company-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .company-main {
          flex: 1;
         
          width: 100%;
          margin: 0 auto;
          animation: fadeUp 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Page-level typography helpers */
        .page-title {
          font-size: 22px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.4px;
        }

        .page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-top: 4px;
        }

        .page-header {
          margin-bottom: 28px;
        }

        /* Card */
        .card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px 24px;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}