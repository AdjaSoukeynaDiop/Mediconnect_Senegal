import { useState } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import Modal from "../ui/Modal.jsx";
import Btn from "../ui/Btn.jsx";
import InputField from "../ui/InputField.jsx";
import Icon from "../ui/Icon.jsx";

/* ════════════════════════════════════════════════════════
   MODAL ETABLISSEMENT
   Utilisé par : AdminDashboard
   Modes :
     - mode="add"   → créer un nouvel établissement
     - mode="view"  → consulter / modifier un établissement existant
   Props :
     open, onClose, toast
     mode          : "add" | "view"  (défaut "add")
     etablissement : objet existant  (requis si mode="view")
════════════════════════════════════════════════════════ */

const REGIONS = [
  "Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack",
  "Tambacounda", "Kolda", "Matam", "Diourbel", "Fatick",
  "Kaffrine", "Kédougou", "Louga", "Sédhiou",
];

const TYPES = [
  "Centre de Santé", "Clinique Privée", "Hôpital Régional",
  "Hôpital National", "Poste de Santé", "Dispensaire", "Maternité",
];

const EMPTY = {
  nom: "", type: "Centre de Santé", region: "Dakar",
  ville: "", adresse: "", telephone: "", email: "",
  directeur: "", lits: "", statut: "actif",
};

