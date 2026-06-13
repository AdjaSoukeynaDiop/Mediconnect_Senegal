/**
 * src/api/dossiers.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API (section DossierMedical)
 *
 * GET  /api/dossiers/patient/{patientId}              → DossierMedicalResponse
 * GET  /api/dossiers/{id}                             → DossierMedicalResponse
 * PUT  /api/dossiers/patient/{patientId}              → DossierMedicalResponse
 * PATCH /api/dossiers/patient/{patientId}/archiver    → DossierMedicalResponse
 *
 * DossierMedicalRequest :
 *   antecedentsMedicaux, antecedentsChirurgicaux, allergies,
 *   antecedentsFamiliaux, traitementEnCours
 *
 * DossierMedicalResponse :
 *   id, patientId, nomPatient, prenomPatient, numPatient,
 *   antecedentsMedicaux, antecedentsChirurgicaux, allergies,
 *   antecedentsFamiliaux, traitementEnCours,
 *   statut (StatutDossier), dateOuverture, dateMiseAJour
 */

import client from "./client";

export const getDossierByPatient = async (patientId) => {
  const { data } = await client.get(`/api/dossiers/patient/${patientId}`);
  return data; // DossierMedicalResponse
};

export const getDossierById = async (id) => {
  const { data } = await client.get(`/api/dossiers/${id}`);
  return data; // DossierMedicalResponse
};

export const updateDossier = async (patientId, payload) => {
  // DossierMedicalRequest : antecedentsMedicaux, antecedentsChirurgicaux,
  //                         allergies, antecedentsFamiliaux, traitementEnCours
  const { data } = await client.put(`/api/dossiers/patient/${patientId}`, payload);
  return data; // DossierMedicalResponse
};

export const archiverDossier = async (patientId) => {
  const { data } = await client.patch(`/api/dossiers/patient/${patientId}/archiver`);
  return data; // DossierMedicalResponse
};