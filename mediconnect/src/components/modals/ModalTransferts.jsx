import { useState, useEffect, useRef, useCallback } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import {
  initierTransfert,
  marquerEffectueTransfert,
} from "../../api/transferts.api.js";
import { getHopitaux } from "../../api/hopitaux.api.js";
import { getPatients }     from "../../api/patients.api.js";
import { searchMedecins }  from "../../api/medecins.api.js";
import { useAuth } from "../../api/AuthContext.jsx";
import Modal            from "../ui/Modal.jsx";
import Btn              from "../ui/Btn.jsx";
import Icon             from "../ui/Icon.jsx";
import { Badge }        from "../ui/TagBadge.jsx";
import SearchableSelect from "../ui/SearchableSelect.jsx";

// ETABLISSEMENTS est chargé dynamiquement depuis l'API dans ModalInitierTransfert

const TYPE_OPTIONS = [
  { value: "INTERNE", label: "Interne"        },
  { value: "EXTERNE", label: "Externe"        },
  { value: "URGENCE", label: "Urgence vitale" },
];

const STATUT_MAP = {
  EN_ATTENTE: { color: "#e08833", label: "En attente" },
  ACCEPTE:    { color: "#0a9d6f", label: "Accepté"    },
  REFUSE:     { color: "#d63031", label: "Refusé"     },
  EFFECTUE:   { color: "#17935a", label: "Effectué"   },
  ANNULE:     { color: "#6c757d", label: "Annulé"     },
};

