/**
 * src/hooks/usePatients.js
 *
 * Basé sur PatientController.java :
 *  - GET /api/patients           → pas de pagination (retourne List<PatientResponse>)
 *  - GET /api/patients?q=terme   → recherche plein texte
 *  - Filtrage ADMIN vs INFIRMIER géré CÔTÉ SERVEUR via @AuthenticationPrincipal
 *    → le frontend n'a pas à gérer ce filtre
 *  - POST /api/patients          → INFIRMIER seulement
 *  - Pas de DELETE dans le controller (seulement activate/desactiver)
 */

import { useState, useEffect, useCallback } from "react";
import {
  getPatients,
  createPatient,
  activerPatient,
  desactiverPatient,
  updatePatient,
} from "../api/patients.api";

export function usePatients({ autoFetch = true } = {}) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetch = useCallback(async (q) => {
    setLoading(true);
    setError(null);
    try {
      // Retourne directement List<PatientResponse> (pas de Page<T>)
      const res = await getPatients(q);
      setPatients(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.apiMessage ?? "Erreur lors du chargement des patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (autoFetch) fetch(); }, [fetch, autoFetch]);

  // Recherche : déclenche un nouveau GET /api/patients?q=
  const search = useCallback((q) => fetch(q), [fetch]);

  // Créer (INFIRMIER) → CreatePatientRequest → CreatePatientResponse
  const create = useCallback(async (payload) => {
    const res = await createPatient(payload);
    // { success, data: CreatePatientResponse, timestamp }
    await fetch(); // rafraîchit la liste
    return res.data;
  }, [fetch]);

  // Activer
  const activer = useCallback(async (id) => {
    const res = await activerPatient(id);
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...res.data } : p))
    );
    return res.data;
  }, []);

  // Désactiver
  const desactiver = useCallback(async (id) => {
    const res = await desactiverPatient(id);
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...res.data } : p))
    );
    return res.data;
  }, []);

  // Mettre à jour
  const update = useCallback(async (id, payload) => {
    const res = await updatePatient(id, payload);
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...res.data } : p))
    );
    return res.data;
  }, []);

  return {
    patients,
    loading,
    error,
    fetch,
    search,
    create,
    update,
    activer,
    desactiver,
  };
}
