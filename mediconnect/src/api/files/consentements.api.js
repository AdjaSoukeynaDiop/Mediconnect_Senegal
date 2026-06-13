/**
 * src/api/consentements.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API (section Consentement)
 *
 * GET /api/patients/{patientId}/consentements          → List<ConsentementResponse>
 * PUT /api/patients/{patientId}/consentements/{type}   → ConsentementResponse
 *
 * UpdateConsentementRequest : { accepte (Boolean) }
 *
 * ConsentementResponse :
 *   signatureId, consentementId, type (TypeConsentement),
 *   titre, contenu, version, obligatoire,
 *   accepte, dateSignature, dateModification,
 *   modifiedById, modifiedByName, modifiedByRole
 */

import client from "./client";

export const getConsentementsByPatient = async (patientId) => {
  const { data } = await client.get(`/api/patients/${patientId}/consentements`);
  return data; // List<ConsentementResponse>
};

// type : valeur de l'enum TypeConsentement (ex: "COLLECTE_DONNEES", "PARTAGE_DONNEES"…)
export const updateConsentement = async (patientId, type, accepte) => {
  const { data } = await client.put(
    `/api/patients/${patientId}/consentements/${type}`,
    { accepte }
  );
  return data; // ConsentementResponse
};