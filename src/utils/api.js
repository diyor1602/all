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
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