const TYPE_LABEL = {
  INTERNE: "Interne",
  EXTERNE: "Externe",
  URGENCE: "Urgence vitale",
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

const initForm = () => ({
  source:      "",
  dest:        "",
  type:        "INTERNE",
  motif:       "",
  compteRendu: "",
});

const inputSt = {
  width: "100%", padding: "0.5rem 0.85rem",
  border: `1.5px solid #d0d5dd`, borderRadius: 9,
  fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

/* ══════════════════════════════════════════════════════════════════════════════
   MODAL INITIER TRANSFERT
══════════════════════════════════════════════════════════════════════════════ */
const ModalInitierTransfert = ({ open, onClose, toast, patient = null, onCreated }) => {
  const { user } = useAuth();
  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState(initForm);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [hopitaux, setHopitaux] = useState([]);

  /* ── Recherche patient ── */
  const [recherchePatient,   setRecherchePatient]   = useState("");
  const [patientsResults,    setPatientsResults]    = useState([]);
  const [loadingPatients,    setLoadingPatients]    = useState(false);
  const [patientDropVisible, setPatientDropVisible] = useState(false);
  const [selectedPatient,    setSelectedPatient]    = useState(patient ?? null);
  const debouncePatientRef = useRef(null);

  /* ── Recherche médecin destination ── */
  const [rechercheMed,      setRechercheMed]      = useState("");
  const [medecinResults,    setMedecinResults]    = useState([]);
  const [loadingMedecins,   setLoadingMedecins]   = useState(false);
  const [medDropVisible,    setMedDropVisible]    = useState(false);
  const [selectedMedDest,   setSelectedMedDest]   = useState(null);
  const debounceMedRef = useRef(null);

  const sourceVerrouille = user?.etablissement ?? null;

  useEffect(() => {
    if (!open) return;
    if (sourceVerrouille) setForm(f => ({ ...f, source: sourceVerrouille }));
    getHopitaux()
      .then((data) => setHopitaux(Array.isArray(data) ? data : []))
      .catch(() => setHopitaux([]));
  }, [open, sourceVerrouille]);

  /* ── Debounce patient ── */
  const doSearchPatient = useCallback((terme) => {
    clearTimeout(debouncePatientRef.current);
    if (terme.trim().length < 2) { setPatientsResults([]); setLoadingPatients(false); return; }
    setLoadingPatients(true);
    debouncePatientRef.current = setTimeout(async () => {
      try {
        const res = await getPatients(terme.trim());
        setPatientsResults(Array.isArray(res) ? res : (res?.data ?? []));
      } catch { setPatientsResults([]); }
      finally { setLoadingPatients(false); }
    }, 300);
  }, []);

  /* ── Debounce médecin ── */
  const doSearchMedecin = useCallback((terme) => {
    clearTimeout(debounceMedRef.current);
    if (terme.trim().length < 2) { setMedecinResults([]); setLoadingMedecins(false); return; }
    setLoadingMedecins(true);
    debounceMedRef.current = setTimeout(async () => {
      try {
        const res = await searchMedecins(terme.trim());
        setMedecinResults(Array.isArray(res) ? res : []);
      } catch { setMedecinResults([]); }
      finally { setLoadingMedecins(false); }
    }, 300);
  }, []);

  const choisirPatient = (p) => {
    setSelectedPatient(p);
    setRecherchePatient(`${p.prenom} ${p.nom} · ${p.numPatient}`);
    setPatientsResults([]);
    setPatientDropVisible(false);
  };

  const choisirMedecin = (m) => {
    setSelectedMedDest(m);
    setRechercheMed(`Dr. ${m.prenom} ${m.nom}${m.specialite ? ` · ${m.specialite}` : ""}`);
    setMedecinResults([]);
    setMedDropVisible(false);
    // Auto-remplir l'établissement destination si le médecin en a un
    if (m.etablissement) {
      const hopMatch = hopitaux.find(h => h.nom?.toLowerCase() === m.etablissement?.toLowerCase());
      if (hopMatch) setForm(f => ({ ...f, dest: hopMatch.id }));
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1); setDone(false); setSaving(false); setForm(initForm());
      setSelectedPatient(patient ?? null); setRecherchePatient("");
      setSelectedMedDest(null); setRechercheMed("");
      setPatientsResults([]); setMedecinResults([]);
    }, 200);
  };

  const handleStep1 = () => {
    const pid = patient?.id ?? selectedPatient?.id;
    if (!pid)            { toast("Sélectionnez un patient", "warning"); return; }
    if (!selectedMedDest) { toast("Sélectionnez le médecin destinataire", "warning"); return; }
    if (!form.dest)      { toast("Établissement de destination obligatoire", "warning"); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.motif.trim()) { toast("Motif du transfert obligatoire", "warning"); return; }

    const patientId = patient?.id ?? selectedPatient?.id;
    const resolveNom = (val) => hopitaux.find(h => h.id === val)?.nom ?? val;
    const payload = {
      patientId,
      medecinId:             user?.userId,
      medecinDestinationId:  selectedMedDest?.id ?? undefined,
      nomHopitalSource:      form.source ? resolveNom(form.source) : undefined,
      nomHopitalDestination: resolveNom(form.dest),
      type:                  form.type,
      motif:                 form.motif.trim(),
      compteRendu:           form.compteRendu.trim() || undefined,
    };

    setSaving(true);
    try {
      const result = await initierTransfert(payload);
      toast("Transfert initié avec succès", "success");
      onCreated?.(result);
      setDone(true);
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la création du transfert", "error");
    } finally {
      setSaving(false);
    }
  };

  const footer = done ? (
    <Btn full onClick={handleClose} icon={I.check}>Fermer</Btn>
  ) : step === 1 ? (
    <>
      <Btn variant="outline" onClick={handleClose}>Annuler</Btn>
      <Btn icon={I.arrowR} onClick={handleStep1}>Continuer</Btn>
    </>
  ) : (
    <>
      <Btn variant="outline" onClick={() => setStep(1)} disabled={saving}>Retour</Btn>
      <Btn onClick={handleSubmit} icon={I.arrowR} disabled={saving}>
        {saving
          ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              Envoi…
            </span>
          : "Initier le transfert"
        }
      </Btn>
    </>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Initier un transfert" width={560} footer={footer}>

      {/* ── Succès ── */}
      {done && (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e5f7ef", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Icon d={I.arrowR} size={28} stroke="#17935a" sw={2} />
          </div>
          <h3 style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1.05rem", color: C.text, marginBottom: "0.5rem" }}>Transfert initié !</h3>
          <div style={{ background: C.bg, borderRadius: 10, padding: "0.75rem", marginTop: "0.75rem", fontSize: "0.8rem", color: C.textMid, lineHeight: 1.6 }}>
            {selectedMedDest && <><strong>Destinataire :</strong> Dr. {selectedMedDest.prenom} {selectedMedDest.nom}<br /></>}
            <strong>Destination :</strong> {hopitaux.find(h => h.id === form.dest)?.nom ?? form.dest}<br />
            <strong>Type :</strong> {TYPE_OPTIONS.find((t) => t.value === form.type)?.label ?? form.type}
          </div>
        </div>
      )}

      {/* ── Barre de progression ── */}
      {!done && (
        <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem" }}>
          {[1, 2].map((s) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: s <= step ? C.primary : C.borderLight, transition: "background 0.3s" }} />
          ))}
        </div>
      )}

      {/* ── Étape 1 : Patient / Médecin dest / Où / Type ── */}
      {!done && step === 1 && (
        <>
          {/* ── Patient ── */}
          {patient ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.65rem 0.95rem", background: C.primaryPale, borderRadius: 10, marginBottom: "1rem", border: `1px solid ${C.borderLight}` }}>
              <Icon d={I.user} size={14} stroke={C.primary} sw={2} />
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>{patient.prenom} {patient.nom}</span>
              {patient.numPatient && <span style={{ fontSize: "0.72rem", color: C.textMid }}>· {patient.numPatient}</span>}
            </div>
          ) : selectedPatient ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.65rem 0.95rem", background: C.primaryPale, borderRadius: 10, marginBottom: "1rem", border: `1px solid ${C.borderLight}` }}>
              <Icon d={I.user} size={14} stroke={C.primary} sw={2} />
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>{selectedPatient.prenom} {selectedPatient.nom}</span>
              {selectedPatient.numPatient && <span style={{ fontSize: "0.72rem", color: C.textMid }}>· {selectedPatient.numPatient}</span>}
              <button onClick={() => { setSelectedPatient(null); setRecherchePatient(""); }}
                style={{ marginLeft: "auto", fontSize: "0.72rem", color: C.textMid, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Changer
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: "1rem", position: "relative" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
                Patient <span style={{ color: C.danger }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={recherchePatient}
                  onChange={e => { setRecherchePatient(e.target.value); setPatientDropVisible(true); doSearchPatient(e.target.value); }}
                  onFocus={() => recherchePatient.trim().length >= 2 && setPatientDropVisible(true)}
                  placeholder="Nom, prénom ou N° patient…"
                  style={{ ...inputSt, paddingLeft: "2rem" }}
                />
                <Icon d={I.user} size={13} stroke={C.textLight} sw={2} style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                {loadingPatients && <span style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: C.textLight }}>…</span>}
              </div>
              {patientDropVisible && recherchePatient.trim().length >= 2 && (
                <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200, background: "white", border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 200, overflowY: "auto" }}>
                  {loadingPatients ? (
                    <div style={{ padding: "0.6rem 1rem", fontSize: "0.8rem", color: C.textLight }}>Recherche…</div>
                  ) : patientsResults.length === 0 ? (
                    <div style={{ padding: "0.6rem 1rem", fontSize: "0.8rem", color: C.textLight }}>Aucun patient trouvé</div>
                  ) : patientsResults.slice(0, 7).map(p => (
                    <button key={p.id} onMouseDown={() => choisirPatient(p)}
                      style={{ display: "flex", alignItems: "center", gap: "0.55rem", width: "100%", padding: "0.5rem 0.85rem", border: "none", background: "none", cursor: "pointer", textAlign: "left", borderBottom: `1px solid ${C.borderLight}` }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: C.primaryPale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon d={I.user} size={12} stroke={C.primary} sw={2} />
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

          {/* ── Médecin destinataire ── */}
          {selectedMedDest ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.65rem 0.95rem", background: "#f0fdf4", borderRadius: 10, marginBottom: "1rem", border: "1px solid #bbf7d0" }}>
              <Icon d={I.shield} size={14} stroke="#16a34a" sw={2} />
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>Dr. {selectedMedDest.prenom} {selectedMedDest.nom}</div>
                {selectedMedDest.specialite && <div style={{ fontSize: "0.7rem", color: C.textMid }}>{selectedMedDest.specialite}</div>}
              </div>
              <button onClick={() => { setSelectedMedDest(null); setRechercheMed(""); }}
                style={{ marginLeft: "auto", fontSize: "0.72rem", color: C.textMid, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                Changer
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: "1rem", position: "relative" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
                Médecin destinataire <span style={{ color: C.danger }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={rechercheMed}
                  onChange={e => { setRechercheMed(e.target.value); setMedDropVisible(true); doSearchMedecin(e.target.value); }}
                  onFocus={() => rechercheMed.trim().length >= 2 && setMedDropVisible(true)}
                  placeholder="Nom ou prénom du médecin…"
                  style={{ ...inputSt, paddingLeft: "2rem" }}
                />
                <Icon d={I.shield} size={13} stroke={C.textLight} sw={2} style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                {loadingMedecins && <span style={{ position: "absolute", right: "0.7rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: C.textLight }}>…</span>}
              </div>
              {medDropVisible && rechercheMed.trim().length >= 2 && (
                <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200, background: "white", border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 200, overflowY: "auto" }}>
                  {loadingMedecins ? (
                    <div style={{ padding: "0.6rem 1rem", fontSize: "0.8rem", color: C.textLight }}>Recherche…</div>
                  ) : medecinResults.length === 0 ? (
                    <div style={{ padding: "0.6rem 1rem", fontSize: "0.8rem", color: C.textLight }}>Aucun médecin trouvé</div>
                  ) : medecinResults.slice(0, 7).map(m => (
                    <button key={m.id} onMouseDown={() => choisirMedecin(m)}
                      style={{ display: "flex", alignItems: "center", gap: "0.55rem", width: "100%", padding: "0.5rem 0.85rem", border: "none", background: "none", cursor: "pointer", textAlign: "left", borderBottom: `1px solid ${C.borderLight}` }}>
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon d={I.shield} size={12} stroke="#16a34a" sw={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>Dr. {m.prenom} {m.nom}</div>
                        {m.specialite && <div style={{ fontSize: "0.7rem", color: C.textMid }}>{m.specialite}{m.etablissement ? ` · ${m.etablissement}` : ""}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Établissements ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {sourceVerrouille ? (
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>Établissement source</label>
                <div style={{ padding: "0.68rem 0.85rem", borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: "0.88rem", background: C.bg, color: C.text, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>{sourceVerrouille}</span>
                  <Icon d={I.shield} size={12} stroke={C.primary} sw={2} />
                </div>
              </div>
            ) : (
              <SearchableSelect label="Établissement source" items={hopitaux} value={form.source}
                onChange={id => setForm(f => ({ ...f, source: id }))} placeholder="— Source —" />
            )}
            <SearchableSelect label="Établissement destination" required
              items={hopitaux.filter(h => h.id !== form.source && h.nom !== form.source)}
              value={form.dest}
              onChange={id => setForm(f => ({ ...f, dest: id }))} placeholder="— Destination —" />
          </div>

          {/* ── Type ── */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>Type de transfert</label>
            <select value={form.type} onChange={set("type")}
              style={{ width: "100%", padding: "0.68rem 0.85rem", border: `1.5px solid ${C.border}`, borderRadius: 10, fontSize: "0.88rem", color: C.text, background: "white", outline: "none", fontFamily: F.body, cursor: "pointer" }}>
              {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </>
      )}

      {/* ── Étape 2 : Motif + CR ── */}
      {!done && step === 2 && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
              Motif du transfert <span style={{ color: C.danger }}>*</span>
            </label>
            <textarea value={form.motif} onChange={set("motif")}
              placeholder="Décrivez le motif médical du transfert…" rows={3}
              style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "0.65rem 0.85rem", fontSize: "0.85rem", resize: "vertical", outline: "none", fontFamily: F.body, color: C.text, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
              Compte-rendu initial <span style={{ fontWeight: 400, color: C.textLight }}>(optionnel)</span>
            </label>
            <textarea value={form.compteRendu} onChange={set("compteRendu")}
              placeholder="État du patient, informations pour l'équipe d'accueil…" rows={3}
              style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "0.65rem 0.85rem", fontSize: "0.85rem", resize: "vertical", outline: "none", fontFamily: F.body, color: C.text, boxSizing: "border-box" }} />
          </div>
        </>
      )}
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MODAL COMPTE-RENDU TRANSFERT  (lecture seule — pas d'endpoint PATCH /cr)
══════════════════════════════════════════════════════════════════════════════ */
const ModalCRTransfert = ({ open, onClose, transfert = null }) => {
  if (!open) return null;

  const t = transfert ?? {};
  const { color: sc, label: sl } = STATUT_MAP[t.statut] ?? { color: C.textMid, label: t.statut ?? "—" };

  const rows = [
    ["Type",            TYPE_LABEL[t.type] ?? t.type ?? "—"],
    ["Motif",           t.motif   ?? "—"],
    ["Date transfert",  fmtDate(t.dateTransfert ?? t.createdAt)],
    ["Médecin source",  t.prenomMedecin ? `Dr ${t.prenomMedecin} ${t.nomMedecin}` : "—"],
  ].filter(([, v]) => v && v !== "—");

  return (
    <Modal open={open} onClose={onClose} title="Compte-rendu de transfert" width={540}
      footer={<Btn full variant="outline" onClick={onClose}>Fermer</Btn>}
    >
      {/* Récap */}
      <div style={{ background: C.bg, borderRadius: 12, padding: "1rem 1.2rem", marginBottom: "1.2rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
          <div>
            <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.95rem", color: C.text }}>
              {t.prenomPatient} {t.nomPatient}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.7rem", borderRadius: 100, background: `${sc}15` }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: sc }}>{sl}</span>
          </div>
        </div>

        {/* Trajet */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.8rem", background: "white", borderRadius: 9, border: `1px solid ${C.borderLight}`, marginBottom: "0.6rem" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 500, color: C.text }}>{t.hopitalSource ?? "—"}</span>
          <Icon d={I.arrowR} size={14} stroke={C.primary} sw={2} />
          <span style={{ fontSize: "0.78rem", fontWeight: 500, color: C.text }}>{t.hopitalDestination ?? "—"}</span>
        </div>

        {/* Métadonnées */}
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", borderBottom: `1px solid ${C.borderLight}`, fontSize: "0.78rem" }}>
            <span style={{ color: C.textMid }}>{k}</span>
            <span style={{ fontWeight: 500, color: C.text }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Compte-rendu */}
      <div>
        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.5rem", fontFamily: F.title }}>
          Compte-rendu médical
        </label>
        <div style={{ background: C.bg, borderRadius: 10, padding: "0.85rem 1rem", fontSize: "0.84rem", color: C.textMid, lineHeight: 1.7, minHeight: 80, border: `1px solid ${C.borderLight}` }}>
          {t.compteRendu || <span style={{ color: C.textLight, fontStyle: "italic" }}>Aucun compte-rendu rédigé.</span>}
        </div>
      </div>
    </Modal>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MODAL MARQUER EFFECTUÉ
══════════════════════════════════════════════════════════════════════════════ */
const ModalMarquerComplete = ({ open, onClose, toast, transfert = null, onCompleted }) => {
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);

  const handleClose = () => {
    onClose();
    setTimeout(() => { setDone(false); setSaving(false); }, 200);
  };

  const handleConfirm = async () => {
    if (!transfert?.id) return;
    setSaving(true);
    try {
      const updated = await marquerEffectueTransfert(transfert.id);
      setDone(true);
      toast("Transfert marqué comme effectué", "success");
      onCompleted?.(updated);
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la mise à jour", "error");
    } finally {
      setSaving(false);
    }
  };

  const t = transfert ?? {};

  const footer = done ? (
    <Btn full onClick={handleClose} icon={I.check}>Fermer</Btn>
  ) : (
    <>
      <Btn variant="outline" onClick={handleClose} disabled={saving}>Annuler</Btn>
      <Btn onClick={handleConfirm} icon={I.check} disabled={saving}>
        {saving
          ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
              Confirmation…
            </span>
          : "Confirmer l'arrivée"
        }
      </Btn>
    </>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Confirmer l'arrivée du patient" width={480} footer={footer}>
      {done ? (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e5f7ef", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Icon d={I.check} size={28} stroke="#17935a" sw={2} />
          </div>
          <h3 style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1.05rem", color: C.text, marginBottom: "0.5rem" }}>Transfert effectué</h3>
          <p style={{ fontSize: "0.84rem", color: C.textMid, lineHeight: 1.6 }}>
            L'arrivée de <strong>{t.prenomPatient} {t.nomPatient}</strong>
            {t.hopitalDestination && <> à <strong>{t.hopitalDestination}</strong></>} a été confirmée.
          </p>
        </div>
      ) : (
        <>
          {/* Récap */}
          <div style={{ background: C.bg, borderRadius: 11, padding: "0.85rem 1rem", marginBottom: "1.2rem" }}>
            <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.9rem", color: C.text, marginBottom: "0.4rem" }}>
              {t.prenomPatient} {t.nomPatient}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.77rem", color: C.textMid }}>{t.hopitalSource ?? "—"}</span>
              <Icon d={I.arrowR} size={13} stroke={C.primary} sw={2} />
              <span style={{ fontSize: "0.77rem", fontWeight: 600, color: C.text }}>{t.hopitalDestination ?? "—"}</span>
            </div>
            {t.motif && <div style={{ fontSize: "0.74rem", color: C.textMid }}>{t.motif}</div>}
          </div>

          {/* Avertissement */}
          <div style={{ background: `${C.warning}10`, border: `1px solid ${C.warning}30`, borderRadius: 10, padding: "0.65rem 0.9rem", fontSize: "0.78rem", color: C.textMid, lineHeight: 1.5 }}>
            Cette action marquera définitivement le transfert comme effectué et notifiera l'équipe source.
          </div>
        </>
      )}
    </Modal>
  );
};

export { ModalInitierTransfert, ModalCRTransfert, ModalMarquerComplete };
