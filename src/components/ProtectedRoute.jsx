import { Navigate, useLocation } from "react-router-dom";

/**
 * ProtectedRoute Component
 * 
 * Protects routes that require authentication.
 * Optionally enforces admin role requirement.
 * 
 * @param {React.ReactNode} children - The component to render if authenticated
 * @param {boolean} requireAdmin - If true, only allows admin users
 * @returns {JSX.Element} Either the protected component or redirect to login
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  
  // Parse user data safely
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  // No token or user data - redirect to login
  if (!token || !user) {
    return <Navigate to="/account" state={{ from: location }} replace />;
  }

  // Admin required but user is not admin - redirect to home
  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // All checks passed - render the protected component
  return children;
};

export default ProtectedRoute;

