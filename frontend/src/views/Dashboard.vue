<script setup>
import { onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";

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

const nameRules = [(value) => !!value?.trim() || "List name is required."];

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
  </v-container>
</template>
