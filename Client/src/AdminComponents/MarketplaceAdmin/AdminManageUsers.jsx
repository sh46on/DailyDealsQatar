import { useEffect, useState, useCallback, useRef } from "react";
import { fetchAdminUsers, deleteUser } from "./Api/adminUserApi";
import AdminLayout from "../AdminLayout";

// ─── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  primary:      "#1a4a6b",
  dark:         "#0d2f45",
  light:        "#1e5278",
  accent:       "#3a9bd5",
  accentSoft:   "#e8f4fc",
  surface:      "#f2f7fb",
  surfaceAlt:   "#eaf2f8",
  border:       "#cfe0ee",
  borderLight:  "#e4eef7",
  text:         "#0d2035",
  textMid:      "#3a5a72",
  textSoft:     "#7a9ab2",
  white:        "#ffffff",
  danger:       "#c0392b",
  dangerSoft:   "#fdf1f0",
  dangerBorder: "#f5c6c2",
  success:      "#1a7a4a",
  successSoft:  "#e8f7f0",
  successBorder:"#a3d9be",
  warn:         "#b06000",
  warnSoft:     "#fff7e6",
  warnBorder:   "#ffd080",
  shadow:       "rgba(13,47,69,0.12)",
  shadowMd:     "rgba(13,47,69,0.20)",
  shadowLg:     "rgba(13,47,69,0.28)",
};

const AVATAR_PALETTE = [
  ["#1a4a6b","#3a9bd5"], ["#1a6b4a","#3ad58a"], ["#6b1a4a","#d53a9b"],
  ["#6b4a1a","#d59b3a"], ["#4a1a6b","#9b3ad5"], ["#1a6b6b","#3ad5d5"],
];

const PAGE_SIZE = 10;

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; }
.amu-root { font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif; }

