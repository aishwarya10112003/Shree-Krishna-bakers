import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api/v1", // Your Backend URL
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

export default api;
