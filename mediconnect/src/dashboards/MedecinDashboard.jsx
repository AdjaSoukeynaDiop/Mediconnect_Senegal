import { useState, useEffect } from "react";
import { C, F } from "../constants/theme.js";
import { I } from "../constants/icons.js";
import { useToast } from "../components/toast/ToastContext.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import { Card, CardHead } from "../components/ui/Card.jsx";
import { Badge, Tag } from "../components/ui/TagBadge.jsx";
import Btn from "../components/ui/Btn.jsx";
import Icon from "../components/ui/Icon.jsx";
import ModalNouveauPatient from "../components/modals/ModalNouveauPatient.jsx";
import ModalConstantes from "../components/modals/ModalConstantes.jsx";
import ModalOrdonnance from "../components/modals/ModalOrdonnance.jsx";
import ModalRDV from "../components/modals/ModalRDV.jsx";
import ModalConsultation from "../components/modals/ModalConsultation.jsx";
import { useAuth } from "../api/AuthContext.jsx";
import { getMonProfilMedecin, toggleDisponibilite } from "../api/medecins.api.js";
import { createPatient, getPatients } from "../api/patients.api.js";
import { getAlertesNonAcquittees } from "../api/alertes.api.js";
import { getConsultationsByMedecin, getAllConsultations } from "../api/consultations.api.js";
import { getRendezVousByMedecin } from "../api/rendezvous.api.js";
import { getTransfertsRecus } from "../api/transferts.api.js";
import PagePatients from "../pages/shared/PagePatients.jsx";
import PageECG from "../pages/shared/PageECG.jsx";
import PageOrdonnances from "../pages/shared/PageOrdonnances.jsx";
import PageAgenda from "../pages/shared/PageAgenda.jsx";
import PageConstantes from "../pages/shared/PageConstantes.jsx";
import PageAlertes from "../pages/shared/PageAlertes.jsx";
import PageTransferts from "../pages/shared/PageTransferts.jsx";
import PageCarto from "../pages/shared/PageCarto.jsx";
import PageParametresMedecin from "../pages/shared/PageParametresMedecin.jsx";

