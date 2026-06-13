/**
 * src/api/transferts.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API (section Transfert)
 *
 * POST  /api/transferts                         → TransfertResponse
 * GET   /api/transferts/{id}                    → TransfertResponse
 * GET   /api/transferts/patient/{patientId}     → List<TransfertResponse>
 * GET   /api/transferts/statut/{statut}         → List<TransfertResponse>
 * PATCH /api/transferts/{id}/accepter           → TransfertResponse
 * PATCH /api/transferts/{id}/refuser            → TransfertResponse
 * PATCH /api/transferts/{id}/effectue           → TransfertResponse
 * PATCH /api/transferts/{id}/annuler            → TransfertResponse
 *
 * TransfertRequest :
 *   patientId (Long), medecinId (Long),
 *   nomHopitalSource (String), nomHopitalDestination (String),
 *   type (TypeTransfert), motif (String), compteRendu (String)
 *
 * TransfertResponse :
 *   id, patientId, nomPatient, prenomPatient,
 *   medecinId, nomMedecin, prenomMedecin,
 *   hopitalSource, hopitalDestination,
 *   type (TypeTransfert), motif, compteRendu,
 *   statut (StatutTransfert), dateTransfert, createdAt, updatedAt
 */

import client from "./client";

export const initierTransfert = async (payload) => {
  // TransfertRequest : patientId, medecinId, nomHopitalSource,
  //                    nomHopitalDestination, type, motif, compteRendu
  const { data } = await client.post("/api/transferts", payload);
  return data; // TransfertResponse
};

export const getTransfertById = async (id) => {
  const { data } = await client.get(`/api/transferts/${id}`);
  return data; // TransfertResponse
};

export const getTransfertsByPatient = async (patientId) => {
  const { data } = await client.get(`/api/transferts/patient/${patientId}`);
  return data; // List<TransfertResponse>
};

// statut : "EN_ATTENTE" | "ACCEPTE" | "REFUSE" | "EFFECTUE" | "ANNULE" (selon enum)
export const getTransfertsByStatut = async (statut) => {
  const { data } = await client.get(`/api/transferts/statut/${statut}`);
  return data; // List<TransfertResponse>
};

export const accepterTransfert = async (id) => {
  const { data } = await client.patch(`/api/transferts/${id}/accepter`);
  return data; // TransfertResponse
};

export const refuserTransfert = async (id) => {
  const { data } = await client.patch(`/api/transferts/${id}/refuser`);
  return data; // TransfertResponse
};

export const marquerEffectueTransfert = async (id) => {
  const { data } = await client.patch(`/api/transferts/${id}/effectue`);
  return data; // TransfertResponse
};

export const annulerTransfert = async (id) => {
  const { data } = await client.patch(`/api/transferts/${id}/annuler`);
  return data; // TransfertResponse
};