import client from "./client";

export const lookupOrdre = async (numOrdre) => {
  const { data } = await client.get("/api/ordre-medecins/lookup", {
    params: { numOrdre },
  });
  return data; // { success, nom, prenom, section, specialite } ou { success: false, message }
};
