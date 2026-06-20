/**
 * src/api/ecg.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * FastAPI ECG microservice (port 8000) — appels directs pour l'analyse
 * Spring Boot (port 8080)              — persistance & historique
 *
 * FastAPI endpoints :
 *   GET  /health                    → { status, model_loaded }
 *   POST /predict                   → PredictResponse (signal JSON brut)
 *   POST /predict/file              → PredictResponse (upload fichier)
 *   POST /predict/multimodal        → PredictResponse (fichier + patient_data)
 *
 * PredictResponse :
 *   { subclass_predictions, groups, superclasses, abnormal, normal_probability,
 *     fusion_available, alert:{niveau,message,facteurs,source}, quality, source }
 *
 * Spring Boot endpoints :
 *   GET   /api/examens/type/ecg          → List<ExamenResponse>
 *   PATCH /api/examens/{id}/ecg-resultat → ExamenResponse
 */

import client from "./client";

const ECG_SERVICE_URL = import.meta.env.VITE_ECG_API_URL ?? "http://localhost:8000";

// ── FastAPI : vérifier que le service est disponible ─────────────────────────
export const checkEcgHealth = async () => {
  const res = await fetch(`${ECG_SERVICE_URL}/health`);
  if (!res.ok) throw new Error("Service ECG indisponible");
  return res.json(); // { status, model_loaded }
};

// ── FastAPI : analyser un fichier ECG (JSON, CSV, ZIP WFDB, DICOM) ───────────
export const analyserEcgFichier = async (file, samplingRate = null, threshold = 0.5) => {
  const formData = new FormData();
  formData.append("file", file);
  if (samplingRate) formData.append("sampling_rate", String(samplingRate));
  formData.append("threshold", String(threshold));

  const res = await fetch(`${ECG_SERVICE_URL}/predict/file`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erreur ${res.status} lors de l'analyse ECG`);
  }
  return res.json(); // PredictResponse
};

// ── FastAPI : analyse multimodale (fichier ECG + données cliniques patient) ──
// patientData : { age, sex, poids?, taille?, frequence_cardiaque?,
//                 tension_arterielle?, spo2?, temperature? }
export const analyserEcgMultimodal = async (file, patientData, samplingRate = null, threshold = 0.5) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("patient_data", JSON.stringify(patientData));
  if (samplingRate) formData.append("sampling_rate", String(samplingRate));
  formData.append("threshold", String(threshold));

  const res = await fetch(`${ECG_SERVICE_URL}/predict/multimodal`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erreur ${res.status} lors de l'analyse multimodale`);
  }
  return res.json(); // PredictResponse
};

// ── FastAPI : analyser un signal brut 12×N ───────────────────────────────────
export const analyserEcgSignal = async (signal, samplingRate = 500, threshold = 0.5) => {
  const res = await fetch(`${ECG_SERVICE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signal, sampling_rate: samplingRate, threshold }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Erreur ${res.status} lors de l'analyse`);
  }
  return res.json();
};

// ── Spring Boot : récupérer tous les examens ECG (dashboard) ─────────────────
export const getEcgExamens = async () => {
  const { data } = await client.get("/api/examens/type/ecg");
  return data?.data ?? data; // List<ExamenResponse>
};

// ── Spring Boot : récupérer les ECG d'un patient ─────────────────────────────
export const getEcgByPatient = async (patientId) => {
  const { data } = await client.get(`/api/examens/patient/${patientId}`);
  const list = data?.data ?? data;
  return Array.isArray(list) ? list.filter((e) => e.type === "ECG") : [];
};

// ── Spring Boot : sauvegarder le résultat IA dans un examen existant ─────────
// analyseResult : PredictResponse (toute la réponse du service IA)
export const sauvegarderAnalyseEcg = async (examenId, analyseResult) => {
  const payload = {
    analyseIaJson:      JSON.stringify(analyseResult),
    analyseIaAnomalie:  analyseResult.abnormal,
    analyseIaConfiance: analyseResult.normal_probability,
  };
  const { data } = await client.patch(`/api/examens/${examenId}/ecg-resultat`, payload);
  return data?.data ?? data; // ExamenResponse
};

// ── Spring Boot : créer un examen ECG lié à une consultation ─────────────────
export const creerExamenEcg = async (consultationId, nomPatient) => {
  const { data } = await client.post(`/api/examens/consultation/${consultationId}`, {
    nom: `ECG — ${nomPatient}`,
    type: "ECG",
  });
  return data?.data ?? data; // ExamenResponse
};
