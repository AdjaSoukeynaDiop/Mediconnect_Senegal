/**
 * src/api/index.js
 * Re-exporte toutes les fonctions API pour import simplifié.
 *
 * Usage :
 *   import { login, getPatients, getAlertesNonAcquittees } from "../api";
 */

export * from "./auth.api";
export * from "./patients.api";
export * from "./medecins.api";
export * from "./infirmiers.api";
export * from "./consultations.api";
export * from "./dossiers.api";
export * from "./alertes.api";
export * from "./ordonnances.api";
export * from "./examens.api";
export * from "./rendezVous.api";
export * from "./transferts.api";
export * from "./consentements.api";