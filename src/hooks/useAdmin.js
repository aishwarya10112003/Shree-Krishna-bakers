import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../utils/api";

/** Live kitchen board — auto-refreshes every 10s, pauses on hidden tabs. */
export const useAdminOrders = () =>
  useQuery({
    queryKey: ["adminOrders"],
    queryFn: async () => (await api.get("/admin/orders")).data.orders,
    refetchInterval: 10_000,
  });

export const useAnalytics = () =>
  useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/admin/analytics")).data,
  });

export const useAdminProducts = () =>
  useQuery({
    queryKey: ["adminProducts"],
    queryFn: async () => (await api.get("/admin/products")).data.products,
  });

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }) =>
      (await api.put(`/admin/order-status/${orderId}`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adminOrders"] }),
  });
};

export const useToggleStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.put(`/admin/toggle-stock/${id}`)).data,
    // Refresh both the admin list and the public menu cache.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminProducts"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/admin/remove-product/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminProducts"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

export const useAddProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await api.post("/admin/add_product", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminProducts"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
      qc.invalidateQueries({ queryKey: ["bestsellers"] });
    },
  });
};
