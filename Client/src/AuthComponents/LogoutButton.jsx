import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api/authApi";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {}

    // Always clear tokens
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "10px 16px",
        background: "#e74c3c",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Logout
    </button>
  );
}