/* ════════════════════════════════════
   MEDECIN / INFIRMIER DASHBOARD
   Props :
     - setPage        : navigation globale
     - userRole       : "medecin" | "infirmier"   (défaut "medecin")
     - userProfile    : objet contenant les infos de l'utilisateur connecté
════════════════════════════════════ */
const MedecinDashboard = ({
  setPage,
  userRole = "medecin",          // ✅ rôle passé depuis LoginPage
  userProfile = null,            // ✅ profil passé depuis LoginPage
}) => {
  const [active, setActive] = useState("accueil");
  const toast = useToast();
  const [modalNP,   setModalNP]   = useState(false);
  const [modalConst, setModalConst] = useState(false);
  const [modalOrdo,  setModalOrdo]  = useState(false);
  const [modalRDV,   setModalRDV]   = useState(false);
  const [modalConsult, setModalConsult] = useState(false);

  const { user, logout } = useAuth();
  const [medecinProfil,      setMedecinProfil]      = useState(null);
  const [alertes,            setAlertes]            = useState([]);
  const [consultations,      setConsultations]      = useState([]);
  const [patientsData,       setPatientsData]       = useState([]);
  const [rdvsEnAttente,      setRdvsEnAttente]      = useState(0);
  const [transfertsEnAttente,setTransfertsEnAttente]= useState(0);
  const alertesCount = alertes.length;
  const effectiveRole = user?.role === "INFIRMIER" ? "infirmier" : "medecin";

  const isToday = (iso) => {
    if (!iso) return false;
    const d = new Date(iso), n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  };
  const isThisMonth = (iso) => {
    if (!iso) return false;
    const d = new Date(iso), n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
  };

  useEffect(() => {
    if (user?.role === "MEDECIN" || user?.role === "CARDIOLOGUE") {
      getMonProfilMedecin().then(setMedecinProfil).catch(() => {});
      getConsultationsByMedecin(user.userId)
        .then((d) => setConsultations(Array.isArray(d) ? d : []))
        .catch(() => {});
    } else if (user?.role === "INFIRMIER") {
      getAllConsultations()
        .then((d) => setConsultations(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
    getAlertesNonAcquittees()
      .then((liste) => setAlertes(Array.isArray(liste) ? liste : []))
      .catch(() => {});
    getPatients()
      .then((d) => setPatientsData(Array.isArray(d) ? d : []))
      .catch(() => {});

    // Badges agenda + transferts (médecin/cardiologue uniquement)
    if (user?.role === "MEDECIN" || user?.role === "CARDIOLOGUE") {
      if (user?.userId) {
        getRendezVousByMedecin(user.userId)
          .then((d) => {
            const arr = Array.isArray(d) ? d : [];
            setRdvsEnAttente(arr.filter(r => r.statut === "PLANIFIE").length);
          })
          .catch(() => {});
      }
      getTransfertsRecus()
        .then((d) => {
          const arr = Array.isArray(d) ? d : [];
          setTransfertsEnAttente(arr.filter(t => t.statut === "EN_ATTENTE").length);
        })
        .catch(() => {});
    }
  }, [user?.role, user?.userId]);

  const handleCreatePatient = async (payload) => {
    try {
      const res = await createPatient(payload);
      toast("Patient créé. Identifiants envoyés au patient.", "success");
      return res;
    } catch (err) {
      toast(err.apiMessage ?? "Impossible de créer le patient.", "error");
      throw err;
    }
  };

  /* ── Profils par défaut selon le rôle ── */
  const defaultProfiles = {
    medecin: {
      nom:       "Dr. A. Diallo",
      initiales: "AD",
      sousTitre: "Cardiologie · HGGY",
      couleur:   "linear-gradient(135deg,#d97030,#b84f15)",
      espace:    "Espace Médecin",
    },
    infirmier: {
      nom:       "A. Ndiaye",
      initiales: "AN",
      sousTitre: "Infirmier(e) · HGGY",  // ✅ pas de spécialité médicale
      couleur:   "linear-gradient(135deg,#17935a,#0e6040)",
      espace:    "Espace Infirmier",
    },
  };

  const _base = defaultProfiles[effectiveRole] ?? defaultProfiles.medecin;
  let profil;
  if (medecinProfil) {
    const prenom    = medecinProfil.prenom ?? "";
    const nomMed    = medecinProfil.nom    ?? "";
    const initiales = `${prenom[0] ?? ""}${nomMed[0] ?? ""}`.toUpperCase() || "DR";
    const sousTitre = [medecinProfil.specialite, medecinProfil.etablissement].filter(Boolean).join(" · ") || _base.sousTitre;
    profil = { nom: `Dr. ${prenom} ${nomMed}`.trim(), initiales, sousTitre, couleur: _base.couleur, espace: _base.espace };
  } else if (user) {
    const prenom    = user.prenom ?? "";
    const nomUser   = user.nom    ?? "";
    const initiales = `${prenom[0] ?? ""}${nomUser[0] ?? ""}`.toUpperCase() || "DR";
    const nomAffiche = effectiveRole === "medecin"
      ? `Dr. ${prenom} ${nomUser}`.trim()
      : `${prenom} ${nomUser}`.trim();
    profil = { ..._base, nom: nomAffiche || _base.nom, initiales };
  } else {
    profil = userProfile ?? _base;
  }

  /* ── Navigation : certains items sont réservés au médecin ── */
  const nav = [
    { id: "accueil",      label: "Tableau de bord",  icon: I.activity,  roles: ["medecin", "infirmier"] },
    { id: "patients",     label: "Patients",          icon: I.users,     roles: ["medecin", "infirmier"] },
    // ECG et ordonnances : médecin uniquement
    ...(effectiveRole === "medecin" ? [
      { id: "ecg",          label: "Analyses ECG",    icon: I.activity,  roles: ["medecin"] },
      { id: "ordonnances",  label: "Ordonnances",     icon: I.clipboard, roles: ["medecin"] },
    ] : []),
    { id: "agenda",       label: "Agenda",            icon: I.calendar,  roles: ["medecin", "infirmier"] },
    { id: "constantes",   label: "Constantes",        icon: I.trending,  roles: ["medecin", "infirmier"] },
    { id: "alertes",      label: "Alertes",           icon: I.bell,      roles: ["medecin", "infirmier"] },
    { id: "transferts",   label: "Transferts",        icon: I.arrowR,    roles: ["medecin", "infirmier"] },
    { id: "cartographie", label: "Cartographie",      icon: I.map,       roles: ["medecin", "infirmier"] },
    { id: "parametres",   label: "Paramètres",        icon: I.settings,  roles: ["medecin", "infirmier"] },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, overflow: "hidden" }}>
      <ModalNouveauPatient open={modalNP}    onClose={() => setModalNP(false)}    toast={toast} onSave={handleCreatePatient} />
      <ModalConstantes     open={modalConst} onClose={() => setModalConst(false)} toast={toast} patient={null} />
      <ModalRDV            open={modalRDV}   onClose={() => setModalRDV(false)}   toast={toast} patient={null} />

      {/* ✅ ModalOrdonnance et ModalConsultation uniquement pour les médecins */}
      {effectiveRole === "medecin" && (
        <>
          <ModalOrdonnance   open={modalOrdo}    onClose={() => setModalOrdo(false)}    toast={toast} />
          <ModalConsultation open={modalConsult} onClose={() => setModalConsult(false)} toast={toast} patient={null} />
        </>
      )}

      {/* ── Sidebar ── */}
      <aside style={{ width: 252, flexShrink: 0, background: `linear-gradient(170deg, ${C.primaryDeep}, ${C.primaryDark})`, display: "flex", flexDirection: "column", height: "100vh", boxShadow: "4px 0 20px rgba(0,0,0,0.1)" }}>
        <div style={{ padding: "1.4rem 1.2rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={I.heart} size={18} stroke="#1ecb88" sw={2} />
          </div>
          <div>
            <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "0.95rem", color: "white" }}>MediConnect</div>
            {/* ✅ Libellé espace dynamique selon le rôle */}
            <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{profil.espace}</div>
          </div>
        </div>

        {/* ✅ Profil affiché dynamiquement selon le rôle */}
        <div style={{ margin: "0.9rem", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.75rem 0.9rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: profil.couleur, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.title, fontWeight: 800, color: "white", fontSize: "0.82rem" }}>
              {profil.initiales}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "white", fontSize: "0.82rem" }}>{profil.nom}</div>
              <div style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.4)" }}>{profil.sousTitre}</div>
            </div>
            <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#1ecb78" }} />
          </div>
          {/* Toggle disponibilité — médecin seulement */}
          {effectiveRole === "medecin" && (
            <button
              onClick={async () => {
                try {
                  const res = await toggleDisponibilite();
                  setMedecinProfil(res.data ?? res);
                  toast(res.message ?? "Disponibilité mise à jour", "success");
                } catch (err) {
                  toast(err.apiMessage ?? "Erreur", "error");
                }
              }}
              style={{
                marginTop: "0.55rem", width: "100%", padding: "0.35rem 0.6rem",
                borderRadius: 8, border: `1px solid ${medecinProfil?.disponible ? "rgba(30,203,120,0.4)" : "rgba(255,255,255,0.15)"}`,
                background: medecinProfil?.disponible ? "rgba(30,203,120,0.12)" : "rgba(255,255,255,0.06)",
                color: medecinProfil?.disponible ? "#1ecb88" : "rgba(255,255,255,0.4)",
                fontSize: "0.71rem", fontWeight: 600, cursor: "pointer", fontFamily: F.title,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: medecinProfil?.disponible ? "#1ecb78" : "rgba(255,255,255,0.3)", flexShrink: 0 }} />
              {medecinProfil?.disponible ? "Disponible" : "Non disponible"}
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: "0.4rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.1rem", overflowY: "auto" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.58rem 0.7rem", borderRadius: 9, border: "none", background: active === n.id ? "rgba(255,255,255,0.14)" : "transparent", color: active === n.id ? "white" : "rgba(255,255,255,0.48)", fontSize: "0.82rem", fontWeight: active === n.id ? 600 : 400, cursor: "pointer", transition: "all 0.13s", width: "100%", textAlign: "left" }}>
              <Icon d={n.icon} size={16} sw={1.8} />
              {n.label}
              {n.id === "alertes"    && alertesCount        > 0 && <span style={{ marginLeft: "auto", background: C.danger,        color: "white", fontSize: "0.6rem", fontWeight: 700, padding: "0.05rem 0.38rem", borderRadius: 100, minWidth: 16, textAlign: "center" }}>{alertesCount}</span>}
              {n.id === "agenda"    && rdvsEnAttente       > 0 && <span style={{ marginLeft: "auto", background: "#1660a8",         color: "white", fontSize: "0.6rem", fontWeight: 700, padding: "0.05rem 0.38rem", borderRadius: 100, minWidth: 16, textAlign: "center" }}>{rdvsEnAttente}</span>}
              {n.id === "transferts"&& transfertsEnAttente > 0 && <span style={{ marginLeft: "auto", background: C.warning,        color: "white", fontSize: "0.6rem", fontWeight: 700, padding: "0.05rem 0.38rem", borderRadius: 100, minWidth: 16, textAlign: "center" }}>{transfertsEnAttente}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: "0.55rem 0.8rem 0.7rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "0.28rem" }}>
          <button onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", cursor: "pointer", padding: "0.25rem 0.2rem" }}>
            <Icon d={I.arrowL} size={12} sw={2} /> Retour accueil
          </button>
          <button
            onClick={async () => { await logout(); setPage("home"); }}
            style={{ display: "flex", alignItems: "center", gap: "0.45rem", background: "rgba(220,50,50,0.09)", border: "1px solid rgba(220,50,50,0.2)", borderRadius: 7, color: "#f87171", fontSize: "0.75rem", cursor: "pointer", padding: "0.3rem 0.55rem", width: "100%", fontWeight: 600 }}
          >
            <Icon d={I.x} size={12} sw={2} /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
        {active === "accueil" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.8rem" }}>
              <div>
                <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text }}>Tableau de bord</h1>
                {/* ✅ Sous-titre correct selon le profil */}
                <p style={{ color: C.textLight, fontSize: "0.85rem", marginTop: "0.2rem" }}>
                  {profil.nom} · {profil.sousTitre}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <Btn variant="outline" icon={I.bell} size="sm" onClick={() => setActive("alertes")}>Alertes{alertesCount > 0 ? ` (${alertesCount})` : ""}</Btn>
                <Btn icon={I.plus} size="sm" onClick={() => setModalConsult(true)}>Nouvelle consultation</Btn>
              </div>
            </div>

            {(() => {
              const consultAujourd  = consultations.filter(c => isToday(c.dateHeure));
              const consultCeMois   = consultations.filter(c => isThisMonth(c.dateHeure));
              const patientsNouveau = patientsData.filter(p => isThisMonth(p.createdAt));
              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
                    <StatCard label="Consultations aujourd'hui" value={consultAujourd.length} sub={`${consultations.length} au total`} color={C.primary} icon={I.video} />
                    <StatCard label="Patients suivis" value={patientsData.length} sub={`${patientsNouveau.length} ce mois`} color="#1660a8" icon={I.users} delta={{ up: patientsNouveau.length > 0 }} />
                    <StatCard label="Consultations ce mois" value={consultCeMois.length} sub={effectiveRole === "medecin" ? "Médicales" : "Infirmier"} color="#e07228" icon={effectiveRole === "medecin" ? I.activity : I.trending} />
                    <StatCard label="Alertes actives" value={alertesCount} sub={alertesCount > 0 ? "Non acquittées" : "Aucune alerte"} color={C.danger} icon={I.bell} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
                    <Card>
                      <CardHead title="Consultations du jour" sub={`${consultAujourd.length} consultation(s)`} />
                      {consultAujourd.length === 0 ? (
                        <div style={{ padding: "2rem 1.2rem", textAlign: "center", color: C.textLight, fontSize: "0.82rem" }}>
                          Aucune consultation aujourd'hui
                        </div>
                      ) : (
                        consultAujourd.slice(0, 5).map(c => {
                          const enCours   = c.statut === "EN_COURS";
                          const terminee  = c.statut === "TERMINEE";
                          return (
                            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.65rem 1.2rem", borderBottom: `1px solid ${C.borderLight}`, opacity: terminee ? 0.55 : 1 }}>
                              <div style={{ width: 7, height: 7, borderRadius: "50%", background: terminee ? C.textLight : enCours ? C.accent : C.primary, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text }}>{c.prenomPatient} {c.nomPatient}</div>
                                <div style={{ fontSize: "0.68rem", color: C.textLight }}>{c.motif ?? "Consultation"}</div>
                              </div>
                              {enCours  && <Tag color={C.primary}>En cours</Tag>}
                              {terminee && <Tag color={C.textLight}>Terminée</Tag>}
                              {!terminee && (
                                <button onClick={() => setModalConsult(true)} style={{ padding: "0.28rem 0.6rem", borderRadius: 6, border: `1px solid ${C.border}`, background: "white", fontSize: "0.68rem", color: C.textMid, cursor: "pointer" }}>
                                  + Consult.
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </Card>

                    <Card>
                      <CardHead title="Alertes récentes" sub={`${alertes.length} non acquittée(s)`} />
                      {alertes.length === 0 ? (
                        <div style={{ padding: "2rem 1.2rem", textAlign: "center", color: C.textLight, fontSize: "0.82rem" }}>
                          Aucune alerte active
                        </div>
                      ) : (
                        alertes.slice(0, 3).map((a, i) => {
                          const col = a.niveau === "ROUGE" ? C.danger : a.niveau === "ORANGE" ? C.warning : C.accentWarm;
                          return (
                            <div key={a.id ?? i} style={{ padding: "0.72rem 1.2rem", borderBottom: `1px solid ${C.borderLight}`, borderLeft: `3px solid ${col}`, background: `${col}08` }}>
                              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "0.18rem" }}>{a.message ?? "Alerte"}</div>
                              <div style={{ fontSize: "0.68rem", color: C.textLight }}>{a.prenomPatient} {a.nomPatient}</div>
                            </div>
                          );
                        })
                      )}
                      <div style={{ padding: "0.75rem 1.2rem" }}>
                        <Btn variant="outline" size="sm" full onClick={() => setActive("alertes")}>Gérer les alertes</Btn>
                      </div>
                    </Card>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {active === "patients"     && <PagePatients   toast={toast} />}
        {active === "ecg"          && effectiveRole === "medecin" && <PageECG toast={toast} />}
        {active === "ordonnances"  && effectiveRole === "medecin" && <PageOrdonnances toast={toast} />}
        {active === "agenda"       && <PageAgenda     toast={toast} />}
        {active === "constantes"   && <PageConstantes toast={toast} />}
        {active === "alertes"      && <PageAlertes    toast={toast} />}
        {active === "transferts"   && <PageTransferts toast={toast} />}
        {active === "cartographie" && <PageCarto      toast={toast} />}
        {active === "parametres"   && <PageParametresMedecin toast={toast} userRole={effectiveRole} profil={profil} />}
      </main>
    </div>
  );
};

export default MedecinDashboard;