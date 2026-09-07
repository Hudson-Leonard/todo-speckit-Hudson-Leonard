/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { authHeader, registerUser, syncTestDatabase, validRegisterBody } from "./helpers.js";

const profileBody = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  ...overrides,
});

describe("Feature 4 — User Profile Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-4.2 — Edit profile", () => {
    it("User saves profile changes", async () => {
      const user = await registerUser();
      const res = await request(app)
        .put(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token))
        .send(profileBody({ fName: "Janet" }));

      expect(res.status).toBe(200);
      expect(res.body.fName).toBe("Janet");
      expect(res.body.password).toBeUndefined();
    });

    it("User fetches their own profile", async () => {
      const user = await registerUser();
      const res = await request(app)
        .get(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.body.userId,
        username: "jdoe",
        email: "jdoe@example.com",
        role: "worker",
      });
      expect(res.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const userA = await registerUser();
      const userB = await registerUser({
        username: "other",
        email: "other@example.com",
      });

      const res = await request(app)
        .get(`/todo/users/${userB.body.userId}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `User with id=${userB.body.userId} not found.` });
    });

    it("User attempts to update another user's profile", async () => {
      const userA = await registerUser();
      const userB = await registerUser({
        username: "other",
        email: "other@example.com",
        fName: "Bob",
      });

      const res = await request(app)
        .put(`/todo/users/${userB.body.userId}`)
        .set(authHeader(userA.body.token))
        .send(profileBody({ fName: "Hijacked", username: "other", email: "other@example.com" }));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `User with id=${userB.body.userId} not found.` });
      const row = await db.user.findByPk(userB.body.userId);
      expect(row.fName).toBe("Bob");
    });

    it("Unauthenticated profile API request", async () => {
      const res = await request(app).get("/todo/users/1");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });

    it("Profile update rejects a password that is too short", async () => {
      const user = await registerUser();
      const res = await request(app)
        .put(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token))
        .send({ password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password must be at least 8 characters." });
    });

    it("Profile update rejects missing required fields", async () => {
      const user = await registerUser();
      const res = await request(app)
        .put(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token))
        .send({
          lName: "Doe",
          email: "jdoe@example.com",
          username: "jdoe",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "First name is required." });
      const row = await db.user.findByPk(user.body.userId);
      expect(row.fName).toBe("Jane");
    });

    it("Profile update rejects a duplicate username", async () => {
      const userA = await registerUser();
      await registerUser({
        username: "userb",
        email: "b@example.com",
      });

      const res = await request(app)
        .put(`/todo/users/${userA.body.userId}`)
        .set(authHeader(userA.body.token))
        .send(profileBody({ username: "userb" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });
    });

    it("Profile update rejects a duplicate email", async () => {
      const userA = await registerUser();
      await registerUser({
        username: "userb",
        email: "b@example.com",
      });

      const res = await request(app)
        .put(`/todo/users/${userA.body.userId}`)
        .set(authHeader(userA.body.token))
        .send(profileBody({ email: "b@example.com" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });
    });

    it("Unauthenticated profile update API request", async () => {
      const res = await request(app).put("/todo/users/1").send(validRegisterBody());

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
