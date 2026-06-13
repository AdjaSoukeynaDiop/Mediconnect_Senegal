import { useState } from "react";
import { C, F }        from "../../constants/theme.js";
import { I }           from "../../constants/icons.js";
import {
  createConsultationFromDossier,
  completerConsultation,
  saisirConstantes,
} from "../../api/consultations.api.js";
import Modal      from "../ui/Modal.jsx";
import Btn        from "../ui/Btn.jsx";
import InputField from "../ui/InputField.jsx";
import Icon       from "../ui/Icon.jsx";

/*
  Props :
    open        — booléen
    onClose     — callback fermeture
    toast       — fonction toast(msg, type)
    patient     — PatientResponse (pour affichage du nom)
    dossier     — DossierMedicalResponse (requis pour la création)
    onCreated   — callback(ConsultationResponse) appelé après création
*/
const ModalConsultation = ({ open, onClose, toast, patient, dossier, onCreated }) => {
  const initForm = () => ({
    type:           "presentiel",
    motif:          "",
    anamnese:       "",
    examenClinique: "",
    diagnostic:     "",
    compteRendu:    "",
    // Constantes
    tensionArterielle:  "",
    frequenceCardiaque: "",
    temperature:        "",
    poids:              "",
    taille:             "",
    spo2:               "",
  });

  const [form,      setForm]      = useState(initForm);
  const [saving,    setSaving]    = useState(false);
  const [jitsiLink, setJitsiLink] = useState(null);
  const [copied,    setCopied]    = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleClose = () => { onClose(); setForm(initForm()); setJitsiLink(null); setCopied(false); };

  const handleCopy = () => {
    navigator.clipboard.writeText(jitsiLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSubmit = async () => {
    if (!dossier) {
      toast("Aucun dossier médical sélectionné", "error");
      return;
    }
    if (!form.motif.trim()) {
      toast("Le motif de consultation est obligatoire", "warning");
      return;
    }

    setSaving(true);
    try {
      // 1. Créer la consultation (statut EN_ATTENTE)
      const consultationRaw = await createConsultationFromDossier(dossier.id);
      const consultation = consultationRaw?.data ?? consultationRaw;

      // 2. Saisir les constantes si au moins une est renseignée (doit précéder completerConsultation)
      const hasConstants =
        form.tensionArterielle || form.frequenceCardiaque ||
        form.temperature || form.poids || form.taille || form.spo2;

      let afterConstants = consultation;
      if (hasConstants) {
        const constPayload = {};
        if (form.tensionArterielle)  constPayload.tensionArterielle  = form.tensionArterielle;
        if (form.frequenceCardiaque) constPayload.frequenceCardiaque = parseInt(form.frequenceCardiaque, 10);
        if (form.temperature)        constPayload.temperature        = parseFloat(form.temperature);
        if (form.poids)              constPayload.poids              = parseFloat(form.poids);
        if (form.taille)             constPayload.taille             = parseFloat(form.taille);
        if (form.spo2)               constPayload.spo2               = parseFloat(form.spo2);
        const constRaw = await saisirConstantes(consultation.id, constPayload);
        afterConstants = constRaw?.data ?? constRaw;
      }

      // 3. Compléter avec les données médicales (motif obligatoire)
      const medPayload = {
        motif:          form.motif.trim(),
        anamnese:       form.anamnese.trim() || undefined,
        examenClinique: form.examenClinique.trim() || undefined,
        diagnostic:     form.diagnostic.trim() || undefined,
        compteRendu:    form.compteRendu.trim() || undefined,
      };
      const completedRaw = await completerConsultation(afterConstants.id, medPayload);
      const final = completedRaw?.data ?? completedRaw;

      toast("Consultation créée avec succès", "success");
      onCreated?.(final);

      if (form.type === "video") {
        const room = `MediConnect-P${final.patientId}-C${final.id}`;
        setJitsiLink(`https://meet.jit.si/${room}`);
      } else {
        handleClose();
      }
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la création de la consultation", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nouvelle consultation"
      width={680}
      footer={
        jitsiLink ? (
          <>
            <Btn variant="outline" onClick={handleClose}>Fermer</Btn>
            <Btn variant="ghost" onClick={handleCopy}>
              {copied ? "Lien copié !" : "Copier le lien"}
            </Btn>
            <Btn onClick={() => window.open(jitsiLink, "_blank")}>
              Rejoindre la salle
            </Btn>
          </>
        ) : (
          <>
            <Btn variant="outline" onClick={handleClose} disabled={saving}>Annuler</Btn>
            <Btn icon={I.check} onClick={handleSubmit} disabled={saving || !dossier}>
              {saving
                ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Enregistrement…
                  </span>
                : "Enregistrer"
              }
            </Btn>
          </>
        )
      }
    >
      {jitsiLink ? (
        <div style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e8f5e9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Icon d={I.video} size={26} stroke="#17935a" sw={2} />
          </div>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: C.text, margin: "0 0 0.35rem" }}>
            Consultation vidéo créée
          </p>
          <p style={{ fontSize: "0.82rem", color: C.textMid, marginBottom: "1.4rem" }}>
            Partagez ce lien avec {patient?.prenom} {patient?.nom} pour démarrer la séance.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "0.6rem 0.9rem", marginBottom: "0.5rem" }}>
            <span style={{ flex: 1, fontSize: "0.78rem", color: C.primary, wordBreak: "break-all", textAlign: "left", fontFamily: "monospace" }}>
              {jitsiLink}
            </span>
          </div>
          <p style={{ fontSize: "0.72rem", color: C.textLight }}>
            La salle restera accessible via ce lien à tout moment.
          </p>
        </div>
      ) : (
        <div>
          {patient && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.7rem 0.9rem", background: C.primaryPale, borderRadius: 10, marginBottom: "1.2rem", border: `1px solid ${C.borderLight}` }}>
              <Icon d={I.user} size={15} stroke={C.primary} sw={2} />
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>
                {patient.prenom} {patient.nom}
              </span>
              {patient.numPatient && (
                <span style={{ fontSize: "0.72rem", color: C.textMid }}>· {patient.numPatient}</span>
              )}
              {!dossier && (
                <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: C.danger, fontWeight: 600 }}>
                  Dossier non chargé
                </span>
              )}
            </div>
          )}

          {!dossier && !patient && (
            <div style={{ padding: "1rem", background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 10, marginBottom: "1.2rem", fontSize: "0.82rem", color: "#856404" }}>
              Aucun dossier médical sélectionné. Ouvrez d'abord le dossier d'un patient.
            </div>
          )}

          <div style={{ marginBottom: "1.2rem" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.textMid, marginBottom: "0.5rem", fontFamily: F.title }}>Type</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[
                { id: "presentiel", label: "Présentiel", icon: I.user },
                { id: "video",      label: "Vidéo",      icon: I.video },
                { id: "urgence",    label: "Urgence",     icon: I.bell },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                  style={{
                    flex: 1, padding: "0.55rem 0.5rem", borderRadius: 10,
                    border: `2px solid ${form.type === t.id ? C.primary : C.border}`,
                    background: form.type === t.id ? C.primaryPale : "white",
                    color: form.type === t.id ? C.primary : C.textMid,
                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                    fontFamily: F.title,
                  }}
                >
                  <Icon d={t.icon} size={13} stroke={form.type === t.id ? C.primary : C.textMid} sw={2} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <InputField
            label="Motif de consultation *"
            value={form.motif}
            onChange={set("motif")}
            placeholder="Douleur thoracique, suivi hypertension, contrôle post-opératoire…"
            required
          />

          <div style={{ marginBottom: "0.9rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.textMid, marginBottom: "0.5rem", fontFamily: F.title }}>
              Constantes vitales <span style={{ fontWeight: 400, color: C.textLight }}>(optionnel)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.65rem" }}>
              {[
                { k: "tensionArterielle",  label: "Tension",         placeholder: "120/80", unit: "mmHg" },
                { k: "frequenceCardiaque", label: "Fréq. cardiaque", placeholder: "72",     unit: "bpm"  },
                { k: "spo2",               label: "SpO₂",            placeholder: "98",     unit: "%"    },
                { k: "temperature",        label: "Température",     placeholder: "37.0",   unit: "°C"   },
                { k: "poids",              label: "Poids",           placeholder: "65",     unit: "kg"   },
                { k: "taille",             label: "Taille",          placeholder: "170",    unit: "cm"   },
              ].map(({ k, label, placeholder, unit }) => (
                <div key={k}>
                  <label style={{ display: "block", fontSize: "0.72rem", color: C.textMid, marginBottom: "0.25rem" }}>{label}</label>
                  <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                    <input
                      value={form[k]}
                      onChange={set(k)}
                      placeholder={placeholder}
                      style={{ flex: 1, padding: "0.48rem 0.65rem", border: "none", outline: "none", fontSize: "0.8rem", color: C.text, fontFamily: F.body, minWidth: 0 }}
                    />
                    <span style={{ padding: "0.48rem 0.55rem", background: C.bg, fontSize: "0.67rem", color: C.textMid, borderLeft: `1px solid ${C.borderLight}`, whiteSpace: "nowrap" }}>
                      {unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.textMid, fontFamily: F.title }}>
              Notes médicales <span style={{ fontWeight: 400, color: C.textLight }}>(optionnel)</span>
            </div>
            {[
              { k: "anamnese",       label: "Anamnèse",        placeholder: "Histoire de la maladie, symptômes rapportés…",           rows: 2 },
              { k: "examenClinique", label: "Examen clinique", placeholder: "Résultats de l'examen physique (auscultation, etc.)…",    rows: 2 },
              { k: "diagnostic",     label: "Diagnostic",      placeholder: "Diagnostic principal (CIM-10 recommandé)…",               rows: 1 },
              { k: "compteRendu",    label: "Compte rendu",    placeholder: "Traitement prescrit, conduite à tenir, suivi recommandé…", rows: 2 },
            ].map(({ k, label, placeholder, rows }) => (
              <div key={k}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>{label}</label>
                <textarea
                  value={form[k]}
                  onChange={set(k)}
                  placeholder={placeholder}
                  rows={rows}
                  style={{ width: "100%", padding: "0.6rem 0.85rem", border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: "0.82rem", color: C.text, fontFamily: F.body, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.55 }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ModalConsultation;
