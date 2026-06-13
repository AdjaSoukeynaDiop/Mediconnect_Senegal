/**
 * src/api/client.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : application.properties + SecurityConfig.java + AuthController.java
 *
 * Base URL  : http://localhost:8080   (server.port=8080)
 * Préfixe   : /api  (tous les controllers @RequestMapping("/api/..."))
 *
 * Format réponse Spring :
 *   Succès  → { success: true,  message: "...", data: {...} }  OU  objet direct
 *   Erreur  → { success: false, message: "..." }
 *
 * JWT :
 *   - Expiration 24h (86400000 ms)
 *   - Pas de refresh automatique côté front : expiration = déconnexion propre
 *   - Logout blackliste le token côté serveur (authService.blacklistToken)
 */

import axios from "axios";

export const BASE_URL = process.env.REACT_APP_API_URL ?? "http://localhost:8080";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Injecte le JWT ────────────────────────────────────────────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Gestion erreurs ───────────────────────────────────────────────────────────
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.dispatchEvent(new Event("auth:logout"));
    }
    // Le backend renvoie toujours { success: false, message: "..." } sur erreur
    error.apiMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Erreur réseau";
    return Promise.reject(error);
  }
);

export default client;