@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulseGreen {
  0%,100% { box-shadow: 0 0 0 0 rgba(26,122,74,0.4); }
  50%     { box-shadow: 0 0 0 5px rgba(26,122,74,0); }
}
@keyframes dialogIn {
  from { opacity: 0; transform: scale(0.94) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.amu-skeleton {
  background: linear-gradient(90deg, #dce8f2 25%, #c8dcea 50%, #dce8f2 75%);
  background-size: 600px 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: 6px;
}
.amu-row { animation: fadeSlideIn 0.22s ease both; }
.amu-row:hover td { background: ${T.accentSoft} !important; }
.amu-row:hover .amu-avatar { transform: scale(1.07); }
.amu-avatar { transition: transform 0.2s ease; }
.amu-pulse  { animation: pulseGreen 2s infinite; }

.amu-del-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 14px; border-radius: 8px;
  border: 1px solid ${T.dangerBorder}; background: ${T.dangerSoft};
  color: ${T.danger}; font-family: inherit; font-size: 12.5px; font-weight: 600;
  cursor: pointer; transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
  white-space: nowrap;
}
.amu-del-btn:hover:not(:disabled) {
  background: #f9e0de; box-shadow: 0 3px 10px rgba(192,57,43,0.2);
  transform: translateY(-1px);
}
.amu-del-btn:active:not(:disabled) { transform: translateY(0); }
.amu-del-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.amu-pg-btn {
  width: 34px; height: 34px; border-radius: 9px;
  border: 1px solid ${T.border}; background: ${T.white};
  color: ${T.text}; font-size: 13px; font-weight: 600;
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  transition: all 0.15s; box-shadow: 0 1px 3px ${T.shadow}; font-family: inherit;
}
.amu-pg-btn:hover:not(:disabled):not(.pg-active) { border-color: ${T.accent}; color: ${T.accent}; }
.amu-pg-btn.pg-active {
  background: linear-gradient(135deg, ${T.primary}, ${T.accent});
  color: #fff; border-color: transparent;
  box-shadow: 0 4px 12px ${T.shadowMd};
}
.amu-pg-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.amu-th-sort { cursor: pointer; user-select: none; transition: color 0.15s; }
.amu-th-sort:hover { color: ${T.accent} !important; }

.amu-search {
  padding: 9px 34px 9px 34px; border: 1px solid ${T.border};
  border-radius: 10px; font-family: inherit; font-size: 13.5px;
  color: ${T.text}; background: ${T.white}; outline: none; width: 230px;
  box-shadow: 0 1px 4px ${T.shadow}; transition: border-color 0.15s, box-shadow 0.15s;
}
.amu-search:focus { border-color: ${T.accent}; box-shadow: 0 0 0 3px ${T.accentSoft}; }

.amu-toast {
  position: fixed; bottom: 28px; right: 28px; z-index: 9999;
  display: flex; align-items: center; gap: 10px;
  padding: 13px 18px; border-radius: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13.5px; font-weight: 600;
  box-shadow: 0 8px 28px rgba(0,0,0,0.18);
  animation: fadeSlideIn 0.25s ease; max-width: 340px;
}
.amu-dialog-panel { animation: dialogIn 0.22s cubic-bezier(0.34,1.3,0.64,1) both; }

.amu-email-link { color: ${T.primary}; text-decoration: none; font-weight: 500; font-size: 13.5px; transition: color 0.15s; }
.amu-email-link:hover { color: ${T.accent}; text-decoration: underline; }
`;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function avatarColors(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}
function initials(name = "") {
  return name.trim().split(/\s+/).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 40 }) {
  const [err, setErr]       = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [clrs]              = useState(() => avatarColors(name));
  const showImg             = src && !err;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* Fallback */}
      <div className="amu-avatar" style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: `linear-gradient(135deg, ${clrs[0]}, ${clrs[1]})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.36, fontWeight: 700, color: "#fff",
        boxShadow: `0 2px 8px ${T.shadow}`,
      }}>
        {initials(name)}
      </div>

      {showImg && (
        <img
          src={src} alt={name}
          className="amu-avatar"
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            borderRadius: "50%", objectFit: "cover",
            opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease",
            boxShadow: `0 2px 8px ${T.shadow}`,
          }}
        />
      )}

      {/* Active dot */}
      <span className="amu-pulse" style={{
        position: "absolute", bottom: 1, right: 1,
        width: 10, height: 10, borderRadius: "50%",
        background: T.success, border: `2px solid ${T.white}`,
      }} />
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3400); return () => clearTimeout(t); }, [onDone]);
  const MAP = {
    success: { bg: T.successSoft, border: T.successBorder, color: T.success, icon: "✓" },
    error:   { bg: T.dangerSoft,  border: T.dangerBorder,  color: T.danger,  icon: "✕" },
    warn:    { bg: T.warnSoft,    border: T.warnBorder,    color: T.warn,    icon: "⚠" },
  };
  const c = MAP[type] || MAP.warn;
  return (
    <div className="amu-toast" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      <span style={{ fontSize: 16, fontWeight: 800 }}>{c.icon}</span>{message}
    </div>
  );
}

