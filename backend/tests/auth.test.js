/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import {
  authHeader,
  loginUser,
  passwordIsHashed,
  registerUser,
  syncTestDatabase,
} from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const res = await registerUser();

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        username: "jdoe",
        email: "jdoe@example.com",
        role: "worker",
      });
      expect(res.body.userId).toEqual(expect.any(Number));
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.password).toBeUndefined();
      expect(await passwordIsHashed(res.body.userId, "password1")).toBe(true);
    });

    it("User submits registration with missing email", async () => {
      const res = await registerUser({ email: "   " });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is required." });
    });

    it("User submits registration with password too short", async () => {
      const res = await registerUser({ password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password must be at least 8 characters." });
    });

    it("User registers with a duplicate username", async () => {
      await registerUser();
      const res = await registerUser({ email: "other@example.com" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });
    });

    it("User registers with a duplicate email", async () => {
      await registerUser();
      const res = await registerUser({ username: "other" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      const created = await registerUser();
      const res = await loginUser("jdoe", "password1");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        userId: created.body.userId,
        username: "jdoe",
        role: "worker",
      });
      expect(res.body.token).toBe(created.body.token);

      const sessions = await db.session.findAll({ where: { userId: created.body.userId } });
      expect(sessions.length).toBeGreaterThanOrEqual(1);
      expect(sessions.some((row) => row.token === res.body.token)).toBe(true);
    });

    it("User signs in with invalid password", async () => {
      await registerUser();
      const res = await loginUser("jdoe", "wrong-password");

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Invalid username or password." });
    });

    it("User signs in with missing username", async () => {
      const res = await loginUser("  ", "password1");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is required." });
    });

    it("User signs in with missing password", async () => {
      const res = await request(app).post("/todo/login").send({ username: "jdoe" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password is required." });
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const created = await registerUser();
      const token = created.body.token;

      const res = await request(app).post("/todo/logout").set(authHeader(token));

      expect(res.status).toBe(200);

      const sessionRow = await db.session.findOne({ where: { userId: created.body.userId } });
      expect(sessionRow.token).toBe("");

      const replay = await request(app).get("/todo/lists").set(authHeader(token));
      expect(replay.status).toBe(401);
    });
  });
});
