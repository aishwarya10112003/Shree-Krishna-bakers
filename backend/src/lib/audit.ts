import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { logger } from "./logger";

/**
 * Append-only audit trail for sensitive (admin) actions: who did what, when,
 * from where. Failures are logged but never block the main request.
 */
export async function audit(params: {
  actorId?: string | null;
  action: string; // e.g. "product.delete"
  entity: string; // e.g. "Product"
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: params.ip ?? null,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to write audit log");
  }
}
