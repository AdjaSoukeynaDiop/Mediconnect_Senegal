/**
 * src/context/AuthContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API + AuthController + SecurityConfig
 *
 * AuthenticationResponse : { token, refreshToken, user: UserDto }
 * UserDto : { userId, prenom, nom, email, telephone, role }
 * Rôles   : ADMIN | MEDECIN | INFIRMIER | PATIENT | CARDIOLOGUE
 *
 * Flux login :
 *   POST /api/auth/login
 *     → { success, message, data: { token, refreshToken, user: UserDto } }
 *   → Stocker token → router selon user.role
 *
 * Flux init :
 *   Token en localStorage → GET /api/auth/current-user → UserDto frais
 *
 * Routing post-login (selon role) :
 *   ADMIN       → "dashboard_admin"
 *   MEDECIN     → "dashboard_medecin"
 *   CARDIOLOGUE → "dashboard_medecin"
 *   INFIRMIER   → "dashboard_medecin"
 *   PATIENT     → "dashboard_patient"
 */

import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from "react";
import { login as apiLogin, logout as apiLogout, getCurrentUser } from "../api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);   // UserDto
  const [isLoading, setIsLoading] = useState(true);

  // ── Vérification initiale du token ────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) { setIsLoading(false); return; }
      try {
        const res = await getCurrentUser();
        // { success, data: UserDto }
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          localStorage.removeItem("accessToken");
        }
      } catch {
        localStorage.removeItem("accessToken");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // ── Déconnexion forcée (401 dans l'intercepteur) ──────────────────────────
  useEffect(() => {
    const handle = () => setUser(null);
    window.addEventListener("auth:logout", handle);
    return () => window.removeEventListener("auth:logout", handle);
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  /**
   * payload : { email?, phoneNumber?, password }
   * LoginRequest attend email OU phoneNumber
   */
  const login = useCallback(async (payload) => {
    const res = await apiLogin(payload);
    if (!res.success) throw new Error(res.message ?? "Échec de la connexion");
    // res.data = AuthenticationResponse = { token, refreshToken, user: UserDto }
    setUser(res.data?.user ?? null);
    return res.data; // AuthenticationResponse
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  // ── Helpers rôle ──────────────────────────────────────────────────────────
  // user.role vient de UserDto, valeur = nom de l'enum Spring sans "ROLE_" préfixe
  const isRole        = (r) => user?.role === r;
  const isAdmin       = () => isRole("ADMIN");
  const isMedecin     = () => isRole("MEDECIN");
  const isCardiologue = () => isRole("CARDIOLOGUE");
  const isInfirmier   = () => isRole("INFIRMIER");
  const isPatient     = () => isRole("PATIENT");

  /**
   * hasPermission — basé sur SecurityConfig @PreAuthorize réels
   *
   * ADMIN       → tout
   * MEDECIN     → patients:read, consultations, ordonnances, examens,
   *               transferts, rendezVous, alertes, constantes:read, dossiers
   * CARDIOLOGUE → idem MEDECIN
   * INFIRMIER   → patients:create, patients:read, constantes:write,
   *               rendezVous, alertes:read, dossiers:read
   * PATIENT     → rendezVous:self, ordonnances:self, dossier:self
   */
  const PERMISSIONS = {
    ADMIN:       ["*"],
    MEDECIN:     ["patients:read","consultations","ordonnances","examens","transferts","rendezVous","alertes","constantes:read","dossiers"],
    CARDIOLOGUE: ["patients:read","consultations","ordonnances","examens","transferts","rendezVous","alertes","constantes:read","dossiers"],
    INFIRMIER:   ["patients:create","patients:read","constantes:write","rendezVous","alertes:read","dossiers:read"],
    PATIENT:     ["rendezVous:self","ordonnances:self","dossier:self"],
  };

  const hasPermission = (perm) => {
    if (!user) return false;
    const perms = PERMISSIONS[user.role] ?? [];
    return perms.includes("*") || perms.includes(perm) ||
      perms.some((p) => perm.startsWith(p.split(":")[0]) && p.endsWith(":*"));
  };

  // ── Route dashboard par rôle ──────────────────────────────────────────────
  const getDashboardPage = (role) => ({
    ADMIN:       "dashboard_admin",
    MEDECIN:     "dashboard_medecin",
    CARDIOLOGUE: "dashboard_medecin",
    INFIRMIER:   "dashboard_medecin",
    PATIENT:     "dashboard_patient",
  }[role] ?? "login");

  return (
    <AuthContext.Provider value={{
      user,              // UserDto : { userId, prenom, nom, email, telephone, role }
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      isRole,
      isAdmin,
      isMedecin,
      isCardiologue,
      isInfirmier,
      isPatient,
      hasPermission,
      getDashboardPage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
};