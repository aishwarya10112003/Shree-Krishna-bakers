import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { makeUser } from "./helpers/fixtures";

const app = createApp();

describe("Auth & authorization", () => {
  it("signs in a verified user and returns a token + lowercased role", async () => {
    const { user, password } = await makeUser({ role: "ADMIN" });

    const res = await request(app)
      .post("/api/v1/user/signin")
      .send({ email: user.email, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe("admin"); // serialized lowercase for the UI
  });

  it("rejects an invalid password", async () => {
    const { user } = await makeUser();
    const res = await request(app)
      .post("/api/v1/user/signin")
      .send({ email: user.email, password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("blocks admin routes when no token is supplied", async () => {
    const res = await request(app).get("/api/v1/admin/orders");
    expect(res.status).toBe(401);
  });

  it("blocks admin routes for non-admin users", async () => {
    const { token } = await makeUser({ role: "CUSTOMER" });
    const res = await request(app)
      .get("/api/v1/admin/orders")
      .set("x-auth-token", token);
    expect(res.status).toBe(403);
  });
});
