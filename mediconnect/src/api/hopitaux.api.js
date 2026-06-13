import client from "./client";

export const getHopitaux = async () => {
  const { data } = await client.get("/api/hopitaux");
  return data?.data ?? [];
};
