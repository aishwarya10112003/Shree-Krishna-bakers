import { z } from "zod";

export const storeSettingsSchema = z.object({
  bakeryName: z.string().min(1).max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().max(300).optional(),
  deliveryRadiusKm: z.coerce.number().positive().max(100),
  freeDeliveryRadiusKm: z.coerce.number().min(0).max(100),
  baseDeliveryFee: z.coerce.number().int().min(0),
  perKmFee: z.coerce.number().int().min(0),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "openTime must be HH:mm"),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "closeTime must be HH:mm"),
  onlineOrderingEnabled: z.boolean().optional(),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
