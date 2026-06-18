import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { makeCoupon, makeProduct, makeUser } from "./helpers/fixtures";

const app = createApp();

// Dine-in orders skip the geofence, so these isolate coupon behavior.
describe("Coupons", () => {
  it("auto-applies an eligible auto-offer (Flat ₹50 above ₹299)", async () => {
    await makeCoupon({ code: "FLAT50", type: "FLAT", value: 50, minOrderAmount: 299, isAuto: true });
    const { token } = await makeUser();
    const product = await makeProduct({ price: 300, stock: 10 });

    const res = await request(app)
      .post("/api/v1/user/place-order")
      .set("x-auth-token", token)
      .send({
        items: [{ productId: product.id, name: product.name, quantity: 1 }],
        address: "Dine-In",
        deliveryType: "DINE_IN",
      });

    expect(res.status).toBe(201);
    expect(res.body.order.discount).toBe(50);
    expect(res.body.order.totalAmount).toBe(250); // 300 − 50, no delivery fee
  });

  it("rejects an invalid coupon code", async () => {
    const { token } = await makeUser();
    const product = await makeProduct({ price: 300, stock: 10 });

    const res = await request(app)
      .post("/api/v1/user/place-order")
      .set("x-auth-token", token)
      .send({
        items: [{ productId: product.id, name: product.name, quantity: 1 }],
        address: "Dine-In",
        deliveryType: "DINE_IN",
        couponCode: "NOPE",
      });

    expect(res.status).toBe(400);
  });
});
