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

// ── Tous les rendez-vous (MEDECIN / CARDIOLOGUE / INFIRMIER / ADMIN) ──────────
export const getAllRendezVous = async () => {
  const { data } = await client.get("/api/rendez-vous");
  return data?.data ?? data; // List<RendezVousResponse>
};

// ── Créer RDV pour un patient (soignant) identifié par son numéro patient ─────
export const createRendezVousByNumPatient = async (numPatient, payload) => {
  // RendezVousRequest : nomHopital, dateHeure, type, motif
  const { data } = await client.post(`/api/rendez-vous/patient/${numPatient}`, payload);
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

// ── Mes rendez-vous (utilisateur connecté = patient) ─────────────────────────
export const getMesRendezVous = async () => {
  const { data } = await client.get("/api/rendez-vous/mes-rendez-vous");
  return data?.data ?? data; // List<RendezVousResponse>
};

// ── RDV d'un patient ──────────────────────────────────────────────────────────
export const getRendezVousByPatient = async (patientId) => {
  const { data } = await client.get(`/api/rendez-vous/patient/${patientId}`);
  return data?.data ?? data; // List<RendezVousResponse>
};

// ── RDV d'un médecin ──────────────────────────────────────────────────────────
export const getRendezVousByMedecin = async (medecinId) => {
  const { data } = await client.get(`/api/rendez-vous/medecin/${medecinId}`);
  return data?.data ?? data; // List<RendezVousResponse>
};

// ── Actions de statut ─────────────────────────────────────────────────────────
export const confirmerRendezVous = async (id) => {
  const { data } = await client.patch(`/api/rendez-vous/${id}/confirmer`);
  return data?.data ?? data; // RendezVousResponse
};

export const annulerRendezVous = async (id) => {
  const { data } = await client.patch(`/api/rendez-vous/${id}/annuler`);
  return data?.data ?? data; // RendezVousResponse
};

export const marquerEffectueRendezVous = async (id) => {
  const { data } = await client.patch(`/api/rendez-vous/${id}/effectue`);
  return data?.data ?? data; // RendezVousResponse
};

// ── Prochains créneaux disponibles pour un médecin ────────────────────────────
// dateDebut : ISO 8601 string  ex: "2026-06-15T09:00:00"
export const getCreneauxDisponibles = async (medecinId, dateDebut, nbCreneaux = 5) => {
  const { data } = await client.get(`/api/rendez-vous/medecin/${medecinId}/creneaux`, {
    params: { dateDebut, nbCreneaux },
  });
  return data?.data ?? data; // List<LocalDateTime>
};

// ── Proposition d'une autre date par le médecin ───────────────────────────────
export const proposerDateRendezVous = async (id, dateProposee) => {
  const { data } = await client.patch(`/api/rendez-vous/${id}/proposer-date`, { dateProposee });
  return data?.data ?? data; // RendezVousResponse
};

// ── Patient accepte la date proposée ─────────────────────────────────────────
export const accepterPropositionRendezVous = async (id) => {
  const { data } = await client.patch(`/api/rendez-vous/${id}/accepter-proposition`);
  return data?.data ?? data; // RendezVousResponse
};

// ── Patient refuse la date proposée ──────────────────────────────────────────
export const refuserPropositionRendezVous = async (id) => {
  const { data } = await client.patch(`/api/rendez-vous/${id}/refuser-proposition`);
  return data?.data ?? data; // RendezVousResponse
};