const ModalEtablissement = ({
  open, onClose, toast,
  mode = "add",
  etablissement = null,
}) => {
  const isView   = mode === "view";
  const [edit,   setEdit]    = useState(!isView);  // en mode view, commence en lecture
  const [form,   setForm]    = useState(isView && etablissement ? { ...etablissement } : { ...EMPTY });
  const [step,   setStep]    = useState(1);         // 1=infos générales, 2=contacts & admin
  const [loading, setLoading] = useState(false);
  const [done,   setDone]    = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleClose = () => {
    onClose();
    // reset après fermeture
    setTimeout(() => {
      setStep(1);
      setDone(false);
      setEdit(!isView);
      setForm(isView && etablissement ? { ...etablissement } : { ...EMPTY });
      setLoading(false);
    }, 200);
  };

  const handleSave = () => {
    if (!form.nom.trim()) { toast("Le nom de l'établissement est requis", "warning"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      toast(
        isView
          ? `Établissement "${form.nom}" mis à jour`
          : `Établissement "${form.nom}" ajouté avec succès`,
        "success"
      );
    }, 1100);
  };

  // ── Titre dynamique ──
  const title = done
    ? isView ? "Modifications enregistrées" : "Établissement ajouté"
    : isView && !edit
      ? `${etablissement?.nom ?? "Établissement"}`
      : isView
        ? "Modifier l'établissement"
        : "Ajouter un établissement";

  // ── Footer dynamique ──
  const footer = done ? (
    <Btn full onClick={handleClose} icon={I.check}>Fermer</Btn>
  ) : isView && !edit ? (
    <>
      <Btn variant="outline" onClick={handleClose}>Fermer</Btn>
      <Btn icon={I.edit} onClick={() => setEdit(true)}>Modifier</Btn>
    </>
  ) : step === 1 ? (
    <>
      <Btn variant="outline" onClick={handleClose}>Annuler</Btn>
      <Btn icon={I.arrowR} onClick={() => setStep(2)}>Continuer</Btn>
    </>
  ) : (
    <>
      <Btn variant="outline" onClick={() => setStep(1)}>Retour</Btn>
      <Btn onClick={handleSave} icon={I.check} disabled={loading}>
        {loading
          ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              Enregistrement…
            </span>
          : isView ? "Enregistrer" : "Ajouter l'établissement"
        }
      </Btn>
    </>
  );

  return (
    <Modal open={open} onClose={handleClose} title={title} width={520} footer={footer}>

      {/* ── Écran de confirmation ── */}
      {done && (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e5f7ef", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Icon d={I.check} size={28} stroke="#17935a" sw={2} />
          </div>
          <h3 style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1.05rem", color: C.text, marginBottom: "0.5rem" }}>
            {isView ? "Modifications enregistrées !" : "Établissement ajouté !"}
          </h3>
          <p style={{ fontSize: "0.84rem", color: C.textMid, lineHeight: 1.6 }}>
            <strong>{form.nom}</strong> — {form.type}<br />
            {form.region} · {form.ville}
          </p>
        </div>
      )}

      {/* ── Barre de progression (mode add uniquement) ── */}
      {!done && !isView && (
        <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem" }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? C.primary : C.borderLight,
              transition: "background 0.3s",
            }} />
          ))}
        </div>
      )}

      {/* ── STEP 1 / Infos générales ── */}
      {!done && (step === 1 || isView) && (
        <>
          {isView && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", borderRadius: 12, background: `${C.primary}08`, border: `1px solid ${C.primary}20`, marginBottom: "1.2rem" }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: `${C.primary}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon d={I.map} size={20} stroke={C.primary} sw={1.8} />
              </div>
              <div>
                <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.9rem", color: C.text }}>{form.nom}</div>
                <div style={{ fontSize: "0.74rem", color: C.textMid }}>{form.type} · {form.region}</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: form.statut === "actif" ? "#1ecb78" : C.textLight }} />
                <span style={{ fontSize: "0.72rem", color: C.textMid, fontWeight: 500 }}>
                  {form.statut === "actif" ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
          )}

          <InputField
            label="Nom de l'établissement"
            value={form.nom}
            onChange={set("nom")}
            placeholder="ex. Centre de Santé de Médina"
            icon={I.map}
            required
            disabled={isView && !edit}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <InputField
              label="Type"
              value={form.type}
              onChange={set("type")}
              options={TYPES}
              disabled={isView && !edit}
            />
            <InputField
              label="Statut"
              value={form.statut}
              onChange={set("statut")}
              options={["actif", "inactif", "en construction"]}
              disabled={isView && !edit}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <InputField
              label="Région"
              value={form.region}
              onChange={set("region")}
              options={REGIONS}
              disabled={isView && !edit}
            />
            <InputField
              label="Ville / Commune"
              value={form.ville}
              onChange={set("ville")}
              placeholder="ex. Médina"
              disabled={isView && !edit}
            />
          </div>

          <InputField
            label="Adresse complète"
            value={form.adresse}
            onChange={set("adresse")}
            placeholder="ex. Avenue Blaise Diagne, Médina"
            disabled={isView && !edit}
          />

          <InputField
            label="Nombre de lits"
            type="number"
            value={form.lits}
            onChange={set("lits")}
            placeholder="ex. 120"
            icon={I.activity}
            disabled={isView && !edit}
          />
        </>
      )}

      {/* ── STEP 2 / Contacts & Administration ── */}
      {!done && step === 2 && !isView && (
        <>
          <div style={{ background: C.primaryPale, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "0.65rem 0.9rem", marginBottom: "1.2rem", fontSize: "0.77rem", color: C.textMid, lineHeight: 1.5 }}>
            <Icon d={I.shield} size={13} stroke={C.primary} sw={2} style={{ marginRight: 5 }} />
            Ces informations seront visibles par les médecins et infirmiers rattachés à cet établissement.
          </div>

          <InputField
            label="Directeur / Responsable"
            value={form.directeur}
            onChange={set("directeur")}
            placeholder="ex. Dr. Aminata Sow"
            icon={I.user}
          />
          <InputField
            label="Téléphone"
            type="tel"
            value={form.telephone}
            onChange={set("telephone")}
            placeholder="+221 33 XXX XX XX"
            icon={I.phone}
          />
          <InputField
            label="E-mail de contact"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="contact@etablissement.sn"
            icon={I.mail}
          />

          <div style={{ background: `${C.primary}10`, border: `1px solid ${C.primary}30`, borderRadius: 10, padding: "0.75rem 1rem", marginTop: "0.5rem", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
            <Icon d={I.bell} size={14} stroke={C.primary} sw={2} />
            <span style={{ fontSize: "0.77rem", color: C.primaryDark, lineHeight: 1.5 }}>
              Après création, vous pourrez rattacher des médecins et infirmiers à cet établissement depuis leur fiche de profil.
            </span>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ModalEtablissement;