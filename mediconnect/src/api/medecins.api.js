/**
 * src/api/medecins.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API complète (section Medecin)
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │  GET    /api/medecins             ADMIN  ?actif ?q         │
 * │  GET    /api/medecins/{id}        ADMIN | MEDECIN (lui)    │
 * │  GET    /api/medecins/me          MEDECIN                  │
 * │  PUT    /api/medecins/{id}        ADMIN | MEDECIN (lui)    │
 * │  PATCH  /api/medecins/{id}/activate      ADMIN             │
 * │  PATCH  /api/medecins/{id}/desactivate   ADMIN             │
 * │  DELETE /api/medecins/{id}               ADMIN (soft)      │
 * └────────────────────────────────────────────────────────────┘
 *
 * MedecinResponse :
 *   id, nom, prenom, email, telephone, numOrdre, section, specialite,
 *   etablissement, disponible, verified, actif,
 *   adresse (AdresseRequest), createdAt, updatedAt
 *
 * MedecinUpdateRequest :
 *   nom, prenom, email, telephone, disponible,
 *   nomEtablissement, adresse (AdresseRequest)
 */

import client from "./client";

export const getMedecinsDisponibles = async () => {
  const { data } = await client.get("/api/medecins/disponibles");
  return data; // List<MedecinResponse>
};

// Recherche par nom/prénom — accessible à tous les rôles soignants (pour initier un transfert)
export const searchMedecins = async (q) => {
  const { data } = await client.get("/api/medecins/search", { params: { q } });
  return Array.isArray(data) ? data : (data?.data ?? []);
};

export const getMedecins = async ({ actif, q } = {}) => {
  const params = {};
  if (actif !== undefined) params.actif = actif;
  if (q?.trim()) params.q = q.trim();
  const { data } = await client.get("/api/medecins", { params });
  return data; // List<MedecinResponse>
};

export const getMedecinById = async (id) => {
  const { data } = await client.get(`/api/medecins/${id}`);
  return data; // MedecinResponse
};

export const getMonProfilMedecin = async () => {
  const { data } = await client.get("/api/medecins/me");
  return data; // MedecinResponse
};

export const updateMedecin = async (id, payload) => {
  // MedecinUpdateRequest : nom, prenom, email, telephone,
  //                        disponible, nomEtablissement, adresse
  const { data } = await client.put(`/api/medecins/${id}`, payload);
  return data; // { success, message, data: MedecinResponse, timestamp }
};

export const activerMedecin = async (id) => {
  const { data } = await client.patch(`/api/medecins/${id}/activate`);
  return data; // MedecinResponse
};

export const desactiverMedecin = async (id) => {
  const { data } = await client.patch(`/api/medecins/${id}/desactivate`);
  return data; // MedecinResponse
};

export const supprimerMedecin = async (id) => {
  const { data } = await client.delete(`/api/medecins/${id}`);
  return data; // { success, message, timestamp }
};

// MEDECIN — basculer sa propre disponibilité
export const toggleDisponibilite = async () => {
  const { data } = await client.patch("/api/medecins/me/disponibilite");
  return data; // { success, message, data: MedecinResponse, timestamp }
};

// ADMIN — médecins en attente de validation (verified = false)
export const getMedecinsEnAttente = async () => {
  const { data } = await client.get("/api/medecins/en-attente");
  return data; // { success, data: List<MedecinResponse>, timestamp }
};

// ADMIN — valider le profil d'un médecin
export const validerMedecin = async (id) => {
  const { data } = await client.patch(`/api/medecins/${id}/valider`);
  return data; // { success, message, data: MedecinResponse, timestamp }
};