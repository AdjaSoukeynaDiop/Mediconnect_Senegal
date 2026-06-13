/**
 * src/pages/auth/OTPPage.jsx
 *
 * Basé sur AuthController.java :
 *
 * ── Étape 1 : vérification du code ─────────────────────────────────────────
 *   POST /api/auth/verify-otp (public)
 *   Corps : VerifyOtpRequest — champs exacts non vus, à confirmer
 *   Réponse succès  : { success: true, message: "Code OTP vérifié… votre compte est actif." }
 *   Réponse erreur  : { success: false, message: "..." }
 *   ⚠️  Le backend NE retourne PAS de token ici (voir code source — ResponseEntity.ok(Map.of(...)))
 *       → Après vérification OTP de reset, on passe à l'étape reset-password
 *
 * ── Renvoyer le code ────────────────────────────────────────────────────────
 *   POST /api/auth/resend-otp (public)
 *   Corps : { email?, telephone? }  — l'un des deux obligatoire
 *   Réponse : { success, message }
 *
 * ── Étape 2 : nouveau mot de passe ─────────────────────────────────────────
 *   POST /api/auth/reset-password (public)
 *   Corps : ResetPasswordRequest — champs exacts non vus
 *   Réponse : { success: true, message: "Mot de passe réinitialisé avec succès" }
 *
 * Données persistées via localStorage depuis ForgotPasswordPage :
 *   otpContact : email ou telephone
 *   otpMethod  : "email" | "sms"
 */

import React, { useState, useRef, useEffect } from "react";
import { verifyOtp, resendOtp, resetPassword } from "../../api/auth.api";
import AuthLayout  from "./AuthLayout";
import InputField  from "../../components/ui/InputField";
import Btn         from "../../components/ui/Btn";
import { I }       from "../../constants/icons";
import { C, F }    from "../../constants/theme";

