import { useState, useEffect, useRef } from "react";
import { C, F } from "../../constants/theme.js";
import { I }   from "../../constants/icons.js";
import {
  createRendezVousByNumPatient,
  createRendezVous,
  getCreneauxDisponibles,
} from "../../api/rendezvous.api.js";
import { getMedecinsDisponibles } from "../../api/medecins.api.js";
import { getPatients } from "../../api/patients.api.js";
import { useAuth } from "../../api/AuthContext.jsx";
import Modal      from "../ui/Modal.jsx";
import Btn        from "../ui/Btn.jsx";
import InputField from "../ui/InputField.jsx";
import Icon       from "../ui/Icon.jsx";

/*
  TypeRendezVous (enum backend) : PRESENTIEL | VIDEOCONSULTATION | URGENCE
  StatutRendezVous              : PLANIFIE | CONFIRME | ANNULE | EFFECTUE

  Props :
    open        — booléen
    onClose     — callback fermeture
    toast       — fonction toast(msg, type)
    patient     — PatientResponse | null  (si fourni, RDV créé pour ce patient via numPatient)
    onCreated   — callback(RendezVousResponse) appelé après création réussie
*/

const TYPE_OPTIONS = [
  { id: "PRESENTIEL", label: "Présentiel", icon: I.user  },
  { id: "VIDEO",      label: "Vidéo",      icon: I.video },
  { id: "URGENCE",    label: "Urgence",    icon: I.bell  },
];

const initForm = () => ({
  numPatientManuel: "",
  nomHopital:       "",
  date:             "",
  heure:            "09:00",
  type:             "PRESENTIEL",
  motif:            "",
  medecinId:        "",
});

