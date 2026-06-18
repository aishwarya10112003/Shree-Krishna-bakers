import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";

/** Public store settings: bakery location, radius, fee config, hours. */
export const useStoreSettings = () =>
  useQuery({
    queryKey: ["storeSettings"],
    queryFn: async () => (await api.get("/user/store-settings")).data.settings,
    staleTime: 5 * 60 * 1000,
  });
