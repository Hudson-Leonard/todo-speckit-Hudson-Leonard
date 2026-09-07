<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = computed(() => Utils.getStore("user"));
const displayName = computed(() => {
  if (!user.value) {
    return "";
  }
  return [user.value.fName, user.value.lName].filter(Boolean).join(" ");
});

const signOut = async () => {
  try {
    await AuthServices.logoutUser();
  } catch {
    // Always clear the local session so the device cannot stay signed in.
  }

  Utils.removeItem("user");
  await router.push({ name: "login" });
};
</script>

<template>
  <v-app-bar color="primary" density="comfortable">
    <v-app-bar-title>{{ displayName }}</v-app-bar-title>
    <v-spacer />
    <v-btn variant="text" class="oc-cta" @click="signOut">Sign out</v-btn>
  </v-app-bar>
</template>