// ─── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow() {
  const widths = ["70%", "55%", "45%", "52%", "40%"];
  return (
    <tr>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div className="amu-skeleton" style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="amu-skeleton" style={{ height: 13, width: "65%", marginBottom: 6 }} />
            <div className="amu-skeleton" style={{ height: 11, width: "45%" }} />
          </div>
        </div>
      </td>
      {widths.map((w, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <div className="amu-skeleton" style={{ height: 13, width: w }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Empty / Error State ───────────────────────────────────────────────────────
function TableEmpty({ type, onRetry }) {
  const cfg = {
    empty:  { icon: "👥", title: "No active users",            desc: "No users found on this page." },
    error:  { icon: "⚠️", title: "Could not load users",       desc: "There was a problem fetching data. Please try again." },
    search: { icon: "🔍", title: "No matching users",          desc: "Try a different search term or clear the filter." },
  }[type];
  return (
    <tr>
      <td colSpan={6} style={{ padding: "68px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>{cfg.icon}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>{cfg.title}</div>
        <div style={{ fontSize: 13.5, color: T.textSoft, marginBottom: type === "error" ? 18 : 0 }}>{cfg.desc}</div>
        {type === "error" && (
          <button onClick={onRetry} style={{
            marginTop: 4, padding: "9px 24px", borderRadius: 9, border: "none",
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700,
            cursor: "pointer", boxShadow: `0 4px 14px ${T.shadowMd}`,
          }}>Retry</button>
        )}
      </td>
    </tr>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ user, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(10,26,44,0.58)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <div
        className="amu-dialog-panel"
        onClick={e => e.stopPropagation()}
        style={{
          background: T.white, borderRadius: 18, padding: "32px 34px",
          width: 410, maxWidth: "92vw",
          boxShadow: `0 24px 64px ${T.shadowLg}`,
          border: `1px solid ${T.borderLight}`,
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: T.dangerSoft, border: `1.5px solid ${T.dangerBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, margin: "0 auto 16px",
        }}>🗑️</div>

        <h3 style={{ margin: "0 0 8px", textAlign: "center", fontSize: 18, fontWeight: 800, color: T.text }}>
          Remove User?
        </h3>
        <p style={{ margin: "0 0 24px", textAlign: "center", fontSize: 13.5, color: T.textMid, lineHeight: 1.65 }}>
          You're about to permanently remove <strong>{user.full_name}</strong>
          {" "}(<span style={{ color: T.primary }}>{user.email}</span>).
          <br />This action <strong>cannot be undone</strong>.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "11px", borderRadius: 9,
            border: `1px solid ${T.border}`, background: T.white,
            color: T.textMid, fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            transition: "background 0.15s",
          }}
            onMouseEnter={e => e.target.style.background = T.surfaceAlt}
            onMouseLeave={e => e.target.style.background = T.white}
          >Cancel</button>

          <button onClick={onConfirm} style={{
            flex: 1, padding: "11px", borderRadius: 9, border: "none",
            background: `linear-gradient(135deg, ${T.danger}, #e74c3c)`,
            color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700,
            cursor: "pointer", boxShadow: "0 4px 14px rgba(192,57,43,0.35)",
          }}>Yes, Remove</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }) {
  return (
    <span style={{ marginLeft: 5, fontSize: 9.5, opacity: active ? 1 : 0.3, color: active ? T.accent : "inherit" }}>
      {active && dir === "desc" ? "▼" : "▲"}
    </span>
  );
}

// ─── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ color = T.danger, size = 12 }) {
  return (
    <span style={{
      width: size, height: size, flexShrink: 0,
      border: `2px solid ${color}`, borderTopColor: "transparent",
      borderRadius: "50%", display: "inline-block",
      animation: "spin 0.7s linear infinite",
    }} />
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AdminManageUsers() {
  const [users,       setUsers]       = useState([]);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [search,      setSearch]      = useState("");
  const [sortKey,     setSortKey]     = useState("full_name");
  const [sortDir,     setSortDir]     = useState("asc");
  const [toast,       setToast]       = useState(null);
  const searchRef = useRef(null);

  // ── Data ────────────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (pg) => {
    setLoading(true); setLoadError(false);
    try {
      const res = await fetchAdminUsers(pg);
      setUsers(res.data.results);
      setTotalCount(res.data.count);
      setTotalPages(Math.ceil(res.data.count / PAGE_SIZE));
    } catch {
      setLoadError(true); setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(page); }, [page, loadUsers]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteConfirmed = useCallback(async () => {
    const user = confirmUser;
    setConfirmUser(null);
    setDeletingId(user.user_id);
    try {
      await deleteUser(user.user_id);
      setToast({ message: `${user.full_name} removed successfully.`, type: "success" });
      const newPg = users.length === 1 && page > 1 ? page - 1 : page;
      setPage(p => { if (p === newPg) loadUsers(newPg); return newPg; });
    } catch {
      setToast({ message: "Failed to remove user. Please try again.", type: "error" });
    } finally {
      setDeletingId(null);
    }
  }, [confirmUser, users.length, page, loadUsers]);

  // ── Sort ────────────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const displayed = [...users]
    .filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return ["full_name","email","city","state"].some(k => (u[k] || "").toLowerCase().includes(q));
    })
    .sort((a, b) => {
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  // ── Pagination numbers ──────────────────────────────────────────────────────
  const pageNums = (() => {
    const out = []; let prev = null;
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) {
        if (prev && p - prev > 1) out.push("…");
        out.push(p); prev = p;
      }
    }
    return out;
  })();

  const COLS = [
    { key: "full_name", label: "User",     sortable: true  },
    { key: "email",     label: "Email",    sortable: true  },
    { key: "phone",     label: "Phone",    sortable: true  },
    { key: "city",      label: "Location", sortable: true  },
    { key: "status",    label: "Status",   sortable: false },
    { key: "joined",    label: "Joined",   sortable: false },
    { key: "actions",   label: "Actions",  sortable: false },
  ];

  return (
    <AdminLayout>
      <style>{GLOBAL_CSS}</style>

      <div className="amu-root" style={{ padding: "28px 32px", minHeight: "100vh", background: T.surface }}>

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between", flexWrap: "wrap", gap: 14,
          }}>
            <div>
              <span style={{
                fontSize: 11, fontWeight: 800, letterSpacing: "2.5px",
                textTransform: "uppercase", color: T.accent, display: "block", marginBottom: 4,
              }}>Administration</span>
              <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.6px" }}>
                Active Users
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {/* Search box */}
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 11, top: "50%",
                  transform: "translateY(-50%)", fontSize: 14,
                  color: T.textSoft, pointerEvents: "none",
                }}>🔍</span>
                <input
                  ref={searchRef}
                  className="amu-search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search users…"
                />
                {search && (
                  <button onClick={() => setSearch("")} style={{
                    position: "absolute", right: 9, top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", cursor: "pointer", fontSize: 12,
                    color: T.textSoft, padding: 2,
                  }}>✕</button>
                )}
              </div>

              {/* Total badge */}
              {!loading && !loadError && (
                <div style={{
                  padding: "8px 16px", borderRadius: 20,
                  background: `linear-gradient(135deg, ${T.dark}, ${T.accent})`,
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  boxShadow: `0 4px 12px ${T.shadowMd}`,
                  display: "flex", alignItems: "center", gap: 7,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#5de0a0", display: "inline-block",
                    boxShadow: "0 0 0 2px rgba(93,224,160,0.35)",
                  }} />
                  {totalCount.toLocaleString()} {totalCount === 1 ? "User" : "Users"}
                </div>
              )}
            </div>
          </div>

          <div style={{
            height: 1, marginTop: 20,
            background: `linear-gradient(to right, ${T.border}, transparent)`,
          }} />
        </div>

        {/* ── Table Card ───────────────────────────────────────────────────── */}
        <div style={{
          background: T.white, borderRadius: 16,
          border: `1px solid ${T.border}`,
          boxShadow: `0 4px 24px ${T.shadow}`,
          overflow: "hidden",
        }}>
          {/* Top accent strip */}
          <div style={{
            height: 4,
            background: `linear-gradient(90deg, ${T.dark} 0%, ${T.primary} 50%, ${T.accent} 100%)`,
          }} />

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "21%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>

              <thead>
                <tr style={{ background: T.surfaceAlt }}>
                  {COLS.map(col => (
                    <th
                      key={col.key}
                      className={col.sortable ? "amu-th-sort" : ""}
                      onClick={col.sortable ? () => handleSort(col.key) : undefined}
                      style={{
                        padding: "13px 16px", textAlign: "left",
                        fontSize: 11, fontWeight: 800, letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: sortKey === col.key ? T.accent : T.textMid,
                        borderBottom: `1.5px solid ${T.borderLight}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label}
                      {col.sortable && <SortIcon active={sortKey === col.key} dir={sortDir} />}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)
                ) : loadError ? (
                  <TableEmpty type="error" onRetry={() => loadUsers(page)} />
                ) : displayed.length === 0 ? (
                  <TableEmpty type={search ? "search" : "empty"} />
                ) : (
                  displayed.map((user, idx) => {
                    const isDeleting = deletingId === user.user_id;
                    return (
                      <tr
                        key={user.id}
                        className="amu-row"
                        style={{
                          animationDelay: `${idx * 0.04}s`,
                          opacity: isDeleting ? 0.4 : 1,
                          transition: "opacity 0.3s",
                        }}
                      >
                        {/* User */}
                        <td style={{ padding: "13px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                            <Avatar
                              src={user.profile_image || user.avatar || user.photo_url || null}
                              name={user.full_name}
                              size={40}
                            />
                            <div style={{ overflow: "hidden", minWidth: 0 }}>
                              <div style={{
                                fontSize: 14, fontWeight: 700, color: T.text,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              }}>
                                {user.full_name || "—"}
                              </div>
                              {user.role && (
                                <div style={{ fontSize: 11.5, color: T.textSoft, fontWeight: 500, marginTop: 1 }}>
                                  {user.role}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: "13px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
                          {user.email ? (
                            <a href={`mailto:${user.email}`} className="amu-email-link"
                              style={{
                                display: "block", whiteSpace: "nowrap",
                                overflow: "hidden", textOverflow: "ellipsis",
                              }}
                            >
                              {user.email}
                            </a>
                          ) : (
                            <span style={{ fontSize: 13, color: T.textSoft }}>—</span>
                          )}
                        </td>
                        {/* Phone */}
                        <td style={{ padding: "13px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
                          {user.phone ? (
                            <a href={`tel:${user.phone}`} className="amu-phone-link"
                              style={{
                                display: "block", whiteSpace: "nowrap",
                                overflow: "hidden", textOverflow: "ellipsis",
                              }}
                            >
                              +974 {user.phone}
                            </a>
                          ) : (
                            <span style={{ fontSize: 13, color: T.textSoft }}>—</span>
                          )}
                        </td>

                        {/* Location */}
                        <td style={{ padding: "13px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
                          {user.city || user.state ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                              <span style={{ fontSize: 13, flexShrink: 0 }}>📍</span>
                              <span style={{
                                fontSize: 13.5, color: T.textMid, fontWeight: 500,
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                              }}>
                                {[user.city, user.state].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 13, color: T.textSoft }}>—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "13px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            padding: "4px 10px", borderRadius: 20,
                            background: T.successSoft, border: `1px solid ${T.successBorder}`,
                            fontSize: 11.5, fontWeight: 700, color: T.success, whiteSpace: "nowrap",
                          }}>
                            <span style={{
                              width: 7, height: 7, borderRadius: "50%",
                              background: T.success, flexShrink: 0,
                            }} />
                            Active
                          </div>
                        </td>

                        {/* Joined */}
                        <td style={{ padding: "13px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
                          <span style={{ fontSize: 13.5, color: T.textMid, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {fmtDate(user.date_joined || user.created_at)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "13px 16px", borderBottom: `1px solid ${T.borderLight}` }}>
                          <button
                            className="amu-del-btn"
                            disabled={isDeleting}
                            onClick={() => setConfirmUser(user)}
                          >
                            {isDeleting
                              ? <><Spinner />&nbsp;Removing…</>
                              : <><span>🗑</span> Remove User</>
                            }
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Footer / Pagination ────────────────────────────────────────── */}
          {!loading && !loadError && totalCount > 0 && (
            <div style={{
              padding: "14px 20px",
              borderTop: `1px solid ${T.borderLight}`,
              background: T.surfaceAlt,
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 12,
            }}>
              <span style={{ fontSize: 13, color: T.textSoft, fontWeight: 500 }}>
                Showing{" "}
                <strong style={{ color: T.textMid }}>
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}
                </strong>
                {" "}of{" "}
                <strong style={{ color: T.textMid }}>{totalCount.toLocaleString()}</strong>
                {" "}active users
              </span>

              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <button className="amu-pg-btn" disabled={page === 1}
                  onClick={() => setPage(p => p - 1)} title="Previous">‹</button>

                {pageNums.map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} style={{ fontSize: 13, color: T.textSoft, padding: "0 2px" }}>…</span>
                  ) : (
                    <button
                      key={p}
                      className={`amu-pg-btn ${p === page ? "pg-active" : ""}`}
                      onClick={() => setPage(p)}
                    >{p}</button>
                  )
                )}

                <button className="amu-pg-btn" disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)} title="Next">›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm Dialog ── */}
      {confirmUser && (
        <ConfirmDialog
          user={confirmUser}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmUser(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}