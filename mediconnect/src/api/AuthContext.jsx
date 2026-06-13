import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from "react";
import { logout as apiLogout, getCurrentUser } from "./auth.api";

export const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [token,     setToken]     = useState(() => localStorage.getItem("accessToken"));
  const [isLoading, setIsLoading] = useState(true);

  // Vérifie le token stocké au démarrage
  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem("accessToken");
      if (!stored) { setIsLoading(false); return; }
      try {
        const res = await getCurrentUser();
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          localStorage.removeItem("accessToken");
          setToken(null);
        }
      } catch {
        localStorage.removeItem("accessToken");
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Écoute l'événement 401 émis par l'intercepteur axios
  useEffect(() => {
    const handle = () => { setUser(null); setToken(null); };
    window.addEventListener("auth:logout", handle);
    return () => window.removeEventListener("auth:logout", handle);
  }, []);

  /**
   * login(token, user) — appelé par les pages auth après succès API
   * Stocke le token dans localStorage et met à jour l'état React.
   */
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem("accessToken", newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setToken(null);
  }, []);

  // ── Helpers rôle ─────────────────────────────────────────────────────────────
  const isRole        = (r) => user?.role === r;
  const isAdmin       = () => isRole("ADMIN");
  const isMedecin     = () => isRole("MEDECIN");
  const isCardiologue = () => isRole("CARDIOLOGUE");
  const isInfirmier   = () => isRole("INFIRMIER");
  const isPatient     = () => isRole("PATIENT");

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

  const getDashboardPage = (role) => ({
    ADMIN:       "dashboard_admin",
    MEDECIN:     "dashboard_medecin",
    CARDIOLOGUE: "dashboard_medecin",
    INFIRMIER:   "dashboard_medecin",
    ASSISTANT:   "dashboard_assistant",
    PATIENT:     "dashboard_patient",
  }[role] ?? "login");

  return (
    <AuthCtx.Provider value={{
      user,
      token,
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
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
};
