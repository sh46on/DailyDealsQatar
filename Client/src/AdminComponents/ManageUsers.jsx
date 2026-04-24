import { useEffect, useState, useCallback } from "react";
import { getUsers, deleteUser, toggleUser } from "../api/userApi";
import AdminLayout from "./AdminLayout";
import { getImageUrl } from "../api/media";

/* ─────────────────────────────────────────────────────────────────
   THEME — matches ManageCompanies warm-cream palette exactly
───────────────────────────────────────────────────────────────── */
const C = {
  bg:         "#fdf6f0",
  bgCard:     "#ffffff",
  bgCardWarm: "#fff9f6",
  bgCardTint: "#fef2ee",

  navDark:    "#5c0f0f",
  navMid:     "#8b1a1a",
  navBright:  "#c0392b",

  rose:       "#e11d48",
  emerald:    "#059669",
  amber:      "#d97706",

  textH:      "#1a0505",
  textP:      "#3d1010",
  textMid:    "#6b2a2a",
  textDim:    "#a05050",
  textOnDark: "#ffe8e8",

  border:     "rgba(140,30,30,0.12)",
  borderMid:  "rgba(140,30,30,0.22)",
  shadow:     "rgba(80,10,10,0.08)",
};

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

/* ── Helpers ─────────────────────────────────────────────────── */
function fullName(u) {
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return name || u.phone;
}

