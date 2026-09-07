/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import AuthServices from "../src/services/authServices.js";
import { createTestRouter, mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const fillRegisterForm = async (wrapper, overrides = {}) => {
  const values = {
    fName: "Jane",
    lName: "Doe",
    email: "jdoe@example.com",
    username: "jdoe",
    password: "password1",
    confirmPassword: "password1",
    ...overrides,
  };
  const inputs = wrapper.findAll("input");
  await inputs[0].setValue(values.fName);
  await inputs[1].setValue(values.lName);
  await inputs[2].setValue(values.email);
  await inputs[3].setValue(values.username);
  await inputs[4].setValue(values.password);
  await inputs[5].setValue(values.confirmPassword);
};

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });

      await fillRegisterForm(wrapper, { email: "notanemail" });
      await wrapper.get("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });

      await fillRegisterForm(wrapper, { username: "" });
      await wrapper.get("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });

      await fillRegisterForm(wrapper, { password: "short", confirmPassword: "short" });
      await wrapper.get("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });

      await fillRegisterForm(wrapper, { confirmPassword: "password2" });
      await wrapper.get("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });
  });
});
