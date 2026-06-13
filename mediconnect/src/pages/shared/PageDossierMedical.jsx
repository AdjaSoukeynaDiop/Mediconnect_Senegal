import { useState, useEffect, useCallback } from "react";
import { C, F }                   from "../../constants/theme.js";
import { I }                      from "../../constants/icons.js";
import { createDossier, getDossierByPatient } from "../../api/dossiers.api.js";
import { getConsultationsByPatient }          from "../../api/consultations.api.js";
import { getOrdonnancesByPatient }            from "../../api/ordonnances.api.js";
import { Card, CardHead }         from "../../components/ui/Card.jsx";
import { Badge }                  from "../../components/ui/TagBadge.jsx";
import Btn                        from "../../components/ui/Btn.jsx";
import Icon                       from "../../components/ui/Icon.jsx";
import ModalConsultation          from "../../components/modals/ModalConsultation.jsx";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const fmtHeure = (d) => d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
const getAge   = (dob) => {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
};
const COLORS      = ["#1660a8","#17935a","#e08833","#8e44ad","#c0392b","#16a085","#d35400"];
const avatarColor = (str = "") => COLORS[(str.charCodeAt(0) || 0) % COLORS.length];
const initials    = (prenom = "", nom = "") =>
  `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase() || "?";
const toStr       = (v) => (v !== null && v !== undefined ? String(v) : null);

// StatutConsultation → variant + libellé
const STATUT_MAP = {
  INITIEE:   { variant: "blue",   label: "Initiée"   },
  OUVERTE:   { variant: "blue",   label: "Ouverte"   },
  EN_COURS:  { variant: "orange", label: "En cours"  },
  TERMINEE:  { variant: "teal",   label: "Terminée"  },
  ANNULEE:   { variant: "red",    label: "Annulée"   },
};
const statutBadge = (s) => {
  const m = STATUT_MAP[s];
  return m ? (
    <Badge variant={m.variant}>{m.label}</Badge>
  ) : (
    <Badge variant="gray">{s ?? "—"}</Badge>
  );
};

const SkeletonBlock = ({ w = "100%", h = 14 }) => (
  <div style={{ height: h, width: w, borderRadius: 6, background: C.bg, animation: "pulse 1.4s ease-in-out infinite" }} />
);

const InfoRow = ({ label, value }) =>
  value ? (
    <div style={{ padding: "0.55rem 0", borderBottom: `1px solid ${C.borderLight}` }}>
      <div style={{ fontSize: "0.67rem", color: C.textLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.82rem", color: C.text, lineHeight: 1.55 }}>{value}</div>
    </div>
  ) : null;

const VitalBadge = ({ label, value, unit }) => (
  <div style={{
    background: value ? C.primaryPale : C.bg,
    border: `1px solid ${value ? C.borderLight : "transparent"}`,
    borderRadius: 10, padding: "0.6rem 0.75rem",
  }}>
    <div style={{ fontSize: "0.63rem", color: C.textLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
      {label}
    </div>
    <div style={{ fontSize: "1rem", fontWeight: 700, color: value ? C.text : C.textLight, fontFamily: F.title }}>
      {value ?? "—"}
      {value && <span style={{ fontSize: "0.62rem", fontWeight: 400, color: C.textMid, marginLeft: "0.25rem" }}>{unit}</span>}
    </div>
  </div>
);

// ── Composant principal ───────────────────────────────────────────────────────
const PageDossierMedical = ({ patient, toast, onBack }) => {
  const [dossier,         setDossier]         = useState(null);
  const [consultations,   setConsultations]   = useState([]);
  const [ordonnances,     setOrdonnances]     = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [dossierNotFound, setDossierNotFound] = useState(false);
  const [creating,        setCreating]        = useState(false);
  const [modalConsult,    setModalConsult]    = useState(false);

  // ── Charger les consultations du patient ─────────────────────────────────────
  const refreshConsultations = useCallback(async (patientId) => {
    try {
      const res = await getConsultationsByPatient(patientId);
      const arr = res?.data ?? res;
      setConsultations(Array.isArray(arr) ? arr : []);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast(err.apiMessage ?? "Erreur chargement consultations", "error");
      } else {
        setConsultations([]);
      }
    }
  }, [toast]);

  // ── Chargement initial (séquentiel : dossier d'abord, puis consultations par ID) ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    setDossierNotFound(false);

    // Dossier + ordonnances en parallèle
    const [dossierRes, ordoRes] = await Promise.allSettled([
      getDossierByPatient(patient.id),
      getOrdonnancesByPatient(patient.id),
    ]);

    // Dossier — les réponses backend sont enveloppées dans { success, data, timestamp }
    let loadedDossier = null;
    if (dossierRes.status === "fulfilled") {
      loadedDossier = dossierRes.value?.data ?? dossierRes.value;
      setDossier(loadedDossier);
    } else {
      const err = dossierRes.reason;
      if (err.response?.status === 404) {
        setDossierNotFound(true);
        setConsultations([]);
      } else {
        toast(err.apiMessage ?? "Erreur lors du chargement du dossier", "error");
      }
    }

    // Ordonnances
    if (ordoRes.status === "fulfilled") {
      const arr = ordoRes.value?.data ?? ordoRes.value;
      setOrdonnances(Array.isArray(arr) ? arr : []);
    } else if (ordoRes.reason?.response?.status !== 404) {
      toast(ordoRes.reason?.apiMessage ?? "Erreur chargement ordonnances", "error");
    }

    // Consultations via patient.id (GET /api/consultations/patient/{id})
    if (loadedDossier) {
      await refreshConsultations(patient.id);
    }

    setLoading(false);
  }, [patient.id, toast, refreshConsultations]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Créer le dossier si inexistant ───────────────────────────────────────────
  const handleCreateDossier = async () => {
    setCreating(true);
    try {
      const raw = await createDossier(patient.id, {});
      setDossier(raw?.data ?? raw);
      setDossierNotFound(false);
      toast("Dossier médical créé avec succès", "success");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la création du dossier", "error");
    } finally {
      setCreating(false);
    }
  };

  // ── Callback après création d'une consultation ───────────────────────────────
  const handleConsultationCreated = (newConsultation) => {
    setConsultations((prev) => [newConsultation, ...prev]);
  };

  // Dernière consultation avec constantes vitales
  const lastConsult = [...consultations]
    .sort((a, b) => new Date(b.dateHeure) - new Date(a.dateHeure))
    .find((c) => c.tensionArterielle || c.frequenceCardiaque != null || c.temperature != null || c.poids != null);

  // Ordonnances non expirées
  const ordoActives = ordonnances.filter((o) => !o.dateExpiration || new Date(o.dateExpiration) > new Date());

  const age = getAge(patient.dateNaissance);

  return (
    <>
      <ModalConsultation
        open={modalConsult}
        onClose={() => setModalConsult(false)}
        toast={toast}
        patient={patient}
        dossier={dossier}
        onCreated={handleConsultationCreated}
      />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <button
          onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "0.4rem 0.85rem", fontSize: "0.78rem", color: C.textMid, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          <Icon d={I.arrowL} size={13} sw={2} />
          Retour à la liste
        </button>

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${avatarColor(patient.nom)}, ${C.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "1rem", fontFamily: F.title, flexShrink: 0 }}>
            {initials(patient.prenom, patient.nom)}
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.1rem", color: C.text, margin: 0 }}>
              Dossier — {patient.prenom} {patient.nom}
            </h2>
            <div style={{ fontSize: "0.73rem", color: C.textMid, marginTop: "0.15rem" }}>
              {[
                patient.numPatient ?? `#${patient.id}`,
                age ? `${age} ans` : null,
                patient.sexe,
                patient.groupeSanguin ? `Groupe ${patient.groupeSanguin}` : null,
              ].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {dossier && (
            <Badge variant={dossier.statut === "ARCHIVE" ? "gray" : "teal"}>
              {dossier.statut ?? "ACTIF"}
            </Badge>
          )}
          <button
            onClick={loadAll}
            disabled={loading}
            title="Actualiser"
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: "white", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Icon d={I.refresh} size={14} stroke={loading ? C.textLight : C.textMid} sw={2} />
          </button>
        </div>
      </div>

      {/* ── Skeleton ────────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.2rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <div style={{ padding: "1rem 1.2rem" }}>
                <SkeletonBlock h={18} w="55%" />
                <div style={{ marginTop: "0.9rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  {[1, 2, 3].map((j) => <SkeletonBlock key={j} />)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Dossier introuvable ──────────────────────────────────────────────── */}
      {!loading && dossierNotFound && (
        <Card>
          <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
            <Icon d={I.file} size={40} stroke={C.borderLight} sw={1} />
            <p style={{ margin: "1rem 0 0.4rem", fontWeight: 600, color: C.text, fontSize: "0.95rem" }}>
              Aucun dossier médical
            </p>
            <p style={{ color: C.textLight, fontSize: "0.83rem", marginBottom: "1.4rem" }}>
              Aucun dossier n'a encore été créé pour {patient.prenom} {patient.nom}.
            </p>
            <Btn icon={I.plus} onClick={handleCreateDossier} disabled={creating}>
              {creating
                ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Création…
                  </span>
                : "Créer le dossier"
              }
            </Btn>
          </div>
        </Card>
      )}

      {/* ── Contenu principal ────────────────────────────────────────────────── */}
      {!loading && dossier && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.2rem" }}>

          {/* ── Colonne gauche ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

            {/* Informations générales */}
            <Card>
              <CardHead
                title="Informations générales"
                sub={[
                  dossier.dateOuverture ? `Ouvert le ${fmtDate(dossier.dateOuverture)}` : null,
                  dossier.dateMiseAJour ? `MAJ ${fmtDate(dossier.dateMiseAJour)}` : null,
                ].filter(Boolean).join(" · ") || undefined}
              />
              <div style={{ padding: "0.25rem 1rem 0.75rem" }}>
                <InfoRow label="Antécédents médicaux"     value={dossier.antecedentsMedicaux} />
                <InfoRow label="Antécédents chirurgicaux" value={dossier.antecedentsChirurgicaux} />
                <InfoRow label="Antécédents familiaux"    value={dossier.antecedentsFamiliaux} />
                <InfoRow label="Allergies"                value={dossier.allergies} />
                <InfoRow label="Traitement en cours"      value={dossier.traitementEnCours} />
                {!dossier.antecedentsMedicaux && !dossier.antecedentsChirurgicaux &&
                 !dossier.antecedentsFamiliaux && !dossier.allergies && !dossier.traitementEnCours && (
                  <p style={{ padding: "0.75rem 0", color: C.textLight, fontSize: "0.82rem" }}>
                    Aucune information renseignée pour le moment.
                  </p>
                )}
              </div>
            </Card>

            {/* Consultations */}
            <Card>
              <CardHead
                title="Consultations"
                sub={`${consultations.length} au total`}
                action={
                  <Btn
                    icon={I.plus}
                    size="sm"
                    onClick={() => setModalConsult(true)}
                  >
                    Nouvelle
                  </Btn>
                }
              />
              {consultations.length === 0 ? (
                <div style={{ padding: "1.5rem 1.2rem", textAlign: "center" }}>
                  <p style={{ color: C.textLight, fontSize: "0.82rem", marginBottom: "0.75rem" }}>
                    Aucune consultation enregistrée.
                  </p>
                  <Btn variant="outline" size="sm" icon={I.plus} onClick={() => setModalConsult(true)}>
                    Créer la première consultation
                  </Btn>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Heure</th>
                      <th>Médecin</th>
                      <th>Motif</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontSize: "0.78rem", color: C.textMid, whiteSpace: "nowrap" }}>
                          {fmtDate(c.dateHeure)}
                        </td>
                        <td style={{ fontSize: "0.75rem", color: C.textLight, whiteSpace: "nowrap" }}>
                          {fmtHeure(c.dateHeure)}
                        </td>
                        <td style={{ fontSize: "0.78rem", color: C.text, whiteSpace: "nowrap" }}>
                          {c.prenomMedecin ? `Dr. ${c.prenomMedecin} ${c.nomMedecin ?? ""}` : "—"}
                        </td>
                        <td style={{ fontSize: "0.78rem", color: C.textMid, maxWidth: 160 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.motif ?? "—"}
                          </span>
                        </td>
                        <td>{statutBadge(c.statut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          {/* ── Colonne droite ──────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

            {/* Dernières constantes */}
            <Card>
              <CardHead
                title="Dernières constantes"
                sub={lastConsult
                  ? `${fmtDate(lastConsult.dateHeure)} ${fmtHeure(lastConsult.dateHeure)}`
                  : "Aucune mesure disponible"
                }
              />
              <div style={{ padding: "0.75rem 1rem 1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                <VitalBadge label="Tension"      value={toStr(lastConsult?.tensionArterielle)}  unit="mmHg" />
                <VitalBadge label="Fréq. card."  value={toStr(lastConsult?.frequenceCardiaque)} unit="bpm"  />
                <VitalBadge label="Température"  value={toStr(lastConsult?.temperature)}        unit="°C"   />
                <VitalBadge label="SpO₂"         value={toStr(lastConsult?.spo2)}               unit="%"    />
                <VitalBadge label="Poids"        value={toStr(lastConsult?.poids)}              unit="kg"   />
                <VitalBadge label="Taille"       value={toStr(lastConsult?.taille)}             unit="cm"   />
              </div>
            </Card>

            {/* Ordonnances actives */}
            <Card>
              <CardHead title="Ordonnances actives" sub={`${ordoActives.length} en cours`} />
              {ordoActives.length === 0 ? (
                <p style={{ padding: "1rem 1.2rem", color: C.textLight, fontSize: "0.82rem" }}>
                  {ordonnances.length > 0 ? "Toutes les ordonnances sont expirées." : "Aucune ordonnance."}
                </p>
              ) : (
                ordoActives.slice(0, 3).map((o) => (
                  <div key={o.id} style={{ padding: "0.65rem 1rem", borderBottom: `1px solid ${C.borderLight}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.2rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: C.text }}>
                        {o.prenomMedecin || o.nomMedecin
                          ? `Dr. ${o.prenomMedecin ?? ""} ${o.nomMedecin ?? ""}`.trim()
                          : "—"}
                      </span>
                      <span style={{ fontSize: "0.67rem", color: C.textLight, whiteSpace: "nowrap", marginLeft: "0.5rem" }}>
                        {fmtDate(o.dateEmission)}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: C.textMid, marginBottom: "0.3rem" }}>
                      {o.lignes?.length > 0
                        ? o.lignes.map((l) => l.medicament).filter(Boolean).join(", ") ||
                          `${o.lignes.length} médicament(s)`
                        : "—"}
                    </div>
                    {o.dateExpiration && (
                      <Badge variant="teal">Expire le {fmtDate(o.dateExpiration)}</Badge>
                    )}
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default PageDossierMedical;
