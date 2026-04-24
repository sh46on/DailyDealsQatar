// import { Navigate } from "react-router-dom";

// export default function ProtectedRoute({ children, allowedRoles }) {
//   const role = localStorage.getItem("role");

//   if (!role) {
//     return <Navigate to="/" />;
//   }

//   if (!allowedRoles.includes(role)) {
//     return <Navigate to="/" />;
//   }

//   return children;
// }


import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("access");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const location = useLocation();

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Role not allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    // prevent infinite loop
    if (location.pathname !== "/marketplace/home") {
      return <Navigate to="/marketplace/home" replace />;
    }

    // already on fallback → allow render
    return children;
  }

  // Allowed
  return children;
}