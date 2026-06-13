import { useRef, useEffect } from "react";
import { C, F } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import Icon from "../../components/ui/Icon.jsx";
import { PATIENTS, ECG_DATA } from "../../constants/mockData.js";
import StatCard from "../../components/ui/StatCard.jsx";
import { Card, CardHead } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/TagBadge.jsx";
import Btn from "../../components/ui/Btn.jsx";

// ----- Paste the full PageECG component body from the original file here -----
/* Page ECG avec canvas */
const PageECG = ({ toast }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = 200;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(10,145,130,0.12)"; ctx.lineWidth = 0.8;
    for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = "#17e8d4"; ctx.lineWidth = 1.8;
    ctx.shadowColor = "rgba(23,232,212,0.4)"; ctx.shadowBlur = 4;
    const mid = H / 2, ppb = W / 4;
    const pts = [[0,0],[0.05,-0.02],[0.1,0.04],[0.15,-0.03],[0.18,0],[0.2,0.4],[0.22,-0.35],[0.26,0.9],[0.3,0],[0.35,-0.08],[0.4,-0.06],[0.45,0.15],[0.5,0.12],[0.55,0],[0.6,0],[1,0]];
    ctx.beginPath();
    let first = true;
    for (let b = 0; b < 4; b++) {
      for (const [t, v] of pts) {
        const x = b * ppb + t * ppb + 20;
        const y = mid - v * 70;
        if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
      }
    }
    ctx.stroke();
  }, []);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
        <StatCard label="ECG ce mois" value="89" sub="↑ +11" color={C.primary} icon={I.activity} delta={{ up: true }} />
        <StatCard label="Analysés par IA" value="76" sub="85% du total" color="#7050bc" icon={I.zap} />
        <StatCard label="Anomalies détectées" value="14" sub="Nécessitent attention" color={C.warning} icon={I.bell} />
        <StatCard label="Normaux" value="62" sub="82%" color="#17935a" icon={I.check} delta={{ up: true }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.2rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <Card>
            <CardHead title="Visualiseur ECG — Mamadou Faye" sub="PAT-00412 · 14/05/2026 10:32 · 12 dérivations"
              action={<span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.65rem", borderRadius: 100, fontSize: "0.68rem", fontWeight: 600, background: "linear-gradient(135deg,#7050bc,#9c50e0)", color: "white" }}><Icon d={I.zap} size={11} stroke="white" sw={2} />Analyse IA</span>} />
            <div style={{ padding: "1rem" }}>
              <div style={{ background: C.primaryDeep, borderRadius: 14, padding: "1rem" }}>
                <canvas ref={canvasRef} style={{ width: "100%", height: 200, display: "block" }} height={200} />
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                  {[["FC","78 bpm"],["PR","162 ms"],["QRS","88 ms"],["QTc","425 ms"],["Axe","+45°"]].map(([k,v]) => (
                    <span key={k} style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>{k} : <span style={{ color: "#17e8d4", fontWeight: 500 }}>{v}</span></span>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: "0.9rem", padding: "0.85rem", background: "#ede8ff", borderRadius: 11, border: "1px solid #c9b8f0" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7050bc", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.4rem" }}>Résultat IA (confiance 94.2%)</div>
                <div style={{ fontSize: "0.82rem", color: C.text }}>Rythme sinusal régulier. <strong>Hypertrophie ventriculaire gauche</strong> probable (indice de Sokolov-Lyon élevé). Pas d'ischémie aiguë.</div>
                <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem" }}><Badge variant="orange">HVG probable</Badge><Badge variant="green">Pas de FA</Badge><Badge variant="green">Pas d'ischémie</Badge></div>
              </div>
            </div>
          </Card>
          <Card>
            <CardHead title="Liste des ECG récents" action={<Btn size="sm" icon={I.plus} onClick={() => toast("Import ECG ouvert", "success")}>Importer ECG</Btn>} />
            <table>
              <thead><tr><th>Patient</th><th>Date</th><th>FC</th><th>Résultat IA</th><th>Confiance</th><th>Statut</th></tr></thead>
              <tbody>
                {ECG_DATA.map((e, i) => {
                  const p = PATIENTS.find(x => x.id === e.id);
                  return (
                    <tr key={i}>
                      <td><div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: p?.col || C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.65rem", fontFamily: F.title, flexShrink: 0 }}>{e.patient.split(" ").map(w => w[0]).slice(0, 2).join("")}</div>
                        <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>{e.patient}</div>
                      </div></td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.73rem" }}>{e.date}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.73rem" }}>{e.fc}</td>
                      <td style={{ fontSize: "0.75rem" }}>{e.resultat}</td>
                      <td><Badge variant="purple">{e.confiance}</Badge></td>
                      <td>{e.statut === "anomalie" ? <Badge variant="red">Anomalie</Badge> : e.statut === "normal" ? <Badge variant="green">Normal</Badge> : <Badge variant="orange">Analysé</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <Card>
            <CardHead title="Performance IA" />
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[["Sensibilité (FA)", 94.7, C.primary], ["Spécificité", 91.3, "#1660a8"], ["AUC-ROC", 96.3, "#7050bc"], ["Temps inférence", 63, "#17935a"]].map(([lbl, val, col]) => (
                <div key={lbl}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                    <span style={{ color: C.textMid }}>{lbl}</span>
                    <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{lbl === "Temps inférence" ? "312 ms" : `${val}%`}</span>
                  </div>
                  <div style={{ height: 6, background: C.bg, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${val}%`, background: col, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHead title="Pathologies détectées" sub="Ce mois · 14 anomalies" />
            <div style={{ padding: "0.9rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {[["Hypertrophie VG", 7, C.warning, 50], ["Fibrillation auriculaire", 4, C.danger, 29], ["Bloc de branche", 3, "#1660a8", 21]].map(([lbl, n, col, pct]) => (
                <div key={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem" }}>
                  <span>{lbl}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: 70, height: 5, background: C.bg, borderRadius: 3 }}><div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 3 }} /></div>
                    <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{n}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};
export default PageECG;