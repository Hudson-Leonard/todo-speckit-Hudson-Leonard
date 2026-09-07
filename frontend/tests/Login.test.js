/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import AuthServices from "../src/services/authServices.js";
import { createTestRouter, mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      AuthServices.loginUser.mockRejectedValue({
        response: { data: { message: "Invalid username or password." } },
      });

      const { wrapper, router } = await mountWithPlugins(Login, {
        router: await createTestRouter("/login"),
      });

      const inputs = wrapper.findAll("input");
      await inputs[0].setValue("jdoe");
      await inputs[1].setValue("wrong-password");
      await wrapper.get("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.find(".v-alert").text()).toContain("Invalid username or password.");
      expect(router.currentRoute.value.name).toBe("login");
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login, {
        router: await createTestRouter("/login"),
      });

      const inputs = wrapper.findAll("input");
      await inputs[1].setValue("password1");
      await wrapper.get("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login, {
        router: await createTestRouter("/login"),
      });

      const inputs = wrapper.findAll("input");
      await inputs[0].setValue("jdoe");
      await wrapper.get("form").trigger("submit.prevent");
      await flushPromises();

      expect(wrapper.text()).toContain("Password is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });
  });
});
