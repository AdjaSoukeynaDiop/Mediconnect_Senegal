/**
 * src/api/alertes.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API (section Alerte)
 *
 * GET   /api/alertes/{id}                  → AlerteResponse
 * GET   /api/alertes/non-acquittees        → List<AlerteResponse>
 * GET   /api/alertes/patient/{patientId}   → List<AlerteResponse>
 * GET   /api/alertes/consultation/{id}     → List<AlerteResponse>
 * GET   /api/alertes/niveau/{niveau}       → List<AlerteResponse>  niveau: ROUGE|ORANGE|JAUNE
 * PATCH /api/alertes/{id}/acquitter        → AlerteResponse
 *
 * AlerteResponse :
 *   id, patientId, nomPatient, prenomPatient, consultationId,
 *   niveau (NiveauAlerte), message, source,
 *   acquittee (Boolean), dateEmission, dateAcquittement
 */

import client from "./client";

export const getAlerteById = async (id) => {
  const { data } = await client.get(`/api/alertes/${id}`);
  return data; // AlerteResponse
};

export const getAlertesNonAcquittees = async () => {
  const { data } = await client.get("/api/alertes/non-acquittees");
  return data; // List<AlerteResponse>
};

export const getAlertesByPatient = async (patientId) => {
  const { data } = await client.get(`/api/alertes/patient/${patientId}`);
  return data; // List<AlerteResponse>
};

export const getAlertesByConsultation = async (consultationId) => {
  const { data } = await client.get(`/api/alertes/consultation/${consultationId}`);
  return data; // List<AlerteResponse>
};

// niveau : "ROUGE" | "ORANGE" | "JAUNE"
export const getAlertesByNiveau = async (niveau) => {
  const { data } = await client.get(`/api/alertes/niveau/${niveau}`);
  return data; // List<AlerteResponse>
};

export const acquitterAlerte = async (id) => {
  const { data } = await client.patch(`/api/alertes/${id}/acquitter`);
  return data; // AlerteResponse
};