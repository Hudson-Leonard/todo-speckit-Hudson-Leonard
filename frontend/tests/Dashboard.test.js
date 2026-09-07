/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import ListServices from "../src/services/listServices.js";
import { createTestRouter, mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 1 };

const mountDashboard = async () =>
  mountWithPlugins(Dashboard, {
    router: await createTestRouter("/"),
    attachTo: document.body,
  });

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [] });
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [groceries] });
      ListServices.createList.mockResolvedValue({ data: groceries });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.get("button.oc-cta").trigger("click");
      await flushPromises();

      await wrapper.findComponent({ name: "VTextField" }).setValue("Groceries");
      const createButtons = [...document.body.querySelectorAll("button")].filter((btn) =>
        btn.textContent.includes("Create")
      );
      createButtons.at(-1).click();
      await flushPromises();

      expect(ListServices.createList).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
    });

    it("User creates a list with an empty name", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.get("button.oc-cta").trigger("click");
      await flushPromises();

      const createButtons = [...document.body.querySelectorAll("button")].filter((btn) =>
        btn.textContent.includes("Create")
      );
      createButtons.at(-1).click();
      await flushPromises();

      expect(document.body.textContent).toContain("List name is required.");
      expect(ListServices.createList).not.toHaveBeenCalled();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      ListServices.getLists.mockResolvedValue({
        data: [
          { id: 1, name: "Work", userId: 1 },
          { id: 2, name: "Personal", userId: 1 },
        ],
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });

    it("User has no lists", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      ListServices.getLists.mockResolvedValue({ data: [groceries] });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [{ id: 1, name: "Shopping", userId: 1 }] });
      ListServices.updateList.mockResolvedValue({ data: { id: 1, name: "Shopping", userId: 1 } });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.find('[aria-label="Edit list"]').trigger("click");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(-1).setValue("Shopping");
      const saveButtons = [...document.body.querySelectorAll("button")].filter((btn) =>
        btn.textContent.includes("Save")
      );
      saveButtons.at(-1).click();
      await flushPromises();

      expect(ListServices.updateList).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [] });
      ListServices.deleteList.mockResolvedValue({ status: 200 });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.find('[aria-label="Delete list"]').trigger("click");
      await flushPromises();

      const deleteButtons = [...document.body.querySelectorAll("button")].filter(
        (btn) => btn.textContent.trim() === "Delete"
      );
      deleteButtons.at(-1).click();
      await flushPromises();

      expect(ListServices.deleteList).toHaveBeenCalledWith(1);
      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });
});
