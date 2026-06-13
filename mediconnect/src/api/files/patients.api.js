/**
 * src/api/patients.api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Source : Documentation API complète (section Patient)
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  ENDPOINT                        DROITS               CORPS              │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │  POST /api/patients              INFIRMIER            CreatePatientReq    │
 * │  GET  /api/patients              ADM|INF|MED|CARDIO  —                   │
 * │  GET  /api/patients/{id}         ADM|INF|MED|CARDIO  —                   │
 * │  PUT  /api/patients/{id}         ADM|INF|MED|CARDIO  UpdatePatientReq    │
 * │  PATCH /api/patients/{id}/activate      ADM|INF      —                   │
 * │  PATCH /api/patients/{id}/desactiver    ADM|INF      —                   │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * CreatePatientRequest :
 *   nom, prenom, email, telephone, dateNaissance (LocalDate),
 *   sexe (Sexe), groupeSanguin (GroupeSanguin),
 *   adresse (AdresseRequest), acceptePolitiqueConfidentialite (Boolean)
 *
 * CreatePatientResponse :
 *   patientId, numPatient, nomComplet, email, telephone,
 *   motDePasseTemporaire, message
 *
 * UpdatePatientRequest :
 *   nom, prenom, email, telephone, dateNaissance (LocalDate),
 *   sexe (Sexe), groupeSanguin (GroupeSanguin),
 *   assurance (Boolean), adresse (AdresseRequest)
 *
 * PatientResponse :
 *   id, numPatient, nom, prenom, email, telephone, dateNaissance,
 *   sexe, groupeSanguin, assurance, actif,
 *   infirmierId, infirmierNomComplet,
 *   region, departement, commune,
 *   createdAt, updatedAt
 *
 * NOTE : Pas de DELETE patient dans le controller (uniquement activate/desactiver)
 * NOTE : Filtrage ADMIN vs INFIRMIER géré CÔTÉ SERVEUR via @AuthenticationPrincipal
 *        → L'infirmier voit uniquement ses propres patients automatiquement
 */

import client from "./client";

// ── Créer un patient (INFIRMIER seulement) ────────────────────────────────────
export const createPatient = async (payload) => {
  const { data } = await client.post("/api/patients", payload);
  return data; // { success, data: CreatePatientResponse, timestamp }
};

// ── Lister les patients ───────────────────────────────────────────────────────
// ?q=terme → recherche plein texte
// Filtrage ADMIN vs INFIRMIER géré côté serveur
export const getPatients = async (q) => {
  const params = q?.trim() ? { q: q.trim() } : {};
  const { data } = await client.get("/api/patients", { params });
  return data; // List<PatientResponse> (tableau direct, pas paginé)
};

// ── Détail d'un patient ───────────────────────────────────────────────────────
export const getPatientById = async (id) => {
  const { data } = await client.get(`/api/patients/${id}`);
  return data; // PatientResponse
};

// ── Mettre à jour un patient ──────────────────────────────────────────────────
export const updatePatient = async (id, payload) => {
  // UpdatePatientRequest : nom, prenom, email, telephone, dateNaissance,
  //                        sexe, groupeSanguin, assurance, adresse
  const { data } = await client.put(`/api/patients/${id}`, payload);
  return data; // { success, message, data: PatientResponse, timestamp }
};

// ── Activer un compte patient (ADMIN | INFIRMIER) ─────────────────────────────
export const activerPatient = async (id) => {
  const { data } = await client.patch(`/api/patients/${id}/activate`);
  return data; // PatientResponse directement
};

// ── Désactiver un compte patient (ADMIN | INFIRMIER) ──────────────────────────
export const desactiverPatient = async (id) => {
  const { data } = await client.patch(`/api/patients/${id}/desactiver`);
  return data; // PatientResponse directement
};