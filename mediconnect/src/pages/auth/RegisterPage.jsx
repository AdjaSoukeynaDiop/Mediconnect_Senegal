import React, { useState, useEffect } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import { register } from "../../api/auth.api.js";
import { getHopitaux } from "../../api/hopitaux.api.js";
import { lookupOrdre } from "../../api/ordre.api.js";
import { useToast } from "../../components/toast/ToastContext.jsx";
import AuthLayout from "./AuthLayout.jsx";
import Btn from "../../components/ui/Btn.jsx";
import InputField from "../../components/ui/InputField.jsx";
import Icon from "../../components/ui/Icon.jsx";
import SearchableSelect from "../../components/ui/SearchableSelect.jsx";

// Toutes les 14 régions du Sénégal avec leurs départements et communes
const GEO = {
  "Dakar": {
    "Dakar":      ["Plateau", "Médina", "Grand Dakar", "Parcelles Assainies"],
    "Guédiawaye": ["Golf Sud", "Sam Notaire", "Ndiarème Limamoulaye"],
    "Pikine":     ["Pikine Ouest", "Thiaroye", "Yeumbeul"],
    "Rufisque":   ["Rufisque Est", "Bargny", "Diamniadio"],
  },
  "Thiès": {
    "Thiès":     ["Thiès Nord", "Thiès Est", "Thiès Ouest"],
    "Mbour":     ["Saly", "Joal-Fadiouth", "Ngaparou"],
    "Tivaouane": ["Mékhé", "Pambal"],
  },
  "Saint-Louis": {
    "Saint-Louis": ["Sor", "Pikine"],
    "Dagana":      ["Richard-Toll", "Rosso-Sénégal"],
    "Podor":       ["Podor", "Ndioum"],
  },
  "Diourbel": {
    "Diourbel":  ["Diourbel", "Ndindy"],
    "Bambey":    ["Bambey", "Lambaye"],
    "Mbacké":    ["Mbacké", "Touba"],
  },
  "Louga": {
    "Louga":     ["Louga", "Sakal"],
    "Kébémer":   ["Kébémer", "Dahra"],
    "Linguère":  ["Linguère", "Yang-Yang"],
  },
  "Fatick": {
    "Fatick":    ["Fatick", "Diakhao"],
    "Foundiougne": ["Foundiougne", "Passy"],
    "Gossas":    ["Gossas", "Colobane"],
  },
  "Kaolack": {
    "Kaolack":   ["Kaolack", "Gandiaye"],
    "Guinguinéo": ["Guinguinéo", "Keur Madiabel"],
    "Nioro du Rip": ["Nioro du Rip", "Paoskoto"],
  },
  "Kolda": {
    "Kolda":     ["Kolda", "Saré Coly Sallé"],
    "Vélingara":  ["Vélingara", "Diaobé-Kabendou"],
    "Médina Yoro Foulah": ["Médina Yoro Foulah", "Pata"],
  },
  "Tambacounda": {
    "Tambacounda": ["Tambacounda", "Nettéboulou"],
    "Bakel":      ["Bakel", "Kidira"],
    "Goudiry":    ["Goudiry", "Koumpentoum"],
    "Koumpentoum": ["Koumpentoum"],
  },
  "Ziguinchor": {
    "Ziguinchor": ["Ziguinchor", "Niaguis"],
    "Bignona":   ["Bignona", "Sindian"],
    "Oussouye":  ["Oussouye", "Mlomp"],
  },
  "Matam": {
    "Matam":     ["Matam", "Ranérou"],
    "Kanel":     ["Kanel", "Semmé"],
    "Ranérou-Ferlo": ["Ranérou"],
  },
  "Kaffrine": {
    "Kaffrine":  ["Kaffrine", "Nganda"],
    "Birkelane": ["Birkelane", "Mabo"],
    "Malem-Hodar": ["Malem-Hodar", "Keur Samba Kane"],
    "Koungheul": ["Koungheul", "Khelcom"],
  },
  "Kédougou": {
    "Kédougou":  ["Kédougou", "Bandafassi"],
    "Saraya":    ["Saraya", "Khossanto"],
    "Salémata":  ["Salémata", "Dakateli"],
  },
  "Sédhiou": {
    "Sédhiou":   ["Sédhiou", "Diattacounda"],
    "Bounkiling": ["Bounkiling", "Marsassoum"],
    "Goudomp":   ["Goudomp", "Karantaba"],
  },
};
const REGIONS = Object.keys(GEO);
const SPECIALITES = [
  "Médecine générale", "Cardiologie", "Pédiatrie", "Gynécologie",
  "Chirurgie", "Radiologie", "Neurologie", "Pneumologie",
  "Dermatologie", "Ophtalmologie", "ORL", "Psychiatrie",
];

