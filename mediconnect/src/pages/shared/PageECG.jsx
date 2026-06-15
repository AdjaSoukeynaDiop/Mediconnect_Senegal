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

// ─── Couleurs par classe IA ──────────────────────────────────────────────────
const CLASS_COLORS = {
  NORM: "#17935a",
  MI:   "#c93535",
  STTC: "#d97030",
  CD:   "#1660a8",
  HYP:  "#7050bc",
};

// ─── Dessin de la grille + onde ECG sur le canvas ────────────────────────────
function drawEcg(canvas) {
  if (!canvas) return;
  canvas.width = canvas.offsetWidth || 600;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = 200;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(10,145,130,0.12)";
  ctx.lineWidth = 0.8;
  for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.strokeStyle = "#17e8d4";
  ctx.lineWidth = 1.8;
  ctx.shadowColor = "rgba(23,232,212,0.4)";
  ctx.shadowBlur = 4;
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
}

// ─── Badge statut examen ─────────────────────────────────────────────────────
const StatutBadge = ({ examen }) => {
  if (examen.analyseIaAnomalie === true)  return <Badge variant="red">Anomalie</Badge>;
  if (examen.analyseIaAnomalie === false) return <Badge variant="green">Normal</Badge>;
  if (examen.statut === "REALISE")        return <Badge variant="blue">Réalisé</Badge>;
  return <Badge variant="orange">En attente</Badge>;
};

// ─── Résumé classe principale ─────────────────────────────────────────────────
function mainClassLabel(analyseIaJson) {
  if (!analyseIaJson) return "—";
  try {
    const a = JSON.parse(analyseIaJson);
    const pos = a.predictions?.filter(p => p.positive && p.code !== "NORM");
    if (pos?.length) return pos.map(p => p.label).join(", ");
    return "ECG normal";
  } catch { return "—"; }
}

