<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import UserServices from "../services/userServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const menuOpen = ref(false);
const editDialog = ref(false);
const editForm = ref(null);
const saving = ref(false);
const errorMessage = ref("");

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }
  return [user.value.fName, user.value.lName].filter(Boolean).join(" ");
});

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

const requiredTrim = (message) => (value) => !!value?.trim() || message;
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmRules = [(value) => value === password.value || "Passwords do not match."];

const openEdit = async () => {
  errorMessage.value = "";
  password.value = "";
  confirmPassword.value = "";
  menuOpen.value = false;

  try {
    const res = await UserServices.getUser(user.value.userId);
    fName.value = res.data.fName;
    lName.value = res.data.lName;
    email.value = res.data.email;
    username.value = res.data.username;
  } catch {
    fName.value = user.value.fName;
    lName.value = user.value.lName;
    email.value = user.value.email;
    username.value = user.value.username;
  }

  editDialog.value = true;
};

const cancelEdit = () => {
  editDialog.value = false;
};

const saveProfile = async () => {
  errorMessage.value = "";
  const { valid } = await editForm.value.validate();

  if (!valid) {
    return;
  }

  saving.value = true;

  try {
    const payload = {
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
    };

    if (password.value) {
      payload.password = password.value;
    }

    const res = await UserServices.updateUser(user.value.userId, payload);
    const stored = Utils.getStore("user") || {};
    Utils.setStore("user", {
      ...stored,
      ...res.data,
      userId: res.data.id,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    refreshUser();
    editDialog.value = false;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Unable to update profile.";
  } finally {
    saving.value = false;
  }
};

const logOut = async () => {
  try {
    await AuthServices.logoutUser();
  } catch {
    // Always clear the local session so the device cannot stay signed in.
  }

  Utils.removeItem("user");
  menuOpen.value = false;
  await router.push({ name: "login" });
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-spacer />
    <v-menu v-model="menuOpen" location="bottom end">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-account-circle"
          variant="text"
          aria-label="Open profile menu"
        />
      </template>
      <v-list min-width="240">
        <v-list-item :title="displayName" :subtitle="user?.username" />
        <v-list-item :subtitle="user?.email" />
        <v-list-item>
          <v-btn color="primary" variant="elevated" class="oc-cta" block @click="openEdit">
            Edit Profile
          </v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn variant="text" block @click="logOut">Log out</v-btn>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editDialog" max-width="520">
    <v-card class="pa-4">
      <v-card-title>Edit Profile</v-card-title>
      <v-card-text>
        <v-alert v-if="errorMessage" type="error" class="mb-4">{{ errorMessage }}</v-alert>
        <v-form ref="editForm" @submit.prevent="saveProfile">
          <v-text-field v-model="fName" label="First name" :rules="[requiredTrim('First name is required.')]" />
          <v-text-field v-model="lName" label="Last name" :rules="[requiredTrim('Last name is required.')]" />
          <v-text-field v-model="email" label="Email" :rules="emailRules" />
          <v-text-field v-model="username" label="Username" :rules="[requiredTrim('Username is required.')]" />
          <v-text-field
            v-model="password"
            label="New password"
            type="password"
            :rules="passwordRules"
            autocomplete="new-password"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            :rules="confirmRules"
            autocomplete="new-password"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="cancelEdit">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" class="oc-cta" :loading="saving" @click="saveProfile">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
