/**
 * src/api/infirmiers.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API complète (section Infirmier)
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │  GET    /api/infirmiers             ADMIN                  │
 * │  GET    /api/infirmiers/{id}        ADMIN | INFIRMIER      │
 * │  GET    /api/infirmiers/me          INFIRMIER              │
 * │  PUT    /api/infirmiers/{id}        ADMIN | INFIRMIER      │
 * │  PATCH  /api/infirmiers/{id}/activate      ADMIN           │
 * │  PATCH  /api/infirmiers/{id}/desactivate   ADMIN           │
 * │  DELETE /api/infirmiers/{id}               ADMIN (soft)    │
 * └────────────────────────────────────────────────────────────┘
 *
 * InfirmierResponse :
 *   id, nom, prenom, email, telephone, serviceAffecte, hopital,
 *   region, departement, commune, actif, createdAt, updatedAt
 *
 * InfirmierRequest :
 *   nom, prenom, email, telephone, serviceAffecte,
 *   nomHopital, adresse (AdresseRequest)
 */

import client from "./client";

export const getInfirmiers = async () => {
  const { data } = await client.get("/api/infirmiers");
  return data; // List<InfirmierResponse>
};

export const getInfirmierById = async (id) => {
  const { data } = await client.get(`/api/infirmiers/${id}`);
  return data; // InfirmierResponse
};

export const getMonProfilInfirmier = async () => {
  const { data } = await client.get("/api/infirmiers/me");
  return data; // InfirmierResponse
};

export const updateInfirmier = async (id, payload) => {
  // InfirmierRequest : nom, prenom, email, telephone,
  //                    serviceAffecte, nomHopital, adresse
  const { data } = await client.put(`/api/infirmiers/${id}`, payload);
  return data; // InfirmierResponse
};

export const activerInfirmier = async (id) => {
  const { data } = await client.patch(`/api/infirmiers/${id}/activate`);
  return data; // InfirmierResponse
};

export const desactiverInfirmier = async (id) => {
  const { data } = await client.patch(`/api/infirmiers/${id}/desactivate`);
  return data; // InfirmierResponse
};

export const supprimerInfirmier = async (id) => {
  const { data } = await client.delete(`/api/infirmiers/${id}`);
  return data;
};