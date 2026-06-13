import { useState, useEffect, useMemo } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import { getPatients } from "../../api/patients.api.js";
import { getHopitaux } from "../../api/hopitaux.api.js";
import StatCard from "../../components/ui/StatCard.jsx";
import { Card, CardHead } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/TagBadge.jsx";
import Btn from "../../components/ui/Btn.jsx";
import LeafletMap from "../../components/map/LeafletMap.jsx";

const LAYERS = [
  { id: "patients", label: "Répartition patients" },
  { id: "hopitaux", label: "Hôpitaux partenaires" },
  { id: "risque",   label: "Zones à risque"        },
];

const PageCarto = ({ toast }) => {
  const [mapLayer,   setMapLayer]   = useState("patients");
  const [patients,   setPatients]   = useState([]);
  const [hopitaux,   setHopitaux]   = useState([]);
  const [loadingPts, setLoadingPts] = useState(false);
  const [loadingHop, setLoadingHop] = useState(false);

  useEffect(() => {
    const loadPatients = async () => {
      setLoadingPts(true);
      try {
        const data = await getPatients();
        setPatients(Array.isArray(data) ? data : []);
      } catch {
        // La carte reste fonctionnelle sans les marqueurs
      } finally {
        setLoadingPts(false);
      }
    };

    const loadHopitaux = async () => {
      setLoadingHop(true);
      try {
        const data = await getHopitaux();
        setHopitaux(Array.isArray(data) ? data : []);
      } catch {
        // La carte reste fonctionnelle sans les marqueurs
      } finally {
        setLoadingHop(false);
      }
    };

    loadPatients();
    loadHopitaux();
  }, []);

  // Régions calculées depuis les patients réels
  const regions = useMemo(() => {
    const map = {};
    patients.forEach(p => {
      const r = p.region;
      if (!r) return;
      if (!map[r]) map[r] = { name: r, patients: 0 };
      map[r].patients += 1;
    });
    return Object.values(map).sort((a, b) => b.patients - a.patients);
  }, [patients]);

  const maxPts = regions.length > 0 ? Math.max(...regions.map(r => r.patients)) : 1;

  const ptsGeoCount = patients.filter(p => p.region).length;

  return (
    <>
      {/* ── StatCards ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
        <StatCard label="Hôpitaux partenaires" value={loadingHop ? "—" : hopitaux.length} sub={loadingHop ? "Chargement…" : `${hopitaux.filter(h => h.latitude && h.longitude).length} géolocalisé(s)`} color={C.primary} icon={I.map} delta={{ up: true }} />
        <StatCard
          label="Patients géolocalisés"
          value={loadingPts ? "—" : ptsGeoCount}
          sub={loadingPts ? "Chargement…" : `sur ${patients.length} patient(s)`}
          color="#1660a8"
          icon={I.users}
        />
        <StatCard label="Zones à risque" value="3" sub="Densité HTA élevée" color={C.danger} icon={I.bell} />
      </div>

      {/* ── Sélecteur de couche ───────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {LAYERS.map(({ id, label }) => {
          const hopGeoCount = hopitaux.filter(h => h.latitude && h.longitude).length;
          const isLoading =
            (id === "patients" && loadingPts) ||
            (id === "hopitaux" && loadingHop);
          const count =
            id === "patients" ? ptsGeoCount :
            id === "hopitaux" ? hopGeoCount : null;
          const loaded =
            (id === "patients" && !loadingPts && patients.length > 0) ||
            (id === "hopitaux" && !loadingHop && hopitaux.length > 0);

          return (
            <button
              key={id}
              onClick={() => setMapLayer(id)}
              style={{
                padding: "0.42rem 1rem", borderRadius: 9,
                border: `1px solid ${mapLayer === id ? C.primary : C.border}`,
                background: mapLayer === id ? C.primaryPale : "white",
                color: mapLayer === id ? C.primary : C.textMid,
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                fontFamily: F.title, transition: "all .14s",
                display: "flex", alignItems: "center", gap: "0.4rem",
              }}
            >
              {label}
              {isLoading && (
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  border: `2px solid ${C.border}`, borderTopColor: C.primary,
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block", flexShrink: 0,
                }} />
              )}
              {loaded && count !== null && (
                <span style={{
                  background: mapLayer === id ? C.primary : C.border,
                  color: mapLayer === id ? "white" : C.textMid,
                  borderRadius: 100, fontSize: "0.65rem", fontWeight: 700,
                  padding: "1px 6px",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Carte ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "1.2rem" }}>
        <LeafletMap mapLayer={mapLayer} patients={patients} hopitaux={hopitaux} />
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "0.8rem",
          padding: "0.8rem 1rem", background: "white",
          border: `1px solid ${C.borderLight}`, borderTop: "none",
          borderRadius: "0 0 16px 16px",
        }}>
          {[
            ["#0a9182", "Patient actif"],
            ["#9ca3af", "Patient inactif"],
            ["#1254a0", "Hôpital partenaire"],
            ["#7050bc", "Hôpital privé"],
            ["#c93535", "Zone à risque élevé"],
          ].map(([col, lbl]) => (
            <div key={lbl} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.73rem", color: C.textMid }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, flexShrink: 0 }} />
              {lbl}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tableau par région (données réelles) ─────────────────────────── */}
      <Card>
        <CardHead
          title="Répartition par région"
          sub={loadingPts ? "Chargement…" : `${regions.length} région(s) · ${patients.length} patient(s) au total`}
          action={
            <Btn size="sm" variant="outline" icon={I.download} onClick={() => toast("Export rapport", "success")}>
              Exporter
            </Btn>
          }
        />
        {loadingPts ? (
          <div style={{ padding: "2rem", textAlign: "center", color: C.textLight, fontSize: "0.84rem" }}>Chargement…</div>
        ) : regions.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: C.textLight, fontSize: "0.84rem" }}>
            Aucune donnée géographique disponible
          </div>
        ) : (
          <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
            {regions.map(r => (
              <div key={r.name} style={{
                background: C.surfaceAlt, border: `1px solid ${C.borderLight}`,
                borderRadius: 12, padding: "0.85rem 0.95rem",
              }}>
                <div style={{ fontFamily: F.title, fontWeight: 700, fontSize: "0.82rem", color: C.text, marginBottom: "0.4rem" }}>
                  {r.name}
                </div>
                <div style={{ height: 4, borderRadius: 2, background: C.bg, marginBottom: "0.55rem" }}>
                  <div style={{
                    height: "100%",
                    width: `${(r.patients / maxPts * 100).toFixed(0)}%`,
                    background: `linear-gradient(90deg, ${C.primary}, ${C.primaryLight})`,
                    borderRadius: 2,
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: F.title, fontWeight: 800, fontSize: "1rem", color: C.primary }}>
                      {r.patients}
                    </div>
                    <div style={{ fontSize: "0.62rem", color: C.textLight }}>patients</div>
                  </div>
                  <Badge variant="green">Stable</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
};

export default PageCarto;
