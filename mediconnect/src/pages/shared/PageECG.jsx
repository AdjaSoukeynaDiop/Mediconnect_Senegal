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
  analyserEcgMultimodal,
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

// ─── Parser ECG navigateur (JSON / CSV) ──────────────────────────────────────
const LEAD_NAMES_12 = ["I","II","III","aVR","aVL","aVF","V1","V2","V3","V4","V5","V6"];
const ECG_LAYOUT    = [[0,3,6,9],[1,4,7,10],[2,5,8,11]]; // 3 rangées × 4 colonnes

function _to12xN(data) {
  if (!Array.isArray(data) || !Array.isArray(data[0]))
    throw new Error("tableau 2D attendu");
  const rows = data.length, cols = data[0].length;
  if (rows === 12) return data.map(r => Array.from(r, Number));
  if (cols === 12) return Array.from({ length: 12 }, (_, i) => data.map(r => Number(r[i])));
  throw new Error(`Impossible d'identifier 12 dérivations (${rows}×${cols})`);
}

async function parseEcgInBrowser(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "json") {
    const text = await file.text();
    let obj = JSON.parse(text);
    const sr = obj.sampling_rate || obj.fs || obj.frequency || 500;
    if (typeof obj === "object" && !Array.isArray(obj)) {
      for (const key of ["signal","data","leads","ecg","values"]) {
        if (Array.isArray(obj[key])) { obj = obj[key]; break; }
      }
    }
    return { signal: _to12xN(obj), sr };
  }
  if (ext === "csv") {
    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    let start = 0;
    try { parseFloat(lines[0].split(/[,;\t ]/)[0]); } catch { start = 1; }
    const delim = text.includes(",") ? /,/ : text.includes(";") ? /;/ : /\s+/;
    const rows = lines.slice(start).map(l => l.split(delim).map(Number).filter(n => !isNaN(n)));
    return { signal: _to12xN(rows), sr: 500 };
  }
  return null; // ZIP / DICOM : non prévisualisable dans le navigateur
}

