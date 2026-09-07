/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import ListServices from "../src/services/listServices.js";
import TodoServices from "../src/services/todoServices.js";
import { createTestRouter, mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
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
    TodoServices.getTodos.mockResolvedValue({ data: [] });
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

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [groceries] });
    TodoServices.getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const milk = { id: 10, listId: 1, title: "Buy milk", completed: false, userId: 1 };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [milk] });
      TodoServices.createTodo.mockResolvedValue({ data: milk });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.find('[aria-label="View items for Groceries"]').trigger("click");
      await flushPromises();

      const addItem = [...document.body.querySelectorAll("button")].find((btn) =>
        btn.textContent.includes("+ Add Item")
      );
      addItem.click();
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(-1).setValue("Buy milk");
      const addButtons = [...document.body.querySelectorAll("button")].filter(
        (btn) => btn.textContent.trim() === "Add"
      );
      addButtons.at(-1).click();
      await flushPromises();

      expect(TodoServices.createTodo).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(document.body.textContent).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.find('[aria-label="View items for Groceries"]').trigger("click");
      await flushPromises();

      [...document.body.querySelectorAll("button")]
        .find((btn) => btn.textContent.includes("+ Add Item"))
        .click();
      await flushPromises();

      [...document.body.querySelectorAll("button")]
        .filter((btn) => btn.textContent.trim() === "Add")
        .at(-1)
        .click();
      await flushPromises();

      expect(document.body.textContent).toContain("Todo title is required.");
      expect(TodoServices.createTodo).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      const { wrapper } = await mountDashboard();
      await flushPromises();

      expect(wrapper.text()).toContain("+ New List");
      expect(wrapper.find('[aria-label="View items for Groceries"]').exists()).toBe(true);
      const visibleAddItem = wrapper.findAll("button").filter((btn) => btn.text() === "+ Add Item");
      expect(visibleAddItem.length).toBe(0);
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      ListServices.getLists.mockResolvedValue({
        data: [{ id: 2, name: "Personal", userId: 1 }],
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.find('[aria-label="View items for Personal"]').trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      ListServices.getLists.mockResolvedValue({
        data: [
          { id: 1, name: "Work", userId: 1 },
          { id: 2, name: "Personal", userId: 1 },
        ],
      });
      TodoServices.getTodos.mockImplementation((listId) => {
        if (listId === 2) {
          return Promise.resolve({ data: [{ id: 3, listId: 2, title: "Call mom", completed: false }] });
        }
        return Promise.resolve({
          data: [
            { id: 1, listId: 1, title: "Email client", completed: false },
            { id: 2, listId: 1, title: "Write report", completed: false },
          ],
        });
      });

      const { wrapper } = await mountDashboard();
      await flushPromises();

      await wrapper.find('[aria-label="View items for Personal"]').trigger("click");
      await flushPromises();
      expect(document.body.textContent).toContain("Call mom");
      expect(document.body.textContent).not.toContain("Email client");

      [...document.body.querySelectorAll("button")]
        .find((btn) => btn.textContent.trim() === "Close")
        .click();
      await flushPromises();

      await wrapper.find('[aria-label="View items for Work"]').trigger("click");
      await flushPromises();
      expect(document.body.textContent).toContain("Email client");
      expect(document.body.textContent).toContain("Write report");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const milk = { id: 10, listId: 1, title: "Buy milk", completed: false, userId: 1 };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [milk] })
        .mockResolvedValueOnce({ data: [{ ...milk, completed: true }] });
      TodoServices.updateTodo.mockResolvedValue({ data: { ...milk, completed: true } });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await wrapper.find('[aria-label="View items for Groceries"]').trigger("click");
      await flushPromises();

      document.body.querySelector('[aria-label="Complete Buy milk"]').click();
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { completed: true });
    });

    it("User marks a completed todo as incomplete", async () => {
      const milk = { id: 10, listId: 1, title: "Buy milk", completed: true, userId: 1 };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [milk] })
        .mockResolvedValueOnce({ data: [{ ...milk, completed: false }] });
      TodoServices.updateTodo.mockResolvedValue({ data: { ...milk, completed: false } });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await wrapper.find('[aria-label="View items for Groceries"]').trigger("click");
      await flushPromises();

      document.body.querySelector('[aria-label="Complete Buy milk"]').click();
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { completed: false });
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const milk = { id: 10, listId: 1, title: "Buy milk", completed: false, userId: 1 };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [milk] })
        .mockResolvedValueOnce({ data: [{ ...milk, title: "Buy oat milk" }] });
      TodoServices.updateTodo.mockResolvedValue({ data: { ...milk, title: "Buy oat milk" } });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await wrapper.find('[aria-label="View items for Groceries"]').trigger("click");
      await flushPromises();

      document.body.querySelector('[aria-label="Edit todo"]').click();
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields.at(-1).setValue("Buy oat milk");
      [...document.body.querySelectorAll("button")]
        .filter((btn) => btn.textContent.trim() === "Save")
        .at(-1)
        .click();
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { title: "Buy oat milk" });
      expect(document.body.textContent).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const milk = { id: 10, listId: 1, title: "Buy milk", completed: false, userId: 1 };
      TodoServices.getTodos.mockResolvedValueOnce({ data: [milk] }).mockResolvedValueOnce({ data: [] });
      TodoServices.deleteTodo.mockResolvedValue({ status: 200 });

      const { wrapper } = await mountDashboard();
      await flushPromises();
      await wrapper.find('[aria-label="View items for Groceries"]').trigger("click");
      await flushPromises();

      document.body.querySelector('[aria-label="Delete todo"]').click();
      await flushPromises();

      [...document.body.querySelectorAll("button")]
        .filter((btn) => btn.textContent.trim() === "Delete")
        .at(-1)
        .click();
      await flushPromises();

      expect(TodoServices.deleteTodo).toHaveBeenCalledWith(10);
      expect(document.body.textContent).toContain("No todos in this list yet.");
    });
  });
});
