// ─────────────────────────────────────────────
//  main.jsx  —  Point d'entrée & routeur React
//  MediConnect Sénégal
// ─────────────────────────────────────────────

import React from "react";
import {
  BrowserRouter, Routes, Route, Navigate, useNavigate,
} from "react-router-dom";

import { globalCSS, C } from "./constants/theme.js";

// ── Contextes ──────────────────────────────────
import ToastContext     from "./components/toast/ToastContext.jsx";
import { AuthProvider, useAuth } from "./api/AuthContext.jsx";

// ── Pages publiques ────────────────────────────
import { Navbar, LandingPage } from "./pages/LandingPage.jsx";

// ── Flux d'authentification ────────────────────
import LoginPage          from "./pages/auth/LoginPage.jsx";
import RegisterPage       from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import OTPPage            from "./pages/auth/OTPPage.jsx";

// ── Dashboards par rôle ────────────────────────
import PatientDashboard   from "./dashboards/PatientDashboard.jsx";
import MedecinDashboard   from "./dashboards/MedecinDashboard.jsx";
import AdminDashboard     from "./dashboards/AdminDashboard.jsx";
import AssistantDashboard from "./dashboards/AssistantDashboard.jsx";

// ── Pages d'erreur ─────────────────────────────
import NotFoundPage      from "./pages/NotFoundPage.jsx";
import UnauthorizedPage  from "./pages/UnauthorizedPage.jsx";

// ─────────────────────────────────────────────────────────────────────────────
//  Mapping backward-compat : setPage("dashboard_medecin") → navigate("/...")
//  Permet de garder les pages auth/dashboards existants sans modification.
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_TO_PATH = {
  "home":              "/",
  "login":             "/login",
  "register":          "/register",
  "forgot-password":   "/forgot-password",
  "otp":               "/otp",
  "dashboard_medecin":    "/dashboard/medecin",
  "dashboard_patient":    "/dashboard/patient",
  "dashboard_admin":      "/dashboard/admin",
  "dashboard_assistant":  "/dashboard/assistant",
  "unauthorized":      "/unauthorized",
};

// Rôle → chemin dashboard (pour redirection PublicRoute)
const ROLE_DASHBOARD = {
  ADMIN:       "/dashboard/admin",
  MEDECIN:     "/dashboard/medecin",
  CARDIOLOGUE: "/dashboard/medecin",
  INFIRMIER:   "/dashboard/medecin",
  ASSISTANT:   "/dashboard/assistant",
  PATIENT:     "/dashboard/patient",
};

// ── Hook : adapte setPage(name) en navigate(path) ────────────────────────────
const useSetPage = () => {
  const navigate = useNavigate();
  return (pageOrPath) => navigate(PAGE_TO_PATH[pageOrPath] ?? pageOrPath);
};

// ── Écran de chargement (vérification JWT initiale) ──────────────────────────
const LoadingScreen = () => (
  <div style={{
    height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "white",
  }}>
    <span style={{
      width: 36, height: 36, borderRadius: "50%",
      border: `3px solid ${C.border}`,
      borderTopColor: C.primary,
      animation: "spin 0.8s linear infinite",
      display: "inline-block",
    }} />
  </div>
);

// ── PublicRoute : redirige vers le dashboard si déjà connecté ────────────────
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) {
    return <Navigate to={ROLE_DASHBOARD[user?.role] ?? "/"} replace />;
  }
  return children;
};

// ── PrivateRoute : redirige vers /login si non connecté ──────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// ── RoleRoute : PrivateRoute + vérification du rôle ──────────────────────────
const RoleRoute = ({ roles = [], children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
};

// ── Arbre de routes ───────────────────────────────────────────────────────────
function AppRoutes() {
  const setPage = useSetPage();

  return (
    <Routes>
      {/* ── Page d'accueil (publique) ──────────────────────────────────────── */}
      <Route
        path="/"
        element={
          <>
            <Navbar setPage={setPage} />
            <LandingPage setPage={setPage} />
          </>
        }
      />

      {/* ── Pages d'authentification (redirigent si déjà connecté) ─────────── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage setPage={setPage} />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage setPage={setPage} />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage setPage={setPage} />
          </PublicRoute>
        }
      />
      <Route
        path="/otp"
        element={
          <PublicRoute>
            <OTPPage setPage={setPage} />
          </PublicRoute>
        }
      />

      {/* ── Dashboards protégés ────────────────────────────────────────────── */}
      <Route
        path="/dashboard/medecin"
        element={
          <RoleRoute roles={["MEDECIN", "CARDIOLOGUE", "INFIRMIER"]}>
            <MedecinDashboard setPage={setPage} />
          </RoleRoute>
        }
      />
      <Route
        path="/dashboard/patient"
        element={
          <RoleRoute roles={["PATIENT"]}>
            <PatientDashboard setPage={setPage} />
          </RoleRoute>
        }
      />
      <Route
        path="/dashboard/admin"
        element={
          <RoleRoute roles={["ADMIN"]}>
            <AdminDashboard setPage={setPage} />
          </RoleRoute>
        }
      />
      <Route
        path="/dashboard/assistant"
        element={
          <RoleRoute roles={["ASSISTANT"]}>
            <AssistantDashboard setPage={setPage} />
          </RoleRoute>
        }
      />

      {/* ── Pages d'erreur ─────────────────────────────────────────────────── */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*"             element={<NotFoundPage />} />
    </Routes>
  );
}

// ── App root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <style>{globalCSS}</style>
      <BrowserRouter>
        <ToastContext>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastContext>
      </BrowserRouter>
    </>
  );
}
