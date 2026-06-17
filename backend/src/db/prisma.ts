/**
 * Prisma client singleton + soft-delete extension.
 *
 * Two things happen here:
 *  1. We create ONE PrismaClient and reuse it (creating many exhausts the DB
 *     connection pool — a classic production bug).
 *  2. We attach a Client Extension so that normal reads of `product`
 *     transparently exclude soft-deleted rows (deletedAt != null). Deleted
 *     products stay in the DB so historical orders never break, but they
 *     disappear from the menu/admin lists automatically.
 */
import { PrismaClient } from "@prisma/client";
import { isProd, isTest } from "../config/env";

function createPrismaClient() {
  const base = new PrismaClient({
    // Quiet in tests (we deliberately trigger handled constraint errors there).
    log: isTest ? [] : isProd ? ["error"] : ["warn", "error"],
  });

  return base.$extends({
    model: {
      product: {
        /** Soft delete: hide a product without losing order history. */
        async softDelete(id: string) {
          return base.product.update({
            where: { id },
            data: { deletedAt: new Date() },
          });
        },
      },
    },
    query: {
      product: {
        // Auto-filter deletedAt: null on the read paths the app uses.
        // Callers can still opt in to deleted rows by passing deletedAt
        // explicitly (their value wins via the spread order below).
        async findMany({ args, query }) {
          args.where = { deletedAt: null, ...args.where };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { deletedAt: null, ...args.where };
          return query(args);
        },
        async count({ args, query }) {
          args.where = { deletedAt: null, ...args.where };
          return query(args);
        },
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

// In dev, `tsx watch` reloads modules; cache the client on globalThis so we
// don't leak a new connection pool on every hot reload.
const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isProd) globalForPrisma.prisma = prisma;
