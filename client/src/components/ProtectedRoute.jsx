import { Navigate, Outlet, useLocation } from "react-router-dom";

function isTokenValid(token) {
  if (!token) return false;

  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return false;
    }

    const payload = JSON.parse(atob(parts[1]));

    if (!payload.exp) {
      return true;
    }

    return payload.exp * 1000 > Date.now();

  } catch {
    return false;
  }
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (!isTokenValid(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Supports both usage styles:
  // <ProtectedRoute><Dashboard /></ProtectedRoute>  (children)
  // <Route element={<ProtectedRoute />}><Route path="/dashboard" element={<Dashboard />} /></Route>  (Outlet)
  return children ?? <Outlet />;
}

export default ProtectedRoute;