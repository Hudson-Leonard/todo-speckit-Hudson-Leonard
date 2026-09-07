/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { defineComponent } from "vue";
import MenuBar from "../src/components/MenuBar.vue";
import AuthServices from "../src/services/authServices.js";
import UserServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { createTestRouter, mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const sessionUser = {
  userId: 1,
  fName: "Jane",
  lName: "Doe",
  username: "jdoe",
  email: "jdoe@example.com",
  role: "worker",
  token: "valid-token",
};

const profile = {
  id: 1,
  fName: "Jane",
  lName: "Doe",
  username: "jdoe",
  email: "jdoe@example.com",
  role: "worker",
};

const MenuHost = defineComponent({
  components: { MenuBar },
  template: "<v-app><MenuBar /></v-app>",
});

let mounted;

const mountMenu = async () => {
  mounted = await mountWithPlugins(MenuHost, {
    router: await createTestRouter("/"),
    attachTo: document.body,
  });
  return mounted;
};

const openMenu = async (wrapper) => {
  await wrapper.find('[aria-label="Open profile menu"]').trigger("click");
  await flushPromises();
};

const openEditDialog = async (wrapper) => {
  await openMenu(wrapper);
  [...document.body.querySelectorAll("button")]
    .find((btn) => btn.textContent.includes("Edit Profile"))
    .click();
  await flushPromises();
};

describe("Feature 4 — User Profile Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    Utils.setStore("user", sessionUser);
    UserServices.getUser.mockResolvedValue({ data: profile });
  });

  afterEach(() => {
    mounted?.wrapper.unmount();
    mounted = undefined;
    document.body.innerHTML = "";
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      const { wrapper } = await mountMenu();
      await openMenu(wrapper);

      expect(document.body.textContent).toContain("Jane Doe");
      expect(document.body.textContent).toContain("jdoe");
      expect(document.body.textContent).toContain("jdoe@example.com");
      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.body.textContent).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const { wrapper } = await mountMenu();
      await openEditDialog(wrapper);

      expect(document.body.textContent).toContain("Edit Profile");
      const fields = wrapper.findAllComponents({ name: "VTextField" });
      expect(fields[0].props("modelValue")).toBe("Jane");
      expect(fields[1].props("modelValue")).toBe("Doe");
      expect(fields[2].props("modelValue")).toBe("jdoe@example.com");
      expect(fields[3].props("modelValue")).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      const { wrapper } = await mountMenu();
      await openEditDialog(wrapper);

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[0].setValue("Changed");
      [...document.body.querySelectorAll("button")]
        .find((btn) => btn.textContent.trim() === "Cancel")
        .click();
      await flushPromises();

      expect(UserServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Jane");
    });

    it("User saves profile changes", async () => {
      UserServices.updateUser.mockResolvedValue({
        data: { ...profile, fName: "Janet" },
      });

      const { wrapper } = await mountMenu();
      await openEditDialog(wrapper);

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[0].setValue("Janet");
      [...document.body.querySelectorAll("button")]
        .find((btn) => btn.textContent.trim() === "Save")
        .click();
      await flushPromises();

      expect(UserServices.updateUser).toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Janet");
      await openMenu(wrapper);
      expect(document.body.textContent).toContain("Janet Doe");
    });

    it("User saves profile with invalid email format", async () => {
      const { wrapper } = await mountMenu();
      await openEditDialog(wrapper);

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[2].setValue("notanemail");
      [...document.body.querySelectorAll("button")]
        .find((btn) => btn.textContent.trim() === "Save")
        .click();
      await flushPromises();

      expect(document.body.textContent).toContain("Enter a valid email address.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      const { wrapper } = await mountMenu();
      await openEditDialog(wrapper);

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[4].setValue("password1");
      await fields[5].setValue("password2");
      [...document.body.querySelectorAll("button")]
        .find((btn) => btn.textContent.trim() === "Save")
        .click();
      await flushPromises();

      expect(document.body.textContent).toContain("Passwords do not match.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      const { wrapper } = await mountMenu();
      await openEditDialog(wrapper);

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[4].setValue("short");
      await fields[5].setValue("short");
      [...document.body.querySelectorAll("button")]
        .find((btn) => btn.textContent.trim() === "Save")
        .click();
      await flushPromises();

      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      UserServices.updateUser.mockRejectedValue({
        response: { data: { message: "Username is already taken." } },
      });

      const { wrapper } = await mountMenu();
      await openEditDialog(wrapper);

      [...document.body.querySelectorAll("button")]
        .find((btn) => btn.textContent.trim() === "Save")
        .click();
      await flushPromises();

      expect(document.body.querySelector(".v-alert")?.textContent).toContain("Username is already taken.");
      expect(document.body.textContent).toContain("Edit Profile");
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      AuthServices.logoutUser.mockResolvedValue({});
      const { wrapper, router } = await mountMenu();
      await openMenu(wrapper);

      [...document.body.querySelectorAll("button")]
        .find((btn) => btn.textContent.trim() === "Log out")
        .click();

      await vi.waitFor(() => {
        expect(AuthServices.logoutUser).toHaveBeenCalled();
        expect(Utils.getStore("user")).toBeNull();
        expect(router.currentRoute.value.name).toBe("login");
      });
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      const { wrapper } = await mountMenu();

      expect(wrapper.text()).not.toContain("Sign out");
    });
  });
});
