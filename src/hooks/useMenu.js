import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";

/** Public menu — cached, deduped, background-refreshed by React Query. */
export const useMenu = () =>
  useQuery({
    queryKey: ["menu"],
    queryFn: async () => (await api.get("/user/menu")).data.products,
  });

/** Bestsellers (now DB-backed, so each carries a real productId for checkout). */
export const useBestsellers = () =>
  useQuery({
    queryKey: ["bestsellers"],
    queryFn: async () => (await api.get("/user/bestsellers")).data.products,
  });
