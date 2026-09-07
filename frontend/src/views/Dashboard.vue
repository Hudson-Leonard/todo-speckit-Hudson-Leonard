<script setup>
import { onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";
import TodoServices from "../services/todoServices.js";
import { formatDueDate, isTodoOverdue, optionalDueDateRules, toDateInputValue } from "../config/validation.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const addForm = ref(null);
const newName = ref("");

const editDialog = ref(false);
const editForm = ref(null);
const editName = ref("");
const editingList = ref(null);

const deleteDialog = ref(false);
const deletingList = ref(null);

const itemsDialog = ref(false);
const itemsList = ref(null);
const todos = ref([]);
const todosLoading = ref(false);
const todoError = ref("");

const addTodoDialog = ref(false);
const addTodoForm = ref(null);
const newTodoTitle = ref("");
const newTodoDueDate = ref("");

const editTodoDialog = ref(false);
const editTodoForm = ref(null);
const editTodoTitle = ref("");
const editTodoDueDate = ref("");
const editingTodo = ref(null);

const deleteTodoDialog = ref(false);
const deletingTodo = ref(null);

const nameRules = [(value) => !!value?.trim() || "List name is required."];
const titleRules = [(value) => !!value?.trim() || "Todo title is required."];
const dueDateRules = optionalDueDateRules;

const loadLists = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await ListServices.getLists();
    lists.value = res.data;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to load lists.";
  } finally {
    loading.value = false;
  }
};

const openAdd = () => {
  newName.value = "";
  errorMessage.value = "";
  addDialog.value = true;
};

const createList = async () => {
  const { valid } = await addForm.value.validate();

  if (!valid) {
    return;
  }

  try {
    await ListServices.createList({ name: newName.value.trim() });
    addDialog.value = false;
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to create list.";
  }
};

const openEdit = (list) => {
  editingList.value = list;
  editName.value = list.name;
  errorMessage.value = "";
  editDialog.value = true;
};

const saveList = async () => {
  const { valid } = await editForm.value.validate();

  if (!valid) {
    return;
  }

  try {
    await ListServices.updateList(editingList.value.id, { name: editName.value.trim() });
    editDialog.value = false;
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to rename list.";
  }
};

const openDelete = (list) => {
  deletingList.value = list;
  errorMessage.value = "";
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  try {
    await ListServices.deleteList(deletingList.value.id);
    deleteDialog.value = false;
    await loadLists();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to delete list.";
  }
};

const loadTodos = async () => {
  if (!itemsList.value) {
    return;
  }

  todosLoading.value = true;
  todoError.value = "";

  try {
    const res = await TodoServices.getTodos(itemsList.value.id);
    todos.value = res.data;
  } catch (err) {
    todoError.value = err.response?.data?.message || "Unable to load todos.";
  } finally {
    todosLoading.value = false;
  }
};

const openItems = async (list) => {
  itemsList.value = list;
  todos.value = [];
  todoError.value = "";
  itemsDialog.value = true;
  await loadTodos();
};

const closeItems = () => {
  itemsDialog.value = false;
  addTodoDialog.value = false;
  editTodoDialog.value = false;
  deleteTodoDialog.value = false;
};

const openAddTodo = () => {
  newTodoTitle.value = "";
  newTodoDueDate.value = "";
  todoError.value = "";
  addTodoDialog.value = true;
};

const createTodo = async () => {
  const { valid } = await addTodoForm.value.validate();

  if (!valid) {
    return;
  }

  try {
    const payload = { title: newTodoTitle.value.trim() };

    if (newTodoDueDate.value) {
      payload.dueDate = newTodoDueDate.value;
    }

    await TodoServices.createTodo(itemsList.value.id, payload);
    addTodoDialog.value = false;
    await loadTodos();
  } catch (err) {
    todoError.value = err.response?.data?.message || "Unable to add todo.";
  }
};

const toggleTodo = async (todo, completed) => {
  try {
    await TodoServices.updateTodo(todo.id, { completed });
    await loadTodos();
  } catch (err) {
    todoError.value = err.response?.data?.message || "Unable to update todo.";
  }
};

const openEditTodo = (todo) => {
  editingTodo.value = todo;
  editTodoTitle.value = todo.title;
  editTodoDueDate.value = toDateInputValue(todo.dueDate);
  todoError.value = "";
  editTodoDialog.value = true;
};

