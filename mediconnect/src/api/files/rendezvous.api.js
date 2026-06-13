/**
 * src/api/rendezVous.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API (section RendezVous)
 *
 * POST  /api/rendez-vous/{numPatient}           → RendezVousResponse  (par numPatient)
 * POST  /api/rendez-vous                        → RendezVousResponse  (utilisateur connecté)
 * GET   /api/rendez-vous/{id}                   → RendezVousResponse
 * GET   /api/rendez-vous/mes-rendez-vous        → List<RendezVousResponse>
 * GET   /api/rendez-vous/patient/{patientId}    → List<RendezVousResponse>
 * GET   /api/rendez-vous/medecin/{medecinId}    → List<RendezVousResponse>
 * PATCH /api/rendez-vous/{id}/confirmer         → RendezVousResponse
 * PATCH /api/rendez-vous/{id}/annuler           → RendezVousResponse
 * PATCH /api/rendez-vous/{id}/effectue          → RendezVousResponse
 *
 * RendezVousRequest :
 *   nomHopital (String), dateHeure (LocalDateTime),
 *   type (TypeRendezVous), motif (String)
 *
 * RendezVousResponse :
 *   id, patientId, nomPatient, prenomPatient,
 *   medecinId, nomMedecin, prenomMedecin,
 *   hopital, dateHeure, type (TypeRendezVous),
 *   statut (StatutRendezVous), motif, lienVideo,
 *   createdAt, updatedAt
 */

import client from "./client";

// ── Créer RDV pour un patient identifié par son numéro patient ────────────────
export const createRendezVousByNumPatient = async (numPatient, payload) => {
  // RendezVousRequest : nomHopital, dateHeure, type, motif
  const { data } = await client.post(`/api/rendez-vous/${numPatient}`, payload);
  return data; // RendezVousResponse
};

// ── Créer RDV (utilisateur connecté = patient lui-même) ───────────────────────
export const createRendezVous = async (payload) => {
  const { data } = await client.post("/api/rendez-vous", payload);
  return data; // RendezVousResponse
};

// ── Détail d'un RDV ───────────────────────────────────────────────────────────
export const getRendezVousById = async (id) => {
  const { data } = await client.get(`/api/rendez-vous/${id}`);
  return data; // RendezVousResponse
};

// ── Mes rendez-vous (utilisateur connecté, tous rôles) ────────────────────────
export const getMesRendezVous = async () => {
  const { data } = await client.get("/api/rendez-vous/mes-rendez-vous");
  return data; // List<RendezVousResponse>
};

// ── RDV d'un patient ──────────────────────────────────────────────────────────
export const getRendezVousByPatient = async (patientId) => {
  const { data } = await client.get(`/api/rendez-vous/patient/${patientId}`);
  return data; // List<RendezVousResponse>
};

// ── RDV d'un médecin ──────────────────────────────────────────────────────────
export const getRendezVousByMedecin = async (medecinId) => {
  const { data } = await client.get(`/api/rendez-vous/medecin/${medecinId}`);
  return data; // List<RendezVousResponse>
};

// ── Actions de statut ─────────────────────────────────────────────────────────
export const confirmerRendezVous = async (id) => {
  const { data } = await client.patch(`/api/rendez-vous/${id}/confirmer`);
  return data; // RendezVousResponse
};

export const annulerRendezVous = async (id) => {
  const { data } = await client.patch(`/api/rendez-vous/${id}/annuler`);
  return data; // RendezVousResponse
};

export const marquerEffectueRendezVous = async (id) => {
  const { data } = await client.patch(`/api/rendez-vous/${id}/effectue`);
  return data; // RendezVousResponse
};