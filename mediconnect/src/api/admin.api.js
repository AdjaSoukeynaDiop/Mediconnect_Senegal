import client from "./client";

/** GET /api/admin/stats — statistiques globales (ADMIN) */
export const getAdminStats = async () => {
  const { data } = await client.get("/api/admin/stats");
  return data?.data ?? {};
};

/** GET /api/admin/activity — journal d'activité synthétique (ADMIN) */
export const getAdminActivity = async () => {
  const { data } = await client.get("/api/admin/activity");
  return data?.data ?? [];
};

/** POST /api/hopitaux — créer un établissement (ADMIN) */
export const createHopital = async (payload) => {
  const { data } = await client.post("/api/hopitaux", payload);
  return data; // { success, message, data: Hopital }
};
