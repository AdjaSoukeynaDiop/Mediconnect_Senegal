import { useState, useEffect } from "react";
import { C, F } from "../constants/theme.js";
import { I } from "../constants/icons.js";
import { useToast } from "../components/toast/ToastContext.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import { Card, CardHead } from "../components/ui/Card.jsx";
import Btn from "../components/ui/Btn.jsx";
import Icon from "../components/ui/Icon.jsx";
import ModalNouveauPatient from "../components/modals/ModalNouveauPatient.jsx";
import ModalRDV from "../components/modals/ModalRDV.jsx";
import { useAuth } from "../api/AuthContext.jsx";
import { getMonProfilAssistant } from "../api/assistants.api.js";
import { createPatient, getPatients } from "../api/patients.api.js";
import PagePatients from "../pages/shared/PagePatients.jsx";
import PageAgenda from "../pages/shared/PageAgenda.jsx";
import PageParametresMedecin from "../pages/shared/PageParametresMedecin.jsx";

const AssistantDashboard = ({ setPage }) => {
  const [active, setActive] = useState("accueil");
  const toast = useToast();
  const { user, logout } = useAuth();

  const [profil,      setProfil]      = useState(null);
  const [stats,       setStats]       = useState({ total: 0, mois: 0, semaine: 0 });
  const [modalNP,     setModalNP]     = useState(false);
  const [modalRDV,    setModalRDV]    = useState(false);

  useEffect(() => {
    getMonProfilAssistant()
      .then(setProfil)
      .catch(() => {});

    getPatients()
      .then((data) => {
        const liste = Array.isArray(data) ? data : [];
        const now = new Date();
        const debutMois    = new Date(now.getFullYear(), now.getMonth(), 1);
        const debutSemaine = new Date(now);
        debutSemaine.setDate(now.getDate() - now.getDay());
        debutSemaine.setHours(0, 0, 0, 0);

        setStats({
          total:    liste.length,
          mois:     liste.filter(p => new Date(p.createdAt) >= debutMois).length,
          semaine:  liste.filter(p => new Date(p.createdAt) >= debutSemaine).length,
        });
      })
      .catch(() => {});
  }, []);

  const handleCreatePatient = async (payload) => {
    try {
      const res = await createPatient(payload);
      toast("Patient créé. Identifiants envoyés au patient.", "success");
      // Refresh stats
      getPatients().then((data) => {
        const liste = Array.isArray(data) ? data : [];
        const now = new Date();
        const debutMois    = new Date(now.getFullYear(), now.getMonth(), 1);
        const debutSemaine = new Date(now);
        debutSemaine.setDate(now.getDate() - now.getDay());
        debutSemaine.setHours(0, 0, 0, 0);
        setStats({
          total:   liste.length,
          mois:    liste.filter(p => new Date(p.createdAt) >= debutMois).length,
          semaine: liste.filter(p => new Date(p.createdAt) >= debutSemaine).length,
        });
      }).catch(() => {});
      return res;
    } catch (err) {
      toast(err.apiMessage ?? "Impossible de créer le patient.", "error");
      throw err;
    }
  };

  const prenom    = profil?.prenom ?? user?.prenom ?? "";
  const nomUser   = profil?.nom    ?? user?.nom    ?? "";
  const hopital   = profil?.hopital ?? "";
  const service   = profil?.serviceAffecte ?? "";
  const initiales = `${prenom[0] ?? ""}${nomUser[0] ?? ""}`.toUpperCase() || "AS";
  const sousTitre = [service, hopital].filter(Boolean).join(" · ") || "Assistant médical";
  const displayProfil = {
    nom:       `${prenom} ${nomUser}`.trim() || "Assistant",
    initiales,
    sousTitre,
    couleur:   `linear-gradient(135deg,${C.primaryDark},${C.primary})`,
    espace:    "Espace Assistant",
  };

  const nav = [
    { id: "accueil",   label: "Tableau de bord", icon: I.activity  },
    { id: "patients",  label: "Patients",         icon: I.users     },
    { id: "agenda",    label: "Agenda",            icon: I.calendar  },
    { id: "parametres",label: "Paramètres",        icon: I.settings  },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, overflow: "hidden" }}>
      <ModalNouveauPatient
        open={modalNP}
        onClose={() => setModalNP(false)}
        toast={toast}
        onSave={handleCreatePatient}
      />
      <ModalRDV
        open={modalRDV}
        onClose={() => setModalRDV(false)}
        toast={toast}
      />

      {/* ── Sidebar ── */}
      <aside style={{
        width: 252, flexShrink: 0,
        background: `linear-gradient(170deg,${C.primaryDeep},${C.primaryDark})`,
        display: "flex", flexDirection: "column", height: "100vh",
        boxShadow: "4px 0 20px rgba(0,0,0,0.1)",
      }}>
        {/* Logo */}
        <div style={{ padding: "1.4rem 1.2rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "0.65rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon d={I.heart} size={18} stroke={C.primaryLight} sw={2} />
          </div>
          <div>
            <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "0.95rem", color: "white" }}>MediConnect</div>
            <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{displayProfil.espace}</div>
          </div>
        </div>

        {/* Profil */}
        <div style={{ margin: "0.9rem", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.75rem 0.9rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: displayProfil.couleur, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.title, fontWeight: 800, color: "white", fontSize: "0.82rem" }}>
              {displayProfil.initiales}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "white", fontSize: "0.82rem" }}>{displayProfil.nom}</div>
              <div style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.4)" }}>{displayProfil.sousTitre}</div>
            </div>
            <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: C.accent }} />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0.4rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.1rem", overflowY: "auto" }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)} style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.58rem 0.7rem", borderRadius: 9, border: "none",
              background: active === n.id ? "rgba(255,255,255,0.14)" : "transparent",
              color: active === n.id ? "white" : "rgba(255,255,255,0.48)",
              fontSize: "0.82rem", fontWeight: active === n.id ? 600 : 400,
              cursor: "pointer", transition: "all 0.13s", width: "100%", textAlign: "left",
            }}>
              <Icon d={n.icon} size={16} sw={1.8} />
              {n.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <button onClick={() => setPage("home")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", cursor: "pointer", padding: "0.3rem 0.2rem" }}>
            <Icon d={I.arrowL} size={13} sw={2} /> Retour accueil
          </button>
          <button
            onClick={async () => { await logout(); setPage("home"); }}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(220,50,50,0.12)", border: "1px solid rgba(220,50,50,0.25)", borderRadius: 8, color: "#f87171", fontSize: "0.78rem", cursor: "pointer", padding: "0.42rem 0.65rem", width: "100%", fontWeight: 600 }}
          >
            <Icon d={I.x} size={13} sw={2} /> Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: "auto", padding: "2rem" }}>

        {/* ── Accueil ── */}
        {active === "accueil" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.8rem" }}>
              <div>
                <h1 style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1.5rem", color: C.text }}>
                  Tableau de bord
                </h1>
                <p style={{ color: C.textLight, fontSize: "0.85rem", marginTop: "0.2rem" }}>
                  {displayProfil.nom} · {displayProfil.sousTitre}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <Btn variant="outline" icon={I.calendar} size="sm" onClick={() => setModalRDV(true)}>
                  Nouveau RDV
                </Btn>
                <Btn icon={I.plus} size="sm" onClick={() => setModalNP(true)}>
                  Créer un patient
                </Btn>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
              <StatCard
                label="Total patients créés"
                value={stats.total}
                sub="Depuis le début"
                color={C.primary}
                icon={I.users}
              />
              <StatCard
                label="Ce mois"
                value={stats.mois}
                sub="Nouveaux dossiers"
                color={C.primary}
                icon={I.users}
                delta={{ up: stats.mois > 0 }}
              />
              <StatCard
                label="Cette semaine"
                value={stats.semaine}
                sub="Inscriptions récentes"
                color="#17935a"
                icon={I.users}
                delta={{ up: stats.semaine > 0 }}
              />
            </div>

            {/* Guide rapide */}
            <Card>
              <CardHead title="Actions rapides" sub="Gérez les dossiers patients" />
              <div style={{ padding: "1.2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>

                <button
                  onClick={() => setModalNP(true)}
                  style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", borderRadius: 12, border: `1.5px solid ${C.border}`, background: "white", cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 14px ${C.primary}22`}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primaryPale, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon d={I.plus} size={18} stroke={C.primary} sw={2.2} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: C.text, marginBottom: "0.2rem" }}>
                      Créer un patient
                    </div>
                    <div style={{ fontSize: "0.76rem", color: C.textLight, lineHeight: 1.4 }}>
                      Ouvrir un nouveau dossier avec identifiants d'accès
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActive("patients")}
                  style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", borderRadius: 12, border: `1.5px solid ${C.border}`, background: "white", cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(22,96,168,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon d={I.users} size={18} stroke="#1660a8" sw={2} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: C.text, marginBottom: "0.2rem" }}>
                      Liste des patients
                    </div>
                    <div style={{ fontSize: "0.76rem", color: C.textLight, lineHeight: 1.4 }}>
                      Consulter et modifier les dossiers patients
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setModalRDV(true)}
                  style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", borderRadius: 12, border: `1.5px solid ${C.border}`, background: "white", cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(23,147,90,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon d={I.calendar} size={18} stroke="#17935a" sw={2} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: C.text, marginBottom: "0.2rem" }}>
                      Planifier un RDV
                    </div>
                    <div style={{ fontSize: "0.76rem", color: C.textLight, lineHeight: 1.4 }}>
                      Créer un rendez-vous pour un patient
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setActive("agenda")}
                  style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem", borderRadius: 12, border: `1.5px solid ${C.border}`, background: "white", cursor: "pointer", textAlign: "left", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(224,130,51,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon d={I.activity} size={18} stroke="#d97706" sw={2} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: C.text, marginBottom: "0.2rem" }}>
                      Voir l'agenda
                    </div>
                    <div style={{ fontSize: "0.76rem", color: C.textLight, lineHeight: 1.4 }}>
                      Consulter et gérer les rendez-vous
                    </div>
                  </div>
                </button>

              </div>
            </Card>

            {/* Note d'information */}
            <div style={{ marginTop: "1.2rem", padding: "0.9rem 1.1rem", borderRadius: 10, background: C.primaryPale, border: `1px solid ${C.border}`, display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
              <Icon d={I.shield} size={16} stroke={C.primary} sw={2} style={{ marginTop: 1, flexShrink: 0 }} />
              <div style={{ fontSize: "0.79rem", color: C.primaryDark, lineHeight: 1.5 }}>
                <strong>Rôle Assistant médical :</strong> Vous êtes responsable de la création des dossiers patients et de la gestion administrative. Les soins (constantes, consultations, ordonnances) sont assurés par l'équipe médicale.
              </div>
            </div>
          </>
        )}

        {active === "patients"   && <PagePatients   toast={toast} onNouveauPatient={() => setModalNP(true)} />}
        {active === "agenda"     && <PageAgenda     toast={toast} />}
        {active === "parametres" && <PageParametresMedecin toast={toast} userRole="assistant" profil={displayProfil} />}
      </main>
    </div>
  );
};

export default AssistantDashboard;
