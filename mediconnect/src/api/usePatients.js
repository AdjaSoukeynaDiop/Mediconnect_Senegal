import { useState, useEffect, useCallback } from "react";
import {
  getPatients,
  createPatient,
  activerPatient,
  desactiverPatient,
  updatePatient,
} from "./patients.api";

export function usePatients({ autoFetch = true } = {}) {
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPatients();
      setPatients(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.apiMessage ?? "Erreur lors du chargement des patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (autoFetch) refresh(); }, [refresh, autoFetch]);

  // Créer (ASSISTANT) — rafraîchit la liste ensuite
  const create = useCallback(async (payload) => {
    const res = await createPatient(payload);
    // res = { success, data: CreatePatientResponse, timestamp }
    await refresh();
    return res.data;
  }, [refresh]);

  // Activer / désactiver — patche localement
  const activer = useCallback(async (id) => {
    const res = await activerPatient(id);
    const patient = res?.data ?? res; // le backend wrap dans { success, data: PatientResponse }
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...patient } : p)));
    return patient;
  }, []);

  const desactiver = useCallback(async (id) => {
    const res = await desactiverPatient(id);
    const patient = res?.data ?? res;
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...patient } : p)));
    return patient;
  }, []);

  // Mise à jour — patche localement
  const update = useCallback(async (id, payload) => {
    const res = await updatePatient(id, payload);
    // res = { success, message, data: PatientResponse, timestamp }
    setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...res.data } : p)));
    return res.data;
  }, []);

  return { patients, loading, error, refresh, create, update, activer, desactiver };
}
