import React, { useState }  from "react";
import { forgotPassword }    from "../../api/auth.api";
import { useToast }          from "../../components/toast/ToastContext";
import AuthLayout            from "./AuthLayout";
import InputField            from "../../components/ui/InputField";
import Btn                   from "../../components/ui/Btn";
import Icon                  from "../../components/ui/Icon";
import { I }                 from "../../constants/icons";
import { C, F }              from "../../constants/theme";

export default function ForgotPasswordPage({ setPage }) {
  const toast = useToast();

  const [method,  setMethod]  = useState("email");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSend = async () => {
    if (!contact.trim()) {
      toast("Veuillez renseigner votre contact.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = method === "email"
        ? { email: contact.trim() }
        : { phoneNumber: contact.trim() };

      await forgotPassword(payload);

      localStorage.setItem("otpContact", contact.trim());
      localStorage.setItem("otpMethod",  method);

      setSent(true);
      toast("Code envoyé ! Redirection…", "success");
      setTimeout(() => setPage("otp"), 1500);
    } catch (err) {
      toast(err.apiMessage ?? "Impossible d'envoyer le code. Vérifiez votre contact.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Réinitialiser votre mot de passe"
      subtitle="Recevez un code de vérification pour réinitialiser votre mot de passe."
    >
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={() => setPage("login")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", color: C.textMid, fontSize: "0.82rem", cursor: "pointer", marginBottom: "1.5rem" }}
        >
          <Icon d={I.arrowL} size={14} sw={2} /> Retour à la connexion
        </button>
        <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.6rem", color: C.text, marginBottom: "0.4rem" }}>
          Mot de passe oublié
        </h2>
        <p style={{ color: C.textLight, fontSize: "0.84rem", lineHeight: 1.6 }}>
          Choisissez comment recevoir votre code à 6 chiffres.
        </p>
      </div>

      {/* Sélection canal */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {[["email", "E-mail", I.mail], ["sms", "SMS", I.smartphone]].map(([id, label, icon]) => (
          <button
            key={id}
            onClick={() => { setMethod(id); setContact(""); }}
            style={{
              flex: 1, padding: "0.75rem 0.5rem", borderRadius: 12,
              border: `2px solid ${method === id ? C.primary : C.border}`,
              background: method === id ? C.primaryPale : "white",
              color: method === id ? C.primary : C.textMid,
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
              cursor: "pointer", transition: "all .15s",
              fontFamily: F.title, fontWeight: 600, fontSize: "0.82rem",
            }}
          >
            <Icon d={icon} size={20} stroke={method === id ? C.primary : C.textLight} sw={1.8} />
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

      <div style={{ background: C.bg, borderRadius: 12, padding: "0.85rem 1rem", marginBottom: "1.3rem", fontSize: "0.78rem", color: C.textMid, lineHeight: 1.6 }}>
        {method === "email"
          ? "Un code à 6 chiffres sera envoyé à l'adresse e-mail associée à votre compte (via Gmail)."
          : "Un SMS sera envoyé via Twilio au numéro associé à votre compte."}
      </div>

      <Btn
        full size="lg"
        onClick={handleSend}
        disabled={!contact.trim() || loading || sent}
        icon={method === "email" ? I.mail : I.smartphone}
      >
        {loading
          ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              Envoi en cours…
            </span>
          : `Envoyer le code par ${method === "email" ? "e-mail" : "SMS"}`
        }
      </Btn>

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
