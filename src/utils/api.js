import axios from "axios";

// Get API base URL from environment variable or use default
// In Vite, environment variables must be prefixed with VITE_
const getApiBaseURL = () => {
  // Check for Vite environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback to default for development
  if (import.meta.env.DEV) {
    return "http://localhost:5001/api/v1";
  }
  
  // Production: require explicit configuration
  console.error("VITE_API_BASE_URL environment variable is required in production!");
  return "/api/v1"; // Fallback to relative URL
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration and unauthorized access
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      // Clear stored authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Redirect to login page if not already there
      if (window.location.pathname !== "/account") {
        window.location.href = "/account";
      }
    }
    
    // Handle 403 Forbidden (admin access required)
    if (error.response?.status === 403) {
      // Redirect non-admin users trying to access admin routes
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/";
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
