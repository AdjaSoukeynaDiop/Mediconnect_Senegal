import { useState, useEffect, useCallback } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import { getAllConsultations } from "../../api/consultations.api.js";
import StatCard from "../../components/ui/StatCard.jsx";
import { Card, CardHead } from "../../components/ui/Card.jsx";
import Btn from "../../components/ui/Btn.jsx";
import ModalConstantes from "../../components/modals/ModalConstantes.jsx";

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
};

const imc = (poids, taille) => {
  if (!poids || !taille) return null;
  const h = taille / 100;
  return (poids / (h * h)).toFixed(1);
};

const PageConstantes = ({ toast }) => {
  const [modalConst, setModalConst]   = useState(false);
  const [constantes, setConstantes]   = useState([]);
  const [loading,    setLoading]      = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await getAllConsultations();
      const list = Array.isArray(raw) ? raw : [];
      // Garder uniquement les consultations qui ont au moins une constante vitale
      const withConst = list.filter(c =>
        c.tensionArterielle || c.frequenceCardiaque || c.temperature || c.spo2
      );
      setConstantes(withConst);
    } catch (err) {
      toast(err.apiMessage ?? "Erreur lors du chargement des constantes", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Stats calculées
  const nbTotal = constantes.length;
  const nbTA = constantes.filter(c => {
    if (!c.tensionArterielle) return false;
    const parts = c.tensionArterielle.split("/");
    return parts.length === 2 && parseInt(parts[0]) > 140;
  }).length;
  const nbSpo2 = constantes.filter(c => c.spo2 != null && c.spo2 < 94).length;

  const today = new Date().toDateString();
  const nbToday = constantes.filter(c => {
    if (!c.updatedAt && !c.createdAt) return false;
    return new Date(c.updatedAt ?? c.createdAt).toDateString() === today;
  }).length;

  const SkeletonRow = () => (
    <tr>
      {[200, 100, 90, 80, 60, 60, 60, 60, 60].map((w, i) => (
        <td key={i}><div style={{ height: 12, width: w, background: C.bg, borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} /></td>
      ))}
    </tr>
  );

  return (
    <>
      <ModalConstantes
        open={modalConst}
        onClose={() => { setModalConst(false); load(); }}
        toast={toast}
        patient={null}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
        <StatCard label="Tensions élevées"  value={loading ? "—" : nbTA}     sub="TA systolique > 140"    color={C.danger}   icon={I.activity} />
        <StatCard label="Prises ce jour"    value={loading ? "—" : nbToday}  sub="Consultations du jour"  color="#17935a"    icon={I.check}    delta={{ up: true }} />
        <StatCard label="Anomalies SpO₂"    value={loading ? "—" : nbSpo2}   sub="< 94%"                  color={C.warning}  icon={I.bell}     />
        <StatCard label="Total constantes"  value={loading ? "—" : nbTotal}  sub="Consultations avec CV"  color="#1660a8"    icon={I.trending} />
      </div>

      <Card>
        <CardHead
          title="Historique des constantes"
          sub={loading ? "Chargement…" : `${nbTotal} entrée(s)`}
          action={
            <Btn size="sm" icon={I.plus} onClick={() => setModalConst(true)}>
              Saisir constantes
            </Btn>
          }
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["Patient", "Date & Heure", "Infirmier", "TA", "FC", "SpO₂", "Temp.", "Poids", "IMC"].map(h => (
                  <th key={h} style={{ padding: "0.55rem 0.8rem", textAlign: "left", fontFamily: F.title, fontWeight: 700, fontSize: "0.72rem", color: C.textMid, borderBottom: `1px solid ${C.borderLight}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : constantes.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: "2.5rem", textAlign: "center", color: C.textLight, fontSize: "0.84rem" }}>
                    Aucune constante vitale enregistrée
                  </td>
                </tr>
              ) : (
                constantes.map((c) => {
                  const nomPatient = [c.prenomPatient, c.nomPatient].filter(Boolean).join(" ") || "—";
                  const initials   = nomPatient.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
                  const nomInfirmier = [c.prenomInfirmier, c.nomInfirmier].filter(Boolean).join(" ") || "—";
                  const taHigh = c.tensionArterielle && parseInt(c.tensionArterielle.split("/")[0]) > 140;
                  const spo2Low = c.spo2 != null && c.spo2 < 94;
                  const imcVal = imc(c.poids, c.taille);

                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                      <td style={{ padding: "0.6rem 0.8rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.65rem", fontFamily: F.title, flexShrink: 0 }}>
                            {initials}
                          </div>
                          <span style={{ fontSize: "0.8rem" }}>{nomPatient}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem", fontFamily: "monospace", fontSize: "0.72rem", color: C.textMid }}>
                        {fmtDate(c.updatedAt ?? c.createdAt)}
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem", fontSize: "0.78rem" }}>{nomInfirmier}</td>
                      <td style={{ padding: "0.6rem 0.8rem", fontFamily: "monospace", fontSize: "0.78rem", fontWeight: taHigh ? 700 : 400, color: taHigh ? C.danger : C.text }}>
                        {c.tensionArterielle ?? "—"}
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem", fontFamily: "monospace", fontSize: "0.78rem" }}>
                        {c.frequenceCardiaque != null ? `${c.frequenceCardiaque} bpm` : "—"}
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem", fontFamily: "monospace", fontSize: "0.78rem", color: spo2Low ? C.danger : C.text }}>
                        {c.spo2 != null ? `${c.spo2}%` : "—"}
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem", fontFamily: "monospace", fontSize: "0.78rem" }}>
                        {c.temperature != null ? `${c.temperature}°C` : "—"}
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem", fontFamily: "monospace", fontSize: "0.78rem" }}>
                        {c.poids != null ? `${c.poids} kg` : "—"}
                      </td>
                      <td style={{ padding: "0.6rem 0.8rem", fontFamily: "monospace", fontSize: "0.78rem", color: imcVal > 25 ? C.warning : "#17935a" }}>
                        {imcVal ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

export default PageConstantes;
