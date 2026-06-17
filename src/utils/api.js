import axios from "axios";

// Resolve the API base URL (env override → dev default → relative fallback).
const getApiBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (import.meta.env.DEV) return "http://localhost:5001/api/v1";
  return "/api/v1";
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send the httpOnly refresh-token cookie
});

// Attach the short-lived access token to every request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers["x-auth-token"] = token;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Silent refresh ────────────────────────────────────────────────────────
// When the access token expires (401), transparently call /user/refresh to get
// a new one and retry the original request. Concurrent 401s are queued so we
// only refresh once. This keeps the user logged in without any UI fl... and
// without the old "hard window reload" that nuked SPA state.
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  pendingQueue = [];
};

const isAuthEndpoint = (url = "") =>
  ["/user/refresh", "/user/signin", "/user/signup", "/user/verify-otp"].some((p) =>
    url.includes(p),
  );

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      if (isRefreshing) {
        // Wait for the in-flight refresh, then retry with the new token.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers["x-auth-token"] = token;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${getApiBaseURL()}/user/refresh`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        flushQueue(null, data.token);
        original.headers["x-auth-token"] = data.token;
        return api(original);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/account") {
          window.location.href = "/account";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Non-admin hitting an admin route → bounce home (unchanged behavior).
    if (status === 403 && window.location.pathname.startsWith("/admin")) {
      window.location.href = "/";
    }

    return Promise.reject(error);
  },
);

export default api;