export default function OTPPage({ setPage }) {
  const [otp, setOtp]             = useState(["","","","","",""]);
  const [newPass, setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [step, setStep]           = useState(1);      // 1 = code, 2 = nouveau mdp
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [error, setError]         = useState(null);
  const inputRefs                 = useRef([]);

  const contact = localStorage.getItem("otpContact") ?? "";
  const method  = localStorage.getItem("otpMethod")  ?? "email";

  // Décompte renvoi
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Gestion saisie OTP
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };
  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      inputRefs.current[idx - 1]?.focus();
  };
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  // ── Vérifier OTP ───────────────────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Veuillez saisir les 6 chiffres."); return; }
    setError(null);
    setLoading(true);
    try {
      // ⚠️  Adapter selon VerifyOtpRequest.java réel
      // Hypothèse basée sur le code OTP envoyé par email ou SMS
      const payload = method === "email"
        ? { email: contact, code }
        : { telephone: contact, code };

      const res = await verifyOtp(payload);

      if (!res.success) throw new Error(res.message);
      // Succès → passer à la saisie du nouveau mot de passe
      setStep(2);
    } catch (err) {
      setError(err.apiMessage ?? err.message ?? "Code incorrect ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  // ── Renvoyer OTP ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true); setError(null); setCountdown(60);
    try {
      const payload = method === "email"
        ? { email: contact }
        : { telephone: contact };
      await resendOtp(payload);
    } catch (err) {
      setError(err.apiMessage ?? "Erreur lors du renvoi.");
    } finally {
      setResending(false);
    }
  };

  // ── Réinitialiser le mot de passe ──────────────────────────────────────────
  const handleReset = async () => {
    if (newPass.length < 8) { setError("Minimum 8 caractères."); return; }
    if (newPass !== confirmPass) { setError("Les mots de passe ne correspondent pas."); return; }
    setError(null);
    setLoading(true);
    try {
      // ⚠️  Adapter selon ResetPasswordRequest.java réel
      // Hypothèse : { email (ou token), newPassword, confirmPassword }
      const otpCode = otp.join("");
      const payload = method === "email"
        ? { email: contact, code: otpCode, newPassword: newPass, confirmPassword: confirmPass }
        : { telephone: contact, code: otpCode, newPassword: newPass, confirmPassword: confirmPass };

      const res = await resetPassword(payload);
      if (!res.success) throw new Error(res.message);

      // Nettoyage localStorage
      localStorage.removeItem("otpContact");
      localStorage.removeItem("otpMethod");

      setPage("login");
    } catch (err) {
      setError(err.apiMessage ?? err.message ?? "Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  const otpComplete = otp.every((d) => d !== "");
  const passLen = newPass.length;
  const strength = passLen >= 12 ? "Fort" : passLen >= 8 ? "Moyen" : "Faible";
  const strengthColor = { Fort:"#17935a", Moyen:C.warning, Faible:C.danger }[strength];
  const strengthPct   = { Fort:3, Moyen:2, Faible:1 }[strength];

  return (
    <AuthLayout
      title="Vérification en deux étapes"
      subtitle={step === 1 ? "Saisissez le code reçu." : "Créez votre nouveau mot de passe."}
    >
      {/* Barre de progression */}
      <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1.8rem" }}>
        {[1,2].map((s) => (
          <div key={s} style={{ flex:1, height:3, borderRadius:2, background:s<=step?C.primary:C.borderLight, transition:"background .3s" }} />
        ))}
      </div>

      {/* ── ÉTAPE 1 : saisir le code ── */}
      {step === 1 && (
        <>
          <button
            onClick={() => setPage("forgot-password")}
            style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", background:"none", border:"none", color:C.textMid, fontSize:"0.82rem", cursor:"pointer", marginBottom:"1.3rem" }}
          >
            ← Retour
          </button>

          <h2 style={{ fontFamily:F.title, fontWeight:800, fontSize:"1.5rem", color:C.text, marginBottom:"0.4rem" }}>
            Saisir le code OTP
          </h2>
          <p style={{ color:C.textLight, fontSize:"0.83rem", lineHeight:1.6, marginBottom:"1.5rem" }}>
            Code à 6 chiffres envoyé à <strong>{contact}</strong> par {method === "email" ? "e-mail" : "SMS (Twilio)"}.
            <br />Expire dans <strong>10 minutes</strong>.
          </p>

          {/* Cases OTP */}
          <div style={{ display:"flex", gap:"0.6rem", justifyContent:"center", marginBottom:"1.5rem" }} onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width:52, height:58, textAlign:"center",
                  fontSize:"1.5rem", fontWeight:700, fontFamily:"monospace",
                  border:`2px solid ${digit ? C.primary : C.border}`,
                  borderRadius:12, outline:"none", color:C.text,
                  background:digit ? C.primaryPale : "white",
                  transition:"all .15s",
                  boxShadow: digit ? `0 0 0 3px ${C.primary}18` : "none",
                }}
              />
            ))}
          </div>

          {/* Décompte + renvoi */}
          <div style={{ textAlign:"center", marginBottom:"1.3rem" }}>
            {countdown > 0 ? (
              <p style={{ fontSize:"0.82rem", color:C.textLight }}>
                Renvoyer dans{" "}
                <strong style={{ color:C.primary, fontFamily:"monospace" }}>
                  {String(Math.floor(countdown / 60)).padStart(2,"0")}:{String(countdown % 60).padStart(2,"0")}
                </strong>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                style={{ background:"none", border:"none", color:C.primary, fontSize:"0.82rem", fontWeight:600, cursor:"pointer" }}
              >
                {resending ? "Envoi en cours…" : "Renvoyer le code"}
              </button>
            )}
          </div>

          {error && (
            <div style={{ marginBottom:"0.9rem", padding:"0.65rem 0.9rem", background:"#fdeaea", border:"1px solid #f5bcbc", borderRadius:10, fontSize:"0.78rem", color:C.danger }}>
              {error}
            </div>
          )}

          <Btn full size="lg" onClick={handleVerify} disabled={!otpComplete || loading}>
            {loading ? "Vérification…" : "Vérifier le code"}
          </Btn>
        </>
      )}

      {/* ── ÉTAPE 2 : nouveau mot de passe ── */}
      {step === 2 && (
        <>
          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"1.4rem", background:"#e5f7ef", borderRadius:12, padding:"0.7rem 1rem" }}>
            <span style={{ fontSize:"0.82rem", color:"#17935a", fontWeight:600 }}>✓ Code vérifié avec succès</span>
          </div>

          <h2 style={{ fontFamily:F.title, fontWeight:800, fontSize:"1.5rem", color:C.text, marginBottom:"0.4rem" }}>
            Nouveau mot de passe
          </h2>
          <p style={{ color:C.textLight, fontSize:"0.83rem", lineHeight:1.5, marginBottom:"1.3rem" }}>
            Minimum 8 caractères.
          </p>

          <InputField
            label="Nouveau mot de passe"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="••••••••"
            icon={I.lock}
            required
          />

          {/* Indicateur de force */}
          {newPass && (
            <div style={{ marginTop:"-0.6rem", marginBottom:"1rem" }}>
              <div style={{ display:"flex", gap:"0.3rem", marginBottom:"0.25rem" }}>
                {[1,2,3].map((i) => (
                  <div key={i} style={{ flex:1, height:4, borderRadius:2, background:i<=strengthPct?strengthColor:C.bg, transition:"background .3s" }} />
                ))}
              </div>
              <span style={{ fontSize:"0.7rem", color:strengthColor, fontWeight:600 }}>{strength}</span>
            </div>
          )}

          <InputField
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            placeholder="••••••••"
            icon={I.lock}
            required
          />

          {confirmPass && newPass !== confirmPass && (
            <div style={{ marginBottom:"0.8rem", fontSize:"0.77rem", color:C.danger }}>
              ⚠ Les mots de passe ne correspondent pas.
            </div>
          )}

          {error && (
            <div style={{ marginBottom:"0.9rem", padding:"0.65rem 0.9rem", background:"#fdeaea", border:"1px solid #f5bcbc", borderRadius:10, fontSize:"0.78rem", color:C.danger }}>
              {error}
            </div>
          )}

          <Btn
            full size="lg"
            onClick={handleReset}
            disabled={!newPass || newPass !== confirmPass || loading}
          >
            {loading ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
          </Btn>
        </>
      )}

      <div style={{ textAlign:"center", marginTop:"1rem" }}>
        <button onClick={() => setPage("home")} style={{ background:"none", border:"none", color:C.textLight, fontSize:"0.82rem", cursor:"pointer" }}>
          ← Retour à l'accueil
        </button>
      </div>
    </AuthLayout>
  );
}
