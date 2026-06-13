/**
 * src/api/auth.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API complète + AuthController.java + SecurityConfig
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ENDPOINT                   REQUÊTE              RÉPONSE                │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  POST /api/auth/register    RegisterRequest      RegisterResponse        │
 * │  POST /api/auth/verify-otp  VerifyOtpRequest     ResponseEntity          │
 * │  POST /api/auth/resend-otp  ResendOtpRequest     AuthenticationResponse  │
 * │  POST /api/auth/login       LoginRequest         AuthenticationResponse  │
 * │  POST /api/auth/forgot-pwd  ForgotPasswordReq    ResponseEntity          │
 * │  POST /api/auth/reset-pwd   ResetPasswordReq     ResponseEntity          │
 * │  POST /api/auth/change-pwd  ChangePasswordReq    ResponseEntity          │
 * │  GET  /api/auth/current-usr (token)              ResponseEntity          │
 * │  GET  /api/auth/users       (token)              ResponseEntity          │
 * │  POST /api/auth/logout      (Authorization hdr)  ResponseEntity          │
 * │  GET  /api/auth/validate    (token)              ResponseEntity          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * LoginRequest      : { email, phoneNumber, password }
 * ForgotPasswordReq : { email, phoneNumber }
 * ResetPasswordReq  : { token, newPassword }
 * VerifyOtpRequest  : { email, telephone, code }
 * ResendOtpRequest  : { email, telephone }
 * ChangePasswordReq : { oldPassword, newPassword, confirmPassword }
 *
 * AuthenticationResponse : { token, refreshToken, user: UserDto }
 * UserDto : { userId, prenom, nom, email, telephone, role }
 *
 * RegisterResponse  : { userId, message, email, nom, prenom, role, telephone,
 *                       token, createdAt, otpEnvoye }
 */

import client from "./client";

// ── Register ──────────────────────────────────────────────────────────────────
/**
 * RegisterRequest (tous champs, certains optionnels selon le rôle) :
 *   role, nom, prenom, email, telephone, motDePasse,
 *   numOrdre (médecin), section (médecin), specialite (médecin),
 *   etablissement (médecin), dateNaissance, sexe, groupeSanguin,
 *   adresse, assurance, serviceAffecte (infirmier), hopital (infirmier)
 */
export const register = async (payload) => {
  const { data } = await client.post("/api/auth/register", payload);
  return data; // { success, message, data: RegisterResponse }
};

// ── Vérifier OTP ──────────────────────────────────────────────────────────────
/**
 * VerifyOtpRequest : { email, telephone, code }
 * L'un des deux (email ou telephone) suffit selon le canal d'envoi
 */
export const verifyOtp = async ({ email, telephone, code }) => {
  const { data } = await client.post("/api/auth/verify-otp", {
    email,
    telephone,
    code,
  });
  return data; // { success, message }
};

// ── Renvoyer OTP ──────────────────────────────────────────────────────────────
/**
 * ResendOtpRequest : { email, telephone }
 * Retourne AuthenticationResponse (selon doc) mais probablement { success, message }
 */
export const resendOtp = async ({ email, telephone }) => {
  const { data } = await client.post("/api/auth/resend-otp", {
    email,
    telephone,
  });
  return data;
};

// ── Login ─────────────────────────────────────────────────────────────────────
/**
 * LoginRequest : { email, phoneNumber, password }
 * email OU phoneNumber — l'un des deux suffit (findByEmailOrTelephone côté serveur)
 * Retour : { success, message, data: AuthenticationResponse }
 * AuthenticationResponse : { token, refreshToken, user: UserDto }
 */
export const login = async ({ email, phoneNumber, password }) => {
  const { data } = await client.post("/api/auth/login", {
    email:       email       || null,
    phoneNumber: phoneNumber || null,
    password,
  });
  if (data.success && data.data?.token) {
    localStorage.setItem("accessToken",  data.data.token);
    if (data.data.refreshToken)
      localStorage.setItem("refreshToken", data.data.refreshToken);
  }
  return data; // { success, message, data: AuthenticationResponse }
};

// ── Mot de passe oublié ───────────────────────────────────────────────────────
/**
 * ForgotPasswordRequest : { email, phoneNumber }
 * Retour : { success, message }
 * Le backend envoie un email (EmailService) ou SMS (SmsService) selon ce qui est fourni
 */
export const forgotPassword = async ({ email, phoneNumber }) => {
  const { data } = await client.post("/api/auth/forgot-password", {
    email:       email       || null,
    phoneNumber: phoneNumber || null,
  });
  return data; // { success, message }
};

// ── Réinitialiser le mot de passe ─────────────────────────────────────────────
/**
 * ResetPasswordRequest : { token, newPassword }
 * Le token vient du lien/OTP envoyé par email ou SMS
 */
export const resetPassword = async ({ token, newPassword }) => {
  const { data } = await client.post("/api/auth/reset-password", {
    token,
    newPassword,
  });
  return data; // { success, message }
};

// ── Changer le mot de passe (utilisateur connecté) ────────────────────────────
/**
 * ChangePasswordRequest : { oldPassword, newPassword, confirmPassword }
 * L'ID utilisateur est extrait du JWT côté serveur (@AuthenticationPrincipal)
 */
export const changePassword = async ({ oldPassword, newPassword, confirmPassword }) => {
  const { data } = await client.post("/api/auth/change-password", {
    oldPassword,
    newPassword,
    confirmPassword,
  });
  return data; // { success, message }
};

// ── Utilisateur courant ───────────────────────────────────────────────────────
/**
 * GET /api/auth/current-user (token requis)
 * Retour : { success, data: UserDto }
 * UserDto : { userId, prenom, nom, email, telephone, role }
 */
export const getCurrentUser = async () => {
  const { data } = await client.get("/api/auth/current-user");
  return data;
};

// ── Lister les utilisateurs (admin) ──────────────────────────────────────────
export const getAllUsers = async () => {
  const { data } = await client.get("/api/auth/users");
  return data;
};

// ── Logout ────────────────────────────────────────────────────────────────────
/**
 * POST /api/auth/logout
 * Le backend lit @RequestHeader("Authorization") et blackliste le token
 */
export const logout = async () => {
  const token = localStorage.getItem("accessToken");
  try {
    if (token) {
      await client.post("/api/auth/logout");
    }
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
};

// ── Valider le token ──────────────────────────────────────────────────────────
export const validateToken = async () => {
  const { data } = await client.get("/api/auth/validate-token");
  return data; // { success, valid: boolean }
};