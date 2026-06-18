import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";
import { makeProduct, makeUser } from "./helpers/fixtures";

const app = createApp();

describe("Stock concurrency", () => {
  it("never oversells the last unit under parallel orders", async () => {
    const { token } = await makeUser();
    const product = await makeProduct({ price: 100, stock: 1 }); // only ONE left

    const placeOrder = () =>
      request(app)
        .post("/api/v1/user/place-order")
        .set("x-auth-token", token)
        .send({
          items: [{ productId: product.id, name: product.name, quantity: 1 }],
          address: "Test St",
          deliveryType: "DINE_IN",
        });

    // Fire 5 checkouts for the last unit simultaneously.
    const results = await Promise.all([
      placeOrder(),
      placeOrder(),
      placeOrder(),
      placeOrder(),
      placeOrder(),
    ]);

    const succeeded = results.filter((r) => r.status === 201);
    const failed = results.filter((r) => r.status === 400);

    // The atomic conditional decrement guarantees exactly one winner.
    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(4);

    const fresh = await prisma.product.findUnique({ where: { id: product.id } });
    expect(fresh?.stockQuantity).toBe(0); // not negative — no oversell
  });
});
