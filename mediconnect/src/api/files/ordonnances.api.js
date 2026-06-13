/**
 * src/api/ordonnances.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API (section Ordonnance)
 *
 * POST  /api/ordonnances/consultation/{consultationId}   → OrdonnanceResponse
 * GET   /api/ordonnances/{id}                            → OrdonnanceResponse
 * GET   /api/ordonnances/consultation/{consultationId}   → OrdonnanceResponse
 * GET   /api/ordonnances/patient/{patientId}             → List<OrdonnanceResponse>
 * GET   /api/ordonnances/medecin/{medecinId}             → List<OrdonnanceResponse>
 * PATCH /api/ordonnances/{id}/signer                     → OrdonnanceResponse
 *
 * OrdonnanceRequest :
 *   dateExpiration (LocalDateTime),
 *   lignes: List<LignePrescriptionRequest>
 *
 * LignePrescriptionRequest (champs à confirmer — non listés explicitement) :
 *   medicament, posologie, duree, quantite, instructions?
 *
 * OrdonnanceResponse :
 *   id, consultationId, nomPatient, prenomPatient,
 *   nomMedecin, prenomMedecin,
 *   signatureNumerique (Boolean), qrCode,
 *   dateEmission, dateExpiration,
 *   lignes: List<LignePrescriptionResponse>,
 *   createdAt, updatedAt
 */

import client from "./client";

export const createOrdonnance = async (consultationId, payload) => {
  // OrdonnanceRequest : { dateExpiration, lignes: [...] }
  const { data } = await client.post(
    `/api/ordonnances/consultation/${consultationId}`,
    payload
  );
  return data; // OrdonnanceResponse
};

export const getOrdonnanceById = async (id) => {
  const { data } = await client.get(`/api/ordonnances/${id}`);
  return data; // OrdonnanceResponse
};

export const getOrdonnanceByConsultation = async (consultationId) => {
  const { data } = await client.get(`/api/ordonnances/consultation/${consultationId}`);
  return data; // OrdonnanceResponse
};

export const getOrdonnancesByPatient = async (patientId) => {
  const { data } = await client.get(`/api/ordonnances/patient/${patientId}`);
  return data; // List<OrdonnanceResponse>
};

export const getOrdonnancesByMedecin = async (medecinId) => {
  const { data } = await client.get(`/api/ordonnances/medecin/${medecinId}`);
  return data; // List<OrdonnanceResponse>
};

export const signerOrdonnance = async (id) => {
  const { data } = await client.patch(`/api/ordonnances/${id}/signer`);
  return data; // OrdonnanceResponse
};