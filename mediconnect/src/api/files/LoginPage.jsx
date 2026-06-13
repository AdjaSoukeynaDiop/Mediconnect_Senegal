/**
 * src/pages/auth/LoginPage.jsx
 *
 * Basé sur AuthController.java :
 *  POST /api/auth/login (public)
 *  Corps : LoginRequest — champs exacts à confirmer, probablement { email, password }
 *          (UserDetailsService fait findByEmailOrTelephone, donc email OU telephone)
 *
 * Réponse succès  : { success: true,  message: "Connexion réussie",
 *                     data: { token, refreshToken, user: UserDto } }
 * Réponse erreur  : { success: false, message: "..." }
 *
 * Règle métier confirmée dans PatientController :
 *   → Patient NE peut PAS s'inscrire lui-même
 *   → Son compte est créé par l'INFIRMIER via POST /api/patients
 *   → Il reçoit un mot de passe temporaire (CreatePatientResponse)
 *
 * Rôles disponibles (tirés de SecurityConfig et controllers) :
 *   PATIENT | MEDECIN | INFIRMIER | ADMIN | CARDIOLOGUE
 */

import React, { useState } from "react";
import { useAuth }         from "../../context/AuthContext";
import AuthLayout          from "./AuthLayout";
import InputField          from "../../components/ui/InputField";
import Btn                 from "../../components/ui/Btn";
import { I }               from "../../constants/icons";
import { C, F }            from "../../constants/theme";

export default function LoginPage({ setPage }) {
  const { login, getDashboardPage } = useAuth();

  const [role, setRole]       = useState("patient");
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !pass) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // LoginRequest : { email (ou telephone), password }
      // Le backend findByEmailOrTelephone → les deux fonctionnent
      const authResponse = await login({ email: email.trim(), password: pass });
      // authResponse = AuthenticationResponse : { token, refreshToken, user: UserDto }
      // user.role = "PATIENT" | "MEDECIN" | "INFIRMIER" | "ADMIN" | "CARDIOLOGUE"
      const page = getDashboardPage(authResponse.user?.role);
      setPage(page);
    } catch (err) {
      setError(err.message ?? "Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "patient",     label: "Patient",       icon: I.user },
    { id: "medecin",     label: "Médecin",        icon: I.activity },
    { id: "infirmier",   label: "Infirmier(e)",   icon: I.heart },
    { id: "admin",       label: "Admin",          icon: I.shield },
  ];

  return (
    <AuthLayout
      title="Votre santé, notre priorité"
      subtitle="Connectez-vous à votre espace personnel sécurisé."
    >
      <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.6rem", color: C.text, marginBottom: "0.3rem" }}>
        Connexion
      </h2>

      {/* Encart patient – compte créé par l'infirmier (règle métier réelle) */}
      {role === "patient" && (
        <div style={{ background: C.primaryPale, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "0.65rem 0.9rem", marginBottom: "1rem", fontSize: "0.77rem", color: C.textMid, lineHeight: 1.5 }}>
          <strong style={{ color: C.primaryDark }}>Patients :</strong> votre compte est créé par l'infirmier de votre établissement.
          Utilisez le mot de passe temporaire reçu lors de votre inscription.
          Vous pourrez le changer via <em>Mot de passe oublié</em>.
        </div>
      )}

      {/* Sélecteur de rôle (visuel uniquement — le backend détermine le vrai rôle) */}
      <div style={{ display: "flex", gap: "0.22rem", background: C.bg, borderRadius: 12, padding: "0.28rem", marginBottom: "1.5rem" }}>
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => { setRole(r.id); setError(null); }}
            style={{
              flex: 1, padding: "0.5rem", borderRadius: 9, border: "none",
              background: role === r.id ? "white" : "transparent",
              color:      role === r.id ? C.primary : C.textLight,
              fontWeight: role === r.id ? 700 : 500, fontSize: "0.74rem",
              boxShadow:  role === r.id ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all .15s", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
              fontFamily: F.title,
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Champ email OU telephone (findByEmailOrTelephone côté serveur) */}
      <InputField
        label="E-mail ou téléphone"
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
      />

      {/* Erreur API */}
      {error && (
        <div style={{ marginBottom: "0.9rem", padding: "0.65rem 0.9rem", background: "#fdeaea", border: "1px solid #f5bcbc", borderRadius: 10, fontSize: "0.78rem", color: C.danger }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.2rem" }}>
        <button
          onClick={() => setPage("forgot-password")}
          style={{ background: "none", border: "none", color: C.primary, fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
        >
          Mot de passe oublié ?
        </button>
      </div>

      <Btn full size="lg" onClick={handleLogin} disabled={loading || !email || !pass}>
        {loading
          ? <span style={{ display:"inline-flex", alignItems:"center", gap:"0.5rem" }}>
              <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }} />
              Connexion…
            </span>
          : "Se connecter"
        }
      </Btn>

      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <button onClick={() => setPage("home")} style={{ background: "none", border: "none", color: C.textLight, fontSize: "0.82rem", cursor: "pointer" }}>
          ← Retour à l'accueil
        </button>
      </div>
    </AuthLayout>
  );
}
