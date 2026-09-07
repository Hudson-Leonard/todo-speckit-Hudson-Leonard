/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { authHeader, registerUser, syncTestDatabase } from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const created = await registerUser();

      const unauthorized = await request(app).get("/todo/lists");
      expect(unauthorized.status).toBe(401);

      const authorized = await request(app)
        .get("/todo/lists")
        .set(authHeader(created.body.token));

      expect(authorized.status).toBe(200);
    });

    it("Protected API request succeeds with a valid session", async () => {
      const userA = await registerUser();
      const userB = await registerUser({
        username: "other",
        email: "other@example.com",
        fName: "Bob",
      });

      const res = await request(app).get("/todo/lists").set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((list) => list.userId === userA.body.userId)).toBe(true);
      expect(res.body.some((list) => list.userId === userB.body.userId)).toBe(false);
    });

    it("Expired or invalid session token", async () => {
      const created = await registerUser();
      await db.session.update(
        { expirationDate: new Date(Date.now() - 1000) },
        { where: { token: created.body.token } }
      );

      const res = await request(app).get("/todo/lists").set(authHeader(created.body.token));

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
