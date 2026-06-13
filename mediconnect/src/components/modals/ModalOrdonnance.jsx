import { useState, useEffect, useRef, useCallback } from "react";
import { C, F } from "../../constants/theme.js";
import { I }   from "../../constants/icons.js";
import { createOrdonnance } from "../../api/ordonnances.api.js";
import { getPatients }      from "../../api/patients.api.js";
import { getConsultationsByPatient } from "../../api/consultations.api.js";
import Modal      from "../ui/Modal.jsx";
import Btn        from "../ui/Btn.jsx";
import Icon       from "../ui/Icon.jsx";

/*
  Props :
    open           — booléen
    onClose        — callback fermeture
    toast          — fonction toast(msg, type)
    consultationId — number | string | null  (si fourni : sélection patient ignorée)
    patient        — PatientResponse | null  (si fourni : sélection patient ignorée)
    onCreated      — callback(OrdonnanceResponse) après création
*/

const emptyLigne = () => ({
  medicament:   "",
  posologie:    "",
  duree:        "",
  quantite:     "",
  instructions: "",
});

const inputSt = {
  width: "100%", padding: "0.5rem 0.85rem",
  border: `1.5px solid ${C.border}`, borderRadius: 9,
  fontSize: "0.82rem", color: C.text, fontFamily: F.body,
  outline: "none", boxSizing: "border-box", background: "white",
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const ModalOrdonnance = ({ open, onClose, toast, consultationId, patient, onCreated }) => {
  /* ── Sélection patient ── */
  const [recherche,          setRecherche]          = useState("");
  const [patients,           setPatients]           = useState([]);
  const [loadingPatients,    setLoadingPatients]    = useState(false);
  const [dropdownVisible,    setDropdownVisible]    = useState(false);
  const [selectedPatient,    setSelectedPatient]    = useState(patient ?? null);
  const searchRef  = useRef(null);
  const debounceRef = useRef(null);

  /* ── Sélection consultation ── */
  const [consultations,      setConsultations]      = useState([]);
  const [loadingConsults,    setLoadingConsults]    = useState(false);
  const [selectedConsultId,  setSelectedConsultId]  = useState(consultationId ?? "");

  /* ── Ordonnance ── */
  const [dateExpiration, setDateExpiration] = useState("");
  const [lignes,         setLignes]         = useState([emptyLigne()]);
  const [saving,         setSaving]         = useState(false);

  /* ── Recherche patients avec debounce côté serveur ── */
  const searchPatients = useCallback((terme) => {
    clearTimeout(debounceRef.current);
    if (terme.trim().length < 2) { setPatients([]); setLoadingPatients(false); return; }
    setLoadingPatients(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await getPatients(terme.trim());
        const arr = Array.isArray(res) ? res : (res?.data ?? []);
        setPatients(arr);
      } catch {
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    }, 300);
  }, []);

  /* ── Chargement des consultations quand un patient est sélectionné ── */
  useEffect(() => {
    if (!selectedPatient?.id) { setConsultations([]); setSelectedConsultId(""); return; }
    if (consultationId) return; // consultation pré-sélectionnée
    setLoadingConsults(true);
    getConsultationsByPatient(selectedPatient.id)
      .then((d) => {
        const arr = Array.isArray(d) ? d : (d?.data ?? []);
        setConsultations(arr);
        if (arr.length === 1) setSelectedConsultId(String(arr[0].id));
      })
      .catch(() => setConsultations([]))
      .finally(() => setLoadingConsults(false));
  }, [selectedPatient, consultationId]);

  /* ── Reset à la fermeture ── */
  const resetForm = () => {
    clearTimeout(debounceRef.current);
    setRecherche(""); setPatients([]); setSelectedPatient(patient ?? null);
    setConsultations([]); setSelectedConsultId(consultationId ?? "");
    setDateExpiration(""); setLignes([emptyLigne()]);
    setDropdownVisible(false);
  };

  const handleClose = () => { onClose(); resetForm(); };

  const choisirPatient = (p) => {
    setSelectedPatient(p);
    setRecherche(`${p.prenom} ${p.nom} · ${p.numPatient}`);
    setPatients([]);
    setDropdownVisible(false);
    setSelectedConsultId("");
  };

  /* ── Lignes ── */
  const updateLigne = (i, field, val) =>
    setLignes((ls) => ls.map((l, j) => j === i ? { ...l, [field]: val } : l));
  const addLigne    = () => setLignes((ls) => [...ls, emptyLigne()]);
  const removeLigne = (i) => setLignes((ls) => ls.filter((_, j) => j !== i));

  /* ── Soumission ── */
  const handleSubmit = async () => {
    const cid = consultationId ?? selectedConsultId;
    if (!cid) {
      toast("Sélectionnez une consultation", "warning"); return;
    }
    if (!dateExpiration) {
      toast("La date d'expiration est obligatoire", "warning"); return;
    }
    const validLignes = lignes.filter((l) => l.medicament.trim());
    if (!validLignes.length) {
      toast("Ajoutez au moins un médicament", "warning"); return;
    }

    const payload = {
      dateExpiration: `${dateExpiration}T23:59:00`,
      lignes: validLignes.map((l) => ({
        medicament:   l.medicament.trim(),
        posologie:    l.posologie.trim()    || undefined,
        duree:        l.duree.trim()        || undefined,
        quantite:     l.quantite ? parseInt(l.quantite, 10) : undefined,
        instructions: l.instructions.trim() || undefined,
      })),
    };

    setSaving(true);
    try {
      const result = await createOrdonnance(cid, payload);
      toast("Ordonnance créée avec succès", "success");
      onCreated?.(result);
      handleClose();
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la création de l'ordonnance", "error");
    } finally {
      setSaving(false);
    }
  };

  const patientEffectif = patient ?? selectedPatient;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nouvelle ordonnance électronique"
      width={680}
      footer={
        <>
          <Btn variant="outline" onClick={handleClose} disabled={saving}>Annuler</Btn>
          <Btn icon={I.check} onClick={handleSubmit} disabled={saving}>
            {saving
              ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Enregistrement…
                </span>
              : "Signer & Émettre"
            }
          </Btn>
        </>
      }
    >
      {/* ── Contexte patient pré-sélectionné (prop) ── */}
      {patientEffectif && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.65rem 0.95rem", background: C.primaryPale, borderRadius: 10, marginBottom: "1rem", border: `1px solid ${C.borderLight}` }}>
          <Icon d={I.user} size={14} stroke={C.primary} sw={2} />
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>
            {patientEffectif.prenom} {patientEffectif.nom}
          </span>
          {patientEffectif.numPatient && (
            <span style={{ fontSize: "0.72rem", color: C.textMid }}>· {patientEffectif.numPatient}</span>
          )}
          {/* Bouton changer patient si pas de patient fixé en prop */}
          {!patient && (
            <button
              onClick={() => { setSelectedPatient(null); setRecherche(""); setConsultations([]); setSelectedConsultId(""); }}
              style={{ marginLeft: "auto", fontSize: "0.72rem", color: C.textMid, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Changer
            </button>
          )}
        </div>
      )}

      {/* ── Recherche patient (si aucun patient pré-sélectionné) ── */}
      {!patient && !selectedPatient && (
        <div style={{ marginBottom: "1rem", position: "relative" }} ref={searchRef}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
            Patient <span style={{ color: C.danger }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              value={recherche}
              onChange={(e) => {
                setRecherche(e.target.value);
                setDropdownVisible(true);
                searchPatients(e.target.value);
              }}
              onFocus={() => recherche.trim().length >= 2 && setDropdownVisible(true)}
              placeholder="Rechercher par nom, prénom ou N° patient…"
              style={{ ...inputSt, paddingLeft: "2rem" }}
            />
            <Icon d={I.user} size={14} stroke={C.textLight} sw={2} style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            {loadingPatients && (
              <span style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.72rem", color: C.textLight }}>Chargement…</span>
            )}
          </div>

          {/* Dropdown résultats serveur */}
          {dropdownVisible && recherche.trim().length >= 2 && (
            <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 100, background: "white", border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 220, overflowY: "auto" }}>
              {loadingPatients ? (
                <div style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: C.textLight }}>Recherche…</div>
              ) : patients.length === 0 ? (
                <div style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: C.textLight }}>Aucun patient trouvé</div>
              ) : patients.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  onMouseDown={() => choisirPatient(p)}
                  style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", padding: "0.6rem 0.85rem", border: "none", background: "none", cursor: "pointer", textAlign: "left", borderBottom: `1px solid ${C.borderLight}` }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: C.primaryPale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon d={I.user} size={13} stroke={C.primary} sw={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>{p.prenom} {p.nom}</div>
                    <div style={{ fontSize: "0.7rem", color: C.textMid, fontFamily: "monospace" }}>{p.numPatient}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Sélection consultation ── */}
      {!consultationId && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
            Consultation liée <span style={{ color: C.danger }}>*</span>
          </label>
          {!selectedPatient ? (
            <div style={{ padding: "0.55rem 0.85rem", border: `1.5px solid ${C.borderLight}`, borderRadius: 9, fontSize: "0.8rem", color: C.textLight, background: C.bg }}>
              Sélectionnez d'abord un patient
            </div>
          ) : loadingConsults ? (
            <div style={{ padding: "0.55rem 0.85rem", border: `1.5px solid ${C.borderLight}`, borderRadius: 9, fontSize: "0.8rem", color: C.textLight, background: C.bg }}>
              Chargement des consultations…
            </div>
          ) : consultations.length === 0 ? (
            <div style={{ padding: "0.55rem 0.85rem", border: `1.5px solid ${C.borderLight}`, borderRadius: 9, fontSize: "0.8rem", color: C.textLight, background: C.bg }}>
              Aucune consultation pour ce patient
            </div>
          ) : (
            <select
              value={selectedConsultId}
              onChange={(e) => setSelectedConsultId(e.target.value)}
              style={{ ...inputSt, cursor: "pointer" }}
            >
              <option value="">— Sélectionner une consultation —</option>
              {consultations.map((c) => (
                <option key={c.id} value={c.id}>
                  {fmtDate(c.dateHeure)} — {c.motif ?? "Consultation"} · {c.statut}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ── Date d'expiration ── */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
          Date d'expiration <span style={{ color: C.danger }}>*</span>
        </label>
        <input
          type="date"
          value={dateExpiration}
          onChange={(e) => setDateExpiration(e.target.value)}
          style={{ padding: "0.5rem 0.85rem", border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: "0.82rem", color: C.text, fontFamily: F.body, outline: "none" }}
        />
      </div>

      {/* ── Lignes de prescription ── */}
      <div style={{ borderTop: `1px solid ${C.borderLight}`, paddingTop: "1rem" }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.textMid, marginBottom: "0.75rem", fontFamily: F.title, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Médicaments
        </div>

        {lignes.map((l, i) => (
          <div key={i} style={{ background: C.bg, borderRadius: 10, padding: "0.85rem", marginBottom: "0.65rem", border: `1px solid ${C.borderLight}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.5rem", alignItems: "start", marginBottom: "0.55rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: C.textMid, marginBottom: "0.2rem" }}>
                  Médicament <span style={{ color: C.danger }}>*</span>
                </label>
                <input
                  value={l.medicament}
                  onChange={(e) => updateLigne(i, "medicament", e.target.value)}
                  placeholder="Amoxicilline 500mg, Paracétamol 1g…"
                  style={{ ...inputSt }}
                />
              </div>
              <button
                onClick={() => removeLigne(i)}
                disabled={lignes.length === 1}
                title="Supprimer cette ligne"
                style={{
                  marginTop: "1.35rem", width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  border: `1px solid ${lignes.length === 1 ? C.borderLight : C.danger + "55"}`,
                  background: lignes.length === 1 ? "transparent" : C.danger + "10",
                  color: lignes.length === 1 ? C.textLight : C.danger,
                  cursor: lignes.length === 1 ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon d={I.trash} size={12} sw={2} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
              {[
                { field: "posologie",  label: "Posologie",  placeholder: "2 cp/j matin et soir" },
                { field: "duree",      label: "Durée",      placeholder: "7 jours, 1 mois…" },
                { field: "quantite",   label: "Quantité",   placeholder: "14", type: "number" },
              ].map(({ field, label, placeholder, type = "text" }) => (
                <div key={field}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: C.textMid, marginBottom: "0.2rem" }}>{label}</label>
                  <input
                    type={type}
                    value={l[field]}
                    onChange={(e) => updateLigne(i, field, e.target.value)}
                    placeholder={placeholder}
                    style={{ ...inputSt, fontSize: "0.8rem" }}
                  />
                </div>
              ))}
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: C.textMid, marginBottom: "0.2rem" }}>
                Instructions <span style={{ fontWeight: 400, color: C.textLight }}>(optionnel)</span>
              </label>
              <input
                value={l.instructions}
                onChange={(e) => updateLigne(i, "instructions", e.target.value)}
                placeholder="À prendre avec les repas, éviter le soleil…"
                style={{ ...inputSt, fontSize: "0.8rem" }}
              />
            </div>
          </div>
        ))}

        <Btn variant="outline" size="sm" icon={I.plus} onClick={addLigne}>
          Ajouter un médicament
        </Btn>
      </div>
    </Modal>
  );
};

export default ModalOrdonnance;