function nameInitials(u) {
  const f = u.first_name?.[0]?.toUpperCase() ?? "";
  const l = u.last_name?.[0]?.toUpperCase() ?? "";
  return f + l || u.phone?.slice(0, 2) || "??";
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/* ── Avatar ──────────────────────────────────────────────────── */
function Avatar({ user, size = 34 }) {
  const [err, setErr] = useState(false);
  const fontSize = size < 40 ? 11 : 15;
const imageUrl = getImageUrl(user.profile_pic);

  if (user.profile_pic && !err) {
    return (
      <img
        src={imageUrl}
        alt={fullName(user)}
        onError={() => setErr(true)}
        style={{
          width: size, height: size, borderRadius: "50%",
          objectFit: "cover",
          border: `1px solid rgba(139,26,26,.2)`,
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "rgba(139,26,26,.1)",
        border: `1px solid rgba(139,26,26,.2)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize, fontWeight: 700, color: C.navMid, flexShrink: 0,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {nameInitials(user)}
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────── */
function StatCard({ value, label, accent, delay }) {
  return (
    <div
      style={{
        background: C.bgCard,
        border: `1px solid ${C.border}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 14,
        padding: "16px 18px",
        animation: `slideUp .45s ${delay}s cubic-bezier(.22,.61,.36,1) both`,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div style={{
        fontSize: 30, fontWeight: 400,
        fontFamily: "'DM Serif Display', serif",
        color: C.textH, lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 11, color: C.textMid, fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 5,
      }}>
        {label}
      </div>
    </div>
  );
}

/* ── Role badge ──────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const map = {
    admin:   { bg: "rgba(139,26,26,.1)",  color: "#5c0f0f" },
    company: { bg: "rgba(217,119,6,.12)", color: "#78350f" },
    user:    { bg: "rgba(5,150,105,.1)",  color: "#064e3b" },
  };
  const s = map[role?.toLowerCase()] ?? { bg: "rgba(100,100,100,.1)", color: "#374151" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 6, padding: "3px 9px",
      fontSize: 12, fontWeight: 600, textTransform: "capitalize",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {role ?? "—"}
    </span>
  );
}

/* ── Detail row (modal) ──────────────────────────────────────── */
function DetailRow({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <span style={{
        fontSize: 11, color: C.textDim, fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.07em", flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: C.textP, fontWeight: 500, textAlign: "right" }}>
        {children}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function ManageUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [viewUser, setViewUser] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(res.data?.data || res.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    await deleteUser(id);
    loadUsers();
  };

  const handleToggle = async (id) => {
    await toggleUser(id);
    loadUsers();
  };

  const activeCount    = users.filter((u) => u.is_active).length;
  const suspendedCount = users.length - activeCount;

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.phone?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <link rel="stylesheet" href={FONT_LINK} />
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div style={{
        padding: "28px 32px 40px 28px",
        background: C.bg, minHeight: "100%",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 26,
          animation: "fadeIn .4s ease",
        }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: 34, fontWeight: 400,
              fontFamily: "'DM Serif Display', serif",
              color: C.navDark, letterSpacing: "-0.5px", lineHeight: 1.1,
            }}>
              Manage Users
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: C.textMid, fontWeight: 500, letterSpacing: "0.02em" }}>
              Daily Deals &nbsp;·&nbsp; Qatar &nbsp;·&nbsp; Admin Panel v1.0
            </p>
          </div>
        </div>

        {/* ── Search bar ── */}
        <div style={{ marginBottom: 18, animation: "fadeIn .4s .08s ease both", opacity: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <div style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                width: 34, height: 34, background: C.bgCardTint,
                border: `1px solid ${C.border}`, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke={C.navMid} strokeWidth="1.5" />
                  <path d="M9.5 9.5L12.5 12.5" stroke={C.navMid} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, email, phone or role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "30%", background: C.bgCard,
                  border: `1.5px solid ${C.border}`, borderRadius: 50,
                  padding: "15px 44px 11px 58px", fontSize: 13, color: C.textH,
                  outline: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: `0 2px 8px ${C.shadow}`,
                  transition: "border-color .18s, box-shadow .18s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = C.navMid;
                  e.target.style.boxShadow = `0 0 0 3px rgba(139,26,26,.08)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = C.border;
                  e.target.style.boxShadow = `0 2px 8px ${C.shadow}`;
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "rgba(139,26,26,.1)", border: "none", borderRadius: "50%",
                    width: 22, height: 22, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.navMid, fontSize: 14, lineHeight: 1,
                  }}
                >×</button>
              )}
            </div>
            {search && (
              <div style={{
                flexShrink: 0, background: C.bgCard, border: `1px solid ${C.border}`,
                borderRadius: 50, padding: "8px 16px", fontSize: 12, fontWeight: 600,
                color: C.textMid, whiteSpace: "nowrap", boxShadow: `0 1px 4px ${C.shadow}`,
              }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 14, marginBottom: 22,
        }}>
          <StatCard value={users.length}   label="Total users" accent={C.navBright} delay={0.05} />
          <StatCard value={activeCount}    label="Active"       accent={C.emerald}   delay={0.10} />
          <StatCard value={suspendedCount} label="Suspended"    accent={C.rose}      delay={0.15} />
        </div>

        {/* ── Table card ── */}
        <div style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 16, overflow: "hidden",
          boxShadow: `0 2px 10px ${C.shadow}`,
          animation: "slideUp .5s .18s ease both",
        }}>
          {loading ? (
            <p style={{ textAlign: "center", padding: 40, color: C.textDim }}>Loading…</p>
          ) : users.length === 0 ? (
            <p style={{ textAlign: "center", padding: 40, color: C.textDim }}>No users found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bgCardWarm }}>
                  {["User", "Email", "Phone", "Role", "Joined", "Status", "Actions"].map((h) => (
                    <th key={h} style={{
                      padding: "13px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 700, color: C.textDim,
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      borderBottom: `1px solid ${C.border}`,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 40, color: C.textDim, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      No users match "{search}"
                    </td>
                  </tr>
                ) : filtered.map((u, i) => (
                  <tr
                    key={u.id}
                    onClick={() => setViewUser(u)}
                    style={{ animation: `rowIn .4s ${0.22 + i * 0.07}s ease both`, opacity: 0, cursor: "pointer" }}
                    onMouseEnter={(e) => e.currentTarget.querySelectorAll("td").forEach((td) => (td.style.background = "#fff4f0"))}
                    onMouseLeave={(e) => e.currentTarget.querySelectorAll("td").forEach((td) => (td.style.background = ""))}
                  >
                    {/* User — avatar + full name + id */}
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar user={u} size={34} />
                        <div>
                          <div style={{ fontWeight: 600, color: C.textH, fontSize: 13 }}>
                            {fullName(u)}
                          </div>
                          <div style={{ fontSize: 11, color: C.textDim, marginTop: 1 }}>
                            #{u.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td style={tdStyle}>
                      <span style={{ color: C.textP, fontSize: 13 }}>{u.email || "—"}</span>
                    </td>

                    {/* Phone */}
                    <td style={tdStyle}>{u.phone}</td>

                    {/* Role */}
                    <td style={tdStyle}><RoleBadge role={u.role} /></td>

                    {/* Joined */}
                    <td style={{ ...tdStyle, color: C.textDim, fontSize: 12 }}>
                      {formatDate(u.date_joined)}
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 11px", borderRadius: 20,
                        fontSize: 11, fontWeight: 700,
                        background: u.is_active ? "#d1fae5" : "#ffe4e6",
                        color:      u.is_active ? "#065f46" : "#9f1239",
                        border:     u.is_active ? "1px solid rgba(5,150,105,.2)" : "1px solid rgba(225,29,72,.18)",
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                        {u.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={tdStyle}>
                      <button onClick={(e) => { e.stopPropagation(); handleToggle(u.id); }} style={u.is_active ? btnSuspend : btnActivate}>
                        {u.is_active ? "Suspend" : "Activate"}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }} style={btnDelete}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── User Detail Modal ── */}
        {viewUser && (
          <div
            onClick={() => setViewUser(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(20,4,4,.55)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: C.bgCard, borderRadius: 18,
                border: `1px solid ${C.borderMid}`, padding: 28,
                width: "100%", maxWidth: 400,
                boxShadow: `0 12px 40px rgba(60,10,10,.28)`,
                animation: "slideUp .3s ease",
              }}
            >
              {/* Modal header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar user={viewUser} size={52} />
                  <div>
                    <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, color: C.navDark }}>
                      {fullName(viewUser)}
                    </div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 9px", borderRadius: 20,
                      fontSize: 11, fontWeight: 700, marginTop: 4,
                      background: viewUser.is_active ? "#d1fae5" : "#ffe4e6",
                      color:      viewUser.is_active ? "#065f46" : "#9f1239",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                      {viewUser.is_active ? "Active" : "Suspended"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewUser(null)}
                  style={{
                    background: "rgba(139,26,26,.08)", border: "none", borderRadius: "50%",
                    width: 28, height: 28, cursor: "pointer", color: C.textMid, fontSize: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >×</button>
              </div>

              {/* Details */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18, display: "flex", flexDirection: "column", gap: 13 }}>
                <DetailRow label="Phone">{viewUser.phone}</DetailRow>
                <DetailRow label="Email">{viewUser.email || "—"}</DetailRow>
                <DetailRow label="Role"><RoleBadge role={viewUser.role} /></DetailRow>
                <DetailRow label="Joined">{formatDate(viewUser.date_joined)}</DetailRow>
                <DetailRow label="User ID">#{viewUser.id}</DetailRow>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button
                  onClick={() => { handleToggle(viewUser.id); setViewUser(null); }}
                  style={{
                    flex: 1, background: "transparent",
                    border: viewUser.is_active ? "1px solid rgba(217,119,6,.35)" : "1px solid rgba(5,150,105,.35)",
                    color: viewUser.is_active ? "#92400e" : "#065f46",
                    borderRadius: 9, padding: "9px 0",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {viewUser.is_active ? "Suspend" : "Activate"}
                </button>
                <button
                  onClick={() => { handleDelete(viewUser.id); setViewUser(null); }}
                  style={{
                    flex: 1, background: "transparent",
                    border: "1px solid rgba(225,29,72,.3)", color: "#9f1239",
                    borderRadius: 9, padding: "9px 0",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

/* ── Shared styles ───────────────────────────────────────────── */
const tdStyle = {
  padding: "13px 16px",
  fontSize: 13,
  color: "#3d1010",
  borderBottom: "1px solid rgba(140,30,30,0.07)",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const btnBase = {
  background: "transparent",
  borderRadius: 7,
  padding: "5px 12px",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const btnSuspend  = { ...btnBase, border: "1px solid rgba(217,119,6,.35)",  color: "#92400e", marginRight: 6 };
const btnActivate = { ...btnBase, border: "1px solid rgba(5,150,105,.35)",  color: "#065f46", marginRight: 6 };
const btnDelete   = { ...btnBase, border: "1px solid rgba(225,29,72,.3)",   color: "#9f1239" };