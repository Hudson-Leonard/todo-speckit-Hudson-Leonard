/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { beforeEach, describe, expect, it } from "vitest";
import { applyAuthNavigation } from "../src/router.js";
import Utils from "../src/config/utils.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", () => {
      Utils.setStore("user", {
        userId: 1,
        fName: "Jane",
        token: "valid-token",
      });

      expect(applyAuthNavigation({ name: "login", meta: { guest: true } })).toEqual({
        name: "home",
      });
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", () => {
      expect(applyAuthNavigation({ name: "home", meta: { requiresAuth: true } })).toEqual({
        name: "login",
      });
    });
  });
});

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("US-2.5 — Private lists only", () => {
    it("Unauthenticated user accesses the dashboard", () => {
      expect(applyAuthNavigation({ name: "home", meta: { requiresAuth: true } })).toEqual({
        name: "login",
      });
    });
  });
});
