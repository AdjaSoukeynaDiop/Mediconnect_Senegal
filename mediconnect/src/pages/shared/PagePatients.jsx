import { useState, useEffect } from "react";
import { C, F }                from "../../constants/theme.js";
import { I }                   from "../../constants/icons.js";
import { usePatients }         from "../../api/usePatients.js";
import { useAuth }             from "../../api/AuthContext.jsx";
import StatCard                from "../../components/ui/StatCard.jsx";
import { Card, CardHead }      from "../../components/ui/Card.jsx";
import { Badge }               from "../../components/ui/TagBadge.jsx";
import Btn                     from "../../components/ui/Btn.jsx";
import Icon                    from "../../components/ui/Icon.jsx";
import ModalNouveauPatient     from "../../components/modals/ModalNouveauPatient.jsx";
import ModalConstantes         from "../../components/modals/ModalConstantes.jsx";
import ModalRDV                from "../../components/modals/ModalRDV.jsx";
import ModalConsultation       from "../../components/modals/ModalConsultation.jsx";
import PageDossierMedical      from "./PageDossierMedical.jsx";
import { getDossierByPatient } from "../../api/dossiers.api.js";

// ── Helpers ──────────────────────────────────────────────────────────────────
const COLORS = ["#1660a8","#17935a","#e08833","#8e44ad","#c0392b","#16a085","#d35400"];
const avatarColor = (str = "") => COLORS[(str.charCodeAt(0) || 0) % COLORS.length];
const initials    = (prenom = "", nom = "") =>
  `${prenom[0] ?? ""}${nom[0] ?? ""}`.toUpperCase() || "?";
