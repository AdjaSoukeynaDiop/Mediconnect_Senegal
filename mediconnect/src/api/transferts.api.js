/**
 * src/api/transferts.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * POST  /api/transferts                         → TransfertResponse
 * GET   /api/transferts/{id}                    → TransfertResponse
 * GET   /api/transferts/patient/{patientId}     → List<TransfertResponse>
 * GET   /api/transferts/statut/{statut}         → List<TransfertResponse>
 * GET   /api/transferts/mes-initiatives         → List<TransfertResponse>  (MEDECIN)
 * GET   /api/transferts/mes-demandes            → List<TransfertResponse>  (MEDECIN destinataire)
 * PATCH /api/transferts/{id}/accepter           → TransfertResponse
 * PATCH /api/transferts/{id}/refuser            → TransfertResponse
 * PATCH /api/transferts/{id}/effectue           → TransfertResponse
 * PATCH /api/transferts/{id}/annuler            → TransfertResponse
 *
 * TransfertRequest :
 *   patientId (Long), medecinId (Long), medecinDestinationId (Long),
 *   nomHopitalSource (String), nomHopitalDestination (String),
 *   type (TypeTransfert), motif (String), compteRendu (String)
 *
 * TransfertResponse :
 *   id, patientId, nomPatient, prenomPatient,
 *   medecinId, nomMedecin, prenomMedecin,
 *   medecinDestinationId, nomMedecinDestination, prenomMedecinDestination,
 *   hopitalSource, hopitalDestination,
 *   type (TypeTransfert), motif, compteRendu,
 *   statut (StatutTransfert), dateTransfert, createdAt, updatedAt
 */

import client from "./client";

export const initierTransfert = async (payload) => {
  const { data } = await client.post("/api/transferts", payload);
  return data?.data ?? data; // unwrap { success, data: TransfertResponse }
};

export const getTransfertById = async (id) => {
  const { data } = await client.get(`/api/transferts/${id}`);
  return data?.data ?? data;
};

export const getTransfertsByPatient = async (patientId) => {
  const { data } = await client.get(`/api/transferts/patient/${patientId}`);
  return data?.data ?? data; // unwrap { success, data: [...] }
};

// statut : "EN_ATTENTE" | "ACCEPTE" | "REFUSE" | "EFFECTUE" | "ANNULE"
export const getTransfertsByStatut = async (statut) => {
  const { data } = await client.get(`/api/transferts/statut/${statut}`);
  return data?.data ?? data; // unwrap { success, data: [...] }
};

// Transferts initiés par le médecin connecté
export const getTransfertsInitiés = async () => {
  const { data } = await client.get("/api/transferts/mes-initiatives");
  return data?.data ?? data;
};

// Demandes de transfert reçues (médecin est le destinataire)
export const getTransfertsRecus = async () => {
  const { data } = await client.get("/api/transferts/mes-demandes");
  return data?.data ?? data;
};

export const accepterTransfert = async (id) => {
  const { data } = await client.patch(`/api/transferts/${id}/accepter`);
  return data?.data ?? data; // unwrap { success, data: TransfertResponse }
};

export const refuserTransfert = async (id) => {
  const { data } = await client.patch(`/api/transferts/${id}/refuser`);
  return data?.data ?? data;
};

export const marquerEffectueTransfert = async (id) => {
  const { data } = await client.patch(`/api/transferts/${id}/effectue`);
  return data?.data ?? data;
};

export const annulerTransfert = async (id) => {
  const { data } = await client.patch(`/api/transferts/${id}/annuler`);
  return data?.data ?? data;
};
