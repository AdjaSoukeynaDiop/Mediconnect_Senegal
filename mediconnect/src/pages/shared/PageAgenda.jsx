import { useState, useEffect, useCallback } from "react";
import { C, F } from "../../constants/theme.js";
import { I }    from "../../constants/icons.js";
import {
  getAllRendezVous,
  getMesRendezVous,
  getRendezVousByMedecin,
  getRendezVousByPatient,
  confirmerRendezVous,
  annulerRendezVous,
  proposerDateRendezVous,
} from "../../api/rendezvous.api.js";
import { useAuth }        from "../../api/AuthContext.jsx";
import StatCard           from "../../components/ui/StatCard.jsx";
import { Card, CardHead } from "../../components/ui/Card.jsx";
import { Badge }          from "../../components/ui/TagBadge.jsx";
import Btn                from "../../components/ui/Btn.jsx";
import Icon               from "../../components/ui/Icon.jsx";
import ModalRDV           from "../../components/modals/ModalRDV.jsx";
import Modal              from "../../components/ui/Modal.jsx";

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUT_MAP = {
  PLANIFIE:      { variant: "blue",   label: "Planifié"       },
  CONFIRME:      { variant: "teal",   label: "Confirmé"       },
  ANNULE:        { variant: "red",    label: "Annulé"         },
  EFFECTUE:      { variant: "gray",   label: "Effectué"       },
  DATE_PROPOSEE: { variant: "orange", label: "Date proposée"  },
};

const TYPE_MAP = {
  PRESENTIEL: "Présentiel",
  VIDEO:      "Vidéo",
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
};
const fmtHeure = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const isToday = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const isThisWeek = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
};

