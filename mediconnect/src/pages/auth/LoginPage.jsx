import React, { useState }  from "react";
import { login as apiLogin } from "../../api/auth.api";
import { useAuth }           from "../../api/AuthContext";
import { useToast }          from "../../components/toast/ToastContext";
import AuthLayout            from "./AuthLayout";
import InputField            from "../../components/ui/InputField";
import Btn                   from "../../components/ui/Btn";
import Icon                  from "../../components/ui/Icon";
import { I }                 from "../../constants/icons";
import { C, F }              from "../../constants/theme";

export default function LoginPage({ setPage }) {
  const { login, getDashboardPage } = useAuth();
  const toast = useToast();

  const [credential, setCredential] = useState("");
  const [pass,       setPass]       = useState("");
  const [loading,    setLoading]    = useState(false);

  const handleLogin = async () => {
    if (!credential.trim() || !pass) {
      toast("Veuillez remplir tous les champs.", "error");
      return;
    }
    setLoading(true);
    try {
      const isPhone = !credential.includes("@");
      const res = await apiLogin({
        email:       isPhone ? null : credential.trim(),
        phoneNumber: isPhone ? credential.trim() : null,
        password:    pass,
      });
      if (!res.success) throw new Error(res.message ?? "Identifiants incorrects.");
      login(res.data.token, res.data.user);
      setPage(getDashboardPage(res.data.user.role));
    } catch (err) {
      const msg = err.apiMessage ?? err.message ?? "Identifiants incorrects. Veuillez réessayer.";
      if (msg.includes("COMPTE_EN_ATTENTE_VALIDATION")) {
        toast("Votre dossier est en cours d'examen par l'administration. Vous serez notifié par email une fois votre profil vérifié.", "warning");
      } else {
        toast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Votre santé, notre priorité"
      subtitle="Connectez-vous à votre espace personnel sécurisé."
    >
      <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.6rem", color: C.text, marginBottom: "0.3rem" }}>
        Connexion
      </h2>
      <p style={{ color: C.textLight, fontSize: "0.85rem", marginBottom: "1.6rem" }}>
        Pas encore inscrit ?{" "}
        <button
          onClick={() => setPage("register")}
          style={{ background: "none", border: "none", color: C.primary, fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}
        >
          Créer un compte
        </button>
      </p>

      <InputField
        label="E-mail ou téléphone"
        type="text"
        value={credential}
        onChange={(e) => setCredential(e.target.value)}
        placeholder="vous@exemple.sn ou +221 77 000 00 00"
        icon={I.mail}
        required
      />
      <InputField
        label="Mot de passe"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder="••••••••"
        icon={I.lock}
        required
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.2rem" }}>
        <button
          onClick={() => setPage("forgot-password")}
          style={{ background: "none", border: "none", color: C.primary, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
        >
          Mot de passe oublié ?
        </button>
      </div>

      <div style={{ background: `${C.primary}10`, border: `1px solid ${C.primary}30`, borderRadius: 10, padding: "0.7rem 1rem", marginBottom: "1.2rem", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
        <Icon d={I.shield} size={15} stroke={C.primary} sw={1.8} />
        <span style={{ fontSize: "0.77rem", color: C.primaryDark, lineHeight: 1.5 }}>
          Connexion sécurisée — vous serez redirigé vers votre espace automatiquement.
        </span>
      </div>

      <Btn full size="lg" onClick={handleLogin} disabled={loading || !credential.trim() || !pass} style={{ marginBottom: "1rem" }}>
        {loading
          ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              Connexion…
            </span>
          : "Se connecter"
        }
      </Btn>

      <div style={{ textAlign: "center" }}>
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
