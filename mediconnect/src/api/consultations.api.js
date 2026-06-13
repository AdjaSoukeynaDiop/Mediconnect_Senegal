/**
 * src/api/consultations.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API complète (section Consultation)
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  POST  /api/consultations/dossier/{dossierMedicalId}                    │
 * │        Créer depuis dossier                                              │
 * │  POST  /api/consultations/dossier/{dossierMedicalId}/rendez-vous/{rdvId}│
 * │        Créer depuis dossier + RDV                                        │
 * │  GET   /api/consultations/{id}                                           │
 * │  GET   /api/consultations/patient/{patientId}                            │
 * │  GET   /api/consultations/medecin/{medecinId}                            │
 * │  PATCH /api/consultations/{id}/constantes    → ConstantesRequest        │
 * │  PATCH /api/consultations/{id}/completer     → ConsultationMedecineReq  │
 * │  PATCH /api/consultations/{id}/terminer                                  │
 * │  PATCH /api/consultations/{id}/annuler                                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ConstantesRequest :
 *   tensionArterielle (String), frequenceCardiaque (Integer),
 *   temperature (Float), poids (Float), taille (Float), spo2 (Float)
 *
 * ConsultationMedecineRequest :
 *   motif, anamnese, examenClinique, diagnostic, analyseIa,
 *   scoreConfiance (Float), pathologiesDetectees, compteRendu
 *
 * ConsultationResponse :
 *   id, patientId, nomPatient, prenomPatient,
 *   medecinId, nomMedecin, prenomMedecin,
 *   infirmierId, nomInfirmier, prenomInfirmier,
 *   rendezVousId, dateHeure, statut (StatutConsultation),
 *   tensionArterielle, frequenceCardiaque, temperature,
 *   poids, taille, spo2, motif
 */

import client from "./client";

// ── Toutes les consultations (MEDECIN / CARDIOLOGUE / INFIRMIER / ADMIN) ──────
export const getAllConsultations = async () => {
  const { data } = await client.get("/api/consultations");
  return data?.data ?? data; // List<ConsultationResponse>
};

// ── Consultations d'un dossier médical ───────────────────────────────────────
export const getConsultationsByDossier = async (dossierId) => {
  const { data } = await client.get(`/api/consultations/dossier/${dossierId}`);
  return data?.data ?? data; // List<ConsultationResponse>
};

// ── Créer une consultation depuis un dossier médical ──────────────────────────
export const createConsultationFromDossier = async (dossierMedicalId) => {
  const { data } = await client.post(
    `/api/consultations/dossier/${dossierMedicalId}`
  );
  return data; // ConsultationResponse
};

// ── Créer une consultation liée à un dossier ET un RDV ───────────────────────
export const createConsultationFromDossierRdv = async (dossierMedicalId, rendezVousId) => {
  const { data } = await client.post(
    `/api/consultations/dossier/${dossierMedicalId}/rendez-vous/${rendezVousId}`
  );
  return data; // ConsultationResponse
};

// ── Détail d'une consultation ─────────────────────────────────────────────────
export const getConsultationById = async (id) => {
  const { data } = await client.get(`/api/consultations/${id}`);
  return data; // ConsultationResponse
};

// ── Consultations d'un patient ────────────────────────────────────────────────
export const getConsultationsByPatient = async (patientId) => {
  const { data } = await client.get(`/api/consultations/patient/${patientId}`);
  return data?.data ?? data; // List<ConsultationResponse>
};

// ── Consultations d'un médecin ────────────────────────────────────────────────
export const getConsultationsByMedecin = async (medecinId) => {
  const { data } = await client.get(`/api/consultations/medecin/${medecinId}`);
  return data?.data ?? data; // List<ConsultationResponse>
};

// ── Saisir les constantes vitales (INFIRMIER) ─────────────────────────────────
export const saisirConstantes = async (consultationId, payload) => {
  // ConstantesRequest : tensionArterielle, frequenceCardiaque, temperature,
  //                     poids, taille, spo2
  const { data } = await client.patch(
    `/api/consultations/${consultationId}/constantes`,
    payload
  );
  return data; // ConsultationResponse
};

// ── Compléter la consultation (MEDECIN) ───────────────────────────────────────
export const completerConsultation = async (id, payload) => {
  // ConsultationMedecineRequest : motif, anamnese, examenClinique, diagnostic,
  //                               analyseIa, scoreConfiance, pathologiesDetectees,
  //                               compteRendu
  const { data } = await client.patch(`/api/consultations/${id}/completer`, payload);
  return data; // ConsultationResponse
};

// ── Terminer une consultation ─────────────────────────────────────────────────
export const terminerConsultation = async (id) => {
  const { data } = await client.patch(`/api/consultations/${id}/terminer`);
  return data; // ConsultationResponse
};

// ── Annuler une consultation ──────────────────────────────────────────────────
export const annulerConsultation = async (id) => {
  const { data } = await client.patch(`/api/consultations/${id}/annuler`);
  return data; // ConsultationResponse
};