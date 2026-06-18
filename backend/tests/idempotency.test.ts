import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/db/prisma";
import { makeProduct, makeUser } from "./helpers/fixtures";

const app = createApp();

describe("Idempotency", () => {
  it("a repeated Idempotency-Key returns the same order without duplicating", async () => {
    const { token } = await makeUser();
    const product = await makeProduct({ price: 100, stock: 10 });
    const body = {
      items: [{ productId: product.id, name: product.name, quantity: 1 }],
      address: "Test St",
      deliveryType: "DINE_IN",
    };
    const key = "checkout-key-abc-123";

    const first = await request(app)
      .post("/api/v1/user/place-order")
      .set("x-auth-token", token)
      .set("Idempotency-Key", key)
      .send(body);

    const second = await request(app)
      .post("/api/v1/user/place-order")
      .set("x-auth-token", token)
      .set("Idempotency-Key", key)
      .send(body);

    expect(first.status).toBe(201);
    expect(second.body.orderId).toBe(first.body.orderId); // same order returned

    const orderCount = await prisma.order.count();
    expect(orderCount).toBe(1); // exactly one order created
  });
});