// ─── Rendu 12 dérivations sur canvas ─────────────────────────────────────────
function drawEcgSignal(canvas, signal, sr = 500) {
  if (!canvas || !signal) return;
  const W = canvas.offsetWidth || 800;
  const H = 336;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const COLS = 4, ROWS = 3;
  const cellW = W / COLS, cellH = H / ROWS;

  ctx.fillStyle = "#0f1a28";
  ctx.fillRect(0, 0, W, H);

  // Grille ECG papier (petits et grands carreaux)
  const pxPerS  = cellW / 2.5;
  const small   = pxPerS * 0.04;   // 0.04 s = 1 mm à 25 mm/s
  ctx.lineWidth = 0.5; ctx.strokeStyle = "rgba(10,145,130,0.12)";
  for (let x = 0; x < W; x += small) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += small) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(10,145,130,0.28)";
  for (let x = 0; x < W; x += small*5) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += small*5) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Séparateurs de cellules
  ctx.lineWidth = 1; ctx.strokeStyle = "rgba(10,145,130,0.4)";
  for (let c = 1; c < COLS; c++) { ctx.beginPath(); ctx.moveTo(c*cellW,0); ctx.lineTo(c*cellW,H); ctx.stroke(); }
  for (let r = 1; r < ROWS; r++) { ctx.beginPath(); ctx.moveTo(0,r*cellH); ctx.lineTo(W,r*cellH); ctx.stroke(); }

  const nSamples = Math.round(2.5 * sr);
  ECG_LAYOUT.forEach((row, ri) => {
    row.forEach((li, ci) => {
      const lead = signal[li];
      if (!lead || lead.length === 0) return;
      const samples = lead.slice(0, nSamples);
      const x0 = ci * cellW, midY = ri * cellH + cellH / 2;

      // Échelle automatique
      const mn = Math.min(...samples), mx = Math.max(...samples);
      const range = Math.max(mx - mn, 0.15);
      const scale = Math.min((cellH * 0.72) / range, cellH / 0.3);
      const offset = (mn + mx) / 2;

      // Label dérivation
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "rgba(23,232,212,0.7)";
      ctx.fillText(LEAD_NAMES_12[li], x0 + 5, ri * cellH + 13);

      // Tracé
      ctx.strokeStyle = "#17e8d4"; ctx.lineWidth = 1.2;
      ctx.shadowColor = "rgba(23,232,212,0.3)"; ctx.shadowBlur = 3;
      ctx.beginPath();
      samples.forEach((v, i) => {
        const x = x0 + (i / Math.max(nSamples - 1, 1)) * cellW;
        const y = midY - (v - offset) * scale;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    });
  });
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────
function mainClassLabel(analyseIaJson) {
  if (!analyseIaJson) return "—";
  try {
    const a = JSON.parse(analyseIaJson);
    const arr = a.subclass_predictions ?? a.predictions ?? [];
    const pos = arr.filter(p => p.positive && p.code !== "NORM");
    return pos.length ? pos.map(p => p.label).join(", ") : "ECG normal";
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
  const [ecgFile,       setEcgFile]       = useState(null);
  const [samplingRate,  setSamplingRate]  = useState("");
  const [dragOver,      setDragOver]      = useState(false);
  const [ecgSignal,     setEcgSignal]     = useState(null);   // { signal: number[][], sr: number } | null
  const [ecgParseError, setEcgParseError] = useState(null);   // string | null

  // Résultats
  const [analysisResult, setAnalysisResult] = useState(null); // { ecg_only, multimodal, fusion_available, source }

  // Loading
  const [analyzing,      setAnalyzing]      = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [loadingExamens, setLoadingExamens] = useState(true);
  const [loadingConsult, setLoadingConsult] = useState(false);

  // ── Sélection fichier ECG + parse preview ────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    setEcgFile(file);
    setAnalysisResult(null);
    setEcgSignal(null);
    setEcgParseError(null);
    parseEcgInBrowser(file)
      .then(res => { if (res) setEcgSignal(res); })
      .catch(err => setEcgParseError(err.message));
  };

  const handleFileRemove = () => {
    setEcgFile(null);
    setAnalysisResult(null);
    setEcgSignal(null);
    setEcgParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    getPatients().then(d => setPatients(Array.isArray(d) ? d : [])).catch(() => {});
    getEcgExamens()
      .then(d => setEcgExamens(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingExamens(false));
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (ecgSignal) drawEcgSignal(canvasRef.current, ecgSignal.signal, ecgSignal.sr);
    else           drawEcg(canvasRef.current);
  }, [ecgSignal]);

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
      const patientData = buildPatientData();
      const sr = samplingRate ? parseInt(samplingRate, 10) : null;
      const result = patientData
        ? await analyserEcgMultimodal(ecgFile, patientData, sr)
        : await analyserEcgFichier(ecgFile, sr);
      setAnalysisResult(result);
      toast(patientData ? "Analyse multimodale terminée." : "Analyse ECG terminée.", "success");
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
      if (analysisResult.abnormal && analysisResult.alert) {
        const { niveau, message, source } = analysisResult.alert;
        await creerAlerte({
          patientId:      Number(selectedPatientId),
          consultationId: selectedConsult.id,
          niveau, message, source,
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
      setEcgSignal(null);
      setEcgParseError(null);
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
    try { const _a = JSON.parse(e.analyseIaJson); (_a.subclass_predictions ?? _a.predictions ?? []).forEach(p => { if (p.positive && p.code !== "NORM") pathoCounts[p.label] = (pathoCounts[p.label] || 0) + 1; }); } catch {}
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
                    onChange={e => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); }} />

                  {ecgFile ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 0.9rem", borderRadius: 10, background: C.primaryPale, border: `1.5px solid ${C.primary}` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.primaryDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ecgFile.name}</div>
                        <div style={{ fontSize: "0.67rem", color: C.textMid }}>{(ecgFile.size / 1024).toFixed(1)} Ko</div>
                      </div>
                      <button onClick={handleFileRemove}
                        style={{ background: "none", border: "none", cursor: "pointer", color: C.textMid, display: "flex", alignItems: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
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
                {ecgParseError ? (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.4rem" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f08080" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ fontSize: "0.75rem", color: "#f08080", textAlign: "center" }}>{ecgParseError}</span>
                  </div>
                ) : ecgFile && !ecgSignal ? (
                  <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.4rem" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(23,232,212,0.5)" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span style={{ fontSize: "0.75rem", color: "rgba(23,232,212,0.5)", textAlign: "center" }}>Aperçu non disponible pour ce format<br/><span style={{ fontSize: "0.68rem", opacity: 0.7 }}>(.zip WFDB / .dcm DICOM)</span></span>
                  </div>
                ) : (
                  <canvas ref={canvasRef} style={{ width: "100%", display: "block", height: ecgSignal ? 336 : 200 }} height={ecgSignal ? 336 : 200} />
                )}
                {ecgSignal && (
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>
                      12 dérivations · {ecgSignal.sr} Hz · {(ecgSignal.signal[0]?.length / ecgSignal.sr).toFixed(1)} s
                    </span>
                  </div>
                )}
                {!ecgFile && (
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                    {[["FC","—"],["PR","—"],["QRS","—"],["QTc","—"],["Axe","—"]].map(([k, v]) => (
                      <span key={k} style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>
                        {k} : <span style={{ color: "#17e8d4", fontWeight: 500 }}>{v}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Résultats ────────────────────────────────────────────── */}
              {analyzing && (
                <div style={{ textAlign: "center", padding: "1.2rem", color: C.textMid, fontSize: "0.82rem" }}>Analyse en cours…</div>
              )}

              {analysisResult && Array.isArray(analysisResult.subclass_predictions) && !analyzing && (
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

                  {/* Résultat global */}
                  <div style={{
                    padding: "0.75rem 0.9rem", borderRadius: 10,
                    background: analysisResult.abnormal ? "#fff5e8" : "#eaf5f0",
                    border: `1.5px solid ${analysisResult.abnormal ? "#f0c070" : "#a0d8b0"}`,
                  }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: analysisResult.abnormal ? C.warning : "#17935a" }}>
                      {analysisResult.abnormal ? "⚠ Anomalie détectée" : "✓ ECG normal"}
                    </span>
                    <span style={{ fontWeight: 400, fontSize: "0.74rem", marginLeft: 8, color: C.textMid }}>
                      P(normal) = {Math.round((analysisResult.normal_probability ?? 0) * 100)}%
                    </span>
                  </div>

                  {/* Toutes les sous-classes, groupées, ≥ 30% en exergue */}
                  {(() => {
                    const nonNorm = analysisResult.subclass_predictions.filter(p => p.code !== "NORM");
                    const byGroup = {};
                    nonNorm.forEach(p => { if (!byGroup[p.group]) byGroup[p.group] = []; byGroup[p.group].push(p); });
                    return Object.entries(byGroup).map(([groupName, preds]) => {
                      const groupPositive = analysisResult.groups?.[groupName]?.positive;
                      return (
                        <div key={groupName} style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                          {/* En-tête de groupe */}
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.45rem 0.8rem", background: groupPositive ? C.primaryPale : C.bg, borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: groupPositive ? C.primaryDark : C.textMid, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              {groupName}
                            </span>
                            {groupPositive && <Badge variant="orange">Détecté</Badge>}
                          </div>
                          {/* Lignes par sous-classe */}
                          <div style={{ padding: "0.5rem 0.8rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            {preds.map(pred => {
                              const pct = Math.round(pred.probability * 100);
                              const detected  = pred.positive;                          // ≥ seuil modèle
                              const borderline = !detected && pred.probability >= 0.30; // 30–49%, sous-seuil
                              const col = CLASS_COLORS[pred.superclass] ?? C.primary;
                              const barColor = detected ? col : borderline ? "#b0b8c8" : "#d8d8d8";
                              const barH     = detected ? 8 : borderline ? 6 : 4;
                              return (
                                <div key={pred.code} style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                                  <span style={{
                                    fontSize: detected ? "0.76rem" : "0.73rem",
                                    fontWeight: detected ? 700 : 400,
                                    color: detected ? C.text : borderline ? C.textMid : C.textLight,
                                    minWidth: 185,
                                  }}>
                                    {pred.label}
                                  </span>
                                  <div style={{ flex: 1, height: barH, background: "#e8e8e8", borderRadius: 4 }}>
                                    <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 4, transition: "width 0.4s" }} />
                                  </div>
                                  <span style={{ fontFamily: "monospace", fontSize: "0.72rem", fontWeight: detected ? 700 : 400, minWidth: 34, textAlign: "right", color: detected ? col : borderline ? C.textMid : C.textLight }}>
                                    {pct}%
                                  </span>
                                  {detected
                                    ? <Badge variant="orange">{pred.code}</Badge>
                                    : <span style={{ minWidth: 46 }} />
                                  }
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {/* Bandeau alerte si anomalie */}
                  {analysisResult.abnormal && analysisResult.alert && (() => {
                    const niveau = analysisResult.alert.niveau;
                    const isCritique = niveau === "CRITIQUE";
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.65rem 0.9rem", borderRadius: 8, background: isCritique ? "#fff0f0" : "#fff8ee", border: `1px solid ${isCritique ? "#f5c2c2" : "#f5ddb0"}` }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isCritique ? C.danger : C.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: isCritique ? C.danger : C.warning }}>{niveau} — </span>
                          <span style={{ fontSize: "0.75rem", color: isCritique ? C.danger : C.warning }}>{analysisResult.alert.message}</span>
                        </div>
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

              {/* Réponse invalide ou erreur service (ex: format non supporté) */}
              {analysisResult && !Array.isArray(analysisResult.subclass_predictions) && !analyzing && (
                <div style={{ padding: "0.85rem", borderRadius: 10, background: "#fff0f0", border: "1px solid #f5c2c2", fontSize: "0.8rem", color: C.danger }}>
                  {analysisResult.detail ?? "Réponse invalide du service d'analyse. Vérifiez que le service FastAPI est démarré et réessayez."}
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
                  {[...ecgExamens].sort((a, b) => new Date(b.createdAt || b.dateAcquisition || 0) - new Date(a.createdAt || a.dateAcquisition || 0)).map((e, i) => {
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
