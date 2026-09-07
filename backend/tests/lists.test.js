/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";
import { authHeader, registerUser, syncTestDatabase } from "./helpers.js";

const createList = (token, body) =>
  request(app).post("/todo/lists").set(authHeader(token)).send(body);

describe("Feature 2 — Todo List Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const user = await registerUser();
      const res = await createList(user.body.token, { name: "Groceries" });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: "Groceries",
        userId: user.body.userId,
      });
      expect(res.body.id).toEqual(expect.any(Number));
    });

    it("User creates a list with an empty name", async () => {
      const user = await registerUser();
      const res = await createList(user.body.token, { name: "   " });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "List name is required." });
    });

    it("User creates a list with a name that is too long", async () => {
      const user = await registerUser();
      const res = await createList(user.body.token, { name: "x".repeat(101) });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "List name must be 100 characters or fewer." });
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const user = await registerUser();
      await createList(user.body.token, { name: "Work" });
      await createList(user.body.token, { name: "Personal" });

      const res = await request(app).get("/todo/lists").set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
      const userA = await registerUser();
      const userB = await registerUser({
        username: "other",
        email: "other@example.com",
        fName: "Bob",
      });
      await createList(userA.body.token, { name: "Mine" });
      await createList(userB.body.token, { name: "Secret Project" });

      const res = await request(app).get("/todo/lists").set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.every((list) => list.userId === userA.body.userId)).toBe(true);
      expect(res.body.some((list) => list.name === "Secret Project")).toBe(false);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const user = await registerUser();
      const created = await createList(user.body.token, { name: "Groceries" });

      const res = await request(app)
        .put(`/todo/lists/${created.body.id}`)
        .set(authHeader(user.body.token))
        .send({ name: "Shopping" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Shopping");
    });

    it("User deletes a list", async () => {
      const user = await registerUser();
      const created = await createList(user.body.token, { name: "Groceries" });

      const res = await request(app)
        .delete(`/todo/lists/${created.body.id}`)
        .set(authHeader(user.body.token));

      expect([200, 204]).toContain(res.status);
      const remaining = await db.list.findByPk(created.body.id);
      expect(remaining).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const userA = await registerUser();
      const userB = await registerUser({
        username: "other",
        email: "other@example.com",
      });
      const listB = await createList(userB.body.token, { name: "Secret Project" });

      const res = await request(app)
        .put(`/todo/lists/${listB.body.id}`)
        .set(authHeader(userA.body.token))
        .send({ name: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `List with id=${listB.body.id} not found.` });
      const row = await db.list.findByPk(listB.body.id);
      expect(row.name).toBe("Secret Project");
    });

    it("User attempts to delete another user's list", async () => {
      const userA = await registerUser();
      const userB = await registerUser({
        username: "other",
        email: "other@example.com",
      });
      const listB = await createList(userB.body.token, { name: "Secret Project" });

      const res = await request(app)
        .delete(`/todo/lists/${listB.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `List with id=${listB.body.id} not found.` });
      expect(await db.list.findByPk(listB.body.id)).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const userA = await registerUser();
      const res = await createList(userA.body.token, { name: "Groceries", userId: 999 });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(999);
    });

    it("Unauthenticated API request to lists", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