// ─── Composant principal ──────────────────────────────────────────────────────
const PageECG = ({ toast }) => {
  const canvasRef   = useRef(null);
  const fileInputRef = useRef(null);

  // Données distantes
  const [patients,      setPatients]      = useState([]);
  const [ecgExamens,    setEcgExamens]    = useState([]);
  const [consultations, setConsultations] = useState([]);

  // Sélections
  const [selectedPatientId,    setSelectedPatientId]    = useState("");
  const [selectedConsultId,    setSelectedConsultId]    = useState("");

  // Upload + analyse
  const [ecgFile,       setEcgFile]       = useState(null);
  const [samplingRate,  setSamplingRate]  = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  // Loading states
  const [analyzing,      setAnalyzing]      = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [loadingExamens, setLoadingExamens] = useState(true);
  const [loadingConsult, setLoadingConsult] = useState(false);
  const [dragOver,       setDragOver]       = useState(false);

  // ── Chargement initial ──────────────────────────────────────────────────────
  useEffect(() => {
    getPatients().then(d => setPatients(Array.isArray(d) ? d : [])).catch(() => {});
    getEcgExamens()
      .then(d => setEcgExamens(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingExamens(false));
  }, []);

  // ── Canvas ECG (dessiné après montage) ────────────────────────────────────
  useEffect(() => {
    if (canvasRef.current) drawEcg(canvasRef.current);
  }, []);

  // ── Chargement des consultations quand le patient change ──────────────────
  useEffect(() => {
    if (!selectedPatientId) { setConsultations([]); setSelectedConsultId(""); return; }
    setLoadingConsult(true);
    setSelectedConsultId("");
    getConsultationsByPatient(selectedPatientId)
      .then(d => setConsultations(Array.isArray(d) ? d : []))
      .catch(() => setConsultations([]))
      .finally(() => setLoadingConsult(false));
  }, [selectedPatientId]);

  // ── Analyser le fichier avec FastAPI ──────────────────────────────────────
  const handleAnalyse = async () => {
    if (!ecgFile) { toast("Sélectionnez d'abord un fichier ECG.", "error"); return; }
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyserEcgFichier(
        ecgFile,
        samplingRate ? parseInt(samplingRate, 10) : null
      );
      setAnalysisResult(result);
      toast("Analyse ECG terminée avec succès.", "success");
    } catch (err) {
      toast(err.message || "Erreur lors de l'analyse ECG.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Sauvegarder le résultat dans Spring Boot ──────────────────────────────
  const handleSauvegarder = async () => {
    if (!analysisResult || !selectedConsultId) {
      toast("Sélectionnez une consultation pour sauvegarder.", "error");
      return;
    }
    const patient = patients.find(p => String(p.id) === String(selectedPatientId));
    const nomPatient = patient ? `${patient.prenom} ${patient.nom}` : "Patient";
    setSaving(true);
    try {
      const examen = await creerExamenEcg(selectedConsultId, nomPatient);
      await sauvegarderAnalyseEcg(examen.id, analysisResult);
      toast("ECG sauvegardé avec succès.", "success");
      // Rafraîchir la liste
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

  // ── Statistiques dérivées ────────────────────────────────────────────────
  const now = new Date();
  const cesMois = ecgExamens.filter(e => {
    const d = new Date(e.createdAt || e.dateAcquisition);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const avecIa   = ecgExamens.filter(e => e.analyseIaJson);
  const anomalies = ecgExamens.filter(e => e.analyseIaAnomalie === true);
  const normaux   = ecgExamens.filter(e => e.analyseIaAnomalie === false);

  // ── Pathologies agrégées ─────────────────────────────────────────────────
  const pathoCounts = {};
  ecgExamens.forEach(e => {
    if (!e.analyseIaJson) return;
    try {
      JSON.parse(e.analyseIaJson).predictions.forEach(p => {
        if (p.positive && p.code !== "NORM")
          pathoCounts[p.label] = (pathoCounts[p.label] || 0) + 1;
      });
    } catch {}
  });
  const pathoSorted = Object.entries(pathoCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const pathoMax = pathoSorted[0]?.[1] || 1;
  const PATHO_COLORS = ["#d97030", "#c93535", "#1660a8", "#7050bc", C.primary];

  const selectedPatient = patients.find(p => String(p.id) === String(selectedPatientId));

  // Liste formatée pour SearchableSelect : {id, nom}
  const patientItems = patients.map(p => ({ id: String(p.id), nom: `${p.prenom} ${p.nom}` }));

  // ── Styles réutilisables ─────────────────────────────────────────────────
  const inputStyle = {
    width: "100%", padding: "0.45rem 0.75rem", borderRadius: 8,
    border: `1px solid ${C.border}`, fontSize: "0.8rem",
    background: C.surface, color: C.text, outline: "none",
  };
  const labelStyle = { fontSize: "0.72rem", color: C.textMid, display: "block", marginBottom: "0.3rem" };

  return (
    <>
      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "1.3rem" }}>
        <StatCard
          label="ECG ce mois"
          value={String(cesMois.length)}
          sub={`Total : ${ecgExamens.length}`}
          color={C.primary}
          icon={I.activity}
        />
        <StatCard
          label="Analysés par IA"
          value={String(avecIa.length)}
          sub={ecgExamens.length ? `${Math.round(avecIa.length / ecgExamens.length * 100)}% du total` : "—"}
          color="#7050bc"
          icon={I.zap}
        />
        <StatCard
          label="Anomalies détectées"
          value={String(anomalies.length)}
          sub="Nécessitent attention"
          color={C.warning}
          icon={I.bell}
        />
        <StatCard
          label="Normaux"
          value={String(normaux.length)}
          sub={ecgExamens.length ? `${Math.round(normaux.length / ecgExamens.length * 100)}%` : "—"}
          color="#17935a"
          icon={I.check}
          delta={{ up: true }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.2rem" }}>
        {/* ── Colonne gauche ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

          {/* ── Carte Analyseur ECG ─────────────────────────────────────── */}
          <Card>
            <CardHead
              title={
                selectedPatient
                  ? `Visualiseur ECG — ${selectedPatient.prenom} ${selectedPatient.nom}`
                  : "Visualiseur ECG"
              }
              sub={
                selectedPatient
                  ? `12 dérivations · ${new Date().toLocaleDateString("fr-FR")}`
                  : "Sélectionnez un patient pour démarrer"
              }
              action={
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.2rem 0.65rem", borderRadius: 100, fontSize: "0.68rem",
                  fontWeight: 600, background: "linear-gradient(135deg,#7050bc,#9c50e0)", color: "white",
                }}>
                  <Icon d={I.zap} size={11} stroke="white" sw={2} />Analyse IA
                </span>
              }
            />
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>

              {/* Ligne 1 : Patient (SearchableSelect) */}
              <div style={{ marginBottom: 0 }}>
                <div style={{ marginBottom: "-1rem" }}>
                  {/* Le composant SearchableSelect a marginBottom:1rem intégré, on le neutralise */}
                  <label style={labelStyle}>Patient</label>
                </div>
                <SearchableSelect
                  items={patientItems}
                  value={selectedPatientId}
                  onChange={v => { setSelectedPatientId(v); setAnalysisResult(null); setEcgFile(null); }}
                  placeholder="— Rechercher un patient —"
                />
              </div>

              {/* Ligne 2 : Fichier + fréquence + bouton (verrouillés sans patient) */}
              {!selectedPatientId ? (
                <div style={{
                  padding: "0.75rem 1rem", borderRadius: 9,
                  background: C.bg, border: `1px dashed ${C.border}`,
                  fontSize: "0.78rem", color: C.textLight, textAlign: "center",
                }}>
                  Sélectionnez d'abord un patient pour pouvoir importer un fichier ECG
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  {/* Zone de dépôt */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv,.zip,.dcm,.dicom"
                    style={{ display: "none" }}
                    onChange={e => { setEcgFile(e.target.files[0] || null); setAnalysisResult(null); }}
                  />

                  {ecgFile ? (
                    /* Fichier sélectionné */
                    <div style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.75rem 1rem", borderRadius: 10,
                      background: C.primaryPale, border: `1.5px solid ${C.primary}`,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.primaryDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {ecgFile.name}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: C.textMid, marginTop: 1 }}>
                          {(ecgFile.size / 1024).toFixed(1)} Ko
                        </div>
                      </div>
                      <button
                        onClick={() => { setEcgFile(null); setAnalysisResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "0.2rem", borderRadius: 6, color: C.textMid, display: "flex", alignItems: "center" }}
                        title="Retirer le fichier"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ) : (
                    /* Zone vide : cliquer ou glisser */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={e => {
                        e.preventDefault(); setDragOver(false);
                        const f = e.dataTransfer.files[0];
                        if (f) { setEcgFile(f); setAnalysisResult(null); }
                      }}
                      style={{
                        padding: "1.4rem 1rem", borderRadius: 12, cursor: "pointer",
                        border: `2px dashed ${dragOver ? C.primary : C.border}`,
                        background: dragOver ? C.primaryPale : C.bg,
                        textAlign: "center", transition: "all 0.15s",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={dragOver ? C.primary : C.textLight} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.15s" }}>
                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: dragOver ? C.primary : C.textMid }}>
                        Glisser un fichier ECG ici
                      </div>
                      <div style={{ fontSize: "0.73rem", color: C.textLight }}>
                        ou <span style={{ color: C.primary, fontWeight: 500 }}>cliquer pour parcourir</span>
                      </div>
                      <div style={{ fontSize: "0.68rem", color: C.textLight, marginTop: "0.1rem" }}>
                        .json · .csv · .zip WFDB · .dcm DICOM
                      </div>
                    </div>
                  )}

                  {/* Fréquence + bouton Analyser */}
                  <div style={{ display: "flex", gap: "0.65rem", alignItems: "flex-end" }}>
                    <div style={{ flex: "0 0 130px" }}>
                      <label style={labelStyle}>Fréquence d'échantillonnage</label>
                      <input
                        type="number"
                        placeholder="500 Hz"
                        value={samplingRate}
                        onChange={e => setSamplingRate(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ fontSize: "0.7rem", color: C.textLight, flex: 1, paddingBottom: "0.6rem", lineHeight: 1.4 }}>
                      Optionnel — requis uniquement pour les fichiers .csv
                    </div>
                    <Btn
                      icon={I.zap}
                      size="sm"
                      onClick={handleAnalyse}
                      disabled={!ecgFile || analyzing}
                    >
                      {analyzing ? "Analyse…" : "Analyser"}
                    </Btn>
                  </div>
                </div>
              )}

              {/* Canvas ECG */}
              <div style={{ background: C.primaryDeep, borderRadius: 14, padding: "1rem" }}>
                <canvas
                  ref={canvasRef}
                  style={{ width: "100%", height: 200, display: "block" }}
                  height={200}
                />
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                  {[["FC","—"],["PR","—"],["QRS","—"],["QTc","—"],["Axe","—"]].map(([k, v]) => (
                    <span key={k} style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>
                      {k} : <span style={{ color: "#17e8d4", fontWeight: 500 }}>{v}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Résultat analyse IA */}
              {analyzing && (
                <div style={{ textAlign: "center", padding: "1.2rem", color: C.textMid, fontSize: "0.82rem" }}>
                  Analyse en cours…
                </div>
              )}

              {analysisResult && !analyzing && (
                <div style={{
                  padding: "0.9rem", borderRadius: 11,
                  background: analysisResult.abnormal ? "#fff5e8" : "#eaf5f0",
                  border: `1px solid ${analysisResult.abnormal ? "#f0c070" : "#a0d8b0"}`,
                  display: "flex", flexDirection: "column", gap: "0.6rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{
                      fontSize: "0.72rem", fontWeight: 700,
                      color: analysisResult.abnormal ? C.warning : "#17935a",
                      textTransform: "uppercase", letterSpacing: "0.07em",
                    }}>
                      {analysisResult.abnormal ? "⚠ Anomalie détectée" : "✓ ECG normal"}
                      {" "}· confiance {Math.round(analysisResult.normal_probability * 100)}%
                    </div>
                    {analysisResult.source && (
                      <span style={{ fontSize: "0.68rem", color: C.textLight }}>
                        {analysisResult.source.filename} · {analysisResult.source.sampling_rate} Hz
                      </span>
                    )}
                  </div>

                  {analysisResult.predictions.map(pred => (
                    <div key={pred.code} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.75rem", minWidth: 190, color: C.text }}>{pred.label}</span>
                      <div style={{ flex: 1, height: 6, background: "#e0e0e0", borderRadius: 3 }}>
                        <div style={{
                          height: "100%",
                          width: `${Math.round(pred.probability * 100)}%`,
                          background: CLASS_COLORS[pred.code] || C.primary,
                          borderRadius: 3,
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                      <span style={{ fontFamily: "monospace", fontSize: "0.72rem", fontWeight: 600, minWidth: 36, color: CLASS_COLORS[pred.code] }}>
                        {Math.round(pred.probability * 100)}%
                      </span>
                      {pred.positive && (
                        <Badge variant={pred.code === "NORM" ? "green" : "orange"}>{pred.code}</Badge>
                      )}
                    </div>
                  ))}

                  {/* Section sauvegarde */}
                  <div style={{
                    marginTop: "0.3rem", padding: "0.7rem", borderRadius: 8,
                    background: "rgba(0,0,0,0.04)", display: "flex", gap: "0.6rem",
                    alignItems: "flex-end", flexWrap: "wrap",
                  }}>
                    <div style={{ flex: "1 1 200px" }}>
                      <label style={labelStyle}>
                        Lier à une consultation {loadingConsult ? "(chargement…)" : ""}
                      </label>
                      <select
                        value={selectedConsultId}
                        onChange={e => setSelectedConsultId(e.target.value)}
                        style={inputStyle}
                        disabled={!selectedPatientId || loadingConsult}
                      >
                        <option value="">— Sélectionner une consultation —</option>
                        {consultations.map(c => (
                          <option key={c.id} value={c.id}>
                            #{c.id} · {c.motif || "Consultation"} · {c.dateHeure ? new Date(c.dateHeure).toLocaleDateString("fr-FR") : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Btn
                      size="sm"
                      variant="outline"
                      onClick={handleSauvegarder}
                      disabled={!selectedConsultId || saving}
                    >
                      {saving ? "Sauvegarde…" : "Sauvegarder dans le dossier"}
                    </Btn>
                  </div>
                </div>
              )}

              {!analysisResult && !analyzing && (
                <div style={{ textAlign: "center", padding: "1rem", color: C.textLight, fontSize: "0.78rem" }}>
                  Importez un fichier ECG et cliquez sur "Analyser" pour obtenir les résultats IA
                </div>
              )}
            </div>
          </Card>

          {/* ── Liste des ECG récents ───────────────────────────────────── */}
          <Card>
            <CardHead
              title="Liste des ECG récents"
              action={
                <span style={{ fontSize: "0.72rem", color: C.textMid }}>
                  {ecgExamens.length} examen(s)
                </span>
              }
            />
            {loadingExamens ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: C.textMid, fontSize: "0.8rem" }}>
                Chargement…
              </div>
            ) : ecgExamens.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: C.textLight, fontSize: "0.8rem" }}>
                Aucun ECG enregistré dans le système
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Résultat IA</th>
                    <th>Confiance</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {ecgExamens.map((e, i) => {
                    const dateStr = e.dateAcquisition
                      ? new Date(e.dateAcquisition).toLocaleDateString("fr-FR")
                      : e.createdAt
                        ? new Date(e.createdAt).toLocaleDateString("fr-FR")
                        : "—";
                    let conf = null;
                    try {
                      if (e.analyseIaJson) {
                        const a = JSON.parse(e.analyseIaJson);
                        conf = Math.round(a.normal_probability * 100);
                      }
                    } catch {}
                    return (
                      <tr key={i}>
                        <td>
                          <div style={{ fontWeight: 500 }}>
                            {e.prenomPatient} {e.nomPatient}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: C.textLight }}>
                            Dr. {e.prenomMedecin} {e.nomMedecin}
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.73rem" }}>{dateStr}</td>
                        <td style={{ fontSize: "0.75rem" }}>{mainClassLabel(e.analyseIaJson)}</td>
                        <td>
                          {conf !== null
                            ? <Badge variant="purple">{conf}%</Badge>
                            : <span style={{ color: C.textLight }}>—</span>}
                        </td>
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

          {/* Performance IA (métriques statiques du modèle) */}
          <Card>
            <CardHead title="Performance IA" />
            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                ["Sensibilité (FA)", 94.7, C.primary],
                ["Spécificité",      91.3, "#1660a8"],
                ["AUC-ROC",          96.3, "#7050bc"],
                ["Temps inférence",  63,   "#17935a"],
              ].map(([lbl, val, col]) => (
                <div key={lbl}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.3rem" }}>
                    <span style={{ color: C.textMid }}>{lbl}</span>
                    <span style={{ fontWeight: 600, fontFamily: "monospace" }}>
                      {lbl === "Temps inférence" ? "~300 ms" : `${val}%`}
                    </span>
                  </div>
                  <div style={{ height: 6, background: C.bg, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${val}%`, background: col, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pathologies détectées (calculées depuis les examens réels) */}
          <Card>
            <CardHead title="Pathologies détectées" sub={`${anomalies.length} anomalie(s)`} />
            <div style={{ padding: "0.9rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {pathoSorted.length === 0 ? (
                <div style={{ fontSize: "0.78rem", color: C.textLight }}>
                  Aucune pathologie enregistrée
                </div>
              ) : pathoSorted.map(([lbl, n], idx) => (
                <div key={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem" }}>
                  <span style={{ flex: 1, color: C.text }}>{lbl}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: 70, height: 5, background: C.bg, borderRadius: 3 }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.round(n / pathoMax * 100)}%`,
                        background: PATHO_COLORS[idx],
                        borderRadius: 3,
                      }} />
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