const DEFAULT_REGION = "Dakar";
const DEFAULT_DEPT   = Object.keys(GEO[DEFAULT_REGION])[0];
const DEFAULT_COMM   = GEO[DEFAULT_REGION][DEFAULT_DEPT][0];

const RegisterPage = ({ setPage }) => {
  const toast = useToast();
  const [role,        setRole]        = useState("medecin");
  const [step,        setStep]        = useState(1);
  const [loading,     setLoading]     = useState(false);
  const [hopitaux,    setHopitaux]    = useState([]);
  const [ordreStatus, setOrdreStatus] = useState("idle"); // idle | loading | found | notfound
  const [ordreInfo,   setOrdreInfo]   = useState(null);   // { nom, prenom, section, specialite }

  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", phone: "",
    pass: "", confirm: "",
    numOrdre: "", specialite: "", section: "",
    etablissementId: "",
    serviceAffecte: "", hopitalId: "",
    region: DEFAULT_REGION, departement: DEFAULT_DEPT, commune: DEFAULT_COMM,
  });

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  // Cascade géographique
  const depts   = GEO[form.region] ? Object.keys(GEO[form.region]) : [];
  const communes = GEO[form.region]?.[form.departement] ?? [];

  const handleRegionChange = e => {
    const region = e.target.value;
    const dept0  = GEO[region] ? Object.keys(GEO[region])[0] : "";
    const comm0  = GEO[region]?.[dept0]?.[0] ?? "";
    setForm(f => ({ ...f, region, departement: dept0, commune: comm0 }));
  };
  const handleDeptChange = e => {
    const departement = e.target.value;
    const comm0 = GEO[form.region]?.[departement]?.[0] ?? "";
    setForm(f => ({ ...f, departement, commune: comm0 }));
  };

  // Lookup numéro d'ordre → auto-remplit nom/prénom depuis la DB
  const handleNumOrdreBlur = async () => {
    const num = form.numOrdre.trim().toUpperCase();
    if (!num) { setOrdreStatus("idle"); setOrdreInfo(null); return; }
    setOrdreStatus("loading");
    try {
      const res = await lookupOrdre(num);
      if (res.success) {
        setOrdreInfo(res);
        setOrdreStatus("found");
        // Écrase nom/prénom avec les valeurs exactes de la DB
        // Si localisation connue, pré-sélectionner l'hôpital correspondant
        setForm(f => {
          let etablissementId = f.etablissementId;
          if (res.localisation) {
            const match = hopitaux.find(h =>
              h.nom.toLowerCase().includes(res.localisation.toLowerCase()) ||
              res.localisation.toLowerCase().includes(h.nom.toLowerCase())
            );
            if (match) etablissementId = match.id;
          }
          return { ...f, etablissementId };
        });
      } else {
        setOrdreStatus("notfound");
        setOrdreInfo(null);
      }
    } catch {
      setOrdreStatus("notfound");
      setOrdreInfo(null);
    }
  };

  // Charger les hôpitaux à l'affichage de l'étape 2
  useEffect(() => {
    if (step !== 2 || hopitaux.length > 0) return;
    getHopitaux().then(data => setHopitaux(data)).catch(() => {});
  }, [step, hopitaux.length]);

  // Ré-essayer le match établissement quand hopitaux se charge après le blur
  useEffect(() => {
    if (!ordreInfo?.localisation || hopitaux.length === 0) return;
    setForm(f => {
      if (f.etablissementId) return f; // déjà matché
      const match = hopitaux.find(h =>
        h.nom.toLowerCase().includes(ordreInfo.localisation.toLowerCase()) ||
        ordreInfo.localisation.toLowerCase().includes(h.nom.toLowerCase())
      );
      return match ? { ...f, etablissementId: match.id } : f;
    });
  }, [hopitaux, ordreInfo]);

  // ── Étape 1 → 2 ────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      toast("Nom et prénom obligatoires.", "error"); return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      toast("Veuillez saisir un email ou un numéro de téléphone.", "error"); return;
    }
    setStep(2);
  };

  // ── Soumission finale ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (form.pass.length < 8) {
      toast("Le mot de passe doit contenir au moins 8 caractères.", "error"); return;
    }
    if (form.pass !== form.confirm) {
      toast("Les mots de passe ne correspondent pas.", "error"); return;
    }

    const hospitalVal = role === "medecin" ? form.etablissementId.trim() : form.hopitalId.trim();
    if (!hospitalVal) {
      toast("Veuillez sélectionner un établissement.", "error"); return;
    }
    if ((role === "infirmier" || role === "assistant") && !form.serviceAffecte.trim()) {
      toast("Service affecté obligatoire.", "error"); return;
    }
    if (!form.commune) {
      toast("Veuillez compléter l'adresse.", "error"); return;
    }

    const payload = {
      role: role.toUpperCase(),
      nom:        form.nom.trim(),
      prenom:     form.prenom.trim(),
      email:      form.email.trim().toLowerCase() || null,
      telephone:  form.phone.trim() || null,
      motDePasse: form.pass,
      adresse: {
        region:      form.region,
        departement: form.departement,
        commune:     form.commune,
      },
    };

    if (role === "medecin") {
      if (!form.numOrdre.trim()) { toast("N° d'Ordre obligatoire.", "error"); return; }
      if (!form.specialite)      { toast("Spécialité obligatoire.", "error"); return; }
      payload.numOrdre      = form.numOrdre.trim().toUpperCase();
      payload.specialite    = form.specialite;
      payload.section       = form.section.trim() || null;
      payload.etablissement = hospitalVal;
    } else {
      payload.serviceAffecte = form.serviceAffecte.trim();
      payload.hopital        = hospitalVal;
    }

    setLoading(true);
    try {
      const res = await register(payload);
      if (!res.success) throw new Error(res.message ?? "Erreur lors de l'inscription.");

      const contact = form.email.trim() || form.phone.trim();
      localStorage.setItem("otpContact", contact);
      localStorage.setItem("otpMethod",  form.email.trim() ? "email" : "sms");
      localStorage.setItem("otpType",    "inscription");

      toast("Compte créé ! Vérifiez le code OTP envoyé.", "success");
      setTimeout(() => setPage("otp"), 800);
    } catch (err) {
      toast(err.apiMessage ?? err.message ?? "Erreur lors de l'inscription.", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Styles réutilisables ────────────────────────────────────────────────────
  const selectStyle = {
    width: "100%", padding: "0.68rem 0.85rem", borderRadius: 10,
    border: `1.5px solid ${C.border}`, outline: "none",
    fontSize: "0.88rem", color: C.text, background: "white",
    transition: "border-color 0.15s",
  };
  const labelStyle = {
    display: "block", fontWeight: 600, fontSize: "0.8rem",
    color: C.textMid, marginBottom: "0.35rem", fontFamily: F.title,
  };

  return (
    <AuthLayout
      title="Rejoignez MediConnect Sénégal"
      subtitle="Créez votre compte professionnel en quelques minutes."
    >
      {/* En-tête étapes */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text, flex: 1 }}>
          Inscription
        </h2>
        <span style={{ fontSize: "0.75rem", color: C.textLight, background: C.bg, padding: "0.25rem 0.6rem", borderRadius: 100 }}>
          Étape {step}/2
        </span>
      </div>
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem" }}>
        {[1, 2].map(s => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: s <= step ? C.primary : C.borderLight, transition: "background 0.3s",
          }} />
        ))}
      </div>

      {/* ── ÉTAPE 1 : Identité ── */}
      {step === 1 && (
        <>
          <p style={{ color: C.textLight, fontSize: "0.85rem", marginBottom: "1.4rem" }}>
            Déjà inscrit ?{" "}
            <button
              onClick={() => setPage("login")}
              style={{ background: "none", border: "none", color: C.primary, fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}
            >
              Se connecter
            </button>
          </p>

          {/* Sélecteur rôle */}
          <div style={{ display: "flex", background: C.bg, borderRadius: 12, padding: "0.3rem", marginBottom: "1.4rem", gap: "0.25rem" }}>
            {[["medecin", "Médecin"], ["infirmier", "Infirmier(e)"], ["assistant", "Assistant"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setRole(id)} style={{
                flex: 1, padding: "0.6rem", borderRadius: 9, border: "none",
                background: role === id ? "white" : "transparent",
                color: role === id ? C.primary : C.textLight,
                fontWeight: role === id ? 700 : 500, fontSize: "0.88rem",
                boxShadow: role === id ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
                transition: "all .15s", cursor: "pointer", fontFamily: F.title,
              }}>
                {lbl}
              </button>
            ))}
          </div>

          <div style={{
            background: C.primaryPale, border: `1px solid ${C.borderLight}`,
            borderRadius: 10, padding: "0.65rem 0.9rem", marginBottom: "1.2rem",
            fontSize: "0.77rem", color: C.textMid, lineHeight: 1.5,
            display: "flex", gap: "0.5rem", alignItems: "flex-start",
          }}>
            <Icon d={I.shield} size={14} stroke={C.primary} sw={2} style={{ marginTop: 1 }} />
            <span>
              <strong style={{ color: C.primaryDark }}>Patients :</strong>{" "}
              les dossiers patients sont créés par l'assistant médical depuis son tableau de bord.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <InputField label="Nom"    value={form.nom}    onChange={set("nom")}    placeholder="DIALLO"  required />
            <InputField label="Prénom" value={form.prenom} onChange={set("prenom")} placeholder="Aminata" required />
          </div>
          <InputField label="E-mail"    type="email" value={form.email} onChange={set("email")} placeholder="vous@exemple.sn"    icon={I.mail}  />
          <InputField label="Téléphone" type="tel"   value={form.phone} onChange={set("phone")} placeholder="+221 7X XXX XX XX" icon={I.phone} />
          <div style={{
            background: `${C.primary}10`, border: `1px solid ${C.primary}20`,
            borderRadius: 9, padding: "0.5rem 0.8rem", marginBottom: "1rem",
            fontSize: "0.74rem", color: C.textMid, lineHeight: 1.5,
          }}>
            L'email ou le téléphone sera utilisé pour l'envoi du code de vérification OTP.
          </div>
        </>
      )}

      {/* ── ÉTAPE 2 : Profil professionnel + Adresse + Mot de passe ── */}
      {step === 2 && (
        <>
          {/* Champs spécifiques au rôle */}
          {role === "medecin" ? (
            <>
              {/* Numéro d'ordre + lookup automatique */}
              <div style={{ marginBottom: "1rem" }}>
                <InputField
                  label="N° Ordre des médecins"
                  value={form.numOrdre}
                  onChange={e => {
                    set("numOrdre")(e);
                    setOrdreStatus("idle");
                    setOrdreInfo(null);
                  }}
                  onBlur={handleNumOrdreBlur}
                  placeholder="ex : 1056/P ou 539"
                  icon={I.award}
                  required
                />
                {ordreStatus === "loading" && (
                  <div style={{ fontSize: "0.76rem", color: C.textLight, marginTop: "-0.6rem", marginBottom: "0.5rem" }}>
                    Vérification en cours…
                  </div>
                )}
                {ordreStatus === "found" && ordreInfo && (
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: "0.5rem",
                    background: "#e5f7ef", border: "1px solid #b2dfcb",
                    borderRadius: 8, padding: "0.55rem 0.8rem",
                    marginTop: "-0.6rem", marginBottom: "0.5rem",
                  }}>
                    <Icon d={I.check} size={14} stroke="#17935a" sw={2.5} style={{ marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#17935a" }}>
                        Inscrit au tableau de l'Ordre
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#256647", marginTop: 1 }}>
                        {ordreInfo.prenom} {ordreInfo.nom}
                        {ordreInfo.section ? ` • Section ${ordreInfo.section}` : ""}
                        {ordreInfo.specialite ? ` • ${ordreInfo.specialite}` : ""}
                      </div>
                      <div style={{ fontSize: "0.71rem", color: "#17935a", marginTop: 2, opacity: 0.8 }}>
                        Saisissez vos informations exactement telles qu'elles figurent dans le registre de l'Ordre.
                      </div>
                    </div>
                  </div>
                )}
                {ordreStatus === "notfound" && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    background: "#fff3f3", border: "1px solid #fbbcbc",
                    borderRadius: 8, padding: "0.5rem 0.8rem",
                    marginTop: "-0.6rem", marginBottom: "0.5rem",
                    fontSize: "0.76rem", color: C.danger,
                  }}>
                    <Icon d={I.alert} size={13} stroke={C.danger} sw={2} />
                    Numéro introuvable dans le tableau de l'Ordre des Médecins du Sénégal.
                  </div>
                )}
              </div>

              <InputField
                label="Spécialité"
                value={form.specialite}
                onChange={set("specialite")}
                options={["", ...SPECIALITES]}
                required
              />
              <InputField
                label="Section (optionnel)"
                value={form.section}
                onChange={set("section")}
                placeholder="A ou B"
              />
            </>
          ) : (
            <InputField
              label="Service affecté"
              value={form.serviceAffecte}
              onChange={set("serviceAffecte")}
              placeholder="ex : Urgences, Cardiologie, Pédiatrie…"
              required
            />
          )}

          {/* Hôpital / Établissement */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={labelStyle}>
              {role === "medecin" ? "Établissement" : "Hôpital"}{" "}
              <span style={{ color: C.danger }}>*</span>
            </label>
            {role === "medecin" && ordreStatus === "found" && ordreInfo?.localisation && form.etablissementId ? (
              // Médecin : établissement verrouillé — match confirmé avec un hôpital de la liste
              <div style={{
                padding: "0.68rem 0.85rem", borderRadius: 10, border: `1.5px solid ${C.border}`,
                fontSize: "0.88rem", background: C.bg, color: C.text,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span>{hopitaux.find(h => h.id === form.etablissementId)?.nom ?? ordreInfo.localisation}</span>
                <span style={{ fontSize: "0.7rem", color: C.primary, fontWeight: 600, marginLeft: "0.5rem" }}>
                  Verrouillé (Ordre des médecins)
                </span>
              </div>
            ) : (
              <SearchableSelect
                items={hopitaux}
                value={role === "medecin" ? form.etablissementId : form.hopitalId}
                onChange={id => setForm(f => ({ ...f, [role === "medecin" ? "etablissementId" : "hopitalId"]: id }))}
                placeholder="— Sélectionner un établissement —"
              />
            )}
            {hopitaux.length === 0 && (
              <div style={{ fontSize: "0.72rem", color: C.textLight, marginTop: "0.25rem" }}>
                Chargement des établissements…
              </div>
            )}
          </div>

          {/* Adresse professionnelle */}
          <div style={{
            background: C.bg, borderRadius: 12, padding: "0.9rem",
            marginBottom: "1rem", border: `1px solid ${C.borderLight}`,
          }}>
            <div style={{ fontWeight: 700, fontSize: "0.79rem", color: C.textMid, marginBottom: "0.75rem", fontFamily: F.title }}>
              Adresse professionnelle
            </div>
            <div style={{ marginBottom: "0.7rem" }}>
              <label style={labelStyle}>Région <span style={{ color: C.danger }}>*</span></label>
              <select value={form.region} onChange={handleRegionChange} style={selectStyle}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div>
                <label style={labelStyle}>Département <span style={{ color: C.danger }}>*</span></label>
                <select value={form.departement} onChange={handleDeptChange} style={selectStyle}>
                  {depts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Commune <span style={{ color: C.danger }}>*</span></label>
                <select value={form.commune} onChange={set("commune")} style={selectStyle}>
                  {communes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Mot de passe */}
          <InputField
            label="Mot de passe"
            type="password"
            value={form.pass}
            onChange={set("pass")}
            placeholder="8+ caractères"
            icon={I.lock}
            required
          />
          <InputField
            label="Confirmer le mot de passe"
            type="password"
            value={form.confirm}
            onChange={set("confirm")}
            placeholder="Répétez le mot de passe"
            icon={I.lock}
            required
          />
          {form.confirm && form.pass !== form.confirm && (
            <div style={{ marginTop: "-0.6rem", marginBottom: "0.8rem", fontSize: "0.77rem", color: C.danger }}>
              ⚠ Les mots de passe ne correspondent pas.
            </div>
          )}

          {/* CGU */}
          <div style={{
            background: C.primaryPale, border: `1px solid ${C.borderLight}`,
            borderRadius: 10, padding: "0.8rem 1rem", marginBottom: "1.2rem",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
              <input type="checkbox" style={{ marginTop: 3, accentColor: C.primary }} />
              <span style={{ fontSize: "0.78rem", color: C.textMid, lineHeight: 1.5 }}>
                J'accepte les{" "}
                <span style={{ color: C.primary, fontWeight: 600 }}>conditions d'utilisation</span>
                {" "}et la{" "}
                <span style={{ color: C.primary, fontWeight: 600 }}>politique de confidentialité</span>.
                Données protégées conformément à la loi n°2008-12.
              </span>
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        {step > 1 && (
          <Btn variant="outline" onClick={() => setStep(1)}>← Retour</Btn>
        )}
        <Btn
          full={step === 1}
          size="lg"
          onClick={step === 1 ? handleNext : handleSubmit}
          disabled={loading}
          style={{ flex: step > 1 ? 1 : undefined }}
        >
          {loading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                width: 16, height: 16,
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                borderRadius: "50%", animation: "spin 0.7s linear infinite",
                display: "inline-block",
              }} />
              Création…
            </span>
          ) : step === 1 ? "Continuer →" : "Créer mon compte"}
        </Btn>
      </div>

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
};

export default RegisterPage;