const getAge = (dob) => {
  if (!dob) return "—";
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

// Skeleton pour le tableau en cours de chargement
const SkeletonRow = () => (
  <tr>
    {[140, 90, 80, 60, 80, 70].map((w, i) => (
      <td key={i}>
        <div style={{ height: 12, width: w, borderRadius: 6, background: C.bg, animation: "pulse 1.4s ease-in-out infinite" }} />
      </td>
    ))}
    <td />
  </tr>
);

// ── Composant ────────────────────────────────────────────────────────────────
const PagePatients = ({ toast, userRole = "medecin" }) => {
  const { patients, loading, error, refresh, create, activer, desactiver } = usePatients();
  const { user } = useAuth();
  const canCreatePatient  = user?.role === "ASSISTANT" || user?.role === "ADMIN";
  const canToggleStatus   = user?.role === "ASSISTANT" || user?.role === "ADMIN";

  const [selected,         setSelected]         = useState(null);
  const [search,           setSearch]           = useState("");
  const [filter,           setFilter]           = useState("tous");
  const [modalNP,          setModalNP]          = useState(false);
  const [modalConst,       setModalConst]       = useState(false);
  const [modalRDV,         setModalRDV]         = useState(false);
  const [modalConsult,     setModalConsult]     = useState(false);
  const [dossierForModal,  setDossierForModal]  = useState(null);
  const [dossierPatient,   setDossierPatient]   = useState(null);
  const [togglingId,       setTogglingId]       = useState(null);
  const [confirmDeactiv,   setConfirmDeactiv]   = useState(false);
  const [copied,           setCopied]           = useState(null);   // clé copiée dans le presse-papier

  // Sélectionne automatiquement le premier patient une fois chargé
  useEffect(() => {
    if (!selected && patients.length > 0) setSelected(patients[0]);
  }, [patients, selected]);

  useEffect(() => { setConfirmDeactiv(false); }, [selected?.id]);

  const copyField = (value, key) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    }).catch(() => {});
  };

  // Affiche les erreurs de fetch en toast
  useEffect(() => {
    if (error) toast(error, "error");
  }, [error, toast]);

  // Affiche le dossier médical du patient sélectionné (après tous les hooks)
  if (dossierPatient) {
    return (
      <PageDossierMedical
        patient={dossierPatient}
        toast={toast}
        onBack={() => setDossierPatient(null)}
      />
    );
  }

  // Recherche locale — pas d'appel API supplémentaire
  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.nom?.toLowerCase().includes(q) ||
      p.prenom?.toLowerCase().includes(q) ||
      p.numPatient?.toLowerCase().includes(q) ||
      p.telephone?.includes(q);
    const matchFilter =
      filter === "tous" ||
      (filter === "actif"   &&  p.actif) ||
      (filter === "inactif" && !p.actif);
    return matchSearch && matchFilter;
  });

  const openConsultationModal = async (patient) => {
    setSelected(patient);
    try {
      const raw = await getDossierByPatient(patient.id);
      const dossier = raw?.data ?? raw;
      setDossierForModal(dossier);
    } catch (err) {
      if (err.response?.status === 404) {
        toast("Ce patient n'a pas encore de dossier médical", "warning");
        setDossierForModal(null);
      } else {
        toast(err.apiMessage ?? "Erreur lors du chargement du dossier", "error");
        setDossierForModal(null);
      }
    }
    setModalConsult(true);
  };

  // Callback passé à la modale — renvoie les credentials pour que step 4 s'affiche
  const handleCreatePatient = async (payload) => {
    try {
      const cred = await create(payload); // CreatePatientResponse (numPatient, motDePasseTemporaire…)
      toast("Dossier patient créé — communiquez les identifiants au patient", "success");
      return cred; // le modal lit cred.numPatient → affiche step 4
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la création du patient", "error");
      throw err;
    }
  };

  const handleToggleStatut = async (patient, forceActivate = false) => {
    if (!forceActivate && patient.actif) {
      // demande confirmation avant désactivation
      setSelected(patient);
      setConfirmDeactiv(true);
      return;
    }
    setTogglingId(patient.id);
    try {
      if (patient.actif) {
        await desactiver(patient.id);
        toast(`Compte de ${patient.prenom} ${patient.nom} désactivé`, "success");
        setSelected((prev) => prev?.id === patient.id ? { ...prev, actif: false } : prev);
      } else {
        await activer(patient.id);
        toast(`Compte de ${patient.prenom} ${patient.nom} activé`, "success");
        setSelected((prev) => prev?.id === patient.id ? { ...prev, actif: true } : prev);
      }
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la mise à jour du statut", "error");
    } finally {
      setTogglingId(null);
      setConfirmDeactiv(false);
    }
  };

  const actifs   = patients.filter((p) =>  p.actif).length;
  const inactifs = patients.filter((p) => !p.actif).length;

  return (
    <>
      <ModalNouveauPatient
        open={modalNP}
        onClose={() => setModalNP(false)}
        toast={toast}
        onSave={handleCreatePatient}
      />
      <ModalConstantes  open={modalConst}   onClose={() => setModalConst(false)}   toast={toast} patient={selected} />
      <ModalRDV         open={modalRDV}     onClose={() => setModalRDV(false)}     toast={toast} patient={selected} />
      <ModalConsultation
        open={modalConsult}
        onClose={() => { setModalConsult(false); setDossierForModal(null); }}
        toast={toast}
        patient={selected}
        dossier={dossierForModal}
      />

      {/* StatCards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
        <StatCard label="Total patients"   value={patients.length}  sub={loading ? "Chargement…" : `${actifs} actif(s)`} color={C.primary}  icon={I.users}    />
        <StatCard label="Dossiers actifs"  value={actifs}           sub={`${patients.length ? Math.round(actifs / patients.length * 100) : 0}% du total`} color="#17935a" icon={I.check} delta={{ up: true }} />
        <StatCard label="Dossiers inactifs" value={inactifs}        sub="Comptes désactivés" color={C.danger}   icon={I.bell}     />
        <StatCard label="Résultats filtrés" value={filtered.length}  sub={search ? `"${search}"` : "Tous les patients"} color="#1660a8" icon={I.eye} />
      </div>

      {/* Barre de recherche + filtres */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.2rem", alignItems: "center" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", background: "white", border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.45rem 0.85rem" }}>
          <Icon d={I.eye} size={14} stroke={C.textLight} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom, N° patient, téléphone…"
            style={{ border: "none", outline: "none", fontSize: "0.82rem", color: C.text, width: "100%", background: "transparent", fontFamily: F.body }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.textLight, display: "flex", alignItems: "center" }}>
              <Icon d={I.x} size={12} sw={2} />
            </button>
          )}
        </div>
        {["tous", "actif", "inactif"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ padding: "0.4rem 0.85rem", borderRadius: 8, border: `1px solid ${filter === f ? C.primary : C.border}`, background: filter === f ? C.primaryPale : "white", color: filter === f ? C.primary : C.textMid, fontSize: "0.78rem", fontWeight: 500, cursor: "pointer", fontFamily: F.body }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        {canCreatePatient && (
          <Btn icon={I.plus} size="sm" onClick={() => setModalNP(true)}>Nouveau patient</Btn>
        )}
        <button
          onClick={refresh}
          disabled={loading}
          title="Actualiser"
          style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: "white", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Icon d={I.activity} size={14} stroke={loading ? C.textLight : C.textMid} sw={2} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.2rem" }}>

        {/* Tableau */}
        <Card>
          <CardHead title="Liste des patients" sub={`${filtered.length} patient(s)`} />
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Téléphone</th>
                <th>Localisation</th>
                <th>Groupe</th>
                <th>Statut</th>
                <th>Inscrit le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && !patients.length
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: C.textLight, fontSize: "0.84rem" }}>
                        {search ? `Aucun résultat pour "${search}"` : "Aucun patient trouvé"}
                      </td>
                    </tr>
                  )
                  : filtered.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p)}
                      style={{ background: selected?.id === p.id ? C.primaryPale : undefined, cursor: "pointer" }}
                    >
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: avatarColor(p.nom), display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.72rem", fontFamily: F.title, flexShrink: 0 }}>
                            {initials(p.prenom, p.nom)}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.82rem", fontWeight: 500, color: C.text }}>{p.prenom} {p.nom}</div>
                            <div style={{ fontSize: "0.67rem", color: C.textLight }}>{p.numPatient ?? `#${p.id}`}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.78rem", color: C.textMid }}>{p.telephone ?? "—"}</td>
                      <td style={{ fontSize: "0.76rem", color: C.textMid }}>
                        {p.region ?? "—"}
                        {p.commune ? ` · ${p.commune}` : ""}
                      </td>
                      <td>
                        <Badge variant="gray">{p.groupeSanguin ?? "—"}</Badge>
                      </td>
                      <td>
                        <Badge variant={p.actif ? "teal" : "gray"}>{p.actif ? "Actif" : "Inactif"}</Badge>
                      </td>
                      <td style={{ fontSize: "0.76rem", color: C.textMid }}>{fmtDate(p.createdAt)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          {[
                            { d: I.activity, action: () => { setSelected(p); setModalConst(true); },   title: "Constantes" },
                            { d: I.calendar, action: () => { setSelected(p); setModalRDV(true); },     title: "Rendez-vous" },
                            { d: I.plus,     action: () => openConsultationModal(p),                  title: "Consultation" },
                          ].map(({ d, action, title }) => (
                            <button
                              key={title}
                              title={title}
                              onClick={(e) => { e.stopPropagation(); action(); }}
                              style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMid }}
                            >
                              <Icon d={d} size={12} sw={2} />
                            </button>
                          ))}
                          {canToggleStatus && (
                            <button
                              title={p.actif ? "Désactiver le compte" : "Activer le compte"}
                              onClick={(e) => { e.stopPropagation(); handleToggleStatut(p); }}
                              disabled={togglingId === p.id}
                              style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${p.actif ? C.danger + "60" : C.primary + "60"}`, background: p.actif ? `${C.danger}10` : `${C.primary}10`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: togglingId === p.id ? 0.5 : 1 }}
                            >
                              <Icon d={p.actif ? I.lock : I.check} size={12} sw={2} stroke={p.actif ? C.danger : C.primary} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </Card>

        {/* Side panel dossier */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {selected ? (
            <Card>
              {/* Header patient */}
              <div style={{ padding: "1rem", background: `linear-gradient(135deg, ${C.primaryPale}, #e8f3fc)`, borderBottom: `1px solid ${C.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.65rem" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${avatarColor(selected.nom)}, ${C.primaryDark})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "0.95rem", fontFamily: F.title }}>
                    {initials(selected.prenom, selected.nom)}
                  </div>
                  <div>
                    <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.95rem", color: C.text }}>
                      {selected.prenom} {selected.nom}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: C.textMid }}>
                      {selected.numPatient ?? `#${selected.id}`}
                      {selected.dateNaissance ? ` · ${getAge(selected.dateNaissance)} ans` : ""}
                      {selected.sexe ? ` · ${selected.sexe}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <Badge variant={selected.actif ? "teal" : "gray"}>{selected.actif ? "Actif" : "Inactif"}</Badge>
                  {selected.groupeSanguin && <Badge variant="gray">{selected.groupeSanguin}</Badge>}
                </div>
              </div>

              {/* Détails */}
              <div style={{ padding: "0.9rem 1rem" }}>
                {[
                  ["E-mail",      selected.email],
                  ["Téléphone",   selected.telephone],
                  ["Région",      selected.region],
                  ...(selected.departement ? [["Département", selected.departement]] : []),
                  ...(selected.commune     ? [["Commune",     selected.commune]]     : []),
                  ["Assurance",   selected.assurance ? "Oui" : "Non"],
                  ["Créé par",    selected.creeParNomComplet],
                  ["Inscrit le",  fmtDate(selected.createdAt)],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0.3rem 0", borderBottom: `1px solid ${C.borderLight}`, fontSize: "0.77rem" }}>
                    <span style={{ color: C.textMid }}>{k}</span>
                    <span style={{ fontWeight: 500, color: C.text, textAlign: "right", maxWidth: "55%" }}>{v}</span>
                  </div>
                ))}

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                  <Btn variant="primary" size="sm" full onClick={() => setModalConst(true)}>Constantes</Btn>
                  <Btn variant="outline" size="sm" full onClick={() => setModalRDV(true)}>RDV</Btn>
                  <Btn variant="outline" size="sm" full icon={I.plus} onClick={() => openConsultationModal(selected)}>Consultation</Btn>
                  <Btn variant="outline" size="sm" full icon={I.file} onClick={() => setDossierPatient(selected)}>Dossier médical</Btn>
                </div>

                {/* Identifiants de connexion patient */}
                {canCreatePatient && selected.numPatient && (
                  <div style={{ marginTop: "0.75rem", borderTop: `1px solid ${C.borderLight}`, paddingTop: "0.75rem" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                      Identifiants patient
                    </div>
                    {[
                      { label: "N° Patient (login)", key: "num", value: selected.numPatient },
                      selected.email    && { label: "E-mail",    key: "email", value: selected.email },
                      selected.telephone && { label: "Téléphone", key: "tel",   value: selected.telephone },
                    ].filter(Boolean).map((row) => (
                      <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.45rem 0.65rem", background: C.bg, borderRadius: 8, marginBottom: "0.35rem", border: `1px solid ${C.borderLight}` }}>
                        <div>
                          <div style={{ fontSize: "0.66rem", color: C.textLight, textTransform: "uppercase", letterSpacing: "0.04em" }}>{row.label}</div>
                          <div style={{ fontSize: "0.82rem", fontFamily: "monospace", fontWeight: 700, color: C.text, letterSpacing: "0.04em" }}>{row.value}</div>
                        </div>
                        <button
                          onClick={() => copyField(row.value, row.key)}
                          title="Copier"
                          style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: copied === row.key ? C.primaryPale : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}
                        >
                          <Icon d={copied === row.key ? I.check : I.clipboard} size={13} stroke={copied === row.key ? C.primary : C.textMid} sw={2} />
                        </button>
                      </div>
                    ))}
                    <div style={{ fontSize: "0.68rem", color: C.textLight, lineHeight: 1.5, marginTop: "0.3rem" }}>
                      Le mot de passe temporaire a été envoyé au patient lors de la création. Pour le réinitialiser, contactez l'administration.
                    </div>
                  </div>
                )}

                {/* Désactivation / réactivation */}
                {canToggleStatus && (
                  <div style={{ marginTop: "0.75rem", borderTop: `1px solid ${C.borderLight}`, paddingTop: "0.75rem" }}>
                    {confirmDeactiv && selected.actif ? (
                      <div style={{ background: `${C.danger}08`, border: `1px solid ${C.danger}30`, borderRadius: 10, padding: "0.7rem 0.85rem" }}>
                        <p style={{ fontSize: "0.77rem", color: C.text, fontWeight: 600, marginBottom: "0.4rem" }}>
                          Désactiver {selected.prenom} {selected.nom} ?
                        </p>
                        <p style={{ fontSize: "0.72rem", color: C.textMid, marginBottom: "0.65rem", lineHeight: 1.5 }}>
                          Le patient ne pourra plus se connecter. Ses données médicales sont conservées.
                        </p>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            onClick={() => setConfirmDeactiv(false)}
                            style={{ flex: 1, padding: "0.38rem", borderRadius: 7, border: `1px solid ${C.border}`, background: "white", fontSize: "0.76rem", cursor: "pointer", color: C.textMid, fontFamily: F.title, fontWeight: 600 }}
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleToggleStatut(selected, true)}
                            disabled={togglingId === selected.id}
                            style={{ flex: 1, padding: "0.38rem", borderRadius: 7, border: "none", background: C.danger, color: "white", fontSize: "0.76rem", cursor: "pointer", fontFamily: F.title, fontWeight: 700, opacity: togglingId === selected.id ? 0.6 : 1 }}
                          >
                            {togglingId === selected.id ? "…" : "Confirmer"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setConfirmDeactiv(false); handleToggleStatut(selected); }}
                        disabled={togglingId === selected.id}
                        style={{ width: "100%", padding: "0.42rem 0.75rem", borderRadius: 8, border: `1px solid ${selected.actif ? C.danger + "50" : C.primary + "50"}`, background: selected.actif ? `${C.danger}08` : `${C.primary}08`, color: selected.actif ? C.danger : C.primary, fontSize: "0.77rem", fontWeight: 600, cursor: "pointer", fontFamily: F.title, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", opacity: togglingId === selected.id ? 0.6 : 1 }}
                      >
                        <Icon d={selected.actif ? I.lock : I.check} size={13} stroke={selected.actif ? C.danger : C.primary} sw={2} />
                        {togglingId === selected.id ? "Traitement…" : selected.actif ? "Désactiver le compte" : "Réactiver le compte"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: C.textLight }}>
                <Icon d={I.user} size={32} stroke={C.borderLight} sw={1.5} />
                <p style={{ marginTop: "0.75rem", fontSize: "0.82rem" }}>
                  {loading ? "Chargement des patients…" : "Sélectionnez un patient"}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default PagePatients;
