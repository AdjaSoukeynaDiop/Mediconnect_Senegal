import { useState, useEffect, useCallback } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import {
  getAlertesNonAcquittees,
  getAlertesByPatient,
  acquitterAlerte,
} from "../../api/alertes.api.js";
import { useAuth } from "../../api/AuthContext.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import { Card, CardHead } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/TagBadge.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Icon from "../../components/ui/Icon.jsx";

// ── Niveau → style ────────────────────────────────────────────────────────────
// Valeurs backend : CRITIQUE | URGENT | INFO
const NIVEAU_MAP = {
  CRITIQUE: { color: C.danger,  label: "Critique", variant: "red"    },
  URGENT:   { color: C.warning, label: "Urgent",   variant: "orange" },
  INFO:     { color: "#17935a", label: "Info",      variant: "green"  },
};

const NIVEAU_ORDER = { CRITIQUE: 0, URGENT: 1, INFO: 2 };

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

const POLL_MS = 30_000;

// ── Composant ─────────────────────────────────────────────────────────────────
const PageAlertes = ({ toast }) => {
  const { user } = useAuth();

  const [alertes,       setAlertes]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [acquittantId,  setAcquittantId]  = useState(null);
  const [acquittantAll, setAcquittantAll] = useState(false);

  // ── Fetch (silent=true lors du polling pour ne pas flasher le skeleton) ───
  const loadAlertes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let data;
      if (user?.role === "PATIENT" && user?.userId) {
        const all = await getAlertesByPatient(user.userId);
        data = Array.isArray(all) ? all.filter((a) => !a.acquittee) : [];
      } else {
        data = await getAlertesNonAcquittees();
      }
      setAlertes(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent && err.response?.status !== 404) {
        toast(err.apiMessage ?? "Erreur lors du chargement des alertes", "error");
      }
      if (!silent) setAlertes([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user, toast]);

  // ── Initial load + polling toutes les 30 s ───────────────────────────────
  useEffect(() => {
    loadAlertes();
    const intervalId = setInterval(() => loadAlertes(true), POLL_MS);
    return () => clearInterval(intervalId);
  }, [loadAlertes]);

  // ── Acquitter une alerte ─────────────────────────────────────────────────
  const handleAcquitter = async (alerte) => {
    setAcquittantId(alerte.id);
    try {
      await acquitterAlerte(alerte.id);
      setAlertes((prev) => prev.filter((a) => a.id !== alerte.id));
      toast("Alerte acquittée", "success");
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors de l'acquittement", "error");
    } finally {
      setAcquittantId(null);
    }
  };

  // ── Tout acquitter ────────────────────────────────────────────────────────
  const handleAcquitterAll = async () => {
    if (!alertes.length) return;
    setAcquittantAll(true);
    try {
      await Promise.allSettled(alertes.map((a) => acquitterAlerte(a.id)));
      setAlertes([]);
      toast("Toutes les alertes acquittées", "success");
    } catch {
      toast("Erreur lors de l'acquittement global", "error");
    } finally {
      setAcquittantAll(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const countRouge  = alertes.filter((a) => a.niveau === "CRITIQUE").length;
  const countOrange = alertes.filter((a) => a.niveau === "URGENT").length;
  const countJaune  = alertes.filter((a) => a.niveau === "INFO").length;

  // ── Tri : ROUGE > ORANGE > JAUNE, puis dateEmission desc ─────────────────
  const sorted = [...alertes].sort((a, b) => {
    const diff = (NIVEAU_ORDER[a.niveau] ?? 3) - (NIVEAU_ORDER[b.niveau] ?? 3);
    if (diff !== 0) return diff;
    return new Date(b.dateEmission) - new Date(a.dateEmission);
  });

  // ── Skeleton ──────────────────────────────────────────────────────────────
  const SkeletonItem = ({ idx }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.9rem", padding: "0.9rem 1.2rem", borderBottom: `1px solid ${C.borderLight}` }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, flexShrink: 0, animation: "pulse 1.4s ease-in-out infinite" }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, width: `${55 + idx * 7}%`, background: C.bg, borderRadius: 6, marginBottom: "0.45rem", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 10, width: `${70 + idx * 4}%`, background: C.bg, borderRadius: 6, animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );

  return (
    <>
      {/* ── StatCards ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
        <StatCard
          label="Critiques"
          value={loading ? "—" : countRouge}
          sub="Action immédiate"
          color={C.danger}
          icon={I.bell}
        />
        <StatCard
          label="Modérées"
          value={loading ? "—" : countOrange}
          sub="À traiter sous 24h"
          color={C.warning}
          icon={I.bell}
        />
        <StatCard
          label="Faibles"
          value={loading ? "—" : countJaune}
          sub="Pour information"
          color="#17935a"
          icon={I.bell}
        />
        <StatCard
          label="Total actives"
          value={loading ? "—" : alertes.length}
          sub="Non acquittées"
          color={C.primary}
          icon={I.activity}
        />
      </div>

      {/* ── Liste des alertes ────────────────────────────────────────────── */}
      <Card>
        <CardHead
          title="Alertes actives"
          sub={loading ? "Chargement…" : `${alertes.length} alerte(s) non acquittée(s)`}
          action={
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              {/* Bouton refresh manuel */}
              <button
                onClick={() => loadAlertes()}
                disabled={loading}
                title="Actualiser"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${C.border}`, background: "white",
                  cursor: loading ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon d={I.activity} size={14} stroke={loading ? C.textLight : C.textMid} sw={2} />
              </button>
              {alertes.length > 0 && (
                <Btn variant="outline" size="sm" onClick={handleAcquitterAll} disabled={acquittantAll || loading}>
                  {acquittantAll ? "…" : "Tout acquitter"}
                </Btn>
              )}
            </div>
          }
        />

        {/* Contenu */}
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonItem key={i} idx={i} />)
        ) : sorted.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: C.textLight, fontSize: "0.84rem" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <Icon d={I.check} size={32} stroke={C.borderLight} sw={1.5} />
            </div>
            Aucune alerte active — tout est sous contrôle
          </div>
        ) : (
          sorted.map((a, i) => {
            const { color, label, variant } = NIVEAU_MAP[a.niveau] ?? { color: C.textMid, label: a.niveau, variant: "gray" };
            const isActing = acquittantId === a.id;

            return (
              <div
                key={a.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "0.9rem",
                  padding: "0.9rem 1.2rem",
                  borderBottom: i < sorted.length - 1 ? `1px solid ${C.borderLight}` : "none",
                  borderLeft: `3px solid ${color}`,
                  background: `${color}08`,
                }}
              >
                {/* Icône niveau */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: "0.1rem",
                }}>
                  <Icon d={I.bell} size={17} stroke={color} sw={1.8} />
                </div>

                {/* Corps */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Ligne 1 : badge niveau + nom patient */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                    <Badge variant={variant}>{label}</Badge>
                    {(a.prenomPatient || a.nomPatient) && (
                      <span style={{ fontSize: "0.78rem", fontWeight: 600, color: C.text }}>
                        {a.prenomPatient} {a.nomPatient}
                      </span>
                    )}
                  </div>

                  {/* Ligne 2 : message */}
                  <div style={{ fontSize: "0.84rem", color: C.text, marginBottom: "0.3rem", lineHeight: 1.45 }}>
                    {a.message}
                  </div>

                  {/* Ligne 3 : méta */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
                    {a.source && <Badge variant="gray">{a.source}</Badge>}
                    <span style={{ fontSize: "0.7rem", color: C.textLight }}>
                      {fmtDate(a.dateEmission)}
                    </span>
                    {a.consultationId && (
                      <span style={{ fontSize: "0.7rem", color: C.textLight }}>
                        · Consultation #{a.consultationId}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bouton acquitter */}
                <button
                  onClick={() => handleAcquitter(a)}
                  disabled={isActing}
                  title="Marquer comme acquittée"
                  style={{
                    padding: "0.3rem 0.85rem", borderRadius: 8, flexShrink: 0,
                    border: `1px solid ${isActing ? C.borderLight : C.border}`,
                    background: isActing ? C.bg : "white",
                    color: isActing ? C.textLight : C.textMid,
                    fontSize: "0.75rem", fontWeight: 600,
                    cursor: isActing ? "default" : "pointer",
                    fontFamily: F.title,
                    display: "flex", alignItems: "center", gap: "0.35rem",
                  }}
                >
                  {isActing ? (
                    <span style={{
                      width: 12, height: 12,
                      border: "2px solid rgba(0,0,0,0.15)",
                      borderTopColor: C.textMid,
                      borderRadius: "50%",
                      animation: "spin 0.7s linear infinite",
                      display: "inline-block",
                    }} />
                  ) : (
                    <Icon d={I.check} size={11} sw={2} stroke={C.textMid} />
                  )}
                  {isActing ? "…" : "Acquitter"}
                </button>
              </div>
            );
          })
        )}
      </Card>
    </>
  );
};

export default PageAlertes;