const COLORS = ["#1660a8","#17935a","#e08833","#8e44ad","#c0392b","#16a085","#d35400"];
const avatarColor = (str = "") => COLORS[(str.charCodeAt(0) || 0) % COLORS.length];
const initials = (prenom = "", nom = "") =>
  `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?";

// ── Composant ────────────────────────────────────────────────────────────────
const PageAgenda = ({ toast }) => {
  const { user } = useAuth();

  const [rdvs,           setRdvs]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modalRDV,       setModalRDV]       = useState(false);
  const [actionId,       setActionId]       = useState(null);
  const [expandedId,     setExpandedId]     = useState(null);
  const [filtreService,  setFiltreService]  = useState("");
  const [modalProposer,  setModalProposer]  = useState(null); // rdv en cours de proposition
  const [dateProposee,   setDateProposee]   = useState("");
  const [heureProposee,  setHeureProposee]  = useState("09:00");

  // ── Fetch des RDV selon le rôle ──────────────────────────────────────────
  const loadRdvs = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      const role = user?.role;
      if (role === "MEDECIN" || role === "CARDIOLOGUE") {
        data = await getRendezVousByMedecin(user.userId);
      } else if (role === "INFIRMIER" || role === "ADMIN" || role === "ASSISTANT") {
        data = await getAllRendezVous();
      } else if (role === "PATIENT" && user?.userId) {
        data = await getRendezVousByPatient(user.userId);
      } else {
        data = await getMesRendezVous();
      }
      setRdvs(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status !== 404) {
        toast(err.apiMessage ?? "Erreur lors du chargement des rendez-vous", "error");
      }
      setRdvs([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { loadRdvs(); }, [loadRdvs]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleConfirmer = async (rdv) => {
    setActionId(rdv.id);
    try {
      const updated = await confirmerRendezVous(rdv.id);
      setRdvs((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      toast("Rendez-vous confirmé", "success");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la confirmation", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleAnnuler = async (rdv) => {
    setActionId(rdv.id);
    try {
      const updated = await annulerRendezVous(rdv.id);
      setRdvs((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      toast("Rendez-vous annulé", "warning");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de l'annulation", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleRdvCreated = (rdv) => {
    setRdvs((prev) => [rdv, ...prev]);
  };

  const handleProposerDate = async () => {
    if (!dateProposee || !heureProposee) { toast("Date et heure obligatoires", "warning"); return; }
    setActionId(modalProposer.id);
    try {
      const iso = `${dateProposee}T${heureProposee}:00`;
      const updated = await proposerDateRendezVous(modalProposer.id, iso);
      setRdvs((prev) => prev.map((r) => r.id === updated.id ? updated : r));
      toast("Date alternative proposée au patient", "success");
      setModalProposer(null);
      setDateProposee("");
      setHeureProposee("09:00");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de la proposition", "error");
    } finally {
      setActionId(null);
    }
  };

  // ── Statistiques ─────────────────────────────────────────────────────────
  const countToday    = rdvs.filter((r) => isToday(r.dateHeure)).length;
  const countWeek     = rdvs.filter((r) => isThisWeek(r.dateHeure)).length;
  const countConfirme = rdvs.filter((r) => r.statut === "CONFIRME").length;
  const countVideo    = rdvs.filter((r) => r.type === "VIDEO").length;

  // ── Filtre par service/spécialité (ASSISTANT) ────────────────────────────
  const isAssistant = user?.role === "ASSISTANT";
  const services = isAssistant
    ? [...new Set(rdvs.map((r) => r.specialiteMedecin).filter(Boolean))].sort()
    : [];

  const filtered = filtreService
    ? rdvs.filter((r) => r.specialiteMedecin === filtreService)
    : rdvs;

  // ── Tri par date décroissante ─────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => new Date(b.dateHeure) - new Date(a.dateHeure));

  // ── Skeleton row ─────────────────────────────────────────────────────────
  const SkeletonRow = () => (
    <tr>
      {[110, 130, 120, 70, 100, 80, 60].map((w, i) => (
        <td key={i}>
          <div style={{ height: 12, width: w, borderRadius: 6, background: C.bg, animation: "pulse 1.4s ease-in-out infinite" }} />
        </td>
      ))}
    </tr>
  );

  const isMedecin = user?.role === "MEDECIN" || user?.role === "CARDIOLOGUE";
  const today = new Date().toISOString().split("T")[0];
  const inputSt = { width: "100%", padding: "0.5rem 0.8rem", border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: "0.82rem", color: C.text, outline: "none", boxSizing: "border-box" };

  return (
    <>
      <ModalRDV
        open={modalRDV}
        onClose={() => setModalRDV(false)}
        toast={toast}
        onCreated={handleRdvCreated}
      />

      {/* Modal — Proposer une autre date */}
      <Modal
        open={!!modalProposer}
        onClose={() => { setModalProposer(null); setDateProposee(""); setHeureProposee("09:00"); }}
        title="Proposer une autre date"
        width={400}
        footer={
          <>
            <Btn variant="outline" onClick={() => setModalProposer(null)}>Annuler</Btn>
            <Btn icon={I.calendar} onClick={handleProposerDate} disabled={actionId === modalProposer?.id}>
              {actionId === modalProposer?.id ? "Envoi…" : "Proposer"}
            </Btn>
          </>
        }
      >
        {modalProposer && (
          <div style={{ padding: "0.25rem 0" }}>
            <div style={{ fontSize: "0.82rem", color: C.textMid, marginBottom: "1rem", padding: "0.6rem 0.8rem", background: C.bg, borderRadius: 8 }}>
              Patient : <strong>{modalProposer.prenomPatient} {modalProposer.nomPatient}</strong>
              <br />Date initiale : <strong>{fmtDate(modalProposer.dateHeure)} à {fmtHeure(modalProposer.dateHeure)}</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem" }}>Nouvelle date *</label>
                <input type="date" min={today} value={dateProposee} onChange={e => setDateProposee(e.target.value)} style={inputSt} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMid, marginBottom: "0.3rem" }}>Heure *</label>
                <input type="time" value={heureProposee} onChange={e => setHeureProposee(e.target.value)} style={inputSt} />
              </div>
            </div>
            <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: C.textLight, fontStyle: "italic" }}>
              Le patient devra accepter ou refuser cette nouvelle date.
            </div>
          </div>
        )}
      </Modal>

      {/* StatCards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
        <StatCard label="Aujourd'hui"       value={countToday}    sub={loading ? "Chargement…" : `sur ${rdvs.length} total`}  color={C.primary}  icon={I.calendar} />
        <StatCard label="Cette semaine"     value={countWeek}     sub={`${rdvs.length ? Math.round(countWeek / rdvs.length * 100) : 0}% du total`} color="#1660a8"  icon={I.calendar} delta={{ up: countWeek > 0 }} />
        <StatCard label="Confirmés"         value={countConfirme} sub={`${rdvs.length ? Math.round(countConfirme / rdvs.length * 100) : 0}% taux confirmation`} color="#17935a"  icon={I.check} delta={{ up: true }} />
        <StatCard label="Vidéoconsultations" value={countVideo}   sub={`${rdvs.length ? Math.round(countVideo / rdvs.length * 100) : 0}% du total`}            color="#8e44ad"  icon={I.video} />
      </div>

      {/* Tableau des RDV */}
      <Card>
        <CardHead
          title="Agenda des rendez-vous"
          sub={loading ? "Chargement…" : `${sorted.length} rendez-vous`}
          action={
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {isAssistant && services.length > 0 && (
                <select
                  value={filtreService}
                  onChange={(e) => setFiltreService(e.target.value)}
                  style={{ padding: "0.3rem 0.65rem", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: "0.78rem", color: filtreService ? C.text : C.textLight, fontFamily: F.body, outline: "none", background: "white", cursor: "pointer" }}
                >
                  <option value="">Tous les services</option>
                  {services.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              <button
                onClick={loadRdvs}
                disabled={loading}
                title="Actualiser"
                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: "white", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon d={I.activity} size={14} stroke={loading ? C.textLight : C.textMid} sw={2} />
              </button>
              <Btn size="sm" icon={I.plus} onClick={() => setModalRDV(true)}>Nouveau RDV</Btn>
            </div>
          }
        />

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Heure</th>
              <th>Patient</th>
              {isAssistant && <th>Médecin / Service</th>}
              <th>Type</th>
              <th>Établissement</th>
              <th>Motif</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !rdvs.length
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : sorted.length === 0
                ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: C.textLight, fontSize: "0.84rem" }}>
                      <Icon d={I.calendar} size={32} stroke={C.borderLight} sw={1.5} style={{ display: "block", margin: "0 auto 0.75rem" }} />
                      Aucun rendez-vous trouvé
                    </td>
                  </tr>
                )
                : sorted.map((rdv) => {
                  const { variant, label } = STATUT_MAP[rdv.statut] ?? { variant: "gray", label: rdv.statut };
                  const isActing    = actionId === rdv.id;
                  const isExpanded  = expandedId === rdv.id;
                  const canConfirm  = rdv.statut === "PLANIFIE";
                  const canProposer = isMedecin && (rdv.statut === "PLANIFIE" || rdv.statut === "DATE_PROPOSEE");
                  const canCancel   = rdv.statut !== "ANNULE" && rdv.statut !== "EFFECTUE";
                  const colSpan     = isAssistant ? 9 : 8;

                  return [
                    <tr key={rdv.id}
                      onClick={() => setExpandedId(isExpanded ? null : rdv.id)}
                      style={{ cursor: "pointer", background: isExpanded ? C.primaryPale : undefined }}
                    >
                      {/* Date */}
                      <td>
                        <span style={{ fontSize: "0.78rem", color: C.textMid, whiteSpace: "nowrap" }}>
                          {fmtDate(rdv.dateHeure)}
                        </span>
                      </td>

                      {/* Heure */}
                      <td>
                        <span style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600, color: C.text }}>
                          {fmtHeure(rdv.dateHeure)}
                        </span>
                      </td>

                      {/* Patient */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                            background: avatarColor(rdv.nomPatient ?? ""),
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "white", fontWeight: 700, fontSize: "0.65rem", fontFamily: F.title,
                          }}>
                            {initials(rdv.prenomPatient, rdv.nomPatient)}
                          </div>
                          <span style={{ fontSize: "0.8rem", color: C.text }}>
                            {rdv.prenomPatient} {rdv.nomPatient}
                          </span>
                        </div>
                      </td>

                      {/* Médecin / Service (ASSISTANT only) */}
                      {isAssistant && (
                        <td>
                          {rdv.nomMedecin ? (
                            <div>
                              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.text }}>
                                Dr. {rdv.prenomMedecin} {rdv.nomMedecin}
                              </div>
                              {rdv.specialiteMedecin && (
                                <div style={{ fontSize: "0.68rem", color: C.textLight }}>{rdv.specialiteMedecin}</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.76rem", color: C.textLight }}>—</span>
                          )}
                        </td>
                      )}

                      {/* Type */}
                      <td>
                        <Badge variant={rdv.type === "VIDEO" ? "blue" : "gray"}>
                          {TYPE_MAP[rdv.type] ?? rdv.type}
                        </Badge>
                      </td>

                      {/* Établissement */}
                      <td style={{ fontSize: "0.78rem", color: C.textMid, maxWidth: 140 }}>
                        <span title={rdv.hopital} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {rdv.hopital ?? "—"}
                        </span>
                      </td>

                      {/* Motif */}
                      <td style={{ fontSize: "0.78rem", color: C.textMid, maxWidth: 160 }}>
                        <span title={rdv.motif} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {rdv.motif ?? "—"}
                        </span>
                      </td>

                      {/* Statut */}
                      <td>
                        <Badge variant={variant}>{label}</Badge>
                      </td>

                      {/* Actions */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "0.25rem" }}>
                          {canConfirm && (
                            <button
                              title="Confirmer"
                              disabled={isActing}
                              onClick={() => handleConfirmer(rdv)}
                              style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: isActing ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Icon d={I.check} size={12} sw={2} stroke={isActing ? C.textLight : "#17935a"} />
                            </button>
                          )}
                          {canProposer && (
                            <button
                              title="Proposer une autre date"
                              disabled={isActing}
                              onClick={() => setModalProposer(rdv)}
                              style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid #fbbf24`, background: "#fffbeb", cursor: isActing ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Icon d={I.calendar} size={12} sw={2} stroke={isActing ? C.textLight : "#d97706"} />
                            </button>
                          )}
                          {canCancel && (
                            <button
                              title="Annuler"
                              disabled={isActing}
                              onClick={() => handleAnnuler(rdv)}
                              style={{ width: 27, height: 27, borderRadius: 7, border: `1px solid ${C.border}`, background: "white", cursor: isActing ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              <Icon d={I.x} size={12} sw={2} stroke={isActing ? C.textLight : C.danger} />
                            </button>
                          )}
                          <span style={{ display: "inline-flex", alignItems: "center", marginLeft: 2, transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                            <Icon d={I.chevR} size={11} stroke={C.textLight} sw={2} />
                          </span>
                        </div>
                      </td>
                    </tr>,

                    /* Ligne détail */
                    isExpanded && (
                      <tr key={`${rdv.id}-detail`} style={{ background: "#f8fbff" }}>
                        <td colSpan={colSpan} style={{ padding: 0 }}>
                          <div style={{ padding: "0.85rem 1.25rem 1rem", borderTop: `1px solid ${C.borderLight}` }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "0.75rem", fontSize: "0.8rem" }}>
                              {rdv.nomMedecin && (
                                <div>
                                  <div style={{ fontSize: "0.68rem", fontWeight: 600, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>Médecin</div>
                                  <div style={{ color: C.text }}>Dr. {rdv.prenomMedecin} {rdv.nomMedecin}</div>
                                  {rdv.specialiteMedecin && <div style={{ fontSize: "0.74rem", color: C.textMid }}>{rdv.specialiteMedecin}</div>}
                                </div>
                              )}
                              {rdv.hopital && (
                                <div>
                                  <div style={{ fontSize: "0.68rem", fontWeight: 600, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>Établissement</div>
                                  <div style={{ color: C.text }}>{rdv.hopital}</div>
                                </div>
                              )}
                              {rdv.motif && (
                                <div style={{ gridColumn: "span 2" }}>
                                  <div style={{ fontSize: "0.68rem", fontWeight: 600, color: C.textLight, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.2rem" }}>Motif</div>
                                  <div style={{ color: C.textMid, lineHeight: 1.5 }}>{rdv.motif}</div>
                                </div>
                              )}
                            </div>

                            {/* Lien Jitsi pour les vidéoconsultations */}
                            {rdv.type === "VIDEO" && rdv.lienVideo && (
                              <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.9rem", background: "#eef4ff", border: "1px solid #c3d9ff", borderRadius: 9 }}>
                                <Icon d={I.video} size={15} stroke="#1660a8" sw={2} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1660a8", marginBottom: "0.2rem" }}>Lien de vidéoconsultation</div>
                                  <div style={{ fontSize: "0.72rem", color: "#1660a8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rdv.lienVideo}</div>
                                </div>
                                <a
                                  href={rdv.lienVideo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ padding: "0.35rem 0.75rem", background: "#1660a8", color: "white", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600, textDecoration: "none", flexShrink: 0 }}
                                >
                                  Rejoindre
                                </a>
                              </div>
                            )}
                            {rdv.type === "VIDEO" && !rdv.lienVideo && (
                              <div style={{ marginTop: "0.75rem", fontSize: "0.76rem", color: C.textLight, fontStyle: "italic" }}>
                                Le lien de vidéoconsultation sera disponible après confirmation.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })
            }
          </tbody>
        </table>
      </Card>
    </>
  );
};

export default PageAgenda;
