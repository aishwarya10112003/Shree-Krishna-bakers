import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";

/** Active offers shown in the "View Offers" strip. */
export const useCoupons = () =>
  useQuery({
    queryKey: ["coupons"],
    queryFn: async () => (await api.get("/user/coupons")).data.coupons,
  });
