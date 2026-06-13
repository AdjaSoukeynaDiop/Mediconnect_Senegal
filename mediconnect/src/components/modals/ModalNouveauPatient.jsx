import { useState } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import Modal from "../ui/Modal.jsx";
import Btn from "../ui/Btn.jsx";
import InputField from "../ui/InputField.jsx";
import Icon from "../ui/Icon.jsx";

const GEO = {
  "Dakar": {
    departements: ["Dakar", "Guédiawaye", "Pikine", "Rufisque"],
    communes: {
      "Dakar": ["Plateau", "Médina", "Fann-Point E-Amitié", "Grand Dakar", "Ouakam", "Yoff", "Ngor", "HLM", "Liberté"],
      "Guédiawaye": ["Golf Sud", "Médina Gounass", "Sam Notaire", "Wakhinane Nimzatt"],
      "Pikine": ["Pikine Est", "Pikine Nord", "Pikine Ouest", "Thiaroye Gare", "Keur Massar", "Malika"],
      "Rufisque": ["Rufisque Est", "Rufisque Nord", "Rufisque Ouest", "Bargny", "Diamniadio"],
    },
  },
  "Thiès": {
    departements: ["Thiès", "Mbour", "Tivaouane"],
    communes: {
      "Thiès": ["Thiès-Nord", "Thiès-Ouest", "Thiès-Est", "Fandène", "Pout"],
      "Mbour": ["Mbour", "Joal-Fadiouth", "Nguékhokh"],
      "Tivaouane": ["Tivaouane", "Mboro"],
    },
  },
  "Saint-Louis": { departements: ["Saint-Louis", "Dagana", "Podor"], communes: { "Saint-Louis": ["Saint-Louis", "Gandon"], "Dagana": ["Dagana", "Richard-Toll"], "Podor": ["Podor"] } },
  "Ziguinchor":  { departements: ["Ziguinchor", "Bignona", "Oussouye"], communes: { "Ziguinchor": ["Ziguinchor", "Niaguis"], "Bignona": ["Bignona", "Diouloulou"], "Oussouye": ["Oussouye"] } },
  "Kaolack":     { departements: ["Kaolack", "Guinguinéo", "Nioro du Rip"], communes: { "Kaolack": ["Kaolack", "Kahone"], "Guinguinéo": ["Guinguinéo"], "Nioro du Rip": ["Nioro du Rip"] } },
  "Tambacounda": { departements: ["Tambacounda", "Bakel", "Goudiry"], communes: { "Tambacounda": ["Tambacounda"], "Bakel": ["Bakel"], "Goudiry": ["Goudiry"] } },
  "Kolda":   { departements: ["Kolda", "Vélingara"], communes: { "Kolda": ["Kolda"], "Vélingara": ["Vélingara"] } },
  "Matam":   { departements: ["Matam", "Kanel"], communes: { "Matam": ["Matam", "Ourossogui"], "Kanel": ["Kanel"] } },
  "Diourbel":{ departements: ["Diourbel", "Bambey", "Mbacké"], communes: { "Diourbel": ["Diourbel"], "Bambey": ["Bambey"], "Mbacké": ["Mbacké", "Touba"] } },
  "Fatick":  { departements: ["Fatick", "Foundiougne", "Gossas"], communes: { "Fatick": ["Fatick"], "Foundiougne": ["Foundiougne"], "Gossas": ["Gossas"] } },
  "Kaffrine":{ departements: ["Kaffrine", "Koungheul"], communes: { "Kaffrine": ["Kaffrine"], "Koungheul": ["Koungheul"] } },
  "Kédougou":{ departements: ["Kédougou", "Saraya"], communes: { "Kédougou": ["Kédougou"], "Saraya": ["Saraya"] } },
  "Louga":   { departements: ["Louga", "Linguère"], communes: { "Louga": ["Louga"], "Linguère": ["Linguère"] } },
  "Sédhiou": { departements: ["Sédhiou", "Goudomp"], communes: { "Sédhiou": ["Sédhiou"], "Goudomp": ["Goudomp"] } },
};
const REGIONS = Object.keys(GEO);

const initForm = () => ({
  nom: "", prenom: "", dob: "", sexe: "Féminin",
  phone: "", email: "",
  groupeSanguin: "", taille: "", poids: "",
  region: "Dakar", departement: "Dakar", commune: "Plateau",
  assurance: "",
  patho: "", allergies: "Aucune", traitement: "", antecedents: "",
});

/**
 * onSave(payload) — async, lancé par le bouton Créer.
 * Doit appeler createPatient + refresh + toast.success depuis le parent.
 * Rejette en cas d'erreur API (le parent gère le toast.error).
 */
