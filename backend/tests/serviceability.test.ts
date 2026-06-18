import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { makeProduct, makeUser, setStoreSettings } from "./helpers/fixtures";

const app = createApp();

describe("Delivery serviceability (geofence)", () => {
  it("accepts a DELIVERY order inside the radius (free within the free-radius)", async () => {
    await setStoreSettings({ latitude: 0, longitude: 0, deliveryRadiusKm: 5, freeDeliveryRadiusKm: 3 });
    const { token } = await makeUser();
    const product = await makeProduct({ price: 100, stock: 10 });

    const res = await request(app)
      .post("/api/v1/user/place-order")
      .set("x-auth-token", token)
      .send({
        items: [{ productId: product.id, name: product.name, quantity: 1 }],
        address: "Near the bakery",
        deliveryType: "DELIVERY",
        deliveryLat: 0,
        deliveryLng: 0,
        phone: "9000000000",
      });

    expect(res.status).toBe(201);
    expect(res.body.order.distanceKm).toBe(0);
    expect(res.body.order.deliveryFee).toBe(0);
  });

  it("rejects a DELIVERY order outside the radius — even if the client forges it", async () => {
    await setStoreSettings({ latitude: 0, longitude: 0, deliveryRadiusKm: 5 });
    const { token } = await makeUser();
    const product = await makeProduct({ price: 100, stock: 10 });

    const res = await request(app)
      .post("/api/v1/user/place-order")
      .set("x-auth-token", token)
      .send({
        items: [{ productId: product.id, name: product.name, quantity: 1 }],
        address: "Far away",
        deliveryType: "DELIVERY",
        deliveryLat: 1, // ~157 km from (0,0)
        deliveryLng: 1,
        phone: "9000000000",
      });

    expect(res.status).toBe(400);
    expect(res.body.msg || res.body.error).toMatch(/not serviceable/i);
  });
});
