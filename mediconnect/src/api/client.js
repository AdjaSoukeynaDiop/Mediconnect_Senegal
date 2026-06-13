import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Injecte le JWT sur chaque requête
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gestion 401 : nettoyage + événement global pour AuthProvider
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.dispatchEvent(new Event("auth:logout"));
    }
    const detail = error.response?.data?.details;
    error.apiMessage =
      (error.response?.data?.message
        ? error.response.data.message + (detail ? ` (${detail})` : "")
        : null) ||
      error.response?.data?.error ||
      error.message ||
      "Erreur réseau";
    return Promise.reject(error);
  }
);

export default client;
