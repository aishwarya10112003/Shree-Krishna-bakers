import { z } from "zod";
import { ORDER_STATUS_DISPLAY } from "../../lib/serialize";

/** Status arrives as a display string ("Out for Delivery"); the service maps
 *  it back to the Prisma enum. */
export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS_DISPLAY),
});

export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
