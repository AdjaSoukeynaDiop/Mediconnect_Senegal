/**
 * src/api/examens.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API (section Examen)
 *
 * POST  /api/examens/consultation/{consultationId}  → ExamenResponse
 * GET   /api/examens/{id}                           → ExamenResponse
 * GET   /api/examens/consultation/{consultationId}  → List<ExamenResponse>
 * GET   /api/examens/patient/{patientId}            → List<ExamenResponse>
 * PATCH /api/examens/{id}/realiser                  → ExamenResponse
 * PATCH /api/examens/{id}/annuler                   → ExamenResponse
 *
 * ExamenRequest :
 *   nom (String), type (ExamenType), fichierUrl (String),
 *   format (String), tailleFichier (Long)
 *
 * ExamenResponse :
 *   id, consultationId, nomPatient, prenomPatient,
 *   nomMedecin, prenomMedecin,
 *   nom, type (ExamenType), fichierUrl, format, tailleFichier,
 *   statut (StatutExamen), dateAcquisition, createdAt, updatedAt
 */

import client from "./client";

export const prescrireExamen = async (consultationId, payload) => {
  // ExamenRequest : nom, type, fichierUrl, format, tailleFichier
  const { data } = await client.post(
    `/api/examens/consultation/${consultationId}`,
    payload
  );
  return data; // ExamenResponse
};

export const getExamenById = async (id) => {
  const { data } = await client.get(`/api/examens/${id}`);
  return data; // ExamenResponse
};

export const getExamensByConsultation = async (consultationId) => {
  const { data } = await client.get(`/api/examens/consultation/${consultationId}`);
  return data; // List<ExamenResponse>
};

export const getExamensByPatient = async (patientId) => {
  const { data } = await client.get(`/api/examens/patient/${patientId}`);
  return data; // List<ExamenResponse>
};

export const realiserExamen = async (id) => {
  const { data } = await client.patch(`/api/examens/${id}/realiser`);
  return data; // ExamenResponse
};

export const annulerExamen = async (id) => {
  const { data } = await client.patch(`/api/examens/${id}/annuler`);
  return data; // ExamenResponse
};