const saveTodo = async () => {
  const { valid } = await editTodoForm.value.validate();

  if (!valid) {
    return;
  }

  try {
    await TodoServices.updateTodo(editingTodo.value.id, {
      title: editTodoTitle.value.trim(),
      dueDate: editTodoDueDate.value || null,
    });
    editTodoDialog.value = false;
    await loadTodos();
  } catch (err) {
    todoError.value = err.response?.data?.message || "Unable to rename todo.";
  }
};

const openDeleteTodo = (todo) => {
  deletingTodo.value = todo;
  todoError.value = "";
  deleteTodoDialog.value = true;
};

const confirmDeleteTodo = async () => {
  try {
    await TodoServices.deleteTodo(deletingTodo.value.id);
    deleteTodoDialog.value = false;
    await loadTodos();
  } catch (err) {
    todoError.value = err.response?.data?.message || "Unable to delete todo.";
  }
};

onMounted(loadLists);
</script>

<template>
  <v-container class="py-8">
    <v-row align="center" class="mb-4">
      <v-col>
        <h1 class="text-h4">My Lists</h1>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAdd">+ New List</v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="errorMessage" type="error" class="mb-4">{{ errorMessage }}</v-alert>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <p v-else-if="lists.length === 0" class="text-body-1">No lists yet. Create your first list.</p>

    <v-list v-else>
      <v-list-item v-for="list in lists" :key="list.id" :title="list.name">
        <template #append>
          <v-btn
            icon="mdi-format-list-bulleted"
            size="small"
            variant="text"
            :aria-label="`View items for ${list.name}`"
            @click="openItems(list)"
          />
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            aria-label="Edit list"
            @click="openEdit(list)"
          />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            aria-label="Delete list"
            @click="openDelete(list)"
          />
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="addDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title>New list</v-card-title>
        <v-card-text>
          <v-form ref="addForm" @submit.prevent="createList">
            <v-text-field v-model="newName" label="List name" :rules="nameRules" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="createList">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title>Rename list</v-card-title>
        <v-card-text>
          <v-form ref="editForm" @submit.prevent="saveList">
            <v-text-field v-model="editName" label="List name" :rules="nameRules" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="saveList">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title>Delete list</v-card-title>
        <v-card-text>Delete “{{ deletingList?.name }}”? This cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="itemsDialog" max-width="640">
      <v-card class="pa-4">
        <v-card-title>{{ itemsList?.name }} — Items</v-card-title>
        <v-card-text>
          <v-alert v-if="todoError" type="error" class="mb-4">{{ todoError }}</v-alert>
          <v-progress-linear v-if="todosLoading" indeterminate class="mb-4" />
          <p v-else-if="todos.length === 0" class="text-body-1">No todos in this list yet.</p>
          <v-list v-else>
            <v-list-item v-for="todo in todos" :key="todo.id">
              <template #prepend>
                <v-checkbox
                  :model-value="todo.completed"
                  hide-details
                  :aria-label="`Complete ${todo.title}`"
                  @update:model-value="(value) => toggleTodo(todo, value)"
                />
              </template>
              <v-list-item-title :class="{ 'text-decoration-line-through text-medium-emphasis': todo.completed }">
                {{ todo.title }}
              </v-list-item-title>
              <v-list-item-subtitle v-if="todo.dueDate">
                <span :class="{ 'text-error': isTodoOverdue(todo) }">
                  Due {{ formatDueDate(todo.dueDate) }}
                </span>
              </v-list-item-subtitle>
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  aria-label="Edit todo"
                  @click="openEditTodo(todo)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  aria-label="Delete todo"
                  @click="openDeleteTodo(todo)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAddTodo">+ Add Item</v-btn>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeItems">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addTodoDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title>Add item</v-card-title>
        <v-card-text>
          <v-form ref="addTodoForm" @submit.prevent="createTodo">
            <v-text-field v-model="newTodoTitle" label="Todo title" :rules="titleRules" />
            <v-text-field
              v-model="newTodoDueDate"
              label="Due date"
              type="date"
              :rules="dueDateRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addTodoDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="createTodo">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editTodoDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title>Edit item</v-card-title>
        <v-card-text>
          <v-form ref="editTodoForm" @submit.prevent="saveTodo">
            <v-text-field v-model="editTodoTitle" label="Todo title" :rules="titleRules" />
            <v-text-field
              v-model="editTodoDueDate"
              label="Due date"
              type="date"
              :rules="dueDateRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editTodoDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="saveTodo">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteTodoDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title>Delete item</v-card-title>
        <v-card-text>Delete “{{ deletingTodo?.title }}”?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteTodoDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="confirmDeleteTodo">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
