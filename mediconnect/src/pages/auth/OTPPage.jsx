import React, { useState, useRef, useEffect } from "react";
import { verifyOtp, resendOtp, resetPassword } from "../../api/auth.api";
import { useToast }                            from "../../components/toast/ToastContext";
import AuthLayout                              from "./AuthLayout";
import InputField                              from "../../components/ui/InputField";
import Btn                                     from "../../components/ui/Btn";
import Icon                                    from "../../components/ui/Icon";
import { I }                                   from "../../constants/icons";
import { C, F }                                from "../../constants/theme";

export default function OTPPage({ setPage }) {
  const toast = useToast();

  const [otp,         setOtp]         = useState(["", "", "", "", "", ""]);
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [resending,   setResending]   = useState(false);
  const [countdown,   setCountdown]   = useState(60);
  const inputRefs = useRef([]);

  const contact = localStorage.getItem("otpContact") ?? "";
  const method  = localStorage.getItem("otpMethod")  ?? "email";
  const otpType = localStorage.getItem("otpType")    ?? "reset";

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── OTP input helpers ───────────────────────────────────────────────────────
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

  // ── Vérifier OTP ────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) { toast("Veuillez saisir les 6 chiffres.", "error"); return; }

    if (otpType !== "inscription") {
      // Pour la réinitialisation, on ne vérifie pas ici — la vérification se fait lors du reset
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const payload = method === "email"
        ? { email: contact, code }
        : { telephone: contact, code };
      const res = await verifyOtp(payload);
      if (!res.success) throw new Error(res.message);

      // Compte activé — nettoyage + redirection vers login
      localStorage.removeItem("otpContact");
      localStorage.removeItem("otpMethod");
      localStorage.removeItem("otpType");
      toast("Compte activé avec succès ! Vous pouvez maintenant vous connecter.", "success");
      setTimeout(() => setPage("login"), 1200);
    } catch (err) {
      toast(err.apiMessage ?? err.message ?? "Code incorrect ou expiré.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Renvoyer OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true);
    try {
      const payload = method === "email" ? { email: contact } : { telephone: contact };
      await resendOtp(payload);
      setCountdown(60);
      toast("Code renvoyé !", "success");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors du renvoi.", "error");
    } finally {
      setResending(false);
    }
  };

  // ── Réinitialiser mot de passe ───────────────────────────────────────────────
  const handleReset = async () => {
    if (newPass.length < 8) { toast("Minimum 8 caractères.", "error"); return; }
    if (newPass !== confirmPass) { toast("Les mots de passe ne correspondent pas.", "error"); return; }
    setLoading(true);
    try {
      const code = otp.join("");
      const payload = method === "email"
        ? { email: contact, code, newPassword: newPass, confirmPassword: confirmPass }
        : { telephone: contact, code, newPassword: newPass, confirmPassword: confirmPass };
      const res = await resetPassword(payload);
      if (!res.success) throw new Error(res.message);
      localStorage.removeItem("otpContact");
      localStorage.removeItem("otpMethod");
      localStorage.removeItem("otpType");
      toast("Mot de passe réinitialisé avec succès !", "success");
      setTimeout(() => setPage("login"), 1200);
    } catch (err) {
      toast(err.apiMessage ?? err.message ?? "Erreur lors de la réinitialisation.", "error");
    } finally {
      setLoading(false);
    }
  };

  const otpComplete = otp.every((d) => d !== "");
  const passLen   = newPass.length;
  const strength  = passLen >= 12 ? "Fort" : passLen >= 8 ? "Moyen" : "Faible";
  const strengthColor = { Fort: "#17935a", Moyen: C.warning, Faible: C.danger }[strength];
  const strengthPct   = { Fort: 3, Moyen: 2, Faible: 1 }[strength];

  return (
    <AuthLayout
      title="Vérification en deux étapes"
      subtitle={step === 1 ? "Saisissez le code reçu pour confirmer votre identité." : "Créez un nouveau mot de passe sécurisé."}
    >
      {/* Barre de progression */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.8rem" }}>
        {[1, 2].map((s) => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? C.primary : C.borderLight, transition: "background .3s" }} />
        ))}
      </div>

      {/* ── ÉTAPE 1 : saisir le code ── */}
      {step === 1 && (
        <>
          <button
            onClick={() => setPage(otpType === "inscription" ? "register" : "forgot-password")}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", color: C.textMid, fontSize: "0.82rem", cursor: "pointer", marginBottom: "1.3rem" }}
          >
            <Icon d={I.arrowL} size={14} sw={2} />
            {otpType === "inscription" ? "Retour à l'inscription" : "Retour"}
          </button>

          <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text, marginBottom: "0.4rem" }}>
            {otpType === "inscription" ? "Vérification du compte" : "Saisir le code OTP"}
          </h2>
          <p style={{ color: C.textLight, fontSize: "0.83rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            {otpType === "inscription"
              ? <>Code d'activation envoyé à <strong>{contact}</strong> par {method === "email" ? "e-mail" : "SMS"}.<br />Votre compte sera activé après vérification.</>
              : <>Code à 6 chiffres envoyé à <strong>{contact}</strong> par {method === "email" ? "e-mail" : "SMS"}.<br />Expire dans <strong>10 minutes</strong>.</>
            }
          </p>

          {/* Cases OTP */}
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", marginBottom: "1.5rem" }} onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width: 52, height: 58, textAlign: "center",
                  fontSize: "1.5rem", fontWeight: 700, fontFamily: "monospace",
                  border: `2px solid ${digit ? C.primary : C.border}`,
                  borderRadius: 12, outline: "none", color: C.text,
                  background: digit ? C.primaryPale : "white",
                  transition: "all .15s",
                  boxShadow: digit ? `0 0 0 3px ${C.primary}18` : "none",
                }}
              />
            ))}
          </div>

          {/* Décompte + renvoi */}
          <div style={{ textAlign: "center", marginBottom: "1.3rem" }}>
            {countdown > 0 ? (
              <p style={{ fontSize: "0.82rem", color: C.textLight }}>
                Renvoyer dans{" "}
                <strong style={{ color: C.primary, fontFamily: "monospace" }}>
                  {String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}
                </strong>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                style={{ background: "none", border: "none", color: C.primary, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
              >
                {resending ? "Envoi en cours…" : "Renvoyer le code"}
              </button>
            )}
          </div>

          <Btn full size="lg" onClick={handleVerify} disabled={!otpComplete || loading}>
            {loading
              ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Vérification…
                </span>
              : "Vérifier le code"
            }
          </Btn>
        </>
      )}

      {/* ── ÉTAPE 2 : nouveau mot de passe ── */}
      {step === 2 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.4rem", background: "#e5f7ef", borderRadius: 12, padding: "0.7rem 1rem" }}>
            <Icon d={I.check} size={16} stroke="#17935a" sw={2.5} />
            <span style={{ fontSize: "0.82rem", color: "#17935a", fontWeight: 600 }}>Code vérifié avec succès</span>
          </div>

          <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text, marginBottom: "0.4rem" }}>
            Nouveau mot de passe
          </h2>
          <p style={{ color: C.textLight, fontSize: "0.83rem", lineHeight: 1.5, marginBottom: "1.3rem" }}>
            Minimum 8 caractères.
          </p>

          <InputField
            label="Nouveau mot de passe"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="8+ caractères"
            icon={I.lock}
            required
          />

          {/* Indicateur de force */}
          {newPass && (
            <div style={{ marginTop: "-0.6rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.25rem" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strengthPct ? strengthColor : C.bg, transition: "background .3s" }} />
                ))}
              </div>
              <span style={{ fontSize: "0.7rem", color: strengthColor, fontWeight: 600 }}>Force : {strength}</span>
            </div>
          )}

          <InputField
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            placeholder="Répétez le mot de passe"
            icon={I.lock}
            required
          />

          {confirmPass && newPass !== confirmPass && (
            <div style={{ marginBottom: "0.8rem", fontSize: "0.77rem", color: C.danger }}>
              ⚠ Les mots de passe ne correspondent pas.
            </div>
          )}

          <Btn
            full size="lg" icon={I.check}
            onClick={handleReset}
            disabled={!newPass || newPass !== confirmPass || loading}
          >
            {loading
              ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Enregistrement…
                </span>
              : "Enregistrer le nouveau mot de passe"
            }
          </Btn>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <button
          onClick={() => setPage("home")}
          style={{ background: "none", border: "none", color: C.textLight, fontSize: "0.82rem", cursor: "pointer" }}
        >
          ← Retour à l'accueil
        </button>
      </div>
    </AuthLayout>
  );
}
