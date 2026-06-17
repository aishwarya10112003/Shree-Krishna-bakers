import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../utils/api";

/**
 * The customer's own orders. `refetchInterval` gives live order tracking and
 * automatically pauses when the browser tab is hidden — far better than the old
 * manual setInterval that polled even in the background.
 */
export const useMyOrders = (enabled = true) =>
  useQuery({
    queryKey: ["myOrders"],
    queryFn: async () => (await api.get("/user/orders")).data.orders,
    enabled,
    refetchInterval: 10_000,
  });

/**
 * Place an order. The caller supplies an `idempotencyKey` (one per checkout
 * attempt); sending the same key twice can never create a duplicate order.
 */
export const usePlaceOrder = () =>
  useMutation({
    mutationFn: async ({ idempotencyKey, ...payload }) => {
      const res = await api.post("/user/place-order", payload, {
        headers: { "Idempotency-Key": idempotencyKey },
      });
      return res.data;
    },
  });
