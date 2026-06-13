/**
 * src/api/assistants.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GET    /api/assistants          → List<AssistantResponse>   (ADMIN)
 * GET    /api/assistants/me       → AssistantResponse         (ASSISTANT connecté)
 * GET    /api/assistants/{id}     → AssistantResponse         (ADMIN | ASSISTANT)
 * PUT    /api/assistants/{id}     → AssistantResponse         (ADMIN | ASSISTANT)
 * PATCH  /api/assistants/{id}/activate    →                   (ADMIN)
 * PATCH  /api/assistants/{id}/desactivate →                   (ADMIN)
 * DELETE /api/assistants/{id}    →                            (ADMIN, soft delete)
 *
 * AssistantResponse :
 *   id, nom, prenom, email, telephone, serviceAffecte, hopital,
 *   region, departement, commune, actif, createdAt, updatedAt
 */

import client from "./client";

export const getAssistants = async (q) => {
  const params = q?.trim() ? { q: q.trim() } : {};
  const { data } = await client.get("/api/assistants", { params });
  return data;
};

export const getMonProfilAssistant = async () => {
  const { data } = await client.get("/api/assistants/me");
  return data;
};

export const getAssistantById = async (id) => {
  const { data } = await client.get(`/api/assistants/${id}`);
  return data;
};

export const updateAssistant = async (id, payload) => {
  const { data } = await client.put(`/api/assistants/${id}`, payload);
  return data;
};

export const activerAssistant = async (id) => {
  const { data } = await client.patch(`/api/assistants/${id}/activate`);
  return data;
};

export const desactiverAssistant = async (id) => {
  const { data } = await client.patch(`/api/assistants/${id}/desactivate`);
  return data;
};

export const supprimerAssistant = async (id) => {
  const { data } = await client.delete(`/api/assistants/${id}`);
  return data;
};
