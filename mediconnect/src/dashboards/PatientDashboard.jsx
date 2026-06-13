import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { C, F } from "../constants/theme.js";
import { I } from "../constants/icons.js";
import { useAuth } from "../api/AuthContext.jsx";
import { useToast } from "../components/toast/ToastContext.jsx";
import { getMonProfil, demanderSuppressionCompte, exporterMesDonnees } from "../api/patients.api.js";
import { getMesRendezVous, createRendezVous, getCreneauxDisponibles, accepterPropositionRendezVous, refuserPropositionRendezVous } from "../api/rendezvous.api.js";
import { getOrdonnancesByPatient } from "../api/ordonnances.api.js";
import { exportOrdonnancesPDF } from "../utils/exportPDF.js";
import { getConsultationsByPatient } from "../api/consultations.api.js";
import { getMedecinsDisponibles } from "../api/medecins.api.js";
import { Card, CardHead } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/TagBadge.jsx";
import Btn from "../components/ui/Btn.jsx";
import Icon from "../components/ui/Icon.jsx";
import Modal from "../components/ui/Modal.jsx";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/* ═══════════════════════════════════════════════════════════
   SECTION — MON PROFIL
═══════════════════════════════════════════════════════════ */
const SectionProfil = ({ profil, consultations }) => {
  // Médecins traitants = médecins uniques parmi les consultations terminées/complétées
  const medecinsTraitants = (() => {
    const seen = new Set();
    return (consultations ?? [])
      .filter(c => c.medecinId && (c.statut === "TERMINEE" || c.statut === "COMPLETEE" || c.statut === "EN_COURS"))
      .reduce((acc, c) => {
        if (!seen.has(c.medecinId)) {
          seen.add(c.medecinId);
          acc.push({ id: c.medecinId, nom: c.nomMedecin, prenom: c.prenomMedecin });
        }
        return acc;
      }, []);
  })();

  if (!profil) return (
    <Card><div style={{ padding: "2rem", textAlign: "center", color: C.textLight }}>Chargement du profil…</div></Card>
  );

  const rows = [
    ["Nom complet",       `${profil.prenom} ${profil.nom}`],
    ["N° Patient",        profil.numPatient],
    ["Date de naissance", fmtDate(profil.dateNaissance)],
    ["Sexe",              profil.sexe],
    ["Groupe sanguin",    profil.groupeSanguin ?? "—"],
    ["Email",             profil.email ?? "—"],
    ["Téléphone",         profil.telephone ?? "—"],
    ["Région",            profil.region ?? "—"],
    ["Assurance",         profil.assurance ? "Oui" : "Non"],
    ["Compte",            profil.actif ? "Actif" : "Inactif"],
    ["Créé le",           fmtDate(profil.createdAt)],
  ];

  return (
    <>
      <Card style={{ marginBottom: "1rem" }}>
        <CardHead title="Mon profil médical" sub="Données enregistrées par votre équipe soignante" />
        <div style={{ padding: "0 1.2rem 1.2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "0.42rem 0.5rem", borderBottom: `1px solid ${C.borderLight}`, fontSize: "0.8rem" }}>
              <span style={{ color: C.textMid }}>{k}</span>
              <span style={{ fontWeight: 600, color: C.text, maxWidth: 180, textAlign: "right", wordBreak: "break-word" }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Médecins traitants */}
      <Card>
        <CardHead
          title="Mes médecins traitants"
          sub={medecinsTraitants.length > 0 ? `${medecinsTraitants.length} médecin(s) suivi(s)` : "Aucun médecin enregistré"}
        />
        <div style={{ padding: "0 1.2rem 1.2rem" }}>
          {medecinsTraitants.length === 0 ? (
            <div style={{ textAlign: "center", color: C.textLight, fontSize: "0.82rem", padding: "1.5rem 0" }}>
              <Icon d={I.user} size={28} stroke={C.borderLight} sw={1.5} style={{ display: "block", margin: "0 auto 0.5rem" }} />
              Aucune consultation enregistrée
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginTop: "0.5rem" }}>
              {medecinsTraitants.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0.75rem", background: C.primaryPale, borderRadius: 10, border: `1px solid ${C.borderLight}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "white", fontWeight: 800, fontSize: "0.75rem", fontFamily: F.title }}>
                      {`${m.prenom?.[0] ?? ""}${m.nom?.[0] ?? ""}`.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>Dr. {m.prenom} {m.nom}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION — MES RENDEZ-VOUS
═══════════════════════════════════════════════════════════ */
const statutBadge = (s) => {
  if (s === "PLANIFIE")      return <Badge variant="blue">Planifié</Badge>;
  if (s === "CONFIRME")      return <Badge variant="teal">Confirmé</Badge>;
  if (s === "ANNULE")        return <Badge variant="red">Annulé</Badge>;
  if (s === "EFFECTUE")      return <Badge variant="green">Effectué</Badge>;
  if (s === "DATE_PROPOSEE") return <Badge variant="orange">Date proposée</Badge>;
  return <Badge>{s}</Badge>;
};

const SectionRDV = ({ toast }) => {
  const [rdvs,         setRdvs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [medecins,     setMedecins]     = useState([]);
  const [form,         setForm]         = useState({ date: "", heure: "09:00", motif: "", medecinId: "", type: "PRESENTIEL" });
  const [saving,       setSaving]       = useState(false);
  const [creneaux,     setCreneaux]     = useState([]);
  const [showCreneaux, setShowCreneaux] = useState(false);
  const [actionId,     setActionId]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMesRendezVous();
      setRdvs(Array.isArray(res) ? res : (res?.data ?? []));
    } catch { setRdvs([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!modalOpen) return;
    getMedecinsDisponibles().then(l => setMedecins(Array.isArray(l) ? l : [])).catch(() => {});
  }, [modalOpen]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const today = new Date().toISOString().split("T")[0];

  const handleBook = async () => {
    if (!form.date || !form.heure) { toast("Date et heure obligatoires", "warning"); return; }
    const payload = {
      dateHeure: `${form.date}T${form.heure}:00`,
      type:      form.type,
      motif:     form.motif.trim() || undefined,
      medecinId: form.medecinId ? Number(form.medecinId) : undefined,
    };
    setSaving(true);
    try {
      await createRendezVous(payload);
      toast("Rendez-vous créé avec succès !", "success");
      setModalOpen(false);
      setForm({ date: "", heure: "09:00", motif: "", medecinId: "", type: "PRESENTIEL" });
      setCreneaux([]);
      setShowCreneaux(false);
      load();
    } catch (err) {
      const msg = err.apiMessage ?? err.message ?? "Erreur";
      if (msg.includes("RDV_CONFLIT") && form.medecinId) {
        toast("Créneau indisponible — voici les créneaux libres", "warning");
        try {
          const slots = await getCreneauxDisponibles(Number(form.medecinId), `${form.date}T${form.heure}:00`, 5);
          setCreneaux(Array.isArray(slots) ? slots : []);
          setShowCreneaux(true);
        } catch { /* ignore */ }
      } else { toast(msg, "error"); }
    } finally { setSaving(false); }
  };

  const handleAccepterProposition = async (rdv) => {
    setActionId(rdv.id);
    try {
      const updated = await accepterPropositionRendezVous(rdv.id);
      setRdvs(prev => prev.map(r => r.id === updated.id ? updated : r));
      toast("Nouvelle date acceptée — rendez-vous confirmé !", "success");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur", "error");
    } finally { setActionId(null); }
  };

  const handleRefuserProposition = async (rdv) => {
    setActionId(rdv.id);
    try {
      const updated = await refuserPropositionRendezVous(rdv.id);
      setRdvs(prev => prev.map(r => r.id === updated.id ? updated : r));
      toast("Date refusée. Le médecin sera informé.", "warning");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur", "error");
    } finally { setActionId(null); }
  };

  const prochains = rdvs.filter(r => r.statut === "PLANIFIE" || r.statut === "CONFIRME" || r.statut === "DATE_PROPOSEE")
    .sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
  const historique = rdvs.filter(r => r.statut === "EFFECTUE" || r.statut === "ANNULE")
    .sort((a, b) => new Date(b.dateHeure) - new Date(a.dateHeure));

  const inputSt = { width: "100%", padding: "0.5rem 0.8rem", border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: "0.82rem", color: C.text, fontFamily: F.body, outline: "none", boxSizing: "border-box" };

  return (
    <>
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setCreneaux([]); setShowCreneaux(false); }}
        title="Prendre un rendez-vous" width={480}
        footer={
          <>
            <Btn variant="outline" onClick={() => setModalOpen(false)}>Annuler</Btn>
            <Btn icon={I.check} onClick={handleBook} disabled={saving}>
              {saving ? "Enregistrement…" : "Confirmer le RDV"}
            </Btn>
          </>
        }
      >
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
            Médecin <span style={{ fontWeight: 400, color: C.textLight }}>(optionnel)</span>
          </label>
          <select value={form.medecinId} onChange={set("medecinId")} style={{ ...inputSt, background: "white", cursor: "pointer" }}>
            <option value="">— Sélectionner un médecin —</option>
            {medecins.map(m => (
              <option key={m.id} value={m.id}>
                Dr. {m.prenom} {m.nom}{m.specialite ? ` — ${m.specialite}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>Type</label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[["PRESENTIEL", "Présentiel"], ["VIDEO", "Vidéo"], ["URGENCE", "Urgence"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setForm(f => ({ ...f, type: id }))} style={{ flex: 1, padding: "0.5rem", borderRadius: 9, border: `2px solid ${form.type === id ? C.primary : C.border}`, background: form.type === id ? C.primaryPale : "white", color: form.type === id ? C.primary : C.textMid, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: F.title }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>Date *</label>
            <input type="date" min={today} value={form.date} onChange={set("date")} style={inputSt} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>Heure *</label>
            <input type="time" value={form.heure} onChange={set("heure")} style={inputSt} />
          </div>
        </div>

        {showCreneaux && creneaux.length > 0 && (
          <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "0.7rem 0.85rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#b45309", marginBottom: "0.4rem" }}>Créneaux disponibles — choisissez-en un</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
              {creneaux.map(slot => {
                const dt = new Date(slot);
                const label = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }) + " " + dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                return (
                  <button key={slot} onClick={() => { setForm(f => ({ ...f, date: dt.toISOString().split("T")[0], heure: dt.toTimeString().slice(0, 5) })); setShowCreneaux(false); }} style={{ padding: "0.3rem 0.6rem", borderRadius: 7, border: "1px solid #fbbf24", background: "white", color: "#92400e", fontSize: "0.73rem", fontWeight: 600, cursor: "pointer" }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem", fontFamily: F.title }}>
            Motif <span style={{ fontWeight: 400, color: C.textLight }}>(optionnel)</span>
          </label>
          <textarea value={form.motif} onChange={set("motif")} placeholder="Suivi HTA, bilan sanguin…" rows={2} style={{ ...inputSt, resize: "vertical", lineHeight: 1.5 }} />
        </div>
      </Modal>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: F.title, fontWeight: 700, fontSize: "1.1rem", color: C.text }}>Mes rendez-vous</h2>
          <p style={{ fontSize: "0.8rem", color: C.textLight, marginTop: "0.1rem" }}>{rdvs.length} rendez-vous au total</p>
        </div>
        <Btn size="sm" icon={I.plus} onClick={() => setModalOpen(true)}>Prendre un RDV</Btn>
      </div>

      {prochains.length > 0 && (
        <Card style={{ marginBottom: "1rem" }}>
          <CardHead title="Prochains rendez-vous" sub={`${prochains.length} à venir`} />
          <div style={{ padding: "0 1rem 1rem" }}>
            {prochains.map(r => (
              <div key={r.id} style={{ padding: "0.6rem 0", borderBottom: `1px solid ${C.borderLight}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.83rem", fontWeight: 600, color: C.text }}>{fmtDateTime(r.dateHeure)}</div>
                    {r.nomMedecin && <div style={{ fontSize: "0.73rem", color: C.textMid }}>Dr. {r.prenomMedecin} {r.nomMedecin}{r.specialiteMedecin ? ` — ${r.specialiteMedecin}` : ""}</div>}
                    {r.motif && <div style={{ fontSize: "0.71rem", color: C.textLight, fontStyle: "italic" }}>{r.motif}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                    {statutBadge(r.statut)}
                    <span style={{ fontSize: "0.68rem", color: C.textLight }}>{r.type}</span>
                  </div>
                </div>
                {r.statut === "DATE_PROPOSEE" && r.dateProposee && (
                  <div style={{ marginTop: "0.5rem", padding: "0.55rem 0.75rem", background: "#fff8e1", border: "1px solid #fbbf24", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <div>
                      <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#b45309" }}>Le médecin propose une nouvelle date</div>
                      <div style={{ fontSize: "0.78rem", color: "#92400e", fontWeight: 600, marginTop: "0.15rem" }}>{fmtDateTime(r.dateProposee)}</div>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                      <button disabled={actionId === r.id} onClick={() => handleAccepterProposition(r)} style={{ padding: "0.3rem 0.7rem", borderRadius: 7, border: "1px solid #16a34a", background: "#f0fdf4", color: "#16a34a", fontSize: "0.73rem", fontWeight: 700, cursor: "pointer" }}>Accepter</button>
                      <button disabled={actionId === r.id} onClick={() => handleRefuserProposition(r)} style={{ padding: "0.3rem 0.7rem", borderRadius: 7, border: `1px solid ${C.danger}`, background: "#fff1f2", color: C.danger, fontSize: "0.73rem", fontWeight: 700, cursor: "pointer" }}>Refuser</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {historique.length > 0 && (
        <Card>
          <CardHead title="Historique" sub={`${historique.length} passé(s)`} />
          <div style={{ padding: "0 1rem 1rem" }}>
            {historique.slice(0, 5).map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: `1px solid ${C.borderLight}`, opacity: 0.7 }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: C.textMid }}>{fmtDateTime(r.dateHeure)}</div>
                  {r.nomMedecin && <div style={{ fontSize: "0.7rem", color: C.textLight }}>Dr. {r.prenomMedecin} {r.nomMedecin}</div>}
                </div>
                {statutBadge(r.statut)}
              </div>
            ))}
          </div>
        </Card>
      )}

      {!loading && rdvs.length === 0 && (
        <Card><div style={{ padding: "3rem", textAlign: "center", color: C.textLight, fontSize: "0.84rem" }}>
          <Icon d={I.calendar} size={32} stroke={C.borderLight} sw={1.5} style={{ display: "block", margin: "0 auto 0.75rem" }} />
          Aucun rendez-vous — prenez votre premier rendez-vous
        </div></Card>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION — MES CONSULTATIONS (+ constantes)
═══════════════════════════════════════════════════════════ */
const STATUT_CONSULT_MAP = {
  EN_COURS:  { variant: "blue",   label: "En cours"  },
  TERMINEE:  { variant: "green",  label: "Terminée"  },
  COMPLETEE: { variant: "teal",   label: "Complétée" },
  ANNULEE:   { variant: "red",    label: "Annulée"   },
};

const ConstanteItem = ({ label, value, unit }) => {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0.5rem 0.6rem", background: "white", borderRadius: 9, border: `1px solid ${C.borderLight}`, minWidth: 72 }}>
      <span style={{ fontSize: "1rem", fontWeight: 800, color: C.primary, fontFamily: F.title }}>{value}</span>
      <span style={{ fontSize: "0.6rem", color: C.textLight, marginTop: "0.1rem", textAlign: "center" }}>{unit}</span>
      <span style={{ fontSize: "0.62rem", color: C.textMid, fontWeight: 600 }}>{label}</span>
    </div>
  );
};

const SectionConsultations = ({ consultations, loading }) => {
  const [expanded, setExpanded] = useState(null);

  const sorted = [...(consultations ?? [])].sort(
    (a, b) => new Date(b.dateHeure) - new Date(a.dateHeure)
  );

  if (loading) return (
    <Card><div style={{ padding: "2rem", textAlign: "center", color: C.textLight }}>Chargement…</div></Card>
  );

  if (sorted.length === 0) return (
    <Card><div style={{ padding: "3rem", textAlign: "center", color: C.textLight, fontSize: "0.84rem" }}>
      <Icon d={I.activity} size={32} stroke={C.borderLight} sw={1.5} style={{ display: "block", margin: "0 auto 0.75rem" }} />
      Aucune consultation enregistrée
    </div></Card>
  );

  return (
    <Card>
      <CardHead title="Mes consultations" sub={`${sorted.length} consultation(s)`} />
      <div style={{ padding: "0 1rem 1rem" }}>
        {sorted.map(c => {
          const { variant: sv, label: sl } = STATUT_CONSULT_MAP[c.statut] ?? { variant: "gray", label: c.statut ?? "—" };
          const isOpen = expanded === c.id;
          const hasConstantes = c.tensionArterielle || c.frequenceCardiaque || c.temperature || c.spo2 || c.poids || c.taille;

          return (
            <div key={c.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
              {/* En-tête */}
              <button
                onClick={() => setExpanded(isOpen ? null : c.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.83rem", fontWeight: 600, color: C.text }}>{fmtDateTime(c.dateHeure)}</span>
                    <Badge variant={sv}>{sl}</Badge>
                  </div>
                  {c.nomMedecin && (
                    <div style={{ fontSize: "0.73rem", color: C.textMid }}>
                      Dr. {c.prenomMedecin} {c.nomMedecin}
                    </div>
                  )}
                  {c.motif && (
                    <div style={{ fontSize: "0.71rem", color: C.textLight, fontStyle: "italic", marginTop: "0.1rem" }}>{c.motif}</div>
                  )}
                </div>
                <Icon
                  d={I.arrowR}
                  size={14} stroke={C.textLight} sw={2}
                  style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0, marginLeft: "0.5rem" }}
                />
              </button>

              {/* Détail dépliable */}
              {isOpen && (
                <div style={{ paddingBottom: "0.85rem" }}>
                  {hasConstantes ? (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Constantes vitales</div>
                      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                        <ConstanteItem label="Tension"    value={c.tensionArterielle}  unit="mmHg" />
                        <ConstanteItem label="FC"         value={c.frequenceCardiaque} unit="bpm"  />
                        <ConstanteItem label="Temp."      value={c.temperature}        unit="°C"   />
                        <ConstanteItem label="SpO₂"       value={c.spo2}               unit="%"    />
                        <ConstanteItem label="Poids"      value={c.poids}              unit="kg"   />
                        <ConstanteItem label="Taille"     value={c.taille}             unit="cm"   />
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.75rem", color: C.textLight, fontStyle: "italic", marginBottom: "0.5rem" }}>
                      Aucune constante enregistrée
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION — MES ORDONNANCES (avec expiration)
═══════════════════════════════════════════════════════════ */
const SectionOrdonnances = ({ toast, profil }) => {
  const { user } = useAuth();
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [expanded,    setExpanded]    = useState(null);
  const [exporting,   setExporting]   = useState(false);

  useEffect(() => {
    if (!user?.userId) return;
    getOrdonnancesByPatient(user.userId)
      .then(res => { const arr = res?.data ?? res; setOrdonnances(Array.isArray(arr) ? arr : []); })
      .catch(() => setOrdonnances([]))
      .finally(() => setLoading(false));
  }, [user]);

  const expirationInfo = (dateExp) => {
    if (!dateExp) return null;
    const exp  = new Date(dateExp);
    const now  = new Date();
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24)); // jours
    if (diff < 0)  return { label: "Expirée",           color: "#d63031", bg: "#fdeaea" };
    if (diff <= 7) return { label: `Expire dans ${diff}j`, color: "#e08833", bg: "#fff0e6" };
    return           { label: `Expire le ${fmtDate(dateExp)}`, color: "#17935a", bg: "#e5f7ef" };
  };

  const handleExportPDF = async () => {
    if (ordonnances.length === 0) { toast("Aucune ordonnance à exporter", "warning"); return; }
    setExporting(true);
    try {
      const nom = profil ? `${profil.prenom ?? ""} ${profil.nom ?? ""}`.trim() : (user?.prenom ?? "patient");
      await exportOrdonnancesPDF(ordonnances, nom);
      toast("PDF téléchargé", "success");
    } catch (err) {
      console.error(err);
      toast("Erreur lors de la génération du PDF", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHead
        title="Mes ordonnances"
        sub={loading ? "Chargement…" : `${ordonnances.length} ordonnance(s)`}
        action={!loading && ordonnances.length > 0 && (
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", borderRadius: 8, border: `1px solid ${C.border}`, background: "white", color: C.textMid, fontSize: "0.75rem", fontWeight: 600, cursor: exporting ? "default" : "pointer", fontFamily: F.title }}
          >
            <Icon d={I.download} size={13} sw={2} stroke={C.primary} />
            {exporting ? "Génération…" : "Exporter PDF"}
          </button>
        )}
      />
      {loading ? (
        <div style={{ padding: "2rem", textAlign: "center", color: C.textLight, fontSize: "0.84rem" }}>Chargement…</div>
      ) : ordonnances.length === 0 ? (
        <div style={{ padding: "2.5rem", textAlign: "center", color: C.textLight, fontSize: "0.84rem" }}>
          <Icon d={I.clipboard} size={28} stroke={C.borderLight} sw={1.5} style={{ display: "block", margin: "0 auto 0.6rem" }} />
          Aucune ordonnance
        </div>
      ) : (
        <div style={{ padding: "0 1rem 1rem" }}>
          {ordonnances.map(o => {
            const expInfo  = expirationInfo(o.dateExpiration);
            const isOpen   = expanded === o.id;
            const lignes   = Array.isArray(o.lignes) ? o.lignes : [];

            return (
              <div key={o.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                {/* En-tête */}
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  style={{ width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0.75rem 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: "0.5rem" }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text, marginBottom: "0.2rem" }}>
                      Dr. {o.prenomMedecin} {o.nomMedecin}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: C.textLight }}>
                      {lignes.length} médicament(s) · Émise le {fmtDate(o.dateEmission)}
                    </div>
                    {/* Badge expiration */}
                    {expInfo && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", marginTop: "0.3rem", padding: "0.15rem 0.55rem", borderRadius: 100, background: expInfo.bg, fontSize: "0.67rem", fontWeight: 700, color: expInfo.color }}>
                        {expInfo.label}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
                    {o.signatureNumerique ? <Badge variant="teal">Signée</Badge> : <Badge variant="orange">Non signée</Badge>}
                    <Icon d={I.arrowR} size={12} stroke={C.textLight} sw={2} style={{ transform: isOpen ? "rotate(90deg)" : undefined, transition: "transform 0.2s" }} />
                  </div>
                </button>

                {/* Lignes de prescription dépliables */}
                {isOpen && lignes.length > 0 && (
                  <div style={{ paddingBottom: "0.85rem" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>Médicaments prescrits</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {lignes.map((l, idx) => (
                        <div key={l.id ?? idx} style={{ padding: "0.5rem 0.75rem", background: C.bg, borderRadius: 9, border: `1px solid ${C.borderLight}` }}>
                          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: C.text }}>{l.medicament ?? `Médicament ${idx + 1}`}</div>
                          {l.posologie && <div style={{ fontSize: "0.73rem", color: C.textMid }}>{l.posologie}</div>}
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.2rem", flexWrap: "wrap" }}>
                            {l.duree    && <span style={{ fontSize: "0.68rem", color: C.textLight }}>Durée : {l.duree}</span>}
                            {l.quantite && <span style={{ fontSize: "0.68rem", color: C.textLight }}>Qté : {l.quantite}</span>}
                          </div>
                          {l.instructions && <div style={{ fontSize: "0.7rem", color: C.textLight, fontStyle: "italic", marginTop: "0.15rem" }}>{l.instructions}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isOpen && lignes.length === 0 && (
                  <div style={{ paddingBottom: "0.85rem", fontSize: "0.75rem", color: C.textLight, fontStyle: "italic" }}>
                    Aucun médicament listé
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════
   SECTION — RGPD & DROITS
═══════════════════════════════════════════════════════════ */
const SectionRGPD = ({ toast }) => {
  const [modalSuppression, setModalSuppression] = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [done,             setDone]             = useState(false);

  const handleDemanderSuppression = async () => {
    setLoading(true);
    try {
      const res = await demanderSuppressionCompte();
      toast(res?.message ?? "Demande enregistrée", "success");
      setDone(true);
      setModalSuppression(false);
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de l'envoi de la demande", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportDonnees = async () => {
    try {
      const res = await exporterMesDonnees();
      const donnees = res?.data ?? res;
      const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `mes-donnees-mediconnect.json`; a.click();
      URL.revokeObjectURL(url);
      toast("Export téléchargé", "success");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de l'export", "error");
    }
  };

  const droits = [
    {
      icon: I.download,
      title: "Exporter mes données",
      desc: "Téléchargez une copie de toutes vos données personnelles et médicales enregistrées sur MediConnect.",
      color: "#1660a8",
      action: handleExportDonnees,
      label: "Télécharger mes données",
    },
    {
      icon: I.trash,
      title: "Demande de suppression",
      desc: "Demandez la suppression définitive de votre compte et de toutes vos données. L'administration traitera votre demande sous 30 jours.",
      color: C.danger,
      action: () => setModalSuppression(true),
      label: done ? "Demande envoyée ✓" : "Demander la suppression",
      disabled: done,
    },
  ];

  return (
    <>
      <Modal open={modalSuppression} onClose={() => setModalSuppression(false)} title="Confirmation de suppression" width={440}
        footer={
          <>
            <Btn variant="outline" onClick={() => setModalSuppression(false)}>Annuler</Btn>
            <Btn onClick={handleDemanderSuppression} disabled={loading} style={{ background: C.danger, borderColor: C.danger }}>
              {loading ? "Envoi…" : "Confirmer la demande"}
            </Btn>
          </>
        }
      >
        <div style={{ textAlign: "center", padding: "0.5rem 0 1rem" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${C.danger}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.85rem" }}>
            <Icon d={I.bell} size={24} stroke={C.danger} sw={2} />
          </div>
          <p style={{ fontSize: "0.9rem", color: C.text, fontWeight: 600, marginBottom: "0.6rem" }}>Êtes-vous sûr de vouloir supprimer votre compte ?</p>
          <p style={{ fontSize: "0.82rem", color: C.textMid, lineHeight: 1.6 }}>
            Cette demande sera transmise à l'administration. <strong>Vos données médicales seront conservées</strong> le temps légal requis (10 ans), puis supprimées définitivement.
          </p>
        </div>
      </Modal>

      <Card>
        <CardHead title="Mes droits & confidentialité" sub="Conformément à la loi n°2008-12 sur la protection des données personnelles" />
        <div style={{ padding: "1rem 1.2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", marginBottom: "1.2rem", padding: "0.75rem 0.9rem", background: C.primaryPale, borderRadius: 10, border: `1px solid ${C.borderLight}` }}>
            <Icon d={I.shield} size={16} stroke={C.primary} sw={2} style={{ marginTop: 1, flexShrink: 0 }} />
            <span style={{ fontSize: "0.78rem", color: C.textMid, lineHeight: 1.6 }}>
              En tant que patient MediConnect, vous disposez d'un droit d'accès, de rectification et d'effacement de vos données conformément à la loi sénégalaise sur la protection des données personnelles.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
            {droits.map(d => (
              <div key={d.title} style={{ border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${d.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon d={d.icon} size={17} stroke={d.color} sw={2} />
                </div>
                <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.88rem", color: C.text }}>{d.title}</div>
                <div style={{ fontSize: "0.76rem", color: C.textMid, lineHeight: 1.55, flex: 1 }}>{d.desc}</div>
                <button
                  onClick={d.action}
                  disabled={d.disabled}
                  style={{ padding: "0.45rem 0.75rem", borderRadius: 8, border: `1px solid ${d.disabled ? C.border : d.color}`, background: d.disabled ? C.bg : `${d.color}10`, color: d.disabled ? C.textLight : d.color, fontSize: "0.77rem", fontWeight: 600, cursor: d.disabled ? "default" : "pointer", fontFamily: F.title }}
                >
                  {d.label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   DASHBOARD PRINCIPAL
═══════════════════════════════════════════════════════════ */
const SECTIONS = ["Mon profil", "Mes RDV", "Mes consultations", "Mes ordonnances", "Confidentialité"];

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    navigate("/");
  };

  const [section,        setSection]        = useState("Mon profil");
  const [profil,         setProfil]         = useState(null);
  const [consultations,  setConsultations]  = useState([]);
  const [loadingConsult, setLoadingConsult] = useState(true);

  useEffect(() => {
    getMonProfil().then(setProfil).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.userId) return;
    getConsultationsByPatient(user.userId)
      .then(res => {
        const arr = Array.isArray(res) ? res : (res?.data ?? []);
        setConsultations(arr);
      })
      .catch(() => setConsultations([]))
      .finally(() => setLoadingConsult(false));
  }, [user?.userId]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${C.primaryDeep} 0%, ${C.primary} 100%)`, padding: "1.5rem 2rem 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon d={I.user} size={24} stroke="white" sw={1.8} />
            </div>
            <div>
              <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.15rem", color: "white" }}>
                {profil ? `${profil.prenom} ${profil.nom}` : (user?.prenom ? `${user.prenom} ${user.nom ?? ""}` : "Mon espace patient")}
              </div>
              {profil?.numPatient && (
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)", marginTop: "0.15rem" }}>N° {profil.numPatient}</div>
              )}
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.45rem 0.9rem", borderRadius: 9, border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: F.title, transition: "background .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" size={15} stroke="white" sw={2} />
            Déconnexion
          </button>
        </div>

        {/* Onglets */}
        <div style={{ display: "flex", gap: "0.25rem", overflowX: "auto" }}>
          {SECTIONS.map(s => (
            <button key={s} onClick={() => setSection(s)} style={{
              padding: "0.5rem 1.1rem", borderRadius: "8px 8px 0 0", border: "none",
              background: section === s ? "white" : "transparent",
              color: section === s ? C.primary : "rgba(255,255,255,0.7)",
              fontSize: "0.8rem", fontWeight: section === s ? 700 : 500,
              cursor: "pointer", fontFamily: F.title, transition: "all .15s",
              whiteSpace: "nowrap",
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: "1.5rem 2rem", maxWidth: 900, margin: "0 auto" }}>
        {section === "Mon profil"        && <SectionProfil profil={profil} consultations={consultations} />}
        {section === "Mes RDV"           && <SectionRDV toast={toast} />}
        {section === "Mes consultations" && <SectionConsultations consultations={consultations} loading={loadingConsult} />}
        {section === "Mes ordonnances"   && <SectionOrdonnances toast={toast} profil={profil} />}
        {section === "Confidentialité"   && <SectionRGPD toast={toast} />}
      </div>
    </div>
  );
};

export default PatientDashboard;