const ModalRDV = ({ open, onClose, toast, patient, onCreated }) => {
  const { user } = useAuth();
  const [form,      setForm]      = useState(initForm);
  const [saving,    setSaving]    = useState(false);
  const [medecins,  setMedecins]  = useState([]);
  const [loadingMedecins, setLoadingMedecins] = useState(false);

  // Recherche patient
  const [patientQuery,    setPatientQuery]    = useState("");
  const [patientOptions,  setPatientOptions]  = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDropdown, setPatientDropdown] = useState(false);
  const [searchingPat,    setSearchingPat]    = useState(false);
  const patientRef = useRef(null);

  // Créneaux alternatifs
  const [creneauxAlt,    setCreneauxAlt]    = useState([]);
  const [showCreneaux,   setShowCreneaux]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingMedecins(true);
    getMedecinsDisponibles()
      .then((liste) => setMedecins(Array.isArray(liste) ? liste : []))
      .catch(() => setMedecins([]))
      .finally(() => setLoadingMedecins(false));
  }, [open]);

  // Debounce patient search
  useEffect(() => {
    if (patient) return; // patient fourni en prop → pas de recherche
    const q = patientQuery.trim();
    if (q.length < 2) { setPatientOptions([]); return; }
    setSearchingPat(true);
    const timer = setTimeout(async () => {
      try {
        const res = await getPatients(q);
        const arr = Array.isArray(res) ? res : (res?.data ?? []);
        setPatientOptions(arr.slice(0, 10));
      } catch { setPatientOptions([]); }
      finally { setSearchingPat(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientQuery, patient]);

  // Fermer dropdown patient si clic extérieur
  useEffect(() => {
    const handler = (e) => { if (patientRef.current && !patientRef.current.contains(e.target)) setPatientDropdown(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleClose = () => {
    onClose();
    setForm(initForm());
    setSelectedPatient(null);
    setPatientQuery("");
    setCreneauxAlt([]);
    setShowCreneaux(false);
  };

  const selectPatient = (p) => {
    setSelectedPatient(p);
    setForm(f => ({ ...f, numPatientManuel: p.numPatient }));
    setPatientDropdown(false);
    setPatientQuery(`${p.prenom} ${p.nom} — ${p.numPatient}`);
  };

  const fetchCreneaux = async () => {
    if (!form.medecinId || !form.date) return;
    try {
      const dateDebut = `${form.date}T${form.heure || "09:00"}:00`;
      const slots = await getCreneauxDisponibles(Number(form.medecinId), dateDebut, 5);
      setCreneauxAlt(Array.isArray(slots) ? slots : []);
      setShowCreneaux(true);
    } catch { setCreneauxAlt([]); }
  };

  const handleSave = async () => {
    if (!form.date || !form.heure) {
      toast("Date et heure obligatoires", "warning");
      return;
    }
    if (!form.nomHopital.trim()) {
      toast("Le nom de l'établissement est obligatoire", "warning");
      return;
    }

    const payload = {
      nomHopital: form.nomHopital.trim(),
      dateHeure:  `${form.date}T${form.heure}:00`,
      type:       form.type,
      motif:      form.motif.trim() || undefined,
      medecinId:  form.medecinId ? Number(form.medecinId) : undefined,
    };

    const numPatient = (patient?.numPatient ?? form.numPatientManuel.trim()) || null;
    const isPatient  = user?.role === "PATIENT";

    // Le personnel soignant doit toujours spécifier un patient
    if (!numPatient && !isPatient) {
      toast("Veuillez saisir le numéro du patient (ex : PAT-00001)", "warning");
      return;
    }

    setSaving(true);
    try {
      const rdv = numPatient
        ? await createRendezVousByNumPatient(numPatient, payload)
        : await createRendezVous(payload);
      toast("Rendez-vous créé avec succès", "success");
      onCreated?.(rdv);
      handleClose();
    } catch (err) {
      const msg = err.apiMessage ?? err.message ?? "Erreur lors de la création du rendez-vous";
      if (msg.includes("RDV_CONFLIT") && form.medecinId) {
        toast("Créneau indisponible — voici les prochains créneaux libres", "warning");
        fetchCreneaux();
      } else {
        toast(msg, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nouveau rendez-vous"
      width={500}
      footer={
        <>
          <Btn variant="outline" onClick={handleClose} disabled={saving}>Annuler</Btn>
          <Btn icon={I.check} onClick={handleSave} disabled={saving}>
            {saving
              ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Enregistrement…
                </span>
              : "Confirmer le RDV"
            }
          </Btn>
        </>
      }
    >
      {/* ── Contexte patient ── */}
      {patient ? (
        <div style={{ background: C.primaryPale, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "0.65rem 0.95rem", marginBottom: "1.1rem", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.72rem", fontFamily: F.title, flexShrink: 0 }}>
            {`${patient.prenom?.[0] ?? ""}${patient.nom?.[0] ?? ""}`.toUpperCase() || "?"}
          </div>
          <div>
            <div style={{ fontSize: "0.84rem", fontWeight: 600, color: C.text }}>
              {patient.prenom} {patient.nom}
            </div>
            {patient.numPatient && (
              <div style={{ fontSize: "0.7rem", color: C.textMid }}>N° {patient.numPatient}</div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: "1.1rem", position: "relative" }} ref={patientRef}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
            Patient <span style={{ fontWeight: 400, color: C.textLight }}>(optionnel)</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              value={patientQuery}
              onChange={(e) => { setPatientQuery(e.target.value); setPatientDropdown(true); setSelectedPatient(null); setForm(f => ({ ...f, numPatientManuel: "" })); }}
              onFocus={() => patientQuery.length >= 2 && setPatientDropdown(true)}
              placeholder="Rechercher par nom, prénom ou N° patient…"
              style={{ width: "100%", padding: "0.5rem 2.2rem 0.5rem 0.85rem", border: `1.5px solid ${selectedPatient ? C.primary : C.border}`, borderRadius: 9, fontSize: "0.82rem", color: C.text, fontFamily: F.body, outline: "none", boxSizing: "border-box", background: selectedPatient ? C.primaryPale : "white" }}
            />
            {searchingPat && (
              <span style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", width: 14, height: 14, border: "2px solid rgba(0,0,0,0.15)", borderTopColor: C.primary, borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            )}
          </div>
          {patientDropdown && patientOptions.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: `1.5px solid ${C.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50, maxHeight: 200, overflowY: "auto", marginTop: 2 }}>
              {patientOptions.map((p) => (
                <div
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  style={{ padding: "0.55rem 0.85rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.borderLight}` }}
                  onMouseEnter={(e) => e.currentTarget.style.background = C.primaryPale}
                  onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                >
                  <div>
                    <div style={{ fontSize: "0.83rem", fontWeight: 600, color: C.text }}>{p.prenom} {p.nom}</div>
                    {p.dateNaissance && <div style={{ fontSize: "0.7rem", color: C.textLight }}>Né(e) le {new Date(p.dateNaissance).toLocaleDateString("fr-FR")}</div>}
                  </div>
                  <span style={{ fontSize: "0.7rem", fontFamily: "monospace", color: C.primary, fontWeight: 600 }}>{p.numPatient}</span>
                </div>
              ))}
            </div>
          )}
          {selectedPatient && (
            <div style={{ fontSize: "0.72rem", color: C.primary, marginTop: "0.2rem" }}>
              ✓ Patient sélectionné — {selectedPatient.numPatient}
            </div>
          )}
        </div>
      )}

      {/* ── Sélecteur médecin ── */}
      <div style={{ marginBottom: "1.1rem" }}>
        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
          Médecin <span style={{ fontWeight: 400, color: C.textLight }}>(optionnel)</span>
        </label>
        <select
          value={form.medecinId}
          onChange={set("medecinId")}
          disabled={loadingMedecins}
          style={{ width: "100%", padding: "0.5rem 0.85rem", border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: "0.82rem", color: form.medecinId ? C.text : C.textLight, fontFamily: F.body, outline: "none", background: "white", boxSizing: "border-box", cursor: "pointer" }}
        >
          <option value="">{loadingMedecins ? "Chargement…" : "— Sélectionner un médecin —"}</option>
          {medecins.map((m) => (
            <option key={m.id} value={m.id}>
              Dr. {m.prenom} {m.nom}
              {m.specialite ? ` — ${m.specialite}` : ""}
              {m.etablissement ? ` (${m.etablissement})` : ""}
            </option>
          ))}
        </select>
        {medecins.length > 0 && form.medecinId && (() => {
          const sel = medecins.find((m) => m.id === Number(form.medecinId));
          return sel ? (
            <div style={{ marginTop: "0.35rem", fontSize: "0.73rem", color: C.textMid, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: sel.disponible ? C.accent : C.danger, flexShrink: 0 }} />
              {sel.disponible ? "Disponible" : "Non disponible"}{sel.specialite ? ` · ${sel.specialite}` : ""}
            </div>
          ) : null;
        })()}
      </div>

      {/* ── Type de RDV ── */}
      <div style={{ marginBottom: "1.1rem" }}>
        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.textMid, marginBottom: "0.5rem", fontFamily: F.title }}>Type</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {TYPE_OPTIONS.map((t) => (
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

      {/* ── Date / Heure ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <InputField label="Date *"  type="date" value={form.date}  onChange={set("date")}  required min={today} />
        <InputField label="Heure *" type="time" value={form.heure} onChange={set("heure")} required />
      </div>

      {/* ── Créneaux alternatifs ── */}
      {showCreneaux && creneauxAlt.length > 0 && (
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "0.75rem 0.85rem", marginTop: "-0.2rem" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#b45309", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <Icon d={I.calendar} size={13} stroke="#b45309" sw={2} />
            Créneaux disponibles — sélectionnez-en un
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {creneauxAlt.map((slot) => {
              const dt = new Date(slot);
              const label = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })
                + " " + dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
              return (
                <button
                  key={slot}
                  onClick={() => {
                    const d = new Date(slot);
                    const dateStr = d.toISOString().split("T")[0];
                    const heureStr = d.toTimeString().slice(0, 5);
                    setForm(f => ({ ...f, date: dateStr, heure: heureStr }));
                    setShowCreneaux(false);
                  }}
                  style={{ padding: "0.35rem 0.65rem", borderRadius: 7, border: "1px solid #fbbf24", background: "white", color: "#92400e", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", fontFamily: F.title }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Établissement ── */}
      <InputField
        label="Établissement *"
        value={form.nomHopital}
        onChange={set("nomHopital")}
        placeholder="Hôpital Principal de Dakar, Clinique Pasteur…"
        required
      />

      {/* ── Motif ── */}
      <div>
        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
          Motif <span style={{ fontWeight: 400, color: C.textLight }}>(optionnel)</span>
        </label>
        <textarea
          value={form.motif}
          onChange={set("motif")}
          placeholder="Suivi HTA, bilan sanguin, contrôle post-opératoire…"
          rows={3}
          style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "0.65rem 0.85rem", fontSize: "0.82rem", resize: "vertical", outline: "none", fontFamily: F.body, color: C.text, boxSizing: "border-box", lineHeight: 1.55 }}
        />
      </div>
    </Modal>
  );
};

export default ModalRDV;
