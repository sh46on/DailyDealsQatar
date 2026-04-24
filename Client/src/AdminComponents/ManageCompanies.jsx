import { useEffect, useState, useCallback } from "react";
import AdminLayout from "./AdminLayout";
import {
  fetchCompanies,
  deleteCompany,
  toggleCompany,
  createCompany,
} from "../api/companyApi";

/* ─────────────────────────────────────────────────────────────────
   THEME — matches AdminHome warm-cream palette exactly
───────────────────────────────────────────────────────────────── */
const C = {
  bg:          "#fdf6f0",
  bgCard:      "#ffffff",
  bgCardWarm:  "#fff9f6",
  bgCardTint:  "#fef2ee",

  navDark:     "#5c0f0f",
  navMid:      "#8b1a1a",
  navBright:   "#c0392b",

  rose:        "#e11d48",
  emerald:     "#059669",
  amber:       "#d97706",

  textH:       "#1a0505",
  textP:       "#3d1010",
  textMid:     "#6b2a2a",
  textDim:     "#a05050",
  textOnDark:  "#ffe8e8",

  border:      "rgba(140,30,30,0.12)",
  borderMid:   "rgba(140,30,30,0.22)",
  shadow:      "rgba(80,10,10,0.08)",
};

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

/* ── Avatar initials helper ──────────────────────────────────── */
function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
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
      <div
        style={{
          fontSize: 30,
          fontWeight: 400,
          fontFamily: "'DM Serif Display', serif",
          color: C.textH,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          color: C.textMid,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginTop: 5,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
export default function ManageCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewCompany, setViewCompany] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    city: "Doha",
    address: "",
    phone: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
  });

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchCompanies();
      setCompanies(res.data || []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this company?")) return;
    await deleteCompany(id);
    loadCompanies();
  };

  const handleToggle = async (id) => {
    await toggleCompany(id);
    loadCompanies();
  };

  const handleCreate = async () => {
    if (!form.name || !form.phone || !form.password) {
      alert("Name, Phone and Password are required");
      return;
    }
    try {
      setSaving(true);
      await createCompany(form);
      setOpen(false);
      setForm({
        name: "", description: "", city: "Doha", address: "",
        phone: "", password: "", email: "", first_name: "", last_name: "",
      });
      loadCompanies();
    } catch (err) {
      console.error(err);
      alert("Failed to create company");
    } finally {
      setSaving(false);
    }
  };

  const activeCount    = companies.filter((c) => c.is_active).length;
  const suspendedCount = companies.length - activeCount;

  const filtered = companies.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.user_phone?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* ── Fonts + keyframes ── */}
      <link rel="stylesheet" href={FONT_LINK} />
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div
        style={{
          padding: "28px 32px 40px 28px",
          background: C.bg,
          minHeight: "100%",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 26,
            animation: "fadeIn .4s ease",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 34,
                fontWeight: 400,
                fontFamily: "'DM Serif Display', serif",
                color: C.navDark,
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
              }}
            >
              Manage Companies
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 13,
                color: C.textMid,
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              Daily Deals &nbsp;·&nbsp; Qatar &nbsp;·&nbsp; Admin Panel v1.0
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: C.navMid,
              color: C.textOnDark,
              border: "none",
              borderRadius: 10,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            + Add Company
          </button>
        </div>

        {/* ── Search bar ── */}
        <div
          style={{
            marginBottom: 18,
            animation: "fadeIn .4s .08s ease both",
            opacity: 0,
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}>
            <div style={{
              position: "relative",
              flex: 1,
            }}>
              <div style={{
                position: "absolute", left: 14, top: "50%",
                transform: "translateY(-50%)",
                width: 34, height: 34,
                background: C.bgCardTint,
                border: `1px solid ${C.border}`,
                borderRadius: "50%",
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
                placeholder="Search companies by name, phone, or city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "30%",
                  background: C.bgCard,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 50,
                  padding: "15px 44px 11px 58px",
                  fontSize: 13,
                  color: C.textH,
                  outline: "none",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
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
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(139,26,26,.1)",
                    border: "none", borderRadius: "50%",
                    width: 22, height: 22, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: C.navMid, fontSize: 14, lineHeight: 1,
                  }}
                >×</button>
              )}
            </div>
            {search && (
              <div style={{
                flexShrink: 0,
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                borderRadius: 50,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 600,
                color: C.textMid,
                whiteSpace: "nowrap",
                boxShadow: `0 1px 4px ${C.shadow}`,
              }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <StatCard value={companies.length} label="Total companies" accent={C.navBright} delay={0.05} />
          <StatCard value={activeCount}      label="Active"          accent={C.emerald}   delay={0.10} />
          <StatCard value={suspendedCount}   label="Suspended"       accent={C.rose}      delay={0.15} />
        </div>

        {/* ── Table card ── */}
        <div
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: `0 2px 10px ${C.shadow}`,
            animation: "slideUp .5s .18s ease both",
          }}
        >
          {loading ? (
            <p style={{ textAlign: "center", padding: 40, color: C.textDim }}>
              Loading…
            </p>
          ) : companies.length === 0 ? (
            <p style={{ textAlign: "center", padding: 40, color: C.textDim }}>
              No companies found.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.bgCardWarm }}>
                  {["Name", "Phone", "City", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "13px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.textDim,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        borderBottom: `1px solid ${C.border}`,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 40, color: C.textDim, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      No companies match "{search}"
                    </td>
                  </tr>
                ) : filtered.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={() => setViewCompany(c)}
                    style={{
                      animation: `rowIn .4s ${0.22 + i * 0.07}s ease both`,
                      opacity: 0,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.querySelectorAll("td").forEach(
                        (td) => (td.style.background = "#fff4f0")
                      );
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.querySelectorAll("td").forEach(
                        (td) => (td.style.background = "")
                      );
                    }}
                  >
                    {/* Name + avatar */}
                    <td style={td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: "rgba(139,26,26,.1)",
                          border: `1px solid rgba(139,26,26,.2)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700, color: C.navMid, flexShrink: 0,
                        }}>
                          {initials(c.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: C.textH, fontSize: 13 }}>{c.name}</div>
                        </div>
                      </div>
                    </td>

                    <td style={td}>{c.user_phone}</td>

                    {/* City tag */}
                    <td style={td}>
                      <span style={{
                        background: "rgba(139,26,26,.08)",
                        color: C.navDark,
                        borderRadius: 6,
                        padding: "3px 9px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {c.city}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td style={td}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 11px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        background: c.is_active ? "#d1fae5" : "#ffe4e6",
                        color:      c.is_active ? "#065f46" : "#9f1239",
                        border:     c.is_active
                          ? "1px solid rgba(5,150,105,.2)"
                          : "1px solid rgba(225,29,72,.18)",
                      }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: "currentColor", display: "inline-block",
                        }} />
                        {c.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={td}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggle(c.id); }}
                        style={c.is_active ? btnSuspend : btnActivate}
                      >
                        {c.is_active ? "Suspend" : "Activate"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                        style={btnDelete}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Add Company Modal ── */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(20,4,4,.55)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 50,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: C.bgCard,
                borderRadius: 20,
                border: `1px solid ${C.borderMid}`,
                padding: "30px 32px",
                width: "100%",
                maxWidth: 620,
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: `0 16px 48px rgba(60,10,10,.28)`,
                animation: "slideUp .3s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
                <div>
                  <h2 style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 24, fontWeight: 400, color: C.navDark, margin: 0,
                  }}>
                    Add Company
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textDim }}>
                    Fill in the details below to register a new company.
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "rgba(139,26,26,.08)", border: "none",
                    borderRadius: "50%", width: 30, height: 30,
                    cursor: "pointer", color: C.textMid, fontSize: 17,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >×</button>
              </div>

              {/* ── Company info — 2-col grid ── */}
              <SectionLabel>Company info</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                <Input placeholder="Company name" value={form.name}        onChange={(v) => setForm({ ...form, name: v })} fullWidth />
                <Input placeholder="City"          value={form.city}        onChange={(v) => setForm({ ...form, city: v })} fullWidth />
                <div style={{ gridColumn: "1 / -1" }}>
                <Input placeholder="Address"       value={form.address}     onChange={(v) => setForm({ ...form, address: v })} fullWidth />
                  <Textarea placeholder="Description (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
                </div>
              </div>

              {/* ── Credentials — 2-col grid ── */}
              <SectionLabel>Account credentials</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                <Input placeholder="Phone"      value={form.phone}      onChange={(v) => setForm({ ...form, phone: v })} />
                <Input placeholder="Password"   value={form.password}   onChange={(v) => setForm({ ...form, password: v })} type="password" />
                <Input placeholder="First name" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
                <Input placeholder="Last name"  value={form.last_name}  onChange={(v) => setForm({ ...form, last_name: v })} />
                <div style={{ gridColumn: "1 / -1" }}>
                  <Input placeholder="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  style={{
                    flex: 1, background: saving ? C.textDim : C.navMid,
                    color: C.textOnDark, border: "none", borderRadius: 10,
                    padding: "11px 0", fontSize: 13, fontWeight: 700,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {saving ? "Creating…" : "Create company"}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: "#f5ece8", color: C.textMid,
                    border: `1px solid ${C.border}`, borderRadius: 10,
                    padding: "11px 22px", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Company Detail Modal ── */}
        {viewCompany && (
          <div
            onClick={() => setViewCompany(null)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(20,4,4,.55)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 50,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: C.bgCard,
                borderRadius: 18,
                border: `1px solid ${C.borderMid}`,
                padding: 28,
                width: "100%",
                maxWidth: 400,
                boxShadow: `0 12px 40px rgba(60,10,10,.28)`,
                animation: "slideUp .3s ease",
              }}
            >
              {/* Modal header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%",
                    background: "rgba(139,26,26,.1)",
                    border: `1px solid rgba(139,26,26,.2)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: C.navMid, flexShrink: 0,
                  }}>
                    {initials(viewCompany.name)}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: 20, fontWeight: 400, color: C.navDark,
                    }}>
                      {viewCompany.name}
                    </div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, marginTop: 4,
                      background: viewCompany.is_active ? "#d1fae5" : "#ffe4e6",
                      color:      viewCompany.is_active ? "#065f46" : "#9f1239",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                      {viewCompany.is_active ? "Active" : "Suspended"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewCompany(null)}
                  style={{
                    background: "rgba(139,26,26,.08)", border: "none",
                    borderRadius: "50%", width: 28, height: 28,
                    cursor: "pointer", color: C.textMid, fontSize: 16,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >×</button>
              </div>

              {/* Details */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Phone",   value: viewCompany.user_phone },
                  { label: "City",    value: viewCompany.city },
                  { label: "Address", value: viewCompany.address },
                  { label: "Email",   value: viewCompany.email },
                ].filter((r) => r.value).map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, color: C.textDim, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {row.label}
                    </span>
                    <span style={{ fontSize: 13, color: C.textP, fontWeight: 500, textAlign: "right", maxWidth: "62%" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button
                  onClick={() => { handleToggle(viewCompany.id); setViewCompany(null); }}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: viewCompany.is_active
                      ? "1px solid rgba(217,119,6,.35)"
                      : "1px solid rgba(5,150,105,.35)",
                    color: viewCompany.is_active ? "#92400e" : "#065f46",
                    borderRadius: 9, padding: "9px 0",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {viewCompany.is_active ? "Suspend" : "Activate"}
                </button>
                <button
                  onClick={() => { handleDelete(viewCompany.id); setViewCompany(null); }}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid rgba(225,29,72,.3)",
                    color: "#9f1239",
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

/* ── Small shared sub-components ────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: "#a05050",
      textTransform: "uppercase", letterSpacing: "0.09em",
      margin: "14px 0 9px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {children}
    </div>
  );
}

function Input({ placeholder, value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "#fff9f6",
        border: "1px solid rgba(140,30,30,0.18)",
        borderRadius: 9,
        padding: "10px 13px",
        fontSize: 13,
        color: "#1a0505",
        marginBottom: 10,
        outline: "none",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    />
  );
}

function Textarea({ placeholder, value, onChange }) {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "#fff9f6",
        border: "1px solid rgba(140,30,30,0.18)",
        borderRadius: 9,
        padding: "10px 13px",
        fontSize: 13,
        color: "#1a0505",
        marginBottom: 10,
        outline: "none",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        resize: "none",
        minHeight: 64,
      }}
    />
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const td = {
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

const btnSuspend = {
  ...btnBase,
  border: "1px solid rgba(217,119,6,.35)",
  color: "#92400e",
  marginRight: 6,
};

const btnActivate = {
  ...btnBase,
  border: "1px solid rgba(5,150,105,.35)",
  color: "#065f46",
  marginRight: 6,
};

const btnDelete = {
  ...btnBase,
  border: "1px solid rgba(225,29,72,.3)",
  color: "#9f1239",
};