import { useState, useEffect, useCallback } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import {
  getTransfertsByPatient,
  getTransfertsByStatut,
  getTransfertsInitiés,
  getTransfertsRecus,
  accepterTransfert,
  refuserTransfert,
  annulerTransfert,
} from "../../api/transferts.api.js";
import { useAuth } from "../../api/AuthContext.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import { Card, CardHead } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/TagBadge.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Icon from "../../components/ui/Icon.jsx";
import {
  ModalInitierTransfert,
  ModalCRTransfert,
  ModalMarquerComplete,
} from "../../components/modals/ModalTransferts.jsx";

// ── Constantes ────────────────────────────────────────────────────────────────
const ALL_STATUTS = ["EN_ATTENTE", "ACCEPTE", "REFUSE", "EFFECTUE", "ANNULE"];

const STATUT_MAP = {
  EN_ATTENTE: { variant: "orange", label: "En attente" },
  ACCEPTE:    { variant: "teal",   label: "Accepté"    },
  REFUSE:     { variant: "red",    label: "Refusé"     },
  EFFECTUE:   { variant: "green",  label: "Effectué"   },
  ANNULE:     { variant: "gray",   label: "Annulé"     },
};

const TYPE_LABEL = {
  INTERNE: "Interne",
  EXTERNE: "Externe",
  URGENCE: "Urgence vitale",
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const COLORS = ["#1660a8","#17935a","#e08833","#8e44ad","#c0392b","#16a085","#d35400"];
const avatarColor = (str = "") => COLORS[(str.charCodeAt(0) || 0) % COLORS.length];
const initials = (prenom = "", nom = "") =>
  `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase() || "?";

// ── Composant ─────────────────────────────────────────────────────────────────
const PageTransferts = ({ toast }) => {
  const { user } = useAuth();

  const [transferts,    setTransferts]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actingKey,     setActingKey]     = useState(null);
  const [filterStatut,  setFilterStatut]  = useState("");
  const [filterType,    setFilterType]    = useState("");
  const [modalInitier,  setModalInitier]  = useState(false);
  const [modalCR,       setModalCR]       = useState(false);
  const [modalComplete, setModalComplete] = useState(false);
  const [selectedT,     setSelectedT]     = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const loadTransferts = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      const role = user?.role;
      if (role === "PATIENT" && user?.userId) {
        data = await getTransfertsByPatient(user.userId);
      } else if (role === "MEDECIN" || role === "CARDIOLOGUE") {
        // Médecin : ses initiatives + demandes reçues (il est le destinataire)
        const [initiees, recues] = await Promise.allSettled([
          getTransfertsInitiés(),
          getTransfertsRecus(),
        ]);
        const listInitiees = initiees.status === "fulfilled" && Array.isArray(initiees.value) ? initiees.value : [];
        const listRecues   = recues.status   === "fulfilled" && Array.isArray(recues.value)   ? recues.value   : [];
        // Déduplication par id
        const seen = new Set();
        data = [...listRecues, ...listInitiees].filter((t) => {
          if (seen.has(t.id)) return false;
          seen.add(t.id); return true;
        });
      } else {
        // INFIRMIER / ADMIN / ASSISTANT : tous les transferts via statuts
        const results = await Promise.allSettled(
          ALL_STATUTS.map((s) => getTransfertsByStatut(s))
        );
        data = results
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => (Array.isArray(r.value) ? r.value : []));
        const seen = new Set();
        data = data.filter((t) => {
          if (seen.has(t.id)) return false;
          seen.add(t.id); return true;
        });
      }
      setTransferts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors du chargement des transferts", "error");
      setTransferts([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { loadTransferts(); }, [loadTransferts]);

  // ── Action générique ──────────────────────────────────────────────────────
  const act = async (id, type, apiFn, successMsg, toastType = "success") => {
    setActingKey(`${id}_${type}`);
    try {
      const updated = await apiFn(id);
      setTransferts((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      toast(successMsg, toastType);
    } catch (err) {
      toast(err.apiMessage ?? "Erreur", "error");
    } finally {
      setActingKey(null);
    }
  };

  const handleAccepter = (t) => act(t.id, "accepter", accepterTransfert, "Transfert accepté");
  const handleRefuser  = (t) => act(t.id, "refuser",  refuserTransfert,  "Transfert refusé", "warning");
  const handleAnnuler  = (t) => act(t.id, "annuler",  annulerTransfert,  "Transfert annulé", "warning");

  const handleVoirCR   = (t) => { setSelectedT(t); setModalCR(true); };
  const handleComplete = (t) => { setSelectedT(t); setModalComplete(true); };

  const handleCreated = (t) =>
    setTransferts((prev) => [t, ...prev]);
  const handleUpdated = (updated) =>
    setTransferts((prev) => prev.map((t) => t.id === updated.id ? updated : t));

  // ── Filtres locaux + tri ──────────────────────────────────────────────────
  const filtered = transferts
    .filter((t) => !filterStatut || t.statut === filterStatut)
    .filter((t) => !filterType   || t.type   === filterType)
    .sort((a, b) => new Date(b.dateTransfert ?? b.createdAt) - new Date(a.dateTransfert ?? a.createdAt));

  // Types présents dans les données chargées
  const presentTypes = [...new Set(transferts.map((t) => t.type).filter(Boolean))];

  // ── Stats ─────────────────────────────────────────────────────────────────
  const countAttente  = transferts.filter((t) => t.statut === "EN_ATTENTE").length;
  const countAccepte  = transferts.filter((t) => t.statut === "ACCEPTE").length;
  const countEffectue = transferts.filter((t) => t.statut === "EFFECTUE").length;

  // ── Skeleton card ─────────────────────────────────────────────────────────
  const SkeletonCard = ({ idx }) => (
    <div style={{ background: "white", border: `1px solid ${C.borderLight}`, borderRadius: 14, padding: "1.1rem 1.2rem", marginBottom: "0.85rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.75rem" }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, flexShrink: 0, animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, width: `${50 + idx * 15}%`, background: C.bg, borderRadius: 6, marginBottom: "0.35rem", animation: "pulse 1.4s ease-in-out infinite" }} />
          <div style={{ height: 10, width: `${35 + idx * 10}%`, background: C.bg, borderRadius: 6, animation: "pulse 1.4s ease-in-out infinite" }} />
        </div>
      </div>
      <div style={{ height: 10, width: "60%", background: C.bg, borderRadius: 6, animation: "pulse 1.4s ease-in-out infinite" }} />
    </div>
  );

  const selectStyle = {
    padding: "0.42rem 0.75rem", border: `1.5px solid ${C.border}`, borderRadius: 9,
    fontSize: "0.79rem", color: C.text, fontFamily: F.body,
    outline: "none", background: "white", cursor: "pointer",
  };

  return (
    <>
      {/* ── Modales ─────────────────────────────────────────────────────── */}
      <ModalInitierTransfert
        open={modalInitier}
        onClose={() => setModalInitier(false)}
        toast={toast}
        onCreated={handleCreated}
      />
      <ModalCRTransfert
        open={modalCR}
        onClose={() => { setModalCR(false); setSelectedT(null); }}
        transfert={selectedT}
      />
      <ModalMarquerComplete
        open={modalComplete}
        onClose={() => { setModalComplete(false); setSelectedT(null); }}
        toast={toast}
        transfert={selectedT}
        onCompleted={handleUpdated}
      />

      {/* ── StatCards ────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
        <StatCard label="Total"       value={loading ? "—" : transferts.length}  sub="Toutes périodes"     color={C.primary} icon={I.arrowR} />
        <StatCard label="En attente"  value={loading ? "—" : countAttente}       sub="À traiter"           color={C.warning} icon={I.refresh} />
        <StatCard label="Acceptés"    value={loading ? "—" : countAccepte}       sub="En cours de transit" color="#17935a"   icon={I.check}   delta={{ up: countAccepte > 0 }} />
        <StatCard label="Effectués"   value={loading ? "—" : countEffectue}      sub="Complétés"           color={C.primary} icon={I.award} />
      </div>

      {/* ── Liste avec filtres ───────────────────────────────────────────── */}
      <Card>
        <CardHead
          title="Dossiers de transfert"
          sub={loading ? "Chargement…" : `${filtered.length} transfert(s)`}
          action={
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              {/* Filtre statut */}
              <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={selectStyle}>
                <option value="">Tous statuts</option>
                {ALL_STATUTS.map((s) => (
                  <option key={s} value={s}>{STATUT_MAP[s]?.label ?? s}</option>
                ))}
              </select>

              {/* Filtre type */}
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle} disabled={!presentTypes.length}>
                <option value="">Tous types</option>
                {presentTypes.map((t) => (
                  <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>
                ))}
              </select>

              {/* Refresh */}
              <button
                onClick={loadTransferts}
                disabled={loading}
                title="Actualiser"
                style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: "white", cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon d={I.activity} size={14} stroke={loading ? C.textLight : C.textMid} sw={2} />
              </button>

              <Btn size="sm" icon={I.plus} onClick={() => setModalInitier(true)}>
                Initier transfert
              </Btn>
            </div>
          }
        />

        <div style={{ padding: "0.75rem 1rem" }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} idx={i} />)
          ) : filtered.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: C.textLight, fontSize: "0.84rem" }}>
              <div style={{ marginBottom: "0.75rem" }}>
                <Icon d={I.arrowR} size={32} stroke={C.borderLight} sw={1.5} />
              </div>
              Aucun transfert{filterStatut || filterType ? " pour ces filtres" : ""}
            </div>
          ) : (
            filtered.map((t) => {
              const { variant: sv, label: sl } = STATUT_MAP[t.statut] ?? { variant: "gray", label: t.statut };
              const typeLabel     = TYPE_LABEL[t.type] ?? t.type ?? "—";
              const estDestinataire = t.medecinDestinationId === user?.userId || !t.medecinDestinationId;
              const canAccepter = t.statut === "EN_ATTENTE" && estDestinataire;
              const canRefuser  = t.statut === "EN_ATTENTE" && estDestinataire;
              const canEffectuer= t.statut === "ACCEPTE";
              const canAnnuler  = (t.statut === "EN_ATTENTE" || t.statut === "ACCEPTE") && t.medecinId === user?.userId;
              const estRecu     = t.medecinDestinationId && t.medecinDestinationId === user?.userId;

              return (
                <div
                  key={t.id}
                  style={{
                    background: "white",
                    border: `1px solid ${C.borderLight}`,
                    borderRadius: 14,
                    padding: "1.1rem 1.2rem",
                    marginBottom: "0.85rem",
                  }}
                >
                  {/* ── En-tête ── */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: avatarColor(t.nomPatient ?? ""),
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: 800, fontSize: "0.78rem", fontFamily: F.title,
                      }}>
                        {initials(t.prenomPatient, t.nomPatient)}
                      </div>
                      <div>
                        <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.88rem", color: C.text }}>
                          {t.prenomPatient} {t.nomPatient}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: C.textLight, marginTop: "0.1rem" }}>
                          {fmtDate(t.dateTransfert ?? t.createdAt)}
                          {t.prenomMedecin && ` · Dr ${t.prenomMedecin} ${t.nomMedecin}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                      {estRecu && <Badge variant="blue">Demande reçue</Badge>}
                      <Badge variant={sv}>{sl}</Badge>
                      {t.type && <Badge variant="gray">{typeLabel}</Badge>}
                    </div>
                  </div>

                  {/* ── Trajet ── */}
                  {(t.hopitalSource || t.hopitalDestination) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 500, background: C.bg, padding: "0.25rem 0.7rem", borderRadius: 7, color: C.text }}>
                        {t.hopitalSource ?? "—"}
                      </span>
                      <Icon d={I.arrowR} size={13} stroke={C.primary} sw={2} />
                      <span style={{ fontSize: "0.78rem", fontWeight: 500, background: C.bg, padding: "0.25rem 0.7rem", borderRadius: 7, color: C.text }}>
                        {t.hopitalDestination ?? "—"}
                      </span>
                    </div>
                  )}

                  {/* ── Médecin destinataire ── */}
                  {t.nomMedecinDestination && (
                    <div style={{ fontSize: "0.74rem", color: C.textMid, marginBottom: "0.4rem" }}>
                      <strong>Destinataire :</strong> Dr. {t.prenomMedecinDestination} {t.nomMedecinDestination}
                    </div>
                  )}

                  {/* ── Motif ── */}
                  {t.motif && (
                    <div style={{ fontSize: "0.74rem", color: C.textMid, marginBottom: "0.65rem" }}>
                      <strong>Motif :</strong> {t.motif}
                    </div>
                  )}

                  {/* ── Actions ── */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.1rem" }}>
                    <Btn variant="outline" size="sm" icon={I.file} onClick={() => handleVoirCR(t)}>
                      Voir CR
                    </Btn>

                    {canAccepter && (
                      <Btn
                        size="sm"
                        icon={I.check}
                        disabled={actingKey === `${t.id}_accepter`}
                        onClick={() => handleAccepter(t)}
                      >
                        {actingKey === `${t.id}_accepter` ? "…" : "Accepter"}
                      </Btn>
                    )}

                    {canEffectuer && (
                      <Btn size="sm" icon={I.check} onClick={() => handleComplete(t)}>
                        Marquer effectué
                      </Btn>
                    )}

                    {canRefuser && (
                      <Btn
                        variant="outline"
                        size="sm"
                        icon={I.x}
                        disabled={actingKey === `${t.id}_refuser`}
                        onClick={() => handleRefuser(t)}
                      >
                        {actingKey === `${t.id}_refuser` ? "…" : "Refuser"}
                      </Btn>
                    )}

                    {canAnnuler && (
                      <Btn
                        variant="outline"
                        size="sm"
                        icon={I.x}
                        disabled={actingKey === `${t.id}_annuler`}
                        onClick={() => handleAnnuler(t)}
                      >
                        {actingKey === `${t.id}_annuler` ? "…" : "Annuler"}
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </>
  );
};

export default PageTransferts;
