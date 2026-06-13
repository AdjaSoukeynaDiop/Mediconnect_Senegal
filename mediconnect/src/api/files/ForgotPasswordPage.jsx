/**
 * src/pages/auth/ForgotPasswordPage.jsx
 *
 * Basé sur AuthController.java :
 *   POST /api/auth/forgot-password (public)
 *   Corps : ForgotPasswordRequest
 *   Réponse : { success: true, message: "Un email de réinitialisation a été envoyé à votre adresse" }
 *
 * ⚠️  IMPORTANT — champs exacts de ForgotPasswordRequest.java non vus.
 *     Le message de succès dit "email" → probablement { email: string }
 *     Mais la présence de SmsService + CanalOtp.java suggère qu'un canal SMS
 *     existe aussi. À CONFIRMER avec ForgotPasswordRequest.java.
 *
 * Ce composant propose les deux canaux et stocke le choix pour OTPPage.
 * Si ForgotPasswordRequest n'a qu'un champ "email" → simplifier en retirant SMS.
 */

import React, { useState } from "react";
import { forgotPassword }  from "../../api/auth.api";
import AuthLayout          from "./AuthLayout";
import InputField          from "../../components/ui/InputField";
import Btn                 from "../../components/ui/Btn";
import { I }               from "../../constants/icons";
import { C, F }            from "../../constants/theme";

export default function ForgotPasswordPage({ setPage }) {
  const [method, setMethod]   = useState("email");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [sent, setSent]       = useState(false);

  const handleSend = async () => {
    if (!contact.trim()) { setError("Veuillez renseigner votre contact."); return; }
    setError(null);
    setLoading(true);
    try {
      // ⚠️ Adapter le payload selon ForgotPasswordRequest.java réel
      // Hypothèse : { email } ou { email, telephone, canal }
      const payload = method === "email"
        ? { email: contact.trim() }
        : { telephone: contact.trim() };

      await forgotPassword(payload);

      // Stocker pour OTPPage
      localStorage.setItem("otpContact",  contact.trim());
      localStorage.setItem("otpMethod",   method);           // "email" | "sms"

      setSent(true);
      setTimeout(() => setPage("otp"), 1500);
    } catch (err) {
      setError(err.apiMessage ?? "Impossible d'envoyer le code. Vérifiez votre contact.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Réinitialiser votre mot de passe"
      subtitle="Recevez un code de vérification pour réinitialiser votre mot de passe."
    >
      <button
        onClick={() => setPage("login")}
        style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem", background:"none", border:"none", color:C.textMid, fontSize:"0.82rem", cursor:"pointer", marginBottom:"1.5rem" }}
      >
        ← Retour à la connexion
      </button>

      <h2 style={{ fontFamily:F.title, fontWeight:800, fontSize:"1.6rem", color:C.text, marginBottom:"0.4rem" }}>
        Mot de passe oublié
      </h2>
      <p style={{ color:C.textLight, fontSize:"0.84rem", lineHeight:1.6, marginBottom:"1.5rem" }}>
        Choisissez comment recevoir votre code à 6 chiffres.
      </p>

      {/* Sélection canal */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem" }}>
        {[["email","E-mail",I.mail],["sms","SMS",I.smartphone]].map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => { setMethod(id); setContact(""); setError(null); }}
            style={{
              flex:1, padding:"0.8rem 0.5rem", borderRadius:12,
              border:`2px solid ${method===id ? C.primary : C.border}`,
              background: method===id ? C.primaryPale : "white",
              color: method===id ? C.primary : C.textMid,
              display:"flex", flexDirection:"column", alignItems:"center", gap:"0.4rem",
              cursor:"pointer", fontFamily:F.title, fontWeight:600, fontSize:"0.82rem",
              transition:"all .15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {method === "email" ? (
        <InputField
          label="Adresse e-mail"
          type="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="vous@exemple.sn"
          icon={I.mail}
          required
        />
      ) : (
        <InputField
          label="Numéro de téléphone"
          type="tel"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="+221 77 000 00 00"
          icon={I.smartphone}
          required
        />
      )}

      {error && (
        <div style={{ marginBottom:"0.9rem", padding:"0.65rem 0.9rem", background:"#fdeaea", border:"1px solid #f5bcbc", borderRadius:10, fontSize:"0.78rem", color:C.danger }}>
          {error}
        </div>
      )}

      {sent && (
        <div style={{ marginBottom:"0.9rem", padding:"0.65rem 0.9rem", background:"#e5f7ef", border:"1px solid #b2e8ce", borderRadius:10, fontSize:"0.78rem", color:"#17935a" }}>
          ✓ Code envoyé ! Redirection en cours…
        </div>
      )}

      <div style={{ background:C.bg, borderRadius:12, padding:"0.75rem 0.9rem", marginBottom:"1.2rem", fontSize:"0.77rem", color:C.textMid, lineHeight:1.6 }}>
        {method === "email"
          ? "Un code de réinitialisation sera envoyé à votre adresse e-mail via le serveur SMTP Gmail (mediconnectsn@gmail.com)."
          : "Un SMS sera envoyé via Twilio au numéro associé à votre compte."}
      </div>

      <Btn full size="lg" onClick={handleSend} disabled={!contact.trim() || loading || sent}>
        {loading
          ? "Envoi…"
          : `Envoyer le code par ${method === "email" ? "e-mail" : "SMS"}`
        }
      </Btn>

      <div style={{ textAlign:"center", marginTop:"1rem" }}>
        <button onClick={() => setPage("home")} style={{ background:"none", border:"none", color:C.textLight, fontSize:"0.82rem", cursor:"pointer" }}>
          ← Retour à l'accueil
        </button>
      </div>
    </AuthLayout>
  );
}