const ModalNouveauPatient = ({ open, onClose, toast, onSave }) => {
  const [form,        setForm]        = useState(initForm());
  const [step,        setStep]        = useState(1);
  const [saving,      setSaving]      = useState(false);
  const [credentials, setCredentials] = useState(null); // CreatePatientResponse après création

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const departements = GEO[form.region]?.departements ?? [];
  const communes     = GEO[form.region]?.communes[form.departement] ?? [];

  const handleRegionChange = (e) => {
    const region    = e.target.value;
    const firstDept = GEO[region]?.departements[0] ?? "";
    const firstComm = GEO[region]?.communes[firstDept]?.[0] ?? "";
    setForm((f) => ({ ...f, region, departement: firstDept, commune: firstComm }));
  };
  const handleDeptChange = (e) => {
    const departement = e.target.value;
    const firstComm   = GEO[form.region]?.communes[departement]?.[0] ?? "";
    setForm((f) => ({ ...f, departement, commune: firstComm }));
  };

  const handleClose = () => {
    onClose();
    setForm(initForm());
    setStep(1);
    setCredentials(null);
  };

  const handleSave = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) {
      toast("Nom et prénom obligatoires", "warning"); return;
    }
    if (!form.dob) {
      toast("Date de naissance obligatoire", "warning"); return;
    }

    const payload = {
      nom:          form.nom.trim(),
      prenom:       form.prenom.trim(),
      email:        form.email.trim() || null,
      telephone:    form.phone.trim() || null,
      dateNaissance: form.dob,
      sexe:         form.sexe === "Féminin" ? "FEMININ" : "MASCULIN",
      groupeSanguin: form.groupeSanguin || null,
      adresse: {
        region:      form.region,
        departement: form.departement,
        commune:     form.commune,
      },
      acceptePolitiqueConfidentialite: true,
    };

    setSaving(true);
    try {
      const result = await onSave(payload);
      // result peut être { success, data: CreatePatientResponse } ou CreatePatientResponse directement
      const cred = result?.data ?? result;
      if (cred?.numPatient) {
        setCredentials(cred);
        setStep(4);
      } else {
        handleClose();
      }
    } catch {
      // toast.error déjà affiché par le parent
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text).then(() => toast("Copié dans le presse-papier", "success")).catch(() => {});
  };

  const FORM_STEPS = ["Identité", "Localisation", "Médical"];

  return (
    <Modal
      open={open} onClose={handleClose}
      title={step === 4 ? "✓ Dossier créé avec succès" : "Créer un dossier patient"}
      width={540}
      footer={
        step === 4 ? (
          <Btn full onClick={handleClose} icon={I.check}>Fermer</Btn>
        ) : (
          <>
            {step > 1 && <Btn variant="outline" onClick={() => setStep((s) => s - 1)} disabled={saving}>Retour</Btn>}
            <Btn variant="outline" onClick={handleClose} disabled={saving}>Annuler</Btn>
            {step < 3
              ? <Btn onClick={() => setStep((s) => s + 1)} icon={I.arrowR}>Suivant</Btn>
              : (
                <Btn onClick={handleSave} icon={I.check} disabled={saving}>
                  {saving
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                        Création…
                      </span>
                    : "Créer le dossier"
                  }
                </Btn>
              )
            }
          </>
        )
      }
    >
      {/* Barre de progression — uniquement pour les 3 étapes du formulaire */}
      {step < 4 && (
        <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.4rem" }}>
          {FORM_STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <div style={{ height: 3, borderRadius: 2, background: i + 1 <= step ? C.primary : C.borderLight, transition: "background 0.3s" }} />
              <span style={{ fontSize: "0.68rem", color: i + 1 <= step ? C.primary : C.textLight, fontWeight: i + 1 === step ? 700 : 400 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Étape 1 — Identité */}
      {step === 1 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <InputField label="Nom *" value={form.nom} onChange={set("nom")} placeholder="Diallo" required />
            <InputField label="Prénom *" value={form.prenom} onChange={set("prenom")} placeholder="Aminata" required />
          </div>
          <InputField label="Date de naissance *" type="date" value={form.dob} onChange={set("dob")} required />
          <InputField label="Sexe" value={form.sexe} onChange={set("sexe")} options={["Féminin", "Masculin"]} />
          <InputField label="Téléphone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+221 7X XXX XX XX" icon={I.phone} />
          <InputField label="E-mail (optionnel)" type="email" value={form.email} onChange={set("email")} placeholder="patient@exemple.sn" icon={I.mail} />
        </>
      )}

      {/* Étape 2 — Localisation */}
      {step === 2 && (
        <>
          <InputField label="Région" value={form.region} onChange={handleRegionChange} options={REGIONS} />
          <InputField label="Département" value={form.departement} onChange={handleDeptChange} options={departements.length ? departements : [""]} />
          <InputField label="Commune / Arrondissement" value={form.commune} onChange={set("commune")} options={communes.length ? communes : [""]} />
          <InputField label="Assurance maladie" value={form.assurance} onChange={set("assurance")} placeholder="IPRESS, CNAM, CMU…" />
          <div style={{ background: C.primaryPale, border: `1px solid ${C.borderLight}`, borderRadius: 9, padding: "0.6rem 0.8rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <Icon d={I.map} size={14} stroke={C.primary} sw={2} style={{ marginTop: 2 }} />
            <span style={{ fontSize: "0.74rem", color: C.textMid, lineHeight: 1.5 }}>
              Ces informations permettront de localiser le patient sur la carte épidémiologique et d'orienter les transferts si nécessaire.
            </span>
          </div>
        </>
      )}

      {/* Étape 3 — Médical */}
      {step === 3 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <InputField label="Groupe sanguin" value={form.groupeSanguin} onChange={set("groupeSanguin")} options={["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
            <InputField label="Taille (cm)" type="number" value={form.taille} onChange={set("taille")} placeholder="165" />
            <InputField label="Poids (kg)" type="number" value={form.poids} onChange={set("poids")} placeholder="65" />
          </div>
          <InputField label="Pathologie principale" value={form.patho} onChange={set("patho")} placeholder="Hypertension artérielle, Diabète…" />
          <InputField label="Allergies connues" value={form.allergies} onChange={set("allergies")} placeholder="Pénicilline, Aspirine, Aucune…" />
          <div style={{ marginBottom: "0.9rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>Antécédents médicaux</label>
            <textarea
              value={form.antecedents}
              onChange={set("antecedents")}
              placeholder="Chirurgies, hospitalisations, pathologies chroniques antérieures…"
              style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "0.65rem 0.85rem", fontSize: "0.85rem", resize: "vertical", minHeight: 72, outline: "none", fontFamily: F.body, color: C.text, boxSizing: "border-box" }}
            />
          </div>
          <InputField label="Traitement en cours" value={form.traitement} onChange={set("traitement")} placeholder="Amlodipine 5mg, Metformine 850mg…" />
          <div style={{ background: `${C.warning}15`, border: `1px solid ${C.warning}40`, borderRadius: 9, padding: "0.65rem 0.85rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <Icon d={I.shield} size={14} stroke={C.warning} sw={2} style={{ marginTop: 2 }} />
            <span style={{ fontSize: "0.74rem", color: C.textMid, lineHeight: 1.5 }}>
              Le patient recevra un e-mail/SMS avec ses identifiants de connexion. Ses données sont protégées conformément à la loi n°2008-12.
            </span>
          </div>
        </>
      )}

      {/* Étape 4 — Identifiants de connexion */}
      {step === 4 && credentials && (
        <>
          <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e5f7ef", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
              <Icon d={I.check} size={26} stroke="#17935a" sw={2.5} />
            </div>
            <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1.05rem", color: C.text }}>
              {credentials.nomComplet}
            </div>
            <div style={{ fontSize: "0.78rem", color: C.textLight, marginTop: "0.2rem" }}>
              Dossier créé — communiquez les identifiants ci-dessous au patient
            </div>
          </div>

          {[
            { label: "N° Patient", value: credentials.numPatient, mono: true },
            { label: "Mot de passe temporaire", value: credentials.motDePasseTemporaire, mono: true, secret: true },
            credentials.email    && { label: "Email", value: credentials.email },
            credentials.telephone && { label: "Téléphone", value: credentials.telephone },
          ].filter(Boolean).map((row) => (
            <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 0.85rem", background: C.bg, borderRadius: 9, marginBottom: "0.5rem", border: `1px solid ${C.borderLight}` }}>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em" }}>{row.label}</div>
                <div style={{ fontSize: row.mono ? "0.95rem" : "0.88rem", fontFamily: row.mono ? "monospace" : F.body, fontWeight: 700, color: C.text, marginTop: "0.15rem", letterSpacing: row.mono ? "0.05em" : "normal" }}>
                  {row.value}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(row.value)}
                title="Copier"
                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <Icon d={I.clipboard} size={14} stroke={C.textMid} sw={2} />
              </button>
            </div>
          ))}

          <div style={{ background: `${C.primary}08`, border: `1px solid ${C.primary}20`, borderRadius: 9, padding: "0.65rem 0.85rem", marginTop: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <Icon d={I.shield} size={13} stroke={C.primary} sw={2} style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: "0.73rem", color: C.textMid, lineHeight: 1.5 }}>
              Un email a été envoyé au patient si une adresse a été renseignée. Le patient devra changer son mot de passe temporaire lors de sa première connexion.
            </span>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ModalNouveauPatient;
