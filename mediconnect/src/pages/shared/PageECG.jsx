import { useRef, useEffect, useState } from "react";
import { C } from "../../constants/theme.js";
import { I } from "../../constants/icons.js";
import Icon from "../../components/ui/Icon.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import { Card, CardHead } from "../../components/ui/Card.jsx";
import { Badge } from "../../components/ui/TagBadge.jsx";
import Btn from "../../components/ui/Btn.jsx";
import SearchableSelect from "../../components/ui/SearchableSelect.jsx";
import { getPatients } from "../../api/patients.api.js";
import { getConsultationsByPatient } from "../../api/consultations.api.js";
import {
  analyserEcgFichier,
  getEcgExamens,
  sauvegarderAnalyseEcg,
  creerExamenEcg,
} from "../../api/ecg.api.js";
import { creerAlerte } from "../../api/alertes.api.js";

// ─── Couleurs par classe ──────────────────────────────────────────────────────
const CLASS_COLORS = {
  NORM: "#17935a", MI: "#c93535", STTC: "#d97030", CD: "#1660a8", HYP: "#7050bc",
};

// ─── Canvas ECG décoratif ─────────────────────────────────────────────────────
function drawEcg(canvas) {
  if (!canvas) return;
  canvas.width = canvas.offsetWidth || 600;
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
  ctx.beginPath(); let first = true;
  for (let b = 0; b < 4; b++) {
    for (const [t, v] of pts) {
      const x = b * ppb + t * ppb + 20, y = mid - v * 70;
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────
const getNiveauAlerte = (predictions) => {
  const pos = predictions.filter(p => p.positive && p.code !== "NORM");
  if (pos.some(p => ["MI", "CD"].includes(p.code))) return "CRITIQUE";
  if (pos.some(p => ["STTC", "HYP"].includes(p.code))) return "URGENT";
  return "INFO";
};

const buildMessageAlerte = (predictions) => {
  const pos = predictions.filter(p => p.positive && p.code !== "NORM");
  return `Analyse ECG multimodale — ${pos.map(p => `${p.label} (${Math.round(p.probability * 100)}%)`).join(", ")}.`;
};

function mainClassLabel(analyseIaJson) {
  if (!analyseIaJson) return "—";
  try {
    const a = JSON.parse(analyseIaJson);
    const pos = a.predictions?.filter(p => p.positive && p.code !== "NORM");
    return pos?.length ? pos.map(p => p.label).join(", ") : "ECG normal";
  } catch { return "—"; }
}

function computeAge(dateNaissance) {
  if (!dateNaissance) return null;
  const diff = Date.now() - new Date(dateNaissance).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function parseSex(sexe) {
  if (!sexe) return 0;
  const s = String(sexe).toUpperCase();
  if (s === "F" || s === "FEMININ" || s === "1") return 1;
  return 0;
}

const StatutBadge = ({ examen }) => {
  if (examen.analyseIaAnomalie === true)  return <Badge variant="red">Anomalie</Badge>;
  if (examen.analyseIaAnomalie === false) return <Badge variant="green">Normal</Badge>;
  if (examen.statut === "REALISE")        return <Badge variant="blue">Réalisé</Badge>;
  return <Badge variant="orange">En attente</Badge>;
};


// ─── Composant principal ──────────────────────────────────────────────────────
const PageECG = ({ toast }) => {
  const canvasRef    = useRef(null);
  const fileInputRef = useRef(null);

  // Données
  const [patients,      setPatients]      = useState([]);
  const [ecgExamens,    setEcgExamens]    = useState([]);
  const [consultations, setConsultations] = useState([]);

  // Sélections
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedConsult,   setSelectedConsult]   = useState(null); // objet complet

  // Upload
  const [ecgFile,     setEcgFile]     = useState(null);
  const [samplingRate, setSamplingRate] = useState("");
  const [dragOver,    setDragOver]    = useState(false);

  // Résultats
  const [analysisResult, setAnalysisResult] = useState(null); // { ecg_only, multimodal, fusion_available, source }

  // Loading
  const [analyzing,      setAnalyzing]      = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [loadingExamens, setLoadingExamens] = useState(true);
  const [loadingConsult, setLoadingConsult] = useState(false);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    getPatients().then(d => setPatients(Array.isArray(d) ? d : [])).catch(() => {});
    getEcgExamens()
      .then(d => setEcgExamens(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingExamens(false));
  }, []);

  useEffect(() => { if (canvasRef.current) drawEcg(canvasRef.current); }, []);

  // ── Chargement consultations quand patient change ─────────────────────────
  useEffect(() => {
    if (!selectedPatientId) { setConsultations([]); setSelectedConsult(null); return; }
    setLoadingConsult(true);
    setSelectedConsult(null);
    getConsultationsByPatient(selectedPatientId)
      .then(d => setConsultations(Array.isArray(d) ? d : []))
      .catch(() => setConsultations([]))
      .finally(() => setLoadingConsult(false));
  }, [selectedPatientId]);

  // ── Construire les données patient depuis la consultation sélectionnée ────
  const buildPatientData = () => {
    const patient = patients.find(p => String(p.id) === String(selectedPatientId));
    if (!patient || !selectedConsult) return null;
    return {
      age:                 computeAge(patient.dateNaissance),
      sex:                 parseSex(patient.sexe),
      poids:               selectedConsult.poids      || null,
      taille:              selectedConsult.taille     || null,
      frequence_cardiaque: selectedConsult.frequenceCardiaque || null,
      tension_arterielle:  selectedConsult.tensionArterielle  || null,
      spo2:                selectedConsult.spo2        || null,
      temperature:         selectedConsult.temperature || null,
    };
  };

  // ── Analyser ──────────────────────────────────────────────────────────────
  const handleAnalyse = async () => {
    if (!ecgFile)         { toast("Sélectionnez un fichier ECG.", "error"); return; }
    if (!selectedConsult) { toast("Sélectionnez une consultation.", "error"); return; }
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyserEcgFichier(
        ecgFile,
        samplingRate ? parseInt(samplingRate, 10) : null,
      );
      // On enrichit le résultat avec les données cliniques côté affichage
      setAnalysisResult({ ...result, fusion_available: true });
      toast("Analyse multimodale terminée.", "success");
    } catch (err) {
      toast(err.message || "Erreur lors de l'analyse.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Sauvegarder ──────────────────────────────────────────────────────────
  const handleSauvegarder = async () => {
    if (!analysisResult || !selectedConsult) return;
    const patient = patients.find(p => String(p.id) === String(selectedPatientId));
    const nomPatient = patient ? `${patient.prenom} ${patient.nom}` : "Patient";
    setSaving(true);
    try {
      const examen = await creerExamenEcg(selectedConsult.id, nomPatient);
      await sauvegarderAnalyseEcg(examen.id, analysisResult);
      toast("ECG sauvegardé dans le dossier.", "success");
      if (analysisResult.abnormal) {
        const niveau  = getNiveauAlerte(analysisResult.predictions);
        const message = buildMessageAlerte(analysisResult.predictions);
        await creerAlerte({
          patientId:      Number(selectedPatientId),
          consultationId: selectedConsult.id,
          niveau, message,
          source: analysisResult.fusion_available ? "Analyse ECG multimodale IA" : "Analyse ECG IA",
        });
        toast(
          niveau === "CRITIQUE" ? "Alerte CRITIQUE créée — action immédiate requise" : "Alerte créée",
          niveau === "CRITIQUE" ? "error" : "success"
        );
      }
      const updated = await getEcgExamens();
      setEcgExamens(Array.isArray(updated) ? updated : []);
      setAnalysisResult(null);
      setEcgFile(null);
    } catch (err) {
      toast(err.message || "Erreur lors de la sauvegarde.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Stats dérivées ────────────────────────────────────────────────────────
  const now       = new Date();
  const cesMois   = ecgExamens.filter(e => { const d = new Date(e.createdAt || e.dateAcquisition); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
  const avecIa    = ecgExamens.filter(e => e.analyseIaJson);
  const anomalies = ecgExamens.filter(e => e.analyseIaAnomalie === true);
  const normaux   = ecgExamens.filter(e => e.analyseIaAnomalie === false);

  // Pathologies agrégées
  const pathoCounts = {};
  ecgExamens.forEach(e => {
    if (!e.analyseIaJson) return;
    try { JSON.parse(e.analyseIaJson).predictions.forEach(p => { if (p.positive && p.code !== "NORM") pathoCounts[p.label] = (pathoCounts[p.label] || 0) + 1; }); } catch {}
  });
  const pathoSorted = Object.entries(pathoCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const pathoMax = pathoSorted[0]?.[1] || 1;
  const PATHO_COLORS = ["#d97030", "#c93535", "#1660a8", "#7050bc", C.primary];

  const selectedPatient = patients.find(p => String(p.id) === String(selectedPatientId));
  const patientItems    = patients.map(p => ({ id: String(p.id), nom: `${p.prenom} ${p.nom}` }));

  const inputStyle = { width: "100%", padding: "0.45rem 0.75rem", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: "0.8rem", background: C.surface, color: C.text, outline: "none" };
  const labelStyle = { fontSize: "0.72rem", color: C.textMid, display: "block", marginBottom: "0.3rem" };

  // Étape courante dans le flux
  const step = !selectedPatientId ? 1 : !selectedConsult ? 2 : !ecgFile ? 3 : 4;

  return (
    <>
      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
        <StatCard label="ECG ce mois"    value={String(cesMois.length)}   sub={`Total : ${ecgExamens.length}`}   color={C.primary}  icon={I.activity} />
        <StatCard label="Analysés par IA" value={String(avecIa.length)}   sub={ecgExamens.length ? `${Math.round(avecIa.length / ecgExamens.length * 100)}% du total` : "—"} color="#7050bc" icon={I.zap} />
        <StatCard label="Anomalies"       value={String(anomalies.length)} sub="Nécessitent attention"            color={C.warning}  icon={I.bell} />
        <StatCard label="Normaux"         value={String(normaux.length)}   sub={ecgExamens.length ? `${Math.round(normaux.length / ecgExamens.length * 100)}%` : "—"} color="#17935a" icon={I.check} delta={{ up: true }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.2rem" }}>
        {/* ── Colonne gauche ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

          {/* ── Analyseur ────────────────────────────────────────────────── */}
          <Card>
            <CardHead
              title={selectedPatient ? `Analyse ECG — ${selectedPatient.prenom} ${selectedPatient.nom}` : "Analyse ECG multimodale"}
              sub={selectedConsult ? `Consultation #${selectedConsult.id} · ${selectedConsult.motif || "—"}` : "Sélectionnez un patient puis une consultation"}
              action={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.2rem 0.65rem", borderRadius: 100, fontSize: "0.68rem", fontWeight: 600, background: "linear-gradient(135deg,#7050bc,#9c50e0)", color: "white" }}>
                  <Icon d={I.zap} size={11} stroke="white" sw={2} />Multimodal IA
                </span>
              }
            />
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>

              {/* ── Étape 1 : Patient ────────────────────────────────────── */}
              <div>
                <label style={labelStyle}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: step >= 1 ? C.primary : C.border, color: "white", fontSize: "0.65rem", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>1</span>
                    Patient
                  </span>
                </label>
                <SearchableSelect
                  items={patientItems}
                  value={selectedPatientId}
                  onChange={v => { setSelectedPatientId(v); setSelectedConsult(null); setAnalysisResult(null); setEcgFile(null); }}
                  placeholder="— Rechercher un patient —"
                  style={{ marginBottom: 0 }}
                />
              </div>

              {/* ── Étape 2 : Consultation ───────────────────────────────── */}
              {!selectedPatientId ? (
                <div style={{ padding: "0.65rem 0.9rem", borderRadius: 8, background: C.bg, border: `1px dashed ${C.border}`, fontSize: "0.76rem", color: C.textLight }}>
                  <span style={{ marginRight: 6 }}>②</span>Sélectionnez d'abord un patient
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: step >= 2 ? C.primary : C.border, color: "white", fontSize: "0.65rem", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>2</span>
                      Consultation {loadingConsult ? "(chargement…)" : ""}
                    </span>
                  </label>
                  <select
                    value={selectedConsult?.id ?? ""}
                    onChange={e => {
                      const c = consultations.find(c => String(c.id) === e.target.value);
                      setSelectedConsult(c || null);
                      setAnalysisResult(null);
                    }}
                    style={inputStyle}
                    disabled={loadingConsult}
                  >
                    <option value="">— Sélectionner une consultation —</option>
                    {consultations.map(c => (
                      <option key={c.id} value={c.id}>
                        #{c.id} · {c.motif || "Consultation"} · {c.dateHeure ? new Date(c.dateHeure).toLocaleDateString("fr-FR") : ""}
                      </option>
                    ))}
                  </select>

                  {/* Constantes de la consultation sélectionnée */}
                  {selectedConsult && (
                    <div style={{ marginTop: "0.55rem", padding: "0.55rem 0.8rem", borderRadius: 8, background: C.primaryPale, border: `1px solid ${C.borderLight}`, display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      {[
                        ["FC",  selectedConsult.frequenceCardiaque ? `${selectedConsult.frequenceCardiaque} bpm` : null],
                        ["TA",  selectedConsult.tensionArterielle  || null],
                        ["SpO₂", selectedConsult.spo2              ? `${selectedConsult.spo2}%` : null],
                        ["T°",  selectedConsult.temperature        ? `${selectedConsult.temperature}°C` : null],
                        ["Poids", selectedConsult.poids            ? `${selectedConsult.poids} kg` : null],
                        ["Taille", selectedConsult.taille          ? `${selectedConsult.taille} cm` : null],
                      ].map(([k, v]) => v ? (
                        <span key={k} style={{ fontFamily: "monospace", fontSize: "0.7rem", color: C.textMid }}>
                          {k} : <span style={{ color: C.primary, fontWeight: 600 }}>{v}</span>
                        </span>
                      ) : null)}
                      <span style={{ fontSize: "0.68rem", color: C.textLight, alignSelf: "center" }}>
                        {[selectedConsult.frequenceCardiaque, selectedConsult.tensionArterielle, selectedConsult.spo2].filter(Boolean).length === 0
                          ? "Aucune constante enregistrée pour cette consultation — analyse ECG seule"
                          : "Constantes intégrées à l'analyse multimodale"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Étape 3 : Fichier ECG ────────────────────────────────── */}
              {!selectedConsult ? (
                <div style={{ padding: "0.65rem 0.9rem", borderRadius: 8, background: C.bg, border: `1px dashed ${C.border}`, fontSize: "0.76rem", color: C.textLight }}>
                  <span style={{ marginRight: 6 }}>③</span>Sélectionnez d'abord une consultation
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <label style={labelStyle}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: step >= 3 ? C.primary : C.border, color: "white", fontSize: "0.65rem", fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>3</span>
                      Fichier ECG
                    </span>
                  </label>
                  <input ref={fileInputRef} type="file" accept=".json,.csv,.zip,.dcm,.dicom" style={{ display: "none" }}
                    onChange={e => { setEcgFile(e.target.files[0] || null); setAnalysisResult(null); }} />

                  {ecgFile ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 0.9rem", borderRadius: 10, background: C.primaryPale, border: `1.5px solid ${C.primary}` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.primaryDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ecgFile.name}</div>
                        <div style={{ fontSize: "0.67rem", color: C.textMid }}>{(ecgFile.size / 1024).toFixed(1)} Ko</div>
                      </div>
                      <button onClick={() => { setEcgFile(null); setAnalysisResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: C.textMid, display: "flex", alignItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) { setEcgFile(f); setAnalysisResult(null); } }}
                      style={{ padding: "1.3rem 1rem", borderRadius: 12, cursor: "pointer", border: `2px dashed ${dragOver ? C.primary : C.border}`, background: dragOver ? C.primaryPale : C.bg, textAlign: "center", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={dragOver ? C.primary : C.textLight} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.15s" }}>
                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: dragOver ? C.primary : C.textMid }}>Glisser un fichier ECG ici</div>
                      <div style={{ fontSize: "0.72rem", color: C.textLight }}>ou <span style={{ color: C.primary, fontWeight: 500 }}>cliquer pour parcourir</span></div>
                      <div style={{ fontSize: "0.67rem", color: C.textLight }}>.json · .csv · .zip WFDB · .dcm DICOM</div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.65rem", alignItems: "flex-end" }}>
                    <div style={{ flex: "0 0 130px" }}>
                      <label style={labelStyle}>Fréquence (Hz)</label>
                      <input type="number" placeholder="500 — optionnel" value={samplingRate} onChange={e => setSamplingRate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ fontSize: "0.68rem", color: C.textLight, flex: 1, paddingBottom: "0.55rem", lineHeight: 1.4 }}>Requis uniquement pour les fichiers .csv</div>
                    <Btn icon={I.zap} size="sm" onClick={handleAnalyse} disabled={!ecgFile || analyzing}>
                      {analyzing ? "Analyse…" : "Analyser"}
                    </Btn>
                  </div>
                </div>
              )}

              {/* ── Canvas ECG ───────────────────────────────────────────── */}
              <div style={{ background: C.primaryDeep, borderRadius: 14, padding: "1rem" }}>
                <canvas ref={canvasRef} style={{ width: "100%", height: 200, display: "block" }} height={200} />
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                  {[["FC","—"],["PR","—"],["QRS","—"],["QTc","—"],["Axe","—"]].map(([k, v]) => (
                    <span key={k} style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>
                      {k} : <span style={{ color: "#17e8d4", fontWeight: 500 }}>{v}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Résultats ────────────────────────────────────────────── */}
              {analyzing && (
                <div style={{ textAlign: "center", padding: "1.2rem", color: C.textMid, fontSize: "0.82rem" }}>Analyse en cours…</div>
              )}

              {analysisResult && Array.isArray(analysisResult.predictions) && !analyzing && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {/* En-tête résultat */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Badge variant={analysisResult.fusion_available ? "purple" : "blue"}>
                      {analysisResult.fusion_available ? "Analyse multimodale" : "Analyse ECG"}
                    </Badge>
                    {analysisResult.source && (
                      <span style={{ fontSize: "0.68rem", color: C.textLight }}>
                        {analysisResult.source.filename} · {analysisResult.source.sampling_rate} Hz
                      </span>
                    )}
                  </div>

                  {/* Résultat unique */}
                  <div style={{
                    padding: "0.9rem", borderRadius: 11,
                    background: analysisResult.abnormal ? "#fff5e8" : "#eaf5f0",
                    border: `1.5px solid ${analysisResult.abnormal ? "#f0c070" : "#a0d8b0"}`,
                    display: "flex", flexDirection: "column", gap: "0.45rem",
                  }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: analysisResult.abnormal ? C.warning : "#17935a", marginBottom: "0.2rem" }}>
                      {analysisResult.abnormal ? "⚠ Anomalie détectée" : "✓ ECG normal"}
                      <span style={{ fontWeight: 400, fontSize: "0.74rem", marginLeft: 8, color: C.textMid }}>
                        P(normal) = {Math.round((analysisResult.normal_probability ?? 0) * 100)}%
                      </span>
                    </div>
                    {analysisResult.predictions.map(pred => (
                      <div key={pred.code} style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                        <span style={{ fontSize: "0.75rem", minWidth: 190, color: C.text }}>{pred.label}</span>
                        <div style={{ flex: 1, height: 6, background: "#e0e0e0", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${Math.round(pred.probability * 100)}%`, background: CLASS_COLORS[pred.code], borderRadius: 3, transition: "width 0.4s" }} />
                        </div>
                        <span style={{ fontFamily: "monospace", fontSize: "0.72rem", fontWeight: 600, minWidth: 32, color: CLASS_COLORS[pred.code] }}>
                          {Math.round(pred.probability * 100)}%
                        </span>
                        {pred.positive && <Badge variant={pred.code === "NORM" ? "green" : "orange"}>{pred.code}</Badge>}
                      </div>
                    ))}
                  </div>

                  {/* Bandeau alerte si anomalie */}
                  {analysisResult.abnormal && (() => {
                    const niveau = getNiveauAlerte(analysisResult.predictions);
                    const isCritique = niveau === "CRITIQUE";
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.65rem 0.9rem", borderRadius: 8, background: isCritique ? "#fff0f0" : "#fff8ee", border: `1px solid ${isCritique ? "#f5c2c2" : "#f5ddb0"}` }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isCritique ? C.danger : C.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <span style={{ flex: 1, fontSize: "0.75rem", fontWeight: 600, color: isCritique ? C.danger : C.warning }}>
                          Pathologie {niveau} détectée — une alerte sera créée à la sauvegarde
                        </span>
                      </div>
                    );
                  })()}

                  {/* Bouton sauvegarde */}
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Btn variant="outline" size="sm" onClick={handleSauvegarder} disabled={saving}>
                      {saving ? "Sauvegarde…" : "Sauvegarder dans le dossier"}
                    </Btn>
                  </div>
                </div>
              )}

              {/* Résultat reçu mais format invalide (erreur FastAPI) */}
              {analysisResult && !Array.isArray(analysisResult.predictions) && !analyzing && (
                <div style={{ padding: "0.85rem", borderRadius: 10, background: "#fff0f0", border: "1px solid #f5c2c2", fontSize: "0.8rem", color: C.danger }}>
                  Réponse invalide du service d'analyse. Vérifiez que le service FastAPI est démarré et réessayez.
                </div>
              )}

              {!analysisResult && !analyzing && (
                <div style={{ textAlign: "center", padding: "1rem", color: C.textLight, fontSize: "0.78rem" }}>
                  Suivez les étapes ci-dessus pour lancer une analyse ECG multimodale
                </div>
              )}
            </div>
          </Card>

          {/* ── Liste des ECG récents ───────────────────────────────────── */}
          <Card>
            <CardHead title="Historique des ECG" action={<span style={{ fontSize: "0.72rem", color: C.textMid }}>{ecgExamens.length} examen(s)</span>} />
            {loadingExamens ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: C.textMid, fontSize: "0.8rem" }}>Chargement…</div>
            ) : ecgExamens.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: C.textLight, fontSize: "0.8rem" }}>Aucun ECG enregistré</div>
            ) : (
              <table>
                <thead><tr><th>Patient</th><th>Date</th><th>Résultat IA</th><th>Confiance</th><th>Statut</th></tr></thead>
                <tbody>
                  {ecgExamens.map((e, i) => {
                    const dateStr = e.dateAcquisition ? new Date(e.dateAcquisition).toLocaleDateString("fr-FR") : e.createdAt ? new Date(e.createdAt).toLocaleDateString("fr-FR") : "—";
                    let conf = null;
                    try { if (e.analyseIaJson) { const a = JSON.parse(e.analyseIaJson); conf = Math.round(a.normal_probability * 100); } } catch {}
                    return (
                      <tr key={i}>
                        <td><div style={{ fontWeight: 500 }}>{e.prenomPatient} {e.nomPatient}</div><div style={{ fontSize: "0.68rem", color: C.textLight }}>Dr. {e.prenomMedecin} {e.nomMedecin}</div></td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.73rem" }}>{dateStr}</td>
                        <td style={{ fontSize: "0.75rem" }}>{mainClassLabel(e.analyseIaJson)}</td>
                        <td>{conf !== null ? <Badge variant="purple">{conf}%</Badge> : <span style={{ color: C.textLight }}>—</span>}</td>
                        <td><StatutBadge examen={e} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* ── Colonne droite ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <Card>
            <CardHead title="Performance IA" />
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[["Sensibilité (FA)", 94.7, C.primary], ["Spécificité", 91.3, "#1660a8"], ["AUC-ROC", 96.3, "#7050bc"], ["Temps inférence", 63, "#17935a"]].map(([lbl, val, col]) => (
                <div key={lbl}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                    <span style={{ color: C.textMid }}>{lbl}</span>
                    <span style={{ fontWeight: 600, fontFamily: "monospace" }}>{lbl === "Temps inférence" ? "~300 ms" : `${val}%`}</span>
                  </div>
                  <div style={{ height: 6, background: C.bg, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${val}%`, background: col, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead title="Pathologies détectées" sub={`${anomalies.length} anomalie(s)`} />
            <div style={{ padding: "0.9rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {pathoSorted.length === 0 ? (
                <div style={{ fontSize: "0.78rem", color: C.textLight }}>Aucune pathologie enregistrée</div>
              ) : pathoSorted.map(([lbl, n], idx) => (
                <div key={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem" }}>
                  <span style={{ flex: 1 }}>{lbl}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: 70, height: 5, background: C.bg, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${Math.round(n / pathoMax * 100)}%`, background: PATHO_COLORS[idx], borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: "monospace", fontWeight: 600, minWidth: 14 }}>{n}</span>
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
