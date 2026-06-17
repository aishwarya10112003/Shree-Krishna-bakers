import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { makeProduct, makeUser } from "./helpers/fixtures";

const app = createApp();

describe("Order price integrity", () => {
  it("ignores the client-sent price and recomputes the total from the DB", async () => {
    const { token } = await makeUser();
    const product = await makeProduct({ price: 500, stock: 10 });

    const res = await request(app)
      .post("/api/v1/user/place-order")
      .set("x-auth-token", token)
      .send({
        items: [
          // Malicious client claims ₹1 each...
          { productId: product.id, name: product.name, price: 1, quantity: 2 },
        ],
        totalAmount: 1, // ...and a tampered total.
        address: "Test St",
      });

    expect(res.status).toBe(201);
    // Server stored the REAL price (500 × 2), not the client's ₹1.
    expect(res.body.order.totalAmount).toBe(1000);
    expect(res.body.order.items[0].price).toBe(500);
  });

  it("rejects an order for an unavailable product", async () => {
    const { token } = await makeUser();
    const product = await makeProduct({ price: 200, stock: 5, available: false });

    const res = await request(app)
      .post("/api/v1/user/place-order")
      .set("x-auth-token", token)
      .send({
        items: [{ productId: product.id, name: product.name, quantity: 1 }],
        address: "Test St",
      });

    expect(res.status).toBe(400);
  });
});
