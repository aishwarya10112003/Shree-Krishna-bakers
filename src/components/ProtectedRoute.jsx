import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Guards routes that require authentication (and optionally the admin role).
 * Reads auth state from AuthContext — the single source of truth — instead of
 * parsing localStorage independently.
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useAuth();

  // Not logged in → send to login, remembering where they wanted to go.
  if (!isAuthenticated) {
    return <Navigate to="/account" state={{ from: location }} replace />;
  }

  // Logged in but not an admin trying to reach an admin route → home.
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
