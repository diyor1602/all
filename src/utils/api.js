import axios from "axios";

const APIURL = import.meta.env.VITE_API_URL_J;

const api = axios.create({
  baseURL: APIURL,
});

// Add a request interceptor to include the token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Add a response interceptor to handle 401/403 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear local storage
      localStorage.clear();

      // Redirect using window.location
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    }

    return Promise.reject(error);
  }
);

export default api;
